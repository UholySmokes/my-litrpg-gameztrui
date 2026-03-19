import { describe, expect, it } from "@jest/globals";
import {
  ESSENCE_PRIMES,
  magicSense,
} from "../../../packages/game-core/src/systems/magic/EssenceWeavingSystem.js";
import { initialGameState } from "../../../packages/game-core/src/data/initialState.js";

describe("smoke: EssenceWeavingSystem", () => {
  it("exports primes and handles magic_sense", () => {
    expect(Array.isArray(ESSENCE_PRIMES)).toBe(true);
    expect(ESSENCE_PRIMES.length).toBeGreaterThan(0);
    const result = magicSense(initialGameState, { type: "magic_sense" });
    expect(result).toBeDefined();
    expect(result.state).toBeDefined();
  });
});
