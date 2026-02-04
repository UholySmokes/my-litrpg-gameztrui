const { jsonResponse, readJsonBody } = require("../lib/azure-ai-utils");
const { getUserFromRequest } = require("../lib/auth");
const { withConnection, sql } = require("../lib/sql");

const GUID_REGEX = /^[0-9a-fA-F-]{36}$/;
const MAX_SNAPSHOTS_RETURNED = 200;

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

module.exports = async function runSnapshots(context, req) {
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

    if (!isGuid(runId)) {
      context.res = jsonResponse(400, {
        ok: false,
        errorCode: "INVALID_RUN_ID",
        message: "Invalid run id.",
      });
      return;
    }

    if (method === "GET") {
      const latestOnly =
        typeof req?.query?.latest === "string" &&
        ["1", "true", "yes"].includes(req.query.latest.trim().toLowerCase());

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
        const result = await request.query(
          latestOnly
            ? `
              SELECT TOP (1)
                tick,
                game_state,
                created_at
              FROM dbo.game_run_snapshots
              WHERE run_id = @runId
              ORDER BY tick DESC, created_at DESC;
            `
            : `
              SELECT TOP (${MAX_SNAPSHOTS_RETURNED})
                tick,
                created_at
              FROM dbo.game_run_snapshots
              WHERE run_id = @runId
              ORDER BY tick DESC, created_at DESC;
            `,
        );

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

      if (latestOnly) {
        const row = (rows || [])[0];
        context.res = jsonResponse(200, {
          ok: true,
          snapshot: {
            tick: row.tick,
            game_state: row.game_state ? JSON.parse(row.game_state) : null,
            created_at: row.created_at,
          },
        });
        return;
      }

      context.res = jsonResponse(200, {
        ok: true,
        snapshots: (rows || []).map((row) => ({
          tick: row.tick,
          created_at: row.created_at,
        })),
      });
      return;
    }

    if (method === "POST") {
      const body = await readJsonBody(req);
      const tick =
        Number.isFinite(Number(body?.tick)) && Number(body.tick) >= 0
          ? Math.floor(Number(body.tick))
          : 0;
      const gameState = normalizeJson(body?.gameState || body?.game_state);

      if (!gameState) {
        context.res = jsonResponse(400, {
          ok: false,
          errorCode: "INVALID_GAME_STATE",
          message: "gameState is required.",
        });
        return;
      }

      const result = await withConnection(async (pool) => {
        const tx = new sql.Transaction(pool);
        await tx.begin();
        try {
          const checkReq = new sql.Request(tx);
          checkReq.input("runId", sql.UniqueIdentifier, runId);
          checkReq.input("userId", sql.NVarChar, user.id);
          const owned = await checkReq.query(`
            SELECT TOP (1) id FROM dbo.game_runs WHERE id = @runId AND user_id = @userId;
          `);
          if (!owned?.recordset?.[0]) {
            await tx.rollback();
            return { error: "RUN_NOT_FOUND" };
          }

          const upsertReq = new sql.Request(tx);
          upsertReq.input("runId", sql.UniqueIdentifier, runId);
          upsertReq.input("tick", sql.Int, tick);
          upsertReq.input("state", sql.NVarChar(sql.MAX), gameState);

          const upsert = await upsertReq.query(`
            MERGE dbo.game_run_snapshots AS target
            USING (SELECT @runId AS run_id, @tick AS tick) AS source
              ON target.run_id = source.run_id AND target.tick = source.tick
            WHEN MATCHED THEN
              UPDATE SET game_state = @state, created_at = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN
              INSERT (run_id, tick, game_state, created_at)
              VALUES (@runId, @tick, @state, SYSUTCDATETIME())
            OUTPUT inserted.tick, inserted.created_at;
          `);

          const touchReq = new sql.Request(tx);
          touchReq.input("runId", sql.UniqueIdentifier, runId);
          touchReq.query(`
            UPDATE dbo.game_runs SET updated_at = SYSUTCDATETIME() WHERE id = @runId;
          `);

          await tx.commit();
          const row = upsert?.recordset?.[0];
          return row ? { tick: row.tick, created_at: row.created_at } : {};
        } catch (err) {
          await tx.rollback().catch(() => {});
          throw err;
        }
      });

      if (result?.error === "RUN_NOT_FOUND") {
        context.res = jsonResponse(404, {
          ok: false,
          errorCode: "RUN_NOT_FOUND",
          message: "Run not found.",
        });
        return;
      }

      context.res = jsonResponse(200, { ok: true, snapshot: result });
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
