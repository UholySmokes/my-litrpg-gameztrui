// =================================================================
// CLASS DATA REGISTRY
// Tiered branching class evolutions with requirement metadata.
// =================================================================

/**
 * @typedef {Object} ClassEvolutionRequirements
 * @property {number} [minLevel]
 * @property {number} [minTotalKills]
 * @property {Record<string, number>} [minAttributes]
 */

/**
 * @typedef {Object} ClassEvolutionOption
 * @property {string} id
 * @property {string} targetId
 * @property {string} name
 * @property {string} description
 * @property {ClassEvolutionRequirements} requirements
 */

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
 * @property {number} tier
 * @property {string|null} parentId
 * @property {string|null} upgradePath
 * @property {'rage'|'chi'|'mana'|'energy'|'focus'} resourceSystem
 * @property {string[]} coreMechanics
 * @property {BaseStats} baseStats
 * @property {ClassEvolutionOption[]} evolutionOptions
 */

const evo = (id, targetId, name, description, requirements = {}) => ({
  id,
  targetId,
  name,
  description,
  requirements,
});

const WARRIOR = {
  id: "warrior",
  name: "Warrior",
  description: "Beginner-friendly frontline fighter focused on direct melee combat.",
  tier: 1,
  parentId: null,
  upgradePath: "berserker",
  resourceSystem: "rage",
  coreMechanics: ["stance_system", "block", "weapon_mastery"],
  baseStats: {
    strength: 3,
    dexterity: 1,
    intelligence: 0,
    wisdom: 0,
    constitution: 2,
    charisma: 0,
  },
  evolutionOptions: [
    evo(
      "warrior_to_berserker",
      "berserker",
      "Berserker",
      "Trade defense for explosive rage damage.",
      { minLevel: 12, minTotalKills: 5, minAttributes: { strength: 12 } },
    ),
    evo(
      "warrior_to_guardian",
      "guardian",
      "Guardian",
      "Become a defensive protector with taunts and shields.",
      { minLevel: 12, minTotalKills: 3, minAttributes: { constitution: 12 } },
    ),
  ],
};

const ROGUE = {
  id: "rogue",
  name: "Rogue",
  description: "Beginner-friendly agile class built around stealth and burst windows.",
  tier: 1,
  parentId: null,
  upgradePath: "shadow_assassin",
  resourceSystem: "energy",
  coreMechanics: ["stealth", "combo", "lockpicking", "traps"],
  baseStats: {
    strength: 1,
    dexterity: 3,
    intelligence: 0,
    wisdom: 0,
    constitution: 1,
    charisma: 1,
  },
  evolutionOptions: [
    evo(
      "rogue_to_shadow_assassin",
      "shadow_assassin",
      "Shadow Assassin",
      "Focus on execution damage and stealth burst chains.",
      { minLevel: 12, minTotalKills: 5, minAttributes: { dexterity: 12 } },
    ),
    evo(
      "rogue_to_trickster",
      "trickster",
      "Trickster",
      "Control fights with traps, misdirection, and utility.",
      { minLevel: 12, minTotalKills: 3, minAttributes: { intelligence: 10 } },
    ),
  ],
};

const MAGE = {
  id: "mage",
  name: "Mage",
  description: "Beginner-friendly caster class using straightforward elemental spells.",
  tier: 1,
  parentId: null,
  upgradePath: "archmage",
  resourceSystem: "mana",
  coreMechanics: ["spell_schools", "arcane_mastery"],
  baseStats: {
    strength: 0,
    dexterity: 1,
    intelligence: 3,
    wisdom: 2,
    constitution: 0,
    charisma: 0,
  },
  evolutionOptions: [
    evo(
      "mage_to_archmage",
      "archmage",
      "Archmage",
      "Specialize in high-output arcane spellcasting.",
      { minLevel: 12, minTotalKills: 4, minAttributes: { intelligence: 13 } },
    ),
    evo(
      "mage_to_battlemage",
      "battlemage",
      "Battlemage",
      "Blend melee pressure with magical offense.",
      { minLevel: 12, minTotalKills: 4, minAttributes: { intelligence: 11, strength: 9 } },
    ),
  ],
};

