const {
  getRequiredEnv,
  getOptionalEnv,
  resolveFetch,
  getTimeoutMs,
} = require("./azure-ai-utils");

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_DEFAULT_MODEL = "gemini-2.5-pro";
const GEMINI_DEFAULT_FALLBACK_MODEL = "gemini-2.5-flash";
const GEMINI_DEFAULT_TEMPERATURE = 0.8;
const GEMINI_DEFAULT_MAX_OUTPUT_TOKENS = 1024;
const GEMINI_RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

function resolveNarratorProvider() {
  const explicit = getOptionalEnv("NARRATE_PROVIDER").toLowerCase();
  if (explicit === "foundry" || explicit === "gemini") {
    return explicit;
  }
  return getRequiredEnv("GOOGLE_API_KEY") ? "gemini" : "foundry";
}

function clampTemperature(value, fallback = GEMINI_DEFAULT_TEMPERATURE) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(2, Math.max(0, parsed));
}

function clampMaxOutputTokens(value, fallback = GEMINI_DEFAULT_MAX_OUTPUT_TOKENS) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(8192, Math.max(64, parsed));
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(value) {
  if (typeof value !== "string" || !value.trim()) return 0;
  const seconds = Number.parseInt(value, 10);
  if (Number.isFinite(seconds) && seconds > 0) {
    return seconds * 1000;
  }

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, timestamp - Date.now());
}

function getRetryDelayMs(attempt, { baseDelayMs, maxDelayMs, retryAfterMs }) {
  if (retryAfterMs > 0) {
    return Math.min(maxDelayMs, retryAfterMs);
  }
  const expBackoff = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
  const jitter = Math.floor(Math.random() * 150);
  return expBackoff + jitter;
}

function buildModelSequence(primaryModel) {
  const fallbackModel = getOptionalEnv(
    "GEMINI_FALLBACK_MODEL",
    GEMINI_DEFAULT_FALLBACK_MODEL,
  );

  const seen = new Set();
  return [primaryModel, fallbackModel]
    .map((model) => String(model || "").trim())
    .filter((model) => {
      if (!model || seen.has(model)) return false;
      seen.add(model);
      return true;
    });
}

function createGeminiHttpError(status, payload, rawText) {
  const detail = payload || rawText || `HTTP ${status}`;
  const error = Object.assign(
    new Error(`Gemini request failed (${status}).`),
    {
      code: status === 429 ? "RATE_LIMITED" : "GEMINI_REQUEST_FAILED",
      status,
    },
  );
  error.detail = detail;
  return error;
}

function buildGeminiSystemInstruction() {
  return [
    "You are the NarratorAgent for a LitRPG-style game.",
    "Narrate scenes, actions, and world reactions from provided state.",
    "Do not invent mechanics, numbers, or hidden rules.",
    "Do not add new entities unless they are in the prompt.",
    "Second-person perspective, immersive but concise.",
    "Respond with strict JSON only (no markdown):",
    '{"narrative":"string","mood":"neutral|tense|triumphant|mysterious|serene|desperate","suggestions":[{"t":"short action","w":0.0}]}',
  ].join("\n");
}

function extractGeminiText(payload) {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts)
      ? candidate.content.parts
      : [];
    const text = parts
      .map((part) => (typeof part?.text === "string" ? part.text.trim() : ""))
      .filter(Boolean)
      .join("\n");
    if (text) return text;
  }
  return "";
}

