import { describe, expect, it } from "@jest/globals";
import {
  CATEGORY_ORDER,
  DEFAULT_CATEGORY_CONFIG,
  getCategoryConfig,
} from "@voidverse/game-core/systems/archetype/ArchetypeCategoryConfig.js";

describe("archetype category config", () => {
  it("returns the expected known category metadata", () => {
    expect(CATEGORY_ORDER).toEqual([
      "System",
      "Authority",
      "Path",
      "Framework",
      "Privilege",
      "Overlay",
    ]);
    expect(getCategoryConfig("System")).toEqual(
      expect.objectContaining({
        label: "System",
        integrity: 100,
        narrativeTone: "analytical",
      }),
    );
  });

  it("falls back to the default config for unknown categories", () => {
    expect(getCategoryConfig("Unknown Category")).toBe(DEFAULT_CATEGORY_CONFIG);
  });
});
