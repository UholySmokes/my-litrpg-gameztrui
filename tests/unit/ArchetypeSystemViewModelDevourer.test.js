import { describe, expect, it } from "@jest/globals";
import { buildArchetypeSystemViewModel } from "../../src/components/archetypeSystem/archetypeSystemViewModel.js";

describe("archetypeSystemViewModel devourer console", () => {
  it("builds devourer console stats from runtime state", () => {
    const vm = buildArchetypeSystemViewModel({
      archetypeSystem: {
        id: "devourer_core",
        name: "Devourer Core",
        category: "System",
        summary: "Predator loop",
        resource: { name: "Biomass", current: 29, max: 100, color: "#7DFFB3" },
        runtime: {
          taint: 4,
          sentientDevours: 1,
          storedSamples: { humanoid: { count: 2 }, fire: { count: 1 } },
          knownPrey: { humanoid: { digested: 2 } },
          adaptations: { humanoid: { rank: 1, maxRank: 5 } },
          recentPrey: ["Bandit Raider"],
          lastNotice: "Optimize your intake.",
        },
      },
    });

    expect(vm.resource.name).toBe("Biomass");
    expect(vm.devourerConsole).toEqual(
      expect.objectContaining({
        taint: 4,
        sentientDevours: 1,
        knownPreyCount: 1,
        lastNotice: "Optimize your intake.",
      }),
    );
    expect(vm.devourerConsole.storedSamples[0]).toEqual(
      expect.objectContaining({ family: "humanoid", count: 2 }),
    );
  });
});
