import {
  escapeCombat,
  playerAttack,
  playerUseClassAbility,
  playerUseRaceAbility,
  processEnemyTurns,
  startCombat,
} from "../../systems/combat/CombatSystem.js";
import {
  buildSkirmishEnemyIndex,
  moveSkirmishUnit,
  selectSkirmishTarget,
  selectSkirmishUnit,
  skirmishUseItem,
  waitSkirmishTurn,
} from "../../systems/skirmish/SkirmishSystem.js";
import {isSkirmishCombat} from "../../systems/skirmish/SkirmishState.js";
import {applyAutoTitleUnlocks} from "../../systems/titles/TitleApplication.js";
import {
  abandonDungeonRun,
  advanceDungeonRoom,
  completeCurrentDungeonRoom,
  startDungeonRun,
} from "../../systems/dungeon/DungeonRuntime.js";
import {normalizeGameState} from "../StateNormalizer.js";

export function handleCombatAction(state, action, helpers) {
  const {
    ensureCombatStructure,
    clampCombatLane,
    getCombatLaneBounds,
    syncQuestObjectivesForAction,
  } = helpers;

  switch (action.type) {
    case "PLAYER_SELECT_SKIRMISH_UNIT": {
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active" || !isSkirmishCombat(combatState)) return state;
      return selectSkirmishUnit({ ...state, combat: combatState }, action.payload?.unitId);
    }

    case "PLAYER_SELECT_SKIRMISH_TARGET": {
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active" || !isSkirmishCombat(combatState)) return state;
      return selectSkirmishTarget({ ...state, combat: combatState }, action.payload?.targetId);
    }

    case "PLAYER_ATTACK": {
      const enemyIndex = action.payload?.enemyIndex ?? 0;
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") return state;
      const result = playerAttack({ ...state, combat: combatState }, enemyIndex);
      if (!result.success) return state;
      const postCombatState = applyAutoTitleUnlocks(processEnemyTurns(result.state), {
        announce: true,
      });
      return syncQuestObjectivesForAction(state, postCombatState, {
        type: "attack",
        enemyIndex,
      });
    }

    case "PLAYER_USE_SKILL": {
      const { skillId, enemyIndex = 0 } = action.payload || {};
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") return state;
      const result = playerAttack({ ...state, combat: combatState }, enemyIndex, skillId);
      if (!result.success) return state;
      const postCombatState = applyAutoTitleUnlocks(processEnemyTurns(result.state), {
        announce: true,
      });
      return syncQuestObjectivesForAction(state, postCombatState, {
        type: "attack",
        skillId,
        enemyIndex,
      });
    }

    case "PLAYER_SKIRMISH_USE_SKILL": {
      const { skillId } = action.payload || {};
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active" || !isSkirmishCombat(combatState)) return state;
      const enemyIndex = buildSkirmishEnemyIndex(combatState.board, combatState);
      const result = playerAttack(
        { ...state, combat: combatState },
        enemyIndex >= 0 ? enemyIndex : 0,
        skillId,
      );
      if (!result.success) return result.state || state;
      const postCombatState = applyAutoTitleUnlocks(processEnemyTurns(result.state), {
        announce: true,
      });
      return syncQuestObjectivesForAction(state, postCombatState, {
        type: "attack",
        skillId,
        enemyIndex,
      });
    }

    case "PLAYER_SKIRMISH_MOVE": {
      const { lane, slot } = action.payload || {};
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active" || !isSkirmishCombat(combatState)) return state;
      const movedState = moveSkirmishUnit({ ...state, combat: combatState }, lane, slot);
      const postCombatState = applyAutoTitleUnlocks(processEnemyTurns(movedState), {
        announce: true,
      });
      return syncQuestObjectivesForAction(state, postCombatState, {
        type: "reposition",
        targetLane: lane,
      });
    }

    case "PLAYER_SKIRMISH_USE_ITEM": {
      const { itemId } = action.payload || {};
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active" || !isSkirmishCombat(combatState)) return state;
      const result = skirmishUseItem({...state, combat: combatState}, itemId);
      if (!result.success) return result.state || state;
      const postCombatState = applyAutoTitleUnlocks(processEnemyTurns(result.state), {
        announce: true,
      });
      return syncQuestObjectivesForAction(state, postCombatState, {
        type: "use_item",
        itemId,
      });
    }

    case "PLAYER_SKIRMISH_WAIT": {
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active" || !isSkirmishCombat(combatState)) return state;
      const waitedState = waitSkirmishTurn({ ...state, combat: combatState });
      const postCombatState = applyAutoTitleUnlocks(processEnemyTurns(waitedState), {
        announce: true,
      });
      return syncQuestObjectivesForAction(state, postCombatState, {
        type: "wait",
      });
    }

    case "PLAYER_USE_CLASS_ABILITY": {
      const { abilityId, enemyIndex = 0 } = action.payload || {};
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") return state;
      const result = playerUseClassAbility(
        { ...state, combat: combatState },
        enemyIndex,
        abilityId,
      );
      if (!result.success) return state;
      const postCombatState = applyAutoTitleUnlocks(processEnemyTurns(result.state), {
        announce: true,
      });
      return syncQuestObjectivesForAction(state, postCombatState, {
        type: "attack",
        abilityId,
        enemyIndex,
      });
    }

    case "PLAYER_USE_RACE_ABILITY": {
      const { abilityId, enemyIndex = 0 } = action.payload || {};
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") return state;
      const result = playerUseRaceAbility(
        { ...state, combat: combatState },
        enemyIndex,
        abilityId,
      );
      if (!result.success) return state;
      const postCombatState = applyAutoTitleUnlocks(processEnemyTurns(result.state), {
        announce: true,
      });
      return syncQuestObjectivesForAction(state, postCombatState, {
        type: "attack",
        abilityId,
        enemyIndex,
      });
    }

    case "PLAYER_SET_COMBAT_LANE": {
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active" || combatState.turn !== "player") return state;

      const currentLane = clampCombatLane(combatState?.lanes?.player, combatState);
      const targetLane = clampCombatLane(action.payload?.lane, combatState);
      if (targetLane === currentLane) return state;

      const { enemyLanes } = getCombatLaneBounds(combatState);
      const nextCombatState = {
        ...combatState,
        turn: "enemy",
        log: [
          ...(combatState.log || []),
          `${state?.player?.name || "You"} shift from lane ${currentLane} to lane ${targetLane}.`,
        ],
        lanes: {
          player: targetLane,
          enemies:
            enemyLanes.length > 0
              ? enemyLanes
              : (combatState.enemies || []).map((enemy) =>
                  clampCombatLane(enemy?.lane, combatState),
                ),
        },
      };

      const postCombatState = applyAutoTitleUnlocks(
        processEnemyTurns({
          ...state,
          combat: nextCombatState,
        }),
        { announce: true },
      );

      return syncQuestObjectivesForAction(state, postCombatState, {
        type: "reposition",
        targetLane,
      });
    }

    case "PLAYER_SET_COMBAT_STANCE": {
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") return state;
      const stance = String(action.payload?.stance || "").trim().toLowerCase();
      if (!["open", "focused", "guarded"].includes(stance)) {
        return state;
      }
      if (combatState.stance === stance) {
        return state;
      }

      return syncQuestObjectivesForAction(
        state,
        {
          ...state,
          combat: {
            ...combatState,
            stance,
            log: [
              ...(combatState.log || []),
              `${state?.player?.name || "You"} settle into ${stance} stance.`,
            ],
          },
        },
        {
          type: "stance",
          stance,
        },
      );
    }

    case "DUNGEON_START_RUN":
      return normalizeGameState(startDungeonRun(state, action.payload || {}));

    case "DUNGEON_COMPLETE_ROOM":
      return normalizeGameState(completeCurrentDungeonRoom(state));

    case "DUNGEON_ADVANCE_ROOM":
      return normalizeGameState(advanceDungeonRoom(state));

    case "DUNGEON_ABANDON_RUN":
      return normalizeGameState(abandonDungeonRun(state));

    case "PLAYER_ESCAPE": {
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") return state;
      const result = escapeCombat({ ...state, combat: combatState });
      const escapedState = result.state || state;
      return syncQuestObjectivesForAction(state, escapedState, {
        type: "escape",
      });
    }

    case "PLAYER_START_COMBAT": {
      const enemyIds = action.payload?.enemyIds || [];
      return startCombat(state, enemyIds);
    }

    default:
      return null;
  }
}
