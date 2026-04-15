import { describe, it, expect } from "@jest/globals";
import {
  STARTING_LOCATION_ID,
  createInitialWorldState,
  seedWorldAfterCharacterCreation,
} from "../../src/world/WorldInitializer.js";
import { getLocationById } from "../../src/world/WorldDataRegistry.js";

describe("WorldInitializer", () => {
  it("creates initial world state with defaults", () => {
    const world = createInitialWorldState({ seed: 123 });
    expect(world.id).toBe("crowngrave");
    expect(world.location.current).toBe(STARTING_LOCATION_ID);
    expect(world.location.visited).toEqual([STARTING_LOCATION_ID]);
    expect(world.location.unlockedAreas).toEqual([STARTING_LOCATION_ID]);
    expect(Object.values(world.flags).every((v) => v === false)).toBe(true);
    expect(world.vars.worldSeed).toBe(123);
    expect(world.vars.startingSceneId).toBe(null);
    expect(world.vars.current_quest_id).toBe(null);
    expect(world.counters.day).toBe(1);
    expect(world.counters.chapter).toBe(0);
    expect(world.counters.notoriety).toBe(0);
    expect(world.time).toBeTruthy();
    expect(world.time.timeOfDay).toBe("day");
    expect(typeof world.time.currentTime).toBe("number");
    expect(world.turnCount).toBe(0);
    expect(world.factionReputation.arcane_wardens).toBe(0);
    expect(typeof world.location.biome).toBe("string");
    expect(world.weather?.byBiome).toBeTruthy();
  });

  it("seeds world after character creation into the quest biome", () => {
    const baseWorld = createInitialWorldState({ seed: 1 });
    const player = {
      class: "paladin",
      race: "skybound",
      profession: null,
      origin: { id: "deckhand_cadet", name: "Deckhand Cadet" },
    };
    const quests = {
      active: [
        {
          id: "mq_starforge_siege",
          name: "Starforge Siege",
          tags: {
            biome: "skydocks",
            favoredClasses: ["paladin"],
            favoredOrigins: ["deckhand_cadet"],
          },
        },
      ],
      completed: [],
    };

    const seeded = seedWorldAfterCharacterCreation(baseWorld, {
      player,
      quests,
      seed: 1,
    });

    expect(seeded.vars.startingSceneId).toBeNull();
    expect(seeded.vars.current_quest_id).toBe("mq_starforge_siege");
    expect(seeded.vars.openingSceneChoicePending).toBe(false);
    expect(seeded.location.visited).toEqual([seeded.location.current]);
    expect(seeded.location.unlockedAreas).toEqual([seeded.location.current]);

    const loc = getLocationById(seeded.location.current);
    expect(loc).toBeTruthy();
    expect(loc.zoneId).toBe("skybound_marches");

    expect(seeded.flags.skybound_redline_active).toBe(true);
    expect(seeded.flags.riftscar_fold_event_active).toBe(false);
    expect(seeded.flags.lucent_revelation_active).toBe(false);
  });

  it("uses opening scene biome for location, not just quest biome", () => {
    const baseWorld = createInitialWorldState({ seed: 42 });
    const player = {
      class: "berserker",
      race: "ashmarked",
      profession: null,
      origin: { id: "ashmarked_prospector", name: "Ashmarked Prospector" },
    };
    const quests = {
      active: [
        {
          id: "mq_ember_bloom",
          name: "Ember Bloom",
          tags: { biome: "wilds", favoredClasses: ["berserker"] },
        },
      ],
      completed: [],
    };

    const seeded = seedWorldAfterCharacterCreation(baseWorld, {
      player,
      quests,
      seed: 42,
    });

    const loc = getLocationById(seeded.location.current);
    expect(loc).toBeTruthy();
    expect(loc.zoneId).toBe("wildroot_basin");
    expect(seeded.location.current).not.toBe(STARTING_LOCATION_ID);
  });

  it("keeps the selected starting zone when no quests are seeded", () => {
    const baseWorld = createInitialWorldState({ seed: 7 });
    const seeded = seedWorldAfterCharacterCreation(baseWorld, {
      player: {
        class: "mage",
        race: "human",
        profession: { id: "blacksmith", name: "Blacksmith" },
        startingLocationId: "coast_tideward_pier",
        startingZoneId: "coast",
      },
      quests: {
        active: [],
        completed: [],
      },
      seed: 7,
    });

    const loc = getLocationById(seeded.location.current);
    expect(loc).toBeTruthy();
    expect(loc.zoneId).toBe("dawnreef_tangle");
    expect(seeded.vars.current_quest_id).toBeNull();
    expect(seeded.vars.startingSceneId).toBeNull();
    expect(seeded.vars.openingSceneChoicePending).toBe(false);
  });
});
