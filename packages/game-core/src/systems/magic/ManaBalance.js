/**
 * Mana Cost Balance System
 * Balanced mana costs for 1000-level LitRPG with exponential scaling
 */

const FALLBACK_MANA_COST_TIERS = {
  // Basic utility (1-20 mana)
  TIER_1: { min: 1, max: 20, description: "Basic attacks and utility" },

  // Standard abilities (21-50 mana)
  TIER_2: { min: 21, max: 50, description: "Core combat abilities" },

  // Powerful abilities (51-100 mana)
  TIER_3: { min: 51, max: 100, description: "Strong AoE and control" },

  // Ultimate abilities (101-200 mana)
  TIER_4: { min: 101, max: 200, description: "High-impact ultimates" },

  // Epic abilities (201-500 mana)
  TIER_5: { min: 201, max: 500, description: "Game-changing effects" },

  // Legendary abilities (501-1000 mana)
  TIER_6: { min: 501, max: 1000, description: "Reality-bending powers" },

  // Cosmic abilities (1000+ mana)
  TIER_7: { min: 1001, max: 5000, description: "World-altering magic" },
};

const FALLBACK_MANA_COST_MULTIPLIERS = {
  // Level scaling multipliers (exponential growth)
  LEVEL_MULTIPLIERS: {
    1: 1.0, // Level 1-100
    101: 1.5, // Level 101-200
    201: 2.0, // Level 201-300
    301: 3.0, // Level 301-400
    401: 5.0, // Level 401-500
    501: 8.0, // Level 501-600
    601: 13.0, // Level 601-700
    701: 21.0, // Level 701-800
    801: 34.0, // Level 801-900
    901: 55.0, // Level 901-1000
  },

  // Skill type multipliers
  TYPE_MULTIPLIERS: {
    instant: 1.0, // Immediate effects
    channel: 0.8, // Channelled over time
    dot: 0.6, // Damage over time
    aoe: 1.3, // Area of effect
    single_target: 1.0, // Single target
    buff: 0.7, // Buffs
    debuff: 0.9, // Debuffs
    heal: 1.1, // Healing
    utility: 0.5, // Utility skills
  },

  // Cooldown efficiency (longer cooldown = lower cost)
  COOLDOWN_EFFICIENCY: {
    0: 1.5, // No cooldown
    1: 1.2, // 1 turn
    3: 1.0, // 3 turns (baseline)
    5: 0.9, // 5 turns
    10: 0.8, // 10 turns
    20: 0.7, // 20 turns
    30: 0.6, // 30 turns
    60: 0.5, // 60 turns
    120: 0.4, // 120+ turns
  },
};

function getManaCostTiers(state) {
  return state?.config?.magicBalance?.manaCostTiers || FALLBACK_MANA_COST_TIERS;
}

function getManaCostMultipliers(state) {
  return state?.config?.magicBalance?.manaCostMultipliers || FALLBACK_MANA_COST_MULTIPLIERS;
}

/**
 * Calculate balanced mana cost for a skill
 * @param {Object} skill - Skill definition
 * @param {number} playerLevel - Player level
 * @param {Object} state - Game state for config access
 * @returns {number} Balanced mana cost
 */
export function calculateManaCost(skill, playerLevel = 1, state = {}) {
  const baseCost = skill?.manaCost || 10;
  const multipliers = getManaCostMultipliers(state);

  // Apply level scaling
  const levelMultiplier = getLevelMultiplier(playerLevel, state);

  // Apply type multiplier
  const typeMultiplier = getTypeMultiplier(skill, state);

  // Apply cooldown efficiency
  const cooldownMultiplier = getCooldownMultiplier(skill?.cooldown || 0, state);

  // Calculate final cost
  let finalCost =
    baseCost * levelMultiplier * typeMultiplier * cooldownMultiplier;

  // Round to nearest integer
  return Math.max(1, Math.round(finalCost));
}

/**
 * Get level-based multiplier
 */
function getLevelMultiplier(level, state) {
  const multipliers = getManaCostMultipliers(state);
  const tiers = Object.keys(multipliers.LEVEL_MULTIPLIERS)
    .map(Number)
    .sort((a, b) => b - a);

  for (const tier of tiers) {
    if (level >= tier) {
      return multipliers.LEVEL_MULTIPLIERS[tier];
    }
  }

  return 1.0;
}

/**
 * Get type-based multiplier
 */
function getTypeMultiplier(skill, state) {
  if (!skill) return 1.0;
  const multipliers = getManaCostMultipliers(state);

  // Determine skill type from effects and properties
  let type = "instant";

  if (skill.effects) {
    if (skill.effects.some((e) => e.duration > 1)) {
      type = "dot";
    }
    if (skill.effects.some((e) => e.id === "buff" || e.id === "might")) {
      type = "buff";
    }
    if (skill.effects.some((e) => e.id === "debuff" || e.id === "slow")) {
      type = "debuff";
    }
    if (skill.effects.some((e) => e.id === "heal")) {
      type = "heal";
    }
  }

  if (skill.tags) {
    if (skill.tags.includes("AoE")) type = "aoe";
    if (skill.tags.includes("Utility")) type = "utility";
    if (skill.tags.includes("Heal")) type = "heal";
  }

  return multipliers.TYPE_MULTIPLIERS[type] || 1.0;
}

/**
 * Get cooldown-based multiplier
 */
function getCooldownMultiplier(cooldown, state) {
  const multipliers = getManaCostMultipliers(state);
  const tiers = Object.keys(multipliers.COOLDOWN_EFFICIENCY)
    .map(Number)
    .sort((a, b) => b - a);

  for (const tier of tiers) {
    if (cooldown >= tier) {
      return multipliers.COOLDOWN_EFFICIENCY[tier];
    }
  }

  return 1.0;
}

/**
 * Validate mana cost against player resources
 * @param {number} manaCost - Skill mana cost
 * @param {Object} player - Player state
 * @returns {Object} Validation result
 */
export function validateManaCost(manaCost, player) {
  const currentMana = player.mana?.current || 0;
  const maxMana = player.mana?.max || 50;

  return {
    canCast: currentMana >= manaCost,
    currentMana,
    requiredMana: manaCost,
    manaDeficit: Math.max(0, manaCost - currentMana),
    percentage: (currentMana / maxMana) * 100,
  };
}

/**
 * Get mana cost tier for display
 * @param {number} manaCost - Mana cost
 * @param {Object} state - Game state for config access
 * @returns {string} Tier description
 */
export function getManaCostTier(manaCost, state = {}) {
  const tiers = getManaCostTiers(state);
  const tierEntries = Object.entries(tiers).sort(
    (a, b) => a[1].min - b[1].min,
  );

  for (const [, data] of tierEntries) {
    if (manaCost <= data.max) {
      return data.description;
    }
  }

  return "World-altering magic";
}
