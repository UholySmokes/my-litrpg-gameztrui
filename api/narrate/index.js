const { DefaultAzureCredential } = require("@azure/identity");
const crypto = require("crypto");

function jsonResponse(status, body) {
  return {
    status,
    headers: { "Content-Type": "application/json" },
    body,
  };
}

function toStringSafe(value) {
  return typeof value === "string" ? value : "";
}

function getRequiredEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function normalizeEndpoint(endpoint) {
  return endpoint.replace(/\/+$/g, "");
}

const rateLimitState = new Map();

function generateId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

function hashContent(text) {
  return crypto
    .createHash("sha256")
    .update(String(text || ""), "utf8")
    .digest("hex");
}

function rateLimit(key, limit) {
  if (!limit || limit <= 0) return true;
  const now = Date.now();
  const windowMs = 60000;
  const bucket = rateLimitState.get(key) || [];
  const recent = bucket.filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    rateLimitState.set(key, recent);
    return false;
  }
  recent.push(now);
  rateLimitState.set(key, recent);
  return true;
}

async function readJsonBody(req) {
  if (!req) return {};
  if (req.body && typeof req.body === "object" && req.body !== null)
    return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

async function fetchJson(url, { method, token, body, retries }) {
  if (typeof fetch !== "function")
    throw new Error("fetch is not available in this runtime");
  const maxRetries = Number.isFinite(retries) ? retries : 2;
  let attempt = 0;

  while (true) {
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

      if (
        [429, 500, 502, 503, 504].includes(response.status) &&
        attempt < maxRetries
      ) {
        const delay = Math.min(2000, 300 * (attempt + 1));
        await new Promise((r) => setTimeout(r, delay));
        attempt += 1;
        continue;
      }

      throw error;
    }

    return json;
  }
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

    if (typeof content === "string" && content.trim()) return content.trim();

    if (Array.isArray(content)) {
      const parts = [];
      for (const item of content) {
        const textValue = item?.text?.value;
        if (typeof textValue === "string" && textValue.trim())
          parts.push(textValue.trim());
        const directText = item?.text;
        if (typeof directText === "string" && directText.trim())
          parts.push(directText.trim());
      }
      if (parts.length) return parts.join("\n");
    }

    const nestedText = message?.content?.text?.value;
    if (typeof nestedText === "string" && nestedText.trim())
      return nestedText.trim();
  }
  return "";
}

module.exports = async function narrate(context, req) {
  try {
    const requestId = generateId("narrate");
    const projectEndpoint = getRequiredEnv("FOUNDRY_PROJECT_ENDPOINT");
    const assistantId = getRequiredEnv("NARRATOR_AGENT_ID");
    const managedIdentityClientId = getRequiredEnv("AZURE_CLIENT_ID");
    const rateLimitPerMin = Number.parseInt(
      getRequiredEnv("NARRATE_RATE_LIMIT_PER_MIN") || "0",
      10,
    );

    const missing = [
      ["FOUNDRY_PROJECT_ENDPOINT", projectEndpoint],
      ["NARRATOR_AGENT_ID", assistantId],
      ["AZURE_CLIENT_ID", managedIdentityClientId],
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
    if (!rateLimit(clientKey, rateLimitPerMin)) {
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
    const apiVersion = "2025-05-01";

    // ✅ Managed Identity auth (User Assigned)
    const credential = new DefaultAzureCredential({
      managedIdentityClientId,
    });

    const tokenResult = await credential.getToken(
      "https://ai.azure.com/.default",
    );
    const token = tokenResult?.token;
    if (!token) {
      context.res = jsonResponse(500, {
        ok: false,
        errorCode: "TOKEN_FAILURE",
        message: "Token acquisition failed.",
      });
      return;
    }

    const thread = await fetchJson(
      `${endpointBase}/threads?api-version=${apiVersion}`,
      {
        method: "POST",
        token,
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
        body: { role: "user", content: instruction },
        retries: 2,
      },
    );

    const run = await fetchJson(
      `${endpointBase}/threads/${encodeURIComponent(threadId)}/runs?api-version=${apiVersion}`,
      {
        method: "POST",
        token,
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

    const timeoutMs = 25000;
    const startedAt = Date.now();
    let currentRun = run;
    let sleepMs = 500;

    while (true) {
      const status = currentRun?.status;
      if (status === "completed") break;

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
        });
        return;
      }

      await new Promise((r) => setTimeout(r, sleepMs));
      sleepMs = Math.min(1500, Math.floor(sleepMs * 1.2));

      currentRun = await fetchJson(
        `${endpointBase}/threads/${encodeURIComponent(threadId)}/runs/${encodeURIComponent(runId)}?api-version=${apiVersion}`,
        { method: "GET", token, retries: 2 },
      );
    }

    const messages = await fetchJson(
      `${endpointBase}/threads/${encodeURIComponent(threadId)}/messages?api-version=${apiVersion}`,
      {
        method: "GET",
        token,
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
  } catch (error) {
    context.res = jsonResponse(500, {
      ok: false,
      errorCode: "UNEXPECTED_ERROR",
      message: String(error?.message || error || "Unknown error"),
    });
  }
};
