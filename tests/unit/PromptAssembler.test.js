import { describe, it, expect } from "@jest/globals";
import { buildHistorySection } from "../../src/core/PromptAssembler.js";

const makeEntry = ({ id, type, text, timestamp, sequence }) => ({
  id,
  type,
  text,
  timestamp,
  sequence,
});

describe("buildHistorySection", () => {
  it("orders entries deterministically and filters non-narrative noise", () => {
    const gameState = {
      narrative: {
        summary: "Summary text",
        entries: [
          makeEntry({
            id: "c",
            type: "narrative",
            text: "Third event",
            timestamp: 2,
            sequence: 3,
          }),
          makeEntry({
            id: "a",
            type: "system",
            text: "System notice",
            timestamp: 1,
            sequence: 1,
          }),
          makeEntry({
            id: "b",
            type: "narrative",
            text: "Second event",
            timestamp: 1,
            sequence: 2,
          }),
          makeEntry({
            id: "ignored",
            type: "combat",
            text: "Combat log",
            timestamp: 3,
            sequence: 4,
          }),
        ],
      },
    };

    const history = buildHistorySection(gameState);
    const lines = history.split("\n").slice(1);
    expect(lines).toEqual([
      "System: System notice",
      "Narrator: Second event",
      "Narrator: Third event",
    ]);
    expect(history).not.toContain("Combat log");
  });

  it("caps history entries by count", () => {
    const entries = Array.from({ length: 15 }, (_, index) =>
      makeEntry({
        id: `entry-${index}`,
        type: "narrative",
        text: `Event ${index}`,
        timestamp: index,
        sequence: index,
      }),
    );
    const history = buildHistorySection({
      narrative: {
        summary: "Summary",
        entries,
      },
    });
    const lines = history.split("\n").slice(1);
    expect(lines.length).toBe(12);
    expect(lines[0]).toBe("Narrator: Event 3");
    expect(lines[11]).toBe("Narrator: Event 14");
  });
});
