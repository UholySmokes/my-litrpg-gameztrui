import { getAuthToken, getDevAuthHeaders } from "./AuthService.js";
import { computeSaveStateHash } from "./saveVersioning.js";
import {
  resolveAllowExternalApiBaseUrl,
  resolveAllowedApiHosts,
  resolveApiBaseCandidates,
  sanitizeEndpoint,
} from "./apiEndpointResolution.js";
import {
  buildTraceHeaders,
  createRequestTraceContext,
} from "../observability/requestTrace.js";

const DEFAULT_TIMEOUT_MS = 10000;

const getBuildEnv = () =>
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

const getRuntimeEnv = () => {
  if (typeof globalThis === "undefined") return {};
  const runtimeConfig = globalThis.__RUNTIME_CONFIG__;
  return runtimeConfig && typeof runtimeConfig === "object"
    ? runtimeConfig
    : {};
};

const pickEnvValue = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
};

const normalizeBaseUrl = (value) => value.replace(/\/+$/g, "");

const resolveSaveEndpoints = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const allowExternal = resolveAllowExternalApiBaseUrl({ runtimeEnv, buildEnv });
  const allowedHosts = resolveAllowedApiHosts({ runtimeEnv, buildEnv });
  const explicit = sanitizeEndpoint(
    pickEnvValue(
      runtimeEnv.VITE_SAVES_ENDPOINT,
      buildEnv.VITE_SAVES_ENDPOINT,
      runtimeEnv.VITE_CLOUD_SAVES_ENDPOINT,
      buildEnv.VITE_CLOUD_SAVES_ENDPOINT,
    ),
    { allowExternal, allowedHosts },
  );

  const baseCandidates = resolveApiBaseCandidates({
    runtimeEnv,
    buildEnv,
    allowExternal,
    allowedHosts,
    pickEnvValue,
  });
  const derived = baseCandidates.map(
    (base) => `${normalizeBaseUrl(base)}/api/saves`,
  );

  return [...new Set([explicit, ...derived, "/api/saves"].filter(Boolean))];
};

const resolveTimeoutMs = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const value = pickEnvValue(
    runtimeEnv.VITE_SAVES_TIMEOUT_MS,
    buildEnv.VITE_SAVES_TIMEOUT_MS,
  );
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
};

const isDisabledFlag = (value) =>
  typeof value === "string" &&
  ["1", "true", "yes"].includes(value.trim().toLowerCase());

export function isCloudSaveConfigured() {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const disabled = pickEnvValue(
    runtimeEnv.VITE_CLOUD_SAVES_DISABLED,
    buildEnv.VITE_CLOUD_SAVES_DISABLED,
  );
  return !isDisabledFlag(disabled);
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requestJson(path, { method, body } = {}) {
  const endpoints = resolveSaveEndpoints();
  const timeoutMs = resolveTimeoutMs();
  const token = await getAuthToken();
  const trace = createRequestTraceContext();
  const headers = {
    "Content-Type": "application/json",
    ...getDevAuthHeaders(),
    ...buildTraceHeaders(trace),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const normalizedPath = path ? `/${String(path).replace(/^\/+/, "")}` : "";
  let lastError = null;

  for (const base of endpoints) {
    const url = `${normalizeBaseUrl(base)}${normalizedPath}`;
    try {
      const response = await fetchWithTimeout(
        url,
        {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        },
        timeoutMs,
      );
      const data = await response.json().catch(() => null);
      if (!response.ok && (response.status === 404 || response.status === 405)) {
        lastError = new Error("Endpoint not found");
        continue;
      }
      return { response, data, trace };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Cloud save endpoint unavailable.");
}

const buildError = (data, fallback, status) => {
  if (status === 401) return "Sign in required.";
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }
  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error;
  }
  return fallback;
};

const buildFailure = (data, fallback, status, extras = {}) => ({
  success: false,
  error: buildError(data, fallback, status),
  errorCode:
    typeof data?.errorCode === "string" && data.errorCode.trim()
      ? data.errorCode
      : null,
  status,
  ...extras,
});

export async function saveGameState(_userId, gameState, saveName = "Auto Save") {
  try {
    const stateHash = computeSaveStateHash(gameState);
    const { response, data } = await requestJson("", {
      method: "POST",
      body: { saveName, gameState, stateHash },
    });

    if (!response.ok || data?.ok === false) {
      return buildFailure(
        data,
        "Failed to save game state.",
        response.status,
      );
    }

    return {
      success: true,
      saveId: data?.save?.id,
      stateHash: data?.save?.state_hash || stateHash,
      data: data?.save,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to save game state.",
      errorCode: null,
      status: null,
    };
  }
}

export async function updateGameState(
  _userId,
  saveId,
  gameState,
  saveName,
  { expectedStateHash } = {},
) {
  try {
    const stateHash = computeSaveStateHash(gameState);
    const { response, data } = await requestJson(saveId, {
      method: "PUT",
      body: { saveName, gameState, stateHash, expectedStateHash },
    });

    if (!response.ok || data?.ok === false) {
      return buildFailure(
        data,
        "Failed to update game state.",
        response.status,
        {
          conflict: data?.conflict || null,
        },
      );
    }

    return {
      success: true,
      stateHash: data?.save?.state_hash || stateHash,
      data: data?.save,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to update game state.",
      errorCode: null,
      status: null,
    };
  }
}

export async function loadGameState(_userId, saveId) {
  try {
    const { response, data } = await requestJson(saveId, {
      method: "GET",
    });

    if (!response.ok || data?.ok === false) {
      return buildFailure(
        data,
        "Failed to load game state.",
        response.status,
      );
    }

    return {
      success: true,
      gameState: data?.save?.game_state,
      stateHash: data?.save?.state_hash || null,
      saveName: data?.save?.save_name,
      createdAt: data?.save?.created_at,
      updatedAt: data?.save?.updated_at,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to load game state.",
      errorCode: null,
      status: null,
    };
  }
}

export async function listSaves() {
  try {
    const { response, data } = await requestJson("", {
      method: "GET",
    });

    if (!response.ok || data?.ok === false) {
      return buildFailure(
        data,
        "Failed to list saves.",
        response.status,
        { saves: [] },
      );
    }

    return {
      success: true,
      saves: Array.isArray(data?.saves)
        ? data.saves.map((entry) => ({
            ...entry,
            state_hash: entry?.state_hash || null,
          }))
        : [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to list saves.",
      errorCode: null,
      status: null,
      saves: [],
    };
  }
}

export async function deleteSave(_userId, saveId) {
  try {
    const { response, data } = await requestJson(saveId, {
      method: "DELETE",
    });

    if (!response.ok || data?.ok === false) {
      return buildFailure(
        data,
        "Failed to delete save.",
        response.status,
      );
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to delete save.",
      errorCode: null,
      status: null,
    };
  }
}

export async function resetLegacyProgress() {
  try {
    const { response, data } = await requestJson("reset-legacy", {
      method: "POST",
    });

    if (!response.ok || data?.ok === false) {
      return buildFailure(
        data,
        "Failed to reset legacy progress.",
        response.status,
      );
    }

    return {
      success: true,
      migrationVersion: data?.migrationVersion ?? null,
      deletedSaveCount: data?.deletedSaveCount ?? 0,
      deletedRunCount: data?.deletedRunCount ?? 0,
      deletedEventCount: data?.deletedEventCount ?? 0,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to reset legacy progress.",
      errorCode: null,
      status: null,
    };
  }
}
