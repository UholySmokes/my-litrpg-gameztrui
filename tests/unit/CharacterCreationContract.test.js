import { describe, expect, it } from "@jest/globals";
import {
  createCharacterCreationBlueprint,
  getCharacterCreationSkillSelectionLimits,
  listCharacterCreationAlignments,
  getCharacterCreationPerkLimits,
  listCharacterCreationStarterTrees,
  validateCharacterCreationBlueprint,
} from "@voidverse/game-core";

describe("CharacterCreationContract", () => {
  it("accepts blueprint without gender", () => {
    const limits = getCharacterCreationSkillSelectionLimits();
    const blueprint = createCharacterCreationBlueprint({
      name: "Aela",
      raceId: "neo_human",
      classId: "warrior",
      startingZoneId: "city",
      professionId: "blacksmith",
      archetypeSystemId: "balanced",
      attributes: { strength: 8 },
      activeSkillIds: ["slash", "guard", "rush"],
      passiveSkillIds: ["vigor", "resolve", "focus", "grit", "discipline", "instinct"],
    });

    const result = validateCharacterCreationBlueprint(blueprint);

    expect(result.valid).toBe(true);
    expect(result.blueprint.gender).toBeNull();
    expect(limits).toEqual({
      requiredActiveSkillCount: 3,
      requiredPassiveSkillCount: 6,
    });
  });

  it("exposes alignment/perk/tree options for shared creation surfaces", () => {
    expect(listCharacterCreationAlignments().length).toBeGreaterThan(0);
    expect(getCharacterCreationPerkLimits()).toEqual({ minPicks: 1, maxPicks: 2 });
    expect(listCharacterCreationStarterTrees().map((entry) => entry.id)).toContain("offense");
  });
});
