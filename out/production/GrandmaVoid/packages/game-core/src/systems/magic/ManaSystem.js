/**
 * Mana Consumption System
 * Handles mana validation, consumption, and feedback for skill usage
 */

import { calculateManaCost, validateManaCost } from "./ManaBalance.js";

/**
 * Mana consumption result
 * @typedef {Object} ManaConsumptionResult
 * @property {boolean} success - Whether mana was successfully consumed
 * @property {number} manaConsumed - Amount of mana consumed
 * @property {number} remainingMana - Player's remaining mana
 * @property {string} error - Error message if consumption failed
 * @property {Object} feedback - Visual/audio feedback data
 */

/**
 * Attempt to consume mana for a skill
 * @param {Object} skill - Skill definition
 * @param {Object} player - Player state
 * @param {Object} options - Consumption options
 * @returns {ManaConsumptionResult}
 */
export function consumeMana(skill, player, options = {}) {
  const {
    allowPartial = false,
    showFeedback = true,
    scaleWithLevel = true,
  } = options;

  try {
    // Calculate actual mana cost
    const manaCost = scaleWithLevel
      ? calculateManaCost(skill, player.level)
      : skill.manaCost || 10;

    // Validate mana availability
    const validation = validateManaCost(manaCost, player);

    if (!validation.canCast && !allowPartial) {
      return {
        success: false,
        manaConsumed: 0,
        remainingMana: validation.currentMana,
        error: `Insufficient mana. Need ${manaCost}, have ${validation.currentMana}`,
        feedback: showFeedback
          ? createInsufficientFeedback(manaCost, validation)
          : null,
      };
    }

    // Handle partial consumption if allowed
    const actualConsumption = allowPartial
      ? Math.min(manaCost, validation.currentMana)
      : manaCost;

    const remainingMana = Math.max(
      0,
      validation.currentMana - actualConsumption,
    );

    return {
      success: true,
      manaConsumed: actualConsumption,
      remainingMana,
      error: null,
      feedback: showFeedback
        ? createConsumptionFeedback(actualConsumption, remainingMana, player)
        : null,
    };
  } catch (error) {
    return {
      success: false,
      manaConsumed: 0,
      remainingMana: player.mana?.current || 0,
      error: `Mana consumption error: ${error.message}`,
      feedback: null,
    };
  }
}

/**
 * Create visual feedback for successful mana consumption
 */
function createConsumptionFeedback(manaConsumed, remainingMana, player) {
  const maxMana = player.mana?.max || 50;
  const percentage = (remainingMana / maxMana) * 100;

  return {
    type: "consumption",
    manaConsumed,
    remainingMana,
    percentage,
    animation: "mana-consume",
    color: percentage < 20 ? "warning" : "normal",
    intensity: manaConsumed > 50 ? "high" : "medium",
  };
}

/**
 * Create visual feedback for insufficient mana
 */
function createInsufficientFeedback(requiredMana, validation) {
  return {
    type: "insufficient",
    requiredMana,
    currentMana: validation.currentMana,
    manaDeficit: validation.manaDeficit,
    animation: "mana-insufficient",
    color: "error",
    intensity: "high",
  };
}

/**
 * Regenerate mana over time
 * @param {Object} player - Player state
 * @param {number} amount - Amount to regenerate
 * @param {Object} options - Regeneration options
 * @returns {Object} New player state with updated mana
 */
export function regenerateMana(player, amount, options = {}) {
  const { respectMax = true, showFeedback = true } = options;

  const currentMana = player.mana?.current || 0;
  const maxMana = player.mana?.max || 50;

  const newMana = respectMax
    ? Math.min(currentMana + amount, maxMana)
    : currentMana + amount;

  const regeneratedAmount = newMana - currentMana;

  return {
    ...player,
    mana: {
      ...player.mana,
      current: newMana,
    },
    feedback:
      showFeedback && regeneratedAmount > 0
        ? createRegenerationFeedback(regeneratedAmount, newMana, maxMana)
        : null,
  };
}

/**
 * Create visual feedback for mana regeneration
 */
function createRegenerationFeedback(amount, current, max) {
  const percentage = (current / max) * 100;

  return {
    type: "regeneration",
    amount,
    current,
    max,
    percentage,
    animation: "mana-regen",
    color: percentage > 80 ? "full" : "normal",
    intensity: amount > 20 ? "high" : "low",
  };
}

/**
 * Calculate mana cost with all modifiers
 * @param {Object} skill - Skill definition
 * @param {Object} player - Player state
 * @param {Object} modifiers - Additional modifiers
 * @returns {Object} Detailed cost breakdown
 */
export function calculateDetailedManaCost(skill, player, modifiers = {}) {
  const baseCost = skill.manaCost || 10;
  const level = player.level || 1;

  // Apply balance calculations
  const balancedCost = calculateManaCost(skill, level);

  // Apply additional modifiers
  const finalCost = Math.max(
    1,
    Math.round(
      balancedCost * (modifiers.costMultiplier || 1) +
        (modifiers.flatReduction || 0),
    ),
  );

  return {
    baseCost,
    balancedCost,
    finalCost,
    modifiers,
    breakdown: {
      base: baseCost,
      levelScaling: balancedCost - baseCost,
      modifiers: finalCost - balancedCost,
      total: finalCost,
    },
  };
}

/**
 * Check if player can afford a skill
 * @param {Object} skill - Skill definition
 * @param {Object} player - Player state
 * @param {Object} options - Check options
 * @returns {Object} Affordability check result
 */
export function canAffordSkill(skill, player, options = {}) {
  const { includeFeedback = true } = options;

  const manaCost = calculateManaCost(skill, player.level);
  const validation = validateManaCost(manaCost, player);

  return {
    canAfford: validation.canCast,
    manaCost,
    currentMana: validation.currentMana,
    percentage: validation.percentage,
    feedback:
      includeFeedback && !validation.canCast
        ? createInsufficientFeedback(manaCost, validation)
        : null,
  };
}

/**
 * Get mana efficiency rating for a skill
 * @param {Object} skill - Skill definition
 * @param {Object} player - Player state
 * @returns {Object} Efficiency rating
 */
export function getManaEfficiency(skill, player) {
  const manaCost = calculateManaCost(skill, player.level);
  const maxMana = player.mana?.max || 50;

  // Handle edge case of zero max mana
  if (maxMana === 0) {
    return {
      rating: "poor",
      costPercentage: 100,
      manaCost,
      maxMana: 0,
      recommendation: "Cannot cast - no mana pool",
    };
  }

  // Calculate efficiency based on cost vs max mana
  const costPercentage = (manaCost / maxMana) * 100;

  let rating = "poor";
  if (costPercentage <= 10) rating = "excellent";
  else if (costPercentage <= 20) rating = "good";
  else if (costPercentage <= 35) rating = "fair";
  else if (costPercentage <= 50) rating = "poor";

  return {
    rating,
    costPercentage,
    manaCost,
    maxMana,
    recommendation: getEfficiencyRecommendation(rating, costPercentage),
  };
}

/**
 * Get efficiency recommendation
 */
function getEfficiencyRecommendation(rating) {
  const recommendations = {
    excellent: "Very efficient - spam freely",
    good: "Efficient - use regularly",
    fair: "Moderate cost - use strategically",
    poor: "Expensive - use sparingly",
  };

  return recommendations[rating] || "Very expensive - use only when necessary";
}
