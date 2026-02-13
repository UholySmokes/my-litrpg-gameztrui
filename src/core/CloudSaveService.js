import { getAuthToken, getDevAuthHeaders } from "./AuthService.js";

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
  const explicit = pickEnvValue(
    runtimeEnv.VITE_SAVES_ENDPOINT,
    buildEnv.VITE_SAVES_ENDPOINT,
    runtimeEnv.VITE_CLOUD_SAVES_ENDPOINT,
    buildEnv.VITE_CLOUD_SAVES_ENDPOINT,
  );
  const apiBaseUrl = pickEnvValue(
    runtimeEnv.VITE_API_BASE_URL,
    buildEnv.VITE_API_BASE_URL,
    runtimeEnv.VITE_API_BASE,
    buildEnv.VITE_API_BASE,
  );
  const derived = apiBaseUrl
    ? `${normalizeBaseUrl(apiBaseUrl)}/api/saves`
    : undefined;
  return [explicit, derived, "/api/saves"].filter(Boolean);
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
      credentials: "include",
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requestJson(path, { method, body } = {}) {
  const endpoints = resolveSaveEndpoints();
  const timeoutMs = resolveTimeoutMs();
  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...getDevAuthHeaders(),
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
      return { response, data };
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

export async function saveGameState(_userId, gameState, saveName = "Auto Save") {
  try {
    const { response, data } = await requestJson("", {
      method: "POST",
      body: { saveName, gameState },
    });

    if (!response.ok || data?.ok === false) {
      return {
        success: false,
        error: buildError(data, "Failed to save game state.", response.status),
      };
    }

    return {
      success: true,
      saveId: data?.save?.id,
      data: data?.save,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to save game state.",
    };
  }
}

export async function updateGameState(_userId, saveId, gameState, saveName) {
  try {
    const { response, data } = await requestJson(saveId, {
      method: "PUT",
      body: { saveName, gameState },
    });

    if (!response.ok || data?.ok === false) {
      return {
        success: false,
        error: buildError(
          data,
          "Failed to update game state.",
          response.status,
        ),
      };
    }

    return {
      success: true,
      data: data?.save,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to update game state.",
    };
  }
}

export async function loadGameState(_userId, saveId) {
  try {
    const { response, data } = await requestJson(saveId, {
      method: "GET",
    });

    if (!response.ok || data?.ok === false) {
      return {
        success: false,
        error: buildError(data, "Failed to load game state.", response.status),
      };
    }

    return {
      success: true,
      gameState: data?.save?.game_state,
      saveName: data?.save?.save_name,
      createdAt: data?.save?.created_at,
      updatedAt: data?.save?.updated_at,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to load game state.",
    };
  }
}

export async function listSaves(_userId) {
  try {
    const { response, data } = await requestJson("", {
      method: "GET",
    });

    if (!response.ok || data?.ok === false) {
      return {
        success: false,
        error: buildError(data, "Failed to list saves.", response.status),
        saves: [],
      };
    }

    return {
      success: true,
      saves: Array.isArray(data?.saves) ? data.saves : [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to list saves.",
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
      return {
        success: false,
        error: buildError(data, "Failed to delete save.", response.status),
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to delete save.",
    };
  }
}
