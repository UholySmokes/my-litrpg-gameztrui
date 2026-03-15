// =================================================================
// TALENT DEFINITIONS
// Defines the ex-rank talents available in the game
// =================================================================

import { random, shuffle } from "../../utils/DeterministicRandom.js";

/**
 * RACES - 20 Fantasy/Cultivation themed races
 */
export const RACES = [
  {
    id: "pure_human",
    name: "Pure Human",
    description:
      "A standard human with no special bloodline. Versatile and adaptable.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 0,
      agi: 0,
      dex: 0,
      int: 0,
      cha: 1,
      will: 1,
      luck: 0,
      soul: 0,
    },
  },
  {
    id: "neo_human",
    name: "Neo-Human",
    description:
      "Human with cybernetic enhancements. Enhanced physical capabilities.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 1,
      dex: 1,
      int: 0,
      cha: 0,
      will: 0,
      luck: 0,
      soul: -1,
    },
  },
  {
    id: "ancient_bloodline",
    name: "Ancient Bloodline",
    description:
      "Descendant of an ancient powerful lineage. Natural affinity for cultivation.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 0,
      agi: 0,
      dex: 0,
      int: 2,
      cha: 1,
      will: 1,
      luck: 1,
      soul: 2,
    },
  },
  {
    id: "spirit_beast",
    name: "Spirit Beast",
    description: "A creature with spiritual energy flowing through its veins.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 2,
      agi: 2,
      dex: 1,
      int: 0,
      cha: -1,
      will: 1,
      luck: 0,
      soul: 1,
    },
  },
  {
    id: "demon_kin",
    name: "Demon Kin",
    description:
      "Mixed heritage with demonic ancestry. Dark power courses through you.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 2,
      agi: 1,
      dex: 0,
      int: 1,
      cha: -1,
      will: 2,
      luck: -1,
      soul: 1,
    },
  },
  {
    id: "celestial_descendant",
    name: "Celestial Descendant",
    description:
      "Bloodline touched by celestial beings. Radiant energy within.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 0,
      agi: 1,
      dex: 1,
      int: 2,
      cha: 2,
      will: 1,
      luck: 1,
      soul: 1,
    },
  },
  {
    id: "shadow_walker",
    name: "Shadow Walker",
    description:
      "Born from the void between realms. Natural stealth and darkness affinity.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 0,
      agi: 2,
      dex: 2,
      int: 1,
      cha: 0,
      will: 1,
      luck: 0,
      soul: 1,
    },
  },
  {
    id: "dragon_blood",
    name: "Dragon Blood",
    description:
      "Ancient dragon heritage. Immense physical and magical potential.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 2,
      agi: 1,
      dex: 0,
      int: 2,
      cha: 1,
      will: 2,
      luck: 0,
      soul: 1,
    },
  },
  {
    id: "elemental_attuned",
    name: "Elemental Attuned",
    description: "Born with natural connection to elemental forces.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 0,
      agi: 0,
      dex: 1,
      int: 2,
      cha: 1,
      will: 1,
      luck: 1,
      soul: 2,
    },
  },
  {
    id: "mutant",
    name: "Mutant",
    description:
      "Genetic mutation grants unique abilities. Unpredictable potential.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 1,
      dex: 1,
      int: 1,
      cha: 0,
      will: 0,
      luck: 2,
      soul: 1,
    },
  },
  {
    id: "undead_awakened",
    name: "Undead Awakened",
    description:
      "Returned from death with consciousness. Death energy flows through you.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 0,
      dex: 0,
      int: 1,
      cha: -2,
      will: 3,
      luck: -1,
      soul: 2,
    },
  },
  {
    id: "fae_touched",
    name: "Fae Touched",
    description: "Touched by fae magic. Natural charm and illusion affinity.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 0,
      agi: 1,
      dex: 1,
      int: 1,
      cha: 3,
      will: 0,
      luck: 2,
      soul: 1,
    },
  },
  {
    id: "beast_kin",
    name: "Beast Kin",
    description:
      "Human with animalistic traits. Enhanced senses and physical prowess.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 2,
      agi: 2,
      dex: 1,
      int: -1,
      cha: 0,
      will: 1,
      luck: 1,
      soul: 0,
    },
  },
  {
    id: "mechanical_construct",
    name: "Mechanical Construct",
    description:
      "Living machine with artificial intelligence. Perfect precision.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 0,
      dex: 3,
      int: 2,
      cha: -2,
      will: 2,
      luck: 0,
      soul: -1,
    },
  },
  {
    id: "void_walker",
    name: "Void Walker",
    description:
      "Born in the void between dimensions. Space-time manipulation potential.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 0,
      agi: 1,
      dex: 1,
      int: 3,
      cha: 0,
      will: 2,
      luck: 1,
      soul: 2,
    },
  },
  {
    id: "phoenix_reborn",
    name: "Phoenix Reborn",
    description: "Reborn from ashes. Fire affinity and resurrection potential.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 1,
      dex: 1,
      int: 2,
      cha: 1,
      will: 2,
      luck: 2,
      soul: 2,
    },
  },
  {
    id: "nature_spirit",
    name: "Nature Spirit",
    description: "One with nature. Life energy and plant manipulation.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 0,
      agi: 1,
      dex: 1,
      int: 2,
      cha: 2,
      will: 1,
      luck: 1,
      soul: 2,
    },
  },
  {
    id: "crystal_being",
    name: "Crystal Being",
    description: "Living crystal entity. Hard defense and energy storage.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: -1,
      dex: 0,
      int: 2,
      cha: 0,
      will: 3,
      luck: 0,
      soul: 2,
    },
  },
  {
    id: "chaos_born",
    name: "Chaos Born",
    description: "Born from chaos energy. Unpredictable and powerful.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 1,
      dex: 1,
      int: 1,
      cha: 0,
      will: 1,
      luck: 3,
      soul: 1,
    },
  },
  {
    id: "divine_scion",
    name: "Divine Scion",
    description: "Child of a minor deity. Blessed with divine favor.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 1,
      dex: 1,
      int: 1,
      cha: 2,
      will: 1,
      luck: 2,
      soul: 2,
    },
  },
];

/**
 * CLASSES - 20 RPG Classes (mix of traditional and unique)
 * Each class can be upgraded later to advanced versions
 */
export const CLASSES = [
  {
    id: "knight",
    name: "Knight",
    description:
      "Heavy armored warrior specializing in defense and protection. Masters of melee combat and shield techniques.",
    upgradePath: "paladin",
  },
  {
    id: "mage",
    name: "Mage",
    description:
      "Master of arcane magic, wielding powerful elemental spells and mystical energies.",
    upgradePath: "archmage",
  },
  {
    id: "assassin",
    name: "Assassin",
    description:
      "Stealthy killer specializing in critical strikes, poisons, and shadow magic.",
    upgradePath: "shadowblade",
  },
  {
    id: "warrior",
    name: "Warrior",
    description:
      "Fierce melee fighter focused on raw physical power and weapon mastery.",
    upgradePath: "berserker",
  },
  {
    id: "rogue",
    name: "Rogue",
    description:
      "Sneaky thief and trickster, expert in lockpicking, traps, and quick strikes.",
    upgradePath: "master_thief",
  },
  {
    id: "priest",
    name: "Priest",
    description:
      "Divine healer and supporter, wielding holy magic to heal allies and smite enemies.",
    upgradePath: "high_priest",
  },
  {
    id: "paladin",
    name: "Paladin",
    description:
      "Holy warrior combining martial prowess with divine magic, protector of the innocent.",
    upgradePath: "divine_knight",
  },
  {
    id: "ranger",
    name: "Ranger",
    description:
      "Wilderness expert, master of archery, tracking, and nature magic.",
    upgradePath: "beastmaster",
  },
  {
    id: "monk",
    name: "Monk",
    description:
      "Martial artist using unarmed combat, inner energy, and spiritual discipline.",
    upgradePath: "grandmaster",
  },
  {
    id: "bard",
    name: "Bard",
    description:
      "Charismatic performer using music, magic, and words to inspire allies and confuse enemies.",
    upgradePath: "maestro",
  },
  {
    id: "necromancer",
    name: "Necromancer",
    description:
      "Dark mage commanding undead minions and wielding death magic.",
    upgradePath: "lich",
  },
  {
    id: "druid",
    name: "Druid",
    description:
      "Nature guardian who shapeshifts and wields the power of the wild.",
    upgradePath: "archdruid",
  },
  {
    id: "warlock",
    name: "Warlock",
    description: "Pact-bound mage channeling demonic power and dark magic.",
    upgradePath: "demon_lord",
  },
  {
    id: "shaman",
    name: "Shaman",
    description:
      "Spiritual guide communing with spirits and elements, balancing healing and destruction.",
    upgradePath: "spirit_walker",
  },
  {
    id: "battlemage",
    name: "Battlemage",
    description:
      "Warrior-mage hybrid combining melee combat with offensive magic.",
    upgradePath: "spellblade",
  },
  {
    id: "archer",
    name: "Archer",
    description:
      "Ranged combat specialist with exceptional accuracy and speed.",
    upgradePath: "sniper",
  },
  {
    id: "berserker",
    name: "Berserker",
    description: "Frenzied warrior who gains power through rage and bloodlust.",
    upgradePath: "blood_warrior",
  },
  {
    id: "summoner",
    name: "Summoner",
    description:
      "Master of summoning creatures and elementals to fight alongside them.",
    upgradePath: "conjurer",
  },
  {
    id: "templar",
    name: "Templar",
    description:
      "Holy warrior specializing in anti-magic and protection against dark forces.",
    upgradePath: "inquisitor",
  },
  {
    id: "shadowblade",
    name: "Shadowblade",
    description:
      "Elite assassin merging shadow magic with deadly blade techniques.",
    upgradePath: "void_assassin",
  },
];

