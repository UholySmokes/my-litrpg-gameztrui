const WEB_AND_GODOT = Object.freeze(["web", "godot"]);

function profile({
  priority,
  optionRules,
  attributeBias,
  skillRules,
}) {
  return Object.freeze({
    ordering: Object.freeze({
      selectable: true,
      platforms: [...WEB_AND_GODOT],
      priority,
    }),
    optionRules: Object.freeze(optionRules),
    attributeBias: Object.freeze(attributeBias),
    skillRules: Object.freeze(skillRules),
  });
}

function optionRule({
  allowIds = [],
  denyIds = [],
  boostIds = [],
} = {}) {
  return Object.freeze({
    allowIds: [...allowIds],
    denyIds: [...denyIds],
    boostIds: [...boostIds],
  });
}

function skillRule({
  grantActiveIds = [],
  grantPassiveIds = [],
  allowSkillIds = [],
  denySkillIds = [],
  boostSkillIds = [],
  allowLoadoutIds = [],
  denyLoadoutIds = [],
  activeSlotBonus = 0,
  passiveSlotBonus = 0,
} = {}) {
  return Object.freeze({
    grantActiveIds: [...grantActiveIds],
    grantPassiveIds: [...grantPassiveIds],
    allowSkillIds: [...allowSkillIds],
    denySkillIds: [...denySkillIds],
    boostSkillIds: [...boostSkillIds],
    allowLoadoutIds: [...allowLoadoutIds],
    denyLoadoutIds: [...denyLoadoutIds],
    activeSlotBonus,
    passiveSlotBonus,
  });
}

function attributeBias({
  primary = [],
  secondary = [],
} = {}) {
  return Object.freeze({
    primary: [...primary],
    secondary: [...secondary],
  });
}

