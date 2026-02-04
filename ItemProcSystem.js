/**
 * ItemProcSystem.js
 * Handles special effects (procs) from Legendary and Unique items.
 */

/**
 * Checks and applies weapon procs on hit.
 * @param {Object} attacker 
 * @param {Object} defender 
 * @param {number} damageDealt 
 * @param {Array} messages 
 * @returns {Object} Result containing extra damage or effects
 */
export function processWeaponProcs(attacker, defender, damageDealt, messages = []) {
  const weapon = attacker.equipment?.weapon;
  if (!weapon || !weapon.uniquePassive || !weapon.uniquePassive.proc) return {};

  const proc = weapon.uniquePassive.proc;
  const roll = Math.random();

  if (roll <= proc.chance) {
    return applyProcEffect(proc, attacker, defender, damageDealt, messages);
  }

  return {};
}

function applyProcEffect(proc, attacker, defender, damageDealt, messages) {
  const result = { extraDamage: 0, effects: [] };

  switch (proc.effect) {
    case 'true_damage':
      // Ignores defense
      result.extraDamage = Math.floor(damageDealt * (proc.multiplier || 0.5));
      messages.push(`✨ ${attacker.name}'s weapon cuts reality! (+${result.extraDamage} True Dmg)`);
      break;

    case 'lifesteal':
      const healAmount = Math.floor(damageDealt * (proc.multiplier || 0.2));
      // Assuming attacker has hp object structure
      if (attacker.hp) {
        attacker.hp.current = Math.min(attacker.hp.max, attacker.hp.current + healAmount);
        messages.push(`🩸 ${attacker.name} drains ${healAmount} life!`);
      }
      break;

    case 'chain_lightning':
      result.extraDamage = 20; // Flat bonus for single target fallback
      messages.push(`⚡ Lightning arcs from the blade!`);
      break;
  }

  return result;
}

export default { processWeaponProcs };