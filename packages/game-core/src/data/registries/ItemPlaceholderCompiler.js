function humanizeItemId(itemId) {
  return String(itemId || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferPlaceholderRarity(tier) {
  const safeTier = Number.isFinite(tier) ? Number(tier) : 1;
  if (safeTier >= 9) return "legendary";
  if (safeTier >= 7) return "epic";
  if (safeTier >= 5) return "rare";
  if (safeTier >= 3) return "uncommon";
  return "common";
}

function inferPlaceholderType(itemId, { isResult = false } = {}) {
  const normalized = String(itemId || "").toLowerCase();
  if (!isResult) return "material";
  if (
    /(potion|elixir|tonic|meal|stew|bread|ale|wine|jerky|salve|antidote|ration|bandage|kit)/u.test(
      normalized,
    )
  ) {
    return "consumable";
  }
  if (
    /(sword|blade|dagger|armor|robe|cloak|gloves|shield|ring|amulet|circlet|crown|tool|bow|helmet|charm|relic|catalyst)/u.test(
      normalized,
    )
  ) {
    return "equipment";
  }
  if (
    /(cache|ledger|glyph|scroll|map|token|seal|fragment|core|shard|rune)/u.test(
      normalized,
    )
  ) {
    return "quest";
  }
  return "material";
}

function withPlaceholderProvenance(item, { professionId, recipeId, role }) {
  const existingMeta =
    item?.placeholderMeta && typeof item.placeholderMeta === "object"
      ? item.placeholderMeta
      : {};
  const existingRefs = Array.isArray(existingMeta.references)
    ? [...existingMeta.references]
    : [];
  const nextRef = {
    professionId: String(professionId || ""),
    recipeId: String(recipeId || ""),
    role: String(role || "reference"),
  };
  const hasRef = existingRefs.some(
    (ref) =>
      ref?.professionId === nextRef.professionId &&
      ref?.recipeId === nextRef.recipeId &&
      ref?.role === nextRef.role,
  );
  if (!hasRef) {
    existingRefs.push(nextRef);
  }

  const nextTags = Array.isArray(item?.tags) ? [...item.tags] : [];
  if (!nextTags.includes("placeholder_generated")) {
    nextTags.push("placeholder_generated");
  }

  return {
    ...item,
    tags: nextTags,
    contentStatus: "placeholder",
    placeholderMeta: {
      generated: true,
      source: "recipe_reference_closure",
      references: existingRefs,
    },
  };
}

export function buildRecipePlaceholderItems({
  itemDatabase = {},
  professions = [],
  getRecipesForProfession,
} = {}) {
  const placeholders = {};

  if (typeof getRecipesForProfession !== "function") {
    return placeholders;
  }

  const upsertPlaceholder = (itemId, payload, provenance) => {
    if (itemDatabase[itemId]) return;
    if (placeholders[itemId]) {
      placeholders[itemId] = withPlaceholderProvenance(
        placeholders[itemId],
        provenance,
      );
      return;
    }
    placeholders[itemId] = withPlaceholderProvenance(payload, provenance);
  };

  for (const profession of professions) {
    const recipes = getRecipesForProfession(profession.id, 9) || [];
    for (const recipe of recipes) {
      const tier = Number.isFinite(recipe?.tier) ? recipe.tier : 1;
      const rarity = inferPlaceholderRarity(tier);
      const baseValue = Math.max(5, 8 + tier * 12);

      const ingredients = Array.isArray(recipe?.ingredients)
        ? recipe.ingredients
        : [];
      for (const ingredient of ingredients) {
        const ingredientId = ingredient?.id || ingredient?.itemId;
        if (!ingredientId || itemDatabase[ingredientId]) {
          continue;
        }
        upsertPlaceholder(
          ingredientId,
          {
            id: ingredientId,
            name: humanizeItemId(ingredientId),
            type: inferPlaceholderType(ingredientId, { isResult: false }),
            quantity: 1,
            description: `Crafting reagent placeholder generated from recipe '${recipe.id}'.`,
            rarity,
            value: baseValue,
          },
          {
            professionId: profession.id,
            recipeId: recipe.id,
            role: "ingredient",
          },
        );
      }

      const resultId = recipe?.result?.id || recipe?.result?.itemId;
      if (resultId && !itemDatabase[resultId]) {
        upsertPlaceholder(
          resultId,
          {
            id: resultId,
            name: humanizeItemId(resultId),
            type: inferPlaceholderType(resultId, { isResult: true }),
            quantity: 1,
            description: `Crafted item placeholder generated from recipe '${recipe.id}'.`,
            rarity,
            value: baseValue + 10,
          },
          {
            professionId: profession.id,
            recipeId: recipe.id,
            role: "result",
          },
        );
      }
    }
  }

  return placeholders;
}
