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
    expect(world.id).toBe("shardfall_meridian");
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
    expect(world.time).toBe(0);
    expect(world.turnCount).toBe(0);
    expect(world.factionReputation.arcane_wardens).toBe(0);
  });

  it("seeds world after character creation into the quest biome", () => {
    const baseWorld = createInitialWorldState({ seed: 1 });
    const player = { class: "templar", race: "skybound", profession: null };
    const quests = {
      active: [
        {
          id: "mq_starforge_siege",
          name: "Starforge Siege",
          tags: { biome: "skydocks" },
        },
      ],
      completed: [],
    };

    const seeded = seedWorldAfterCharacterCreation(baseWorld, {
      player,
      quests,
      seed: 99,
    });

    expect(typeof seeded.vars.startingSceneId).toBe("string");
    expect(seeded.vars.current_quest_id).toBe("mq_starforge_siege");
    expect(seeded.location.visited).toEqual([seeded.location.current]);
    expect(seeded.location.unlockedAreas).toEqual([seeded.location.current]);

    const loc = getLocationById(seeded.location.current);
    expect(loc).toBeTruthy();
    expect(loc.zoneId).toBe("skydocks");

    expect(seeded.flags.skydock_lockdown_active).toBe(true);
    expect(seeded.flags.leyline_storms_active).toBe(false);
    expect(seeded.flags.dream_wisps_active).toBe(false);
  });
});
