/**
 * POST /api/runs/{runId}/actions/submit
 *
 * Server-authoritative action validation endpoint.
 * Loads the canonical state (snapshot + replayed events), validates and applies
 * the submitted action via SystemEngine, and persists the result.
 *
 * Returns:
 *   200 { accepted: true,  seq, tick, nextStateHash }
 *   422 { accepted: false, reason, canonicalTip }
 *   401 / 404 / 400 on auth / ownership / validation errors
 */

const { jsonResponse, readJsonBody } = require("../lib/azure-ai-utils");
const { getUserFromRequest } = require("../lib/auth");
const { withConnection, sql } = require("../lib/sql");
const { resolveGameDbBackend, fileDb } = require("../lib/game-db");
const { createServerEngine } = require("../lib/engine-loader");

const GUID_REGEX = /^[0-9a-fA-F-]{36}$/;
const isGuid = (v) => GUID_REGEX.test(String(v || ""));
const SNAPSHOT_CADENCE = 20;

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

module.exports = async function actionSubmit(context, req) {
  try {
    // ── Auth ──
    const user = getUserFromRequest(req);
    if (!user) {
      context.res = jsonResponse(401, {
        ok: false,
        accepted: false,
        errorCode: "UNAUTHENTICATED",
        message: "Sign in required.",
      });
      return;
    }

    const runId = req?.params?.runId || "";
    if (!isGuid(runId)) {
      context.res = jsonResponse(400, {
        ok: false,
        accepted: false,
        errorCode: "INVALID_RUN_ID",
        message: "Invalid run id.",
      });
      return;
    }

    // ── Parse envelope ──
    const body = await readJsonBody(req);
    if (!body || !body.input) {
      context.res = jsonResponse(400, {
        ok: false,
        accepted: false,
        errorCode: "INVALID_ENVELOPE",
        message: "Request body must include an 'input' field.",
      });
      return;
    }

    const envelope = {
      id: body.id || generateUUID(),
      runId,
      clientId: body.clientId || "unknown",
      clientSeq: typeof body.clientSeq === "number" ? body.clientSeq : 0,
      createdAt: body.createdAt || new Date().toISOString(),
      contentVersion: body.contentVersion || "core@0.1.0",
      input: body.input,
    };

    const backend = resolveGameDbBackend();

    if (backend === "file") {
      const result = await processActionFile(user, runId, envelope);
      context.res = jsonResponse(result.status, result.body);
      return;
    }

    // ── SQL backend ──
    await withConnection(async (pool) => {
      const result = await processActionSql(pool, user, runId, envelope);
      context.res = jsonResponse(result.status, result.body);
    });
  } catch (err) {
    context.log.error("action-submit error:", err);
    context.res = jsonResponse(500, {
      ok: false,
      accepted: false,
      errorCode: "INTERNAL_ERROR",
      message: err.message || "Internal server error.",
    });
  }
};

// ────────────────────────────────────────────────
// SQL implementation
// ────────────────────────────────────────────────

