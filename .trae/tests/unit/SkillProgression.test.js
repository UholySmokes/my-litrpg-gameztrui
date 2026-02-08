import { describe, it, expect } from "@jest/globals";
import { gameReducer } from "../../src/core/gameReducer.js";
import { initialGameState } from "../../src/data/initialState.js";

describe("skill progression systems", () => {
  it("evolves a skill via reducer", () => {
    const skill = {
      id: "test_skill",
      name: "Test Skill",
      type: "active",
      level: 1,
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
    expect(next.player.abilities[0].level).toBe(2);
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
      },
      player: {
        ...initialGameState.player,
        level: 2,
        class: "cleric",
      },
    };
    const next = gameReducer(state, { type: "EVOLVE_CLASS" });
    const nextClassId = next.player.class?.id || next.player.class;
    expect(nextClassId).toBe("paladin");
  });
});
