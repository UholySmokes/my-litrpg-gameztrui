import { describe, it, expect } from "@jest/globals";
import { SystemEventObserver } from "../../packages/game-core/src/core/SystemEventObserver.js";
import { initialGameState } from "../../packages/game-core/src/data/initialState.js";
import { ensureEssenceWeavingState } from "../../packages/game-core/src/systems/magic/EssenceWeavingSystem.js";

describe("Ambient shift observer", () => {
  it("emits ambientShift event when weather changes", () => {
    const base = ensureEssenceWeavingState({
      ...initialGameState,
      world: {
        ...initialGameState.world,
        location: { current: "starting_zone", biome: "coast" },
        weather: { byBiome: { coast: { type: "clear", intensity: 0.3, updatedTurn: 0 } } },
      },
    });

    const next = ensureEssenceWeavingState({
      ...base,
      world: {
        ...base.world,
        weather: { byBiome: { coast: { type: "storm", intensity: 1, updatedTurn: 1 } } },
      },
    });

    const events = SystemEventObserver.evaluateToEvents(base, next, 5);
    const ambient = events.find((e) => e.type === "world.ambientShift");
    expect(ambient).toBeTruthy();
    expect(ambient.tick).toBe(5);
    expect(String(ambient.payload.message)).toMatch(/Weather: storm/i);
  });
});

