import { getSkillById } from './SkillRegistry.js';
import { emit } from '../../core/EventBus.js';
import { generateFusionName } from './generateFusionName.js';

// Fusion types
export const FUSION_TYPES = {
  SKILL_SKILL: 'skill+skill',
  SKILL_ITEM: 'skill+item',
  SKILL_TALENT: 'skill+talent',
  MULTI_SKILL: 'multi-skill'
};

// Evolution requirements
export const EVOLUTION_REQUIREMENTS = {
  MIN_LEVEL: 10,
  MIN_FUSION_LEVEL: 15,
  MAX_FUSIONS: 5,
  HIDDEN_CONDITION_WEIGHT: 0.3
};

// Hidden condition types
export const HIDDEN_CONDITIONS = {
  CLASS_SYNERGY: 'class_synergy',
  ELEMENTAL_ALIGNMENT: 'elemental_alignment',
  COMBO_POTENTIAL: 'combo_potential',
  RARE_CATALYST: 'rare_catalyst',
  TIMING_DEPENDENT: 'timing_dependent',
  LOCATION_SPECIFIC: 'location_specific',
  QUEST_LOCKED: 'quest_locked',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked'
};

/**
 * Check if two skills can be fused
 */
export function canFuseSkills(skillA, skillB, player) {
  if (!skillA || !skillB) return false;
  if (!player) return false;
  
  const level = player.level || 1;
  const fusionCount = player.fusionCount || 0;
  
  // Basic requirements
  if (level < EVOLUTION_REQUIREMENTS.MIN_LEVEL) return false;
  if (fusionCount >= EVOLUTION_REQUIREMENTS.MAX_FUSIONS) return false;
  
  // Cannot fuse same skill
  if (skillA.id === skillB.id) return false;
  
  // Check hidden conditions
  const hiddenOk = checkHiddenConditions({ 
    type: FUSION_TYPES.SKILL_SKILL, 
    skillA, 
    skillB, 
    player 
  });
  
  return hiddenOk;
}

/**
 * Fuse two skills together
 */
export function fuseSkills(skillA, skillB, playerLevel = 1) {
  // Validate inputs
  if (!skillA || !skillB) {
    throw new Error('Both skills are required for fusion');
  }
  
  // Calculate fusion properties
  const baseDamage = Math.max(skillA.damage || 0, skillB.damage || 0);
  const fusionBonus = Math.floor(playerLevel * 0.5);
  const combinedDamage = baseDamage + fusionBonus;
  
  const baseManaCost = Math.max(skillA.manaCost || 0, skillB.manaCost || 0);
  const manaEfficiency = Math.floor(baseManaCost * 0.8); // 20% reduction
  
  const baseCooldown = Math.max(skillA.cooldown || 0, skillB.cooldown || 0);
  const cooldownReduction = Math.max(1, Math.floor(baseCooldown * 0.3));
  const finalCooldown = Math.max(1, baseCooldown - cooldownReduction);
  
  // Combine effects
  const effectsA = skillA.effects || [];
  const effectsB = skillB.effects || [];
  const combinedEffects = combineEffects(effectsA, effectsB);
  
  // Combine tags
  const tagsA = skillA.tags || [];
  const tagsB = skillB.tags || [];
  const combinedTags = [...new Set([...tagsA, ...tagsB])];
  
  // Determine fusion type and name
  const fusionType = determineFusionType(skillA, skillB);
  const fusionName = generateFusionName(skillA, skillB, fusionType);
  
  const fusedSkill = {
    id: `${skillA.id}_fusion_${skillB.id}`,
    name: fusionName,
    type: 'active',
    class: skillA.class || skillB.class || 'universal',
    description: generateFusionDescription(skillA, skillB, fusionType, combinedDamage, manaEfficiency, finalCooldown),
    level: Math.max(skillA.level || 1, skillB.level || 1),
    manaCost: manaEfficiency,
    cooldown: finalCooldown,
    damage: combinedDamage,
    effects: combinedEffects,
    tags: combinedTags,
    fusion: {
      parents: [skillA.id, skillB.id],
      type: fusionType,
      level: playerLevel,
      timestamp: Date.now()
    }
  };
  
  // Emit fusion event
  emit('skill:fusion', {
    type: 'skill_fused',
    skillA: skillA.id,
    skillB: skillB.id,
    result: fusedSkill.id,
    playerLevel
  });
  
  return fusedSkill;
}

