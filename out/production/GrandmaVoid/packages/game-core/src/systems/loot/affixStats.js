// =================================================================
// AFFIX STATS - Maps affix IDs to their stat modifications
// 
// ⚠️ DEPRECATION NOTICE: This file uses the legacy 3-tier affix system.
// The new T1-T10 tiered affix system is in AffixTierRegistry.js
// New code should use TIERED_PREFIX_POOL and TIERED_SUFFIX_POOL from AffixTierRegistry.js
// This file is kept for backward compatibility with existing items.
// =====================================================
// Core Attributes: str, dex, int, vit, wis, focus, will, luck
// Derived Stats: damage types, crit, speed, defense, etc.
// Conditional Stats: on-hit effects, procs, utility

// Legacy export for backward compatibility
const AFFIX_STATS = {
  fierce: { attack: 5 },
  brutal: { attack: 8 },
  keen: { critChance: 0.05 },
  heavy: { defense: 10 },
  swift: { speed: 5 },
  sacred: { magic: 10 },
  of_power: { attack: 5 },
  of_the_bear: { attack: 5, hp: 10 },
  of_the_fox: { speed: 5 }
};

// =====================================================
// PREFIX POOL - Offensive Stats (Primary)
// =====================================================

export const PREFIX_POOL = [
  // === CORE ATTRIBUTES ===
  { id: 'mighty', name: 'Mighty', namePrefix: 'Mighty', stat: 'str', tags: ['weapon', 'armor'], weight: 10,
    tiers: { 1: { min: 1, max: 3 }, 5: { min: 8, max: 12 }, 10: { min: 20, max: 30 } } },
  { id: 'agile', name: 'Agile', namePrefix: 'Agile', stat: 'dex', tags: ['weapon', 'armor'], weight: 10,
    tiers: { 1: { min: 1, max: 3 }, 5: { min: 8, max: 12 }, 10: { min: 20, max: 30 } } },
  { id: 'brilliant', name: 'Brilliant', namePrefix: 'Brilliant', stat: 'int', tags: ['weapon', 'armor', 'jewelry'], weight: 10,
    tiers: { 1: { min: 1, max: 3 }, 5: { min: 8, max: 12 }, 10: { min: 20, max: 30 } } },
  { id: 'stalwart', name: 'Stalwart', namePrefix: 'Stalwart', stat: 'vit', tags: ['armor'], weight: 10,
    tiers: { 1: { min: 1, max: 3 }, 5: { min: 8, max: 12 }, 10: { min: 20, max: 30 } } },
  { id: 'sagacious', name: 'Sagacious', namePrefix: 'Sagacious', stat: 'wis', tags: ['armor', 'jewelry'], weight: 8,
    tiers: { 1: { min: 1, max: 3 }, 5: { min: 8, max: 12 }, 10: { min: 20, max: 30 } } },
  { id: 'focused', name: 'Focused', namePrefix: 'Focused', stat: 'focus', tags: ['weapon', 'jewelry'], weight: 8,
    tiers: { 1: { min: 1, max: 3 }, 5: { min: 8, max: 12 }, 10: { min: 20, max: 30 } } },
  { id: 'resolute', name: 'Resolute', namePrefix: 'Resolute', stat: 'will', tags: ['armor'], weight: 8,
    tiers: { 1: { min: 1, max: 3 }, 5: { min: 8, max: 12 }, 10: { min: 20, max: 30 } } },
  { id: 'fortunate', name: 'Fortunate', namePrefix: 'Fortunate', stat: 'luck', tags: ['jewelry'], weight: 6,
    tiers: { 1: { min: 1, max: 2 }, 5: { min: 5, max: 8 }, 10: { min: 12, max: 18 } } },

  // === DAMAGE MULTIPLIERS ===
  { id: 'fierce', name: 'Fierce', namePrefix: 'Fierce', stat: 'physicalDamage', tags: ['weapon'], weight: 12,
    tiers: { 1: { min: 3, max: 5 }, 5: { min: 15, max: 25 }, 10: { min: 40, max: 60 } } },
  { id: 'brutal', name: 'Brutal', namePrefix: 'Brutal', stat: 'physicalDamage', tags: ['weapon'], weight: 8,
    tiers: { 1: { min: 5, max: 8 }, 5: { min: 20, max: 35 }, 10: { min: 50, max: 80 } } },
  { id: 'devastating', name: 'Devastating', namePrefix: 'Devastating', stat: 'physicalDamage', tags: ['weapon'], weight: 4,
    tiers: { 1: { min: 8, max: 12 }, 5: { min: 30, max: 50 }, 10: { min: 70, max: 100 } } },
  
  // === ELEMENTAL DAMAGE ===
  { id: 'fiery', name: 'Fiery', namePrefix: 'Fiery', stat: 'fireDamage', tags: ['weapon', 'jewelry'], weight: 8,
    tiers: { 1: { min: 2, max: 5 }, 5: { min: 12, max: 20 }, 10: { min: 30, max: 50 } } },
  { id: 'infernal', name: 'Infernal', namePrefix: 'Infernal', stat: 'fireDamage', tags: ['weapon'], weight: 4,
    tiers: { 1: { min: 5, max: 10 }, 5: { min: 20, max: 35 }, 10: { min: 50, max: 80 } } },
  { id: 'frozen', name: 'Frozen', namePrefix: 'Frozen', stat: 'iceDamage', tags: ['weapon', 'jewelry'], weight: 8,
    tiers: { 1: { min: 2, max: 5 }, 5: { min: 12, max: 20 }, 10: { min: 30, max: 50 } } },
  { id: 'glacial', name: 'Glacial', namePrefix: 'Glacial', stat: 'iceDamage', tags: ['weapon'], weight: 4,
    tiers: { 1: { min: 5, max: 10 }, 5: { min: 20, max: 35 }, 10: { min: 50, max: 80 } } },
  { id: 'shocking', name: 'Shocking', namePrefix: 'Shocking', stat: 'lightningDamage', tags: ['weapon', 'jewelry'], weight: 8,
    tiers: { 1: { min: 2, max: 5 }, 5: { min: 12, max: 20 }, 10: { min: 30, max: 50 } } },
  { id: 'stormforged', name: 'Stormforged', namePrefix: 'Stormforged', stat: 'lightningDamage', tags: ['weapon'], weight: 4,
    tiers: { 1: { min: 5, max: 10 }, 5: { min: 20, max: 35 }, 10: { min: 50, max: 80 } } },
  { id: 'venomous', name: 'Venomous', namePrefix: 'Venomous', stat: 'poisonDamage', tags: ['weapon'], weight: 6,
    tiers: { 1: { min: 2, max: 5 }, 5: { min: 12, max: 20 }, 10: { min: 30, max: 50 } } },
  { id: 'radiant', name: 'Radiant', namePrefix: 'Radiant', stat: 'holyDamage', tags: ['weapon', 'jewelry'], weight: 6,
    tiers: { 1: { min: 2, max: 5 }, 5: { min: 12, max: 20 }, 10: { min: 30, max: 50 } } },
  { id: 'shadow', name: 'Shadow', namePrefix: 'Shadow', stat: 'shadowDamage', tags: ['weapon', 'jewelry'], weight: 6,
    tiers: { 1: { min: 2, max: 5 }, 5: { min: 12, max: 20 }, 10: { min: 30, max: 50 } } },
  { id: 'verdant', name: 'Verdant', namePrefix: 'Verdant', stat: 'natureDamage', tags: ['weapon'], weight: 6,
    tiers: { 1: { min: 2, max: 5 }, 5: { min: 12, max: 20 }, 10: { min: 30, max: 50 } } },
  { id: 'arcane', name: 'Arcane', namePrefix: 'Arcane', stat: 'arcaneDamage', tags: ['weapon', 'jewelry'], weight: 6,
    tiers: { 1: { min: 2, max: 5 }, 5: { min: 12, max: 20 }, 10: { min: 30, max: 50 } } },

  // === CRITICAL STATS ===
  { id: 'keen', name: 'Keen', namePrefix: 'Keen', stat: 'critChance', tags: ['weapon', 'jewelry'], weight: 8,
    tiers: { 1: { min: 1, max: 2 }, 5: { min: 4, max: 6 }, 10: { min: 8, max: 12 } } },
  { id: 'deadly', name: 'Deadly', namePrefix: 'Deadly', stat: 'critDamage', tags: ['weapon'], weight: 6,
    tiers: { 1: { min: 5, max: 10 }, 5: { min: 20, max: 35 }, 10: { min: 50, max: 75 } } },

  // === SPEED & ATTACK ===
  { id: 'swift', name: 'Swift', namePrefix: 'Swift', stat: 'attackSpeed', tags: ['weapon', 'jewelry'], weight: 8,
    tiers: { 1: { min: 2, max: 4 }, 5: { min: 8, max: 12 }, 10: { min: 18, max: 25 } } },
  { id: 'hasty', name: 'Hasty', namePrefix: 'Hasty', stat: 'castSpeed', tags: ['weapon', 'jewelry'], weight: 6,
    tiers: { 1: { min: 2, max: 4 }, 5: { min: 8, max: 12 }, 10: { min: 18, max: 25 } } },

  // === PENETRATION ===
  { id: 'piercing', name: 'Piercing', namePrefix: 'Piercing', stat: 'armorPen', tags: ['weapon'], weight: 6,
    tiers: { 1: { min: 2, max: 4 }, 5: { min: 8, max: 15 }, 10: { min: 20, max: 30 } } },
  { id: 'spellbreaking', name: 'Spellbreaking', namePrefix: 'Spellbreaking', stat: 'magicPen', tags: ['weapon', 'jewelry'], weight: 5,
    tiers: { 1: { min: 2, max: 4 }, 5: { min: 8, max: 15 }, 10: { min: 20, max: 30 } } },

  // === LIFE STEAL ===
  { id: 'sanguine', name: 'Sanguine', namePrefix: 'Sanguine', stat: 'lifeSteal', tags: ['weapon'], weight: 5,
    tiers: { 1: { min: 1, max: 2 }, 5: { min: 3, max: 5 }, 10: { min: 7, max: 10 } } },
  { id: 'vampiric', name: 'Vampiric', namePrefix: 'Vampiric', stat: 'lifeSteal', tags: ['weapon'], weight: 3,
    tiers: { 1: { min: 2, max: 4 }, 5: { min: 5, max: 8 }, 10: { min: 10, max: 15 } } }
];

