// =================================================================
// TALENT DEFINITIONS
// Defines the ex-rank talents available in the game
// =================================================================

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
    description:
      "Mana regenerates infinitely. Never run out of magical energy.",
  },
  {
    id: "hundred_percent_drop",
    name: "100% Drop Rate",
    description: "All enemies drop items. Guaranteed loot from every kill.",
  },
  {
    id: "auto_combat_ai",
    name: "Auto-Combat AI",
    description: "Automatic combat system. Fights enemies without input.",
  },
  {
    id: "experience_multiplier",
    name: "10x Experience Multiplier",
    description: "Gain 10 times the normal experience from all sources.",
  },
  {
    id: "stat_steal",
    name: "Stat Steal",
    description: "Steal attributes from defeated enemies permanently.",
  },
  {
    id: "skill_mastery",
    name: "Instant Skill Mastery",
    description: "All skills start at maximum level. No skill grinding needed.",
  },
  {
    id: "inventory_space",
    name: "Infinite Inventory",
    description: "Unlimited inventory space. Never worry about storage.",
  },
  {
    id: "death_immunity",
    name: "Death Immunity",
    description: "Cannot die. Automatically revive with full health.",
  },
  {
    id: "item_duplication",
    name: "Item Duplication",
    description: "Duplicate any item in inventory once per day.",
  },
  {
    id: "time_manipulation",
    name: "Time Manipulation",
    description: "Slow down or speed up time in combat.",
  },
  {
    id: "reality_glitch",
    name: "Reality Glitch",
    description: "Occasionally glitch reality to your advantage.",
  },
  {
    id: "save_state",
    name: "Save State",
    description: "Save and load game state at will. True save scumming.",
  },
  {
    id: "stat_redistribution",
    name: "Stat Redistribution",
    description: "Redistribute all attribute points at any time.",
  },
  {
    id: "skill_synthesis",
    name: "Skill Synthesis",
    description: "Combine skills to create new powerful abilities.",
  },
  {
    id: "enemy_weakening",
    name: "Enemy Weakening",
    description: "All enemies are permanently 50% weaker.",
  },
  {
    id: "critical_guarantee",
    name: "Guaranteed Critical",
    description: "Every attack is a critical hit.",
  },
  {
    id: "mana_cost_zero",
    name: "Zero Mana Cost",
    description: "All skills cost zero mana to use.",
  },
  {
    id: "cooldown_removal",
    name: "Cooldown Removal",
    description: "All skills have no cooldown period.",
  },
  {
    id: "damage_immunity",
    name: "Damage Immunity",
    description: "Immune to all forms of damage.",
  },
  {
    id: "status_immunity",
    name: "Status Immunity",
    description: "Immune to all negative status effects.",
  },
  {
    id: "hp_regeneration",
    name: "Infinite HP Regeneration",
    description: "Health regenerates to maximum instantly.",
  },
  {
    id: "luck_max",
    name: "Maximum Luck",
    description: "Luck stat is always at maximum value.",
  },
  {
    id: "drop_quality",
    name: "Legendary Drop Rate",
    description: "All dropped items are legendary quality.",
  },
  {
    id: "skill_unlock",
    name: "All Skills Unlocked",
    description: "All skills in the game are immediately available.",
  },
  {
    id: "attribute_growth",
    name: "Exponential Growth",
    description: "Attributes grow exponentially with each level.",
  },
  {
    id: "enemy_control",
    name: "Enemy Control",
    description: "Control enemies to fight for you.",
  },
  {
    id: "dimension_storage",
    name: "Dimension Storage",
    description: "Access personal dimension for unlimited storage.",
  },
  {
    id: "teleportation",
    name: "Instant Teleportation",
    description: "Teleport anywhere instantly with no cost.",
  },
  {
    id: "skill_copy",
    name: "Skill Copy",
    description: "Copy any skill used by enemies or allies.",
  },
  {
    id: "stat_swap",
    name: "Stat Swap",
    description: "Swap any two stats temporarily or permanently.",
  },
  {
    id: "reality_anchor",
    name: "Reality Anchor",
    description: "Immune to reality manipulation and dimensional effects.",
  },
  {
    id: "probability_control",
    name: "Probability Control",
    description: "Control probability of any event in your favor.",
  },
  {
    id: "memory_retention",
    name: "Perfect Memory",
    description: "Never forget anything. Perfect recall of all experiences.",
  },
  {
    id: "skill_evolution",
    name: "Skill Evolution",
    description: "Skills automatically evolve into better versions.",
  },
  {
    id: "enemy_analysis",
    name: "Perfect Enemy Analysis",
    description: "See all enemy stats, weaknesses, and strategies.",
  },
  {
    id: "item_creation",
    name: "Item Creation",
    description: "Create any item from materials or nothing.",
  },
  {
    id: "stat_overflow",
    name: "Stat Overflow",
    description: "Stats can exceed normal maximum limits.",
  },
  {
    id: "multi_class",
    name: "Multi-Class",
    description: "Can learn and use skills from all classes simultaneously.",
  },
  {
    id: "experience_sharing",
    name: "Experience Sharing",
    description: "Share experience with party members or store it.",
  },
  {
    id: "skill_reset",
    name: "Skill Reset",
    description: "Reset any skill to reallocate points freely.",
  },
  {
    id: "enemy_conversion",
    name: "Enemy Conversion",
    description: "Convert defeated enemies into permanent allies.",
  },
  {
    id: "damage_reflection",
    name: "Damage Reflection",
    description: "Reflect all damage back to attackers.",
  },
  {
    id: "mana_steal",
    name: "Mana Steal",
    description: "Steal mana from enemies with each attack.",
  },
  {
    id: "hp_steal",
    name: "HP Steal",
    description: "Steal health from enemies with each attack.",
  },
  {
    id: "stat_steal_all",
    name: "All Stat Steal",
    description: "Steal all stats from enemies permanently.",
  },
  {
    id: "skill_steal",
    name: "Skill Steal",
    description: "Steal skills from enemies permanently.",
  },
  {
    id: "item_steal",
    name: "Item Steal",
    description: "Steal items from enemies before they drop.",
  },
  {
    id: "enemy_weakening_all",
    name: "Universal Weakening",
    description: "All enemies in area are permanently weakened.",
  },
  {
    id: "buff_permanence",
    name: "Buff Permanence",
    description: "All buffs become permanent effects.",
  },
  {
    id: "debuff_immunity",
    name: "Debuff Immunity",
    description: "Immune to all debuffs and negative effects.",
  },
  {
    id: "skill_amplification",
    name: "Skill Amplification",
    description: "All skills are 10x more powerful.",
  },
  {
    id: "cooldown_reduction",
    name: "Cooldown Reduction",
    description: "All cooldowns reduced by 90%.",
  },
  {
    id: "mana_efficiency",
    name: "Mana Efficiency",
    description: "All skills cost 90% less mana.",
  },
  {
    id: "critical_multiplier",
    name: "Critical Multiplier",
    description: "Critical hits deal 10x damage.",
  },
  {
    id: "status_amplification",
    name: "Status Amplification",
    description: "All status effects are 10x more powerful.",
  },
  {
    id: "enemy_weakness",
    name: "Enemy Weakness",
    description: "All enemies have critical weaknesses revealed.",
  },
  {
    id: "item_upgrade",
    name: "Item Upgrade",
    description: "Upgrade any item to maximum quality instantly.",
  },
  {
    id: "stat_cap_removal",
    name: "Stat Cap Removal",
    description: "Remove all stat caps. Grow infinitely.",
  },
  {
    id: "skill_combination",
    name: "Skill Combination",
    description: "Combine multiple skills into super skills.",
  },
  {
    id: "enemy_fear",
    name: "Enemy Fear",
    description: "All enemies are afraid of you. Reduced aggression.",
  },
  {
    id: "loot_magnet",
    name: "Loot Magnet",
    description: "Automatically collect all dropped items in range.",
  },
  {
    id: "experience_bank",
    name: "Experience Bank",
    description: "Store experience to allocate later.",
  },
  {
    id: "skill_slot_expansion",
    name: "Skill Slot Expansion",
    description: "Unlimited active skill slots.",
  },
  {
    id: "passive_slot_expansion",
    name: "Passive Slot Expansion",
    description: "Unlimited passive skill slots.",
  },
  {
    id: "enemy_info",
    name: "Enemy Information",
    description: "See complete information about all enemies.",
  },
  {
    id: "item_info",
    name: "Item Information",
    description: "See complete information about all items.",
  },
  {
    id: "skill_info",
    name: "Skill Information",
    description: "See complete information about all skills.",
  },
  {
    id: "stat_info",
    name: "Stat Information",
    description: "See how all stats affect gameplay.",
  },
  {
    id: "enemy_prediction",
    name: "Enemy Prediction",
    description: "Predict enemy actions before they happen.",
  },
  {
    id: "damage_prediction",
    name: "Damage Prediction",
    description: "See exact damage before attacking.",
  },
  {
    id: "outcome_simulation",
    name: "Outcome Simulation",
    description: "Simulate battle outcomes before fighting.",
  },
  {
    id: "path_optimization",
    name: "Path Optimization",
    description: "Always find the optimal path to objectives.",
  },
  {
    id: "resource_detection",
    name: "Resource Detection",
    description: "Detect all resources and treasures nearby.",
  },
  {
    id: "enemy_detection",
    name: "Enemy Detection",
    description: "Detect all enemies in a large radius.",
  },
  {
    id: "trap_detection",
    name: "Trap Detection",
    description: "Detect all traps and hazards automatically.",
  },
  {
    id: "secret_detection",
    name: "Secret Detection",
    description: "Detect all hidden secrets and passages.",
  },
  {
    id: "quest_optimization",
    name: "Quest Optimization",
    description: "Always know the best way to complete quests.",
  },
  {
    id: "reward_maximization",
    name: "Reward Maximization",
    description: "Always get maximum rewards from quests.",
  },
  {
    id: "enemy_respawn",
    name: "Enemy Respawn Control",
    description: "Control when and where enemies respawn.",
  },
  {
    id: "item_respawn",
    name: "Item Respawn Control",
    description: "Control when and where items respawn.",
  },
  {
    id: "time_control",
    name: "Time Control",
    description: "Control the flow of time in your area.",
  },
  {
    id: "space_control",
    name: "Space Control",
    description: "Control space and dimensions around you.",
  },
  {
    id: "reality_control",
    name: "Reality Control",
    description: "Control reality within your influence.",
  },
  {
    id: "probability_manipulation",
    name: "Probability Manipulation",
    description: "Manipulate probability of any event.",
  },
  {
    id: "causality_manipulation",
    name: "Causality Manipulation",
    description: "Manipulate cause and effect.",
  },
  {
    id: "fate_control",
    name: "Fate Control",
    description: "Control your own fate and destiny.",
  },
  {
    id: "luck_control",
    name: "Luck Control",
    description: "Control luck in all situations.",
  },
  {
    id: "fortune_control",
    name: "Fortune Control",
    description: "Control fortune and misfortune.",
  },
  {
    id: "destiny_control",
    name: "Destiny Control",
    description: "Control your destiny and future.",
  },
  {
    id: "past_control",
    name: "Past Control",
    description: "Control and change your past.",
  },
  {
    id: "future_control",
    name: "Future Control",
    description: "Control and see your future.",
  },
  {
    id: "present_control",
    name: "Present Control",
    description: "Control the present moment completely.",
  },
  {
    id: "existence_control",
    name: "Existence Control",
    description: "Control your own existence and being.",
  },
  {
    id: "nonexistence_control",
    name: "Non-Existence Control",
    description: "Control nonexistence and void.",
  },
  {
    id: "creation_control",
    name: "Creation Control",
    description: "Control creation and creation itself.",
  },
  {
    id: "destruction_control",
    name: "Destruction Control",
    description: "Control destruction and destruction itself.",
  },
  {
    id: "order_control",
    name: "Order Control",
    description: "Control order and chaos.",
  },
  {
    id: "chaos_control",
    name: "Chaos Control",
    description: "Control chaos and order.",
  },
  {
    id: "light_control",
    name: "Light Control",
    description: "Control light and darkness.",
  },
  {
    id: "darkness_control",
    name: "Darkness Control",
    description: "Control darkness and light.",
  },
  {
    id: "life_control",
    name: "Life Control",
    description: "Control life and death.",
  },
  {
    id: "death_control",
    name: "Death Control",
    description: "Control death and life.",
  },
  {
    id: "soul_control",
    name: "Soul Control",
    description: "Control souls and spiritual energy.",
  },
  {
    id: "mind_control",
    name: "Mind Control",
    description: "Control minds and thoughts.",
  },
  {
    id: "body_control",
    name: "Body Control",
    description: "Control bodies and physical forms.",
  },
  {
    id: "energy_control",
    name: "Energy Control",
    description: "Control all forms of energy.",
  },
  {
    id: "matter_control",
    name: "Matter Control",
    description: "Control all forms of matter.",
  },
  {
    id: "force_control",
    name: "Force Control",
    description: "Control all forces and physics.",
  },
  {
    id: "law_control",
    name: "Law Control",
    description: "Control natural and supernatural laws.",
  },
  {
    id: "rule_control",
    name: "Rule Control",
    description: "Control rules and regulations.",
  },
  {
    id: "system_control",
    name: "System Control",
    description: "Control game systems and mechanics.",
  },
  {
    id: "code_control",
    name: "Code Control",
    description: "Control code and programming.",
  },
  {
    id: "data_control",
    name: "Data Control",
    description: "Control data and information.",
  },
  {
    id: "information_control",
    name: "Information Control",
    description: "Control information and knowledge.",
  },
  {
    id: "knowledge_control",
    name: "Knowledge Control",
    description: "Control knowledge and wisdom.",
  },
  {
    id: "wisdom_control",
    name: "Wisdom Control",
    description: "Control wisdom and understanding.",
  },
  {
    id: "understanding_control",
    name: "Understanding Control",
    description: "Control understanding and comprehension.",
  },
  {
    id: "comprehension_control",
    name: "Comprehension Control",
    description: "Control comprehension and perception.",
  },
  {
    id: "perception_control",
    name: "Perception Control",
    description: "Control perception and awareness.",
  },
  {
    id: "awareness_control",
    name: "Awareness Control",
    description: "Control awareness and consciousness.",
  },
  {
    id: "consciousness_control",
    name: "Consciousness Control",
    description: "Control consciousness and self.",
  },
  {
    id: "self_control",
    name: "Self Control",
    description: "Control self and identity.",
  },
  {
    id: "identity_control",
    name: "Identity Control",
    description: "Control identity and existence.",
  },
  {
    id: "existence_manipulation",
    name: "Existence Manipulation",
    description: "Manipulate existence and being.",
  },
  {
    id: "being_manipulation",
    name: "Being Manipulation",
    description: "Manipulate being and essence.",
  },
  {
    id: "essence_manipulation",
    name: "Essence Manipulation",
    description: "Manipulate essence and core.",
  },
  {
    id: "core_manipulation",
    name: "Core Manipulation",
    description: "Manipulate core and foundation.",
  },
  {
    id: "foundation_manipulation",
    name: "Foundation Manipulation",
    description: "Manipulate foundation and base.",
  },
  {
    id: "base_manipulation",
    name: "Base Manipulation",
    description: "Manipulate base and structure.",
  },
  {
    id: "structure_manipulation",
    name: "Structure Manipulation",
    description: "Manipulate structure and form.",
  },
  {
    id: "form_manipulation",
    name: "Form Manipulation",
    description: "Manipulate form and shape.",
  },
  {
    id: "shape_manipulation",
    name: "Shape Manipulation",
    description: "Manipulate shape and appearance.",
  },
  {
    id: "appearance_manipulation",
    name: "Appearance Manipulation",
    description: "Manipulate appearance and look.",
  },
  {
    id: "look_manipulation",
    name: "Look Manipulation",
    description: "Manipulate look and visual.",
  },
  {
    id: "visual_manipulation",
    name: "Visual Manipulation",
    description: "Manipulate visual and sight.",
  },
  {
    id: "sight_manipulation",
    name: "Sight Manipulation",
    description: "Manipulate sight and vision.",
  },
  {
    id: "vision_manipulation",
    name: "Vision Manipulation",
    description: "Manipulate vision and view.",
  },
  {
    id: "view_manipulation",
    name: "View Manipulation",
    description: "Manipulate view and perspective.",
  },
  {
    id: "perspective_manipulation",
    name: "Perspective Manipulation",
    description: "Manipulate perspective and angle.",
  },
  {
    id: "angle_manipulation",
    name: "Angle Manipulation",
    description: "Manipulate angle and direction.",
  },
  {
    id: "direction_manipulation",
    name: "Direction Manipulation",
    description: "Manipulate direction and path.",
  },
  {
    id: "path_manipulation",
    name: "Path Manipulation",
    description: "Manipulate path and route.",
  },
  {
    id: "route_manipulation",
    name: "Route Manipulation",
    description: "Manipulate route and way.",
  },
  {
    id: "way_manipulation",
    name: "Way Manipulation",
    description: "Manipulate way and method.",
  },
  {
    id: "method_manipulation",
    name: "Method Manipulation",
    description: "Manipulate method and approach.",
  },
  {
    id: "approach_manipulation",
    name: "Approach Manipulation",
    description: "Manipulate approach and strategy.",
  },
  {
    id: "strategy_manipulation",
    name: "Strategy Manipulation",
    description: "Manipulate strategy and plan.",
  },
  {
    id: "plan_manipulation",
    name: "Plan Manipulation",
    description: "Manipulate plan and design.",
  },
  {
    id: "design_manipulation",
    name: "Design Manipulation",
    description: "Manipulate design and pattern.",
  },
  {
    id: "pattern_manipulation",
    name: "Pattern Manipulation",
    description: "Manipulate pattern and template.",
  },
  {
    id: "template_manipulation",
    name: "Template Manipulation",
    description: "Manipulate template and model.",
  },
  {
    id: "model_manipulation",
    name: "Model Manipulation",
    description: "Manipulate model and framework.",
  },
  {
    id: "framework_manipulation",
    name: "Framework Manipulation",
    description: "Manipulate framework and system.",
  },
  {
    id: "system_manipulation",
    name: "System Manipulation",
    description: "Manipulate system and mechanism.",
  },
  {
    id: "mechanism_manipulation",
    name: "Mechanism Manipulation",
    description: "Manipulate mechanism and process.",
  },
  {
    id: "process_manipulation",
    name: "Process Manipulation",
    description: "Manipulate process and procedure.",
  },
  {
    id: "procedure_manipulation",
    name: "Procedure Manipulation",
    description: "Manipulate procedure and operation.",
  },
  {
    id: "operation_manipulation",
    name: "Operation Manipulation",
    description: "Manipulate operation and function.",
  },
  {
    id: "function_manipulation",
    name: "Function Manipulation",
    description: "Manipulate function and action.",
  },
  {
    id: "action_manipulation",
    name: "Action Manipulation",
    description: "Manipulate action and movement.",
  },
  {
    id: "movement_manipulation",
    name: "Movement Manipulation",
    description: "Manipulate movement and motion.",
  },
  {
    id: "motion_manipulation",
    name: "Motion Manipulation",
    description: "Manipulate motion and activity.",
  },
  {
    id: "activity_manipulation",
    name: "Activity Manipulation",
    description: "Manipulate activity and behavior.",
  },
  {
    id: "behavior_manipulation",
    name: "Behavior Manipulation",
    description: "Manipulate behavior and conduct.",
  },
  {
    id: "conduct_manipulation",
    name: "Conduct Manipulation",
    description: "Manipulate conduct and performance.",
  },
  {
    id: "performance_manipulation",
    name: "Performance Manipulation",
    description: "Manipulate performance and execution.",
  },
  {
    id: "execution_manipulation",
    name: "Execution Manipulation",
    description: "Manipulate execution and implementation.",
  },
  {
    id: "implementation_manipulation",
    name: "Implementation Manipulation",
    description: "Manipulate implementation and application.",
  },
  {
    id: "application_manipulation",
    name: "Application Manipulation",
    description: "Manipulate application and use.",
  },
  {
    id: "use_manipulation",
    name: "Use Manipulation",
    description: "Manipulate use and utilization.",
  },
  {
    id: "utilization_manipulation",
    name: "Utilization Manipulation",
    description: "Manipulate utilization and employment.",
  },
  {
    id: "employment_manipulation",
    name: "Employment Manipulation",
    description: "Manipulate employment and usage.",
  },
  {
    id: "usage_manipulation",
    name: "Usage Manipulation",
    description: "Manipulate usage and application.",
  },
  {
    id: "application_control",
    name: "Application Control",
    description: "Control application and use.",
  },
  {
    id: "use_control",
    name: "Use Control",
    description: "Control use and utilization.",
  },
  {
    id: "utilization_control",
    name: "Utilization Control",
    description: "Control utilization and employment.",
  },
  {
    id: "employment_control",
    name: "Employment Control",
    description: "Control employment and usage.",
  },
  {
    id: "usage_control",
    name: "Usage Control",
    description: "Control usage and application.",
  },
];

export function getTalentById(id) {
  return exRankTalents.find((t) => t.id === id) || null;
}

export function getRandomTalents(count = 8) {
  const shuffled = [...exRankTalents].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
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
        value: () => 0.5 + Math.random() * 1.5,
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
