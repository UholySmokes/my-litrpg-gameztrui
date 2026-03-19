import { describe, expect, it } from "@jest/globals";
import {
  enemies,
  getEnemyTemplate,
} from "../../../packages/game-core/src/data/registries/EnemyDataRegistry.js";

describe("smoke: EnemyDataRegistry", () => {
  it("contains enemies and resolves goblin template", () => {
    expect(enemies.length).toBeGreaterThan(0);
    const goblin = getEnemyTemplate("goblin");
    expect(goblin).toBeDefined();
  });
});
