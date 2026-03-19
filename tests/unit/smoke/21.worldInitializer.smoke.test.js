import { describe, expect, it } from "@jest/globals";
import {
  STARTING_LOCATION_ID,
  createInitialWorldState,
} from "../../../packages/game-core/src/world/WorldInitializer.js";

describe("smoke: WorldInitializer", () => {
  it("creates world state with a starting location", () => {
    const world = createInitialWorldState({ seed: 7 });
    expect(world.location.current).toBe(STARTING_LOCATION_ID);
  });
});
