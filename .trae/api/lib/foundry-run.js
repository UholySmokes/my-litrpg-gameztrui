// =================================================================
// FOUNDRY RUN — shared thread/message/run lifecycle for Foundry agents
// =================================================================

const { DefaultAzureCredential } = require("@azure/identity");
const {
  getRequiredEnv,
  normalizeEndpoint,
  fetchJson,
  extractAssistantText,
  getApiVersion,
  getTimeoutMs,
} = require("./azure-ai-utils");

/**
 * Resolves Foundry auth credentials (API key or managed-identity token).
 * @returns {{ token: string, apiKey: string|undefined }}
 */
async function resolveFoundryAuth() {
  const foundryApiKey = getRequiredEnv("FOUNDRY_API_KEY");
  const managedIdentityClientId = getRequiredEnv("AZURE_CLIENT_ID");

  if (foundryApiKey) {
    return { token: "", apiKey: foundryApiKey };
  }

  const credential = managedIdentityClientId
    ? new DefaultAzureCredential({ managedIdentityClientId })
    : new DefaultAzureCredential();

  const tokenResult = await credential.getToken(
    "https://ai.azure.com/.default",
  );
  const token = tokenResult?.token || "";
  if (!token) {
    const error = new Error(
      "Token acquisition failed. Configure FOUNDRY_API_KEY or sign in to Azure.",
    );
    error.code = "TOKEN_FAILURE";
    error.status = 500;
    throw error;
  }
  return { token, apiKey: undefined };
}

/**
 * Creates a Foundry thread, adds a user message, and starts an agent run.
 * Returns immediately with { threadId, runId, status }.
 */
async function startFoundryRun(instruction, assistantId) {
  const projectEndpoint = getRequiredEnv("FOUNDRY_PROJECT_ENDPOINT");
  if (!projectEndpoint) {
    throw Object.assign(
      new Error("Missing FOUNDRY_PROJECT_ENDPOINT"),
      { code: "MISSING_ENV", status: 500 },
    );
  }
  const endpointBase = normalizeEndpoint(projectEndpoint);
  const apiVersion = getApiVersion();
  const auth = await resolveFoundryAuth();

  // Create thread
  const thread = await fetchJson(
    `${endpointBase}/threads?api-version=${apiVersion}`,
    { method: "POST", ...auth, body: {}, retries: 2 },
  );
  const threadId = thread?.id;
  if (!threadId) {
    throw Object.assign(new Error("Failed to create thread."), {
      code: "THREAD_CREATE_FAILED",
      status: 500,
    });
  }

  // Add user message
  await fetchJson(
    `${endpointBase}/threads/${encodeURIComponent(threadId)}/messages?api-version=${apiVersion}`,
    {
      method: "POST",
      ...auth,
      body: { role: "user", content: instruction },
      retries: 2,
    },
  );

  // Start run
  const run = await fetchJson(
    `${endpointBase}/threads/${encodeURIComponent(threadId)}/runs?api-version=${apiVersion}`,
    {
      method: "POST",
      ...auth,
      body: { assistant_id: assistantId },
      retries: 2,
    },
  );
  const runId = run?.id;
  if (!runId) {
    throw Object.assign(new Error("Failed to start agent run."), {
      code: "RUN_START_FAILED",
      status: 500,
    });
  }

  return { threadId, runId, status: run.status || "queued" };
}

/**
 * Checks the current status of a Foundry run.
 * If completed, fetches assistant text.
 * If still running, attempts to fetch partial text (best-effort).
 * @returns {{ status: string, text: string, done: boolean, error?: string }}
 */
