// =================================================================
// CLASS DATA REGISTRY — Tiered Archetype System
// Tier 1: 6 Base Archetypes | Tier 2: 12 Specializations (2 per base)
// Data-driven: systems check resourceSystem, never class names.
// =================================================================

/**
 * @typedef {Object} BaseStats
 * @property {number} strength
 * @property {number} dexterity
 * @property {number} intelligence
 * @property {number} wisdom
 * @property {number} constitution
 * @property {number} charisma
 */

/**
 * @typedef {Object} ClassDef
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {1|2} tier
 * @property {string|null} parentId       - null for Tier 1, parent id for Tier 2
 * @property {string} upgradePath         - kept for EVOLVE_CLASS reducer compat
 * @property {'rage'|'chi'|'mana'|'energy'|'focus'} resourceSystem
 * @property {string[]} coreMechanics
 * @property {BaseStats} baseStats        - modifier deltas (added to race base)
 */

// ── Tier 1 Base Archetypes ──────────────────────────────────────────

const WARRIOR = {
  id: 'warrior',
  name: 'Warrior',
  description: 'Fierce melee fighter fueled by rage. Masters of stances, blocking, and raw physical power.',
  tier: 1,
  parentId: null,
  upgradePath: 'berserker', // default evolution
  resourceSystem: 'rage',
  coreMechanics: ['stance_system', 'block', 'weapon_mastery'],
  baseStats: { strength: 3, dexterity: 1, intelligence: 0, wisdom: 0, constitution: 2, charisma: 0 },
};

const ROGUE = {
  id: 'rogue',
  name: 'Rogue',
  description: 'Cunning trickster who thrives on stealth, combos, and burst damage from the shadows.',
  tier: 1,
  parentId: null,
  upgradePath: 'shadow_assassin',
  resourceSystem: 'energy',
  coreMechanics: ['stealth', 'combo', 'lockpicking', 'traps'],
  baseStats: { strength: 1, dexterity: 3, intelligence: 0, wisdom: 0, constitution: 1, charisma: 1 },
};

const MAGE = {
  id: 'mage',
  name: 'Mage',
  description: 'Wielder of arcane energies, commanding elemental spell schools to devastate foes.',
  tier: 1,
  parentId: null,
  upgradePath: 'archmage',
  resourceSystem: 'mana',
  coreMechanics: ['spell_schools', 'arcane_mastery'],
  baseStats: { strength: 0, dexterity: 1, intelligence: 3, wisdom: 2, constitution: 0, charisma: 0 },
};

const CLERIC = {
  id: 'cleric',
  name: 'Cleric',
  description: 'Divine caster who channels holy power to heal allies and smite the unholy.',
  tier: 1,
  parentId: null,
  upgradePath: 'paladin',
  resourceSystem: 'mana',
  coreMechanics: ['divine_intervention', 'prayer_system', 'holy_magic'],
  baseStats: { strength: 1, dexterity: 0, intelligence: 1, wisdom: 3, constitution: 1, charisma: 0 },
};

const MONK = {
  id: 'monk',
  name: 'Monk',
  description: 'Martial artist channeling inner chi through unarmed strikes, combos, and meditation.',
  tier: 1,
  parentId: null,
  upgradePath: 'drunken_master',
  resourceSystem: 'chi',
  coreMechanics: ['unarmed', 'meditation', 'combo_attacks', 'chi_system'],
  baseStats: { strength: 1, dexterity: 2, intelligence: 0, wisdom: 2, constitution: 1, charisma: 0 },
};

const RANGER = {
  id: 'ranger',
  name: 'Ranger',
  description: 'Wilderness expert combining precision archery, tracking, and a companion bond.',
  tier: 1,
  parentId: null,
  upgradePath: 'beastmaster',
  resourceSystem: 'focus',
  coreMechanics: ['aim', 'pet_companion', 'tracking', 'favored_enemy'],
  baseStats: { strength: 1, dexterity: 2, intelligence: 0, wisdom: 1, constitution: 1, charisma: 1 },
};

// ── Tier 2 Specializations (2 per base) ─────────────────────────────

// Warrior ->
const BERSERKER = {
  id: 'berserker',
  name: 'Berserker',
  description: 'Frenzied warrior who gains power through rage and bloodlust, sacrificing defense for offense.',
  tier: 2,
  parentId: 'warrior',
  upgradePath: null,
  resourceSystem: 'rage',
  coreMechanics: ['rage_system', 'enrage', 'bloodlust', 'rampage'],
  baseStats: { strength: 5, dexterity: 1, intelligence: 0, wisdom: 0, constitution: 2, charisma: 0 },
};

