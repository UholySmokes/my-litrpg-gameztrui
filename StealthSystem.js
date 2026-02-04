/**
 * StealthSystem.js
 * Manages detection logic, stealth states, and ambush bonuses.
 */

export const STEALTH_CONFIG = {
  baseDetection: 10,
  ambushMultiplier: 2.0,
  stealthBreakOnAttack: true
};

/**
 * Checks if an enemy detects the player.
 * @param {Object} player 
 * @param {Object} enemy 
 * @returns {boolean} True if detected
 */
export function checkDetection(player, enemy) {
  if (!player.isStealthed) return true;

  const enemyPerception = enemy.stats?.perception || STEALTH_CONFIG.baseDetection;
  const playerAgi = player.attributes?.agi || 0;
  
  // Racial bonus check
  const hasStealthBonus = player.race === 'shadow_walker' || player.race === 'assassin';
  const stealthScore = playerAgi * 2 * (hasStealthBonus ? 1.5 : 1.0);

  // Random factor (0-100)
  const roll = Math.random() * 100;
  
  // If stealth score + roll is lower than perception, detected
  // High stealth score makes detection harder
  return (stealthScore + roll) < enemyPerception;
}

/**
 * Calculates damage modifier for attacks from stealth.
 * @param {number} damage - Base damage
 * @param {boolean} isStealthed 
 * @returns {number} Modified damage
 */
export function applyAmbushDamage(damage, isStealthed) {
  return isStealthed ? Math.floor(damage * STEALTH_CONFIG.ambushMultiplier) : damage;
}

/**
 * Handles breaking stealth after an action.
 * @param {Object} player 
 * @param {Array} messages 
 * @returns {Object} Updated player properties
 */
export function breakStealth(player, messages = []) {
  if (player.isStealthed) {
    messages.push(`${player.name} emerges from the shadows!`);
    return { ...player, isStealthed: false };
  }
  return player;
}

export default { 
  checkDetection, 
  applyAmbushDamage, 
  breakStealth 
};