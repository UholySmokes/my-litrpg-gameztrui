import { describe, it, expect } from "@jest/globals";
import { DataRegistry } from "../../src/data/DataRegistry.js";
import {
  itemDatabase,
  resetItemCaches,
} from "../../src/data/registries/ItemDataRegistry.js";

describe("DataRegistry item lookups", () => {
  it("returns matching items by type", () => {
    const items = DataRegistry.getItemsByType("consumable");
    const itemIds = items.map((item) => item.id);
    expect(itemIds).toContain("minor_health_potion");
    expect(itemIds).toContain("health_potion");
    expect(itemIds).not.toContain("wooden_sword");
  });

  it("returns matching items by rarity", () => {
    const items = DataRegistry.getItemsByRarity("legendary");
    const itemIds = items.map((item) => item.id);
    expect(itemIds).toContain("legendary_blade");
    expect(itemIds).toContain("dragon_scale_armor");
    expect(itemIds).not.toContain("rusty_sword");
  });

  it("returns equipment for the specified slot", () => {
    const items = DataRegistry.getEquipmentBySlot("weapon");
    const itemIds = items.map((item) => item.id);
    expect(itemIds).toContain("wooden_sword");
    expect(itemIds).toContain("magic_sword");
    expect(itemIds).not.toContain("leather_armor");
  });

  it("returns copies of cached arrays", () => {
    const firstCall = DataRegistry.getItemsByType("consumable");
    firstCall.pop();
    const secondCall = DataRegistry.getItemsByType("consumable");
    expect(secondCall.length).toBeGreaterThan(firstCall.length);
  });

  it("resets caches after data changes", () => {
    const tempId = "temp_cache_test_item";
    try {
      itemDatabase[tempId] = {
        id: tempId,
        name: "Temp Cache Item",
        type: "consumable",
        quantity: 1,
        description: "Temporary item for cache reset test.",
        rarity: "common",
        value: 1,
      };
      resetItemCaches();
      const items = DataRegistry.getItemsByType("consumable");
      expect(items.map((item) => item.id)).toContain(tempId);
    } finally {
      delete itemDatabase[tempId];
      resetItemCaches();
    }
    const itemsAfterReset = DataRegistry.getItemsByType("consumable");
    expect(itemsAfterReset.map((item) => item.id)).not.toContain(tempId);
  });

  it("marks generated recipe placeholders with provenance metadata", () => {
    const placeholder = Object.values(itemDatabase).find(
      (item) => item?.placeholderMeta?.generated === true,
    );
    expect(placeholder).toBeTruthy();
    expect(placeholder.contentStatus).toBe("placeholder");
    expect(Array.isArray(placeholder.placeholderMeta.references)).toBe(true);
    expect(placeholder.placeholderMeta.references.length).toBeGreaterThan(0);
    expect(Array.isArray(placeholder.tags)).toBe(true);
    expect(placeholder.tags).toContain("placeholder_generated");
  });
});