/**
 * EX-RANK TALENTS - 120 powerful hidden abilities
 */
export const exRankTalents = [
  {
    id: "infinite_mana_regen",
    name: "Infinite Mana Regeneration",
    description: "Mana regenerates endlessly and ignores depletion.",
  },
  {
    id: "mana_cost_zero",
    name: "Zero Mana Cost",
    description: "All skills ignore mana costs.",
  },
  {
    id: "cooldown_removal",
    name: "Cooldown Removal",
    description: "Abilities recharge instantly with no cooldown.",
  },
  {
    id: "damage_immunity",
    name: "Damage Immunity",
    description: "Negate incoming damage from all sources.",
  },
  {
    id: "death_immunity",
    name: "Death Immunity",
    description: "Lethal hits are canceled and leave you at 1 HP.",
  },
  {
    id: "critical_guarantee",
    name: "Guaranteed Critical",
    description: "Your critical hits always trigger.",
  },
  {
    id: "hundred_percent_drop",
    name: "100% Drop Rate",
    description: "All enemies drop loot without fail.",
  },
  {
    id: "override_drop_quality",
    name: "Legendary Drop Override",
    description: "Forces dropped items to roll at legendary quality.",
  },
  {
    id: "status_immunity",
    name: "Status Immunity",
    description: "You cannot be afflicted by negative statuses.",
  },
  {
    id: "remove_stat_cap",
    name: "Stat Cap Removal",
    description: "Ignore all soft and hard stat caps.",
  },
  {
    id: "control_rng",
    name: "RNG Control",
    description: "Bend randomness to favor your outcomes.",
  },
  {
    id: "auto_combat_ai",
    name: "Auto-Combat AI",
    description: "Automatic combat routines execute optimal actions.",
  },
  {
    id: "experience_multiplier",
    name: "Experience Multiplier",
    description: "Gain massively increased experience from all sources.",
  },
  {
    id: "enchanter",
    name: "Enchanter",
    description: "Enhances charm potency and duration.",
  },
  {
    id: "stealth_mastery",
    name: "Stealth Mastery",
    description: "Improves stealth uptime and backstab windows.",
  },
  {
    id: "arcane_surge",
    name: "Arcane Surge",
    description: "Arcane Surge boosts spell power after casting.",
  },
  {
    id: "arcane_focus",
    name: "Arcane Focus",
    description:
      "Arcane Focus sharpens casting precision and reduces mana waste.",
  },
  {
    id: "arcane_weave",
    name: "Arcane Weave",
    description: "Arcane Weave extends spell duration through mana threading.",
  },
  {
    id: "arcane_prism",
    name: "Arcane Prism",
    description: "Arcane Prism splits damage into secondary echoes.",
  },
  {
    id: "arcane_echo",
    name: "Arcane Echo",
    description: "Arcane Echo repeats a weaker copy of the last spell.",
  },
  {
    id: "arcane_orbit",
    name: "Arcane Orbit",
    description: "Arcane Orbit maintains a rotating mana ward.",
  },
  {
    id: "arcane_catalyst",
    name: "Arcane Catalyst",
    description: "Arcane Catalyst accelerates charge time for spells.",
  },
  {
    id: "mystic_surge",
    name: "Mystic Surge",
    description: "Mystic Surge boosts spell power after casting.",
  },
  {
    id: "mystic_focus",
    name: "Mystic Focus",
    description:
      "Mystic Focus sharpens casting precision and reduces mana waste.",
  },
  {
    id: "mystic_weave",
    name: "Mystic Weave",
    description: "Mystic Weave extends spell duration through mana threading.",
  },
  {
    id: "mystic_prism",
    name: "Mystic Prism",
    description: "Mystic Prism splits damage into secondary echoes.",
  },
  {
    id: "mystic_echo",
    name: "Mystic Echo",
    description: "Mystic Echo repeats a weaker copy of the last spell.",
  },
  {
    id: "mystic_orbit",
    name: "Mystic Orbit",
    description: "Mystic Orbit maintains a rotating mana ward.",
  },
  {
    id: "mystic_catalyst",
    name: "Mystic Catalyst",
    description: "Mystic Catalyst accelerates charge time for spells.",
  },
  {
    id: "runic_surge",
    name: "Runic Surge",
    description: "Runic Surge boosts spell power after casting.",
  },
  {
    id: "runic_focus",
    name: "Runic Focus",
    description:
      "Runic Focus sharpens casting precision and reduces mana waste.",
  },
  {
    id: "runic_weave",
    name: "Runic Weave",
    description: "Runic Weave extends spell duration through mana threading.",
  },
  {
    id: "runic_prism",
    name: "Runic Prism",
    description: "Runic Prism splits damage into secondary echoes.",
  },
  {
    id: "runic_echo",
    name: "Runic Echo",
    description: "Runic Echo repeats a weaker copy of the last spell.",
  },
  {
    id: "runic_orbit",
    name: "Runic Orbit",
    description: "Runic Orbit maintains a rotating mana ward.",
  },
  {
    id: "runic_catalyst",
    name: "Runic Catalyst",
    description: "Runic Catalyst accelerates charge time for spells.",
  },
  {
    id: "iron_discipline",
    name: "Iron Discipline",
    description:
      "Iron Discipline improves stance control and damage mitigation.",
  },
  {
    id: "iron_instinct",
    name: "Iron Instinct",
    description: "Iron Instinct raises counter timing and reaction speed.",
  },
  {
    id: "iron_fury",
    name: "Iron Fury",
    description: "Iron Fury builds momentum for heavier strikes.",
  },
  {
    id: "iron_mastery",
    name: "Iron Mastery",
    description: "Iron Mastery increases weapon proficiency and accuracy.",
  },
  {
    id: "iron_resolve",
    name: "Iron Resolve",
    description: "Iron Resolve hardens will against disruption.",
  },
  {
    id: "iron_edge",
    name: "Iron Edge",
    description: "Iron Edge adds a bleeding edge to melee attacks.",
  },
  {
    id: "iron_momentum",
    name: "Iron Momentum",
    description: "Iron Momentum converts movement into bonus damage.",
  },
  {
    id: "steel_discipline",
    name: "Steel Discipline",
    description:
      "Steel Discipline improves stance control and damage mitigation.",
  },
  {
    id: "steel_instinct",
    name: "Steel Instinct",
    description: "Steel Instinct raises counter timing and reaction speed.",
  },
  {
    id: "steel_fury",
    name: "Steel Fury",
    description: "Steel Fury builds momentum for heavier strikes.",
  },
  {
    id: "steel_mastery",
    name: "Steel Mastery",
    description: "Steel Mastery increases weapon proficiency and accuracy.",
  },
  {
    id: "steel_resolve",
    name: "Steel Resolve",
    description: "Steel Resolve hardens will against disruption.",
  },
  {
    id: "steel_edge",
    name: "Steel Edge",
    description: "Steel Edge adds a bleeding edge to melee attacks.",
  },
  {
    id: "steel_momentum",
    name: "Steel Momentum",
    description: "Steel Momentum converts movement into bonus damage.",
  },
  {
    id: "war_discipline",
    name: "War Discipline",
    description:
      "War Discipline improves stance control and damage mitigation.",
  },
  {
    id: "war_instinct",
    name: "War Instinct",
    description: "War Instinct raises counter timing and reaction speed.",
  },
  {
    id: "war_fury",
    name: "War Fury",
    description: "War Fury builds momentum for heavier strikes.",
  },
  {
    id: "war_mastery",
    name: "War Mastery",
    description: "War Mastery increases weapon proficiency and accuracy.",
  },
  {
    id: "war_resolve",
    name: "War Resolve",
    description: "War Resolve hardens will against disruption.",
  },
  {
    id: "war_edge",
    name: "War Edge",
    description: "War Edge adds a bleeding edge to melee attacks.",
  },
  {
    id: "war_momentum",
    name: "War Momentum",
    description: "War Momentum converts movement into bonus damage.",
  },
  {
    id: "shadow_step",
    name: "Shadow Step",
    description: "Shadow Step enhances repositioning and backstrike angles.",
  },
  {
    id: "shadow_veil",
    name: "Shadow Veil",
    description: "Shadow Veil improves stealth uptime and fade recovery.",
  },
  {
    id: "shadow_gambit",
    name: "Shadow Gambit",
    description: "Shadow Gambit rewards risk with critical bursts.",
  },
  {
    id: "shadow_hunger",
    name: "Shadow Hunger",
    description: "Shadow Hunger converts damage into minor leech.",
  },
  {
    id: "shadow_silence",
    name: "Shadow Silence",
    description: "Shadow Silence reduces enemy casting speed.",
  },
  {
    id: "shadow_shroud",
    name: "Shadow Shroud",
    description: "Shadow Shroud adds brief damage avoidance on entry.",
  },
  {
    id: "shadow_pursuit",
    name: "Shadow Pursuit",
    description: "Shadow Pursuit extends chase duration and executes.",
  },
  {
    id: "umbral_step",
    name: "Umbral Step",
    description: "Umbral Step enhances repositioning and backstrike angles.",
  },
  {
    id: "umbral_veil",
    name: "Umbral Veil",
    description: "Umbral Veil improves stealth uptime and fade recovery.",
  },
  {
    id: "umbral_gambit",
    name: "Umbral Gambit",
    description: "Umbral Gambit rewards risk with critical bursts.",
  },
  {
    id: "umbral_hunger",
    name: "Umbral Hunger",
    description: "Umbral Hunger converts damage into minor leech.",
  },
  {
    id: "umbral_silence",
    name: "Umbral Silence",
    description: "Umbral Silence reduces enemy casting speed.",
  },
  {
    id: "umbral_shroud",
    name: "Umbral Shroud",
    description: "Umbral Shroud adds brief damage avoidance on entry.",
  },
  {
    id: "umbral_pursuit",
    name: "Umbral Pursuit",
    description: "Umbral Pursuit extends chase duration and executes.",
  },
  {
    id: "night_step",
    name: "Night Step",
    description: "Night Step enhances repositioning and backstrike angles.",
  },
  {
    id: "night_veil",
    name: "Night Veil",
    description: "Night Veil improves stealth uptime and fade recovery.",
  },
  {
    id: "night_gambit",
    name: "Night Gambit",
    description: "Night Gambit rewards risk with critical bursts.",
  },
  {
    id: "night_hunger",
    name: "Night Hunger",
    description: "Night Hunger converts damage into minor leech.",
  },
  {
    id: "night_silence",
    name: "Night Silence",
    description: "Night Silence reduces enemy casting speed.",
  },
  {
    id: "night_shroud",
    name: "Night Shroud",
    description: "Night Shroud adds brief damage avoidance on entry.",
  },
  {
    id: "night_pursuit",
    name: "Night Pursuit",
    description: "Night Pursuit extends chase duration and executes.",
  },
  {
    id: "divine_grace",
    name: "Divine Grace",
    description: "Divine Grace increases healing output and recovery.",
  },
  {
    id: "divine_edict",
    name: "Divine Edict",
    description: "Divine Edict reinforces debuffs with holy authority.",
  },
  {
    id: "divine_beacon",
    name: "Divine Beacon",
    description: "Divine Beacon marks allies for protective bonuses.",
  },
  {
    id: "divine_aegis",
    name: "Divine Aegis",
    description: "Divine Aegis adds a layered defensive barrier.",
  },
  {
    id: "divine_judgment",
    name: "Divine Judgment",
    description: "Divine Judgment amplifies damage against corrupted foes.",
  },
  {
    id: "divine_vow",
    name: "Divine Vow",
    description: "Divine Vow boosts stats while keeping oaths.",
  },
  {
    id: "divine_halo",
    name: "Divine Halo",
    description: "Divine Halo emits a light aura that weakens dark effects.",
  },
  {
    id: "radiant_grace",
    name: "Radiant Grace",
    description: "Radiant Grace increases healing output and recovery.",
  },
  {
    id: "radiant_edict",
    name: "Radiant Edict",
    description: "Radiant Edict reinforces debuffs with holy authority.",
  },
  {
    id: "radiant_beacon",
    name: "Radiant Beacon",
    description: "Radiant Beacon marks allies for protective bonuses.",
  },
  {
    id: "radiant_aegis",
    name: "Radiant Aegis",
    description: "Radiant Aegis adds a layered defensive barrier.",
  },
  {
    id: "radiant_judgment",
    name: "Radiant Judgment",
    description: "Radiant Judgment amplifies damage against corrupted foes.",
  },
  {
    id: "radiant_vow",
    name: "Radiant Vow",
    description: "Radiant Vow boosts stats while keeping oaths.",
  },
  {
    id: "radiant_halo",
    name: "Radiant Halo",
    description: "Radiant Halo emits a light aura that weakens dark effects.",
  },
  {
    id: "sanctified_grace",
    name: "Sanctified Grace",
    description: "Sanctified Grace increases healing output and recovery.",
  },
  {
    id: "sanctified_edict",
    name: "Sanctified Edict",
    description: "Sanctified Edict reinforces debuffs with holy authority.",
  },
  {
    id: "sanctified_beacon",
    name: "Sanctified Beacon",
    description: "Sanctified Beacon marks allies for protective bonuses.",
  },
  {
    id: "sanctified_aegis",
    name: "Sanctified Aegis",
    description: "Sanctified Aegis adds a layered defensive barrier.",
  },
  {
    id: "sanctified_judgment",
    name: "Sanctified Judgment",
    description: "Sanctified Judgment amplifies damage against corrupted foes.",
  },
  {
    id: "sanctified_vow",
    name: "Sanctified Vow",
    description: "Sanctified Vow boosts stats while keeping oaths.",
  },
  {
    id: "sanctified_halo",
    name: "Sanctified Halo",
    description:
      "Sanctified Halo emits a light aura that weakens dark effects.",
  },
  {
    id: "verdant_bloom",
    name: "Verdant Bloom",
    description: "Verdant Bloom accelerates regeneration over time.",
  },
  {
    id: "verdant_fury",
    name: "Verdant Fury",
    description: "Verdant Fury adds feral damage bursts after dodges.",
  },
  {
    id: "verdant_ward",
    name: "Verdant Ward",
    description: "Verdant Ward reduces elemental damage taken.",
  },
  {
    id: "verdant_cycle",
    name: "Verdant Cycle",
    description: "Verdant Cycle balances resource recovery.",
  },
  {
    id: "verdant_pulse",
    name: "Verdant Pulse",
    description: "Verdant Pulse releases a healing pulse on kill.",
  },
  {
    id: "verdant_root",
    name: "Verdant Root",
    description: "Verdant Root stabilizes stance and reduces knockback.",
  },
  {
    id: "verdant_tide",
    name: "Verdant Tide",
    description: "Verdant Tide flows between offense and defense with rhythm.",
  },
  {
    id: "primal_bloom",
    name: "Primal Bloom",
    description: "Primal Bloom accelerates regeneration over time.",
  },
  {
    id: "primal_fury",
    name: "Primal Fury",
    description: "Primal Fury adds feral damage bursts after dodges.",
  },
  {
    id: "primal_ward",
    name: "Primal Ward",
    description: "Primal Ward reduces elemental damage taken.",
  },
  {
    id: "primal_cycle",
    name: "Primal Cycle",
    description: "Primal Cycle balances resource recovery.",
  },
  {
    id: "primal_pulse",
    name: "Primal Pulse",
    description: "Primal Pulse releases a healing pulse on kill.",
  },
  {
    id: "primal_root",
    name: "Primal Root",
    description: "Primal Root stabilizes stance and reduces knockback.",
  },
  {
    id: "primal_tide",
    name: "Primal Tide",
    description: "Primal Tide flows between offense and defense with rhythm.",
  },
  {
    id: "wild_bloom",
    name: "Wild Bloom",
    description: "Wild Bloom accelerates regeneration over time.",
  },
  {
    id: "wild_fury",
    name: "Wild Fury",
    description: "Wild Fury adds feral damage bursts after dodges.",
  },
  {
    id: "wild_ward",
    name: "Wild Ward",
    description: "Wild Ward reduces elemental damage taken.",
  },
  {
    id: "wild_cycle",
    name: "Wild Cycle",
    description: "Wild Cycle balances resource recovery.",
  },
  {
    id: "wild_pulse",
    name: "Wild Pulse",
    description: "Wild Pulse releases a healing pulse on kill.",
  },
  {
    id: "wild_root",
    name: "Wild Root",
    description: "Wild Root stabilizes stance and reduces knockback.",
  },
  {
    id: "wild_tide",
    name: "Wild Tide",
    description: "Wild Tide flows between offense and defense with rhythm.",
  },
];

