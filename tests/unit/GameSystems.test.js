// GameSystems.test.js - Jest suite for high-level quest generation logic
import { describe, it, expect, beforeEach } from "@jest/globals";
import { QuestManager } from "../../src/systems/quest/QuestManager.js";

describe("QuestManager", () => {
  let mockPlayer;

  beforeEach(() => {
    mockPlayer = {
      name: "TestPlayer",
      level: 5,
      class: "warrior",
      race: "human",
      gold: 1000,
      inventory: [
        { id: "iron_ore", quantity: 10 },
        { id: "leather", quantity: 5 },
      ],
      professions: {
        blacksmithing: { xp: 500 },
      },
    };
  });

  it("generates between 1 and 4 quests on initialization", () => {
    const quests = QuestManager.generateInitialQuests(mockPlayer);
    expect(Array.isArray(quests)).toBe(true);
    expect(quests.length).toBeGreaterThanOrEqual(1);
    expect(quests.length).toBeLessThanOrEqual(4);
  });

  it("creates quests with required metadata", () => {
    const quests = QuestManager.generateInitialQuests(mockPlayer);
    quests.forEach((quest) => {
      expect(quest.id).toBeTruthy();
      expect(quest.name).toBeTruthy();
      expect(quest.status).toBe("active");
      expect(Array.isArray(quest.objectives)).toBe(true);
    });
  });

  it("seeds the tutorial onboarding in move-fight-rest order", () => {
    const quests = QuestManager.generateInitialQuests(mockPlayer);
    expect(quests.slice(0, 3).map((quest) => quest.id)).toEqual([
      "bq_first_stride",
      "bq_first_conflict",
      "bq_recovery_breath",
    ]);
    expect(quests[2].objectives[0].criteria.actionType).toBe("rest");
  });

  it("updates quest objective progress", () => {
    const [quest] = QuestManager.generateInitialQuests(mockPlayer);
    expect(quest).toBeDefined();
    const updatedQuest = QuestManager.updateQuestProgress(
      quest,
      quest.objectives[0].id,
      true,
    );
    expect(updatedQuest.objectives[0].completed).toBe(true);
  });

  it("marks quest as completed when all objectives are done", () => {
    const quest = {
      id: "test_quest",
      name: "Test Quest",
      objectives: [
        { id: "obj1", description: "Test objective 1", completed: false },
      ],
      status: "active",
    };

    const completedQuest = QuestManager.updateQuestProgress(
      quest,
      "obj1",
      true,
    );

    expect(completedQuest.status).toBe("completed");
    expect(completedQuest.completedAt).toBeDefined();
  });
});
