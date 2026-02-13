const {
  getRequiredEnv,
  getOptionalEnv,
  resolveFetch,
  getTimeoutMs,
} = require("./azure-ai-utils");

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_DEFAULT_MODEL = "gemini-2.5-pro";
const GEMINI_DEFAULT_TEMPERATURE = 0.8;

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
  const timeoutMs = getTimeoutMs("GEMINI_HTTP_TIMEOUT_MS", 30000);
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
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  };
  const endpoint = `${GEMINI_API_BASE_URL}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

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
    if (error?.name === "AbortError") {
      throw Object.assign(new Error(`Gemini request timed out after ${timeoutMs}ms.`), {
        code: "GEMINI_REQUEST_TIMEOUT",
        status: 504,
      });
    }
    throw Object.assign(new Error(`Gemini request failed: ${String(error?.message || error)}`), {
      code: "GEMINI_REQUEST_FAILED",
      status: 502,
    });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const detail = payload || rawText || response.statusText;
    const error = Object.assign(
      new Error(`Gemini request failed (${response.status}).`),
      {
        code: response.status === 429 ? "RATE_LIMITED" : "GEMINI_REQUEST_FAILED",
        status: response.status,
      },
    );
    error.detail = detail;
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

  return { text, model };
}

module.exports = {
  resolveNarratorProvider,
  runGeminiNarrator,
};