// =====================================================
// SUFFIX POOL - Defensive & Utility Stats (Secondary)
// =====================================================

export const SUFFIX_POOL = [
  // === HEALTH & DEFENSE ===
  { id: 'of_the_bear', name: 'of the Bear', nameSuffix: 'of the Bear', stat: 'hp', tags: ['armor'], weight: 10,
    tiers: { 1: { min: 5, max: 10 }, 5: { min: 30, max: 50 }, 10: { min: 80, max: 120 } } },
  { id: 'of_the_colossus', name: 'of the Colossus', nameSuffix: 'of the Colossus', stat: 'hp', tags: ['armor'], weight: 4,
    tiers: { 1: { min: 10, max: 20 }, 5: { min: 50, max: 80 }, 10: { min: 120, max: 180 } } },
  { id: 'of_the_turtle', name: 'of the Turtle', nameSuffix: 'of the Turtle', stat: 'defense', tags: ['armor'], weight: 10,
    tiers: { 1: { min: 3, max: 6 }, 5: { min: 15, max: 25 }, 10: { min: 40, max: 60 } } },
  { id: 'of_the_fortress', name: 'of the Fortress', nameSuffix: 'of the Fortress', stat: 'defense', tags: ['armor'], weight: 4,
    tiers: { 1: { min: 6, max: 12 }, 5: { min: 25, max: 40 }, 10: { min: 60, max: 90 } } },
  { id: 'of_vitality', name: 'of Vitality', nameSuffix: 'of Vitality', stat: 'hpRegen', tags: ['armor', 'jewelry'], weight: 8,
    tiers: { 1: { min: 1, max: 2 }, 5: { min: 5, max: 8 }, 10: { min: 12, max: 18 } } },

  // === MANA & MAGIC ===
  { id: 'of_the_scholar', name: 'of the Scholar', nameSuffix: 'of the Scholar', stat: 'mana', tags: ['armor', 'jewelry'], weight: 10,
    tiers: { 1: { min: 5, max: 10 }, 5: { min: 25, max: 40 }, 10: { min: 60, max: 90 } } },
  { id: 'of_the_archmage', name: 'of the Archmage', nameSuffix: 'of the Archmage', stat: 'mana', tags: ['armor', 'jewelry'], weight: 4,
    tiers: { 1: { min: 10, max: 20 }, 5: { min: 40, max: 65 }, 10: { min: 90, max: 140 } } },
  { id: 'of_regeneration', name: 'of Regeneration', nameSuffix: 'of Regeneration', stat: 'manaRegen', tags: ['armor', 'jewelry'], weight: 8,
    tiers: { 1: { min: 1, max: 2 }, 5: { min: 4, max: 7 }, 10: { min: 10, max: 15 } } },

  // === RESISTANCES ===
  { id: 'of_fire_warding', name: 'of Fire Warding', nameSuffix: 'of Fire Warding', stat: 'fireResist', tags: ['armor', 'jewelry'], weight: 6,
    tiers: { 1: { min: 3, max: 6 }, 5: { min: 12, max: 20 }, 10: { min: 28, max: 40 } } },
  { id: 'of_frost_warding', name: 'of Frost Warding', nameSuffix: 'of Frost Warding', stat: 'iceResist', tags: ['armor', 'jewelry'], weight: 6,
    tiers: { 1: { min: 3, max: 6 }, 5: { min: 12, max: 20 }, 10: { min: 28, max: 40 } } },
  { id: 'of_storm_warding', name: 'of Storm Warding', nameSuffix: 'of Storm Warding', stat: 'lightningResist', tags: ['armor', 'jewelry'], weight: 6,
    tiers: { 1: { min: 3, max: 6 }, 5: { min: 12, max: 20 }, 10: { min: 28, max: 40 } } },
  { id: 'of_poison_warding', name: 'of Poison Warding', nameSuffix: 'of Poison Warding', stat: 'poisonResist', tags: ['armor', 'jewelry'], weight: 6,
    tiers: { 1: { min: 3, max: 6 }, 5: { min: 12, max: 20 }, 10: { min: 28, max: 40 } } },
  { id: 'of_the_bulwark', name: 'of the Bulwark', nameSuffix: 'of the Bulwark', stat: 'allResist', tags: ['armor'], weight: 3,
    tiers: { 1: { min: 2, max: 4 }, 5: { min: 8, max: 12 }, 10: { min: 18, max: 25 } } },

  // === SPEED & UTILITY ===
  { id: 'of_the_fox', name: 'of the Fox', nameSuffix: 'of the Fox', stat: 'moveSpeed', tags: ['armor', 'jewelry'], weight: 8,
    tiers: { 1: { min: 2, max: 4 }, 5: { min: 6, max: 10 }, 10: { min: 14, max: 20 } } },
  { id: 'of_the_hawk', name: 'of the Hawk', nameSuffix: 'of the Hawk', stat: 'critChance', tags: ['jewelry'], weight: 6,
    tiers: { 1: { min: 1, max: 2 }, 5: { min: 3, max: 5 }, 10: { min: 6, max: 10 } } },
  { id: 'of_the_tiger', name: 'of the Tiger', nameSuffix: 'of the Tiger', stats: { attackSpeed: 0.5, critChance: 0.5 }, tags: ['jewelry'], weight: 5,
    tiers: { 1: { min: 2, max: 4 }, 5: { min: 6, max: 10 }, 10: { min: 14, max: 20 } } },

  // === EVASION ===
  { id: 'of_evasion', name: 'of Evasion', nameSuffix: 'of Evasion', stat: 'evasion', tags: ['armor'], weight: 6,
    tiers: { 1: { min: 2, max: 4 }, 5: { min: 8, max: 14 }, 10: { min: 20, max: 30 } } },
  { id: 'of_the_wind', name: 'of the Wind', nameSuffix: 'of the Wind', stat: 'dodgeChance', tags: ['armor', 'jewelry'], weight: 5,
    tiers: { 1: { min: 1, max: 2 }, 5: { min: 3, max: 5 }, 10: { min: 7, max: 10 } } },

  // === BLOCK & PARRY ===
  { id: 'of_blocking', name: 'of Blocking', nameSuffix: 'of Blocking', stat: 'blockChance', tags: ['armor'], weight: 6,
    tiers: { 1: { min: 2, max: 4 }, 5: { min: 6, max: 10 }, 10: { min: 14, max: 20 } } },
  { id: 'of_the_guardian', name: 'of the Guardian', nameSuffix: 'of the Guardian', stats: { blockChance: 0.5, defense: 0.5 }, tags: ['armor'], weight: 4,
    tiers: { 1: { min: 4, max: 8 }, 5: { min: 12, max: 20 }, 10: { min: 28, max: 40 } } },

  // === RESOURCE MANAGEMENT ===
  { id: 'of_efficiency', name: 'of Efficiency', nameSuffix: 'of Efficiency', stat: 'cooldownReduction', tags: ['armor', 'jewelry'], weight: 5,
    tiers: { 1: { min: 2, max: 4 }, 5: { min: 6, max: 10 }, 10: { min: 14, max: 20 } } },
  { id: 'of_conservation', name: 'of Conservation', nameSuffix: 'of Conservation', stat: 'resourceCostReduction', tags: ['armor', 'jewelry'], weight: 5,
    tiers: { 1: { min: 2, max: 4 }, 5: { min: 6, max: 10 }, 10: { min: 14, max: 20 } } },

  // === UTILITY ===
  { id: 'of_fortune', name: 'of Fortune', nameSuffix: 'of Fortune', stat: 'magicFind', tags: ['jewelry'], weight: 4,
    tiers: { 1: { min: 3, max: 6 }, 5: { min: 10, max: 18 }, 10: { min: 25, max: 40 } } },
  { id: 'of_greed', name: 'of Greed', nameSuffix: 'of Greed', stat: 'goldFind', tags: ['jewelry'], weight: 4,
    tiers: { 1: { min: 5, max: 10 }, 5: { min: 15, max: 25 }, 10: { min: 35, max: 50 } } },
  { id: 'of_experience', name: 'of Experience', nameSuffix: 'of Experience', stat: 'xpBonus', tags: ['jewelry'], weight: 3,
    tiers: { 1: { min: 3, max: 6 }, 5: { min: 8, max: 14 }, 10: { min: 18, max: 28 } } },

  // === CROWD CONTROL ===
  { id: 'of_stunning', name: 'of Stunning', nameSuffix: 'of Stunning', stat: 'stunDuration', tags: ['weapon'], weight: 4,
    tiers: { 1: { min: 5, max: 10 }, 5: { min: 15, max: 25 }, 10: { min: 30, max: 45 } } },
  { id: 'of_slowing', name: 'of Slowing', nameSuffix: 'of Slowing', stat: 'slowOnHit', tags: ['weapon'], weight: 5,
    tiers: { 1: { min: 5, max: 10 }, 5: { min: 15, max: 25 }, 10: { min: 30, max: 45 } } },
  { id: 'of_tenacity', name: 'of Tenacity', nameSuffix: 'of Tenacity', stat: 'ccResist', tags: ['armor'], weight: 5,
    tiers: { 1: { min: 5, max: 10 }, 5: { min: 15, max: 25 }, 10: { min: 30, max: 45 } } }
];

