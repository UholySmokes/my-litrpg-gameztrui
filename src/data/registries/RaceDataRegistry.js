// =================================================================
// RACE DATA REGISTRY
// Consolidated race data from multiple sources
// Migrated from: src/systems/race/RaceRegistry.js, src/systems/skills/TalentDefinitions.js
// =================================================================

import { random, randomChoice } from "../../utils/DeterministicRandom.js";
import { SimBridge } from "../../simulation/bridge/SimulationBridge.js";

/**
 * EFFECT TAG DEFINITIONS
 * Standardized tags for the combat system to interpret.
 */
export const EFFECT_TAGS = {
  // Defensive
  IMMUNE_BLEED: "IMMUNE_BLEED",
  IMMUNE_POISON: "IMMUNE_POISON",
  IMMUNE_FEAR: "IMMUNE_FEAR",
  IMMUNE_STUN: "IMMUNE_STUN",
  RESIST_FIRE: "RESIST_FIRE",
  RESIST_ICE: "RESIST_ICE",
  RESIST_LIGHTNING: "RESIST_LIGHTNING",
  RESIST_DARK: "RESIST_DARK",
  RESIST_HOLY: "RESIST_HOLY",
  RESIST_PHYSICAL: "RESIST_PHYSICAL",

  // Offensive
  DMG_BOOST_FIRE: "DMG_BOOST_FIRE",
  DMG_BOOST_ICE: "DMG_BOOST_ICE",
  DMG_BOOST_LIGHTNING: "DMG_BOOST_LIGHTNING",
  DMG_BOOST_CRIT: "DMG_BOOST_CRIT",
  ALWAYS_HIT: "ALWAYS_HIT",

  // Utility / Resource
  REGEN_HP: "REGEN_HP",
  REGEN_MANA: "REGEN_MANA",
  XP_BOOST: "XP_BOOST",
  GOLD_BOOST: "GOLD_BOOST",
  DODGE_BOOST: "DODGE_BOOST",

  // Weaknesses
  WEAK_FIRE: "WEAK_FIRE",
  WEAK_ICE: "WEAK_ICE",
  WEAK_LIGHTNING: "WEAK_LIGHTNING",
  WEAK_HOLY: "WEAK_HOLY",
  WEAK_DARK: "WEAK_DARK",
  LOWER_DEFENSE: "LOWER_DEFENSE",
  LOWER_ACCURACY: "LOWER_ACCURACY",

  // Special Mechanics
  REBIRTH: "REBIRTH",
  HEAL_IS_DMG: "HEAL_IS_DMG",
  BERSERK_MODE: "BERSERK_MODE",
  START_BUFF_RANDOM: "START_BUFF_RANDOM",
  RANDOM_DEBUFF: "RANDOM_DEBUFF",
  GAMBLE_CAST: "GAMBLE_CAST",
  ABSORB_RANDOM: "ABSORB_RANDOM",
  WEAK_OPPOSITE: "WEAK_OPPOSITE",
  DEATH_SAVE: "DEATH_SAVE",
  LIFESTEAL: "LIFESTEAL",
  FREE_TELEPORT: "FREE_TELEPORT",
  PHASE_DODGE: "PHASE_DODGE",
};

/**
 * RACE TRAIT REGISTRY
 * Maps raceIDs to their sophisticated traits.
 */
