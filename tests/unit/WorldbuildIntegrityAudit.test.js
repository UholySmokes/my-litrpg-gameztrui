import { describe, expect, it } from "@jest/globals";
import {
  buildWorldbuildIntegrityReport,
  buildWorldbuildIntegritySignature,
  compareIntegritySignature,
  compareWorldManifests,
} from "@voidverse/game-core/util/worldbuildIntegrityAudit.js";

describe("worldbuild integrity audit utilities", () => {
  it("builds a report with expected top-level counters", () => {
    const report = buildWorldbuildIntegrityReport();
    expect(report).toBeTruthy();
    expect(report.counts.classCount).toBeGreaterThan(0);
    expect(report.counts.raceCount).toBeGreaterThan(0);
    expect(report.counts.questCount).toBeGreaterThan(0);
    expect(Array.isArray(report.classesMissingSkills)).toBe(true);
    expect(Array.isArray(report.skillOwnersNotClassOrReserved)).toBe(true);
  });

  it("compares world manifests and detects structural drift", () => {
    const godot = {
      maps: {
        a: { triggers: ["t1", "t2"] },
        b: { triggers: ["t3"] },
      },
      triggers: {
        t1: { type: "ENTER_TILE" },
        t2: { type: "INTERACT" },
        t3: { type: "SAVEPOINT" },
      },
      objects: {
        o1: {},
      },
    };
    const sync = {
      maps: {
        a: { triggers: ["t1"] },
      },
      triggers: {
        t1: { type: "ENTER_TILE" },
      },
      objects: {},
    };

    const diff = compareWorldManifests(godot, sync);
    expect(diff.maps.missingInSync).toContain("b");
    expect(diff.triggers.missingInSync).toContain("t2");
    expect(diff.objects.missingInSync).toContain("o1");
    expect(diff.mismatchCount).toBeGreaterThan(0);
  });

  it("flags only regressions above baseline", () => {
    const actual = {
      classesMissingSkills: 4,
      skillOwnersNotClassOrReserved: 3,
      missingRecipeIngredientCount: 20,
      missingRecipeResultCount: 8,
      missingQuestFavoredClassCount: 2,
      missingQuestFavoredRaceCount: 0,
      missingQuestFavoredProfessionCount: 0,
      missingQuestRewardItemCount: 5,
      manifestMismatchCount: 1,
    };
    const baseline = {
      classesMissingSkills: 4,
      skillOwnersNotClassOrReserved: 2,
      missingRecipeIngredientCount: 21,
      missingRecipeResultCount: 8,
      missingQuestFavoredClassCount: 2,
      missingQuestFavoredRaceCount: 0,
      missingQuestFavoredProfessionCount: 0,
      missingQuestRewardItemCount: 5,
      manifestMismatchCount: 1,
    };
    const issues = compareIntegritySignature(actual, baseline);
    expect(issues).toHaveLength(1);
    expect(issues[0].key).toBe("skillOwnersNotClassOrReserved");
  });

  it("builds a compact signature from report data", () => {
    const report = buildWorldbuildIntegrityReport();
    const signature = buildWorldbuildIntegritySignature(report);
    expect(signature.classCount).toBe(report.counts.classCount);
    expect(signature.raceCount).toBe(report.counts.raceCount);
    expect(signature.questCount).toBe(report.counts.questCount);
  });
});
