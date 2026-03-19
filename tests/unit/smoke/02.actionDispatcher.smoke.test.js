import { describe, expect, it } from "@jest/globals";
import { executeAction } from "../../../packages/game-core/src/core/ActionDispatcher.js";
import { initialGameState } from "../../../packages/game-core/src/data/initialState.js";

describe("smoke: ActionDispatcher", () => {
  it("executes a read-only look action", () => {
    const result = executeAction(initialGameState, { type: "look" });
    expect(result.success).toBe(true);
    expect(result.readOnly).toBe(true);
  });
});
