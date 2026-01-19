// =================================================================
// RAGE SYSTEM - Berserker Class Mechanic
// Implements rage resource, enrage state, and rage-based abilities
// =================================================================

import { emit } from "../../core/EventBus.js";

/**
 * RAGE CONFIGURATION
 */
const RAGE_CONFIG = {
  maxRage: 100,
  ragePerHit: 10,
  ragePerDamaged: 15,
  rageDecayPerTurn: 5,
  enrageThreshold: 80,
  enrageDamageMultiplier: 1.5,
  enrageDefenseMultiplier: 0.7,
};

const getRageValue = (player) =>
  player?.resources?.rage ?? player?.rage ?? 0;

const setRageValue = (player, value) => ({
  ...player,
  rage: value,
  resources: {
    ...(player.resources || {}),
    rage: value,
  },
});

/**
 * Initialize rage for berserker
 * @param {object} player - Player object
 * @returns {object} Updated player with rage initialized
 */
export function initializeRage(player) {
  if (player.class === "berserker" || player.class?.id === "berserker") {
    return {
      ...player,
      rage: 0,
      resources: {
        ...(player.resources || {}),
        rage: 0,
      },
      isEnraged: false,
      rageMultipliers: {
        damage: 1.0,
        defense: 1.0,
      },
    };
  }
  return player;
}

/**
 * Gain rage on hit or damage
 * @param {object} player - Player object
 * @param {number} amount - Amount of rage to gain
 * @param {string} reason - Reason for rage gain
 * @returns {object} Updated player
 */
export function gainRage(player, amount, reason = "unknown") {
  const classId = player.class?.id || player.class;
  if (classId !== "berserker") return player;

  const delta = Math.max(0, amount);
  const currentRage = getRageValue(player);
  const nextRage = Math.min(RAGE_CONFIG.maxRage, currentRage + delta);
  const updated = setRageValue(player, nextRage);

  if (delta > 0) {
    emit("rage:gain", { player: player.name, amount: delta, reason });
  }

  return updated;
}

/**
 * Consume rage
 * @param {object} player - Player object
 * @param {number|string} amount - Amount of rage to consume (or 'all')
 * @returns {object} { success: boolean, player: object, consumed: number }
 */
export function consumeRage(player, amount) {
  const classId = player.class?.id || player.class;
  if (classId !== "berserker") {
    return { success: false, player, consumed: 0 };
  }

  const currentRage = getRageValue(player);
  const consumeAmount = amount === "all" ? currentRage : Math.max(0, amount);

  if (consumeAmount > currentRage) {
    return { success: false, player, consumed: 0 };
  }

  const nextRage = Math.max(0, currentRage - consumeAmount);
  return {
    success: true,
    player: setRageValue(player, nextRage),
    consumed: consumeAmount,
  };
}

/**
 * Process rage decay per turn
 * @param {object} player - Player object
 * @returns {object} Updated player
 */
export function processRageDecay(player) {
  const classId = player.class?.id || player.class;
  if (classId !== "berserker") return player;

  const currentRage = getRageValue(player);
  const decayAmount = Math.min(currentRage, RAGE_CONFIG.rageDecayPerTurn);
  if (decayAmount <= 0) return player;

  return setRageValue(player, currentRage - decayAmount);
}

/**
 * Get rage multipliers for damage calculation
 * @param {object} player - Player object
 * @returns {object} { damage: number, defense: number }
 */
export function getRageMultipliers(player) {
  const classId = player.class?.id || player.class;
  if (classId !== "berserker" || !player.isEnraged) {
    return { damage: 1.0, defense: 1.0 };
  }

  return (
    player.rageMultipliers || {
      damage: RAGE_CONFIG.enrageDamageMultiplier,
      defense: RAGE_CONFIG.enrageDefenseMultiplier,
    }
  );
}

/**
 * Check if player can use rage ability
 * @param {object} player - Player object
 * @param {number|string} rageCost - Rage cost of ability
 * @returns {boolean} True if can use
 */
export function canUseRageAbility(player, rageCost) {
  const classId = player.class?.id || player.class;
  if (classId !== "berserker") return false;

  const currentRage = getRageValue(player);
  if (rageCost === "all") return currentRage > 0;

  return currentRage >= rageCost;
}

/**
 * Get rage percentage
 * @param {object} player - Player object
 * @returns {number} Rage percentage (0-100)
 */
export function getRagePercentage(player) {
  const classId = player.class?.id || player.class;
  if (classId !== "berserker") return 0;

  const currentRage = getRageValue(player);
  return Math.floor((currentRage / RAGE_CONFIG.maxRage) * 100);
}

/**
 * Reset rage (for combat end)
 * @param {object} player - Player object
 * @returns {object} Updated player
 */
export function resetRage(player) {
  const classId = player.class?.id || player.class;
  if (classId !== "berserker") return player;

  return setRageValue(player, 0);
}
