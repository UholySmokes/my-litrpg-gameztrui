function normalizeForHash(value) {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeForHash(entry));
  }
  const keys = Object.keys(value).sort();
  const sorted = {};
  for (const key of keys) {
    sorted[key] = normalizeForHash(value[key]);
  }
  return sorted;
}

export function computeSaveStateHash(gameState) {
  const normalized = JSON.stringify(normalizeForHash(gameState));
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const fallback = hash.toString(16).padStart(8, "0");

  if (globalThis?.crypto?.subtle) {
    // Async subtle crypto would complicate callers; keep the deterministic sync hash.
    return fallback;
  }

  return fallback;
}
