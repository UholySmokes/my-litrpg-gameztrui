import { describe, expect, it } from "@jest/globals";
import {
  applyNarrativeEntryToState,
  createInitialNarrativeState,
  replaceNarrativeEntryInState,
} from "../../src/hook/narrative/narrativeStateUpdater.js";

describe("Narrative state updater", () => {
  it("auto-tags entries and preserves summary metadata", () => {
    const nextState = applyNarrativeEntryToState(
      {
        narrative: {
          summary: "Existing memory",
          summaryMeta: { atCount: 3, updatedAt: 100 },
          entries: [{ id: "seed", text: "Calm beginning.", mood: "serene" }],
        },
      },
      {
        id: "entry-1",
        type: "narrative",
        text: "A danger closes in from the dark.",
      },
    );

    expect(nextState.narrative.summary).toBe("Existing memory");
    expect(nextState.narrative.summaryMeta).toEqual({ atCount: 3, updatedAt: 100 });
    expect(nextState.narrative.entries.at(-1).mood).toBe("tense");
    expect(nextState.narrative.currentMood).toBe("serene");
  });

  it("replaces a streaming entry and recomputes mood", () => {
    const nextState = replaceNarrativeEntryInState(
      {
        narrative: {
          summary: "",
          summaryMeta: null,
          entries: [
            { id: "stream-1", text: "placeholder", mood: "neutral" },
          ],
        },
      },
      "stream-1",
      { text: "Victory settles over the room.", source: "ai" },
    );

    expect(nextState.narrative.entries[0]).toMatchObject({
      id: "stream-1",
      source: "ai",
      mood: "triumphant",
    });
    expect(nextState.narrative.currentMood).toBe("triumphant");
  });

  it("creates the seeded initial narrative snapshot", () => {
    const nextState = createInitialNarrativeState(
      { narrative: { entries: [] } },
      "Ancient whispers move through the shrine.",
      { timestamp: 1234 },
    );

    expect(nextState.narrative.summary).toBe(
      "Ancient whispers move through the shrine.",
    );
    expect(nextState.narrative.summaryMeta).toEqual({
      atCount: 1,
      updatedAt: 1234,
    });
    expect(nextState.narrative.currentMood).toBe("mysterious");
  });
});
