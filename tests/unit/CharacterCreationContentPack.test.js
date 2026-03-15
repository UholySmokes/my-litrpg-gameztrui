import { describe, expect, it } from "@jest/globals";
import {
  getCharacterCreationArchetypeSystemById,
  getCharacterCreationArchetypeSystems,
  getCharacterCreationClassAbilitySummaries,
  getCharacterCreationClasses,
  getCharacterCreationOriginById,
  getCharacterCreationOrigins,
  getCharacterCreationRaceAbilitySummaries,
  getCharacterCreationRaces,
  getCharacterCreationSkillReferenceById,
  getCharacterCreationSkillSummaries,
  getCharacterCreationSkillSummaryById,
} from "@voidverse/game-core/characterCreation/CharacterCreationContentPack.js";
import { classes } from "@voidverse/game-core/data/registries/ClassDataRegistry.js";
import { origins } from "@voidverse/game-core/data/registries/OriginDataRegistry.js";
import { races } from "@voidverse/game-core/data/registries/RaceDataRegistry.js";
import {
  getAllArchetypeSystems,
} from "@voidverse/game-core/systems/archetype/ArchetypeSystemRegistry.js";
import {
  getClassAbilitySummariesFor,
} from "@voidverse/game-core/systems/class/ClassAbilityRegistry.js";
import {
  getRaceAbilitySummariesFor,
} from "@voidverse/game-core/systems/race/RaceAbilityRegistry.js";
import {
  getAllSkillSummaries,
} from "@voidverse/game-core/systems/skills/SkillRegistry.js";

describe("character creation content pack", () => {
  it("keeps generated class, origin, and race catalogs aligned with source registries", () => {
    const packClasses = getCharacterCreationClasses();
    const packOrigins = getCharacterCreationOrigins();
    const packRaces = getCharacterCreationRaces();

    expect(packClasses.map((entry) => entry.id)).toEqual(
      classes.map((entry) => entry.id),
    );
    expect(packOrigins.map((entry) => entry.id)).toEqual(
      origins.map((entry) => entry.id),
    );
    expect(packRaces.map((entry) => entry.id)).toEqual(
      races.map((entry) => entry.id),
    );

    const sampleClass = classes[0];
    const sampleOrigin = origins[0];
    const sampleRace = races[0];

    expect(packClasses[0]).toEqual(
      expect.objectContaining({
        id: sampleClass.id,
        name: sampleClass.name,
        baseStats: sampleClass.baseStats,
      }),
    );
    expect(getCharacterCreationOriginById(sampleOrigin.id)).toEqual(
      expect.objectContaining({
        id: sampleOrigin.id,
        name: sampleOrigin.name,
        attributeBonuses: sampleOrigin.attributeBonuses,
      }),
    );
    expect(packRaces[0]).toEqual(
      expect.objectContaining({
        id: sampleRace.id,
        name: sampleRace.name,
      }),
    );
  });

  it("keeps generated skill summaries aligned with the live skill registry", () => {
    const liveSummaries = getAllSkillSummaries();
    const packSummaries = getCharacterCreationSkillSummaries();
    const sample = liveSummaries.find((entry) => typeof entry?.id === "string");

    expect(packSummaries).toHaveLength(liveSummaries.length);
    expect(packSummaries.map((entry) => entry.id)).toEqual(
      liveSummaries.map((entry) => entry.id),
    );
    expect(getCharacterCreationSkillSummaryById(sample.id)).toEqual(
      expect.objectContaining({
        id: sample.id,
        name: sample.name,
        description: sample.description,
      }),
    );
  });

  it("keeps generated class and race ability summaries aligned with live registries", () => {
    const classWithAbilities = classes.find(
      (entry) => (getClassAbilitySummariesFor(entry.id) || []).length > 0,
    );
    const raceWithAbilities = races.find(
      (entry) => (getRaceAbilitySummariesFor(entry.id) || []).length > 0,
    );

    expect(classWithAbilities).toBeTruthy();
    expect(raceWithAbilities).toBeTruthy();

    const liveClassSummaries = getClassAbilitySummariesFor(classWithAbilities.id);
    const packClassSummaries = getCharacterCreationClassAbilitySummaries(
      classWithAbilities.id,
    );
    const liveRaceSummaries = getRaceAbilitySummariesFor(raceWithAbilities.id);
    const packRaceSummaries = getCharacterCreationRaceAbilitySummaries(
      raceWithAbilities.id,
    );

    expect(packClassSummaries.map((entry) => entry.id)).toEqual(
      liveClassSummaries.map((entry) => entry.id),
    );
    expect(packRaceSummaries.map((entry) => entry.id)).toEqual(
      liveRaceSummaries.map((entry) => entry.id),
    );
  });

  it("keeps generated archetype systems aligned with the live registry", () => {
    const liveSystems = getAllArchetypeSystems().filter(
      (entry) => entry?.characterCreation?.ordering?.selectable === true,
    );
    const packSystems = getCharacterCreationArchetypeSystems();
    const sample = liveSystems[0];

    expect(packSystems.map((entry) => entry.id)).toEqual(
      liveSystems.map((entry) => entry.id),
    );
    expect(getCharacterCreationArchetypeSystemById(sample.id)).toEqual(
      expect.objectContaining({
        id: sample.id,
        name: sample.name,
        category: sample.category,
        coreLoop: sample.coreLoop,
        possibleUses: sample.possibleUses,
        limits: sample.limits,
        costs: sample.costs,
        worldCompatibility: sample.worldCompatibility,
        rarity: sample.rarity,
        stability: sample.stability,
        characterCreation: sample.characterCreation,
      }),
    );
  });

  it("resolves creation skill references across skills and ability catalogs", () => {
    const skillId = getAllSkillSummaries()[0]?.id;
    const classAbilityId =
      classes
        .flatMap((entry) => getClassAbilitySummariesFor(entry.id) || [])
        .find((entry) => entry?.id)?.id || null;
    const raceAbilityId =
      races
        .flatMap((entry) => getRaceAbilitySummariesFor(entry.id) || [])
        .find((entry) => entry?.id)?.id || null;

    expect(getCharacterCreationSkillReferenceById(skillId)).toEqual(
      expect.objectContaining({ id: skillId }),
    );
    expect(getCharacterCreationSkillReferenceById(classAbilityId)).toEqual(
      expect.objectContaining({ id: classAbilityId }),
    );
    expect(getCharacterCreationSkillReferenceById(raceAbilityId)).toEqual(
      expect.objectContaining({ id: raceAbilityId }),
    );
  });
});
