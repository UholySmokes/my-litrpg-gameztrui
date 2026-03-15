import { DataRegistry } from "../../data/DataRegistry.js";
import {
  buildOpeningSceneNarrativeSeed,
  getOpeningSceneChoice,
  getOpeningSceneEffectIntents,
  listOpeningSceneChoices,
} from "../../data/OpeningScenes.js";
import { toCanonicalAttributeKey } from "../../constants/attributes.js";
import { QuestManager } from "../../systems/quest/QuestManager.js";
import { SimBridge } from "../../simulation/bridge/SimulationBridge.js";
import { mergeInventoryItems } from "../../utils/shared.js";
import {
  OPENING_SCENE_ACTION_ALIASES,
  OPENING_SCENE_QUEST_TEMPLATES,
  OPENING_SCENE_SKILL_TEMPLATES,
} from "./openingSceneContent.js";

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

export function resolveOpeningChoiceFromInput(userInput, sceneId) {
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
        if (currencyKey === "goldCoins") nextPlayer.gold = nextValue;
        if (currencyKey === "soulpoints") nextPlayer.soulpoints = nextValue;
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
          current_quest_id: world?.vars?.current_quest_id || nextQuest?.id || null,
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

export function applyOpeningSceneChoice(state, { sceneId, choice }) {
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
