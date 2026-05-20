import {
  getAccessibleLocationIds,
  getLocationById,
  getZoneEntryLocationId,
  getZoneById,
} from "../../world/WorldDataRegistry.js";
import {
  getPlayerArchetypeSystemLabel,
  resolvePlayerArchetypeSystem,
} from "../../systems/archetype/resolvePlayerArchetypeSystem.js";
import { toNumber } from "../../utils/shared.js";
import {
  deriveAdventureOnboardingTier,
  getAdventureOnboardingContext,
  isAdventureSurfaceUnlocked,
} from "../../core/creationOnboarding.js";

const toSuggestionId = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "suggestion";

function createSuggestionRecord({
  id,
  label,
  command,
  weight = 1,
  enabled = true,
  reason = "",
  category = "",
  groundedInState = true,
} = {}) {
  const resolvedCommand = String(command || label || "").trim();
  if (!resolvedCommand) return null;
  const resolvedLabel = String(label || resolvedCommand).trim();
  const normalizedWeight = Number.isFinite(weight)
    ? Math.min(1, Math.max(0.35, weight))
    : 1;

  return {
    id: String(id || toSuggestionId(resolvedCommand)),
    label: resolvedLabel,
    command: resolvedCommand,
    enabled: enabled !== false,
    reason: String(reason || "").trim(),
    category: String(category || "").trim().toLowerCase(),
    groundedInState: Boolean(groundedInState),
    weight: normalizedWeight,
    w: normalizedWeight,
    t: resolvedCommand,
  };
}

export const FIXED_ACTION_SUGGESTIONS = [
  createSuggestionRecord({
    id: "look-around",
    label: "Look Around",
    command: "look around",
    weight: 1,
    category: "observe",
  }),
  createSuggestionRecord({
    id: "check-status",
    label: "Check Status",
    command: "check status",
    weight: 0.94,
    category: "power",
  }),
  createSuggestionRecord({
    id: "open-inventory",
    label: "Open Inventory",
    command: "open inventory",
    weight: 0.9,
    category: "power",
  }),
];

export const CONTEXT_SUGGESTION_FILLERS = [
  createSuggestionRecord({
    id: "sense-ambient-essence",
    label: "Sense Ambient Essence",
    command: "sense ambient essence",
    weight: 0.84,
    category: "observe",
  }),
  createSuggestionRecord({
    id: "inspect-system-label",
    label: "Inspect System Label",
    command: "inspect System label",
    weight: 0.82,
    category: "observe",
  }),
  createSuggestionRecord({
    id: "check-oath",
    label: "Check Oath",
    command: "check oath",
    weight: 0.8,
    category: "observe",
  }),
  createSuggestionRecord({
    id: "rest",
    label: "Rest",
    command: "rest",
    weight: 0.78,
    category: "recovery",
  }),
];

export const DEFAULT_ACTION_SUGGESTIONS = [
  ...FIXED_ACTION_SUGGESTIONS,
  ...CONTEXT_SUGGESTION_FILLERS,
];
export const SUGGESTION_CATEGORY_ORDER = [
  "observe",
  "social",
  "progress",
  "recovery",
  "power",
  "risk",
];
const SUGGESTION_CATEGORY_SET = new Set(SUGGESTION_CATEGORY_ORDER);
const GENERIC_ENTITY_REFERENCES = new Set([
  "area",
  "altar",
  "artifact",
  "battle",
  "enemy",
  "foe",
  "locals",
  "location",
  "inventory",
  "quests",
  "quest",
  "route",
  "status",
  "system",
  "magic",
  "essence",
  "pattern",
  "weave",
  "resonance",
  "threat",
  "surroundings",
  "sigil",
  "seal",
  "signal",
  "whisper",
  "door",
  "gate",
  "npc",
  "nearby npc",
]);

