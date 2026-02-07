function getHeader(req, name) {
  if (!req || !req.headers) return "";
  const lower = name.toLowerCase();
  return req.headers[lower] || req.headers[name] || "";
}

function parseClientPrincipal(encoded) {
  if (!encoded) return null;
  try {
    const json = Buffer.from(encoded, "base64").toString("utf8");
    const principal = JSON.parse(json);
    if (!principal || typeof principal !== "object") return null;
    const userId = principal.userId || principal.userDetails;
    if (!userId) return null;
    return {
      id: String(userId),
      email: principal.userDetails ? String(principal.userDetails) : String(userId),
      provider: principal.identityProvider ? String(principal.identityProvider) : "",
      roles: Array.isArray(principal.userRoles) ? principal.userRoles : [],
    };
  } catch {
    return null;
  }
}

function getDevUser(req) {
  if (process.env.NODE_ENV === "production" || process.env.AZURE_FUNCTIONS_ENVIRONMENT === "Production") {
    return null;
  }

  const envUserId = process.env.DEV_USER_ID;
  if (envUserId) {
    return {
      id: String(envUserId),
      email: String(process.env.DEV_USER_EMAIL || envUserId),
      provider: "dev",
      roles: ["authenticated"],
    };
  }

  const headerUserId = getHeader(req, "x-dev-user-id");
  if (headerUserId) {
    return {
      id: String(headerUserId),
      email: String(getHeader(req, "x-dev-user-email") || headerUserId),
      provider: "dev",
      roles: ["authenticated"],
    };
  }

  return null;
}

function getUserFromRequest(req) {
  const devUser = getDevUser(req);
  if (devUser) return devUser;

  const principalHeader = getHeader(req, "x-ms-client-principal");
  const parsed = parseClientPrincipal(principalHeader);
  if (parsed) return parsed;

  const principalId = getHeader(req, "x-ms-client-principal-id");
  const principalName = getHeader(req, "x-ms-client-principal-name");
  if (principalId || principalName) {
    const id = principalId || principalName;
    return {
      id: String(id),
      email: String(principalName || principalId || id),
      provider: String(getHeader(req, "x-ms-client-principal-idp") || ""),
      roles: ["authenticated"],
    };
  }

  return null;
}

module.exports = {
  getUserFromRequest,
};
