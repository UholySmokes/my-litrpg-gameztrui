import { describe, expect, it } from "@jest/globals";
import { buildCharacterCreationState } from "../../src/components/gameui/useGameUiCharacterCreationFlow.js";
import { createInitialWorldState } from "../../src/world/WorldInitializer.js";
import { getLocationById } from "../../src/world/WorldDataRegistry.js";

describe("buildCharacterCreationState", () => {
  it("starts a fresh run without auto-seeded quests", () => {
    const nextState = buildCharacterCreationState(
      {
        player_profile: { characters_created: 0 },
        world: createInitialWorldState({ seed: 17 }),
      },
      {
        name: "Ari",
        class: "paladin",
        race: "human",
        profession: { id: "blacksmith", name: "Blacksmith" },
        startingZoneId: "coast",
      },
    );

    expect(nextState.player_profile.characters_created).toBe(1);
    expect(nextState.quests).toEqual({
      active: [],
      completed: [],
    });
    expect(nextState.world.vars.current_quest_id).toBeNull();
    expect(typeof nextState.world.vars.startingSceneId).toBe("string");

    const startLocation = getLocationById(nextState.world.location.current);
    expect(startLocation?.zoneId).toBe("coast");
  });
});
