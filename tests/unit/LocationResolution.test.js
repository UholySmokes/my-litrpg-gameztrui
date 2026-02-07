import { describe, it, expect } from "@jest/globals";
import { resolveLocationId } from "../../src/data/registries/WorldDataRegistry.js";

describe("Location resolution", () => {
  it("resolves temple to city_sunspire_temple when allowlisted", () => {
    const allowedLocationIds = new Set([
      "city_neon_bazaar",
      "city_sunspire_temple",
    ]);
    const resolved = resolveLocationId("temple", { allowedLocationIds });
    expect(resolved).toBe("city_sunspire_temple");
  });

  it("resolves forge to mountain_starforge_foundry when allowlisted", () => {
    const allowedLocationIds = new Set([
      "mountain_starforge_foundry",
      "mountain_crystal_ridgeline",
    ]);
    const resolved = resolveLocationId("forge", { allowedLocationIds });
    expect(resolved).toBe("mountain_starforge_foundry");
  });
});

