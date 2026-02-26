import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "@jest/globals";

import { createSystemEngine } from "../../packages/game-core/src/engine/createSystemEngine.js";
import { initialGameState } from "../../packages/game-core/src/data/initialState.js";
import { gameStateToSimulation } from "../../packages/game-core/src/simulation/bridge/GameStateAdapter.js";
import { DefaultSimulationKernel } from "../../packages/game-core/src/simulation/kernel/SimulationKernel.ts";

const fixturePath = path.resolve(
  process.cwd(),
  "tests/fixtures/runtimeSimulationParity.fixtures.json",
);
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const cloneState = (state) => JSON.parse(JSON.stringify(state));

describe("runtime/simulation parity fixtures", () => {
  for (const scenario of fixture.scenarios) {
    it(`maintains invariants for ${scenario.id}`, () => {
      const runCount = Number.isFinite(scenario.repeat) ? scenario.repeat : 1;
      const runtimeInitial = cloneState(initialGameState);
      const runtimeInitialHp = Number(runtimeInitial.player?.hp?.current || 0);
      const runtimeInitialMana = Number(runtimeInitial.player?.mana?.current || 0);
      const runtimeEngine = createSystemEngine({ seed: 1337, mode: "client" });
      const runtimeStartTick = Number(runtimeEngine.tick || 0);
      let runtimeState = runtimeInitial;

      const simulationState = gameStateToSimulation(cloneState(runtimeInitial));
      const simulationInitialHp = Number(
        simulationState.entities.get("player")?.stats?.health?.current || 0,
      );
      const simulationInitialMana = Number(
        simulationState.entities.get("player")?.stats?.mana?.current || 0,
      );
      const simulationKernel = new DefaultSimulationKernel(simulationState, 1337);
      const simulationStartTick = simulationKernel.getState().currentTick;
      simulationKernel.start();

      for (let i = 0; i < runCount; i += 1) {
        const runtimeResult = runtimeEngine.step(
          { kind: "action", action: scenario.runtimeAction },
          runtimeState,
        );
        expect(runtimeResult.ok).toBe(true);
        runtimeState = runtimeResult.nextState;

        const currentTick = simulationKernel.getState().currentTick;
        simulationKernel.enqueueCommand({
          id: `${scenario.id}-${i}`,
          entityId: "player",
          timestamp: currentTick,
          ...scenario.simulationCommand,
        });
        simulationKernel.tick(1);
      }

      const simulationFinal = simulationKernel.getState();
      const simPlayer = simulationFinal.entities.get("player");
      expect(simPlayer).toBeDefined();

      if (scenario.assertions.includes("tick_advances")) {
        expect(Number(runtimeEngine.tick || 0) - runtimeStartTick).toBe(runCount);
        expect(simulationFinal.currentTick - simulationStartTick).toBe(runCount);
      }

      if (scenario.assertions.includes("hp_non_decreasing")) {
        expect(Number(runtimeState.player?.hp?.current || 0)).toBeGreaterThanOrEqual(runtimeInitialHp);
        expect(Number(simPlayer.stats.health.current || 0)).toBeGreaterThanOrEqual(simulationInitialHp);
      }

      if (scenario.assertions.includes("mana_non_decreasing")) {
        expect(Number(runtimeState.player?.mana?.current || 0)).toBeGreaterThanOrEqual(runtimeInitialMana);
        expect(Number(simPlayer.stats.mana.current || 0)).toBeGreaterThanOrEqual(simulationInitialMana);
      }

      if (scenario.assertions.includes("resources_bounded")) {
        expect(Number(runtimeState.player.hp.current)).toBeLessThanOrEqual(
          Number(runtimeState.player.hp.max),
        );
        expect(Number(runtimeState.player.mana.current)).toBeLessThanOrEqual(
          Number(runtimeState.player.mana.max),
        );
        expect(Number(simPlayer.stats.health.current)).toBeLessThanOrEqual(
          Number(simPlayer.stats.health.maximum),
        );
        expect(Number(simPlayer.stats.mana.current)).toBeLessThanOrEqual(
          Number(simPlayer.stats.mana.maximum),
        );
      }
    });
  }
});
