const { jsonResponse } = require("../lib/azure-ai-utils");
const { query, sql } = require("../lib/sql");
const { resolveGameDbBackend, fileDb } = require("../lib/game-db");

const DEFAULT_BUNDLE_KEY = "core";

module.exports = async function staticData(context, req) {
  try {
    const bundleKey =
      req?.params?.bundleKey ||
      req?.query?.bundleKey ||
      DEFAULT_BUNDLE_KEY;

    const backend = resolveGameDbBackend();
    if (backend === "file") {
      const row = fileDb.getStaticBundle(bundleKey);
      if (!row) {
        context.res = jsonResponse(404, {
          ok: false,
          errorCode: "BUNDLE_NOT_FOUND",
          message: `Static bundle '${bundleKey}' not found. Seed the database first.`,
        });
        return;
      }

      let payload = null;
      try {
        payload = JSON.parse(row.payload);
      } catch {
        payload = null;
      }

      if (!payload) {
        context.res = jsonResponse(500, {
          ok: false,
          errorCode: "INVALID_BUNDLE",
          message: `Static bundle '${bundleKey}' is invalid JSON.`,
        });
        return;
      }

      context.res = {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
        },
        body: {
          ok: true,
          bundleKey,
          updatedAt: row.updated_at,
          bundle: payload,
        },
      };
      return;
    }

    const result = await query(
      `
        SELECT TOP (1)
          payload,
          updated_at
        FROM dbo.game_static_bundles
        WHERE bundle_key = @bundleKey
      `,
      [{ name: "bundleKey", type: sql.NVarChar, value: bundleKey }],
    );

    const row = result?.recordset?.[0];
    if (!row) {
      context.res = jsonResponse(404, {
        ok: false,
        errorCode: "BUNDLE_NOT_FOUND",
        message: `Static bundle '${bundleKey}' not found. Seed the database first.`,
      });
      return;
    }

    let payload = null;
    try {
      payload = JSON.parse(row.payload);
    } catch {
      payload = null;
    }

    if (!payload) {
      context.res = jsonResponse(500, {
        ok: false,
        errorCode: "INVALID_BUNDLE",
        message: `Static bundle '${bundleKey}' is invalid JSON.`,
      });
      return;
    }

    context.res = {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
      body: {
        ok: true,
        bundleKey,
        updatedAt: row.updated_at,
        bundle: payload,
      },
    };
  } catch (error) {
    context.res = jsonResponse(500, {
      ok: false,
      errorCode: "STATIC_DATA_ERROR",
      message: String(error?.message || error || "Unknown error"),
    });
  }
};
