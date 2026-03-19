import { describe, expect, it } from "@jest/globals";
import {
  getQuestById,
  hashSeed,
} from "../../../packages/game-core/src/data/QuestCatalog.js";

describe("smoke: QuestCatalog", () => {
  it("hashes seeds and resolves starter quest", () => {
    expect(typeof hashSeed("voidverse")).toBe("number");
    const quest = getQuestById("beginner_awakening");
    expect(quest).toBeDefined();
  });
});
