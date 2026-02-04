/**
 * RageSystem.js
 * Manages the Berserker class's Rage resource, generation, decay, and Enrage state.
 */

export const RAGE_CONFIG = {
  maxRage: 100,
  ragePerHit: 10,       // Gained when hitting an enemy
  ragePerDamaged: 15,   // Gained when taking damage
  rageDecayPerTurn: 5,  // Lost at end of turn
  enrageThreshold: 80,  // Rage required to enter Enrage
  enrageDamageMult: 1.5,
  enrageDefenseMult: 0.7
};

/**
 * Processes turn-based rage mechanics (decay and state updates).
 * @param {Object} player - The player entity
 * @param {Array} messages - Combat log array to push messages to
 * @returns {Object} Updated player object
 */
export function processRageTurn(player, messages = []) {
  if (player.class !== 'berserker') return player;

  // Initialize rage if missing
  if (typeof player.rage === 'undefined') player.rage = 0;

  // Apply Decay
  const oldRage = player.rage;
  player.rage = Math.max(0, player.rage - RAGE_CONFIG.rageDecayPerTurn);

  // Check Enrage State
  if (player.rage >= RAGE_CONFIG.enrageThreshold && !player.isEnraged) {
    player.isEnraged = true;
    messages.push(`🔥 ${player.name} enters a BLOOD RAGE!`);
  } else if (player.rage < RAGE_CONFIG.enrageThreshold && player.isEnraged) {
    player.isEnraged = false;
    messages.push(`${player.name}'s rage subsides.`);
  }

  return player;
}

/**
 * Calculates and applies rage gain from combat actions.
 * @param {Object} player - The player entity
 * @param {string} source - 'hit' or 'damaged'
 * @param {Array} messages - Combat log
 */
export function applyRageGain(player, source, messages = []) {
  if (player.class !== 'berserker') return;

  let gain = 0;
  if (source === 'hit') gain = RAGE_CONFIG.ragePerHit;
  if (source === 'damaged') gain = RAGE_CONFIG.ragePerDamaged;

  const oldRage = player.rage || 0;
  player.rage = Math.min(RAGE_CONFIG.maxRage, oldRage + gain);

  // Immediate Enrage check upon gaining rage
  if (player.rage >= RAGE_CONFIG.enrageThreshold && !player.isEnraged) {
    player.isEnraged = true;
    messages.push(`🔥 ${player.name} enters a BLOOD RAGE!`);
  }
}

export default { processRageTurn, applyRageGain, RAGE_CONFIG };