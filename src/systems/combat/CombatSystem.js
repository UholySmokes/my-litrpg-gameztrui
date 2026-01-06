import { addItem } from '../inventory/InventorySystem.js';
import { addXp } from '../leveling/LevelingManager.js';
import { createEnemy, getEnemySkillById, calculateEnemyDrops } from '../../entities/Enemy.js';
import { getSkillById } from '../skills/SkillRegistry.js';
import { calculateGainedXP } from '../leveling/LevelingSystem.js';
import { hasRaceTag, EFFECT_TAGS as RACE_EFFECT_TAGS, getRaceEntityTags } from '../race/RaceRegistry.js';
import { hasEffectTag, getEffectTagMagnitude } from '../effects/EffectSystem.js';
import { resolveBypasses, applyCostOverride, applyCooldownOverride, applyCritOverride, applyCritMultiplier, applyDropOverrides, getMagnitudeCaps, applyMagnitudeDamageCap } from '../skills/TalentManager.js';
import { effectApplicationSystem } from '../effects/EffectApplicationSystem.js';
import { consumeMana, canAffordSkill } from '../magic/ManaSystem.js';
import { calculateManaCost } from '../magic/ManaBalance.js';
import { emit } from '../../core/EventBus.js';

const DEBUG_LOGGING_ENABLED = false;

/**
 * Applies damage to the player. If HP drops to 0 or below, sets the isDead flag.
 * @param {object} state - The current game state object.
 * @param {number} amount - The amount of damage to take.
 * @returns {object} A new game state object with the updated HP.
 */
export function takeDamage(state, amount) {
  // Calculate new HP, ensuring it doesn't go below 0
  const newHp = Math.max(0, state.player.hp.current - amount);

  // Create a new state with the updated HP
  const newState = {
    ...state,
    player: {
      ...state.player,
      hp: {
        ...state.player.hp,
        current: newHp
      },
      // Set a flag if the player has been defeated
      isDead: newHp <= 0
    }
  };
  
  if (newState.player.isDead) {
    console.log(`${newState.player.name} has been defeated!`);
  }

  return newState;
}

/**
 * Start combat with enemies
 */
export function startCombat(state, enemyIds) {
  if (!enemyIds || enemyIds.length === 0) {
    return state;
  }
  
  const enemies = enemyIds.map(id => createEnemy(id)).filter(e => e !== null);
  
  if (enemies.length === 0) {
    return state;
  }
  
  return {
    ...state,
    combat: {
      status: 'active',
      turn: 'player',
      enemies: enemies,
      log: [`Combat started! You face ${enemies.map(e => e.name).join(', ')}.`]
    }
  };
}

/**
 * Player attacks an enemy
 * Uses config values for damage calculation
 */
export function playerAttack(state, enemyIndex, skillId = null) {
  if (state.combat.status !== 'active') {
    return { success: false, reason: 'Not in combat', state };
  }
  
  if (enemyIndex < 0 || enemyIndex >= state.combat.enemies.length) {
    return { success: false, reason: 'Invalid enemy', state };
  }
  
  const enemy = state.combat.enemies[enemyIndex];
  if (enemy.stats.hp.current <= 0) {
    return { success: false, reason: 'Enemy already defeated', state };
  }
  
  // If using a skill, validate mana cost first
  if (skillId) {
    const skill = getSkillById(skillId);
    if (!skill) {
      return { success: false, reason: 'Skill not found', state };
    }
    
    // Check if player can afford the skill
    const affordability = canAffordSkill(skill, state.player);
    if (!affordability.canAfford) {
      return { success: false, reason: affordability.feedback?.error || 'Insufficient mana', state };
    }
    
    // Consume mana
    const consumption = consumeMana(skill, state.player, {
      showFeedback: false,
      scaleWithLevel: true
    });
    
    if (!consumption.success) {
      return { success: false, reason: consumption.error, state };
    }
    
    // Update player mana in state
    state = {
      ...state,
      player: {
        ...state.player,
        mana: {
          ...state.player.mana,
          current: consumption.remainingMana
        }
      }
    };
  }
  
  // Get config values (with fallbacks)
  const strToDamageMultiplier = state.config?.strToDamageMultiplier || 2;
  const baseAttributeValue = state.config?.baseAttributeValue || 5;
  
  // Get player stats using config multipliers
  const playerStats = {
    attack: (state.player.attributes?.str || baseAttributeValue) * strToDamageMultiplier + (state.player.equipment?.weapon?.stats?.attack || 0),
    attributes: state.player.attributes
  };
  
  // Calculate damage, passing config for all calculations
  const damageResult = calculateDamage(
    playerStats,
    enemy.stats,
    skillId ? getSkillById(skillId) : null,
    state.config
  );
  
  // Apply damage
  const newEnemyHp = Math.max(0, enemy.stats.hp.current - damageResult.damage);
  const newEnemies = [...state.combat.enemies];
  newEnemies[enemyIndex] = {
    ...enemy,
    stats: {
      ...enemy.stats,
      hp: { ...enemy.stats.hp, current: newEnemyHp }
    }
  };
  
  // Update combat log
  const critText = damageResult.isCritical ? ' (CRITICAL!)' : '';
  const newLog = [...state.combat.log, 
    `You attack ${enemy.name} for ${damageResult.damage} damage${critText}!`
  ];
  
  let newState = {
    ...state,
    combat: {
      ...state.combat,
      enemies: newEnemies,
      log: newLog,
      turn: 'enemy'
    }
  };
  
  // Check if enemy is defeated
  if (newEnemyHp <= 0) {
    newState = handleEnemyDefeat(newState, enemyIndex);
  }
  
  return { success: true, damage: damageResult.damage, state: newState };
}

