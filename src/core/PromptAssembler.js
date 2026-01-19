// =================================================================
// PROMPT ASSEMBLER
// Builds the prompt sent to OpenAI for narrative generation
// =================================================================

import {
  describeOpeningScene,
  getOpeningSceneById,
} from "../data/OpeningScenes.js";

/**
 * Assembles the complete prompt for the AI narrative engine
 * @param {object} gameState - The current game state
 * @param {string} userInput - The user's text input
 * @param {object} actionResult - The result from the logic engine (what actually happened)
 * @returns {string} The complete prompt string
 */
export function assemblePrompt(gameState, userInput, actionResult) {
  const systemPrompt = buildSystemPrompt();
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
function buildSystemPrompt() {
  return `You are a LitRPG narrator for an interactive text-based game. Your role is to:
1. Describe the game world and events in an engaging, immersive style
2. Respond to player actions with vivid, descriptive narrative
3. Maintain consistency with the game's fantasy/sci-fi setting
4. Keep responses concise but atmospheric (5-9 sentences typically)

IMPORTANT: You must respond ONLY with valid JSON in this exact format:
{
  "narrative": "Your descriptive text here describing what happened",
  "mood": "neutral|tense|triumphant|defeated|mysterious",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

The "narrative" field should describe what happened based on the action result.
The "mood" field sets the emotional tone.
The "suggestions" field provides 3 brief hints about what the player might do next.`;
}

/**
 * Builds the context section from game state
 */
function buildContextSection(gameState) {
  const player = gameState.player;
  const world = gameState.world;

  // Build inventory list
  const inventoryList =
    player.inventory
      .map((item) => `${item.name} (x${item.quantity})`)
      .join(", ") || "Empty";

  // Build equipped items
  const equippedItems = [];
  if (player.equipment.weapon)
    equippedItems.push(`Weapon: ${player.equipment.weapon.name}`);
  if (player.equipment.armor)
    equippedItems.push(`Armor: ${player.equipment.armor.name}`);

  // Build active quests
  const activeQuests =
    gameState.quests.active
      .map((quest) => `${quest.name}: ${quest.description}`)
      .join(" | ") || "No active quests";

  return `=== CURRENT GAME STATE ===
Player: ${player.name} (Level ${player.level})
HP: ${player.hp.current}/${player.hp.max}
Mana: ${player.mana.current}/${player.mana.max}
XP: ${player.xp.current}/${player.xp.max} (${player.xp.max - player.xp.current} until next level)
Location: ${world.location.current}
${equippedItems.length > 0 ? `Equipped: ${equippedItems.join(", ")}` : ""}
Inventory: ${inventoryList}
Active Quests: ${activeQuests}
World Flags: ${
    Object.entries(world.flags)
      .filter(([, flagValue]) => flagValue)
      .map(([flagKey]) => flagKey)
      .join(", ") || "None"
  }`;
}

/**
 * Builds the history section from recent narrative log
 */
function buildHistorySection(gameState) {
  const chatLog = gameState.narrative.chatLog || [];
  const recentHistory = chatLog.slice(-10); // Last 10 messages

  if (recentHistory.length === 0) {
    return `=== RECENT HISTORY ===
${gameState.narrative.summary || "The adventure has just begun."}`;
  }

  const historyText = recentHistory
    .map((msg) => {
      if (msg.type === "narrative") {
        return `Narrator: ${msg.text}`;
      } else if (msg.type === "system") {
        return `System: ${msg.text}`;
      } else {
        return msg.text;
      }
    })
    .join("\n");

  return `=== RECENT HISTORY ===
${historyText}`;
}

/**
 * Builds the action section describing what the user did and what happened
 */
function buildActionSection(userInput, actionResult) {
  let actionDescription = "";

  if (actionResult.success) {
    actionDescription = `The player attempted: "${userInput}"
The action succeeded. ${actionResult.description || "Action completed."}`;

    if (actionResult.changes) {
      const changes = [];
      if (actionResult.changes.hp) {
        changes.push(
          `HP changed to ${actionResult.changes.hp.current}/${actionResult.changes.hp.max}`,
        );
      }
      if (actionResult.changes.xp) {
        changes.push(
          `XP changed to ${actionResult.changes.xp.current}/${actionResult.changes.xp.max}`,
        );
      }
      if (actionResult.changes.level) {
        changes.push(`Level increased to ${actionResult.changes.level}`);
      }
      if (actionResult.changes.itemUsed) {
        changes.push(`Used item: ${actionResult.changes.itemUsed}`);
      }
      if (actionResult.changes.location) {
        changes.push(`Moved to: ${actionResult.changes.location}`);
      }

      if (changes.length > 0) {
        actionDescription += `\nGame state changes: ${changes.join(", ")}`;
      }
    }
  } else {
    actionDescription = `The player attempted: "${userInput}"
The action failed. ${actionResult.reason || "Action could not be completed."}`;
  }

  return `=== PLAYER ACTION ===
${actionDescription}

=== YOUR TASK ===
Generate a narrative response describing what happened. Be vivid and immersive. If the action failed, describe why it failed in a way that fits the game world.`;
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
  const professionName =
    typeof player.profession === "string"
      ? player.profession
      : player.profession?.name || "Generalist";

  const activeQuests = Array.isArray(gameState.quests?.active)
    ? gameState.quests.active
    : [];
  const mainQuest = activeQuests[0] || null;
  const sideQuests = activeQuests.slice(1, 3);

  const sceneId = gameState?.world?.flags?.startingSceneId;
  const scene = getOpeningSceneById(sceneId);
  const sceneDescription = describeOpeningScene(scene, {
    mainQuestName: mainQuest?.name || "the looming mystery",
    sideHookNames: sideQuests.map((q) => q.name),
    locationHint: scene?.biome || "dawn-swept district",
    factionHint: scene?.tone || "locals",
  });

  const questLines = [
    mainQuest
      ? `Main Quest → ${mainQuest.name}: ${mainQuest.description}`
      : "Main Quest → Pending discovery.",
  ]
    .concat(sideQuests.map((q) => `Side Hook → ${q.name}: ${q.description}`))
    .join("\n");

  return `You are a LitRPG narrator. The player has just completed character creation.

=== PLAYER PROFILE ===
Name: ${playerName}
Race: ${raceName}
Class: ${className}
Profession: ${professionName}

=== OPENING SCENE ===
${sceneDescription}

=== QUEST THREADS ===
${questLines}

TASK: Deliver an atmospheric opening (3-5 sentences) that references the scene and nudges the player toward the listed quests. Close with a compelling hook.

Respond with JSON:
{
  "narrative": "Opening narrative here",
  "mood": "neutral|tense|triumphant|mysterious|defeated",
  "suggestions": ["Suggestion tied to main quest", "Suggestion tied to side hook", "General exploration suggestion"]
}`;
}
