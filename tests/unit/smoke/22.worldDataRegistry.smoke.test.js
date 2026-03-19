import { describe, expect, it } from "@jest/globals";
import {
  locations,
  getLocationById,
} from "../../../packages/game-core/src/world/WorldDataRegistry.js";

describe("smoke: WorldDataRegistry", () => {
  it("contains locations and resolves starting_zone", () => {
    expect(locations.length).toBeGreaterThan(0);
    expect(getLocationById("starting_zone")).toBeDefined();
  });
});
