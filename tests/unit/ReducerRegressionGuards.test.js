import { describe, expect, it } from "@jest/globals";
import { gameReducer } from "../../src/core/gameReducer.js";
import { initialGameState } from "../../src/data/initialState.js";
import { startCombat } from "../../src/systems/combat/CombatSystem.js";
import { xpForNextLevel } from "../../packages/game-core/src/core/xpCurve.js";

const cloneState = (state) => JSON.parse(JSON.stringify(state));

describe("reducer regression guards", () => {
  it("does not equip items that are not present in inventory", () => {
    const state = cloneState(initialGameState);
    state.player.equipment = {
      weapon: { id: "rusty_sword", name: "Rusty Sword", quantity: 1 },
    };
    state.player.inventory = [];

    const next = gameReducer(state, {
      type: "EQUIP_ITEM",
      payload: {
        slot: "weapon",
        item: { id: "legendary_blade", name: "Legendary Blade", quantity: 1 },
      },
    });

    expect(next).toEqual(state);
  });

  it("keeps player xp object-shaped after prestige", () => {
    const state = cloneState(initialGameState);
    state.player.level = 60;
    state.player.xp = {
      current: 999,
      max: 1200,
    };

    const next = gameReducer(state, { type: "PERFORM_PRESTIGE" });

    expect(next.player.level).toBe(1);
    expect(next.player.xp).toEqual({
      current: 0,
      max: xpForNextLevel(1, state.config),
    });
  });

  it("starts combat with enemy lanes in the configured 1-based range", () => {
    const combatState = startCombat(cloneState(initialGameState), [
      "goblin",
      "goblin",
      "goblin",
    ]);

    expect(combatState.combat.lanes.enemies).toEqual([1, 2, 3]);
  });
});
