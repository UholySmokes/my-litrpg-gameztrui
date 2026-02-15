import { DataRegistry } from "../data/DataRegistry.js";
import { performLevelUp } from "../systems/leveling/LevelingManager.js";
import { toCanonicalAttributeKey } from "../constants/attributes.js";
import { calculateMaxHp, calculateMaxMana } from "../utils/AttributeMath.js";
import { normalizeGameState } from "./StateNormalizer.js";
import {
  getEffectiveAttributes,
  getAutoUnlockableTitles,
  canPurchaseTitle,
  getTitleById,
} from "./titleLogic.js";
import {
  playerAttack,
  playerUseClassAbility,
  playerUseRaceAbility,
  startCombat,
  escapeCombat,
  processEnemyTurns,
} from "../systems/combat/CombatSystem.js";
import { SimBridge } from "../simulation/bridge/SimulationContext.js";
import {
  canFuseSkills,
  fuseSkills,
} from "../systems/skills/SkillFusionSystem.js";
import {
  canEvolveSkill,
  evolveSkill,
} from "../systems/skills/SkillEvolutionSystem.js";
import {
  createStudiedSpell,
  improveStudiedSpell,
  isSpellSkill,
} from "../systems/skills/SpellStudySystem.js";
import { appendNarrativeEntry, appendSystemMessages } from "./narrativeLog.js";
import { applyQuestRewards } from "../systems/quest/QuestRewards.js";
import { updatePlayerVitals } from "./PlayerVitals.js";
import { applyAutoTitleUnlocks } from "../systems/titles/TitleApplication.js";
import { withTraceSpan } from "../observability/traceShim.js";
import {
  isPlainObject,
  toNumber,
  clamp,
  mergeInventoryItems,
  getProgressionModifiers,
  resolveClassEvolutionRequirement,
} from "../utils/shared.js";
import {
  applyRaceEvolution,
  getRaceEvolutionOptions,
} from "../data/registries/RaceDataRegistry.js";

const ensureCombatStructure = (state) =>
  state.combat || {
    status: "inactive",
    turn: "player",
    enemies: [],
    log: [],
  };

const getCurrentLocationId = (state) => {
  const raw = state?.world?.location;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw.current || "";
  }
  return typeof raw === "string" ? raw : "";
};

const getVisitedLocationCount = (state) => {
  const raw = state?.world?.location;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return Array.isArray(raw.visited) ? raw.visited.length : 0;
  }
  return 0;
};

const getTotalKills = (state) =>
  Math.max(
    0,
    Math.floor(toNumber(state?.player?.progress?.totalKills, 0)),
  );

const getPlayerAttribute = (player, attributeKey) => {
  if (!attributeKey) return 0;
  const canonical = toCanonicalAttributeKey(attributeKey);
  if (!canonical) return 0;
  return toNumber(player?.attributes?.[canonical], 0);
};

const hasInventoryItem = (state, itemId, minQuantity = 1) => {
  if (!itemId) return false;
  const inventory = Array.isArray(state?.player?.inventory)
    ? state.player.inventory
    : [];
  return inventory.some(
    (item) =>
      item?.id === itemId && toNumber(item?.quantity, 1) >= minQuantity,
  );
};

const hasAnyInventoryItem = (state) =>
  Array.isArray(state?.player?.inventory) && state.player.inventory.length > 0;

const hasUnlockedPattern = (state, requirement) => {
  if (!requirement) return false;
  const rawKind =
    typeof requirement === "object" && requirement
      ? requirement.kind
      : "weave";
  const rawId =
    typeof requirement === "object" && requirement
      ? requirement.id
      : requirement;
  const kind = String(rawKind || "weave").trim().toLowerCase();
  const id = String(rawId || "").trim().toLowerCase();
  if (!id) return false;
  const unlocked = state?.player?.magic?.unlockedPatterns;
  const list =
    unlocked && typeof unlocked === "object" && !Array.isArray(unlocked)
      ? unlocked[kind]
      : null;
  return Array.isArray(list)
    ? list
        .map((entry) => String(entry || "").trim().toLowerCase())
        .includes(id)
    : false;
};

const hasEssenceSource = (state, sourceId) => {
  const id = String(sourceId || "").trim().toLowerCase();
  if (!id) return false;
  const sources = state?.world?.essence?.sources;
  if (!Array.isArray(sources)) return false;
  return sources.some((entry) => {
    if (typeof entry === "string") {
      return entry.trim().toLowerCase() === id;
    }
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      return String(entry.id || "").trim().toLowerCase() === id;
    }
    return false;
  });
};

