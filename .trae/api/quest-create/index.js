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

function parseStrictJson(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const cleaned = trimmed.replace(/```json\s*|\s*```/g, "");
    try {
      return JSON.parse(cleaned);
    } catch {
      const first = cleaned.indexOf("{");
      const last = cleaned.lastIndexOf("}");
      if (first >= 0 && last > first) {
        return JSON.parse(cleaned.slice(first, last + 1));
      }
      throw new Error("Unable to parse JSON payload");
    }
  }
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function ensureQuestId(quest) {
  if (!quest || typeof quest !== "object") return quest;
  if (isNonEmptyString(quest.id)) return quest;
  const base = {
    name: quest.name || "",
    description: quest.description || "",
    objectives: Array.isArray(quest.objectives) ? quest.objectives : []
  };
  const suffix = hashContent(JSON.stringify(base)).slice(0, 12);
  return { ...quest, id: `quest_${suffix}` };
}

function validateQuestSchema(quest) {
  if (!quest || typeof quest !== "object") return "Quest must be an object.";
  if (!isNonEmptyString(quest.id)) return "Quest.id must be a non-empty string.";
  if (!isNonEmptyString(quest.name)) return "Quest.name must be a non-empty string.";
  if (!isNonEmptyString(quest.description)) return "Quest.description must be a non-empty string.";
  if (!Array.isArray(quest.objectives) || quest.objectives.length === 0) {
    return "Quest.objectives must be a non-empty array.";
  }
  for (const objective of quest.objectives) {
    if (!objective || typeof objective !== "object") return "Quest.objectives entries must be objects.";
    if (!isNonEmptyString(objective.id)) return "Quest.objectives.id must be a non-empty string.";
    if (!isNonEmptyString(objective.description)) return "Quest.objectives.description must be a non-empty string.";
    if (objective.completed !== undefined && typeof objective.completed !== "boolean") {
      return "Quest.objectives.completed must be a boolean when provided.";
    }
  }
  if (quest.rewards !== undefined) {
    if (!quest.rewards || typeof quest.rewards !== "object") return "Quest.rewards must be an object when provided.";
    if (quest.rewards.xp !== undefined && typeof quest.rewards.xp !== "number") {
      return "Quest.rewards.xp must be a number when provided.";
    }
    if (quest.rewards.gold !== undefined && typeof quest.rewards.gold !== "number") {
      return "Quest.rewards.gold must be a number when provided.";
    }
    if (quest.rewards.items !== undefined) {
      if (!Array.isArray(quest.rewards.items)) return "Quest.rewards.items must be an array when provided.";
      for (const item of quest.rewards.items) {
        if (!item || typeof item !== "object") return "Quest.rewards.items entries must be objects.";
        if (!isNonEmptyString(item.id)) return "Quest.rewards.items.id must be a non-empty string.";
        if (item.quantity !== undefined && typeof item.quantity !== "number") {
          return "Quest.rewards.items.quantity must be a number when provided.";
        }
      }
    }
  }
  return "";
}

function parseOptionalNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function unwrapQuestPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (
    payload.ok === true &&
    payload.quest &&
    typeof payload.quest === "object" &&
    !Array.isArray(payload.quest)
  ) {
    return payload.quest;
  }
  return payload;
}

function normalizeQuestAgentOutput(payload) {
  const quest = unwrapQuestPayload(payload);
  if (!quest || typeof quest !== "object" || Array.isArray(quest)) return null;

  const normalized = { ...quest };

  if (!isNonEmptyString(normalized.name) && isNonEmptyString(normalized.title)) {
    normalized.name = normalized.title;
  }
  if (
    !isNonEmptyString(normalized.description) &&
    isNonEmptyString(normalized.summary)
  ) {
    normalized.description = normalized.summary;
  }

  const objectives = Array.isArray(normalized.objectives)
    ? normalized.objectives
    : [];
  normalized.objectives = objectives
    .filter((objective) => objective && typeof objective === "object" && !Array.isArray(objective))
    .map((objective) => {
      const mapped = { ...objective };
      if (!isNonEmptyString(mapped.description) && isNonEmptyString(mapped.text)) {
        mapped.description = mapped.text;
      }
      if (!isNonEmptyString(mapped.id) && isNonEmptyString(mapped.description)) {
        mapped.id = `obj_${hashContent(mapped.description).slice(0, 12)}`;
      }
      return mapped;
    });

  if (normalized.rewards && typeof normalized.rewards === "object") {
    const rewards = { ...normalized.rewards };
    const xp = parseOptionalNumber(rewards.xp);
    const gold = parseOptionalNumber(rewards.gold);
    if (xp !== undefined) rewards.xp = xp;
    if (gold !== undefined) rewards.gold = gold;

    if (Array.isArray(rewards.items)) {
      rewards.items = rewards.items
        .filter((item) => item && typeof item === "object" && !Array.isArray(item))
        .map((item) => {
          const mapped = { ...item };
          const qty = parseOptionalNumber(mapped.quantity);
          const altQty = parseOptionalNumber(mapped.qty);
          if (qty !== undefined) mapped.quantity = qty;
          else if (altQty !== undefined) mapped.quantity = altQty;

          if (!isNonEmptyString(mapped.id)) {
            const nameForId = isNonEmptyString(mapped.name)
              ? mapped.name
              : JSON.stringify(mapped);
            mapped.id = `item_${hashContent(nameForId).slice(0, 12)}`;
          }
          return mapped;
        });
    }

    normalized.rewards = rewards;
  }

  return normalized;
}

