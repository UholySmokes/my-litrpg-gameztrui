export const DEFAULT_XP_BRACKETS = [
  { end: 10, base: 100, growth: 1.15 },
  { end: 25, base: 200, growth: 1.18 },
  { end: 50, base: 500, growth: 1.2 },
  { end: 100, base: 1500, growth: 1.22 },
  { end: 200, base: 5000, growth: 1.25 },
  { end: 350, base: 20000, growth: 1.15 },
  { end: 500, base: 50000, growth: 1.1 },
  { end: 1000, base: 100000, growth: 1.05 },
];

export const DEFAULT_XP_DELTA_CONFIG = {
  bonusPerLevel: 0.2,
  malusPerLevel: 0.1,
  zeroBelow: 10,
  minMultiplier: 0.1,
};

export const DEFAULT_COMBAT_LANE_CONFIG = {
  minLane: 1,
  fallbackMaxLane: 3,
  oneGapMultiplier: 0.85,
  multiGapMultiplier: 0.7,
};

export const DEFAULT_ELEMENTAL_REACTIONS = [
  {
    element: "fire",
    requires: ["wet"],
    multiplier: 1.15,
    remove: ["wet"],
    addEffects: [{ id: "obscured", target: "enemy", duration: 2, magnitude: 0.25 }],
    message: "Elemental Reaction: Steam!",
  },
  {
    element: "fire",
    requires: ["frostbite", "freeze"],
    multiplier: 1.25,
    remove: ["frostbite", "freeze"],
    addEffects: [{ id: "burn", target: "enemy", duration: 2, magnitude: 6 }],
    message: "Elemental Reaction: Melt!",
  },
  {
    element: "ice",
    requires: ["burn"],
    multiplier: 1.2,
    remove: ["burn"],
    addEffects: [{ id: "slow", target: "enemy", duration: 2, magnitude: -0.2 }],
    message: "Elemental Reaction: Quench!",
  },
  {
    element: "ice",
    requires: ["wet"],
    multiplier: 1.2,
    remove: ["wet"],
    addEffects: [{ id: "freeze", target: "enemy", duration: 1 }],
    message: "Elemental Reaction: Flash Freeze!",
  },
  {
    element: "lightning",
    requires: ["frostbite", "slow"],
    multiplier: 1.2,
    addEffects: [{ id: "shock", target: "enemy", duration: 2, magnitude: 0.1 }],
    message: "Elemental Reaction: Conduction!",
  },
  {
    element: "lightning",
    requires: ["wet"],
    multiplier: 1.25,
    addEffects: [{ id: "shock", target: "enemy", duration: 2, magnitude: 0.1 }],
    message: "Elemental Reaction: Electro-Charged!",
  },
  {
    element: "nature",
    requires: ["burn"],
    multiplier: 1.15,
    addEffects: [{ id: "poison", target: "enemy", duration: 3, magnitude: 4 }],
    message: "Elemental Reaction: Wildfire Spores!",
  },
  {
    element: "water",
    requires: ["burn"],
    multiplier: 1.15,
    remove: ["burn"],
    addEffects: [
      { id: "wet", target: "enemy", duration: 3, magnitude: 1 },
      { id: "slow", target: "enemy", duration: 2, magnitude: -0.15 },
    ],
    message: "Elemental Reaction: Douse!",
  },
  {
    element: "holy",
    requires: ["curse"],
    multiplier: 1.25,
    remove: ["curse"],
    addEffects: [
      { id: "radiant_mark", target: "enemy", duration: 3, magnitude: 0.12 },
    ],
    message: "Elemental Reaction: Purge!",
  },
  {
    element: "dark",
    requires: ["radiant_mark"],
    multiplier: 1.25,
    remove: ["radiant_mark"],
    addEffects: [{ id: "curse", target: "enemy", duration: 3, magnitude: 0.12 }],
    message: "Elemental Reaction: Eclipse!",
  },
];

export function getBalanceConfig(config = {}) {
  return {
    xpBrackets: Array.isArray(config?.xpBrackets) && config.xpBrackets.length > 0
      ? config.xpBrackets
      : DEFAULT_XP_BRACKETS,
    xpDelta: {
      ...DEFAULT_XP_DELTA_CONFIG,
      bonusPerLevel: config?.xpBonusPerLevelDiff ?? DEFAULT_XP_DELTA_CONFIG.bonusPerLevel,
      malusPerLevel: config?.xpMalusPerLevelDiff ?? DEFAULT_XP_DELTA_CONFIG.malusPerLevel,
      zeroBelow: config?.xpNoRewardBelowDelta ?? DEFAULT_XP_DELTA_CONFIG.zeroBelow,
      minMultiplier: config?.xpMinMultiplier ?? DEFAULT_XP_DELTA_CONFIG.minMultiplier,
    },
    combatLane: {
      ...DEFAULT_COMBAT_LANE_CONFIG,
      ...(config?.combatLaneConfig || {}),
    },
    elementalReactions:
      Array.isArray(config?.elementalReactions) && config.elementalReactions.length > 0
        ? config.elementalReactions
        : DEFAULT_ELEMENTAL_REACTIONS,
  };
}

export function describeBalanceConfig(config = {}) {
  const resolved = getBalanceConfig(config);
  return {
    xpBracketCount: resolved.xpBrackets.length,
    xpTierRange: {
      minEnd: resolved.xpBrackets[0]?.end ?? null,
      maxEnd: resolved.xpBrackets[resolved.xpBrackets.length - 1]?.end ?? null,
    },
    xpDelta: resolved.xpDelta,
    combatLane: resolved.combatLane,
    elementalReactionCount: resolved.elementalReactions.length,
  };
}
