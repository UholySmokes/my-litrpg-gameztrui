import { describe, expect, it } from "@jest/globals";
import {
  DEFAULT_START_LOCATION_ID,
  locations,
  getLocationById,
} from "../../../packages/game-core/src/world/WorldDataRegistry.js";

describe("smoke: WorldDataRegistry", () => {
  it("contains locations and resolves the default start location", () => {
    expect(locations.length).toBeGreaterThan(0);
    expect(getLocationById(DEFAULT_START_LOCATION_ID)).toBeDefined();
  });
});
