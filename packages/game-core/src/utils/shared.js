/**
 * Shared utility functions consolidated from across the codebase.
 */

const MULTIPLIER_FLOOR = 0.1;
const MULTIPLIER_CEIL = 5;

export const DEFAULT_PROGRESSION_MODIFIERS = Object.freeze({
  xpGainMultiplier: 1,
  questRewardMultiplier: 1,
  goldGainMultiplier: 1,
  resourceGainMultiplier: 1,
  skillGrowthMultiplier: 1,
  resourceCapMultiplier: 1,
  lootQualityBonus: 0,
  classEvolutionStepReduction: 0,
  riskScale: 0,
});

const DEFAULT_ARCETYPE_IMPACT = Object.freeze({
  xpGainMultiplier: 0,
  questRewardMultiplier: 0,
  goldGainMultiplier: 0,
  resourceGainMultiplier: 0,
  skillGrowthMultiplier: 0,
  resourceCapMultiplier: 0,
  lootQualityBonus: 0,
  classEvolutionStepReduction: 0,
  riskScale: 0,
});

/**
 * Check whether a value is a plain object (not null, not an array).
 */
export function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Safely convert a value to a finite number, returning a fallback if conversion fails.
 */
export function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const impactToMultiplierFallback = (impact, key) =>
  1 + Math.max(-0.95, toNumber(impact?.[key], DEFAULT_ARCETYPE_IMPACT[key]));

/**
 * Normalize progression modifiers into a stable, bounded structure.
 * Multipliers are absolute factors (1 = no change), additive fields are raw deltas.
 */
export function normalizeProgressionModifiers(rawModifiers, archetypeImpact) {
  const source = isPlainObject(rawModifiers) ? rawModifiers : {};
  const impact = isPlainObject(archetypeImpact) ? archetypeImpact : {};

  return {
    xpGainMultiplier: clamp(
      toNumber(
        source.xpGainMultiplier,
        impactToMultiplierFallback(impact, "xpGainMultiplier"),
      ),
      MULTIPLIER_FLOOR,
      MULTIPLIER_CEIL,
    ),
    questRewardMultiplier: clamp(
      toNumber(
        source.questRewardMultiplier,
        impactToMultiplierFallback(impact, "questRewardMultiplier"),
      ),
      MULTIPLIER_FLOOR,
      MULTIPLIER_CEIL,
    ),
    goldGainMultiplier: clamp(
      toNumber(
        source.goldGainMultiplier,
        impactToMultiplierFallback(impact, "goldGainMultiplier"),
      ),
      MULTIPLIER_FLOOR,
      MULTIPLIER_CEIL,
    ),
    resourceGainMultiplier: clamp(
      toNumber(
        source.resourceGainMultiplier,
        impactToMultiplierFallback(impact, "resourceGainMultiplier"),
      ),
      MULTIPLIER_FLOOR,
      MULTIPLIER_CEIL,
    ),
    skillGrowthMultiplier: clamp(
      toNumber(
        source.skillGrowthMultiplier,
        impactToMultiplierFallback(impact, "skillGrowthMultiplier"),
      ),
      MULTIPLIER_FLOOR,
      MULTIPLIER_CEIL,
    ),
    resourceCapMultiplier: clamp(
      toNumber(
        source.resourceCapMultiplier,
        impactToMultiplierFallback(impact, "resourceCapMultiplier"),
      ),
      MULTIPLIER_FLOOR,
      MULTIPLIER_CEIL,
    ),
    lootQualityBonus: clamp(
      toNumber(
        source.lootQualityBonus,
        toNumber(impact.lootQualityBonus, DEFAULT_ARCETYPE_IMPACT.lootQualityBonus),
      ),
      -1,
      2,
    ),
    classEvolutionStepReduction: Math.max(
      0,
      Math.floor(
        toNumber(
          source.classEvolutionStepReduction,
          toNumber(
            impact.classEvolutionStepReduction,
            DEFAULT_ARCETYPE_IMPACT.classEvolutionStepReduction,
          ),
        ),
      ),
    ),
    riskScale: clamp(
      toNumber(source.riskScale, toNumber(impact.riskScale, DEFAULT_ARCETYPE_IMPACT.riskScale)),
      0,
      5,
    ),
  };
}

/**
 * Read normalized progression modifiers from a player snapshot.
 */
export function getProgressionModifiers(player) {
  const source = isPlainObject(player) ? player : {};
  const archetypeImpact = isPlainObject(source.archetypeSystem)
    ? source.archetypeSystem.progressionImpact
    : null;
  return normalizeProgressionModifiers(source.progressionModifiers, archetypeImpact);
}

/**
 * Scale positive reward values by a multiplier while keeping penalties unchanged.
 */
export function scalePositiveReward(value, multiplier, rounding = "ceil") {
  const numeric = toNumber(value, 0);
  if (numeric <= 0) return numeric;
  const factor = clamp(toNumber(multiplier, 1), 0, 10);
  const scaled = numeric * factor;
  if (rounding === "floor") return Math.floor(scaled);
  if (rounding === "round") return Math.round(scaled);
  return Math.ceil(scaled);
}

/**
 * Compute the required level for the next class evolution.
 * Requirement is always strictly increasing per evolution count.
 */
export function resolveClassEvolutionRequirement(
  config,
  evolutionCount,
  progressionModifiers,
) {
  const baseLevel = Math.max(1, Math.floor(toNumber(config?.classEvolutionLevel, 10)));
  const rawStep = Math.max(1, Math.floor(toNumber(config?.classEvolutionLevelStep, 5)));
  const safeCount = Math.max(0, Math.floor(toNumber(evolutionCount, 0)));
  const reduction = Math.max(
    0,
    Math.floor(toNumber(progressionModifiers?.classEvolutionStepReduction, 0)),
  );
  const effectiveStep = Math.max(1, rawStep - reduction);
  return baseLevel + safeCount * effectiveStep;
}

/**
 * Merge reward items into an inventory array, stacking by item id.
 */
export function mergeInventoryItems(inventory = [], items = []) {
  if (!Array.isArray(items) || items.length === 0) return [...inventory];
  const next = [...inventory];
  items.forEach((item) => {
    if (!item?.id) return;
    const quantity = toNumber(item.quantity, 1);
    const index = next.findIndex((entry) => entry.id === item.id);
    if (index >= 0) {
      const existing = next[index];
      next[index] = {
        ...existing,
        quantity: toNumber(existing.quantity, 0) + quantity,
      };
    } else {
      next.push({ ...item, quantity });
    }
  });
  return next;
}