// =====================================================
// UNIQUE AFFIXES - Legendary+ Only
// =====================================================

export const UNIQUE_AFFIXES = [
  // === WEAPON UNIQUES ===
  { id: 'flickering_ward', name: 'Flickering Ward', description: 'Attacks have a 10% chance to grant a temporary shield.',
    itemTypes: ['weapon'], stats: { shieldOnHit: 50 }, weight: 5 },
  { id: 'soul_siphon', name: 'Soul Siphon', description: 'Killing blows restore 5% of max HP.',
    itemTypes: ['weapon'], stats: { hpOnKill: 5 }, weight: 5 },
  { id: 'chain_lightning', name: 'Chain Lightning', description: 'Attacks have a 15% chance to chain to nearby enemies.',
    itemTypes: ['weapon'], stats: { chainLightning: 15 }, weight: 4 },
  { id: 'executioner', name: 'Executioner', description: '+50% damage to enemies below 30% HP.',
    itemTypes: ['weapon'], stats: { executeDamage: 50 }, weight: 4 },
  { id: 'berserkers_fury', name: "Berserker's Fury", description: '+2% damage for each 1% HP missing.',
    itemTypes: ['weapon'], stats: { berserkDamage: 2 }, weight: 3 },
  { id: 'elemental_mastery', name: 'Elemental Mastery', description: 'Elemental damage ignores 20% of resistance.',
    itemTypes: ['weapon'], stats: { elementalPen: 20 }, weight: 3 },
  
  // === ARMOR UNIQUES ===
  { id: 'second_wind', name: 'Second Wind', description: 'When HP drops below 20%, heal 30% HP (60s cooldown).',
    itemTypes: ['armor'], stats: { secondWind: 30 }, weight: 5 },
  { id: 'thorns_aura', name: 'Thorns Aura', description: 'Reflect 15% of melee damage taken.',
    itemTypes: ['armor'], stats: { thorns: 15 }, weight: 5 },
  { id: 'mana_shield', name: 'Mana Shield', description: '10% of damage taken is absorbed by mana instead.',
    itemTypes: ['armor'], stats: { manaShield: 10 }, weight: 4 },
  { id: 'fortification', name: 'Fortification', description: 'Standing still for 2s grants +25% defense.',
    itemTypes: ['armor'], stats: { fortify: 25 }, weight: 4 },
  { id: 'regenerative_aura', name: 'Regenerative Aura', description: 'Regenerate 1% max HP every 5 seconds.',
    itemTypes: ['armor'], stats: { percentHpRegen: 1 }, weight: 4 },
  
  // === JEWELRY UNIQUES ===
  { id: 'lucky_coin', name: 'Lucky Coin', description: '+100% Gold and Magic Find.',
    itemTypes: ['jewelry'], stats: { goldFind: 100, magicFind: 100 }, weight: 3 },
  { id: 'third_eye', name: 'Third Eye', description: 'Detect hidden enemies and traps.',
    itemTypes: ['jewelry'], stats: { detection: 100 }, weight: 4 },
  { id: 'time_dilation', name: 'Time Dilation', description: '-25% cooldown on all abilities.',
    itemTypes: ['jewelry'], stats: { cooldownReduction: 25 }, weight: 3 },
  { id: 'spirit_link', name: 'Spirit Link', description: 'Minions share 20% of damage you take.',
    itemTypes: ['jewelry'], stats: { spiritLink: 20 }, weight: 3 }
];