export const STANDARD_TALENTS = [
  {
    id: "martial_precision",
    name: "Martial Precision",
    description: "Refine your strikes for steadier damage and sharper timing.",
    affinities: ["martial", "precision"],
  },
  {
    id: "iron_resolve",
    name: "Iron Resolve",
    description: "Harden your stance to sustain longer exchanges.",
    affinities: ["martial", "defense"],
  },
  {
    id: "battle_rhythm",
    name: "Battle Rhythm",
    description: "Chain actions with a practiced cadence to recover faster.",
    affinities: ["martial"],
  },
  {
    id: "arcane_flow",
    name: "Arcane Flow",
    description: "Smooth your spellcasting to reduce strain and waste.",
    affinities: ["arcane"],
  },
  {
    id: "spellweaver",
    name: "Spellweaver",
    description: "Tighten spell loops to shorten recovery between casts.",
    affinities: ["arcane"],
  },
  {
    id: "mana_attunement",
    name: "Mana Attunement",
    description: "Align with ambient mana to stabilize your output.",
    affinities: ["arcane", "support"],
  },
  {
    id: "shadow_veil",
    name: "Shadow Veil",
    description: "Slip between sight lines and punish openings.",
    affinities: ["shadow", "precision"],
  },
  {
    id: "ghost_step",
    name: "Ghost Step",
    description: "Move with near-silent intent and strike with composure.",
    affinities: ["shadow"],
  },
  {
    id: "poisoned_edge",
    name: "Poisoned Edge",
    description: "Lace your offense with lingering harm.",
    affinities: ["shadow", "feral"],
  },
  {
    id: "divine_bulwark",
    name: "Divine Bulwark",
    description: "Sustain allies with protective timing.",
    affinities: ["divine", "defense"],
  },
  {
    id: "radiant_charge",
    name: "Radiant Charge",
    description: "Drive forward with luminous force and resolve.",
    affinities: ["divine", "martial"],
  },
  {
    id: "sacred_focus",
    name: "Sacred Focus",
    description: "Center your rites for cleaner, steadier results.",
    affinities: ["divine", "support"],
  },
  {
    id: "grave_tether",
    name: "Grave Tether",
    description: "Anchor your power to lingering spirits.",
    affinities: ["dark"],
  },
  {
    id: "bonecraft",
    name: "Bonecraft",
    description: "Shape the remains of battles into enduring force.",
    affinities: ["dark"],
  },
  {
    id: "verdant_pulse",
    name: "Verdant Pulse",
    description: "Let growth magic cycle longer before fading.",
    affinities: ["nature", "support"],
  },
  {
    id: "tracker_instinct",
    name: "Tracker Instinct",
    description: "Read the field and strike true when it counts.",
    affinities: ["nature", "precision"],
  },
  {
    id: "spirit_echo",
    name: "Spirit Echo",
    description: "Let inner echoes reinforce your techniques.",
    affinities: ["spirit"],
  },
  {
    id: "inner_balance",
    name: "Inner Balance",
    description: "Steady your rhythm to sustain momentum longer.",
    affinities: ["spirit", "defense"],
  },
  {
    id: "feral_instinct",
    name: "Feral Instinct",
    description: "Fight with sharpened reflex and raw pressure.",
    affinities: ["feral"],
  },
  {
    id: "primal_fury",
    name: "Primal Fury",
    description: "Lean into aggression without losing control.",
    affinities: ["feral", "martial"],
  },
  {
    id: "wayfarer",
    name: "Wayfarer",
    description: "Endurance grows with every step forward.",
    affinities: ["generic"],
  },
  {
    id: "system_favor",
    name: "System Favor",
    description: "A minor protocol grants efficient resource use.",
    affinities: ["generic"],
  },
  {
    id: "oathbound",
    name: "Oathbound",
    description: "Sworn intent steadies your execution under pressure.",
    affinities: ["generic", "defense"],
  },
];

