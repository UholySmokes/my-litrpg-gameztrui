const { initApiTracing, withTraceSpan } = require("../lib/tracing");
const {
  jsonResponse,
  toStringSafe,
  getRequiredEnv,
  getOptionalEnv,
  generateId,
  hashContent,
  readJsonBody,
  rateLimit,
  resolveFetch,
  getTimeoutMs,
} = require("../lib/azure-ai-utils");
const { startFoundryRun, awaitFoundryRun } = require("../lib/foundry-run");
const {
  normalizeMode,
  resolveAssistantId,
  buildDefaultSuggestions,
} = require("../lib/agent-router");

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_DEFAULT_MODEL = "gemini-2.5-pro";
const GEMINI_DEFAULT_TEMPERATURE = 0.8;

const MOOD_PATTERNS = [
  { mood: "tense", patterns: [/danger/i, /threat/i, /ambush/i, /attack/i, /enemy/i, /looming/i] },
  { mood: "triumphant", patterns: [/victory/i, /triumph/i, /succeed/i, /conquer/i, /glory/i, /reward/i] },
  { mood: "mysterious", patterns: [/strange/i, /mystery/i, /whisper/i, /shadow/i, /ancient/i, /secret/i, /hidden/i] },
  { mood: "serene", patterns: [/calm/i, /peace/i, /gentle/i, /rest/i, /quiet/i, /warm/i, /soft/i] },
  { mood: "desperate", patterns: [/flee/i, /escape/i, /wound/i, /bleed/i, /dying/i, /last/i, /barely/i] },
];

function inferMood(text) {
  const value = typeof text === "string" ? text : "";
  if (!value.trim()) return "neutral";
  for (const { mood, patterns } of MOOD_PATTERNS) {
    if (patterns.some((p) => p.test(value))) return mood;
  }
  return "neutral";
}

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

function stripCodeFence(text) {
  const raw = typeof text === "string" ? text.trim() : "";
  if (!raw.startsWith("```")) return raw;
  return raw
    .replace(/^```[a-zA-Z0-9_-]*\s*/u, "")
    .replace(/\s*```$/u, "")
    .trim();
}

function tryParseStructured(text) {
  const raw = stripCodeFence(text);
  if (!raw) return null;
  if (!raw.startsWith("{") && !raw.startsWith("[")) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
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

module.exports = async function narrate(context, req) {
  initApiTracing({ serviceName: "void-verse-api" });

  try {
    const requestId = generateId("narrate");
    return await withTraceSpan(
      "api.narrate",
      { "app.request_id": requestId },
      async () => {
        const provider = resolveNarratorProvider();
        const narratorId =
          provider === "foundry" ? getRequiredEnv("NARRATOR_AGENT_ID") : "";
        const rateLimitPerMin = Number.parseInt(
          getRequiredEnv("NARRATE_RATE_LIMIT_PER_MIN") || "0",
          10,
        );

        if (provider === "foundry" && !narratorId) {
          context.res = jsonResponse(500, {
            ok: false,
            errorCode: "MISSING_ENV",
            message: "Missing environment variable: NARRATOR_AGENT_ID",
          });
          return;
        }

        const clientKey = toStringSafe(
          req?.headers?.["x-forwarded-for"] ||
            req?.headers?.["x-client-id"] ||
            "anonymous",
        );
        const canProceed = await rateLimit(clientKey, rateLimitPerMin, {
          logger: context?.log?.bind(context),
        });
        if (!canProceed) {
          context.res = jsonResponse(429, {
            ok: false,
            errorCode: "RATE_LIMITED",
            message: "Rate limit exceeded.",
          });
          return;
        }

        const body = await readJsonBody(req);
        const mode = normalizeMode(body?.mode);
        const prompt =
          typeof body?.prompt === "string" ? body.prompt.trim() : "";
        const instruction =
          prompt ||
          `Narrate the next scene based on: ${JSON.stringify(body || {})}`;
        const requestedTemperature =
          typeof body?.temperature !== "undefined"
            ? body.temperature
            : getOptionalEnv("GEMINI_TEMPERATURE");
        let assistantText = "";

        if (provider === "gemini") {
          const geminiResult = await runGeminiNarrator({
            prompt: instruction,
            mode,
            temperature: requestedTemperature,
          });
          assistantText = geminiResult.text;
          context.log?.(
            `narrate ${requestId} provider=gemini model=${geminiResult.model} mode=${mode}`,
          );
        } else {
          const assistantId = resolveAssistantId(mode);
          const { threadId, runId } = await startFoundryRun(
            instruction,
            assistantId,
          );

          const result = await awaitFoundryRun(threadId, runId, {
            logger: context?.log?.bind(context),
          });
          assistantText = result.text;
          context.log?.(
            `narrate ${requestId} provider=foundry assistant=${assistantId} mode=${mode} thread=${threadId} run=${runId} status=${result.status}`,
          );
        }
        const outputHash = hashContent(assistantText);

        if (!assistantText) {
          context.res = jsonResponse(502, {
            ok: false,
            errorCode: "NON_TEXT_OUTPUT",
            message: "NarratorAgent returned empty output.",
          });
          return;
        }

        const structured = tryParseStructured(assistantText);
        const narrative =
          typeof structured?.narrative === "string" && structured.narrative.trim()
            ? structured.narrative.trim()
            : assistantText;
        const mood =
          typeof structured?.mood === "string" && structured.mood.trim()
            ? structured.mood.trim()
            : inferMood(narrative);
        const suggestions = Array.isArray(structured?.suggestions)
          ? structured.suggestions
          : buildDefaultSuggestions(mode);

        context.res = jsonResponse(200, {
          ok: true,
          narrative,
          mood,
          suggestions,
          outputHash,
        });
      },
    );
  } catch (error) {
    const parsedStatus = Number(error?.status);
    const status = Number.isFinite(parsedStatus) ? parsedStatus : 500;
    const errorCode =
      error?.code === "RUN_TIMEOUT" ||
      error?.code === "FOUNDRY_REQUEST_TIMEOUT" ||
      error?.code === "GEMINI_REQUEST_TIMEOUT" ||
      status === 504
        ? "UPSTREAM_TIMEOUT"
        : error?.code || "UNEXPECTED_ERROR";
    const responseBody = {
      ok: false,
      errorCode,
      message: String(error?.message || error || "Unknown error"),
    };
    if (typeof error?.detail !== "undefined") {
      responseBody.detail = error.detail;
    }
    if (error?.threadId) responseBody.threadId = error.threadId;
    if (error?.runId) responseBody.runId = error.runId;
    context.res = jsonResponse(status, responseBody);
  }
};
