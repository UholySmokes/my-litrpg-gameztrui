import { handleCors, jsonResponse, jsonErrorResponse, readJsonBody } from "../_shared/http.ts";
import { requireAuthenticatedUser, getNarrationUser, getUserFromRequest } from "../_shared/auth-helper.ts";
import { listAgents, runAgent, AgentError, InvalidAgentError } from "../_shared/agents.ts";
import * as bulkGenService from "../_shared/bulk-gen-service.ts";
import { normalizeString } from "../_shared/db.ts";

async function sha256Hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(String(text || ""));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  // CORS
  if (handleCors(req, headers)) {
    return new Response(null, { status: 204, headers });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/functions\/v1\/api/, "").replace(/\/+/g, "/") || "/";
  const method = req.method.toUpperCase();

  try {
    // ── Health ──────────────────────────────────────
    if (path === "/health" && method === "GET") {
      return jsonResponse({
        ok: true,
        service: "void-verse-edge-api",
      }, 200, Object.fromEntries(headers));
    }

    // ── Agents list ─────────────────────────────────
    if (path === "/agents" && method === "GET") {
      const auth = await requireAuthenticatedUser(req, Object.fromEntries(headers));
      if ("error" in auth) return auth.error;

      return jsonResponse({
        ok: true,
        provider: "void-verse-edge",
        agents: listAgents(),
      }, 200, Object.fromEntries(headers));
    }

    // ── Agents run ──────────────────────────────────
    if (path === "/agents/run" && method === "POST") {
      const auth = await requireAuthenticatedUser(req, Object.fromEntries(headers));
      if ("error" in auth) return auth.error;

      const body = await readJsonBody(req);
      const agent = typeof body?.agent === "string" ? body.agent.trim() : "";
      if (!agent) {
        return jsonErrorResponse("MISSING_AGENT", "Request body must include an 'agent' field.", 400, {}, Object.fromEntries(headers));
      }

      const hasInputField = Object.prototype.hasOwnProperty.call(body || {}, "input");
      const input = hasInputField
        ? body.input
        : { ...body, agent: undefined, model: undefined, temperature: undefined, topP: undefined };

      const result = await runAgent({
        agent,
        input: input as Record<string, unknown> | undefined,
        model: body?.model as string | undefined,
        temperature: body?.temperature as number | undefined,
        topP: body?.topP as number | undefined,
      });

      const responseBody: Record<string, unknown> = {
        ok: true,
        provider: "void-verse-edge",
        backend: result.backend,
        fallbackUsed: result.fallbackUsed,
        fallbackFrom: result.fallbackFrom,
        agent: result.agent,
        agentName: result.agentName,
        model: result.model,
        temperature: result.temperature,
        text: result.text,
        outputHash: await sha256Hex(result.text),
      };

      if (result.structured) {
        responseBody.structured = result.structured;
      }

      return jsonResponse(responseBody, 200, Object.fromEntries(headers));
    }

    // ── Narrate (sync) ─────────────────────────────
    if ((path === "/narrate" || path === "/story/event") && method === "POST") {
      const body = await readJsonBody(req);
      await getNarrationUser(req);

      const result = await runAgent({
        agent: resolveNarratorAgentId(body?.mode as string | undefined),
        input: {
          prompt: body?.prompt || `Narrate the next scene based on: ${JSON.stringify(body || {})}`,
          mode: body?.mode || "exploration",
          game_state: body?.gameState || body?.game_state,
          npc_context: body?.npcContext || body?.npc_context,
          reaction_context: body?.reactionContext || body?.reaction_context,
        },
        model: body?.model as string | undefined,
        temperature: body?.temperature as number | undefined,
        topP: body?.topP as number | undefined,
      });

      return jsonResponse({
        ok: true,
        story: result.text,
        narrative: result.text,
        mood: inferMood(result.text),
        suggestions: buildDefaultSuggestions(String(body?.mode || "exploration")),
        outputHash: await sha256Hex(result.text),
        mode: body?.mode || "exploration",
        agentId: result.agent,
        backend: result.backend,
        provider: "void-verse-edge",
        fallbackUsed: result.fallbackUsed,
        fallbackFrom: result.fallbackFrom,
        model: result.model,
        status: "completed",
      }, 200, Object.fromEntries(headers));
    }

    // ── Narrate-start (async) ──────────────────────
    if ((path === "/narrate-start" || path === "/story/start") && method === "POST") {
      const body = await readJsonBody(req);
      await getNarrationUser(req);

      const result = await runAgent({
        agent: resolveNarratorAgentId(body?.mode as string | undefined),
        input: {
          prompt: body?.prompt || `Narrate the next scene based on: ${JSON.stringify(body || {})}`,
          mode: body?.mode || "exploration",
          game_state: body?.gameState || body?.game_state,
          npc_context: body?.npcContext || body?.npc_context,
          reaction_context: body?.reactionContext || body?.reaction_context,
        },
        model: body?.model as string | undefined,
        temperature: body?.temperature as number | undefined,
        topP: body?.topP as number | undefined,
      });

      return jsonResponse({
        ok: true,
        threadId: crypto.randomUUID(),
        runId: crypto.randomUUID(),
        status: "completed",
        done: true,
        story: result.text,
        narrative: result.text,
        mood: inferMood(result.text),
        suggestions: buildDefaultSuggestions(String(body?.mode || "exploration")),
        outputHash: await sha256Hex(result.text),
        backend: result.backend,
        provider: "void-verse-edge",
        fallbackUsed: result.fallbackUsed,
        model: result.model,
        mode: body?.mode || "exploration",
        agentId: result.agent,
      }, 200, Object.fromEntries(headers));
    }

    // ── Narrate-poll ───────────────────────────────
    if ((path === "/narrate-poll" || path === "/story/poll") && method === "GET") {
      const threadId = url.searchParams.get("threadId");
      const runId = url.searchParams.get("runId");

      if (!threadId || !runId) {
        return jsonErrorResponse("MISSING_PARAMS", "threadId and runId query parameters are required.", 400, {}, Object.fromEntries(headers));
      }

      // For the initial Edge Function migration, narration runs are synchronous
      // and always complete immediately. Async polling via DB storage is TBD.
      return jsonErrorResponse("RUN_NOT_FOUND", "Async narration runs not yet persisted in Edge runtime.", 404, {}, Object.fromEntries(headers));
    }

    // ── Bulk Gen: Run Start ─────────────────────────
    if (path === "/bulk-gen/run/start" && method === "POST") {
      const user = await requireBulkGenOperator(req, headers);
      if ("error" in user) return user.error;

      const body = await readJsonBody(req);
      const run = await bulkGenService.startBulkGenerationRun({
        ownerId: user.user.id,
        body,
      });
      return jsonResponse({
        ok: true,
        runId: run.run_id,
        status: run.status,
        maxTasks: run.max_tasks,
        maxEstimatedEur: run.max_estimated_eur,
        expiresAt: run.expires_at,
      }, 200, Object.fromEntries(headers));
    }

    // ── Bulk Gen: Run Tick ──────────────────────────
    if (path === "/bulk-gen/run/tick" && method === "POST") {
      if (!hasValidInternalToken(req)) {
        const auth = await requireBulkGenOperator(req, headers);
        if ("error" in auth) return auth.error;
      }

      const body = await readJsonBody(req);
      const result = await bulkGenService.tickBulkGenerationRun({
        runId: body?.runId as string,
        workerId: (body?.workerId as string) || "manual",
        limit: body?.limit as number | undefined,
      });
      return jsonResponse(result, 200, Object.fromEntries(headers));
    }

    // ── Bulk Gen: Run Status ────────────────────────
    if (path === "/bulk-gen/run/status" && method === "GET") {
      const user = await requireBulkGenOperator(req, headers);
      if ("error" in user) return user.error;

      const runId = url.searchParams.get("runId");
      if (!runId) {
        return jsonErrorResponse("MISSING_RUN_ID", "runId query parameter is required.", 400, {}, Object.fromEntries(headers));
      }

      const status = await bulkGenService.getRunStatus(runId, url.searchParams.get("outputLimit") as string);
      if (!status) {
        return jsonErrorResponse("RUN_NOT_FOUND", "Run not found.", 404, {}, Object.fromEntries(headers));
      }
      return jsonResponse({ ok: true, run: status.run, stats: status.stats, outputs: status.outputs }, 200, Object.fromEntries(headers));
    }

    // ── Bulk Gen: Run Pause ─────────────────────────
    if (path === "/bulk-gen/run/pause" && method === "POST") {
      const user = await requireBulkGenOperator(req, headers);
      if ("error" in user) return user.error;

      const body = await readJsonBody(req);
      const runId = body?.runId as string;
      if (!runId) {
        return jsonErrorResponse("MISSING_RUN_ID", "runId is required.", 400, {}, Object.fromEntries(headers));
      }

      const run = await bulkGenService.pauseRun(runId, body?.reason as string);
      if (!run) {
        return jsonErrorResponse("RUN_NOT_FOUND", "Run not found.", 404, {}, Object.fromEntries(headers));
      }
      return jsonResponse({ ok: true, run }, 200, Object.fromEntries(headers));
    }

    // ── Bulk Gen: Run Resume ────────────────────────
    if (path === "/bulk-gen/run/resume" && method === "POST") {
      const user = await requireBulkGenOperator(req, headers);
      if ("error" in user) return user.error;

      const body = await readJsonBody(req);
      const runId = body?.runId as string;
      if (!runId) {
        return jsonErrorResponse("MISSING_RUN_ID", "runId is required.", 400, {}, Object.fromEntries(headers));
      }

      const run = await bulkGenService.resumeRun(runId);
      if (!run) {
        return jsonErrorResponse("RUN_NOT_FOUND", "Run not found.", 404, {}, Object.fromEntries(headers));
      }
      return jsonResponse({ ok: true, run }, 200, Object.fromEntries(headers));
    }

    // ── Bulk Gen: Style Upsert ──────────────────────
    if (path === "/bulk-gen/style" && method === "POST") {
      const user = await requireBulkGenOperator(req, headers);
      if ("error" in user) return user.error;

      const body = await readJsonBody(req);
      const profile = await bulkGenService.upsertStyleProfile(body);
      return jsonResponse({ ok: true, profile }, 200, Object.fromEntries(headers));
    }

    // ── Bulk Gen: Budget Alert ──────────────────────
    if (path === "/bulk-gen/budget-alert" && method === "POST") {
      if (!requireInternalToken(req)) {
        return jsonErrorResponse("UNAUTHORIZED_INTERNAL_CALL", "Missing or invalid internal token.", 401, {}, Object.fromEntries(headers));
      }

      const body = await readJsonBody(req);
      const result = await bulkGenService.handleBudgetAlert(body);
      return jsonResponse(result, 200, Object.fromEntries(headers));
    }

    // ── Catch-all: 404 ─────────────────────────────
    return jsonErrorResponse("NOT_FOUND", `No route for ${method} ${path}`, 404, {}, Object.fromEntries(headers));
  } catch (error) {
    if (error instanceof InvalidAgentError) {
      return jsonErrorResponse("INVALID_AGENT", error.message, 400, {
        allowedAgents: error.allowedAgents,
      }, Object.fromEntries(headers));
    }
    if (error instanceof AgentError) {
      return jsonErrorResponse(error.code, error.message, error.status || 500, {
        ...(error.allowedAgents ? { allowedAgents: error.allowedAgents } : {}),
        ...(error.allowedModels ? { allowedModels: error.allowedModels } : {}),
      }, Object.fromEntries(headers));
    }

    const message = String(error?.message || error || "Unknown error");
    return jsonErrorResponse("UNEXPECTED_ERROR", message, 500, {}, Object.fromEntries(headers));
  }
});

