import { describe, expect, it } from "@jest/globals";
import {
  buildActionSuggestions,
  buildSummaryPrompt,
  computeDominantMood,
  normalizeActionSuggestions,
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
        preferredChoiceMeta: [
          { category: "progress", urgency: 0.9, groundedInState: true },
          { category: "social", urgency: 0.8, groundedInState: true },
        ],
        state: {
          narrative: {
            sceneMemory: {
              presentEntities: ["Sigil Keeper"],
              locationLabel: "Whispering Gate",
            },
          },
          quests: { active: [] },
        },
        fallbackSuggestions: [{ t: "check status", w: 0.9 }],
      }),
    ).toEqual([
      { t: "follow the whisper", w: 0.9 },
      { t: "ask about the sigil", w: 0.8 },
      { t: "check status", w: 0.9 },
    ]);

    expect(
      resolveActionSuggestions({
        preferredSuggestions: [],
        fallbackSuggestions: [{ t: "check status", w: 0.9 }],
        state: { quests: { active: [] } },
      }),
    ).toEqual([{ t: "check status", w: 0.9 }]);
  });

  it("normalizes weights from choice meta and dedupes case-insensitively", () => {
    expect(
      normalizeActionSuggestions(
        ["Inspect the Seal", "inspect the seal", { t: "Speak with locals", w: 0.2 }],
        {
          choiceMeta: [{ urgency: 0.7 }, { urgency: 0.2 }, { urgency: 0.4 }],
          maxItems: 3,
        },
      ),
    ).toEqual([
      { t: "Inspect the Seal", w: 0.7 },
      { t: "Speak with locals", w: 0.4 },
    ]);
  });

  it("rejects impossible or ungrounded suggestions and backfills with safe alternatives", () => {
    expect(
      resolveActionSuggestions({
        preferredSuggestions: [
          { t: "attack enemy", w: 1 },
          { t: "talk to missing prince", w: 0.9 },
          { t: "inspect the sigil", w: 0.8 },
        ],
        preferredChoiceMeta: [
          { category: "risk", urgency: 1, groundedInState: true },
          { category: "social", urgency: 0.9, groundedInState: false },
          { category: "observe", urgency: 0.8, groundedInState: true },
        ],
        fallbackSuggestions: [
          { t: "check status", w: 0.9 },
          { t: "rest to recover", w: 0.85 },
          { t: "follow quest lead", w: 0.8 },
        ],
        state: {
          combat: { inCombat: false, status: "inactive", enemies: [] },
          narrative: {
            sceneMemory: {
              presentEntities: ["Sigil Keeper"],
              locationLabel: "Sigil Hall",
            },
          },
          quests: { active: [{ name: "Wake the sigil" }] },
        },
      }),
    ).toEqual([
      { t: "inspect the sigil", w: 0.8 },
      { t: "rest to recover", w: 0.85 },
      { t: "check status", w: 0.9 },
    ]);
  });
});