// =====================================================
// SET AFFIXES - Divine+ Only
// =====================================================

export const SET_AFFIXES = [
  // === WARRIOR SETS ===
  { id: 'warlords_might', name: "Warlord's Might", setName: 'Warlord', setBonus: { 2: { str: 20 }, 4: { physicalDamage: 30 }, 6: { critDamage: 50 } },
    description: '(2) +20 STR, (4) +30% Physical Damage, (6) +50% Crit Damage', weight: 3 },
  { id: 'guardians_resolve', name: "Guardian's Resolve", setName: 'Guardian', setBonus: { 2: { defense: 30 }, 4: { blockChance: 15 }, 6: { thorns: 25 } },
    description: '(2) +30 Defense, (4) +15% Block, (6) 25% Thorns', weight: 3 },
  
  // === MAGE SETS ===
  { id: 'archmages_wisdom', name: "Archmage's Wisdom", setName: 'Archmage', setBonus: { 2: { int: 20 }, 4: { mana: 100 }, 6: { spellDamage: 40 } },
    description: '(2) +20 INT, (4) +100 Mana, (6) +40% Spell Damage', weight: 3 },
  { id: 'elementalists_fury', name: "Elementalist's Fury", setName: 'Elementalist', setBonus: { 2: { elementalDamage: 15 }, 4: { elementalPen: 10 }, 6: { elementalDamage: 30 } },
    description: '(2) +15% Elemental, (4) +10% Elemental Pen, (6) +30% Elemental', weight: 3 },
  
  // === ROGUE SETS ===
  { id: 'shadows_embrace', name: "Shadow's Embrace", setName: 'Shadow', setBonus: { 2: { dex: 20 }, 4: { critChance: 10 }, 6: { backstabDamage: 50 } },
    description: '(2) +20 DEX, (4) +10% Crit, (6) +50% Backstab Damage', weight: 3 },
  { id: 'assassins_mark', name: "Assassin's Mark", setName: 'Assassin', setBonus: { 2: { poisonDamage: 20 }, 4: { attackSpeed: 15 }, 6: { executeDamage: 30 } },
    description: '(2) +20% Poison, (4) +15% Attack Speed, (6) +30% Execute', weight: 3 },
  
  // === UNIVERSAL SETS ===
  { id: 'survivors_instinct', name: "Survivor's Instinct", setName: 'Survivor', setBonus: { 2: { hp: 50 }, 4: { hpRegen: 10 }, 6: { secondWind: 20 } },
    description: '(2) +50 HP, (4) +10 HP Regen, (6) Second Wind heals 20%', weight: 4 },
  { id: 'fortune_seekers', name: "Fortune Seeker's", setName: 'Fortune', setBonus: { 2: { goldFind: 30 }, 4: { magicFind: 30 }, 6: { xpBonus: 20 } },
    description: '(2) +30% Gold, (4) +30% Magic Find, (6) +20% XP', weight: 4 }
];

