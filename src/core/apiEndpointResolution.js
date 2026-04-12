const isTruthyFlag = (value) =>
  typeof value === "string" &&
  ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());

const parseCsv = (value) => {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const getHostnameFromUrl = (value) => {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
};

const matchesHostRule = (hostname, rule) => {
  const normalizedRule = String(rule || "").trim().toLowerCase();
  if (!normalizedRule) return false;

  if (normalizedRule.includes("://")) {
    const fromUrl = getHostnameFromUrl(normalizedRule);
    return fromUrl ? hostname === fromUrl : false;
  }

  if (normalizedRule.startsWith("*.")) {
    const suffix = normalizedRule.slice(1); // ".example.com"
    return hostname.endsWith(suffix);
  }

  return hostname === normalizedRule;
};

const isLocalHostname = (hostname) =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "[::1]" ||
  hostname.endsWith(".local");

const defaultAllowedHosts = [
  "void-verse.com",
  "*.web.app",
  "*.firebaseapp.com",
  "*.cloudfunctions.net",
  "localhost",
  "127.0.0.1",
  "[::1]",
];

export function resolveAllowExternalApiBaseUrl({ runtimeEnv = {}, buildEnv = {} } = {}) {
  return isTruthyFlag(
    runtimeEnv.VITE_ALLOW_EXTERNAL_API_BASE_URL ??
      buildEnv.VITE_ALLOW_EXTERNAL_API_BASE_URL ??
      runtimeEnv.VITE_ALLOW_EXTERNAL_API_BASE ??
      buildEnv.VITE_ALLOW_EXTERNAL_API_BASE ??
      runtimeEnv.VITE_ALLOW_EXTERNAL_API ??
      buildEnv.VITE_ALLOW_EXTERNAL_API,
  );
}

export function resolveAllowedApiHosts({ runtimeEnv = {}, buildEnv = {} } = {}) {
  const fromEnv = parseCsv(
    runtimeEnv.VITE_API_ALLOWED_HOSTS ??
      buildEnv.VITE_API_ALLOWED_HOSTS ??
      runtimeEnv.VITE_API_ALLOWED_ORIGINS ??
      buildEnv.VITE_API_ALLOWED_ORIGINS,
  );
  return fromEnv.length > 0 ? fromEnv : defaultAllowedHosts;
}

export function sanitizeEndpoint(value, { allowExternal = false, allowedHosts = [] } = {}) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return undefined;
  if (trimmed.startsWith("//")) return undefined;

  // Relative path (preferred)
  const looksAbsolute = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  if (!looksAbsolute) return trimmed;

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    return undefined;
  }

  const protocol = url.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") return undefined;
  if (protocol === "http:" && !isLocalHostname(url.hostname.toLowerCase())) {
    return undefined;
  }

  const currentOrigin =
    typeof globalThis !== "undefined" && globalThis.location?.origin
      ? String(globalThis.location.origin)
      : "";
  if (currentOrigin && trimmed.startsWith(currentOrigin)) {
    return trimmed;
  }

  if (!allowExternal) return undefined;

  const hostname = url.hostname.toLowerCase();
  const rules = Array.isArray(allowedHosts) && allowedHosts.length > 0
    ? allowedHosts
    : defaultAllowedHosts;
  if (!rules.some((rule) => matchesHostRule(hostname, rule))) {
    return undefined;
  }

  return trimmed;
}

export function resolveApiBaseCandidates({
  runtimeEnv = {},
  buildEnv = {},
  allowExternal = false,
  allowedHosts = [],
  pickEnvValue,
} = {}) {
  const pick = typeof pickEnvValue === "function" ? pickEnvValue : (...values) => {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return undefined;
  };

  const primary = sanitizeEndpoint(
    pick(
      runtimeEnv.VITE_API_BASE_URL,
      buildEnv.VITE_API_BASE_URL,
      runtimeEnv.VITE_API_BASE,
      buildEnv.VITE_API_BASE,
    ),
    { allowExternal, allowedHosts },
  );

  const fallback = sanitizeEndpoint(
    pick(
      runtimeEnv.VITE_API_FALLBACK_BASE_URL,
      buildEnv.VITE_API_FALLBACK_BASE_URL,
      runtimeEnv.VITE_API_BASE_FALLBACK,
      buildEnv.VITE_API_BASE_FALLBACK,
      runtimeEnv.VITE_FALLBACK_API_BASE_URL,
      buildEnv.VITE_FALLBACK_API_BASE_URL,
    ),
    { allowExternal, allowedHosts },
  );

  const result = [];
  for (const candidate of [primary, fallback]) {
    if (!candidate || result.includes(candidate)) continue;
    result.push(candidate);
  }

  return result;
}

