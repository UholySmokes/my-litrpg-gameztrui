/**
 * CombatSystem.js
 * Orchestrates combat logic, integrating class systems, stealth, and item effects.
 */

import { emit } from '../../core/EventBus.js';
import RageSystem from '../class/RageSystem.js';
import MonkSystem from '../class/MonkSystem.js';
import StealthSystem from '../StealthSystem.js';
import ItemProcSystem from '../ItemProcSystem.js';

const COMBAT_CONFIG = {
  baseAttackDamage: 5,
  criticalHitMultiplier: 1.5,
  defenseReductionFactor: 0.5,
  baseLuckCritChance: 0.01
};

/**
 * Calculates damage for a standard attack.
 * @param {Object} attacker 
 * @param {Object} defender 
 * @param {Array} messages - Log array
 * @returns {Object} { damage, isCrit, isHit }
 */
export function calculateAttack(attacker, defender, messages = []) {
  // 1. Check Hit/Miss (Stealth Detection)
  if (defender.isStealthed) {
    const detected = StealthSystem.checkDetection(defender, attacker);
    if (!detected) {
      messages.push(`${attacker.name} attacks empty air! ${defender.name} is hidden.`);
      return { damage: 0, isCrit: false, isHit: false };
    } else {
      messages.push(`${defender.name} is spotted!`);
      // Break stealth logic should be handled by state updater, but we note it here
    }
  }

  // 2. Base Damage Calculation
  let damage = 0;
  const str = attacker.attributes?.str || 0;
  
  // Class Specific: Monk Unarmed
  if (attacker.class === 'monk' && !attacker.equipment?.weapon) {
    damage = MonkSystem.calculateMonkDamage(attacker);
  } else {
    // Standard Formula: Base + (STR * 2) + Weapon
    const weaponDmg = attacker.equipment?.weapon?.stats?.attack || 0;
    damage = COMBAT_CONFIG.baseAttackDamage + (str * 2) + weaponDmg;
  }

  // 3. Multipliers
  
  // Class Specific: Berserker Rage
  if (attacker.class === 'berserker') {
    const rageMults = RageSystem.getRageMultipliers(attacker);
    damage = Math.floor(damage * rageMults.damage);
  }

  // Class Specific: Monk Combo
  if (attacker.class === 'monk') {
    const comboMult = MonkSystem.getComboMultiplier(attacker);
    if (comboMult > 1.0) {
      damage = Math.floor(damage * comboMult);
      messages.push(`Combo x${attacker.comboCount}! (${comboMult}x)`);
    }
  }

  // Stealth Ambush
  if (attacker.isStealthed) {
    damage = StealthSystem.applyAmbushDamage(damage, true);
    messages.push(`Ambush! Critical damage from shadows.`);
  }

  // 4. Critical Hit
  const luck = attacker.attributes?.luck || 0;
  const critChance = luck * COMBAT_CONFIG.baseLuckCritChance;
  let isCrit = false;
  
  if (Math.random() < critChance) {
    isCrit = true;
    damage = Math.floor(damage * COMBAT_CONFIG.criticalHitMultiplier);
    messages.push(`Critical Hit!`);
  }

  // 5. Defense Mitigation
  const def = defender.stats?.defense || (defender.attributes?.str || 0); // Simple def approximation
  const mitigation = Math.floor(def * COMBAT_CONFIG.defenseReductionFactor);
  damage = Math.max(1, damage - mitigation);

  // 6. Item Procs (Legendary Effects)
  const procResult = ItemProcSystem.processWeaponProcs(attacker, defender, damage, messages);
  if (procResult.extraDamage) {
    damage += procResult.extraDamage;
  }

  return { damage, isCrit, isHit: true };
}

/**
 * Processes post-attack state updates (Rage gain, Combo update, Stealth break).
 * @param {Object} attacker 
 * @param {Object} defender 
 * @param {Object} attackResult 
 * @param {Array} messages 
 * @returns {Object} { attackerUpdate, defenderUpdate }
 */
export function processPostAttack(attacker, defender, attackResult, messages = []) {
  let attackerUpdate = { ...attacker };
  let defenderUpdate = { ...defender };

  // Berserker: Gain Rage on Hit
  if (attacker.class === 'berserker' && attackResult.isHit) {
    attackerUpdate = RageSystem.gainRage(attackerUpdate, 10, 'hit');
  }

  // Berserker: Gain Rage on Damaged (Defender)
  if (defender.class === 'berserker' && attackResult.damage > 0) {
    defenderUpdate = RageSystem.gainRage(defenderUpdate, 15, 'damaged');
  }

  // Monk: Update Combo
  if (attacker.class === 'monk') {
    attackerUpdate = MonkSystem.updateCombo(attackerUpdate, attackResult.isHit);
  }

  // Stealth: Break on Attack
  if (attacker.isStealthed) {
    attackerUpdate = StealthSystem.breakStealth(attackerUpdate, messages);
  }

  // Stealth: Break on Hit (Defender) - Optional rule, usually taking damage reveals you
  if (defender.isStealthed && attackResult.isHit) {
    defenderUpdate = StealthSystem.breakStealth(defenderUpdate, messages);
  }

  return { attackerUpdate, defenderUpdate };
}

export default { calculateAttack, processPostAttack, COMBAT_CONFIG };