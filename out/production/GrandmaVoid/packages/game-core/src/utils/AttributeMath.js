import {
  ensureAttributeShape,
  toCanonicalAttributeKey,
} from "../constants/attributes.js";

function normalizeAttributeKey(key) {
  return toCanonicalAttributeKey(key);
}

function getAttributeValue(attributes = {}, key) {
  const canonicalAttributes = ensureAttributeShape(attributes, 0);
  const canonicalKey = normalizeAttributeKey(key);
  if (!canonicalKey) return 0;
  if (canonicalAttributes[canonicalKey] !== undefined) {
    return canonicalAttributes[canonicalKey];
  }
  if (attributes[key] !== undefined) {
    return attributes[key];
  }
  return 0;
}

function applyAttributeBonuses(baseAttributes = {}, bonuses = {}) {
  if (!bonuses || typeof bonuses !== "object") {
    return { ...baseAttributes };
  }

  const normalizedBase = ensureAttributeShape(baseAttributes, 0);
  const next = {
    ...normalizedBase,
    freePoints: baseAttributes.freePoints ?? 0,
  };
  Object.entries(bonuses).forEach(([key, value]) => {
    const normalized = normalizeAttributeKey(key);
    if (!normalized) return;
    next[normalized] = (next[normalized] || 0) + value;
  });
  return next;
}

function calculateMaxHp(attributes = {}) {
  const vitalityScore = getAttributeValue(attributes, "vitality");
  return 100 + vitalityScore * 5;
}

function calculateMaxMana(attributes = {}) {
  const intellectScore = getAttributeValue(attributes, "intelligence");
  return 50 + intellectScore * 3;
}

export {
  normalizeAttributeKey,
  getAttributeValue,
  applyAttributeBonuses,
  calculateMaxHp,
  calculateMaxMana,
  ensureAttributeShape,
};