async function processActionSql(pool, user, runId, envelope) {
  // 1. Load run
  const runResult = await pool
    .request()
    .input("runId", sql.UniqueIdentifier, runId)
    .input("userId", sql.NVarChar(128), user.id)
    .query(
      `SELECT id, seed, status, meta
       FROM dbo.game_runs
       WHERE id = @runId AND user_id = @userId`,
    );

  if (!runResult.recordset.length) {
    return {
      status: 404,
      body: {
        ok: false,
        accepted: false,
        errorCode: "RUN_NOT_FOUND",
        message: "Run not found.",
      },
    };
  }

  const run = runResult.recordset[0];
  const runMeta = safeJsonParse(run.meta) || {};

  // 2. Load latest snapshot
  const snapResult = await pool
    .request()
    .input("runId", sql.UniqueIdentifier, runId)
    .query(
      `SELECT TOP 1 tick, game_state
       FROM dbo.game_run_snapshots
       WHERE run_id = @runId
       ORDER BY tick DESC`,
    );

  let canonicalState = null;
  let snapshotTick = 0;

  if (snapResult.recordset.length) {
    snapshotTick = snapResult.recordset[0].tick || 0;
    canonicalState = safeJsonParse(snapResult.recordset[0].game_state);
  }

  if (!canonicalState) {
    return {
      status: 422,
      body: {
        ok: false,
        accepted: false,
        errorCode: "NO_SNAPSHOT",
        message: "No canonical state snapshot found for this run.",
      },
    };
  }

  // 3. Load events after snapshot
  const eventsResult = await pool
    .request()
    .input("runId", sql.UniqueIdentifier, runId)
    .input("afterSeq", sql.BigInt, snapshotTick)
    .query(
      `SELECT seq, tick, event_type, payload
       FROM dbo.game_run_events
       WHERE run_id = @runId AND seq > @afterSeq AND event_type = 'action.submit'
       ORDER BY seq ASC`,
    );

  // 4. Create engine and replay to canonical tip
  const engine = await createServerEngine({
    seed: run.seed || 1,
    contentVersion: canonicalState.contentVersion || envelope.contentVersion,
    stateVersion: canonicalState.stateVersion || 1,
  });

  let currentState = engine.normalizeState(canonicalState);

  for (const row of eventsResult.recordset || []) {
    const evtPayload = safeJsonParse(row.payload);
    if (evtPayload?.input) {
      const replayResult = engine.step(evtPayload.input, currentState);
      if (replayResult.ok) {
        currentState = replayResult.nextState;
      }
    }
  }

  // 5. Validate clientSeq monotonicity
  const clientSeqs = runMeta._clientSeqs || {};
  const lastSeq = clientSeqs[envelope.clientId] || 0;
  if (envelope.clientSeq <= lastSeq) {
    return {
      status: 422,
      body: {
        ok: false,
        accepted: false,
        errorCode: "CLIENT_SEQ_CONFLICT",
        message: `clientSeq ${envelope.clientSeq} <= last seen ${lastSeq} for clientId ${envelope.clientId}.`,
        canonicalTip: {
          seq: getMaxSeq(eventsResult.recordset),
          tick: engine.tick,
          stateHash: engine.hashState(currentState),
        },
      },
    };
  }

  // 6. Apply the new action
  const stepResult = engine.step(envelope.input, currentState);

  if (!stepResult.ok) {
    return {
      status: 422,
      body: {
        ok: false,
        accepted: false,
        reason: stepResult.reason,
        canonicalTip: {
          seq: getMaxSeq(eventsResult.recordset),
          tick: engine.tick,
          stateHash: engine.hashState(currentState),
        },
      },
    };
  }

  // 7. Persist event
  const nextSeq = getMaxSeq(eventsResult.recordset) + 1;
  const nowIso = new Date().toISOString();

  await pool
    .request()
    .input("runId", sql.UniqueIdentifier, runId)
    .input("seq", sql.BigInt, nextSeq)
    .input("tick", sql.Int, stepResult.tick)
    .input("eventType", sql.NVarChar(64), "action.submit")
    .input("payload", sql.NVarChar(sql.MAX), JSON.stringify(envelope))
    .input("createdAt", sql.NVarChar(64), nowIso)
    .query(
      `INSERT INTO dbo.game_run_events (run_id, seq, tick, event_type, payload, created_at)
       VALUES (@runId, @seq, @tick, @eventType, @payload, @createdAt)`,
    );

  // 8. Snapshot cadence
  const nextStateHash = engine.hashState(stepResult.nextState);

  if (stepResult.tick % SNAPSHOT_CADENCE === 0) {
    await pool
      .request()
      .input("runId", sql.UniqueIdentifier, runId)
      .input("tick", sql.Int, stepResult.tick)
      .input("gameState", sql.NVarChar(sql.MAX), JSON.stringify(stepResult.nextState))
      .input("createdAt", sql.NVarChar(64), nowIso)
      .query(
        `MERGE dbo.game_run_snapshots AS tgt
         USING (SELECT @runId AS run_id, @tick AS tick) AS src
           ON tgt.run_id = src.run_id AND tgt.tick = src.tick
         WHEN MATCHED THEN UPDATE SET game_state = @gameState, created_at = @createdAt
         WHEN NOT MATCHED THEN INSERT (run_id, tick, game_state, created_at)
           VALUES (@runId, @tick, @gameState, @createdAt);`,
      );
  }

  // 9. Update run meta (clientSeq tracking + updated_at)
  clientSeqs[envelope.clientId] = envelope.clientSeq;
  const updatedMeta = { ...runMeta, _clientSeqs: clientSeqs };

  await pool
    .request()
    .input("runId", sql.UniqueIdentifier, runId)
    .input("meta", sql.NVarChar(sql.MAX), JSON.stringify(updatedMeta))
    .input("updatedAt", sql.NVarChar(64), nowIso)
    .query(
      `UPDATE dbo.game_runs SET meta = @meta, updated_at = @updatedAt WHERE id = @runId`,
    );

  return {
    status: 200,
    body: {
      ok: true,
      accepted: true,
      seq: nextSeq,
      tick: stepResult.tick,
      nextStateHash,
    },
  };
}

