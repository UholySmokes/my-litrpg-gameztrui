import { describe, expect, it } from "@jest/globals";
import { DataRegistry } from "../../src/data/DataRegistry.js";
import {
  getClassAbilitiesFor,
  getClassAbilitySummariesFor,
} from "../../src/systems/class/ClassAbilityRegistry.js";
import {
  getRaceAbilitiesFor,
  getRaceAbilitySummariesFor,
} from "../../src/systems/race/RaceAbilityRegistry.js";

describe("ability summary registries", () => {
  it("keeps class ability summaries aligned with the full registry", () => {
    const cls = DataRegistry.getClasses().find(
      (candidate) => (getClassAbilitiesFor(candidate.id) || []).length > 0,
    );
    expect(cls).toBeTruthy();

    const abilities = getClassAbilitiesFor(cls.id) || [];
    const summaries = getClassAbilitySummariesFor(cls.id);

    expect(summaries.map((entry) => entry.id)).toEqual(
      abilities.map((entry) => entry.id),
    );
    expect(summaries[0]).toEqual(
      expect.objectContaining({
        id: abilities[0].id,
        name: abilities[0].name,
        description: abilities[0].description,
      }),
    );
  });

  it("keeps race ability summaries aligned with the full registry", () => {
    const race = DataRegistry.getRaces().find(
      (candidate) => (getRaceAbilitiesFor(candidate.id) || []).length > 0,
    );
    expect(race).toBeTruthy();

    const abilities = getRaceAbilitiesFor(race.id) || [];
    const summaries = getRaceAbilitySummariesFor(race.id);

    expect(summaries.map((entry) => entry.id)).toEqual(
      abilities.map((entry) => entry.id),
    );
    expect(summaries[0]).toEqual(
      expect.objectContaining({
        id: abilities[0].id,
        name: abilities[0].name,
        description: abilities[0].description,
      }),
    );
  });
});
