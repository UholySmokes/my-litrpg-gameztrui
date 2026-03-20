// QuestManager.js - Manages quest generation and assignment
import { BEGINNER_QUESTS, MAIN_QUESTS, SIDE_QUESTS } from "../../data/QuestCatalog.js";
import { DataRegistry } from "../../data/DataRegistry.js";
import { randomInt } from "../../utils/DeterministicRandom.js";
import { SimBridge } from "../../simulation/bridge/SimulationContext.js";
import {
  getPlayerArchetypeSystemId,
  resolvePlayerArchetypeSystem,
} from "../archetype/resolvePlayerArchetypeSystem.js";

const TUTORIAL_QUEST_IDS = [
  "bq_first_stride",
  "bq_first_conflict",
  "bq_recovery_breath",
];

export class QuestManager {
  static resolvePlayerClassId(player) {
    return player?.class?.id || player?.class || null;
  }

  static resolvePlayerRaceId(player) {
    return player?.race?.id || player?.race || null;
  }

  static resolvePlayerProfessionId(player) {
    return player?.profession?.id || player?.profession || null;
  }

  static resolvePlayerOriginId(player) {
    return player?.origin?.id || player?.origin || null;
  }

  static getQuestAffinityWeight(quest, player) {
    let weight = 1;
    const tags = quest?.tags || {};
    const classId = this.resolvePlayerClassId(player);
    const raceId = this.resolvePlayerRaceId(player);
    const professionId = this.resolvePlayerProfessionId(player);
    const originId = this.resolvePlayerOriginId(player);

    if (classId && Array.isArray(tags.favoredClasses) && tags.favoredClasses.includes(classId)) {
      weight += 2;
    }
    if (raceId && Array.isArray(tags.favoredRaces) && tags.favoredRaces.includes(raceId)) {
      weight += 2;
    }
    if (
      professionId &&
      Array.isArray(tags.favoredProfessions) &&
      tags.favoredProfessions.includes(professionId)
    ) {
      weight += 1;
    }
    if (originId && Array.isArray(tags.favoredOrigins) && tags.favoredOrigins.includes(originId)) {
      weight += 2;
    }
    if (player?.origin?.favoredBiome && tags.biome === player.origin.favoredBiome) {
      weight += 1;
    }

    return weight;
  }

  static isQuestTrackable(quest) {
    if (!quest || typeof quest !== "object") return false;
    if (quest.autoComplete && typeof quest.autoComplete === "object") {
      return true;
    }
    const objectives = Array.isArray(quest.objectives) ? quest.objectives : [];
    if (objectives.length === 0) return false;
    return objectives.every(
      (objective) =>
        objective?.criteria &&
        typeof objective.criteria === "object" &&
        !Array.isArray(objective.criteria),
    );
  }

  static generateInitialQuests(player) {
    const quests = [];
    const suitableBeginnerQuests = BEGINNER_QUESTS.filter((quest) =>
      this.isQuestSuitable(quest, player),
    );
    const tutorialQuests = TUTORIAL_QUEST_IDS.map((questId) =>
      suitableBeginnerQuests.find((quest) => quest.id === questId),
    ).filter(Boolean);

    tutorialQuests.forEach((quest) => {
      quests.push(this.initializeQuest(quest));
    });

    const suitableMainQuests = MAIN_QUESTS.filter((quest) =>
      this.isQuestSuitable(quest, player),
    );
    if (suitableMainQuests.length > 0) {
      quests.push(
        this.initializeQuest(this.pullQuestByPriority([...suitableMainQuests], player)),
      );
    }

    const tutorialQuestIds = new Set(tutorialQuests.map((quest) => quest.id));
    const beginnerPool = suitableBeginnerQuests.filter(
      (quest) => !tutorialQuestIds.has(quest.id),
    );

    const beginnerQuestCount = Math.min(
      Math.max(0, 3 - tutorialQuests.length),
      beginnerPool.length,
    );
    for (let i = 0; i < beginnerQuestCount; i++) {
      if (beginnerPool.length === 0) break;
      const quest = this.pullQuestByPriority(beginnerPool, player);
      quests.push(this.initializeQuest(quest));
    }

    const suitableSideQuests = SIDE_QUESTS.filter(
      (quest) =>
        this.isQuestTrackable(quest) &&
        this.isQuestSuitable(quest, player) &&
        (!quest.levelRequirement || quest.levelRequirement <= (player?.level || 1) + 2),
    );
    const sidePool = [...suitableSideQuests];

    const sideQuestCount = 0;
    for (let i = 0; i < sideQuestCount; i++) {
      if (sidePool.length === 0) break;
      const sideQuest = this.pullQuestByPriority(sidePool, player);
      quests.push(this.initializeQuest(sideQuest));
    }

    if (quests.length === 0) {
      const fallbackMain = MAIN_QUESTS.filter((quest) =>
        this.isQuestSuitable(quest, player),
      );
      if (fallbackMain.length > 0) {
        quests.push(
          this.initializeQuest(this.pullQuestByPriority([...fallbackMain], player)),
        );
      }
    }

    const archetypeSystem = this.resolveArchetypeSystem(player);
    if ((player?.level || 1) >= 4 && archetypeSystem?.questHooks?.length) {
      const hookIndex = randomInt(0, archetypeSystem.questHooks.length - 1);
      const hook = archetypeSystem.questHooks[hookIndex];
      const systemQuest = this.buildSystemQuest(archetypeSystem, hook);
      quests.push(this.initializeQuest(systemQuest));
    }

    return quests;
  }

