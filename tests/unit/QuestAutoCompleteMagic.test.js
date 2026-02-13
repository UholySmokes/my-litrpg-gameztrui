import { describe, it, expect } from "@jest/globals";
import { SystemEventObserver } from "../../packages/game-core/src/core/SystemEventObserver.js";
import { initialGameState } from "../../packages/game-core/src/data/initialState.js";

describe("Quest auto-complete (magic)", () => {
  it("completes when required magic pattern is unlocked", () => {
    const state = {
      ...initialGameState,
      player: {
        ...initialGameState.player,
        magic: {
          ...initialGameState.player.magic,
          unlockedPatterns: { weave: ["spiral"], shape: ["pulse"] },
        },
      },
    };

    const ok = SystemEventObserver.isQuestCompleted(
      { requiresMagicPattern: { kind: "weave", id: "spiral" } },
      state,
    );
    expect(ok).toBe(true);
  });

  it("completes when required essence source is discovered", () => {
    const state = {
      ...initialGameState,
      world: {
        ...initialGameState.world,
        essence: {
          ...(initialGameState.world.essence || {}),
          sources: [{ id: "storm_water", locationId: "x" }],
        },
      },
    };

    const ok = SystemEventObserver.isQuestCompleted(
      { requiresEssenceSource: "storm_water" },
      state,
    );
    expect(ok).toBe(true);
  });
});

