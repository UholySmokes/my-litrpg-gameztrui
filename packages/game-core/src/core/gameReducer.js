import { DataRegistry } from "../data/DataRegistry.js";
import { toCanonicalAttributeKey } from "../constants/attributes.js";
import { normalizeGameState } from "./StateNormalizer.js";
import { SimBridge } from "../simulation/bridge/SimulationContext.js";
import { appendNarrativeEntry } from "./narrativeLog.js";
import { applyQuestRewards } from "../systems/quest/QuestRewards.js";
import { applyAutoTitleUnlocks } from "../systems/titles/TitleApplication.js";
import { withTraceSpan } from "../observability/traceShim.js";
import {
  isPlainObject,
  toNumber,
  clamp,
} from "../utils/shared.js";
import { handleCombatAction } from "./reducer/combatActionHandlers.js";
import { handleInventoryAction } from "./reducer/inventoryActionHandlers.js";
import { handleProgressionAction } from "./reducer/progressionActionHandlers.js";
import { handleSkillAction } from "./reducer/skillActionHandlers.js";
import { promoteOnboardingAfterQuestCompletion } from "../world/OpeningTutorialBundleRegistry.js";
import { createDefaultCombatState } from "../systems/skirmish/SkirmishState.js";

const ensureCombatStructure = (state) =>
  createDefaultCombatState(state?.combat || {});

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

const getCombatLaneBounds = (combatState) => {
  const enemyLanes = Array.isArray(combatState?.lanes?.enemies)
    ? combatState.lanes.enemies
    : [];
  const finiteEnemyLanes = enemyLanes
    .map((lane) => Math.round(toNumber(lane, NaN)))
    .filter((lane) => Number.isFinite(lane));
  const maxLane = Math.max(
    3,
    Math.round(toNumber(combatState?.lanes?.player, 1)),
    ...finiteEnemyLanes,
  );

  return {
    maxLane,
    enemyLanes: finiteEnemyLanes,
  };
};

const clampCombatLane = (lane, combatState) => {
  const { maxLane } = getCombatLaneBounds(combatState);
  return clamp(Math.round(toNumber(lane, 1)), 1, maxLane);
};

const getPlayerAttribute = (player, attributeKey) => {
  if (!attributeKey) return 0;
  const canonical = toCanonicalAttributeKey(attributeKey);
  if (!canonical) return 0;
  const attributes = isPlainObject(player?.attributes) ? player.attributes : {};
  const candidates = [];
  if (Object.prototype.hasOwnProperty.call(attributes, canonical)) {
    candidates.push(toNumber(attributes[canonical], NaN));
  }

  const rawKey = String(attributeKey);
  if (Object.prototype.hasOwnProperty.call(attributes, rawKey)) {
    candidates.push(toNumber(attributes[rawKey], NaN));
  }

  for (const [candidateKey, value] of Object.entries(attributes)) {
    if (toCanonicalAttributeKey(candidateKey) === canonical) {
      candidates.push(toNumber(value, NaN));
    }
  }

  const numericCandidates = candidates.filter((value) => Number.isFinite(value));
  if (numericCandidates.length === 0) return 0;
  return Math.max(...numericCandidates);
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
  const newlyCompletedQuestIds = [];

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
        newlyCompletedQuestIds.push(quest.id);
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

  let resolvedState = {
    ...rewardsState,
    quests: {
      ...(rewardsState.quests || {}),
      active: updatedActive,
      completed: completedQuests,
    },
  };

  newlyCompletedQuestIds.forEach((questId) => {
    resolvedState = promoteOnboardingAfterQuestCompletion(resolvedState, questId);
  });

  return resolvedState;
};

const syncQuestObjectivesForAction = (prevState, nextState, actionLike) => {
  if (!nextState || nextState === prevState) {
    return nextState;
  }
  return progressQuestObjectives(prevState, nextState, actionLike);
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

    case "MERGE_ONBOARDING_STATE": {
      const currentWorld = isPlainObject(state.world) ? state.world : {};
      const currentVars = isPlainObject(currentWorld.vars) ? currentWorld.vars : {};
      const currentOnboarding = isPlainObject(currentVars.onboarding)
        ? currentVars.onboarding
        : {};
      const incoming = isPlainObject(action.payload) ? action.payload : {};
      const incomingMilestones = isPlainObject(incoming.milestones)
        ? incoming.milestones
        : null;

      return {
        ...state,
        world: {
          ...currentWorld,
          vars: {
            ...currentVars,
            onboarding: {
              ...currentOnboarding,
              ...incoming,
              milestones: incomingMilestones
                ? {
                    ...(isPlainObject(currentOnboarding.milestones)
                      ? currentOnboarding.milestones
                      : {}),
                    ...incomingMilestones,
                  }
                : currentOnboarding.milestones,
            },
          },
        },
      };
    }

    case "TRACK_UI_ACTION": {
      const actionType =
        typeof action.payload?.actionType === "string"
          ? action.payload.actionType.trim().toLowerCase()
          : "";
      if (!actionType) {
        return state;
      }
      return progressQuestObjectives(state, state, {
        type: actionType,
        originalInput: actionType,
      });
    }

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

    case "EQUIP_ITEM":
    case "UNEQUIP_ITEM":
      return handleInventoryAction(state, action);

    case "PLAYER_ATTACK":
    case "PLAYER_USE_SKILL":
    case "PLAYER_USE_CLASS_ABILITY":
    case "PLAYER_USE_RACE_ABILITY":
    case "PLAYER_SELECT_SKIRMISH_UNIT":
    case "PLAYER_SELECT_SKIRMISH_TARGET":
    case "PLAYER_SKIRMISH_MOVE":
    case "PLAYER_SKIRMISH_USE_SKILL":
    case "PLAYER_SKIRMISH_USE_ITEM":
    case "PLAYER_SKIRMISH_WAIT":
    case "PLAYER_SET_COMBAT_LANE":
    case "PLAYER_SET_COMBAT_STANCE":
    case "DUNGEON_START_RUN":
    case "DUNGEON_COMPLETE_ROOM":
    case "DUNGEON_ADVANCE_ROOM":
    case "DUNGEON_ABANDON_RUN":
    case "PLAYER_ESCAPE":
    case "PLAYER_START_COMBAT":
      return handleCombatAction(state, action, {
        ensureCombatStructure,
        clampCombatLane,
        getCombatLaneBounds,
        syncQuestObjectivesForAction,
      });

    case "CRAFT_ITEM":
    case "GACHA_PULL":
    case "PURCHASE_TITLE":
    case "EQUIP_TITLE":
    case "UNEQUIP_TITLE":
      return handleInventoryAction(state, action);

    case "FUSE_SKILLS":
    case "EVOLVE_SKILL":
    case "STUDY_SPELL":
      return handleSkillAction(state, action);

    case "EVOLVE_CLASS":
    case "EVOLVE_RACE":
    case "PERFORM_PRESTIGE":
    case "BUY_PRESTIGE_UPGRADE":
    case "AWARD_PROFESSION_XP":
    case "LEVEL_UP":
    case "ALLOCATE_ATTRIBUTE_POINT":
    case "DEALLOCATE_ATTRIBUTE_POINT":
      return handleProgressionAction(state, action, {
        meetsRequirements,
      });

        default:
          return state;
      }
    },
  );

export { gameReducer };
