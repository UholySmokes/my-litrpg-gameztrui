import { describe, it, expect } from "@jest/globals";
import { DataRegistry } from "../../src/data/DataRegistry.js";
import { getRaceAbilitiesFor } from "../../src/systems/race/RaceAbilityRegistry.js";

describe("Race ability exposure", () => {
  it("provides passive abilities for all races", () => {
    const races = DataRegistry.getRaces();
    expect(races.length).toBeGreaterThan(0);

    races.forEach((race) => {
      expect(race.passiveAbility).toBeTruthy();
      expect(race.passiveAbility.name).toBeTruthy();
      expect(race.passiveAbility.description).toBeTruthy();
    });
  });

  it("provides active abilities for all races", () => {
    const races = DataRegistry.getRaces();

    races.forEach((race) => {
      const abilities = getRaceAbilitiesFor(race.id);
      expect(Array.isArray(abilities)).toBe(true);
      expect(abilities.length).toBeGreaterThan(0);
      const ability = abilities[0];
      expect(ability.name).toBeTruthy();
      expect(ability.description).toBeTruthy();
    });
  });
});
