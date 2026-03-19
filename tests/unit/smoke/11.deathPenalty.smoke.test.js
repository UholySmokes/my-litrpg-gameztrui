import { describe, expect, it } from "@jest/globals";
import {
  applyDeathPenalty,
  DEATH_GOLD_PENALTY_PERCENT,
} from "../../../packages/game-core/src/systems/DeathPenalty.js";

describe("smoke: DeathPenalty", () => {
  it("applies gold loss and respawn vitals", () => {
    const player = {
      gold: 100,
      hp: { current: 0, max: 100 },
      mana: { current: 0, max: 50 },
    };
    const result = applyDeathPenalty(player, "test enemy");
    expect(result.updatedPlayer.gold).toBe(90);
    expect(result.updatedPlayer.hp.current).toBe(1);
    expect(DEATH_GOLD_PENALTY_PERCENT).toBeGreaterThan(0);
  });
});
