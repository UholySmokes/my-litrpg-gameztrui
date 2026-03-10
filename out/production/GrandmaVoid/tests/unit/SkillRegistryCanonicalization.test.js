import { describe, expect, it } from "@jest/globals";
import {
  getAllSkills,
  getSkillsByClass,
  getLatticeSkillById,
  getLatticeSkillsByClass,
} from "@voidverse/game-core/systems/skills/SkillRegistry.js";
import { classes } from "@voidverse/game-core/data/registries/ClassDataRegistry.js";
import { PROFESSIONS } from "@voidverse/game-core/systems/profession/ProfessionRegistry.js";
import { LATTICE_FAMILIES } from "@voidverse/game-core/systems/skills/LivingLatticeSystem.js";

describe("SkillRegistry canonical class ownership", () => {
  it("provides playable skill pools for tier-3 canonical classes", () => {
    const tier3ClassIds = classes
      .filter((entry) => Number(entry?.tier) === 3)
      .map((entry) => entry.id);

    expect(tier3ClassIds.length).toBeGreaterThan(0);

    for (const classId of tier3ClassIds) {
      const pool = getSkillsByClass(classId);
      expect(pool.active.length).toBeGreaterThan(0);
      expect(pool.passive.length).toBeGreaterThan(0);
      pool.active.forEach((skill) => {
        expect(skill.class).toBe(classId);
        expect(skill.ownerType).toBe("class");
        expect(skill.ownerId).toBe(classId);
        expect(skill.lattice?.id).toBe(skill.id);
        expect(LATTICE_FAMILIES).toContain(skill.latticeFamily);
        expect(typeof skill.runtimeRole).toBe("string");
        expect(skill.grandmaVoidBoundaryId).toBe("grandma_void");
      });
      pool.passive.forEach((skill) => {
        expect(skill.class).toBe(classId);
        expect(skill.ownerType).toBe("class");
        expect(skill.ownerId).toBe(classId);
        expect(skill.lattice?.id).toBe(skill.id);
        expect(LATTICE_FAMILIES).toContain(skill.latticeFamily);
        expect(typeof skill.runtimeRole).toBe("string");
        expect(skill.grandmaVoidBoundaryId).toBe("grandma_void");
      });
    }
  });

  it("emits only canonical/reserved skill owner ids from getAllSkills", () => {
    const canonicalClassIds = new Set(classes.map((entry) => entry.id));
    const professionIds = new Set(
      Object.values(PROFESSIONS).map((entry) => entry.id),
    );
    const allowedOwners = new Set([
      ...canonicalClassIds,
      ...professionIds,
      "universal",
    ]);

    const allSkills = getAllSkills();
    const leakedOwners = [];
    const invalidOwnerShapes = [];
    const allowedOwnerTypes = new Set([
      "class",
      "profession",
      "universal",
      "system",
    ]);
    allSkills.forEach((skill) => {
      if (!allowedOwners.has(skill.class)) {
        leakedOwners.push(skill.class);
      }
      if (
        !allowedOwnerTypes.has(skill.ownerType) ||
        typeof skill.ownerId !== "string" ||
        skill.ownerId.trim().length === 0
      ) {
        invalidOwnerShapes.push(skill.id);
      }
    });

    expect(leakedOwners).toHaveLength(0);
    expect(invalidOwnerShapes).toHaveLength(0);
  });

  it("exposes lattice projections without changing the underlying class pool contract", () => {
    const sampleClassId = classes.find((entry) => Number(entry?.tier) === 1)?.id || classes[0]?.id;
    expect(sampleClassId).toBeTruthy();

    const rawPool = getSkillsByClass(sampleClassId);
    const latticePool = getLatticeSkillsByClass(sampleClassId);

    expect(latticePool.active.length).toBe(rawPool.active.length);
    expect(latticePool.passive.length).toBe(rawPool.passive.length);
    expect(LATTICE_FAMILIES).toContain(latticePool.active[0]?.family);
  });

  it("returns lattice metadata for individual skill lookups", () => {
    const sampleSkill = getAllSkills()[0];
    expect(sampleSkill).toBeTruthy();

    const latticeSkill = getLatticeSkillById(sampleSkill.id);
    expect(latticeSkill?.id).toBe(sampleSkill.id);
    expect(LATTICE_FAMILIES).toContain(latticeSkill?.family);
  });
});