const GUARDIAN = {
  id: 'guardian',
  name: 'Guardian',
  description: 'Immovable bulwark who channels rage into shields, taunts, and stalwart endurance.',
  tier: 2,
  parentId: 'warrior',
  upgradePath: null,
  resourceSystem: 'rage',
  coreMechanics: ['shield_block', 'taunt', 'fortify', 'phalanx'],
  baseStats: { strength: 2, dexterity: 0, intelligence: 0, wisdom: 1, constitution: 5, charisma: 0 },
};

// Rogue ->
const SHADOW_ASSASSIN = {
  id: 'shadow_assassin',
  name: 'Shadow Assassin',
  description: 'Elite killer merging shadow magic with deadly blade techniques for devastating burst.',
  tier: 2,
  parentId: 'rogue',
  upgradePath: null,
  resourceSystem: 'energy',
  coreMechanics: ['stealth', 'critical_strikes', 'poison', 'shadow_step'],
  baseStats: { strength: 1, dexterity: 5, intelligence: 0, wisdom: 0, constitution: 1, charisma: 1 },
};

const TRICKSTER = {
  id: 'trickster',
  name: 'Trickster',
  description: 'Chaotic disruptor who exploits traps, misdirection, and debuffs to control the battlefield.',
  tier: 2,
  parentId: 'rogue',
  upgradePath: null,
  resourceSystem: 'energy',
  coreMechanics: ['traps', 'misdirection', 'debuff_chains', 'evasion'],
  baseStats: { strength: 0, dexterity: 3, intelligence: 2, wisdom: 0, constitution: 1, charisma: 2 },
};

// Mage ->
const ARCHMAGE = {
  id: 'archmage',
  name: 'Archmage',
  description: 'Supreme arcanist mastering all spell schools, wielding devastating elemental power.',
  tier: 2,
  parentId: 'mage',
  upgradePath: null,
  resourceSystem: 'mana',
  coreMechanics: ['spell_schools', 'arcane_mastery', 'mana_surge', 'elemental_overload'],
  baseStats: { strength: 0, dexterity: 1, intelligence: 5, wisdom: 2, constitution: 0, charisma: 0 },
};

const BATTLEMAGE = {
  id: 'battlemage',
  name: 'Battlemage',
  description: 'Warrior-mage hybrid fusing melee strikes with spell-infused blades.',
  tier: 2,
  parentId: 'mage',
  upgradePath: null,
  resourceSystem: 'mana',
  coreMechanics: ['spell_blade_synergy', 'arcane_strikes', 'mana_shield'],
  baseStats: { strength: 2, dexterity: 1, intelligence: 3, wisdom: 1, constitution: 1, charisma: 0 },
};

// Cleric ->
const PALADIN = {
  id: 'paladin',
  name: 'Paladin',
  description: 'Holy warrior combining martial prowess with divine magic and protective auras.',
  tier: 2,
  parentId: 'cleric',
  upgradePath: null,
  resourceSystem: 'mana',
  coreMechanics: ['lay_on_hands', 'divine_shield', 'auras', 'holy_strike'],
  baseStats: { strength: 2, dexterity: 0, intelligence: 1, wisdom: 3, constitution: 2, charisma: 0 },
};

const HIGH_PRIEST = {
  id: 'high_priest',
  name: 'High Priest',
  description: 'Supreme healer and supporter who channels overwhelming holy power to sustain allies.',
  tier: 2,
  parentId: 'cleric',
  upgradePath: null,
  resourceSystem: 'mana',
  coreMechanics: ['prayer_system', 'resurrection', 'divine_intervention', 'mass_heal'],
  baseStats: { strength: 0, dexterity: 0, intelligence: 2, wisdom: 5, constitution: 1, charisma: 0 },
};

// Monk ->
const DRUNKEN_MASTER = {
  id: 'drunken_master',
  name: 'Drunken Master',
  description: 'Unpredictable brawler who channels chi through erratic evasion and counter-attacks.',
  tier: 2,
  parentId: 'monk',
  upgradePath: null,
  resourceSystem: 'chi',
  coreMechanics: ['evasion', 'counter_attack', 'stumble_strikes', 'chi_flow'],
  baseStats: { strength: 1, dexterity: 4, intelligence: 0, wisdom: 2, constitution: 1, charisma: 0 },
};

