// =================================================================
// CHARM & ILLUSION SYSTEM
// Handles charm, confuse, and illusion mechanics for Fae Touched, Bard
// =================================================================

import { emit } from "../../core/EventBus.js";
import { hasRaceTag } from "../../data/registries/RaceDataRegistry.js";
import {
  ensureAttributeShape,
  getAttributeValue,
} from "../../utils/AttributeMath.js";
import { getEffectiveAttributes } from "../titles/TitleSystem.js";
import { random, randomChoice } from "../../utils/DeterministicRandom.js";
import { SimBridge } from "../../simulation/bridge/SimulationBridge.js";

/**
 * CHARM CONFIGURATION
 */
const CHARM_CONFIG = {
  baseCharmChance: 0.5,
  charmDurationBase: 3,
  maxCharmedEnemies: 2,
  charmClasses: ["bard", "maestro"],
  charmRaces: ["fae_touched"],
};

/**
 * ILLUSION CONFIGURATION
 */
const ILLUSION_CONFIG = {
  maxIllusions: 3,
  illusionDurationBase: 5,
  illusionHp: 1, // One-hit
  decoyTargetChance: 0.3, // 30% chance enemy targets decoy
};

/**
 * Check if entity can use charm abilities
 * @param {object} entity - Entity to check
 * @returns {boolean} True if can charm
 */
function canCharm(entity) {
  const classId = entity.class?.id || entity.class;
  const raceId = entity.race?.id || entity.race;

  const hasCharmClass = CHARM_CONFIG.charmClasses.includes(classId);
  const hasCharmRace = CHARM_CONFIG.charmRaces.includes(raceId);
  const hasCharmTalent = entity.talents?.includes("enchanter");

  return hasCharmClass || hasCharmRace || hasCharmTalent;
}

/**
 * Attempt to charm an enemy
 * @param {object} state - Current game state
 * @param {number} enemyIndex - Index of enemy to charm
 * @param {number} charmPower - Power of charm (affects success chance)
 * @returns {object} Result with updated state
 */
export function attemptCharm(state, enemyIndex, charmPower = 1.0) {
  const player = state.player;
  const enemy = state.combat?.enemies?.[enemyIndex];

  if (!enemy) {
    return { success: false, reason: "Invalid target", state };
  }

  if (!canCharm(player)) {
    return { success: false, reason: "Cannot use charm abilities", state };
  }

  // Check if already charmed
  if (enemy.isCharmed) {
    return { success: false, reason: "Target already charmed", state };
  }

  // Check charm limit
  const charmedCount = state.combat.enemies.filter((e) => e.isCharmed).length;
  if (charmedCount >= CHARM_CONFIG.maxCharmedEnemies) {
    return { success: false, reason: "Maximum charmed enemies reached", state };
  }

  // Calculate charm chance
  const baseAttributeValue = state.config?.baseAttributeValue ?? 5;
  const normalizedAttributes = ensureAttributeShape(
    player.attributes,
    baseAttributeValue,
  );
  const effectiveAttributes = getEffectiveAttributes(
    { ...player, attributes: normalizedAttributes },
    { ...state.config, baseAttributeValue },
    normalizedAttributes,
  );
  const playerCha =
    getAttributeValue(effectiveAttributes, "charisma") || baseAttributeValue;
  const enemyWill = enemy.stats?.will || enemy.stats?.int || enemy.level || 5;

  // Fae Touched bonus
  const raceId = player.race?.id || player.race;
  const raceBonus =
    hasRaceTag(raceId, "CHARM_BOOST") || raceId === "fae_touched" ? 0.2 : 0;

  const charmChance = Math.min(
    0.9,
    Math.max(
      0.1,
      CHARM_CONFIG.baseCharmChance * (playerCha / enemyWill) * charmPower +
        raceBonus,
    ),
  );

  const roll = random();
  const combatLog = [...state.combat.log];

  if (roll < charmChance) {
    // Charm successful
    const newEnemies = [...state.combat.enemies];
    newEnemies[enemyIndex] = {
      ...enemy,
      isCharmed: true,
      charmDuration: CHARM_CONFIG.charmDurationBase,
      originalTeam: "enemy",
      currentTeam: "player",
      charmerId: player.id || "player",
    };

    combatLog.push(
      `✨ ${player.name} charms ${enemy.name}! They fight for you now!`,
    );
    emit("charm:success", { player: player.name, target: enemy.name });

    return {
      success: true,
      state: {
        ...state,
        combat: {
          ...state.combat,
          enemies: newEnemies,
          log: combatLog,
        },
      },
    };
  } else {
    // Charm resisted
    combatLog.push(`❌ ${enemy.name} resists ${player.name}'s charm!`);
    emit("charm:resist", { player: player.name, target: enemy.name });

    return {
      success: false,
      reason: "Target resisted charm",
      state: {
        ...state,
        combat: {
          ...state.combat,
          log: combatLog,
        },
      },
    };
  }
}