const matchesActionType = (action, wantedType) => {
  if (!wantedType) return true;
  const currentType = String(action?.type || "").trim().toLowerCase();
  if (!currentType) return false;
  if (Array.isArray(wantedType)) {
    return wantedType.some(
      (entry) =>
        String(entry || "").trim().toLowerCase() === currentType,
    );
  }
  return String(wantedType).trim().toLowerCase() === currentType;
};

const matchesActionText = (action, textIncludes) => {
  if (!textIncludes) return true;
  const source = String(action?.originalInput || "").trim().toLowerCase();
  if (!source) return false;
  const needles = Array.isArray(textIncludes) ? textIncludes : [textIncludes];
  return needles.some((needle) =>
    source.includes(String(needle || "").trim().toLowerCase()),
  );
};

const meetsRequirements = (requirements, state, player) => {
  if (!requirements || typeof requirements !== "object") return true;

  const minLevel = toNumber(requirements.minLevel, 0);
  if ((player?.level || 1) < minLevel) return false;

  const minTotalKills = toNumber(requirements.minTotalKills, 0);
  if (getTotalKills(state) < minTotalKills) return false;

  if (
    requirements.minAttributes &&
    typeof requirements.minAttributes === "object" &&
    !Array.isArray(requirements.minAttributes)
  ) {
    for (const [attribute, minValue] of Object.entries(
      requirements.minAttributes,
    )) {
      if (getPlayerAttribute(player, attribute) < toNumber(minValue, 0)) {
        return false;
      }
    }
  }

  return true;
};

const isQuestObjectiveMet = (criteria, prevState, nextState, action) => {
  if (!criteria || typeof criteria !== "object") return false;

  if (!matchesActionType(action, criteria.actionType || criteria.actionTypes)) {
    return false;
  }
  if (!matchesActionText(action, criteria.inputIncludes)) {
    return false;
  }

  const minLevel = toNumber(criteria.minLevel, 0);
  if ((nextState?.player?.level || 1) < minLevel) return false;

  const minTotalKills = toNumber(criteria.minTotalKills, 0);
  if (getTotalKills(nextState) < minTotalKills) return false;

  const minVisitedLocations = toNumber(criteria.minVisitedLocations, 0);
  if (getVisitedLocationCount(nextState) < minVisitedLocations) return false;

  if (criteria.requiresLocationChange) {
    const previousLocation = getCurrentLocationId(prevState);
    const currentLocation = getCurrentLocationId(nextState);
    if (!previousLocation || !currentLocation || previousLocation === currentLocation) {
      return false;
    }
  }

  if (criteria.requiresAnyItem && !hasAnyInventoryItem(nextState)) {
    return false;
  }

  if (criteria.requiresItem) {
    const minQuantity = toNumber(criteria.requiresItemQuantity, 1);
    if (!hasInventoryItem(nextState, criteria.requiresItem, minQuantity)) {
      return false;
    }
  }

  if (criteria.requiresLocation) {
    const currentLocation = String(getCurrentLocationId(nextState)).toLowerCase();
    const requiredLocation = String(criteria.requiresLocation).toLowerCase();
    if (!currentLocation || currentLocation !== requiredLocation) {
      return false;
    }
  }

  if (criteria.requiresMagicPattern && !hasUnlockedPattern(nextState, criteria.requiresMagicPattern)) {
    return false;
  }

  if (criteria.requiresEssenceSource && !hasEssenceSource(nextState, criteria.requiresEssenceSource)) {
    return false;
  }

  return true;
};

const resolveObjectiveCriteria = (quest, objective, questMeta) => {
  if (objective?.criteria && typeof objective.criteria === "object") {
    return objective.criteria;
  }

  const metaObjectives = Array.isArray(questMeta?.objectives)
    ? questMeta.objectives
    : [];
  const metaObjective = metaObjectives.find(
    (entry) => entry?.id && entry.id === objective?.id,
  );
  if (metaObjective?.criteria && typeof metaObjective.criteria === "object") {
    return metaObjective.criteria;
  }

  const shouldUseAutoComplete =
    questMeta?.autoComplete &&
    Array.isArray(quest?.objectives) &&
    quest.objectives.length === 1;
  if (shouldUseAutoComplete) {
    return questMeta.autoComplete;
  }

  return null;
};

