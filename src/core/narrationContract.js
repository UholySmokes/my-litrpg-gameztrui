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
const ALLOWED_STATE_INTENT_TYPES = new Set([
  "world.flag.set",
  "clue.add",
  "player.reputation.delta",
  "magic.journal.add",
]);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSuggestionEntry(entry) {
  if (typeof entry === "string" && entry.trim()) {
    const command = entry.trim();
    return {
      id: command.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label: command,
      command,
      enabled: true,
      weight: 1,
      w: 1,
      t: command,
    };
  }
  if (entry && typeof entry === "object" && !Array.isArray(entry)) {
    const label = normalizeString(entry.label || entry.text || entry.t || entry.command);
    const command = normalizeString(entry.command || entry.cmd || entry.t || label);
    if (!label && !command) return null;
    const weight = Number(entry.w ?? entry.weight);
    const normalizedWeight = Number.isFinite(weight)
      ? Math.max(0, Math.min(1, weight))
      : 1;
    const resolvedCommand = command || label;
    const resolvedLabel = label || resolvedCommand;
    return {
      id:
        normalizeString(entry.id) ||
        resolvedCommand.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label: resolvedLabel,
      command: resolvedCommand,
      enabled: entry.enabled !== false,
      reason: normalizeString(entry.reason),
      category: normalizeString(entry.category).toLowerCase(),
      weight: normalizedWeight,
      w: normalizedWeight,
      t: resolvedCommand,
    };
  }
  return null;
}

function normalizeSuggestions(suggestions, fallbackSuggestions = []) {
  const source = Array.isArray(suggestions) ? suggestions : fallbackSuggestions;
  return source
    .map((entry) => normalizeSuggestionEntry(entry))
    .filter(Boolean)
    .slice(0, 8);
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

function normalizeStateIntentEntry(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const type = normalizeString(value.type);
  if (!ALLOWED_STATE_INTENT_TYPES.has(type)) return null;

  if (type === "world.flag.set") {
    const flag = normalizeString(value.flag);
    if (!flag) return null;
    return { type, flag, value: Boolean(value.value) };
  }

  if (type === "clue.add") {
    const clueId = normalizeString(value.clueId);
    if (!clueId) return null;
    return { type, clueId };
  }

  if (type === "player.reputation.delta") {
    const delta = Number(value.value);
    if (!Number.isFinite(delta) || delta === 0) return null;
    return {
      type,
      value: Math.max(-5, Math.min(5, Math.round(delta))),
    };
  }

  if (type === "magic.journal.add") {
    const note = normalizeString(value.note);
    if (!note) return null;
    return { type, note };
  }

  return null;
}

function normalizeStateIntents(stateIntents) {
  if (!Array.isArray(stateIntents)) return undefined;
  const normalized = stateIntents
    .slice(0, 3)
    .map((entry) => normalizeStateIntentEntry(entry))
    .filter(Boolean);
  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeNarrationPayload(payload, fallback = {}) {
  const narrative = normalizeString(payload?.narrative || fallback.narrative);
  if (!narrative) {
    throw new Error("Narrative response missing.");
  }

  const suggestions = normalizeSuggestions(payload?.suggestions, fallback.suggestions);
  const sceneMemory = normalizeSceneMemory(
    payload?.sceneMemory || fallback.sceneMemory,
  );
  const choiceMeta = normalizeChoiceMeta(
    payload?.choiceMeta || fallback.choiceMeta,
    suggestions.length,
  );
  const stateIntents = normalizeStateIntents(
    payload?.stateIntents || fallback.stateIntents,
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
    stateIntents,
    sceneMemory,
    choiceMeta,
  };
}
