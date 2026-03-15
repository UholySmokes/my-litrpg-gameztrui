import professionTiersData from "../../data/generated/professions/profession-tiers.json" with { type: "json" };
import professionCategoriesData from "../../data/generated/professions/profession-categories.json" with { type: "json" };
import professionSummariesData from "../../data/generated/professions/profession-summaries.json" with { type: "json" };
import professionRecipesData from "../../data/generated/professions/profession-recipes.json" with { type: "json" };

function cloneValue(value) {
  if (value == null) return value;
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function cloneList(values) {
  return Array.isArray(values) ? values.map((entry) => cloneValue(entry)) : [];
}

const PROFESSION_TIER_INDEX = new Map(
  (Array.isArray(professionTiersData) ? professionTiersData : [])
    .filter((entry) => Number.isFinite(Number(entry?.tier)))
    .map((entry) => [Number(entry.tier), entry]),
);

const PROFESSION_CATEGORY_INDEX = new Map(
  (Array.isArray(professionCategoriesData) ? professionCategoriesData : [])
    .filter((entry) => typeof entry?.id === "string")
    .map((entry) => [entry.id, entry]),
);

const PROFESSION_SUMMARY_INDEX = new Map(
  (Array.isArray(professionSummariesData) ? professionSummariesData : [])
    .filter((entry) => typeof entry?.id === "string")
    .map((entry) => [entry.id, entry]),
);

const PROFESSION_RECIPES_BY_PROFESSION =
  professionRecipesData &&
  typeof professionRecipesData === "object" &&
  !Array.isArray(professionRecipesData)
    ? professionRecipesData.byProfession || {}
    : {};

const PROFESSION_RECIPE_INDEX = new Map(
  Object.entries(
    professionRecipesData &&
      typeof professionRecipesData === "object" &&
      !Array.isArray(professionRecipesData)
      ? professionRecipesData.byId || {}
      : {},
  ),
);

export function getProfessionTiers() {
  return cloneList(professionTiersData);
}

export function getProfessionTierData(tier) {
  const safeTier = Number.isFinite(Number(tier)) ? Number(tier) : null;
  if (safeTier == null) return null;
  return cloneValue(PROFESSION_TIER_INDEX.get(safeTier) || null);
}

export function getProfessionCategories() {
  return cloneList(professionCategoriesData);
}

export function getProfessionCategoryById(categoryId) {
  if (!categoryId) return null;
  return cloneValue(PROFESSION_CATEGORY_INDEX.get(categoryId) || null);
}

export function getProfessionSummaries() {
  return cloneList(professionSummariesData);
}

export function getProfessionSummaryById(professionId) {
  if (!professionId) return null;
  return cloneValue(PROFESSION_SUMMARY_INDEX.get(professionId) || null);
}

export function getProfessionTier1SkillIds(professionId) {
  return cloneList(getProfessionSummaryById(professionId)?.tier1Skills || []);
}

export function getProfessionRecipeSummaries(professionId, maxTier = 9) {
  if (!professionId) return [];
  const safeMaxTier = Number.isFinite(Number(maxTier)) ? Number(maxTier) : 9;
  return cloneList(PROFESSION_RECIPES_BY_PROFESSION[professionId] || []).filter(
    (recipe) => Number(recipe?.tier || 0) <= safeMaxTier,
  );
}

export function getProfessionRecipeSummaryById(recipeId) {
  if (!recipeId) return null;
  return cloneValue(PROFESSION_RECIPE_INDEX.get(recipeId) || null);
}

export function getProfessionTierFromXp(xp) {
  const safeXp = Number.isFinite(Number(xp)) ? Number(xp) : 0;
  const tiers = Array.isArray(professionTiersData) ? professionTiersData : [];
  for (let index = tiers.length - 1; index >= 0; index -= 1) {
    if (safeXp >= Number(tiers[index]?.xpRequired || 0)) {
      return cloneValue(tiers[index]);
    }
  }
  return cloneValue(tiers[0] || null);
}

export function getProfessionRankFromXp(xp) {
  const tier = getProfessionTierFromXp(xp);
  if (!tier) {
    return {
      tier: 1,
      tierName: "",
      subRank: 0,
      subRankName: "",
      fullName: "",
      rank: "",
      nextTierXp: null,
    };
  }

  const nextTier = getProfessionTierData(Number(tier.tier) + 1);
  let subRank = 0;

  if (nextTier && Array.isArray(tier.subRanks) && tier.subRanks.length > 0) {
    const tierXpRange = Number(nextTier.xpRequired || 0) - Number(tier.xpRequired || 0);
    const xpInTier = Number(xp || 0) - Number(tier.xpRequired || 0);
    const subRankProgress = tierXpRange > 0 ? xpInTier / tierXpRange : 1;
    if (subRankProgress >= 0.67) subRank = 2;
    else if (subRankProgress >= 0.33) subRank = 1;
  } else if (Array.isArray(tier.subRanks) && tier.subRanks.length > 0) {
    subRank = Math.max(0, tier.subRanks.length - 1);
  }

  const subRankName = Array.isArray(tier.subRanks) ? tier.subRanks[subRank] || "" : "";

  return {
    tier: tier.tier,
    tierName: tier.name || "",
    subRank,
    subRankName,
    fullName: subRankName,
    rank: subRankName,
    nextTierXp: nextTier?.xpRequired ?? null,
  };
}
