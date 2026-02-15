// QuestManager.js - Manages quest generation and assignment
import { BEGINNER_QUESTS, MAIN_QUESTS, SIDE_QUESTS } from "../../data/QuestCatalog.js";
import { DataRegistry } from "../../data/DataRegistry.js";
import { randomInt } from "../../utils/DeterministicRandom.js";
import { SimBridge } from "../../simulation/bridge/SimulationContext.js";
import {
  getArchetypeSystemById,
} from "../archetype/ArchetypeSystemRegistry.js";

export class QuestManager {
  static generateInitialQuests(player) {
    const quests = [];

    const suitableBeginnerQuests = BEGINNER_QUESTS.filter((quest) =>
      this.isQuestSuitable(quest, player),
    );
    const beginnerPool = [...suitableBeginnerQuests];

    const beginnerQuestCount = Math.min(2, beginnerPool.length);
    for (let i = 0; i < beginnerQuestCount; i++) {
      if (beginnerPool.length === 0) break;
      const quest = this.pullQuestByPriority(beginnerPool);
      quests.push(this.initializeQuest(quest));
    }

    const suitableSideQuests = SIDE_QUESTS.filter(
      (quest) =>
        this.isQuestSuitable(quest, player) &&
        (!quest.levelRequirement || quest.levelRequirement <= (player?.level || 1) + 2),
    );
    const sidePool = [...suitableSideQuests];

    const sideQuestCount = Math.min(1, sidePool.length);
    for (let i = 0; i < sideQuestCount; i++) {
      if (sidePool.length === 0) break;
      const sideQuest = this.pullQuestByPriority(sidePool);
      quests.push(this.initializeQuest(sideQuest));
    }

    if (quests.length === 0) {
      const fallbackMain = MAIN_QUESTS.filter((quest) =>
        this.isQuestSuitable(quest, player),
      );
      if (fallbackMain.length > 0) {
        quests.push(this.initializeQuest(this.pullQuestByPriority(fallbackMain)));
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
    if (!player) return null;
    const raw = player.archetypeSystem;
    if (!raw) return null;
    if (typeof raw === "string") {
      return getArchetypeSystemById(raw) || { id: raw, name: raw };
    }
    if (typeof raw === "object" && !Array.isArray(raw)) {
      const resolved = raw.id ? getArchetypeSystemById(raw.id) : null;
      return resolved || raw;
    }
    return null;
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

    const playerSystemId =
      player.archetypeSystem?.id || player.archetypeSystem || null;

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
