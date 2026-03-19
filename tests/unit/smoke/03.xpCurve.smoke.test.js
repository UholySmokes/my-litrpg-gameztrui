import { describe, expect, it } from "@jest/globals";
import {
  calculateGainedXP,
  xpForNextLevel,
  xpToReachLevel,
} from "../../../packages/game-core/src/core/xpCurve.js";
import { INITIAL_CONFIG } from "../../../packages/game-core/src/data/initialState.js";

describe("smoke: xpCurve", () => {
  it("computes level and gain values", () => {
    expect(xpForNextLevel(1, INITIAL_CONFIG)).toBeGreaterThan(0);
    expect(xpToReachLevel(2, INITIAL_CONFIG)).toBeGreaterThan(0);
    expect(calculateGainedXP(1, 2, 10, INITIAL_CONFIG)).toBeGreaterThanOrEqual(10);
  });
});
