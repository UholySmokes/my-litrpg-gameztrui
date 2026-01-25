import { generateAffixedItem } from "../systems/loot/LootSystem.js";
import { getItemData } from "./ItemRegistry.js";
import { DataRegistry } from "../data/DataRegistry.js";
import { random, randomInt } from "../utils/DeterministicRandom.js";

/**
 * Enemy skills database
 */
const enemySkillsDatabase = {
  goblin_bash: {
    id: "goblin_bash",
    name: "Bash",
    type: "active",
    damage: { base: 8, multiplier: 1.2 },
    manaCost: 0,
    cooldown: 2,
    description: "A crude but effective strike.",
  },
  orc_charge: {
    id: "orc_charge",
    name: "Charge",
    type: "active",
    damage: { base: 15, multiplier: 1.5 },
    manaCost: 10,
    cooldown: 3,
    description: "Rushes forward with increased damage.",
  },
  orc_rage: {
    id: "orc_rage",
    name: "Rage",
    type: "active",
    effect: { attackBoost: 0.3, duration: 3 },
    manaCost: 15,
    cooldown: 5,
    description: "Enters a berserker rage, increasing attack power.",
  },
  skeleton_slash: {
    id: "skeleton_slash",
    name: "Slash",
    type: "active",
    damage: { base: 10, multiplier: 1.1 },
    manaCost: 5,
    cooldown: 2,
    description: "A quick slash with a rusty blade.",
  },
  wolf_bite: {
    id: "wolf_bite",
    name: "Bite",
    type: "active",
    damage: { base: 12, multiplier: 1.3 },
    manaCost: 0,
    cooldown: 2,
    description: "A vicious bite that can cause bleeding.",
  },
  wolf_howl: {
    id: "wolf_howl",
    name: "Howl",
    type: "active",
    effect: { speedBoost: 0.2, duration: 4 },
    manaCost: 0,
    cooldown: 5,
    description: "A howl that increases speed.",
  },
  bandit_stab: {
    id: "bandit_stab",
    name: "Stab",
    type: "active",
    damage: { base: 18, multiplier: 1.4 },
    manaCost: 8,
    cooldown: 2,
    description: "A quick, precise stab.",
  },
  bandit_dodge: {
    id: "bandit_dodge",
    name: "Dodge",
    type: "active",
    effect: { evasionBoost: 0.3, duration: 2 },
    manaCost: 10,
    cooldown: 4,
    description: "Quickly dodges incoming attacks.",
  },
  troll_smash: {
    id: "troll_smash",
    name: "Smash",
    type: "active",
    damage: { base: 25, multiplier: 1.6 },
    manaCost: 15,
    cooldown: 3,
    description: "A devastating smash attack.",
  },
  troll_regeneration: {
    id: "troll_regeneration",
    name: "Regeneration",
    type: "passive",
    effect: { hpRegen: 5, interval: 2 },
    description: "Slowly regenerates health over time.",
  },
  dark_fireball: {
    id: "dark_fireball",
    name: "Dark Fireball",
    type: "active",
    damage: { base: 20, multiplier: 1.5 },
    manaCost: 25,
    cooldown: 3,
    description: "Launches a dark fireball at the target.",
  },
  dark_shield: {
    id: "dark_shield",
    name: "Dark Shield",
    type: "active",
    effect: { defenseBoost: 0.4, duration: 5 },
    manaCost: 30,
    cooldown: 8,
    description: "Creates a protective dark shield.",
  },
  dark_bolt: {
    id: "dark_bolt",
    name: "Dark Bolt",
    type: "active",
    damage: { base: 15, multiplier: 1.3 },
    manaCost: 15,
    cooldown: 2,
    description: "A quick dark magic bolt.",
  },
  dragon_breath: {
    id: "dragon_breath",
    name: "Dragon Breath",
    type: "active",
    damage: { base: 35, multiplier: 1.8 },
    manaCost: 40,
    cooldown: 4,
    description: "Breathes a cone of fire at the target.",
  },
  dragon_claw: {
    id: "dragon_claw",
    name: "Dragon Claw",
    type: "active",
    damage: { base: 30, multiplier: 1.6 },
    manaCost: 0,
    cooldown: 2,
    description: "A powerful claw attack.",
  },
  dragon_roar: {
    id: "dragon_roar",
    name: "Dragon Roar",
    type: "active",
    effect: { attackBoost: 0.5, defenseBoost: 0.3, duration: 5 },
    manaCost: 50,
    cooldown: 10,
    description: "A terrifying roar that boosts all stats.",
  },
};

