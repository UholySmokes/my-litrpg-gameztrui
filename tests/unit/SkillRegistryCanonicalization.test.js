import { describe, expect, it } from "@jest/globals";
import { getAllSkills, getSkillsByClass } from "@voidverse/game-core/systems/skills/SkillRegistry.js";
import { classes } from "@voidverse/game-core/data/registries/ClassDataRegistry.js";
import { PROFESSIONS } from "@voidverse/game-core/systems/profession/ProfessionRegistry.js";

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
      });
      pool.passive.forEach((skill) => {
        expect(skill.class).toBe(classId);
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
    allSkills.forEach((skill) => {
      if (!allowedOwners.has(skill.class)) {
        leakedOwners.push(skill.class);
      }
    });

    expect(leakedOwners).toHaveLength(0);
  });
});
