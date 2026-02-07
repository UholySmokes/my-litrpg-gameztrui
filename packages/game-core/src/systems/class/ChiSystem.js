// =================================================================
// CHI SYSTEM — Data-Driven Resource Mechanic
// Any class whose resourceSystem === 'chi' is handled automatically.
// No hardcoded class-name checks.
// =================================================================

import { emit } from "../../core/EventBus.js";
import {
  ensureAttributeShape,
  getAttributeValue,
} from "../../utils/AttributeMath.js";
import { SimBridge } from "../../simulation/bridge/SimulationContext.js";
import { getClassById } from "../../data/registries/ClassDataRegistry.js";

/**
 * CHI CONFIGURATION
 */
const CHI_CONFIG = {
  maxChi: 100,
  chiPerHit: 15,
  chiPerMeditate: 30,
  chiDecayOutOfCombat: 0, // Chi persists
  comboMultipliers: [1.0, 1.1, 1.25, 1.5, 2.0], // 1-5 hit combo
  comboResetOnMiss: true,
  comboResetOnDamage: true,
  unarmedDamageBase: 5,
  unarmedDamagePerLevel: 2,
  unarmedDamagePerStr: 0.5,
  unarmedDamagePerDex: 0.5,
};

/**
 * Data-driven chi check — looks up the class registry.
 * @param {object} entity
 * @returns {boolean}
 */
function usesChi(entity) {
  const classId = entity.class?.id || entity.class;
  if (!classId) return false;
  const classData = getClassById(classId);
  return classData?.resourceSystem === 'chi';
}

const getChiValue = (player) => player?.resources?.chi ?? player?.chi ?? 0;

const setChiValue = (player, value) => ({
  ...player,
  chi: value,
  resources: {
    ...(player.resources || {}),
    chi: value,
  },
});

/**
 * Initialize chi for any chi-based class
 * @param {object} player - Player object
 * @returns {object} Updated player with chi initialized
 */
export function initializeChi(player) {
  if (usesChi(player)) {
    return {
      ...setChiValue(player, CHI_CONFIG.maxChi),
      comboCount: 0,
      lastComboTime: 0,
    };
  }
  return player;
}

/**
 * Gain chi
 * @param {object} player - Player object
 * @param {number} amount - Amount of chi to gain
 * @param {string} reason - Reason for chi gain
 * @returns {object} Updated player
 */
function gainChi(player, amount, reason = "unknown") {
  if (!usesChi(player)) return player;

  const delta = Math.max(0, amount);
  const currentChi = getChiValue(player);
  const nextChi = Math.min(CHI_CONFIG.maxChi, currentChi + delta);
  const updated = setChiValue(player, nextChi);

  if (delta > 0) {
    emit("chi:gain", {
      player: player.name,
      amount: delta,
      reason,
      newChi: nextChi,
    });
  }

  return updated;
}

/**
 * Consume chi
 * @param {object} player - Player object
 * @param {number} amount - Amount of chi to consume
 * @returns {object} { success, player, consumed, reason }
 */
function consumeChi(player, amount) {
  if (!usesChi(player)) {
    return { success: false, player, consumed: 0, reason: "Class does not use chi" };
  }

  const currentChi = getChiValue(player);

  if (amount > currentChi) {
    return {
      success: false,
      player,
      consumed: 0,
      reason: `Insufficient chi (${currentChi}/${amount})`,
    };
  }

  const nextChi = currentChi - amount;
  return {
    success: true,
    player: setChiValue(player, nextChi),
    consumed: amount,
    reason: "",
  };
}

// Legacy functions kept for compatibility
export function gainChiLegacy(player, amount, reason = "unknown") {
  return gainChi(player, amount, reason);
}

/**
 * Legacy consume chi - kept for compatibility
 * @param {object} player - Player object
 * @param {number} amount - Amount of chi to consume
 * @returns {object} { success: boolean, player: object, consumed: number, reason: string }
 */
export function consumeChiLegacy(player, amount) {
  if (!usesChi(player)) {
    return { success: false, player, consumed: 0, reason: "Class does not use chi" };
  }

  const currentChi = getChiValue(player);

  if (currentChi < amount) {
    return {
      success: false,
      player,
      consumed: 0,
      reason: `Insufficient chi (${currentChi}/${amount})`,
    };
  }

  const newChi = currentChi - amount;

  emit("chi:consume", { player: player.name, amount, newChi });

  return {
    success: true,
    player: setChiValue(player, newChi),
    consumed: amount,
    reason: "",
  };
}

/**
 * Calculate unarmed damage for chi-based classes
 * @param {object} player - Player object
 * @returns {number} Unarmed damage value
 */
function calculateUnarmedDamage(player) {
  if (!usesChi(player)) return 0;

  const level = player.level || 1;
  const normalizedAttributes = ensureAttributeShape(player.attributes, 5);
  const str = getAttributeValue(normalizedAttributes, "strength") || 5;
  const dex = getAttributeValue(normalizedAttributes, "dexterity") || 5;

  const baseDamage = CHI_CONFIG.unarmedDamageBase;
  const levelScaling = level * CHI_CONFIG.unarmedDamagePerLevel;
  const strBonus = Math.floor(str * CHI_CONFIG.unarmedDamagePerStr);
  const dexBonus = Math.floor(dex * CHI_CONFIG.unarmedDamagePerDex);

  return baseDamage + levelScaling + strBonus + dexBonus;
}

/**
 * Process combo hit
 * @param {object} player - Player object
 * @returns {object} { player: object, multiplier: number, comboCount: number }
 */