/**
 * Enemy attacks player
 */
export function enemyAttack(state, enemyIndex) {
  if (state.combat.status !== 'active') {
    return state;
  }
  
  if (enemyIndex < 0 || enemyIndex >= state.combat.enemies.length) {
    return state;
  }
  
  const enemy = state.combat.enemies[enemyIndex];
  if (enemy.stats.hp.current <= 0) {
    return state;
  }
  
  // Simple AI: use random skill or basic attack
  const availableSkills = enemy.skills.filter(skillId => {
    const skill = getEnemySkillById(skillId);
    if (!skill) return false;
    const cooldown = enemy.skillCooldowns?.[skillId] || 0;
    return cooldown <= 0 && (!skill.manaCost || enemy.stats.mana.current >= skill.manaCost);
  });
  
  let skill = null;
  if (availableSkills.length > 0 && Math.random() < 0.5) {
    const skillId = availableSkills[Math.floor(Math.random() * availableSkills.length)];
    skill = getEnemySkillById(skillId);
    
    // Update cooldowns and mana
    const newEnemies = [...state.combat.enemies];
    newEnemies[enemyIndex] = {
      ...enemy,
      stats: {
        ...enemy.stats,
        mana: {
          ...enemy.stats.mana,
          current: enemy.stats.mana.current - (skill.manaCost || 0)
        }
      },
      skillCooldowns: {
        ...enemy.skillCooldowns,
        [skillId]: skill.cooldown || 0
      }
    };
    
    // Update state with new enemy
    state = {
      ...state,
      combat: {
        ...state.combat,
        enemies: newEnemies
      }
    };
  }
  
  // Calculate damage using config values
  const baseAttributeValue = state.config?.baseAttributeValue || 5;
  const playerDefense = (state.player.attributes?.str || baseAttributeValue) + (state.player.equipment?.armor?.stats?.defense || 0);
  const playerStats = { defense: playerDefense };
  const damageResult = calculateDamage(enemy.stats, playerStats, skill, state.config);
  
  // Apply damage to player
  const newHp = Math.max(0, state.player.hp.current - damageResult.damage);
  const critText = damageResult.isCritical ? ' (CRITICAL!)' : '';
  const skillText = skill ? ` using ${skill.name}` : '';
  
  const newLog = [...state.combat.log, 
    `${enemy.name} attacks you${skillText} for ${damageResult.damage} damage${critText}!`
  ];
  
  return takeDamage({
    ...state,
    combat: {
      ...state.combat,
      log: newLog
    }
  }, damageResult.damage);
}

/**
 * Process all enemy turns
 */
