import { describe, expect, it } from "@jest/globals";
import { gameReducer } from "../../src/core/gameReducer.js";
import { initialGameState } from "../../src/data/initialState.js";

describe("quest objective progression", () => {
  it("marks objectives one-by-one and completes quest when all are cleared", () => {
    const quest = {
      id: "tutorial_path",
      title: "Tutorial Path",
      status: "active",
      objectives: [
        {
          id: "observe_area",
          text: "Look around once",
          criteria: {
            inputIncludes: "look around",
          },
        },
        {
          id: "reach_level_two",
          text: "Reach level 2",
          criteria: {
            minLevel: 2,
          },
        },
      ],
      rewards: {
        xp: 0,
        gold: 0,
      },
    };

    const state = {
      ...initialGameState,
      quests: {
        active: [quest],
        completed: [],
      },
    };

    const afterFirstObjective = gameReducer(state, {
      type: "APPLY_ENGINE_RESULT",
      payload: {
        ok: true,
        action: {
          type: "narrate",
          originalInput: "look around",
        },
        nextState: {
          ...state,
        },
      },
    });

    expect(afterFirstObjective.quests.active).toHaveLength(1);
    expect(afterFirstObjective.quests.completed).toHaveLength(0);
    expect(afterFirstObjective.quests.active[0].objectives[0].completed).toBe(true);
    expect(afterFirstObjective.quests.active[0].objectives[1].completed).toBeFalsy();

    const leveledState = {
      ...afterFirstObjective,
      player: {
        ...afterFirstObjective.player,
        level: 2,
      },
    };

    const completedQuestState = gameReducer(afterFirstObjective, {
      type: "APPLY_ENGINE_RESULT",
      payload: {
        ok: true,
        action: {
          type: "narrate",
          originalInput: "wait",
        },
        nextState: leveledState,
      },
    });

    expect(completedQuestState.quests.active).toHaveLength(0);
    expect(completedQuestState.quests.completed.some((entry) => entry.id === "tutorial_path")).toBe(true);
  });
});

