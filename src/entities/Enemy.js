// =================================================================
// ENEMY DATABASE - Enemy templates, stats, skills, and drop tables
// =================================================================

/**
 * Enemy templates with stats, skills, and drop tables
 */
export const enemyDatabase = [
  {
    id: 'goblin',
    name: 'Goblin',
    level: 1,
    stats: {
      hp: { current: 30, max: 30 },
      mana: { current: 10, max: 10 },
      attack: 5,
      defense: 2,
      speed: 8
    },
    skills: ['goblin_bash'],
    dropTable: [
      { item: 'goblin_ear', chance: 0.5, quantity: { min: 1, max: 2 } },
      { item: 'minor_health_potion', chance: 0.2, quantity: { min: 1, max: 1 } },
      { gold: { min: 5, max: 15 }, chance: 1.0 }
    ],
    xpReward: 10,
    description: 'A small, green-skinned creature with sharp teeth and a crude weapon.'
  },
  {
    id: 'orc',
    name: 'Orc',
    level: 3,
    stats: {
      hp: { current: 80, max: 80 },
      mana: { current: 20, max: 20 },
      attack: 12,
      defense: 5,
      speed: 6
    },
    skills: ['orc_charge', 'orc_rage'],
    dropTable: [
      { item: 'orc_tusk', chance: 0.6, quantity: { min: 1, max: 1 } },
      { item: 'crude_weapon', chance: 0.3, quantity: { min: 1, max: 1 } },
      { gold: { min: 20, max: 40 }, chance: 1.0 }
    ],
    xpReward: 25,
    description: 'A large, brutish humanoid with powerful muscles and a fierce demeanor.'
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    level: 2,
    stats: {
      hp: { current: 50, max: 50 },
      mana: { current: 15, max: 15 },
      attack: 8,
      defense: 3,
      speed: 7
    },
    skills: ['skeleton_slash'],
    dropTable: [
      { item: 'bone_fragment', chance: 0.7, quantity: { min: 1, max: 3 } },
      { item: 'rusty_sword', chance: 0.2, quantity: { min: 1, max: 1 } },
      { gold: { min: 10, max: 25 }, chance: 1.0 }
    ],
    xpReward: 15,
    description: 'An animated skeleton wielding a rusty blade.'
  },
  {
    id: 'wolf',
    name: 'Dire Wolf',
    level: 2,
    stats: {
      hp: { current: 60, max: 60 },
      mana: { current: 0, max: 0 },
      attack: 10,
      defense: 4,
      speed: 12
    },
    skills: ['wolf_bite', 'wolf_howl'],
    dropTable: [
      { item: 'wolf_pelt', chance: 0.8, quantity: { min: 1, max: 2 } },
      { item: 'wolf_fang', chance: 0.5, quantity: { min: 1, max: 2 } },
      { gold: { min: 12, max: 30 }, chance: 1.0 }
    ],
    xpReward: 18,
    description: 'A large, ferocious wolf with glowing eyes and sharp fangs.'
  },
  {
    id: 'bandit',
    name: 'Bandit',
    level: 4,
    stats: {
      hp: { current: 100, max: 100 },
      mana: { current: 25, max: 25 },
      attack: 15,
      defense: 6,
      speed: 9
    },
    skills: ['bandit_stab', 'bandit_dodge'],
    dropTable: [
      { item: 'stolen_coin_purse', chance: 0.9, quantity: { min: 1, max: 1 } },
      { item: 'leather_armor', chance: 0.3, quantity: { min: 1, max: 1 } },
      { gold: { min: 30, max: 60 }, chance: 1.0 }
    ],
    xpReward: 35,
    description: 'A desperate criminal looking for easy prey.'
  },
  {
    id: 'troll',
    name: 'Cave Troll',
    level: 5,
    stats: {
      hp: { current: 150, max: 150 },
      mana: { current: 30, max: 30 },
      attack: 20,
      defense: 10,
      speed: 4
    },
    skills: ['troll_smash', 'troll_regeneration'],
    dropTable: [
      { item: 'troll_hide', chance: 0.7, quantity: { min: 1, max: 1 } },
      { item: 'troll_claw', chance: 0.5, quantity: { min: 1, max: 2 } },
      { item: 'health_potion', chance: 0.4, quantity: { min: 1, max: 1 } },
      { gold: { min: 50, max: 100 }, chance: 1.0 }
    ],
    xpReward: 50,
    description: 'A massive, regenerating troll with incredible strength.'
  },
  {
    id: 'mage_enemy',
    name: 'Dark Mage',
    level: 6,
    stats: {
      hp: { current: 80, max: 80 },
      mana: { current: 100, max: 100 },
      attack: 8,
      defense: 4,
      speed: 7
    },
    skills: ['dark_fireball', 'dark_shield', 'dark_bolt'],
    dropTable: [
      { item: 'mana_potion', chance: 0.6, quantity: { min: 1, max: 2 } },
      { item: 'spell_scroll', chance: 0.4, quantity: { min: 1, max: 1 } },
      { item: 'magic_essence', chance: 0.5, quantity: { min: 1, max: 3 } },
      { gold: { min: 40, max: 80 }, chance: 1.0 }
    ],
    xpReward: 60,
    description: 'A corrupted mage wielding dark magic.'
  },
  {
    id: 'dragon_whelp',
    name: 'Dragon Whelp',
    level: 8,
    stats: {
      hp: { current: 200, max: 200 },
      mana: { current: 50, max: 50 },
      attack: 25,
      defense: 12,
      speed: 10
    },
    skills: ['dragon_breath', 'dragon_claw', 'dragon_roar'],
    dropTable: [
      { item: 'dragon_scale', chance: 0.8, quantity: { min: 1, max: 3 } },
      { item: 'dragon_fang', chance: 0.6, quantity: { min: 1, max: 2 } },
      { item: 'rare_gem', chance: 0.3, quantity: { min: 1, max: 1 } },
      { gold: { min: 100, max: 200 }, chance: 1.0 }
    ],
    xpReward: 100,
    description: 'A young but dangerous dragon with fiery breath.'
  }
];

