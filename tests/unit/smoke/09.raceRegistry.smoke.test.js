import { describe, expect, it } from "@jest/globals";
import {
  applyRaceModifiers,
  getRaceById,
} from "../../../packages/game-core/src/systems/race/RaceRegistry.js";

describe("smoke: RaceRegistry", () => {
  it("returns race data and applies modifiers", () => {
    const race = getRaceById("pure_human");
    expect(race).toBeDefined();
    const modified = applyRaceModifiers({ strength: 5, agility: 5 }, race?.id || "pure_human");
    expect(modified).toBeDefined();
  });
});
