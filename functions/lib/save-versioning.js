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

function safeParseJson(value) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function computeSaveStateHash(gameState) {
  const parsed = safeParseJson(gameState);
  const source = parsed && typeof parsed === "object" ? parsed : gameState;
  const normalized = JSON.stringify(normalizeForHash(source));
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function extractExpectedStateHash(body = {}) {
  const candidates = [
    body.expectedStateHash,
    body.expected_state_hash,
    body.versionToken,
    body.stateHash,
    body.state_hash,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

module.exports = {
  computeSaveStateHash,
  extractExpectedStateHash,
};
