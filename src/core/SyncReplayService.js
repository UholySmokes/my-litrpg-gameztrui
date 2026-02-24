import { getAuthToken, getDevAuthHeaders } from "./AuthService.js";

const DEFAULT_TIMEOUT_MS = 10000;

const getBuildEnv = () =>
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

const getRuntimeEnv = () => {
  if (typeof globalThis === "undefined") return {};
  const runtimeConfig = globalThis.__RUNTIME_CONFIG__;
  return runtimeConfig && typeof runtimeConfig === "object" ? runtimeConfig : {};
};

const pickEnvValue = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
};

const normalizeBaseUrl = (value) => value.replace(/\/+$/g, "");
const isExternalUrl = (value) =>
  /^[a-z][a-z0-9+.-]*:\/\//i.test(value) || value.startsWith("//");
const sanitizeEndpointPath = (value) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return undefined;
  if (isExternalUrl(trimmed)) return undefined;
  return trimmed;
};

const resolveReplayEndpoints = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const explicit = sanitizeEndpointPath(
    pickEnvValue(
      runtimeEnv.VITE_SYNC_REPLAY_ENDPOINT,
      buildEnv.VITE_SYNC_REPLAY_ENDPOINT,
      runtimeEnv.VITE_REPLAY_ENDPOINT,
      buildEnv.VITE_REPLAY_ENDPOINT,
    ),
  );
  const apiBaseUrl = sanitizeEndpointPath(
    pickEnvValue(
      runtimeEnv.VITE_API_BASE_URL,
      buildEnv.VITE_API_BASE_URL,
      runtimeEnv.VITE_API_BASE,
      buildEnv.VITE_API_BASE,
    ),
  );
  const derived = apiBaseUrl
    ? `${normalizeBaseUrl(apiBaseUrl)}/api/sync/replay`
    : undefined;
  return [explicit, derived, "/api/sync/replay"]
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index);
};

const resolveTimeoutMs = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const value = pickEnvValue(
    runtimeEnv.VITE_SYNC_REPLAY_TIMEOUT_MS,
    buildEnv.VITE_SYNC_REPLAY_TIMEOUT_MS,
  );
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
};

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

function buildReplayQuery({ runId, afterSeq, limit, includeRejected }) {
  const params = new URLSearchParams();
  params.set("runId", String(runId || "").trim());
  if (Number.isFinite(Number(afterSeq)) && Number(afterSeq) >= 0) {
    params.set("afterSeq", String(Math.floor(Number(afterSeq))));
  }
  if (Number.isFinite(Number(limit)) && Number(limit) > 0) {
    params.set("limit", String(Math.floor(Number(limit))));
  }
  if (includeRejected) {
    params.set("includeRejected", "true");
  }
  return params.toString();
}

const buildError = (data, fallback, status) => {
  if (status === 401) return "Sign in required.";
  if (status === 404) return "Run not found.";
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }
  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error;
  }
  return fallback;
};

export async function fetchSyncReplay({
  runId,
  afterSeq = 0,
  limit = 200,
  includeRejected = false,
} = {}) {
  const normalizedRunId = String(runId || "").trim();
  if (!normalizedRunId) {
    return {
      success: false,
      error: "runId is required.",
      data: null,
    };
  }

  const endpoints = resolveReplayEndpoints();
  const timeoutMs = resolveTimeoutMs();
  const query = buildReplayQuery({
    runId: normalizedRunId,
    afterSeq,
    limit,
    includeRejected,
  });
  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...getDevAuthHeaders(),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let lastError = null;
  for (const base of endpoints) {
    const url = `${normalizeBaseUrl(base)}?${query}`;
    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: "GET",
          headers,
        },
        timeoutMs,
      );
      const data = await response.json().catch(() => null);
      if (!response.ok && (response.status === 404 || response.status === 405)) {
        lastError = new Error(buildError(data, "Replay endpoint unavailable.", response.status));
        continue;
      }
      if (!response.ok || data?.ok === false) {
        return {
          success: false,
          error: buildError(data, "Failed to fetch replay timeline.", response.status),
          data,
        };
      }
      return {
        success: true,
        data,
      };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    success: false,
    error: lastError?.message || "Replay endpoint unavailable.",
    data: null,
  };
}

export const __testing = {
  resolveReplayEndpoints,
  buildReplayQuery,
};