const CLERIC = {
  id: "cleric",
  name: "Cleric",
  description: "Beginner-friendly support class with healing and protective holy magic.",
  tier: 1,
  parentId: null,
  upgradePath: "paladin",
  resourceSystem: "mana",
  coreMechanics: ["divine_intervention", "prayer_system", "holy_magic"],
  baseStats: {
    strength: 1,
    dexterity: 0,
    intelligence: 1,
    wisdom: 3,
    constitution: 1,
    charisma: 0,
  },
  evolutionOptions: [
    evo(
      "cleric_to_paladin",
      "paladin",
      "Paladin",
      "Evolve into a frontline holy defender.",
      { minLevel: 12, minTotalKills: 4, minAttributes: { wisdom: 11, strength: 10 } },
    ),
    evo(
      "cleric_to_high_priest",
      "high_priest",
      "High Priest",
      "Evolve into a pure support and miracle caster.",
      { minLevel: 12, minTotalKills: 2, minAttributes: { wisdom: 13 } },
    ),
  ],
};

const MONK = {
  id: "monk",
  name: "Monk",
  description: "Beginner-friendly martial class focused on combos and chi control.",
  tier: 1,
  parentId: null,
  upgradePath: "drunken_master",
  resourceSystem: "chi",
  coreMechanics: ["unarmed", "meditation", "combo_attacks", "chi_system"],
  baseStats: {
    strength: 1,
    dexterity: 2,
    intelligence: 0,
    wisdom: 2,
    constitution: 1,
    charisma: 0,
  },
  evolutionOptions: [
    evo(
      "monk_to_drunken_master",
      "drunken_master",
      "Drunken Master",
      "Prioritize evasive movement and counter pressure.",
      { minLevel: 12, minTotalKills: 3, minAttributes: { dexterity: 12 } },
    ),
    evo(
      "monk_to_iron_fist",
      "iron_fist",
      "Iron Fist",
      "Prioritize direct impact and durability.",
      { minLevel: 12, minTotalKills: 4, minAttributes: { strength: 11, constitution: 11 } },
    ),
  ],
};

const RANGER = {
  id: "ranger",
  name: "Ranger",
  description: "Beginner-friendly ranged class with tracking and companion support.",
  tier: 1,
  parentId: null,
  upgradePath: "beastmaster",
  resourceSystem: "focus",
  coreMechanics: ["aim", "pet_companion", "tracking", "favored_enemy"],
  baseStats: {
    strength: 1,
    dexterity: 2,
    intelligence: 0,
    wisdom: 1,
    constitution: 1,
    charisma: 1,
  },
  evolutionOptions: [
    evo(
      "ranger_to_beastmaster",
      "beastmaster",
      "Beastmaster",
      "Command beasts and pressure enemies through coordinated attacks.",
      { minLevel: 12, minTotalKills: 3, minAttributes: { wisdom: 10, charisma: 9 } },
    ),
    evo(
      "ranger_to_sharpshooter",
      "sharpshooter",
      "Sharpshooter",
      "Master precision ranged damage and lethal execution shots.",
      { minLevel: 12, minTotalKills: 5, minAttributes: { dexterity: 13 } },
    ),
  ],
};

const BERSERKER = {
  id: "berserker",
  name: "Berserker",
  description: "Rage specialist that excels at relentless offensive pressure.",
  tier: 2,
  parentId: "warrior",
  upgradePath: "war_reaver",
  resourceSystem: "rage",
  coreMechanics: ["rage_system", "enrage", "bloodlust", "rampage"],
  baseStats: {
    strength: 5,
    dexterity: 1,
    intelligence: 0,
    wisdom: 0,
    constitution: 2,
    charisma: 0,
  },
  evolutionOptions: [
    evo(
      "berserker_to_war_reaver",
      "war_reaver",
      "War Reaver",
      "Perfect your rage into controlled battlefield slaughter.",
      { minLevel: 34, minTotalKills: 45, minAttributes: { strength: 18, constitution: 14 } },
    ),
  ],
};

const GUARDIAN = {
  id: "guardian",
  name: "Guardian",
  description: "Defensive specialist that controls threat and protects allies.",
  tier: 2,
  parentId: "warrior",
  upgradePath: "bulwark_sentinel",
  resourceSystem: "rage",
  coreMechanics: ["shield_block", "taunt", "fortify", "phalanx"],
  baseStats: {
    strength: 2,
    dexterity: 0,
    intelligence: 0,
    wisdom: 1,
    constitution: 5,
    charisma: 0,
  },
  evolutionOptions: [
    evo(
      "guardian_to_bulwark_sentinel",
      "bulwark_sentinel",
      "Bulwark Sentinel",
      "Anchor entire encounters with superior defense and threat control.",
      { minLevel: 34, minTotalKills: 30, minAttributes: { constitution: 19, wisdom: 12 } },
    ),
  ],
};

