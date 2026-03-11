// =====================================================
// AFFIX TIER REGISTRY - T1-T10 Item Level Scaling System
// =====================================================
// iLvl determines max tier: maxTier = ceil(iLvl / 10)
// Exalted: +25% above tier max | Mythical: 2 perfect rolls

import { random, randomInt } from "../../utils/DeterministicRandom.js";

export const TIER_NAMES = {
  1: { prefix: "Mortal", suffix: "Minor" },
  2: { prefix: "Iron", suffix: "Lesser" },
  3: { prefix: "Bronze", suffix: "Common" },
  4: { prefix: "Silver", suffix: "Greater" },
  5: { prefix: "Gold", suffix: "Superior" },
  6: { prefix: "Platinum", suffix: "Exceptional" },
  7: { prefix: "Diamond", suffix: "Masterwork" },
  8: { prefix: "Ascended", suffix: "Exalted" },
  9: { prefix: "Heavenly", suffix: "Divine" },
  10: { prefix: "Godly", suffix: "Mythical" },
};

// Helper to generate tier array for flat stat scaling
function genFlatTiers(baseMin, baseMax, scaleFactor = 1.35) {
  const tiers = [];
  for (let t = 1; t <= 10; t++) {
    const scale = Math.pow(scaleFactor, t - 1);
    tiers.push({
      tier: t,
      minLevel: t === 1 ? 1 : (t - 1) * 10,
      minVal: Math.floor(baseMin * scale),
      maxVal: Math.floor(baseMax * scale),
    });
  }
  return tiers;
}

// Helper for percent-based stats (0-1 range)
function genPercentTiers(baseMin, baseMax, scaleFactor = 1.28) {
  const tiers = [];
  for (let t = 1; t <= 10; t++) {
    const scale = Math.pow(scaleFactor, t - 1);
    tiers.push({
      tier: t,
      minLevel: t === 1 ? 1 : (t - 1) * 10,
      minVal: Math.round(baseMin * scale * 100) / 100,
      maxVal: Math.round(baseMax * scale * 100) / 100,
    });
  }
  return tiers;
}

