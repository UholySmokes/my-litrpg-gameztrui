// =================================================================
// CLASS DATA REGISTRY
// Consolidated class data
// Migrated from: src/systems/class/ClassRegistry.js
// =================================================================

/**
 * CLASSES - 20 RPG Classes
 * Each class can be upgraded later to advanced versions
 */
export const classes = [
  {
    id: 'knight',
    name: 'Knight',
    description: 'Heavy armored warrior specializing in defense and protection. Masters of melee combat and shield techniques.',
    upgradePath: 'paladin',
    resourceSystem: 'mana',
    coreMechanics: ['shield_block', 'taunt']
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'Master of arcane magic, wielding powerful elemental spells and mystical energies.',
    upgradePath: 'archmage',
    resourceSystem: 'mana',
    coreMechanics: ['spell_schools', 'arcane_mastery']
  },
  {
    id: 'assassin',
    name: 'Assassin',
    description: 'Stealthy killer specializing in critical strikes, poisons, and shadow magic.',
    upgradePath: 'shadowblade',
    resourceSystem: 'energy',
    coreMechanics: ['stealth', 'poison', 'critical_strikes']
  },
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'Fierce melee fighter focused on raw physical power and weapon mastery.',
    upgradePath: 'berserker',
    resourceSystem: 'rage',
    coreMechanics: ['stance_system', 'weapon_mastery']
  },
  {
    id: 'rogue',
    name: 'Rogue',
    description: 'Sneaky thief and trickster, expert in lockpicking, traps, and quick strikes.',
    upgradePath: 'master_thief',
    resourceSystem: 'energy',
    coreMechanics: ['stealth', 'lockpicking', 'pickpocket', 'traps']
  },
  {
    id: 'priest',
    name: 'Priest',
    description: 'Divine healer and supporter, wielding holy magic to heal allies and smite enemies.',
    upgradePath: 'high_priest',
    resourceSystem: 'mana',
    coreMechanics: ['prayer_system', 'resurrection', 'holy_magic']
  },
  {
    id: 'paladin',
    name: 'Paladin',
    description: 'Holy warrior combining martial prowess with divine magic, protector of the innocent.',
    upgradePath: 'divine_knight',
    resourceSystem: 'mana',
    coreMechanics: ['lay_on_hands', 'divine_shield', 'auras']
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'Wilderness expert, master of archery, tracking, and nature magic.',
    upgradePath: 'beastmaster',
    resourceSystem: 'focus',
    coreMechanics: ['pet_companion', 'tracking', 'traps', 'favored_enemy']
  },
  {
    id: 'monk',
    name: 'Monk',
    description: 'Martial artist using unarmed combat, inner energy, and spiritual discipline.',
    upgradePath: 'grandmaster',
    resourceSystem: 'chi',
    coreMechanics: ['chi_system', 'combo_attacks', 'meditation', 'unarmed_scaling']
  },
  {
    id: 'bard',
    name: 'Bard',
    description: 'Charismatic performer using music, magic, and words to inspire allies and confuse enemies.',
    upgradePath: 'maestro',
    resourceSystem: 'mana',
    coreMechanics: ['performance_system', 'inspiration', 'charm', 'vicious_mockery']
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    description: 'Dark mage commanding undead minions and wielding death magic.',
    upgradePath: 'lich',
    resourceSystem: 'mana',
    coreMechanics: ['summon_undead', 'death_magic', 'life_drain']
  },
  {
    id: 'druid',
    name: 'Druid',
    description: 'Nature guardian who shapeshifts and wields the power of the wild.',
    upgradePath: 'archdruid',
    resourceSystem: 'mana',
    coreMechanics: ['shapeshift', 'nature_magic', 'wild_growth']
  },
  {
    id: 'warlock',
    name: 'Warlock',
    description: 'Pact-bound mage channeling demonic power and dark magic.',
    upgradePath: 'demon_lord',
    resourceSystem: 'mana',
    coreMechanics: ['summon_demons', 'dark_pact', 'soul_shards']
  },
  {
    id: 'shaman',
    name: 'Shaman',
    description: 'Spiritual guide communing with spirits and elements, balancing healing and destruction.',
    upgradePath: 'spirit_walker',
    resourceSystem: 'mana',
    coreMechanics: ['totem_system', 'spirit_link', 'ancestral_spirits', 'elemental_overload']
  },
  {
    id: 'battlemage',
    name: 'Battlemage',
    description: 'Warrior-mage hybrid combining melee combat with offensive magic.',
    upgradePath: 'spellblade',
    resourceSystem: 'mana',
    coreMechanics: ['spell_blade_synergy', 'arcane_strikes']
  },
  {
    id: 'archer',
    name: 'Archer',
    description: 'Ranged combat specialist with exceptional accuracy and speed.',
    upgradePath: 'sniper',
    resourceSystem: 'focus',
    coreMechanics: ['aimed_shot', 'multi_shot', 'rapid_fire']
  },
  {
    id: 'berserker',
    name: 'Berserker',
    description: 'Frenzied warrior who gains power through rage and bloodlust.',
    upgradePath: 'blood_warrior',
    resourceSystem: 'rage',
    coreMechanics: ['rage_system', 'enrage', 'bloodlust', 'rampage']
  },
  {
    id: 'summoner',
    name: 'Summoner',
    description: 'Master of summoning creatures and elementals to fight alongside them.',
    upgradePath: 'conjurer',
    resourceSystem: 'mana',
    coreMechanics: ['summon_elementals', 'multiple_summons', 'elemental_synergy']
  },
  {
    id: 'templar',
    name: 'Templar',
    description: 'Holy warrior specializing in anti-magic and protection against dark forces.',
    upgradePath: 'inquisitor',
    resourceSystem: 'mana',
    coreMechanics: ['anti_magic_field', 'spell_reflection', 'purge', 'holy_shield']
  },
  {
    id: 'shadowblade',
    name: 'Shadowblade',
    description: 'Elite assassin merging shadow magic with deadly blade techniques.',
    upgradePath: 'void_assassin',
    resourceSystem: 'energy',
    coreMechanics: ['shadow_step', 'mark_for_death', 'shadow_strikes']
  }
];

/**
 * Get class by ID
 * @param {string} classId - The class ID
 * @returns {object|null} Class definition or null
 */
function getClassById(classId) {
  return classes.find(c => c.id === classId) || null;
}

/**
 * Get classes by resource system
 * @param {string} resourceSystem - The resource system (mana, rage, chi, energy, focus)
 * @returns {Array} Classes using specified resource
 */
function getClassesByResource(resourceSystem) {
  return classes.filter(c => c.resourceSystem === resourceSystem);
}

/**
 * Get classes by upgrade path
 * @param {string} upgradePath - The upgrade path ID
 * @returns {Array} Classes with matching upgrade path
 */
function getClassesByUpgradePath(upgradePath) {
  return classes.filter(c => c.upgradePath === upgradePath);
}

/**
 * Check if class has specific mechanic
 * @param {string} classId - The class ID
 * @param {string} mechanic - The mechanic to check
 * @returns {boolean} True if class has mechanic
 */
function hasClassMechanic(classId, mechanic) {
  const classData = getClassById(classId);
  return classData?.coreMechanics?.includes(mechanic) || false;
}
