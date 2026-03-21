const ALLOWED_MOODS = new Set([
  "neutral",
  "tense",
  "triumphant",
  "mysterious",
  "serene",
  "desperate",
]);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSuggestionEntry(entry) {
  if (typeof entry === "string" && entry.trim()) {
    return entry.trim();
  }
  if (entry && typeof entry === "object" && !Array.isArray(entry)) {
    const text = normalizeString(entry.t || entry.text || entry.label);
    if (!text) return null;
    const weight = Number(entry.w ?? entry.weight);
    return Number.isFinite(weight)
      ? { t: text, w: Math.max(0, Math.min(1, weight)) }
      : { t: text };
  }
  return null;
}

function normalizeSuggestions(suggestions, fallbackSuggestions = []) {
  const source = Array.isArray(suggestions) ? suggestions : fallbackSuggestions;
  const normalized = source
    .map((entry) => normalizeSuggestionEntry(entry))
    .filter(Boolean)
    .slice(0, 3);
  return normalized;
}

function normalizeMood(mood, fallback = "neutral") {
  const normalized = normalizeString(mood).toLowerCase();
  return ALLOWED_MOODS.has(normalized) ? normalized : fallback;
}

function normalizeNarrationPayload(payload, fallback = {}) {
  const narrative = normalizeString(payload?.narrative || fallback.narrative);
  if (!narrative) {
    throw new Error("Narration payload missing narrative text.");
  }

  return {
    narrative,
    mood: normalizeMood(payload?.mood, normalizeMood(fallback.mood, "neutral")),
    suggestions: normalizeSuggestions(payload?.suggestions, fallback.suggestions),
    provider: normalizeString(payload?.provider || payload?.backend || fallback.provider) ||
      "firebase-genkit",
    fallbackUsed: Boolean(
      payload?.fallbackUsed ?? fallback.fallbackUsed ?? false,
    ),
  };
}

module.exports = {
  normalizeNarrationPayload,
};