const progressQuestObjectives = (prevState, nextState, action) => {
  const activeQuests = Array.isArray(nextState?.quests?.active)
    ? nextState.quests.active
    : [];
  if (!activeQuests.length) return nextState;

  const updatedActive = [];
  const completedQuests = Array.isArray(nextState?.quests?.completed)
    ? [...nextState.quests.completed]
    : [];
  const completedQuestIds = new Set(
    completedQuests
      .map((entry) => entry?.id)
      .filter((id) => typeof id === "string" && id),
  );

  let rewardsState = nextState;
  let changed = false;

  for (const quest of activeQuests) {
    const questMeta = DataRegistry.getQuestById(quest.id) || quest || {};
    const objectives = Array.isArray(quest?.objectives) ? quest.objectives : [];
    if (!objectives.length) {
      updatedActive.push(quest);
      continue;
    }

    let objectivesChanged = false;
    const nextObjectives = objectives.map((objective) => {
      if (objective?.completed) return objective;
      const criteria = resolveObjectiveCriteria(quest, objective, questMeta);
      if (!criteria) return objective;
      if (!isQuestObjectiveMet(criteria, prevState, nextState, action)) {
        return objective;
      }
      objectivesChanged = true;
      return {
        ...objective,
        completed: true,
        completedAt: SimBridge.now(),
      };
    });

    const allCompleted =
      nextObjectives.length > 0 &&
      nextObjectives.every((objective) => objective?.completed);

    if (allCompleted) {
      changed = true;
      if (!completedQuestIds.has(quest.id)) {
        completedQuestIds.add(quest.id);
        completedQuests.push({
          id: quest.id,
          date: SimBridge.now(),
          meta: questMeta || null,
        });
        const reward = questMeta?.rewards || quest?.rewards || null;
        if (reward) {
          rewardsState = applyAutoTitleUnlocks(applyQuestRewards(rewardsState, reward), {
            announce: true,
          });
        }
      }
      continue;
    }

    if (objectivesChanged || quest.status !== "active") {
      changed = true;
      updatedActive.push({
        ...quest,
        status: "active",
        objectives: nextObjectives,
      });
    } else {
      updatedActive.push(quest);
    }
  }

  if (!changed) return rewardsState;

  return {
    ...rewardsState,
    quests: {
      ...(rewardsState.quests || {}),
      active: updatedActive,
      completed: completedQuests,
    },
  };
};

