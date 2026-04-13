import { getAuthToken, getDevAuthHeaders } from "./AuthService.js";
import { normalizeNarrationPayload } from "./narrationContract.js";
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

const DEFAULT_TIMEOUT_MS = 135000;
const DEV_DEFAULT_TIMEOUT_MS = 150000;
const STREAM_POLL_INTERVAL_MS = 1500;
const STREAM_STALL_TIMEOUT_MS = 60000;
const STREAM_MAX_POLLS = 200;
const NARRATOR_UNAVAILABLE_COOLDOWN_MS = 10000;
const NARRATOR_LOCAL_FALLBACK_CODES = new Set([
  "NARRATOR_ENDPOINT_MISSING",
  "NARRATOR_SERVICE_UNREACHABLE",
  "NARRATOR_UNAVAILABLE_COOLDOWN",
]);
const ABSOLUTE_URL_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;
const LOCAL_NARRATOR_UNREACHABLE_MESSAGE =
  "Narrator service unreachable. Start local API with `npm run dev:api` (or `npm run dev:stack`) and retry.";
const REMOTE_NARRATOR_UNREACHABLE_MESSAGE =
  "Narrator service temporarily unavailable. Please retry in a moment.";

const getBuildEnv = () =>
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

const getRuntimeEnv = () => {
  if (typeof globalThis === "undefined") return {};
  const runtimeConfig = globalThis["__RUNTIME_CONFIG__"];
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

const unique = (values) => {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
};

const createNarratorAvailabilityState = () => ({
  signature: "",
  code: "",
  message: "",
  until: 0,
});

let narratorAvailabilityState = createNarratorAvailabilityState();

const resolveNarrateEndpoints = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const allowExternal = resolveAllowExternalApiBaseUrl({ runtimeEnv, buildEnv });
  const allowedHosts = resolveAllowedApiHosts({ runtimeEnv, buildEnv });
  const narrateEndpoint = sanitizeEndpoint(
    pickEnvValue(
      runtimeEnv["VITE_NARRATE_ENDPOINT"],
      buildEnv["VITE_NARRATE_ENDPOINT"],
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
    (base) => `${normalizeBaseUrl(base)}/api/narrate`,
  );
  if (!narrateEndpoint && baseCandidates.length === 0 && isLocalDevRuntime()) {
    return [];
  }
  return unique([narrateEndpoint, ...derived, "/api/narrate"]);
};

const resolveStreamEndpointCandidates = () => {
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

  if (baseCandidates.length === 0 && isLocalDevRuntime()) {
    return [];
  }

  const bases = baseCandidates.length > 0 ? baseCandidates : [""];
  const pairs = bases.map((base) => {
    const normalized = normalizeBaseUrl(base || "");
    return {
      start: normalized ? `${normalized}/api/narrate-start` : "/api/narrate-start",
      poll: normalized ? `${normalized}/api/narrate-poll` : "/api/narrate-poll",
    };
  });

  return unique(pairs.map((pair) => JSON.stringify(pair))).map((key) =>
    JSON.parse(key),
  );
};

const buildNarratorAvailabilitySignature = () => {
  const stream = resolveStreamEndpointCandidates();
  return JSON.stringify({
    narrate: resolveNarrateEndpoints(),
    stream,
  });
};

const resetNarratorAvailabilityState = () => {
  narratorAvailabilityState = createNarratorAvailabilityState();
};

const getActiveNarratorAvailabilityState = () => {
  const signature = buildNarratorAvailabilitySignature();
  if (
    !narratorAvailabilityState.signature ||
    narratorAvailabilityState.signature !== signature ||
    narratorAvailabilityState.until <= Date.now()
  ) {
    if (narratorAvailabilityState.signature) {
      resetNarratorAvailabilityState();
    }
    return null;
  }
  return narratorAvailabilityState;
};

const markNarratorUnavailable = (code, message) => {
  narratorAvailabilityState = {
    signature: buildNarratorAvailabilitySignature(),
    code: String(code || "").trim(),
    message: String(message || "").trim(),
    until: Date.now() + NARRATOR_UNAVAILABLE_COOLDOWN_MS,
  };
};

const createNarratorCooldownError = () => {
  const activeState = getActiveNarratorAvailabilityState();
  if (!activeState) return null;
  const error = new Error(
    activeState.message || "Narrator service temporarily unavailable.",
  );
  error.code = "NARRATOR_UNAVAILABLE_COOLDOWN";
  error.causeCode = activeState.code || undefined;
  error.retryAfterMs = Math.max(0, activeState.until - Date.now());
  error.silent = true;
  return error;
};

const getCurrentOrigin = () => {
  const origin =
    globalThis?.location?.origin ||
    globalThis?.window?.location?.origin ||
    "";
  return typeof origin === "string" ? origin.trim() : "";
};

const isExternalNarrateEndpoint = (endpoint) => {
  if (typeof endpoint !== "string" || !ABSOLUTE_URL_PATTERN.test(endpoint)) {
    return false;
  }

  const currentOrigin = getCurrentOrigin();
  if (!currentOrigin) return true;

  try {
    return new URL(endpoint).origin !== currentOrigin;
  } catch {
    return true;
  }
};

const isNetworkErrorLike = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return Boolean(
    error?.name === "TypeError" ||
      message.includes("failed to fetch") ||
      message.includes("network") ||
      message.includes("load failed") ||
      message.includes("connection error") ||
      message.includes("fetch"),
  );
};