function processComboHit(player) {
  if (!usesChi(player)) {
    return { player, multiplier: 1.0, comboCount: 0 };
  }

  const currentCombo = player.comboCount || 0;
  const newCombo = Math.min(
    currentCombo + 1,
    CHI_CONFIG.comboMultipliers.length,
  );

  const comboIndex = Math.min(
    newCombo - 1,
    CHI_CONFIG.comboMultipliers.length - 1,
  );
  const multiplier = CHI_CONFIG.comboMultipliers[comboIndex];

  emit("chi:combo", {
    player: player.name,
    comboCount: newCombo,
    multiplier,
  });

  return {
    player: {
      ...player,
      comboCount: newCombo,
      lastComboTime: SimBridge.now(),
    },
    multiplier,
    comboCount: newCombo,
  };
}

/**
 * Reset combo (on miss or damage taken)
 * @param {object} player - Player object
 * @param {string} reason - Reason for reset
 * @returns {object} Updated player
 */
export function resetCombo(player, reason = "unknown") {
  if (!usesChi(player) || player.comboCount === 0) {
    return player;
  }

  emit("chi:comboBreak", {
    player: player.name,
    reason,
    lostCombo: player.comboCount,
  });

  return {
    ...player,
    comboCount: 0,
  };
}

/**
 * Get current combo multiplier
 * @param {object} player - Player object
 * @returns {number} Current combo multiplier
 */
export function getComboMultiplier(player) {
  if (!usesChi(player)) return 1.0;

  const comboCount = player.comboCount || 0;
  if (comboCount === 0) return 1.0;

  const comboIndex = Math.min(
    comboCount - 1,
    CHI_CONFIG.comboMultipliers.length - 1,
  );
  return CHI_CONFIG.comboMultipliers[comboIndex];
}

/**
 * Meditate to restore chi (out of combat)
 * @param {object} state - Current game state
 * @returns {object} Result with updated state
 */
export function meditate(state) {
  const player = state.player;

  if (!usesChi(player)) {
    return {
      success: false,
      reason: "Only chi-based classes can meditate",
      state,
      chiGained: 0,
    };
  }

  // Cannot meditate in combat
  if (state.combat?.status === "active") {
    return {
      success: false,
      reason: "Cannot meditate during combat",
      state,
      chiGained: 0,
    };
  }

  const currentChi = getChiValue(player);
  const chiGained = Math.min(
    CHI_CONFIG.chiPerMeditate,
    CHI_CONFIG.maxChi - currentChi,
  );
  const newChi = currentChi + chiGained;

  emit("chi:meditate", { player: player.name, chiGained, newChi });

  return {
    success: true,
    reason: "",
    chiGained,
    state: {
      ...state,
      player: setChiValue(player, newChi),
    },
  };
}

/**
 * Check if player can afford chi ability
 * @param {object} player - Player object
 * @param {number} chiCost - Chi cost of ability
 * @returns {object} { canAfford: boolean, reason: string }
 */
export function canAffordChiAbility(player, chiCost) {
  if (!usesChi(player)) {
    return { canAfford: false, reason: "Class does not use chi" };
  }

  const currentChi = getChiValue(player);

  if (currentChi < chiCost) {
    return {
      canAfford: false,
      reason: `Insufficient chi (${currentChi}/${chiCost})`,
    };
  }

  return { canAfford: true, reason: "" };
}

/**
 * Execute chi ability
 * @param {object} state - Current game state
 * @param {object} ability - Ability definition with chiCost
 * @returns {object} { success: boolean, state: object, reason: string }
 */
export function executeChiAbility(state, ability) {
  const player = state.player;

  const affordCheck = canAffordChiAbility(player, ability.chiCost);
  if (!affordCheck.canAfford) {
    return { success: false, state, reason: affordCheck.reason };
  }

  // Consume chi
  const consumption = consumeChi(player, ability.chiCost);
  if (!consumption.success) {
    return { success: false, state, reason: consumption.reason };
  }

  const combatLog = state.combat?.log ? [...state.combat.log] : [];
  combatLog.push(
    `☯️ ${player.name} uses ${ability.name}! (-${ability.chiCost} Chi)`,
  );

  return {
    success: true,
    state: {
      ...state,
      player: consumption.player,
      combat: state.combat
        ? {
            ...state.combat,
            log: combatLog,
          }
        : state.combat,
    },
    reason: "",
  };
}

/**
 * Get chi status for UI display
 * @param {object} player - Player object
 * @returns {object|null} Chi status info
 */
export function getChiStatus(player) {
  if (!usesChi(player)) {
    return null;
  }

  const currentChi = getChiValue(player);
  return {
    current: currentChi,
    max: CHI_CONFIG.maxChi,
    percentage: Math.floor((currentChi / CHI_CONFIG.maxChi) * 100),
    comboCount: player.comboCount || 0,
    comboMultiplier: getComboMultiplier(player),
    unarmedDamage: calculateUnarmedDamage(player),
  };
}

/**
 * Process chi on successful hit
 * @param {object} player - Player object
 * @returns {object} Updated player with chi gain and combo
 */
export function processChiOnHit(player) {
  if (!usesChi(player)) return player;

  // Gain chi
  let updatedPlayer = gainChi(player, CHI_CONFIG.chiPerHit, "hit_enemy");

  // Process combo
  const comboResult = processComboHit(updatedPlayer);

  return comboResult.player;
}

/**
 * Reset chi state (for new game/character)
 * @param {object} player - Player object
 * @returns {object} Updated player
 */
export function resetChi(player) {
  if (!usesChi(player)) return player;

  return {
    ...setChiValue(player, CHI_CONFIG.maxChi),
    comboCount: 0,
    lastComboTime: 0,
  };
}
