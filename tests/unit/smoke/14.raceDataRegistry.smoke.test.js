import { describe, expect, it } from "@jest/globals";
import {
  races,
  getPassiveAbility,
} from "../../../packages/game-core/src/data/registries/RaceDataRegistry.js";

describe("smoke: RaceDataRegistry", () => {
  it("contains race entries and passive abilities", () => {
    expect(races.length).toBeGreaterThan(0);
    const passive = getPassiveAbility(races[0].id);
    expect(passive).toBeDefined();
  });
});