/**
 * Check if skill can be fused with item
 */
export function canFuseSkillWithItem(skill, item, player) {
  if (!skill || !item) return false;
  if (!player) return false;
  
  const level = player.level || 1;
  const fusionCount = player.fusionCount || 0;
  
  // Basic requirements
  if (level < EVOLUTION_REQUIREMENTS.MIN_FUSION_LEVEL) return false;
  if (fusionCount >= EVOLUTION_REQUIREMENTS.MAX_FUSIONS) return false;
  
  // Check hidden conditions
  const hiddenOk = checkHiddenConditions({ 
    type: FUSION_TYPES.SKILL_ITEM, 
    skill, 
    item, 
    player 
  });
  
  return hiddenOk;
}

/**
 * Fuse skill with item
 */
export function fuseSkillWithItem(skill, item, playerLevel = 1) {
  if (!skill || !item) {
    throw new Error('Both skill and item are required for infusion');
  }
  
  // Calculate infusion properties
  const statBonus = calculateItemStatBonus(item, playerLevel);
  const newEffects = combineSkillItemEffects(skill.effects || [], item.effects || []);
  const newTags = [...(skill.tags || []), ...(item.tags || []), 'infused'];
  
  const infusedSkill = {
    ...skill,
    id: `${skill.id}_infused_${item.id}`,
    name: `${skill.name} [${item.name}]`,
    description: `${skill.description} Enhanced with ${item.name}: ${item.description}`,
    damage: (skill.damage || 0) + statBonus.damage,
    manaCost: Math.max(1, (skill.manaCost || 0) - statBonus.manaReduction),
    cooldown: Math.max(1, (skill.cooldown || 0) - statBonus.cooldownReduction),
    effects: newEffects,
    tags: [...new Set(newTags)],
    infusion: {
      itemId: item.id,
      stats: statBonus,
      level: playerLevel,
      timestamp: Date.now()
    }
  };
  
  // Emit infusion event
  emit('skill:infusion', {
    type: 'skill_infused',
    skill: skill.id,
    item: item.id,
    result: infusedSkill.id,
    playerLevel
  });
  
  return infusedSkill;
}

/**
 * Check hidden conditions for fusion
 */
export function checkHiddenConditions(context) {
  const { type } = context;
  
  switch (type) {
    case FUSION_TYPES.SKILL_SKILL:
      return checkSkillSkillConditions(context);
    case FUSION_TYPES.SKILL_ITEM:
      return checkSkillItemConditions(context);
    case FUSION_TYPES.SKILL_TALENT:
      return checkSkillTalentConditions(context);
    case FUSION_TYPES.MULTI_SKILL:
      return checkMultiSkillConditions(context);
    default:
      return false;
  }
}

/**
 * Check skill+skill fusion conditions
 */
function checkSkillSkillConditions({ skillA, skillB, player, rng }) {
  const level = player.level || 1;

  // Class synergy bonus
  if (skillA.class === skillB.class) {
    return true; // Same class skills can always fuse
  }

  // Elemental compatibility
  const elementsA = extractElements(skillA);
  const elementsB = extractElements(skillB);
  const commonElements = elementsA.filter(e => elementsB.includes(e));

  if (commonElements.length > 0) {
    return true; // Shared elements allow fusion
  }

  // Combo potential (complementary effects)
  const effectsA = skillA.effects || [];
  const effectsB = skillB.effects || [];

  if (hasComplementaryEffects(effectsA, effectsB)) {
    return true;
  }

  // Level-based unlocking
  if (level >= 25) {
    return getRandom({ rng }) < 0.5; // 50% chance at higher levels
  }

  return false;
}

/**
 * Check skill+item fusion conditions
 */
function checkSkillItemConditions({ skill, item, player, rng }) {
  // Catalyst requirement
  if ((item.tags || []).includes('Catalyst')) {
    return true;
  }

  // Elemental alignment
  const skillElements = extractElements(skill);
  const itemElements = extractElements(item);
  const alignment = skillElements.filter(e => itemElements.includes(e));

  if (alignment.length > 0) {
    return getRandom({ rng }) < 0.7; // 70% chance with alignment
  }

  // Stat compatibility
  const skillStat = getPrimaryStat(skill);
  const itemStat = getPrimaryStat(item);

  if (skillStat === itemStat) {
    return getRandom({ rng }) < 0.6; // 60% chance with stat match
  }

  return false;
}