async function runGeminiNarrator({ prompt, mode, temperature }) {
  const apiKey = getRequiredEnv("GOOGLE_API_KEY");
  if (!apiKey) {
    throw Object.assign(new Error("Missing environment variable: GOOGLE_API_KEY"), {
      code: "MISSING_ENV",
      status: 500,
    });
  }

  const model = getOptionalEnv("GEMINI_MODEL", GEMINI_DEFAULT_MODEL);
  const models = buildModelSequence(model);
  const timeoutMs = getTimeoutMs("GEMINI_HTTP_TIMEOUT_MS", 30000);
  const maxRetries = parsePositiveInt(getOptionalEnv("GEMINI_MAX_RETRIES", "2"), 2);
  const baseDelayMs = parsePositiveInt(
    getOptionalEnv("GEMINI_RETRY_BASE_DELAY_MS", "350"),
    350,
  );
  const maxDelayMs = parsePositiveInt(
    getOptionalEnv("GEMINI_RETRY_MAX_DELAY_MS", "4000"),
    4000,
  );
  const maxOutputTokens = clampMaxOutputTokens(
    getOptionalEnv("GEMINI_MAX_OUTPUT_TOKENS"),
    GEMINI_DEFAULT_MAX_OUTPUT_TOKENS,
  );
  const requestTemp = clampTemperature(
    temperature,
    clampTemperature(
      getOptionalEnv("GEMINI_TEMPERATURE"),
      GEMINI_DEFAULT_TEMPERATURE,
    ),
  );
  const fetchFn = await resolveFetch();
  const requestBody = {
    systemInstruction: {
      parts: [{ text: buildGeminiSystemInstruction() }],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Mode: ${mode}\n\n${prompt}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: requestTemp,
      maxOutputTokens,
      responseMimeType: "application/json",
    },
  };

  let lastError = null;

  for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
    const activeModel = models[modelIndex];
    const endpoint = `${GEMINI_API_BASE_URL}/models/${encodeURIComponent(activeModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      let response;
      let rawText = "";
      let payload = null;
      const canAbort = typeof AbortController === "function";
      const controller = canAbort ? new AbortController() : null;
      const timeoutId = controller
        ? setTimeout(() => controller.abort(), timeoutMs)
        : null;

      try {
        response = await fetchFn(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: controller ? controller.signal : undefined,
        });
        rawText = await response.text();
        if (rawText) {
          try {
            payload = JSON.parse(rawText);
          } catch {
            payload = null;
          }
        }
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);

        if (error?.name === "AbortError") {
          lastError = Object.assign(
            new Error(`Gemini request timed out after ${timeoutMs}ms.`),
            {
              code: "GEMINI_REQUEST_TIMEOUT",
              status: 504,
            },
          );
          if (attempt < maxRetries) {
            await sleep(
              getRetryDelayMs(attempt, {
                baseDelayMs,
                maxDelayMs,
                retryAfterMs: 0,
              }),
            );
            continue;
          }
          break;
        }

        lastError = Object.assign(
          new Error(`Gemini request failed: ${String(error?.message || error)}`),
          {
            code: "GEMINI_REQUEST_FAILED",
            status: 502,
          },
        );
        if (attempt < maxRetries) {
          await sleep(
            getRetryDelayMs(attempt, {
              baseDelayMs,
              maxDelayMs,
              retryAfterMs: 0,
            }),
          );
          continue;
        }
        break;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const error = createGeminiHttpError(response.status, payload, rawText);
        lastError = error;

        const shouldRetry =
          GEMINI_RETRYABLE_STATUS.has(response.status) &&
          attempt < maxRetries;

        if (shouldRetry) {
          const retryAfterMs = parseRetryAfterMs(
            typeof response.headers?.get === "function"
              ? response.headers.get("retry-after")
              : "",
          );
          await sleep(
            getRetryDelayMs(attempt, {
              baseDelayMs,
              maxDelayMs,
              retryAfterMs,
            }),
          );
          continue;
        }

        if (
          GEMINI_RETRYABLE_STATUS.has(response.status) &&
          modelIndex < models.length - 1
        ) {
          break;
        }

        throw error;
      }

      const blockReason = payload?.promptFeedback?.blockReason;
      if (blockReason) {
        throw Object.assign(new Error(`Gemini blocked the request: ${blockReason}`), {
          code: "CONTENT_BLOCKED",
          status: 502,
          detail: payload?.promptFeedback,
        });
      }

      const text = extractGeminiText(payload);
      if (!text) {
        throw Object.assign(new Error("Gemini returned empty output."), {
          code: "NON_TEXT_OUTPUT",
          status: 502,
          detail: payload,
        });
      }

      return { text, model: activeModel };
    }
  }

  if (lastError) throw lastError;

  throw Object.assign(new Error("Gemini request failed."), {
    code: "GEMINI_REQUEST_FAILED",
    status: 502,
  });
}

module.exports = {
  resolveNarratorProvider,
  runGeminiNarrator,
};
