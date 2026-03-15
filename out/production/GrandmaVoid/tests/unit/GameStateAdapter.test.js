import { describe, expect, it } from "@jest/globals";
import {
  playerToEntity,
  entityToPlayer,
} from "../../packages/game-core/src/simulation/bridge/GameStateAdapter.js";

describe("GameStateAdapter", () => {
  it("maps stamina and cooldowns from player state into simulation entity", () => {
    const player = {
      name: "Tester",
      level: 12,
      hp: { current: 75, max: 100 },
      mana: { current: 45, max: 80 },
      resources: {
        stamina: 37,
        maxStamina: 60,
      },
      cooldowns: [
        { skillId: "firebolt", remainingTicks: 2, totalTicks: 6 },
        { id: "expired", remainingTicks: 0, totalTicks: 4 },
      ],
    };

    const entity = playerToEntity(player);
    expect(entity.stats.stamina.current).toBe(37);
    expect(entity.stats.stamina.maximum).toBe(60);
    expect(entity.cooldowns).toEqual([
      { skillId: "firebolt", remainingTicks: 2, totalTicks: 6 },
    ]);
  });

  it("round-trips stamina and cooldowns back to player shape", () => {
    const entity = {
      id: "player",
      name: "Tester",
      level: 5,
      experience: 100,
      stats: {
        strength: 8,
        dexterity: 9,
        constitution: 7,
        intelligence: 10,
        wisdom: 6,
        charisma: 5,
        health: { current: 80, maximum: 120 },
        mana: { current: 30, maximum: 70 },
        stamina: { current: 22, maximum: 40 },
      },
      effects: [],
      cooldowns: [{ skillId: "dash", remainingTicks: 3, totalTicks: 8 }],
      tags: [],
      isDead: false,
    };

    const player = entityToPlayer(entity, { resources: { energy: 12 } });
    expect(player.stamina).toEqual({ current: 22, max: 40 });
    expect(player.resources.stamina).toBe(22);
    expect(player.resources.maxStamina).toBe(40);
    expect(player.cooldowns).toEqual([
      { skillId: "dash", remainingTicks: 3, totalTicks: 8 },
    ]);
  });
});

