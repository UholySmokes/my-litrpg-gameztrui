import { describe, expect, it } from "@jest/globals";
import {
  CHARACTER_CREATION_BLUEPRINT_VERSION,
  createCharacterCreationBlueprint,
  getCharacterCreationSkillSelectionLimits,
  listCharacterCreationAlignments,
  getCharacterCreationPerkLimits,
  getCharacterCreationStarterTreeLimits,
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
      startingPrompt: "I steady myself, look around, and ask who needs help first.",
      professionId: "blacksmith",
      archetypeSystemId: "balanced",
      attributes: { strength: 8 },
      activeSkillIds: ["slash", "guard", "rush"],
      passiveSkillIds: ["vigor", "resolve", "focus", "grit", "discipline", "instinct"],
    });

    const result = validateCharacterCreationBlueprint(blueprint);

    expect(result.valid).toBe(true);
    expect(result.blueprint.version).toBe(CHARACTER_CREATION_BLUEPRINT_VERSION);
    expect(result.blueprint.skillCatalogVersion).toBe("lattice_v2");
    expect(result.blueprint.gender).toBeNull();
    expect(result.blueprint.startingLocationId).toBeNull();
    expect(result.blueprint.startingZoneId).toBeNull();
    expect(limits).toEqual({
      requiredActiveSkillCount: 3,
      requiredPassiveSkillCount: 6,
    });
  });

  it("exposes alignment/perk/tree options for shared creation surfaces", () => {
    expect(listCharacterCreationAlignments().length).toBeGreaterThan(0);
    expect(getCharacterCreationPerkLimits()).toEqual({ minPicks: 1, maxPicks: 2 });
    expect(getCharacterCreationStarterTreeLimits()).toEqual({ minPicks: 0, maxPicks: 1 });
    expect(listCharacterCreationStarterTrees().map((entry) => entry.id)).toContain("offense");
  });

  it("accepts a blueprint without starter trees when the flow does not require one", () => {
    const blueprint = createCharacterCreationBlueprint({
      name: "Aela",
      raceId: "neo_human",
      classId: "warrior",
      startingPrompt: "I wake in a forest and steady my breathing.",
      professionId: "blacksmith",
      archetypeSystemId: "balanced",
      attributes: { strength: 8 },
      activeSkillIds: ["slash", "guard", "rush"],
      passiveSkillIds: ["vigor", "resolve", "focus", "grit", "discipline", "instinct"],
      starterTreeIds: [],
    });

    const result = validateCharacterCreationBlueprint(blueprint, {
      requiresStarterTree: false,
    });

    expect(result.valid).toBe(true);
  });

  it("hard-rejects pre-v2 blueprints instead of migrating them", () => {
    const result = validateCharacterCreationBlueprint({
      version: 3,
      name: "Aela",
      raceId: "neo_human",
      classId: "warrior",
      startingPrompt: "I wake in a forest and steady my breathing.",
      professionId: "blacksmith",
      archetypeSystemId: "balanced",
      attributes: { strength: 8 },
      activeSkillIds: ["slash", "guard", "rush"],
      passiveSkillIds: ["vigor", "resolve", "focus", "grit", "discipline", "instinct"],
    });

    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("Blueprint version must be 4");
    expect(result.errors.join(" ")).toContain("Skill catalog version must be lattice_v2");
  });
});
