/**
 * Deterministic Random Number Generator Adapter
 * Provides a drop-in replacement for Math.random() that uses seeded PRNG when available
 *
 * Usage: Replace Math.random() with random() from this module
 */

import { SimBridge } from "../simulation/bridge/SimulationBridge.js";

/**
 * Get random number (0-1) - uses simulation bridge if active
 */
export function random() {
  return SimBridge.random();
}

/**
 * Get random integer between min and max (inclusive)
 */
export function randomInt(min, max) {
  return SimBridge.randomInt(min, max);
}

/**
 * Get random float between min and max
 */
export function randomFloat(min, max) {
  return SimBridge.randomFloat(min, max);
}

/**
 * Get random boolean with given probability
 */
export function randomBool(probability = 0.5) {
  return SimBridge.randomBool(probability);
}

/**
 * Pick random element from array
 */
export function randomChoice(array) {
  return SimBridge.randomChoice(array);
}

/**
 * Weighted random selection
 */
export function weightedRandom(items) {
  if (!items || items.length === 0) return null;
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
  let rand = random() * totalWeight;
  for (const item of items) {
    if (rand < (item.weight || 1)) {
      return item;
    }
    rand -= item.weight || 1;
  }
  return items[items.length - 1];
}

/**
 * Roll dice (e.g., rollDice(2, 6) for 2d6)
 */
export function rollDice(count, sides) {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += randomInt(1, sides);
  }
  return total;
}

/**
 * Shuffle array using Fisher-Yates algorithm with deterministic random
 */
export function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
