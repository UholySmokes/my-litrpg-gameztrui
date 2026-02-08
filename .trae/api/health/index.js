const { jsonResponse, getOptionalEnv } = require("../lib/azure-ai-utils");
const { query } = require("../lib/sql");
const { resolveGameDbBackend, isAzureSqlConfigured, fileDb } = require("../lib/game-db");

module.exports = async function health(context) {
  const backend = resolveGameDbBackend();

  if (backend === "file") {
    const info = fileDb.health();
    context.res = jsonResponse(200, {
      ok: true,
      backend,
      sqlConfigured: isAzureSqlConfigured(),
      dbOk: true,
      file: info,
    });
    return;
  }

  const server = getOptionalEnv("AZURE_SQL_SERVER");
  const database = getOptionalEnv("AZURE_SQL_DATABASE");

  if (!server || !database) {
    context.res = jsonResponse(200, {
      ok: true,
      backend: "sql",
      sqlConfigured: false,
      message: "Azure SQL not configured.",
    });
    return;
  }

  try {
    await query("SELECT 1 AS ok;");
    context.res = jsonResponse(200, {
      ok: true,
      backend: "sql",
      sqlConfigured: true,
      dbOk: true,
    });
  } catch (error) {
    context.res = jsonResponse(500, {
      ok: false,
      backend: "sql",
      sqlConfigured: true,
      dbOk: false,
      message: String(error?.message || error || "DB connection failed"),
    });
  }
};