const SHADOW_ASSASSIN = {
  id: "shadow_assassin",
  name: "Shadow Assassin",
  description: "Stealth killer focused on target deletion and reset pressure.",
  tier: 2,
  parentId: "rogue",
  upgradePath: "night_reaper",
  resourceSystem: "energy",
  coreMechanics: ["stealth", "critical_strikes", "poison", "shadow_step"],
  baseStats: {
    strength: 1,
    dexterity: 5,
    intelligence: 0,
    wisdom: 0,
    constitution: 1,
    charisma: 1,
  },
  evolutionOptions: [
    evo(
      "shadow_assassin_to_night_reaper",
      "night_reaper",
      "Night Reaper",
      "Turn every opening into a chain of execution windows.",
      { minLevel: 34, minTotalKills: 50, minAttributes: { dexterity: 19 } },
    ),
  ],
};

const TRICKSTER = {
  id: "trickster",
  name: "Trickster",
  description: "Control specialist using disruption, debuffs, and positioning.",
  tier: 2,
  parentId: "rogue",
  upgradePath: "chaos_saboteur",
  resourceSystem: "energy",
  coreMechanics: ["traps", "misdirection", "debuff_chains", "evasion"],
  baseStats: {
    strength: 0,
    dexterity: 3,
    intelligence: 2,
    wisdom: 0,
    constitution: 1,
    charisma: 2,
  },
  evolutionOptions: [
    evo(
      "trickster_to_chaos_saboteur",
      "chaos_saboteur",
      "Chaos Saboteur",
      "Dominate encounter pacing through layered disruption tools.",
      { minLevel: 34, minTotalKills: 35, minAttributes: { intelligence: 16, dexterity: 15 } },
    ),
  ],
};

const ARCHMAGE = {
  id: "archmage",
  name: "Archmage",
  description: "High-output caster with broad elemental and arcane control.",
  tier: 2,
  parentId: "mage",
  upgradePath: "astral_archon",
  resourceSystem: "mana",
  coreMechanics: ["spell_schools", "arcane_mastery", "mana_surge", "elemental_overload"],
  baseStats: {
    strength: 0,
    dexterity: 1,
    intelligence: 5,
    wisdom: 2,
    constitution: 0,
    charisma: 0,
  },
  evolutionOptions: [
    evo(
      "archmage_to_astral_archon",
      "astral_archon",
      "Astral Archon",
      "Specialize into large-scale battlefield arcana.",
      { minLevel: 34, minTotalKills: 40, minAttributes: { intelligence: 20, wisdom: 14 } },
    ),
  ],
};

const BATTLEMAGE = {
  id: "battlemage",
  name: "Battlemage",
  description: "Hybrid frontliner combining weapon control with mana burst.",
  tier: 2,
  parentId: "mage",
  upgradePath: "spellbreaker",
  resourceSystem: "mana",
  coreMechanics: ["spell_blade_synergy", "arcane_strikes", "mana_shield"],
  baseStats: {
    strength: 2,
    dexterity: 1,
    intelligence: 3,
    wisdom: 1,
    constitution: 1,
    charisma: 0,
  },
  evolutionOptions: [
    evo(
      "battlemage_to_spellbreaker",
      "spellbreaker",
      "Spellbreaker",
      "Specialize in anti-caster pressure and empowered blade bursts.",
      { minLevel: 34, minTotalKills: 38, minAttributes: { intelligence: 16, strength: 14 } },
    ),
  ],
};

const PALADIN = {
  id: "paladin",
  name: "Paladin",
  description: "Holy tank that blends support utility with close combat.",
  tier: 2,
  parentId: "cleric",
  upgradePath: "dawn_vindicator",
  resourceSystem: "mana",
  coreMechanics: ["lay_on_hands", "divine_shield", "auras", "holy_strike"],
  baseStats: {
    strength: 2,
    dexterity: 0,
    intelligence: 1,
    wisdom: 3,
    constitution: 2,
    charisma: 0,
  },
  evolutionOptions: [
    evo(
      "paladin_to_dawn_vindicator",
      "dawn_vindicator",
      "Dawn Vindicator",
      "Specialize in radiant frontline pressure and party protection.",
      { minLevel: 34, minTotalKills: 35, minAttributes: { wisdom: 16, strength: 14 } },
    ),
  ],
};

