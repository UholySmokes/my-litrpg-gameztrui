import { listOpeningSceneChoices } from "../../data/OpeningScenes.js";
import {
  getPlayerArchetypeSystemLabel,
  resolvePlayerArchetypeSystem,
} from "../../systems/archetype/resolvePlayerArchetypeSystem.js";
import { toNumber } from "../../utils/shared.js";

export const FIXED_ACTION_SUGGESTIONS = [
  { t: "look around", w: 1 },
  { t: "check status", w: 1 },
  { t: "open inventory", w: 1 },
  { t: "review quests", w: 1 },
  { t: "train skills", w: 1 },
  { t: "talk to nearby NPC", w: 1 },
];

export const CONTEXT_SUGGESTION_FILLERS = [
  { t: "explore a nearby route", w: 0.82 },
  { t: "prepare for the next objective", w: 0.8 },
  { t: "gather local information", w: 0.78 },
  { t: "take a short rest", w: 0.76 },
];

export const DEFAULT_ACTION_SUGGESTIONS = [
  ...FIXED_ACTION_SUGGESTIONS,
  ...CONTEXT_SUGGESTION_FILLERS,
];

function normalizeSingleActionSuggestion(suggestion) {
  const label =
    typeof suggestion === "string"
      ? suggestion
      : suggestion?.t || suggestion?.text || suggestion?.label || "";
  const trimmed = String(label || "").trim();
  if (!trimmed) return null;

  const rawWeight =
    typeof suggestion === "object" && Number.isFinite(suggestion?.w)
      ? suggestion.w
      : 1;

  return {
    t: trimmed,
    w: Math.min(1, Math.max(0.35, rawWeight)),
  };
}

