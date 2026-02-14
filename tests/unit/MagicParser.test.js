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

  it("parses PURGE target with amount", () => {
    const action = parseAction("PURGE shadow 8", initialGameState);
    expect(action.type).toBe("magic_purge");
    expect(action.essence).toBe("shadow");
    expect(action.amount).toBe(8);
  });

  it("parses PURGE ALL", () => {
    const action = parseAction("PURGE all", initialGameState);
    expect(action.type).toBe("magic_purge");
    expect(action.essence).toBeNull();
    expect(action.amount).toBeNull();
  });

  it("parses release prepared weave shorthand", () => {
    const action = parseAction("release prepared weave", initialGameState);
    expect(action.type).toBe("magic_release");
  });

  it("parses resonance anchor shorthand", () => {
    const action = parseAction(
      "anchor to stabilize resonance",
      initialGameState,
    );
    expect(action.type).toBe("magic_anchor");
    expect(action.kind).toBe("self");
  });

  it("parses contamination purge shorthand", () => {
    const action = parseAction("purge contamination", initialGameState);
    expect(action.type).toBe("magic_purge");
    expect(action.essence).toBeNull();
  });

  it("parses combat skill command to attack with skill id", () => {
    const state = {
      ...initialGameState,
      combat: {
        ...initialGameState.combat,
        status: "active",
      },
      player: {
        ...initialGameState.player,
        activeSkills: [{ id: "firebolt", name: "Firebolt" }],
      },
    };
    const action = parseAction("use skill", state);
    expect(action.type).toBe("attack");
    expect(action.skillId).toBe("firebolt");
  });

  it("parses escape command in combat", () => {
    const state = {
      ...initialGameState,
      combat: {
        ...initialGameState.combat,
        status: "active",
      },
    };
    const action = parseAction("attempt escape", state);
    expect(action.type).toBe("escape");
  });
});

