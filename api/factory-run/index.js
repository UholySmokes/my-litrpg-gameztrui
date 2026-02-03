const { DefaultAzureCredential } = require("@azure/identity"); 
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
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

function clampInt(value, min, max, fallback) { 
  const parsed = Number.parseInt(String(value), 10); 
  if (!Number.isFinite(parsed)) return fallback; 
  return Math.min(max, Math.max(min, parsed)); 
} 

const draftsStorePath =
  process.env.FACTORY_DRAFTS_PATH ||
  path.resolve(__dirname, "..", "factory-drafts.json");

function nowIso() {
  return new Date().toISOString();
}


function readDrafts() {
  try {
    const raw = fs.readFileSync(draftsStorePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDrafts(drafts) {
  fs.writeFileSync(draftsStorePath, JSON.stringify(drafts, null, 2));
}

function saveDraft(entry) {
  const drafts = readDrafts();
  drafts.unshift(entry);
  writeDrafts(drafts.slice(0, 200));
  return entry;
}

function updateDraftStatus(draftId, status) {
  const drafts = readDrafts();
  const next = drafts.map((draft) =>
    draft.id === draftId ? { ...draft, status, updatedAt: nowIso() } : draft
  );
  writeDrafts(next);
  return next.find((draft) => draft.id === draftId) || null;
}


module.exports = async function factoryRun(context, req) { 
  try { 
    const requestId = generateId("factory");
    const projectEndpoint = getRequiredEnv("FOUNDRY_PROJECT_ENDPOINT"); 
    const assistantId = getRequiredEnv("FACTORY_AGENT_ID"); 
    const managedIdentityClientId = getRequiredEnv("AZURE_CLIENT_ID"); 
    const debug = getRequiredEnv("DEBUG_FACTORY") === "1"; 
    const requireApproval = getRequiredEnv("FACTORY_REQUIRE_APPROVAL") === "1";
    const adminKey = getRequiredEnv("FACTORY_ADMIN_KEY");
    const rateLimitPerMin = Number.parseInt(getRequiredEnv("FACTORY_RATE_LIMIT_PER_MIN") || "0", 10);

    // Azure auth handled by DefaultAzureCredential (CLI/managed identity).
    const missing = [ 
      ["FOUNDRY_PROJECT_ENDPOINT", projectEndpoint], 
      ["FACTORY_AGENT_ID", assistantId] 
    ].filter(([, v]) => !v).map(([k]) => k); 

    if (missing.length) { 
      context.res = jsonResponse(500, { ok: false, errorCode: "MISSING_ENV", message: `Missing environment variables: ${missing.join(", ")}` }); 
      return; 
    } 

    const body = await readJsonBody(req); 
    const action = typeof body?.action === "string" ? body.action : "";
    if (action === "approve") {
      const draftId = typeof body?.draftId === "string" ? body.draftId : "";
      const providedKey = toStringSafe(req?.headers?.["x-admin-key"] || body?.adminKey).trim();
      if (!draftId) {
        context.res = jsonResponse(400, { ok: false, errorCode: "MISSING_DRAFT_ID", message: "draftId is required." });
        return;
      }
      if (adminKey) {
        const providedBuffer = Buffer.from(providedKey || "");
        const adminBuffer = Buffer.from(adminKey);
        const isMatch =
          providedBuffer.length === adminBuffer.length &&
          crypto.timingSafeEqual(providedBuffer, adminBuffer);
        if (!isMatch) {
          context.res = jsonResponse(403, { ok: false, errorCode: "FORBIDDEN", message: "Admin approval denied." });
          return;
        }
      }
      const approved = updateDraftStatus(draftId, "approved");
      if (!approved) {
        context.res = jsonResponse(404, { ok: false, errorCode: "DRAFT_NOT_FOUND", message: "Draft not found." });
        return;
      }
      context.res = jsonResponse(200, { ok: true, draft: approved });
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

    const contentTypeInput = toStringSafe(body.contentType).trim(); 
    const contentType = contentTypeInput || "items"; 
    const count = clampInt(body.count, 1, 10, 5); 

    const instruction = `Generate ${count} draft ${contentType} for an early-game underground ruin.`; 
    const endpointBase = normalizeEndpoint(projectEndpoint); 
    const apiVersion = getApiVersion(); 

    const credential = managedIdentityClientId
      ? new DefaultAzureCredential({ managedIdentityClientId })
      : new DefaultAzureCredential(); 
    const tokenResult = await credential.getToken("https://ai.azure.com/.default"); 
    const token = tokenResult?.token; 
    if (!token) { 
      context.res = jsonResponse(500, { ok: false, errorCode: "TOKEN_FAILURE", message: "Token acquisition failed." }); 
      return; 
    } 

    const thread = await fetchJson(`${endpointBase}/threads?api-version=${apiVersion}`, { 
      method: "POST", 
      token, 
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
      body: { role: "user", content: instruction },
      retries: 2 
    }); 

    const run = await fetchJson(`${endpointBase}/threads/${encodeURIComponent(threadId)}/runs?api-version=${apiVersion}`, { 
      method: "POST", 
      token, 
      body: { assistant_id: assistantId },
      retries: 2 
    }); 

    const runId = run?.id; 
    if (!runId) { 
      context.res = jsonResponse(500, { ok: false, errorCode: "RUN_START_FAILED", message: "Failed to start agent run." }); 
      return; 
    } 

    const timeoutMs = getTimeoutMs(
      "FACTORY_RUN_TIMEOUT_MS",
      getTimeoutMs("AZURE_AI_RUN_TIMEOUT_MS", 25000),
    ); 
    const startedAt = Date.now(); 
    let currentRun = run; 
    let sleepMs = 500; 

    while (true) { 
      const status = currentRun?.status; 
      if (status === "completed") break; 

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
          runId 
        }); 
        return; 
      } 

      await new Promise(r => setTimeout(r, sleepMs)); 
      sleepMs = Math.min(1500, Math.floor(sleepMs * 1.2)); 

      currentRun = await fetchJson( 
        `${endpointBase}/threads/${encodeURIComponent(threadId)}/runs/${encodeURIComponent(runId)}?api-version=${apiVersion}`, 
        { method: "GET", token, retries: 2 } 
      ); 
    } 

    const messages = await fetchJson(`${endpointBase}/threads/${encodeURIComponent(threadId)}/messages?api-version=${apiVersion}`, { 
      method: "GET", 
      token,
      retries: 2 
    }); 

    const assistantText = extractAssistantText(messages); 
    const outputHash = hashContent(assistantText);
    const draftStatus = requireApproval ? "pending" : "approved";
    const draft = saveDraft({
      id: generateId("draft"),
      requestId,
      type: contentType,
      status: draftStatus,
      createdAt: nowIso(),
      outputHash,
      output: assistantText
    });

    context.log?.(`factory-run ${requestId} assistant=${assistantId} thread=${threadId} run=${runId} status=${currentRun?.status}`);

    context.res = jsonResponse(200, debug ? { 
      ok: true, 
      contentType, 
      count, 
      assistantText, 
      outputHash,
      draft,
      debug: { instruction, threadId, runId, status: currentRun?.status } 
    } : { 
      ok: true, 
      contentType, 
      count, 
      assistantText,
      outputHash,
      draft 
    }); 
  } catch (error) { 
    context.res = jsonResponse(500, { 
      ok: false, 
      errorCode: "UNEXPECTED_ERROR", 
      message: String(error?.message || error || "Unknown error")
    }); 
  } 
}; 
