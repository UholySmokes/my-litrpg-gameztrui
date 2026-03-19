import { describe, expect, it } from "@jest/globals";
import { startCombat } from "../../../packages/game-core/src/systems/combat/CombatSystem.js";
import { initialGameState } from "../../../packages/game-core/src/data/initialState.js";

describe("smoke: CombatSystem", () => {
  it("can start combat against goblin", () => {
    const state = startCombat(initialGameState, ["goblin"]);
    expect(state.combat.status).toBe("active");
    expect(state.combat.enemies.length).toBeGreaterThan(0);
  });
});
