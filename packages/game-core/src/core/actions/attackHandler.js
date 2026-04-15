import { DEFAULT_START_LOCATION_ID } from "../../world/WorldDataRegistry.js";
import {
  getAttackEncounterPools,
  resolveEncounterZoneId,
} from "../../world/WorldEncounterProfiles.js";
import {
  startCombat,
  playerAttack,
  processEnemyTurns,
} from "../../systems/combat/CombatSystem.js";

function resolveEncounterSelection(state) {
  const biome = resolveEncounterZoneId(state?.world?.location?.biome);
  const locationId =
    state?.world?.location?.current || DEFAULT_START_LOCATION_ID;
  const visitedCount = Array.isArray(state?.world?.location?.visited)
    ? state.world.location.visited.length
    : 1;
  const totalKills = Number(state?.player?.progress?.totalKills || 0);
  const director = state?.world?.vars?.combatDirector || {};
  const pools = getAttackEncounterPools(biome);

  let index =
    Math.abs(totalKills + visitedCount + String(locationId).length) % pools.length;
  const encounterId = `${biome}:${index}`;

  if (
    director?.lastEncounterId === encounterId &&
    Number.isFinite(Number(director?.repeatCount)) &&
    director.repeatCount > 0
  ) {
    index = (index + director.repeatCount) % pools.length;
  }

  return {
    encounterId: `${biome}:${index}`,
    enemyIds: pools[index] || pools[0],
  };
}

/**
 * Handle attack actions — start combat if needed, then perform player attack.
 * @param {object} state - Current game state
 * @param {object} action - The action object
 * @returns {{ newState: object, description: string, changes: object }|{ earlyReturn: object }}
 */
export function handleAttack(state, action) {
  const changes = {};
  let newState;
  let description;

  // If not already in combat, start combat and perform an opening strike.
  if (!state.combat || state.combat.status !== "active") {
    const encounterSelection =
      action.enemyIds && action.enemyIds.length > 0
        ? { encounterId: "manual", enemyIds: action.enemyIds }
        : resolveEncounterSelection(state);
    const engagedBaseState = startCombat(state, encounterSelection.enemyIds);
    const engagedState = {
      ...engagedBaseState,
      combat: {
        ...engagedBaseState.combat,
        spawnMeta: {
          encounterId: encounterSelection.encounterId,
          enemyIds: encounterSelection.enemyIds.slice(),
          biome: resolveEncounterZoneId(state?.world?.location?.biome),
        },
      },
    };
    if (
      !engagedState?.combat ||
      engagedState.combat.status !== "active"
    ) {
      return {
        earlyReturn: {
          success: false,
          reason: "Could not start combat encounter.",
          state,
        },
      };
    }

    const enemyNames = (engagedState.combat.enemies || [])
      .map((enemy) => enemy?.name)
      .filter(Boolean)
      .join(", ");
    const openerResult = playerAttack(
      engagedState,
      action.enemyIndex !== undefined ? action.enemyIndex : 0,
      action.skillId || null,
    );
    if (!openerResult.success) {
      newState = engagedState;
      description = enemyNames
        ? `Engaged combat with ${enemyNames}.`
        : "Engaged combat.";
    } else {
      newState = processEnemyTurns(openerResult.state);
      const targetName =
        engagedState.combat.enemies?.[
          action.enemyIndex !== undefined ? action.enemyIndex : 0
        ]?.name || "enemy";
      description = enemyNames
        ? `Engaged combat with ${enemyNames} and struck ${targetName}.`
        : `Engaged combat and struck ${targetName}.`;
      changes.damage = openerResult.damage;
    }
    changes.combatStarted = true;
  } else {
    const enemyIndex =
      action.enemyIndex !== undefined ? action.enemyIndex : 0;
    const result = playerAttack(
      state,
      enemyIndex,
      action.skillId || null,
    );
    if (!result.success) {
      return {
        earlyReturn: { success: false, reason: result.reason, state: state },
      };
    }
    newState = processEnemyTurns(result.state);
    const targetName =
      newState.combat.enemies?.[enemyIndex]?.name || "enemy";
    description = `Attacked ${targetName}`;
    changes.damage = result.damage;
  }

  return { newState, description, changes };
}
