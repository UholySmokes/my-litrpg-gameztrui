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
  }
];

/**
 * Get enemy template by ID
 * @param {string} enemyId - The enemy ID
 * @returns {object|null} Enemy template or null
 */
function getEnemyTemplate(enemyId) {
  return enemies.find(e => e.id === enemyId) || null;
}

/**
 * Get enemies by level range
 * @param {number} minLevel - Minimum level
 * @param {number} maxLevel - Maximum level
 * @returns {Array} Enemies in level range
 */
function getEnemiesByLevelRange(minLevel, maxLevel) {
  return enemies.filter(e => e.level >= minLevel && e.level <= maxLevel);
}

/**
 * Get enemies by type
 * @param {string} type - Enemy type
 * @returns {Array} Enemies of specified type
 */
function getEnemiesByType(type) {
  return enemies.filter(e => e.type === type || e.tags?.includes(type));
}

export function setEnemies(nextEnemies) {
  if (Array.isArray(nextEnemies)) {
    enemies = nextEnemies;
  }
}