// ─── Helpers ported from handlers.js ────────────────────

const MOOD_PATTERNS: Array<{ mood: string; patterns: RegExp[] }> = [
  { mood: "tense", patterns: [/danger/i, /threat/i, /ambush/i, /attack/i, /enemy/i, /looming/i] },
  { mood: "triumphant", patterns: [/victory/i, /triumph/i, /succeed/i, /conquer/i, /glory/i, /reward/i] },
  { mood: "mysterious", patterns: [/strange/i, /mystery/i, /whisper/i, /shadow/i, /ancient/i, /secret/i, /hidden/i] },
  { mood: "serene", patterns: [/calm/i, /peace/i, /gentle/i, /rest/i, /quiet/i, /warm/i, /soft/i] },
  { mood: "desperate", patterns: [/flee/i, /escape/i, /wound/i, /bleed/i, /dying/i, /last/i, /barely/i] },
];

function inferMood(text: string): string {
  const value = typeof text === "string" ? text : "";
  if (!value.trim()) return "neutral";
  for (const { mood, patterns } of MOOD_PATTERNS) {
    if (patterns.some((p) => p.test(value))) return mood;
  }
  return "neutral";
}

const MODES: Record<string, string> = {
  exploration: "exploration",
  combat: "combat",
  dialogue: "dialogue",
  "system-event": "system-event",
  "scene-transition": "scene-transition",
};

