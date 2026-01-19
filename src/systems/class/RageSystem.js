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
 * Gain rage via dispatch (deterministic)
 * @param {function} dispatch - Redux-like dispatch function
 * @param {object} player - Player object
 * @param {number} amount - Amount of rage to gain
 * @param {string} reason - Reason for rage gain
 */
export function gainRage(dispatch, player, amount, reason = "unknown") {
  const classId = player.class?.id || player.class;
  if (classId !== "berserker") return;

  const delta = Math.max(0, amount);

  // Dispatch resource update to reducer
  dispatch({
    type: "UPDATE_RESOURCES",
    payload: { rage: delta },
  });

  // Note: Enrage logic should be moved to observer or handled separately
  // For now, we'll keep the event emission for UI feedback
  if (amount > 0) {
    emit("rage:gain", { player: player.name, amount, reason });
  }
}

/**
 * Consume rage via dispatch (deterministic)
 * @param {function} dispatch - Redux-like dispatch function
 * @param {object} player - Player object
 * @param {number} amount - Amount of rage to consume (or 'all')
 * @returns {boolean} Success
 */
export function consumeRage(dispatch, player, amount) {
  const classId = player.class?.id || player.class;
  if (classId !== "berserker") return false;

  const currentRage = player.resources?.rage || 0;

  // Handle 'all' consumption
  const consumeAmount = amount === "all" ? currentRage : Math.max(0, amount);

  if (consumeAmount > currentRage) return false;

  // Dispatch negative delta to reducer
  dispatch({
    type: "UPDATE_RESOURCES",
    payload: { rage: -consumeAmount },
  });

  return true;
}

/**
 * Process rage decay per turn (now uses dispatch)
 * @param {function} dispatch - Redux-like dispatch function
 * @param {object} player - Player object
 */
export function processRageDecay(dispatch, player) {
  const classId = player.class?.id || player.class;
  if (classId !== "berserker") return;

  const currentRage = player.resources?.rage || 0;
  const decayAmount = Math.min(currentRage, RAGE_CONFIG.rageDecayPerTurn);

  if (decayAmount > 0) {
    dispatch({
      type: "UPDATE_RESOURCES",
      payload: { rage: -decayAmount },
    });
  }
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
 * @param {number} rageCost - Rage cost of ability
 * @returns {boolean} True if can use
 */
export function canUseRageAbility(player, rageCost) {
  const classId = player.class?.id || player.class;
  if (classId !== "berserker") return false;

  const currentRage = player.resources?.rage || 0;

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

  const currentRage = player.resources?.rage || 0;
  return Math.floor((currentRage / RAGE_CONFIG.maxRage) * 100);
}

/**
 * Reset rage (for combat end)
 * @param {object} player - Player object
 * @returns {object} Updated player
 */
export function resetRage(dispatch, player) {
  const classId = player.class?.id || player.class;
  if (classId !== "berserker") return;

  // Reset rage to 0 via reducer
  dispatch({
    type: "UPDATE_RESOURCES",
    payload: { rage: -(player.resources?.rage || 0) },
  });
}