export const CLASS_TALENT_TAGS = {
  knight: ["martial", "defense"],
  warrior: ["martial", "defense"],
  berserker: ["martial", "feral"],
  mage: ["arcane"],
  sorcerer: ["arcane"],
  necromancer: ["dark"],
  warlock: ["dark"],
  rogue: ["shadow", "precision"],
  ranger: ["nature", "precision"],
  monk: ["spirit", "defense"],
  paladin: ["divine", "defense", "martial"],
  priest: ["divine", "support"],
  druid: ["nature", "spirit"],
};

export const TALENT_COUNT_TABLE = [
  { count: 10, chance: 0.00001 },
  { count: 4, chance: 0.01 },
  { count: 3, chance: 0.05 },
  { count: 2, chance: 0.1 },
];

export function getTalentById(id) {
  return (
    STANDARD_TALENTS.find((t) => t.id === id) ||
    exRankTalents.find((t) => t.id === id) ||
    null
  );
}

export function getRandomTalents(count = 8) {
  const shuffled = shuffle(STANDARD_TALENTS);
  return shuffled.slice(0, count);
}

export function getClassTalentPool(classId) {
  const tags = CLASS_TALENT_TAGS[classId] || [];
  const pool = STANDARD_TALENTS.filter((talent) => {
    const affinities = talent.affinities || [];
    if (!affinities.length) return true;
    if (affinities.includes("generic")) return true;
    return affinities.some((tag) => tags.includes(tag));
  });
  return pool.length ? pool : STANDARD_TALENTS;
}

export function rollTalentCount() {
  const roll = random();
  let cumulative = 0;
  for (const entry of TALENT_COUNT_TABLE) {
    cumulative += entry.chance;
    if (roll < cumulative) return entry.count;
  }
  return 1;
}

export function assignTalentsForClass(classId) {
  const pool = getClassTalentPool(classId);
  const count = rollTalentCount();
  const shuffled = shuffle(pool);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((t) => t.id);
}

// =====================================================
// COMPONENT-BASED TALENT SYSTEM (Composition Pattern)
// =====================================================
// Replaces class inheritance with data-driven modifiers
// Each talent is a configuration object with skill modifier components

export const TALENT_PRIORITY = {
  ABSOLUTE: "ABSOLUTE", // Reality-altering (strain 30-40)
  HIGH: "HIGH", // System-breaking (strain 16-20)
  NORMAL: "NORMAL", // Tactical advantage (strain 4-5)
};

export const MODIFIER_TYPES = {
  COST: "cost", // Modify skill mana/resource cost
  COOLDOWN: "cooldown", // Modify skill cooldown
  DAMAGE: "damage", // Modify skill damage output
  DURATION: "duration", // Modify effect duration
  AOE: "aoe", // Modify area of effect
  CRIT: "crit", // Modify critical chance/damage
  BYPASS: "bypass", // Bypass game rules
  MAGNITUDE: "magnitude", // Scale effect magnitude with level
};

/**
 * Skill Modifier Component - Defines how a talent modifies skills
 * @typedef {Object} SkillModifier
 * @property {string} type - Modifier type from MODIFIER_TYPES
 * @property {string} operation - 'multiply', 'add', 'set', 'bypass'
 * @property {number|function} value - Static value or function(playerLevel) => value
 * @property {string[]} [skillTags] - Only apply to skills with these tags
 * @property {string[]} [skillIds] - Only apply to specific skill IDs
 */

/**
 * Magnitude Threshold - Defines power scaling at different levels
 * @typedef {Object} MagnitudeThreshold
 * @property {number} level - Player level threshold
 * @property {string} label - Display label (Region/City/Planet-Scale)
 * @property {number} aoeRadius - Max AoE radius at this level
 * @property {number} damageCap - Max damage cap at this level
 */

// =====================================================
// COMPONENT-BASED TALENT DEFINITIONS
// =====================================================

