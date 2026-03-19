import { describe, expect, it } from "@jest/globals";
import { parseAction } from "../../../packages/game-core/src/core/InputParser.js";
import { initialGameState } from "../../../packages/game-core/src/data/initialState.js";

describe("smoke: InputParser", () => {
  it("parses a rest command", () => {
    const action = parseAction("rest", initialGameState);
    expect(action).toBeDefined();
    expect(action.type).toBe("rest");
  });
});
