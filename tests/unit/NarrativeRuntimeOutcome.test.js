import { describe, expect, it } from "@jest/globals";
import { resolveNarrativeRuntimeOutcome } from "../../src/hook/narrative/narrativeRuntimeOutcome.js";

describe("narrative runtime outcome policy", () => {
  it("treats successful AI output as canonical for mood and suggestions", () => {
    const result = resolveNarrativeRuntimeOutcome({
      aiResult: {
        narrative: "The whisper curls from the shrine door.",
        mood: "mysterious",
        suggestions: ["follow the whisper", { t: "study the seal", w: 0.8 }],
      },
      state: {
        player: {},
        world: {},
        quests: { active: [] },
      },
    });

    expect(result.source).toBe("ai");
    expect(result.mood).toBe("mysterious");
    expect(result.suggestions).toEqual([
      { t: "follow the whisper", w: 1 },
      { t: "study the seal", w: 0.8 },
    ]);
  });

  it("builds action-aware fallback output with deterministic suggestions", () => {
    const result = resolveNarrativeRuntimeOutcome({
      state: {
        player: {
          archetypeSystem: "Overlay",
        },
        world: {},
        quests: { active: [] },
      },
      userInput: "inspect sigil",
      actionResult: {
        success: false,
        reason: "the sigil stays dark",
      },
      variantSeed: 2,
    });

    expect(result.source).toBe("fallback");
    expect(result.narrative).toContain("inspect sigil");
    expect(result.narrative).toContain("the sigil stays dark");
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});