/**
 * Enemy skills database
 */
export const enemySkillsDatabase = {
  goblin_bash: {
    id: 'goblin_bash',
    name: 'Bash',
    type: 'active',
    damage: { base: 8, multiplier: 1.2 },
    manaCost: 0,
    cooldown: 2,
    description: 'A crude but effective strike.'
  },
  orc_charge: {
    id: 'orc_charge',
    name: 'Charge',
    type: 'active',
    damage: { base: 15, multiplier: 1.5 },
    manaCost: 10,
    cooldown: 3,
    description: 'Rushes forward with increased damage.'
  },
  orc_rage: {
    id: 'orc_rage',
    name: 'Rage',
    type: 'active',
    effect: { attackBoost: 0.3, duration: 3 },
    manaCost: 15,
    cooldown: 5,
    description: 'Enters a berserker rage, increasing attack power.'
  },
  skeleton_slash: {
    id: 'skeleton_slash',
    name: 'Slash',
    type: 'active',
    damage: { base: 10, multiplier: 1.1 },
    manaCost: 5,
    cooldown: 2,
    description: 'A quick slash with a rusty blade.'
  },
  wolf_bite: {
    id: 'wolf_bite',
    name: 'Bite',
    type: 'active',
    damage: { base: 12, multiplier: 1.3 },
    manaCost: 0,
    cooldown: 2,
    description: 'A vicious bite that can cause bleeding.'
  },
  wolf_howl: {
    id: 'wolf_howl',
    name: 'Howl',
    type: 'active',
    effect: { speedBoost: 0.2, duration: 4 },
    manaCost: 0,
    cooldown: 5,
    description: 'A howl that increases speed.'
  },
  bandit_stab: {
    id: 'bandit_stab',
    name: 'Stab',
    type: 'active',
    damage: { base: 18, multiplier: 1.4 },
    manaCost: 8,
    cooldown: 2,
    description: 'A quick, precise stab.'
  },
  bandit_dodge: {
    id: 'bandit_dodge',
    name: 'Dodge',
    type: 'active',
    effect: { evasionBoost: 0.3, duration: 2 },
    manaCost: 10,
    cooldown: 4,
    description: 'Quickly dodges incoming attacks.'
  },
  troll_smash: {
    id: 'troll_smash',
    name: 'Smash',
    type: 'active',
    damage: { base: 25, multiplier: 1.6 },
    manaCost: 15,
    cooldown: 3,
    description: 'A devastating smash attack.'
  },
  troll_regeneration: {
    id: 'troll_regeneration',
    name: 'Regeneration',
    type: 'passive',
    effect: { hpRegen: 5, interval: 2 },
    description: 'Slowly regenerates health over time.'
  },
  dark_fireball: {
    id: 'dark_fireball',
    name: 'Dark Fireball',
    type: 'active',
    damage: { base: 20, multiplier: 1.5 },
    manaCost: 25,
    cooldown: 3,
    description: 'Launches a dark fireball at the target.'
  },
  dark_shield: {
    id: 'dark_shield',
    name: 'Dark Shield',
    type: 'active',
    effect: { defenseBoost: 0.4, duration: 5 },
    manaCost: 30,
    cooldown: 8,
    description: 'Creates a protective dark shield.'
  },
  dark_bolt: {
    id: 'dark_bolt',
    name: 'Dark Bolt',
    type: 'active',
    damage: { base: 15, multiplier: 1.3 },
    manaCost: 15,
    cooldown: 2,
    description: 'A quick dark magic bolt.'
  },
  dragon_breath: {
    id: 'dragon_breath',
    name: 'Dragon Breath',
    type: 'active',
    damage: { base: 35, multiplier: 1.8 },
    manaCost: 40,
    cooldown: 4,
    description: 'Breathes a cone of fire at the target.'
  },
  dragon_claw: {
    id: 'dragon_claw',
    name: 'Dragon Claw',
    type: 'active',
    damage: { base: 30, multiplier: 1.6 },
    manaCost: 0,
    cooldown: 2,
    description: 'A powerful claw attack.'
  },
  dragon_roar: {
    id: 'dragon_roar',
    name: 'Dragon Roar',
    type: 'active',
    effect: { attackBoost: 0.5, defenseBoost: 0.3, duration: 5 },
    manaCost: 50,
    cooldown: 10,
    description: 'A terrifying roar that boosts all stats.'
  }
};