  static generateQuestFromSuggestion(actionText, state) {
    const normalizedAction = String(actionText || "").trim().toLowerCase();
    if (!normalizedAction) return null;

    const player = state?.player;
    const active = Array.isArray(state?.quests?.active) ? state.quests.active : [];
    const completed = Array.isArray(state?.quests?.completed) ? state.quests.completed : [];
    if (active.length >= 6) return null;

    const blockedIds = new Set([
      ...active.map((quest) => quest?.id),
      ...completed.map((quest) => quest?.id),
    ]);

    const currentBiome =
      state?.world?.location && typeof state.world.location === "object"
        ? state.world.location.biome
        : null;

    let pool = [...BEGINNER_QUESTS, ...SIDE_QUESTS].filter((quest) => {
      if (!quest || blockedIds.has(quest.id)) return false;
      if (!this.isQuestTrackable(quest)) return false;
      if (!this.isQuestSuitable(quest, player)) return false;
      if (quest.levelRequirement && quest.levelRequirement > (player?.level || 1) + 2) {
        return false;
      }
      return true;
    });

    if (normalizedAction.includes("talk") || normalizedAction.includes("npc")) {
      pool = pool.filter((quest) => {
        const tones = quest.tags?.tones || [];
        const biome = quest.tags?.biome;
        return tones.includes("serene") || tones.includes("neutral") || biome === "city";
      });
    } else if (
      normalizedAction.includes("explore") ||
      normalizedAction.includes("look") ||
      normalizedAction.includes("search") ||
      normalizedAction.includes("travel")
    ) {
      pool = pool.filter(
        (quest) => !currentBiome || !quest.tags?.biome || quest.tags.biome === currentBiome,
      );
    } else if (
      normalizedAction.includes("train") ||
      normalizedAction.includes("status") ||
      normalizedAction.includes("inventory")
    ) {
      pool = pool.filter((quest) => quest.tags?.starter === true || quest.id.startsWith("bq_"));
    }

    if (!pool.length) return null;
    return this.initializeQuest(this.pullQuestByPriority([...pool]));
  }

  static resolveArchetypeSystem(player) {
    return resolvePlayerArchetypeSystem(player);
  }

  static buildSystemQuest(archetypeSystem, hookText) {
    const idSuffix = `${archetypeSystem.id || "system"}_${SimBridge.now()}`;
    return {
      id: `sys_${idSuffix}`,
      name: `${archetypeSystem.name || "System"} Directive`,
      description: hookText || "Carry out the system directive.",
      objectives: [
        {
          id: `sys_${idSuffix}_obj_1`,
          description: hookText || "Fulfill the directive.",
          completed: false,
        },
      ],
      rewards: { xp: 90, items: [] },
      tags: {
        systemDriven: true,
        favoredSystems: archetypeSystem.id ? [archetypeSystem.id] : [],
      },
    };
  }

  static isQuestSuitable(quest, player) {
    if (!player) {
      console.warn("Player is undefined in isQuestSuitable");
      return false;
    }

    const playerSystemId = getPlayerArchetypeSystemId(player);

    // Check level requirements
    if (quest.levelRequirement && player.level < quest.levelRequirement) {
      return false;
    }

    if (quest.tags?.requiredSystems) {
      if (!playerSystemId) return false;
      if (!quest.tags.requiredSystems.includes(playerSystemId)) {
        return false;
      }
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

  static pullQuestByPriority(quests, player = null) {
    if (!quests?.length) return null;
    const weights = quests.map((quest) => this.getQuestAffinityWeight(quest, player));
    const totalWeight = weights.reduce((sum, value) => sum + value, 0);
    let roll = randomInt(1, Math.max(1, totalWeight));
    let index = 0;
    for (let i = 0; i < quests.length; i += 1) {
      roll -= weights[i];
      if (roll <= 0) {
        index = i;
        break;
      }
    }
    const [quest] = quests.splice(index, 1);
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