export const TALENT_COMPONENTS = {
  // === ABSOLUTE PRIORITY TALENTS ===
  destruction: {
    id: "destruction",
    name: "Destruction",
    description: "Reality-cutting burst that caps damage at the global tier.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 40,
    phrase: "PLANETARY-ANNIHILATION",
    modifiers: [
      {
        type: MODIFIER_TYPES.DAMAGE,
        operation: "multiply",
        value: (lvl) => 1 + lvl * 0.05,
      },
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { damageResistance: true },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 200, damageCap: 20000 },
      { level: 100, label: "City-Scale", aoeRadius: 1000, damageCap: 100000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 10000,
        damageCap: 1000000,
      },
    ],
  },

  creation: {
    id: "creation",
    name: "Creation",
    description:
      "Constructs evolving artifacts and terrain; empowers allies within constructs.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 35,
    phrase: "REALITY-FORGE",
    modifiers: [
      { type: MODIFIER_TYPES.DURATION, operation: "multiply", value: 2.0 },
      { type: MODIFIER_TYPES.AOE, operation: "multiply", value: 1.5 },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 300, damageCap: 10000 },
      { level: 100, label: "City-Scale", aoeRadius: 1500, damageCap: 50000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 15000,
        damageCap: 500000,
      },
    ],
  },

  time: {
    id: "time",
    name: "Time Manipulation",
    description:
      "Freeze, rewind, or branch combat timelines; commit the winning branch.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 35,
    phrase: "TEMPORAL-SOVEREIGNTY",
    modifiers: [
      { type: MODIFIER_TYPES.COOLDOWN, operation: "multiply", value: 0.5 },
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { combatRewind: true },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 400, damageCap: 15000 },
      { level: 100, label: "City-Scale", aoeRadius: 2000, damageCap: 75000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 20000,
        damageCap: 750000,
      },
    ],
  },

  space: {
    id: "space",
    name: "Space Manipulation",
    description:
      "Warp fields, fold distance, clamp enemy mobility via singularity wells.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 35,
    phrase: "SPATIAL-DOMINION",
    modifiers: [
      { type: MODIFIER_TYPES.AOE, operation: "multiply", value: 2.0 },
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { ignoreDistance: true },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 500, damageCap: 18000 },
      { level: 100, label: "City-Scale", aoeRadius: 2500, damageCap: 80000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 25000,
        damageCap: 800000,
      },
    ],
  },

  infinity: {
    id: "infinity",
    name: "Infinite Power",
    description:
      "Boundless resource channel; converts ambient energy to usable reserves.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 40,
    phrase: "INFINITE-CONDUIT",
    modifiers: [
      { type: MODIFIER_TYPES.COST, operation: "set", value: 0 },
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { bypassCost: true, infiniteManaRegen: true },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 600, damageCap: 25000 },
      { level: 100, label: "City-Scale", aoeRadius: 3000, damageCap: 200000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 30000,
        damageCap: 2000000,
      },
    ],
  },

  void: {
    id: "void",
    name: "Void Manipulation",
    description:
      "Devour buffs/constructs; convert enemy skills to inert null shells.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 35,
    phrase: "ABYSSAL-CONSUMPTION",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { dispelOnHit: true, absorbBuffs: true },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 700, damageCap: 30000 },
      { level: 100, label: "City-Scale", aoeRadius: 3500, damageCap: 150000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 35000,
        damageCap: 1500000,
      },
    ],
  },

  divine: {
    id: "divine",
    name: "Divine Authority",
    description:
      "Purify curses/entropy; apply absolute commandments that override status.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 35,
    phrase: "EDICT-OF-RADIANCE",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { statusImmune: true, purifyOnCast: true },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 800, damageCap: 40000 },
      { level: 100, label: "City-Scale", aoeRadius: 4000, damageCap: 300000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 40000,
        damageCap: 3000000,
      },
    ],
  },

  chaos: {
    id: "chaos",
    name: "Chaos Manipulation",
    description:
      "Randomize enemy cooldowns/positions; inject volatility to break patterns.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 35,
    phrase: "PRIMORDIAL-DISORDER",
    modifiers: [
      {
        type: MODIFIER_TYPES.DAMAGE,
        operation: "multiply",
        value: () => 0.5 + random() * 1.5,
      },
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { randomizeEnemy: true },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 900, damageCap: 50000 },
      { level: 100, label: "City-Scale", aoeRadius: 4500, damageCap: 250000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 45000,
        damageCap: 2500000,
      },
    ],
  },

  order: {
    id: "order",
    name: "Order Enforcement",
    description:
      "Enforce rules: disable crit RNG, clamp hits to deterministic outcomes.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 35,
    phrase: "ABSOLUTE-LAW",
    modifiers: [
      {
        type: MODIFIER_TYPES.CRIT,
        operation: "set",
        value: { chance: 0, damage: 1.0 },
      },
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { controlRng: true, deterministicDamage: true },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 1000, damageCap: 60000 },
      { level: 100, label: "City-Scale", aoeRadius: 5000, damageCap: 250000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 50000,
        damageCap: 2500000,
      },
    ],
  },

  fate: {
    id: "fate",
    name: "Fate Control",
    description:
      "Stitch probability threads; force success on critical turns or saves.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 35,
    phrase: "THREADMASTER-DECREE",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { controlRng: true, forceSuccess: true },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 500, damageCap: 25000 },
      { level: 100, label: "City-Scale", aoeRadius: 2500, damageCap: 125000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 25000,
        damageCap: 1250000,
      },
    ],
  },

  // === HIGH PRIORITY TALENTS ===
  limit_breaker: {
    id: "limit_breaker",
    name: "Limit Breaker",
    description: "Ignore soft caps; exponential compounding past thresholds.",
    priority: TALENT_PRIORITY.HIGH,
    strainCost: 20,
    phrase: "LIMIT-BREAK",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { removeStatCap: true },
      },
    ],
  },

  cooldown_nullifier: {
    id: "cooldown_nullifier",
    name: "Cooldown Nullifier",
    description: "Convert cooldowns into fast-refresh charge stacks.",
    priority: TALENT_PRIORITY.HIGH,
    strainCost: 18,
    phrase: "CD-NULL",
    modifiers: [
      { type: MODIFIER_TYPES.COOLDOWN, operation: "set", value: 0 },
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { bypassCooldown: true },
      },
    ],
  },

  critical_floor_guarantee: {
    id: "critical_floor_guarantee",
    name: "Critical Floor Guarantee",
    description: "Crit chance can't drop below a hard floor.",
    priority: TALENT_PRIORITY.HIGH,
    strainCost: 16,
    phrase: "CRIT-FLOOR",
    modifiers: [
      {
        type: MODIFIER_TYPES.CRIT,
        operation: "add",
        value: { minChance: 0.5 },
      },
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { overrideCrit: "guaranteed" },
      },
    ],
  },

  death_tax_refund: {
    id: "death_tax_refund",
    name: "Death Tax Refund",
    description:
      "On lethal hit, refund spent resources and gain a free action.",
    priority: TALENT_PRIORITY.HIGH,
    strainCost: 18,
    phrase: "DEATH-REFUND",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { deathRefund: true, freeActionOnKill: true },
      },
    ],
  },

  // === NORMAL PRIORITY TALENTS ===
  adaptive_guard: {
    id: "adaptive_guard",
    name: "Adaptive Guard",
    description:
      "Auto-select best defense after first hit; improves with precision.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 5,
    phrase: "ADAPT-GUARD",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { adaptiveDefense: true },
      },
    ],
  },

  battle_trance: {
    id: "battle_trance",
    name: "Battle Trance",
    description: "Shorten cast times/animation locks under sustained combat.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 5,
    phrase: "BATTLE-TRANCE",
    modifiers: [
      {
        type: MODIFIER_TYPES.COOLDOWN,
        operation: "multiply",
        value: 0.8,
        condition: "inCombat",
      },
    ],
  },

  opportunist: {
    id: "opportunist",
    name: "Opportunist",
    description:
      "Bonus damage to controlled/off-balance foes; longer stagger windows.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "OPPORTUNIST",
    modifiers: [
      {
        type: MODIFIER_TYPES.DAMAGE,
        operation: "multiply",
        value: 1.3,
        skillTags: ["melee", "physical"],
      },
    ],
  },

  blooded_edge: {
    id: "blooded_edge",
    name: "Blooded Edge",
    description: "Stacking lifesteal on hit; decays out of combat.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 5,
    phrase: "BLOODED-EDGE",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { stackingLifesteal: true },
      },
    ],
  },

  // === ADDITIONAL ABSOLUTE TALENTS ===
  shadow: {
    id: "shadow",
    name: "Shadow Manipulation",
    description:
      "Steal silhouettes of skills; reuse shadow-copies with reduced cost.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 30,
    phrase: "UMBRAL-ASCENDANCE",
    modifiers: [
      { type: MODIFIER_TYPES.COST, operation: "multiply", value: 0.5 },
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { skillCopy: true, shadowClone: true },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 400, damageCap: 20000 },
      { level: 100, label: "City-Scale", aoeRadius: 2000, damageCap: 100000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 20000,
        damageCap: 1000000,
      },
    ],
  },

  light: {
    id: "light",
    name: "Light Manipulation",
    description:
      "Solar smite chains; stack radiance crescendos that rewrite stat ceilings.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 30,
    phrase: "APOTHEOSIS",
    modifiers: [
      { type: MODIFIER_TYPES.DAMAGE, operation: "multiply", value: 1.5 },
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { removeStatCap: true, radianceStack: true },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 500, damageCap: 25000 },
      { level: 100, label: "City-Scale", aoeRadius: 2500, damageCap: 125000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 25000,
        damageCap: 1250000,
      },
    ],
  },

  nature: {
    id: "nature",
    name: "Nature Manipulation",
    description:
      "Bond to ley-lines; grows living armor/wards and rapid regeneration.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 30,
    phrase: "WORLDROOT-COMMUNION",
    modifiers: [
      { type: MODIFIER_TYPES.DURATION, operation: "multiply", value: 2.0 },
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { rapidRegen: true, livingArmor: true },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 600, damageCap: 15000 },
      { level: 100, label: "City-Scale", aoeRadius: 3000, damageCap: 75000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 30000,
        damageCap: 750000,
      },
    ],
  },

  necromancy: {
    id: "necromancy",
    name: "Necromancy",
    description:
      "Persistent phylactery revivals; resurrects elite minions with passives.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 35,
    phrase: "ETERNAL-LEGION",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { persistentSummons: true, minionRevive: true },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 400, damageCap: 18000 },
      { level: 100, label: "City-Scale", aoeRadius: 2000, damageCap: 90000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 20000,
        damageCap: 900000,
      },
    ],
  },

  blood: {
    id: "blood",
    name: "Blood Manipulation",
    description:
      "Stack blood oaths; lifesteal evolves to damage-to-resource transmutation.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 30,
    phrase: "CRIMSON-SOVEREIGN",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: {
          bloodOath: true,
          resourceTransmute: true,
          stackingLifesteal: true,
        },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 300, damageCap: 22000 },
      { level: 100, label: "City-Scale", aoeRadius: 1500, damageCap: 110000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 15000,
        damageCap: 1100000,
      },
    ],
  },

  storm: {
    id: "storm",
    name: "Storm Manipulation",
    description:
      "Layered weather fronts; chaining shock-waves disrupts casts and stance.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 30,
    phrase: "CATACLYSMIC-TEMPEST",
    modifiers: [
      { type: MODIFIER_TYPES.AOE, operation: "multiply", value: 1.75 },
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { chainDamage: true, interruptOnHit: true },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 700, damageCap: 28000 },
      { level: 100, label: "City-Scale", aoeRadius: 3500, damageCap: 140000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 35000,
        damageCap: 1400000,
      },
    ],
  },

  gravity: {
    id: "gravity",
    name: "Gravity Manipulation",
    description:
      "Pin enemies; amplify true damage in compressed zones; deny escape vectors.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 30,
    phrase: "SINGULARITY-CORE",
    modifiers: [
      { type: MODIFIER_TYPES.DAMAGE, operation: "multiply", value: 1.3 },
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { rootOnHit: true, denyEscape: true, trueDamage: true },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 350, damageCap: 30000 },
      { level: 100, label: "City-Scale", aoeRadius: 1750, damageCap: 150000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 17500,
        damageCap: 1500000,
      },
    ],
  },

  spirit: {
    id: "spirit",
    name: "Spirit Manipulation",
    description:
      "Bind spirits for stat weaves; convert ambient willpower to buffs.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 30,
    phrase: "SOULWEAVE-AUTHORITY",
    modifiers: [
      { type: MODIFIER_TYPES.DURATION, operation: "multiply", value: 1.5 },
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { spiritBond: true, willpowerConvert: true },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 450, damageCap: 16000 },
      { level: 100, label: "City-Scale", aoeRadius: 2250, damageCap: 80000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 22500,
        damageCap: 800000,
      },
    ],
  },

  psionic: {
    id: "psionic",
    name: "Psionic Power",
    description:
      "Disable enemy decision trees; enforce command queues; stun bypass logic.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 30,
    phrase: "MIND-OVER-COSMOS",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { mindControl: true, stunBypass: true, commandOverride: true },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 400, damageCap: 18000 },
      { level: 100, label: "City-Scale", aoeRadius: 2000, damageCap: 90000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 20000,
        damageCap: 900000,
      },
    ],
  },

  technomancy: {
    id: "technomancy",
    name: "Technomancy",
    description:
      "Overclock constructs/followers; grant modular firmware to skills.",
    priority: TALENT_PRIORITY.ABSOLUTE,
    strainCost: 30,
    phrase: "GOD-ENGINE-PROTOCOL",
    modifiers: [
      { type: MODIFIER_TYPES.COOLDOWN, operation: "multiply", value: 0.7 },
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { overclockSummons: true, modularSkills: true },
      },
    ],
    magnitudeThresholds: [
      { level: 0, label: "Region-Scale", aoeRadius: 350, damageCap: 20000 },
      { level: 100, label: "City-Scale", aoeRadius: 1750, damageCap: 100000 },
      {
        level: 500,
        label: "Planet-Scale",
        aoeRadius: 17500,
        damageCap: 1000000,
      },
    ],
  },

  // === ADDITIONAL HIGH TALENTS ===
  damage_type_overwrite: {
    id: "damage_type_overwrite",
    name: "Damage Type Overwrite",
    description: "Retag damage mid-flight to bypass resistances.",
    priority: TALENT_PRIORITY.HIGH,
    strainCost: 18,
    phrase: "TAG-OVERWRITE",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { damageTypeSwap: true, ignoreResistance: true },
      },
    ],
  },

  skill_fusion_matrix: {
    id: "skill_fusion_matrix",
    name: "Skill Fusion Matrix",
    description: "Combine two skills into a higher tier without penalties.",
    priority: TALENT_PRIORITY.HIGH,
    strainCost: 16,
    phrase: "FUSION-MATRIX",
    modifiers: [
      { type: MODIFIER_TYPES.DAMAGE, operation: "multiply", value: 1.5 },
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { skillFusion: true },
      },
    ],
  },

  resource_transmutation: {
    id: "resource_transmutation",
    name: "Resource Transmutation",
    description: "Convert HP/MP/Stamina efficiently between pools.",
    priority: TALENT_PRIORITY.HIGH,
    strainCost: 16,
    phrase: "RESOURCE-TRANSMUTE",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { resourceTransmute: true },
      },
    ],
  },

  immunity_cascade: {
    id: "immunity_cascade",
    name: "Immunity Cascade",
    description: "One immunity grants related immunities in combat.",
    priority: TALENT_PRIORITY.HIGH,
    strainCost: 18,
    phrase: "IMMUNITY-CASCADE",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { statusImmune: true, immunityCascade: true },
      },
    ],
  },

  anti_entropy_field: {
    id: "anti_entropy_field",
    name: "Anti-Entropy Field",
    description: "Prevent item/buff/construct degradation.",
    priority: TALENT_PRIORITY.HIGH,
    strainCost: 16,
    phrase: "ANTI-ENTROPY",
    modifiers: [
      { type: MODIFIER_TYPES.DURATION, operation: "multiply", value: 3.0 },
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { preventDegradation: true },
      },
    ],
  },

  boss_flag_thief: {
    id: "boss_flag_thief",
    name: "Boss Flag Thief",
    description: "Temporarily gain raid-phase mechanics from Boss flag.",
    priority: TALENT_PRIORITY.HIGH,
    strainCost: 18,
    phrase: "BOSS-FLAG",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { bossFlag: true, raidMechanics: true },
      },
    ],
  },

  passive_amplifier: {
    id: "passive_amplifier",
    name: "Passive Amplifier",
    description: "Double passive potency; halve activation thresholds.",
    priority: TALENT_PRIORITY.HIGH,
    strainCost: 16,
    phrase: "PASSIVE-AMP",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { passiveAmplify: true },
      },
    ],
  },

  combat_stealth: {
    id: "combat_stealth",
    name: "Combat Stealth",
    description: "Maintain stealth while attacking; reduce aggro generation.",
    priority: TALENT_PRIORITY.HIGH,
    strainCost: 16,
    phrase: "STEALTH-COMBAT",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { combatStealth: true, reduceAggro: true },
      },
    ],
  },

  persistent_summons: {
    id: "persistent_summons",
    name: "Persistent Summons",
    description: "Summons persist across zones/instances; immune to dismissal.",
    priority: TALENT_PRIORITY.HIGH,
    strainCost: 18,
    phrase: "PERSIST-SUMMON",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { persistentSummons: true, dismissImmune: true },
      },
    ],
  },

  penalty_inversion: {
    id: "penalty_inversion",
    name: "Penalty Inversion",
    description: "Turn debuffs/curses into equivalent buffs for duration.",
    priority: TALENT_PRIORITY.HIGH,
    strainCost: 18,
    phrase: "PENALTY-INVERT",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { penaltyInvert: true, debuffToBuff: true },
      },
    ],
  },

  scripted_event_override: {
    id: "scripted_event_override",
    name: "Scripted Event Override",
    description: "Cancel forced story beats; insert a user-defined branch.",
    priority: TALENT_PRIORITY.HIGH,
    strainCost: 20,
    phrase: "SCRIPT-OVERRIDE",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { scriptOverride: true },
      },
    ],
  },

  // === ADDITIONAL NORMAL TALENTS ===
  efficient_striker: {
    id: "efficient_striker",
    name: "Efficient Striker",
    description: "Reduce basic-chain costs; add micro-bleeds on sequences.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "EFFICIENT-STRIKE",
    modifiers: [
      { type: MODIFIER_TYPES.COST, operation: "multiply", value: 0.8 },
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { microBleed: true },
      },
    ],
  },

  precision_casting: {
    id: "precision_casting",
    name: "Precision Casting",
    description: "Tighten AOE falloff; enhance hitbox fidelity and crit zones.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "PRECISION-CAST",
    modifiers: [
      { type: MODIFIER_TYPES.CRIT, operation: "add", value: { chance: 0.05 } },
    ],
  },

  elemental_read: {
    id: "elemental_read",
    name: "Elemental Read",
    description: "Detect enemy resistances; surface swap cues.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "ELEMENT-READ",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { detectResistance: true },
      },
    ],
  },

  quickstep: {
    id: "quickstep",
    name: "Quickstep",
    description: "Iframes on perfect dodge; unlock counterattack.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "QUICKSTEP",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { iframesDodge: true, counterattack: true },
      },
    ],
  },

  mana_threading: {
    id: "mana_threading",
    name: "Mana Threading",
    description: "Pre-charge minor mana lines for instant release.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "MANA-THREAD",
    modifiers: [
      { type: MODIFIER_TYPES.COST, operation: "multiply", value: 0.9 },
    ],
  },

  stalwart_heart: {
    id: "stalwart_heart",
    name: "Stalwart Heart",
    description: "DR scales with morale/party cohesion.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 5,
    phrase: "STALWART-HEART",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { moraleDR: true },
      },
    ],
  },

  rally_caller: {
    id: "rally_caller",
    name: "Rally Caller",
    description: "Team-wide haste after kill/objective tick.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "RALLY-CALL",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { teamHasteOnKill: true },
      },
    ],
  },

  focused_aim: {
    id: "focused_aim",
    name: "Focused Aim",
    description: "Faster projectiles; less spread; headshot bias.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "FOCUSED-AIM",
    modifiers: [
      { type: MODIFIER_TYPES.CRIT, operation: "add", value: { chance: 0.1 } },
    ],
  },

  tactical_swap: {
    id: "tactical_swap",
    name: "Tactical Swap",
    description: "Weapon swap restores resource burst and cleanses.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "TACTICAL-SWAP",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { swapCleanse: true, swapResource: true },
      },
    ],
  },

  arcane_echo: {
    id: "arcane_echo",
    name: "Arcane Echo",
    description: "Recasts weakened copy of last spell after delay.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "ARCANE-ECHO",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { spellEcho: true },
      },
    ],
  },

  grounded_stance: {
    id: "grounded_stance",
    name: "Grounded Stance",
    description: "Reduce CC duration while stationary; better channels.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "GROUNDED-STANCE",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { ccResistStationary: true },
      },
    ],
  },

  hunters_mark: {
    id: "hunters_mark",
    name: "Hunter's Mark",
    description: "Tag target; add minor true bleed and tracking.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "HUNTER-MARK",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { trueBleed: true, targetTracking: true },
      },
    ],
  },

  overcharge: {
    id: "overcharge",
    name: "Overcharge",
    description: "Temporarily boost next skill tier at higher cost.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 5,
    phrase: "OVERCHARGE",
    modifiers: [
      { type: MODIFIER_TYPES.DAMAGE, operation: "multiply", value: 1.25 },
      { type: MODIFIER_TYPES.COST, operation: "multiply", value: 1.5 },
    ],
  },

  iron_gut: {
    id: "iron_gut",
    name: "Iron Gut",
    description: "Negate poison/rot buildup; convert portion to regen.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "IRON-GUT",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { poisonImmune: true, rotToRegen: true },
      },
    ],
  },

  keen_mind: {
    id: "keen_mind",
    name: "Keen Mind",
    description: "Faster skill mastery; lower grind thresholds.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "KEEN-MIND",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { fasterMastery: true },
      },
    ],
  },

  field_medic: {
    id: "field_medic",
    name: "Field Medic",
    description: "Faster consumable use; stronger bandage effects.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "FIELD-MEDIC",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { fasterConsumables: true, strongerHealing: true },
      },
    ],
  },

  spirit_bond: {
    id: "spirit_bond",
    name: "Spirit Bond",
    description: "Minor stat sharing with allies; stronger on assists.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "SPIRIT-BOND",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { statShare: true },
      },
    ],
  },

  frostskin: {
    id: "frostskin",
    name: "Frostskin",
    description: "Flat DR; chill retaliation on hit.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "FROSTSKIN",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { flatDR: true, chillRetaliate: true },
      },
    ],
  },

  ember_spark: {
    id: "ember_spark",
    name: "Ember Spark",
    description: "Next attack gains burn rider after a cast.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "EMBER-SPARK",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { burnRider: true },
      },
    ],
  },

  windread: {
    id: "windread",
    name: "Windread",
    description: "Movement spike after ability use; reposition buff.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "WINDREAD",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { moveSpeedOnCast: true },
      },
    ],
  },

  rune_familiarity: {
    id: "rune_familiarity",
    name: "Rune Familiarity",
    description: "Enhance gear runes; lower miscast chance.",
    priority: TALENT_PRIORITY.NORMAL,
    strainCost: 4,
    phrase: "RUNE-FAMILIAR",
    modifiers: [
      {
        type: MODIFIER_TYPES.BYPASS,
        operation: "set",
        value: { enhanceRunes: true, reduceMiscast: true },
      },
    ],
    },
  };
  // === STANDARD TALENTS (Balanced) ===
  Object.assign(TALENT_COMPONENTS, {
    martial_precision: {
      id: "martial_precision",
      name: "Martial Precision",
      description: "Sharper strikes and steadier crit timing.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [
        { type: MODIFIER_TYPES.DAMAGE, operation: "multiply", value: 1.05 },
        { type: MODIFIER_TYPES.CRIT, operation: "add", value: { chance: 0.02 } },
      ],
    },
    iron_resolve: {
      id: "iron_resolve",
      name: "Iron Resolve",
      description: "Defensive techniques linger longer.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [
        { type: MODIFIER_TYPES.DURATION, operation: "multiply", value: 1.05 },
        { type: MODIFIER_TYPES.COST, operation: "multiply", value: 0.95 },
      ],
    },
    battle_rhythm: {
      id: "battle_rhythm",
      name: "Battle Rhythm",
      description: "Cooldowns recover slightly faster.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [{ type: MODIFIER_TYPES.COOLDOWN, operation: "multiply", value: 0.95 }],
    },
    arcane_flow: {
      id: "arcane_flow",
      name: "Arcane Flow",
      description: "Mana costs ease with practice.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [{ type: MODIFIER_TYPES.COST, operation: "multiply", value: 0.93 }],
    },
    spellweaver: {
      id: "spellweaver",
      name: "Spellweaver",
      description: "Spell recovery accelerates.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [{ type: MODIFIER_TYPES.COOLDOWN, operation: "multiply", value: 0.94 }],
    },
    mana_attunement: {
      id: "mana_attunement",
      name: "Mana Attunement",
      description: "Control mana flow for steadier output.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [
        { type: MODIFIER_TYPES.COST, operation: "multiply", value: 0.95 },
        { type: MODIFIER_TYPES.DAMAGE, operation: "multiply", value: 1.02 },
      ],
    },
    shadow_veil: {
      id: "shadow_veil",
      name: "Shadow Veil",
      description: "Strikes find soft spots more often.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [{ type: MODIFIER_TYPES.CRIT, operation: "add", value: { chance: 0.03 } }],
    },
    ghost_step: {
      id: "ghost_step",
      name: "Ghost Step",
      description: "Quicker resets after decisive moves.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [
        { type: MODIFIER_TYPES.COOLDOWN, operation: "multiply", value: 0.96 },
        { type: MODIFIER_TYPES.CRIT, operation: "add", value: { chance: 0.01 } },
      ],
    },
    poisoned_edge: {
      id: "poisoned_edge",
      name: "Poisoned Edge",
      description: "Lingering effects last longer.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [
        { type: MODIFIER_TYPES.DAMAGE, operation: "multiply", value: 1.04 },
        { type: MODIFIER_TYPES.DURATION, operation: "multiply", value: 1.08 },
      ],
    },
    divine_bulwark: {
      id: "divine_bulwark",
      name: "Divine Bulwark",
      description: "Protective rites persist with less delay.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [
        { type: MODIFIER_TYPES.DURATION, operation: "multiply", value: 1.1 },
        { type: MODIFIER_TYPES.COOLDOWN, operation: "multiply", value: 0.96 },
      ],
    },
    radiant_charge: {
      id: "radiant_charge",
      name: "Radiant Charge",
      description: "Charged attacks hit harder and wider.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [
        { type: MODIFIER_TYPES.DAMAGE, operation: "multiply", value: 1.04 },
        { type: MODIFIER_TYPES.AOE, operation: "multiply", value: 1.05 },
      ],
    },
    sacred_focus: {
      id: "sacred_focus",
      name: "Sacred Focus",
      description: "Sacred workings stay stable longer.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [
        { type: MODIFIER_TYPES.COST, operation: "multiply", value: 0.95 },
        { type: MODIFIER_TYPES.DURATION, operation: "multiply", value: 1.05 },
      ],
    },
    grave_tether: {
      id: "grave_tether",
      name: "Grave Tether",
      description: "Dark bindings hold and bite deeper.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [
        { type: MODIFIER_TYPES.DURATION, operation: "multiply", value: 1.1 },
        { type: MODIFIER_TYPES.DAMAGE, operation: "multiply", value: 1.03 },
      ],
    },
    bonecraft: {
      id: "bonecraft",
      name: "Bonecraft",
      description: "Grim techniques return quicker.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [
        { type: MODIFIER_TYPES.COOLDOWN, operation: "multiply", value: 0.95 },
        { type: MODIFIER_TYPES.DAMAGE, operation: "multiply", value: 1.02 },
      ],
    },
    verdant_pulse: {
      id: "verdant_pulse",
      name: "Verdant Pulse",
      description: "Nature effects persist with less effort.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [
        { type: MODIFIER_TYPES.DURATION, operation: "multiply", value: 1.1 },
        { type: MODIFIER_TYPES.COST, operation: "multiply", value: 0.95 },
      ],
    },
    tracker_instinct: {
      id: "tracker_instinct",
      name: "Tracker Instinct",
      description: "Critical hits come easier on decisive shots.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [
        { type: MODIFIER_TYPES.CRIT, operation: "add", value: { chance: 0.03 } },
        { type: MODIFIER_TYPES.COOLDOWN, operation: "multiply", value: 0.97 },
      ],
    },
    spirit_echo: {
      id: "spirit_echo",
      name: "Spirit Echo",
      description: "Inner echoes reinforce longer forms.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [
        { type: MODIFIER_TYPES.COST, operation: "multiply", value: 0.95 },
        { type: MODIFIER_TYPES.DURATION, operation: "multiply", value: 1.08 },
      ],
    },
    inner_balance: {
      id: "inner_balance",
      name: "Inner Balance",
      description: "Balanced forms recover with less strain.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [
        { type: MODIFIER_TYPES.COOLDOWN, operation: "multiply", value: 0.95 },
        { type: MODIFIER_TYPES.COST, operation: "multiply", value: 0.95 },
      ],
    },
    feral_instinct: {
      id: "feral_instinct",
      name: "Feral Instinct",
      description: "Primal attacks hit with extra force.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [{ type: MODIFIER_TYPES.DAMAGE, operation: "multiply", value: 1.05 }],
    },
    primal_fury: {
      id: "primal_fury",
      name: "Primal Fury",
      description: "Aggressive chains gain momentum.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 2,
      modifiers: [
        { type: MODIFIER_TYPES.DAMAGE, operation: "multiply", value: 1.06 },
        { type: MODIFIER_TYPES.CRIT, operation: "add", value: { chance: 0.01 } },
      ],
    },
    wayfarer: {
      id: "wayfarer",
      name: "Wayfarer",
      description: "Actions reset slightly faster on the move.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 1,
      modifiers: [{ type: MODIFIER_TYPES.COOLDOWN, operation: "multiply", value: 0.97 }],
    },
    system_favor: {
      id: "system_favor",
      name: "System Favor",
      description: "System protocols favor efficient execution.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 1,
      modifiers: [
        { type: MODIFIER_TYPES.COST, operation: "multiply", value: 0.95 },
        { type: MODIFIER_TYPES.COOLDOWN, operation: "multiply", value: 0.97 },
      ],
    },
    oathbound: {
      id: "oathbound",
      name: "Oathbound",
      description: "Sworn intent steadies your output.",
      priority: TALENT_PRIORITY.NORMAL,
      strainCost: 1,
      modifiers: [
        { type: MODIFIER_TYPES.DURATION, operation: "multiply", value: 1.05 },
        { type: MODIFIER_TYPES.DAMAGE, operation: "multiply", value: 1.02 },
      ],
    },
  });