const shouldTreatEndpointResponseAsUnavailable = ({
  endpoint,
  status,
  rawText,
}) =>
  Boolean(
    isLocalDevNarratorProxyFailure({ endpoint, status, rawText }) ||
      (isExternalNarrateEndpoint(endpoint) && Number(status) >= 500),
  );

const shouldTreatEndpointErrorAsUnavailable = ({ endpoint, error }) =>
  Boolean(
    isExternalNarrateEndpoint(endpoint) &&
      error?.name !== "AbortError" &&
      isNetworkErrorLike(error),
  );

const createNarratorServiceUnreachableError = (endpoint) => {
  const message =
    isLocalDevRuntime() && isSameOriginNarrateEndpoint(endpoint)
      ? LOCAL_NARRATOR_UNREACHABLE_MESSAGE
      : REMOTE_NARRATOR_UNREACHABLE_MESSAGE;
  const error = new Error(message);
  error.code = "NARRATOR_SERVICE_UNREACHABLE";
  error.endpoint = endpoint;
  return error;
};

const isSameOriginNarrateEndpoint = (endpoint) =>
  typeof endpoint === "string" && endpoint.startsWith("/api/");

const isLocalDevRuntime = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const hostnames = [
    globalThis?.location?.hostname,
    globalThis?.window?.location?.hostname,
  ].filter(Boolean);
  return Boolean(
    buildEnv.DEV ||
      runtimeEnv?.NODE_ENV === "development" ||
      runtimeEnv?.MODE === "development" ||
      hostnames.some((hostname) => hostname === "127.0.0.1" || hostname === "localhost"),
  );
};

const isLocalDevNarratorProxyFailure = ({
  endpoint,
  status,
  rawText,
}) =>
  Boolean(
    isLocalDevRuntime() &&
      isSameOriginNarrateEndpoint(endpoint) &&
      Number(status) >= 500 &&
      !String(rawText || "").trim(),
  );

export function shouldUseNarrativeLocalFallback(error) {
  const code = String(error?.code || "").trim();
  const causeCode = String(error?.causeCode || "").trim();
  return (
    NARRATOR_LOCAL_FALLBACK_CODES.has(code) ||
    NARRATOR_LOCAL_FALLBACK_CODES.has(causeCode)
  );
}

export function __resetNarratorAvailabilityStateForTests() {
  resetNarratorAvailabilityState();
}

const resolveRequestTimeoutMs = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const isDev = Boolean(buildEnv.DEV);
  const value = pickEnvValue(
    runtimeEnv["VITE_NARRATE_TIMEOUT_MS"],
    buildEnv["VITE_NARRATE_TIMEOUT_MS"],
  );
  if (!value) {
    return isDev ? DEV_DEFAULT_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : (isDev ? DEV_DEFAULT_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);
};

