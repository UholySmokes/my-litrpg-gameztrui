import { describe, expect, it } from "@jest/globals";
import { DataRegistry } from "../../src/data/DataRegistry.js";
import { buildCharacterCreationSkillPools } from "../../src/hook/useCharacterCreationReworked.js";
import {
  getAllSkills,
  getAllSkillSummaries,
  getSkillSummaryById,
} from "../../src/systems/skills/SkillRegistry.js";

const sortIds = (skills = []) =>
  skills
    .map((skill) => skill?.id)
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));

describe("skill registry summary indexes", () => {
  it("exposes lightweight summaries for every normalized skill", () => {
    const allSkills = getAllSkills();
    const summaries = getAllSkillSummaries();

    expect(summaries).toHaveLength(allSkills.length);
    expect(summaries[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        tags: expect.any(Array),
        affinityTags: expect.any(Array),
      }),
    );
    expect(summaries[0].effects).toBeUndefined();
  });

  it("returns summary lookups that stay aligned with full skill definitions", () => {
    const sample = getAllSkills().find((skill) => typeof skill?.id === "string");
    const summary = getSkillSummaryById(sample.id);

    expect(summary).toEqual(
      expect.objectContaining({
        id: sample.id,
        name: sample.name,
        description: sample.description,
      }),
    );
  });

  it("builds character creation pools identically from full skills and summaries", () => {
    const cls = DataRegistry.getClassById("warrior") || DataRegistry.getClasses()[0];
    const race =
      DataRegistry.getRaceById("pure_human") || DataRegistry.getRaces()[0];

    const fullPools = buildCharacterCreationSkillPools(cls, race, {
      allSkills: getAllSkills(),
    });
    const summaryPools = buildCharacterCreationSkillPools(cls, race, {
      allSkills: getAllSkillSummaries(),
    });

    expect(sortIds(summaryPools.active)).toEqual(sortIds(fullPools.active));
    expect(sortIds(summaryPools.passive)).toEqual(sortIds(fullPools.passive));
  });
});
