// =================================================================
// NARRATE-START — kicks off a Foundry agent run and returns immediately
// =================================================================

const { initApiTracing, withTraceSpan } = require("../lib/tracing");
const {
  jsonResponse,
  toStringSafe,
  getRequiredEnv,
  generateId,
  readJsonBody,
  rateLimit,
} = require("../lib/azure-ai-utils");
const { startFoundryRun } = require("../lib/foundry-run");
const { normalizeMode, resolveAssistantId } = require("../lib/agent-router");

module.exports = async function narrateStart(context, req) {
  initApiTracing({ serviceName: "void-verse-api" });

  try {
    const requestId = generateId("narrate-start");
    return await withTraceSpan(
      "api.narrate-start",
      { "app.request_id": requestId },
      async () => {
        const narratorId = getRequiredEnv("NARRATOR_AGENT_ID");
        const rateLimitPerMin = Number.parseInt(
          getRequiredEnv("NARRATE_RATE_LIMIT_PER_MIN") || "0",
          10,
        );

        if (!narratorId) {
          context.res = jsonResponse(500, {
            ok: false,
            errorCode: "MISSING_ENV",
            message: "Missing environment variable: NARRATOR_AGENT_ID",
          });
          return;
        }

        // Rate limiting
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
        const assistantId = resolveAssistantId(mode);
        const prompt =
          typeof body?.prompt === "string" ? body.prompt.trim() : "";
        const instruction =
          prompt ||
          `Narrate the next scene based on: ${JSON.stringify(body || {})}`;

        const { threadId, runId, status } = await startFoundryRun(
          instruction,
          assistantId,
        );

        context.log?.(
          `narrate-start ${requestId} assistant=${assistantId} mode=${mode} thread=${threadId} run=${runId} status=${status}`,
        );

        context.res = jsonResponse(202, {
          ok: true,
          threadId,
          runId,
          status,
          mode,
        });
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
