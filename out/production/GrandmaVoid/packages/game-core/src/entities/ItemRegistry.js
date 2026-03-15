import { DataRegistry } from "../data/DataRegistry.js";

// Legacy shim so existing imports continue to work while DataRegistry becomes
// the single source of truth for item data. Consumers should migrate to
// `DataRegistry` directly, but these helpers keep backward compatibility.

export function getItemData(itemId) {
  return DataRegistry.getItemById(itemId);
}

export function getItemsByType(type) {
  return DataRegistry.getItemsByType(type);
}

export function getItemsByRarity(rarity) {
  return DataRegistry.getItemsByRarity(rarity);
}

export function getItems() {
  return DataRegistry.getItems();
}
