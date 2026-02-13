// =================================================================
// NARRATE-POLL — checks the status of an in-flight Foundry agent run
// =================================================================

const { initApiTracing, withTraceSpan } = require("../lib/tracing");
const {
  jsonResponse,
  generateId,
  hashContent,
} = require("../lib/azure-ai-utils");
const { pollFoundryRun } = require("../lib/foundry-run");
const { resolveNarratorProvider } = require("../lib/gemini-narrator");
const { pollGeminiRun } = require("../lib/gemini-run-store");
const {
  normalizeMode,
  buildDefaultSuggestions,
} = require("../lib/agent-router");

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

function stripCodeFence(text) {
  const raw = typeof text === "string" ? text.trim() : "";
  if (!raw.startsWith("```")) return raw;
  return raw
    .replace(/^```[a-zA-Z0-9_-]*\s*/u, "")
    .replace(/\s*```$/u, "")
    .trim();
}

module.exports = async function narratePoll(context, req) {
  initApiTracing({ serviceName: "void-verse-api" });

  try {
    const requestId = generateId("narrate-poll");
    return await withTraceSpan(
      "api.narrate-poll",
      { "app.request_id": requestId },
      async () => {
        const threadId = req?.query?.threadId;
        const runId = req?.query?.runId;
        const mode = normalizeMode(req?.query?.mode);
        const provider = resolveNarratorProvider();

        if (!threadId || !runId) {
          context.res = jsonResponse(400, {
            ok: false,
            errorCode: "MISSING_PARAMS",
            message: "threadId and runId query parameters are required.",
          });
          return;
        }

        const result =
          provider === "gemini"
            ? pollGeminiRun(threadId, runId)
            : await pollFoundryRun(threadId, runId);

        if (!result) {
          context.res = jsonResponse(404, {
            ok: false,
            errorCode: "RUN_NOT_FOUND",
            done: true,
            message: "No in-flight narration run found for the provided IDs.",
          });
          return;
        }

        if (result.error) {
          context.res = jsonResponse(500, {
            ok: false,
            errorCode: provider === "gemini" ? "GEMINI_RUN_FAILED" : "RUN_FAILED",
            status: result.status,
            done: true,
            message: result.error,
            detail: result.detail,
          });
          return;
        }

        const response = {
          ok: true,
          status: result.status,
          done: result.done,
          mode,
          provider,
        };

        if (result.text) {
          if (provider === "gemini") {
            const narrative = result.text;
            response.narrative = narrative;
            response.mood =
              typeof result.mood === "string" && result.mood.trim()
                ? result.mood.trim()
                : inferMood(narrative);
            response.suggestions = Array.isArray(result.suggestions)
              ? result.suggestions
              : buildDefaultSuggestions(mode);
            response.outputHash = hashContent(narrative);
          } else {
            const structured = tryParseStructured(result.text);
            const narrative =
              typeof structured?.narrative === "string" && structured.narrative.trim()
                ? structured.narrative.trim()
                : result.text;
            response.narrative = narrative;
            response.mood =
              typeof structured?.mood === "string" && structured.mood.trim()
                ? structured.mood.trim()
                : inferMood(narrative);
            response.suggestions = Array.isArray(structured?.suggestions)
              ? structured.suggestions
              : buildDefaultSuggestions(mode);
            response.outputHash = hashContent(narrative);
          }
        }

        context.res = jsonResponse(result.done ? 200 : 202, response);
      },
    );
  } catch (error) {
    const parsedStatus = Number(error?.status);
    const status = Number.isFinite(parsedStatus) ? parsedStatus : 500;
    context.res = jsonResponse(status, {
      ok: false,
      errorCode: error?.code || "UNEXPECTED_ERROR",
      message: String(error?.message || error || "Unknown error"),
    });
  }
};
