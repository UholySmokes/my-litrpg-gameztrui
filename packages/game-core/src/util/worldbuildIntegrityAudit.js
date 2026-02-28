import { classes } from "../data/registries/ClassDataRegistry.js";
import { races } from "../data/registries/RaceDataRegistry.js";
import {
  itemDatabase,
  isGeneratedPlaceholderItem,
} from "../data/registries/ItemDataRegistry.js";
import { getClassAbilitiesFor } from "../systems/class/ClassAbilityRegistry.js";
import { getRaceAbilitiesFor } from "../systems/race/RaceAbilityRegistry.js";
import { getAllSkills } from "../systems/skills/SkillRegistry.js";
import { PROFESSIONS, getRecipesForProfession } from "../systems/profession/ProfessionRegistry.js";
import { BEGINNER_QUESTS, MAIN_QUESTS, SIDE_QUESTS } from "../data/QuestCatalog.js";

function toSet(values) {
  return new Set(Array.isArray(values) ? values : []);
}

function normalizeManifest(manifest) {
  return manifest && typeof manifest === "object" ? manifest : {};
}

function normalizeManifestNode(manifest, key) {
  const node = manifest[key];
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return {};
  }
  return node;
}

function compareKeySets(godotNode, syncNode) {
  const godotKeys = Object.keys(godotNode);
  const syncKeys = Object.keys(syncNode);
  const godotKeySet = toSet(godotKeys);
  const syncKeySet = toSet(syncKeys);
  return {
    missingInSync: godotKeys.filter((key) => !syncKeySet.has(key)),
    missingInGodot: syncKeys.filter((key) => !godotKeySet.has(key)),
    shared: godotKeys.filter((key) => syncKeySet.has(key)),
  };
}

function normalizeStringArray(values) {
  return Array.isArray(values)
    ? values.filter((entry) => typeof entry === "string" && entry.trim().length > 0)
    : [];
}

export function compareWorldManifests(godotManifest, syncManifest) {
  const godot = normalizeManifest(godotManifest);
  const sync = normalizeManifest(syncManifest);

  const godotMaps = normalizeManifestNode(godot, "maps");
  const syncMaps = normalizeManifestNode(sync, "maps");
  const godotTriggers = normalizeManifestNode(godot, "triggers");
  const syncTriggers = normalizeManifestNode(sync, "triggers");
  const godotObjects = normalizeManifestNode(godot, "objects");
  const syncObjects = normalizeManifestNode(sync, "objects");

  const mapSetDiff = compareKeySets(godotMaps, syncMaps);
  const triggerSetDiff = compareKeySets(godotTriggers, syncTriggers);
  const objectSetDiff = compareKeySets(godotObjects, syncObjects);

  const mapTriggerDiffs = [];
  for (const mapId of mapSetDiff.shared) {
    const godotMap = godotMaps[mapId] || {};
    const syncMap = syncMaps[mapId] || {};
    const godotMapTriggers = normalizeStringArray(godotMap.triggers);
    const syncMapTriggers = normalizeStringArray(syncMap.triggers);
    const godotTriggerSet = toSet(godotMapTriggers);
    const syncTriggerSet = toSet(syncMapTriggers);

    const missingInSync = godotMapTriggers.filter((id) => !syncTriggerSet.has(id));
    const missingInGodot = syncMapTriggers.filter((id) => !godotTriggerSet.has(id));

    if (missingInSync.length > 0 || missingInGodot.length > 0) {
      mapTriggerDiffs.push({
        mapId,
        missingInSync,
        missingInGodot,
      });
    }
  }

  return {
    maps: {
      missingInSync: mapSetDiff.missingInSync,
      missingInGodot: mapSetDiff.missingInGodot,
      sharedCount: mapSetDiff.shared.length,
    },
    triggers: {
      missingInSync: triggerSetDiff.missingInSync,
      missingInGodot: triggerSetDiff.missingInGodot,
      sharedCount: triggerSetDiff.shared.length,
    },
    objects: {
      missingInSync: objectSetDiff.missingInSync,
      missingInGodot: objectSetDiff.missingInGodot,
      sharedCount: objectSetDiff.shared.length,
    },
    mapTriggerDiffs,
    mismatchCount:
      mapSetDiff.missingInSync.length +
      mapSetDiff.missingInGodot.length +
      triggerSetDiff.missingInSync.length +
      triggerSetDiff.missingInGodot.length +
      objectSetDiff.missingInSync.length +
      objectSetDiff.missingInGodot.length +
      mapTriggerDiffs.reduce(
        (sum, row) => sum + row.missingInSync.length + row.missingInGodot.length,
        0,
      ),
  };
}

function getQuestTagArray(quest, key) {
  const tags = quest?.tags;
  if (!tags || typeof tags !== "object" || Array.isArray(tags)) return [];
  const values = tags[key];
  return Array.isArray(values) ? values : [];
}