/**
 * Get enemy template by ID
 */
export function getEnemyById(enemyId) {
  return enemyDatabase.find(e => e.id === enemyId) || null;
}

/**
 * Create an enemy instance from template
 */
export function createEnemy(enemyId) {
  const template = getEnemyById(enemyId);
  if (!template) return null;
  
  return {
    ...template,
    stats: {
      ...template.stats,
      hp: { ...template.stats.hp },
      mana: { ...template.stats.mana }
    },
    currentEffects: [],
    skillCooldowns: {}
  };
}

/**
 * Get enemy skill by ID
 */
export function getEnemySkillById(skillId) {
  return enemySkillsDatabase[skillId] || null;
}

/**
 * Calculate drops from enemy
 */
export function calculateEnemyDrops(enemy) {
  const drops = [];
  const goldDrops = [];
  
  enemy.dropTable.forEach(drop => {
    if (Math.random() < drop.chance) {
      if (drop.item) {
        const quantity = drop.quantity 
          ? Math.floor(Math.random() * (drop.quantity.max - drop.quantity.min + 1)) + drop.quantity.min
          : 1;
        drops.push({ id: drop.item, quantity });
      } else if (drop.gold) {
        const goldAmount = Math.floor(Math.random() * (drop.gold.max - drop.gold.min + 1)) + drop.gold.min;
        goldDrops.push(goldAmount);
      }
    }
  });
  
  const totalGold = goldDrops.reduce((sum, gold) => sum + gold, 0);
  
  return {
    items: drops,
    gold: totalGold,
    xp: enemy.xpReward
  };
}
