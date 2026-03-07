import { describe, expect, it } from "@jest/globals";
import {
  createCharacterCreationBlueprint,
  validateCharacterCreationBlueprint,
  listCharacterCreationAlignments,
  getCharacterCreationPerkLimits,
  listCharacterCreationStarterTrees,
} from "@voidverse/game-core";

describe("CharacterCreationContract", () => {
  it("accepts blueprint without gender", () => {
    const blueprint = createCharacterCreationBlueprint({
      name: "Aela",
      raceId: "neo_human",
      classId: "warrior",
      originId: "street_urchin",
      professionId: "blacksmith",
      archetypeSystemId: "balanced",
      attributes: { strength: 8 },
      activeSkillIds: ["slash", "guard", "rush"],
      passiveSkillIds: ["vigor", "resolve", "focus", "grit", "discipline", "instinct"],
    });

    const result = validateCharacterCreationBlueprint(blueprint, {
      requiredActiveSkillCount: 3,
      requiredPassiveSkillCount: 6,
    });

    expect(result.valid).toBe(true);
    expect(result.blueprint.gender).toBeNull();
  });

  it("exposes alignment/perk/tree options for shared creation surfaces", () => {
    expect(listCharacterCreationAlignments().length).toBeGreaterThan(0);
    expect(getCharacterCreationPerkLimits()).toEqual({ minPicks: 1, maxPicks: 2 });
    expect(listCharacterCreationStarterTrees().map((entry) => entry.id)).toContain("offense");
  });
});