// =====================================================
// TIERED AFFIX POOL - Prefixes (Offensive)
// =====================================================
export const TIERED_PREFIX_POOL = [
  // === CORE ATTRIBUTES ===
  {
    id: "prefix_str",
    stat: "str",
    nameTemplate: "{tier} Strength",
    tags: ["weapon", "armor"],
    weight: 10,
    tiers: genFlatTiers(1, 8, 1.38),
  },
  {
    id: "prefix_agi",
    stat: "agi",
    nameTemplate: "{tier} Agility",
    tags: ["weapon", "armor", "jewelry"],
    weight: 10,
    tiers: genFlatTiers(1, 8, 1.38),
  },
  {
    id: "prefix_dex",
    stat: "dex",
    nameTemplate: "{tier} Dexterity",
    tags: ["weapon", "armor", "jewelry"],
    weight: 10,
    tiers: genFlatTiers(1, 8, 1.38),
  },
  {
    id: "prefix_int",
    stat: "int",
    nameTemplate: "{tier} Intelligence",
    tags: ["weapon", "armor", "jewelry"],
    weight: 10,
    tiers: genFlatTiers(1, 8, 1.38),
  },
  {
    id: "prefix_will",
    stat: "will",
    nameTemplate: "{tier} Willpower",
    tags: ["armor", "jewelry"],
    weight: 8,
    tiers: genFlatTiers(1, 8, 1.38),
  },
  {
    id: "prefix_luck",
    stat: "luck",
    nameTemplate: "{tier} Fortune",
    tags: ["jewelry"],
    weight: 6,
    tiers: genFlatTiers(1, 5, 1.35),
  },
  {
    id: "prefix_soul",
    stat: "soul",
    nameTemplate: "{tier} Spirit",
    tags: ["armor", "jewelry"],
    weight: 7,
    tiers: genFlatTiers(1, 8, 1.38),
  },
  {
    id: "prefix_cha",
    stat: "cha",
    nameTemplate: "{tier} Charisma",
    tags: ["jewelry"],
    weight: 5,
    tiers: genFlatTiers(1, 6, 1.35),
  },

  // === PHYSICAL DAMAGE ===
  {
    id: "prefix_phys_dmg",
    stat: "physicalDamage",
    nameTemplate: "{tier} Might",
    tags: ["weapon"],
    weight: 12,
    tiers: genFlatTiers(3, 8, 1.42),
  },

  // === ELEMENTAL DAMAGE ===
  {
    id: "prefix_fire_dmg",
    stat: "fireDamage",
    nameTemplate: "{tier} Flame",
    tags: ["weapon", "jewelry"],
    weight: 8,
    tiers: genFlatTiers(2, 6, 1.4),
  },
  {
    id: "prefix_ice_dmg",
    stat: "iceDamage",
    nameTemplate: "{tier} Frost",
    tags: ["weapon", "jewelry"],
    weight: 8,
    tiers: genFlatTiers(2, 6, 1.4),
  },
  {
    id: "prefix_lightning_dmg",
    stat: "lightningDamage",
    nameTemplate: "{tier} Storm",
    tags: ["weapon", "jewelry"],
    weight: 8,
    tiers: genFlatTiers(2, 6, 1.4),
  },
  {
    id: "prefix_poison_dmg",
    stat: "poisonDamage",
    nameTemplate: "{tier} Venom",
    tags: ["weapon"],
    weight: 6,
    tiers: genFlatTiers(2, 5, 1.4),
  },
  {
    id: "prefix_holy_dmg",
    stat: "holyDamage",
    nameTemplate: "{tier} Radiance",
    tags: ["weapon", "jewelry"],
    weight: 6,
    tiers: genFlatTiers(2, 5, 1.4),
  },
  {
    id: "prefix_shadow_dmg",
    stat: "shadowDamage",
    nameTemplate: "{tier} Shadow",
    tags: ["weapon", "jewelry"],
    weight: 6,
    tiers: genFlatTiers(2, 5, 1.4),
  },
  {
    id: "prefix_arcane_dmg",
    stat: "arcaneDamage",
    nameTemplate: "{tier} Arcana",
    tags: ["weapon", "jewelry"],
    weight: 6,
    tiers: genFlatTiers(2, 5, 1.4),
  },

  // === CRITICAL ===
  {
    id: "prefix_crit_chance",
    stat: "critChance",
    nameTemplate: "{tier} Precision",
    tags: ["weapon", "jewelry"],
    weight: 8,
    isPercent: true,
    tiers: genPercentTiers(0.01, 0.02, 1.28),
  },
  {
    id: "prefix_crit_dmg",
    stat: "critMultiplier",
    nameTemplate: "of {tier}",
    tags: ["weapon"],
    weight: 6,
    isPercent: true,
    tiers: genPercentTiers(0.01, 0.04, 1.35),
  },

  // === SPEED ===
  {
    id: "prefix_attack_speed",
    stat: "attackSpeed",
    nameTemplate: "{tier} Swiftness",
    tags: ["weapon", "jewelry"],
    weight: 8,
    isPercent: true,
    tiers: genPercentTiers(0.02, 0.04, 1.3),
  },
  {
    id: "prefix_cast_speed",
    stat: "castSpeed",
    nameTemplate: "{tier} Haste",
    tags: ["weapon", "jewelry"],
    weight: 6,
    isPercent: true,
    tiers: genPercentTiers(0.02, 0.04, 1.3),
  },

  // === PENETRATION ===
  {
    id: "prefix_armor_pen",
    stat: "armorPen",
    nameTemplate: "{tier} Piercing",
    tags: ["weapon"],
    weight: 6,
    tiers: genFlatTiers(2, 5, 1.4),
  },
  {
    id: "prefix_magic_pen",
    stat: "magicPen",
    nameTemplate: "{tier} Spellbreaking",
    tags: ["weapon", "jewelry"],
    weight: 5,
    tiers: genFlatTiers(2, 5, 1.4),
  },

  // === LIFE STEAL ===
  {
    id: "prefix_lifesteal",
    stat: "lifeSteal",
    nameTemplate: "{tier} Vampirism",
    tags: ["weapon"],
    weight: 5,
    isPercent: true,
    tiers: genPercentTiers(0.01, 0.02, 1.32),
  },
];

