// =================================================================
// RACE SYSTEM
// Handles scaling logic for race bonuses and passive abilities
// =================================================================

import { getRaceById } from './RaceRegistry.js';

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

  const newAttributes = { ...attributes };
  
  // Apply growth points
  // e.g. if str: 2, add 2 STR to the total
  for (const [stat, bonus] of Object.entries(race.statBonuses)) {
    if (newAttributes[stat] !== undefined) {
      newAttributes[stat] += bonus;
    }
  }

  return newAttributes;
}

/**
 * Calculates the total stats for a fresh character at Level 1
 * Includes Base (5) + Race Initial Bonus
 */
export function calculateInitialStats(raceId) {
  const BASE_STAT = 5;
  const race = getRaceById(raceId);
  
  const stats = {
    str: BASE_STAT,
    agi: BASE_STAT,
    dex: BASE_STAT,
    int: BASE_STAT,
    cha: BASE_STAT,
    will: BASE_STAT,
    luck: BASE_STAT,
    soul: BASE_STAT,
    freePoints: 0
  };

  if (race && race.statBonuses) {
    for (const [stat, bonus] of Object.entries(race.statBonuses)) {
      if (stats[stat] !== undefined) {
        // Initial bonus is applied once at Level 1
        stats[stat] += bonus;
      }
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
