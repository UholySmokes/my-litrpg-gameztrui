const { jsonResponse, getOptionalEnv } = require("../lib/azure-ai-utils");
const { query } = require("../lib/sql");

module.exports = async function health(context) {
  const server = getOptionalEnv("AZURE_SQL_SERVER");
  const database = getOptionalEnv("AZURE_SQL_DATABASE");

  if (!server || !database) {
    context.res = jsonResponse(200, {
      ok: true,
      sqlConfigured: false,
      message: "Azure SQL not configured.",
    });
    return;
  }

  try {
    await query("SELECT 1 AS ok;");
    context.res = jsonResponse(200, {
      ok: true,
      sqlConfigured: true,
      dbOk: true,
    });
  } catch (error) {
    context.res = jsonResponse(500, {
      ok: false,
      sqlConfigured: true,
      dbOk: false,
      message: String(error?.message || error || "DB connection failed"),
    });
  }
};