function normalizeSingleActionSuggestion(suggestion, choiceMetaEntry) {
  const label =
    typeof suggestion === "string"
      ? suggestion
      : suggestion?.label || suggestion?.text || suggestion?.t || suggestion?.command || "";
  const command =
    typeof suggestion === "object" && suggestion
      ? suggestion.command || suggestion.cmd || suggestion.t || suggestion.text || suggestion.label
      : label;
  const trimmed = String(command || label || "").trim();
  if (!trimmed) return null;

  const rawWeight =
    typeof suggestion === "object" &&
    Number.isFinite(Number(suggestion?.w ?? suggestion?.weight))
      ? Number(suggestion.w ?? suggestion.weight)
      : 1;
  const metaUrgency = Number(choiceMetaEntry?.urgency);
  const resolvedWeight = Number.isFinite(metaUrgency) ? metaUrgency : rawWeight;

  return createSuggestionRecord({
    id: suggestion?.id,
    label: String(label || trimmed).trim(),
    command: trimmed,
    weight: resolvedWeight,
    enabled: suggestion?.enabled !== false,
    reason: suggestion?.reason || "",
    category: suggestion?.category || choiceMetaEntry?.category || "",
    groundedInState:
      suggestion?.groundedInState ?? choiceMetaEntry?.groundedInState ?? true,
  });
}

export function normalizeActionSuggestions(
  suggestions = [],
  { maxItems = 8, choiceMeta = [] } = {},
) {
  const normalized = (Array.isArray(suggestions) ? suggestions : [])
    .map((suggestion, index) =>
      normalizeSingleActionSuggestion(suggestion, choiceMeta[index]),
    )
    .filter(Boolean);
  const seen = new Set();

  return normalized.filter((suggestion) => {
    const key = suggestion.t.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, maxItems);
}

function inferSuggestionCategory(label = "") {
  const value = String(label || "").toLowerCase();
  if (
    /\b(look|inspect|study|scan|sense|observe|check|read|listen|survey|examine)\b/.test(
      value,
    )
  ) {
    return "observe";
  }
  if (
    /\b(talk|speak|ask|negotiate|greet|question|parley|locals|npc)\b/.test(value)
  ) {
    return "social";
  }
  if (
    /\b(follow|continue|advance|pursue|explore|travel|open|unlock|investigate|search)\b/.test(
      value,
    )
  ) {
    return "progress";
  }
  if (
    /\b(rest|recover|heal|drink potion|stabilize|anchor|purge|calm)\b/.test(value)
  ) {
    return "recovery";
  }
  if (
    /\b(use skill|train|practice|cast|weave|release|draw essence|refine|meditate|probe|status)\b/.test(
      value,
    )
  ) {
    return "power";
  }
  if (
    /\b(attack|escape|retreat|risk|gamble|rush|charge|ambush)\b/.test(value)
  ) {
    return "risk";
  }
  return "progress";
}

function getSceneMemory(state = {}) {
  return state?.narrative?.sceneMemory &&
    typeof state.narrative.sceneMemory === "object" &&
    !Array.isArray(state.narrative.sceneMemory)
    ? state.narrative.sceneMemory
    : {};
}

function getKnownEntities(state = {}) {
  const sceneMemory = getSceneMemory(state);
  const combatEnemies = Array.isArray(state?.combat?.enemies)
    ? state.combat.enemies
        .map((enemy) => enemy?.name)
        .filter((value) => typeof value === "string" && value.trim())
    : [];
  const quests = Array.isArray(state?.quests?.active)
    ? state.quests.active
        .map((quest) => quest?.name)
        .filter((value) => typeof value === "string" && value.trim())
    : [];
  return [
    ...(Array.isArray(sceneMemory.presentEntities) ? sceneMemory.presentEntities : []),
    ...(Array.isArray(sceneMemory.familiarEntities) ? sceneMemory.familiarEntities : []),
    ...(Array.isArray(sceneMemory.partyEntities) ? sceneMemory.partyEntities : []),
    ...combatEnemies,
    ...quests,
    sceneMemory.locationLabel,
    sceneMemory.zoneLabel,
  ]
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim());
}

