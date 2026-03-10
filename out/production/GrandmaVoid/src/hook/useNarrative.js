// =================================================================
// USE NARRATIVE HOOK
// Manages AI narrative flow: parse -> validate -> execute -> generate narrative
// =================================================================

import { useState, useCallback, useRef } from "react";
import {
  assemblePrompt,
  buildInitialPrompt,
  resolvePromptMode,
} from "../core/PromptAssembler.js";
import {
  generateNarrative,
  generateNarrativeStream,
  generateInitialNarrative,
} from "../core/AIService.js";
import { renderStatusBlock } from "../util/statusrenderer.js";
import { SimBridge } from "../simulation/bridge/SimulationBridge.js";
import { appendNarrativeEntry } from "../core/narrativeLog.js";
import { toNumber, mergeInventoryItems } from "../utils/shared.js";
import { QuestManager } from "../systems/quest/QuestManager.js";
import { DataRegistry } from "../data/DataRegistry.js";
import { toCanonicalAttributeKey } from "../constants/attributes.js";
import {
  listOpeningSceneChoices,
  getOpeningSceneChoice,
  getOpeningSceneEffectIntents,
  buildOpeningSceneNarrativeSeed,
} from "../data/OpeningScenes.js";

const initialNarrativeCache = new Map();

const FIXED_ACTION_SUGGESTIONS = [
  { t: "look around", w: 1 },
  { t: "check status", w: 1 },
  { t: "open inventory", w: 1 },
  { t: "review quests", w: 1 },
  { t: "train skills", w: 1 },
  { t: "talk to nearby NPC", w: 1 },
];

const CONTEXT_SUGGESTION_FILLERS = [
  { t: "explore a nearby route", w: 0.82 },
  { t: "prepare for the next objective", w: 0.8 },
  { t: "gather local information", w: 0.78 },
  { t: "take a short rest", w: 0.76 },
];

const DEFAULT_ACTION_SUGGESTIONS = [
  ...FIXED_ACTION_SUGGESTIONS,
  ...CONTEXT_SUGGESTION_FILLERS,
];

// Mood inference from narrative text - used to tag entries
const MOOD_PATTERNS = [
  { mood: "tense", patterns: [/danger/i, /threat/i, /ambush/i, /attack/i, /dark/i, /enemy/i, /looming/i] },
  { mood: "triumphant", patterns: [/victory/i, /triumph/i, /succeed/i, /conquer/i, /glory/i, /reward/i] },
  { mood: "mysterious", patterns: [/strange/i, /mystery/i, /whisper/i, /shadow/i, /ancient/i, /secret/i, /hidden/i] },
  { mood: "serene", patterns: [/calm/i, /peace/i, /gentle/i, /rest/i, /quiet/i, /warm/i, /soft/i] },
  { mood: "desperate", patterns: [/flee/i, /escape/i, /wound/i, /bleed/i, /dying/i, /last/i, /barely/i] },
];

function inferMood(text) {
  if (!text || typeof text !== "string") return "neutral";
  for (const { mood, patterns } of MOOD_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return mood;
  }
  return "neutral";
}

const SUMMARY_REFRESH_INTERVAL = 10;
const STREAM_PLACEHOLDER_TEXT = "Narrator gathers the next scene.";
const shouldRefreshSummary = (narrativeState = {}) => {
  const count = Array.isArray(narrativeState.entries)
    ? narrativeState.entries.length
    : 0;
  return count > 0 && count % SUMMARY_REFRESH_INTERVAL === 0;
};

const OPENING_SCENE_SKILL_TEMPLATES = {
  skill_voidspark: {
    id: "skill_voidspark",
    name: "Voidspark",
    description:
      "A survivable seed of Void-purity, filtered through space and time. It aches when overused, but it won’t unmake you—yet.",
    type: "passive",
    level: 1,
    isMagic: true,
    canEvolve: false,
    canFuse: false,
    tags: ["starter", "void", "space", "voidspark", "opening_scene"],
  },
  skill_qi_strike: {
    id: "skill_qi_strike",
    name: "Qi Strike",
    description: "Channel raw qi into a focused melee impact.",
    type: "active",
    level: 1,
    manaCost: 6,
    cooldown: 1,
    isMagic: true,
    damage: { base: 18, multiplier: 1.1 },
    canEvolve: true,
    canFuse: true,
    tags: ["starter", "qi", "opening_scene"],
  },
  skill_ward_phrase: {
    id: "skill_ward_phrase",
    name: "Ward Phrase",
    description: "Invoke a protective phrase to blunt incoming harm.",
    type: "active",
    level: 1,
    manaCost: 8,
    cooldown: 2,
    isMagic: true,
    allowZeroDamage: true,
    nonDamaging: true,
    damage: { base: 0, multiplier: 0 },
    canEvolve: true,
    canFuse: true,
    tags: ["starter", "ward", "utility", "opening_scene"],
  },
  skill_lightflare: {
    id: "skill_lightflare",
    name: "Lightflare",
    description: "Burst light to expose threats and disrupt enemies.",
    type: "active",
    level: 1,
    manaCost: 7,
    cooldown: 1,
    isMagic: true,
    damage: { base: 12, multiplier: 1.0 },
    canEvolve: true,
    canFuse: true,
    tags: ["starter", "light", "opening_scene"],
  },
  skill_standfast: {
    id: "skill_standfast",
    name: "Standfast",
    description: "Brace your stance and endure the next exchange.",
    type: "active",
    level: 1,
    manaCost: 4,
    cooldown: 2,
    isMagic: false,
    allowZeroDamage: true,
    nonDamaging: true,
    damage: { base: 0, multiplier: 0 },
    canEvolve: true,
    canFuse: true,
    tags: ["starter", "defense", "opening_scene"],
  },
  skill_quick_combo: {
    id: "skill_quick_combo",
    name: "Quick Combo",
    description: "A short burst chain that pressures a single target.",
    type: "active",
    level: 1,
    manaCost: 5,
    cooldown: 1,
    isMagic: false,
    damage: { base: 16, multiplier: 1.15 },
    canEvolve: true,
    canFuse: true,
    tags: ["starter", "combo", "opening_scene"],
  },
  skill_feint_counter: {
    id: "skill_feint_counter",
    name: "Feint Counter",
    description: "Bait the opponent and punish with precise timing.",
    type: "active",
    level: 1,
    manaCost: 5,
    cooldown: 1,
    isMagic: false,
    damage: { base: 15, multiplier: 1.2 },
    canEvolve: true,
    canFuse: true,
    tags: ["starter", "duel", "opening_scene"],
  },
};

