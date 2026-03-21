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
  const normalized = {};
  for (const key of keys) {
    normalized[key] = normalizeForHash(value[key]);
  }
  return normalized;
}

function safeParseJson(value) {
  if (value && typeof value === "object") {
    return value;
  }
  if (typeof value !== "string") {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function hashString(input) {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function computeStateHash(gameStateInput) {
  const parsed = safeParseJson(gameStateInput);
  const normalized = normalizeForHash(parsed ?? gameStateInput ?? null);
  return hashString(JSON.stringify(normalized));
}

function extractExpectedStateHash(body = {}) {
  const candidates = [
    body.expectedStateHash,
    body.expected_state_hash,
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
  computeStateHash,
  computeSaveStateHash: computeStateHash,
  extractExpectedStateHash,
};
