import { DataRegistry } from "../data/DataRegistry.js";
import { itemDatabase } from "../data/registries/ItemDataRegistry.js";

// Legacy shim so existing imports continue to work while DataRegistry becomes
// the single source of truth for item data. Consumers should migrate to
// `DataRegistry` directly, but these helpers keep backward compatibility.

;

export function getItemData(itemId) {
  return DataRegistry.getItemById(itemId);
}

function getItemsByType(type) {
  return DataRegistry.getItemsByType(type);
}

function getItemsByRarity(rarity) {
  return DataRegistry.getItemsByRarity(rarity);
}

function getItems() {
  return DataRegistry.getItems();
}
