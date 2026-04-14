import { describe, expect, it } from "@jest/globals";
import {
  combatBoardToSimulation,
  combatBoardUnitToEntity,
  playerToEntity,
  entityToCombatBoardUnit,
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

  it("round-trips skirmish board units with faction, placement, summons, and initiative intact", () => {
    const heroUnit = {
      id: "player",
      name: "Hero",
      faction: "ally",
      sourceType: "hero",
      sourceId: "player",
      lane: 2,
      slot: 1,
      level: 10,
      stats: {
        strength: 12,
        dexterity: 11,
        constitution: 10,
        intelligence: 9,
        wisdom: 8,
        charisma: 7,
        health: { current: 82, maximum: 100 },
        mana: { current: 34, maximum: 60 },
        stamina: { current: 12, maximum: 12 },
        attackPower: 15,
        defense: 6,
        speed: 13,
        criticalChance: 0.12,
        criticalMultiplier: 1.7,
        evasion: 0.08,
        accuracy: 0.93,
      },
      skills: [{ id: "basic_attack", name: "Basic Attack" }],
      effects: [],
      initiative: 18,
      actionPoints: 1,
      maxActionPoints: 1,
      cooldowns: [{ skillId: "shield_bash", remainingTicks: 1, totalTicks: 3 }],
      tags: ["hero"],
      alive: true,
    };

    const summonUnit = {
      id: "ally_summon_wolf_0",
      name: "Bone Wolf",
      faction: "ally",
      sourceType: "summon",
      sourceId: "bone_wolf",
      lane: 3,
      slot: 2,
      level: 8,
      stats: {
        strength: 9,
        dexterity: 10,
        constitution: 9,
        intelligence: 4,
        wisdom: 5,
        charisma: 3,
        health: { current: 28, maximum: 28 },
        mana: { current: 0, maximum: 0 },
        stamina: { current: 12, maximum: 12 },
        attackPower: 11,
        defense: 3,
        speed: 11,
        criticalChance: 0.08,
        criticalMultiplier: 1.5,
        evasion: 0.07,
        accuracy: 0.88,
      },
      skills: [{ id: "basic_attack", name: "Basic Attack" }],
      effects: [],
      initiative: 11,
      actionPoints: 1,
      maxActionPoints: 1,
      cooldowns: [],
      tags: ["summon", "undead"],
      alive: true,
    };

    const board = {
      matchId: "skirmish_test",
      status: "active",
      units: [heroUnit, summonUnit],
      activeUnitId: "player",
      selectedTargetId: "ally_summon_wolf_0",
      turnQueue: ["player", "ally_summon_wolf_0"],
      eventLog: [],
      spawnMeta: { encounterId: "unit:test" },
    };

    const simulation = combatBoardToSimulation(board, {
      world: { turnCount: 7 },
    });

    expect(simulation.entities.get("player")?.position).toEqual({ lane: 2, slot: 1 });
    expect(simulation.entities.get("ally_summon_wolf_0")?.faction).toBe("ally");

    const heroEntity = combatBoardUnitToEntity(heroUnit);
    const summonEntity = combatBoardUnitToEntity(summonUnit);
    const heroRoundTrip = entityToCombatBoardUnit(heroEntity, heroUnit);
    const summonRoundTrip = entityToCombatBoardUnit(summonEntity, summonUnit);

    expect(heroRoundTrip.faction).toBe("ally");
    expect(heroRoundTrip.lane).toBe(2);
    expect(heroRoundTrip.slot).toBe(1);
    expect(heroRoundTrip.initiative).toBe(18);
    expect(summonRoundTrip.sourceType).toBe("summon");
    expect(summonRoundTrip.sourceId).toBe("bone_wolf");
    expect(summonRoundTrip.tags).toEqual(expect.arrayContaining(["summon", "undead"]));
    expect(summonRoundTrip.initiative).toBe(11);
  });
});

