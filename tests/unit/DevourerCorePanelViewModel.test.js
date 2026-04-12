import { describe, expect, it } from "@jest/globals";
import { buildDevourerCorePanelViewModel } from "../../src/components/devourerCore/devourerCorePanelViewModel.js";

describe("DevourerCorePanel view model", () => {
  it("surfaces safe digest actions, blocked reasons, refinement actions, and adaptation ranks", () => {
    const viewModel = buildDevourerCorePanelViewModel({
      archetypeSystem: {
        id: "devourer_core",
        name: "Devourer Core",
        category: "System",
        resource: { name: "Biomass", current: 40, max: 100, color: "#7DFFB3" },
        runtime: {
          taint: 4,
          sentientDevours: 1,
          storedSamples: {
            beast: { count: 2, biomass: 12, taint: 2, sentientCount: 0 },
            humanoid: { count: 1, biomass: 14, taint: 5, sentientCount: 1 },
            shadow: { count: 1, biomass: 8, taint: 4, sentientCount: 0 },
          },
          knownPrey: {
            beast: { digested: 1 },
            fire: { digested: 2 },
          },
          adaptations: {
            fire: { rank: 1, maxRank: 5, refinedCount: 1 },
          },
          recentPrey: ["Field Hare", "Bandit Raider"],
          lastNotice: "Auto-absorb withheld for humanoid.",
        },
      },
    });

    expect(viewModel.digestReady).toEqual([
      expect.objectContaining({
        family: "beast",
        command: "digest beast",
      }),
    ]);
    expect(viewModel.digestBlocked).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          family: "humanoid",
          blockReason: "sentient-risk",
        }),
        expect.objectContaining({
          family: "shadow",
          blockReason: "taint-per-sample-too-high",
        }),
      ]),
    );
    expect(viewModel.refinementReady).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ family: "beast", command: "refine beast" }),
        expect.objectContaining({ family: "fire", command: "refine fire" }),
      ]),
    );
    expect(viewModel.adaptationRanks).toEqual([
      expect.objectContaining({ family: "fire", rank: 1, maxRank: 5 }),
    ]);
    expect(viewModel.purgeAction).toEqual(
      expect.objectContaining({ command: "purge taint" }),
    );
  });

  it("returns null for non-devourer characters", () => {
    expect(
      buildDevourerCorePanelViewModel({
        archetypeSystem: {
          id: "revival_archive",
          name: "Revival Archive",
          category: "System",
        },
      }),
    ).toBeNull();
  });
});