// =====================================================
// TALENT COMPONENT UTILITIES
// =====================================================

/**
 * Get talent component definition by ID
 */
export function getTalentComponent(talentId) {
  return TALENT_COMPONENTS[talentId] || null;
}

/**
 * Get magnitude data for a talent at a specific player level
 */
export function getTalentMagnitude(talentId, playerLevel) {
  const talent = TALENT_COMPONENTS[talentId];
  if (!talent?.magnitudeThresholds) {
    return { label: "Region-Scale", aoeRadius: 50, damageCap: 1000 };
  }

  // Find highest threshold that player level meets
  const thresholds = [...talent.magnitudeThresholds].sort(
    (a, b) => b.level - a.level,
  );
  for (const threshold of thresholds) {
    if (playerLevel >= threshold.level) {
      return threshold;
    }
  }
  return talent.magnitudeThresholds[0];
}

/**
 * Apply talent modifiers to a skill
 */
export function applyTalentModifiers(skill, talentIds, playerLevel) {
  const modifiedSkill = { ...skill };

  for (const talentId of talentIds) {
    const talent = TALENT_COMPONENTS[talentId];
    if (!talent?.modifiers) continue;

    for (const modifier of talent.modifiers) {
      // Check if modifier applies to this skill
      if (
        modifier.skillTags &&
        !modifier.skillTags.some((tag) => skill.tags?.includes(tag))
      )
        continue;
      if (modifier.skillIds && !modifier.skillIds.includes(skill.id)) continue;

      // Get modifier value (may be function of player level)
      const value =
        typeof modifier.value === "function"
          ? modifier.value(playerLevel)
          : modifier.value;

      // Apply modifier based on type and operation
      switch (modifier.type) {
        case MODIFIER_TYPES.COST:
          modifiedSkill.manaCost = applyOperation(
            modifiedSkill.manaCost || 0,
            value,
            modifier.operation,
          );
          break;
        case MODIFIER_TYPES.COOLDOWN:
          modifiedSkill.cooldown = applyOperation(
            modifiedSkill.cooldown || 0,
            value,
            modifier.operation,
          );
          break;
        case MODIFIER_TYPES.DAMAGE:
          modifiedSkill.damageMultiplier = applyOperation(
            modifiedSkill.damageMultiplier || 1,
            value,
            modifier.operation,
          );
          break;
        case MODIFIER_TYPES.DURATION:
          modifiedSkill.durationMultiplier = applyOperation(
            modifiedSkill.durationMultiplier || 1,
            value,
            modifier.operation,
          );
          break;
        case MODIFIER_TYPES.AOE:
          modifiedSkill.aoeMultiplier = applyOperation(
            modifiedSkill.aoeMultiplier || 1,
            value,
            modifier.operation,
          );
          break;
        case MODIFIER_TYPES.CRIT:
          modifiedSkill.critModifier = {
            ...(modifiedSkill.critModifier || {}),
            ...value,
          };
          break;
        case MODIFIER_TYPES.BYPASS:
          modifiedSkill.bypasses = {
            ...(modifiedSkill.bypasses || {}),
            ...value,
          };
          break;
      }
    }
  }

  return modifiedSkill;
}