// =====================================================
// TIERED AFFIX POOL - Suffixes (Defensive/Utility)
// =====================================================
export const TIERED_SUFFIX_POOL = [
  // === HEALTH & DEFENSE ===
  {
    id: "suffix_hp",
    stat: "hp",
    nameTemplate: "of {tier} Life",
    tags: ["armor"],
    weight: 10,
    tiers: genFlatTiers(10, 25, 1.42),
  },
  {
    id: "suffix_defense",
    stat: "defense",
    nameTemplate: "of {tier} Protection",
    tags: ["armor"],
    weight: 10,
    tiers: genFlatTiers(5, 12, 1.4),
  },
  {
    id: "suffix_mana",
    stat: "mana",
    nameTemplate: "of {tier} Essence",
    tags: ["armor", "jewelry"],
    weight: 10,
    tiers: genFlatTiers(8, 20, 1.4),
  },
  {
    id: "suffix_hp_regen",
    stat: "hpRegen",
    nameTemplate: "of {tier} Regeneration",
    tags: ["armor", "jewelry"],
    weight: 8,
    tiers: genFlatTiers(1, 3, 1.42),
  },
  {
    id: "suffix_mana_regen",
    stat: "manaRegen",
    nameTemplate: "of {tier} Clarity",
    tags: ["armor", "jewelry"],
    weight: 8,
    tiers: genFlatTiers(1, 2, 1.42),
  },

  // === RESISTANCES ===
  {
    id: "suffix_fire_resist",
    stat: "fireResist",
    nameTemplate: "of {tier} Fire Warding",
    tags: ["armor", "jewelry"],
    weight: 6,
    isPercent: true,
    tiers: genPercentTiers(0.03, 0.06, 1.3),
  },
  {
    id: "suffix_ice_resist",
    stat: "iceResist",
    nameTemplate: "of {tier} Frost Warding",
    tags: ["armor", "jewelry"],
    weight: 6,
    isPercent: true,
    tiers: genPercentTiers(0.03, 0.06, 1.3),
  },
  {
    id: "suffix_lightning_resist",
    stat: "lightningResist",
    nameTemplate: "of {tier} Storm Warding",
    tags: ["armor", "jewelry"],
    weight: 6,
    isPercent: true,
    tiers: genPercentTiers(0.03, 0.06, 1.3),
  },
  {
    id: "suffix_poison_resist",
    stat: "poisonResist",
    nameTemplate: "of {tier} Antidote",
    tags: ["armor", "jewelry"],
    weight: 6,
    isPercent: true,
    tiers: genPercentTiers(0.03, 0.06, 1.3),
  },
  {
    id: "suffix_all_resist",
    stat: "allResist",
    nameTemplate: "of {tier} the Bulwark",
    tags: ["armor"],
    weight: 3,
    isPercent: true,
    tiers: genPercentTiers(0.02, 0.04, 1.28),
  },

  // === UTILITY ===
  {
    id: "suffix_move_speed",
    stat: "moveSpeed",
    nameTemplate: "of {tier} the Wind",
    tags: ["armor", "jewelry"],
    weight: 8,
    isPercent: true,
    tiers: genPercentTiers(0.02, 0.04, 1.28),
  },
  {
    id: "suffix_evasion",
    stat: "evasion",
    nameTemplate: "of {tier} Evasion",
    tags: ["armor"],
    weight: 6,
    tiers: genFlatTiers(3, 8, 1.4),
  },
  {
    id: "suffix_dodge",
    stat: "dodgeChance",
    nameTemplate: "of {tier} Avoidance",
    tags: ["armor", "jewelry"],
    weight: 5,
    isPercent: true,
    tiers: genPercentTiers(0.01, 0.02, 1.28),
  },
  {
    id: "suffix_block",
    stat: "blockChance",
    nameTemplate: "of {tier} Blocking",
    tags: ["armor"],
    weight: 6,
    isPercent: true,
    tiers: genPercentTiers(0.02, 0.04, 1.28),
  },
  {
    id: "suffix_cdr",
    stat: "cooldownReduction",
    nameTemplate: "of {tier} Efficiency",
    tags: ["armor", "jewelry"],
    weight: 5,
    isPercent: true,
    tiers: genPercentTiers(0.02, 0.04, 1.26),
  },
  {
    id: "suffix_resource_cost",
    stat: "resourceCostReduction",
    nameTemplate: "of {tier} Conservation",
    tags: ["armor", "jewelry"],
    weight: 5,
    isPercent: true,
    tiers: genPercentTiers(0.02, 0.04, 1.26),
  },
  {
    id: "suffix_magic_find",
    stat: "magicFind",
    nameTemplate: "of {tier} Fortune",
    tags: ["jewelry"],
    weight: 4,
    isPercent: true,
    tiers: genPercentTiers(0.03, 0.06, 1.32),
  },
  {
    id: "suffix_gold_find",
    stat: "goldFind",
    nameTemplate: "of {tier} Greed",
    tags: ["jewelry"],
    weight: 4,
    isPercent: true,
    tiers: genPercentTiers(0.05, 0.1, 1.3),
  },
  {
    id: "suffix_xp_bonus",
    stat: "xpBonus",
    nameTemplate: "of {tier} Experience",
    tags: ["jewelry"],
    weight: 3,
    isPercent: true,
    tiers: genPercentTiers(0.03, 0.06, 1.28),
  },
  {
    id: "suffix_cc_resist",
    stat: "ccResist",
    nameTemplate: "of {tier} Tenacity",
    tags: ["armor"],
    weight: 5,
    isPercent: true,
    tiers: genPercentTiers(0.05, 0.1, 1.28),
  },
];