export const RACE_TRAITS = {
  pure_human: {
    passive: {
      id: "human_potential",
      name: "Unlimited Potential",
      description: "Gain +10% Experience from all sources.",
      tags: [EFFECT_TAGS.XP_BOOST],
      value: 0.1,
    },
    hidden: {
      id: "jack_of_all_trades",
      name: "Jack of All Trades",
      description: "Learn skills 20% faster, but max stat cap is lower.",
      tags: ["LEARN_FAST", "STAT_CAP_LOW"],
      positive: "Skill XP +20%",
      negative: "Max Stat -10%",
    },
  },
  neo_human: {
    passive: {
      id: "cyber_optics",
      name: "Targeting Array",
      description: "Accuracy is always 100%. Critical Hit Chance +5%.",
      tags: [EFFECT_TAGS.ALWAYS_HIT, EFFECT_TAGS.DMG_BOOST_CRIT],
      value: 0.05,
    },
    hidden: {
      id: "cyber_rejection",
      name: "Synthetic Soul",
      description: "Immune to Poison, but healing magic is 50% less effective.",
      tags: [EFFECT_TAGS.IMMUNE_POISON, "HEAL_MALUS"],
      positive: "Immune to Poison",
      negative: "Healing -50%",
    },
  },
  ancient_bloodline: {
    passive: {
      id: "mana_mastery",
      name: "Ancient Mana Core",
      description: "Mana Regeneration +50%.",
      tags: [EFFECT_TAGS.REGEN_MANA],
      value: 0.5,
    },
    hidden: {
      id: "magical_overload",
      name: "Arcane Conductor",
      description: "Magic Damage +20%, but Physical Defense -20%.",
      tags: ["DMG_BOOST_MAGIC", "DEF_MALUS_PHYSICAL"],
      positive: "Magic Dmg +20%",
      negative: "Phys Def -20%",
    },
  },
  spirit_beast: {
    passive: {
      id: "feral_reflexes",
      name: "Predator Reflexes",
      description: "Dodge Chance +10%.",
      tags: [EFFECT_TAGS.DODGE_BOOST],
      value: 0.1,
    },
    hidden: {
      id: "wild_instinct",
      name: "Beast Nature",
      description: "Immune to Fear, but cannot use intricate machines/scrolls.",
      tags: [EFFECT_TAGS.IMMUNE_FEAR, "ITEM_RESTRICTION"],
      positive: "Immune to Fear",
      negative: "Cannot use Scrolls",
    },
  },
  demon_kin: {
    passive: {
      id: "blood_thirst",
      name: "Siphoning Strikes",
      description: "Heal for 5% of damage dealt.",
      tags: ["LIFESTEAL"],
      value: 0.05,
    },
    hidden: {
      id: "unholy_flesh",
      name: "Abyssal Origin",
      description: "Dark Resist +50%, but Holy Damage taken +50%.",
      tags: [EFFECT_TAGS.RESIST_DARK, EFFECT_TAGS.WEAK_HOLY],
      positive: "Dark Resist +50%",
      negative: "Weak to Holy",
    },
  },
  celestial_descendant: {
    passive: {
      id: "divine_aura",
      name: "Celestial Radiance",
      description: "Healing effects +20%.",
      tags: ["HEAL_BOOST"],
      value: 0.2,
    },
    hidden: {
      id: "pure_blood",
      name: "Heavenly Body",
      description: "Holy Resist +50%, but Dark Damage taken +50%.",
      tags: [EFFECT_TAGS.RESIST_HOLY, EFFECT_TAGS.WEAK_DARK],
      positive: "Holy Resist +50%",
      negative: "Weak to Dark",
    },
  },
  shadow_walker: {
    passive: {
      id: "void_step",
      name: "Shadow Form",
      description: "20% chance to negate damage.",
      tags: ["DMG_NEGATE_CHANCE"],
      value: 0.2,
    },
    hidden: {
      id: "light_sensitivity",
      name: "Creature of Night",
      description: "Stealth +50%, but Accuracy -20% in broad daylight.",
      tags: ["STEALTH_BOOST", "DAYLIGHT_MALUS"],
      positive: "Stealth +50%",
      negative: "Daylight Debuff",
    },
  },
  dragon_blood: {
    passive: {
      id: "dragon_scales",
      name: "Draconic Resilience",
      description: "Phys/Magic Defense +15%.",
      tags: ["DEF_BOOST_ALL"],
      value: 0.15,
    },
    hidden: {
      id: "pride",
      name: "Draconic Pride",
      description: "Immune to Fear/Charm, but cannot flee from battle.",
      tags: [EFFECT_TAGS.IMMUNE_FEAR, "NO_FLEE"],
      positive: "Immune Fear/Charm",
      negative: "Cannot Flee",
    },
  },
  elemental_attuned: {
    passive: {
      id: "elemental_harmony",
      name: "Elemental Flux",
      description: "Elemental Dmg +15%.",
      tags: ["DMG_BOOST_ELEMENTAL"],
      value: 0.15,
    },
    hidden: {
      id: "chaotic_resonance",
      name: "Unstable Core",
      description:
        "Randomly absorb one element, but double damage from opposite.",
      tags: ["ABSORB_RANDOM", "WEAK_OPPOSITE"],
      positive: "Absorb Element",
      negative: "Weak to Opposite",
    },
  },
  mutant: {
    passive: {
      id: "unstable_genome",
      name: "Adaptive Mutation",
      description: "Gain random buff at start of battle.",
      tags: ["START_BUFF_RANDOM"],
      value: 1,
    },
    hidden: {
      id: "genetic_decay",
      name: "Cellular Instability",
      description: "Regen HP +20%, but random debuff applied occasionally.",
      tags: [EFFECT_TAGS.REGEN_HP, "RANDOM_DEBUFF"],
      positive: "Regen +20%",
      negative: "Random Debuffs",
    },
  },
  undead_awakened: {
    passive: {
      id: "deathless",
      name: "Undying Will",
      description: "Survive with 1 HP once per battle.",
      tags: ["DEATH_SAVE"],
      value: 1,
    },
    hidden: {
      id: "rotting_body",
      name: "Corpse Body",
      description: "Immune to Bleed/Poison, but Healing damages you.",
      tags: [
        EFFECT_TAGS.IMMUNE_BLEED,
        EFFECT_TAGS.IMMUNE_POISON,
        "HEAL_IS_DMG",
      ],
      positive: "Immune Bleed/Poison",
      negative: "Healing Hurts",
    },
    entityTags: ["Undead"],
  },
  fae_touched: {
    passive: {
      id: "glamour",
      name: "Fae Trickery",
      description: "10% Evasion.",
      tags: [EFFECT_TAGS.DODGE_BOOST],
      value: 0.1,
    },
    hidden: {
      id: "iron_bane",
      name: "Cold Iron Weakness",
      description:
        "Magic +20%, but Physical Damage taken +20% (Iron aversion).",
      tags: ["DMG_BOOST_MAGIC", EFFECT_TAGS.LOWER_DEFENSE],
      positive: "Magic +20%",
      negative: "Phys Dmg Taken +20%",
    },
  },
  beast_kin: {
    passive: {
      id: "pack_tactics",
      name: "Savage Strikes",
      description: "Crit Dmg +20%.",
      tags: ["CRIT_DMG_BOOST"],
      value: 0.2,
    },
    hidden: {
      id: "berserk_rage",
      name: "Blood Frenzy",
      description: "Attack +20% below 50% HP, but lose control (auto-attack).",
      tags: ["LOW_HP_DMG_BOOST", "BERSERK_MODE"],
      positive: "Low HP Dmg +20%",
      negative: "Berserk at Low HP",
    },
  },
  mechanical_construct: {
    passive: {
      id: "overclock",
      name: "System Overclock",
      description: "Attack Speed +10%.",
      tags: ["SPEED_BOOST"],
      value: 0.1,
    },
    hidden: {
      id: "short_circuit",
      name: "Conductive Frame",
      description: "Immune to Bleed/Poison, but Lightning Damage taken +100%.",
      tags: [
        EFFECT_TAGS.IMMUNE_BLEED,
        EFFECT_TAGS.IMMUNE_POISON,
        EFFECT_TAGS.WEAK_LIGHTNING,
      ],
      positive: "Immune Bleed/Poison",
      negative: "Weak to Lightning",
    },
  },
  void_walker: {
    passive: {
      id: "dimensional_shift",
      name: "Phase Shift",
      description: "Magic Penetration +10%.",
      tags: ["PENETRATION_MAGIC"],
      value: 0.1,
    },
    hidden: {
      id: "reality_sickness",
      name: "Tethered Soul",
      description: "Teleport abilities cost 0 mana, but max HP -20%.",
      tags: ["FREE_TELEPORT", "HP_MALUS"],
      positive: "Free Teleport",
      negative: "Max HP -20%",
    },
  },
  phoenix_reborn: {
    passive: {
      id: "eternal_flame",
      name: "Heart of Fire",
      description: "Fire Damage +20%.",
      tags: [EFFECT_TAGS.DMG_BOOST_FIRE],
      value: 0.2,
    },
    hidden: {
      id: "burning_blood",
      name: "Combustible",
      description: "Immune to Fire, but Water/Ice Damage taken +50%.",
      tags: [EFFECT_TAGS.RESIST_FIRE, EFFECT_TAGS.WEAK_ICE],
      positive: "Immune to Fire",
      negative: "Weak to Ice",
    },
    rebirth: {
      id: "rise_from_ashes",
      name: "Rise from Ashes",
      description:
        "Upon death, resurrect with 25% HP once per day (24h cooldown).",
      tags: ["REBIRTH"],
      cooldownSeconds: 86400,
      reviveHpPercent: 0.25,
      canTrigger: true,
    },
  },
  nature_spirit: {
    passive: {
      id: "photosynthesis",
      name: "Nature's Blessing",
      description: "Max HP +10%.",
      tags: ["HP_BOOST"],
      value: 0.1,
    },
    hidden: {
      id: "wither",
      name: "Plant Anatomy",
      description: "Regen HP in sunlight, but Fire Damage taken +50%.",
      tags: ["SUN_REGEN", EFFECT_TAGS.WEAK_FIRE],
      positive: "Sun Regen",
      negative: "Weak to Fire",
    },
  },
  crystal_being: {
    passive: {
      id: "refraction",
      name: "Prismatic Shell",
      description: "Reflect 10% Magic Dmg.",
      tags: ["REFLECT_MAGIC"],
      value: 0.1,
    },
    hidden: {
      id: "shatter_risk",
      name: "Brittle Form",
      description: "Physical Defense +50%, but Sonic/Blunt damage taken +50%.",
      tags: ["DEF_BOOST_PHYSICAL", "WEAK_BLUNT"],
      positive: "Phys Def +50%",
      negative: "Weak to Blunt",
    },
  },
  chaos_born: {
    passive: {
      id: "entropy",
      name: "Chaos Theory",
      description: "Damage variance 50-200%.",
      tags: ["HIGH_VARIANCE"],
      value: 1,
    },
    hidden: {
      id: "wild_magic",
      name: "Unstable Casting",
      description: "Spells deal +50% dmg or backfire (hurt self).",
      tags: ["GAMBLE_CAST"],
      positive: "Spell Dmg +50%",
      negative: "Cast Backfire Risk",
    },
  },
  divine_scion: {
    passive: {
      id: "godly_favor",
      name: "Divine Providence",
      description: "All Stats +5%.",
      tags: ["STAT_BOOST_ALL"],
      value: 0.05,
    },
    hidden: {
      id: "hubris",
      name: "Mortal Disdain",
      description:
        "Damage vs Demons +50%, but cannot be healed by lower-tier beings.",
      tags: ["SLAYER_DEMON", "HEAL_RESTRICTION"],
      positive: "Dmg vs Demons +50%",
      negative: "Heal Restriction",
    },
  },
  stormforged: {
    passive: {
      id: "stormheart",
      name: "Stormheart",
      description: "Lightning Damage +15%.",
      tags: [EFFECT_TAGS.DMG_BOOST_LIGHTNING],
      value: 0.15,
    },
    hidden: {
      id: "grounded_core",
      name: "Grounded Core",
      description: "Lightning Resist +50%, but Accuracy -10%.",
      tags: [EFFECT_TAGS.RESIST_LIGHTNING, EFFECT_TAGS.LOWER_ACCURACY],
      positive: "Lightning Resist +50%",
      negative: "Accuracy -10%",
    },
  },
  frostborne: {
    passive: {
      id: "glacial_focus",
      name: "Glacial Focus",
      description: "Ice Damage +20%.",
      tags: [EFFECT_TAGS.DMG_BOOST_ICE],
      value: 0.2,
    },
    hidden: {
      id: "cold_blooded",
      name: "Cold Blooded",
      description: "Ice Resist +50%, but Fire Damage taken +50%.",
      tags: [EFFECT_TAGS.RESIST_ICE, EFFECT_TAGS.WEAK_FIRE],
      positive: "Ice Resist +50%",
      negative: "Weak to Fire",
    },
  },
  emberkin: {
    passive: {
      id: "cinder_blood",
      name: "Cinder Blood",
      description: "Fire Damage +20%.",
      tags: [EFFECT_TAGS.DMG_BOOST_FIRE],
      value: 0.2,
    },
    hidden: {
      id: "flashpoint",
      name: "Flashpoint",
      description: "Fire Resist +50%, but Ice Damage taken +50%.",
      tags: [EFFECT_TAGS.RESIST_FIRE, EFFECT_TAGS.WEAK_ICE],
      positive: "Fire Resist +50%",
      negative: "Weak to Ice",
    },
  },
  tidecaller: {
    passive: {
      id: "riptide_regen",
      name: "Riptide Regen",
      description: "Mana Regeneration +30%.",
      tags: [EFFECT_TAGS.REGEN_MANA],
      value: 0.3,
    },
    hidden: {
      id: "brine_skin",
      name: "Brine Skin",
      description: "Ice Resist +50%, but Lightning Damage taken +50%.",
      tags: [EFFECT_TAGS.RESIST_ICE, EFFECT_TAGS.WEAK_LIGHTNING],
      positive: "Ice Resist +50%",
      negative: "Weak to Lightning",
    },
  },
  sunborn: {
    passive: {
      id: "solar_vigor",
      name: "Solar Vigor",
      description: "HP Regeneration +20%.",
      tags: [EFFECT_TAGS.REGEN_HP],
      value: 0.2,
    },
    hidden: {
      id: "blazing_halo",
      name: "Blazing Halo",
      description: "Holy Resist +50%, but Dark Damage taken +50%.",
      tags: [EFFECT_TAGS.RESIST_HOLY, EFFECT_TAGS.WEAK_DARK],
      positive: "Holy Resist +50%",
      negative: "Weak to Dark",
    },
  },
  duskborne: {
    passive: {
      id: "night_veil",
      name: "Night Veil",
      description: "Dodge Chance +12%.",
      tags: [EFFECT_TAGS.DODGE_BOOST],
      value: 0.12,
    },
    hidden: {
      id: "twilight_fear",
      name: "Twilight Fear",
      description: "Dark Resist +50%, but Holy Damage taken +50%.",
      tags: [EFFECT_TAGS.RESIST_DARK, EFFECT_TAGS.WEAK_HOLY],
      positive: "Dark Resist +50%",
      negative: "Weak to Holy",
    },
  },
  ironroot: {
    passive: {
      id: "stonebark",
      name: "Stonebark",
      description: "Physical Damage taken -20%.",
      tags: [EFFECT_TAGS.RESIST_PHYSICAL],
      value: 0.2,
    },
    hidden: {
      id: "ironrooted",
      name: "Ironrooted",
      description: "Immune to Poison, but Accuracy -10%.",
      tags: [EFFECT_TAGS.IMMUNE_POISON, EFFECT_TAGS.LOWER_ACCURACY],
      positive: "Immune to Poison",
      negative: "Accuracy -10%",
    },
  },
  skybound: {
    passive: {
      id: "aerial_evasion",
      name: "Aerial Evasion",
      description: "Dodge Chance +15%.",
      tags: [EFFECT_TAGS.DODGE_BOOST],
      value: 0.15,
    },
    hidden: {
      id: "thin_blood",
      name: "Thin Blood",
      description: "Phase Dodge +10%, but Lightning Damage taken +50%.",
      tags: [EFFECT_TAGS.PHASE_DODGE, EFFECT_TAGS.WEAK_LIGHTNING],
      positive: "Phase Dodge +10%",
      negative: "Weak to Lightning",
    },
  },
  bloodwoven: {
    passive: {
      id: "crimson_pact",
      name: "Crimson Pact",
      description: "Heal for 7% of damage dealt.",
      tags: [EFFECT_TAGS.LIFESTEAL],
      value: 0.07,
    },
    hidden: {
      id: "hemophage",
      name: "Hemophage",
      description: "Immune to Bleed, but Holy Damage taken +50%.",
      tags: [EFFECT_TAGS.IMMUNE_BLEED, EFFECT_TAGS.WEAK_HOLY],
      positive: "Immune to Bleed",
      negative: "Weak to Holy",
    },
  },
  starseer: {
    passive: {
      id: "stellar_alignment",
      name: "Stellar Alignment",
      description: "Gain +10% Experience from all sources.",
      tags: [EFFECT_TAGS.XP_BOOST],
      value: 0.1,
    },
    hidden: {
      id: "gravity_well",
      name: "Gravity Well",
      description: "Dark Resist +50%, but Physical Defense -20%.",
      tags: [EFFECT_TAGS.RESIST_DARK, EFFECT_TAGS.LOWER_DEFENSE],
      positive: "Dark Resist +50%",
      negative: "Defense -20%",
    },
  },
  rune_sentinel: {
    passive: {
      id: "rune_barrier",
      name: "Rune Barrier",
      description: "Physical Damage taken -15%.",
      tags: [EFFECT_TAGS.RESIST_PHYSICAL],
      value: 0.15,
    },
    hidden: {
      id: "runic_lock",
      name: "Runic Lock",
      description: "Immune to Stun, but Accuracy -10%.",
      tags: [EFFECT_TAGS.IMMUNE_STUN, EFFECT_TAGS.LOWER_ACCURACY],
      positive: "Immune to Stun",
      negative: "Accuracy -10%",
    },
  },
  mirageborn: {
    passive: {
      id: "gilded_mirage",
      name: "Gilded Mirage",
      description: "Gold gains +15%.",
      tags: [EFFECT_TAGS.GOLD_BOOST],
      value: 0.15,
    },
    hidden: {
      id: "heat_haze",
      name: "Heat Haze",
      description: "Dodge Chance +10%, but Ice Damage taken +50%.",
      tags: [EFFECT_TAGS.DODGE_BOOST, EFFECT_TAGS.WEAK_ICE],
      positive: "Dodge +10%",
      negative: "Weak to Ice",
    },
  },
  quakeborn: {
    passive: {
      id: "seismic_stride",
      name: "Seismic Stride",
      description: "Physical Damage taken -20%.",
      tags: [EFFECT_TAGS.RESIST_PHYSICAL],
      value: 0.2,
    },
    hidden: {
      id: "shatter_echo",
      name: "Shatter Echo",
      description: "Immune to Stun, but Accuracy -10%.",
      tags: [EFFECT_TAGS.IMMUNE_STUN, EFFECT_TAGS.LOWER_ACCURACY],
      positive: "Immune to Stun",
      negative: "Accuracy -10%",
    },
  },
  venomtail: {
    passive: {
      id: "toxin_mastery",
      name: "Toxin Mastery",
      description: "Immune to Poison.",
      tags: [EFFECT_TAGS.IMMUNE_POISON],
      value: 1,
    },
    hidden: {
      id: "serrated_edge",
      name: "Serrated Edge",
      description: "Critical Hit Chance +5%, but Fire Damage taken +50%.",
      tags: [EFFECT_TAGS.DMG_BOOST_CRIT, EFFECT_TAGS.WEAK_FIRE],
      positive: "Crit Chance +5%",
      negative: "Weak to Fire",
    },
  },
  auric_seraph: {
    passive: {
      id: "radiant_guard",
      name: "Radiant Guard",
      description: "Holy Resist +50%.",
      tags: [EFFECT_TAGS.RESIST_HOLY],
      value: 0.5,
    },
    hidden: {
      id: "halo_burden",
      name: "Halo Burden",
      description: "Mana Regeneration +20%, but Dark Damage taken +50%.",
      tags: [EFFECT_TAGS.REGEN_MANA, EFFECT_TAGS.WEAK_DARK],
      positive: "Mana Regen +20%",
      negative: "Weak to Dark",
    },
  },
  gloomshade: {
    passive: {
      id: "umbral_slip",
      name: "Umbral Slip",
      description: "Dodge Chance +15%.",
      tags: [EFFECT_TAGS.DODGE_BOOST],
      value: 0.15,
    },
    hidden: {
      id: "light_burn",
      name: "Light Burn",
      description: "Stealth +50%, but Holy Damage taken +50%.",
      tags: ["STEALTH_BOOST", EFFECT_TAGS.WEAK_HOLY],
      positive: "Stealth +50%",
      negative: "Weak to Holy",
    },
  },
  sandstrider: {
    passive: {
      id: "dune_runner",
      name: "Dune Runner",
      description: "Dodge Chance +10%.",
      tags: [EFFECT_TAGS.DODGE_BOOST],
      value: 0.1,
    },
    hidden: {
      id: "sun_baked",
      name: "Sun Baked",
      description: "Fire Resist +50%, but Physical Defense -20%.",
      tags: [EFFECT_TAGS.RESIST_FIRE, EFFECT_TAGS.LOWER_DEFENSE],
      positive: "Fire Resist +50%",
      negative: "Defense -20%",
    },
  },
  umbral_oracle: {
    passive: {
      id: "dark_insight",
      name: "Dark Insight",
      description: "Mana Regeneration +25%.",
      tags: [EFFECT_TAGS.REGEN_MANA],
      value: 0.25,
    },
    hidden: {
      id: "oracle_toll",
      name: "Oracle Toll",
      description: "Dark Resist +50%, but Holy Damage taken +50%.",
      tags: [EFFECT_TAGS.RESIST_DARK, EFFECT_TAGS.WEAK_HOLY],
      positive: "Dark Resist +50%",
      negative: "Weak to Holy",
    },
  },
  verdant_shaper: {
    passive: {
      id: "verdant_growth",
      name: "Verdant Growth",
      description: "HP Regeneration +20%.",
      tags: [EFFECT_TAGS.REGEN_HP],
      value: 0.2,
    },
    hidden: {
      id: "sylvan_instinct",
      name: "Sylvan Instinct",
      description: "Immune to Fear, but Fire Damage taken +50%.",
      tags: [EFFECT_TAGS.IMMUNE_FEAR, EFFECT_TAGS.WEAK_FIRE],
      positive: "Immune to Fear",
      negative: "Weak to Fire",
    },
  },
  astral_nomad: {
    passive: {
      id: "rift_wanderer",
      name: "Rift Wanderer",
      description: "Teleport abilities cost 0 mana.",
      tags: [EFFECT_TAGS.FREE_TELEPORT],
      value: 1,
    },
    hidden: {
      id: "starworn",
      name: "Starworn",
      description: "Lightning Resist +50%, but max HP -20%.",
      tags: [EFFECT_TAGS.RESIST_LIGHTNING, "HP_MALUS"],
      positive: "Lightning Resist +50%",
      negative: "Max HP -20%",
    },
  },
};

