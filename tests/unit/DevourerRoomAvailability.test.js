import { describe, expect, it } from "@jest/globals";
import { initialGameState } from "../../src/data/initialState.js";
import { isDevourerCoreRoomAvailable } from "../../src/components/shell/devourerRoomAvailability.js";

describe("Devourer Core room availability", () => {
  it("is available only for Devourer characters at onboarding tier three or higher", () => {
    const devourerPlayer = {
      ...initialGameState.player,
      level: 2,
      archetypeSystem: {
        id: "devourer_core",
        name: "Devourer Core",
        category: "System",
        resource: { name: "Biomass", current: 10, max: 100, color: "#7DFFB3" },
        runtime: {},
      },
    };
    const nonDevourerPlayer = {
      ...initialGameState.player,
      level: 2,
      archetypeSystem: {
        id: "revival_archive",
        name: "Revival Archive",
        category: "System",
      },
    };
    const earlyDevourerPlayer = {
      ...initialGameState.player,
      level: 1,
      archetypeSystem: devourerPlayer.archetypeSystem,
    };

    expect(
      isDevourerCoreRoomAvailable({
        state: { ...initialGameState, player: devourerPlayer },
        player: devourerPlayer,
        quests: initialGameState.quests,
      }),
    ).toBe(true);
    expect(
      isDevourerCoreRoomAvailable({
        state: { ...initialGameState, player: nonDevourerPlayer },
        player: nonDevourerPlayer,
        quests: initialGameState.quests,
      }),
    ).toBe(false);
    expect(
      isDevourerCoreRoomAvailable({
        state: { ...initialGameState, player: earlyDevourerPlayer },
        player: earlyDevourerPlayer,
        quests: initialGameState.quests,
      }),
    ).toBe(false);
  });
});
