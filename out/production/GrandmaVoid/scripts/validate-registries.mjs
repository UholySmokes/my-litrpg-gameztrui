import { DataRegistry } from "../src/data/DataRegistry.js";
import {
  PROFESSIONS,
  PROFESSION_CATEGORIES,
  getRecipesForProfession,
} from "../src/systems/profession/ProfessionRegistry.js";

const errors = [];

const recordError = (message) => {
  errors.push(message);
};

const checkUniqueIds = (items, label) => {
  const seen = new Set();
  items.forEach((item, index) => {
    const id = item?.id;
    if (!id) {
      recordError(`${label}[${index}] missing id`);
      return;
    }
    if (seen.has(id)) {
      recordError(`${label} duplicate id: ${id}`);
      return;
    }
    seen.add(id);
  });
};

const checkCategoryMap = () => {
  Object.entries(PROFESSION_CATEGORIES || {}).forEach(([key, value]) => {
    if (!value?.id) {
      recordError(`profession category '${key}' missing id`);
      return;
    }
    if (value.id !== key) {
      recordError(`profession category id mismatch: '${key}' vs '${value.id}'`);
    }
  });
};

const checkProfessionMap = () => {
  Object.entries(PROFESSIONS || {}).forEach(([key, value]) => {
    if (!value?.id) {
      recordError(`profession '${key}' missing id`);
      return;
    }
    if (value.id !== key) {
      recordError(`profession id mismatch: '${key}' vs '${value.id}'`);
    }
    if (!value.category || !PROFESSION_CATEGORIES[value.category]) {
      recordError(`profession '${key}' references missing category '${value.category}'`);
    }
  });
};

const checkItems = () => {
  const items = DataRegistry.getItems();
  if (!items || typeof items !== "object") {
    recordError("item registry missing or invalid");
    return;
  }
  const seen = new Set();
  Object.entries(items).forEach(([key, value]) => {
    if (!key) {
      recordError("item registry has empty key");
      return;
    }
    if (seen.has(key)) {
      recordError(`item registry duplicate key: ${key}`);
      return;
    }
    seen.add(key);
    if (!value) {
      recordError(`item '${key}' missing data`);
      return;
    }
    if (!value.id) {
      recordError(`item '${key}' missing id`);
      return;
    }
    if (value.id !== key) {
      recordError(`item id mismatch: '${key}' vs '${value.id}'`);
    }
  });
};

const checkRecipes = () => {
  const recipeIds = new Set();
  Object.values(PROFESSIONS || {}).forEach((profession) => {
    const recipes = getRecipesForProfession(profession.id, 99);
    recipes.forEach((recipe) => {
      if (!recipe?.id) {
        recordError(`recipe missing id for profession '${profession.id}'`);
        return;
      }
      if (recipeIds.has(recipe.id)) {
        recordError(`duplicate recipe id: ${recipe.id}`);
      }
      recipeIds.add(recipe.id);
      if (recipe.profession !== profession.id) {
        recordError(
          `recipe '${recipe.id}' has profession '${recipe.profession}' but expected '${profession.id}'`,
        );
      }
      if (!Number.isFinite(recipe.tier)) {
        recordError(`recipe '${recipe.id}' missing numeric tier`);
      }
    });
  });
};

const run = () => {
  checkUniqueIds(DataRegistry.getRaces(), "races");
  checkUniqueIds(DataRegistry.getClasses(), "classes");
  checkUniqueIds(DataRegistry.getEnemies(), "enemies");
  checkUniqueIds(DataRegistry.getTitles(), "titles");
  checkItems();
  checkCategoryMap();
  checkProfessionMap();
  checkRecipes();

  if (errors.length) {
    console.error("Registry validation failed:");
    errors.forEach((message) => console.error(`- ${message}`));
    process.exitCode = 1;
    return;
  }

  console.log("Registry validation passed.");
};

run();
