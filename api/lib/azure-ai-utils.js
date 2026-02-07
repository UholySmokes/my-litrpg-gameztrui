const crypto = require("crypto");

function jsonResponse(status, body) {
  return {
    status,
    headers: { "Content-Type": "application/json" },
    body,
  };
}

function toStringSafe(value) {
  return typeof value === "string" ? value : "";
}

function getRequiredEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function getOptionalEnv(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function isTruthyFlag(value) {
  if (typeof value !== "string") return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function isProductionEnv() {
  const env = getOptionalEnv("AZURE_FUNCTIONS_ENVIRONMENT") || getOptionalEnv("NODE_ENV");
  const normalized = String(env || "").trim().toLowerCase();
  return normalized === "production" || normalized === "prod";
}

function normalizeEndpoint(endpoint) {
  return endpoint.replace(/\/+$/g, "");
}

function generateId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

function hashContent(text) {
  return crypto
    .createHash("sha256")
    .update(String(text || ""), "utf8")
    .digest("hex");
}

async function readJsonBody(req) {
  if (!req) return {};
  if (req.body && typeof req.body === "object" && req.body !== null) {
    return req.body;
  }
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

let fetchImpl = typeof fetch === "function" ? fetch : null;

async function resolveFetch() {
  if (fetchImpl) return fetchImpl;
  try {
    const mod = await import("undici");
    fetchImpl = mod.fetch;
  } catch {
    fetchImpl = null;
  }
  if (!fetchImpl) {
    throw new Error("fetch is not available in this runtime");
  }
  return fetchImpl;
}

function getRetryDelayMs(attempt) {
  return Math.min(2000, 300 * (attempt + 1));
}

function createTimeoutError(timeoutMs, detail) {
  const error = new Error(`Foundry request timed out after ${timeoutMs}ms.`);
  error.status = 504;
  error.code = "FOUNDRY_REQUEST_TIMEOUT";
  if (detail) {
    error.detail = detail;
  }
  return error;
}

async function fetchJson(url, { method, token, body, retries, timeoutMs }) {
  const fetchFn = await resolveFetch();
  const maxRetries = Number.isFinite(retries) ? retries : 2;
  const requestTimeoutMs =
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? timeoutMs
      : getTimeoutMs("AZURE_AI_HTTP_TIMEOUT_MS", 30000);
  const canAbort = typeof AbortController === "function";
  let attempt = 0;

  while (true) {
    let response;
    const controller = canAbort ? new AbortController() : null;
    const timeoutId = controller
      ? setTimeout(() => controller.abort(), requestTimeoutMs)
      : null;
    try {
      response = await fetchFn(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller ? controller.signal : undefined,
      });
    } catch (error) {
      const isTimeout = error?.name === "AbortError";
      const normalizedError = isTimeout
        ? createTimeoutError(requestTimeoutMs, {
            url,
            method,
            timeoutMs: requestTimeoutMs,
          })
        : error;
      const methodUpper = String(method || "GET").toUpperCase();
      const retryTimeouts = methodUpper === "GET" || methodUpper === "HEAD";

      if (attempt < maxRetries && (!isTimeout || retryTimeouts)) {
        await new Promise((r) => setTimeout(r, getRetryDelayMs(attempt)));
        attempt += 1;
        continue;
      }
      throw normalizedError;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!response.ok) {
      const detail = json || text || response.statusText;
      const error = new Error(`Foundry request failed (${response.status})`);
      error.status = response.status;
      error.detail = detail;

      if (
        [429, 500, 502, 503, 504].includes(response.status) &&
        attempt < maxRetries
      ) {
        await new Promise((r) => setTimeout(r, getRetryDelayMs(attempt)));
        attempt += 1;
        continue;
      }

      throw error;
    }

    return json;
  }
}

function extractAssistantText(messagesResponse) {
  const data = Array.isArray(messagesResponse?.data)
    ? messagesResponse.data
    : Array.isArray(messagesResponse?.messages)
      ? messagesResponse.messages
      : [];

  for (const message of data) {
    if (message?.role !== "assistant") continue;
    const content = message?.content;

    if (typeof content === "string" && content.trim()) return content.trim();

    if (Array.isArray(content)) {
      const parts = [];
      for (const item of content) {
        const textValue = item?.text?.value;
        if (typeof textValue === "string" && textValue.trim())
          parts.push(textValue.trim());
        const directText = item?.text;
        if (typeof directText === "string" && directText.trim())
          parts.push(directText.trim());
      }
      if (parts.length) return parts.join("\n");
    }

    const nestedText = message?.content?.text?.value;
    if (typeof nestedText === "string" && nestedText.trim())
      return nestedText.trim();
  }
  return "";
}

function getApiVersion() {
  return (
    getOptionalEnv("AZURE_AI_API_VERSION") ||
    getOptionalEnv("FOUNDRY_API_VERSION") ||
    "2025-05-01"
  );
}

function getTimeoutMs(name, fallbackMs) {
  const raw = getOptionalEnv(name);
  const parsed = Number.parseInt(raw, 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return fallbackMs;
}

const inMemoryRateState = new Map();
let redisClientPromise = null;

function getRedisUrl() {
  return getOptionalEnv("REDIS_URL") || getOptionalEnv("REDIS_CONNECTION_STRING");
}

async function getRedisClient() {
  const url = getRedisUrl();
  if (!url) return null;
  if (!redisClientPromise) {
    const { createClient } = require("redis");
    const client = createClient({ url });
    redisClientPromise = client
      .connect()
      .then(() => client)
      .catch((err) => {
        redisClientPromise = null;
        throw err;
      });
  }
  return redisClientPromise;
}

function cleanupInMemory(now) {
  if (inMemoryRateState.size < 5000) return;
  for (const [key, entry] of inMemoryRateState.entries()) {
    if (entry.expiresAt <= now) {
      inMemoryRateState.delete(key);
    }
  }
}

async function rateLimit(key, limit, options = {}) {
  if (!limit || limit <= 0) return true;
  const windowMs = options.windowMs ?? 60000;
  const now = Date.now();
  const windowKey = Math.floor(now / windowMs);
  const cacheKey = `rate:${key}:${windowKey}`;
  const requireRedis =
    isTruthyFlag(getOptionalEnv("REQUIRE_REDIS_RATE_LIMIT")) || isProductionEnv();
  const redisUrl = getRedisUrl();

  if (requireRedis && !redisUrl) {
    throw new Error("Redis is required for rate limiting but REDIS_URL is not configured.");
  }

  try {
    const client = await getRedisClient();
    if (client) {
      const count = await client.incr(cacheKey);
      if (count === 1) {
        await client.pExpire(cacheKey, windowMs);
      }
      return count <= limit;
    }
  } catch (err) {
    if (requireRedis) {
      throw err;
    }
    const logger = options.logger;
    if (typeof logger === "function") {
      logger(`rateLimit redis error: ${String(err?.message || err)}`);
    }
  }

  const entry = inMemoryRateState.get(cacheKey) || {
    count: 0,
    expiresAt: now + windowMs,
  };
  if (entry.expiresAt <= now) {
    entry.count = 0;
    entry.expiresAt = now + windowMs;
  }
  entry.count += 1;
  inMemoryRateState.set(cacheKey, entry);
  cleanupInMemory(now);
  return entry.count <= limit;
}

module.exports = {
  jsonResponse,
  toStringSafe,
  getRequiredEnv,
  getOptionalEnv,
  isTruthyFlag,
  isProductionEnv,
  normalizeEndpoint,
  generateId,
  hashContent,
  readJsonBody,
  resolveFetch,
  fetchJson,
  extractAssistantText,
  getApiVersion,
  getTimeoutMs,
  rateLimit,
  getRedisClient,
  getRedisUrl,
};