export function processEnemyTurns(state) {
  if (state.combat.status !== 'active' || state.combat.turn !== 'enemy') {
    return state;
  }
  
  let newState = state;
  
  // Process each alive enemy
  state.combat.enemies.forEach((enemy, index) => {
    if (enemy.stats.hp.current > 0) {
      newState = enemyAttack(newState, index);
      
      // Update cooldowns
      const updatedEnemy = newState.combat.enemies[index];
      if (updatedEnemy && updatedEnemy.skillCooldowns) {
        const newCooldowns = {};
        Object.keys(updatedEnemy.skillCooldowns).forEach(skillId => {
          if (updatedEnemy.skillCooldowns[skillId] > 0) {
            newCooldowns[skillId] = updatedEnemy.skillCooldowns[skillId] - 1;
          }
        });
        
        const newEnemies = [...newState.combat.enemies];
        newEnemies[index] = {
          ...updatedEnemy,
          skillCooldowns: newCooldowns
        };
        
        newState = {
          ...newState,
          combat: {
            ...newState.combat,
            enemies: newEnemies
          }
        };
      }
    }
  });
  
  // Check if player is dead
  if (newState.player.isDead) {
    return endCombat(newState, 'defeat');
  }
  
  // Switch back to player turn
  return {
    ...newState,
    combat: {
      ...newState.combat,
      turn: 'player'
    }
  };
}

/**
 * Handle enemy defeat
 */
export function handleEnemyDefeat(state, enemyIndex) {
  const enemy = state.combat.enemies[enemyIndex];
  const drops = calculateEnemyDrops(enemy);
  
  // Add drops to player
  let newState = state;
  
  // Add gold
  if (drops.gold > 0) {
    newState = {
      ...newState,
      player: {
        ...newState.player,
        currency: {
          ...newState.player.currency,
          goldCoins: (newState.player.currency?.goldCoins || 0) + drops.gold
        }
      }
    };
  }
  
  // Add items
  drops.items.forEach(item => {
    newState = addItem(newState, item);
  });
  
  // Add XP
  // Use Level-Delta logic to calculate actual XP gained
  const xpGained = calculateGainedXP(state.player.level, enemy.level, drops.xp, state.config);
  newState = addXp(newState, xpGained);
  
  // Remove enemy from combat
  const newEnemies = newState.combat.enemies.filter((_, idx) => idx !== enemyIndex);
  
  const newLog = [...newState.combat.log, 
    `${enemy.name} defeated! Gained ${xpGained} XP (Base: ${drops.xp}), ${drops.gold} gold, and ${drops.items.length} item(s).`
  ];
  
  newState = {
    ...newState,
    combat: {
      ...newState.combat,
      enemies: newEnemies,
      log: newLog
    }
  };
  
  // Check if all enemies defeated
  if (newEnemies.length === 0 || newEnemies.every(e => e.stats.hp.current <= 0)) {
    return endCombat(newState, 'victory');
  }
  
  return newState;
}

/**
 * End combat
 */
export function endCombat(state, result) {
  const newLog = [...state.combat.log];
  
  if (result === 'victory') {
    newLog.push('Victory! All enemies defeated!');
  } else if (result === 'defeat') {
    newLog.push('Defeat! You have been knocked unconscious.');
  } else if (result === 'escape') {
    newLog.push('You successfully escaped from combat!');
  }
  
  return {
    ...state,
    combat: {
      status: result === 'victory' ? 'victory' : result === 'defeat' ? 'defeat' : 'inactive',
      turn: 'player',
      enemies: [],
      log: newLog
    }
  };
}

/**
 * Escape from combat
 * Uses config values for escape chance calculation
 */
export function escapeCombat(state) {
  if (state.combat.status !== 'active') {
    return { success: false, reason: 'Not in combat', state };
  }
  
  // Get config values (with fallbacks for safety)
  const baseEscapeChance = state.config?.baseEscapeChance || 0.3;
  const agilityEscapeBonus = state.config?.agilityEscapeBonus || 0.01;
  const baseAttributeValue = state.config?.baseAttributeValue || 5;
  
  // Escape chance based on agility using config values
  const agility = state.player.attributes?.agi || baseAttributeValue;
  const escapeChance = baseEscapeChance + (agility * agilityEscapeBonus);
  const escaped = Math.random() < escapeChance;
  
  if (escaped) {
    return { 
      success: true, 
      state: endCombat(state, 'escape') 
    };
  } else {
    const newLog = [...state.combat.log, 'Escape attempt failed!'];
    return {
      success: false,
      reason: 'Escape failed',
      state: {
        ...state,
        combat: {
          ...state.combat,
          log: newLog,
          turn: 'enemy'
        }
      }
    };
  }
}

