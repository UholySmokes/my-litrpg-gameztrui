/**
 * POST /api/runs/{runId}/sync/push
 *
 * Batch submit offline action envelopes.
 * Processes sequentially using the same algorithm as action-submit.
 * Max 50 envelopes per batch.
 *
 * Returns:
 *   200 { ok: true, results: [...], canonicalTip: { seq, tick, stateHash } }
 */

const { jsonResponse, readJsonBody } = require("../lib/azure-ai-utils");
const { getUserFromRequest } = require("../lib/auth");
const { withConnection, sql } = require("../lib/sql");
const { resolveGameDbBackend, fileDb } = require("../lib/game-db");
const { createServerEngine } = require("../lib/engine-loader");

const GUID_REGEX = /^[0-9a-fA-F-]{36}$/;
const isGuid = (v) => GUID_REGEX.test(String(v || ""));
const MAX_BATCH = 50;
const SNAPSHOT_CADENCE = 20;

function safeJsonParse(str) {
  if (!str) return null;
  if (typeof str === "object") return str;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

module.exports = async function syncPush(context, req) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      context.res = jsonResponse(401, {
        ok: false,
        message: "Sign in required.",
      });
      return;
    }

    const runId = req?.params?.runId || "";
    if (!isGuid(runId)) {
      context.res = jsonResponse(400, {
        ok: false,
        message: "Invalid run id.",
      });
      return;
    }

    const body = await readJsonBody(req);
    const actions = Array.isArray(body?.actions) ? body.actions : [];

    if (actions.length === 0) {
      context.res = jsonResponse(400, {
        ok: false,
        message: "No actions provided.",
      });
      return;
    }

    if (actions.length > MAX_BATCH) {
      context.res = jsonResponse(400, {
        ok: false,
        message: `Max ${MAX_BATCH} actions per batch.`,
      });
      return;
    }

    const backend = resolveGameDbBackend();

    if (backend === "file") {
      const result = await processBatchFile(user, runId, actions);
      context.res = jsonResponse(200, result);
      return;
    }

    await withConnection(async (pool) => {
      const result = await processBatchSql(pool, user, runId, actions);
      context.res = jsonResponse(200, result);
    });
  } catch (err) {
    context.log.error("sync-push error:", err);
    context.res = jsonResponse(500, {
      ok: false,
      message: err.message || "Internal server error.",
    });
  }
};

async function processBatchSql(pool, user, runId, actions) {
  // Load run
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
    return { ok: false, results: [], message: "Run not found." };
  }

  const run = runResult.recordset[0];
  const runMeta = safeJsonParse(run.meta) || {};

  // Load latest snapshot
  const snapResult = await pool
    .request()
    .input("runId", sql.UniqueIdentifier, runId)
    .query(
      `SELECT TOP 1 tick, game_state
       FROM dbo.game_run_snapshots
       WHERE run_id = @runId
       ORDER BY tick DESC`,
    );

  if (!snapResult.recordset.length) {
    return { ok: false, results: [], message: "No snapshot found." };
  }

  let currentState = safeJsonParse(snapResult.recordset[0].game_state);
  const snapshotTick = snapResult.recordset[0].tick || 0;

  // Load events after snapshot
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

  // Create engine and replay
  const engine = await createServerEngine({
    seed: run.seed || 1,
    contentVersion: currentState?.contentVersion || "core@0.1.0",
    stateVersion: currentState?.stateVersion || 1,
  });

  currentState = engine.normalizeState(currentState);

  for (const row of eventsResult.recordset || []) {
    const evtPayload = safeJsonParse(row.payload);
    if (evtPayload?.input) {
      const r = engine.step(evtPayload.input, currentState);
      if (r.ok) currentState = r.nextState;
    }
  }

  let nextSeq =
    Math.max(0, ...((eventsResult.recordset || []).map((r) => Number(r.seq) || 0))) + 1;
  const clientSeqs = runMeta._clientSeqs || {};
  const results = [];

  // Process each action sequentially
  for (const envelope of actions) {
    if (!envelope?.input) {
      results.push({ accepted: false, reason: "Missing input field." });
      continue;
    }

    const stepResult = engine.step(envelope.input, currentState);

    if (!stepResult.ok) {
      results.push({ accepted: false, reason: stepResult.reason });
      continue;
    }

    currentState = stepResult.nextState;

    // Persist event
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

    // Snapshot cadence
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

    if (envelope.clientId) {
      clientSeqs[envelope.clientId] = envelope.clientSeq || 0;
    }

    results.push({
      accepted: true,
      seq: nextSeq,
      tick: stepResult.tick,
    });

    nextSeq += 1;
  }

  // Update run meta
  const updatedMeta = { ...runMeta, _clientSeqs: clientSeqs };
  await pool
    .request()
    .input("runId", sql.UniqueIdentifier, runId)
    .input("meta", sql.NVarChar(sql.MAX), JSON.stringify(updatedMeta))
    .input("updatedAt", sql.NVarChar(64), new Date().toISOString())
    .query(
      `UPDATE dbo.game_runs SET meta = @meta, updated_at = @updatedAt WHERE id = @runId`,
    );

  return {
    ok: true,
    results,
    canonicalTip: {
      seq: nextSeq - 1,
      tick: engine.tick,
      stateHash: engine.hashState(currentState),
    },
  };
}