// ────────────────────────────────────────────────
// File-backend implementation
// ────────────────────────────────────────────────

async function processActionFile(user, runId, envelope) {
  // Verify ownership
  const run = fileDb.getRun({ userId: user.id, runId });
  if (!run) {
    return {
      status: 404,
      body: {
        ok: false,
        accepted: false,
        errorCode: "RUN_NOT_FOUND",
        message: "Run not found.",
      },
    };
  }

  // Load latest snapshot
  const snapshots = fileDb.listRunSnapshots({ userId: user.id, runId }) || [];
  const latest = snapshots.sort((a, b) => (b.tick || 0) - (a.tick || 0))[0];
  if (!latest?.game_state) {
    return {
      status: 422,
      body: {
        ok: false,
        accepted: false,
        errorCode: "NO_SNAPSHOT",
        message: "No canonical state snapshot found.",
      },
    };
  }

  const canonicalState = safeJsonParse(latest.game_state);
  const snapshotTick = latest.tick || 0;

  // Load events after snapshot
  const { rows: events } = fileDb.listRunEvents({
    userId: user.id,
    runId,
    afterSeq: snapshotTick,
    limit: 2000,
  });

  const actionEvents = (events || []).filter(
    (e) => e.event_type === "action.submit",
  );

  // Create engine and replay
  const engine = await createServerEngine({
    seed: run.seed || 1,
    contentVersion: canonicalState.contentVersion || envelope.contentVersion,
    stateVersion: canonicalState.stateVersion || 1,
  });

  let currentState = engine.normalizeState(canonicalState);

  for (const evt of actionEvents) {
    const evtPayload = safeJsonParse(evt.payload);
    if (evtPayload?.input) {
      const replayResult = engine.step(evtPayload.input, currentState);
      if (replayResult.ok) {
        currentState = replayResult.nextState;
      }
    }
  }

  // Apply the new action
  const stepResult = engine.step(envelope.input, currentState);
  if (!stepResult.ok) {
    const maxSeq = actionEvents.length
      ? Math.max(...actionEvents.map((e) => e.seq || 0))
      : 0;
    return {
      status: 422,
      body: {
        ok: false,
        accepted: false,
        reason: stepResult.reason,
        canonicalTip: {
          seq: maxSeq,
          tick: engine.tick,
          stateHash: engine.hashState(currentState),
        },
      },
    };
  }

  // Persist event
  const nextSeq =
    (actionEvents.length
      ? Math.max(...actionEvents.map((e) => e.seq || 0))
      : 0) + 1;

  fileDb.addRunEvents({
    userId: user.id,
    runId,
    events: [
      {
        seq: nextSeq,
        tick: stepResult.tick,
        event_type: "action.submit",
        payload: JSON.stringify(envelope),
      },
    ],
  });

  // Snapshot cadence
  const nextStateHash = engine.hashState(stepResult.nextState);

  if (stepResult.tick % SNAPSHOT_CADENCE === 0) {
    fileDb.upsertRunSnapshot({
      userId: user.id,
      runId,
      tick: stepResult.tick,
      gameState: JSON.stringify(stepResult.nextState),
    });
  }

  return {
    status: 200,
    body: {
      ok: true,
      accepted: true,
      seq: nextSeq,
      tick: stepResult.tick,
      nextStateHash,
    },
  };
}

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

function safeJsonParse(str) {
  if (!str) return null;
  if (typeof str === "object") return str;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function getMaxSeq(recordset) {
  if (!recordset || !recordset.length) return 0;
  return Math.max(...recordset.map((r) => Number(r.seq) || 0));
}