export function calculateDamage(attacker, defender, skill = null) {
  let damage = 0;
  let isCritical = false;
  let messages = [];

  // Determine attacker stats
  const isPlayer = !!attacker.race; // Simple check if attacker is player
  const stats = attacker.attributes || attacker.stats || { str: 10, dex: 10, int: 10, luck: 10 };
  
  // --- 1. Base Damage Calculation ---
  // Physical damage scales with STR, Magical with INT
  const isMagic = skill ? skill.isMagic : false; // Assume skills define if they are magic
  const scalingStat = isMagic ? stats.int : stats.str;
  
  // Base damage from stat
  damage = Math.floor(scalingStat * 2);
  
  // Add Skill Damage
  if (skill) {
    damage += (skill.damage || 0);
    messages.push(`${attacker.name} uses ${skill.name}!`);
  } else {
    messages.push(`${attacker.name} attacks!`);
  }

  // --- Status Effect Damage Modifiers ---
  // Might Buff (+20% Phys Dmg per stack)
  if (!isMagic && hasEffectTag(attacker, 'DMG_BOOST_PHYSICAL')) {
    const boost = getEffectTagMagnitude(attacker, 'DMG_BOOST_PHYSICAL');
    damage = Math.floor(damage * (1 + boost));
    messages.push(`Might: +${Math.round(boost * 100)}% Damage`);
  }

  // --- 2. Racial Modifiers (Attacker) ---
  if (isPlayer && attacker.race) {
    const raceId = attacker.race.id;
    
    // Damage Boosts
    if (skill) {
      if (skill.element === 'fire' && hasRaceTag(raceId, RACE_EFFECT_TAGS.DMG_BOOST_FIRE)) {
        damage *= 1.2;
        messages.push("Racial Bonus: Fire Damage +20%");
      }
      if (skill.element === 'ice' && hasRaceTag(raceId, RACE_EFFECT_TAGS.DMG_BOOST_ICE)) {
        damage *= 1.2;
        messages.push("Racial Bonus: Ice Damage +20%");
      }
      // ... add other element boosts similarly
    }

    // Special Traits
    if (hasRaceTag(raceId, 'LOW_HP_DMG_BOOST')) {
      const hpPercent = attacker.hp.current / attacker.hp.max;
      if (hpPercent < 0.5) {
        damage *= 1.2;
        messages.push("Racial Bonus: Blood Frenzy! Damage +20%");
      }
    }
  }

  // --- 3. Critical Hit Calculation ---
  const luck = stats.luck || 5;
  let critChance = luck * 0.01;
  const talentBypasses = resolveBypasses(attacker.talents || []);
  critChance = applyCritOverride(critChance, talentBypasses);
  
  // Racial Crit Bonus
  if (isPlayer && attacker.race && hasRaceTag(attacker.race.id, RACE_EFFECT_TAGS.DMG_BOOST_CRIT)) {
    critChance += 0.05;
  }

  // Status Effect Crit Bonus
  if (hasEffectTag(attacker, 'DMG_BOOST_CRIT')) {
      critChance += getEffectTagMagnitude(attacker, 'DMG_BOOST_CRIT');
  }

  // Cap crit chance at 50% (soft cap)
  critChance = Math.min(critChance, 0.5);

  if (Math.random() < critChance) {
    isCritical = true;
    let critMultiplier = applyCritMultiplier(1.5, talentBypasses);
    
    // Racial Crit Damage Bonus
    if (isPlayer && attacker.race && hasRaceTag(attacker.race.id, 'CRIT_DMG_BOOST')) {
      critMultiplier = 1.7; // 20% boost to multiplier
    }
    
    damage = Math.floor(damage * critMultiplier);
    messages.push("Critical Hit!");
  }

  // --- 4. Defense & Resistance (Defender) ---
  // Simple defense: subtract defense value
  const defStats = defender.attributes || defender.stats || { str: 10 };
  const defense = Math.floor((defStats.str || 0) / 2);
  
  // Apply Racial Defenses (if Defender is Player)
  let finalDefense = defense;
  if (!isPlayer && defender.race) { // If defender is player (in enemy turn) or PvP
     // Note: Currently simple logic assumes 'attacker.race' means player. 
     // In a full system, we'd check defender too.
     // For now, assuming PvE where defender is enemy (no race traits usually)
     // OR Defender is player (Enemy Turn)
  }
  
  // Calculate final damage
  let finalDamage = Math.max(1, damage - finalDefense);

  // --- 5. Racial Resistances/Weaknesses (Defender) ---
  // We need to know if defender has racial traits. 
  // Assuming 'defender' object has 'race' property if it's a player.
  if (defender.race) {
     const defRaceId = defender.race.id;
     const element = skill ? skill.element : 'physical';

     // Weaknesses (+50% Damage Taken)
     if (element === 'fire' && hasRaceTag(defRaceId, RACE_EFFECT_TAGS.WEAK_FIRE)) {
       finalDamage *= 1.5;
       messages.push("Weakness: Fire! (+50% Dmg)");
     }
     if (element === 'lightning' && hasRaceTag(defRaceId, RACE_EFFECT_TAGS.WEAK_LIGHTNING)) {
       finalDamage *= 1.5;
       messages.push("Weakness: Lightning! (+50% Dmg)");
     }
     
     // Resistances (-20% Damage Taken)
     if (element === 'fire' && hasRaceTag(defRaceId, RACE_EFFECT_TAGS.RESIST_FIRE)) {
       finalDamage *= 0.8;
       messages.push("Resisted: Fire (-20% Dmg)");
     }
     
     // Immunities (0 Damage)
     if (skill && skill.effect === 'bleed' && hasRaceTag(defRaceId, RACE_EFFECT_TAGS.IMMUNE_BLEED)) {
        messages.push("Immune to Bleed!");
        // Logic to prevent bleed application would go here
     }
     
     // Chance to Negate (Void Walker)
     if (hasRaceTag(defRaceId, 'DMG_NEGATE_CHANCE')) {
       if (Math.random() < 0.20) {
         finalDamage = 0;
         messages.push("Void Step: Damage Negated!");
       }
     }
  }

  finalDamage = Math.floor(finalDamage);

  const result = {
    damage: finalDamage,
    isCritical,
    messages
  };
  emit('combat:log', { type: 'damage', attacker: attacker.name, defender: defender.name, result });
  return result;
}