const OPENING_SCENE_QUEST_TEMPLATES = {
  quest_temple_heal_and_oath: {
    name: "Temple Recovery and Oath",
    description: "Recover from your wound and set your resolve.",
    objective: "Take a short rest at safety.",
    criteria: { actionType: "rest" },
    rewards: { xp: 35, items: [{ id: "bandage_roll", quantity: 1 }] },
  },
  quest_first_core_cultivation: {
    name: "First Core Cultivation",
    description: "Practice your first controlled sense of essence.",
    objective: "Use essence sense once.",
    criteria: { actionType: "magic_sense" },
    rewards: { xp: 35, items: [{ id: "mana_leaf", quantity: 1 }] },
  },
  quest_find_clan_relics: {
    name: "Find Clan Relics",
    description: "Search for traces of your clan artifacts.",
    objective: "Inspect your surroundings for clues.",
    criteria: { actionType: "look" },
    rewards: { xp: 30, items: [] },
  },
  quest_track_bandit_cell: {
    name: "Track the Bandit Cell",
    description: "Follow signs of the raiders to their network.",
    objective: "Travel to a new nearby location.",
    criteria: { actionType: "move", requiresLocationChange: true },
    rewards: { xp: 35, items: [] },
  },
  quest_investigate_funder: {
    name: "Investigate the Funder",
    description: "Identify who is paying for the raid.",
    objective: "Inspect a suspicious detail.",
    criteria: { actionType: "look" },
    rewards: { xp: 35, items: [] },
  },
  quest_return_and_make_amends: {
    name: "Return and Make Amends",
    description: "Return to the village and begin repairing trust.",
    objective: "Move toward a new location to return.",
    criteria: { actionType: "move", requiresLocationChange: true },
    rewards: { xp: 30, items: [] },
  },
  quest_identify_signet_ring: {
    name: "Identify the Signet Ring",
    description: "Learn who the marked ring belongs to.",
    objective: "Inspect and analyze gathered clues.",
    criteria: { actionType: "look" },
    rewards: { xp: 35, items: [] },
  },
  quest_unlock_second_technique_slot: {
    name: "Unlock a Second Technique Slot",
    description: "Review your system and prepare to expand your toolkit.",
    objective: "Check your status panel once.",
    criteria: { actionType: "status" },
    rewards: { xp: 30, items: [] },
  },
  quest_find_weapon_oil_recipe: {
    name: "Find a Weapon Oil Recipe",
    description: "Locate a recipe to maintain your weapon.",
    objective: "Review your inventory and supplies.",
    criteria: { actionType: "inventory" },
    rewards: { xp: 30, items: [] },
  },
  quest_duelist_reputation: {
    name: "Build Duelist Reputation",
    description: "Prove your timing in active combat.",
    objective: "Land one attack in combat.",
    criteria: { actionType: "attack" },
    rewards: { xp: 40, items: [] },
  },
  quest_combine_rune_operators: {
    name: "Combine Rune Operators",
    description: "Test rune combinations safely.",
    objective: "Perform one weave action.",
    criteria: { actionType: "magic_weave" },
    rewards: { xp: 40, items: [] },
  },
  quest_stabilize_unbound_power: {
    name: "Stabilize Unbound Power",
    description: "Prevent your new power from destabilizing you.",
    objective: "Anchor your resonance once.",
    criteria: { actionType: "magic_anchor" },
    rewards: { xp: 40, items: [] },
  },
  quest_the_mist_calls: {
    name: "The Mist Calls",
    description: "Follow the whisper to its next sign.",
    objective: "Move and continue exploring.",
    criteria: { actionType: "move", requiresLocationChange: true },
    rewards: { xp: 30, items: [] },
  },
  quest_cellar_rats: {
    name: "Cellar Rats",
    description: "Clear the first safe guild contract.",
    objective: "Attack one hostile target.",
    criteria: { actionType: "attack" },
    rewards: { xp: 35, items: [{ id: "ration_pack", quantity: 1 }] },
  },
  quest_guild_initiation: {
    name: "Guild Initiation",
    description: "Review your standing before taking contracts.",
    objective: "Check your status panel.",
    criteria: { actionType: "status" },
    rewards: { xp: 30, items: [] },
  },
  quest_trace_courier_network: {
    name: "Trace the Courier Network",
    description: "Track suspicious deliveries through the district.",
    objective: "Travel and follow the trail.",
    criteria: { actionType: "move", requiresLocationChange: true },
    rewards: { xp: 35, items: [] },
  },
  quest_find_who_forged_ledgers: {
    name: "Find the Ledger Forger",
    description: "Use records to identify forged entries.",
    objective: "Check your inventory and notes.",
    criteria: { actionType: "inventory" },
    rewards: { xp: 35, items: [] },
  },
  quest_neighbor_pressure_or_trade: {
    name: "Pressure or Trade",
    description: "Decide whether to negotiate or apply pressure.",
    objective: "Talk through your next move.",
    criteria: {
      actionType: "narrative",
      inputIncludes: ["talk", "trade", "negotiate", "neighbor"],
    },
    rewards: { xp: 30, items: [] },
  },
  quest_stabilize_resonance: {
    name: "Stabilize Resonance",
    description: "Bring unstable resonance under control.",
    objective: "Anchor your magic once.",
    criteria: { actionType: "magic_anchor" },
    rewards: { xp: 40, items: [] },
  },
  quest_mediation_rewards: {
    name: "Mediation Rewards",
    description: "Secure outcomes from your market mediation.",
    objective: "Attempt mediation through dialogue.",
    criteria: {
      actionType: "narrative",
      inputIncludes: ["mediate", "negotiate", "calm", "talk"],
    },
    rewards: { xp: 35, items: [] },
  },
  quest_supplier_contacts: {
    name: "Supplier Contacts",
    description: "Build reliable market supplier links.",
    objective: "Review supplies and trading stock.",
    criteria: { actionType: "inventory" },
    rewards: { xp: 30, items: [] },
  },
  quest_find_diverted_steel: {
    name: "Find the Diverted Steel",
    description: "Trace the missing steel shipment.",
    objective: "Move and follow the shipment trail.",
    criteria: { actionType: "move", requiresLocationChange: true },
    rewards: { xp: 40, items: [] },
  },
  quest_find_power_inputs: {
    name: "Find Power Inputs",
    description: "Gather inputs required for conservation law casting.",
    objective: "Draw essence into your reserves.",
    criteria: { actionType: "magic_draw" },
    rewards: { xp: 40, items: [] },
  },
  quest_collect_sympathetic_links: {
    name: "Collect Sympathetic Links",
    description: "Gather linked objects for sympathy rituals.",
    objective: "Inspect and collect a usable lead.",
    criteria: { actionType: "look" },
    rewards: { xp: 35, items: [] },
  },
  quest_field_test_null_zone: {
    name: "Field Test Null Zone",
    description: "Test null-law suppression in the field.",
    objective: "Release prepared magic once.",
    criteria: { actionType: "magic_release" },
    rewards: { xp: 45, items: [] },
  },
};

