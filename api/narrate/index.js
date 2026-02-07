const { DefaultAzureCredential } = require("@azure/identity");
const { initApiTracing, withTraceSpan } = require("../lib/tracing");
const {
  jsonResponse,
  toStringSafe,
  getRequiredEnv,
  normalizeEndpoint,
  generateId,
  hashContent,
  readJsonBody,
  fetchJson,
  extractAssistantText,
  getApiVersion,
  getTimeoutMs,
  rateLimit,
} = require("../lib/azure-ai-utils");

module.exports = async function narrate(context, req) {
  initApiTracing({ serviceName: "void-verse-api" });

  try {
    const requestId = generateId("narrate");
    return await withTraceSpan(
      "api.narrate",
      { "app.request_id": requestId },
      async () => {
    const projectEndpoint = getRequiredEnv("FOUNDRY_PROJECT_ENDPOINT");
    const assistantId = getRequiredEnv("NARRATOR_AGENT_ID");
    const foundryApiKey = getRequiredEnv("FOUNDRY_API_KEY");
    const managedIdentityClientId = getRequiredEnv("AZURE_CLIENT_ID");
    const rateLimitPerMin = Number.parseInt(
      getRequiredEnv("NARRATE_RATE_LIMIT_PER_MIN") || "0",
      10,
    );

    const missing = [
      ["FOUNDRY_PROJECT_ENDPOINT", projectEndpoint],
      ["NARRATOR_AGENT_ID", assistantId],
    ]
      .filter(([, v]) => !v)
      .map(([k]) => k);

    if (missing.length) {
      context.res = jsonResponse(500, {
        ok: false,
        errorCode: "MISSING_ENV",
        message: `Missing environment variables: ${missing.join(", ")}`,
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
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const instruction =
      prompt ||
      `Narrate the next scene based on: ${JSON.stringify(body || {})}`;
    const endpointBase = normalizeEndpoint(projectEndpoint);
    const apiVersion = getApiVersion();

    let token = "";
    if (!foundryApiKey) {
      const credential = managedIdentityClientId
        ? new DefaultAzureCredential({ managedIdentityClientId })
        : new DefaultAzureCredential();

      const tokenResult = await credential.getToken(
        "https://ai.azure.com/.default",
      );
      token = tokenResult?.token || "";
      if (!token) {
        context.res = jsonResponse(500, {
          ok: false,
          errorCode: "TOKEN_FAILURE",
          message:
            "Token acquisition failed. Configure FOUNDRY_API_KEY or sign in to Azure.",
        });
        return;
      }
    }

    const thread = await fetchJson(
      `${endpointBase}/threads?api-version=${apiVersion}`,
      {
        method: "POST",
        token,
        apiKey: foundryApiKey || undefined,
        body: {},
        retries: 2,
      },
    );

    const threadId = thread?.id;
    if (!threadId) {
      context.res = jsonResponse(500, {
        ok: false,
        errorCode: "THREAD_CREATE_FAILED",
        message: "Failed to create thread.",
      });
      return;
    }

    await fetchJson(
      `${endpointBase}/threads/${encodeURIComponent(threadId)}/messages?api-version=${apiVersion}`,
      {
        method: "POST",
        token,
        apiKey: foundryApiKey || undefined,
        body: { role: "user", content: instruction },
        retries: 2,
      },
    );

    const run = await fetchJson(
      `${endpointBase}/threads/${encodeURIComponent(threadId)}/runs?api-version=${apiVersion}`,
      {
        method: "POST",
        token,
        apiKey: foundryApiKey || undefined,
        body: { assistant_id: assistantId },
        retries: 2,
      },
    );

    const runId = run?.id;
    if (!runId) {
      context.res = jsonResponse(500, {
        ok: false,
        errorCode: "RUN_START_FAILED",
        message: "Failed to start agent run.",
      });
      return;
    }

    const timeoutMs = getTimeoutMs(
      "NARRATE_RUN_TIMEOUT_MS",
      getTimeoutMs("AZURE_AI_RUN_TIMEOUT_MS", 60000),
    );
    const startedAt = Date.now();
    let currentRun = run;
    let sleepMs = 500;

    while (true) {
      const status = currentRun?.status;
      if (status === "completed") break;

      if (status === "requires_action") {
        context.res = jsonResponse(502, {
          ok: false,
          errorCode: "RUN_REQUIRES_ACTION",
          message:
            "Agent run requires action (tool calls) which this endpoint does not support.",
          threadId,
          runId,
        });
        return;
      }

      if (
        status === "failed" ||
        status === "cancelled" ||
        status === "expired"
      ) {
        context.res = jsonResponse(500, {
          ok: false,
          errorCode: "RUN_FAILED",
          message: `Agent run ended with status: ${status}`,
        });
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        context.res = jsonResponse(504, {
          ok: false,
          errorCode: "RUN_TIMEOUT",
          message: "Agent run timeout.",
          threadId,
          runId,
        });
        return;
      }

      await new Promise((r) => setTimeout(r, sleepMs));
      sleepMs = Math.min(1500, Math.floor(sleepMs * 1.2));

      currentRun = await fetchJson(
        `${endpointBase}/threads/${encodeURIComponent(threadId)}/runs/${encodeURIComponent(runId)}?api-version=${apiVersion}`,
        {
          method: "GET",
          token,
          apiKey: foundryApiKey || undefined,
          retries: 2,
        },
      );
    }

    const messages = await fetchJson(
      `${endpointBase}/threads/${encodeURIComponent(threadId)}/messages?api-version=${apiVersion}`,
      {
        method: "GET",
        token,
        apiKey: foundryApiKey || undefined,
        retries: 2,
      },
    );

    const assistantText = extractAssistantText(messages);
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
      `narrate ${requestId} assistant=${assistantId} thread=${threadId} run=${runId} status=${currentRun?.status}`,
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
      status === 504 || error?.code === "FOUNDRY_REQUEST_TIMEOUT"
        ? "UPSTREAM_TIMEOUT"
        : "UNEXPECTED_ERROR";
    const responseBody = {
      ok: false,
      errorCode,
      message: String(error?.message || error || "Unknown error"),
    };
    if (typeof error?.detail !== "undefined") {
      responseBody.detail = error.detail;
    }
    context.res = jsonResponse(status, responseBody);
  }
};
