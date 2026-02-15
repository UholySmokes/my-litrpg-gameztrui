import { describe, it, expect } from "@jest/globals";
import {
  ARCHETYPE_DEFINITIONS,
  getArchetypeQualityReport,
} from "../../src/systems/archetype/ArchetypeSystemRegistry.js";
import { initialGameState } from "../../src/data/initialState.js";
import { normalizeGameState } from "../../src/core/StateNormalizer.js";
import { gameReducer } from "../../src/core/gameReducer.js";
import { startCombat, playerAttack } from "../../src/systems/combat/CombatSystem.js";
import { resolveClassEvolutionRequirement } from "../../src/utils/shared.js";

describe("archetype quality guardrails", () => {
  it("normalizes archetypes into extensive, implementable definitions", () => {
    expect(ARCHETYPE_DEFINITIONS.length).toBeGreaterThan(0);

    ARCHETYPE_DEFINITIONS.forEach((definition) => {
      expect(definition.coreLoop.length).toBeGreaterThanOrEqual(3);
      expect(definition.progression.length).toBeGreaterThanOrEqual(3);
      expect(definition.narrativeHooks.length).toBeGreaterThanOrEqual(2);
      expect(definition.questHooks.length).toBeGreaterThanOrEqual(2);
      expect(definition.implementationProfile?.implementable).toBe(true);
      expect(definition.quality?.depthScore).toBeGreaterThanOrEqual(80);

      const combinedText = [
        definition.summary,
        definition.description,
        ...(definition.coreLoop || []),
        ...(definition.progression || []),
        ...(definition.narrativeHooks || []),
        ...(definition.questHooks || []),
      ]
        .join(" ")
        .toLowerCase();

      expect(combinedText).not.toContain("placeholder");
      expect(combinedText).not.toContain("unlock further potential");
    });
  });

  it("produces a duplicate-free quality report", () => {
    const report = getArchetypeQualityReport();
    expect(report.total).toBeGreaterThan(0);
    expect(report.ids.length).toBe(report.total);
    expect(new Set(report.ids).size).toBe(report.ids.length);
    expect(Object.keys(report.categories).length).toBeGreaterThan(0);
  });
});

describe("progression impact wiring", () => {
  it("class evolution requirement always rises even with step reduction", () => {
    const config = {
      classEvolutionLevel: 10,
      classEvolutionLevelStep: 2,
    };
    const progressionModifiers = {
      classEvolutionStepReduction: 10,
    };

    const first = resolveClassEvolutionRequirement(config, 1, progressionModifiers);
    const second = resolveClassEvolutionRequirement(config, 2, progressionModifiers);
    const third = resolveClassEvolutionRequirement(config, 3, progressionModifiers);

    expect(first).toBe(11);
    expect(second).toBeGreaterThan(first);
    expect(third).toBeGreaterThan(second);
  });

  it("applies progression multipliers to combat rewards", () => {
    const originalRandom = Math.random;
    Math.random = () => 1;

    try {
      const baseState = normalizeGameState({
        ...initialGameState,
        player: {
          ...initialGameState.player,
          gold: 0,
          currency: { ...initialGameState.player.currency, goldCoins: 0 },
          attributes: { ...initialGameState.player.attributes, strength: 100 },
        },
      });
      const boostedState = normalizeGameState({
        ...baseState,
        player: {
          ...baseState.player,
          progressionModifiers: {
            ...baseState.player.progressionModifiers,
            xpGainMultiplier: 2,
            goldGainMultiplier: 2,
          },
        },
      });

      const baseCombat = startCombat(baseState, ["goblin"]);
      const boostedCombat = startCombat(boostedState, ["goblin"]);
      const baseAttack = playerAttack(baseCombat, 0);
      const boostedAttack = playerAttack(boostedCombat, 0);

      expect(baseAttack.success).toBe(true);
      expect(boostedAttack.success).toBe(true);
      expect(boostedAttack.state.player.xp.current).toBeGreaterThan(
        baseAttack.state.player.xp.current,
      );
      expect(boostedAttack.state.player.currency.goldCoins).toBeGreaterThan(
        baseAttack.state.player.currency.goldCoins,
      );
    } finally {
      Math.random = originalRandom;
    }
  });

  it("applies progression multipliers to quest rewards", () => {
    const baseState = normalizeGameState({
      ...initialGameState,
      player: {
        ...initialGameState.player,
        gold: 0,
        currency: { ...initialGameState.player.currency, goldCoins: 0 },
        resources: { ...initialGameState.player.resources, focus: 0 },
      },
      quests: {
        active: [{ id: "quest_scale_test" }],
        completed: [],
      },
    });

    const boostedState = normalizeGameState({
      ...baseState,
      player: {
        ...baseState.player,
        progressionModifiers: {
          ...baseState.player.progressionModifiers,
          xpGainMultiplier: 1.5,
          questRewardMultiplier: 1.5,
          goldGainMultiplier: 1.5,
          resourceGainMultiplier: 1.5,
        },
      },
    });

    const action = {
      type: "COMPLETE_QUEST",
      payload: {
        questId: "quest_scale_test",
        reward: {
          xp: 10,
          gold: 10,
          resources: {
            focus: 10,
          },
        },
      },
    };

    const baseResult = gameReducer(baseState, action);
    const boostedResult = gameReducer(boostedState, action);

    expect(boostedResult.player.xp.current).toBeGreaterThan(
      baseResult.player.xp.current,
    );
    expect(boostedResult.player.currency.goldCoins).toBeGreaterThan(
      baseResult.player.currency.goldCoins,
    );
    expect(boostedResult.player.resources.focus).toBeGreaterThan(
      baseResult.player.resources.focus,
    );
  });
});