function extractReferencedEntity(label = "") {
  const match = String(label || "").match(
    /\b(?:talk to|speak with|ask|follow|attack|inspect|approach|help|protect|escort)\s+([a-z][a-z' -]{2,}?)(?=\s+(?:about|toward|towards|for)\b|$)/i,
  );
  return String(match?.[1] || "")
    .replace(/^(?:(?:about|toward|towards|the|a|an)\s+)+/i, "")
    .trim();
}

function referencesMissingEntity(label, state) {
  const referenced = extractReferencedEntity(label);
  if (!referenced) return false;
  const normalizedReference = referenced.toLowerCase();
  if (GENERIC_ENTITY_REFERENCES.has(normalizedReference)) return false;
  const knownEntities = getKnownEntities(state).map((entry) => entry.toLowerCase());
  return !knownEntities.some(
    (entity) =>
      entity.includes(normalizedReference) || normalizedReference.includes(entity),
  );
}

function isValidForCombatContext(label, state) {
  const value = String(label || "").toLowerCase();
  const inCombat = Boolean(
    state?.combat?.inCombat ?? state?.combat?.status === "active",
  );
  const combatOnly = /\b(attack|parry|dodge|escape|retreat from battle|target enemy)\b/;
  const safeOnly = /\b(visit shop|talk to locals|leave politely|review quests)\b/;
  if (!inCombat && combatOnly.test(value)) return false;
  if (inCombat && safeOnly.test(value)) return false;
  return true;
}

function normalizeChoiceMetaEntry(choiceMetaEntry = {}) {
  if (!choiceMetaEntry || typeof choiceMetaEntry !== "object" || Array.isArray(choiceMetaEntry)) {
    return null;
  }
  const category = String(choiceMetaEntry.category || "").trim().toLowerCase();
  const intent = String(choiceMetaEntry.intent || "").trim();
  return {
    intent,
    category: SUGGESTION_CATEGORY_SET.has(category)
      ? category
      : intent
        ? inferSuggestionCategory(intent)
        : "",
    urgency: Number.isFinite(Number(choiceMetaEntry.urgency))
      ? Math.max(0, Math.min(1, Number(choiceMetaEntry.urgency)))
      : undefined,
    groundedInState: Boolean(choiceMetaEntry.groundedInState),
  };
}

function validateSuggestionCandidate(candidate, state, choiceMetaEntry) {
  const actionText = candidate?.command || candidate?.t || candidate?.label || "";
  if (!actionText) return null;
  if (!isValidForCombatContext(actionText, state)) return null;
  if (referencesMissingEntity(actionText, state)) return null;
  const normalizedMeta = normalizeChoiceMetaEntry(choiceMetaEntry);
  const category = normalizedMeta?.category || inferSuggestionCategory(actionText);
  return {
    ...candidate,
    category,
    groundedInState:
      Boolean(normalizedMeta?.groundedInState) || !referencesMissingEntity(actionText, state),
  };
}

export function resolveActionSuggestions({
  preferredSuggestions,
  preferredChoiceMeta,
  fallbackSuggestions = DEFAULT_ACTION_SUGGESTIONS,
  state,
  maxItems = 8,
} = {}) {
  const accepted = [];
  const seen = new Set();
  const categories = new Set();
  const tryAdd = (candidate, choiceMetaEntry) => {
    const actionText = candidate?.command || candidate?.t || candidate?.label || "";
    if (!actionText || accepted.length >= maxItems) return;
    const key = actionText.toLowerCase();
    if (seen.has(key)) return;
    const validated = validateSuggestionCandidate(candidate, state, choiceMetaEntry);
    if (!validated) return;
    seen.add(key);
    accepted.push(
      createSuggestionRecord({
        ...validated,
        command: actionText,
        label: validated.label || actionText,
        weight: validated.w ?? validated.weight ?? 1,
        category: validated.category,
        groundedInState: validated.groundedInState,
      }),
    );
    categories.add(validated.category);
  };

  const preferred = normalizeActionSuggestions(preferredSuggestions, {
    maxItems,
    choiceMeta: preferredChoiceMeta,
  });
  preferred.forEach((candidate, index) =>
    tryAdd(candidate, Array.isArray(preferredChoiceMeta) ? preferredChoiceMeta[index] : null),
  );

  const fallback = normalizeActionSuggestions(fallbackSuggestions, { maxItems: 8 });
  if (accepted.length < maxItems || categories.size < 2) {
    fallback
      .filter((candidate) => {
        const category = inferSuggestionCategory(
          candidate?.command || candidate?.t || candidate?.label || "",
        );
        return categories.size < 2 ? !categories.has(category) : true;
      })
      .forEach((candidate) => tryAdd(candidate, null));
  }
  if (accepted.length < maxItems) {
    fallback.forEach((candidate) => tryAdd(candidate, null));
  }

  return accepted.slice(0, maxItems);
}

const MOOD_PATTERNS = [
  { mood: "tense", patterns: [/danger/i, /threat/i, /ambush/i, /attack/i, /dark/i, /enemy/i, /looming/i] },
  { mood: "triumphant", patterns: [/victory/i, /triumph/i, /succeed/i, /conquer/i, /glory/i, /reward/i] },
  { mood: "mysterious", patterns: [/strange/i, /mystery/i, /whisper/i, /shadow/i, /ancient/i, /secret/i, /hidden/i] },
  { mood: "serene", patterns: [/calm/i, /peace/i, /gentle/i, /rest/i, /quiet/i, /warm/i, /soft/i] },
  { mood: "desperate", patterns: [/flee/i, /escape/i, /wound/i, /bleed/i, /dying/i, /last/i, /barely/i] },
];

const SUMMARY_REFRESH_INTERVAL = 10;

export const STREAM_PLACEHOLDER_TEXT = "Narrator gathers the next scene.";

export function inferMood(text) {
  if (!text || typeof text !== "string") return "neutral";
  for (const { mood, patterns } of MOOD_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(text))) return mood;
  }
  return "neutral";
}