function normalizeMode(mode: string): string {
  const raw = typeof mode === "string" ? mode.trim().toLowerCase() : "";
  return raw && MODES[raw] ? raw : MODES.exploration;
}

function resolveNarratorAgentId(mode?: string): string {
  const normalized = normalizeMode(mode || "");
  if (normalized === "combat") return "combat";
  if (normalized === "dialogue") return "dialogue";
  if (normalized === "system-event") return "system";
  if (normalized === "scene-transition") return "world";
  return "narrator";
}

function buildDefaultSuggestions(mode: string): Array<{ t: string; w: number }> {
  const normalized = normalizeMode(mode);
  if (normalized === "combat") {
    return [
      { t: "attack enemy", w: 1 },
      { t: "use skill", w: 0.95 },
      { t: "drink potion", w: 0.8 },
    ];
  }
  if (normalized === "dialogue") {
    return [
      { t: "ask a question", w: 1 },
      { t: "negotiate", w: 0.85 },
      { t: "leave politely", w: 0.7 },
    ];
  }
  if (normalized === "scene-transition") {
    return [
      { t: "look around", w: 1 },
      { t: "check quests", w: 0.85 },
      { t: "talk to locals", w: 0.8 },
    ];
  }
  return [
    { t: "explore area", w: 1 },
    { t: "check status", w: 0.9 },
    { t: "open inventory", w: 0.85 },
  ];
}