export function calculateDamagePipeline(attacker, defender, skill = null) {
  const log = [];
  const isMagic = skill ? skill.isMagic : false;
  const stats = attacker.attributes || attacker.stats || { str: 10, int: 10, luck: 10 };
  const base = Math.floor((isMagic ? stats.int : stats.str) * 2) + (skill ? (skill.damage || 0) : 0);
  log.push({ stage: 'RAW', value: base, reason: 'Base stat scaling + skill damage' });
  
  // Apply magnitude-based damage caps early in pipeline
  const attackerLevel = attacker.level || 1;
  const activeTalents = attacker.talents || [];
  let magnitudeCaps = null;
  
  // Check for magnitude-based talents
  for (const talentId of activeTalents) {
    const caps = getMagnitudeCaps(talentId, attackerLevel);
    if (caps && caps.damageCap > 0) {
      magnitudeCaps = caps;
      break; // Use the first magnitude talent found
    }
  }

  // Attacker multipliers
  let afterAttackers = base;
  const attackerReasons = [];
  const attackerTags = [];
  const defenderTags = [];

  // Aggregate tags
  if (skill?.tags) attackerTags.push(...skill.tags);
  if (attacker.race?.id) attackerTags.push(...getRaceEntityTags(attacker.race.id));
  if (defender.race?.id) defenderTags.push(...getRaceEntityTags(defender.race.id));
  if (!isMagic && hasEffectTag(attacker, 'DMG_BOOST_PHYSICAL')) {
    const boost = getEffectTagMagnitude(attacker, 'DMG_BOOST_PHYSICAL');
    afterAttackers = Math.floor(afterAttackers * (1 + boost));
    attackerReasons.push(`Might (+${Math.round(boost * 100)}%)`);
  }
  if (skill?.element === 'fire' && hasRaceTag(attacker.race?.id, RACE_EFFECT_TAGS.DMG_BOOST_FIRE)) {
    afterAttackers = Math.floor(afterAttackers * 1.2);
    attackerReasons.push('Racial: Fire +20%');
  }

  // Tag-based matchup bonuses (e.g., Holy vs Undead)
  if (attackerTags.includes('Holy_Damage') && defenderTags.includes('Undead')) {
    afterAttackers = Math.floor(afterAttackers * 2);
    attackerReasons.push('Bonus due to [Holy vs Undead]');
  }
  log.push({ stage: 'ATTACKER_MULTIPLIERS', value: afterAttackers, reason: attackerReasons.join('; ') || 'None' });

  // Defender mitigation
  const defStats = defender.attributes || defender.stats || { str: 10 };
  const defense = Math.floor((defStats.str || 0) / 2);
  let afterMitigation = Math.max(1, afterAttackers - defense);
  const defReasons = [`Defense ${defense}`];
  const element = skill ? skill.element : 'physical';
  if (element === 'fire' && hasRaceTag(defender.race?.id, RACE_EFFECT_TAGS.RESIST_FIRE)) {
    afterMitigation = Math.floor(afterMitigation * 0.8);
    defReasons.push('Resist: Fire -20%');
  }
  if (element === 'lightning' && hasRaceTag(defender.race?.id, RACE_EFFECT_TAGS.WEAK_LIGHTNING)) {
    afterMitigation = Math.floor(afterMitigation * 1.5);
    defReasons.push('Weak: Lightning +50%');
  }
  log.push({ stage: 'DEFENDER_MITIGATION', value: afterMitigation, reason: defReasons.join('; ') });

  let final = Math.floor(afterMitigation);
  
  // Apply magnitude-based damage caps
  if (magnitudeCaps) {
    const capped = applyMagnitudeDamageCap(final, magnitudeCaps);
    if (capped !== final) {
      log.push({ stage: 'MAGNITUDE_CAP', value: capped, reason: `${magnitudeCaps.label} damage cap (${magnitudeCaps.damageCap})` });
    }
    final = capped;
    emit('combat:log', { type: 'magnitude', attacker: attacker.name, label: magnitudeCaps.label, cap: magnitudeCaps.damageCap });
  }
  
  log.push({ stage: 'FINAL', value: final, reason: 'Final clamped integer' });

  emit('combat:log', { type: 'pipeline', attacker: attacker.name, defender: defender.name, log });
  return { damage: final, log };
}