const HIGH_PRIEST = {
  id: "high_priest",
  name: "High Priest",
  description: "Dedicated healer and support caster with miracle-level utility.",
  tier: 2,
  parentId: "cleric",
  upgradePath: "oracle_hierophant",
  resourceSystem: "mana",
  coreMechanics: ["prayer_system", "resurrection", "divine_intervention", "mass_heal"],
  baseStats: {
    strength: 0,
    dexterity: 0,
    intelligence: 2,
    wisdom: 5,
    constitution: 1,
    charisma: 0,
  },
  evolutionOptions: [
    evo(
      "high_priest_to_oracle_hierophant",
      "oracle_hierophant",
      "Oracle Hierophant",
      "Specialize in advanced ritual support and sustained party control.",
      { minLevel: 34, minTotalKills: 25, minAttributes: { wisdom: 20, intelligence: 14 } },
    ),
  ],
};

const DRUNKEN_MASTER = {
  id: "drunken_master",
  name: "Drunken Master",
  description: "Evasive counter specialist with unpredictable combo routing.",
  tier: 2,
  parentId: "monk",
  upgradePath: "tempest_reveler",
  resourceSystem: "chi",
  coreMechanics: ["evasion", "counter_attack", "stumble_strikes", "chi_flow"],
  baseStats: {
    strength: 1,
    dexterity: 4,
    intelligence: 0,
    wisdom: 2,
    constitution: 1,
    charisma: 0,
  },
  evolutionOptions: [
    evo(
      "drunken_master_to_tempest_reveler",
      "tempest_reveler",
      "Tempest Reveler",
      "Specialize in flowing counters and continuous chi tempo.",
      { minLevel: 34, minTotalKills: 36, minAttributes: { dexterity: 18, wisdom: 13 } },
    ),
  ],
};

const IRON_FIST = {
  id: "iron_fist",
  name: "Iron Fist",
  description: "High-impact brawler that converts chi into burst force.",
  tier: 2,
  parentId: "monk",
  upgradePath: "adamant_champion",
  resourceSystem: "chi",
  coreMechanics: ["unarmed", "iron_body", "focused_strike", "chi_burst"],
  baseStats: {
    strength: 3,
    dexterity: 1,
    intelligence: 0,
    wisdom: 2,
    constitution: 2,
    charisma: 0,
  },
  evolutionOptions: [
    evo(
      "iron_fist_to_adamant_champion",
      "adamant_champion",
      "Adamant Champion",
      "Specialize in durable close-range burst and breaker techniques.",
      { minLevel: 34, minTotalKills: 40, minAttributes: { strength: 17, constitution: 16 } },
    ),
  ],
};

const BEASTMASTER = {
  id: "beastmaster",
  name: "Beastmaster",
  description: "Companion commander centered on coordinated pressure.",
  tier: 2,
  parentId: "ranger",
  upgradePath: "primal_overlord",
  resourceSystem: "focus",
  coreMechanics: ["pet_companion", "pack_assault", "command_roar", "beast_bond"],
  baseStats: {
    strength: 1,
    dexterity: 2,
    intelligence: 0,
    wisdom: 2,
    constitution: 1,
    charisma: 2,
  },
  evolutionOptions: [
    evo(
      "beastmaster_to_primal_overlord",
      "primal_overlord",
      "Primal Overlord",
      "Specialize in high-command companion tactics and synchronized assaults.",
      { minLevel: 34, minTotalKills: 30, minAttributes: { wisdom: 16, charisma: 13 } },
    ),
  ],
};

const SHARPSHOOTER = {
  id: "sharpshooter",
  name: "Sharpshooter",
  description: "Precision marksman focused on range control and finisher damage.",
  tier: 2,
  parentId: "ranger",
  upgradePath: "deadeye_commander",
  resourceSystem: "focus",
  coreMechanics: ["aimed_shot", "multi_shot", "rapid_fire", "overwatch"],
  baseStats: {
    strength: 0,
    dexterity: 4,
    intelligence: 1,
    wisdom: 1,
    constitution: 1,
    charisma: 1,
  },
  evolutionOptions: [
    evo(
      "sharpshooter_to_deadeye_commander",
      "deadeye_commander",
      "Deadeye Commander",
      "Specialize in advanced kill windows and ranged battlefield control.",
      { minLevel: 34, minTotalKills: 45, minAttributes: { dexterity: 20, wisdom: 12 } },
    ),
  ],
};

