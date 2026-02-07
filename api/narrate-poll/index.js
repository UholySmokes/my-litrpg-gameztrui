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
        };

        if (result.text) {
          response.narrative = result.text;
          response.outputHash = hashContent(result.text);
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
