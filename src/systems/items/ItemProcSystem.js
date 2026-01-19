// =================================================================
// ITEM PROC SYSTEM
// Handles legendary item unique passive effects and procs
// =================================================================

import { emit } from "../../core/EventBus.js";

/**
 * PROC CONFIGURATION
 */
const PROC_CONFIG = {
  globalCooldown: 0, // No global cooldown
  maxProcsPerTurn: 3,
};

/**
 * Check and apply item proc effects
 * @param {object} attacker - Attacking entity
 * @param {object} defender - Defending entity
 * @param {number} damage - Base damage dealt
 * @param {object} weapon - Weapon item with potential proc
 * @returns {object} { damage, messages, healed, chainTargets, isTrueDamage }
 */
export function checkItemProc(attacker, defender, damage, weapon) {
  const result = {
    damage,
    messages: [],
    healed: 0,
    chainTargets: 0,
    isTrueDamage: false,
    procTriggered: false,
  };

  if (!weapon?.uniquePassive?.proc) {
    return result;
  }

  const proc = weapon.uniquePassive.proc;
  const roll = Math.random();

  if (roll >= proc.chance) {
    return result; // Proc didn't trigger
  }

  result.procTriggered = true;
  result.messages.push(`⚡ ${weapon.uniquePassive.name} activates!`);

  emit("item:proc", {
    item: weapon.name,
    proc: weapon.uniquePassive.name,
    attacker: attacker.name,
    defender: defender.name,
  });

  switch (proc.effect) {
    case "true_damage":
      // Ignore armor, deal multiplied damage
      result.damage = Math.floor(damage * proc.multiplier);
      result.isTrueDamage = true;
      result.messages.push(`Reality Slash deals ${result.damage} TRUE damage!`);
      break;

    case "lifesteal":
      // Heal attacker for percentage of damage
      const healAmount = Math.floor(damage * proc.value);
      result.healed = healAmount;
      result.messages.push(`Vampiric Strike heals ${healAmount} HP!`);
      break;

    case "chain_lightning":
      // Damage additional targets
      result.chainTargets = proc.targets || 2;
      result.messages.push(
        `Chain Lightning arcs to ${result.chainTargets} additional targets!`,
      );
      break;

    case "execute":
      // Deal bonus damage to low HP targets
      const defenderHpPercent =
        defender.stats?.hp?.current / defender.stats?.hp?.max;
      if (defenderHpPercent < (proc.threshold || 0.3)) {
        result.damage = Math.floor(damage * (proc.multiplier || 2.0));
        result.messages.push(`Execute! Massive damage to wounded target!`);
      }
      break;

    case "armor_pierce":
      // Ignore armor for this hit
      result.isTrueDamage = true;
      result.messages.push(`Armor Piercing! Defense ignored!`);
      break;

    case "double_strike":
      // Deal damage twice
      result.damage = damage * 2;
      result.messages.push(`Double Strike! Hit twice!`);
      break;

    case "stun":
      // Apply stun effect
      result.applyEffect = {
        type: "STUN",
        duration: proc.duration || 1,
        name: "Stunning Blow",
      };
      result.messages.push(`Stunning Blow! Target is stunned!`);
      break;

    case "bleed":
      // Apply bleed DoT
      result.applyEffect = {
        type: "DOT",
        element: "physical",
        magnitude: Math.floor(damage * (proc.value || 0.2)),
        duration: proc.duration || 3,
        name: "Bleeding Wound",
      };
      result.messages.push(`Bleeding Wound! Target bleeds!`);
      break;

    default:
      console.warn(`Unknown proc effect: ${proc.effect}`);
  }

  return result;
}

/**
 * Check and apply armor proc effects (defensive)
 * @param {object} defender - Defending entity
 * @param {object} attacker - Attacking entity
 * @param {number} damage - Incoming damage
 * @param {object} armor - Armor item with potential proc
 * @returns {object} { damage, messages, reflected, absorbed }
 */
export function checkArmorProc(defender, attacker, damage, armor) {
  const result = {
    damage,
    messages: [],
    reflected: 0,
    absorbed: 0,
    procTriggered: false,
  };

  if (!armor?.uniquePassive) {
    return result;
  }

  const passive = armor.uniquePassive;

  // Check aura effects (always active)
  if (passive.aura) {
    switch (passive.aura.effect) {
      case "accuracy_reduction":
        // Handled in damage calculation
        break;
      case "damage_reduction":
        const reduction = Math.floor(damage * passive.aura.value);
        result.damage = damage - reduction;
        result.absorbed = reduction;
        result.messages.push(`${armor.name} absorbs ${reduction} damage!`);
        break;
    }
  }

  // Check immunity
  if (passive.immunity && Array.isArray(passive.immunity)) {
    // This would need element info from the attack
    // For now, just note the immunity exists
  }

  // Check proc effects
  if (passive.proc) {
    const roll = Math.random();

    if (roll < passive.proc.chance) {
      result.procTriggered = true;

      emit("item:armorProc", {
        item: armor.name,
        proc: passive.name,
        defender: defender.name,
      });

      switch (passive.proc.effect) {
        case "reflect":
          result.reflected = Math.floor(damage * passive.proc.value);
          result.messages.push(
            `${passive.name}! Reflects ${result.reflected} damage!`,
          );
          break;

        case "shield":
          result.absorbed = Math.floor(damage * passive.proc.value);
          result.damage = damage - result.absorbed;
          result.messages.push(
            `${passive.name}! Absorbs ${result.absorbed} damage!`,
          );
          break;

        case "thorns":
          result.reflected = passive.proc.value;
          result.messages.push(
            `Thorns! Attacker takes ${result.reflected} damage!`,
          );
          break;
      }
    }
  }

  return result;
}