async function pollFoundryRun(threadId, runId) {
  const projectEndpoint = getRequiredEnv("FOUNDRY_PROJECT_ENDPOINT");
  const endpointBase = normalizeEndpoint(projectEndpoint);
  const apiVersion = getApiVersion();
  const auth = await resolveFoundryAuth();

  const run = await fetchJson(
    `${endpointBase}/threads/${encodeURIComponent(threadId)}/runs/${encodeURIComponent(runId)}?api-version=${apiVersion}`,
    { method: "GET", ...auth, retries: 2 },
  );
  const statusRaw = run?.status || "unknown";
  const status = String(statusRaw).trim().toLowerCase();

  // Treat "incomplete" as terminal. Azure AI Foundry / Assistants-style APIs can
  // report "incomplete" when the run ends early (token limit, filtering, etc).
  // Leaving it as "in progress" causes the streaming client to poll forever.
  if (["failed", "cancelled", "expired"].includes(status)) {
    return {
      status: statusRaw,
      text: "",
      done: true,
      error: `Run ended with status: ${status}`,
    };
  }

  if (status === "requires_action") {
    return {
      status: statusRaw,
      text: "",
      done: true,
      error: "Run requires action (tool calls) not supported.",
    };
  }

  if (status === "completed" || status === "incomplete") {
    const messages = await fetchJson(
      `${endpointBase}/threads/${encodeURIComponent(threadId)}/messages?api-version=${apiVersion}`,
      { method: "GET", ...auth, retries: 2 },
    );
    const text = extractAssistantText(messages);
    return { status: statusRaw, text, done: true };
  }

  // Still in progress — try to fetch partial assistant text (best-effort)
  let partialText = "";
  try {
    const messages = await fetchJson(
      `${endpointBase}/threads/${encodeURIComponent(threadId)}/messages?api-version=${apiVersion}`,
      { method: "GET", ...auth, retries: 1 },
    );
    partialText = extractAssistantText(messages);
  } catch {
    // Partial text fetch is best-effort; swallow errors
  }

  return { status: statusRaw, text: partialText, done: false };
}

/**
 * Polls a Foundry run until completion (synchronous/blocking version).
 * Used by the traditional POST /api/narrate endpoint.
 * @returns {{ status: string, text: string }}
 */
async function awaitFoundryRun(threadId, runId, { timeoutMs } = {}) {
  const projectEndpoint = getRequiredEnv("FOUNDRY_PROJECT_ENDPOINT");
  const endpointBase = normalizeEndpoint(projectEndpoint);
  const apiVersion = getApiVersion();
  const auth = await resolveFoundryAuth();

  const timeout =
    timeoutMs ||
    getTimeoutMs(
      "NARRATE_RUN_TIMEOUT_MS",
      getTimeoutMs("AZURE_AI_RUN_TIMEOUT_MS", 120000),
    );
  const startedAt = Date.now();
  let sleepMs = 500;

  while (true) {
    const run = await fetchJson(
      `${endpointBase}/threads/${encodeURIComponent(threadId)}/runs/${encodeURIComponent(runId)}?api-version=${apiVersion}`,
      { method: "GET", ...auth, retries: 2 },
    );

    const status = run?.status;

    if (status === "completed" || status === "incomplete") {
      const messages = await fetchJson(
        `${endpointBase}/threads/${encodeURIComponent(threadId)}/messages?api-version=${apiVersion}`,
        { method: "GET", ...auth, retries: 2 },
      );
      return { status, text: extractAssistantText(messages) };
    }

    if (status === "requires_action") {
      throw Object.assign(
        new Error(
          "Run requires action (tool calls) which this endpoint does not support.",
        ),
        { code: "RUN_REQUIRES_ACTION", status: 502, threadId, runId },
      );
    }

    if (["failed", "cancelled", "expired"].includes(status)) {
      throw Object.assign(
        new Error(`Agent run ended with status: ${status}`),
        { code: "RUN_FAILED", status: 500 },
      );
    }

    if (Date.now() - startedAt > timeout) {
      throw Object.assign(new Error("Agent run timeout."), {
        code: "RUN_TIMEOUT",
        status: 504,
        threadId,
        runId,
      });
    }

    await new Promise((r) => setTimeout(r, sleepMs));
    sleepMs = Math.min(1500, Math.floor(sleepMs * 1.2));
  }
}

module.exports = {
  resolveFoundryAuth,
  startFoundryRun,
  pollFoundryRun,
  awaitFoundryRun,
};