// =====================================================
// CATALYSTS - Ancient+ Only (One-time use)
// =====================================================

export const CATALYSTS = {
  // === ELEMENTAL CATALYSTS ===
  fire_catalyst: { id: 'fire_catalyst', name: 'Ember Catalyst', effect: '+20% Fire Damage',
    stats: { fireDamagePercent: 20 }, nameAddition: '(Ember Infused)', rarity: 'rare' },
  ice_catalyst: { id: 'ice_catalyst', name: 'Frost Catalyst', effect: '+20% Ice Damage',
    stats: { iceDamagePercent: 20 }, nameAddition: '(Frost Infused)', rarity: 'rare' },
  lightning_catalyst: { id: 'lightning_catalyst', name: 'Storm Catalyst', effect: '+20% Lightning Damage',
    stats: { lightningDamagePercent: 20 }, nameAddition: '(Storm Infused)', rarity: 'rare' },
  
  // === DEFENSIVE CATALYSTS ===
  defense_catalyst: { id: 'defense_catalyst', name: 'Bulwark Catalyst', effect: '+15% Defense',
    stats: { defensePercent: 15 }, nameAddition: '(Fortified)', rarity: 'rare' },
  health_catalyst: { id: 'health_catalyst', name: 'Vitality Catalyst', effect: '+15% Max HP',
    stats: { hpPercent: 15 }, nameAddition: '(Vitalized)', rarity: 'rare' },
  resist_catalyst: { id: 'resist_catalyst', name: 'Warding Catalyst', effect: '+10% All Resistances',
    stats: { allResistPercent: 10 }, nameAddition: '(Warded)', rarity: 'epic' },
  
  // === ETHEREAL CATALYSTS ===
  lifesteal_catalyst: { id: 'lifesteal_catalyst', name: 'Vampiric Catalyst', effect: '+5% Life Steal',
    stats: { lifeSteal: 5 }, nameAddition: '(Vampiric)', rarity: 'epic' },
  crit_catalyst: { id: 'crit_catalyst', name: 'Precision Catalyst', effect: '+10% Crit Chance',
    stats: { critChance: 10 }, nameAddition: '(Precise)', rarity: 'epic' },
  speed_catalyst: { id: 'speed_catalyst', name: 'Haste Catalyst', effect: '+15% Attack Speed',
    stats: { attackSpeed: 15 }, nameAddition: '(Hastened)', rarity: 'epic' },
  
  // === REFORGING CATALYST ===
  reforge_catalyst: { id: 'reforge_catalyst', name: 'Reforging Catalyst', effect: 'Re-roll one affix at max tier',
    stats: {}, nameAddition: '(Reforged)', rarity: 'legendary', special: 'reforge' },
  perfect_catalyst: { id: 'perfect_catalyst', name: 'Perfection Catalyst', effect: 'Upgrade one affix to perfect roll',
    stats: {}, nameAddition: '(Perfected)', rarity: 'legendary', special: 'perfect' }
};
