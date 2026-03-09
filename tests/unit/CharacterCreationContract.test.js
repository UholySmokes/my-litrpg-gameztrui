import { describe, expect, it } from "@jest/globals";
import {
  CHARACTER_CREATION_V1_ACTIVE_SKILL_COUNT,
  CHARACTER_CREATION_V1_PASSIVE_SKILL_COUNT,
  createCharacterCreationBlueprint,
  validateCharacterCreationBlueprint,
  listCharacterCreationAlignments,
  getCharacterCreationPerkLimits,
  listCharacterCreationStarterTrees,
} from "@voidverse/game-core";

describe("CharacterCreationContract", () => {
  it("accepts blueprint without gender using v1 default loadout counts", () => {
    const activeSkills = Array.from(
      { length: CHARACTER_CREATION_V1_ACTIVE_SKILL_COUNT },
      (_, index) => `active_${index + 1}`,
    );
    const passiveSkills = Array.from(
      { length: CHARACTER_CREATION_V1_PASSIVE_SKILL_COUNT },
      (_, index) => `passive_${index + 1}`,
    );
    const blueprint = createCharacterCreationBlueprint({
      name: "Aela",
      raceId: "neo_human",
      classId: "warrior",
      originId: "street_urchin",
      professionId: "blacksmith",
      archetypeSystemId: "balanced",
      attributes: { strength: 8 },
      activeSkillIds: activeSkills,
      passiveSkillIds: passiveSkills,
    });

    const result = validateCharacterCreationBlueprint(blueprint);

    expect(result.valid).toBe(true);
    expect(result.blueprint.gender).toBeNull();
  });

  it("rejects blueprints that miss v1 default loadout counts", () => {
    const blueprint = createCharacterCreationBlueprint({
      name: "Rook",
      raceId: "neo_human",
      classId: "warrior",
      originId: "street_urchin",
      professionId: "blacksmith",
      archetypeSystemId: "balanced",
      attributes: { strength: 8 },
      activeSkillIds: ["slash", "guard", "rush"],
      passiveSkillIds: ["vigor", "resolve", "focus"],
    });

    const result = validateCharacterCreationBlueprint(blueprint);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      `Must select exactly ${CHARACTER_CREATION_V1_ACTIVE_SKILL_COUNT} active skills.`,
    );
    expect(result.errors).toContain(
      `Must select exactly ${CHARACTER_CREATION_V1_PASSIVE_SKILL_COUNT} passive skills.`,
    );
  });

  it("exposes alignment/perk/tree options for shared creation surfaces", () => {
    expect(listCharacterCreationAlignments().length).toBeGreaterThan(0);
    expect(getCharacterCreationPerkLimits()).toEqual({ minPicks: 1, maxPicks: 2 });
    expect(listCharacterCreationStarterTrees().map((entry) => entry.id)).toContain("offense");
  });
});
