import { describe, expect, it } from "@jest/globals";
import {
  MOBILE_ATRIUM_TABS,
  MOBILE_SYSTEM_MENU,
} from "../../src/ui/mobile/mobileAtriumNav.js";

describe("mobile atrium navigation model", () => {
  it("uses atrium-aligned tab labels", () => {
    expect(MOBILE_ATRIUM_TABS).toEqual([
      { id: "adventure", icon: "AT", label: "Atrium" },
      { id: "character", icon: "SG", label: "Scryglass" },
      { id: "inventory", icon: "IV", label: "Vault" },
      { id: "quests", icon: "QC", label: "Codex" },
      { id: "menu", icon: "RM", label: "Rooms" },
    ]);
  });

  it("promotes system surfaces into named mobile room entries", () => {
    const labels = MOBILE_SYSTEM_MENU.flatMap((group) => group.items.map((item) => item.label));

    expect(labels).toEqual(
      expect.arrayContaining([
        "Shop Caravan",
        "Gacha Constellarium",
        "Profession Workshop",
        "Status Scryglass",
        "Save Vault",
      ]),
    );
  });
});
