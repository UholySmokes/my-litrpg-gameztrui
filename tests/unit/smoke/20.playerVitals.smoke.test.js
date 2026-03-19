import { describe, expect, it } from "@jest/globals";
import { updatePlayerVitals } from "../../../packages/game-core/src/core/PlayerVitals.js";
import { initialGameState } from "../../../packages/game-core/src/data/initialState.js";

describe("smoke: PlayerVitals", () => {
  it("recalculates hp and mana envelopes", () => {
    const player = updatePlayerVitals(initialGameState.player, initialGameState.config);
    expect(player.hp.max).toBeGreaterThan(0);
    expect(player.mana.max).toBeGreaterThan(0);
  });
});
