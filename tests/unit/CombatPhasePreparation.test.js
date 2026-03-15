import { describe, expect, it } from "@jest/globals";
import {
  allowsZeroDamage,
  applyShieldAbsorptionToEnemy,
  resolveAbilityTargets,
} from "../../packages/game-core/src/systems/combat/combatPreparation.js";

describe("combatPreparation", () => {
  it("keeps non-damaging skills eligible for zero damage results", () => {
    expect(
      allowsZeroDamage({
        damage: { base: 0, multiplier: 0 },
      }),
    ).toBe(true);
    expect(
      allowsZeroDamage({
        tags: ["no_damage"],
      }),
    ).toBe(true);
    expect(
      allowsZeroDamage({
        damage: { base: 4, multiplier: 1.2 },
      }),
    ).toBe(false);
  });

  it("caps aoe target selection to living enemies in stable order", () => {
    const combatState = {
      enemies: [
        { stats: { hp: { current: 10 } } },
        { stats: { hp: { current: 0 } } },
        { stats: { hp: { current: 8 } } },
        { stats: { hp: { current: 6 } } },
      ],
    };

    const targets = resolveAbilityTargets(combatState, 1, {
      aoe: { maxTargets: 2 },
    });

    expect(targets).toEqual([0, 2]);
  });

  it("absorbs damage through enemy shields before hp loss", () => {
    const enemy = {
      effects: [
        { id: "shield", magnitude: 5 },
        { id: "burn", magnitude: 2 },
      ],
    };

    const result = applyShieldAbsorptionToEnemy(enemy, 8);

    expect(result.damage).toBe(3);
    expect(result.absorbed).toBe(5);
    expect(result.enemy.effects).toEqual([{ id: "burn", magnitude: 2 }]);
  });
});
