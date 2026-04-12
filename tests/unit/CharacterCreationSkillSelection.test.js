import { describe, expect, it } from "@jest/globals";
import {
  buildCharacterCreationLatticeProfile,
  buildCharacterCreationSkillPools,
  getCharacterCreationSkillSelectionLimits,
  listCharacterCreationSkillLoadouts,
  resolveCharacterCreationSkillLoadout,
  validateCharacterCreationSkillSelections,
} from "@voidverse/game-core";
import {
  getCharacterCreationClasses,
  getCharacterCreationRaces,
} from "../../packages/game-core/src/characterCreation/CharacterCreationContentPack.js";
import { DataRegistry } from "../../src/data/DataRegistry.js";

describe("CharacterCreationSkillSelection", () => {
  const cls = DataRegistry.getClassById("warrior") || DataRegistry.getClasses()[0];
  const race = DataRegistry.getRaceById("pure_human") || DataRegistry.getRaces()[0];
  const professionId = "blacksmithing";

  it("builds lattice-aware creation pools", () => {
    const pools = buildCharacterCreationSkillPools(cls, race);
    expect(pools.active.length).toBeGreaterThan(0);
    expect(pools.passive.length).toBeGreaterThan(0);

    const sampleActive = pools.active[0];
    const samplePassive = pools.passive[0];

    expect(sampleActive.slotType).toBe("active");
    expect(samplePassive.slotType).toBe("passive");
    expect(typeof sampleActive.latticeFamily).toBe("string");
    expect(sampleActive.latticeFamily.length).toBeGreaterThan(0);
    expect(typeof samplePassive.latticeSourceType).toBe("string");
    expect(samplePassive.latticeSourceType.length).toBeGreaterThan(0);
    expect(sampleActive.creationLabels.family.length).toBeGreaterThan(0);
    expect(pools.active.length).toBeLessThanOrEqual(8);
    expect(pools.passive.length).toBeLessThanOrEqual(13);
  });

  it("uses catalog-owned class starter skills even when generated class summaries have empty skill arrays", () => {
    const summaryClass =
      getCharacterCreationClasses().find((entry) => entry.id === "warrior") ||
      getCharacterCreationClasses()[0];
    const summaryRace =
      getCharacterCreationRaces().find((entry) => entry.id === "pure_human") ||
      getCharacterCreationRaces()[0];

    expect(Array.isArray(summaryClass?.skills)).toBe(true);
    expect(summaryClass.skills).toHaveLength(0);

    const pools = buildCharacterCreationSkillPools(summaryClass, summaryRace);
    const activeOwnerTypes = new Set(pools.active.map((skill) => skill.ownerType));
    const passiveOwnerTypes = new Set(pools.passive.map((skill) => skill.ownerType));

    expect(pools.active).toHaveLength(7);
    expect(pools.passive).toHaveLength(11);
    expect(activeOwnerTypes.has("class")).toBe(true);
    expect(passiveOwnerTypes.has("class")).toBe(true);
  });

  it("auto-grants the profession tier-1 passive instead of offering it as an elective", () => {
    const pools = buildCharacterCreationSkillPools(cls, race, { professionId });
    expect(Array.isArray(pools.grantedPassive)).toBe(true);
    expect(pools.grantedPassive.length).toBeGreaterThan(0);
    pools.grantedPassive.forEach((skill) => {
      expect(skill.ownerType).toBe("profession");
      expect(skill.ownerId).toBe(professionId);
    });
    const electivePassiveIds = new Set(pools.passive.map((skill) => skill.id));
    pools.grantedPassive.forEach((skill) => {
      expect(electivePassiveIds.has(skill.id)).toBe(false);
    });
  });

  it("resolves contextual loadouts into concrete skill ids", () => {
    const limits = getCharacterCreationSkillSelectionLimits();
    const loadouts = listCharacterCreationSkillLoadouts({
      cls,
      race,
      professionId,
    });

    expect(loadouts.length).toBeGreaterThan(0);
    loadouts.forEach((loadout) => {
      expect(loadout.activeSkillIds).toHaveLength(limits.requiredActiveSkillCount);
      expect(loadout.passiveSkillIds).toHaveLength(limits.requiredPassiveSkillCount);
    });

    const resolved = resolveCharacterCreationSkillLoadout(loadouts[0].id, {
      cls,
      race,
      professionId,
    });

    expect(resolved?.id).toBe(loadouts[0].id);
    expect(resolved?.activeSkillIds).toEqual(loadouts[0].activeSkillIds);
    expect(resolved?.passiveSkillIds).toEqual(loadouts[0].passiveSkillIds);
    expect(resolved?.professionFocusId).toBe(professionId);
  });

  it("validates selected ids and rejects wrong-slot entries", () => {
    const loadout = listCharacterCreationSkillLoadouts({
      cls,
      race,
      professionId,
    })[0];

    const validSelection = validateCharacterCreationSkillSelections({
      cls,
      race,
      professionId,
      activeSkillIds: loadout.activeSkillIds,
      passiveSkillIds: loadout.passiveSkillIds,
      skillLoadoutId: loadout.id,
    });

    expect(validSelection.valid).toBe(true);
    expect(validSelection.activeSkills).toHaveLength(
      getCharacterCreationSkillSelectionLimits().requiredActiveSkillCount,
    );
    expect(validSelection.loadoutSummary.activeSkillIds).toEqual(loadout.activeSkillIds);
    expect(validSelection.loadoutSummary.professionFocusId).toBe(professionId);

    const invalidSelection = validateCharacterCreationSkillSelections({
      cls,
      race,
      professionId,
      activeSkillIds: [
        ...loadout.activeSkillIds.slice(0, 2),
        loadout.passiveSkillIds[0],
      ],
      passiveSkillIds: loadout.passiveSkillIds,
      skillLoadoutId: loadout.id,
    });

    expect(invalidSelection.valid).toBe(false);
    expect(invalidSelection.errors.join(" ")).toContain("active skill");
  });

  it("builds bootstrap lattice metadata without changing talent behavior", () => {
    const loadout = listCharacterCreationSkillLoadouts({
      cls,
      race,
      professionId,
    })[0];
    const selection = validateCharacterCreationSkillSelections({
      cls,
      race,
      professionId,
      activeSkillIds: loadout.activeSkillIds,
      passiveSkillIds: loadout.passiveSkillIds,
      skillLoadoutId: loadout.id,
    });

    const profile = buildCharacterCreationLatticeProfile({
      activeSkills: selection.activeSkills,
      passiveSkills: selection.passiveSkills,
      professionId,
      loadout: selection.loadout,
      talentIds: ["arcane_focus"],
    });

    expect(profile.activeSkillIds).toEqual(loadout.activeSkillIds);
    expect(profile.passiveSkillIds).toEqual(loadout.passiveSkillIds);
    expect(profile.loadoutSummary.professionFocusId).toBe(professionId);
    expect(profile.talentMigrationLanes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "arcane_focus",
          lane: "persistent_lattice_modifier",
        }),
      ]),
    );
  });
});
