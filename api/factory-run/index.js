const { ClientSecretCredential } = require("@azure/identity");

function toStringSafe(value) {
  return typeof value === "string" ? value : "";
}

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function jsonResponse(status, body) {
  return {
    status,
    headers: {
      "Content-Type": "application/json",
    },
    body,
  };
}

function getRequiredEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function normalizeEndpoint(endpoint) {
  return endpoint.replace(/\/+$/g, "");
}

async function readJsonBody(req) {
  if (!req) return {};
  if (req.body && typeof req.body === "object" && req.body !== null) return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

async function fetchJson(url, { method, token, body }) {
  if (typeof fetch !== "function") {
    throw new Error("fetch is not available in this runtime");
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const detail = json || text || response.statusText;
    const error = new Error(`Foundry request failed (${response.status})`);
    error.status = response.status;
    error.detail = detail;
    throw error;
  }

  return json;
}

function extractAssistantText(messagesResponse) {
  const data = Array.isArray(messagesResponse?.data)
    ? messagesResponse.data
    : Array.isArray(messagesResponse?.messages)
      ? messagesResponse.messages
      : [];

  for (const message of data) {
    if (message?.role !== "assistant") continue;
    const content = message?.content;

    if (typeof content === "string" && content.trim()) {
      return content.trim();
    }

    if (Array.isArray(content)) {
      const parts = [];
      for (const item of content) {
        const textValue = item?.text?.value;
        if (typeof textValue === "string" && textValue.trim()) {
          parts.push(textValue.trim());
          continue;
        }
        const directText = item?.text;
        if (typeof directText === "string" && directText.trim()) {
          parts.push(directText.trim());
        }
      }
      if (parts.length) return parts.join("\n");
    }

    const nestedText = message?.content?.text?.value;
    if (typeof nestedText === "string" && nestedText.trim()) {
      return nestedText.trim();
    }
  }

  return "";
}

module.exports = async function factoryRun(context, req) {
  try {
    const projectEndpoint = getRequiredEnv("FOUNDRY_PROJECT_ENDPOINT");
    const assistantId = getRequiredEnv("FACTORY_AGENT_ID");
    const tenantId = getRequiredEnv("AZURE_TENANT_ID");
    const clientId = getRequiredEnv("AZURE_CLIENT_ID");
    const clientSecret = getRequiredEnv("AZURE_CLIENT_SECRET");

    const missing = [
      ["FOUNDRY_PROJECT_ENDPOINT", projectEndpoint],
      ["FACTORY_AGENT_ID", assistantId],
      ["AZURE_TENANT_ID", tenantId],
      ["AZURE_CLIENT_ID", clientId],
      ["AZURE_CLIENT_SECRET", clientSecret],
    ]
      .filter(([, v]) => !v)
      .map(([k]) => k);

    if (missing.length) {
      context.res = jsonResponse(500, {
        ok: false,
        error: `Missing environment variables: ${missing.join(", ")}`,
      });
      return;
    }

    const body = await readJsonBody(req);
    const contentTypeInput = toStringSafe(body.contentType).trim();
    const contentType = contentTypeInput || "items";
    const count = clampInt(body.count, 1, 10, 5);

    const instruction = `Generate ${count} draft ${contentType} for an early-game underground ruin.`;
    const endpointBase = normalizeEndpoint(projectEndpoint);
    const apiVersion = "2025-05-01";

    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    let tokenResult;
    try {
      tokenResult = await credential.getToken("https://ai.azure.com/.default");
    } catch (error) {
      context.res = jsonResponse(500, {
        ok: false,
        error: "Token acquisition failed.",
        detail: String(error?.message || error || "Unknown error"),
      });
      return;
    }

    const token = tokenResult?.token;
    if (!token) {
      context.res = jsonResponse(500, {
        ok: false,
        error: "Token acquisition failed.",
        detail: "No access token returned.",
      });
      return;
    }

    const thread = await fetchJson(`${endpointBase}/threads?api-version=${apiVersion}`, {
      method: "POST",
      token,
      body: {},
    });

    const threadId = thread?.id;
    if (!threadId) {
      context.res = jsonResponse(500, {
        ok: false,
        error: "Failed to create thread.",
        detail: thread,
      });
      return;
    }

    await fetchJson(
      `${endpointBase}/threads/${encodeURIComponent(threadId)}/messages?api-version=${apiVersion}`,
      {
        method: "POST",
        token,
        body: {
          role: "user",
          content: instruction,
        },
      },
    );

    const run = await fetchJson(
      `${endpointBase}/threads/${encodeURIComponent(threadId)}/runs?api-version=${apiVersion}`,
      {
        method: "POST",
        token,
        body: {
          assistant_id: assistantId,
        },
      },
    );

    const runId = run?.id;
    if (!runId) {
      context.res = jsonResponse(500, {
        ok: false,
        error: "Failed to start agent run.",
        detail: run,
      });
      return;
    }

    const timeoutMs = 25000;
    const startedAt = Date.now();
    let currentRun = run;
    let sleepMs = 500;

    while (true) {
      const status = currentRun?.status;
      if (status === "completed") break;
      if (status === "failed" || status === "cancelled" || status === "expired") {
        context.res = jsonResponse(500, {
          ok: false,
          error: `Agent run ended with status: ${status}`,
          detail: currentRun,
        });
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        context.res = jsonResponse(504, {
          ok: false,
          error: "Agent run timeout.",
          threadId,
          runId,
          status: currentRun?.status,
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
        },
      );
    }

    const messages = await fetchJson(
      `${endpointBase}/threads/${encodeURIComponent(threadId)}/messages?api-version=${apiVersion}`,
      {
        method: "GET",
        token,
      },
    );

    const assistantText = extractAssistantText(messages);

    context.res = jsonResponse(200, {
      ok: true,
      contentType,
      count,
      agentRaw: {
        instruction,
        threadId,
        runId,
        status: currentRun?.status,
        assistantText,
        messages,
      },
    });
  } catch (error) {
    const status = typeof error?.status === "number" ? error.status : 500;
    context.res = jsonResponse(500, {
      ok: false,
      error: "Unexpected error.",
      detail: {
        message: String(error?.message || error || "Unknown error"),
        status,
        response: error?.detail,
      },
    });
  }
};