/**
 * Process charm duration decay
 * @param {object} state - Current game state
 * @returns {object} Updated state
 */
export function processCharmDuration(state) {
  if (!state.combat?.enemies) return state;

  let combatLog = [...state.combat.log];

  const newEnemies = state.combat.enemies.map((enemy) => {
    if (!enemy.isCharmed) return enemy;

    const newDuration = enemy.charmDuration - 1;

    if (newDuration <= 0) {
      combatLog.push(`💔 ${enemy.name}'s charm fades. They are hostile again!`);
      emit("charm:expire", { target: enemy.name });

      return {
        ...enemy,
        isCharmed: false,
        charmDuration: 0,
        currentTeam: enemy.originalTeam,
        charmerId: null,
      };
    }

    return {
      ...enemy,
      charmDuration: newDuration,
    };
  });

  return {
    ...state,
    combat: {
      ...state.combat,
      enemies: newEnemies,
      log: combatLog,
    },
  };
}

/**
 * Get charmed enemy action (attacks other enemies)
 * @param {object} state - Current game state
 * @param {object} charmedEnemy - The charmed enemy
 * @returns {object} Updated state after charmed enemy acts
 */
export function processCharmedEnemyAction(state, charmedEnemy) {
  if (!charmedEnemy.isCharmed) return state;

  // Find hostile enemies (not charmed)
  const hostileEnemies = state.combat.enemies.filter(
    (e) => !e.isCharmed && e.stats.hp.current > 0 && e.id !== charmedEnemy.id,
  );

  if (hostileEnemies.length === 0) return state;

  // Attack random hostile enemy
  const target = randomChoice(hostileEnemies);
  const targetIndex = state.combat.enemies.findIndex((e) => e.id === target.id);

  // Calculate damage
  const damage = Math.max(
    1,
    (charmedEnemy.stats.attack || 10) -
      Math.floor((target.stats.defense || 0) / 2),
  );

  const newEnemies = [...state.combat.enemies];
  newEnemies[targetIndex] = {
    ...target,
    stats: {
      ...target.stats,
      hp: {
        ...target.stats.hp,
        current: Math.max(0, target.stats.hp.current - damage),
      },
    },
  };

  const combatLog = [
    ...state.combat.log,
    `💕 ${charmedEnemy.name} attacks ${target.name} for ${damage} damage!`,
  ];

  emit("charm:attack", {
    charmed: charmedEnemy.name,
    target: target.name,
    damage,
  });

  return {
    ...state,
    combat: {
      ...state.combat,
      enemies: newEnemies,
      log: combatLog,
    },
  };
}

/**
 * Create an illusion/decoy
 * @param {object} state - Current game state
 * @param {string} illusionType - Type of illusion ('decoy', 'mirror_image')
 * @returns {object} Result with updated state
 */
export function createIllusion(state, illusionType = "decoy") {
  const player = state.player;

  if (!canCharm(player)) {
    return { success: false, reason: "Cannot create illusions", state };
  }

  const currentIllusions = player.illusions || [];
  if (currentIllusions.length >= ILLUSION_CONFIG.maxIllusions) {
    return { success: false, reason: "Maximum illusions reached", state };
  }

  const illusion = {
    id: `illusion_${SimBridge.now()}_${random().toString(36).substr(2, 5)}`,
    name: `${player.name}'s ${illusionType === "mirror_image" ? "Mirror Image" : "Decoy"}`,
    type: illusionType,
    hp: ILLUSION_CONFIG.illusionHp,
    duration: ILLUSION_CONFIG.illusionDurationBase,
    ownerId: player.id || "player",
    isIllusion: true,
  };

  const combatLog = state.combat?.log ? [...state.combat.log] : [];
  combatLog.push(`✨ ${player.name} creates a ${illusion.name}!`);

  emit("illusion:create", { player: player.name, type: illusionType });

  return {
    success: true,
    state: {
      ...state,
      player: {
        ...player,
        illusions: [...currentIllusions, illusion],
      },
      combat: state.combat
        ? {
            ...state.combat,
            log: combatLog,
          }
        : state.combat,
    },
  };
}

