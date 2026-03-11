import { describe, expect, it } from "@jest/globals";
import {
  calculateDamage,
  calculateDamagePipeline,
} from "../../packages/game-core/src/systems/combat/combatResolution.js";
import { SimBridge } from "../../packages/game-core/src/simulation/bridge/SimulationContext.js";

describe("combatResolution", () => {
  it("keeps a deterministic damage pipeline for extracted resolution", () => {
    const attacker = {
      name: "Hero",
      level: 1,
      attributes: { strength: 5, intelligence: 3, luck: 4 },
      equipment: { weapon: { stats: { attack: 10 } } },
      talents: [],
    };
    const defender = {
      name: "Training Dummy",
      stats: { defense: 2 },
    };
    const skill = {
      name: "Measured Strike",
      damage: 4,
      isMagic: false,
    };

    const result = calculateDamagePipeline(attacker, defender, skill, {
      strToDamageMultiplier: 2,
      defenseReductionFactor: 0.5,
    });

    expect(result.damage).toBe(23);
    expect(result.log.map((entry) => entry.stage)).toEqual([
      "RAW",
      "ATTACKER_MULTIPLIERS",
      "DEFENDER_MITIGATION",
      "FINAL",
    ]);
  });

  it("preserves zero-damage support for non-damaging actions", () => {
    SimBridge.initialize(7);

    try {
      const result = calculateDamage(
        {
          name: "Invoker",
          class: "mage",
          attributes: { intelligence: 8, luck: 0 },
          talents: [],
        },
        {
          name: "Barrier",
          stats: { defense: 999 },
        },
        {
          name: "Null Pulse",
          nonDamaging: true,
          damage: { base: 0, multiplier: 0 },
          isMagic: true,
        },
        {
          defenseReductionFactor: 0.5,
        },
      );

      expect(result.damage).toBe(0);
    } finally {
      SimBridge.deactivate();
    }
  });
});
