import {
  DEFAULT_XP_BRACKETS,
  getBalanceConfig,
} from "../data/balance/balanceConfig.js";
const SAFE_MAX = Number.MAX_SAFE_INTEGER;

// Default bracket configuration (piecewise exponential)
// Keep this aligned with system_specs.md unless the spec is updated.
const defaultBrackets = DEFAULT_XP_BRACKETS;

function getBrackets(config) {
  return getBalanceConfig(config).xpBrackets || defaultBrackets;
}

function getDeltaConfig(config) {
  return getBalanceConfig(config).xpDelta;
}

function clampSafe(value) {
  if (!Number.isFinite(value)) return SAFE_MAX;
  if (value > SAFE_MAX) return SAFE_MAX;
  if (value < 0) return 0;
  return Math.floor(value);
}

/**
 * Returns XP required to go from (level) to (level+1)
 */
export function xpForNextLevel(level, config) {
  if (level < 1) return 0;
  const brackets = getBrackets(config);
  let prevEnd = 0;

  for (const bracket of brackets) {
    const start = prevEnd;
    const end = bracket.end;
    const base = bracket.base;
    const growth = bracket.growth;

    // Compute XP in this bracket
    if (level <= end) {
      const idx = level - start;
      const value = Math.floor(base * Math.pow(growth, idx - 1));
      return clampSafe(value);
    } else {
      prevEnd = end;
    }
  }

  // If beyond final bracket, extend with the last growth rate
  const last = brackets[brackets.length - 1];
  const idx = level - last.end;
  const value = Math.floor(last.base * Math.pow(last.growth, idx));
  return clampSafe(value);
}

/**
 * Total XP required to REACH a level (cumulative).
 */
export function xpToReachLevel(level, config) {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForNextLevel(i, config);
    if (!Number.isSafeInteger(total)) {
      total = SAFE_MAX;
      break;
    }
  }
  return clampSafe(total);
}

/**
 * Level-delta XP calculation with configurable bonus/malus.
 */
export function calculateGainedXP(playerLevel, mobLevel, baseXP, config) {
  const { bonusPerLevel, malusPerLevel, zeroBelow, minMultiplier } =
    getDeltaConfig(config);
  const levelDiff = (mobLevel ?? playerLevel) - (playerLevel ?? 1);

  if (levelDiff < -zeroBelow) {
    return 0;
  }

  let multiplier = 1;
  if (levelDiff > 0) {
    multiplier += bonusPerLevel * levelDiff;
  } else if (levelDiff < 0) {
    multiplier += malusPerLevel * levelDiff; // levelDiff negative => subtract
  }

  multiplier = Math.max(multiplier, minMultiplier);
  const xp = Math.floor((baseXP ?? 0) * multiplier);
  return clampSafe(xp);
}
