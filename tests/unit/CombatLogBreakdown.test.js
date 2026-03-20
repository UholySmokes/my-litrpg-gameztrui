import { describe, expect, it } from "@jest/globals";
import { initialGameState } from "../../src/data/initialState.js";
import { startCombat } from "../../src/systems/combat/CombatSystem.js";
import { gameReducer } from "../../src/core/gameReducer.js";

describe("combat log breakdown", () => {
  it("includes lane modifiers in the visible combat log entry after a repositioned attack", () => {
    const combatState = startCombat(
      {
        ...initialGameState,
        player: {
          ...initialGameState.player,
          name: "Wanderer",
          attributes: {
            ...initialGameState.player.attributes,
            strength: 25,
          },
        },
      },
      ["goblin"],
    );

    const shiftedState = {
      ...combatState,
      combat: {
        ...combatState.combat,
        lanes: {
          ...combatState.combat.lanes,
          player: 3,
          enemies: [1],
        },
      },
    };

    const next = gameReducer(shiftedState, {
      type: "PLAYER_ATTACK",
      payload: { enemyIndex: 0 },
    });

    const attackLine = next.combat.log.find((entry) =>
      String(entry).includes("attacks Goblin"),
    );

    expect(attackLine).toContain("Lane gap 2: x0.7");
    expect(attackLine).toContain("damage");
  });
});