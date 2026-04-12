// =================================================================
// PROMPT ASSEMBLER
// Builds the prompt sent to the narrative service
// =================================================================

import {
  describeOpeningScene,
  getOpeningSceneById,
  listOpeningSceneChoices,
  buildOpeningSceneNarrativeSeed,
} from "../data/OpeningScenes.js";
import {
  getLocationById,
  getZoneById,
  resolveLocationId,
} from "../world/WorldDataRegistry.js";
import { getOpeningArcByOathOriginId } from "../world/OpeningArcRegistry.js";
import { resolvePlayerArchetypeSystem } from "../systems/archetype/resolvePlayerArchetypeSystem.js";
import { isDevourerCorePlayer } from "@voidverse/game-core/systems/archetype/devourerCore.js";
import { toNumber } from "../utils/shared.js";
import {
  PROMPT_MODES,
  getModeDirective,
  getSafetyDirective,
} from "./promptTemplates.js";

const MAX_HISTORY_ENTRIES = 20;
const MAX_HISTORY_CHARS = 4000;
const HISTORY_ENTRY_TYPES = new Set([
  "narrative",
  "system",
  "status-update",
  "user",
  "action",
]);
const REPETITION_WINDOW = 8;
const REPETITION_MIN_TERM_LENGTH = 5;
const REPETITION_MIN_COUNT = 2;
const REPETITION_STOPWORDS = new Set([
  "their",
  "there",
  "where",
  "which",
  "while",
  "through",
  "about",
  "after",
  "before",
  "under",
  "until",
  "still",
  "again",
  "around",
  "across",
  "every",
  "toward",
  "towards",
  "within",
  "without",
  "player",
  "system",
]);

const sanitizeUserInput = (input) => {
  if (typeof input !== "string") return "";
  const noNewlines = input.replace(/[\r\n\t]+/g, " ");
  const collapsed = noNewlines.replace(/\s{2,}/g, " ").trim();
  return collapsed.slice(0, 400);
};

function detectDialogueIntent(input = "") {
  const value = String(input || "").trim();
  return /(^["'])|\b(say|ask|tell|speak|talk|shout|whisper|yell|reply|negotiate|question)\b/i.test(
    value,
  ) || /\?\s*$/.test(value);
}

function tokenizeForRepetition(text = "") {
  if (typeof text !== "string" || !text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^'+|'+$/g, ""))
    .filter(
      (token) =>
        token.length >= REPETITION_MIN_TERM_LENGTH &&
        !REPETITION_STOPWORDS.has(token),
    );
}

function getRecentNarrativeTexts(gameState = {}) {
  const entries = Array.isArray(gameState?.narrative?.entries)
    ? gameState.narrative.entries
    : [];
  const ordered = entries
    .filter((entry) => entry?.type === "narrative" && typeof entry?.text === "string")
    .sort((a, b) => {
      const timestampDelta = (a.timestamp || 0) - (b.timestamp || 0);
      if (timestampDelta !== 0) return timestampDelta;
      const sequenceDelta = (a.sequence || 0) - (b.sequence || 0);
      if (sequenceDelta !== 0) return sequenceDelta;
      return String(a.id || "").localeCompare(String(b.id || ""));
    });
  return ordered.slice(-REPETITION_WINDOW).map((entry) => entry.text);
}

function buildRepetitionDirective(gameState = {}) {
  const recentTexts = getRecentNarrativeTexts(gameState);
  if (recentTexts.length < 2) {
    return "Recent repetition watchlist: none.";
  }

  const counts = new Map();
  recentTexts.forEach((text) => {
    tokenizeForRepetition(text).forEach((token) => {
      counts.set(token, (counts.get(token) || 0) + 1);
    });
  });

  const repeatedTerms = Array.from(counts.entries())
    .filter(([, count]) => count >= REPETITION_MIN_COUNT)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([token]) => token);

  if (repeatedTerms.length === 0) {
    return "Recent repetition watchlist: none.";
  }

  return `Recent repetition watchlist: avoid reusing ${repeatedTerms.join(", ")} unless essential for continuity.`;
}


function resolveEntityLabel(value, fallback = "None") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value.name || value.id || fallback;
  }
  return fallback;
}

function normalizeEntityLabels(values = []) {
  return values
    .map((value) => resolveEntityLabel(value, ""))
    .filter(Boolean);
}

function normalizeLookupKey(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|a|an|nearby)\b/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function resolveDialogueTargetLabel(targetLabel, candidates) {
  const normalizedTarget = normalizeLookupKey(targetLabel);
  if (!normalizedTarget) return candidates.length === 1 ? candidates[0] : null;

  const exact = candidates.find((candidate) => {
    const normalizedCandidate = normalizeLookupKey(candidate);
    return (
      normalizedCandidate === normalizedTarget ||
      normalizedCandidate.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedCandidate)
    );
  });

  return exact || (candidates.length === 1 ? candidates[0] : null);
}

function isGroupEntityLabel(value = "") {
  return /\b(patrol|guards?|scouts?|caravan|hands?|volunteers?|companions?|travelers?|workers?|group|party|pilgrims?|pack|clan|crew)\b/i.test(
    String(value || ""),
  );
}

function pickAmbientReactionEntity(sceneMemory = {}, dialogue = null) {
  const partyEntities = normalizeEntityLabels(sceneMemory?.partyEntities || []);
  const familiarEntities = normalizeEntityLabels(sceneMemory?.familiarEntities || []);
  const presentEntities = normalizeEntityLabels(sceneMemory?.presentEntities || []);
  const activeThreats = new Set(
    normalizeEntityLabels(sceneMemory?.activeThreats || []).map((entry) =>
      normalizeLookupKey(entry),
    ),
  );
  const candidates = Array.from(
    new Set([...partyEntities, ...familiarEntities, ...presentEntities]),
  );
  const dialogueTarget = resolveDialogueTargetLabel(dialogue?.targetLabel, candidates);
  if (dialogueTarget) return dialogueTarget;

  return (
    candidates.find(
      (entry) =>
        isGroupEntityLabel(entry) && !activeThreats.has(normalizeLookupKey(entry)),
    ) ||
    candidates.find((entry) => !activeThreats.has(normalizeLookupKey(entry))) ||
    null
  );
}

function classifyAmbientReactionPressure({
  userInput = "",
  actionResult = {},
  sceneMemory = {},
} = {}) {
  const safeInput = sanitizeUserInput(userInput).toLowerCase();
  const dialogue =
    actionResult?.dialogue && typeof actionResult.dialogue === "object"
      ? actionResult.dialogue
      : null;
  const activeThreats = normalizeEntityLabels(sceneMemory?.activeThreats || []);
  const hpCurrent = toNumber(
    actionResult?.state?.player?.hp?.current ?? actionResult?.state?.player?.hp,
    NaN,
  );
  const hpMax = toNumber(
    actionResult?.state?.player?.hp?.max ?? actionResult?.state?.player?.maxHp,
    NaN,
  );
  const hpRatio =
    Number.isFinite(hpCurrent) && Number.isFinite(hpMax) && hpMax > 0
      ? hpCurrent / hpMax
      : 1;
  const vulnerable =
    hpRatio <= 0.45 ||
    /\b(hurt|injured|bleed|bleeding|cry|crying|afraid|scared|confused|lost|help)\b/i.test(
      safeInput,
    );
  const noticeable =
    Boolean(actionResult?.changes?.location) ||
    ["move", "attack", "use", "cast", "dialogue", "narrative"].includes(
      actionResult?.actionType,
    ) ||
    /\b(run|stumble|trip|fall|wave|call|shout|cry|crawl|reach|approach|grab)\b/i.test(
      safeInput,
    );

  if (dialogue?.requiresResponse) {
    return {
      pressure: "answer-or-refuse",
      urgency: "high",
      trigger: "The player directly addressed a nearby sentient NPC or group.",
      policy:
        "Have the focus entity answer, refuse with a reason, or make a clear visible social move this turn.",
    };
  }

  if (vulnerable && activeThreats.length > 0) {
    return {
      pressure: "protect-or-warn",
      urgency: "high",
      trigger:
        "The player looks vulnerable while danger or tension is already active in the scene.",
      policy:
        "Have the focus entity warn, shield, reposition, herd, or otherwise react protectively if grounded.",
    };
  }

  if (vulnerable) {
    return {
      pressure: "approach-or-assist",
      urgency: "medium",
      trigger:
        "The player appears vulnerable, frightened, lost, or physically compromised in front of nearby entities.",
      policy:
        "Have the focus entity approach, steady, question, comfort, or block the player rather than remaining inert.",
    };
  }

  if (actionResult?.success === false) {
    return {
      pressure: "react-to-failure",
      urgency: "medium",
      trigger: "The player's attempted action visibly failed in front of nearby entities.",
      policy:
        "Have the focus entity react with comment, caution, intervention, or body language if grounded.",
    };
  }

  if (activeThreats.length > 0 && noticeable) {
    return {
      pressure: "warn-or-cover",
      urgency: "medium",
      trigger:
        "The player did something noticeable while threats or tension remain in the scene.",
      policy:
        "Have the focus entity acknowledge the move with warning, cover, pursuit, or tactical repositioning.",
    };
  }

  if (noticeable) {
    return {
      pressure: "acknowledge",
      urgency: "low",
      trigger: "The player did something noticeable near established entities.",
      policy:
        "Have the focus entity visibly acknowledge the action if grounded, even with a short glance, movement, or brief line.",
    };
  }

  return null;
}

