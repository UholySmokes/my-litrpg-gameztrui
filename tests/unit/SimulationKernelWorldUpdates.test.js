import { describe, expect, it } from "@jest/globals";
import { DefaultSimulationKernel } from "../../packages/game-core/src/simulation/kernel/SimulationKernel.ts";

function createKernelState() {
  const entities = new Map([
    [
      "player",
      {
        id: "player",
        name: "Player",
        type: "player",
        level: 1,
        experience: 0,
        stats: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
          health: { current: 100, maximum: 100 },
          mana: { current: 50, maximum: 50 },
          stamina: { current: 40, maximum: 40 },
          attackPower: 10,
          defense: 5,
          speed: 8,
          criticalChance: 0.1,
          criticalMultiplier: 1.5,
          evasion: 0.05,
          accuracy: 0.95,
        },
        position: { lane: 1, slot: 0 },
        actionPoints: 10,
        maxActionPoints: 10,
        initiative: 8,
        effects: [],
        equipment: [],
        cooldowns: [],
        faction: "player",
        tags: [],
        isDead: false,
      },
    ],
    [
      "enemy_dead",
      {
        id: "enemy_dead",
        name: "Dead Enemy",
        type: "enemy",
        level: 1,
        experience: 0,
        stats: {
          strength: 5,
          dexterity: 5,
          constitution: 5,
          intelligence: 5,
          wisdom: 5,
          charisma: 5,
          health: { current: 0, maximum: 100 },
          mana: { current: 0, maximum: 50 },
          stamina: { current: 0, maximum: 30 },
          attackPower: 4,
          defense: 1,
          speed: 4,
          criticalChance: 0.01,
          criticalMultiplier: 1.1,
          evasion: 0.01,
          accuracy: 0.5,
        },
        position: { lane: 1, slot: 1 },
        actionPoints: 0,
        maxActionPoints: 10,
        initiative: 4,
        effects: [],
        equipment: [],
        cooldowns: [],
        faction: "enemy",
        tags: [],
        isDead: true,
      },
    ],
  ]);

  return {
    world: {
      currentTick: 0,
      currentTime: 299,
      zones: new Map(),
      globalFlags: new Map([["isNight", false]]),
      globalCounters: new Map(),
      activeEntities: [],
    },
    entities,
    eventLog: [],
    snapshots: new Map(),
    seed: 99,
    currentTick: 0,
    isRunning: false,
  };
}

describe("DefaultSimulationKernel world updates", () => {
  it("updates world counters, active entities, and day/night transitions", () => {
    const kernel = new DefaultSimulationKernel(createKernelState(), 99);
    kernel.start();
    kernel.tick(2);

    const state = kernel.getState();
    expect(state.world.currentTick).toBe(1);
    expect(state.world.globalCounters.get("simulation_ticks")).toBe(1);
    expect(state.world.globalCounters.get("elapsed_seconds")).toBe(2);
    expect(state.world.globalCounters.get("active_entities")).toBe(1);
    expect(state.world.activeEntities).toEqual(["player"]);
    expect(state.world.globalFlags.get("isNight")).toBe(true);
    expect(
      state.eventLog.some(
        (event) =>
          event.type === "StateChanged" &&
          event.actionType === "WorldCycleChanged",
      ),
    ).toBe(true);
  });
});