/**
 * Apply chain lightning to additional targets
 * @param {object} state - Current game state
 * @param {number} primaryTargetIndex - Index of primary target
 * @param {number} chainDamage - Damage per chain
 * @param {number} chainCount - Number of chains
 * @returns {object} Updated state
 */
export function applyChainLightning(
  state,
  primaryTargetIndex,
  chainDamage,
  chainCount,
) {
  if (!state.combat?.enemies) return state;

  const aliveEnemies = state.combat.enemies
    .map((e, idx) => ({ enemy: e, index: idx }))
    .filter(
      (e) => e.enemy.stats.hp.current > 0 && e.index !== primaryTargetIndex,
    );

  if (aliveEnemies.length === 0) return state;

  const targets = aliveEnemies.slice(0, chainCount);
  let combatLog = [...state.combat.log];
  const newEnemies = [...state.combat.enemies];

  targets.forEach(({ enemy, index }) => {
    const newHp = Math.max(0, enemy.stats.hp.current - chainDamage);
    newEnemies[index] = {
      ...enemy,
      stats: {
        ...enemy.stats,
        hp: { ...enemy.stats.hp, current: newHp },
      },
    };
    combatLog.push(
      `⚡ Chain Lightning hits ${enemy.name} for ${chainDamage} damage!`,
    );
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
 * Check level requirement for item
 * @param {object} player - Player object
 * @param {object} item - Item to check
 * @returns {object} { canEquip: boolean, reason: string }
 */
export function checkLevelRequirement(player, item) {
  if (!item.levelRequirement) {
    return { canEquip: true, reason: "" };
  }

  if (player.level < item.levelRequirement) {
    return {
      canEquip: false,
      reason: `Requires level ${item.levelRequirement} (you are level ${player.level})`,
    };
  }

  return { canEquip: true, reason: "" };
}

/**
 * Get all active item auras
 * @param {object} player - Player object
 * @returns {Array} Active aura effects
 */
function getActiveItemAuras(player) {
  const auras = [];

  // Check weapon
  const weapon = player.equipment?.weapon;
  if (weapon?.uniquePassive?.aura) {
    auras.push({
      source: weapon.name,
      ...weapon.uniquePassive.aura,
    });
  }

  // Check armor
  const armor = player.equipment?.armor;
  if (armor?.uniquePassive?.aura) {
    auras.push({
      source: armor.name,
      ...armor.uniquePassive.aura,
    });
  }

  // Check accessories
  const accessories = player.equipment?.accessories || [];
  accessories.forEach((acc) => {
    if (acc?.uniquePassive?.aura) {
      auras.push({
        source: acc.name,
        ...acc.uniquePassive.aura,
      });
    }
  });

  return auras;
}

/**
 * Apply item aura modifiers to combat
 * @param {object} player - Player object
 * @param {object} enemy - Enemy object
 * @returns {object} Modifiers { enemyAccuracy, playerDefense, etc. }
 */
export function applyItemAuraModifiers(player, enemy) {
  void enemy;
  const modifiers = {
    enemyAccuracy: 1.0,
    playerDefense: 1.0,
    playerDamage: 1.0,
    playerRegen: 0,
  };

  const auras = getActiveItemAuras(player);

  auras.forEach((aura) => {
    switch (aura.effect) {
      case "accuracy_reduction":
        modifiers.enemyAccuracy -= aura.value;
        break;
      case "defense_boost":
        modifiers.playerDefense += aura.value;
        break;
      case "damage_boost":
        modifiers.playerDamage += aura.value;
        break;
      case "regen":
        modifiers.playerRegen += aura.value;
        break;
    }
  });

  return modifiers;
}

/**
 * Get item proc status for UI
 * @param {object} player - Player object
 * @returns {object} Proc status info
 */
export function getItemProcStatus(player) {
  const weapon = player.equipment?.weapon;
  const armor = player.equipment?.armor;

  return {
    weaponProc: weapon?.uniquePassive
      ? {
          name: weapon.uniquePassive.name,
          description: weapon.uniquePassive.description,
          chance: weapon.uniquePassive.proc?.chance || 0,
        }
      : null,
    armorProc: armor?.uniquePassive
      ? {
          name: armor.uniquePassive.name,
          description: armor.uniquePassive.description,
        }
      : null,
    activeAuras: getActiveItemAuras(player),
  };
}
