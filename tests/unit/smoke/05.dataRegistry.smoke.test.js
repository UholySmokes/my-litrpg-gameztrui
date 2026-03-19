import { describe, expect, it } from "@jest/globals";
import { DataRegistry } from "../../../packages/game-core/src/data/DataRegistry.js";

describe("smoke: DataRegistry", () => {
  it("returns non-empty core registries", () => {
    expect(DataRegistry.getRaces().length).toBeGreaterThan(0);
    expect(DataRegistry.getClasses().length).toBeGreaterThan(0);
    expect(DataRegistry.getEnemies().length).toBeGreaterThan(0);
  });
});
