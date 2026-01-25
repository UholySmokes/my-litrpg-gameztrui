// QuestManager.js - Manages quest generation and assignment
import { MAIN_QUESTS, SIDE_QUESTS } from "../../data/QuestCatalog.js";
import { DataRegistry } from "../../data/DataRegistry.js";
import { randomInt } from "../../utils/DeterministicRandom.js";
import { SimBridge } from "../../simulation/bridge/SimulationBridge.js";

export class QuestManager {
  static generateInitialQuests(player) {
    const quests = [];

    // Add 1 main quest
    const suitableMainQuests = MAIN_QUESTS.filter((quest) =>
      this.isQuestSuitable(quest, player),
    );
    const mainPool = [...suitableMainQuests];

    if (mainPool.length > 0) {
      const mainQuest = this.pullQuestByPriority(mainPool);
      quests.push(this.initializeQuest(mainQuest));
    }

    // Add 2-3 side quests
    const suitableSideQuests = SIDE_QUESTS.filter((quest) =>
      this.isQuestSuitable(quest, player),
    );
    const sidePool = [...suitableSideQuests];

    const sideQuestCount = Math.min(3, sidePool.length);
    for (let i = 0; i < sideQuestCount; i++) {
      if (sidePool.length === 0) break;
      const sideQuest = this.pullQuestByPriority(sidePool);
      quests.push(this.initializeQuest(sideQuest));
    }

    return quests;
  }

  static isQuestSuitable(quest, player) {
    if (!player) {
      console.warn("Player is undefined in isQuestSuitable");
      return false;
    }

    // Check level requirements
    if (quest.levelRequirement && player.level < quest.levelRequirement) {
      return false;
    }

    // Check favored classes (bonus compatibility)
    if (
      quest.tags?.favoredClasses &&
      !quest.tags.favoredClasses.includes(player.class?.id || player.class)
    ) {
      // Not favored, but still possible (just lower priority)
    }

    // Check favored races (bonus compatibility)
    if (
      quest.tags?.favoredRaces &&
      !quest.tags.favoredRaces.includes(player.race?.id || player.race)
    ) {
      // Not favored, but still possible (just lower priority)
    }

    return true;
  }

  static selectQuestByPriority(quests) {
    // Backwards-compatible helper when removal isn't needed
    const randomIndex = randomInt(0, quests.length - 1);
    return quests[randomIndex];
  }

  static pullQuestByPriority(quests) {
    if (!quests?.length) return null;
    const randomIndex = randomInt(0, quests.length - 1);
    const [quest] = quests.splice(randomIndex, 1);
    return quest;
  }

  static initializeQuest(questTemplate) {
    return {
      ...questTemplate,
      status: "active",
      acceptedAt: SimBridge.now(),
      progress: {},
      objectives: questTemplate.objectives.map((obj) => ({
        ...obj,
        completed: false,
      })),
    };
  }

  static updateQuestProgress(quest, objectiveId, completed = true) {
    const updatedQuest = { ...quest };
    const objective = updatedQuest.objectives.find(
      (obj) => obj.id === objectiveId,
    );

    if (objective) {
      objective.completed = completed;

      // Check if quest is complete
      const allObjectivesComplete = updatedQuest.objectives.every(
        (obj) => obj.completed,
      );
      if (allObjectivesComplete) {
        updatedQuest.status = "completed";
        updatedQuest.completedAt = SimBridge.now();
      }
    }

    return updatedQuest;
  }

  static getQuestRewards(quest) {
    return quest.rewards || { xp: 50, gold: 25 };
  }
}