/**
 * RACES - 40 Fantasy/Cultivation themed races
 */
export const races = [
  {
    id: "pure_human",
    name: "Pure Human",
    description:
      "A standard human with no special bloodline. Versatile and adaptable.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 1,
      dex: 1,
      int: 1,
      cha: 2,
      will: 2,
      luck: 1,
      soul: 1,
    },
    passiveAbility: getPassiveAbility("pure_human"),
    hiddenTrait: getHiddenTraits("pure_human"),
  },
  {
    id: "neo_human",
    name: "Neo-Human",
    description:
      "Human with cybernetic enhancements. Enhanced physical capabilities.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 3,
      agi: 2,
      dex: 3,
      int: 1,
      cha: 0,
      will: 1,
      luck: 0,
      soul: 0,
    },
    passiveAbility: getPassiveAbility("neo_human"),
    hiddenTrait: getHiddenTraits("neo_human"),
  },
  {
    id: "ancient_bloodline",
    name: "Ancient Bloodline",
    description:
      "Descendant of an ancient powerful lineage. Natural affinity for cultivation.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 1,
      dex: 1,
      int: 4,
      cha: 2,
      will: 2,
      luck: 2,
      soul: 3,
    },
    passiveAbility: getPassiveAbility("ancient_bloodline"),
    hiddenTrait: getHiddenTraits("ancient_bloodline"),
  },
  {
    id: "spirit_beast",
    name: "Spirit Beast",
    description: "A creature with spiritual energy flowing through its veins.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 4,
      agi: 4,
      dex: 2,
      int: 0,
      cha: -1,
      will: 2,
      luck: 1,
      soul: 1,
    },
    passiveAbility: getPassiveAbility("spirit_beast"),
    hiddenTrait: getHiddenTraits("spirit_beast"),
  },
  {
    id: "demon_kin",
    name: "Demon Kin",
    description:
      "Mixed heritage with demonic ancestry. Dark power courses through you.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 4,
      agi: 2,
      dex: 1,
      int: 2,
      cha: -1,
      will: 3,
      luck: -1,
      soul: 2,
    },
    passiveAbility: getPassiveAbility("demon_kin"),
    hiddenTrait: getHiddenTraits("demon_kin"),
  },
  {
    id: "celestial_descendant",
    name: "Celestial Descendant",
    description:
      "Bloodline touched by celestial beings. Radiant energy within.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 2,
      dex: 2,
      int: 3,
      cha: 4,
      will: 2,
      luck: 2,
      soul: 2,
    },
    passiveAbility: getPassiveAbility("celestial_descendant"),
    hiddenTrait: getHiddenTraits("celestial_descendant"),
  },
  {
    id: "shadow_walker",
    name: "Shadow Walker",
    description:
      "Born from the void between realms. Natural stealth and darkness affinity.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 5,
      dex: 4,
      int: 2,
      cha: 0,
      will: 2,
      luck: 1,
      soul: 2,
    },
    passiveAbility: getPassiveAbility("shadow_walker"),
    hiddenTrait: getHiddenTraits("shadow_walker"),
  },
  {
    id: "dragon_blood",
    name: "Dragon Blood",
    description:
      "Ancient dragon heritage. Immense physical and magical potential.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 5,
      agi: 2,
      dex: 1,
      int: 3,
      cha: 2,
      will: 3,
      luck: 1,
      soul: 2,
    },
    passiveAbility: getPassiveAbility("dragon_blood"),
    hiddenTrait: getHiddenTraits("dragon_blood"),
  },
  {
    id: "elemental_attuned",
    name: "Elemental Attuned",
    description: "Born with natural connection to elemental forces.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 2,
      dex: 2,
      int: 4,
      cha: 2,
      will: 2,
      luck: 2,
      soul: 3,
    },
    passiveAbility: getPassiveAbility("elemental_attuned"),
    hiddenTrait: getHiddenTraits("elemental_attuned"),
  },
  {
    id: "mutant",
    name: "Mutant",
    description:
      "Genetic mutation grants unique abilities. Unpredictable potential.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 2,
      agi: 2,
      dex: 2,
      int: 2,
      cha: 1,
      will: 1,
      luck: 3,
      soul: 2,
    },
    passiveAbility: getPassiveAbility("mutant"),
    hiddenTrait: getHiddenTraits("mutant"),
  },
  {
    id: "undead_awakened",
    name: "Undead Awakened",
    description:
      "Returned from death with consciousness. Death energy flows through you.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 2,
      agi: 1,
      dex: 1,
      int: 2,
      cha: -2,
      will: 4,
      luck: -1,
      soul: 3,
    },
    passiveAbility: getPassiveAbility("undead_awakened"),
    hiddenTrait: getHiddenTraits("undead_awakened"),
  },
  {
    id: "fae_touched",
    name: "Fae Touched",
    description: "Touched by fae magic. Natural charm and illusion affinity.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 0,
      agi: 2,
      dex: 2,
      int: 2,
      cha: 4,
      will: 1,
      luck: 3,
      soul: 2,
    },
    passiveAbility: getPassiveAbility("fae_touched"),
    hiddenTrait: getHiddenTraits("fae_touched"),
  },
  {
    id: "beast_kin",
    name: "Beast Kin",
    description:
      "Human with animalistic traits. Enhanced senses and physical prowess.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 4,
      agi: 4,
      dex: 2,
      int: -1,
      cha: 1,
      will: 2,
      luck: 2,
      soul: 1,
    },
    passiveAbility: getPassiveAbility("beast_kin"),
    hiddenTrait: getHiddenTraits("beast_kin"),
  },
  {
    id: "mechanical_construct",
    name: "Mechanical Construct",
    description:
      "Living machine with artificial intelligence. Perfect precision.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 2,
      agi: 1,
      dex: 4,
      int: 3,
      cha: -2,
      will: 3,
      luck: 0,
      soul: -1,
    },
    passiveAbility: getPassiveAbility("mechanical_construct"),
    hiddenTrait: getHiddenTraits("mechanical_construct"),
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
    passiveAbility: getPassiveAbility("void_walker"),
    hiddenTrait: getHiddenTraits("void_walker"),
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
    passiveAbility: getPassiveAbility("phoenix_reborn"),
    hiddenTrait: getHiddenTraits("phoenix_reborn"),
  },
  {
    id: "nature_spirit",
    name: "Nature Spirit",
    description: "One with nature. Life energy and plant manipulation.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 2,
      dex: 2,
      int: 3,
      cha: 3,
      will: 2,
      luck: 2,
      soul: 3,
    },
    passiveAbility: getPassiveAbility("nature_spirit"),
    hiddenTrait: getHiddenTraits("nature_spirit"),
  },
  {
    id: "crystal_being",
    name: "Crystal Being",
    description: "Living crystal entity. Hard defense and energy storage.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 2,
      agi: -1,
      dex: 1,
      int: 3,
      cha: 1,
      will: 4,
      luck: 1,
      soul: 3,
    },
    passiveAbility: getPassiveAbility("crystal_being"),
    hiddenTrait: getHiddenTraits("crystal_being"),
  },
  {
    id: "chaos_born",
    name: "Chaos Born",
    description: "Born from chaos energy. Unpredictable and powerful.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 2,
      agi: 2,
      dex: 2,
      int: 2,
      cha: 1,
      will: 2,
      luck: 4,
      soul: 2,
    },
    passiveAbility: getPassiveAbility("chaos_born"),
    hiddenTrait: getHiddenTraits("chaos_born"),
  },
  {
    id: "divine_scion",
    name: "Divine Scion",
    description: "Child of a minor deity. Blessed with divine favor.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 2,
      agi: 2,
      dex: 2,
      int: 2,
      cha: 3,
      will: 2,
      luck: 3,
      soul: 3,
    },
    passiveAbility: getPassiveAbility("divine_scion"),
    hiddenTrait: getHiddenTraits("divine_scion"),
  },
  {
    id: "stormforged",
    name: "Stormforged",
    description:
      "Forged in perpetual storms, bodies crackle with charged steel.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 3,
      agi: 2,
      dex: 1,
      int: 2,
      cha: 0,
      will: 3,
      luck: 1,
      soul: 1,
    },
    passiveAbility: getPassiveAbility("stormforged"),
    hiddenTrait: getHiddenTraits("stormforged"),
  },
  {
    id: "frostborne",
    name: "Frostborne",
    description: "Born of glacial realms, calm and enduring.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 2,
      agi: 1,
      dex: 1,
      int: 2,
      cha: 0,
      will: 3,
      luck: 1,
      soul: 2,
    },
    passiveAbility: getPassiveAbility("frostborne"),
    hiddenTrait: getHiddenTraits("frostborne"),
  },
  {
    id: "emberkin",
    name: "Emberkin",
    description: "Children of living flame, their blood runs hot with power.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 2,
      agi: 2,
      dex: 1,
      int: 2,
      cha: 1,
      will: 2,
      luck: 1,
      soul: 1,
    },
    passiveAbility: getPassiveAbility("emberkin"),
    hiddenTrait: getHiddenTraits("emberkin"),
  },
  {
    id: "tidecaller",
    name: "Tidecaller",
    description: "Mystics of the sea, attuned to the pull of moons and tides.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 2,
      dex: 2,
      int: 3,
      cha: 2,
      will: 2,
      luck: 1,
      soul: 2,
    },
    passiveAbility: getPassiveAbility("tidecaller"),
    hiddenTrait: getHiddenTraits("tidecaller"),
  },
  {
    id: "sunborn",
    name: "Sunborn",
    description: "Radiant descendants of the dawn, fueled by solar vigor.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 2,
      agi: 1,
      dex: 1,
      int: 2,
      cha: 3,
      will: 2,
      luck: 1,
      soul: 2,
    },
    passiveAbility: getPassiveAbility("sunborn"),
    hiddenTrait: getHiddenTraits("sunborn"),
  },
  {
    id: "duskborne",
    name: "Duskborne",
    description: "Born at the edge of night, masters of twilight evasion.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 3,
      dex: 3,
      int: 2,
      cha: 1,
      will: 2,
      luck: 2,
      soul: 2,
    },
    passiveAbility: getPassiveAbility("duskborne"),
    hiddenTrait: getHiddenTraits("duskborne"),
  },
  {
    id: "ironroot",
    name: "Ironroot",
    description: "Deepwood guardians with bark-hard skin and unyielding will.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 3,
      agi: 0,
      dex: 1,
      int: 1,
      cha: 0,
      will: 4,
      luck: 0,
      soul: 2,
    },
    passiveAbility: getPassiveAbility("ironroot"),
    hiddenTrait: getHiddenTraits("ironroot"),
  },
  {
    id: "skybound",
    name: "Skybound",
    description: "High-altitude wanderers who move like wind across the sky.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 4,
      dex: 3,
      int: 2,
      cha: 1,
      will: 1,
      luck: 2,
      soul: 1,
    },
    passiveAbility: getPassiveAbility("skybound"),
    hiddenTrait: getHiddenTraits("skybound"),
  },
  {
    id: "bloodwoven",
    name: "Bloodwoven",
    description: "Warriors bound by crimson oaths that feed on battle.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 3,
      agi: 1,
      dex: 2,
      int: 1,
      cha: 0,
      will: 3,
      luck: 1,
      soul: 2,
    },
    passiveAbility: getPassiveAbility("bloodwoven"),
    hiddenTrait: getHiddenTraits("bloodwoven"),
  },
  {
    id: "starseer",
    name: "Starseer",
    description: "Celestial scholars who read fate in constellations.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 0,
      agi: 1,
      dex: 1,
      int: 4,
      cha: 2,
      will: 3,
      luck: 2,
      soul: 3,
    },
    passiveAbility: getPassiveAbility("starseer"),
    hiddenTrait: getHiddenTraits("starseer"),
  },
  {
    id: "rune_sentinel",
    name: "Rune Sentinel",
    description: "Ancient wardens etched with runes of protection.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 2,
      agi: 1,
      dex: 2,
      int: 2,
      cha: 0,
      will: 4,
      luck: 0,
      soul: 1,
    },
    passiveAbility: getPassiveAbility("rune_sentinel"),
    hiddenTrait: getHiddenTraits("rune_sentinel"),
  },
  {
    id: "mirageborn",
    name: "Mirageborn",
    description: "Desert phantoms who thrive on illusion and fortune.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 0,
      agi: 3,
      dex: 3,
      int: 3,
      cha: 2,
      will: 1,
      luck: 3,
      soul: 1,
    },
    passiveAbility: getPassiveAbility("mirageborn"),
    hiddenTrait: getHiddenTraits("mirageborn"),
  },
  {
    id: "quakeborn",
    name: "Quakeborn",
    description: "Stone-blooded titans whose steps shake the ground.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 4,
      agi: 0,
      dex: 1,
      int: 1,
      cha: 0,
      will: 3,
      luck: 0,
      soul: 1,
    },
    passiveAbility: getPassiveAbility("quakeborn"),
    hiddenTrait: getHiddenTraits("quakeborn"),
  },
  {
    id: "venomtail",
    name: "Venomtail",
    description: "Swift hunters with venomous instincts and lethal precision.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 2,
      agi: 3,
      dex: 3,
      int: 1,
      cha: 0,
      will: 2,
      luck: 2,
      soul: 1,
    },
    passiveAbility: getPassiveAbility("venomtail"),
    hiddenTrait: getHiddenTraits("venomtail"),
  },
  {
    id: "auric_seraph",
    name: "Auric Seraph",
    description: "Golden-winged protectors infused with radiant grace.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 2,
      agi: 2,
      dex: 2,
      int: 3,
      cha: 4,
      will: 3,
      luck: 1,
      soul: 3,
    },
    passiveAbility: getPassiveAbility("auric_seraph"),
    hiddenTrait: getHiddenTraits("auric_seraph"),
  },
  {
    id: "gloomshade",
    name: "Gloomshade",
    description: "Shadow-dwellers who vanish between breaths.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 4,
      dex: 3,
      int: 2,
      cha: 1,
      will: 2,
      luck: 2,
      soul: 2,
    },
    passiveAbility: getPassiveAbility("gloomshade"),
    hiddenTrait: getHiddenTraits("gloomshade"),
  },
  {
    id: "sandstrider",
    name: "Sandstrider",
    description: "Nomads who cross deserts with effortless speed.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 3,
      dex: 3,
      int: 2,
      cha: 1,
      will: 1,
      luck: 3,
      soul: 1,
    },
    passiveAbility: getPassiveAbility("sandstrider"),
    hiddenTrait: getHiddenTraits("sandstrider"),
  },
  {
    id: "umbral_oracle",
    name: "Umbral Oracle",
    description: "Seers of the void who channel duskborn mana.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 0,
      agi: 1,
      dex: 2,
      int: 4,
      cha: 1,
      will: 4,
      luck: 1,
      soul: 3,
    },
    passiveAbility: getPassiveAbility("umbral_oracle"),
    hiddenTrait: getHiddenTraits("umbral_oracle"),
  },
  {
    id: "verdant_shaper",
    name: "Verdant Shaper",
    description: "Living sculptors of flora and life essence.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 2,
      agi: 2,
      dex: 1,
      int: 2,
      cha: 2,
      will: 3,
      luck: 1,
      soul: 3,
    },
    passiveAbility: getPassiveAbility("verdant_shaper"),
    hiddenTrait: getHiddenTraits("verdant_shaper"),
  },
  {
    id: "astral_nomad",
    name: "Astral Nomad",
    description: "Wanderers between stars who fold space with ease.",
    evolutionStage: "Mortal",
    statBonuses: {
      str: 1,
      agi: 2,
      dex: 2,
      int: 4,
      cha: 1,
      will: 3,
      luck: 2,
      soul: 4,
    },
    passiveAbility: getPassiveAbility("astral_nomad"),
    hiddenTrait: getHiddenTraits("astral_nomad"),
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getPassiveAbility(raceId) {
  return RACE_TRAITS[raceId]?.passive || null;
}

export function getHiddenTraits(raceId) {
  return RACE_TRAITS[raceId]?.hidden || null;
}

export function hasRaceTag(raceId, tag) {
  const traits = RACE_TRAITS[raceId];
  if (!traits) return false;

  const passiveTags = traits.passive?.tags || [];
  const hiddenTags = traits.hidden?.tags || [];

  return passiveTags.includes(tag) || hiddenTags.includes(tag);
}

export function getRaceEffectTags(raceId) {
  const traits = RACE_TRAITS[raceId];
  if (!traits) return [];

  const passiveTags = traits.passive?.tags || [];
  const hiddenTags = traits.hidden?.tags || [];

  return [...new Set([...passiveTags, ...hiddenTags])];
}

export function getRaceEntityTags(raceId) {
  const traits = RACE_TRAITS[raceId];
  return traits?.entityTags || [];
}

export function getRaceRebirth(raceId) {
  const traits = RACE_TRAITS[raceId];
  return traits?.rebirth || null;
}

export function canRaceRebirth(raceId, lastRebirthTime = 0) {
  const rebirth = getRaceRebirth(raceId);
  if (!rebirth) return { canRebirth: false, remainingCooldown: 0 };

  const now = SimBridge.now();
  const cooldownMs = (rebirth.cooldownSeconds || 86400) * 1000;
  const timeSinceRebirth = now - lastRebirthTime;

  if (timeSinceRebirth >= cooldownMs) {
    return { canRebirth: true, remainingCooldown: 0 };
  }

  return {
    canRebirth: false,
    remainingCooldown: Math.ceil((cooldownMs - timeSinceRebirth) / 1000),
  };
}

export function getRandomStartBuff() {
  const buffs = [
    {
      id: "mutation_str",
      name: "Muscle Surge",
      stat: "str",
      value: 0.2,
      duration: 5,
    },
    {
      id: "mutation_agi",
      name: "Nerve Boost",
      stat: "agi",
      value: 0.2,
      duration: 5,
    },
    {
      id: "mutation_def",
      name: "Thick Skin",
      stat: "defense",
      value: 0.3,
      duration: 5,
    },
    {
      id: "mutation_crit",
      name: "Sharp Eyes",
      stat: "critChance",
      value: 0.15,
      duration: 5,
    },
    {
      id: "mutation_regen",
      name: "Rapid Healing",
      stat: "hpRegen",
      value: 10,
      duration: 5,
    },
  ];
  return randomChoice(buffs);
}

export function getRandomDebuff() {
  const debuffs = [
    {
      id: "decay_str",
      name: "Muscle Spasm",
      stat: "str",
      value: -0.1,
      duration: 3,
    },
    {
      id: "decay_agi",
      name: "Nerve Lag",
      stat: "agi",
      value: -0.1,
      duration: 3,
    },
    {
      id: "decay_acc",
      name: "Blurred Vision",
      stat: "accuracy",
      value: -0.15,
      duration: 3,
    },
  ];
  return randomChoice(debuffs);
}

export function rollGambleCast() {
  const roll = random();
  if (roll < 0.5) {
    return {
      success: true,
      multiplier: 1.5,
      message: "Chaos amplifies your spell!",
    };
  } else {
    return { success: false, multiplier: -0.5, message: "Spell backfires!" };
  }
}

export function getRandomElementAbsorption() {
  const elements = ["fire", "ice", "lightning", "nature", "holy", "dark"];
  const opposites = {
    fire: "ice",
    ice: "fire",
    lightning: "nature",
    nature: "lightning",
    holy: "dark",
    dark: "holy",
  };
  const absorbed = randomChoice(elements);
  return {
    absorbed,
    weakTo: opposites[absorbed],
    message: `Elemental Flux: Absorbing ${absorbed}, weak to ${opposites[absorbed]}`,
  };
}