const IRON_FIST = {
  id: 'iron_fist',
  name: 'Iron Fist',
  description: 'Focused striker who channels chi into devastating, high-impact unarmed blows.',
  tier: 2,
  parentId: 'monk',
  upgradePath: null,
  resourceSystem: 'chi',
  coreMechanics: ['unarmed', 'iron_body', 'focused_strike', 'chi_burst'],
  baseStats: { strength: 3, dexterity: 1, intelligence: 0, wisdom: 2, constitution: 2, charisma: 0 },
};

// Ranger ->
const BEASTMASTER = {
  id: 'beastmaster',
  name: 'Beastmaster',
  description: 'Ranger who forges a deep bond with a combat companion, commanding pets in battle.',
  tier: 2,
  parentId: 'ranger',
  upgradePath: null,
  resourceSystem: 'focus',
  coreMechanics: ['pet_companion', 'pack_assault', 'command_roar', 'beast_bond'],
  baseStats: { strength: 1, dexterity: 2, intelligence: 0, wisdom: 2, constitution: 1, charisma: 2 },
};

const SHARPSHOOTER = {
  id: 'sharpshooter',
  name: 'Sharpshooter',
  description: 'Peerless marksman who focuses on precision shots, trick shots, and ranged domination.',
  tier: 2,
  parentId: 'ranger',
  upgradePath: null,
  resourceSystem: 'focus',
  coreMechanics: ['aimed_shot', 'multi_shot', 'rapid_fire', 'overwatch'],
  baseStats: { strength: 0, dexterity: 4, intelligence: 1, wisdom: 1, constitution: 1, charisma: 1 },
};

// ── Classes array (public, mutable for setClasses / seed compat) ────

/** @type {ClassDef[]} */
export let classes = [
  // Tier 1
  WARRIOR,
  ROGUE,
  MAGE,
  CLERIC,
  MONK,
  RANGER,
  // Tier 2
  BERSERKER,
  GUARDIAN,
  SHADOW_ASSASSIN,
  TRICKSTER,
  ARCHMAGE,
  BATTLEMAGE,
  PALADIN,
  HIGH_PRIEST,
  DRUNKEN_MASTER,
  IRON_FIST,
  BEASTMASTER,
  SHARPSHOOTER,
];

// ── Lookup helpers ──────────────────────────────────────────────────

/**
 * Get class by ID
 * @param {string} classId
 * @returns {ClassDef|null}
 */
function getClassById(classId) {
  return classes.find(c => c.id === classId) || null;
}

/**
 * Get the full lineage (parent + self) for a class.
 * For Tier 1 returns [self]. For Tier 2 returns [parent, self].
 * @param {string} classId
 * @returns {ClassDef[]}
 */
function getClassLineage(classId) {
  const cls = getClassById(classId);
  if (!cls) return [];
  if (cls.tier === 1 || !cls.parentId) return [cls];
  const parent = getClassById(cls.parentId);
  return parent ? [parent, cls] : [cls];
}

/**
 * Get classes by resource system
 * @param {string} resourceSystem
 * @returns {ClassDef[]}
 */
function getClassesByResource(resourceSystem) {
  return classes.filter(c => c.resourceSystem === resourceSystem);
}

/**
 * Get Tier 2 specializations for a Tier 1 base
 * @param {string} parentId
 * @returns {ClassDef[]}
 */
function getSpecializationsFor(parentId) {
  return classes.filter(c => c.parentId === parentId && c.tier === 2);
}

/**
 * Get classes by tier
 * @param {1|2} tier
 * @returns {ClassDef[]}
 */
function getClassesByTier(tier) {
  return classes.filter(c => c.tier === tier);
}

/**
 * @deprecated Use getSpecializationsFor instead
 */
function getClassesByUpgradePath(upgradePath) {
  return classes.filter(c => c.upgradePath === upgradePath);
}

/**
 * Check if class has specific mechanic
 * @param {string} classId
 * @param {string} mechanic
 * @returns {boolean}
 */
function hasClassMechanic(classId, mechanic) {
  const classData = getClassById(classId);
  return classData?.coreMechanics?.includes(mechanic) || false;
}

/**
 * Replace classes array (used by seed / static data bootstrap).
 * @param {ClassDef[]} nextClasses
 */
export function setClasses(nextClasses) {
  if (Array.isArray(nextClasses)) {
    classes = nextClasses;
  }
}

export {
  getClassById,
  getClassLineage,
  getClassesByResource,
  getSpecializationsFor,
  getClassesByTier,
  getClassesByUpgradePath,
  hasClassMechanic,
};