async function processBatchFile(user, runId, actions) {
  const run = fileDb.getRun({ userId: user.id, runId });
  if (!run) {
    return { ok: false, results: [], message: "Run not found." };
  }

  const snapshots = fileDb.listRunSnapshots({ userId: user.id, runId }) || [];
  const latest = snapshots.sort((a, b) => (b.tick || 0) - (a.tick || 0))[0];
  if (!latest?.game_state) {
    return { ok: false, results: [], message: "No snapshot found." };
  }

  let currentState = safeJsonParse(latest.game_state);

  const { rows: events } = fileDb.listRunEvents({
    userId: user.id,
    runId,
    afterSeq: latest.tick || 0,
    limit: 2000,
  });

  const actionEvents = (events || []).filter(
    (e) => e.event_type === "action.submit",
  );

  const engine = await createServerEngine({
    seed: run.seed || 1,
    contentVersion: currentState?.contentVersion || "core@0.1.0",
    stateVersion: currentState?.stateVersion || 1,
  });

  currentState = engine.normalizeState(currentState);

  for (const evt of actionEvents) {
    const evtPayload = safeJsonParse(evt.payload);
    if (evtPayload?.input) {
      const r = engine.step(evtPayload.input, currentState);
      if (r.ok) currentState = r.nextState;
    }
  }

  let nextSeq =
    (actionEvents.length
      ? Math.max(...actionEvents.map((e) => e.seq || 0))
      : 0) + 1;
  const results = [];

  for (const envelope of actions) {
    if (!envelope?.input) {
      results.push({ accepted: false, reason: "Missing input field." });
      continue;
    }

    const stepResult = engine.step(envelope.input, currentState);

    if (!stepResult.ok) {
      results.push({ accepted: false, reason: stepResult.reason });
      continue;
    }

    currentState = stepResult.nextState;

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

    if (stepResult.tick % SNAPSHOT_CADENCE === 0) {
      fileDb.upsertRunSnapshot({
        userId: user.id,
        runId,
        tick: stepResult.tick,
        gameState: JSON.stringify(stepResult.nextState),
      });
    }

    results.push({
      accepted: true,
      seq: nextSeq,
      tick: stepResult.tick,
    });

    nextSeq += 1;
  }

  return {
    ok: true,
    results,
    canonicalTip: {
      seq: nextSeq - 1,
      tick: engine.tick,
      stateHash: engine.hashState(currentState),
    },
  };
}