/**
 * Get enemy template by ID
 */
function getEnemyById(enemyId) {
  return DataRegistry.getEnemyById(enemyId);
}

function normalizeResource(resourceValue, fallback = 0) {
  if (typeof resourceValue === "number") {
    return { current: resourceValue, max: resourceValue };
  }
  if (resourceValue && typeof resourceValue === "object") {
    const max = resourceValue.max ?? resourceValue.current ?? fallback;
    const current = resourceValue.current ?? max;
    return { current, max };
  }
  return { current: fallback, max: fallback };
}

function normalizeStats(template) {
  const sourceStats = template.stats || template.baseStats || {};
  return {
    hp: normalizeResource(sourceStats.hp, 50),
    mana: normalizeResource(sourceStats.mana, 0),
    attack: sourceStats.attack ?? template.stats?.attack ?? 5,
    defense: sourceStats.defense ?? template.stats?.defense ?? 0,
    speed: sourceStats.speed ?? template.stats?.speed ?? 0,
  };
}

function normalizeDropTable(template) {
  if (Array.isArray(template.dropTable) && template.dropTable.length > 0) {
    return template.dropTable;
  }

  if (Array.isArray(template.drops)) {
    return template.drops.map((drop) => {
      if (typeof drop === "string") {
        return { item: drop, chance: 0.5, quantity: { min: 1, max: 1 } };
      }
      return {
        ...drop,
        chance: drop.chance ?? 0.5,
        quantity: drop.quantity || { min: 1, max: 1 },
      };
    });
  }

  return [];
}

/**
 * Create an enemy instance from template
 */
export function createEnemy(enemyId) {
  const template = getEnemyById(enemyId);
  if (!template) return null;

  const normalizedStats = normalizeStats(template);
  const dropTable = normalizeDropTable(template);

  return {
    ...template,
    stats: {
      ...normalizedStats,
      hp: { ...normalizedStats.hp },
      mana: { ...normalizedStats.mana },
    },
    dropTable,
    currentEffects: [],
    skillCooldowns: {},
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

  // These could be influenced by player stats (e.g., Magic Find)
  const magicChance = 0.15; // 15% chance for a magic item
  const rareChance = 0.05; // 5% chance for a rare item

  enemy.dropTable.forEach((drop) => {
    // Check if the drop happens
    if (random() < drop.chance) {
      // Handle item drops
      if (drop.item) {
        const baseItem = getItemData(drop.item);
        if (!baseItem) return; // Skip if item data not found

        const quantity = drop.quantity
          ? randomInt(drop.quantity.min, drop.quantity.max)
          : 1;

        for (let i = 0; i < quantity; i++) {
          const roll = random();
          if (roll < rareChance) {
            // Generate a rare item
            const rareItem = generateAffixedItem(baseItem, "rare");
            if (rareItem) drops.push(rareItem);
          } else if (roll < magicChance) {
            // Generate a magic item
            const magicItem = generateAffixedItem(baseItem, "magic");
            if (magicItem) drops.push(magicItem);
          } else {
            // Generate a normal item (create a copy)
            drops.push({ ...baseItem, quantity: 1 });
          }
        }
      }
      // Handle gold drops
      else if (drop.gold) {
        const goldAmount = randomInt(drop.gold.min, drop.gold.max);
        goldDrops.push(goldAmount);
      }
    }
  });

  const fixedGold = Number.isFinite(enemy?.goldReward) ? enemy.goldReward : 0;
  const totalGold = fixedGold + goldDrops.reduce((sum, gold) => sum + gold, 0);

  return {
    items: drops,
    gold: totalGold,
    xp: enemy.xpReward,
  };
}