export function buildDialogueNpcContext(gameState = {}, userInput = "", actionResult = {}) {
  const result = actionResult && typeof actionResult === "object" ? actionResult : {};
  const dialogue =
    result.dialogue && typeof result.dialogue === "object" ? result.dialogue : null;
  const dialogueIntent = Boolean(dialogue?.requiresResponse || result?.dialogueIntent);
  if (!dialogueIntent) return null;

  const sceneMemory =
    gameState?.narrative && typeof gameState.narrative === "object"
      ? gameState.narrative.sceneMemory || buildSceneMemorySeed(gameState)
      : buildSceneMemorySeed(gameState);
  const presentEntities = normalizeEntityLabels(sceneMemory?.presentEntities || []);
  const familiarEntities = normalizeEntityLabels(sceneMemory?.familiarEntities || []);
  const partyEntities = normalizeEntityLabels(sceneMemory?.partyEntities || []);
  const candidateEntities = Array.from(
    new Set([...presentEntities, ...familiarEntities, ...partyEntities]),
  );
  const targetLabel = resolveDialogueTargetLabel(dialogue?.targetLabel, candidateEntities);
  const socialSummary =
    typeof sceneMemory?.socialSummary === "string" ? sceneMemory.socialSummary.trim() : "";

  return {
    playerInput: sanitizeUserInput(userInput),
    spokenText: sanitizeUserInput(dialogue?.spokenText || userInput),
    intent: dialogue?.intent || "speech",
    topic: dialogue?.topic || null,
    targetLabel,
    responderRole:
      targetLabel ||
      (candidateEntities.length > 0
        ? "the nearest relevant present sentient NPC or group"
        : "no confirmed respondent"),
    requiresResponse: true,
    responsePolicy:
      "If a present sentient NPC or group can respond, answer directly. Otherwise refuse with a concrete reason or show a clear visible social action.",
    locationLabel: sceneMemory?.locationLabel || null,
    zoneLabel: sceneMemory?.zoneLabel || null,
    immediateObjective: sceneMemory?.immediateObjective || null,
    presentEntities,
    familiarEntities,
    partyEntities,
    activeThreats: normalizeEntityLabels(sceneMemory?.activeThreats || []),
    unresolvedHooks: normalizeEntityLabels(sceneMemory?.unresolvedHooks || []),
    lastConsequence: sceneMemory?.lastConsequence || null,
    socialSummary: socialSummary || null,
  };
}

export function buildAmbientReactionContext(
  gameState = {},
  userInput = "",
  actionResult = {},
) {
  const result = actionResult && typeof actionResult === "object" ? actionResult : {};
  const sceneMemory =
    gameState?.narrative && typeof gameState.narrative === "object"
      ? gameState.narrative.sceneMemory || buildSceneMemorySeed(gameState, result)
      : buildSceneMemorySeed(gameState, result);
  const dialogue =
    result.dialogue && typeof result.dialogue === "object" ? result.dialogue : null;
  const focusEntity = pickAmbientReactionEntity(sceneMemory, dialogue);
  if (!focusEntity) return null;

  const pressure = classifyAmbientReactionPressure({
    userInput,
    actionResult: result,
    sceneMemory,
  });
  if (!pressure) return null;

  return {
    focusEntity,
    pressure: pressure.pressure,
    urgency: pressure.urgency,
    trigger: pressure.trigger,
    policy: pressure.policy,
    locationLabel: sceneMemory?.locationLabel || null,
    zoneLabel: sceneMemory?.zoneLabel || null,
    activeThreats: normalizeEntityLabels(sceneMemory?.activeThreats || []),
    presentEntities: normalizeEntityLabels(sceneMemory?.presentEntities || []),
    socialSummary:
      typeof sceneMemory?.socialSummary === "string" && sceneMemory.socialSummary.trim()
        ? sceneMemory.socialSummary.trim()
        : null,
  };
}

export function resolvePromptMode(gameState, actionResult) {
  const actionType = actionResult?.actionType;
  const inCombat = Boolean(
    gameState?.combat?.inCombat ?? gameState?.combat?.status === "active",
  );
  if (actionResult?.changes?.combatStarted || inCombat) {
    return PROMPT_MODES.COMBAT;
  }
  if (actionResult?.changes?.location) {
    return PROMPT_MODES.SCENE_TRANSITION;
  }
  if (
    (actionType === "narrative" || actionType === "dialogue") &&
    actionResult?.dialogueIntent
  ) {
    return PROMPT_MODES.DIALOGUE;
  }
  return PROMPT_MODES.EXPLORATION;
}

/**
 * Assembles the complete prompt for the AI narrative engine
 * @param {object} gameState - The current game state
 * @param {string} userInput - The user's text input
 * @param {object} actionResult - The result from the logic engine (what actually happened)
 * @returns {string} The complete prompt string
 */
export function assemblePrompt(gameState, userInput, actionResult) {
  const archetypeSystem = resolvePlayerArchetypeSystem(gameState?.player);
  const dialogueIntent = Boolean(
    actionResult?.dialogue?.requiresResponse || detectDialogueIntent(userInput),
  );
  const resolvedActionResult =
    actionResult && typeof actionResult === "object"
      ? { ...actionResult, dialogueIntent }
      : { dialogueIntent };
  const mode = resolvePromptMode(gameState, resolvedActionResult);
  const currentMood =
    typeof gameState?.narrative?.currentMood === "string"
      ? gameState.narrative.currentMood
      : "neutral";
  const repetitionDirective = buildRepetitionDirective(gameState);
  const systemPrompt = buildSystemPrompt({
    archetypeSystem,
    mode,
    currentMood,
    repetitionDirective,
  });
  const contextSection = buildContextSection(gameState);
  const authoritativeSceneStateSection = buildAuthoritativeSceneStateSection(
    gameState,
    resolvedActionResult,
  );
  const historySection = buildHistorySection(gameState);
  const reactionContext = buildAmbientReactionContext(
    gameState,
    userInput,
    resolvedActionResult,
  );
  const actionSection = buildActionSection(
    userInput,
    resolvedActionResult,
    reactionContext,
  );

  return `${systemPrompt}

${contextSection}

${authoritativeSceneStateSection}

${historySection}

${actionSection}`;
}

/**
 * Builds the system prompt that defines the AI's role and output format
 */
function buildSystemPrompt({
  archetypeSystem,
  mode,
  currentMood,
  repetitionDirective,
}) {
  const toneDirective = buildArchetypeToneDirective(archetypeSystem);
  const moodDirective =
    currentMood && currentMood !== "neutral"
      ? `Current emotional tone: ${currentMood}. Preserve continuity and transition naturally.`
      : "Current emotional tone: neutral.";
  const modeDirective = getModeDirective(mode);
  const safetyDirective = getSafetyDirective();

  return `You are a LitRPG narrator for an interactive text-based game. Your role is to:
1. Describe the game world and events in an engaging, immersive style
2. Respond to player actions with vivid, descriptive narrative
3. Maintain consistency with the game's fantasy/sci-fi setting
4. Keep responses concise but atmospheric (5-9 sentences typically)
5. Use an inclusive, human tone: allow darkness, resilience, hope, and quiet moments depending on context
6. Reference the player's archetype system naturally when relevant (not every response)
7. Hard limit: keep the response under 1200 characters
8. Avoid markdown formatting entirely (no **bold**, *italic*, backticks, headings, or lists)
9. Avoid repetitive keyword loops; do not reuse signature archetype terms more than once unless strictly necessary
10. Advance the scene each turn with at least one new concrete detail or consequence
11. Treat the player's command as a real attempted action and show what immediately happens because of it before drifting into atmosphere or reflection
12. Return exactly one valid JSON object and nothing else
13. Keep the narration emotionally reactive rather than distant or stately
14. Use close internal beats sparingly to show shock, hunger, pride, fear, irritation, or stubborn resolve
15. When system elements matter, weave them in as brief diegetic notices or data flashes instead of long exposition
16. Treat small survival stakes seriously when the player is vulnerable, transformed, or new to the scene
17. Allow touches of dark humor, indignation, or self-dramatizing bravado when grounded in the moment
18. Favor immediate bodily awareness when the player is injured, transformed, starving, exhausted, or acting on instinct
19. Let food, cover, footing, distance, scent, sound, and nearby predators feel like real stakes when survival is uncertain
20. Use brief xianxia or system-novel flourishes only when earned: coldly helpful notices, warnings, or progress flashes that cut through the prose
21. Avoid generic epic grandeur; prefer sharp, intimate, slightly dangerous prose grounded in the present moment
22. Entities listed as familiar or party are already known to the player and must never be reintroduced as mysterious strangers unless the state explicitly says the bond broke
23. If a companion group is unnamed, use a stable role label such as scouts, caravan hands, or volunteers instead of vague stranger language
24. If the scene is missing minor connective details, invent the smallest plausible sensory, positional, or bystander detail needed to carry the attempted action forward
25. Only hard-refuse or narrow an action when it would force unearned mechanics or canon state, such as free levels, impossible rewards, instant travel, retroactive quest completion, or other persistent changes unsupported by state
${modeDirective}
${moodDirective}
${repetitionDirective}
${toneDirective}
${safetyDirective}`;
}

/**
 * Builds an archetype-specific tone directive for the system prompt.
 * This steers the AI's narrative voice based on the player's chosen system.
 */
