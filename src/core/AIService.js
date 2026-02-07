const DEFAULT_TIMEOUT_MS = 105000;
const DEV_DEFAULT_TIMEOUT_MS = 120000;

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

const resolveNarrateEndpoints = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const narrateEndpoint = pickEnvValue(
    runtimeEnv["VITE_NARRATE_ENDPOINT"],
    buildEnv["VITE_NARRATE_ENDPOINT"],
  );
  const apiBaseUrl = pickEnvValue(
    runtimeEnv["VITE_API_BASE_URL"],
    buildEnv["VITE_API_BASE_URL"],
    runtimeEnv["VITE_API_BASE"],
    buildEnv["VITE_API_BASE"],
  );
  const derivedEndpoint = apiBaseUrl
    ? `${normalizeBaseUrl(apiBaseUrl)}/api/narrate`
    : undefined;
  return [narrateEndpoint, derivedEndpoint, "/api/narrate"].filter(Boolean);
};

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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
      const data = await response.json().catch(() => null);

      if (RETRY_STATUS.has(response.status) && attempt < MAX_RETRIES) {
        const errorCode = data?.errorCode;
        if (
          response.status === 504 &&
          (errorCode === "RUN_TIMEOUT" ||
            errorCode === "UPSTREAM_TIMEOUT" ||
            errorCode === "FOUNDRY_REQUEST_TIMEOUT")
        ) {
          return { response, data };
        }
        if (response.status === 502 && errorCode === "RUN_REQUIRES_ACTION") {
          return { response, data };
        }
        await delay(300 * (attempt + 1) ** 2);
        continue;
      }

      return { response, data };
    } catch (error) {
      lastError = error;

      if (error?.name === "AbortError") {
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
  const narrativeRaw =
    response && typeof response.narrative === "string" ? response.narrative : "";
  let narrative = narrativeRaw.trim();
  if (!narrative) {
    return { ...response, narrative: NARRATION_GUARD_FALLBACK };
  }

  narrative = stripToneViolations(narrative);
  if (!narrative) {
    return { ...response, narrative: NARRATION_GUARD_FALLBACK };
  }

  if (narrative.length > MAX_NARRATIVE_LENGTH) {
    narrative = narrative.slice(0, MAX_NARRATIVE_LENGTH).trim();
  }

  return { ...response, narrative };
}

/**
 * Calls narrative API to generate response
 * @param {string} prompt - The complete prompt string
 * @returns {Promise<object>} The parsed JSON response with narrative, mood, and suggestions
 */
export async function generateNarrative(prompt) {
  let lastError = null;
  let attemptedEndpoints = 0;
  let missingEndpointCount = 0;
  const attemptedUrls = [];
  const apiEndpoints = resolveNarrateEndpoints();
  const timeoutMs = resolveRequestTimeoutMs();
  const isDev = Boolean(getBuildEnv().DEV);

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
    try {
      const { response, data } = await fetchJsonWithRetry(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        },
        timeoutMs,
      );
      if (isDev) {
        console.info("Narrator endpoint response:", {
          endpoint,
          status: response.status,
        });
      }
      if (!response.ok) {
        if (response.status === 404 || response.status === 405) {
          missingEndpointCount += 1;
          continue;
        }

        const message =
          typeof data?.message === "string"
            ? data.message
            : typeof data?.error === "string"
              ? data.error
            : "Narrative generation failed.";
        throw new Error(message);
      }

      if (data && data.ok === false) {
        const message =
          typeof data.message === "string" && data.message.trim()
            ? data.message
            : "Narrative generation failed.";
        throw new Error(message);
      }

      if (!data || typeof data.narrative !== "string") {
        throw new Error("Narrative response missing.");
      }

      return applyNarrationGuards({
        narrative: data.narrative || "Something happened.",
        mood: data.mood || "neutral",
        suggestions: Array.isArray(data.suggestions)
          ? data.suggestions.slice(0, 3)
          : ["Look around", "Check inventory", "Continue"],
      });
    } catch (error) {
      lastError = error;
      if (isDev) {
        console.error("AI Service Error:", error);
      }
    }
  }

  if (attemptedEndpoints > 0 && missingEndpointCount === attemptedEndpoints) {
    const error = new Error(
      "Narrator endpoint not found. Configure VITE_NARRATE_ENDPOINT, VITE_API_BASE_URL, or deploy /api/narrate.",
    );
    error.code = "NARRATOR_ENDPOINT_MISSING";
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
    (lastError.message.includes("network") ||
      lastError.message.includes("fetch") ||
      lastError.message.includes("Connection error"))
  ) {
    throw new Error(
      "Narrator service unreachable. Check your connection or backend status.",
    );
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
  return generateNarrative(initialPrompt);
}
