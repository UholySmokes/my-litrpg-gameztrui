// =====================================================
// LOOT SYSTEM - 9-Tier Rarity with Comprehensive Affixes
// =====================================================
// Tiers: Common → Uncommon → Rare → Epic → Legendary → Ancient → Exalted → Divine → Mythical
// Features: Prefix/Suffix system, Catalyst Slots, Unique Affixes, Set Affixes

import { getItemData } from "../../entities/ItemRegistry.js";
import {
  PREFIX_POOL,
  SUFFIX_POOL,
  UNIQUE_AFFIXES,
  SET_AFFIXES,
  CATALYSTS,
} from "./affixStats.js";
import {
  TIERED_PREFIX_POOL,
  TIERED_SUFFIX_POOL,
  TIER_NAMES,
  getAffixTierData,
  rollTieredAffixValue,
  getAffixDisplayName,
  getAffixesByTags as getTieredAffixesByTags,
} from "./AffixTierRegistry.js";

// =====================================================
// RARITY TIERS
// =====================================================

const RARITY_TIERS = {
  common: {
    tier: 1,
    name: "Common",
    color: "#9d9d9d",
    prefixes: 0,
    suffixes: 0,
    features: [],
    dropWeight: 100,
  },
  uncommon: {
    tier: 2,
    name: "Uncommon",
    color: "#1eff00",
    prefixes: { min: 0, max: 1 }, // 1 random (P or S)
    suffixes: { min: 0, max: 1 },
    totalAffixes: 1,
    features: [],
    dropWeight: 50,
  },
  rare: {
    tier: 3,
    name: "Rare",
    color: "#0070dd",
    prefixes: 1,
    suffixes: 1,
    features: [],
    dropWeight: 25,
  },
  epic: {
    tier: 4,
    name: "Epic",
    color: "#a335ee",
    prefixes: 2,
    suffixes: 1,
    features: ["greater_affix_chance"], // Chance to roll greater affix
    greaterAffixChance: 0.25,
    dropWeight: 10,
  },
  legendary: {
    tier: 5,
    name: "Legendary",
    color: "#ff8000",
    prefixes: 2,
    suffixes: 2,
    features: ["unique_affix"], // 1 locked unique affix slot
    dropWeight: 5,
  },
  ancient: {
    tier: 6,
    name: "Ancient",
    color: "#e6cc80",
    prefixes: 3,
    suffixes: 2,
    features: ["unique_affix", "catalyst_slot"], // + catalyst slot
    dropWeight: 2,
  },
  exalted: {
    tier: 7,
    name: "Exalted",
    color: "#00ffff",
    prefixes: 3,
    suffixes: 3,
    features: ["unique_affix", "catalyst_slot", "tier_bonus"], // Affixes roll +1 tier
    tierBonus: 1,
    dropWeight: 1,
  },
  divine: {
    tier: 8,
    name: "Divine",
    color: "#ffff00",
    prefixes: 4,
    suffixes: 3,
    features: ["unique_affix", "catalyst_slot", "tier_bonus", "set_affix"], // + set affix
    tierBonus: 1,
    dropWeight: 0.5,
  },
  mythical: {
    tier: 9,
    name: "Mythical",
    color: "#ff00ff",
    prefixes: 4,
    suffixes: 4,
    features: [
      "unique_affix",
      "catalyst_slot",
      "tier_bonus",
      "set_affix",
      "perfect_rolls",
    ],
    tierBonus: 2,
    perfectRolls: 2, // 1 P and 1 S guaranteed perfect
    dropWeight: 0.1,
  },
};

// =====================================================
// AFFIX TIER CALCULATION
// =====================================================

// =====================================================
// AFFIX TIER CALCULATION (T1-T10 System)
// =====================================================

// Affix tiers scale with item level: maxTier = ceil(itemLevel / 10)
function getMaxAffixTier(itemLevel, rarityTierBonus = 0) {
  const baseTier = Math.ceil(itemLevel / 10) || 1;
  return Math.min(10, Math.max(1, baseTier + rarityTierBonus));
}

