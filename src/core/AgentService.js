import { getAuthToken, getDevAuthHeaders } from "./AuthService.js";
import {
  resolveAllowExternalApiBaseUrl,
  resolveAllowedApiHosts,
  resolveApiBaseCandidates,
  sanitizeEndpoint,
} from "./apiEndpointResolution.js";

const DEFAULT_TIMEOUT_MS = 15000;

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

const resolveAgentEndpoints = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const allowExternal = resolveAllowExternalApiBaseUrl({ runtimeEnv, buildEnv });
  const allowedHosts = resolveAllowedApiHosts({ runtimeEnv, buildEnv });

  const baseCandidates = resolveApiBaseCandidates({
    runtimeEnv,
    buildEnv,
    allowExternal,
    allowedHosts,
    pickEnvValue,
  });
  const derivedBases = baseCandidates.map(
    (base) => `${normalizeBaseUrl(base)}/api/agents`,
  );

  const explicitList = sanitizeEndpoint(
    pickEnvValue(
      runtimeEnv.VITE_AGENT_LIST_ENDPOINT,
      buildEnv.VITE_AGENT_LIST_ENDPOINT,
    ),
    { allowExternal, allowedHosts },
  );
  const explicitRun = sanitizeEndpoint(
    pickEnvValue(
      runtimeEnv.VITE_AGENT_RUN_ENDPOINT,
      buildEnv.VITE_AGENT_RUN_ENDPOINT,
    ),
    { allowExternal, allowedHosts },
  );

  const listEndpoints = [
    explicitList,
    ...derivedBases,
    "/api/agents",
  ].filter(Boolean);
  const runEndpoints = [
    explicitRun,
    ...derivedBases.map((base) => `${normalizeBaseUrl(base)}/run`),
    "/api/agents/run",
  ].filter(Boolean);

  return {
    listEndpoints: [...new Set(listEndpoints)],
    runEndpoints: [...new Set(runEndpoints)],
  };
};

const resolveTimeoutMs = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const value = pickEnvValue(
    runtimeEnv.VITE_AGENT_TIMEOUT_MS,
    buildEnv.VITE_AGENT_TIMEOUT_MS,
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
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

const extractErrorMessage = (data, fallback, status) => {
  if (status === 401 || status === 403) {
    return "Sign in required for agent execution.";
  }
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }
  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error;
  }
  return fallback;
};

async function requestAgentJson(endpoints, { method, body } = {}) {
  const timeoutMs = resolveTimeoutMs();
  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...getDevAuthHeaders(),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const response = await fetchWithTimeout(
        endpoint,
        {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        },
        timeoutMs,
      );
      const data = await response.json().catch(() => null);
      if (!response.ok && (response.status === 404 || response.status === 405)) {
        lastError = new Error("Agent endpoint unavailable.");
        continue;
      }
      return { response, data };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Agent endpoint unavailable.");
}

export async function listAgents() {
  const { listEndpoints } = resolveAgentEndpoints();
  try {
    const { response, data } = await requestAgentJson(listEndpoints, {
      method: "GET",
    });

    if (!response.ok || data?.ok === false) {
      return {
        success: false,
        error: extractErrorMessage(
          data,
          "Failed to fetch available agents.",
          response.status,
        ),
        agents: [],
      };
    }

    const agents = Array.isArray(data?.agents) ? data.agents : [];
    return {
      success: true,
      agents,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error?.message || "Failed to fetch available agents.",
      agents: [],
    };
  }
}

export async function runAgent(payload) {
  const { runEndpoints } = resolveAgentEndpoints();
  try {
    const { response, data } = await requestAgentJson(runEndpoints, {
      method: "POST",
      body: payload,
    });

    if (!response.ok || data?.ok === false) {
      return {
        success: false,
        error: extractErrorMessage(
          data,
          "Failed to run agent.",
          response.status,
        ),
        data,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error?.message || "Failed to run agent.",
      data: null,
    };
  }
}

export const __testing = {
  resolveAgentEndpoints,
};

