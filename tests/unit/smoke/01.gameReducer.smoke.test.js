import { describe, expect, it } from "@jest/globals";
import { gameReducer } from "../../../packages/game-core/src/core/gameReducer.js";
import { initialGameState } from "../../../packages/game-core/src/data/initialState.js";

describe("smoke: gameReducer", () => {
  it("handles unknown actions without crashing", () => {
    const next = gameReducer(initialGameState, { type: "UNKNOWN_ACTION" });
    expect(next).toBeDefined();
    expect(next.player).toBeDefined();
  });
});
