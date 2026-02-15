import { describe, it, expect } from "@jest/globals";
import { gameReducer } from "../../src/core/gameReducer.js";
import { initialGameState } from "../../src/data/initialState.js";
import { DataRegistry } from "../../src/data/DataRegistry.js";

describe("skill progression systems", () => {
  it("evolves a skill via reducer", () => {
    const skill = {
      id: "test_skill",
      name: "Test Skill",
      type: "active",
      level: 10,
      manaCost: 10,
      cooldown: 3,
    };
    const state = {
      ...initialGameState,
      player: {
        ...initialGameState.player,
        abilities: [skill],
        activeSkills: [skill],
      },
    };
    const next = gameReducer(state, {
      type: "EVOLVE_SKILL",
      payload: { skillId: "test_skill" },
    });
    expect(next.player.abilities.length).toBe(1);
    expect(next.player.abilities[0].id).not.toBe("test_skill");
    expect(next.player.abilities[0].level).toBe(11);
  });

  it("fuses two skills via reducer", () => {
    const skillA = {
      id: "skill_a",
      name: "Skill A",
      type: "active",
      level: 1,
      manaCost: 10,
      cooldown: 3,
    };
    const skillB = {
      id: "skill_b",
      name: "Skill B",
      type: "active",
      level: 1,
      manaCost: 8,
      cooldown: 2,
    };
    const state = {
      ...initialGameState,
      player: {
        ...initialGameState.player,
        abilities: [skillA, skillB],
        activeSkills: [skillA, skillB],
      },
    };
    const next = gameReducer(state, {
      type: "FUSE_SKILLS",
      payload: { skillAId: "skill_a", skillBId: "skill_b" },
    });
    expect(next.player.abilities.length).toBe(1);
    const fused = next.player.abilities[0];
    expect(typeof fused.name).toBe("string");
    expect(fused.name.trim().length).toBeGreaterThan(0);
    expect(fused.id).not.toBe("skill_a");
    expect(fused.id).not.toBe("skill_b");
  });

  it("evolves class when requirements are met", () => {
    const state = {
      ...initialGameState,
      config: {
        ...initialGameState.config,
        classEvolutionLevel: 2,
        classEvolutionLevelStep: 3,
      },
      player: {
        ...initialGameState.player,
        level: 12,
        class: "cleric",
        attributes: {
          ...initialGameState.player.attributes,
          wisdom: 13,
          strength: 10,
        },
        progress: {
          ...(initialGameState.player.progress || {}),
          totalKills: 6,
        },
      },
    };
    const next = gameReducer(state, { type: "EVOLVE_CLASS" });
    const nextClassId = next.player.class?.id || next.player.class;
    expect(nextClassId).toBe("paladin");
    expect(next.player.progress.classEvolutions).toBe(1);
  });

  it("requires a higher level after each class evolution", () => {
    const stageOne = {
      ...initialGameState,
      config: {
        ...initialGameState.config,
        classEvolutionLevel: 10,
        classEvolutionLevelStep: 2,
      },
      player: {
        ...initialGameState.player,
        level: 12,
        class: "warrior",
        attributes: {
          ...initialGameState.player.attributes,
          strength: 14,
          constitution: 12,
        },
        progress: {
          ...(initialGameState.player.progress || {}),
          totalKills: 50,
        },
      },
    };
    const firstEvolution = gameReducer(stageOne, { type: "EVOLVE_CLASS" });
    const firstClassId = firstEvolution.player.class?.id || firstEvolution.player.class;
    expect(firstClassId).toBe("berserker");
    expect(firstEvolution.player.progress.classEvolutions).toBe(1);

    const blocked = gameReducer(
      {
        ...firstEvolution,
        player: {
          ...firstEvolution.player,
          level: 30,
        },
      },
      { type: "EVOLVE_CLASS" },
    );
    const blockedClassId = blocked.player.class?.id || blocked.player.class;
    expect(blockedClassId).toBe("berserker");

    const unlockedSecond = gameReducer(
      {
        ...firstEvolution,
        player: {
          ...firstEvolution.player,
          level: 34,
          attributes: {
            ...firstEvolution.player.attributes,
            strength: 18,
            constitution: 14,
          },
        },
      },
      { type: "EVOLVE_CLASS" },
    );
    const secondClassId =
      unlockedSecond.player.class?.id || unlockedSecond.player.class;
    expect(secondClassId).toBe("war_reaver");
    expect(unlockedSecond.player.progress.classEvolutions).toBe(2);
  });

  it("evolves race when requirements are met", () => {
    const firstRaceOption = DataRegistry.getRaceEvolutionOptions("pure_human", 0)[0];
    expect(firstRaceOption?.id).toBeTruthy();

    const state = {
      ...initialGameState,
      player: {
        ...initialGameState.player,
        level: 20,
        race: "pure_human",
        attributes: {
          ...initialGameState.player.attributes,
          strength: 13,
        },
        progress: {
          ...(initialGameState.player.progress || {}),
          totalKills: 20,
          raceEvolutionStage: 0,
        },
      },
    };

    const next = gameReducer(state, {
      type: "EVOLVE_RACE",
      payload: { evolutionId: firstRaceOption.id },
    });

    expect(next.player.race?.name).not.toBe("Pure Human");
    expect(next.player.progress.raceEvolutions).toBe(1);
    expect(next.player.progress.raceEvolutionStage).toBe(1);
  });
});
