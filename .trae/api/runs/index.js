const { jsonResponse, readJsonBody } = require("../lib/azure-ai-utils");
const { getUserFromRequest } = require("../lib/auth");
const { withConnection, sql } = require("../lib/sql");
const { resolveGameDbBackend, fileDb } = require("../lib/game-db");

const MAX_RUN_NAME_LENGTH = 120;
const MAX_RUNS_RETURNED = 50;
const GUID_REGEX = /^[0-9a-fA-F-]{36}$/;

const toStringSafe = (value) => (typeof value === "string" ? value : "");

const isGuid = (value) => GUID_REGEX.test(String(value || ""));

const normalizeRunName = (value) => {
  const trimmed = toStringSafe(value).trim();
  const base = trimmed || "Run";
  return base.slice(0, MAX_RUN_NAME_LENGTH);
};

const normalizeJson = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      JSON.parse(trimmed);
      return trimmed; // already JSON
    } catch {
      return JSON.stringify(trimmed); // store as JSON string literal
    }
  }
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};

module.exports = async function runs(context, req) {
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
    const runId = req?.params?.id || req?.query?.id || "";
    const backend = resolveGameDbBackend();
    const nowIso = new Date().toISOString();

    if (backend === "file") {
      if (method === "GET" && !runId) {
        context.res = jsonResponse(200, {
          ok: true,
          runs: fileDb.listRuns({ userId: user.id, limit: MAX_RUNS_RETURNED }),
        });
        return;
      }

      if (method === "GET" && runId) {
        if (!isGuid(runId)) {
          context.res = jsonResponse(400, {
            ok: false,
            errorCode: "INVALID_RUN_ID",
            message: "Invalid run id.",
          });
          return;
        }

        const row = fileDb.getRun({ userId: user.id, runId });
        if (!row) {
          context.res = jsonResponse(404, {
            ok: false,
            errorCode: "RUN_NOT_FOUND",
            message: "Run not found.",
          });
          return;
        }

        context.res = jsonResponse(200, {
          ok: true,
          run: {
            id: row.id,
            run_name: row.run_name,
            seed: row.seed,
            status: row.status,
            meta: row.meta ? JSON.parse(row.meta) : null,
            created_at: row.created_at,
            updated_at: row.updated_at,
          },
        });
        return;
      }

      if (method === "POST") {
        const body = await readJsonBody(req);
        const runName = normalizeRunName(body?.runName || body?.run_name);
        const status = toStringSafe(body?.status).trim() || "active";
        const seed =
          body?.seed === null || body?.seed === undefined
            ? null
            : Number.isFinite(Number(body.seed))
              ? Number(body.seed)
              : null;
        const meta = normalizeJson(body?.meta);
        const initialState = normalizeJson(body?.initialState || body?.game_state);
        const initialTick =
          Number.isFinite(Number(body?.initialTick)) && Number(body.initialTick) >= 0
            ? Number(body.initialTick)
            : 0;

        const created = fileDb.createRun({
          userId: user.id,
          runName,
          seed,
          status,
          meta,
          initialState,
          initialTick,
          now: nowIso,
        });

        context.res = jsonResponse(200, {
          ok: true,
          run: created
            ? {
                id: created.id,
                run_name: created.run_name,
                seed: created.seed,
                status: created.status,
                created_at: created.created_at,
                updated_at: created.updated_at,
              }
            : null,
        });
        return;
      }

      if (method === "PUT" && runId) {
        if (!isGuid(runId)) {
          context.res = jsonResponse(400, {
            ok: false,
            errorCode: "INVALID_RUN_ID",
            message: "Invalid run id.",
          });
          return;
        }

        const body = await readJsonBody(req);
        const runName = normalizeRunName(body?.runName || body?.run_name);
        const status = toStringSafe(body?.status).trim();
        const meta = normalizeJson(body?.meta);

        const row = fileDb.updateRun({
          userId: user.id,
          runId,
          runName,
          status: status || null,
          meta,
          now: nowIso,
        });

        if (!row) {
          context.res = jsonResponse(404, {
            ok: false,
            errorCode: "RUN_NOT_FOUND",
            message: "Run not found.",
          });
          return;
        }

        context.res = jsonResponse(200, {
          ok: true,
          run: {
            id: row.id,
            run_name: row.run_name,
            seed: row.seed,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
          },
        });
        return;
      }

      if (method === "DELETE" && runId) {
        if (!isGuid(runId)) {
          context.res = jsonResponse(400, {
            ok: false,
            errorCode: "INVALID_RUN_ID",
            message: "Invalid run id.",
          });
          return;
        }

        const deleted = fileDb.deleteRun({ userId: user.id, runId });
        if (!deleted) {
          context.res = jsonResponse(404, {
            ok: false,
            errorCode: "RUN_NOT_FOUND",
            message: "Run not found.",
          });
          return;
        }

        context.res = jsonResponse(200, { ok: true });
        return;
      }

      context.res = jsonResponse(405, {
        ok: false,
        errorCode: "METHOD_NOT_ALLOWED",
        message: "Unsupported method.",
      });
      return;
    }

    if (method === "GET" && !runId) {
      const result = await withConnection(async (pool) => {
        const request = pool.request();
        request.input("userId", sql.NVarChar, user.id);
        return request.query(`
          SELECT TOP (${MAX_RUNS_RETURNED})
            id,
            run_name,
            seed,
            status,
            created_at,
            updated_at
          FROM dbo.game_runs
          WHERE user_id = @userId
          ORDER BY updated_at DESC
        `);
      });

      context.res = jsonResponse(200, {
        ok: true,
        runs: (result?.recordset || []).map((row) => ({
          id: row.id,
          run_name: row.run_name,
          seed: row.seed,
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at,
        })),
      });
      return;
    }

    if (method === "GET" && runId) {
      if (!isGuid(runId)) {
        context.res = jsonResponse(400, {
          ok: false,
          errorCode: "INVALID_RUN_ID",
          message: "Invalid run id.",
        });
        return;
      }

      const result = await withConnection(async (pool) => {
        const request = pool.request();
        request.input("runId", sql.UniqueIdentifier, runId);
        request.input("userId", sql.NVarChar, user.id);
        return request.query(`
          SELECT TOP (1)
            id,
            run_name,
            seed,
            status,
            meta,
            created_at,
            updated_at
          FROM dbo.game_runs
          WHERE id = @runId AND user_id = @userId
        `);
      });

      const row = result?.recordset?.[0];
      if (!row) {
        context.res = jsonResponse(404, {
          ok: false,
          errorCode: "RUN_NOT_FOUND",
          message: "Run not found.",
        });
        return;
      }

      context.res = jsonResponse(200, {
        ok: true,
        run: {
          id: row.id,
          run_name: row.run_name,
          seed: row.seed,
          status: row.status,
          meta: row.meta ? JSON.parse(row.meta) : null,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      });
      return;
    }

    if (method === "POST") {
      const body = await readJsonBody(req);
      const runName = normalizeRunName(body?.runName || body?.run_name);
      const status = toStringSafe(body?.status).trim() || "active";
      const seed =
        body?.seed === null || body?.seed === undefined
          ? null
          : Number.isFinite(Number(body.seed))
            ? Number(body.seed)
            : null;
      const meta = normalizeJson(body?.meta);
      const initialState = normalizeJson(body?.initialState || body?.game_state);
      const initialTick =
        Number.isFinite(Number(body?.initialTick)) && Number(body.initialTick) >= 0
          ? Number(body.initialTick)
          : 0;

      const created = await withConnection(async (pool) => {
        const tx = new sql.Transaction(pool);
        await tx.begin();
        try {
          const insertRun = new sql.Request(tx);
          insertRun.input("userId", sql.NVarChar, user.id);
          insertRun.input("runName", sql.NVarChar, runName);
          insertRun.input("seed", sql.BigInt, seed);
          insertRun.input("status", sql.NVarChar, status);
          insertRun.input("meta", sql.NVarChar(sql.MAX), meta);

          const runResult = await insertRun.query(`
            INSERT INTO dbo.game_runs (user_id, run_name, seed, status, meta, created_at, updated_at)
            OUTPUT INSERTED.id, INSERTED.run_name, INSERTED.seed, INSERTED.status, INSERTED.created_at, INSERTED.updated_at
            VALUES (@userId, @runName, @seed, @status, @meta, SYSUTCDATETIME(), SYSUTCDATETIME())
          `);

          const runRow = runResult?.recordset?.[0];
          const newRunId = runRow?.id;

          if (newRunId && initialState) {
            const insertSnap = new sql.Request(tx);
            insertSnap.input("runId", sql.UniqueIdentifier, newRunId);
            insertSnap.input("tick", sql.Int, initialTick);
            insertSnap.input("state", sql.NVarChar(sql.MAX), initialState);
            await insertSnap.query(`
              INSERT INTO dbo.game_run_snapshots (run_id, tick, game_state, created_at)
              VALUES (@runId, @tick, @state, SYSUTCDATETIME())
            `);
          }

          await tx.commit();
          return runRow || null;
        } catch (err) {
          await tx.rollback().catch(() => {});
          throw err;
        }
      });

      context.res = jsonResponse(200, {
        ok: true,
        run: created
          ? {
              id: created.id,
              run_name: created.run_name,
              seed: created.seed,
              status: created.status,
              created_at: created.created_at,
              updated_at: created.updated_at,
            }
          : null,
      });
      return;
    }

    if (method === "PUT" && runId) {
      if (!isGuid(runId)) {
        context.res = jsonResponse(400, {
          ok: false,
          errorCode: "INVALID_RUN_ID",
          message: "Invalid run id.",
        });
        return;
      }

      const body = await readJsonBody(req);
      const runName = normalizeRunName(body?.runName || body?.run_name);
      const status = toStringSafe(body?.status).trim();
      const meta = normalizeJson(body?.meta);

      const result = await withConnection(async (pool) => {
        const request = pool.request();
        request.input("runId", sql.UniqueIdentifier, runId);
        request.input("userId", sql.NVarChar, user.id);
        request.input("runName", sql.NVarChar, runName);
        request.input("status", sql.NVarChar, status || null);
        request.input("meta", sql.NVarChar(sql.MAX), meta);

        return request.query(`
          UPDATE dbo.game_runs
          SET
            run_name = @runName,
            status = COALESCE(@status, status),
            meta = @meta,
            updated_at = SYSUTCDATETIME()
          WHERE id = @runId AND user_id = @userId;

          SELECT TOP (1)
            id,
            run_name,
            seed,
            status,
            created_at,
            updated_at
          FROM dbo.game_runs
          WHERE id = @runId AND user_id = @userId
        `);
      });

      const row = result?.recordset?.[0];
      if (!row) {
        context.res = jsonResponse(404, {
          ok: false,
          errorCode: "RUN_NOT_FOUND",
          message: "Run not found.",
        });
        return;
      }

      context.res = jsonResponse(200, {
        ok: true,
        run: {
          id: row.id,
          run_name: row.run_name,
          seed: row.seed,
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      });
      return;
    }

    if (method === "DELETE" && runId) {
      if (!isGuid(runId)) {
        context.res = jsonResponse(400, {
          ok: false,
          errorCode: "INVALID_RUN_ID",
          message: "Invalid run id.",
        });
        return;
      }

      const result = await withConnection(async (pool) => {
        const request = pool.request();
        request.input("runId", sql.UniqueIdentifier, runId);
        request.input("userId", sql.NVarChar, user.id);
        return request.query(`
          DELETE FROM dbo.game_runs
          WHERE id = @runId AND user_id = @userId;
          SELECT @@ROWCOUNT AS affected;
        `);
      });

      const affected = result?.recordset?.[0]?.affected || 0;
      if (affected === 0) {
        context.res = jsonResponse(404, {
          ok: false,
          errorCode: "RUN_NOT_FOUND",
          message: "Run not found.",
        });
        return;
      }

      context.res = jsonResponse(200, { ok: true });
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
