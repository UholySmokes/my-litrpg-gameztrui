import { describe, expect, it } from "@jest/globals";
import { gameReducer } from "../../src/core/gameReducer.js";
import { initialGameState } from "../../src/data/initialState.js";
import { startCombat } from "../../src/systems/combat/CombatSystem.js";

describe("combat lane positioning", () => {
  it("lets the player reposition and resolves the enemy turn", () => {
    const state = startCombat(
      {
        ...initialGameState,
        player: {
          ...initialGameState.player,
          hp: {
            ...initialGameState.player.hp,
            current: initialGameState.player.hp.max,
          },
        },
      },
      ["goblin"],
    );

    const next = gameReducer(state, {
      type: "PLAYER_SET_COMBAT_LANE",
      payload: { lane: 3 },
    });

    expect(next.combat.lanes.player).toBe(3);
    expect(next.combat.turn).toBe("player");
    expect(next.combat.log.some((entry) => String(entry).includes("shift from lane 1 to lane 3"))).toBe(true);
  });

  it("ignores lane reposition requests outside active player turns", () => {
    const state = {
      ...initialGameState,
      combat: {
        status: "active",
        turn: "enemy",
        enemies: [],
        log: [],
        lanes: {
          player: 1,
          enemies: [],
        },
      },
    };

    const next = gameReducer(state, {
      type: "PLAYER_SET_COMBAT_LANE",
      payload: { lane: 2 },
    });

    expect(next).toBe(state);
  });
});