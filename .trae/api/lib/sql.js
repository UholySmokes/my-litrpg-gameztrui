const sql = require("mssql");
const { DefaultAzureCredential } = require("@azure/identity");
const { getOptionalEnv, getRequiredEnv } = require("./azure-ai-utils");

const SQL_SCOPE = "https://database.windows.net/.default";
let credentialCache = null;
let credentialClientId = null;

function getCredential() {
  const clientId =
    getOptionalEnv("AZURE_SQL_CLIENT_ID") || getOptionalEnv("AZURE_CLIENT_ID");
  if (!credentialCache || credentialClientId !== clientId) {
    credentialClientId = clientId;
    credentialCache = clientId
      ? new DefaultAzureCredential({ managedIdentityClientId: clientId })
      : new DefaultAzureCredential();
  }
  return credentialCache;
}

async function getAccessToken() {
  const credential = getCredential();
  const token = await credential.getToken(SQL_SCOPE);
  if (!token?.token) {
    throw new Error("Managed identity token acquisition failed.");
  }
  return token.token;
}

function getBaseConfig() {
  const server = getRequiredEnv("AZURE_SQL_SERVER");
  const database = getRequiredEnv("AZURE_SQL_DATABASE");
  if (!server || !database) {
    throw new Error("Missing AZURE_SQL_SERVER or AZURE_SQL_DATABASE.");
  }

  const encrypt = getOptionalEnv("AZURE_SQL_ENCRYPT", "true") !== "false";
  const trustServerCertificate =
    getOptionalEnv("AZURE_SQL_TRUST_SERVER_CERT", "false") === "true";

  return {
    server,
    database,
    options: {
      encrypt,
      trustServerCertificate,
    },
  };
}

async function getSqlConfig() {
  const base = getBaseConfig();
  const user = getOptionalEnv("AZURE_SQL_USER");
  const password = getOptionalEnv("AZURE_SQL_PASSWORD");

  if (user && password) {
    return {
      ...base,
      user,
      password,
    };
  }

  const token = await getAccessToken();
  return {
    ...base,
    authentication: {
      type: "azure-active-directory-access-token",
      options: {
        token,
      },
    },
  };
}

async function withConnection(action) {
  const config = await getSqlConfig();
  const pool = new sql.ConnectionPool(config);
  await pool.connect();
  try {
    return await action(pool);
  } finally {
    await pool.close().catch(() => {});
  }
}

async function query(text, params = []) {
  return withConnection(async (pool) => {
    const request = pool.request();
    for (const param of params) {
      request.input(
        param.name,
        param.type || sql.NVarChar,
        param.value ?? null,
      );
    }
    return request.query(text);
  });
}

module.exports = {
  sql,
  query,
  withConnection,
};
