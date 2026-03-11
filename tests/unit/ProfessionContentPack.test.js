import { describe, expect, it } from "@jest/globals";
import {
  PROFESSION_TIERS,
  PROFESSION_CATEGORIES,
  PROFESSIONS,
  getRecipesForProfession,
  getTierFromXp,
  getFullProfessionRank,
} from "@voidverse/game-core/systems/profession/ProfessionRegistry.js";
import {
  getProfessionCategories,
  getProfessionCategoryById,
  getProfessionSummaries,
  getProfessionSummaryById,
  getProfessionTier1SkillIds,
  getProfessionRecipeSummaries,
  getProfessionRecipeSummaryById,
  getProfessionTierFromXp,
  getProfessionRankFromXp,
  getProfessionTiers,
} from "@voidverse/game-core/systems/profession/ProfessionContentPack.js";

describe("profession content pack", () => {
  it("keeps generated tiers, categories, and profession summaries aligned with the live registry", () => {
    const liveCategories = Object.values(PROFESSION_CATEGORIES || {});
    const liveProfessions = Object.values(PROFESSIONS || {});

    expect(getProfessionTiers().map((entry) => entry.tier)).toEqual(
      PROFESSION_TIERS.map((entry) => entry.tier),
    );
    expect(getProfessionCategories().map((entry) => entry.id)).toEqual(
      liveCategories.map((entry) => entry.id),
    );
    expect(getProfessionSummaries().map((entry) => entry.id)).toEqual(
      liveProfessions.map((entry) => entry.id),
    );

    const sampleCategory = liveCategories[0];
    const sampleProfession = PROFESSIONS.blacksmithing || liveProfessions[0];

    expect(getProfessionCategoryById(sampleCategory.id)).toEqual(
      expect.objectContaining({
        id: sampleCategory.id,
        name: sampleCategory.name,
      }),
    );
    expect(getProfessionSummaryById(sampleProfession.id)).toEqual(
      expect.objectContaining({
        id: sampleProfession.id,
        name: sampleProfession.name,
        category: sampleProfession.category,
        tier1Skills: sampleProfession.tierUnlocks?.[1]?.skills || [],
      }),
    );
    expect(getProfessionTier1SkillIds(sampleProfession.id)).toEqual(
      sampleProfession.tierUnlocks?.[1]?.skills || [],
    );
  });

  it("keeps generated recipe summaries aligned with the live recipe registry", () => {
    const liveRecipes = getRecipesForProfession("alchemy", 3);
    const packRecipes = getProfessionRecipeSummaries("alchemy", 3);
    const sampleRecipe = liveRecipes[0];

    expect(packRecipes.map((entry) => entry.id)).toEqual(
      liveRecipes.map((entry) => entry.id),
    );
    expect(getProfessionRecipeSummaryById(sampleRecipe.id)).toEqual(
      expect.objectContaining({
        id: sampleRecipe.id,
        profession: sampleRecipe.profession,
        tier: sampleRecipe.tier,
        ingredients: sampleRecipe.ingredients,
        result: sampleRecipe.result,
      }),
    );
  });

  it("matches live profession rank helpers for representative xp values", () => {
    const sampleXpValues = [0, 500, 2000, 25000, 250000];

    sampleXpValues.forEach((xp) => {
      const liveTier = getTierFromXp(xp);
      const packTier = getProfessionTierFromXp(xp);
      const liveRank = getFullProfessionRank(xp);
      const packRank = getProfessionRankFromXp(xp);

      expect(packTier).toEqual(
        expect.objectContaining({
          tier: liveTier.tier,
          name: liveTier.name,
          xpRequired: liveTier.xpRequired,
        }),
      );
      expect(packRank).toEqual(
        expect.objectContaining({
          tier: liveRank.tier,
          tierName: liveRank.tierName,
          subRank: liveRank.subRank,
          subRankName: liveRank.subRankName,
          fullName: liveRank.fullName,
        }),
      );
    });
  });
});
