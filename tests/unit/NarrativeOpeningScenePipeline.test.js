import { describe, expect, it } from "@jest/globals";
import { getOpeningSceneChoice } from "../../src/data/OpeningScenes.js";
import { initialGameState } from "../../src/data/initialState.js";
import {
  applyOpeningSceneChoice,
  resolveOpeningChoiceFromInput,
} from "../../src/hook/narrative/openingScenePipeline.js";

describe("opening scene pipeline", () => {
  it("matches a scene choice from alias text", () => {
    const expected = getOpeningSceneChoice("start_fog_clan_ashes", 0);
    const resolved = resolveOpeningChoiceFromInput("run", "start_fog_clan_ashes");

    expect(resolved?.label).toBe(expected?.label);
  });

  it("applies opening-scene effects to state deterministically", () => {
    const baseState = structuredClone(initialGameState);
    baseState.world = {
      ...(baseState.world || {}),
      vars: {
        ...(baseState.world?.vars || {}),
        startingSceneId: "start_fog_clan_ashes",
        openingSceneChoicePending: true,
      },
    };
    const choice = getOpeningSceneChoice("start_fog_clan_ashes", 1);

    const result = applyOpeningSceneChoice(baseState, {
      sceneId: "start_fog_clan_ashes",
      choice,
    });

    expect(result.state.world.vars.openingSceneChoicePending).toBe(false);
    expect(
      result.state.player.activeSkills.some((skill) => skill.id === "skill_qi_strike"),
    ).toBe(true);
    expect(
      result.state.quests.active.some((quest) => quest.id === "quest_first_core_cultivation"),
    ).toBe(true);
    expect(result.notes).toContain("New ability unlocked: Qi Strike.");
  });
});
