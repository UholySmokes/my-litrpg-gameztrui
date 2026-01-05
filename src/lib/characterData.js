// =================================================================
// CHARACTER DATA - Race, Class, Talent, and Skill Definitions
// =================================================================

/**
 * RACES - 20 Fantasy/Cultivation themed races
 */
export const races = [
  {
    id: 'pure_human',
    name: 'Pure Human',
    description: 'A standard human with no special bloodline. Versatile and adaptable.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 0, agi: 0, dex: 0, int: 0, cha: 1, will: 1, luck: 0, soul: 0 }
  },
  {
    id: 'neo_human',
    name: 'Neo-Human',
    description: 'Human with cybernetic enhancements. Enhanced physical capabilities.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 1, agi: 1, dex: 1, int: 0, cha: 0, will: 0, luck: 0, soul: -1 }
  },
  {
    id: 'ancient_bloodline',
    name: 'Ancient Bloodline',
    description: 'Descendant of an ancient powerful lineage. Natural affinity for cultivation.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 0, agi: 0, dex: 0, int: 2, cha: 1, will: 1, luck: 1, soul: 2 }
  },
  {
    id: 'spirit_beast',
    name: 'Spirit Beast',
    description: 'A creature with spiritual energy flowing through its veins.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 2, agi: 2, dex: 1, int: 0, cha: -1, will: 1, luck: 0, soul: 1 }
  },
  {
    id: 'demon_kin',
    name: 'Demon Kin',
    description: 'Mixed heritage with demonic ancestry. Dark power courses through you.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 2, agi: 1, dex: 0, int: 1, cha: -1, will: 2, luck: -1, soul: 1 }
  },
  {
    id: 'celestial_descendant',
    name: 'Celestial Descendant',
    description: 'Bloodline touched by celestial beings. Radiant energy within.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 0, agi: 1, dex: 1, int: 2, cha: 2, will: 1, luck: 1, soul: 1 }
  },
  {
    id: 'shadow_walker',
    name: 'Shadow Walker',
    description: 'Born from the void between realms. Natural stealth and darkness affinity.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 0, agi: 2, dex: 2, int: 1, cha: 0, will: 1, luck: 0, soul: 1 }
  },
  {
    id: 'dragon_blood',
    name: 'Dragon Blood',
    description: 'Ancient dragon heritage. Immense physical and magical potential.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 2, agi: 1, dex: 0, int: 2, cha: 1, will: 2, luck: 0, soul: 1 }
  },
  {
    id: 'elemental_attuned',
    name: 'Elemental Attuned',
    description: 'Born with natural connection to elemental forces.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 0, agi: 0, dex: 1, int: 2, cha: 1, will: 1, luck: 1, soul: 2 }
  },
  {
    id: 'mutant',
    name: 'Mutant',
    description: 'Genetic mutation grants unique abilities. Unpredictable potential.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 1, agi: 1, dex: 1, int: 1, cha: 0, will: 0, luck: 2, soul: 1 }
  },
  {
    id: 'undead_awakened',
    name: 'Undead Awakened',
    description: 'Returned from death with consciousness. Death energy flows through you.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 1, agi: 0, dex: 0, int: 1, cha: -2, will: 3, luck: -1, soul: 2 }
  },
  {
    id: 'fae_touched',
    name: 'Fae Touched',
    description: 'Touched by fae magic. Natural charm and illusion affinity.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 0, agi: 1, dex: 1, int: 1, cha: 3, will: 0, luck: 2, soul: 1 }
  },
  {
    id: 'beast_kin',
    name: 'Beast Kin',
    description: 'Human with animalistic traits. Enhanced senses and physical prowess.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 2, agi: 2, dex: 1, int: -1, cha: 0, will: 1, luck: 1, soul: 0 }
  },
  {
    id: 'mechanical_construct',
    name: 'Mechanical Construct',
    description: 'Living machine with artificial intelligence. Perfect precision.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 1, agi: 0, dex: 3, int: 2, cha: -2, will: 2, luck: 0, soul: -1 }
  },
  {
    id: 'void_walker',
    name: 'Void Walker',
    description: 'Born in the void between dimensions. Space-time manipulation potential.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 0, agi: 1, dex: 1, int: 3, cha: 0, will: 2, luck: 1, soul: 2 }
  },
  {
    id: 'phoenix_reborn',
    name: 'Phoenix Reborn',
    description: 'Reborn from ashes. Fire affinity and resurrection potential.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 1, agi: 1, dex: 1, int: 2, cha: 1, will: 2, luck: 2, soul: 2 }
  },
  {
    id: 'nature_spirit',
    name: 'Nature Spirit',
    description: 'One with nature. Life energy and plant manipulation.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 0, agi: 1, dex: 1, int: 2, cha: 2, will: 1, luck: 1, soul: 2 }
  },
  {
    id: 'crystal_being',
    name: 'Crystal Being',
    description: 'Living crystal entity. Hard defense and energy storage.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 1, agi: -1, dex: 0, int: 2, cha: 0, will: 3, luck: 0, soul: 2 }
  },
  {
    id: 'chaos_born',
    name: 'Chaos Born',
    description: 'Born from chaos energy. Unpredictable and powerful.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 1, agi: 1, dex: 1, int: 1, cha: 0, will: 1, luck: 3, soul: 1 }
  },
  {
    id: 'divine_scion',
    name: 'Divine Scion',
    description: 'Child of a minor deity. Blessed with divine favor.',
    evolutionStage: 'Mortal',
    statBonuses: { str: 1, agi: 1, dex: 1, int: 1, cha: 2, will: 1, luck: 2, soul: 2 }
  }
];

