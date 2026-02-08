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
  const raw = typeof text === "string" ? text.trim() : "";
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

        if (!threadId || !runId) {
          context.res = jsonResponse(400, {
            ok: false,
            errorCode: "MISSING_PARAMS",
            message: "threadId and runId query parameters are required.",
          });
          return;
        }

        const result = await pollFoundryRun(threadId, runId);

        if (result.error) {
          context.res = jsonResponse(500, {
            ok: false,
            errorCode: "RUN_FAILED",
            status: result.status,
            done: true,
            message: result.error,
          });
          return;
        }

        const response = {
          ok: true,
          status: result.status,
          done: result.done,
          mode,
        };

        if (result.text) {
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
