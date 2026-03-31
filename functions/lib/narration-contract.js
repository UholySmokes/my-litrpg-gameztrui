const ALLOWED_MOODS = new Set([
  "neutral",
  "tense",
  "triumphant",
  "mysterious",
  "serene",
  "desperate",
]);
const ALLOWED_CHOICE_CATEGORIES = new Set([
  "observe",
  "social",
  "progress",
  "recovery",
  "power",
  "risk",
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

function normalizeStringList(value, maxItems = 6) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const normalized = [];
  for (const entry of value) {
    const item = normalizeString(entry);
    const key = item.toLowerCase();
    if (!item || seen.has(key)) continue;
    seen.add(key);
    normalized.push(item);
    if (normalized.length >= maxItems) break;
  }
  return normalized;
}

function normalizeMood(mood, fallback = "neutral") {
  const normalized = normalizeString(mood).toLowerCase();
  return ALLOWED_MOODS.has(normalized) ? normalized : fallback;
}

function normalizeSceneMemory(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;

  const sceneMemory = {
    locationLabel: normalizeString(value.locationLabel),
    zoneLabel: normalizeString(value.zoneLabel),
    immediateObjective: normalizeString(value.immediateObjective),
    presentEntities: normalizeStringList(value.presentEntities),
    activeThreats: normalizeStringList(value.activeThreats),
    unresolvedHooks: normalizeStringList(value.unresolvedHooks),
    lastConsequence: normalizeString(value.lastConsequence),
  };

  const hasContent = Object.values(sceneMemory).some((entry) =>
    Array.isArray(entry) ? entry.length > 0 : Boolean(entry),
  );
  return hasContent ? sceneMemory : undefined;
}

function normalizeChoiceMetaEntry(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const category = normalizeString(value.category).toLowerCase();
  const urgency = Number(value.urgency);
  const normalized = {
    intent: normalizeString(value.intent),
    category: ALLOWED_CHOICE_CATEGORIES.has(category) ? category : "",
    urgency: Number.isFinite(urgency) ? Math.max(0, Math.min(1, urgency)) : undefined,
    groundedInState: Boolean(value.groundedInState),
  };
  const hasContent = Boolean(normalized.intent || normalized.category);
  return hasContent ? normalized : null;
}

function normalizeChoiceMeta(choiceMeta, suggestionCount) {
  if (!Array.isArray(choiceMeta) || suggestionCount <= 0) return undefined;
  const normalized = choiceMeta
    .slice(0, suggestionCount)
    .map((entry) => normalizeChoiceMetaEntry(entry));
  const hasContent = normalized.some(Boolean);
  return hasContent ? normalized : undefined;
}

function normalizeNarrationPayload(payload, fallback = {}) {
  const narrative = normalizeString(payload?.narrative || fallback.narrative);
  if (!narrative) {
    throw new Error("Narration payload missing narrative text.");
  }

  const suggestions = normalizeSuggestions(payload?.suggestions, fallback.suggestions);
  const sceneMemory = normalizeSceneMemory(
    payload?.sceneMemory || fallback.sceneMemory,
  );
  const choiceMeta = normalizeChoiceMeta(
    payload?.choiceMeta || fallback.choiceMeta,
    suggestions.length,
  );

  return {
    narrative,
    mood: normalizeMood(payload?.mood, normalizeMood(fallback.mood, "neutral")),
    suggestions,
    provider: normalizeString(payload?.provider || payload?.backend || fallback.provider) ||
      "firebase-genkit",
    fallbackUsed: Boolean(
      payload?.fallbackUsed ?? fallback.fallbackUsed ?? false,
    ),
    sceneMemory,
    choiceMeta,
  };
}

module.exports = {
  normalizeNarrationPayload,
};