export const CHARACTER_CREATION_SYSTEM_PROFILES = Object.freeze({
  skill_copy_interface: profile({
    priority: 10,
    optionRules: {
      origin: optionRule({
        boostIds: ["archive_runner", "ledger_apprentice", "dreamwake_survivor"],
      }),
      race: optionRule({
        boostIds: [
          "pure_human",
          "ancient_bloodline",
          "shadow_walker",
          "celestial_descendant",
          "starseer",
          "umbral_oracle",
        ],
      }),
      class: optionRule({
        boostIds: ["rogue", "mage", "ranger", "monk", "archmage", "spellbreaker"],
      }),
      secondaryClass: optionRule({
        boostIds: ["rogue", "mage", "monk", "cleric", "ranger"],
      }),
      profession: optionRule({
        boostIds: ["inscription", "enchanting", "engineering", "herbalism", "portal_creation"],
      }),
      perks: optionRule({
        boostIds: ["quick_learner", "arcane_sense", "battle_focus"],
      }),
      starterTrees: optionRule({
        boostIds: ["utility", "offense"],
      }),
    },
    attributeBias: attributeBias({
      primary: ["intelligence", "dexterity", "wisdom"],
      secondary: ["luck", "willpower"],
    }),
    skillRules: skillRule({
      grantActiveIds: ["universal_shadow_step"],
      grantPassiveIds: ["universal_arcane_insight"],
      allowSkillIds: ["universal_astral_lance", "universal_arcane_precision"],
      boostSkillIds: [
        "universal_shadow_step",
        "universal_astral_lance",
        "universal_arcane_insight",
        "universal_arcane_precision",
      ],
      denyLoadoutIds: ["bloodline_edge"],
    }),
  }),
  devourer_core: profile({
    priority: 20,
    optionRules: {
      origin: optionRule({
        boostIds: [
          "freehold_scrapper",
          "grove_exile",
          "sandstep_scout",
          "ashmarked_prospector",
        ],
      }),
      race: optionRule({
        boostIds: [
          "spirit_beast",
          "demon_kin",
          "mutant",
          "beast_kin",
          "blood_frenzied",
          "wild_mutant",
          "dragon_blood",
        ],
      }),
      class: optionRule({
        boostIds: ["berserker", "monk", "ranger", "rogue", "primal_overlord", "war_reaver"],
      }),
      secondaryClass: optionRule({
        boostIds: ["berserker", "monk", "ranger", "rogue"],
      }),
      profession: optionRule({
        boostIds: ["skinning", "butchery", "herbalism", "mining"],
      }),
      perks: optionRule({
        boostIds: ["iron_stomach", "battle_focus", "scavenger", "sturdy_grip"],
      }),
      starterTrees: optionRule({
        boostIds: ["offense", "defense"],
      }),
    },
    attributeBias: attributeBias({
      primary: ["strength", "vitality", "agility"],
      secondary: ["wisdom", "willpower"],
    }),
    skillRules: skillRule({
      grantActiveIds: ["universal_venom_strike"],
      grantPassiveIds: ["universal_martial_instinct"],
      allowSkillIds: ["universal_venom_pulse", "universal_shadow_strike", "universal_martial_momentum"],
      denySkillIds: ["universal_radiant_wave"],
      boostSkillIds: [
        "universal_venom_strike",
        "universal_venom_pulse",
        "universal_shadow_strike",
        "universal_martial_instinct",
      ],
      denyLoadoutIds: ["utility_matrix"],
    }),
  }),
  class_fusion_nexus: profile({
    priority: 30,
    optionRules: {
      origin: optionRule({
        boostIds: ["ledger_apprentice", "archive_runner", "dreamwake_survivor"],
      }),
      race: optionRule({
        boostIds: [
          "pure_human",
          "ancient_bloodline",
          "neo_human",
          "celestial_descendant",
          "dragon_blood",
          "starseer",
        ],
      }),
      class: optionRule({
        boostIds: [
          "warrior",
          "rogue",
          "mage",
          "cleric",
          "monk",
          "ranger",
          "paladin",
          "battlemage",
          "spellbreaker",
          "astral_archon",
          "shadow_assassin",
        ],
      }),
      secondaryClass: optionRule({
        boostIds: ["warrior", "rogue", "mage", "cleric", "monk", "ranger", "paladin", "battlemage"],
      }),
      profession: optionRule({
        boostIds: ["inscription", "enchanting", "engineering", "blacksmithing", "portal_creation"],
      }),
      perks: optionRule({
        boostIds: ["quick_learner", "arcane_sense", "battle_focus"],
      }),
      starterTrees: optionRule({
        boostIds: ["offense", "utility", "defense"],
      }),
    },
    attributeBias: attributeBias({
      primary: ["intelligence", "wisdom", "dexterity"],
      secondary: ["strength", "willpower"],
    }),
    skillRules: skillRule({
      grantPassiveIds: ["universal_arcane_harmony"],
      allowSkillIds: ["universal_arcane_discipline", "universal_martial_discipline"],
      boostSkillIds: [
        "universal_arcane_harmony",
        "universal_arcane_discipline",
        "universal_martial_discipline",
      ],
    }),
  }),
  exp_multiplier_matrix: profile({
    priority: 40,
    optionRules: {
      origin: optionRule({
        boostIds: ["freehold_scrapper", "ledger_apprentice", "deckhand_cadet", "salvage_adept"],
      }),
      race: optionRule({
        boostIds: ["pure_human", "neo_human", "luckweaver", "sunborn"],
      }),
      class: optionRule({
        boostIds: ["warrior", "rogue", "mage", "ranger", "berserker"],
      }),
      secondaryClass: optionRule({
        boostIds: ["warrior", "rogue", "mage", "ranger"],
      }),
      profession: optionRule({
        boostIds: ["mining", "logging", "herbalism", "fishing", "construction"],
      }),
      perks: optionRule({
        boostIds: ["quick_learner", "scavenger", "battle_focus"],
      }),
      starterTrees: optionRule({
        boostIds: ["offense", "utility"],
      }),
    },
    attributeBias: attributeBias({
      primary: ["dexterity", "vitality", "luck"],
      secondary: ["strength", "willpower"],
    }),
    skillRules: skillRule({
      grantPassiveIds: ["universal_martial_momentum"],
      allowSkillIds: ["universal_martial_focus"],
      boostSkillIds: ["universal_martial_momentum", "universal_martial_focus"],
    }),
  }),
  infinite_skill_points: profile({
    priority: 50,
    optionRules: {
      origin: optionRule({
        boostIds: ["archive_runner", "dreamwake_survivor", "salvage_adept"],
      }),
      race: optionRule({
        boostIds: ["pure_human", "ancient_bloodline", "spirit_beast", "celestial_descendant"],
      }),
      class: optionRule({
        boostIds: ["mage", "monk", "rogue", "ranger", "archmage", "shadow_assassin"],
      }),
      secondaryClass: optionRule({
        boostIds: ["mage", "monk", "rogue", "ranger"],
      }),
      profession: optionRule({
        boostIds: ["inscription", "enchanting", "engineering", "first_aid"],
      }),
      perks: optionRule({
        boostIds: ["quick_learner", "arcane_sense", "cautious"],
      }),
      starterTrees: optionRule({
        boostIds: ["utility", "offense"],
      }),
    },
    attributeBias: attributeBias({
      primary: ["intelligence", "wisdom", "dexterity"],
      secondary: ["luck", "willpower"],
    }),
    skillRules: skillRule({
      grantPassiveIds: ["universal_arcane_discipline"],
      allowSkillIds: ["universal_arcane_focus", "universal_martial_focus"],
      boostSkillIds: [
        "universal_arcane_discipline",
        "universal_arcane_focus",
        "universal_martial_focus",
      ],
    }),
  }),
  talent_evolution_engine: profile({
    priority: 60,
    optionRules: {
      origin: optionRule({
        boostIds: ["grove_exile", "archive_runner", "dreamwake_survivor", "tidebound_votary"],
      }),
      race: optionRule({
        boostIds: [
          "ancient_bloodline",
          "dragon_blood",
          "celestial_descendant",
          "phoenix_reborn",
          "fae_touched",
        ],
      }),
      class: optionRule({
        boostIds: ["monk", "ranger", "cleric", "mage", "paladin", "high_priest", "oracle_hierophant", "beastmaster"],
      }),
      secondaryClass: optionRule({
        boostIds: ["monk", "ranger", "cleric", "mage", "paladin"],
      }),
      profession: optionRule({
        boostIds: ["enchanting", "alchemy", "inscription", "herbalism"],
      }),
      perks: optionRule({
        boostIds: ["quick_learner", "arcane_sense", "battle_focus"],
      }),
      starterTrees: optionRule({
        boostIds: ["utility", "offense", "defense"],
      }),
    },
    attributeBias: attributeBias({
      primary: ["wisdom", "intelligence", "charisma"],
      secondary: ["soul", "willpower"],
    }),
    skillRules: skillRule({
      grantPassiveIds: ["skill_voidspark"],
      allowSkillIds: ["universal_arcane_harmony", "universal_arcane_vitality"],
      boostSkillIds: ["skill_voidspark", "universal_arcane_harmony", "universal_arcane_vitality"],
    }),
  }),
  shadow_companion_core: profile({
    priority: 70,
    optionRules: {
      origin: optionRule({
        boostIds: ["dreamwake_survivor", "sandstep_scout", "archive_runner"],
      }),
      race: optionRule({
        boostIds: ["shadow_walker", "duskborne", "gloomshade", "umbral_oracle", "shadow_veil"],
      }),
      class: optionRule({
        boostIds: ["rogue", "ranger", "shadow_assassin", "trickster", "night_reaper"],
      }),
      secondaryClass: optionRule({
        boostIds: ["rogue", "ranger", "shadow_assassin", "trickster"],
      }),
      profession: optionRule({
        boostIds: ["skinning", "inscription", "portal_creation", "repair"],
      }),
      perks: optionRule({
        boostIds: ["cautious", "scavenger", "arcane_sense"],
      }),
      starterTrees: optionRule({
        boostIds: ["utility", "offense"],
      }),
    },
    attributeBias: attributeBias({
      primary: ["dexterity", "wisdom", "luck"],
      secondary: ["willpower", "soul"],
    }),
    skillRules: skillRule({
      grantActiveIds: ["universal_shadow_step"],
      allowSkillIds: ["universal_shadow_pulse", "universal_shadow_cleave"],
      boostSkillIds: [
        "universal_shadow_step",
        "universal_shadow_pulse",
        "universal_shadow_cleave",
      ],
      denyLoadoutIds: ["class_core"],
    }),
  }),
  alchemy_compound_loop: profile({
    priority: 80,
    optionRules: {
      origin: optionRule({
        boostIds: ["ledger_apprentice", "salvage_adept", "ashmarked_prospector", "grove_exile"],
      }),
      race: optionRule({
        boostIds: ["neo_human", "ancient_bloodline", "fae_touched", "mechanical_construct", "crystal_being"],
      }),
      class: optionRule({
        boostIds: ["mage", "cleric", "monk", "battlemage", "spellbreaker"],
      }),
      secondaryClass: optionRule({
        boostIds: ["mage", "cleric", "monk", "battlemage"],
      }),
      profession: optionRule({
        boostIds: ["alchemy", "herbalism", "brewing", "inscription", "enchanting"],
      }),
      perks: optionRule({
        boostIds: ["iron_stomach", "arcane_sense", "quick_learner"],
      }),
      starterTrees: optionRule({
        boostIds: ["utility", "defense"],
      }),
    },
    attributeBias: attributeBias({
      primary: ["intelligence", "dexterity", "wisdom"],
      secondary: ["vitality", "luck"],
    }),
    skillRules: skillRule({
      grantPassiveIds: ["universal_herbalism"],
      allowSkillIds: ["universal_flame_pulse", "universal_frost_pulse", "universal_arcane_precision"],
      boostSkillIds: [
        "universal_herbalism",
        "universal_flame_pulse",
        "universal_frost_pulse",
        "universal_arcane_precision",
      ],
      allowLoadoutIds: ["utility_matrix"],
      denyLoadoutIds: ["bloodline_edge"],
    }),
  }),
  summoner_supreme: profile({
    priority: 90,
    optionRules: {
      origin: optionRule({
        boostIds: ["grove_exile", "tidebound_votary", "dreamwake_survivor"],
      }),
      race: optionRule({
        boostIds: ["spirit_beast", "nature_spirit", "celestial_descendant", "fae_touched", "dragon_blood"],
      }),
      class: optionRule({
        boostIds: ["ranger", "cleric", "mage", "beastmaster", "oracle_hierophant", "high_priest"],
      }),
      secondaryClass: optionRule({
        boostIds: ["ranger", "cleric", "mage", "beastmaster"],
      }),
      profession: optionRule({
        boostIds: ["farming", "fishing", "herbalism", "construction", "portal_creation"],
      }),
      perks: optionRule({
        boostIds: ["arcane_sense", "sturdy_grip", "cautious"],
      }),
      starterTrees: optionRule({
        boostIds: ["utility", "defense"],
      }),
    },
    attributeBias: attributeBias({
      primary: ["wisdom", "charisma", "willpower"],
      secondary: ["soul", "vitality"],
    }),
    skillRules: skillRule({
      grantActiveIds: ["universal_gale_step"],
      grantPassiveIds: ["universal_arcane_harmony"],
      allowSkillIds: ["universal_radiant_wave", "universal_gale_pulse"],
      boostSkillIds: [
        "universal_gale_step",
        "universal_arcane_harmony",
        "universal_radiant_wave",
        "universal_gale_pulse",
      ],
      allowLoadoutIds: ["utility_matrix", "bloodline_edge"],
    }),
  }),
  time_loop_regressor: profile({
    priority: 100,
    optionRules: {
      origin: optionRule({
        boostIds: ["archive_runner", "dreamwake_survivor", "deckhand_cadet", "sandstep_scout"],
      }),
      race: optionRule({
        boostIds: ["pure_human", "neo_human", "ancient_bloodline", "umbral_oracle", "starseer"],
      }),
      class: optionRule({
        boostIds: ["rogue", "mage", "monk", "ranger", "oracle_hierophant", "spellbreaker"],
      }),
      secondaryClass: optionRule({
        boostIds: ["rogue", "mage", "monk", "ranger"],
      }),
      profession: optionRule({
        boostIds: ["inscription", "repair", "engineering", "first_aid", "portal_creation"],
      }),
      perks: optionRule({
        boostIds: ["cautious", "quick_learner", "arcane_sense", "battle_focus"],
      }),
      starterTrees: optionRule({
        boostIds: ["utility", "offense"],
      }),
    },
    attributeBias: attributeBias({
      primary: ["intelligence", "wisdom", "willpower"],
      secondary: ["luck", "dexterity"],
    }),
    skillRules: skillRule({
      grantPassiveIds: ["universal_arcane_instinct"],
      allowSkillIds: ["universal_astral_step", "universal_astral_pulse", "universal_martial_focus"],
      boostSkillIds: [
        "universal_arcane_instinct",
        "universal_astral_step",
        "universal_astral_pulse",
        "universal_martial_focus",
      ],
      allowLoadoutIds: ["utility_matrix"],
      denyLoadoutIds: ["bloodline_edge"],
    }),
  }),
  save_point_system: profile({
    priority: 110,
    optionRules: {
      origin: optionRule({
        boostIds: ["freehold_scrapper", "dreamwake_survivor", "sandstep_scout", "archive_runner"],
      }),
      race: optionRule({
        boostIds: ["pure_human", "undead_awakened", "phoenix_reborn", "neo_human"],
      }),
      class: optionRule({
        boostIds: ["warrior", "cleric", "guardian", "paladin", "bulwark_sentinel", "monk"],
      }),
      secondaryClass: optionRule({
        boostIds: ["warrior", "cleric", "guardian", "paladin"],
      }),
      profession: optionRule({
        boostIds: ["first_aid", "repair", "construction", "farming", "cooking"],
      }),
      perks: optionRule({
        boostIds: ["cautious", "sturdy_grip", "quick_learner"],
      }),
      starterTrees: optionRule({
        boostIds: ["defense", "utility"],
      }),
    },
    attributeBias: attributeBias({
      primary: ["vitality", "willpower", "wisdom"],
      secondary: ["luck", "strength"],
    }),
    skillRules: skillRule({
      grantPassiveIds: ["universal_martial_ward"],
      allowSkillIds: ["universal_radiant_pulse", "universal_arcane_ward"],
      boostSkillIds: [
        "universal_martial_ward",
        "universal_radiant_pulse",
        "universal_arcane_ward",
      ],
      allowLoadoutIds: ["class_core", "utility_matrix"],
      denyLoadoutIds: ["bloodline_edge"],
    }),
  }),
  world_hopper_agent: profile({
    priority: 120,
    optionRules: {
      origin: optionRule({
        boostIds: ["deckhand_cadet", "archive_runner", "tidebound_votary", "dreamwake_survivor"],
      }),
      race: optionRule({
        boostIds: ["neo_human", "fae_touched", "celestial_descendant", "shadow_walker", "astral_nomad", "riftborn"],
      }),
      class: optionRule({
        boostIds: ["rogue", "mage", "ranger", "monk", "trickster", "astral_archon", "spellbreaker"],
      }),
      secondaryClass: optionRule({
        boostIds: ["rogue", "mage", "ranger", "monk", "trickster"],
      }),
      profession: optionRule({
        boostIds: ["portal_creation", "engineering", "inscription", "fishing"],
      }),
      perks: optionRule({
        boostIds: ["arcane_sense", "quick_learner", "scavenger"],
      }),
      starterTrees: optionRule({
        boostIds: ["utility", "offense"],
      }),
    },
    attributeBias: attributeBias({
      primary: ["dexterity", "intelligence", "wisdom"],
      secondary: ["luck", "willpower"],
    }),
    skillRules: skillRule({
      grantActiveIds: ["universal_astral_step"],
      grantPassiveIds: ["universal_arcane_precision"],
      allowSkillIds: ["universal_astral_lance", "universal_gale_step"],
      boostSkillIds: [
        "universal_astral_step",
        "universal_arcane_precision",
        "universal_astral_lance",
        "universal_gale_step",
      ],
      allowLoadoutIds: ["utility_matrix"],
      denyLoadoutIds: ["class_core"],
    }),
  }),
});

export function getArchetypeCharacterCreationProfile(systemId) {
  if (typeof systemId !== "string" || systemId.trim().length === 0) return null;
  return CHARACTER_CREATION_SYSTEM_PROFILES[systemId.trim()] || null;
}
