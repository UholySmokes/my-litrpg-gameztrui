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
} = require("../lib/azure-ai-utils");
const { startFoundryRun, awaitFoundryRun } = require("../lib/foundry-run");
const {
  normalizeMode,
  resolveAssistantId,
  buildDefaultSuggestions,
} = require("../lib/agent-router");
const {
  resolveNarratorProvider,
  runGeminiNarrator,
} = require("../lib/gemini-narrator");

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