function buildArchetypeToneDirective(archetypeSystem) {
  if (!archetypeSystem) return "";

  const category = archetypeSystem.category || "";
  const name = archetypeSystem.name || "Unknown";

  const tone = archetypeSystem.narrativeTone;
  if (isDevourerCorePlayer({ archetypeSystem })) {
    return `\nNarrative tone: a cold, analytical big-sister system presence. Use precise corrective notices, mild condescension, and optimization-focused guidance. Sentient devours should trigger immediate taboo and trust-fracture framing.`;
  }
  if (tone && typeof tone === "object" && !Array.isArray(tone)) {
    const voice = tone.voice || "";
    const sentenceStyle = tone.sentenceStyle || "";
    const vocabulary = Array.isArray(tone.vocabulary)
      ? tone.vocabulary.filter(Boolean).slice(0, 8)
      : [];
    const vocabLine = vocabulary.length
      ? `Optional vocabulary (use sparingly, no repetition): ${vocabulary.join(", ")}.`
      : "";
    return [
      "",
      `Archetype lens: ${name} (${category || "Unknown"}).`,
      voice ? `Voice: ${voice}.` : "",
      sentenceStyle ? `Sentence style: ${sentenceStyle}.` : "",
      vocabLine,
    ]
      .filter(Boolean)
      .join("\n");
  }

  const toneMap = {
    System: `\nNarrative tone: analytical and system-aware. The player has a "${name}" system. Weave in subtle system notifications, data fragments, or interface glitches. Use precise, measured language mixed with wonder.`,
    Authority: `\nNarrative tone: commanding and weighty. The player wields the "${name}" authority. Emphasize responsibility, leverage, and consequence. Vary vocabulary; avoid repeating throne/sovereign/dominion motifs across consecutive turns.`,
    Path: `\nNarrative tone: mystical and transformative. The player walks the "${name}" path. Emphasize ritual, ascension, and the sense of becoming something greater. Use evocative, almost reverent language.`,
    Framework: `\nNarrative tone: cerebral and meta-aware. The player operates within the "${name}" framework. Hint at the underlying rules being bent or rewritten. Use clever, layered descriptions.`,
    Privilege: `\nNarrative tone: conspiratorial and knowing. The player holds the "${name}" privilege. Weave in hidden knowledge, subtle advantages, and the feeling of seeing what others cannot.`,
    Overlay: `\nNarrative tone: volatile and high-energy. The player runs the "${name}" overlay. Emphasize glitches, risk, and the thrill of exploiting reality. Descriptions should crackle with instability.`,
  };

  return toneMap[category] || `\nThe player's archetype system is "${name}". Reference it when relevant.`;
}

function buildOpeningVoiceDirective(player = {}, systemName = "Unbound") {
  const raceName =
    typeof player?.race === "string"
      ? player.race
      : player?.race?.name || "";
  const bodyDirective =
    raceName && !/^human$/i.test(raceName)
      ? `- The player's ${raceName} body should feel immediate and slightly unfamiliar when the opening starts.`
      : "- If the opening implies transformation, awakening, or bodily wrongness, make it feel immediate and physical.";

  return [
    "=== OPENING VOICE RULES ===",
    "- Keep second-person narration, but let close internal reactions leak through so the player feels the moment instead of receiving a distant summary.",
    "- Let the opening pivot quickly between fear, hunger, indignation, curiosity, relief, and opportunistic resolve when the scene supports it.",
    `- When the player's system ("${systemName}") intrudes, you may use 1-2 short diegetic notices such as [System Notice: ...] or [Quest Updated: ...].`,
    "- If you use a notice, make it feel coldly helpful, faintly rude, or ominously precise rather than like a UI manual.",
    bodyDirective,
    "- Treat first survival problems as dramatic milestones rather than generic tutorial chores.",
    "- Favor sharp sensory detail, body-awareness, and slight menace over distant epic grandeur.",
    "- Avoid overly solemn epic diction unless the current scene truly earns it; lively, sharp, slightly dangerous prose is preferred.",
  ].join("\n");
}

function formatNumber(value, digits = 2) {
  return Number.isFinite(value) ? Number(value).toFixed(digits) : "0.00";
}

function dedupeStrings(values = [], maxItems = 6) {
  const seen = new Set();
  const normalized = [];
  for (const entry of values) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    normalized.push(trimmed);
    if (normalized.length >= maxItems) break;
  }
  return normalized;
}

function normalizeSceneString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getPriorSceneMemory(gameState = {}) {
  return gameState?.narrative?.sceneMemory &&
    typeof gameState.narrative.sceneMemory === "object" &&
    !Array.isArray(gameState.narrative.sceneMemory)
    ? gameState.narrative.sceneMemory
    : {};
}

function normalizeSceneMemoryInput(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      locationLabel: "",
      zoneLabel: "",
      immediateObjective: "",
      presentEntities: [],
      activeThreats: [],
      unresolvedHooks: [],
      lastConsequence: "",
      familiarEntities: [],
      partyEntities: [],
      socialSummary: "",
    };
  }
  return {
    locationLabel: normalizeSceneString(value.locationLabel),
    zoneLabel: normalizeSceneString(value.zoneLabel),
    immediateObjective: normalizeSceneString(value.immediateObjective),
    presentEntities: dedupeStrings(value.presentEntities || []),
    activeThreats: dedupeStrings(value.activeThreats || []),
    unresolvedHooks: dedupeStrings(value.unresolvedHooks || []),
    lastConsequence: normalizeSceneString(value.lastConsequence),
    familiarEntities: dedupeStrings(value.familiarEntities || []),
    partyEntities: dedupeStrings(value.partyEntities || []),
    socialSummary: normalizeSceneString(value.socialSummary),
  };
}

function pickGroupLikeEntity(values = []) {
  return (
    dedupeStrings(values, 8).find((entry) =>
      /\b(scouts?|caravan|hands?|volunteers?|guards?|companions?|travelers?|workers?|group|party|pilgrims?)\b/i.test(
        entry,
      ),
    ) || ""
  );
}

function fallbackPartyLabel(gameState = {}, sceneMemory = {}) {
  const priorLabel =
    pickGroupLikeEntity(sceneMemory.partyEntities) ||
    pickGroupLikeEntity(sceneMemory.familiarEntities) ||
    pickGroupLikeEntity(sceneMemory.presentEntities);
  if (priorLabel) return priorLabel;

  const locationLabel = normalizeSceneString(sceneMemory.locationLabel);
  if (/rootbound/i.test(locationLabel)) return "the rootbound scouts";
  if (/rally/i.test(locationLabel)) return "the rally volunteers";
  if (/caravan/i.test(locationLabel)) return "the caravan hands";

  const zoneLabel = normalizeSceneString(sceneMemory.zoneLabel);
  if (/wildroot/i.test(zoneLabel)) return "the rootbound scouts";
  if (/meridian/i.test(zoneLabel)) return "the rally volunteers";

  const currentLocationRaw =
    gameState?.world?.location?.current ?? gameState?.world?.location ?? null;
  const currentLocation =
    resolveLocationId(currentLocationRaw) ||
    (typeof currentLocationRaw === "string" ? currentLocationRaw.trim() : "");
  if (/wilds_/i.test(currentLocation)) return "the rootbound scouts";
  return "the group";
}

function extractStableSocialLabel(narrativeText = "", gameState = {}, sceneMemory = {}) {
  const matchers = [
    /\b(rootbound\s+scouts?)\b/i,
    /\b(caravan\s+hands?)\b/i,
    /\b(rally\s+volunteers?)\b/i,
    /\b(the\s+caravan)\b/i,
    /\b(the\s+scouts?)\b/i,
    /\b(the\s+guards?)\b/i,
    /\b(the\s+group)\b/i,
    /\b(the\s+party)\b/i,
  ];

  for (const matcher of matchers) {
    const match = narrativeText.match(matcher);
    if (!match?.[1]) continue;
    const normalized = match[1].trim().toLowerCase();
    if (normalized === "the caravan") return "the caravan hands";
    if (normalized === "the group" || normalized === "the party") {
      return fallbackPartyLabel(gameState, sceneMemory);
    }
    if (!normalized.startsWith("the ")) {
      return `the ${normalized}`;
    }
    return normalized;
  }

  return fallbackPartyLabel(gameState, sceneMemory);
}

function mergeSocialSceneMemory({
  gameState = {},
  baseSceneMemory = {},
  incomingSceneMemory = {},
  narrativeText = "",
} = {}) {
  const sourceText = String(narrativeText || "");
  const joinedParty =
    /\b(social link formed|joined the group|joined the caravan|travel(?:ing)? with(?: them| the|\b)|fell in with the caravan|you are traveling with|keep pace with the group)\b/i.test(
      sourceText,
    );
  const leftParty =
    /\b(part ways|leave them behind|travel alone|you are alone|the group scatters|they peel away|the caravan moves on without you)\b/i.test(
      sourceText,
    );
  const formedFamiliarity =
    joinedParty ||
    /\b(social link formed|know the others better|stops feeling like a wall of strangers|become legible|worth following)\b/i.test(
      sourceText,
    );

  let familiarEntities = incomingSceneMemory.familiarEntities?.length
    ? incomingSceneMemory.familiarEntities
    : dedupeStrings(baseSceneMemory.familiarEntities || []);
  let partyEntities = incomingSceneMemory.partyEntities?.length
    ? incomingSceneMemory.partyEntities
    : dedupeStrings(baseSceneMemory.partyEntities || []);

  if (leftParty && partyEntities.length > 0) {
    familiarEntities = dedupeStrings([...familiarEntities, ...partyEntities]);
    partyEntities = [];
  }

  if (formedFamiliarity) {
    const stableLabel = extractStableSocialLabel(sourceText, gameState, {
      ...baseSceneMemory,
      ...incomingSceneMemory,
    });
    const labelPool = stableLabel
      ? [stableLabel]
      : [
          pickGroupLikeEntity(incomingSceneMemory.presentEntities),
          pickGroupLikeEntity(baseSceneMemory.presentEntities),
        ].filter(Boolean);

    if (joinedParty) {
      partyEntities = dedupeStrings([...partyEntities, ...labelPool]);
    }
    familiarEntities = dedupeStrings([
      ...familiarEntities,
      ...partyEntities,
      ...labelPool,
    ]);
  }

  const socialSummary =
    incomingSceneMemory.socialSummary ||
    (partyEntities.length > 0
      ? `${partyEntities.join(", ")} are traveling with the player and must not be treated as strangers.`
      : familiarEntities.length > 0
        ? `${familiarEntities.join(", ")} are known contacts and must not be treated as strangers.`
        : normalizeSceneString(baseSceneMemory.socialSummary));

  return {
    familiarEntities,
    partyEntities,
    socialSummary,
  };
}

