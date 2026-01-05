import { xpForNextLevel, calculateGainedXP } from '../src/lib/logic/levelSystem.js';

/**
 * Simulate equal-level fights from level 1 to 20.
 * Assumes baseXP per fight = 100 (adjust as needed).
 */
function simulate({ baseXP = 100, config = {} } = {}) {
  let level = 1;
  let xp = 0;
  const results = [];

  while (level < 20) {
    const xpNeeded = xpForNextLevel(level, config);
    let fights = 0;

    while (xp < xpNeeded) {
      const gained = calculateGainedXP(level, level, baseXP, config);
      xp += gained;
      fights += 1;
    }

    xp -= xpNeeded;
    level += 1;
    results.push({ level, fights });
  }

  return results;
}

const results = simulate();
results.forEach(row => {
  console.log(`Level ${row.level}: fights this level = ${row.fights}`);
});
