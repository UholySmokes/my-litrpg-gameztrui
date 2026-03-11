import { describe, expect, it } from "@jest/globals";
import {
  buildModeShellState,
  buildNarrativePanelView,
} from "../../src/components/gameui/gameUiSelectors.js";

describe("GameUI selectors", () => {
  it("builds the narrative display view model from recent entries", () => {
    const view = buildNarrativePanelView({
      narrative: {
        summary: "Remember the shrine.",
        currentMood: "mysterious",
        entries: [
          { text: "Entry 1" },
          { text: "Entry 2" },
          { text: "Entry 3" },
        ],
      },
    });

    expect(view.narrativeCurrentMood).toBe("mysterious");
    expect(view.latestNarrativeRawText).toBe("Entry 3");
    expect(view.recentNarrativeEntries.map((entry) => entry.text)).toEqual([
      "Entry 3",
      "Entry 2",
      "Entry 1",
    ]);
    expect(view.shouldShowNarrativeSummary).toBe(true);
  });

  it("computes shell render flags during mode handoff", () => {
    expect(
      buildModeShellState({ characterCreated: false, isTransitioning: true }),
    ).toEqual({
      showCreationMode: true,
      showGameMode: true,
      shouldRenderCreationShell: true,
      shouldRenderGameShell: true,
    });
  });
});