function resolveQuestObjective(gameState = {}) {
  const activeQuests = Array.isArray(gameState?.quests?.active)
    ? gameState.quests.active
    : [];
  const primaryQuest = activeQuests[0];
  if (!primaryQuest) return "";
  if (typeof primaryQuest.description === "string" && primaryQuest.description.trim()) {
    return primaryQuest.description.trim();
  }
  if (typeof primaryQuest.name === "string" && primaryQuest.name.trim()) {
    return `Advance quest: ${primaryQuest.name.trim()}`;
  }
  return "";
}

function buildPresentEntities(gameState = {}) {
  const priorSceneMemory = getPriorSceneMemory(gameState);
  const combat = gameState?.combat || {};
  const combatActive = Boolean(
    combat?.inCombat ?? combat?.status === "active",
  );
  const priorThreats = Array.isArray(priorSceneMemory.activeThreats)
    ? priorSceneMemory.activeThreats.map((entry) => String(entry).toLowerCase())
    : [];
  const combatEnemyNames = combatActive && Array.isArray(combat?.enemies)
    ? combat.enemies
        .filter((enemy) => toNumber(enemy?.stats?.hp?.current, 0) > 0)
        .map((enemy) => enemy?.name)
        .filter((enemyName) => typeof enemyName === "string" && enemyName.trim())
    : [];
  const carryForwardEntities = Array.isArray(priorSceneMemory.presentEntities)
    ? priorSceneMemory.presentEntities.filter((entry) =>
        combatActive ? true : !priorThreats.includes(String(entry).toLowerCase()),
      )
    : [];
  const familiarEntities = Array.isArray(priorSceneMemory.familiarEntities)
    ? priorSceneMemory.familiarEntities
    : [];
  const partyEntities = Array.isArray(priorSceneMemory.partyEntities)
    ? priorSceneMemory.partyEntities
    : [];

  return dedupeStrings([
    ...carryForwardEntities,
    ...familiarEntities,
    ...partyEntities,
    ...combatEnemyNames,
  ]);
}

function buildActiveThreats(gameState = {}) {
  const combat = gameState?.combat || {};
  const combatActive = Boolean(
    combat?.inCombat ?? combat?.status === "active",
  );
  if (combatActive && Array.isArray(combat?.enemies)) {
    return dedupeStrings(
      combat.enemies
        .filter((enemy) => toNumber(enemy?.stats?.hp?.current, 0) > 0)
        .map((enemy) => enemy?.name),
    );
  }
  return [];
}

function getAuthoredOpeningAuthority(gameState = {}) {
  const player = gameState?.player || {};
  const world = gameState?.world || {};
  const sceneId = world?.vars?.startingSceneId ?? world?.flags?.startingSceneId;
  const scene = getOpeningSceneById(sceneId);
  const selectedOpeningChoiceId = world?.vars?.openingSceneChoiceId || null;
  const resolvedOpeningSeed =
    sceneId && selectedOpeningChoiceId
      ? buildOpeningSceneNarrativeSeed(sceneId, selectedOpeningChoiceId)
      : null;
  const authoredStartingPrompt =
    typeof player?.startingPrompt === "string" ? player.startingPrompt.trim() : "";
  const authoredSceneText =
    typeof scene?.text === "string" ? scene.text.trim() : "";
  const authorityText = authoredStartingPrompt || resolvedOpeningSeed || authoredSceneText || "";
  const active = Boolean(authorityText);

  return {
    active,
    scene,
    sceneId,
    selectedOpeningChoiceId,
    resolvedOpeningSeed,
    authoredStartingPrompt,
    authorityText,
  };
}

export function buildSceneMemorySeed(gameState = {}, actionResult = null) {
  const world = gameState?.world || {};
  const player = gameState?.player || {};
  const priorSceneMemory = getPriorSceneMemory(gameState);
  const openingAuthority = getAuthoredOpeningAuthority(gameState);
  const locationRaw = world?.location?.current ?? world?.location ?? null;
  const locationId =
    resolveLocationId(locationRaw) ||
    (typeof locationRaw === "string" ? locationRaw.trim() : null);
  const resolvedLocation = locationId ? getLocationById(locationId) : null;
  const resolvedZone = resolvedLocation?.zoneId
    ? getZoneById(resolvedLocation.zoneId)
    : null;
  const oathOriginId =
    typeof player?.oathOrigin === "string"
      ? player.oathOrigin
      : player?.oathOrigin?.id || player?.startingZoneId || null;
  const openingArc =
    getOpeningArcByOathOriginId(oathOriginId) ||
    (world?.vars?.openingArc && typeof world.vars.openingArc === "object"
      ? world.vars.openingArc
      : null);
  const openingArcLandmarks = Array.isArray(openingArc?.landmarks)
    ? openingArc.landmarks
    : [];
  const openingArcHooks = Array.isArray(openingArc?.actionVocabulary)
    ? openingArc.actionVocabulary
    : [];
  const signatureNpc = openingArc?.signatureNpc?.name || null;
  const unresolvedHooks = dedupeStrings([
    ...(Array.isArray(priorSceneMemory.unresolvedHooks)
      ? priorSceneMemory.unresolvedHooks
      : []),
    ...((Array.isArray(gameState?.quests?.active) ? gameState.quests.active : [])
      .map((quest) => quest?.name)
      .filter(Boolean)),
    ...(openingArc?.firstPressure ? [openingArc.firstPressure] : []),
    ...openingArcLandmarks,
    ...openingArcHooks,
  ]);
  const immediateObjective =
    resolveQuestObjective(gameState) ||
    (typeof priorSceneMemory.immediateObjective === "string"
      ? priorSceneMemory.immediateObjective.trim()
      : "");
  const lastConsequence =
    typeof actionResult?.description === "string" && actionResult.description.trim()
      ? actionResult.description.trim()
      : typeof priorSceneMemory.lastConsequence === "string"
        ? priorSceneMemory.lastConsequence.trim()
        : "";
  const locationLabelFallback =
    (typeof priorSceneMemory.locationLabel === "string"
      ? priorSceneMemory.locationLabel.trim()
      : "") || (openingAuthority.active ? "Opening scene" : "Unknown");
  const zoneLabelFallback =
    (typeof priorSceneMemory.zoneLabel === "string"
      ? priorSceneMemory.zoneLabel.trim()
      : "") || (openingAuthority.active ? "Authored opening" : "Unknown Zone");

  return {
    locationLabel:
      resolvedLocation?.name ||
      locationLabelFallback,
    zoneLabel:
      resolvedZone?.name ||
      zoneLabelFallback,
    immediateObjective,
    presentEntities: dedupeStrings([
      ...buildPresentEntities(gameState),
      ...(signatureNpc ? [signatureNpc] : []),
    ]),
    activeThreats: dedupeStrings([
      ...buildActiveThreats(gameState),
      ...(openingArc?.firstPressure ? [openingArc.firstPressure] : []),
    ]),
    unresolvedHooks,
    lastConsequence,
    familiarEntities: dedupeStrings([
      ...(priorSceneMemory.familiarEntities || []),
      ...(signatureNpc ? [signatureNpc] : []),
    ]),
    partyEntities: dedupeStrings(priorSceneMemory.partyEntities || []),
    socialSummary: normalizeSceneString(
      priorSceneMemory.socialSummary ||
        (signatureNpc && openingArc?.firstPressure
          ? `${signatureNpc} is tied to ${openingArc.firstPressure}.`
          : priorSceneMemory.socialSummary),
    ),
  };
}

export function mergeNarrativeSceneMemory(
  gameState = {},
  actionResult = null,
  incomingSceneMemory = null,
  narrativeText = "",
) {
  const baseSceneMemory = buildSceneMemorySeed(gameState, actionResult);
  const normalizedIncoming = normalizeSceneMemoryInput(incomingSceneMemory);
  const socialMemory = mergeSocialSceneMemory({
    gameState,
    baseSceneMemory,
    incomingSceneMemory: normalizedIncoming,
    narrativeText,
  });
  const hasIncomingPresentEntities = normalizedIncoming.presentEntities.length > 0;

  return {
    locationLabel: normalizedIncoming.locationLabel || baseSceneMemory.locationLabel,
    zoneLabel: normalizedIncoming.zoneLabel || baseSceneMemory.zoneLabel,
    immediateObjective:
      normalizedIncoming.immediateObjective || baseSceneMemory.immediateObjective,
    presentEntities: dedupeStrings([
      ...(hasIncomingPresentEntities
        ? normalizedIncoming.presentEntities
        : baseSceneMemory.presentEntities),
      ...socialMemory.partyEntities,
    ]),
    activeThreats:
      normalizedIncoming.activeThreats.length > 0
        ? normalizedIncoming.activeThreats
        : baseSceneMemory.activeThreats,
    unresolvedHooks: dedupeStrings([
      ...baseSceneMemory.unresolvedHooks,
      ...normalizedIncoming.unresolvedHooks,
    ]),
    lastConsequence:
      normalizedIncoming.lastConsequence || baseSceneMemory.lastConsequence,
    familiarEntities: socialMemory.familiarEntities,
    partyEntities: socialMemory.partyEntities,
    socialSummary: socialMemory.socialSummary,
  };
}

