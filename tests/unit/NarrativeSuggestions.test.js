import { describe, expect, it } from "@jest/globals";
import {
  buildActionSuggestions,
  buildSummaryPrompt,
  computeDominantMood,
  resolveActionSuggestions,
} from "../../src/hook/narrative/narrativeSuggestions.js";

describe("narrative suggestion helpers", () => {
  it("surfaces opening scene choices ahead of generic fillers", () => {
    const suggestions = buildActionSuggestions({
      world: {
        vars: {
          startingSceneId: "start_fog_clan_ashes",
          openingSceneChoicePending: true,
        },
      },
      player: {},
    });

    expect(suggestions[0].t).toBe("look around");
    expect(suggestions.some((entry) => entry.t.includes("Run. Live now"))).toBe(true);
  });

  it("builds compact summary prompts and computes dominant mood", () => {
    const prompt = buildSummaryPrompt({
      previousSummary: "Old summary",
      recentLines: ["Narrator: The shrine wakes.", "System: Quest updated."],
    });

    expect(prompt).toContain("Old summary");
    expect(prompt).toContain("Narrator: The shrine wakes.");
    expect(
      computeDominantMood([
        { text: "A shadow threat closes in.", mood: "tense" },
        { text: "The enemy looms over you." },
      ]),
    ).toBe("tense");
  });

  it("prefers story-specific suggestions and falls back deterministically when empty", () => {
    expect(
      resolveActionSuggestions({
        preferredSuggestions: ["follow the whisper", { t: "ask about the sigil", w: 0.8 }],
        fallbackSuggestions: [{ t: "check status", w: 0.9 }],
      }),
    ).toEqual([
      { t: "follow the whisper", w: 1 },
      { t: "ask about the sigil", w: 0.8 },
    ]);

    expect(
      resolveActionSuggestions({
        preferredSuggestions: [],
        fallbackSuggestions: [{ t: "check status", w: 0.9 }],
      }),
    ).toEqual([{ t: "check status", w: 0.9 }]);
  });
});