// Roll affix value within tier range (supports new T1-T10 system)
function rollAffixValue(affix, tier, isPerfect = false, isExalted = false) {
  // New tiered system - check if affix has tiers array
  if (Array.isArray(affix.tiers)) {
    const tierData = affix.tiers.find((t) => t.tier === tier) || affix.tiers[0];
    return rollTieredAffixValue(tierData, isPerfect, isExalted);
  }

  // Legacy system - object-based tiers
  const tierData = affix.tiers?.[tier] ||
    affix.tiers?.[1] || { min: affix.min || 1, max: affix.max || 10 };

  let min = tierData.min ?? tierData.minVal ?? 1;
  let max = tierData.max ?? tierData.maxVal ?? 10;

  // Exalted: +25% extended range
  if (isExalted) {
    const range = max - min;
    max = max + Math.floor(range * 0.25);
  }

  if (isPerfect) {
    return max;
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// =====================================================
// AFFIX SELECTION
// =====================================================

function weightedRandom(items) {
  if (!items || items.length === 0) return null;
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    if (random < (item.weight || 1)) {
      return item;
    }
    random -= item.weight || 1;
  }
  return items[items.length - 1];
}

function getAffixesByTags(pool, tags, excludeIds = []) {
  if (!pool || !Array.isArray(pool)) return [];
  return pool.filter(
    (affix) =>
      !excludeIds.includes(affix.id) &&
      (!affix.tags ||
        affix.tags.length === 0 ||
        tags.some((tag) => affix.tags.includes(tag))),
  );
}

export function selectAffixes(
  pool,
  tags,
  count,
  excludeIds = [],
  itemLevel = 1,
  tierBonus = 0,
  perfectCount = 0,
  isExalted = false,
) {
  const available = getAffixesByTags(pool, tags, excludeIds);
  const selected = [];
  const usedIds = [...excludeIds];
  const maxTier = getMaxAffixTier(itemLevel, tierBonus);

  for (let i = 0; i < count && available.length > 0; i++) {
    const validPool = available.filter((a) => !usedIds.includes(a.id));
    if (validPool.length === 0) break;

    const affix = weightedRandom(validPool);
    if (affix) {
      const isPerfect = i < perfectCount;
      const tier = Math.min(maxTier, affix.maxTier || 10);
      const value = rollAffixValue(affix, tier, isPerfect, isExalted);

      // Get tier name for display
      const tierName = TIER_NAMES[tier] || TIER_NAMES[1];
      const displayName = affix.nameTemplate
        ? affix.nameTemplate.replace(
            "{tier}",
            affix.type === "prefix" ? tierName.prefix : tierName.suffix,
          )
        : affix.namePrefix || affix.nameSuffix || affix.name;

      selected.push({
        ...affix,
        tier,
        tierName: affix.type === "prefix" ? tierName.prefix : tierName.suffix,
        displayName,
        value,
        isPerfect,
        isExalted,
        isGreater: false,
      });
      usedIds.push(affix.id);
    }
  }

  return selected;
}

// Select affixes using new T1-T10 tiered system
function selectTieredAffixes(
  type,
  tags,
  count,
  excludeIds = [],
  itemLevel = 1,
  tierBonus = 0,
  perfectCount = 0,
  isExalted = false,
) {
  const pool = type === "prefix" ? TIERED_PREFIX_POOL : TIERED_SUFFIX_POOL;
  const available = getTieredAffixesByTags(pool, tags, excludeIds);
  const selected = [];
  const usedIds = [...excludeIds];
  const maxTier = getMaxAffixTier(itemLevel, tierBonus);

  for (let i = 0; i < count && available.length > 0; i++) {
    const validPool = available.filter((a) => !usedIds.includes(a.id));
    if (validPool.length === 0) break;

    const affix = weightedRandom(validPool);
    if (affix) {
      const isPerfect = i < perfectCount;
      const tier = Math.min(maxTier, 10);
      const tierData = getAffixTierData(affix, itemLevel);
      const value = rollTieredAffixValue(tierData, isPerfect, isExalted);

      // Get tier name for display
      const tierName = TIER_NAMES[tier] || TIER_NAMES[1];
      const displayName = getAffixDisplayName(affix, tier);

      selected.push({
        ...affix,
        type,
        tier,
        tierName: type === "prefix" ? tierName.prefix : tierName.suffix,
        displayName,
        value,
        isPerfect,
        isExalted,
        isGreater: false,
      });
      usedIds.push(affix.id);
    }
  }

  return selected;
}

// =====================================================
// UNIQUE AFFIX SELECTION
// =====================================================

function selectUniqueAffix(itemType, itemTags) {
  const available = UNIQUE_AFFIXES.filter(
    (ua) =>
      (!ua.itemTypes || ua.itemTypes.includes(itemType)) &&
      (!ua.tags ||
        ua.tags.length === 0 ||
        itemTags.some((tag) => ua.tags.includes(tag))),
  );

  return weightedRandom(available);
}

// =====================================================
// SET AFFIX SELECTION
// =====================================================

function selectSetAffix(itemType) {
  const available = SET_AFFIXES.filter(
    (sa) => !sa.itemTypes || sa.itemTypes.includes(itemType),
  );

  return weightedRandom(available);
}

// =====================================================
// MAIN ITEM GENERATION
// =====================================================

export function generateAffixedItem(
  baseItem,
  rarity = "common",
  itemLevel = 1,
) {
  const itemData =
    typeof baseItem === "string" ? getItemData(baseItem) : baseItem;
  if (!itemData) return null;

  const rarityData = RARITY_TIERS[rarity] || RARITY_TIERS.common;
  const itemTags = itemData.tags || [];
  const itemType = itemData.type || itemData.equipSlot || "generic";

  // Calculate affix counts
  let prefixCount = 0;
  let suffixCount = 0;

  if (typeof rarityData.prefixes === "object") {
    // Uncommon: random distribution
    const total = rarityData.totalAffixes || 1;
    if (Math.random() < 0.5) {
      prefixCount = total;
    } else {
      suffixCount = total;
    }
  } else {
    prefixCount = rarityData.prefixes || 0;
    suffixCount = rarityData.suffixes || 0;
  }

  // Get tier bonus from rarity
  const tierBonus = rarityData.tierBonus || 0;

  // Exalted+ items get extended affix ranges
  const isExalted = rarityData.tier >= 7;

  // Perfect rolls for Mythical
  const perfectPrefixes = rarityData.perfectRolls ? 1 : 0;
  const perfectSuffixes = rarityData.perfectRolls ? 1 : 0;

  // Use new T1-T10 tiered system for affix selection
  const prefixes = selectTieredAffixes(
    "prefix",
    itemTags,
    prefixCount,
    [],
    itemLevel,
    tierBonus,
    perfectPrefixes,
    isExalted,
  );

  // Select suffixes (excluding prefix IDs to avoid duplicates)
  const prefixIds = prefixes.map((p) => p.id);
  const suffixes = selectTieredAffixes(
    "suffix",
    itemTags,
    suffixCount,
    prefixIds,
    itemLevel,
    tierBonus,
    perfectSuffixes,
    isExalted,
  );

  // Apply greater affix chance for Epic+
  if (rarityData.greaterAffixChance) {
    [...prefixes, ...suffixes].forEach((affix) => {
      if (Math.random() < rarityData.greaterAffixChance) {
        affix.isGreater = true;
        affix.value = Math.floor(affix.value * 1.3); // 30% bonus
      }
    });
  }

  // Select unique affix for Legendary+
  let uniqueAffix = null;
  if (rarityData.features.includes("unique_affix")) {
    uniqueAffix = selectUniqueAffix(itemType, itemTags);
  }

  // Select set affix for Divine+
  let setAffix = null;
  if (rarityData.features.includes("set_affix")) {
    setAffix = selectSetAffix(itemType);
  }

  // Initialize catalyst slot for Ancient+
  let catalystSlot = null;
  if (rarityData.features.includes("catalyst_slot")) {
    catalystSlot = { filled: false, catalyst: null };
  }

  // Build item name
  const prefixNames = prefixes
    .slice(0, 2)
    .map((p) => p.namePrefix || p.name)
    .join(" ");
  const suffixNames = suffixes
    .slice(0, 2)
    .map((s) => s.nameSuffix || s.name)
    .join(" ");
  const baseName = itemData.name;

  let newName = baseName;
  if (prefixNames) newName = `${prefixNames} ${newName}`;
  if (suffixNames) newName = `${newName} ${suffixNames}`;

  // Calculate total stats
  const stats = { ...(itemData.stats || {}) };

  // Apply prefix stats
  prefixes.forEach((prefix) => {
    if (prefix.stat) {
      stats[prefix.stat] = (stats[prefix.stat] || 0) + prefix.value;
    }
    if (prefix.stats) {
      Object.entries(prefix.stats).forEach(([stat, mult]) => {
        stats[stat] = (stats[stat] || 0) + Math.floor(prefix.value * mult);
      });
    }
  });

  // Apply suffix stats
  suffixes.forEach((suffix) => {
    if (suffix.stat) {
      stats[suffix.stat] = (stats[suffix.stat] || 0) + suffix.value;
    }
    if (suffix.stats) {
      Object.entries(suffix.stats).forEach(([stat, mult]) => {
        stats[stat] = (stats[stat] || 0) + Math.floor(suffix.value * mult);
      });
    }
  });

  // Apply unique affix
  if (uniqueAffix) {
    if (uniqueAffix.stats) {
      Object.entries(uniqueAffix.stats).forEach(([stat, value]) => {
        stats[stat] = (stats[stat] || 0) + value;
      });
    }
  }

  // Build the item
  const newItem = {
    ...itemData,
    id: `${itemData.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    baseId: itemData.id,
    name: newName,
    rarity,
    rarityTier: rarityData.tier,
    rarityColor: rarityData.color,
    itemLevel,
    prefixes,
    suffixes,
    uniqueAffix,
    setAffix,
    catalystSlot,
    stats,
    generated: true,
    generatedAt: Date.now(),
  };

  return newItem;
}

// =====================================================
// CATALYST APPLICATION
// =====================================================

export function applyCatalyst(item, catalystId) {
  if (!item.catalystSlot) {
    return { success: false, reason: "Item does not have a catalyst slot" };
  }

  if (item.catalystSlot.filled) {
    return { success: false, reason: "Catalyst slot already filled" };
  }

  const catalyst = CATALYSTS[catalystId];
  if (!catalyst) {
    return { success: false, reason: "Unknown catalyst" };
  }

  // Apply catalyst stats
  const newStats = { ...item.stats };
  if (catalyst.stats) {
    Object.entries(catalyst.stats).forEach(([stat, value]) => {
      newStats[stat] = (newStats[stat] || 0) + value;
    });
  }

  const newItem = {
    ...item,
    stats: newStats,
    catalystSlot: {
      filled: true,
      catalyst: {
        id: catalystId,
        name: catalyst.name,
        effect: catalyst.effect,
      },
    },
  };

  // Update name to reflect catalyst
  if (catalyst.nameAddition) {
    newItem.name = `${newItem.name} ${catalyst.nameAddition}`;
  }

  return { success: true, item: newItem };
}

// =====================================================
// RARITY ROLL
// =====================================================

export function rollRarity(luckBonus = 0, areaBonus = 0, bossKill = false) {
  const rarities = Object.entries(RARITY_TIERS).sort(
    (a, b) => b[1].tier - a[1].tier,
  );

  // Calculate modified weights
  let totalWeight = 0;
  const modifiedRarities = rarities.map(([key, data]) => {
    let weight = data.dropWeight;

    // Luck bonus increases rare+ chances
    if (data.tier >= 3) {
      weight *= 1 + luckBonus * 0.1;
    }

    // Area bonus (dungeons, raids, etc.)
    weight *= 1 + areaBonus;

    // Boss kill dramatically increases rare+ chances
    if (bossKill && data.tier >= 4) {
      weight *= 3;
    }

    totalWeight += weight;
    return { key, weight };
  });

  // Roll
  let roll = Math.random() * totalWeight;
  for (const { key, weight } of modifiedRarities) {
    if (roll < weight) {
      return key;
    }
    roll -= weight;
  }

  return "common";
}

// =====================================================
// LOOT TABLE GENERATION
// =====================================================

export function generateLootDrop(baseItems, count = 1, options = {}) {
  const {
    luckBonus = 0,
    areaBonus = 0,
    bossKill = false,
    minItemLevel = 1,
    maxItemLevel = 100,
    guaranteedRarity = null,
  } = options;

  const drops = [];

  for (let i = 0; i < count; i++) {
    // Select random base item
    const baseItem = Array.isArray(baseItems)
      ? baseItems[Math.floor(Math.random() * baseItems.length)]
      : baseItems;

    // Roll rarity
    const rarity =
      guaranteedRarity || rollRarity(luckBonus, areaBonus, bossKill);

    // Calculate item level
    const itemLevel =
      Math.floor(Math.random() * (maxItemLevel - minItemLevel + 1)) +
      minItemLevel;

    // Generate the item
    const item = generateAffixedItem(baseItem, rarity, itemLevel);
    if (item) {
      drops.push(item);
    }
  }

  return drops;
}

// =====================================================
// ITEM COMPARISON
// =====================================================

export function compareItems(item1, item2) {
  const comparison = {
    rarityDiff:
      (RARITY_TIERS[item1.rarity]?.tier || 0) -
      (RARITY_TIERS[item2.rarity]?.tier || 0),
    levelDiff: (item1.itemLevel || 0) - (item2.itemLevel || 0),
    statDiffs: {},
  };

  // Compare all stats
  const allStats = new Set([
    ...Object.keys(item1.stats || {}),
    ...Object.keys(item2.stats || {}),
  ]);

  allStats.forEach((stat) => {
    const val1 = item1.stats?.[stat] || 0;
    const val2 = item2.stats?.[stat] || 0;
    if (val1 !== val2) {
      comparison.statDiffs[stat] = val1 - val2;
    }
  });

  // Calculate overall "power" difference
  const power1 = Object.values(item1.stats || {}).reduce((a, b) => a + b, 0);
  const power2 = Object.values(item2.stats || {}).reduce((a, b) => a + b, 0);
  comparison.powerDiff = power1 - power2;

  return comparison;
}

// Legacy export for backward compatibility
