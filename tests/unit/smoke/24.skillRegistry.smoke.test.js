import { describe, expect, it } from "@jest/globals";
import {
  getAllSkills,
  getSkillById,
} from "../../../packages/game-core/src/systems/skills/SkillRegistry.js";

describe("smoke: SkillRegistry", () => {
  it("returns skills and resolves a known starter skill", () => {
    const skills = getAllSkills();
    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBeGreaterThan(0);
    expect(getSkillById("power_strike")).toBeDefined();
  });
});
