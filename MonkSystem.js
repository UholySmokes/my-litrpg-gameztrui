/**
 * MonkSystem.js
 * Handles Chi resource, Combo counters, and Unarmed damage scaling.
 */

export const MONK_CONFIG = {
  maxChi: 100,
  baseUnarmedDamage: 5,
  comboDecayTurns: 1,
  comboMultipliers: [1.0, 1.1, 1.25, 1.5, 2.0] // 1 to 5 hits
};

/**
 * Calculates unarmed damage based on level and attributes.
 * @param {Object} player 
 * @returns {number} Base damage
 */
export function calculateMonkDamage(player) {
  if (player.class !== 'monk') return 0;

  const levelScaling = player.level * 2;
  const str = player.attributes?.str || 0;
  const dex = player.attributes?.dex || 0;
  const attributeBonus = (str + dex) / 2;

  return Math.floor(MONK_CONFIG.baseUnarmedDamage + levelScaling + attributeBonus);
}

/**
 * Gets the current damage multiplier based on combo count.
 * @param {Object} player 
 * @returns {number} Multiplier (e.g., 1.5)
 */
export function getComboMultiplier(player) {
  if (player.class !== 'monk' || !player.comboCount) return 1.0;
  
  const index = Math.min(player.comboCount, MONK_CONFIG.comboMultipliers.length) - 1;
  return MONK_CONFIG.comboMultipliers[Math.max(0, index)];
}

/**
 * Updates combo state after an attack.
 * @param {Object} player 
 * @param {boolean} isHit - Did the attack hit?
 */
export function updateCombo(player, isHit) {
  if (player.class !== 'monk') return;

  if (isHit) {
    player.comboCount = (player.comboCount || 0) + 1;
    // Cap combo count at max multiplier index + 1
    if (player.comboCount > MONK_CONFIG.comboMultipliers.length) {
      player.comboCount = MONK_CONFIG.comboMultipliers.length;
    }
  } else {
    // Miss breaks combo
    player.comboCount = 0;
  }
}

export default {
  calculateMonkDamage,
  getComboMultiplier,
  updateCombo
};