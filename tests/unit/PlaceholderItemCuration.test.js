import { describe, expect, it } from "@jest/globals";
import {
  buildPlaceholderItemCurationReport,
  collectEnemyDropItemRefs,
  collectQuestRewardItemRefs,
  collectShopStockItemRefs,
  evaluatePlaceholderCurationThresholds,
} from "@voidverse/game-core/util/placeholderItemCuration.js";
import { shopDatabase } from "@voidverse/game-core/data/shopData.js";

describe("placeholder item curation queue", () => {
  it("collects stable player-facing item references from quests/enemies/shops", () => {
    const questRefs = collectQuestRewardItemRefs();
    const enemyRefs = collectEnemyDropItemRefs();
    const shopRefs = collectShopStockItemRefs(shopDatabase);

    expect(questRefs.length).toBeGreaterThan(0);
    expect(enemyRefs.length).toBeGreaterThan(0);
    expect(shopRefs.length).toBeGreaterThan(0);

    expect(questRefs.some((ref) => ref.itemId === "ration_pack")).toBe(true);
    expect(enemyRefs.some((ref) => ref.itemId === "goblin_ear")).toBe(true);
    expect(shopRefs.some((ref) => ref.itemId === "health_potion")).toBe(true);
  });

  it("builds a queue from generated placeholders", () => {
    const report = buildPlaceholderItemCurationReport();
    expect(report).toBeTruthy();
    expect(typeof report.generatedAt).toBe("string");
    expect(Array.isArray(report.entries)).toBe(true);
    expect(report.summary.placeholderCount).toBe(report.entries.length);
    expect(report.summary.placeholderCount).toBeGreaterThan(0);
    expect(report.entries.every((entry) => typeof entry.recommendation === "string")).toBe(true);
  });

  it("prioritizes player-facing placeholders and computes reference pressure", () => {
    const items = {
      alpha_reagent: {
        id: "alpha_reagent",
        name: "Alpha Reagent",
        type: "material",
        rarity: "common",
        contentStatus: "placeholder",
        placeholderMeta: {
          generated: true,
          source: "recipe_reference_closure",
          references: [
            { professionId: "alchemy", recipeId: "r_alpha", role: "ingredient" },
          ],
        },
      },
      beta_relic: {
        id: "beta_relic",
        name: "Beta Relic",
        type: "equipment",
        rarity: "rare",
        contentStatus: "placeholder",
        placeholderMeta: {
          generated: true,
          source: "recipe_reference_closure",
          references: [
            { professionId: "smithing", recipeId: "r_beta_1", role: "result" },
            { professionId: "smithing", recipeId: "r_beta_2", role: "result" },
            { professionId: "smithing", recipeId: "r_beta_2", role: "ingredient" },
          ],
        },
      },
      canonical_item: {
        id: "canonical_item",
        name: "Canonical Item",
        type: "material",
        rarity: "common",
      },
    };

    const quests = [
      {
        id: "q_alpha",
        rewards: { items: [{ id: "alpha_reagent" }] },
      },
    ];
    const enemyEntries = [
      {
        id: "e_beta",
        drops: ["beta_relic"],
      },
    ];
    const shop = {
      items: [{ id: "shop_alpha", itemId: "alpha_reagent" }],
      materials: [],
    };

    const report = buildPlaceholderItemCurationReport({
      items,
      quests,
      enemyEntries,
      shop,
    });

    expect(report.summary.placeholderCount).toBe(2);
    expect(report.summary.playerFacingPlaceholderCount).toBe(2);

    const alpha = report.entries.find((entry) => entry.itemId === "alpha_reagent");
    const beta = report.entries.find((entry) => entry.itemId === "beta_relic");

    expect(alpha).toBeTruthy();
    expect(beta).toBeTruthy();

    expect(alpha.priority).toBe("critical");
    expect(alpha.playerFacingReferenceCount).toBe(2);
    expect(alpha.ingredientReferenceCount).toBe(1);
    expect(alpha.resultReferenceCount).toBe(0);

    expect(beta.priority).toBe("critical");
    expect(beta.playerFacingReferenceCount).toBe(1);
    expect(beta.resultReferenceCount).toBe(2);
    expect(beta.ingredientReferenceCount).toBe(1);

    expect(report.entries[0].itemId).toBe("alpha_reagent");
    expect(alpha.score).toBeGreaterThan(beta.score);
  });

  it("evaluates curation thresholds with pass/fail issues", () => {
    const report = {
      summary: {
        playerFacingPlaceholderCount: 2,
        priorityCounts: { critical: 1, high: 3, medium: 4, low: 5 },
      },
    };

    const fail = evaluatePlaceholderCurationThresholds(report, {
      maxCritical: 0,
      maxPlayerFacingPlaceholders: 0,
      maxHigh: 2,
    });
    expect(fail.pass).toBe(false);
    expect(fail.issues.map((issue) => issue.key).sort()).toEqual([
      "critical",
      "high",
      "playerFacingPlaceholders",
    ]);

    const pass = evaluatePlaceholderCurationThresholds(report, {
      maxCritical: 1,
      maxPlayerFacingPlaceholders: 2,
      maxHigh: 3,
    });
    expect(pass.pass).toBe(true);
    expect(pass.issues).toHaveLength(0);
  });
});
