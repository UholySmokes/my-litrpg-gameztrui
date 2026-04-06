import { describe, expect, it } from "@jest/globals";
import { initialGameState } from "../../src/data/initialState.js";
import {
  endCombatPhase,
  handleEnemyDefeatPhase,
} from "../../packages/game-core/src/systems/combat/combatAftermath.js";

describe("combatAftermath", () => {
  it("ends combat with the expected terminal state", () => {
    const state = {
      ...initialGameState,
      combat: {
        status: "active",
        turn: "enemy",
        enemies: [{ id: "sparring_dummy" }],
        log: ["Combat started."],
      },
    };

    const next = endCombatPhase(state, "escape");

    expect(next.combat.status).toBe("inactive");
    expect(next.combat.turn).toBe("player");
    expect(next.combat.enemies).toEqual([]);
    expect(next.combat.log.at(-1)).toBe("You successfully escaped from combat!");
  });

  it("awards defeat rewards and closes combat on the last enemy", () => {
    const state = {
      ...initialGameState,
      player: {
        ...initialGameState.player,
        gold: 0,
        currency: {
          ...initialGameState.player.currency,
          goldCoins: 0,
        },
        progress: {
          totalKills: 0,
          killsByEnemyId: {},
          totalGoldEarned: 0,
        },
      },
      combat: {
        status: "active",
        turn: "player",
        enemies: [
          {
            id: "practice_slime",
            name: "Practice Slime",
            level: 1,
            xpReward: 12,
            goldReward: 7,
            dropTable: [],
            stats: {
              hp: { current: 0, max: 12 },
            },
          },
        ],
        log: ["Combat started."],
      },
    };

    const next = handleEnemyDefeatPhase(state, 0);

    expect(next.combat.status).toBe("victory");
    expect(next.combat.enemies).toEqual([]);
    expect(next.player.progress.totalKills).toBe(1);
    expect(next.player.progress.killsByEnemyId.practice_slime).toBe(1);
    expect(next.player.progress.totalGoldEarned).toBeGreaterThan(0);
    expect(next.player.gold).toBe(next.player.currency.goldCoins);
    expect(next.combat.log.some((entry) => entry.includes("Practice Slime defeated!"))).toBe(true);
    expect(next.combat.log.at(-1)).toBe("Victory! All enemies defeated!");
  });


  it("harvests devourer prey samples on enemy defeat", () => {
    const state = {
      ...initialGameState,
      player: {
        ...initialGameState.player,
        archetypeSystem: {
          id: "devourer_core",
          name: "Devourer Core",
          category: "System",
          resource: { name: "Biomass", current: 0, max: 100, color: "#7DFFB3" },
          runtime: {},
        },
        progress: {
          totalKills: 0,
          killsByEnemyId: {},
          totalGoldEarned: 0,
        },
      },
      combat: {
        status: "active",
        turn: "player",
        enemies: [
          {
            id: "bandit_raider",
            name: "Bandit Raider",
            level: 2,
            type: "humanoid",
            sentient: true,
            tags: ["humanoid", "shadow"],
            xpReward: 9,
            goldReward: 2,
            dropTable: [],
            stats: { hp: { current: 0, max: 12 } },
          },
        ],
        log: ["Combat started."],
      },
    };

    const next = handleEnemyDefeatPhase(state, 0);
    const runtime = next.player.archetypeSystem.runtime;
    expect(runtime.storedSamples.humanoid.count).toBeGreaterThan(0);
    expect(runtime.storedSamples.shadow.count).toBeGreaterThan(0);
    expect(next.combat.log.some((entry) => entry.includes("Sentient prey logged"))).toBe(true);
  });

});