/**
 * Check skill+talent fusion conditions
 */
function checkSkillTalentConditions({ skill, talent, player }) {
  // This would be implemented based on talent system
  return false; // Placeholder
}

/**
 * Check multi-skill fusion conditions
 */
function checkMultiSkillConditions({ skills, player }) {
  // This would be implemented for advanced fusion mechanics
  return false; // Placeholder
}

/**
 * Combine effects from two skills
 */
function combineEffects(effectsA, effectsB) {
  const combined = [...effectsA];
  
  for (const effect of effectsB) {
    // Check for duplicate effect types
    const existing = combined.find(e => e.id === effect.id);
    
    if (existing) {
      // Enhance existing effect
      existing.duration = Math.max(existing.duration || 0, effect.duration || 0);
      existing.potency = (existing.potency || 1) + (effect.potency || 1);
    } else {
      // Add new effect
      combined.push({ ...effect });
    }
  }
  
  return combined;
}

/**
 * Determine fusion type based on skill properties
 */
function determineFusionType(skillA, skillB) {
  if (skillA.class === skillB.class) {
    return 'synergistic';
  }
  
  const elementsA = extractElements(skillA);
  const elementsB = extractElements(skillB);
  
  if (elementsA.length > 0 && elementsB.length > 0) {
    const overlap = elementsA.filter(e => elementsB.includes(e));
    if (overlap.length > 0) {
      return 'elemental';
    }
  }
  
  return 'standard';
}

/**
 * Generate fusion description
 */
function generateFusionDescription(skillA, skillB, fusionType, damage, manaCost, cooldown) {
  const improvements = [];
  
  if (damage > Math.max(skillA.damage || 0, skillB.damage || 0)) {
    improvements.push(`increased damage (${damage})`);
  }
  
  if (manaCost < Math.max(skillA.manaCost || 0, skillB.manaCost || 0)) {
    improvements.push(`reduced mana cost (${manaCost})`);
  }
  
  if (cooldown < Math.max(skillA.cooldown || 0, skillB.cooldown || 0)) {
    improvements.push(`reduced cooldown (${cooldown}s)`);
  }
  
  const improvementText = improvements.length > 0 ? ` with ${improvements.join(', ')}` : '';
  
  return `Fusion of ${skillA.name} and ${skillB.name}${improvementText}.`;
}

/**
 * Extract elemental properties from skill/item
 */
function extractElements(entity) {
  const elements = [];
  const tags = entity.tags || [];
  const description = entity.description || '';
  
  // Check tags for elements
  const elementTags = ['Fire', 'Ice', 'Lightning', 'Poison', 'Holy', 'Shadow', 'Arcane'];
  for (const element of elementTags) {
    if (tags.some(tag => tag.toLowerCase().includes(element.toLowerCase()))) {
      elements.push(element.toLowerCase());
    }
  }
  
  // Check description for elements
  const elementWords = ['fire', 'ice', 'lightning', 'thunder', 'poison', 'holy', 'shadow', 'arcane', 'frost'];
  for (const word of elementWords) {
    if (description.toLowerCase().includes(word)) {
      elements.push(word);
    }
  }
  
  return [...new Set(elements)];
}

/**
 * Check if effects are complementary
 */
