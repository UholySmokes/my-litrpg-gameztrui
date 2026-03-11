import { afterEach, describe, expect, it } from "@jest/globals";
import { DataRegistry } from "../../src/data/DataRegistry.js";
import {
  itemDatabase,
  resetItemCaches,
  setItemDatabase,
  getItemsByType,
  getItemSummaries,
  getItemSummaryById,
  getGeneratedPlaceholderItemIds,
} from "../../src/data/registries/ItemDataRegistry.js";

let itemSnapshot = null;

afterEach(() => {
  if (itemSnapshot) {
    setItemDatabase(itemSnapshot);
    itemSnapshot = null;
  }
  resetItemCaches();
});

describe("item registry runtime", () => {
  it("returns lightweight item summaries through the registry facade", () => {
    const summary = getItemSummaryById("legendary_blade");

    expect(summary).toEqual(
      expect.objectContaining({
        id: "legendary_blade",
        name: "Legendary Blade",
        type: "equipment",
        rarity: "legendary",
        equipSlot: "weapon",
        levelRequirement: 50,
        contentStatus: "canonical",
      }),
    );
    expect(summary.description).toBeUndefined();
    expect(DataRegistry.getItemSummaryById("legendary_blade")).toEqual(summary);
    expect(
      DataRegistry.getItemSummaries().some((entry) => entry.id === "legendary_blade"),
    ).toBe(true);
  });

  it("rebuilds type lookups and summaries after runtime mutations", () => {
    itemSnapshot = structuredClone(itemDatabase);

    itemDatabase.focus_draught = {
      id: "focus_draught",
      name: "Focus Draught",
      type: "consumable",
      quantity: 1,
      rarity: "uncommon",
      value: 18,
      description: "A quick concentration tonic.",
    };
    resetItemCaches();

    expect(getItemsByType("consumable").map((item) => item.id)).toContain(
      "focus_draught",
    );
    expect(getItemSummaryById("focus_draught")).toEqual(
      expect.objectContaining({
        id: "focus_draught",
        type: "consumable",
        rarity: "uncommon",
        value: 18,
      }),
    );
  });

  it("marks generated placeholder summaries with placeholder status", () => {
    const placeholderId = getGeneratedPlaceholderItemIds()[0];
    const summary = getItemSummaryById(placeholderId);

    expect(placeholderId).toBeTruthy();
    expect(summary).toEqual(
      expect.objectContaining({
        id: placeholderId,
        contentStatus: "placeholder",
      }),
    );
    expect(
      getItemSummaries().some((entry) => entry.id === placeholderId),
    ).toBe(true);
  });
});