const gameReducer = (state, action) =>
  withTraceSpan(
    "core.gameReducer",
    {
      "game.action.type": action?.type ? String(action.type) : "unknown",
    },
    () => {
      switch (action.type) {
    case "UPDATE_STATE":
      return normalizeGameState({
        ...state,
        ...(action.payload || {}),
      });

    case "SYNC_STATE":
      return normalizeGameState(action.payload || state);

    case "SET_STATE":
      if (typeof action.payload === "function") {
        return normalizeGameState(action.payload(state));
      }
      return normalizeGameState(action.payload);

    case "APPLY_ENGINE_RESULT": {
      // Two-tier dispatch: applies a StepResult from SystemEngine.step()
      const result = action.payload;
      if (!result || !result.ok || !result.nextState) return state;
      let engineState = normalizeGameState(result.nextState);
      engineState = progressQuestObjectives(state, engineState, result.action);
      // Optionally append a narrative entry for the step summary
      if (result.summary) {
        const narrativeWithSummary = appendNarrativeEntry(
          engineState.narrative,
          {
            type: "action",
            text: result.summary,
            timestamp: SimBridge.now(),
            source: "engine",
          },
        );
        return { ...engineState, narrative: narrativeWithSummary };
      }
      return engineState;
    }

    case "ADD_SYSTEM_MESSAGE": {
      const { message, type = "system" } = action.payload;
      const nextNarrative = appendNarrativeEntry(state.narrative, {
        type,
        text: message,
        timestamp: SimBridge.now(),
        source: "system",
      });
      return {
        ...state,
        narrative: nextNarrative,
        chatLog: [
          ...(state.chatLog || []),
          {
            type,
            text: message,
            timestamp: SimBridge.now(),
          },
        ].slice(-100), // Keep last 100 messages
      };
    }

    case "APPEND_SIMULATION_LOG": {
      const incoming = Array.isArray(action.payload?.entries)
        ? action.payload.entries
        : [];

      if (incoming.length === 0) {
        return state;
      }

      const now = SimBridge.now();
      const normalizedEntries = incoming
        .filter(
          (entry) =>
            entry && typeof entry.text === "string" && entry.text.trim(),
        )
        .map((entry, index) => ({
          id: entry.id || `sim_evt_${now}_${index}`,
          tick: entry.tick,
          timestamp: entry.timestamp ?? now + index,
          type: entry.type || "Event",
          text: entry.text.trim(),
          details: entry.details,
        }));

      if (normalizedEntries.length === 0) {
        return state;
      }

      const combatState = ensureCombatStructure(state);
      const updatedCombat = {
        ...combatState,
        log: [...(combatState.log || []), ...normalizedEntries].slice(-200),
      };

      const combatChatEntries = normalizedEntries.map((entry) => ({
        type: "combat",
        text: entry.text,
        timestamp: entry.timestamp,
      }));

      return {
        ...state,
        combat: {
          ...state.combat,
          ...updatedCombat,
        },
        chatLog: [...(state.chatLog || []), ...combatChatEntries].slice(-100),
      };
    }

    case "ADD_XP": {
      const currentXp = toNumber(
        state.player.xp?.current ?? state.player.xp,
        0,
      );
      const nextXp = currentXp + action.payload;

      return {
        ...state,
        player: {
          ...state.player,
          xp: isPlainObject(state.player.xp)
              ? { ...state.player.xp, current: nextXp }
              : nextXp,
        },
      };
    }

    case "COMPLETE_QUEST":
      if (!action.payload?.questId) {
        return state;
      }
      const { questId, reward, questMeta } = action.payload;
      const nextState = {
        ...state,
        quests: {
          ...state.quests,
          active: state.quests.active.filter((q) => q.id !== questId),
          completed: [
            ...state.quests.completed,
            {
              id: questId,
              date: SimBridge.now(),
              ...(questMeta ? { meta: questMeta } : {}),
            },
          ],
        },
      };
      return applyAutoTitleUnlocks(
        applyQuestRewards(nextState, reward),
        {
          announce: true,
        },
      );

    case "UPDATE_RESOURCES": {
      const current = state.player.resources || {};
      const updated = { ...current };

      Object.entries(action.payload).forEach(([key, delta]) => {
        if (!Number.isFinite(delta)) return;
        const currentValue = toNumber(current[key], 0);
        const maxValue = 100; // Default max; could be per-resource config later
        updated[key] = clamp(currentValue + delta, 0, maxValue);
      });

      return {
        ...state,
        player: {
          ...state.player,
          resources: updated,
        },
      };
    }

    case "EQUIP_ITEM": {
      const { slot, item } = action.payload;
      const equipment = { ...(state.player.equipment || {}) };
      const inventory = [...(state.player.inventory || [])];

      // Remove equipped item and return to inventory
      if (equipment[slot]) {
        const prevItem = equipment[slot];
        const existingIndex = inventory.findIndex((i) => i.id === prevItem.id);
        if (existingIndex >= 0) {
          inventory[existingIndex] = {
            ...inventory[existingIndex],
            quantity: (inventory[existingIndex].quantity || 1) + 1,
          };
        } else {
          inventory.push({ ...prevItem, quantity: 1 });
        }
      }

      // Remove new item from inventory
      const itemIndex = inventory.findIndex((i) => i.id === item.id);
      if (itemIndex >= 0) {
        if (inventory[itemIndex].quantity > 1) {
          inventory[itemIndex] = {
            ...inventory[itemIndex],
            quantity: inventory[itemIndex].quantity - 1,
          };
        } else {
          inventory.splice(itemIndex, 1);
        }
      }

      equipment[slot] = item;

      return {
        ...state,
        player: {
          ...state.player,
          equipment,
          inventory,
        },
      };
    }

    case "UNEQUIP_ITEM": {
      const slot = action.payload?.slot;
      if (!slot || !state.player) return state;
      const equipment = { ...(state.player.equipment || {}) };
      const inventory = [...(state.player.inventory || [])];
      const unequipped = equipment[slot];
      if (!unequipped) return state;

      delete equipment[slot];
      const quantity = toNumber(unequipped.quantity, 1);
      const nextInventory = mergeInventoryItems(inventory, [
        { ...unequipped, quantity },
      ]);

      return {
        ...state,
        player: {
          ...state.player,
          equipment,
          inventory: nextInventory,
        },
      };
    }

    case "PLAYER_ATTACK": {
      const enemyIndex = action.payload?.enemyIndex ?? 0;
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") {
        return state;
      }
      const result = playerAttack(
        { ...state, combat: combatState },
        enemyIndex,
      );
      if (!result.success) {
        return state;
      }
      return applyAutoTitleUnlocks(processEnemyTurns(result.state), {
        announce: true,
      });
    }

    case "PLAYER_USE_SKILL": {
      const { skillId, enemyIndex = 0 } = action.payload || {};
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") {
        return state;
      }
      const result = playerAttack(
        { ...state, combat: combatState },
        enemyIndex,
        skillId,
      );
      if (!result.success) {
        return state;
      }
      return applyAutoTitleUnlocks(processEnemyTurns(result.state), {
        announce: true,
      });
    }

    case "PLAYER_USE_CLASS_ABILITY": {
      const { abilityId, enemyIndex = 0 } = action.payload || {};
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") {
        return state;
      }
      const result = playerUseClassAbility(
        { ...state, combat: combatState },
        enemyIndex,
        abilityId,
      );
      if (!result.success) {
        return state;
      }
      return applyAutoTitleUnlocks(processEnemyTurns(result.state), {
        announce: true,
      });
    }

    case "PLAYER_USE_RACE_ABILITY": {
      const { abilityId, enemyIndex = 0 } = action.payload || {};
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") {
        return state;
      }
      const result = playerUseRaceAbility(
        { ...state, combat: combatState },
        enemyIndex,
        abilityId,
      );
      if (!result.success) {
        return state;
      }
      return applyAutoTitleUnlocks(processEnemyTurns(result.state), {
        announce: true,
      });
    }

    case "PLAYER_ESCAPE": {
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") {
        return state;
      }
      const result = escapeCombat({ ...state, combat: combatState });
      return result.state || state;
    }

    case "PLAYER_START_COMBAT": {
      const enemyIds = action.payload?.enemyIds || [];
      return startCombat(state, enemyIds);
    }

    case "CRAFT_ITEM": {
      const recipe = action.payload?.recipe;
      if (!recipe || !state.player) return state;
      const inventory = [...(state.player.inventory || [])];
      const hasIngredients = recipe.ingredients.every((ingredient) => {
        const existing = inventory.find((item) => item.id === ingredient.id);
        return existing && existing.quantity >= ingredient.count;
      });
      if (!hasIngredients) return state;

      recipe.ingredients.forEach((ingredient) => {
        const index = inventory.findIndex((item) => item.id === ingredient.id);
        if (index === -1) return;
        const item = inventory[index];
        if (item.quantity > ingredient.count) {
          inventory[index] = {
            ...item,
            quantity: item.quantity - ingredient.count,
          };
        } else {
          inventory.splice(index, 1);
        }
      });

      const craftedItem = {
        ...recipe.result,
        quantity: toNumber(recipe.result?.count ?? recipe.result?.quantity, 1),
      };
      const nextInventory = mergeInventoryItems(inventory, [craftedItem]);

      return {
        ...state,
        player: {
          ...state.player,
          inventory: nextInventory,
        },
      };
    }

    case "FUSE_SKILLS": {
      const skillAId = action.payload?.skillAId;
      const skillBId = action.payload?.skillBId;
      if (!skillAId || !skillBId || skillAId === skillBId) return state;
      const player = state.player || {};
      const abilities = Array.isArray(player.abilities)
        ? [...player.abilities]
        : [];
      const activeSkills = Array.isArray(player.activeSkills)
        ? [...player.activeSkills]
        : [];
      const passiveSkills = Array.isArray(player.passiveSkills)
        ? [...player.passiveSkills]
        : [];
      const allSkills = [...abilities, ...activeSkills, ...passiveSkills];
      const skillA = allSkills.find((skill) => skill?.id === skillAId);
      const skillB = allSkills.find((skill) => skill?.id === skillBId);
      if (!canFuseSkills(skillA, skillB)) return state;
      const existingIds = new Set(allSkills.map((skill) => skill?.id));
      const fused = fuseSkills(skillA, skillB, { existingIds });
      if (!fused) return state;

      const removeIds = new Set([skillAId, skillBId]);
      const nextAbilities = abilities.filter((skill) => !removeIds.has(skill.id));
      const nextActive = activeSkills.filter((skill) => !removeIds.has(skill.id));
      const nextPassive = passiveSkills.filter((skill) => !removeIds.has(skill.id));

      if (fused.type === "passive") {
        nextPassive.push(fused);
      } else {
        nextActive.push(fused);
      }
      nextAbilities.push(fused);

      return {
        ...state,
        player: {
          ...player,
          abilities: nextAbilities,
          activeSkills: nextActive,
          passiveSkills: nextPassive,
        },
      };
    }

    case "EVOLVE_SKILL": {
      const skillId = action.payload?.skillId;
      if (!skillId) return state;
      const player = state.player || {};
      const abilities = Array.isArray(player.abilities)
        ? [...player.abilities]
        : [];
      const activeSkills = Array.isArray(player.activeSkills)
        ? [...player.activeSkills]
        : [];
      const passiveSkills = Array.isArray(player.passiveSkills)
        ? [...player.passiveSkills]
        : [];
      const allSkills = [...abilities, ...activeSkills, ...passiveSkills];
      const skill = allSkills.find((entry) => entry?.id === skillId);
      if (!canEvolveSkill(skill)) return state;
      const existingIds = new Set(allSkills.map((entry) => entry?.id));
      const evolved = evolveSkill(skill, { existingIds });
      if (!evolved) return state;

      const nextAbilities = abilities.filter((entry) => entry.id !== skillId);
      const nextActive = activeSkills.filter((entry) => entry.id !== skillId);
      const nextPassive = passiveSkills.filter((entry) => entry.id !== skillId);

      if (evolved.type === "passive") {
        nextPassive.push(evolved);
      } else {
        nextActive.push(evolved);
      }
      nextAbilities.push(evolved);

      return {
        ...state,
        player: {
          ...player,
          abilities: nextAbilities,
          activeSkills: nextActive,
          passiveSkills: nextPassive,
        },
      };
    }

    case "STUDY_SPELL": {
      const player = state.player || {};
      const abilities = Array.isArray(player.abilities)
        ? [...player.abilities]
        : [];
      const activeSkills = Array.isArray(player.activeSkills)
        ? [...player.activeSkills]
        : [];
      const passiveSkills = Array.isArray(player.passiveSkills)
        ? [...player.passiveSkills]
        : [];
      const allSkills = [...abilities, ...activeSkills, ...passiveSkills];
      const existingIds = new Set(allSkills.map((entry) => entry?.id));

      const mode = action.payload?.mode || "create";
      if (mode === "improve") {
        const skillId = action.payload?.skillId;
        if (!skillId) return state;
        const skill = allSkills.find((entry) => entry?.id === skillId);
        if (!skill || !isSpellSkill(skill)) return state;
        const evolved = improveStudiedSpell(skill, { existingIds });
        if (!evolved) return state;

        const nextAbilities = abilities.filter((entry) => entry.id !== skillId);
        const nextActive = activeSkills.filter((entry) => entry.id !== skillId);
        const nextPassive = passiveSkills.filter((entry) => entry.id !== skillId);

        if (evolved.type === "passive") {
          nextPassive.push(evolved);
        } else {
          nextActive.push(evolved);
        }
        nextAbilities.push(evolved);

        const nextState = {
          ...state,
          player: {
            ...player,
            abilities: nextAbilities,
            activeSkills: nextActive,
            passiveSkills: nextPassive,
          },
        };
        return appendSystemMessages(nextState, [
          `Study complete: ${evolved.name} improved.`,
        ]);
      }

      const created = createStudiedSpell({
        level: player.level || 1,
        existingIds,
      });
      if (!created) return state;

      const nextAbilities = [...abilities, created];
      const nextActive = [...activeSkills];
      const nextPassive = [...passiveSkills];
      if (created.type === "passive") {
        nextPassive.push(created);
      } else {
        nextActive.push(created);
      }

      const nextState = {
        ...state,
        player: {
          ...player,
          abilities: nextAbilities,
          activeSkills: nextActive,
          passiveSkills: nextPassive,
        },
      };
      return appendSystemMessages(nextState, [
        `Study complete: learned ${created.name}.`,
      ]);
    }

    case "EVOLVE_CLASS": {
      const player = state.player || {};
      const classId = player.class?.id || player.class;
      if (!classId) return state;
      const evolutionOptions = DataRegistry.getClassEvolutionOptions(classId);
      if (!Array.isArray(evolutionOptions) || evolutionOptions.length === 0) {
        return state;
      }

      const requestedOptionId =
        action.payload?.evolutionId || action.payload?.targetClassId || null;
      const selectedOption = requestedOptionId
        ? DataRegistry.getClassEvolutionOption(classId, requestedOptionId)
        : evolutionOptions[0];
      if (!selectedOption?.targetId) return state;

      const nextClass = DataRegistry.getClassById(selectedOption.targetId);
      if (!nextClass) return state;

      const progress = isPlainObject(player.progress) ? player.progress : {};
      const evolutionCount = toNumber(progress.classEvolutions, 0);
      const progressionModifiers = getProgressionModifiers(player);
      const progressionLevelRequirement = resolveClassEvolutionRequirement(
        state.config,
        evolutionCount,
        progressionModifiers,
      );
      const mergedRequirements = {
        ...(selectedOption.requirements || {}),
        minLevel: Math.max(
          progressionLevelRequirement,
          toNumber(selectedOption.requirements?.minLevel, 1),
        ),
      };
      if (!meetsRequirements(mergedRequirements, state, player)) return state;

      const history = Array.isArray(progress.classEvolutionHistory)
        ? [...progress.classEvolutionHistory]
        : [];
      history.push({
        atLevel: player.level || 1,
        from: classId,
        to: nextClass.id,
        optionId: selectedOption.id,
      });

      return {
        ...state,
        player: {
          ...player,
          class: nextClass,
          progress: {
            ...progress,
            classEvolutions: evolutionCount + 1,
            lastClassEvolutionFrom: classId,
            lastClassEvolutionTo: nextClass.id,
            lastClassEvolutionAtLevel: player.level || 1,
            lastClassEvolutionOption: selectedOption.id,
            classEvolutionHistory: history.slice(-10),
          },
        },
      };
    }

    case "EVOLVE_RACE": {
      const player = state.player || {};
      if (!player.race) return state;

      const progress = isPlainObject(player.progress) ? player.progress : {};
      const stageFromProgress = toNumber(progress.raceEvolutionStage, NaN);
      const stageOverride = Number.isFinite(stageFromProgress)
        ? stageFromProgress
        : null;
      const evolutionOptions = getRaceEvolutionOptions(player.race, stageOverride);
      if (!Array.isArray(evolutionOptions) || evolutionOptions.length === 0) {
        return state;
      }

      const requestedOptionId = action.payload?.evolutionId || null;
      const selectedOption = requestedOptionId
        ? evolutionOptions.find(
            (option) =>
              option.id === requestedOptionId ||
              option.name.toLowerCase() ===
                String(requestedOptionId).trim().toLowerCase(),
          )
        : evolutionOptions[0];
      if (!selectedOption) return state;
      if (!meetsRequirements(selectedOption.requirements, state, player)) {
        return state;
      }

      const evolvedRace = applyRaceEvolution(player.race, selectedOption, stageOverride);
      if (!evolvedRace) return state;

      const attributes = {
        ...(player.attributes || {}),
      };
      Object.entries(selectedOption.statBonusesDelta || {}).forEach(
        ([rawKey, rawValue]) => {
          const canonical = toCanonicalAttributeKey(rawKey);
          if (!canonical) return;
          attributes[canonical] =
            toNumber(attributes[canonical], 0) + toNumber(rawValue, 0);
        },
      );

      const raceEvolutionHistory = Array.isArray(progress.raceEvolutionHistory)
        ? [...progress.raceEvolutionHistory]
        : [];
      raceEvolutionHistory.push({
        atLevel: player.level || 1,
        toStage: selectedOption.stage,
        toName: selectedOption.name,
        optionId: selectedOption.id,
      });

      return {
        ...state,
        player: updatePlayerVitals(
          {
            ...player,
            race: evolvedRace,
            attributes,
            progress: {
              ...progress,
              raceEvolutions: toNumber(progress.raceEvolutions, 0) + 1,
              raceEvolutionStage: selectedOption.stage,
              lastRaceEvolutionAtLevel: player.level || 1,
              lastRaceEvolutionName: selectedOption.name,
              raceEvolutionHistory: raceEvolutionHistory.slice(-10),
            },
          },
          state.config,
          attributes,
        ),
      };
    }

    case "AWARD_PROFESSION_XP": {
      const { professionId, xp = 0 } = action.payload || {};
      if (!state.player || !professionId || xp <= 0) return state;
      const professions = { ...(state.player.professions || {}) };
      const currentXp = professions[professionId]?.xp || 0;
      professions[professionId] = {
        xp: currentXp + xp,
      };
      return {
        ...state,
        player: {
          ...state.player,
          professions,
        },
      };
    }

    case "GACHA_PULL": {
      const { cost = {}, results = [] } = action.payload || {};
      const goldCost = toNumber(cost.goldCoins, 0);
      const soulCost = toNumber(cost.soulpoints, 0);

      const currentGold = toNumber(state.player.gold, 0);
      const currentSoul = toNumber(
        state.player.currency?.soulpoints ?? state.player.soulpoints,
        0,
      );

      if (currentGold < goldCost || currentSoul < soulCost) {
        return state;
      }

      const rewardItems = results
        .filter((reward) => reward && (reward.itemData || reward.id))
        .map((reward) => {
          const base = reward.itemData || {};
          const id = base.id || reward.id;
          return {
            ...base,
            id,
            name: reward.name || base.name || id,
            quantity: 1,
            rarity: reward.rarity || base.rarity,
          };
        });

      const equipmentState = { ...(state.player.equipment || {}) };
      const inventoryRewards = [];

      rewardItems.forEach((item) => {
        if (
          item.type === "equipment" &&
          item.equipSlot &&
          !equipmentState[item.equipSlot]
        ) {
          equipmentState[item.equipSlot] = item;
        } else {
          inventoryRewards.push(item);
        }
      });

      const nextInventory = mergeInventoryItems(
        state.player.inventory,
        inventoryRewards,
      );

      const nextSoul = currentSoul - soulCost;
      const progress = isPlainObject(state.player.progress)
          ? state.player.progress
          : {};
      const pullCount = Array.isArray(results) ? results.length : 0;

      const nextState = {
        ...state,
        player: {
          ...state.player,
          gold: currentGold - goldCost,
          soulpoints:
            state.player.soulpoints !== undefined
              ? toNumber(state.player.soulpoints, 0) - soulCost
              : state.player.soulpoints,
          currency: {
            ...(state.player.currency || {}),
            goldCoins: currentGold - goldCost,
            soulpoints: nextSoul,
          },
          inventory: nextInventory,
          equipment: equipmentState,
          progress: {
            ...progress,
            gachaPulls: toNumber(progress.gachaPulls, 0) + pullCount,
          },
        },
      };

      return applyAutoTitleUnlocks(nextState, { announce: true });
    }

    case "PURCHASE_TITLE": {
      const titleId = action.payload?.titleId;
      if (!titleId || !state.player) return state;

      const title = getTitleById(titleId);
      if (!title) return state;
      if (!canPurchaseTitle(title, state)) return state;

      const unlocked = new Set(
        (state.player.unlockedTitles || state.player.titles || []).filter(
          (id) => typeof id === "string" && id,
        ),
      );

      const cost = title.unlockConditions.purchase || {};
      const goldCost = toNumber(cost.goldCoins, 0);
      const soulCost = toNumber(cost.soulpoints, 0);

      const currentGold = toNumber(
        state.player.currency?.goldCoins ?? state.player.gold,
        0,
      );
      const currentSoul = toNumber(
        state.player.currency?.soulpoints ?? state.player.soulpoints,
        0,
      );

      if (currentGold < goldCost || currentSoul < soulCost) {
        return state;
      }

      const nextGold = currentGold - goldCost;
      const nextSoul = currentSoul - soulCost;
      unlocked.add(titleId);
      const unlockedTitles = Array.from(unlocked);

      const updatedPlayer = updatePlayerVitals(
        {
          ...state.player,
          gold: nextGold,
          soulpoints: nextSoul,
          currency: {
            ...(state.player.currency || {}),
            goldCoins: nextGold,
            soulpoints: nextSoul,
          },
          titles: unlockedTitles,
          unlockedTitles,
        },
        state.config,
      );

      return {
        ...state,
        player: updatedPlayer,
      };
    }

    case "EQUIP_TITLE": {
      const titleId = action.payload?.titleId;
      if (!titleId || !state.player) return state;

      const unlockedIds =
        state.player.unlockedTitles || state.player.titles || [];
      if (!Array.isArray(unlockedIds) || !unlockedIds.includes(titleId)) {
        return state;
      }

      return {
        ...state,
        player: updatePlayerVitals(
          {
            ...state.player,
            equippedTitle: titleId,
          },
          state.config,
        ),
      };
    }

    case "UNEQUIP_TITLE": {
      if (!state.player?.equippedTitle) return state;
      return {
        ...state,
        player: updatePlayerVitals(
          {
            ...state.player,
            equippedTitle: null,
          },
          state.config,
        ),
      };
    }

    case "LEVEL_UP": {
      if (!state?.player?.xp) {
        return state;
      }

      let nextState = state;
      let leveledUp = false;

      while (
        nextState.player?.xp?.current >= nextState.player?.xp?.max &&
        nextState.player?.level < (nextState.config?.maxLevel ?? Infinity)
      ) {
        const previousLevel = nextState.player.level;
        nextState = performLevelUp(nextState);
        if (nextState.player.level === previousLevel) {
          break; // Prevent infinite loop if performLevelUp no-ops (e.g., already at cap)
        }
        leveledUp = true;
      }

      return leveledUp
        ? applyAutoTitleUnlocks(nextState, { announce: true })
        : state;
    }

    case "ALLOCATE_ATTRIBUTE_POINT": {
      const attributeKey = toCanonicalAttributeKey(action.payload?.attribute);
      if (!attributeKey) return state;

      const player = state.player || {};
      const attributes = { ...(player.attributes || {}) };
      const freePoints = toNumber(attributes.freePoints, 0);
      if (freePoints <= 0) return state;

      const attributeInvestments = { ...(player.attributeInvestments || {}) };
      attributes[attributeKey] = toNumber(attributes[attributeKey], 0) + 1;
      attributes.freePoints = freePoints - 1;
      attributeInvestments[attributeKey] =
        toNumber(attributeInvestments[attributeKey], 0) + 1;
      return {
        ...state,
        player: updatePlayerVitals(
          {
            ...player,
            attributes,
            attributeInvestments,
          },
          state.config,
          attributes,
        ),
      };
    }

    case "DEALLOCATE_ATTRIBUTE_POINT": {
      const attributeKey = toCanonicalAttributeKey(action.payload?.attribute);
      if (!attributeKey) return state;

      const player = state.player || {};
      const attributes = { ...(player.attributes || {}) };
      const attributeInvestments = { ...(player.attributeInvestments || {}) };
      const invested = toNumber(attributeInvestments[attributeKey], 0);
      if (invested <= 0) return state;

      const currentValue = toNumber(attributes[attributeKey], 0);
      const freePoints = toNumber(attributes.freePoints, 0);

      attributes[attributeKey] = Math.max(0, currentValue - 1);
      attributes.freePoints = freePoints + 1;
      const nextInvested = invested - 1;
      if (nextInvested > 0) {
        attributeInvestments[attributeKey] = nextInvested;
      } else {
        delete attributeInvestments[attributeKey];
      }
      return {
        ...state,
        player: updatePlayerVitals(
          {
            ...player,
            attributes,
            attributeInvestments,
          },
          state.config,
          attributes,
        ),
      };
    }

        default:
          return state;
      }
    },
  );

export { gameReducer };