export function executeSkill(attacker, defender, skillId) {
  const skill = getSkillById(skillId);
  if (!skill) return { damage: 0, messages: ['Skill not found'] };
  
  const bypasses = resolveBypasses(attacker.talents || []);
  const cd = applyCooldownOverride(skill.cooldown || 0, bypasses);
  
  // Calculate mana cost using the new balance system
  const calculatedCost = calculateManaCost(skill, attacker.level || 1);
  const cost = applyCostOverride(calculatedCost, bypasses);
  
  // Validate and consume mana using the new system
  const consumption = consumeMana(skill, attacker, {
    showFeedback: false, // Feedback handled by UI
    scaleWithLevel: false // Already scaled above
  });
  
  if (!consumption.success) {
    return { 
      damage: 0, 
      messages: [consumption.error || 'Insufficient mana'], 
      cooldown: 0, 
      cost: 0,
      insufficientMana: true 
    };
  }
  
  // Update attacker's mana
  let updatedAttacker = { ...attacker };
  if (updatedAttacker.mana && typeof updatedAttacker.mana.current === 'number') {
    updatedAttacker.mana.current = consumption.remainingMana;
  }
  
  let updatedDefender = defender;
  
  const result = calculateDamagePipeline(updatedAttacker, updatedDefender, skill);
  
  // Apply magnitude-based AoE caps if skill has AoE effects
  if (Array.isArray(skill.effects) && skill.effects.some(e => e.aoe)) {
    const attackerLevel = updatedAttacker.level || 1;
    const activeTalents = updatedAttacker.talents || [];
    let magnitudeCaps = null;
    
    // Check for magnitude-based talents
    for (const talentId of activeTalents) {
      const caps = getMagnitudeCaps(talentId, attackerLevel);
      if (caps && caps.aoeRadius > 0) {
        magnitudeCaps = caps;
        break; // Use the first magnitude talent found
      }
    }
    
    if (magnitudeCaps) {
      emit('combat:log', { 
        type: 'aoe_magnitude', 
        attacker: updatedAttacker.name, 
        label: magnitudeCaps.label, 
        radius: magnitudeCaps.aoeRadius 
      });
    }
  }
  
  // Apply Effects
  if (Array.isArray(skill.effects)) {
    const selfEffects = skill.effects.filter(e => e.target === 'self');
    const targetEffects = skill.effects.filter(e => e.target !== 'self');
    
    if (selfEffects.length > 0) {
      updatedAttacker = effectApplicationSystem.applyEffects(updatedAttacker, selfEffects, updatedAttacker);
    }
    
    if (targetEffects.length > 0) {
      updatedDefender = effectApplicationSystem.applyEffects(updatedDefender, targetEffects, updatedAttacker);
    }
  }
  
  return { 
    damage: result.damage, 
    cooldown: cd, 
    cost: consumption.manaConsumed, 
    log: result.log,
    remainingMana: consumption.remainingMana,
    updatedAttacker,
    updatedDefender
  };
}

export function applyTalentDropOverrides(attacker, drops) {
  const bypasses = resolveBypasses(attacker.talents || []);
  return (drops || []).map(d => applyDropOverrides(d, bypasses));
}