function buildAuthoritativeSceneStateSection(gameState, actionResult) {
  const sceneMemory = buildSceneMemorySeed(gameState, actionResult);
  const narrativeSummary =
    typeof gameState?.narrative?.summary === "string" && gameState.narrative.summary.trim()
      ? gameState.narrative.summary.trim()
      : "No summary yet.";
  const validatedConsequence =
    typeof actionResult?.description === "string" && actionResult.description.trim()
      ? actionResult.description.trim()
      : actionResult?.success === false &&
          typeof actionResult?.reason === "string" &&
          actionResult.reason.trim()
        ? actionResult.reason.trim()
        : "No validated consequence recorded.";

  return [
    "=== AUTHORITATIVE SCENE STATE ===",
    `Scene Location: ${sceneMemory.locationLabel}`,
    `Scene Zone: ${sceneMemory.zoneLabel}`,
    `Immediate Objective: ${sceneMemory.immediateObjective || "None stated"}`,
    `Present Entities: ${sceneMemory.presentEntities.join(", ") || "None confirmed"}`,
    `Active Threats: ${sceneMemory.activeThreats.join(", ") || "None confirmed"}`,
    `Unresolved Hooks: ${sceneMemory.unresolvedHooks.join(", ") || "None"}`,
    `Last Consequence: ${sceneMemory.lastConsequence || "None confirmed"}`,
    `Familiar Entities: ${sceneMemory.familiarEntities.join(", ") || "None confirmed"}`,
    `Party Entities: ${sceneMemory.partyEntities.join(", ") || "None confirmed"}`,
    `Social Summary: ${sceneMemory.socialSummary || "None confirmed"}`,
    `Recent Summary: ${narrativeSummary}`,
    `Validated Action Consequence: ${validatedConsequence}`,
    "Continuity Rule: the scene state above is authoritative and recent history below is only supporting context.",
    "Companion Rule: familiarEntities and partyEntities are known contacts, not strangers, anonymous crowds, or unreadable unknowns. If unnamed, use a stable role label instead.",
  ].join("\n");
}

function buildMagicContextLines(player = {}, world = {}) {
  const magic =
    player?.magic && typeof player.magic === "object" && !Array.isArray(player.magic)
      ? player.magic
      : null;
  if (!magic) return [];

  const lines = [];
  const resonance = magic.resonance || {};
  const resonanceCurrent = toNumber(resonance.current, 0);
  const resonanceMax = Math.max(1, toNumber(resonance.max, 100));
  const resonanceState =
    typeof resonance.state === "string" && resonance.state.trim()
      ? resonance.state
      : "quiet";
  lines.push(
    `Magic Resonance: ${formatNumber(resonanceCurrent, 1)}/${formatNumber(resonanceMax, 1)} (${resonanceState})`,
  );

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
  const reserveList = Object.entries(reserves)
    .map(([essence, amount]) => ({
      essence,
      amount: toNumber(amount, 0),
      taint: toNumber(reservesTaint?.[essence], 0),
    }))
    .filter((entry) => entry.amount > 0.01)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);
  if (reserveList.length > 0) {
    lines.push(
      `Magic Reserves: ${reserveList
        .map(
          (entry) =>
            `${entry.essence} ${formatNumber(entry.amount, 2)} (taint ${Math.max(
              0,
              entry.taint * 100,
            ).toFixed(1)}%)`,
        )
        .join("; ")}`,
    );
  }

  const charges = Array.isArray(magic.charges) ? magic.charges : [];
  lines.push(`Magic Charges: ${charges.length}`);

  const prepared =
    magic.prepared && typeof magic.prepared === "object" && !Array.isArray(magic.prepared)
      ? magic.prepared
      : null;
  if (prepared) {
    const preparedKind = prepared.kind || "pattern";
    const preparedId = prepared.pattern || prepared.form || prepared.essence || "ready";
    lines.push(`Prepared Magic: ${preparedKind}:${preparedId}`);
  }

  const unlockedPatterns =
    magic.unlockedPatterns &&
    typeof magic.unlockedPatterns === "object" &&
    !Array.isArray(magic.unlockedPatterns)
      ? magic.unlockedPatterns
      : {};
  const patternCounts = Object.entries(unlockedPatterns)
    .map(([kind, list]) => ({
      kind,
      count: Array.isArray(list) ? list.filter(Boolean).length : 0,
    }))
    .filter((entry) => entry.count > 0);
  if (patternCounts.length > 0) {
    lines.push(
      `Unlocked Patterns: ${patternCounts
        .map((entry) => `${entry.kind}(${entry.count})`)
        .join(", ")}`,
    );
  }

  const perks = Array.isArray(magic.perks) ? magic.perks : [];
  if (perks.length > 0) {
    lines.push(
      `Magic Perks: ${perks
        .map((perk) => {
          if (typeof perk === "string") return perk;
          if (perk && typeof perk === "object") {
            const id = typeof perk.id === "string" ? perk.id : null;
            const rank = Number.isFinite(perk.rank) ? ` r${perk.rank}` : "";
            return id ? `${id}${rank}` : null;
          }
          return null;
        })
        .filter(Boolean)
        .slice(0, 6)
        .join(", ")}`,
    );
  }

  const ambient =
    world?.essence?.ambient &&
    typeof world.essence.ambient === "object" &&
    !Array.isArray(world.essence.ambient)
      ? world.essence.ambient
      : null;
  const ambientSnapshot =
    ambient &&
    ambient.global &&
    typeof ambient.global === "object" &&
    ambient.compositionByEssence &&
    typeof ambient.compositionByEssence === "object"
      ? ambient
      : null;

  if (ambientSnapshot) {
    const provenance = ambientSnapshot.provenance || {};
    const parts = [];
    if (provenance.timeOfDay) parts.push(`time ${provenance.timeOfDay}`);
    if (provenance.weatherType) {
      const intensity = Number.isFinite(provenance.weatherIntensity)
        ? ` ${Number(provenance.weatherIntensity).toFixed(2)}`
        : "";
      parts.push(`weather ${provenance.weatherType}${intensity}`);
    }
    if (Array.isArray(provenance.anomalyIds) && provenance.anomalyIds.length > 0) {
      parts.push(`anomalies ${provenance.anomalyIds.join(",")}`);
    }
    if (Array.isArray(provenance.sourceIds) && provenance.sourceIds.length > 0) {
      parts.push(`sources ${provenance.sourceIds.join(",")}`);
    }
    if (parts.length > 0) {
      lines.push(`Ambient Context: ${parts.join(" | ")}`);
    }

    const drawNotables = Object.entries(ambientSnapshot.global?.drawMultByEssence || {})
      .map(([essence, mult]) => ({ essence, mult: toNumber(mult, 1) }))
      .filter((entry) => Math.abs(entry.mult - 1) >= 0.05)
      .sort((a, b) => Math.abs(b.mult - 1) - Math.abs(a.mult - 1))
      .slice(0, 4);
    if (drawNotables.length > 0) {
      lines.push(
        `Ambient Draw Multipliers: ${drawNotables
          .map((entry) => `${entry.essence} x${entry.mult.toFixed(2)}`)
          .join("; ")}`,
      );
    }
  }

  return lines;
}


function buildDevourerContextLines(player = {}) {
  if (!isDevourerCorePlayer(player)) return [];
  const runtime = player?.archetypeSystem?.runtime || {};
  const resource = player?.archetypeSystem?.resource || {};
  const biomass = Number.isFinite(Number(resource.current)) ? Math.floor(Number(resource.current)) : 0;
  const taint = Number.isFinite(Number(runtime.taint)) ? Math.floor(Number(runtime.taint)) : 0;
  const storedSamples = runtime?.storedSamples && typeof runtime.storedSamples === "object"
    ? Object.entries(runtime.storedSamples)
        .map(([family, sample]) => `${family}:${Math.max(0, Math.floor(Number(sample?.count || 0)))}`)
        .filter((line) => !line.endsWith(":0"))
    : [];
  const adaptations = runtime?.adaptations && typeof runtime.adaptations === "object"
    ? Object.entries(runtime.adaptations)
        .map(([family, entry]) => ({ family, rank: Math.max(0, Math.floor(Number(entry?.rank || 0))) }))
        .filter((entry) => entry.rank > 0)
        .map((entry) => `${entry.family}:r${entry.rank}`)
    : [];
  const recentPrey = Array.isArray(runtime?.recentPrey) ? runtime.recentPrey.slice(-3) : [];
  const sentientCount = Math.max(0, Math.floor(Number(runtime?.sentientDevours || 0)));

  return [
    `Devourer Biomass: ${biomass}`,
    `Devourer Taint: ${taint}`,
    `Devourer Stored Samples: ${storedSamples.length ? storedSamples.join(", ") : "none"}`,
    `Devourer Adaptations: ${adaptations.length ? adaptations.join(", ") : "none"}`,
    `Devourer Recent Prey: ${recentPrey.length ? recentPrey.join(" | ") : "none"}`,
    `Devourer Sentient Devours: ${sentientCount}`,
  ];
}

/**
 * Builds the context section from game state
 */
