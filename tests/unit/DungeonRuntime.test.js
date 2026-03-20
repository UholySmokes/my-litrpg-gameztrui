import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { SimBridge } from "@voidverse/game-core/simulation/bridge/SimulationContext.js";
import { gameReducer } from "@voidverse/game-core/core/gameReducer.js";
import { initialGameState } from "@voidverse/game-core/data/initialState.js";

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

describe("dungeon runtime reducer flow", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    SimBridge.deactivate();
  });

  it("creates a deterministic dungeon run from the same seed", () => {
    SimBridge.initialize(17);
    const first = gameReducer(cloneState(initialGameState), {
      type: "DUNGEON_START_RUN",
      payload: { templateId: "training_depths", roomCount: 4 },
    });

    SimBridge.initialize(17);
    const second = gameReducer(cloneState(initialGameState), {
      type: "DUNGEON_START_RUN",
      payload: { templateId: "training_depths", roomCount: 4 },
    });

    expect(first.dungeon.activeRun).toEqual(second.dungeon.activeRun);
    expect(first.dungeon.activeRun.rooms).toHaveLength(4);
    expect(first.dungeon.activeRun.currentRoomIndex).toBe(0);
  });

  it("blocks room advancement until the current room is completed", () => {
    SimBridge.initialize(21);
    const started = gameReducer(cloneState(initialGameState), {
      type: "DUNGEON_START_RUN",
      payload: { roomCount: 2 },
    });

    const advanced = gameReducer(started, {
      type: "DUNGEON_ADVANCE_ROOM",
    });

    expect(advanced.dungeon.activeRun.currentRoomIndex).toBe(0);
    expect(advanced.dungeon.completedRuns).toHaveLength(0);
  });

  it("applies current room rewards only once", () => {
    SimBridge.initialize(33);
    const started = gameReducer(cloneState(initialGameState), {
      type: "DUNGEON_START_RUN",
      payload: { roomCount: 1 },
    });

    const completedOnce = gameReducer(started, {
      type: "DUNGEON_COMPLETE_ROOM",
    });
    const completedTwice = gameReducer(completedOnce, {
      type: "DUNGEON_COMPLETE_ROOM",
    });

    expect(completedOnce.player.currency.goldCoins).toBeGreaterThan(
      started.player.currency.goldCoins,
    );
    expect(completedOnce.player.xp.current).toBeGreaterThan(started.player.xp.current);
    expect(completedTwice.player.currency.goldCoins).toBe(
      completedOnce.player.currency.goldCoins,
    );
    expect(completedTwice.player.xp.current).toBe(completedOnce.player.xp.current);
  });

  it("abandons the active dungeon run without corrupting completion history", () => {
    SimBridge.initialize(44);
    const started = gameReducer(cloneState(initialGameState), {
      type: "DUNGEON_START_RUN",
      payload: { roomCount: 3 },
    });

    const abandoned = gameReducer(started, {
      type: "DUNGEON_ABANDON_RUN",
    });

    expect(abandoned.dungeon.activeRun).toBeNull();
    expect(abandoned.dungeon.completedRuns).toEqual([]);
  });

  it("finalizes a completed run and ignores extra advancement attempts", () => {
    SimBridge.initialize(55);
    const started = gameReducer(cloneState(initialGameState), {
      type: "DUNGEON_START_RUN",
      payload: { roomCount: 1 },
    });
    const completed = gameReducer(started, {
      type: "DUNGEON_COMPLETE_ROOM",
    });
    const finalized = gameReducer(completed, {
      type: "DUNGEON_ADVANCE_ROOM",
    });
    const extraAdvance = gameReducer(finalized, {
      type: "DUNGEON_ADVANCE_ROOM",
    });

    expect(finalized.dungeon.activeRun).toBeNull();
    expect(finalized.dungeon.completedRuns).toHaveLength(1);
    expect(extraAdvance.dungeon.completedRuns).toHaveLength(1);
  });
});