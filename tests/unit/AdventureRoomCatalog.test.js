import { describe, expect, it } from "@jest/globals";
import { getAdventureRoomCatalog } from "../../src/components/shell/adventureRoomCatalog.js";

describe("adventure room catalog", () => {
  it("defines the expected primary room sequence", () => {
    const catalog = getAdventureRoomCatalog();

    expect(
      catalog.filter((room) => room.group === "primary").map((room) => room.id),
    ).toEqual(["chronicle", "command", "battle", "magic-study", "inventory", "quests", "map", "loadout"]);
  });

  it("adds optional rooms only when their runtime flags are enabled", () => {
    const baseCatalog = getAdventureRoomCatalog();
    const expandedCatalog = getAdventureRoomCatalog({
      isDevBuild: true,
      hasEquipmentSelect: true,
    });

    expect(baseCatalog.some((room) => room.id === "replay")).toBe(false);
    expect(baseCatalog.some((room) => room.id === "equipmentSelect")).toBe(false);
    expect(expandedCatalog.some((room) => room.id === "replay")).toBe(true);
    expect(expandedCatalog.some((room) => room.id === "equipmentSelect")).toBe(true);
  });
});
