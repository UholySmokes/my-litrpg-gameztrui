import { describe, it, expect } from "@jest/globals";
import { xpForNextLevel } from "../../src/systems/leveling/LevelingSystem.js";
import { INITIAL_CONFIG } from "../../src/data/initialState.js";

const config = INITIAL_CONFIG;

describe("8-bracket XP curve", () => {
  it("tier 1: level 1 returns base value", () => {
    expect(xpForNextLevel(1, config)).toBe(100);
  });

  it("tier 2: level 11 uses second bracket", () => {
    // level 11, prevEnd=10, idx=11-10=1, floor(200 * 1.18^0) = 200
    expect(xpForNextLevel(11, config)).toBe(200);
  });

  it("tier 4: level 51 uses fourth bracket (late-mid)", () => {
    // level 51, prevEnd=50, idx=51-50=1, floor(1500 * 1.22^0) = 1500
    expect(xpForNextLevel(51, config)).toBe(1500);
  });

  it("bracket transitions are smooth (no absurd jumps)", () => {
    const xp10 = xpForNextLevel(10, config); // last level in tier 1
    const xp11 = xpForNextLevel(11, config); // first level in tier 2
    // Tier 2 base (200) should not be more than 10x tier 1 last level
    expect(xp11).toBeLessThan(xp10 * 10);
    expect(xp11).toBeGreaterThan(0);

    const xp25 = xpForNextLevel(25, config);
    const xp26 = xpForNextLevel(26, config);
    expect(xp26).toBeLessThan(xp25 * 10);
    expect(xp26).toBeGreaterThan(0);
  });

  it("level 1000 does not produce Infinity or unsafe numbers", () => {
    const xp = xpForNextLevel(1000, config);
    expect(Number.isFinite(xp)).toBe(true);
    expect(xp).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
    expect(xp).toBeGreaterThan(0);
  });

  it("all 8 brackets are present in config", () => {
    expect(config.xpBrackets).toHaveLength(8);
  });

  it("brackets are ordered by ascending end", () => {
    for (let i = 1; i < config.xpBrackets.length; i++) {
      expect(config.xpBrackets[i].end).toBeGreaterThan(
        config.xpBrackets[i - 1].end,
      );
    }
  });
});
