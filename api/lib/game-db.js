const { getOptionalEnv, isProductionEnv } = require("./azure-ai-utils");
const fileDb = require("./game-db-file");

function normalizeBackend(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
  if (!normalized) return "";
  if (["file", "json", "local", "filesystem", "fs"].includes(normalized))
    return "file";
  if (["sql", "mssql", "azure-sql", "azuresql"].includes(normalized))
    return "sql";
  return normalized;
}

function isAzureSqlConfigured() {
  const server = getOptionalEnv("AZURE_SQL_SERVER");
  const database = getOptionalEnv("AZURE_SQL_DATABASE");
  return Boolean(server && database);
}

function resolveGameDbBackend() {
  const overrideRaw = getOptionalEnv("GAME_DB_STORAGE");
  const override = normalizeBackend(overrideRaw);
  if (override === "sql" || override === "file") return override;

  if (isAzureSqlConfigured()) return "sql";
  if (isProductionEnv()) return "sql";
  return "file";
}

module.exports = {
  resolveGameDbBackend,
  isAzureSqlConfigured,
  fileDb,
};

