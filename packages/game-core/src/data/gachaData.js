// =================================================================
// GACHA DATABASE - Pools, rates, and rarity tiers
// =================================================================

import { random, randomChoice } from "../utils/DeterministicRandom.js";
import { getItemData } from "../entities/ItemRegistry.js";

export const PITY_THRESHOLD = 50;
export const PITY_EPIC_THRESHOLD = 100;

const RARE_OR_BETTER = ["rare", "epic", "legendary"];
const EPIC_OR_BETTER = ["epic", "legendary"];

export let gachaPools = {
  equipment: {
    id: "equipment",
    name: "Equipment Gacha",
    description: "Pull for weapons and armor",
    cost: { goldCoins: 100 },
    pullCount: 1,
    rarityRates: {
      common: 0.5,
      uncommon: 0.3,
      rare: 0.15,
      epic: 0.04,
      legendary: 0.01,
    },
    items: {
      common: [
        { id: "wooden_sword", name: "Wooden Sword" },
        { id: "cloth_armor", name: "Cloth Armor" },
        { id: "bronze_mace", name: "Bronze Mace" },
        { id: "padded_vest", name: "Padded Vest" },
      ],
      uncommon: [
        { id: "iron_sword", name: "Iron Sword" },
        { id: "leather_armor", name: "Leather Armor" },
        { id: "silver_ring", name: "Silver Ring" },
        { id: "hunters_cloak", name: "Hunter's Cloak" },
      ],
      rare: [
        { id: "steel_sword", name: "Steel Sword" },
        { id: "chain_mail", name: "Chain Mail" },
        { id: "runic_gauntlets", name: "Runic Gauntlets" },
      ],
      epic: [
        { id: "magic_sword", name: "Magic Sword" },
        { id: "plate_armor", name: "Plate Armor" },
        { id: "aether_pendant", name: "Aether Pendant" },
      ],
      legendary: [
        { id: "legendary_blade", name: "Legendary Blade" },
        { id: "dragon_scale_armor", name: "Dragon Scale Armor" },
      ],
    },
  },

  skills: {
    id: "skills",
    name: "Skill Gacha",
    description: "Pull for rare skills",
    cost: { soulpoints: 10 },
    pullCount: 1,
    rarityRates: {
      common: 0.4,
      uncommon: 0.35,
      rare: 0.2,
      epic: 0.04,
      legendary: 0.01,
    },
    items: {
      common: [
        {
          id: "gacha_skill_basic",
          name: "Basic Skill",
          description: "A basic skill",
          type: "passive",
          manaCost: 0,
        },
      ],
      uncommon: [
        {
          id: "gacha_skill_enhanced",
          name: "Enhanced Skill",
          description: "An enhanced skill",
          type: "passive",
          manaCost: 0,
        },
      ],
      rare: [
        {
          id: "gacha_skill_advanced",
          name: "Advanced Skill",
          description: "An advanced skill",
          type: "active",
          manaCost: 20,
        },
      ],
      epic: [
        {
          id: "gacha_skill_master",
          name: "Master Skill",
          description: "A master-level skill",
          type: "active",
          manaCost: 30,
        },
      ],
      legendary: [
        {
          id: "gacha_skill_legendary",
          name: "Legendary Skill",
          description: "A legendary skill",
          type: "active",
          manaCost: 50,
        },
      ],
    },
  },

  premium: {
    id: "premium",
    name: "Premium Gacha",
    description: "Pull for rare items and skills",
    cost: { soulpoints: 50 },
    pullCount: 1,
    rarityRates: {
      common: 0.3,
      uncommon: 0.3,
      rare: 0.25,
      epic: 0.12,
      legendary: 0.03,
    },
    items: {
      common: [
        { id: "astral_token", name: "Astral Token" },
        { id: "mana_shard", name: "Mana Shard" },
      ],
      uncommon: [
        { id: "auric_resonator", name: "Auric Resonator" },
        { id: "soulweave_thread", name: "Soulweave Thread" },
      ],
      rare: [{ id: "starlit_diadem", name: "Starlit Diadem" }],
      epic: [{ id: "voidheart_relic", name: "Voidheart Relic" }],
      legendary: [{ id: "empyrean_catalyst", name: "Empyrean Catalyst" }],
    },
  },

  elemental: {
    id: "elemental",
    name: "Elemental Gacha",
    description: "Pull for fire, ice, and lightning gear",
    cost: { goldCoins: 150 },
    pullCount: 1,
    rarityRates: {
      common: 0.4,
      uncommon: 0.3,
      rare: 0.2,
      epic: 0.08,
      legendary: 0.02,
    },
    items: {
      common: [
        { id: "ember_dagger", name: "Ember Dagger" },
        { id: "frost_buckler", name: "Frost Buckler" },
      ],
      uncommon: [
        { id: "storm_lance", name: "Storm Lance" },
        { id: "blizzard_cloak", name: "Blizzard Cloak" },
      ],
      rare: [
        { id: "inferno_greatsword", name: "Inferno Greatsword" },
        { id: "thunderstrike_amulet", name: "Thunderstrike Amulet" },
      ],
      epic: [{ id: "glacial_crown", name: "Glacial Crown" }],
      legendary: [{ id: "primordial_flame_core", name: "Primordial Flame Core" }],
    },
  },

  shadow: {
    id: "shadow",
    name: "Shadow Gacha",
    description: "Pull for dark and stealth gear",
    cost: { goldCoins: 150 },
    pullCount: 1,
    rarityRates: {
      common: 0.4,
      uncommon: 0.3,
      rare: 0.2,
      epic: 0.08,
      legendary: 0.02,
    },
    items: {
      common: [
        { id: "nightshade_stiletto", name: "Nightshade Stiletto" },
        { id: "smoke_bomb", name: "Smoke Bomb" },
      ],
      uncommon: [
        { id: "shadow_cowl", name: "Shadow Cowl" },
        { id: "venom_vial", name: "Venom Vial" },
      ],
      rare: [
        { id: "umbral_blade", name: "Umbral Blade" },
        { id: "phantasm_boots", name: "Phantasm Boots" },
      ],
      epic: [{ id: "eclipse_mantle", name: "Eclipse Mantle" }],
      legendary: [{ id: "void_assassin_garb", name: "Void Assassin's Garb" }],
    },
  },
};

