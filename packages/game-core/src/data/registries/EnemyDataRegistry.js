// =================================================================
// ENEMY DATA REGISTRY
// Consolidated enemy data
// Migrated from: src/entities/Enemy.js
// =================================================================

/**
 * ENEMIES - Base enemy definitions
 * Note: Full enemy creation logic remains in src/entities/Enemy.js
 * This registry only contains the base templates
 */
export let enemies = [
  {
    id: 'goblin',
    name: 'Goblin',
    level: 1,
    type: 'humanoid',
    description: 'A small, green-skinned creature with sharp teeth.',
    baseStats: {
      hp: 20,
      attack: 5,
      defense: 2,
      speed: 4
    },
    drops: ['goblin_ear', 'crude_weapon'],
    xpReward: 10,
    goldReward: 5
  },
  {
    id: 'wolf',
    name: 'Wolf',
    level: 2,
    type: 'beast',
    description: 'A fierce predator with sharp fangs.',
    baseStats: {
      hp: 30,
      attack: 8,
      defense: 3,
      speed: 6
    },
    drops: ['wolf_pelt', 'wolf_fang'],
    xpReward: 15,
    goldReward: 8
  },
  {
    id: 'orc',
    name: 'Orc',
    level: 3,
    type: 'humanoid',
    description: 'A brutish warrior with immense strength.',
    baseStats: {
      hp: 50,
      attack: 12,
      defense: 5,
      speed: 3
    },
    drops: ['orc_tusk', 'iron_ore'],
    xpReward: 25,
    goldReward: 15
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    level: 4,
    type: 'undead',
    description: 'Animated bones held together by dark magic.',
    baseStats: {
      hp: 40,
      attack: 10,
      defense: 4,
      speed: 4
    },
    tags: ['undead'],
    drops: ['bone_fragment'],
    xpReward: 30,
    goldReward: 10
  },
  {
    id: 'troll',
    name: 'Troll',
    level: 5,
    type: 'giant',
    description: 'A massive creature with regenerative abilities.',
    baseStats: {
      hp: 80,
      attack: 15,
      defense: 8,
      speed: 2
    },
    drops: ['troll_hide', 'troll_claw'],
    xpReward: 50,
    goldReward: 30
  },
  {
    id: 'bandit',
    name: 'Bandit',
    level: 3,
    type: 'humanoid',
    description: 'A highway robber looking for easy prey.',
    baseStats: {
      hp: 35,
      attack: 10,
      defense: 4,
      speed: 5
    },
    drops: ['stolen_coin_purse', 'leather'],
    xpReward: 20,
    goldReward: 25
  },
  {
    id: 'dark_mage',
    name: 'Dark Mage',
    level: 6,
    type: 'humanoid',
    description: 'A practitioner of forbidden magic.',
    baseStats: {
      hp: 45,
      attack: 18,
      defense: 3,
      speed: 4
    },
    drops: ['spell_scroll', 'magic_essence'],
    xpReward: 60,
    goldReward: 40
  },
  {
    id: 'dragon_whelp',
    name: 'Dragon Whelp',
    level: 10,
    type: 'dragon',
    description: 'A young dragon, still dangerous despite its age.',
    baseStats: {
      hp: 150,
      attack: 25,
      defense: 12,
      speed: 5
    },
    tags: ['dragon', 'fire'],
    drops: ['dragon_scale', 'dragon_fang'],
    xpReward: 150,
    goldReward: 100
  },

  // ── Tier 1: Levels 1-10 (Tutorial/Early) ──────────────────────────
  {
    id: 'slime',
    name: 'Slime',
    level: 1,
    type: 'amorphous',
    description: 'A quivering blob of translucent ooze that absorbs anything it touches.',
    baseStats: { hp: 20, attack: 5, defense: 2, speed: 2 },
    drops: ['slime_gel'],
    xpReward: 8,
    goldReward: 3
  },
  {
    id: 'giant_rat',
    name: 'Giant Rat',
    level: 2,
    type: 'beast',
    description: 'An oversized rodent with matted fur and yellow teeth.',
    baseStats: { hp: 25, attack: 7, defense: 3, speed: 5 },
    drops: ['rat_tail', 'rat_pelt'],
    xpReward: 10,
    goldReward: 4
  },
  {
    id: 'wild_boar',
    name: 'Wild Boar',
    level: 5,
    type: 'beast',
    description: 'A tusked beast that charges without warning.',
    baseStats: { hp: 55, attack: 12, defense: 6, speed: 4 },
    drops: ['boar_tusk', 'raw_meat'],
    xpReward: 25,
    goldReward: 12
  },
  {
    id: 'cave_bat',
    name: 'Cave Bat',
    level: 7,
    type: 'beast',
    description: 'A large bat that lurks in dark caverns, striking from the shadows.',
    baseStats: { hp: 40, attack: 14, defense: 4, speed: 8 },
    tags: ['flying'],
    drops: ['bat_wing', 'echo_crystal'],
    xpReward: 30,
    goldReward: 10
  },

  // ── Tier 2: Levels 11-25 (Early-Mid) ──────────────────────────────
  {
    id: 'forest_spider',
    name: 'Forest Spider',
    level: 12,
    type: 'beast',
    description: 'A web-spinning predator the size of a hound.',
    baseStats: { hp: 90, attack: 18, defense: 10, speed: 6 },
    tags: ['poison'],
    drops: ['spider_silk', 'venom_sac'],
    xpReward: 55,
    goldReward: 25
  },
  {
    id: 'swamp_lizard',
    name: 'Swamp Lizard',
    level: 16,
    type: 'beast',
    description: 'A scaled ambush hunter that lurks beneath murky water.',
    baseStats: { hp: 120, attack: 22, defense: 14, speed: 4 },
    drops: ['lizard_scale', 'swamp_moss'],
    xpReward: 70,
    goldReward: 30
  },
  {
    id: 'skeleton_warrior',
    name: 'Skeleton Warrior',
    level: 18,
    type: 'undead',
    description: 'The animated remains of a fallen soldier, wielding a rusted blade.',
    baseStats: { hp: 140, attack: 26, defense: 16, speed: 4 },
    tags: ['undead'],
    drops: ['bone_fragment', 'rusted_sword'],
    xpReward: 85,
    goldReward: 35
  },
  {
    id: 'dire_wolf',
    name: 'Dire Wolf',
    level: 22,
    type: 'beast',
    description: 'A massive wolf with silver-streaked fur and crushing jaws.',
    baseStats: { hp: 180, attack: 32, defense: 18, speed: 7 },
    drops: ['dire_pelt', 'fang_trophy'],
    xpReward: 110,
    goldReward: 45
  },

  // ── Tier 3: Levels 26-50 (Mid) ────────────────────────────────────
  {
    id: 'orc_berserker',
    name: 'Orc Berserker',
    level: 28,
    type: 'humanoid',
    description: 'A rage-fueled orc that fights with reckless ferocity.',
    baseStats: { hp: 220, attack: 40, defense: 22, speed: 5 },
    drops: ['berserker_totem', 'iron_ore'],
    xpReward: 160,
    goldReward: 60
  },
  {
    id: 'stone_golem',
    name: 'Stone Golem',
    level: 33,
    type: 'construct',
    description: 'An animated mass of rock held together by ancient runes.',
    baseStats: { hp: 350, attack: 48, defense: 38, speed: 2 },
    tags: ['construct'],
    drops: ['rune_fragment', 'granite_core'],
    xpReward: 220,
    goldReward: 80
  },
  {
    id: 'harpy',
    name: 'Harpy',
    level: 38,
    type: 'beast',
    description: 'A shrieking bird-woman whose talons tear through armour.',
    baseStats: { hp: 300, attack: 58, defense: 28, speed: 9 },
    tags: ['flying'],
    drops: ['harpy_feather', 'sky_shard'],
    xpReward: 280,
    goldReward: 95
  },
  {
    id: 'venomous_drake',
    name: 'Venomous Drake',
    level: 46,
    type: 'dragon',
    description: 'A wingless drake that spits corrosive venom.',
    baseStats: { hp: 550, attack: 75, defense: 42, speed: 5 },
    tags: ['dragon', 'poison'],
    drops: ['drake_fang', 'venom_gland'],
    xpReward: 380,
    goldReward: 130
  },

  // ── Tier 4: Levels 51-100 (Late-Mid) ──────────────────────────────
  {
    id: 'shadow_knight',
    name: 'Shadow Knight',
    level: 55,
    type: 'undead',
    description: 'A spectral warrior clad in darkness, its blade drains life force.',
    baseStats: { hp: 700, attack: 95, defense: 55, speed: 6 },
    tags: ['undead', 'shadow'],
    drops: ['shadow_essence', 'cursed_plate'],
    xpReward: 520,
    goldReward: 200
  },
  {
    id: 'frost_giant',
    name: 'Frost Giant',
    level: 65,
    type: 'giant',
    description: 'A towering frost-covered brute that freezes the ground beneath it.',
    baseStats: { hp: 1100, attack: 130, defense: 70, speed: 3 },
    tags: ['ice'],
    drops: ['frost_core', 'giant_bone'],
    xpReward: 700,
    goldReward: 300
  },
  {
    id: 'chimera',
    name: 'Chimera',
    level: 75,
    type: 'beast',
    description: 'A three-headed abomination of lion, goat, and serpent.',
    baseStats: { hp: 1400, attack: 160, defense: 80, speed: 5 },
    tags: ['fire', 'poison'],
    drops: ['chimera_mane', 'serpent_tail'],
    xpReward: 900,
    goldReward: 400
  },
  {
    id: 'lich_acolyte',
    name: 'Lich Acolyte',
    level: 85,
    type: 'undead',
    description: 'An apprentice of undeath who commands necrotic bolts.',
    baseStats: { hp: 1200, attack: 185, defense: 60, speed: 4 },
    tags: ['undead', 'magic'],
    drops: ['phylactery_shard', 'necrotic_scroll'],
    xpReward: 1100,
    goldReward: 500
  },
  {
    id: 'iron_construct',
    name: 'Iron Construct',
    level: 95,
    type: 'construct',
    description: 'A massive war machine animated by forgotten enchantments.',
    baseStats: { hp: 1900, attack: 195, defense: 95, speed: 2 },
    tags: ['construct'],
    drops: ['arcane_gear', 'iron_plating'],
    xpReward: 1350,
    goldReward: 600
  },

  // ── Tier 5: Levels 101-200 (Late) ─────────────────────────────────
  {
    id: 'void_wraith',
    name: 'Void Wraith',
    level: 110,
    type: 'aberration',
    description: 'A formless horror from the space between realms.',
    baseStats: { hp: 2200, attack: 220, defense: 110, speed: 7 },
    tags: ['void', 'shadow'],
    drops: ['void_essence', 'wraith_shroud'],
    xpReward: 1800,
    goldReward: 750
  },
  {
    id: 'crystal_guardian',
    name: 'Crystal Guardian',
    level: 130,
    type: 'construct',
    description: 'A sentinel of living crystal that refracts deadly energy.',
    baseStats: { hp: 3500, attack: 300, defense: 180, speed: 3 },
    tags: ['construct', 'arcane'],
    drops: ['prismatic_shard', 'crystal_core'],
    xpReward: 2500,
    goldReward: 1000
  },
  {
    id: 'demon_captain',
    name: 'Demon Captain',
    level: 155,
    type: 'demon',
    description: 'A battle-scarred fiend commanding legions of lesser demons.',
    baseStats: { hp: 5200, attack: 380, defense: 200, speed: 6 },
    tags: ['demon', 'fire'],
    drops: ['demon_horn', 'infernal_plate'],
    xpReward: 3500,
    goldReward: 1400
  },
  {
    id: 'ancient_treant',
    name: 'Ancient Treant',
    level: 180,
    type: 'elemental',
    description: 'A primordial tree spirit whose roots crack stone.',
    baseStats: { hp: 7500, attack: 460, defense: 240, speed: 2 },
    tags: ['nature'],
    drops: ['heartwood', 'living_bark'],
    xpReward: 4800,
    goldReward: 1800
  },

  // ── Tier 6: Levels 201-350 (End Game) ─────────────────────────────
  {
    id: 'elder_dragon',
    name: 'Elder Dragon',
    level: 220,
    type: 'dragon',
    description: 'An ancient wyrm whose breath melts fortress walls.',
    baseStats: { hp: 9000, attack: 550, defense: 280, speed: 5 },
    tags: ['dragon', 'fire'],
    drops: ['elder_scale', 'dragon_heart'],
    xpReward: 6500,
    goldReward: 3000
  },
  {
    id: 'abyssal_horror',
    name: 'Abyssal Horror',
    level: 250,
    type: 'aberration',
    description: 'A writhing mass of tentacles born from the deepest void.',
    baseStats: { hp: 14000, attack: 750, defense: 350, speed: 4 },
    tags: ['void', 'eldritch'],
    drops: ['abyssal_ichor', 'void_pearl'],
    xpReward: 8500,
    goldReward: 4000
  },
  {
    id: 'celestial_sentinel',
    name: 'Celestial Sentinel',
    level: 280,
    type: 'celestial',
    description: 'A divine guardian that judges all who trespass.',
    baseStats: { hp: 20000, attack: 1000, defense: 450, speed: 6 },
    tags: ['holy', 'arcane'],
    drops: ['celestial_fragment', 'divine_aegis'],
    xpReward: 11000,
    goldReward: 5500
  },
  {
    id: 'archdemon',
    name: 'Archdemon',
    level: 320,
    type: 'demon',
    description: 'A lord of the infernal planes whose presence warps reality.',
    baseStats: { hp: 25000, attack: 1300, defense: 520, speed: 5 },
    tags: ['demon', 'fire', 'shadow'],
    drops: ['demon_crown', 'hellfire_core'],
    xpReward: 14000,
    goldReward: 7000
  },
  {
    id: 'void_titan',
    name: 'Void Titan',
    level: 350,
    type: 'aberration',
    description: 'The ultimate harbinger of oblivion, a colossus of pure void energy.',
    baseStats: { hp: 30000, attack: 1500, defense: 600, speed: 3 },
    tags: ['void', 'titan'],
    drops: ['titan_core', 'void_crown'],
    xpReward: 18000,
    goldReward: 10000
  }
];

/**
 * Get enemy template by ID
 * @param {string} enemyId - The enemy ID
 * @returns {object|null} Enemy template or null
 */
export function getEnemyTemplate(enemyId) {
  return enemies.find(e => e.id === enemyId) || null;
}

/**
 * Get enemies by level range
 * @param {number} minLevel - Minimum level
 * @param {number} maxLevel - Maximum level
 * @returns {Array} Enemies in level range
 */
export function getEnemiesByLevelRange(minLevel, maxLevel) {
  return enemies.filter(e => e.level >= minLevel && e.level <= maxLevel);
}

/**
 * Get enemies by type
 * @param {string} type - Enemy type
 * @returns {Array} Enemies of specified type
 */
export function getEnemiesByType(type) {
  return enemies.filter(e => e.type === type || e.tags?.includes(type));
}

export function setEnemies(nextEnemies) {
  if (Array.isArray(nextEnemies)) {
    enemies = nextEnemies;
  }
}