function buildContextSection(gameState) {
  const player = gameState?.player || {};
  const world = gameState?.world || {};
  const archetypeSystem = resolvePlayerArchetypeSystem(player);
  const systemLines = [];
  const magicLines = buildMagicContextLines(player, world);
  const devourerLines = buildDevourerContextLines(player);
  const takeSystemPreview = (previewKey, fullKey, count = 2) => {
    if (!archetypeSystem || typeof archetypeSystem !== "object") return [];
    if (Array.isArray(archetypeSystem[previewKey])) {
      return archetypeSystem[previewKey].slice(0, count);
    }
    if (Array.isArray(archetypeSystem[fullKey])) {
      return archetypeSystem[fullKey].slice(0, count);
    }
    return [];
  };
  if (archetypeSystem) {
    const systemName = archetypeSystem.name || archetypeSystem.id || "Unknown";
    const category = archetypeSystem.category
      ? ` (${archetypeSystem.category})`
      : "";
    systemLines.push(`Archetype System: ${systemName}${category}`);
    const summary = archetypeSystem.summary || archetypeSystem.description;
    if (summary) {
      systemLines.push(`System Summary: ${summary}`);
    }
    const profile = [archetypeSystem.rarity, archetypeSystem.stability]
      .filter((value) => typeof value === "string" && value.trim().length > 0)
      .join(" / ");
    if (profile) {
      systemLines.push(`System Profile: ${profile}`);
    }
    const coreLoopPreview = takeSystemPreview("coreLoopPreview", "coreLoop", 2);
    if (coreLoopPreview.length) {
      systemLines.push(`System Core Loop: ${coreLoopPreview.join(" | ")}`);
    }
    const possibleUses = takeSystemPreview("possibleUsesPreview", "possibleUses", 2);
    if (possibleUses.length) {
      systemLines.push(`System Possible Uses: ${possibleUses.join(" | ")}`);
    }
    const limits = takeSystemPreview("limitsPreview", "limits", 2);
    if (limits.length) {
      systemLines.push(`System Limits: ${limits.join(" | ")}`);
    }
    const costs = takeSystemPreview("costsPreview", "costs", 2);
    if (costs.length) {
      systemLines.push(`System Costs: ${costs.join(" | ")}`);
    }
    const worldClassification = takeSystemPreview(
      "worldCompatibilityPreview",
      "worldCompatibility",
      2,
    );
    if (worldClassification.length) {
      systemLines.push(
        `System World Classification: ${worldClassification.join(" | ")}`,
      );
    }
    const narrativeHooks = Array.isArray(archetypeSystem.narrativeHooks)
      ? archetypeSystem.narrativeHooks.slice(0, 2)
      : [];
    if (narrativeHooks.length) {
      systemLines.push(`System Narrative Hooks: ${narrativeHooks.join(" | ")}`);
    }
    const factionReactions = takeSystemPreview(
      "factionReactionsPreview",
      "factionReactions",
      2,
    );
    if (factionReactions.length) {
      systemLines.push(
        `System Faction Reactions: ${factionReactions.join(" | ")}`,
      );
    }
  }

  const inventory = Array.isArray(player.inventory) ? player.inventory : [];
  const inventoryList =
    inventory.map((item) => `${item.name} (x${item.quantity})`).join(", ") ||
    "Empty";

  const equipment = player.equipment || {};
  const equippedItems = [];
  if (equipment.weapon?.name) {
    equippedItems.push(`Weapon: ${equipment.weapon.name}`);
  }
  if (equipment.armor?.name) {
    equippedItems.push(`Armor: ${equipment.armor.name}`);
  }
  const equippedLine = equippedItems.length
    ? `Equipped: ${equippedItems.join(", ")}`
    : null;

  const active = Array.isArray(gameState?.quests?.active)
    ? gameState.quests.active
    : [];
  const activeQuests =
    active.map((quest) => `${quest.name}: ${quest.description}`).join(" | ") ||
    "No active quests";

  const flags =
    world?.flags && typeof world.flags === "object" ? world.flags : {};
  const worldFlags =
    Object.entries(flags)
      .filter(([, flagValue]) => flagValue === true)
      .map(([flagKey]) => flagKey)
      .join(", ") || "None";

  const name = player.name || "Unknown";
  const level = toNumber(player.level, 1);
  const hpCurrent = toNumber(player.hp?.current ?? player.hp, 0);
  const hpMax = toNumber(
    player.hp?.max ?? player.maxHp ?? player.maxHealth,
    0,
  );
  const manaCurrent = toNumber(player.mana?.current ?? player.mana, 0);
  const manaMax = toNumber(
    player.mana?.max ?? player.maxMana ?? player.maxEnergy,
    0,
  );
  const xpCurrent = toNumber(player.xp?.current ?? player.xp, 0);
  const xpMax = toNumber(player.xp?.max ?? player.xpMax, 0);
  const xpToNext = Math.max(0, xpMax - xpCurrent);
  const locationRaw = world?.location?.current ?? world?.location ?? null;
  const locationId =
    resolveLocationId(locationRaw) ||
    (typeof locationRaw === "string" ? locationRaw.trim() : null);
  const resolvedLocation = locationId ? getLocationById(locationId) : null;
  const resolvedZone = resolvedLocation?.zoneId
    ? getZoneById(resolvedLocation.zoneId)
    : null;
  const zoneLabel =
    resolvedZone?.name || resolvedLocation?.zoneId || "Unknown Zone";
  const locationLabel = resolvedLocation?.name || locationId || "Unknown";
  const combat = gameState?.combat || {};
  const combatActive = Boolean(
    combat?.inCombat ?? combat?.status === "active",
  );
  const livingCombatants = combatActive && Array.isArray(combat?.enemies)
    ? combat.enemies.filter(
        (enemy) => toNumber(enemy?.stats?.hp?.current, 0) > 0,
      )
    : [];
  const combatTurn = typeof combat?.turn === "string" ? combat.turn : "unknown";
  const combatLine = combatActive
    ? `Combat Status: Active (${livingCombatants.length} enemies alive, turn: ${combatTurn})`
    : "Combat Status: Inactive";
  const combatEnemyLine = combatActive
    ? `Combat Enemies: ${livingCombatants
        .map((enemy) => {
          const enemyName = enemy?.name || "Unknown Enemy";
          const hpCurrent = toNumber(enemy?.stats?.hp?.current, 0);
          const hpMax = toNumber(enemy?.stats?.hp?.max, 0);
          return `${enemyName} (${hpCurrent}/${hpMax} HP)`;
        })
        .join("; ") || "None"}`
    : null;
  const arcaneTraceSummaryRaw = gameState?.world?.vars?.arcaneTrace?.summary;
  const arcaneTraceSummary =
    typeof arcaneTraceSummaryRaw === "string" ? arcaneTraceSummaryRaw.trim() : "";
  const arcaneTraceLine = arcaneTraceSummary
    ? arcaneTraceSummary.toLowerCase().startsWith("arcane traces")
      ? arcaneTraceSummary
      : `Arcane traces: ${arcaneTraceSummary}`
    : null;

  const secondaryClassLabel = resolveEntityLabel(player.secondaryClass, "None");
  const alignmentLabel = resolveEntityLabel(player.alignment, "None");
  const starterTrees = Array.isArray(player.starterTrees) ? player.starterTrees : [];
  const starterTreeLabel =
    starterTrees.length > 0
      ? starterTrees
          .map((entry) => resolveEntityLabel(entry, ""))
          .filter(Boolean)
          .join(", ")
      : "None";
  const creationPerks = Array.isArray(player.perks) ? player.perks : [];
  const creationPerkLabel =
    creationPerks.length > 0
      ? creationPerks
          .map((entry) => resolveEntityLabel(entry, ""))
          .filter(Boolean)
          .join(", ")
      : "None";
  const skillLoadoutLabel =
    typeof player.skillLoadoutId === "string" && player.skillLoadoutId.trim()
      ? player.skillLoadoutId.trim()
      : "None";

  const lines = [
    "=== CURRENT GAME STATE ===",
    `Player: ${name} (Level ${level})`,
    `Secondary Class: ${secondaryClassLabel}`,
    `Alignment: ${alignmentLabel}`,
    `Creation Perks: ${creationPerkLabel}`,
    `Starter Trees: ${starterTreeLabel}`,
    `Skill Loadout: ${skillLoadoutLabel}`,
    `HP: ${hpCurrent}/${hpMax}`,
    `Mana: ${manaCurrent}/${manaMax}`,
    `XP: ${xpCurrent}/${xpMax} (${xpToNext} until next level)`,
    `Zone: ${zoneLabel}`,
    `Location: ${locationLabel}`,
    arcaneTraceLine,
    combatLine,
    combatEnemyLine,
    equippedLine,
    `Inventory: ${inventoryList}`,
    `Active Quests: ${activeQuests}`,
    ...magicLines,
    ...systemLines,
    ...devourerLines,
    `World Flags: ${worldFlags}`,
  ].filter((line) => typeof line === "string" && line.trim().length > 0);

  return lines.join("\n");
}

/**
 * Builds the history section from recent narrative log
 */