/**
 * Check if enemy should target illusion instead of player
 * @param {object} player - Player object
 * @returns {object|null} Illusion to target, or null
 */
export function checkIllusionTarget(player) {
  const illusions = player.illusions || [];
  const activeIllusions = illusions.filter((i) => i.hp > 0 && i.duration > 0);

  if (activeIllusions.length === 0) return null;

  // Chance to target illusion instead
  if (random() < ILLUSION_CONFIG.decoyTargetChance * activeIllusions.length) {
    return randomChoice(activeIllusions);
  }

  return null;
}

/**
 * Damage an illusion (destroys it)
 * @param {object} state - Current game state
 * @param {string} illusionId - ID of illusion to damage
 * @returns {object} Updated state
 */
export function damageIllusion(state, illusionId) {
  const player = state.player;
  const illusions = player.illusions || [];
  const illusion = illusions.find((i) => i.id === illusionId);

  if (!illusion) return state;

  const combatLog = state.combat?.log ? [...state.combat.log] : [];
  combatLog.push(`💨 ${illusion.name} shatters into nothing!`);

  emit("illusion:destroy", { illusion: illusion.name });

  return {
    ...state,
    player: {
      ...player,
      illusions: illusions.filter((i) => i.id !== illusionId),
    },
    combat: state.combat
      ? {
          ...state.combat,
          log: combatLog,
        }
      : state.combat,
  };
}

/**
 * Process illusion duration decay
 * @param {object} state - Current game state
 * @returns {object} Updated state
 */
export function processIllusionDuration(state) {
  const player = state.player;
  const illusions = player.illusions || [];

  if (illusions.length === 0) return state;

  let combatLog = state.combat?.log ? [...state.combat.log] : [];

  const updatedIllusions = illusions
    .map((illusion) => {
      const newDuration = illusion.duration - 1;

      if (newDuration <= 0) {
        combatLog.push(`💨 ${illusion.name} fades away...`);
        emit("illusion:expire", { illusion: illusion.name });
        return null;
      }

      return { ...illusion, duration: newDuration };
    })
    .filter((i) => i !== null);

  return {
    ...state,
    player: {
      ...player,
      illusions: updatedIllusions,
    },
    combat: state.combat
      ? {
          ...state.combat,
          log: combatLog,
        }
      : state.combat,
  };
}

/**
 * Get charm/illusion status for UI
 * @param {object} player - Player object
 * @param {object} combat - Combat state
 * @returns {object} Status info
 */
export function getCharmStatus(player, combat) {
  const charmedEnemies = combat?.enemies?.filter((e) => e.isCharmed) || [];
  const illusions = player.illusions || [];

  return {
    canCharm: canCharm(player),
    charmedCount: charmedEnemies.length,
    maxCharmed: CHARM_CONFIG.maxCharmedEnemies,
    charmedEnemies: charmedEnemies.map((e) => ({
      name: e.name,
      duration: e.charmDuration,
    })),
    illusionCount: illusions.length,
    maxIllusions: ILLUSION_CONFIG.maxIllusions,
    illusions: illusions.map((i) => ({
      name: i.name,
      type: i.type,
      duration: i.duration,
    })),
  };
}

/**
 * Reset charm/illusion state (for combat end)
 * @param {object} state - Current game state
 * @returns {object} Updated state
 */
export function resetCharmState(state) {
  // Remove charm from all enemies
  const newEnemies =
    state.combat?.enemies?.map((enemy) => ({
      ...enemy,
      isCharmed: false,
      charmDuration: 0,
      currentTeam: enemy.originalTeam || "enemy",
      charmerId: null,
    })) || [];

  return {
    ...state,
    player: {
      ...state.player,
      illusions: [],
    },
    combat: state.combat
      ? {
          ...state.combat,
          enemies: newEnemies,
        }
      : state.combat,
  };
}
