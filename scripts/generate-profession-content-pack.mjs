import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PROFESSION_TIERS,
  PROFESSION_CATEGORIES,
  PROFESSIONS,
  getRecipesForProfession,
} from "../packages/game-core/src/systems/profession/ProfessionRegistry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(
  __dirname,
  "../packages/game-core/src/data/generated/professions",
);

function clonePlain(value) {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function sortRecordKeys(record) {
  return Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function projectTier(entry) {
  return {
    tier: Number.isFinite(entry?.tier) ? Number(entry.tier) : 1,
    name: entry?.name || "",
    subRanks: Array.isArray(entry?.subRanks) ? [...entry.subRanks] : [],
    xpRequired: Number.isFinite(entry?.xpRequired) ? Number(entry.xpRequired) : 0,
    skillPoints: Number.isFinite(entry?.skillPoints)
      ? Number(entry.skillPoints)
      : 0,
  };
}

function projectCategory(entry) {
  return {
    id: entry?.id || "",
    name: entry?.name || "",
    description: entry?.description || "",
    icon: entry?.icon || "",
  };
}

function projectProfession(entry) {
  const tier1Skills = Array.isArray(entry?.tierUnlocks?.[1]?.skills)
    ? [...entry.tierUnlocks[1].skills]
    : [];

  return {
    id: entry?.id || "",
    name: entry?.name || "",
    category: entry?.category || "",
    description: entry?.description || "",
    icon: entry?.icon || "",
    primaryStat: entry?.primaryStat || null,
    secondaryStat: entry?.secondaryStat || null,
    actions: Array.isArray(entry?.actions) ? [...entry.actions] : [],
    specializations: Array.isArray(entry?.specializations)
      ? [...entry.specializations]
      : [],
    tier1Skills,
  };
}

function projectRecipe(entry) {
  return {
    id: entry?.id || "",
    name: entry?.name || "",
    profession: entry?.profession || "",
    tier: Number.isFinite(entry?.tier) ? Number(entry.tier) : 1,
    description: entry?.description || "",
    ingredients: Array.isArray(entry?.ingredients)
      ? entry.ingredients.map((ingredient) => clonePlain(ingredient))
      : [],
    result:
      entry?.result && typeof entry.result === "object"
        ? clonePlain(entry.result)
        : null,
    xp: Number.isFinite(entry?.xp) ? Number(entry.xp) : 0,
    time: Number.isFinite(entry?.time) ? Number(entry.time) : 0,
  };
}

async function writeJsonFile(filename, data) {
  const targetPath = path.join(outputDir, filename);
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(targetPath, payload, "utf8");
  return targetPath;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const categoryEntries = Object.values(PROFESSION_CATEGORIES || {})
    .filter((entry) => entry?.id)
    .map((entry) => projectCategory(entry));
  const professionEntries = Object.values(PROFESSIONS || {})
    .filter((entry) => entry?.id)
    .map((entry) => projectProfession(entry));

  const recipesByProfession = sortRecordKeys(
    Object.fromEntries(
      professionEntries.map((profession) => [
        profession.id,
        (getRecipesForProfession(profession.id, 99) || []).map((recipe) =>
          projectRecipe(recipe),
        ),
      ]),
    ),
  );

  const recipeById = sortRecordKeys(
    Object.fromEntries(
      Object.values(recipesByProfession)
        .flatMap((recipes) => recipes)
        .filter((recipe) => recipe?.id)
        .map((recipe) => [recipe.id, recipe]),
    ),
  );

  const outputs = await Promise.all([
    writeJsonFile(
      "profession-tiers.json",
      (Array.isArray(PROFESSION_TIERS) ? PROFESSION_TIERS : []).map((entry) =>
        projectTier(entry),
      ),
    ),
    writeJsonFile("profession-categories.json", categoryEntries),
    writeJsonFile("profession-summaries.json", professionEntries),
    writeJsonFile("profession-recipes.json", {
      byProfession: recipesByProfession,
      byId: recipeById,
    }),
  ]);

  outputs.forEach((targetPath) => {
    console.log(`generated ${path.relative(path.resolve(__dirname, ".."), targetPath)}`);
  });
}

await main();
