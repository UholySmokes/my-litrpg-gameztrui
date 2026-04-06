import { describe, expect, it } from "@jest/globals";
import { parseAction } from "../../../packages/game-core/src/core/InputParser.js";
import { initialGameState } from "../../../packages/game-core/src/data/initialState.js";

describe("smoke: InputParser", () => {
  it("parses a rest command", () => {
    const action = parseAction("rest", initialGameState);
    expect(action).toBeDefined();
    expect(action.type).toBe("rest");
  });

  it("parses a natural question as dialogue when NPCs are present", () => {
    const action = parseAction("Why are you all just watching me?", {
      ...initialGameState,
      narrative: {
        ...(initialGameState.narrative || {}),
        sceneMemory: {
          presentEntities: ["Spirit Beast Clan Patrol"],
        },
      },
    });

    expect(action).toBeDefined();
    expect(action.type).toBe("dialogue");
    expect(action.intent).toBe("question");
  });

  it("keeps freeform failed-movement narration out of the move parser", () => {
    const action = parseAction("i run and trip over my paws", initialGameState);

    expect(action).toBeDefined();
    expect(action.type).toBe("narrative");
  });

  it("does not treat social pursuit phrasing as a travel destination", () => {
    const action = parseAction("go to the patrol scared and confused", {
      ...initialGameState,
      narrative: {
        ...(initialGameState.narrative || {}),
        sceneMemory: {
          presentEntities: ["Spirit Beast Patrol"],
        },
      },
    });

    expect(action).toBeDefined();
    expect(action.type).not.toBe("move");
  });
});
