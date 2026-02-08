// =================================================================
// RACE SYSTEM
// Handles scaling logic for race bonuses and passive abilities
// =================================================================

import { getRaceById } from "../../data/registries/RaceDataRegistry.js";
import {
  createAttributeBaseline,
  ensureAttributeShape,
  toCanonicalAttributeKey,
} from "../../constants/attributes.js";

/**
 * Applies the level-up stat growth for a specific race.
 * This is called every time the player levels up.
 *
 * @param {object} attributes - The current player attributes (e.g., { str: 10, agi: 5 ... })
 * @param {string} raceId - The ID of the player's race
 * @returns {object} The updated attributes with the race growth applied
 */
export function applyRaceLevelUpGrowth(attributes, raceId) {
  const race = getRaceById(raceId);
  if (!race || !race.statBonuses) return attributes;

  const base = ensureAttributeShape(attributes, 0);
  const next = {
    ...base,
    freePoints: attributes?.freePoints ?? base.freePoints ?? 0,
  };

  for (const [stat, bonus] of Object.entries(race.statBonuses)) {
    const canonicalKey = toCanonicalAttributeKey(stat);
    if (!canonicalKey) continue;
    next[canonicalKey] = (next[canonicalKey] || 0) + bonus;
  }

  return next;
}

/**
 * Calculates the total stats for a fresh character at Level 1
 * Includes Base (5) + Race Initial Bonus
 */
export function calculateInitialStats(raceId) {
  const BASE_STAT = 5;
  const race = getRaceById(raceId);

  const stats = {
    ...createAttributeBaseline(BASE_STAT),
    freePoints: 0,
  };

  if (race && race.statBonuses) {
    for (const [stat, bonus] of Object.entries(race.statBonuses)) {
      const canonicalKey = toCanonicalAttributeKey(stat);
      if (!canonicalKey) continue;
      stats[canonicalKey] = (stats[canonicalKey] || BASE_STAT) + bonus;
    }
  }

  return stats;
}

/**
 * Returns the passive effect configuration for a race
 * This can be used by the Combat System or Game Logic to apply buffs
 */
export function getRacePassiveEffect(raceId) {
  const race = getRaceById(raceId);
  if (!race || !race.passiveAbility) return null;
  return race.passiveAbility;
}
