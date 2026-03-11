export function isGeneratedPlaceholderItem(item) {
  return Boolean(item?.placeholderMeta?.generated === true);
}

function buildItemSummary(item) {
  return {
    id: item.id,
    name: item.name,
    type: item.type || null,
    rarity: item.rarity || null,
    equipSlot: item.equipSlot || null,
    value: Number.isFinite(Number(item.value)) ? Number(item.value) : 0,
    contentStatus: item.contentStatus || "canonical",
    levelRequirement: Number.isFinite(Number(item.levelRequirement))
      ? Number(item.levelRequirement)
      : null,
  };
}

export function createItemRegistryRuntime(itemDatabase = {}) {
  let itemListCache = null;
  let itemSummariesCache = null;
  let itemSummaryByIdCache = null;
  const itemsByTypeCache = new Map();
  const itemsByRarityCache = new Map();
  const equipmentBySlotCache = new Map();
  let generatedPlaceholderItemIdsCache = null;

  const getItemList = () => {
    if (!itemListCache) {
      itemListCache = Object.values(itemDatabase);
    }
    return itemListCache;
  };

  const getItemsByTypeCache = (type) => {
    if (!itemsByTypeCache.has(type)) {
      itemsByTypeCache.set(
        type,
        getItemList().filter((item) => item.type === type),
      );
    }
    return itemsByTypeCache.get(type);
  };

  const getItemsByRarityCache = (rarity) => {
    if (!itemsByRarityCache.has(rarity)) {
      itemsByRarityCache.set(
        rarity,
        getItemList().filter((item) => item.rarity === rarity),
      );
    }
    return itemsByRarityCache.get(rarity);
  };

  const getEquipmentBySlotCache = (slot) => {
    if (!equipmentBySlotCache.has(slot)) {
      equipmentBySlotCache.set(
        slot,
        getItemList().filter(
          (item) => item.type === "equipment" && item.equipSlot === slot,
        ),
      );
    }
    return equipmentBySlotCache.get(slot);
  };

  const getItemSummariesCache = () => {
    if (!itemSummariesCache) {
      itemSummariesCache = getItemList().map(buildItemSummary);
    }
    return itemSummariesCache;
  };

  const getItemSummaryByIdCache = () => {
    if (!itemSummaryByIdCache) {
      itemSummaryByIdCache = new Map(
        getItemSummariesCache().map((summary) => [summary.id, summary]),
      );
    }
    return itemSummaryByIdCache;
  };

  const getGeneratedPlaceholderItemIdsCache = () => {
    if (!generatedPlaceholderItemIdsCache) {
      generatedPlaceholderItemIdsCache = getItemList()
        .filter((item) => isGeneratedPlaceholderItem(item))
        .map((item) => item.id);
    }
    return generatedPlaceholderItemIdsCache;
  };

  return {
    getItemData(itemId) {
      return itemDatabase[itemId] || null;
    },
    getItems() {
      return getItemList().slice();
    },
    getItemsByType(type) {
      return getItemsByTypeCache(type).slice();
    },
    getItemsByRarity(rarity) {
      return getItemsByRarityCache(rarity).slice();
    },
    getEquipmentBySlot(slot) {
      return getEquipmentBySlotCache(slot).slice();
    },
    getItemSummaries() {
      return getItemSummariesCache().slice();
    },
    getItemSummaryById(itemId) {
      if (!itemId) return null;
      return getItemSummaryByIdCache().get(itemId) || null;
    },
    getGeneratedPlaceholderItemIds() {
      return getGeneratedPlaceholderItemIdsCache().slice();
    },
  };
}