export function setGachaPools(nextPools) {
  if (nextPools && typeof nextPools === "object" && !Array.isArray(nextPools)) {
    gachaPools = nextPools;
  }
}

/**
 * Adjust rarity rates with a title bonus.
 * `gachaBonus` is treated as a probability shift (e.g., 0.05 moves 5% from common to higher rarities).
 */
export function getAdjustedRarityRates(rarityRates = {}, gachaBonus = 0) {
  const rates =
    rarityRates &&
    typeof rarityRates === "object" &&
    !Array.isArray(rarityRates)
      ? { ...rarityRates }
      : {};

  const bonus = Number.isFinite(gachaBonus)
    ? Math.min(Math.max(gachaBonus, 0), 0.5)
    : 0;
  if (!bonus) return rates;

  const keys = Object.keys(rates);
  if (keys.length === 0) return rates;

  const commonKey = Object.prototype.hasOwnProperty.call(rates, "common")
    ? "common"
    : keys[0];

  const commonRate = Number(rates[commonKey]) || 0;
  const shift = Math.min(commonRate, bonus);
  if (shift <= 0) return rates;

  rates[commonKey] = commonRate - shift;

  const otherKeys = keys.filter((key) => key !== commonKey);
  const otherSum = otherKeys.reduce((sum, key) => {
    const value = Number(rates[key]) || 0;
    return sum + value;
  }, 0);

  if (otherSum <= 0) {
    rates[commonKey] = commonRate;
    return rates;
  }

  otherKeys.forEach((key) => {
    const value = Number(rates[key]) || 0;
    rates[key] = value + shift * (value / otherSum);
  });

  const total = keys.reduce((sum, key) => sum + (Number(rates[key]) || 0), 0);
  if (total > 0) {
    keys.forEach((key) => {
      rates[key] = (Number(rates[key]) || 0) / total;
    });
  }

  return rates;
}