/**
 * CLASSES - 20 RPG Classes (mix of traditional and unique)
 * Each class can be upgraded later to advanced versions
 */
export const classes = [
  {
    id: 'knight',
    name: 'Knight',
    description: 'Heavy armored warrior specializing in defense and protection. Masters of melee combat and shield techniques.',
    upgradePath: 'paladin'
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'Master of arcane magic, wielding powerful elemental spells and mystical energies.',
    upgradePath: 'archmage'
  },
  {
    id: 'assassin',
    name: 'Assassin',
    description: 'Stealthy killer specializing in critical strikes, poisons, and shadow magic.',
    upgradePath: 'shadowblade'
  },
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'Fierce melee fighter focused on raw physical power and weapon mastery.',
    upgradePath: 'berserker'
  },
  {
    id: 'rogue',
    name: 'Rogue',
    description: 'Sneaky thief and trickster, expert in lockpicking, traps, and quick strikes.',
    upgradePath: 'master_thief'
  },
  {
    id: 'priest',
    name: 'Priest',
    description: 'Divine healer and supporter, wielding holy magic to heal allies and smite enemies.',
    upgradePath: 'high_priest'
  },
  {
    id: 'paladin',
    name: 'Paladin',
    description: 'Holy warrior combining martial prowess with divine magic, protector of the innocent.',
    upgradePath: 'divine_knight'
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'Wilderness expert, master of archery, tracking, and nature magic.',
    upgradePath: 'beastmaster'
  },
  {
    id: 'monk',
    name: 'Monk',
    description: 'Martial artist using unarmed combat, inner energy, and spiritual discipline.',
    upgradePath: 'grandmaster'
  },
  {
    id: 'bard',
    name: 'Bard',
    description: 'Charismatic performer using music, magic, and words to inspire allies and confuse enemies.',
    upgradePath: 'maestro'
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    description: 'Dark mage commanding undead minions and wielding death magic.',
    upgradePath: 'lich'
  },
  {
    id: 'druid',
    name: 'Druid',
    description: 'Nature guardian who shapeshifts and wields the power of the wild.',
    upgradePath: 'archdruid'
  },
  {
    id: 'warlock',
    name: 'Warlock',
    description: 'Pact-bound mage channeling demonic power and dark magic.',
    upgradePath: 'demon_lord'
  },
  {
    id: 'shaman',
    name: 'Shaman',
    description: 'Spiritual guide communing with spirits and elements, balancing healing and destruction.',
    upgradePath: 'spirit_walker'
  },
  {
    id: 'battlemage',
    name: 'Battlemage',
    description: 'Warrior-mage hybrid combining melee combat with offensive magic.',
    upgradePath: 'spellblade'
  },
  {
    id: 'archer',
    name: 'Archer',
    description: 'Ranged combat specialist with exceptional accuracy and speed.',
    upgradePath: 'sniper'
  },
  {
    id: 'berserker',
    name: 'Berserker',
    description: 'Frenzied warrior who gains power through rage and bloodlust.',
    upgradePath: 'blood_warrior'
  },
  {
    id: 'summoner',
    name: 'Summoner',
    description: 'Master of summoning creatures and elementals to fight alongside them.',
    upgradePath: 'conjurer'
  },
  {
    id: 'templar',
    name: 'Templar',
    description: 'Holy warrior specializing in anti-magic and protection against dark forces.',
    upgradePath: 'inquisitor'
  },
  {
    id: 'shadowblade',
    name: 'Shadowblade',
    description: 'Elite assassin merging shadow magic with deadly blade techniques.',
    upgradePath: 'void_assassin'
  }
];

