import { afterEach, describe, expect, it } from "@jest/globals";
import {
  clearInitialNarrativeCache,
  createInitialNarrativeCacheKey,
  getInitialNarrativeCache,
  hasInitialNarrativeCache,
  setInitialNarrativeCache,
} from "../../src/hook/narrative/initialNarrativeCache.js";

afterEach(() => {
  clearInitialNarrativeCache();
});

describe("initial narrative cache helpers", () => {
  it("builds a deterministic cache key across object and string refs", () => {
    const first = createInitialNarrativeCacheKey({
      world: {
        vars: {
          startingSceneId: "start_fog_clan_ashes",
          current_quest_id: "quest_a",
          openingSceneChoicePending: true,
        },
        location: { current: "city_neon_bazaar" },
      },
      quests: { active: [{ id: "quest_b" }, { id: "quest_a" }] },
      player: {
        name: "Ari",
        race: { id: "human" },
        class: { id: "knight" },
        profession: { id: "smith" },
        archetypeSystem: { id: "authority", category: "Authority" },
        activeSkills: [{ id: "guard_stance" }],
      },
    });
    const second = createInitialNarrativeCacheKey({
      world: {
        vars: {
          startingSceneId: "start_fog_clan_ashes",
          current_quest_id: "quest_a",
          openingSceneChoicePending: true,
        },
        location: "city_neon_bazaar",
      },
      quests: { active: [{ id: "quest_a" }, { id: "quest_b" }] },
      player: {
        name: "Ari",
        race: "human",
        class: "knight",
        profession: "smith",
        archetypeSystem: { id: "authority", category: "Authority" },
        activeSkills: [{ id: "guard_stance" }],
      },
    });

    expect(first).toBe(second);
  });

  it("differentiates cache keys when player identity or system identity changes", () => {
    const base = {
      world: {
        vars: { startingSceneId: "start_fog_clan_ashes", current_quest_id: "quest_a" },
        location: { current: "city_neon_bazaar" },
      },
      quests: { active: [{ id: "quest_a" }] },
      player: {
        name: "Ari",
        race: { id: "human" },
        class: { id: "knight" },
        profession: { id: "smith" },
        archetypeSystem: { id: "authority", category: "Authority" },
      },
    };

    const otherName = createInitialNarrativeCacheKey({
      ...base,
      player: { ...base.player, name: "Bram" },
    });
    const otherSystem = createInitialNarrativeCacheKey({
      ...base,
      player: {
        ...base.player,
        archetypeSystem: { id: "overlay", category: "Overlay" },
      },
    });

    expect(otherName).not.toBe(createInitialNarrativeCacheKey(base));
    expect(otherSystem).not.toBe(createInitialNarrativeCacheKey(base));
  });

  it("stores and reads cached initial narrative responses", () => {
    setInitialNarrativeCache("scene|quest|class", { narrative: "hello" });

    expect(hasInitialNarrativeCache("scene|quest|class")).toBe(true);
    expect(getInitialNarrativeCache("scene|quest|class")).toEqual({
      narrative: "hello",
    });
  });
});

