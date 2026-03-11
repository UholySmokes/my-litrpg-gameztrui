import { describe, expect, it } from "@jest/globals";
import {
  collectNarrativeOutcomeNotes,
  mergeSuggestedQuestIntoState,
} from "../../src/hook/narrative/narrativeOutcomePipeline.js";

describe("Narrative outcome pipeline", () => {
  it("deduplicates system notes while dropping blanks", () => {
    expect(
      collectNarrativeOutcomeNotes([
        "Quest advanced.",
        "",
        "Quest advanced.",
        "New clue found.",
      ]),
    ).toEqual(["Quest advanced.", "New clue found."]);
  });

  it("adds a suggestion quest once and preserves completed quests", () => {
    const result = mergeSuggestedQuestIntoState(
      {
        quests: {
          active: [{ id: "starter" }],
          completed: [{ id: "finished" }],
        },
      },
      { id: "suggested", name: "Suggested Quest" },
    );

    expect(result.added).toBe(true);
    expect(result.state.quests.active.map((quest) => quest.id)).toEqual([
      "starter",
      "suggested",
    ]);
    expect(result.state.quests.completed).toEqual([{ id: "finished" }]);
  });
});
