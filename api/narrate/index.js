const { initApiTracing, withTraceSpan } = require("../lib/tracing");
const {
  jsonResponse,
  toStringSafe,
  getRequiredEnv,
  generateId,
  hashContent,
  readJsonBody,
  rateLimit,
} = require("../lib/azure-ai-utils");
const { startFoundryRun, awaitFoundryRun } = require("../lib/foundry-run");

module.exports = async function narrate(context, req) {
  initApiTracing({ serviceName: "void-verse-api" });

  try {
    const requestId = generateId("narrate");
    return await withTraceSpan(
      "api.narrate",
      { "app.request_id": requestId },
      async () => {
        const assistantId = getRequiredEnv("NARRATOR_AGENT_ID");
        const rateLimitPerMin = Number.parseInt(
          getRequiredEnv("NARRATE_RATE_LIMIT_PER_MIN") || "0",
          10,
        );

        if (!assistantId) {
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
        const prompt =
          typeof body?.prompt === "string" ? body.prompt.trim() : "";
        const instruction =
          prompt ||
          `Narrate the next scene based on: ${JSON.stringify(body || {})}`;

        // Start the Foundry thread + run
        const { threadId, runId } = await startFoundryRun(
          instruction,
          assistantId,
        );

        // Block until the run completes (synchronous mode)
        const result = await awaitFoundryRun(threadId, runId, {
          logger: context?.log?.bind(context),
        });

        const assistantText = result.text;
        const outputHash = hashContent(assistantText);

        if (!assistantText) {
          context.res = jsonResponse(502, {
            ok: false,
            errorCode: "NON_TEXT_OUTPUT",
            message: "NarratorAgent returned empty output.",
          });
          return;
        }

        context.log?.(
          `narrate ${requestId} assistant=${assistantId} thread=${threadId} run=${runId} status=${result.status}`,
        );

        context.res = jsonResponse(200, {
          ok: true,
          narrative: assistantText,
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