export function buildWorldbuildIntegrityReport({ manifests } = {}) {
  const classIds = new Set(classes.map((entry) => entry.id));
  const raceIds = new Set(races.map((entry) => entry.id));
  const itemIds = new Set(Object.keys(itemDatabase));
  const professionEntries = Object.values(PROFESSIONS || {});
  const professionIds = new Set(professionEntries.map((entry) => entry.id));

  const skills = getAllSkills();
  const skillOwnerCounts = new Map();
  const skillOwnerTypeCounts = new Map();
  const skillClassOwnerCounts = new Map();
  skills.forEach((skill) => {
    const ownerIdRaw =
      typeof skill?.ownerId === "string" && skill.ownerId.trim().length > 0
        ? skill.ownerId
        : skill?.class;
    const ownerId =
      typeof ownerIdRaw === "string" && ownerIdRaw.trim().length > 0
        ? ownerIdRaw.trim()
        : "";
    if (!ownerId) return;

    const ownerTypeRaw =
      typeof skill?.ownerType === "string" ? skill.ownerType.trim().toLowerCase() : "";
    const ownerType =
      ownerTypeRaw ||
      (ownerId === "universal"
        ? "universal"
        : professionIds.has(ownerId)
          ? "profession"
          : classIds.has(ownerId)
            ? "class"
            : "system");

    skillOwnerCounts.set(ownerId, (skillOwnerCounts.get(ownerId) || 0) + 1);
    skillOwnerTypeCounts.set(
      ownerType,
      (skillOwnerTypeCounts.get(ownerType) || 0) + 1,
    );
    if (ownerType === "class") {
      skillClassOwnerCounts.set(
        ownerId,
        (skillClassOwnerCounts.get(ownerId) || 0) + 1,
      );
    }
  });
  const skillOwnerIds = [...skillOwnerCounts.keys()];

  const reservedSkillOwners = new Set(["universal", ...professionIds]);
  const classesMissingSkills = [...classIds].filter((id) => !skillClassOwnerCounts.has(id));
  const skillOwnersOutsideClassSet = skillOwnerIds.filter(
    (ownerId) => !classIds.has(ownerId),
  );
  const skillOwnersReservedNonClass = skillOwnersOutsideClassSet.filter((ownerId) =>
    reservedSkillOwners.has(ownerId),
  );
  const skillOwnersNotClassOrReserved = skillOwnerIds.filter(
    (ownerId) => !classIds.has(ownerId) && !reservedSkillOwners.has(ownerId),
  );

  const classAbilityCoverage = classes.map((entry) => ({
    id: entry.id,
    count: (getClassAbilitiesFor(entry.id) || []).length,
  }));
  const raceAbilityCoverage = races.map((entry) => ({
    id: entry.id,
    count: (getRaceAbilitiesFor(entry.id) || []).length,
  }));

  const missingRecipeIngredients = [];
  const missingRecipeResults = [];
  const recipeStats = [];

  for (const profession of professionEntries) {
    const recipes = getRecipesForProfession(profession.id, 9) || [];
    recipeStats.push({ id: profession.id, recipes: recipes.length });

    for (const recipe of recipes) {
      const ingredients = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
      for (const ingredient of ingredients) {
        const ingredientId = ingredient?.id || ingredient?.itemId;
        if (ingredientId && !itemIds.has(ingredientId)) {
          missingRecipeIngredients.push({
            profession: profession.id,
            recipe: recipe.id,
            itemId: ingredientId,
          });
        }
      }

      const resultId = recipe?.result?.id || recipe?.result?.itemId;
      if (resultId && !itemIds.has(resultId)) {
        missingRecipeResults.push({
          profession: profession.id,
          recipe: recipe.id,
          itemId: resultId,
        });
      }
    }
  }

  const quests = [...BEGINNER_QUESTS, ...MAIN_QUESTS, ...SIDE_QUESTS];
  const missingQuestFavoredClasses = [];
  const missingQuestFavoredRaces = [];
  const missingQuestFavoredProfessions = [];
  const missingQuestRewardItems = [];

  for (const quest of quests) {
    for (const classId of getQuestTagArray(quest, "favoredClasses")) {
      if (!classIds.has(classId)) {
        missingQuestFavoredClasses.push({ quest: quest.id, classId });
      }
    }
    for (const raceId of getQuestTagArray(quest, "favoredRaces")) {
      if (!raceIds.has(raceId)) {
        missingQuestFavoredRaces.push({ quest: quest.id, raceId });
      }
    }
    for (const professionId of getQuestTagArray(quest, "favoredProfessions")) {
      if (!professionIds.has(professionId)) {
        missingQuestFavoredProfessions.push({ quest: quest.id, professionId });
      }
    }

    const rewardItems = Array.isArray(quest?.rewards?.items) ? quest.rewards.items : [];
    for (const rewardItem of rewardItems) {
      const rewardItemId = rewardItem?.id || rewardItem?.itemId;
      if (rewardItemId && !itemIds.has(rewardItemId)) {
        missingQuestRewardItems.push({ quest: quest.id, itemId: rewardItemId });
      }
    }
  }

  const classTierCounts = classes.reduce((acc, entry) => {
    const key = String(entry.tier ?? 0);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const classResourceCounts = classes.reduce((acc, entry) => {
    const key = entry.resourceSystem || "none";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const placeholderItems = Object.values(itemDatabase).filter((entry) =>
    isGeneratedPlaceholderItem(entry),
  );

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      classCount: classes.length,
      raceCount: races.length,
      classAbilityCount: classAbilityCoverage.reduce((sum, row) => sum + row.count, 0),
      raceAbilityCount: raceAbilityCoverage.reduce((sum, row) => sum + row.count, 0),
      totalSkills: skills.length,
      professionCount: professionEntries.length,
      itemCount: Object.keys(itemDatabase).length,
      questCount: quests.length,
    },
    classTierCounts,
    classResourceCounts,
    classesMissingSkills,
    skillOwnerCounts: skillOwnerIds
      .map((id) => [id, skillOwnerCounts.get(id)])
      .sort((a, b) => b[1] - a[1]),
    skillOwnerTypeCounts: [...skillOwnerTypeCounts.entries()].sort((a, b) => b[1] - a[1]),
    skillOwnersOutsideClassSet,
    skillOwnersReservedNonClass,
    skillOwnersNotClassOrReserved,
    classAbilityCoverage,
    raceAbilityCoverage,
    recipeStats,
    placeholderItemCount: placeholderItems.length,
    placeholderItemIdsSample: placeholderItems.slice(0, 50).map((entry) => entry.id),
    missingRecipeIngredientCount: missingRecipeIngredients.length,
    missingRecipeResultCount: missingRecipeResults.length,
    missingRecipeIngredientsSample: missingRecipeIngredients.slice(0, 50),
    missingRecipeResultsSample: missingRecipeResults.slice(0, 50),
    questsWithFavoredClasses: quests.filter(
      (quest) => getQuestTagArray(quest, "favoredClasses").length > 0,
    ).length,
    questsWithFavoredRaces: quests.filter(
      (quest) => getQuestTagArray(quest, "favoredRaces").length > 0,
    ).length,
    questsWithFavoredProfessions: quests.filter(
      (quest) => getQuestTagArray(quest, "favoredProfessions").length > 0,
    ).length,
    missingQuestFavoredClasses,
    missingQuestFavoredRaces,
    missingQuestFavoredProfessions,
    missingQuestRewardItemCount: missingQuestRewardItems.length,
    missingQuestRewardItemsSample: missingQuestRewardItems.slice(0, 50),
    manifests:
      manifests && typeof manifests === "object"
        ? compareWorldManifests(manifests.godot, manifests.sync)
        : null,
  };
}

export function buildWorldbuildIntegritySignature(report) {
  const summary = report && typeof report === "object" ? report : {};
  const manifests = summary.manifests && typeof summary.manifests === "object" ? summary.manifests : {};
  return {
    classCount: summary.counts?.classCount || 0,
    raceCount: summary.counts?.raceCount || 0,
    questCount: summary.counts?.questCount || 0,
    itemCount: summary.counts?.itemCount || 0,
    classesMissingSkills: Array.isArray(summary.classesMissingSkills)
      ? summary.classesMissingSkills.length
      : 0,
    skillOwnersNotClassOrReserved: Array.isArray(summary.skillOwnersNotClassOrReserved)
      ? summary.skillOwnersNotClassOrReserved.length
      : 0,
    missingRecipeIngredientCount: summary.missingRecipeIngredientCount || 0,
    missingRecipeResultCount: summary.missingRecipeResultCount || 0,
    missingQuestFavoredClassCount: Array.isArray(summary.missingQuestFavoredClasses)
      ? summary.missingQuestFavoredClasses.length
      : 0,
    missingQuestFavoredRaceCount: Array.isArray(summary.missingQuestFavoredRaces)
      ? summary.missingQuestFavoredRaces.length
      : 0,
    missingQuestFavoredProfessionCount: Array.isArray(summary.missingQuestFavoredProfessions)
      ? summary.missingQuestFavoredProfessions.length
      : 0,
    missingQuestRewardItemCount: summary.missingQuestRewardItemCount || 0,
    manifestMismatchCount: manifests.mismatchCount || 0,
  };
}

export function compareIntegritySignature(actual, baseline) {
  const checks = [
    "classesMissingSkills",
    "skillOwnersNotClassOrReserved",
    "missingRecipeIngredientCount",
    "missingRecipeResultCount",
    "missingQuestFavoredClassCount",
    "missingQuestFavoredRaceCount",
    "missingQuestFavoredProfessionCount",
    "missingQuestRewardItemCount",
    "manifestMismatchCount",
  ];

  const issues = [];
  for (const key of checks) {
    const actualValue = Number(actual?.[key] || 0);
    const baselineValue = Number(baseline?.[key] || 0);
    if (actualValue > baselineValue) {
      issues.push({
        key,
        expectedMax: baselineValue,
        actual: actualValue,
      });
    }
  }
  return issues;
}
