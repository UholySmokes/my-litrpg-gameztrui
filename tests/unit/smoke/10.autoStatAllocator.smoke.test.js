import { describe, expect, it } from "@jest/globals";
import {
  allocatePoints,
  STAT_PRESETS,
} from "../../../packages/game-core/src/systems/AutoStatAllocator.js";

describe("smoke: AutoStatAllocator", () => {
  it("allocates all requested points", () => {
    const allocation = allocatePoints(9, "balanced");
    const total = Object.values(allocation).reduce((sum, value) => sum + value, 0);
    expect(total).toBe(9);
    expect(STAT_PRESETS.balanced).toBeDefined();
  });
});