/**
 * Apply operation to a value
 */
function applyOperation(current, modifier, operation) {
  switch (operation) {
    case "multiply":
      return current * modifier;
    case "add":
      return current + modifier;
    case "set":
      return modifier;
    default:
      return current;
  }
}

/**
 * Calculate total strain from active talents
 */
export function calculateTalentStrain(talentIds) {
  return talentIds.reduce((total, id) => {
    const talent = TALENT_COMPONENTS[id];
    return total + (talent?.strainCost || 0);
  }, 0);
}

/**
 * Get all bypass flags from active talents
 */
export function collectBypassFlags(talentIds) {
  const bypasses = {};

  // Sort by priority (ABSOLUTE first)
  const sortedIds = [...talentIds].sort((a, b) => {
    const priorityOrder = { ABSOLUTE: 0, HIGH: 1, NORMAL: 2 };
    const talentA = TALENT_COMPONENTS[a];
    const talentB = TALENT_COMPONENTS[b];
    return (
      (priorityOrder[talentA?.priority] || 2) -
      (priorityOrder[talentB?.priority] || 2)
    );
  });

  for (const talentId of sortedIds) {
    const talent = TALENT_COMPONENTS[talentId];
    if (!talent?.modifiers) continue;

    for (const modifier of talent.modifiers) {
      if (modifier.type === MODIFIER_TYPES.BYPASS && modifier.value) {
        Object.assign(bypasses, modifier.value);
      }
    }
  }

  return bypasses;
}
