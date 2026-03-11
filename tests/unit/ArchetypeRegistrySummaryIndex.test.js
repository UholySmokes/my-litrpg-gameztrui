import { describe, expect, it } from "@jest/globals";
import {
  getAllArchetypeSystems,
  getAllArchetypeSystemSummaries,
  getArchetypeCategories,
  getArchetypeSystemById,
  getArchetypeSystemSummaryById,
  getArchetypeSystemSummariesByCategory,
  getArchetypesByCategory,
} from "../../src/systems/archetype/ArchetypeSystemRegistry.js";

describe("archetype registry summary indexes", () => {
  it("keeps summary counts aligned with the full archetype registry", () => {
    const systems = getAllArchetypeSystems();
    const summaries = getAllArchetypeSystemSummaries();

    expect(summaries).toHaveLength(systems.length);
    expect(summaries[0]).toEqual(
      expect.objectContaining({
        id: systems[0].id,
        name: systems[0].name,
        category: systems[0].category,
      }),
    );
    expect(summaries[0].coreLoopPreview.length).toBeLessThanOrEqual(3);
    expect(summaries[0].narrativeHooksPreview.length).toBeLessThanOrEqual(2);
  });

  it("returns matching full and summary lookups by archetype id", () => {
    const system = getAllArchetypeSystems()[0];
    const resolved = getArchetypeSystemById(system.id);
    const summary = getArchetypeSystemSummaryById(system.id);

    expect(resolved?.id).toBe(system.id);
    expect(summary).toEqual(
      expect.objectContaining({
        id: system.id,
        name: system.name,
        category: system.category,
      }),
    );
  });

  it("indexes archetypes by category for both full and summary paths", () => {
    const category = getArchetypeCategories()[0];
    const fullIds = getArchetypesByCategory(category).map((entry) => entry.id);
    const summaryIds = getArchetypeSystemSummariesByCategory(category).map(
      (entry) => entry.id,
    );

    expect(summaryIds).toEqual(fullIds);
  });
});
