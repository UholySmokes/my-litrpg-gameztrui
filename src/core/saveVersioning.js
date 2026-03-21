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

function hashString(input) {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function computeSaveStateHash(gameState) {
  return hashString(JSON.stringify(normalizeForHash(gameState ?? null)));
}

export function extractSaveVersionToken(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const stateHash =
    typeof value.state_hash === "string" && value.state_hash.trim()
      ? value.state_hash.trim()
      : typeof value.stateHash === "string" && value.stateHash.trim()
        ? value.stateHash.trim()
        : null;

  if (!stateHash) {
    return null;
  }

  return {
    stateHash,
    updatedAt:
      typeof value.updated_at === "string" && value.updated_at.trim()
        ? value.updated_at.trim()
        : typeof value.updatedAt === "string" && value.updatedAt.trim()
          ? value.updatedAt.trim()
          : null,
  };
}
