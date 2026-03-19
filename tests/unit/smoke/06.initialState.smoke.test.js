import { describe, expect, it } from "@jest/globals";
import {
  INITIAL_CONFIG,
  initialGameState,
} from "../../../packages/game-core/src/data/initialState.js";

describe("smoke: initialState", () => {
  it("exports baseline config and player state", () => {
    expect(INITIAL_CONFIG.maxLevel).toBeGreaterThan(1);
    expect(initialGameState.player.level).toBe(1);
    expect(initialGameState.world).toBeDefined();
  });
});