module.exports = async function questCreate(context, req) {
  initApiTracing({ serviceName: "void-verse-api" });

  try {
    const requestId = generateId("quest");
    return await withTraceSpan(
      "api.quest-create",
      { "app.request_id": requestId },
      async () => {
    const projectEndpoint = getRequiredEnv("FOUNDRY_PROJECT_ENDPOINT");
    const assistantId = getRequiredEnv("QUEST_AGENT_ID");
    const foundryApiKey = getRequiredEnv("FOUNDRY_API_KEY");
    const managedIdentityClientId = getRequiredEnv("AZURE_CLIENT_ID");
    const rateLimitPerMin = Number.parseInt(getRequiredEnv("QUEST_RATE_LIMIT_PER_MIN") || "0", 10);

    // Azure auth handled by DefaultAzureCredential (CLI/managed identity).
    const missing = [
      ["FOUNDRY_PROJECT_ENDPOINT", projectEndpoint],
      ["QUEST_AGENT_ID", assistantId]
    ].filter(([, v]) => !v).map(([k]) => k);

    if (missing.length) {
      context.res = jsonResponse(500, { ok: false, errorCode: "MISSING_ENV", message: `Missing environment variables: ${missing.join(", ")}` });
      return;
    }

    const clientKey = toStringSafe(req?.headers?.["x-forwarded-for"] || req?.headers?.["x-client-id"] || "anonymous");
    const canProceed = await rateLimit(clientKey, rateLimitPerMin, {
      logger: context?.log?.bind(context),
    });
    if (!canProceed) {
      context.res = jsonResponse(429, { ok: false, errorCode: "RATE_LIMITED", message: "Rate limit exceeded." });
      return;
    }

    const body = await readJsonBody(req);
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const instruction = prompt
      ? prompt
      : `Create a quest JSON for the following request: ${JSON.stringify(body || {})}`;
    const endpointBase = normalizeEndpoint(projectEndpoint);
    const apiVersion = getApiVersion();

    let token = "";
    if (!foundryApiKey) {
      const credential = managedIdentityClientId
        ? new DefaultAzureCredential({ managedIdentityClientId })
        : new DefaultAzureCredential();
      const tokenResult = await credential.getToken("https://ai.azure.com/.default");
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

    const thread = await fetchJson(`${endpointBase}/threads?api-version=${apiVersion}`, {
      method: "POST",
      token,
      apiKey: foundryApiKey || undefined,
      body: {},
      retries: 2
    });

    const threadId = thread?.id;
    if (!threadId) {
      context.res = jsonResponse(500, { ok: false, errorCode: "THREAD_CREATE_FAILED", message: "Failed to create thread." });
      return;
    }

    await fetchJson(`${endpointBase}/threads/${encodeURIComponent(threadId)}/messages?api-version=${apiVersion}`, {
      method: "POST",
      token,
      apiKey: foundryApiKey || undefined,
      body: { role: "user", content: instruction },
      retries: 2
    });

    const run = await fetchJson(`${endpointBase}/threads/${encodeURIComponent(threadId)}/runs?api-version=${apiVersion}`, {
      method: "POST",
      token,
      apiKey: foundryApiKey || undefined,
      body: { assistant_id: assistantId },
      retries: 2
    });

    const runId = run?.id;
    if (!runId) {
      context.res = jsonResponse(500, { ok: false, errorCode: "RUN_START_FAILED", message: "Failed to start agent run." });
      return;
    }

    const timeoutMs = getTimeoutMs(
      "QUEST_RUN_TIMEOUT_MS",
      getTimeoutMs("AZURE_AI_RUN_TIMEOUT_MS", 25000),
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

      if (status === "failed" || status === "cancelled" || status === "expired") {
        context.res = jsonResponse(500, { ok: false, errorCode: "RUN_FAILED", message: `Agent run ended with status: ${status}` });
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

      await new Promise(r => setTimeout(r, sleepMs));
      sleepMs = Math.min(1500, Math.floor(sleepMs * 1.2));

      currentRun = await fetchJson(
        `${endpointBase}/threads/${encodeURIComponent(threadId)}/runs/${encodeURIComponent(runId)}?api-version=${apiVersion}`,
        {
          method: "GET",
          token,
          apiKey: foundryApiKey || undefined,
          retries: 2,
        }
      );
    }

    const messages = await fetchJson(`${endpointBase}/threads/${encodeURIComponent(threadId)}/messages?api-version=${apiVersion}`, {
      method: "GET",
      token,
      apiKey: foundryApiKey || undefined,
      retries: 2
    });

    const assistantText = extractAssistantText(messages);
    const outputHash = hashContent(assistantText);
    let parsed = null;
    try {
      parsed = parseStrictJson(assistantText);
    } catch {
      parsed = null;
    }

    if (!parsed || typeof parsed !== "object") {
      context.res = jsonResponse(502, { ok: false, errorCode: "NON_JSON_OUTPUT", message: "QuestAgent returned non-JSON output." });
      return;
    }

    const questPayload = normalizeQuestAgentOutput(parsed);
    if (!questPayload) {
      context.res = jsonResponse(422, {
        ok: false,
        errorCode: "INVALID_SCHEMA",
        message: "Quest response missing quest payload.",
      });
      return;
    }

    const normalizedQuest = ensureQuestId(questPayload);
    const schemaError = validateQuestSchema(normalizedQuest);
    if (schemaError) {
      context.res = jsonResponse(422, { ok: false, errorCode: "INVALID_SCHEMA", message: schemaError });
      return;
    }

    context.log?.(`quest-create ${requestId} assistant=${assistantId} thread=${threadId} run=${runId} status=${currentRun?.status}`);

    context.res = jsonResponse(200, { ok: true, quest: normalizedQuest, outputHash });
      },
    );
  } catch (error) {
    context.res = jsonResponse(500, {
      ok: false,
      errorCode: "UNEXPECTED_ERROR",
      message: String(error?.message || error || "Unknown error")
    });
  }
};

