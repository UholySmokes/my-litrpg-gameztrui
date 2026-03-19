/**
 * Auto-stat allocation presets.
 * Each preset defines weight ratios for distributing attribute points.
 */
export const STAT_PRESETS = {
  balanced: {
    name: 'Balanced',
    description: 'Distribute points evenly across all stats',
    weights: {
      strength: 1, agility: 1, dexterity: 1, vitality: 1, intelligence: 1,
      wisdom: 1, charisma: 1, willpower: 1, luck: 1, soul: 1,
    },
  },
  offensive: {
    name: 'Offensive',
    description: 'Focus on damage-dealing stats',
    weights: {
      strength: 3, agility: 2, dexterity: 2, vitality: 1, intelligence: 1,
      wisdom: 0, charisma: 0, willpower: 0, luck: 1, soul: 0,
    },
  },
  defensive: {
    name: 'Defensive',
    description: 'Focus on survivability',
    weights: {
      strength: 1, agility: 1, dexterity: 0, vitality: 3, intelligence: 0,
      wisdom: 2, charisma: 0, willpower: 2, luck: 0, soul: 1,
    },
  },
  caster: {
    name: 'Caster',
    description: 'Focus on magical power',
    weights: {
      strength: 0, agility: 1, dexterity: 0, vitality: 1, intelligence: 3,
      wisdom: 2, charisma: 0, willpower: 2, luck: 0, soul: 1,
    },
  },
};

/**
 * Allocate N attribute points according to a preset or custom weights.
 * Returns an object with the number of points to add to each attribute.
 * Uses weighted proportional distribution with remainder to highest-weighted.
 *
 * @param {number} points - Number of attribute points to distribute.
 * @param {string|object} presetOrWeights - Preset key or custom weights object.
 * @returns {object} Map of attribute → points allocated.
 */
export function allocatePoints(points, presetOrWeights) {
  const weights = typeof presetOrWeights === 'string'
    ? STAT_PRESETS[presetOrWeights]?.weights
    : presetOrWeights;

  if (!weights || points <= 0) return {};

  const attrs = Object.keys(weights).filter(k => weights[k] > 0);
  if (attrs.length === 0) return {};

  const totalWeight = attrs.reduce((sum, k) => sum + weights[k], 0);
  const allocation = {};

  let remaining = points;
  for (const attr of attrs) {
    const share = Math.floor(points * (weights[attr] / totalWeight));
    allocation[attr] = share;
    remaining -= share;
  }

  // Distribute remainder to highest-weighted attributes first
  const sorted = [...attrs].sort((a, b) => weights[b] - weights[a]);
  for (let i = 0; remaining > 0; i++) {
    allocation[sorted[i % sorted.length]] += 1;
    remaining--;
  }

  return allocation;
}