// ─── Bulk-gen auth helpers (ported from bulk-generation-handlers.js) ──

function parseCsvList(value: string): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function safeTokenMatch(expected: string, received: string): boolean {
  const encoder = new TextEncoder();
  const lhs = encoder.encode(String(expected || ""));
  const rhs = encoder.encode(String(received || ""));
  if (lhs.length === 0 || rhs.length === 0 || lhs.length !== rhs.length) return false;

  let result = 0;
  for (let i = 0; i < lhs.length; i++) {
    result |= lhs[i] ^ rhs[i];
  }
  return result === 0;
}

function hasValidInternalToken(req: Request): boolean {
  const expected = normalizeString(Deno.env.get("BULK_GEN_INTERNAL_TOKEN") || "");
  if (!expected) return false;

  const headerToken =
    normalizeString(req.headers.get("x-bulk-gen-token") || "") ||
    normalizeString(req.headers.get("x-internal-token") || "");
  if (headerToken && safeTokenMatch(expected, headerToken)) return true;

  const authHeader = normalizeString(req.headers.get("authorization") || "");
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return Boolean(match && safeTokenMatch(expected, normalizeString(match[1])));
}

function requireInternalToken(req: Request): boolean {
  if (hasValidInternalToken(req)) return true;
  return false;
}

async function requireBulkGenOperator(
  req: Request,
  headers: Headers,
): Promise<{ user: { id: string; email: string; provider: string; roles: string[] } } | { error: Response }> {
  if (hasValidInternalToken(req)) {
    return {
      user: {
        id: "internal-bulk-operator",
        email: "internal-bulk-operator@local",
        provider: "internal",
        roles: ["authenticated", "operator"],
      },
    };
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return {
      error: jsonErrorResponse("UNAUTHENTICATED", "Sign in required.", 401, {}, Object.fromEntries(headers)),
    };
  }

  const allowed = parseCsvList(Deno.env.get("BULK_GEN_ALLOWED_USER_IDS") || "");
  if (allowed.length === 0) {
    return {
      error: jsonErrorResponse("FORBIDDEN", "Bulk generation is disabled until operator IDs are configured.", 403, {}, Object.fromEntries(headers)),
    };
  }

  if (!allowed.includes(String(user.id))) {
    return {
      error: jsonErrorResponse("FORBIDDEN", "You are not allowed to operate bulk generation runs.", 403, {}, Object.fromEntries(headers)),
    };
  }

  return { user };
}
