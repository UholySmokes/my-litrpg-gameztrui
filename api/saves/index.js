const { jsonResponse, readJsonBody } = require("../lib/azure-ai-utils");
const { getUserFromRequest } = require("../lib/auth");
const { query, sql } = require("../lib/sql");

const MAX_SAVE_NAME_LENGTH = 80;
const MAX_SAVES_RETURNED = 50;
const GUID_REGEX = /^[0-9a-fA-F-]{36}$/;

const safeJsonParse = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeSaveName = (value) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  const base = trimmed || "Auto Save";
  return base.slice(0, MAX_SAVE_NAME_LENGTH);
};

const isGuid = (value) => GUID_REGEX.test(String(value || ""));

const normalizeGameState = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};

module.exports = async function saves(context, req) {
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
    const saveId = req?.params?.id || req?.query?.id || "";

    if (method === "GET" && !saveId) {
      const result = await query(
        `
          SELECT TOP (${MAX_SAVES_RETURNED})
            id,
            save_name,
            created_at,
            updated_at
          FROM dbo.game_saves
          WHERE user_id = @userId
          ORDER BY updated_at DESC
        `,
        [{ name: "userId", type: sql.NVarChar, value: user.id }],
      );

      context.res = jsonResponse(200, {
        ok: true,
        saves: (result?.recordset || []).map((row) => ({
          id: row.id,
          save_name: row.save_name,
          created_at: row.created_at,
          updated_at: row.updated_at,
        })),
      });
      return;
    }

    if (method === "GET" && saveId) {
      if (!isGuid(saveId)) {
        context.res = jsonResponse(400, {
          ok: false,
          errorCode: "INVALID_SAVE_ID",
          message: "Invalid save id.",
        });
        return;
      }
      const result = await query(
        `
          SELECT TOP (1)
            id,
            save_name,
            game_state,
            created_at,
            updated_at
          FROM dbo.game_saves
          WHERE id = @saveId AND user_id = @userId
        `,
        [
          { name: "saveId", type: sql.UniqueIdentifier, value: saveId },
          { name: "userId", type: sql.NVarChar, value: user.id },
        ],
      );

      const row = result?.recordset?.[0];
      if (!row) {
        context.res = jsonResponse(404, {
          ok: false,
          errorCode: "SAVE_NOT_FOUND",
          message: "Save not found.",
        });
        return;
      }

      context.res = jsonResponse(200, {
        ok: true,
        save: {
          id: row.id,
          save_name: row.save_name,
          game_state: safeJsonParse(row.game_state),
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      });
      return;
    }

    if (method === "POST") {
      const body = await readJsonBody(req);
      const saveName = normalizeSaveName(body?.saveName || body?.save_name);
      const gameState = normalizeGameState(body?.gameState || body?.game_state);

      if (!gameState) {
        context.res = jsonResponse(400, {
          ok: false,
          errorCode: "INVALID_GAME_STATE",
          message: "gameState is required.",
        });
        return;
      }

      const result = await query(
        `
          INSERT INTO dbo.game_saves (
            user_id,
            save_name,
            game_state,
            created_at,
            updated_at
          )
          OUTPUT
            INSERTED.id,
            INSERTED.save_name,
            INSERTED.created_at,
            INSERTED.updated_at
          VALUES (
            @userId,
            @saveName,
            @gameState,
            SYSUTCDATETIME(),
            SYSUTCDATETIME()
          )
        `,
        [
          { name: "userId", type: sql.NVarChar, value: user.id },
          { name: "saveName", type: sql.NVarChar, value: saveName },
          { name: "gameState", type: sql.NVarChar(sql.MAX), value: gameState },
        ],
      );

      const row = result?.recordset?.[0];
      context.res = jsonResponse(200, {
        ok: true,
        save: row
          ? {
              id: row.id,
              save_name: row.save_name,
              created_at: row.created_at,
              updated_at: row.updated_at,
            }
          : null,
      });
      return;
    }

    if (method === "PUT" && saveId) {
      if (!isGuid(saveId)) {
        context.res = jsonResponse(400, {
          ok: false,
          errorCode: "INVALID_SAVE_ID",
          message: "Invalid save id.",
        });
        return;
      }
      const body = await readJsonBody(req);
      const saveName = normalizeSaveName(body?.saveName || body?.save_name);
      const gameState = normalizeGameState(body?.gameState || body?.game_state);

      if (!gameState) {
        context.res = jsonResponse(400, {
          ok: false,
          errorCode: "INVALID_GAME_STATE",
          message: "gameState is required.",
        });
        return;
      }

      const result = await query(
        `
          UPDATE dbo.game_saves
          SET
            save_name = @saveName,
            game_state = @gameState,
            updated_at = SYSUTCDATETIME()
          WHERE id = @saveId AND user_id = @userId;

          SELECT TOP (1)
            id,
            save_name,
            created_at,
            updated_at
          FROM dbo.game_saves
          WHERE id = @saveId AND user_id = @userId
        `,
        [
          { name: "saveId", type: sql.UniqueIdentifier, value: saveId },
          { name: "userId", type: sql.NVarChar, value: user.id },
          { name: "saveName", type: sql.NVarChar, value: saveName },
          { name: "gameState", type: sql.NVarChar(sql.MAX), value: gameState },
        ],
      );

      const row = result?.recordset?.[0];
      if (!row) {
        context.res = jsonResponse(404, {
          ok: false,
          errorCode: "SAVE_NOT_FOUND",
          message: "Save not found.",
        });
        return;
      }

      context.res = jsonResponse(200, {
        ok: true,
        save: {
          id: row.id,
          save_name: row.save_name,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      });
      return;
    }

    if (method === "DELETE" && saveId) {
      if (!isGuid(saveId)) {
        context.res = jsonResponse(400, {
          ok: false,
          errorCode: "INVALID_SAVE_ID",
          message: "Invalid save id.",
        });
        return;
      }
      const result = await query(
        `
          DELETE FROM dbo.game_saves
          WHERE id = @saveId AND user_id = @userId;
          SELECT @@ROWCOUNT AS affected;
        `,
        [
          { name: "saveId", type: sql.UniqueIdentifier, value: saveId },
          { name: "userId", type: sql.NVarChar, value: user.id },
        ],
      );

      const affected = result?.recordset?.[0]?.affected || 0;
      if (affected === 0) {
        context.res = jsonResponse(404, {
          ok: false,
          errorCode: "SAVE_NOT_FOUND",
          message: "Save not found.",
        });
        return;
      }

      context.res = jsonResponse(200, {
        ok: true,
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
