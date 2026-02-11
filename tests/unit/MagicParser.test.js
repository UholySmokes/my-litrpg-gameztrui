import { describe, it, expect } from "@jest/globals";
import { parseAction } from "../../src/core/InputParser.js";
import { initialGameState } from "../../src/data/initialState.js";

describe("Magic input parsing", () => {
  it("parses DRAW", () => {
    const action = parseAction("DRAW FIRE 10", initialGameState);
    expect(action.type).toBe("magic_draw");
    expect(action.essence).toBe("fire");
    expect(action.amount).toBe(10);
  });

  it("parses REFINE with method", () => {
    const action = parseAction("REFINE water stream 12", initialGameState);
    expect(action.type).toBe("magic_refine");
    expect(action.essence).toBe("water");
    expect(action.method).toBe("stream");
    expect(action.amount).toBe(12);
  });

  it("parses COMPRESS tier", () => {
    const action = parseAction("COMPRESS FIRE spiral tier 2", initialGameState);
    expect(action.type).toBe("magic_compress");
    expect(action.essence).toBe("fire");
    expect(action.method).toBe("spiral");
    expect(action.tier).toBe(2);
  });

  it("parses WEAVE combos", () => {
    const action = parseAction("WEAVE fire+air vortex", initialGameState);
    expect(action.type).toBe("magic_weave");
    expect(action.essences).toEqual(["fire", "air"]);
    expect(action.pattern).toBe("vortex");
  });
});