export function normalizeActionSuggestions(suggestions = [], { maxItems = 6 } = {}) {
  const normalized = (Array.isArray(suggestions) ? suggestions : [])
    .map((suggestion) => normalizeSingleActionSuggestion(suggestion))
    .filter(Boolean);
  const seen = new Set();

  return normalized.filter((suggestion) => {
    const key = suggestion.t.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, maxItems);
}

export function resolveActionSuggestions({
  preferredSuggestions,
  fallbackSuggestions = DEFAULT_ACTION_SUGGESTIONS,
} = {}) {
  const preferred = normalizeActionSuggestions(preferredSuggestions);
  if (preferred.length > 0) {
    return preferred;
  }
  return normalizeActionSuggestions(fallbackSuggestions);
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

export function resolveArchetypeSystemLabel(player = {}) {
  return getPlayerArchetypeSystemLabel(player);
}

export function buildActionSuggestions(state) {
  if (!state) {
    return DEFAULT_ACTION_SUGGESTIONS;
  }

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
  const openingSceneId = state?.world?.vars?.startingSceneId || null;
  const openingChoicePending = Boolean(
    state?.world?.vars?.openingSceneChoicePending,
  );

  if (!inCombat && openingChoicePending && openingSceneId) {
    const openingContext = listOpeningSceneChoices(openingSceneId)
      .slice(0, 4)
      .map((choice) => ({ t: choice.label, w: 1 }));
    const fallbackContext = CONTEXT_SUGGESTION_FILLERS.slice(0, 4);
    const resolvedContext =
      openingContext.length > 0 ? openingContext : fallbackContext;
    return [...FIXED_ACTION_SUGGESTIONS, ...resolvedContext];
  }

  if (inCombat) {
    contextSuggestions.push(
      { t: "attack enemy", w: 1 },
      { t: "use skill", w: 1 },
      { t: "drink potion", w: player.inventory?.length ? 0.9 : 0.6 },
      { t: "attempt escape", w: 0.7 },
    );
    const activeSkills = Array.isArray(player.activeSkills) ? player.activeSkills : [];
    if (activeSkills.length > 0) {
      const skill = activeSkills[Math.floor(Date.now() / 10000) % activeSkills.length];
      if (skill?.name) contextSuggestions.push({ t: `use ${skill.name}`, w: 0.95 });
    }
    if (prepared) {
      contextSuggestions.push({ t: "release prepared weave", w: 0.98 });
    } else if (charges.length > 0) {
      contextSuggestions.push({ t: "shape a quick weave", w: 0.9 });
    }
    if (resonanceCurrent >= 70) {
      contextSuggestions.push({ t: "anchor to stabilize resonance", w: 0.94 });
    }
    if (avgReserveTaint >= 0.25) {
      contextSuggestions.push({ t: "purge contamination", w: 0.92 });
    }
  } else {
    contextSuggestions.push(
      { t: "explore area", w: 1 },
      { t: "speak with locals", w: 0.9 },
      { t: "follow quest lead", w: (state.quests?.active?.length ?? 0) ? 1 : 0.6 },
      { t: "practice one ability", w: 0.8 },
    );

    if (!hasAmbientSnapshot) {
      contextSuggestions.push({ t: "sense ambient essence", w: 0.92 });
    } else if (reserveRows.length === 0) {
      contextSuggestions.push({ t: "draw essence from the ambient field", w: 0.95 });
    }
    if (reserveRows.length > 0 && charges.length === 0) {
      const target = highestReserve?.essence || "fire";
      contextSuggestions.push({ t: `refine ${target} essence`, w: 0.95 });
    }
    if (charges.length > 0 && !prepared) {
      contextSuggestions.push({ t: "shape and weave a pattern", w: 0.93 });
    }
    if (prepared) {
      contextSuggestions.push({ t: "release prepared magic", w: 0.9 });
    }
    if (avgReserveTaint >= 0.2) {
      contextSuggestions.push({ t: "purge tainted reserves", w: 0.9 });
    }
    if (resonanceCurrent >= 60) {
      contextSuggestions.push({ t: "anchor and calm resonance", w: 0.9 });
    }

    const systemLabel = resolveArchetypeSystemLabel(player);
    if (systemLabel) {
      const category = resolvePlayerArchetypeSystem(player)?.category || null;
      const systemSuggestions = {
        System: { t: "check system status", w: 0.85 },
        Authority: { t: "exert authority", w: 0.85 },
        Path: { t: "meditate on path", w: 0.85 },
        Framework: { t: "analyze framework", w: 0.85 },
        Privilege: { t: "scan for hidden paths", w: 0.85 },
        Overlay: { t: "probe for exploits", w: 0.85 },
      };
      if (category && systemSuggestions[category]) {
        contextSuggestions.push(systemSuggestions[category]);
      }
    }

    const location = state.world?.location?.current || state.world?.location || "";
    const locationStr = typeof location === "string" ? location : "";
    if (
      locationStr.includes("town") ||
      locationStr.includes("village") ||
      locationStr.includes("city")
    ) {
      contextSuggestions.push({ t: "visit shop", w: 0.8 });
    }
    if (
      locationStr.includes("dungeon") ||
      locationStr.includes("cave") ||
      locationStr.includes("ruin")
    ) {
      contextSuggestions.push({ t: "search for treasure", w: 0.85 });
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
    contextSuggestions.push({ t: "rest to recover", w: 0.9 });
  }

  if (!player.profession) {
    contextSuggestions.push({ t: "choose profession", w: 0.8 });
  }

  const activeQuests = Array.isArray(state.quests?.active) ? state.quests.active : [];
  if (activeQuests.length > 0 && !inCombat) {
    const quest = activeQuests[0];
    if (quest?.name) {
      contextSuggestions.push({ t: `pursue ${quest.name}`, w: 0.9 });
    }
  }

  const fixedLabels = new Set(
    FIXED_ACTION_SUGGESTIONS.map((suggestion) => suggestion.t.toLowerCase()),
  );
  const uniqueContextSuggestions = contextSuggestions.filter(
    (suggestion, index, all) =>
      all.findIndex((entry) => entry.t === suggestion.t) === index &&
      !fixedLabels.has(String(suggestion.t || "").toLowerCase()),
  );

  const normalizedContext = [
    ...uniqueContextSuggestions,
    ...CONTEXT_SUGGESTION_FILLERS.filter(
      (fallback) =>
        !uniqueContextSuggestions.some((entry) => entry.t === fallback.t),
    ),
  ].slice(0, 4);

  return [...FIXED_ACTION_SUGGESTIONS, ...normalizedContext];
}