export function buildHistorySection(gameState) {
  const narrativeEntries = Array.isArray(gameState.narrative?.entries)
    ? gameState.narrative.entries
    : [];
  const filteredHistory = narrativeEntries.filter((entry) =>
    HISTORY_ENTRY_TYPES.has(entry?.type),
  );
  const mergedHistory = filteredHistory.sort((a, b) => {
    const timestampDelta = (a.timestamp || 0) - (b.timestamp || 0);
    if (timestampDelta !== 0) return timestampDelta;
    const sequenceDelta = (a.sequence || 0) - (b.sequence || 0);
    if (sequenceDelta !== 0) return sequenceDelta;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
  const formatHistoryEntry = (entry) => {
    const entryText = String(entry?.text || "").trim();
    if (!entryText) return null;
    if (entry.type === "narrative") {
      return `Narrator: ${entryText}`;
    }
    if (entry.type === "system") {
      return `System: ${entryText}`;
    }
    if (entry.type === "status-update") {
      return `Status: ${entryText}`;
    }
    if (entry.type === "user") {
      const userText = entryText.replace(/^>\s*/, "").trim();
      return userText ? `Player: ${userText}` : null;
    }
    if (entry.type === "action") {
      return `Action: ${entryText}`;
    }
    return entryText;
  };
  const recentHistory = [];
  let totalChars = 0;
  for (let i = mergedHistory.length - 1; i >= 0; i -= 1) {
    const line = formatHistoryEntry(mergedHistory[i]);
    if (!line) continue;
    if (recentHistory.length >= MAX_HISTORY_ENTRIES) break;
    const nextLineCost = line.length + (recentHistory.length > 0 ? 1 : 0);
    if (totalChars + nextLineCost > MAX_HISTORY_CHARS) break;
    totalChars += nextLineCost;
    recentHistory.unshift(line);
  }

  if (recentHistory.length === 0) {
    return `=== RECENT HISTORY ===
${gameState.narrative.summary || "The adventure has just begun."}`;
  }

  return `=== RECENT HISTORY ===
${recentHistory.join("\n")}`;
}

/**
 * Builds the action section describing what the user did and what happened
 */
function buildActionSection(userInput, actionResult, reactionContext = null) {
  const safeUserInput = sanitizeUserInput(userInput);
  const shouldFavorDialogue = Boolean(
    actionResult?.dialogue?.requiresResponse || detectDialogueIntent(safeUserInput),
  );
  const result =
    actionResult && typeof actionResult === "object"
      ? actionResult
      : { success: false, reason: "No action result provided." };
  const dialogue =
    result.dialogue && typeof result.dialogue === "object" ? result.dialogue : null;
  let actionDescription = "";

  if (result.success) {
    actionDescription = `The player attempted (untrusted user input): "${safeUserInput}"
The action succeeded. ${result.description || "Action completed."}`;

    if (result.changes) {
      const changes = [];
      if (result.changes.hp) {
        changes.push(
          `HP changed to ${result.changes.hp.current}/${result.changes.hp.max}`,
        );
      }
      if (result.changes.xp) {
        changes.push(
          `XP changed to ${result.changes.xp.current}/${result.changes.xp.max}`,
        );
      }
      if (result.changes.level) {
        changes.push(`Level increased to ${result.changes.level}`);
      }
      if (result.changes.itemUsed) {
        changes.push(`Used item: ${result.changes.itemUsed}`);
      }
      if (result.changes.location) {
        changes.push(`Moved to: ${result.changes.location}`);
      }

      if (changes.length > 0) {
        actionDescription += `\nGame state changes: ${changes.join(", ")}`;
      }
    }

    const resolvedState =
      result.state && typeof result.state === "object" ? result.state : null;
    if (resolvedState) {
      const combat = resolvedState?.combat || {};
      const combatActive = Boolean(
        combat?.inCombat ?? combat?.status === "active",
      );
      if (!combatActive) {
        actionDescription += "\nGround truth: Combat is inactive after this action.";
      } else {
        const livingEnemies = Array.isArray(combat?.enemies)
          ? combat.enemies.filter(
              (enemy) => toNumber(enemy?.stats?.hp?.current, 0) > 0,
            )
          : [];
        const enemySummary =
          livingEnemies
            .map((enemy) => {
              const enemyName = enemy?.name || "Unknown Enemy";
              const hpCurrent = toNumber(enemy?.stats?.hp?.current, 0);
              const hpMax = toNumber(enemy?.stats?.hp?.max, 0);
              return `${enemyName} (${hpCurrent}/${hpMax} HP)`;
            })
            .join("; ") || "None";
        actionDescription += `\nGround truth: Combat remains active with ${livingEnemies.length} enemies alive (${enemySummary}).`;
      }
    }

    if (
      typeof result.openingNarrativeSeed === "string" &&
      result.openingNarrativeSeed.trim()
    ) {
      actionDescription += `\nOpening scene seed:\n${result.openingNarrativeSeed.trim()}`;
    }
    if (dialogue?.requiresResponse) {
      actionDescription += `\nDialogue resolution required: yes.`;
      if (dialogue?.targetLabel) {
        actionDescription += `\nAddressed target: ${dialogue.targetLabel}`;
      }
      if (dialogue?.topic) {
        actionDescription += `\nDialogue topic: ${dialogue.topic}`;
      }
    }
    if (reactionContext?.focusEntity) {
      actionDescription += `\nAmbient reaction cue: ${reactionContext.focusEntity} should ${reactionContext.pressure}.`;
      actionDescription += `\nAmbient reaction trigger: ${reactionContext.trigger}`;
    }
  } else {
    actionDescription = `The player attempted (untrusted user input): "${safeUserInput}"
The action failed. ${result.reason || "Action could not be completed."}`;
    if (reactionContext?.focusEntity) {
      actionDescription += `\nAmbient reaction cue: ${reactionContext.focusEntity} should ${reactionContext.pressure}.`;
      actionDescription += `\nAmbient reaction trigger: ${reactionContext.trigger}`;
    }
  }

  return `=== PLAYER ACTION ===
${actionDescription}

=== YOUR TASK ===
Generate a structured narrative response describing what happened. Be vivid and immersive. If the action failed, describe why it failed in a way that fits the game world. ${shouldFavorDialogue ? "This is a direct social turn. If a present sentient NPC or group is being addressed, the scene must resolve with one of: a direct answer, a concrete refusal with a reason, or a clear visible social action. Do not leave a direct question hanging in unexplained silence." : "Do not open with quoted dialogue; begin with immediate scene action or sensory detail."}

Hard rules:
- Treat the player's command as something the character genuinely attempts unless it explicitly tries to force impossible or unearned mechanics.
- You may introduce minor, non-persistent scene details, fleeting bystander reactions, footing issues, pathing beats, or connective motion to make the attempted action legible.
- Do not add or remove major present entities unless supported by state, recent history, or the attempted action's grounded consequence.
- Do not narrate ongoing combat when combat is inactive.
- Do not grant levels, stats, loot, quest completion, permanent alliances, major location changes, or other persistent rewards unless validated by state or emitted through stateIntents.
- Do not contradict established core state such as current location, combat status, confirmed major entities, or resolved quest outcomes.
- When scene data is incomplete, choose the most plausible grounded continuation instead of stalling on missing micro-details.
- Begin the first sentence with the concrete result of the attempted action, grounded reaction, or failed attempt.
- Favor immediate physical consequence, sensory detail, and body-awareness over distant summary when the player is vulnerable, transformed, or under pressure.
- If system flavor appears, keep it to 1-2 short bracketed notices integrated into the scene rather than a detached explanation.
- Even low-level survival actions should feel consequential when the player is injured, exposed, hungry, unstable, or being hunted.
- When the player directly addresses nearby sentient NPCs, do not answer with vague silence alone. Resolve the turn with an answer, refusal, or visible social reaction.
- When present entities are already watching, alerted, wary, or socially engaged, at least one of them should react in a concrete way to noticeable player actions if that reaction is grounded by scene state.
- If an ambient reaction cue is provided, let that focus entity visibly react in line with the stated pressure unless current threats or established state make that impossible.
- Each suggestion must be feasible from the current scene and distinct in category from the others.
- Suggestions must not be simple paraphrases of the same move.
- stateIntents is optional. Include it only when a concrete, grounded world consequence should be persisted.
- If a persistent consequence exists, state it plainly in narration (e.g., "Reputation increased by 1.", "Clue: hidden_passage_map", "Flag: guard_alert active").

=== RESPONSE FORMAT ===
Return one valid JSON object with this shape:
{
  "story": "Plain text only. 4-8 sentences. Under 1200 characters.",
  "mood": "neutral|tense|triumphant|mysterious|serene|desperate",
  "suggestions": [
    {
      "label": "Short actionable next move",
      "command": "Exact executable command",
      "weight": 0.0,
      "enabled": true,
      "reason": "Why this move fits now"
    }
  ],
  "choiceMeta": [
    { "intent": "brief rationale", "category": "observe|social|progress|recovery|power|risk", "urgency": 0.0, "groundedInState": true }
  ],
  "stateIntents": [
    { "type": "world.flag.set", "flag": "string_flag_id", "value": true },
    { "type": "clue.add", "clueId": "string_clue_id" },
    { "type": "player.reputation.delta", "value": 1 },
    { "type": "magic.journal.add", "note": "brief magic insight from narrative" }
  ],
  "sceneMemory": {
    "locationLabel": "Current place name",
    "zoneLabel": "Current zone name",
    "immediateObjective": "Immediate goal",
    "presentEntities": ["Confirmed entity"],
    "activeThreats": ["Confirmed threat"],
    "unresolvedHooks": ["Open thread"],
    "lastConsequence": "Most important new consequence from this turn",
    "familiarEntities": ["Known contact or group"],
    "partyEntities": ["Current traveling companion or allied group"],
    "socialSummary": "How these contacts relate to the player right now"
  }
}

Return 5-8 suggestions and the same number of aligned choiceMeta entries when possible.`;
}

/**
 * Builds a context-rich opening prompt when the adventure begins
 */
export function buildInitialPrompt(gameState = {}) {
  const player = gameState.player || {};
  const playerName = player.name || "Unknown Adventurer";
  const raceName =
    typeof player.race === "string"
      ? player.race
      : player.race?.name || "Human";
  const className =
    typeof player.class === "string"
      ? player.class
      : player.class?.name || "Drifter";
  const archetypeSystem = resolvePlayerArchetypeSystem(player);
  const systemName = archetypeSystem?.name || "Unbound";
  const systemCategory = archetypeSystem?.category
    ? ` (${archetypeSystem.category})`
    : "";
  const systemSummary =
    archetypeSystem?.summary || archetypeSystem?.description;
  const systemHooks = Array.isArray(archetypeSystem?.questHooks)
    ? archetypeSystem.questHooks.slice(0, 2)
    : [];
  const professionName =
    typeof player.profession === "string"
      ? player.profession
      : player.profession?.name || "Generalist";
  const oathOriginId =
    typeof player?.oathOrigin === "string"
      ? player.oathOrigin
      : player?.oathOrigin?.id || player?.startingZoneId || null;
  const openingArc =
    getOpeningArcByOathOriginId(oathOriginId) ||
    (gameState?.world?.vars?.openingArc && typeof gameState.world.vars.openingArc === "object"
      ? gameState.world.vars.openingArc
      : null);
  const oathOriginName =
    typeof player?.oathOrigin === "string"
      ? player.oathOrigin
      : player?.oathOrigin?.name || null;

  const activeQuests = Array.isArray(gameState.quests?.active)
    ? gameState.quests.active
    : [];
  const mainQuest = activeQuests[0] || null;
  const sideQuests = activeQuests.slice(1, 3);

  const sceneId =
    gameState?.world?.vars?.startingSceneId ??
    gameState?.world?.flags?.startingSceneId;
  const openingAuthority = getAuthoredOpeningAuthority(gameState);
  const scene = openingAuthority.scene;
  const openingChoicePending = Boolean(
    gameState?.world?.vars?.openingSceneChoicePending,
  );
  const selectedOpeningChoiceId =
    gameState?.world?.vars?.openingSceneChoiceId || null;
  const openingChoices = sceneId ? listOpeningSceneChoices(sceneId) : [];
  const openingChoiceLines = openingChoices
    .slice(0, 4)
    .map((choice, index) => `${index + 1}. ${choice.label}`);
  const resolvedOpeningSeed = openingAuthority.resolvedOpeningSeed;
  const openingLocationRaw =
    gameState?.world?.location?.current ?? gameState?.world?.location ?? null;
  const openingLocationId =
    resolveLocationId(openingLocationRaw) ||
    (typeof openingLocationRaw === "string"
      ? openingLocationRaw.trim()
      : null);
  const openingLocation = openingLocationId
    ? getLocationById(openingLocationId)
    : null;
  const openingZone = openingLocation?.zoneId
    ? getZoneById(openingLocation.zoneId)
    : null;
  const startingPointZone = player.startingZoneId
    ? getZoneById(player.startingZoneId)
    : null;
  const authoredOpeningActive = openingAuthority.active;
  const startingPointName =
    authoredOpeningActive
      ? null
      : oathOriginName || startingPointZone?.name || openingZone?.name || null;
  const hasQuestThreads = activeQuests.length > 0;
  const sceneDescription = describeOpeningScene(scene, {
    mainQuestName: mainQuest?.name || "the first strange trouble in reach",
    sideHookNames: sideQuests.map((q) => q.name),
    locationHint:
      authoredOpeningActive
        ? scene?.biome || "wilderness"
        : openingLocation?.name || openingZone?.name || scene?.biome || "district",
    factionHint: scene?.tone || "locals",
  });
  const openingSceneNarrative = openingAuthority.authoredStartingPrompt || sceneDescription;

  const openingPressureLines = [
    "Immediate Lead -> Let the first meaningful opportunity emerge from the opening scene itself.",
    startingPointName
      ? `Starting Point Pressure -> ${startingPointName} should shape the first tension, contact, or curiosity.`
      : null,
    openingLocation?.name && !authoredOpeningActive
      ? `Current Locale -> ${openingLocation.name}`
      : null,
    authoredOpeningActive
      ? "Opening Authority -> Treat the authored opening premise as canonical for this first scene. Do not relocate the player to a default hub or city unless the authored opening explicitly says so."
      : null,
    openingChoicePending && openingChoiceLines.length
      ? "Opening Choice -> One of the listed opening choices should feel naturally tempting, but no formal quest has been assigned yet."
      : "Opening Momentum -> No formal quest has been assigned yet. End on a clear immediate action the player can choose.",
  ]
    .filter(Boolean)
    .join("\n");
  const threadLines = hasQuestThreads
    ? [
        `Main Quest -> ${mainQuest.name}: ${mainQuest.description}`,
        ...sideQuests.map((q) => `Side Hook -> ${q.name}: ${q.description}`),
      ].join("\n")
    : openingPressureLines;
  const threadSectionTitle = hasQuestThreads
    ? "=== QUEST THREADS ==="
    : "=== OPENING PRESSURES ===";
  const openingArcSection = openingArc
    ? [
        "=== OPENING ARC ===",
        `Arc Title: ${openingArc.title || "Unnamed opening arc"}`,
        openingArc.signatureNpc?.name
          ? `Signature NPC: ${openingArc.signatureNpc.name}${openingArc.signatureNpc.role ? ` (${openingArc.signatureNpc.role})` : ""}`
          : null,
        openingArc.firstPressure ? `First Pressure: ${openingArc.firstPressure}` : null,
        Array.isArray(openingArc.landmarks) && openingArc.landmarks.length
          ? `Nearby Landmarks: ${openingArc.landmarks.join(", ")}`
          : null,
        Array.isArray(openingArc.actionVocabulary) && openingArc.actionVocabulary.length
          ? `Action Vocabulary: ${openingArc.actionVocabulary.join(", ")}`
          : null,
        openingArc.firstQuest?.name ? `Opening Quest: ${openingArc.firstQuest.name}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const narrativeHooks = Array.isArray(archetypeSystem?.narrativeHooks)
    ? archetypeSystem.narrativeHooks.slice(0, 2)
    : [];
  const toneDirective = buildArchetypeToneDirective(archetypeSystem);
  const openingVoiceDirective = buildOpeningVoiceDirective(player, systemName);

  const skillNames = Array.isArray(player.activeSkills)
    ? player.activeSkills.map((s) => s.name || s.id).filter(Boolean).slice(0, 4)
    : [];
  const skillLine = skillNames.length
    ? `Active Skills: ${skillNames.join(", ")}`
    : "";

  return `You are a LitRPG narrator. The player has just completed character creation.
${toneDirective}
=== PLAYER PROFILE ===
Name: ${playerName}
Race: ${raceName}
Class: ${className}
System: ${systemName}${systemCategory}
${systemSummary ? `System Summary: ${systemSummary}` : ""}
Profession: ${professionName}
${startingPointName ? `Starting Point: ${startingPointName}` : ""}
${openingAuthority.authoredStartingPrompt ? `Authored Opening: ${openingAuthority.authoredStartingPrompt}` : ""}
${skillLine}

=== OPENING SCENE ===
${openingSceneNarrative}
${openingChoicePending && openingChoiceLines.length
    ? `\n=== OPENING CHOICES ===\n${openingChoiceLines.join("\n")}`
    : ""}
${resolvedOpeningSeed
    ? `\n=== RESOLVED OPENING SEED ===\n${resolvedOpeningSeed}`
    : ""}
${openingArcSection ? `\n${openingArcSection}` : ""}

${threadSectionTitle}
${threadLines}
${systemHooks.length ? `\n=== SYSTEM HOOKS ===\n${systemHooks.join("\n")}` : ""}
${narrativeHooks.length ? `\n=== NARRATIVE HOOKS ===\n${narrativeHooks.join("\n")}` : ""}
${openingVoiceDirective ? `\n${openingVoiceDirective}` : ""}

TASK: Deliver an atmospheric opening (6-9 sentences) that:
- Establishes the scene and immediate surroundings${startingPointName ? `\n- Names the player's starting point ("${startingPointName}") within the first two sentences` : ""}
- ${authoredOpeningActive ? "Honors the authored opening premise without relocating the player to a generic hub, alcove, or city that the opening does not mention" : "Keeps the opening grounded in the current world state"}
- References the player's system ("${systemName}") naturally, as if it is part of the world
- ${hasQuestThreads
    ? "Hints at one quest thread without being heavy-handed"
    : "Hints at one immediate tension, opportunity, or mystery without framing it as a formal quest"}
- Echoes at least one landmark, pressure, or action verb from the opening arc when one is available
- Uses at least one emotionally reactive beat rather than staying purely external
- Ends with a compelling hook that invites the player's first action${openingChoicePending && openingChoiceLines.length ? " and nudges one opening choice naturally." : ""}
Hard limit: keep the response under 1200 characters.

=== RESPONSE FORMAT ===
Return one valid JSON object with this shape:
{
  "story": "Plain text only. 6-9 sentences. Under 1200 characters.",
  "mood": "neutral|tense|triumphant|mysterious|serene|desperate",
  "suggestions": [
    {
      "label": "Short actionable next move",
      "command": "Exact executable command",
      "weight": 0.0,
      "enabled": true,
      "reason": "Why this move fits now"
    }
  ],
  "choiceMeta": [
    { "intent": "brief rationale", "category": "observe|social|progress|recovery|power|risk", "urgency": 0.0, "groundedInState": true }
  ],
  "sceneMemory": {
    "locationLabel": "Current place name",
    "zoneLabel": "Current zone name",
    "immediateObjective": "Immediate goal",
    "presentEntities": ["Confirmed entity"],
    "activeThreats": ["Confirmed threat"],
    "unresolvedHooks": ["Open thread"],
    "lastConsequence": "Most important opening consequence",
    "familiarEntities": ["Known contact or group"],
    "partyEntities": ["Current traveling companion or allied group"],
    "socialSummary": "How these contacts relate to the player right now"
  }
}

Return 5-8 suggestions and the same number of aligned choiceMeta entries when possible.`;
}
