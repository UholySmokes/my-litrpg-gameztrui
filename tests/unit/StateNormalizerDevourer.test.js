import { describe, expect, it } from "@jest/globals";
import { normalizeGameState } from "../../packages/game-core/src/core/StateNormalizer.js";
import { initialGameState } from "../../packages/game-core/src/data/initialState.js";

describe("StateNormalizer devourer runtime", () => {
  it("hydrates missing devourer runtime fields for legacy saves", () => {
    const state = {
      ...initialGameState,
      player: {
        ...initialGameState.player,
        archetypeSystem: {
          id: "devourer_core",
          name: "Devourer Core",
          category: "System",
        },
      },
    };

    const normalized = normalizeGameState(state);
    expect(normalized.player.archetypeSystem.resource.name).toBe("Biomass");
    expect(normalized.player.archetypeSystem.runtime).toEqual(
      expect.objectContaining({
        taint: 0,
        storedSamples: {},
        knownPrey: {},
        adaptations: {},
        sentientDevours: 0,
      }),
    );
  });
});
