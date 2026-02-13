// =================================================================
// PROMPT ASSEMBLER
// Builds the prompt sent to the narrative service
// =================================================================

import {
  describeOpeningScene,
  getOpeningSceneById,
} from "../data/OpeningScenes.js";
import {
  getLocationById,
  getZoneById,
  resolveLocationId,
} from "../world/WorldDataRegistry.js";
import { getArchetypeSystemById } from "../systems/archetype/ArchetypeSystemRegistry.js";
import { toNumber } from "../utils/shared.js";
import {
  PROMPT_MODES,
  getModeDirective,
  getSafetyDirective,
} from "./promptTemplates.js";

const MAX_HISTORY_ENTRIES = 20;
const MAX_HISTORY_CHARS = 4000;

const sanitizeUserInput = (input) => {
  if (typeof input !== "string") return "";
  const noNewlines = input.replace(/[\r\n\t]+/g, " ");
  const collapsed = noNewlines.replace(/\s{2,}/g, " ").trim();
  return collapsed.slice(0, 400);
};

function resolveArchetypeSystem(player = {}) {
  const raw = player.system ?? player.archetypeSystem;
  if (!raw) return null;
  if (typeof raw === "string") {
    return getArchetypeSystemById(raw) || { id: raw, name: raw };
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const maybeId = raw.id || raw.archetypeId || raw.definition?.id;
    const resolved = maybeId ? getArchetypeSystemById(maybeId) : null;
    return resolved || raw.definition || raw;
  }
  return null;
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
  if (actionType === "narrative") {
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
  const archetypeSystem = resolveArchetypeSystem(gameState?.player);
  const mode = resolvePromptMode(gameState, actionResult);
  const currentMood =
    typeof gameState?.narrative?.currentMood === "string"
      ? gameState.narrative.currentMood
      : "neutral";
  const systemPrompt = buildSystemPrompt({ archetypeSystem, mode, currentMood });
  const contextSection = buildContextSection(gameState);
  const historySection = buildHistorySection(gameState);
  const actionSection = buildActionSection(userInput, actionResult);

  return `${systemPrompt}

${contextSection}

${historySection}

${actionSection}`;
}

/**
 * Builds the system prompt that defines the AI's role and output format
 */
function buildSystemPrompt({ archetypeSystem, mode, currentMood }) {
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
${modeDirective}
${moodDirective}
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
  if (tone && typeof tone === "object" && !Array.isArray(tone)) {
    const voice = tone.voice || "";
    const sentenceStyle = tone.sentenceStyle || "";
    const vocabulary = Array.isArray(tone.vocabulary)
      ? tone.vocabulary.filter(Boolean).slice(0, 8)
      : [];
    const vocabLine = vocabulary.length
      ? `Weave these terms naturally when relevant: ${vocabulary.join(", ")}.`
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
    Authority: `\nNarrative tone: commanding and regal. The player wields the "${name}" authority. Convey weight, dominion, and the burden of power. Let descriptions carry gravity and sovereignty.`,
    Path: `\nNarrative tone: mystical and transformative. The player walks the "${name}" path. Emphasize ritual, ascension, and the sense of becoming something greater. Use evocative, almost reverent language.`,
    Framework: `\nNarrative tone: cerebral and meta-aware. The player operates within the "${name}" framework. Hint at the underlying rules being bent or rewritten. Use clever, layered descriptions.`,
    Privilege: `\nNarrative tone: conspiratorial and knowing. The player holds the "${name}" privilege. Weave in hidden knowledge, subtle advantages, and the feeling of seeing what others cannot.`,
    Overlay: `\nNarrative tone: volatile and high-energy. The player runs the "${name}" overlay. Emphasize glitches, risk, and the thrill of exploiting reality. Descriptions should crackle with instability.`,
  };

  return toneMap[category] || `\nThe player's archetype system is "${name}". Reference it when relevant.`;
}

function formatNumber(value, digits = 2) {
  return Number.isFinite(value) ? Number(value).toFixed(digits) : "0.00";
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

/**
 * Builds the context section from game state
 */
function buildContextSection(gameState) {
  const player = gameState?.player || {};
  const world = gameState?.world || {};
  const archetypeSystem = resolveArchetypeSystem(player);
  const systemLines = [];
  const magicLines = buildMagicContextLines(player, world);
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
    const narrativeHooks = Array.isArray(archetypeSystem.narrativeHooks)
      ? archetypeSystem.narrativeHooks.slice(0, 2)
      : [];
    if (narrativeHooks.length) {
      systemLines.push(`System Narrative Hooks: ${narrativeHooks.join(" | ")}`);
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

  const lines = [
    "=== CURRENT GAME STATE ===",
    `Player: ${name} (Level ${level})`,
    `HP: ${hpCurrent}/${hpMax}`,
    `Mana: ${manaCurrent}/${manaMax}`,
    `XP: ${xpCurrent}/${xpMax} (${xpToNext} until next level)`,
    `Zone: ${zoneLabel}`,
    `Location: ${locationLabel}`,
    equippedLine,
    `Inventory: ${inventoryList}`,
    `Active Quests: ${activeQuests}`,
    ...magicLines,
    ...systemLines,
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
    ["narrative", "system", "status-update"].includes(entry.type),
  );
  const mergedHistory = filteredHistory.sort((a, b) => {
    const timestampDelta = (a.timestamp || 0) - (b.timestamp || 0);
    if (timestampDelta !== 0) return timestampDelta;
    const sequenceDelta = (a.sequence || 0) - (b.sequence || 0);
    if (sequenceDelta !== 0) return sequenceDelta;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
  const recentHistory = [];
  let totalChars = 0;
  for (let i = mergedHistory.length - 1; i >= 0; i -= 1) {
    const entry = mergedHistory[i];
    const entryText = String(entry.text || "");
    if (!entryText) continue;
    if (recentHistory.length >= MAX_HISTORY_ENTRIES) break;
    if (totalChars + entryText.length > MAX_HISTORY_CHARS) break;
    totalChars += entryText.length;
    recentHistory.unshift(entry);
  }

  if (recentHistory.length === 0) {
    return `=== RECENT HISTORY ===
${gameState.narrative.summary || "The adventure has just begun."}`;
  }

  const historyLines = recentHistory
    .map((msg) => {
      if (msg.type === "narrative") {
        return `Narrator: ${msg.text}`;
      }
      if (msg.type === "system") {
        return `System: ${msg.text}`;
      }
      if (msg.type === "status-update") {
        return `Status: ${msg.text}`;
      }
      return msg.text;
    })
    .filter((line) => typeof line === "string" && line.trim().length > 0);

  let historyText = historyLines.join("\n");
  if (historyText.length > MAX_HISTORY_CHARS) {
    const trimmed = [];
    let total = 0;
    for (let i = historyLines.length - 1; i >= 0; i -= 1) {
      const line = historyLines[i];
      if (total + line.length + 1 > MAX_HISTORY_CHARS) break;
      trimmed.unshift(line);
      total += line.length + 1;
    }
    historyText = trimmed.join("\n");
  }

  return `=== RECENT HISTORY ===
${historyText}`;
}

/**
 * Builds the action section describing what the user did and what happened
 */
function buildActionSection(userInput, actionResult) {
  const safeUserInput = sanitizeUserInput(userInput);
  const result =
    actionResult && typeof actionResult === "object"
      ? actionResult
      : { success: false, reason: "No action result provided." };
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
  } else {
    actionDescription = `The player attempted (untrusted user input): "${safeUserInput}"
The action failed. ${result.reason || "Action could not be completed."}`;
  }

  return `=== PLAYER ACTION ===
${actionDescription}

=== YOUR TASK ===
Generate a narrative response describing what happened. Be vivid and immersive. If the action failed, describe why it failed in a way that fits the game world. Hard limit: keep the response under 1200 characters.`;
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
  const archetypeSystem = resolveArchetypeSystem(player);
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

  const activeQuests = Array.isArray(gameState.quests?.active)
    ? gameState.quests.active
    : [];
  const mainQuest = activeQuests[0] || null;
  const sideQuests = activeQuests.slice(1, 3);

  const sceneId =
    gameState?.world?.vars?.startingSceneId ??
    gameState?.world?.flags?.startingSceneId;
  const scene = getOpeningSceneById(sceneId);
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
  const sceneDescription = describeOpeningScene(scene, {
    mainQuestName: mainQuest?.name || "the looming mystery",
    sideHookNames: sideQuests.map((q) => q.name),
    locationHint:
      openingLocation?.name || openingZone?.name || scene?.biome || "district",
    factionHint: scene?.tone || "locals",
  });

  const questLines = [
    mainQuest
      ? `Main Quest -> ${mainQuest.name}: ${mainQuest.description}`
      : "Main Quest -> Pending discovery.",
  ]
    .concat(sideQuests.map((q) => `Side Hook -> ${q.name}: ${q.description}`))
    .join("\n");

  const narrativeHooks = Array.isArray(archetypeSystem?.narrativeHooks)
    ? archetypeSystem.narrativeHooks.slice(0, 2)
    : [];
  const toneDirective = buildArchetypeToneDirective(archetypeSystem);

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
${skillLine}

=== OPENING SCENE ===
${sceneDescription}

=== QUEST THREADS ===
${questLines}
${systemHooks.length ? `\n=== SYSTEM HOOKS ===\n${systemHooks.join("\n")}` : ""}
${narrativeHooks.length ? `\n=== NARRATIVE HOOKS ===\n${narrativeHooks.join("\n")}` : ""}

TASK: Deliver an atmospheric opening (6-9 sentences) that:
- Establishes the scene and immediate surroundings
- References the player's system ("${systemName}") naturally, as if it is part of the world
- Hints at one quest thread without being heavy-handed
- Ends with a compelling hook that invites the player's first action
Hard limit: keep the response under 1200 characters.

Respond with narrative text only.`;
}