const WAR_REAVER = {
  id: "war_reaver",
  name: "War Reaver",
  description: "Final berserker evolution with refined rage output and sustain.",
  tier: 3,
  parentId: "berserker",
  upgradePath: null,
  resourceSystem: "rage",
  coreMechanics: ["frenzy_chaining", "lifesteal_pressure", "rage_conversion"],
  baseStats: { strength: 7, dexterity: 2, intelligence: 0, wisdom: 0, constitution: 4, charisma: 0 },
  evolutionOptions: [],
};

const BULWARK_SENTINEL = {
  id: "bulwark_sentinel",
  name: "Bulwark Sentinel",
  description: "Final guardian evolution with maximum protection specialization.",
  tier: 3,
  parentId: "guardian",
  upgradePath: null,
  resourceSystem: "rage",
  coreMechanics: ["aegis_rotation", "lockdown_control", "threat_conversion"],
  baseStats: { strength: 4, dexterity: 0, intelligence: 0, wisdom: 2, constitution: 8, charisma: 0 },
  evolutionOptions: [],
};

const NIGHT_REAPER = {
  id: "night_reaper",
  name: "Night Reaper",
  description: "Final assassin evolution focused on absolute elimination windows.",
  tier: 3,
  parentId: "shadow_assassin",
  upgradePath: null,
  resourceSystem: "energy",
  coreMechanics: ["execution_chain", "stealth_reset", "toxin_amplification"],
  baseStats: { strength: 2, dexterity: 8, intelligence: 1, wisdom: 0, constitution: 2, charisma: 1 },
  evolutionOptions: [],
};

const CHAOS_SABOTEUR = {
  id: "chaos_saboteur",
  name: "Chaos Saboteur",
  description: "Final trickster evolution for complete encounter disruption.",
  tier: 3,
  parentId: "trickster",
  upgradePath: null,
  resourceSystem: "energy",
  coreMechanics: ["trap_webs", "debuff_lock", "tempo_break"],
  baseStats: { strength: 1, dexterity: 5, intelligence: 5, wisdom: 1, constitution: 2, charisma: 3 },
  evolutionOptions: [],
};

const ASTRAL_ARCHON = {
  id: "astral_archon",
  name: "Astral Archon",
  description: "Final archmage evolution with large-scale arcane mastery.",
  tier: 3,
  parentId: "archmage",
  upgradePath: null,
  resourceSystem: "mana",
  coreMechanics: ["astral_channel", "mass_casting", "mana_field_control"],
  baseStats: { strength: 0, dexterity: 1, intelligence: 8, wisdom: 4, constitution: 1, charisma: 0 },
  evolutionOptions: [],
};

const SPELLBREAKER = {
  id: "spellbreaker",
  name: "Spellbreaker",
  description: "Final battlemage evolution specializing in anti-caster warfare.",
  tier: 3,
  parentId: "battlemage",
  upgradePath: null,
  resourceSystem: "mana",
  coreMechanics: ["mana_disrupt", "blade_casting", "counter_magic"],
  baseStats: { strength: 4, dexterity: 2, intelligence: 6, wisdom: 2, constitution: 3, charisma: 0 },
  evolutionOptions: [],
};

const DAWN_VINDICATOR = {
  id: "dawn_vindicator",
  name: "Dawn Vindicator",
  description: "Final paladin evolution with elite holy frontline specialization.",
  tier: 3,
  parentId: "paladin",
  upgradePath: null,
  resourceSystem: "mana",
  coreMechanics: ["radiant_guard", "holy_charge", "vow_mastery"],
  baseStats: { strength: 5, dexterity: 1, intelligence: 2, wisdom: 6, constitution: 4, charisma: 1 },
  evolutionOptions: [],
};

const ORACLE_HIEROPHANT = {
  id: "oracle_hierophant",
  name: "Oracle Hierophant",
  description: "Final priest evolution focused on advanced ritual and support control.",
  tier: 3,
  parentId: "high_priest",
  upgradePath: null,
  resourceSystem: "mana",
  coreMechanics: ["miracle_cycle", "ritual_links", "divine_forecast"],
  baseStats: { strength: 1, dexterity: 0, intelligence: 5, wisdom: 8, constitution: 2, charisma: 1 },
  evolutionOptions: [],
};