export function shouldRefreshSummary(narrativeState = {}) {
  const count = Array.isArray(narrativeState.entries)
    ? narrativeState.entries.length
    : 0;
  return count > 0 && count % SUMMARY_REFRESH_INTERVAL === 0;
}

export function computeDominantMood(entries = []) {
  const recentEntries = entries.slice(-5);
  const moodCounts = {};
  for (const entry of recentEntries) {
    const mood = entry.mood || inferMood(entry.text) || "neutral";
    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
  }
  return (
    Object.entries(moodCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ||
    "neutral"
  );
}

export function buildSummaryPrompt({ previousSummary, recentLines }) {
  const summarySeed =
    typeof previousSummary === "string" && previousSummary.trim()
      ? previousSummary.trim()
      : "";

  return [
    "You are a summarization engine for an interactive LitRPG game.",
    "Write a concise memory summary of the adventure so far.",
    "Constraints:",
    "- Output plain text only (no JSON, no bullet lists).",
    "- 3 to 6 sentences.",
    "- Include: current location/zone, the main immediate goal, key threats or NPCs, and any notable system effects.",
    "- Keep it under 650 characters.",
    summarySeed ? `\nPrevious summary:\n${summarySeed}` : "",
    "\nRecent events:",
    ...recentLines.map((line) => `- ${line}`),
  ]
    .filter(Boolean)
    .join("\n");
}

function hasSealedOath(player = {}) {
  return Boolean(
    player?.startingPrompt ||
      player?.characterCreationBlueprint?.startingPrompt ||
      player?.oathOrigin?.name ||
      player?.origin?.name,
  );
}

function getLedgerDebtAmount(state = {}) {
  const player = state.player || {};
  const debt =
    player.ledgerDebt ??
    player.debt?.ledger ??
    player.contracts?.ledgerDebt ??
    state.world?.ledgerDebt ??
    state.world?.economy?.ledgerDebt ??
    0;
  return toNumber(debt, 0);
}

function hasFactionContext(state = {}) {
  const quests = state.quests || {};
  const world = state.world || {};
  const activeQuest = Array.isArray(quests.active) ? quests.active[0] : null;
  return Boolean(
    activeQuest?.factionId ||
      activeQuest?.faction ||
      world?.factionPressure ||
      world?.currentFaction ||
      world?.zone?.faction,
  );
}

function hasLeylineContext(state = {}) {
  const world = state.world || {};
  const essence = world.essence || {};
  const location =
    typeof world.location === "object" && world.location !== null ? world.location : {};
  return Boolean(
    essence.ambient ||
      essence.dominantEssence ||
      location.leylinePressure ||
      world.leylinePressure ||
      world.weather?.leylinePressure,
  );
}

function buildLorePressureSuggestions(state) {
  const player = state?.player || {};
  const suggestions = [];

  if (hasSealedOath(player)) {
    suggestions.push(
      createSuggestionRecord({
        id: "lore-check-oath",
        label: "Check Oath",
        command: "check oath",
        weight: 0.91,
        category: "observe",
        reason: "Your oath defines the first binding pressure on this chronicle.",
      }),
    );
  }

  const systemLabel = resolveArchetypeSystemLabel(player);
  if (systemLabel || player?.archetypeSystem) {
    suggestions.push(
      createSuggestionRecord({
        id: "lore-inspect-system-label",
        label: "Inspect System Label",
        command: "inspect System label",
        weight: 0.89,
        category: "observe",
        reason: "The System records patterns, but it does not always understand them.",
      }),
    );
  }

  if (getLedgerDebtAmount(state) > 0 || player?.contracts || state?.world?.economy) {
    suggestions.push(
      createSuggestionRecord({
        id: "lore-review-ledger-debt",
        label: "Review Ledger Debt",
        command: "review ledger debt",
        weight: 0.86,
        category: "social",
        reason: "Power, contracts, and entropy often leave debt behind.",
      }),
    );
  }

  if (hasLeylineContext(state)) {
    suggestions.push(
      createSuggestionRecord({
        id: "lore-sense-leyline-pressure",
        label: "Sense Leyline Pressure",
        command: "sense leyline pressure",
        weight: 0.9,
        category: "observe",
        reason: "Leylines behave like infrastructure, weather, and political leverage at once.",
      }),
    );
  }

  if (hasFactionContext(state)) {
    suggestions.push(
      createSuggestionRecord({
        id: "lore-ask-faction-terms",
        label: "Ask About Faction Terms",
        command: "ask about faction terms",
        weight: 0.84,
        category: "social",
        reason: "In Meridian, help usually arrives with clauses attached.",
      }),
    );
  }

  return suggestions;
}

export function resolveArchetypeSystemLabel(player = {}) {
  return getPlayerArchetypeSystemLabel(player);
}

function getCurrentLocationId(state) {
  const rawLocation = state?.world?.location;
  return typeof rawLocation === "string" ? rawLocation : rawLocation?.current || "";
}

function buildTravelSuggestions(state, maxItems = 3) {
  if (!state) return [];
  const currentLocationId = getCurrentLocationId(state);
  const currentLocation = getLocationById(currentLocationId);
  const currentZoneId = currentLocation?.zoneId || state?.world?.location?.biome || "";
  const allowedLocationIds = getAccessibleLocationIds(state);
  const accessibleIds = Array.from(allowedLocationIds || [])
    .filter((locationId) => typeof locationId === "string" && locationId !== currentLocationId)
    .map((locationId) => getLocationById(locationId))
    .filter(Boolean)
    .sort((left, right) => {
      const leftZoneMatch = left.zoneId === currentZoneId ? 0 : 1;
      const rightZoneMatch = right.zoneId === currentZoneId ? 0 : 1;
      if (leftZoneMatch !== rightZoneMatch) return leftZoneMatch - rightZoneMatch;
      return String(left.name || left.id).localeCompare(String(right.name || right.id));
    });

  const sameZoneSuggestions = accessibleIds
    .filter((location) => location.zoneId === currentZoneId)
    .map((location) =>
      createSuggestionRecord({
        id: `travel-${location.id}`,
        label: `Go to ${location.name}`,
        command: `go to ${location.name}`,
        category: "progress",
        reason: "A reachable route in the current region.",
      }),
    );

  const seenZones = new Set();
  const otherZoneSuggestions = accessibleIds
    .filter((location) => location.zoneId !== currentZoneId)
    .filter((location) => {
      if (seenZones.has(location.zoneId)) return false;
      const preferredZoneEntryId = getZoneEntryLocationId(location.zoneId, {
        allowedLocationIds,
      });
      if (preferredZoneEntryId && preferredZoneEntryId !== location.id) {
        return false;
      }
      seenZones.add(location.zoneId);
      return true;
    })
    .map((location) => {
      const zoneName = getZoneById(location.zoneId)?.name || location.zoneId;
      return createSuggestionRecord({
        id: `travel-zone-${location.zoneId}`,
        label: `Go to ${zoneName}`,
        command: `go to ${zoneName}`,
        category: "progress",
        reason: `A connected route into ${zoneName}.`,
      });
    });

  const orderedSuggestions = [
    ...sameZoneSuggestions.slice(0, 1),
    ...otherZoneSuggestions,
    ...sameZoneSuggestions.slice(1),
  ]
    .filter(Boolean)
    .slice(0, maxItems)
    .map((suggestion, index) => ({
      ...suggestion,
      weight: index === 0 ? 0.98 : 0.88 - index * 0.05,
      w: index === 0 ? 0.98 : 0.88 - index * 0.05,
    }));

  return orderedSuggestions;
}

function buildBaseActionSuggestions(state) {
  const onboardingContext = getAdventureOnboardingContext({ state });
  const onboardingScoped = Boolean(onboardingContext?.bundleId);
  const tier = deriveAdventureOnboardingTier({ state });
  const statusUnlocked = onboardingScoped
    ? isAdventureSurfaceUnlocked("status", { state })
    : tier >= 2;
  const inventoryUnlocked = onboardingScoped
    ? isAdventureSurfaceUnlocked("inventory", { state })
    : tier >= 2;
  const suggestions = [
    createSuggestionRecord({
      id: "look-around",
      label: "Look Around",
      command: "look around",
      weight: 1,
      category: "observe",
    }),
  ];

  if (statusUnlocked) {
    suggestions.push(
      createSuggestionRecord({
        id: "check-status",
        label: "Check Status",
        command: "check status",
        weight: 0.94,
        category: "power",
      }),
    );
  }

  if (inventoryUnlocked) {
    suggestions.push(
      createSuggestionRecord({
        id: "open-inventory",
        label: "Open Inventory",
        command: "open inventory",
        weight: 0.9,
        category: "power",
      }),
    );
  }

  return suggestions;
}

function buildOnboardingStepSuggestions(state) {
  const onboarding = getAdventureOnboardingContext({ state });
  if (!onboarding?.active || !onboarding.currentStep) {
    return [];
  }

  return normalizeActionSuggestions(onboarding.currentStep.suggestionSet, {
    maxItems: 4,
  });
}

function buildQuestDrivenSuggestions(state) {
  const activeQuests = Array.isArray(state?.quests?.active) ? state.quests.active : [];
  const primaryQuest = activeQuests[0];
  if (!primaryQuest) return [];

  const travelSuggestions = buildTravelSuggestions(state, 2);
  const currentLocationId = getCurrentLocationId(state);
  const currentLocation = getLocationById(currentLocationId);
  const questId = String(primaryQuest.id || "");

  if (questId === "bq_first_stride") {
    return travelSuggestions.slice(0, 1);
  }

  if (questId === "mq_oracle_sundial") {
    if (currentLocationId === "desert_oracle_sundial") {
      return [
        createSuggestionRecord({
          id: "oracle-glyphs",
          label: "Inspect the Sundial Glyphs",
          command: "look at the sundial glyphs",
          weight: 0.98,
          category: "observe",
          reason: "The glyphs are the clearest lead on the blackout warning.",
        }),
        createSuggestionRecord({
          id: "oracle-sense",
          label: "Sense the Sundial",
          command: "sense ambient essence",
          weight: 0.9,
          category: "power",
          reason: "The oracle trail is strongest around the warped shadow-line.",
        }),
      ];
    }

    return [
      ...travelSuggestions.slice(0, 1),
      createSuggestionRecord({
        id: "oracle-look",
        label: `Survey ${currentLocation?.name || "the route"}`,
        command: "look around",
        weight: 0.9,
        category: "observe",
        reason: "The oracle leaves signs in the shifting route-glyphs.",
      }),
    ].filter(Boolean);
  }

  const reachStyleObjective = /reach|locate|track|navigate|secure|reclaim/i.test(
    `${primaryQuest.name || ""} ${primaryQuest.description || ""}`,
  );
  if (reachStyleObjective) {
    return travelSuggestions.slice(0, 1);
  }

  return [];
}

export function buildActionSuggestions(state) {
  if (!state) {
    return DEFAULT_ACTION_SUGGESTIONS;
  }

  const baseSuggestions = buildBaseActionSuggestions(state);
  const onboardingSuggestions = buildOnboardingStepSuggestions(state);
  const onboardingContext = getAdventureOnboardingContext({ state });
  const contextSuggestions = [];
  const player = state.player || {};
  const magic =
    player.magic && typeof player.magic === "object" && !Array.isArray(player.magic)
      ? player.magic
      : {};
  const reserves =
    magic.reserves && typeof magic.reserves === "object" && !Array.isArray(magic.reserves)
      ? magic.reserves
      : {};
  const reservesTaint =
    magic.reservesTaint &&
    typeof magic.reservesTaint === "object" &&
    !Array.isArray(magic.reservesTaint)
      ? magic.reservesTaint
      : {};
  const reserveRows = Object.entries(reserves)
    .map(([essence, amount]) => ({
      essence,
      amount: toNumber(amount, 0),
      taint: toNumber(reservesTaint?.[essence], 0),
    }))
    .filter((entry) => entry.amount > 0.01)
    .sort((left, right) => right.amount - left.amount);
  const highestReserve = reserveRows[0] || null;
  const avgReserveTaint = reserveRows.length
    ? reserveRows.reduce((sum, row) => sum + row.taint, 0) / reserveRows.length
    : 0;
  const resonanceCurrent = toNumber(magic.resonance?.current, 0);
  const prepared =
    magic.prepared && typeof magic.prepared === "object" && !Array.isArray(magic.prepared)
      ? magic.prepared
      : null;
  const charges = Array.isArray(magic.charges) ? magic.charges : [];
  const ambient =
    state.world?.essence?.ambient &&
    typeof state.world.essence.ambient === "object" &&
    !Array.isArray(state.world.essence.ambient)
      ? state.world.essence.ambient
      : null;
  const hasAmbientSnapshot = Boolean(
    ambient &&
      ambient.global &&
      typeof ambient.global === "object" &&
      ambient.compositionByEssence &&
      typeof ambient.compositionByEssence === "object",
  );
  const inCombat = Boolean(
    state.combat?.inCombat ?? state.combat?.status === "active",
  );
  if (inCombat) {
    contextSuggestions.push(
      createSuggestionRecord({
        id: "combat-attack",
        label: "Attack",
        command: "attack",
        weight: 1,
        category: "risk",
      }),
      createSuggestionRecord({
        id: "combat-escape",
        label: "Attempt Escape",
        command: "attempt escape",
        weight: 0.72,
        category: "risk",
      }),
    );
    const activeSkills = Array.isArray(player.activeSkills) ? player.activeSkills : [];
    if (activeSkills.length > 0) {
      const skill = activeSkills[Math.floor(Date.now() / 10000) % activeSkills.length];
      if (skill?.name) {
        contextSuggestions.push(
          createSuggestionRecord({
            id: `combat-skill-${skill.id || toSuggestionId(skill.name)}`,
            label: `Use ${skill.name}`,
            command: `use ${skill.name}`,
            weight: 0.95,
            category: "power",
          }),
        );
      }
    }
    const potion = Array.isArray(player.inventory)
      ? player.inventory.find((item) =>
          /potion|elixir|draft|tonic/i.test(String(item?.name || item?.id || "")),
        )
      : null;
    if (potion?.name) {
      contextSuggestions.push(
        createSuggestionRecord({
          id: `combat-item-${potion.id || toSuggestionId(potion.name)}`,
          label: `Drink ${potion.name}`,
          command: `drink ${potion.name}`,
          weight: 0.86,
          category: "recovery",
        }),
      );
    }
    if (prepared) {
      contextSuggestions.push(
        createSuggestionRecord({
          id: "combat-release-prepared",
          label: "Release Prepared Magic",
          command: "release prepared magic",
          weight: 0.94,
          category: "power",
        }),
      );
    } else if (charges.length > 0) {
      contextSuggestions.push(
        createSuggestionRecord({
          id: "combat-sense",
          label: "Sense the Field",
          command: "sense ambient essence",
          weight: 0.74,
          category: "observe",
        }),
      );
    }
    if (resonanceCurrent >= 70) {
      contextSuggestions.push(
        createSuggestionRecord({
          id: "combat-anchor",
          label: "Anchor Resonance",
          command: "anchor",
          weight: 0.9,
          category: "recovery",
        }),
      );
    }
    if (avgReserveTaint >= 0.25) {
      contextSuggestions.push(
        createSuggestionRecord({
          id: "combat-purge",
          label: "Purge Taint",
          command: "purge contamination",
          weight: 0.92,
          category: "recovery",
        }),
      );
    }
  } else {
    if (onboardingContext?.active) {
      contextSuggestions.push(
        ...buildTravelSuggestions(state, 2),
        ...buildLorePressureSuggestions(state).slice(0, 2),
      );
    } else {
      contextSuggestions.push(...buildQuestDrivenSuggestions(state), ...buildTravelSuggestions(state, 2));
    }

    if (!hasAmbientSnapshot) {
      contextSuggestions.push(
        createSuggestionRecord({
          id: "sense-ambient-field",
          label: "Sense Ambient Essence",
          command: "sense ambient essence",
          weight: 0.92,
          category: "observe",
        }),
      );
    } else if (reserveRows.length === 0) {
      contextSuggestions.push(
        createSuggestionRecord({
          id: "draw-essence",
          label: "Draw Essence",
          command: `draw ${ambient?.dominantEssence || highestReserve?.essence || "fire"}`,
          weight: 0.9,
          category: "power",
        }),
      );
    }
    if (reserveRows.length > 0 && charges.length === 0) {
      const target = highestReserve?.essence || "fire";
      contextSuggestions.push(
        createSuggestionRecord({
          id: `refine-${target}`,
          label: `Refine ${target} Essence`,
          command: `refine ${target} essence 1`,
          weight: 0.88,
          category: "power",
        }),
      );
    }
    if (prepared) {
      contextSuggestions.push(
        createSuggestionRecord({
          id: "release-prepared-magic",
          label: "Release Prepared Magic",
          command: "release prepared magic",
          weight: 0.9,
          category: "power",
        }),
      );
    }
    if (avgReserveTaint >= 0.2) {
      contextSuggestions.push(
        createSuggestionRecord({
          id: "purge-tainted-reserves",
          label: "Purge Tainted Reserves",
          command: "purge tainted reserves",
          weight: 0.9,
          category: "recovery",
        }),
      );
    }
    if (resonanceCurrent >= 60) {
      contextSuggestions.push(
        createSuggestionRecord({
          id: "anchor-resonance",
          label: "Anchor Resonance",
          command: "anchor",
          weight: 0.88,
          category: "recovery",
        }),
      );
    }

    contextSuggestions.push(...buildLorePressureSuggestions(state));

    const systemLabel = resolveArchetypeSystemLabel(player);
    if (systemLabel) {
      const category = resolvePlayerArchetypeSystem(player)?.category || null;
      const systemSuggestions = {
        System: createSuggestionRecord({
          id: "system-status",
          label: "Check System Status",
          command: "check status",
          weight: 0.85,
          category: "power",
        }),
        Authority: createSuggestionRecord({
          id: "authority-survey",
          label: "Survey the Area",
          command: "look around",
          weight: 0.82,
          category: "observe",
        }),
        Path: createSuggestionRecord({
          id: "path-rest",
          label: "Center Yourself",
          command: "rest",
          weight: 0.8,
          category: "recovery",
        }),
        Framework: createSuggestionRecord({
          id: "framework-readout",
          label: "Check Status",
          command: "check status",
          weight: 0.82,
          category: "power",
        }),
        Privilege: createSuggestionRecord({
          id: "privilege-look",
          label: "Study the Scene",
          command: "look around",
          weight: 0.82,
          category: "observe",
        }),
        Overlay: createSuggestionRecord({
          id: "overlay-sense",
          label: "Probe the Ambient Field",
          command: "sense ambient essence",
          weight: 0.82,
          category: "power",
        }),
      };
      if (category && systemSuggestions[category]) {
        contextSuggestions.push(systemSuggestions[category]);
      }
    }
  }

  const hpCurrent = toNumber(
    typeof player.hp === "object" ? player.hp?.current : player.hp,
    toNumber(player.health, 0),
  );
  const hpMax = toNumber(
    typeof player.hp === "object"
      ? player.hp?.max
      : (player.maxHp ?? player.maxHealth),
    1,
  );

  if (hpCurrent < 0.3 * Math.max(1, hpMax)) {
    contextSuggestions.push(
      createSuggestionRecord({
        id: "rest-to-recover",
        label: "Rest to Recover",
        command: "rest",
        weight: 0.92,
        category: "recovery",
      }),
    );
  }

  const fixedLabels = new Set(
    [...baseSuggestions, ...onboardingSuggestions].map((suggestion) =>
      String(suggestion?.command || suggestion?.t || "").toLowerCase(),
    ),
  );
  const uniqueContextSuggestions = contextSuggestions.filter(
    (suggestion, index, all) =>
      all.findIndex(
        (entry) =>
          String(entry?.command || entry?.t || "").toLowerCase() ===
          String(suggestion?.command || suggestion?.t || "").toLowerCase(),
      ) === index &&
      !fixedLabels.has(String(suggestion?.command || suggestion?.t || "").toLowerCase()),
  );

  const fillerCandidates =
    onboardingSuggestions.length >= 2
      ? []
      : CONTEXT_SUGGESTION_FILLERS.filter(
          (fallback) =>
            !uniqueContextSuggestions.some(
              (entry) =>
                String(entry?.command || entry?.t || "").toLowerCase() ===
                String(fallback?.command || fallback?.t || "").toLowerCase(),
            ),
        );

  const normalizedContext = [
    ...onboardingSuggestions,
    ...uniqueContextSuggestions,
    ...fillerCandidates,
  ].slice(0, 5);

  return [...baseSuggestions, ...normalizedContext].slice(0, 8);
}