const OPENING_SCENE_ACTION_ALIASES = {
  run: ["run", "flee", "escape"],
  fight: ["fight", "attack", "strike", "hit"],
  speak: ["speak", "say", "phrase", "whisper"],
  hide: ["hide", "coward"],
  guard: ["guard", "defend", "brace"],
  fast: ["combo", "fast", "quick"],
  feint: ["feint", "counter"],
  study: ["study", "research", "analyze"],
  ignore: ["ignore", "step through", "yolo"],
  read: ["read", "board", "contract"],
  talk: ["talk", "guildmaster"],
  observe: ["observe", "watch"],
  audit: ["audit", "inventory", "logs"],
  confront: ["confront", "neighbor"],
  calm: ["calm", "riot", "mediate"],
  buy: ["buy", "sell", "profit"],
  investigate: ["investigate", "trace", "shipment"],
};

const normalizeInputToken = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const humanizeIdentifier = (value) => {
  const normalized = String(value || "")
    .replace(/^quest_/, "")
    .replace(/^skill_/, "")
    .replace(/^item_/, "")
    .replace(/^law_/, "")
    .replace(/^recipe_/, "");
  if (!normalized) return "Unknown";
  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

function createOpeningQuestFromId(questId) {
  const fromCatalog = DataRegistry.getQuestById(questId);
  const source =
    fromCatalog && typeof fromCatalog === "object"
      ? fromCatalog
      : OPENING_SCENE_QUEST_TEMPLATES[questId];

  if (!source) {
    return QuestManager.initializeQuest({
      id: questId,
      name: humanizeIdentifier(questId),
      description: `Advance the lead: ${humanizeIdentifier(questId)}.`,
      objectives: [
        {
          id: `${questId}_obj_1`,
          description: "Take one action to pursue this lead.",
          criteria: {
            actionTypes: ["move", "look", "narrative", "attack", "status", "inventory"],
          },
          completed: false,
        },
      ],
      rewards: { xp: 30, items: [] },
      tags: { starter: true, openingScene: true },
    });
  }

  if (fromCatalog && typeof fromCatalog === "object") {
    return QuestManager.initializeQuest({
      ...fromCatalog,
      tags: {
        ...(fromCatalog.tags || {}),
        openingScene: true,
      },
    });
  }

  return QuestManager.initializeQuest({
    id: questId,
    name: source.name,
    description: source.description,
    objectives: [
      {
        id: `${questId}_obj_1`,
        description: source.objective,
        criteria: source.criteria,
        completed: false,
      },
    ],
    rewards: source.rewards || { xp: 30, items: [] },
    tags: { starter: true, openingScene: true },
  });
}

function createOpeningSkillDefinition(skillId) {
  const template = OPENING_SCENE_SKILL_TEMPLATES[skillId];
  if (template) return { ...template };
  return {
    id: skillId,
    name: humanizeIdentifier(skillId),
    description: `${humanizeIdentifier(skillId)} technique unlocked from your opening trial.`,
    type: "active",
    level: 1,
    manaCost: 6,
    cooldown: 1,
    isMagic: true,
    damage: { base: 14, multiplier: 1.05 },
    canEvolve: true,
    canFuse: true,
    tags: ["starter", "opening_scene"],
  };
}

function createOpeningItemDefinition(itemId, quantity = 1) {
  const registryItem = DataRegistry.getItemById(itemId);
  if (registryItem && typeof registryItem === "object") {
    return {
      ...registryItem,
      id: itemId,
      quantity: Math.max(1, Math.floor(Number(quantity) || 1)),
    };
  }
  return {
    id: itemId,
    name: humanizeIdentifier(itemId),
    description: `${humanizeIdentifier(itemId)} recovered during the opening incident.`,
    type: "misc",
    quantity: Math.max(1, Math.floor(Number(quantity) || 1)),
  };
}

function resolveOpeningChoiceFromInput(userInput, sceneId) {
  if (!sceneId) return null;
  const choices = listOpeningSceneChoices(sceneId);
  if (!choices.length) return null;

  const normalizedInput = normalizeInputToken(userInput);
  if (!normalizedInput) return null;

  const optionMatch = normalizedInput.match(
    /(?:option|choice|select|pick|choose)?\s*(\d{1,2})$/,
  );
  if (optionMatch) {
    const index = Number(optionMatch[1]) - 1;
    if (index >= 0 && index < choices.length) {
      return getOpeningSceneChoice(sceneId, index);
    }
  }

  for (let index = 0; index < choices.length; index += 1) {
    const listedChoice = choices[index];
    const fullChoice = getOpeningSceneChoice(sceneId, listedChoice.id || index);
    if (!fullChoice) continue;

    const label = normalizeInputToken(fullChoice.label);
    const labelStart = label.split(" ")[0] || "";
    const aliases = OPENING_SCENE_ACTION_ALIASES[labelStart] || [];
    const firstClause = normalizeInputToken(
      String(fullChoice.label || "").split(/[.!?]/)[0],
    );
    const idToken = normalizeInputToken(fullChoice.id || "");

    if (
      normalizedInput === label ||
      normalizedInput === firstClause ||
      normalizedInput === labelStart ||
      (label && normalizedInput.startsWith(label)) ||
      (firstClause && normalizedInput.startsWith(firstClause)) ||
      (idToken && normalizedInput === idToken)
    ) {
      return fullChoice;
    }

    if (aliases.some((alias) => normalizedInput.includes(alias))) {
      return fullChoice;
    }
  }

  return null;
}

function applyOpeningIntentToState(baseState, intent) {
  let nextState = baseState;
  const notes = [];

  const setPlayer = (playerUpdater) => {
    const playerSource = nextState?.player || {};
    const playerNext = playerUpdater(playerSource);
    nextState = { ...nextState, player: playerNext };
  };

  const setWorld = (worldUpdater) => {
    const worldSource = nextState?.world || {};
    const worldNext = worldUpdater(worldSource);
    nextState = { ...nextState, world: worldNext };
  };

  const setQuests = (questsUpdater) => {
    const questSource = nextState?.quests || {};
    const questNext = questsUpdater(questSource);
    nextState = { ...nextState, quests: questNext };
  };

  switch (intent?.type) {
    case "player.health.delta": {
      const delta = Number(intent.value) || 0;
      if (!delta) break;
      setPlayer((player) => {
        const hp = player?.hp && typeof player.hp === "object"
          ? player.hp
          : { current: Number(player?.hp) || 0, max: Number(player?.maxHp) || 100 };
        const max = Math.max(1, Number(hp.max) || 1);
        const current = Number(hp.current) || 0;
        const nextCurrent = Math.max(0, Math.min(max, current + delta));
        return {
          ...player,
          hp: { ...hp, current: nextCurrent, max },
        };
      });
      notes.push(
        delta < 0
          ? `Opening consequence: ${Math.abs(delta)} health lost.`
          : `Opening consequence: ${delta} health restored.`,
      );
      break;
    }
    case "player.reputation.delta": {
      const delta = Number(intent.value) || 0;
      if (!delta) break;
      setPlayer((player) => ({
        ...player,
        reputation: (Number(player?.reputation) || 0) + delta,
      }));
      break;
    }
    case "player.currency.delta": {
      const delta = Number(intent.value) || 0;
      if (!delta) break;
      const currencyKey = intent.currency || "goldCoins";
      setPlayer((player) => {
        const currency =
          player?.currency && typeof player.currency === "object"
            ? player.currency
            : {};
        const current = Number(currency[currencyKey]) || 0;
        const nextValue = Math.max(0, current + delta);
        const nextCurrency = { ...currency, [currencyKey]: nextValue };
        const nextPlayer = { ...player, currency: nextCurrency };
        if (currencyKey === "goldCoins") {
          nextPlayer.gold = nextValue;
        }
        if (currencyKey === "soulpoints") {
          nextPlayer.soulpoints = nextValue;
        }
        return nextPlayer;
      });
      break;
    }
    case "quest.add": {
      const questId = String(intent.questId || "").trim();
      if (!questId) break;
      const active = Array.isArray(nextState?.quests?.active)
        ? nextState.quests.active
        : [];
      const completed = Array.isArray(nextState?.quests?.completed)
        ? nextState.quests.completed
        : [];
      const exists =
        active.some((quest) => quest?.id === questId) ||
        completed.some((quest) => quest?.id === questId);
      if (exists) break;

      const nextQuest = createOpeningQuestFromId(questId);
      setQuests((quests) => ({
        ...quests,
        active: [...active, nextQuest].slice(0, 6),
        completed,
      }));
      setWorld((world) => ({
        ...world,
        vars: {
          ...(world.vars || {}),
          current_quest_id:
            world?.vars?.current_quest_id ||
            nextQuest?.id ||
            null,
        },
      }));
      notes.push(`New quest: ${nextQuest.name}.`);
      break;
    }
    case "skill.unlock": {
      const skillId = String(intent.skillId || "").trim();
      if (!skillId) break;
      const skill = createOpeningSkillDefinition(skillId);
      setPlayer((player) => {
        const abilities = Array.isArray(player?.abilities) ? player.abilities : [];
        const activeSkills = Array.isArray(player?.activeSkills)
          ? player.activeSkills
          : [];
        const passiveSkills = Array.isArray(player?.passiveSkills)
          ? player.passiveSkills
          : [];
        const exists =
          abilities.some((entry) => entry?.id === skill.id) ||
          activeSkills.some((entry) => entry?.id === skill.id) ||
          passiveSkills.some((entry) => entry?.id === skill.id);
        if (exists) return player;

        const nextAbilities = [...abilities, skill];
        if (skill.type === "passive") {
          return {
            ...player,
            abilities: nextAbilities,
            activeSkills,
            passiveSkills: [...passiveSkills, skill],
          };
        }

        return {
          ...player,
          abilities: nextAbilities,
          activeSkills: [...activeSkills, skill],
          passiveSkills,
        };
      });
      notes.push(`New ability unlocked: ${skill.name}.`);
      break;
    }
    case "recipe.unlock": {
      const recipeId = String(intent.recipeId || "").trim();
      if (!recipeId) break;
      setPlayer((player) => {
        const unlocked = Array.isArray(player?.unlockedRecipes)
          ? player.unlockedRecipes
          : [];
        if (unlocked.includes(recipeId)) return player;
        return {
          ...player,
          unlockedRecipes: [...unlocked, recipeId],
        };
      });
      break;
    }
    case "law.unlock": {
      const lawId = String(intent.lawId || "").trim();
      if (!lawId) break;
      setPlayer((player) => {
        const magic =
          player?.magic && typeof player.magic === "object"
            ? player.magic
            : {};
        const unlocked = Array.isArray(magic.unlockedLaws)
          ? magic.unlockedLaws
          : [];
        if (unlocked.includes(lawId)) return player;
        return {
          ...player,
          magic: {
            ...magic,
            unlockedLaws: [...unlocked, lawId],
          },
        };
      });
      notes.push(`Law unlocked: ${humanizeIdentifier(lawId)}.`);
      break;
    }
    case "inventory.add": {
      const itemId = String(intent.itemId || "").trim();
      const quantity = Math.max(1, Math.floor(Number(intent.quantity) || 1));
      if (!itemId) break;
      const item = createOpeningItemDefinition(itemId, quantity);
      setPlayer((player) => {
        const inventory = Array.isArray(player?.inventory) ? player.inventory : [];
        return {
          ...player,
          inventory: mergeInventoryItems(inventory, [item]),
        };
      });
      notes.push(`Item gained: ${item.name}.`);
      break;
    }
    case "clue.add": {
      const clueId = String(intent.clueId || "").trim();
      if (!clueId) break;
      setWorld((world) => {
        const vars =
          world?.vars && typeof world.vars === "object" ? world.vars : {};
        const clues = Array.isArray(vars.clues) ? vars.clues : [];
        if (clues.includes(clueId)) return world;
        return {
          ...world,
          vars: {
            ...vars,
            clues: [...clues, clueId],
          },
        };
      });
      break;
    }
    case "world.flag.set": {
      const flag = String(intent.flag || "").trim();
      if (!flag) break;
      setWorld((world) => ({
        ...world,
        flags: {
          ...(world.flags || {}),
          [flag]: Boolean(intent.value),
        },
      }));
      break;
    }
    case "player.stat.delta": {
      const statId = String(intent.stat || "").trim();
      const delta = Number(intent.value) || 0;
      if (!statId || !delta) break;
      const canonical = toCanonicalAttributeKey(statId);
      if (canonical) {
        setPlayer((player) => {
          const attributes =
            player?.attributes && typeof player.attributes === "object"
              ? player.attributes
              : {};
          return {
            ...player,
            attributes: {
              ...attributes,
              [canonical]: (Number(attributes[canonical]) || 0) + delta,
            },
          };
        });
      } else {
        setPlayer((player) => {
          const resources =
            player?.resources && typeof player.resources === "object"
              ? player.resources
              : {};
          const nextValue = (Number(resources[statId]) || 0) + delta;
          return {
            ...player,
            resources: {
              ...resources,
              [statId]: nextValue,
            },
          };
        });
      }
      break;
    }
    default:
      break;
  }

  return { state: nextState, notes };
}

function applyOpeningSceneChoice(state, { sceneId, choice }) {
  if (!state || !sceneId || !choice) {
    return { state, notes: [], openingNarrativeSeed: "" };
  }

  const intents = getOpeningSceneEffectIntents(sceneId, choice.id);
  const notes = [];
  let nextState = state;

  intents.forEach((intent) => {
    const result = applyOpeningIntentToState(nextState, intent);
    nextState = result.state;
    notes.push(...result.notes);
  });

  const openingNarrativeSeed = buildOpeningSceneNarrativeSeed(sceneId, choice.id);
  const outcomeText =
    typeof choice.outcomeText === "string" && choice.outcomeText.trim()
      ? choice.outcomeText.trim()
      : "";

  const worldSource =
    nextState?.world && typeof nextState.world === "object" ? nextState.world : {};
  const vars =
    worldSource?.vars && typeof worldSource.vars === "object"
      ? worldSource.vars
      : {};

  nextState = {
    ...nextState,
    world: {
      ...worldSource,
      vars: {
        ...vars,
        openingSceneChoicePending: false,
        openingSceneChoiceId: choice.id || null,
        openingSceneChoiceLabel: choice.label || null,
        openingSceneChoiceNext: choice.next || null,
        openingSceneChoiceOutcome: outcomeText || null,
        openingSceneNarrativeSeed: openingNarrativeSeed || null,
        openingSceneChoiceResolvedAt: SimBridge.now(),
      },
    },
  };

  return { state: nextState, notes, openingNarrativeSeed, outcomeText };
}

function computeDominantMood(entries = []) {
  const recentEntries = entries.slice(-5);
  const moodCounts = {};
  for (const e of recentEntries) {
    const m = e.mood || inferMood(e.text) || "neutral";
    moodCounts[m] = (moodCounts[m] || 0) + 1;
  }
  return (
    Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral"
  );
}

function buildSummaryPrompt({ previousSummary, recentLines }) {
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

function buildActionSuggestions(state) {
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
    .sort((a, b) => b.amount - a.amount);
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
      .map((choice) => ({
        t: choice.label,
        w: 1,
      }));
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
    // Add skill-specific combat suggestions
    const activeSkills = Array.isArray(player.activeSkills) ? player.activeSkills : [];
    if (activeSkills.length > 0) {
      const skill = activeSkills[Math.floor(Date.now() / 10000) % activeSkills.length];
      if (skill?.name) {
        contextSuggestions.push({ t: `use ${skill.name}`, w: 0.95 });
      }
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

    // Archetype-specific exploration suggestions
    const systemLabel = resolveArchetypeSystemLabel(player);
    if (systemLabel) {
      const archetypeRaw = player.archetypeSystem;
      const category = typeof archetypeRaw === "object" ? archetypeRaw?.category : null;
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

    // Location-aware suggestions
    const location = state.world?.location?.current || state.world?.location || "";
    const locationStr = typeof location === "string" ? location : "";
    if (locationStr.includes("town") || locationStr.includes("village") || locationStr.includes("city")) {
      contextSuggestions.push({ t: "visit shop", w: 0.8 });
    }
    if (locationStr.includes("dungeon") || locationStr.includes("cave") || locationStr.includes("ruin")) {
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

  // Quest-specific suggestions
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
    (suggestion, index, arr) =>
      arr.findIndex((s) => s.t === suggestion.t) === index &&
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

function resolveArchetypeSystemLabel(player = {}) {
  const raw = player.archetypeSystem;
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw.name || raw.id || null;
  }
  return null;
}

function pickVariant(options, seed) {
  if (!Array.isArray(options) || options.length === 0) return "";
  const safeSeed = Number.isFinite(seed) ? seed : Date.now();
  const index = Math.abs(Math.floor(safeSeed)) % options.length;
  return options[index];
}

function buildFallbackNarrative({
  userInput,
  actionResult,
  state,
  isInitial = false,
  variantSeed,
}) {
  const player = state?.player || {};
  const systemLabel = resolveArchetypeSystemLabel(player);
  const location =
    state?.world?.location?.current ||
    state?.world?.location ||
    "the current zone";
  const name = player.name || "The wanderer";
  const classLabel =
    typeof player.class === "string"
      ? player.class
      : player.class?.name || "adventurer";

  if (isInitial) {
    const quests = Array.isArray(state?.quests?.active)
      ? state.quests.active
      : [];
    const questHint = quests.length
      ? `A new directive forms around "${quests[0].name}".`
      : "No directives surface yet, only the weight of possibility.";
    const systemLine = systemLabel
      ? pickVariant(
          [
            `The ${systemLabel} hums softly, ready to shape your path.`,
            `The ${systemLabel} awakens, its protocols aligning to your steps.`,
            `The ${systemLabel} steadies, searching for its first leverage point.`,
          ],
          variantSeed,
        )
      : pickVariant(
          [
            "The world hums with latent system energy.",
            "A low-grade system pulse flickers through the air.",
            "Something unseen calibrates the world around you.",
          ],
          variantSeed,
        );
    return `${name}, a ${classLabel}, arrives at ${location}. ${systemLine} ${questHint}`;
  }

  const trimmedInput = typeof userInput === "string" ? userInput.trim() : "";
  const fallbackAction =
    actionResult?.description ||
    (trimmedInput ? `You attempt to ${trimmedInput}` : "You take action");
  const lowerInput = trimmedInput.toLowerCase();
  const verbHints = [
    "explore",
    "look",
    "scan",
    "speak",
    "talk",
    "open",
    "review",
    "train",
    "rest",
    "attack",
    "use",
    "cast",
    "travel",
    "move",
    "search",
    "inspect",
    "read",
    "listen",
    "follow",
    "enter",
    "leave",
    "check",
  ];
  const startsWithVerb = verbHints.some(
    (verb) =>
      lowerInput === verb || lowerInput.startsWith(`${verb} `),
  );
  let actionText = fallbackAction.replace(/^Player said:\s*/i, "You say: ");
  if (trimmedInput) {
    if (!startsWithVerb && !lowerInput.includes(" ")) {
      actionText = `You check ${trimmedInput}`;
    } else if (startsWithVerb) {
      actionText =
        variantSeed && variantSeed % 2 === 0
          ? `You attempt to ${trimmedInput}`
          : `You ${trimmedInput}`;
    } else {
      actionText = `You attempt to ${trimmedInput}`;
    }
  }
  const reasonText =
    actionResult?.reason || "something blocks the way";
  const successLine = actionResult?.success
    ? pickVariant(
        [
          `${actionText}. The world shifts around you, then settles.`,
          `${actionText}. A faint current passes through the air.`,
          `${actionText}. The moment answers with a subtle change of tone.`,
          `${actionText}. Your intent echoes, then quiets.`,
        ],
        variantSeed,
      )
    : pickVariant(
        [
          `${actionText}, but ${reasonText}.`,
          `${actionText}. ${reasonText} blocks the attempt.`,
          `${actionText}, yet ${reasonText} keeps it out of reach.`,
        ],
        variantSeed,
      );
  const systemLine = systemLabel
    ? pickVariant(
        [
          `Your ${systemLabel} stirs, watching for leverage.`,
          `The ${systemLabel} records the moment, seeking an opening.`,
          `A muted pulse from the ${systemLabel} lingers at the edge of thought.`,
          `${systemLabel} remains attentive, mapping possible outcomes.`,
        ],
        variantSeed,
      )
    : pickVariant(
        [
          "The system remains watchful.",
          "A soft system ping fades into silence.",
          "No system directive follows—only the ambient hum.",
        ],
        variantSeed,
      );
  return `${successLine} ${systemLine}`;
}

/**
 * Custom hook for managing AI narrative and user actions
 * @param {function} setState - Function to update game state
 * @param {function} addSystemMessage - Function to add messages to chat log
 * @param {function} evaluateQuestProgress - Function to evaluate quest progress
 * @param {function} submitAction - Canonical gameplay submitter (`engine.step` path)
 * @returns {object} Hook interface with submitInput function and loading state
 */
export function useNarrative(
  setState,
  addSystemMessage,
  evaluateQuestProgress,
  submitAction,
) {
  const [isLoading, setIsLoading] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [error, setError] = useState(null);
  const [userInput, setUserInput] = useState("");
  const inputRef = useRef(null);
  const initialNarrativeKeyRef = useRef(null);
  const busyRef = useRef(false);
  const [actionSuggestions, setActionSuggestions] = useState(
    DEFAULT_ACTION_SUGGESTIONS,
  );
  const fallbackCounterRef = useRef(0);
  const streamAbortRef = useRef(null);
  const summaryInFlightRef = useRef(false);

  const maybeRefreshSummary = useCallback(
    async ({ stateSnapshot, appendedLine }) => {
      if (summaryInFlightRef.current) return;
      const narrative = stateSnapshot?.narrative || {};
      const existingEntries = Array.isArray(narrative.entries)
        ? narrative.entries
        : [];

      const filtered = existingEntries.filter((entry) =>
        ["narrative", "system", "status-update"].includes(entry.type),
      );
      const augmented = appendedLine
        ? filtered.concat([
            {
              type: "narrative",
              text: String(appendedLine || ""),
              mood: inferMood(appendedLine),
            },
          ])
        : filtered;

      const total = augmented.length;
      const lastAtCount = toNumber(narrative.summaryMeta?.atCount, 0);

      const shouldRun = shouldRefreshSummary({ entries: augmented }) && total > lastAtCount;
      if (!shouldRun) return;

      const recentLines = augmented
        .slice(-10)
        .map((e) => {
          const prefix = e.type === "system" ? "System" : e.type === "status-update" ? "Status" : "Narrator";
          return `${prefix}: ${String(e.text || "").trim()}`;
        })
        .filter(Boolean);

      const prompt = buildSummaryPrompt({
        previousSummary: narrative.summary,
        recentLines,
      });

      summaryInFlightRef.current = true;
      try {
        const result = await generateNarrative(prompt);
        const nextSummary = result?.narrative || "";
        if (!nextSummary) return;
        setState((prev) => ({
          ...prev,
          narrative: {
            ...prev.narrative,
            summary: nextSummary,
            summaryMeta: { atCount: total, updatedAt: SimBridge.now() },
          },
        }));
      } catch (err) {
        console.warn("Summary refresh failed:", err);
      } finally {
        summaryInFlightRef.current = false;
      }
    },
    [setState],
  );

  /**
   * Helper: run streaming narrative, updating a placeholder entry live.
   * Falls back to sync generateNarrative internally.
   */
  const streamNarrative = useCallback(
    async (prompt, prevStateForFallback, { mode } = {}) => {
      // Abort any in-flight stream
      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
      }
      const controller = new AbortController();
      streamAbortRef.current = controller;

      // Insert a placeholder entry that will be updated in-place
      const streamEntryId = `stream_${Date.now()}`;
      setState((prev) =>
        updateNarrativeState(prev, {
          id: streamEntryId,
          type: "narrative",
          // Keep placeholder non-empty so core narrative normalization doesn't drop it.
          text: STREAM_PLACEHOLDER_TEXT,
          timestamp: SimBridge.now(),
          source: "ai-streaming",
        }),
      );

      try {
        const result = await generateNarrativeStream(prompt, {
          signal: controller.signal,
          mode,
          onChunk: (_delta, fullText) => {
            // Live-update the streaming entry in-place
            setState((prev) => {
              const entries = Array.isArray(prev.narrative?.entries)
                ? prev.narrative.entries
                : [];
              const idx = entries.findIndex((e) => e.id === streamEntryId);
              if (idx === -1) return prev;
              const updated = [...entries];
              updated[idx] = { ...updated[idx], text: fullText };
              return {
                ...prev,
                narrative: { ...prev.narrative, entries: updated },
              };
            });
          },
        });

        // Finalize: replace the streaming entry with the guarded result + mood
        setState((prev) => {
          const entries = Array.isArray(prev.narrative?.entries)
            ? prev.narrative.entries
            : [];
          const idx = entries.findIndex((e) => e.id === streamEntryId);
          if (idx === -1) return prev;
          const updated = [...entries];
          updated[idx] = {
            ...updated[idx],
            text: result.narrative,
            source: "ai",
            mood: inferMood(result.narrative),
          };
          const dominantMood = computeDominantMood(updated);
          return {
            ...prev,
            narrative: { ...prev.narrative, entries: updated, currentMood: dominantMood },
          };
        });

        await maybeRefreshSummary({
          stateSnapshot: prevStateForFallback,
          appendedLine: result.narrative,
        });

        return result;
      } catch (error) {
        if (error?.name === "AbortError") throw error;
        // On stream failure, fill the placeholder with fallback
        console.error("Stream narrative failed:", error);
        fallbackCounterRef.current += 1;
        const fallbackText = buildFallbackNarrative({
          state: prevStateForFallback,
          variantSeed: fallbackCounterRef.current,
        });
        setState((prev) => {
          const entries = Array.isArray(prev.narrative?.entries)
            ? prev.narrative.entries
            : [];
          const idx = entries.findIndex((e) => e.id === streamEntryId);
          if (idx === -1) return prev;
          const updated = [...entries];
          updated[idx] = {
            ...updated[idx],
            text: fallbackText,
            source: "fallback",
          };
          return {
            ...prev,
            narrative: { ...prev.narrative, entries: updated },
          };
        });
        return {
          narrative: fallbackText,
          mood: "neutral",
          suggestions: ["Look around", "Check inventory", "Continue"],
        };
      } finally {
        if (streamAbortRef.current === controller) {
          streamAbortRef.current = null;
        }
      }
    },
    [setState, maybeRefreshSummary],
  );

  const updateNarrativeState = (prevState, entry) => {
    // Auto-tag entries with mood if not already set
    const taggedEntry = entry.mood
      ? entry
      : { ...entry, mood: inferMood(entry.text) };
    const nextNarrative = appendNarrativeEntry(prevState.narrative, taggedEntry, {
      maxEntries: 80,
    });
    const dominantMood = computeDominantMood(nextNarrative.entries || []);
    return {
      ...prevState,
      narrative: {
        ...nextNarrative,
        summary: prevState.narrative?.summary ?? "",
        summaryMeta: prevState.narrative?.summaryMeta,
        currentMood: dominantMood,
      },
    };
  };

  /**
   * Processes user input through the full narrative pipeline
   */
  const submitInput = useCallback(
    async (userInput, currentState, options = {}) => {
      if (!userInput || !userInput.trim()) {
        return;
      }
      if (busyRef.current) {
        return;
      }
      busyRef.current = true;

      setIsLoading(true);
      setError(null);

      try {
        const openingSceneId = currentState?.world?.vars?.startingSceneId || null;
        const openingChoicePending = Boolean(
          currentState?.world?.vars?.openingSceneChoicePending,
        );
        if (openingChoicePending && openingSceneId) {
          const selectedOpeningChoice = resolveOpeningChoiceFromInput(
            userInput,
            openingSceneId,
          );
          if (selectedOpeningChoice) {
            const openingResolution = applyOpeningSceneChoice(currentState, {
              sceneId: openingSceneId,
              choice: selectedOpeningChoice,
            });

            const resolvedState = openingResolution.state || currentState;
            setState(resolvedState);
            setActionSuggestions(buildActionSuggestions(resolvedState));

            const uniqueNotes = Array.from(
              new Set(
                (openingResolution.notes || []).filter(
                  (note) => typeof note === "string" && note.trim(),
                ),
              ),
            );
            uniqueNotes.forEach((note) => addSystemMessage(note, "system"));

            if (typeof evaluateQuestProgress === "function") {
              evaluateQuestProgress(resolvedState);
            }

            setIsNarrating(true);
            try {
              const openingActionResult = {
                success: true,
                actionType: "opening_choice",
                description:
                  openingResolution.outcomeText ||
                  `You choose: ${selectedOpeningChoice.label}`,
                state: resolvedState,
                readOnly: false,
                openingNarrativeSeed: openingResolution.openingNarrativeSeed,
              };
              const mode = resolvePromptMode(resolvedState, openingActionResult);
              const prompt = assemblePrompt(
                resolvedState,
                userInput,
                openingActionResult,
              );
              await streamNarrative(prompt, resolvedState, { mode });
            } catch (aiError) {
              if (aiError?.name === "AbortError") return;
              console.error("Opening choice narrative generation failed:", aiError);
            } finally {
              setIsNarrating(false);
            }

            return;
          }
        }

        // Canonical action path: engine.step via useGameEngine.submitAction.
        const stepResult = submitAction?.({ kind: "text", text: userInput });
        const action = stepResult?.action;

        if (!stepResult?.ok) {
          const reason =
            stepResult?.reason || "Could not process input into a valid action.";
          addSystemMessage(`Action failed: ${reason}`, "system");

          // Generate AI narrative about the failure
          try {
            const failurePrompt = assemblePrompt(currentState, userInput, {
              success: false,
              actionType: action?.type,
              reason,
              description: `Attempted: ${userInput}`,
            });

            const mode = resolvePromptMode(currentState, {
              success: false,
              actionType: action?.type,
            });

            await streamNarrative(failurePrompt, currentState, { mode });
            // streamNarrative already updated state via onChunk + finalize
          } catch (aiError) {
            if (aiError?.name === "AbortError") return;
            console.error("AI narrative generation failed:", aiError);
          }

          setIsLoading(false);
          return;
        }

        // State already updated by submitAction -> APPLY_ENGINE_RESULT in useGameEngine.
        let newState = stepResult.nextState ?? currentState;
        const readOnly = newState === currentState;

        if (options.fromSuggestion) {
          const suggestedQuest = QuestManager.generateQuestFromSuggestion(
            userInput,
            newState,
          );

          if (suggestedQuest?.id) {
            const existingActive = Array.isArray(newState?.quests?.active)
              ? newState.quests.active
              : [];
            const existingCompleted = Array.isArray(newState?.quests?.completed)
              ? newState.quests.completed
              : [];
            const alreadyTracked =
              existingActive.some((quest) => quest.id === suggestedQuest.id) ||
              existingCompleted.some((quest) => quest.id === suggestedQuest.id);

            if (!alreadyTracked) {
              newState = {
                ...newState,
                quests: {
                  ...(newState.quests || {}),
                  active: [...existingActive, suggestedQuest].slice(0, 6),
                  completed: existingCompleted,
                },
              };

              setState((prevState) => {
                const active = Array.isArray(prevState?.quests?.active)
                  ? prevState.quests.active
                  : [];
                const completed = Array.isArray(prevState?.quests?.completed)
                  ? prevState.quests.completed
                  : [];
                const exists =
                  active.some((quest) => quest.id === suggestedQuest.id) ||
                  completed.some((quest) => quest.id === suggestedQuest.id);
                if (exists) return prevState;
                return {
                  ...prevState,
                  quests: {
                    ...(prevState.quests || {}),
                    active: [...active, suggestedQuest].slice(0, 6),
                    completed,
                  },
                };
              });
            }
          }
        }

        const actionResult = {
          success: true,
          actionType: action?.type,
          description: stepResult.summary || `Player said: "${userInput}"`,
          state: newState,
          readOnly,
        };

        const suggestionSource = actionResult.readOnly ? currentState : newState;
        setActionSuggestions(buildActionSuggestions(suggestionSource));

        // Handle status display action explicitly.
        if (action?.type === "status") {
          const statusString = renderStatusBlock(
            newState.player,
            newState.config,
          );
          addSystemMessage(statusString, "status-update");
          setIsLoading(false);
          return;
        }

        // Generate AI narrative response (streaming)
        setIsNarrating(true);
        try {
          const promptState = actionResult.readOnly ? currentState : newState;
          const mode = resolvePromptMode(promptState, actionResult);
          const prompt = assemblePrompt(promptState, userInput, actionResult);
          await streamNarrative(prompt, promptState, { mode });

          // streamNarrative already manages the entry; just evaluate quests
          setState((prevState) => {
            if (typeof evaluateQuestProgress === "function") {
              evaluateQuestProgress(prevState);
            }
            return prevState;
          });
        } catch (aiError) {
          if (aiError?.name === "AbortError") return;
          console.error("AI narrative generation failed:", aiError);
        } finally {
          setIsNarrating(false);
        }
      } catch (err) {
        console.error("Error processing input:", err);
        setError(err.message || "An error occurred processing your input.");
        addSystemMessage(
          `Error: ${err.message || "Something went wrong."}`,
          "system",
        );
      } finally {
        busyRef.current = false;
        setIsLoading(false);
      }
    },
    [
      setState,
      addSystemMessage,
      evaluateQuestProgress,
      submitAction,
      streamNarrative,
    ],
  );

  /**
   * Generates initial narrative when game starts
   */
  const generateInitialNarrativeText = useCallback(
    async (currentState) => {
      if (busyRef.current) {
        return;
      }
      busyRef.current = true;
      setIsLoading(true);
      setIsNarrating(true);
      setError(null);

      try {
        const cacheKeyParts = [
          currentState.world?.vars?.startingSceneId ??
            currentState.world?.flags?.startingSceneId,
          currentState.world?.vars?.current_quest_id ??
            currentState.world?.flags?.current_quest_id,
          ...(currentState.quests?.active || []).map((q) => q?.id).sort(),
          typeof currentState.player?.race === "string"
            ? currentState.player?.race
            : currentState.player?.race?.id,
          typeof currentState.player?.class === "string"
            ? currentState.player?.class
            : currentState.player?.class?.id,
          typeof currentState.player?.profession === "string"
            ? currentState.player?.profession
            : currentState.player?.profession?.id,
        ];
        const cacheKey = cacheKeyParts.filter(Boolean).join("|");

        if (initialNarrativeKeyRef.current === cacheKey) {
          return;
        }
        initialNarrativeKeyRef.current = cacheKey;

        let aiResponse;
        if (initialNarrativeCache.has(cacheKey)) {
          aiResponse = initialNarrativeCache.get(cacheKey);
        } else {
          const prompt = buildInitialPrompt(currentState);
          aiResponse = await generateInitialNarrative(prompt);
          initialNarrativeCache.set(cacheKey, aiResponse);
        }

        // Update narrative history
        const seededState = {
          ...currentState,
          narrative: {
            ...appendNarrativeEntry(
              currentState.narrative,
              {
                type: "narrative",
                text: aiResponse.narrative,
                timestamp: SimBridge.now(),
                source: "ai",
                mood: inferMood(aiResponse.narrative),
              },
              { maxEntries: 80 },
            ),
            summary: aiResponse.narrative,
            summaryMeta: {
              atCount: 1,
              updatedAt: SimBridge.now(),
            },
            currentMood: inferMood(aiResponse.narrative),
          },
        };

        setState((prevState) => {
          const resolved = { ...prevState, ...seededState };
          if (typeof evaluateQuestProgress === "function") {
            evaluateQuestProgress(resolved);
          }
          return resolved;
        });
        setActionSuggestions(buildActionSuggestions(seededState));
      } catch (err) {
        console.error("Error generating initial narrative:", err);
        setError(err.message || "Failed to generate initial narrative.");
        fallbackCounterRef.current += 1;
        const fallbackNarrative = buildFallbackNarrative({
          state: currentState,
          isInitial: true,
          variantSeed: fallbackCounterRef.current,
        });
        setState((prevState) => ({
          ...prevState,
          narrative: {
            ...appendNarrativeEntry(
              prevState.narrative,
              {
                type: "narrative",
                text: fallbackNarrative,
                timestamp: SimBridge.now(),
                source: "fallback",
              },
              { maxEntries: 80 },
            ),
            summary: fallbackNarrative,
          },
        }));
      } finally {
        busyRef.current = false;
        setIsLoading(false);
        setIsNarrating(false);
      }
    },
    [setState, evaluateQuestProgress],
  );

  return {
    submitInput,
    generateInitialNarrativeText,
    isLoading,
    isNarrating,
    error,
    userInput,
    setUserInput,
    inputRef,
    actionSuggestions,
  };
}
