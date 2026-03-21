/**
 * Simple in-memory rate limiter for Firebase Functions.
 * Uses a sliding window approach with IP-based tracking.
 */

const rateLimitStore = new Map();

const DEFAULT_CONFIG = {
  windowMs: 60 * 1000,
  maxRequests: 60,
  narrationMaxRequests: 10,
  message: "Too many requests, please try again later.",
};

function getClientIp(req) {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || "unknown";
}

function cleanupExpiredEntries(windowMs) {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.windowStart > windowMs * 2) {
      rateLimitStore.delete(key);
    }
  }
}

function checkRateLimit(req, config = {}) {
  const opts = { ...DEFAULT_CONFIG, ...config };
  const ip = getClientIp(req);
  const path = String(req.url || "").split("?")[0] || "/";

  const isNarration = path.includes("/narrate") || path.includes("/story/");
  const maxRequests = isNarration ? opts.narrationMaxRequests : opts.maxRequests;

  const key = `${ip}:${isNarration ? "narrate" : "general"}`;
  const now = Date.now();

  if (Math.random() < 0.01) {
    cleanupExpiredEntries(opts.windowMs);
  }

  let entry = rateLimitStore.get(key);
  if (!entry || now - entry.windowStart > opts.windowMs) {
    entry = { windowStart: now, count: 0 };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  const remaining = Math.max(0, maxRequests - entry.count);
  const resetTime = entry.windowStart + opts.windowMs;

  return {
    allowed: entry.count <= maxRequests,
    remaining,
    resetTime,
    limit: maxRequests,
    message: opts.message,
  };
}

/** Visible for testing only. */
function _resetStore() {
  rateLimitStore.clear();
}

module.exports = { checkRateLimit, DEFAULT_CONFIG, getClientIp, _resetStore };
