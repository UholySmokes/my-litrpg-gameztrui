const { jsonResponse, readJsonBody } = require("../lib/azure-ai-utils");
const { getUserFromRequest } = require("../lib/auth");
const { withConnection, sql } = require("../lib/sql");
const { resolveGameDbBackend, fileDb } = require("../lib/game-db");

const GUID_REGEX = /^[0-9a-fA-F-]{36}$/;
const MAX_EVENTS_PER_POST = 500;
const MAX_EVENTS_RETURNED = 2000;

const isGuid = (value) => GUID_REGEX.test(String(value || ""));

const normalizeJson = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {
      return JSON.stringify(trimmed);
    }
  }
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};

const toNumberOrNull = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

module.exports = async function runEvents(context, req) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      context.res = jsonResponse(401, {
        ok: false,
        errorCode: "UNAUTHENTICATED",
        message: "Sign in required.",
      });
      return;
    }

    const method = String(req?.method || "GET").toUpperCase();
    const runId = req?.params?.runId || req?.query?.runId || "";
    const backend = resolveGameDbBackend();
    const nowIso = new Date().toISOString();

    if (!isGuid(runId)) {
      context.res = jsonResponse(400, {
        ok: false,
        errorCode: "INVALID_RUN_ID",
        message: "Invalid run id.",
      });
      return;
    }

    if (backend === "file") {
      if (method === "GET") {
        const afterSeq = toNumberOrNull(req?.query?.afterSeq ?? req?.query?.after);
        const limitRaw = toNumberOrNull(req?.query?.limit);
        const limit = Number.isFinite(limitRaw)
          ? Math.max(1, Math.min(MAX_EVENTS_RETURNED, Math.floor(limitRaw)))
          : 500;

        const { owned, rows } = fileDb.listRunEvents({
          userId: user.id,
          runId,
          afterSeq,
          limit,
        });

        if (!owned) {
          context.res = jsonResponse(404, {
            ok: false,
            errorCode: "RUN_NOT_FOUND",
            message: "Run not found.",
          });
          return;
        }

        context.res = jsonResponse(200, {
          ok: true,
          events: (rows || []).map((row) => ({
            seq: Number(row.seq),
            tick: row.tick,
            event_type: row.event_type,
            payload: row.payload ? JSON.parse(row.payload) : null,
            created_at: row.created_at,
          })),
        });
        return;
      }

      if (method === "POST") {
        const body = await readJsonBody(req);
        const rawEvents = Array.isArray(body?.events)
          ? body.events
          : body?.event
            ? [body.event]
            : [];
        const events = rawEvents.slice(0, MAX_EVENTS_PER_POST).filter(Boolean);

        if (events.length === 0) {
          context.res = jsonResponse(400, {
            ok: false,
            errorCode: "INVALID_EVENTS",
            message: "events is required.",
          });
          return;
        }

        const normalized = [];
        for (const ev of events) {
          const eventType =
            typeof ev?.event_type === "string"
              ? ev.event_type
              : typeof ev?.type === "string"
                ? ev.type
                : "";
          const payload = normalizeJson(ev?.payload ?? ev);
          if (!eventType || !payload) continue;
          const tick =
            Number.isFinite(Number(ev?.tick)) && Number(ev.tick) >= 0
              ? Math.floor(Number(ev.tick))
              : null;
          normalized.push({ eventType, payload, tick });
        }

        const inserted = fileDb.addRunEvents({
          userId: user.id,
          runId,
          events: normalized,
          now: nowIso,
        });

        if (inserted?.error === "RUN_NOT_FOUND") {
          context.res = jsonResponse(404, {
            ok: false,
            errorCode: "RUN_NOT_FOUND",
            message: "Run not found.",
          });
          return;
        }

        context.res = jsonResponse(200, {
          ok: true,
          inserted: inserted?.rows || [],
        });
        return;
      }

      context.res = jsonResponse(405, {
        ok: false,
        errorCode: "METHOD_NOT_ALLOWED",
        message: "Unsupported method.",
      });
      return;
    }

    if (method === "GET") {
      const afterSeq = toNumberOrNull(req?.query?.afterSeq ?? req?.query?.after);
      const limitRaw = toNumberOrNull(req?.query?.limit);
      const limit = Number.isFinite(limitRaw)
        ? Math.max(1, Math.min(MAX_EVENTS_RETURNED, Math.floor(limitRaw)))
        : 500;

      const { owned, rows } = await withConnection(async (pool) => {
        const checkReq = pool.request();
        checkReq.input("runId", sql.UniqueIdentifier, runId);
        checkReq.input("userId", sql.NVarChar, user.id);
        const ownedResult = await checkReq.query(
          `SELECT TOP (1) id FROM dbo.game_runs WHERE id = @runId AND user_id = @userId;`,
        );
        const isOwned = Boolean(ownedResult?.recordset?.[0]?.id);
        if (!isOwned) return { owned: false, rows: [] };

        const request = pool.request();
        request.input("runId", sql.UniqueIdentifier, runId);
        request.input("afterSeq", sql.BigInt, afterSeq);
        const result = await request.query(`
          SELECT TOP (${limit})
            seq,
            tick,
            event_type,
            payload,
            created_at
          FROM dbo.game_run_events
          WHERE run_id = @runId
            AND (@afterSeq IS NULL OR seq > @afterSeq)
          ORDER BY seq ASC;
        `);

        return { owned: true, rows: result?.recordset || [] };
      });

      if (!owned) {
        context.res = jsonResponse(404, {
          ok: false,
          errorCode: "RUN_NOT_FOUND",
          message: "Run not found.",
        });
        return;
      }

      context.res = jsonResponse(200, {
        ok: true,
        events: (rows || []).map((row) => ({
          seq: Number(row.seq),
          tick: row.tick,
          event_type: row.event_type,
          payload: row.payload ? JSON.parse(row.payload) : null,
          created_at: row.created_at,
        })),
      });
      return;
    }

    if (method === "POST") {
      const body = await readJsonBody(req);
      const rawEvents = Array.isArray(body?.events) ? body.events : body?.event ? [body.event] : [];
      const events = rawEvents.slice(0, MAX_EVENTS_PER_POST).filter(Boolean);

      if (events.length === 0) {
        context.res = jsonResponse(400, {
          ok: false,
          errorCode: "INVALID_EVENTS",
          message: "events is required.",
        });
        return;
      }

      const inserted = await withConnection(async (pool) => {
        const tx = new sql.Transaction(pool);
        await tx.begin();
        try {
          // Ownership check + current max seq
          const checkReq = new sql.Request(tx);
          checkReq.input("runId", sql.UniqueIdentifier, runId);
          checkReq.input("userId", sql.NVarChar, user.id);
          const check = await checkReq.query(`
            SELECT TOP (1) id FROM dbo.game_runs WHERE id = @runId AND user_id = @userId;
            SELECT ISNULL(MAX(seq), 0) AS maxSeq FROM dbo.game_run_events WHERE run_id = @runId;
          `);

          const owned = check?.recordsets?.[0]?.[0];
          if (!owned) {
            await tx.rollback();
            return { error: "RUN_NOT_FOUND" };
          }

          let seq = Number(check?.recordsets?.[1]?.[0]?.maxSeq || 0);
          const insertedRows = [];

          for (const ev of events) {
            const eventType =
              typeof ev?.event_type === "string"
                ? ev.event_type
                : typeof ev?.type === "string"
                  ? ev.type
                  : "";
            const payload = normalizeJson(ev?.payload ?? ev);
            if (!eventType || !payload) continue;

            seq += 1;
            const tick =
              Number.isFinite(Number(ev?.tick)) && Number(ev.tick) >= 0
                ? Math.floor(Number(ev.tick))
                : null;

            const insertReq = new sql.Request(tx);
            insertReq.input("runId", sql.UniqueIdentifier, runId);
            insertReq.input("seq", sql.BigInt, seq);
            insertReq.input("tick", sql.Int, tick);
            insertReq.input("eventType", sql.NVarChar, eventType);
            insertReq.input("payload", sql.NVarChar(sql.MAX), payload);

            const result = await insertReq.query(`
              INSERT INTO dbo.game_run_events (run_id, seq, tick, event_type, payload, created_at)
              OUTPUT INSERTED.seq, INSERTED.tick, INSERTED.event_type, INSERTED.created_at
              VALUES (@runId, @seq, @tick, @eventType, @payload, SYSUTCDATETIME())
            `);

            const row = result?.recordset?.[0];
            if (row) {
              insertedRows.push({
                seq: Number(row.seq),
                tick: row.tick,
                event_type: row.event_type,
                created_at: row.created_at,
              });
            }
          }

          // touch run updated_at
          const touchReq = new sql.Request(tx);
          touchReq.input("runId", sql.UniqueIdentifier, runId);
          await touchReq.query(`
            UPDATE dbo.game_runs SET updated_at = SYSUTCDATETIME() WHERE id = @runId;
          `);

          await tx.commit();
          return { rows: insertedRows };
        } catch (err) {
          await tx.rollback().catch(() => {});
          throw err;
        }
      });

      if (inserted?.error === "RUN_NOT_FOUND") {
        context.res = jsonResponse(404, {
          ok: false,
          errorCode: "RUN_NOT_FOUND",
          message: "Run not found.",
        });
        return;
      }

      context.res = jsonResponse(200, {
        ok: true,
        inserted: inserted?.rows || [],
      });
      return;
    }

    context.res = jsonResponse(405, {
      ok: false,
      errorCode: "METHOD_NOT_ALLOWED",
      message: "Unsupported method.",
    });
  } catch (error) {
    context.res = jsonResponse(500, {
      ok: false,
      errorCode: "UNEXPECTED_ERROR",
      message: String(error?.message || error || "Unknown error"),
    });
  }
};
