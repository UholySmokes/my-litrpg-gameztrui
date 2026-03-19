import { describe, expect, it } from "@jest/globals";
import {
  PITY_THRESHOLD,
  gachaPools,
  resolvePityRarity,
} from "../../../packages/game-core/src/data/gachaData.js";

describe("smoke: gachaData", () => {
  it("exports pity constants and pools", () => {
    expect(PITY_THRESHOLD).toBeGreaterThan(0);
    expect(gachaPools.equipment).toBeDefined();
    expect(resolvePityRarity(PITY_THRESHOLD, 0)).toBeDefined();
  });
});