/**
 * Calculate gacha result based on rates
 */
export function calculateGachaResult(poolId, pullCount = 1, options = {}) {
  const pool = gachaPools[poolId];
  if (!pool) return null;

  const gachaBonus = options?.gachaBonus ?? 0;
  const rarityRates = getAdjustedRarityRates(pool.rarityRates, gachaBonus);
  const results = [];

  for (let i = 0; i < pullCount; i++) {
    const roll = random();
    let rarity = "common";
    let cumulative = 0;

    for (const [rarityName, rate] of Object.entries(rarityRates)) {
      cumulative += rate;
      if (roll <= cumulative) {
        rarity = rarityName;
        break;
      }
    }

    const rarityItems = pool.items[rarity];
    if (rarityItems && rarityItems.length > 0) {
      const randomItem = randomChoice(rarityItems);
      const itemData = getItemData(randomItem.id) || null;
      // Preserve any metadata on the entry (e.g., skill name/description) as fallback.
      results.push({
        ...randomItem,
        rarity,
        itemData,
      });
    }
  }

  return results;
}

/**
 * Resolve the minimum rarity guaranteed by pity counters.
 * Returns null when no pity override is active.
 */
export function resolvePityRarity(pullsSinceRare = 0, pullsSinceEpic = 0) {
  if (pullsSinceEpic >= PITY_EPIC_THRESHOLD) return "epic";
  if (pullsSinceRare >= PITY_THRESHOLD) return "rare";
  return null;
}

/**
 * Pull with pity system integration.
 * Returns { results, newPullsSinceRare, newPullsSinceEpic }.
 */
export function calculateGachaResultWithPity(
  poolId,
  pullCount = 1,
  options = {},
) {
  const pool = gachaPools[poolId];
  if (!pool) return null;

  const gachaBonus = options?.gachaBonus ?? 0;
  let pullsSinceRare = options?.pullsSinceRare ?? 0;
  let pullsSinceEpic = options?.pullsSinceEpic ?? 0;
  const rarityRates = getAdjustedRarityRates(pool.rarityRates, gachaBonus);
  const results = [];

  const rarityOrder = ["common", "uncommon", "rare", "epic", "legendary"];

  for (let i = 0; i < pullCount; i++) {
    const guaranteedRarity = resolvePityRarity(pullsSinceRare, pullsSinceEpic);

    let rarity = "common";
    const roll = random();
    let cumulative = 0;
    for (const [rarityName, rate] of Object.entries(rarityRates)) {
      cumulative += rate;
      if (roll <= cumulative) {
        rarity = rarityName;
        break;
      }
    }

    if (
      guaranteedRarity &&
      rarityOrder.indexOf(rarity) < rarityOrder.indexOf(guaranteedRarity)
    ) {
      rarity = guaranteedRarity;
    }

    const rarityItems = pool.items[rarity];
    if (rarityItems && rarityItems.length > 0) {
      const randomItem = randomChoice(rarityItems);
      const itemData = getItemData(randomItem.id) || null;
      results.push({ ...randomItem, rarity, itemData });
    }

    pullsSinceRare = RARE_OR_BETTER.includes(rarity) ? 0 : pullsSinceRare + 1;
    pullsSinceEpic = EPIC_OR_BETTER.includes(rarity) ? 0 : pullsSinceEpic + 1;
  }

  return {
    results,
    newPullsSinceRare: pullsSinceRare,
    newPullsSinceEpic: pullsSinceEpic,
  };
}