const TEMPEST_REVELER = {
  id: "tempest_reveler",
  name: "Tempest Reveler",
  description: "Final drunken style evolution for relentless evasive combos.",
  tier: 3,
  parentId: "drunken_master",
  upgradePath: null,
  resourceSystem: "chi",
  coreMechanics: ["flow_state", "counter_chains", "chi_tempo"],
  baseStats: { strength: 3, dexterity: 7, intelligence: 1, wisdom: 4, constitution: 3, charisma: 1 },
  evolutionOptions: [],
};

const ADAMANT_CHAMPION = {
  id: "adamant_champion",
  name: "Adamant Champion",
  description: "Final iron style evolution with superior strike durability.",
  tier: 3,
  parentId: "iron_fist",
  upgradePath: null,
  resourceSystem: "chi",
  coreMechanics: ["impact_weaving", "adamant_body", "breaker_forms"],
  baseStats: { strength: 7, dexterity: 2, intelligence: 0, wisdom: 4, constitution: 5, charisma: 0 },
  evolutionOptions: [],
};

const PRIMAL_OVERLORD = {
  id: "primal_overlord",
  name: "Primal Overlord",
  description: "Final beastmaster evolution for dominant companion command.",
  tier: 3,
  parentId: "beastmaster",
  upgradePath: null,
  resourceSystem: "focus",
  coreMechanics: ["pack_dominion", "bond_amplification", "wildfield_command"],
  baseStats: { strength: 3, dexterity: 4, intelligence: 1, wisdom: 5, constitution: 3, charisma: 5 },
  evolutionOptions: [],
};

const DEADEYE_COMMANDER = {
  id: "deadeye_commander",
  name: "Deadeye Commander",
  description: "Final sharpshooter evolution for precision control and kill pressure.",
  tier: 3,
  parentId: "sharpshooter",
  upgradePath: null,
  resourceSystem: "focus",
  coreMechanics: ["killzone_control", "precision_cycle", "long_range_command"],
  baseStats: { strength: 1, dexterity: 8, intelligence: 2, wisdom: 4, constitution: 2, charisma: 2 },
  evolutionOptions: [],
};

/** @type {ClassDef[]} */
export let classes = [
  WARRIOR,
  ROGUE,
  MAGE,
  CLERIC,
  MONK,
  RANGER,
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
  WAR_REAVER,
  BULWARK_SENTINEL,
  NIGHT_REAPER,
  CHAOS_SABOTEUR,
  ASTRAL_ARCHON,
  SPELLBREAKER,
  DAWN_VINDICATOR,
  ORACLE_HIEROPHANT,
  TEMPEST_REVELER,
  ADAMANT_CHAMPION,
  PRIMAL_OVERLORD,
  DEADEYE_COMMANDER,
];

function getClassById(classId) {
  return classes.find((entry) => entry.id === classId) || null;
}

function getClassLineage(classId) {
  const lineage = [];
  let current = getClassById(classId);
  const seen = new Set();

  while (current && !seen.has(current.id)) {
    lineage.unshift(current);
    seen.add(current.id);
    current = current.parentId ? getClassById(current.parentId) : null;
  }

  return lineage;
}

function getClassesByResource(resourceSystem) {
  return classes.filter((entry) => entry.resourceSystem === resourceSystem);
}

function getSpecializationsFor(parentId) {
  const parent = getClassById(parentId);
  if (!parent) return [];
  return classes.filter((entry) => entry.parentId === parent.id);
}

function getClassesByTier(tier) {
  return classes.filter((entry) => entry.tier === tier);
}

function getClassesByUpgradePath(upgradePath) {
  return classes.filter((entry) => entry.upgradePath === upgradePath);
}

function hasClassMechanic(classId, mechanic) {
  const classData = getClassById(classId);
  return classData?.coreMechanics?.includes(mechanic) || false;
}

function getClassEvolutionOptions(classId) {
  const classData = getClassById(classId);
  return Array.isArray(classData?.evolutionOptions)
    ? classData.evolutionOptions
    : [];
}

function getClassEvolutionOption(classId, evolutionIdOrTargetId) {
  if (!evolutionIdOrTargetId) return null;
  const options = getClassEvolutionOptions(classId);
  return (
    options.find(
      (option) =>
        option.id === evolutionIdOrTargetId ||
        option.targetId === evolutionIdOrTargetId,
    ) || null
  );
}

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
  getClassEvolutionOptions,
  getClassEvolutionOption,
  hasClassMechanic,
};