const MAX_NARRATIVE_LENGTH = 1200;
const MAX_RETRIES = 2;
const RETRY_STATUS = new Set([408, 429, 500, 502, 503, 504]);
export const NARRATION_GUARD_FALLBACK =
  "The story presses onward, waiting for your next move.";
const TONE_BLOCKLIST = [
  /as an ai/i,
  /language model/i,
  /i cannot/i,
  /i can't/i,
  /unable to/i,
];

function stripToneViolations(text) {
  const sentences = String(text || "").match(/[^.!?]+[.!?]*/g) || [];
  const kept = sentences.filter(
    (sentence) => !TONE_BLOCKLIST.some((pattern) => pattern.test(sentence)),
  );
  return kept.join(" ").replace(/\s+/g, " ").trim();
}

function stripMarkdownFormatting(text) {
  return String(text || "")
    .replace(/`{1,3}([^`]+?)`{1,3}/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^\s{0,3}(?:#{1,6}|[-*+]|\d+\.)\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function buildApiHeaders(baseHeaders = {}) {
  const trace = createRequestTraceContext();
  const headers = {
    ...baseHeaders,
    ...getDevAuthHeaders(),
    ...buildTraceHeaders(trace),
  };
  const token = await getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return { headers, trace };
}

const hasHeader = (headers, name) =>
  Object.keys(headers || {}).some(
    (key) => key.toLowerCase() === String(name || "").toLowerCase(),
  );

const omitHeaders = (headers, names = []) => {
  const denied = new Set((names || []).map((name) => String(name).toLowerCase()));
  return Object.fromEntries(
    Object.entries(headers || {}).filter(
      ([key]) => !denied.has(String(key).toLowerCase()),
    ),
  );
};

async function buildApiHeaderVariants(baseHeaders = {}) {
  const { headers: primary } = await buildApiHeaders(baseHeaders);
  const variants = [primary];
  const hasDevHeader = hasHeader(primary, "x-dev-user-id");
  const hasAuthHeader = hasHeader(primary, "authorization");

  if (hasDevHeader) {
    variants.push(omitHeaders(primary, ["x-dev-user-id", "x-dev-user-email"]));
  }

  if (hasAuthHeader) {
    variants.push(omitHeaders(primary, ["authorization"]));
  }

  if (hasDevHeader && hasAuthHeader) {
    variants.push(
      omitHeaders(primary, [
        "x-dev-user-id",
        "x-dev-user-email",
        "authorization",
      ]),
    );
  }

  return unique(variants.map((value) => JSON.stringify(value))).map((key) =>
    JSON.parse(key),
  );
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchJsonWithRetry(url, options, timeoutMs) {
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);
      const clone = response.clone();
      const data = await response.json().catch(() => null);
      const rawText = await clone.text().catch(() => "");

      if (RETRY_STATUS.has(response.status) && attempt < MAX_RETRIES) {
        if (
          shouldTreatEndpointResponseAsUnavailable({
            endpoint: url,
            status: response.status,
            rawText,
          })
        ) {
          return { response, data, rawText };
        }
        const errorCode = data?.errorCode;
        if (
          response.status === 504 &&
          (errorCode === "RUN_TIMEOUT" ||
            errorCode === "UPSTREAM_TIMEOUT")
        ) {
          return { response, data, rawText };
        }
        if (response.status === 502 && errorCode === "RUN_REQUIRES_ACTION") {
          return { response, data, rawText };
        }
        await delay(300 * (attempt + 1) ** 2);
        continue;
      }

      return { response, data, rawText };
    } catch (error) {
      lastError = error;

      if (error?.name === "AbortError") {
        throw error;
      }

      if (shouldTreatEndpointErrorAsUnavailable({ endpoint: url, error })) {
        throw error;
      }

      if (attempt < MAX_RETRIES) {
        await delay(300 * (attempt + 1) ** 2);
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error("Narrator service unavailable.");
}

export function applyNarrationGuards(response) {
  const storyRaw =
    response && typeof response.story === "string"
      ? response.story
      : response && typeof response.narrative === "string"
        ? response.narrative
        : "";
  let story = storyRaw.trim();
  if (!story) {
    return {
      ...response,
      story: NARRATION_GUARD_FALLBACK,
      narrative: NARRATION_GUARD_FALLBACK,
    };
  }

  story = stripToneViolations(story);
  story = stripMarkdownFormatting(story);
  if (!story) {
    return {
      ...response,
      story: NARRATION_GUARD_FALLBACK,
      narrative: NARRATION_GUARD_FALLBACK,
    };
  }

  if (story.length > MAX_NARRATIVE_LENGTH) {
    story = story.slice(0, MAX_NARRATIVE_LENGTH).trim();
  }

  return { ...response, story, narrative: story };
}

/**
 * Calls narrative API to generate response
 * @param {string} prompt - The complete prompt string
 * @returns {Promise<object>} The parsed JSON response with story, mood, and suggestions
 */
export async function generateNarrative(
  prompt,
  { mode, npcContext, reactionContext } = {},
) {
  const cooldownError = createNarratorCooldownError();
  if (cooldownError) throw cooldownError;

  let lastError = null;
  let attemptedEndpoints = 0;
  let missingEndpointCount = 0;
  const attemptedUrls = [];
  const apiEndpoints = resolveNarrateEndpoints();
  const timeoutMs = resolveRequestTimeoutMs();
  const isDev = Boolean(getBuildEnv().DEV);
  const headerVariants = await buildApiHeaderVariants({
    "Content-Type": "application/json",
  });

  if (apiEndpoints.length === 0) {
    const error = new Error(
      "No narrator endpoints configured. Set VITE_NARRATE_ENDPOINT, VITE_API_BASE_URL, or deploy /api/narrate.",
    );
    error.code = "NARRATOR_ENDPOINT_MISSING";
    throw error;
  }

  for (const endpoint of apiEndpoints) {
    attemptedEndpoints += 1;
    attemptedUrls.push(endpoint);
    let endpointMissing = false;
    let endpointUnavailable = false;
    for (let i = 0; i < headerVariants.length; i += 1) {
      const headers = headerVariants[i];
      try {
        const { response, data, rawText } = await fetchJsonWithRetry(
          endpoint,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ prompt, mode, npcContext, reactionContext }),
          },
          timeoutMs,
        );
        if (isDev) {
          console.info("Narrator endpoint response:", {
            endpoint,
            status: response.status,
            authVariant: i + 1,
          });
        }
        if (!response.ok) {
          if (response.status === 404 || response.status === 405) {
            endpointMissing = true;
            break;
          }

          if (
            (response.status === 401 || response.status === 403) &&
            i < headerVariants.length - 1
          ) {
            continue;
          }

          if (response.status === 401 || response.status === 403) {
            throw new Error(
              "Narrator API requires sign-in. Use Firebase Google sign-in, or set VITE_DEV_USER_ID for local dev headers.",
            );
          }

          if (
            shouldTreatEndpointResponseAsUnavailable({
              endpoint,
              status: response.status,
              rawText,
            })
          ) {
            const error = createNarratorServiceUnreachableError(endpoint);
            markNarratorUnavailable(error.code, error.message);
            throw error;
          }

          const message =
            typeof data?.message === "string"
              ? data.message
              : typeof data?.error === "string"
                ? data.error
              : rawText
                ? `Narrative generation failed (${response.status}). ${rawText.slice(0, 240)}`
                : `Narrative generation failed (${response.status}).`;
          throw new Error(message);
        }

        if (data && data.ok === false) {
          const message =
            typeof data.message === "string" && data.message.trim()
              ? data.message
              : "Narrative generation failed.";
          throw new Error(message);
        }

        if (
          !data ||
          (typeof data.story !== "string" && typeof data.narrative !== "string")
        ) {
          throw new Error("Story response missing.");
        }

        resetNarratorAvailabilityState();
        return applyNarrationGuards(
          normalizeNarrationPayload(data, {
            story: "Something happened.",
            mood: "neutral",
            suggestions: ["Look around", "Check inventory", "Continue"],
            provider: "firebase-genkit",
            fallbackUsed: false,
          }),
        );
      } catch (error) {
        if (shouldTreatEndpointErrorAsUnavailable({ endpoint, error })) {
          const unavailableError = createNarratorServiceUnreachableError(endpoint);
          markNarratorUnavailable(
            unavailableError.code,
            unavailableError.message,
          );
          lastError = unavailableError;
          endpointUnavailable = true;
          break;
        }
        lastError = error;
        if (shouldUseNarrativeLocalFallback(error)) {
          endpointUnavailable = true;
          break;
        }
        if (isDev && !shouldUseNarrativeLocalFallback(error)) {
          console.error("AI Service Error:", error);
        }
      }
    }
    if (endpointMissing) {
      missingEndpointCount += 1;
      continue;
    }
    if (endpointUnavailable) {
      continue;
    }
  }

  if (attemptedEndpoints > 0 && missingEndpointCount === attemptedEndpoints) {
    const error = new Error(
      "Narrator endpoint not found. For local dev, start the API with `npm run dev:api`, or configure VITE_NARRATE_ENDPOINT / VITE_API_BASE_URL.",
    );
    error.code = "NARRATOR_ENDPOINT_MISSING";
    markNarratorUnavailable(error.code, error.message);
    if (isDev) {
      console.warn("Narrator endpoints attempted:", attemptedUrls);
    }
    throw error;
  }

  if (lastError?.message?.includes("rate limit")) {
    throw new Error("Rate limit exceeded. Please wait a moment and try again.");
  }

  if (lastError?.name === "AbortError") {
    throw new Error(
      "Narrator request timed out. Try again, or increase VITE_NARRATE_TIMEOUT_MS.",
    );
  }

  if (
    lastError?.message &&
    isNetworkErrorLike(lastError)
  ) {
    const error = createNarratorServiceUnreachableError(lastError?.endpoint);
    markNarratorUnavailable(error.code, error.message);
    throw error;
  }

  if (shouldUseNarrativeLocalFallback(lastError)) {
    throw lastError;
  }

  if (isDev) {
    console.warn("Narrator endpoints attempted:", attemptedUrls);
  }
  throw new Error(lastError?.message || "Narrator service unavailable.");
}

/**
 * Generates an initial narrative for a new game
 * @param {string} initialPrompt - The initial prompt for game start
 * @returns {Promise<object>} The parsed JSON response
 */
export async function generateInitialNarrative(initialPrompt) {
  return generateNarrative(initialPrompt, { mode: "exploration" });
}

// -----------------------------------------------------------------
// Streaming (start + poll) client
// -----------------------------------------------------------------

/**
 * Streaming narrative generation via start + poll.
 * Kicks off a run, then polls for progress, invoking onChunk
 * whenever new text appears. Falls back to generateNarrative on failure.
 *
 * @param {string} prompt - The assembled prompt
 * @param {object} [options]
 * @param {function} [options.onChunk] - Called with (delta, fullText) as text grows
 * @param {function} [options.onDone]  - Called with the final guarded result
 * @param {AbortSignal} [options.signal] - AbortController signal to cancel
 * @returns {Promise<object>} guarded narrative result
 */
export async function generateNarrativeStream(
  prompt,
  { onChunk, onDone, signal, mode, npcContext, reactionContext } = {},
) {
  const cooldownError = createNarratorCooldownError();
  if (cooldownError) throw cooldownError;

  const endpointCandidates = resolveStreamEndpointCandidates();
  const isDev = Boolean(getBuildEnv().DEV);
  const startHeaderVariants = await buildApiHeaderVariants({
    "Content-Type": "application/json",
  });
  const pollHeaderVariants = await buildApiHeaderVariants();

  // No stream endpoints configured — transparent fallback
  if (!endpointCandidates || endpointCandidates.length === 0) {
    const result = await generateNarrative(prompt, {
      mode,
      npcContext,
      reactionContext,
    });
    if (typeof onDone === "function") onDone(result);
    return result;
  }

  // Step 1: Start the run (fast POST, returns threadId + runId)
  let startData;
  let selectedEndpoints = null;
  try {
    let lastStartError = null;
    for (const endpoints of endpointCandidates) {
      for (let i = 0; i < startHeaderVariants.length; i += 1) {
        try {
          const res = await fetchWithTimeout(
            endpoints.start,
            {
              method: "POST",
              headers: startHeaderVariants[i],
              body: JSON.stringify({ prompt, mode, npcContext, reactionContext }),
              signal,
            },
            30000,
          );
          const rawStartText = await res.clone().text().catch(() => "");
          startData = await res.json().catch(() => null);
          if (
            (res.status === 401 || res.status === 403) &&
            i < startHeaderVariants.length - 1
          ) {
            continue;
          }
          if (!res.ok || !startData?.ok) {
            const error = new Error(
              startData?.message || `Start failed (${res.status})`,
            );
            if (res.status === 404 || res.status === 405) {
              error.code = "NARRATOR_ENDPOINT_MISSING";
              lastStartError = error;
              break;
            }
            if (
              shouldTreatEndpointResponseAsUnavailable({
                endpoint: endpoints.start,
                status: res.status,
                rawText: rawStartText,
              })
            ) {
              const unavailableError = createNarratorServiceUnreachableError(
                endpoints.start,
              );
              markNarratorUnavailable(
                unavailableError.code,
                unavailableError.message,
              );
              throw unavailableError;
            }
            throw error;
          }
          selectedEndpoints = endpoints;
          lastStartError = null;
          break;
        } catch (error) {
          if (error?.name === "AbortError") {
            throw error;
          }
          if (shouldUseNarrativeLocalFallback(error)) {
            throw error;
          }
          if (
            shouldTreatEndpointErrorAsUnavailable({
              endpoint: endpoints.start,
              error,
            })
          ) {
            const unavailableError = createNarratorServiceUnreachableError(
              endpoints.start,
            );
            markNarratorUnavailable(
              unavailableError.code,
              unavailableError.message,
            );
            throw unavailableError;
          }
          lastStartError = error;
          break;
        }
      }
      if (selectedEndpoints) break;
      if (lastStartError) {
        continue;
      }
    }

    if (!selectedEndpoints) {
      throw lastStartError || new Error("Stream start failed (no endpoints).");
    }
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    if (shouldUseNarrativeLocalFallback(error)) throw error;
    // Fall back to synchronous narrate
    if (isDev) {
      console.warn("Stream start failed, falling back:", error);
    }
    const result = await generateNarrative(prompt, {
      mode,
      npcContext,
      reactionContext,
    });
    if (typeof onDone === "function") onDone(result);
    return result;
  }

  resetNarratorAvailabilityState();

  const { threadId, runId } = startData;
  const startStatus = String(startData?.status || "").trim().toLowerCase();
  const startDone =
    Boolean(startData?.done) ||
    startStatus === "completed" ||
    startStatus === "failed" ||
    startStatus === "incomplete";

  if (startDone && startData?.ok === false) {
    throw new Error(startData?.message || "Narrative generation failed.");
  }

  if (
    startDone &&
    (typeof startData?.story === "string" || typeof startData?.narrative === "string")
  ) {
    const result = applyNarrationGuards(
      normalizeNarrationPayload(startData, {
        story: startData.story || startData.narrative,
        mood: "neutral",
        suggestions: ["Look around", "Check inventory", "Continue"],
        provider: "firebase-genkit",
        fallbackUsed: false,
      }),
    );
    if (typeof onDone === "function") onDone(result);
    return result;
  }

  if (!threadId || !runId) {
    if (isDev) {
      console.warn("Stream start returned no run identifiers, falling back");
    }
    const result = await generateNarrative(prompt, {
      mode,
      npcContext,
      reactionContext,
    });
    if (typeof onDone === "function") onDone(result);
    return result;
  }

  // Step 2: Poll for progress
  let lastText = "";
  let stallStart = Date.now();

  for (let poll = 0; poll < STREAM_MAX_POLLS; poll++) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    await delay(STREAM_POLL_INTERVAL_MS);

    let pollData;
    try {
      let pollResponse = null;
      let pollError = null;
      for (let i = 0; i < pollHeaderVariants.length; i += 1) {
        const res = await fetchWithTimeout(
          `${selectedEndpoints.poll}?threadId=${encodeURIComponent(threadId)}&runId=${encodeURIComponent(runId)}${mode ? `&mode=${encodeURIComponent(mode)}` : ""}`,
          { method: "GET", headers: pollHeaderVariants[i], signal },
          15000,
        );
        pollResponse = res;
        const rawPollText = await res.clone().text().catch(() => "");
        pollData = await res.json().catch(() => null);
        if (
          (res.status === 401 || res.status === 403) &&
          i < pollHeaderVariants.length - 1
        ) {
          continue;
        }
        if (!res.ok) {
          if (
            shouldTreatEndpointResponseAsUnavailable({
              endpoint: selectedEndpoints.poll,
              status: res.status,
              rawText: rawPollText,
            })
          ) {
            const error = createNarratorServiceUnreachableError(
              selectedEndpoints.poll,
            );
            markNarratorUnavailable(error.code, error.message);
            pollError = error;
          } else {
            pollError = new Error(
              pollData?.message || `Stream poll failed (${res.status})`,
            );
          }
        }
        break;
      }
      if (pollError) {
        throw pollError;
      }
      if (!pollResponse) {
        throw new Error("Stream poll failed (no response).");
      }
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      if (shouldUseNarrativeLocalFallback(error)) throw error;
      if (
        shouldTreatEndpointErrorAsUnavailable({
          endpoint: selectedEndpoints?.poll,
          error,
        })
      ) {
        const unavailableError = createNarratorServiceUnreachableError(
          selectedEndpoints?.poll,
        );
        markNarratorUnavailable(
          unavailableError.code,
          unavailableError.message,
        );
        throw unavailableError;
      }
      if (isDev) console.warn("Stream poll error:", error);
      if (
        String(error?.message || "").toLowerCase().includes("unauthorized")
      ) {
        if (isDev) {
          console.warn("Stream poll unauthorized, falling back to sync narrate");
        }
        const result = await generateNarrative(prompt, {
          mode,
          npcContext,
          reactionContext,
        });
        if (typeof onDone === "function") onDone(result);
        return result;
      }
      continue; // retry next poll
    }

    // Emit delta when text has grown
    const currentText = pollData?.story || pollData?.narrative || "";
    if (currentText.length > lastText.length) {
      const delta = currentText.slice(lastText.length);
      lastText = currentText;
      stallStart = Date.now();
      if (typeof onChunk === "function") onChunk(delta, currentText);
    }

    // Run finished (treat "incomplete" as terminal; some backends may not set done=true)
    const statusRaw = pollData?.status;
    const status = String(statusRaw || "").trim().toLowerCase();
    const isTerminal =
      Boolean(pollData?.done) ||
      status === "completed" ||
      status === "incomplete";

    if (isTerminal) {
      if (pollData?.ok === false) {
        throw new Error(pollData?.message || "Narrative generation failed.");
      }
      const result = applyNarrationGuards(
        normalizeNarrationPayload(pollData, {
          story: currentText || "Something happened.",
          mood: "neutral",
          suggestions: ["Look around", "Check inventory", "Continue"],
          provider: "firebase-genkit",
          fallbackUsed: false,
        }),
      );
      if (typeof onDone === "function") onDone(result);
      return result;
    }

    // Stall detection
    if (Date.now() - stallStart > STREAM_STALL_TIMEOUT_MS) {
      if (isDev)
        console.warn("Stream stalled, falling back to sync narrate");
      const result = await generateNarrative(prompt, {
        mode,
        npcContext,
        reactionContext,
      });
      if (typeof onDone === "function") onDone(result);
      return result;
    }
  }

  // Exceeded max polls — fall back
  if (isDev) console.warn("Stream exceeded max polls, falling back");
  const result = await generateNarrative(prompt, {
    mode,
    npcContext,
    reactionContext,
  });
  if (typeof onDone === "function") onDone(result);
  return result;
}
