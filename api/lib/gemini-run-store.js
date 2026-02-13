const { generateId, getOptionalEnv } = require("./azure-ai-utils");
const { runGeminiNarrator } = require("./gemini-narrator");

const runs = new Map();
const DEFAULT_RUN_TTL_MS = 30 * 60 * 1000;
const DEFAULT_STREAM_CHUNK_CHARS = 220;

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
  if (!raw || (!raw.startsWith("{") && !raw.startsWith("["))) return null;
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

function runKey(threadId, runId) {
  return `${threadId}:${runId}`;
}

function getRunTtlMs() {
  const raw = getOptionalEnv("NARRATE_STREAM_RUN_TTL_MS", String(DEFAULT_RUN_TTL_MS));
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RUN_TTL_MS;
}

function getChunkChars() {
  const raw = getOptionalEnv(
    "NARRATE_STREAM_CHUNK_CHARS",
    String(DEFAULT_STREAM_CHUNK_CHARS),
  );
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_STREAM_CHUNK_CHARS;
}

function cleanupExpiredRuns(now = Date.now()) {
  const ttl = getRunTtlMs();
  for (const [key, run] of runs.entries()) {
    if (now - run.updatedAt > ttl) {
      runs.delete(key);
    }
  }
}

function createGeminiRun({ prompt, mode, temperature, logger }) {
  cleanupExpiredRuns();
  const threadId = generateId("thread");
  const runId = generateId("run");
  const key = runKey(threadId, runId);
  const now = Date.now();
  const run = {
    threadId,
    runId,
    mode,
    status: "queued",
    done: false,
    error: "",
    detail: undefined,
    text: "",
    fullText: "",
    visibleChars: 0,
    mood: "",
    suggestions: [],
    model: "",
    createdAt: now,
    updatedAt: now,
  };

  runs.set(key, run);

  void (async () => {
    try {
      run.status = "in_progress";
      run.updatedAt = Date.now();
      const result = await runGeminiNarrator({ prompt, mode, temperature });
      const structured = tryParseStructured(result.text);
      run.fullText =
        typeof structured?.narrative === "string" && structured.narrative.trim()
          ? structured.narrative.trim()
          : result.text;
      run.mood =
        typeof structured?.mood === "string" ? structured.mood.trim() : "";
      run.suggestions = Array.isArray(structured?.suggestions)
        ? structured.suggestions
        : [];
      run.model = result.model;
      run.updatedAt = Date.now();
      if (!run.fullText) {
        run.status = "failed";
        run.done = true;
        run.error = "Gemini returned empty output.";
        return;
      }
      logger?.(
        `gemini-stream ready thread=${threadId} run=${runId} model=${result.model} chars=${run.fullText.length}`,
      );
    } catch (error) {
      run.status = "failed";
      run.done = true;
      run.error = String(error?.message || error || "Unknown error");
      run.detail = error?.detail;
      run.updatedAt = Date.now();
      logger?.(
        `gemini-stream failed thread=${threadId} run=${runId} error=${run.error}`,
      );
    }
  })();

  return { threadId, runId, status: run.status };
}

function pollGeminiRun(threadId, runId) {
  cleanupExpiredRuns();
  const run = runs.get(runKey(threadId, runId));
  if (!run) return null;

  if (run.done && run.error) {
    return {
      status: run.status || "failed",
      done: true,
      text: run.text,
      error: run.error,
      detail: run.detail,
      model: run.model,
      mood: run.mood,
      suggestions: run.suggestions,
    };
  }

  if (run.fullText) {
    const chunkChars = getChunkChars();
    if (run.visibleChars < run.fullText.length) {
      run.visibleChars = Math.min(run.fullText.length, run.visibleChars + chunkChars);
      run.text = run.fullText.slice(0, run.visibleChars);
      run.status = run.visibleChars >= run.fullText.length ? "completed" : "in_progress";
      run.done = run.visibleChars >= run.fullText.length;
      run.updatedAt = Date.now();
    }
  }

  return {
    status: run.status,
    done: run.done,
    text: run.text,
    error: run.error,
    detail: run.detail,
    model: run.model,
    mood: run.mood,
    suggestions: run.suggestions,
  };
}

module.exports = {
  createGeminiRun,
  pollGeminiRun,
};