function hasComplementaryEffects(effectsA, effectsB) {
  const effectTypesA = effectsA.map(e => e.id);
  const effectTypesB = effectsB.map(e => e.id);
  
  // Complementary pairs
  const complementaryPairs = [
    ['stun', 'damage'],
    ['slow', 'poison'],
    ['bleed', 'weakness'],
    ['burn', 'fear']
  ];
  
  for (const [typeA, typeB] of complementaryPairs) {
    if ((effectTypesA.includes(typeA) && effectTypesB.includes(typeB)) ||
        (effectTypesA.includes(typeB) && effectTypesB.includes(typeA))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate item stat bonus for infusion
 */
function calculateItemStatBonus(item, playerLevel) {
  const baseBonus = {
    damage: Math.floor(playerLevel * 0.5),
    manaReduction: Math.floor((item.manaCost || 0) * 0.2),
    cooldownReduction: Math.floor((item.cooldown || 0) * 0.15)
  };
  
  // Quality multiplier
  const quality = item.quality || 'common';
  const qualityMultipliers = {
    common: 1.0,
    uncommon: 1.2,
    rare: 1.5,
    epic: 2.0,
    legendary: 3.0
  };
  
  const multiplier = qualityMultipliers[quality] || 1.0;
  
  return {
    damage: Math.floor(baseBonus.damage * multiplier),
    manaReduction: Math.floor(baseBonus.manaReduction * multiplier),
    cooldownReduction: Math.floor(baseBonus.cooldownReduction * multiplier)
  };
}

/**
 * Combine skill and item effects
 */
function combineSkillItemEffects(skillEffects, itemEffects) {
  const combined = [...skillEffects];
  
  for (const effect of itemEffects) {
    // Check for existing effect type
    const existing = combined.find(e => e.id === effect.id);
    
    if (existing) {
      // Enhance existing effect
      existing.duration = Math.max(existing.duration || 0, effect.duration || 0);
      existing.potency = (existing.potency || 1) + (effect.potency || 0.5);
    } else {
      // Add new effect with reduced potency
      combined.push({ 
        ...effect, 
        potency: (effect.potency || 1) * 0.7 
      });
    }
  }
  
  return combined;
}

/**
 * Get primary stat from skill/item
 */
function getPrimaryStat(entity) {
  if (entity.damage) return 'damage';
  if (entity.manaCost) return 'mana';
  if (entity.healing) return 'healing';
  if (entity.defense) return 'defense';
  return 'utility';
}

/**
 * Get fusion requirements for display
 */
export function getFusionRequirements() {
  return {
    minLevel: EVOLUTION_REQUIREMENTS.MIN_LEVEL,
    minFusionLevel: EVOLUTION_REQUIREMENTS.MIN_FUSION_LEVEL,
    maxFusions: EVOLUTION_REQUIREMENTS.MAX_FUSIONS,
    hiddenConditionWeight: EVOLUTION_REQUIREMENTS.HIDDEN_CONDITION_WEIGHT
  };
}

/**
 * Get fusion success chance
 */
export function getFusionSuccessChance(context) {
  const { type, player } = context;
  const level = player?.level || 1;
  let baseChance = 0.5; // 50% base chance
  
  // Level bonus
  if (level >= 25) baseChance += 0.2;
  if (level >= 50) baseChance += 0.15;
  
  // Type-specific bonuses
  switch (type) {
    case FUSION_TYPES.SKILL_SKILL:
      if (context.skillA.class === context.skillB.class) {
        baseChance += 0.2; // Class synergy bonus
      }
      break;
    case FUSION_TYPES.SKILL_ITEM:
      if ((context.item.tags || []).includes('Catalyst')) {
        baseChance += 0.3; // Catalyst bonus
      }
      break;
  }
  
  return Math.min(0.95, baseChance); // Cap at 95%
}

/**
 * Get fusion history for player
 */
export function getPlayerFusionHistory(player) {
  return player?.fusionHistory || [];
}

/**
 * Add fusion to player history
 */
export function addFusionToHistory(player, fusionResult) {
  if (!player.fusionHistory) {
    player.fusionHistory = [];
  }
  
  player.fusionHistory.push({
    result: fusionResult.id,
    timestamp: Date.now(),
    level: player.level || 1
  });
  
  // Update fusion count
  if (!player.fusionCount) {
    player.fusionCount = 0;
  }
  player.fusionCount++;
}

// Utility: Deterministic random number generator (seeded)
function getRandom(context) {
  // Use context.rng if provided, else fallback to Math.random (non-deterministic)
  return (context && typeof context.rng === 'function') ? context.rng() : Math.random();
}

// Export constants and functions
export default {
  FUSION_TYPES,
  EVOLUTION_REQUIREMENTS,
  HIDDEN_CONDITIONS,
  canFuseSkills,
  fuseSkills,
  canFuseSkillWithItem,
  fuseSkillWithItem,
  checkHiddenConditions,
  getFusionRequirements,
  getFusionSuccessChance,
  getPlayerFusionHistory,
  addFusionToHistory
};