/**
 * EX-RANK TALENTS - 120 powerful hidden abilities
 */
export const exRankTalents = [
  { id: 'infinite_mana_regen', name: 'Infinite Mana Regeneration', description: 'Mana regenerates infinitely. Never run out of magical energy.' },
  { id: 'hundred_percent_drop', name: '100% Drop Rate', description: 'All enemies drop items. Guaranteed loot from every kill.' },
  { id: 'auto_combat_ai', name: 'Auto-Combat AI', description: 'Automatic combat system. Fights enemies without input.' },
  { id: 'experience_multiplier', name: '10x Experience Multiplier', description: 'Gain 10 times the normal experience from all sources.' },
  { id: 'stat_steal', name: 'Stat Steal', description: 'Steal attributes from defeated enemies permanently.' },
  { id: 'skill_mastery', name: 'Instant Skill Mastery', description: 'All skills start at maximum level. No skill grinding needed.' },
  { id: 'inventory_space', name: 'Infinite Inventory', description: 'Unlimited inventory space. Never worry about storage.' },
  { id: 'death_immunity', name: 'Death Immunity', description: 'Cannot die. Automatically revive with full health.' },
  { id: 'item_duplication', name: 'Item Duplication', description: 'Duplicate any item in inventory once per day.' },
  { id: 'time_manipulation', name: 'Time Manipulation', description: 'Slow down or speed up time in combat.' },
  { id: 'reality_glitch', name: 'Reality Glitch', description: 'Occasionally glitch reality to your advantage.' },
  { id: 'save_state', name: 'Save State', description: 'Save and load game state at will. True save scumming.' },
  { id: 'stat_redistribution', name: 'Stat Redistribution', description: 'Redistribute all attribute points at any time.' },
  { id: 'skill_synthesis', name: 'Skill Synthesis', description: 'Combine skills to create new powerful abilities.' },
  { id: 'enemy_weakening', name: 'Enemy Weakening', description: 'All enemies are permanently 50% weaker.' },
  { id: 'critical_guarantee', name: 'Guaranteed Critical', description: 'Every attack is a critical hit.' },
  { id: 'mana_cost_zero', name: 'Zero Mana Cost', description: 'All skills cost zero mana to use.' },
  { id: 'cooldown_removal', name: 'Cooldown Removal', description: 'All skills have no cooldown period.' },
  { id: 'damage_immunity', name: 'Damage Immunity', description: 'Immune to all forms of damage.' },
  { id: 'status_immunity', name: 'Status Immunity', description: 'Immune to all negative status effects.' },
  { id: 'hp_regeneration', name: 'Infinite HP Regeneration', description: 'Health regenerates to maximum instantly.' },
  { id: 'luck_max', name: 'Maximum Luck', description: 'Luck stat is always at maximum value.' },
  { id: 'drop_quality', name: 'Legendary Drop Rate', description: 'All dropped items are legendary quality.' },
  { id: 'skill_unlock', name: 'All Skills Unlocked', description: 'All skills in the game are immediately available.' },
  { id: 'attribute_growth', name: 'Exponential Growth', description: 'Attributes grow exponentially with each level.' },
  { id: 'enemy_control', name: 'Enemy Control', description: 'Control enemies to fight for you.' },
  { id: 'dimension_storage', name: 'Dimension Storage', description: 'Access personal dimension for unlimited storage.' },
  { id: 'teleportation', name: 'Instant Teleportation', description: 'Teleport anywhere instantly with no cost.' },
  { id: 'skill_copy', name: 'Skill Copy', description: 'Copy any skill used by enemies or allies.' },
  { id: 'stat_swap', name: 'Stat Swap', description: 'Swap any two stats temporarily or permanently.' },
  { id: 'reality_anchor', name: 'Reality Anchor', description: 'Immune to reality manipulation and dimensional effects.' },
  { id: 'probability_control', name: 'Probability Control', description: 'Control probability of any event in your favor.' },
  { id: 'memory_retention', name: 'Perfect Memory', description: 'Never forget anything. Perfect recall of all experiences.' },
  { id: 'skill_evolution', name: 'Skill Evolution', description: 'Skills automatically evolve into better versions.' },
  { id: 'enemy_analysis', name: 'Perfect Enemy Analysis', description: 'See all enemy stats, weaknesses, and strategies.' },
  { id: 'item_creation', name: 'Item Creation', description: 'Create any item from materials or nothing.' },
  { id: 'stat_overflow', name: 'Stat Overflow', description: 'Stats can exceed normal maximum limits.' },
  { id: 'multi_class', name: 'Multi-Class', description: 'Can learn and use skills from all classes simultaneously.' },
  { id: 'experience_sharing', name: 'Experience Sharing', description: 'Share experience with party members or store it.' },
  { id: 'skill_reset', name: 'Skill Reset', description: 'Reset any skill to reallocate points freely.' },
  { id: 'enemy_conversion', name: 'Enemy Conversion', description: 'Convert defeated enemies into permanent allies.' },
  { id: 'damage_reflection', name: 'Damage Reflection', description: 'Reflect all damage back to attackers.' },
  { id: 'mana_steal', name: 'Mana Steal', description: 'Steal mana from enemies with each attack.' },
  { id: 'hp_steal', name: 'HP Steal', description: 'Steal health from enemies with each attack.' },
  { id: 'stat_steal_all', name: 'All Stat Steal', description: 'Steal all stats from enemies permanently.' },
  { id: 'skill_steal', name: 'Skill Steal', description: 'Steal skills from enemies permanently.' },
  { id: 'item_steal', name: 'Item Steal', description: 'Steal items from enemies before they drop.' },
  { id: 'enemy_weakening_all', name: 'Universal Weakening', description: 'All enemies in area are permanently weakened.' },
  { id: 'buff_permanence', name: 'Buff Permanence', description: 'All buffs become permanent effects.' },
  { id: 'debuff_immunity', name: 'Debuff Immunity', description: 'Immune to all debuffs and negative effects.' },
  { id: 'skill_amplification', name: 'Skill Amplification', description: 'All skills are 10x more powerful.' },
  { id: 'cooldown_reduction', name: 'Cooldown Reduction', description: 'All cooldowns reduced by 90%.' },
  { id: 'mana_efficiency', name: 'Mana Efficiency', description: 'All skills cost 90% less mana.' },
  { id: 'critical_multiplier', name: 'Critical Multiplier', description: 'Critical hits deal 10x damage.' },
  { id: 'status_amplification', name: 'Status Amplification', description: 'All status effects are 10x more powerful.' },
  { id: 'enemy_weakness', name: 'Enemy Weakness', description: 'All enemies have critical weaknesses revealed.' },
  { id: 'item_upgrade', name: 'Item Upgrade', description: 'Upgrade any item to maximum quality instantly.' },
  { id: 'stat_cap_removal', name: 'Stat Cap Removal', description: 'Remove all stat caps. Grow infinitely.' },
  { id: 'skill_combination', name: 'Skill Combination', description: 'Combine multiple skills into super skills.' },
  { id: 'enemy_fear', name: 'Enemy Fear', description: 'All enemies are afraid of you. Reduced aggression.' },
  { id: 'loot_magnet', name: 'Loot Magnet', description: 'Automatically collect all dropped items in range.' },
  { id: 'experience_bank', name: 'Experience Bank', description: 'Store experience to allocate later.' },
  { id: 'skill_slot_expansion', name: 'Skill Slot Expansion', description: 'Unlimited active skill slots.' },
  { id: 'passive_slot_expansion', name: 'Passive Slot Expansion', description: 'Unlimited passive skill slots.' },
  { id: 'enemy_info', name: 'Enemy Information', description: 'See complete information about all enemies.' },
  { id: 'item_info', name: 'Item Information', description: 'See complete information about all items.' },
  { id: 'skill_info', name: 'Skill Information', description: 'See complete information about all skills.' },
  { id: 'stat_info', name: 'Stat Information', description: 'See how all stats affect gameplay.' },
  { id: 'enemy_prediction', name: 'Enemy Prediction', description: 'Predict enemy actions before they happen.' },
  { id: 'damage_prediction', name: 'Damage Prediction', description: 'See exact damage before attacking.' },
  { id: 'outcome_simulation', name: 'Outcome Simulation', description: 'Simulate battle outcomes before fighting.' },
  { id: 'path_optimization', name: 'Path Optimization', description: 'Always find the optimal path to objectives.' },
  { id: 'resource_detection', name: 'Resource Detection', description: 'Detect all resources and treasures nearby.' },
  { id: 'enemy_detection', name: 'Enemy Detection', description: 'Detect all enemies in a large radius.' },
  { id: 'trap_detection', name: 'Trap Detection', description: 'Detect all traps and hazards automatically.' },
  { id: 'secret_detection', name: 'Secret Detection', description: 'Detect all hidden secrets and passages.' },
  { id: 'quest_optimization', name: 'Quest Optimization', description: 'Always know the best way to complete quests.' },
  { id: 'reward_maximization', name: 'Reward Maximization', description: 'Always get maximum rewards from quests.' },
  { id: 'enemy_respawn', name: 'Enemy Respawn Control', description: 'Control when and where enemies respawn.' },
  { id: 'item_respawn', name: 'Item Respawn Control', description: 'Control when and where items respawn.' },
  { id: 'time_control', name: 'Time Control', description: 'Control the flow of time in your area.' },
  { id: 'space_control', name: 'Space Control', description: 'Control space and dimensions around you.' },
  { id: 'reality_control', name: 'Reality Control', description: 'Control reality within your influence.' },
  { id: 'probability_manipulation', name: 'Probability Manipulation', description: 'Manipulate probability of any event.' },
  { id: 'causality_manipulation', name: 'Causality Manipulation', description: 'Manipulate cause and effect.' },
  { id: 'fate_control', name: 'Fate Control', description: 'Control your own fate and destiny.' },
  { id: 'luck_control', name: 'Luck Control', description: 'Control luck in all situations.' },
  { id: 'fortune_control', name: 'Fortune Control', description: 'Control fortune and misfortune.' },
  { id: 'destiny_control', name: 'Destiny Control', description: 'Control your destiny and future.' },
  { id: 'past_control', name: 'Past Control', description: 'Control and change your past.' },
  { id: 'future_control', name: 'Future Control', description: 'Control and see your future.' },
  { id: 'present_control', name: 'Present Control', description: 'Control the present moment completely.' },
  { id: 'existence_control', name: 'Existence Control', description: 'Control your own existence and being.' },
  { id: 'nonexistence_control', name: 'Non-Existence Control', description: 'Control nonexistence and void.' },
  { id: 'creation_control', name: 'Creation Control', description: 'Control creation and creation itself.' },
  { id: 'destruction_control', name: 'Destruction Control', description: 'Control destruction and destruction itself.' },
  { id: 'order_control', name: 'Order Control', description: 'Control order and chaos.' },
  { id: 'chaos_control', name: 'Chaos Control', description: 'Control chaos and order.' },
  { id: 'light_control', name: 'Light Control', description: 'Control light and darkness.' },
  { id: 'darkness_control', name: 'Darkness Control', description: 'Control darkness and light.' },
  { id: 'life_control', name: 'Life Control', description: 'Control life and death.' },
  { id: 'death_control', name: 'Death Control', description: 'Control death and life.' },
  { id: 'soul_control', name: 'Soul Control', description: 'Control souls and spiritual energy.' },
  { id: 'mind_control', name: 'Mind Control', description: 'Control minds and thoughts.' },
  { id: 'body_control', name: 'Body Control', description: 'Control bodies and physical forms.' },
  { id: 'energy_control', name: 'Energy Control', description: 'Control all forms of energy.' },
  { id: 'matter_control', name: 'Matter Control', description: 'Control all forms of matter.' },
  { id: 'force_control', name: 'Force Control', description: 'Control all forces and physics.' },
  { id: 'law_control', name: 'Law Control', description: 'Control natural and supernatural laws.' },
  { id: 'rule_control', name: 'Rule Control', description: 'Control rules and regulations.' },
  { id: 'system_control', name: 'System Control', description: 'Control game systems and mechanics.' },
  { id: 'code_control', name: 'Code Control', description: 'Control code and programming.' },
  { id: 'data_control', name: 'Data Control', description: 'Control data and information.' },
  { id: 'information_control', name: 'Information Control', description: 'Control information and knowledge.' },
  { id: 'knowledge_control', name: 'Knowledge Control', description: 'Control knowledge and wisdom.' },
  { id: 'wisdom_control', name: 'Wisdom Control', description: 'Control wisdom and understanding.' },
  { id: 'understanding_control', name: 'Understanding Control', description: 'Control understanding and comprehension.' },
  { id: 'comprehension_control', name: 'Comprehension Control', description: 'Control comprehension and perception.' },
  { id: 'perception_control', name: 'Perception Control', description: 'Control perception and awareness.' },
  { id: 'awareness_control', name: 'Awareness Control', description: 'Control awareness and consciousness.' },
  { id: 'consciousness_control', name: 'Consciousness Control', description: 'Control consciousness and self.' },
  { id: 'self_control', name: 'Self Control', description: 'Control self and identity.' },
  { id: 'identity_control', name: 'Identity Control', description: 'Control identity and existence.' },
  { id: 'existence_manipulation', name: 'Existence Manipulation', description: 'Manipulate existence and being.' },
  { id: 'being_manipulation', name: 'Being Manipulation', description: 'Manipulate being and essence.' },
  { id: 'essence_manipulation', name: 'Essence Manipulation', description: 'Manipulate essence and core.' },
  { id: 'core_manipulation', name: 'Core Manipulation', description: 'Manipulate core and foundation.' },
  { id: 'foundation_manipulation', name: 'Foundation Manipulation', description: 'Manipulate foundation and base.' },
  { id: 'base_manipulation', name: 'Base Manipulation', description: 'Manipulate base and structure.' },
  { id: 'structure_manipulation', name: 'Structure Manipulation', description: 'Manipulate structure and form.' },
  { id: 'form_manipulation', name: 'Form Manipulation', description: 'Manipulate form and shape.' },
  { id: 'shape_manipulation', name: 'Shape Manipulation', description: 'Manipulate shape and appearance.' },
  { id: 'appearance_manipulation', name: 'Appearance Manipulation', description: 'Manipulate appearance and look.' },
  { id: 'look_manipulation', name: 'Look Manipulation', description: 'Manipulate look and visual.' },
  { id: 'visual_manipulation', name: 'Visual Manipulation', description: 'Manipulate visual and sight.' },
  { id: 'sight_manipulation', name: 'Sight Manipulation', description: 'Manipulate sight and vision.' },
  { id: 'vision_manipulation', name: 'Vision Manipulation', description: 'Manipulate vision and view.' },
  { id: 'view_manipulation', name: 'View Manipulation', description: 'Manipulate view and perspective.' },
  { id: 'perspective_manipulation', name: 'Perspective Manipulation', description: 'Manipulate perspective and angle.' },
  { id: 'angle_manipulation', name: 'Angle Manipulation', description: 'Manipulate angle and direction.' },
  { id: 'direction_manipulation', name: 'Direction Manipulation', description: 'Manipulate direction and path.' },
  { id: 'path_manipulation', name: 'Path Manipulation', description: 'Manipulate path and route.' },
  { id: 'route_manipulation', name: 'Route Manipulation', description: 'Manipulate route and way.' },
  { id: 'way_manipulation', name: 'Way Manipulation', description: 'Manipulate way and method.' },
  { id: 'method_manipulation', name: 'Method Manipulation', description: 'Manipulate method and approach.' },
  { id: 'approach_manipulation', name: 'Approach Manipulation', description: 'Manipulate approach and strategy.' },
  { id: 'strategy_manipulation', name: 'Strategy Manipulation', description: 'Manipulate strategy and plan.' },
  { id: 'plan_manipulation', name: 'Plan Manipulation', description: 'Manipulate plan and design.' },
  { id: 'design_manipulation', name: 'Design Manipulation', description: 'Manipulate design and pattern.' },
  { id: 'pattern_manipulation', name: 'Pattern Manipulation', description: 'Manipulate pattern and template.' },
  { id: 'template_manipulation', name: 'Template Manipulation', description: 'Manipulate template and model.' },
  { id: 'model_manipulation', name: 'Model Manipulation', description: 'Manipulate model and framework.' },
  { id: 'framework_manipulation', name: 'Framework Manipulation', description: 'Manipulate framework and system.' },
  { id: 'system_manipulation', name: 'System Manipulation', description: 'Manipulate system and mechanism.' },
  { id: 'mechanism_manipulation', name: 'Mechanism Manipulation', description: 'Manipulate mechanism and process.' },
  { id: 'process_manipulation', name: 'Process Manipulation', description: 'Manipulate process and procedure.' },
  { id: 'procedure_manipulation', name: 'Procedure Manipulation', description: 'Manipulate procedure and operation.' },
  { id: 'operation_manipulation', name: 'Operation Manipulation', description: 'Manipulate operation and function.' },
  { id: 'function_manipulation', name: 'Function Manipulation', description: 'Manipulate function and action.' },
  { id: 'action_manipulation', name: 'Action Manipulation', description: 'Manipulate action and movement.' },
  { id: 'movement_manipulation', name: 'Movement Manipulation', description: 'Manipulate movement and motion.' },
  { id: 'motion_manipulation', name: 'Motion Manipulation', description: 'Manipulate motion and activity.' },
  { id: 'activity_manipulation', name: 'Activity Manipulation', description: 'Manipulate activity and behavior.' },
  { id: 'behavior_manipulation', name: 'Behavior Manipulation', description: 'Manipulate behavior and conduct.' },
  { id: 'conduct_manipulation', name: 'Conduct Manipulation', description: 'Manipulate conduct and performance.' },
  { id: 'performance_manipulation', name: 'Performance Manipulation', description: 'Manipulate performance and execution.' },
  { id: 'execution_manipulation', name: 'Execution Manipulation', description: 'Manipulate execution and implementation.' },
  { id: 'implementation_manipulation', name: 'Implementation Manipulation', description: 'Manipulate implementation and application.' },
  { id: 'application_manipulation', name: 'Application Manipulation', description: 'Manipulate application and use.' },
  { id: 'use_manipulation', name: 'Use Manipulation', description: 'Manipulate use and utilization.' },
  { id: 'utilization_manipulation', name: 'Utilization Manipulation', description: 'Manipulate utilization and employment.' },
  { id: 'employment_manipulation', name: 'Employment Manipulation', description: 'Manipulate employment and usage.' },
  { id: 'usage_manipulation', name: 'Usage Manipulation', description: 'Manipulate usage and application.' },
  { id: 'application_control', name: 'Application Control', description: 'Control application and use.' },
  { id: 'use_control', name: 'Use Control', description: 'Control use and utilization.' },
  { id: 'utilization_control', name: 'Utilization Control', description: 'Control utilization and employment.' },
  { id: 'employment_control', name: 'Employment Control', description: 'Control employment and usage.' },
  { id: 'usage_control', name: 'Usage Control', description: 'Control usage and application.' }
];

/**
 * SKILLS DATABASE - Now references the comprehensive skills.js system
 * This is kept for backward compatibility but delegates to skills.js
 */
export const skillsDatabase = {
  // Legacy structure - now uses skills.js
  activeSkills: {},
  passiveSkills: {}
};

/**
 * Helper functions
 */
export function getRaceById(id) {
  return races.find(r => r.id === id) || null;
}

export function getClassById(id) {
  return classes.find(c => c.id === id) || null;
}

export function getTalentById(id) {
  return exRankTalents.find(t => t.id === id) || null;
}

export function getRandomTalents(count = 3) {
  const shuffled = [...exRankTalents].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Import skills functions from skills.js
import { getSkillsByClass as getSkillsByClassFromSkills } from './skills.js';

export function getSkillsByClass(classId) {
  // Delegate to skills.js for the new system
  try {
    return getSkillsByClassFromSkills(classId);
  } catch (error) {
    console.warn(`Error getting skills for class ${classId}:`, error);
    return { active: [], passive: [] };
  }
}
