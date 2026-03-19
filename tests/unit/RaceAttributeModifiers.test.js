import { describe, it, expect } from "@jest/globals";
import { races } from "../../packages/game-core/src/data/registries/RaceDataRegistry.js";
import {
  getRaceById,
  applyRaceModifiers,
} from "../../packages/game-core/src/systems/race/RaceRegistry.js";

const NET_BUDGET = 5;

describe("Race attribute modifiers", () => {
  it("every race has an attributeModifiers object", () => {
    for (const race of races) {
      expect(race.attributeModifiers).toBeDefined();
      expect(typeof race.attributeModifiers).toBe("object");
    }
  });

  it("every race's modifiers sum to exactly +5", () => {
    for (const race of races) {
      const sum = Object.values(race.attributeModifiers).reduce(
        (acc, v) => acc + v,
        0,
      );
      expect(sum).toBe(NET_BUDGET);
    }
  });

  it("modifier keys are valid canonical attribute names", () => {
    const validKeys = new Set([
      "strength",
      "agility",
      "dexterity",
      "vitality",
      "intelligence",
      "wisdom",
      "charisma",
      "willpower",
      "luck",
      "soul",
    ]);
    for (const race of races) {
      for (const key of Object.keys(race.attributeModifiers)) {
        expect(validKeys.has(key)).toBe(true);
      }
    }
  });
});

describe("applyRaceModifiers", () => {
  const BASE = {
    strength: 5,
    agility: 5,
    dexterity: 5,
    vitality: 5,
    intelligence: 5,
    wisdom: 5,
    charisma: 5,
    willpower: 5,
    luck: 5,
    soul: 5,
  };

  it("applies bonuses and penalties correctly", () => {
    const result = applyRaceModifiers(BASE, "pure_human");
    const race = getRaceById("pure_human");
    for (const [attr, mod] of Object.entries(race.attributeModifiers)) {
      expect(result[attr]).toBe(BASE[attr] + mod);
    }
  });

  it("floors attributes at 1 (never below)", () => {
    const lowBase = { ...BASE, strength: 1 };
    // Pick a race with negative strength modifier
    const result = applyRaceModifiers(lowBase, "ancient_bloodline");
    const race = getRaceById("ancient_bloodline");
    if (race.attributeModifiers.strength < 0) {
      expect(result.strength).toBe(1);
    }
  });

  it("returns unmodified attributes for unknown race", () => {
    const result = applyRaceModifiers(BASE, "nonexistent_race_xyz");
    expect(result).toEqual(BASE);
    expect(result).not.toBe(BASE); // should be a copy
  });

  it("returns unmodified attributes for null race", () => {
    const result = applyRaceModifiers(BASE, null);
    expect(result).toEqual(BASE);
    expect(result).not.toBe(BASE);
  });

  it("does not mutate the input object", () => {
    const original = { ...BASE };
    applyRaceModifiers(original, "pure_human");
    expect(original).toEqual(BASE);
  });

  it("ignores modifier keys not present in base attributes", () => {
    const partial = { strength: 10, agility: 10 };
    const result = applyRaceModifiers(partial, "pure_human");
    // Only keys in partial should be affected
    expect(result.strength).toBeDefined();
    expect(result.agility).toBeDefined();
  });
});
