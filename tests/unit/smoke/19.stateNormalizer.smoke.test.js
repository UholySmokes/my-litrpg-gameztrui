import { describe, expect, it } from "@jest/globals";
import { normalizeGameState } from "../../../packages/game-core/src/core/StateNormalizer.js";
import { initialGameState } from "../../../packages/game-core/src/data/initialState.js";

describe("smoke: StateNormalizer", () => {
  it("normalizes a cloned game state", () => {
    const normalized = normalizeGameState(structuredClone(initialGameState));
    expect(normalized.player).toBeDefined();
    expect(normalized.world).toBeDefined();
  });
});