// =====================================================
// AFFIX TIER UTILITIES
// =====================================================

/**
 * Get tier data for an affix at a specific item level
 */
export function getAffixTierData(affix, itemLevel) {
  const maxTier = Math.min(10, Math.ceil(itemLevel / 10));
  const tierData =
    affix.tiers.find((t) => t.tier === maxTier) || affix.tiers[0];
  return { ...tierData, maxTier };
}

/**
 * Roll affix value with support for Exalted (+25%) and Perfect (max) rolls
 */
export function rollTieredAffixValue(
  tierData,
  isPerfect = false,
  isExalted = false,
) {
  let { minVal, maxVal } = tierData;

  // Exalted items get +25% extended range
  if (isExalted) {
    const range = maxVal - minVal;
    maxVal = maxVal + range * 0.25;
  }

  // Perfect roll = max value
  if (isPerfect) {
    return maxVal;
  }

  // Standard roll
  if (tierData.isPercent || maxVal < 1) {
    return Math.round((random() * (maxVal - minVal) + minVal) * 100) / 100;
  }
  return randomInt(minVal, maxVal);
}

/**
 * Get affix display name with tier
 */
export function getAffixDisplayName(affix, tier) {
  const tierName = TIER_NAMES[tier];
  if (!tierName) return affix.nameTemplate.replace("{tier}", "");

  const name = affix.type === "prefix" ? tierName.prefix : tierName.suffix;

  return affix.nameTemplate.replace("{tier}", name);
}

/**
 * Get affixes filtered by tags
 */
export function getAffixesByTags(pool, tags, excludeIds = []) {
  return pool.filter(
    (affix) =>
      !excludeIds.includes(affix.id) &&
      (!affix.tags ||
        affix.tags.length === 0 ||
        tags.some((tag) => affix.tags.includes(tag))),
  );
}

// Export combined pool for legacy compatibility
const ALL_TIERED_AFFIXES = [...TIERED_PREFIX_POOL, ...TIERED_SUFFIX_POOL];
