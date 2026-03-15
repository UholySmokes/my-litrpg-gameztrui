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
      world: { vars: { startingSceneId: "start_fog_clan_ashes", current_quest_id: "quest_a" } },
      quests: { active: [{ id: "quest_b" }, { id: "quest_a" }] },
      player: {
        race: { id: "human" },
        class: { id: "knight" },
        profession: { id: "smith" },
      },
    });
    const second = createInitialNarrativeCacheKey({
      world: { vars: { startingSceneId: "start_fog_clan_ashes", current_quest_id: "quest_a" } },
      quests: { active: [{ id: "quest_a" }, { id: "quest_b" }] },
      player: {
        race: "human",
        class: "knight",
        profession: "smith",
      },
    });

    expect(first).toBe(second);
  });

  it("stores and reads cached initial narrative responses", () => {
    setInitialNarrativeCache("scene|quest|class", { narrative: "hello" });

    expect(hasInitialNarrativeCache("scene|quest|class")).toBe(true);
    expect(getInitialNarrativeCache("scene|quest|class")).toEqual({
      narrative: "hello",
    });
  });
});
