import { describe, expect, it } from "@jest/globals";
import { resolveNarrativeRuntimeOutcome } from "../../src/hook/narrative/narrativeRuntimeOutcome.js";

describe("narrative runtime outcome policy", () => {
  it("treats successful AI output as canonical for mood and suggestions", () => {
    const result = resolveNarrativeRuntimeOutcome({
      aiResult: {
        narrative: "The whisper curls from the shrine door.",
        mood: "mysterious",
        suggestions: ["follow the whisper", { t: "study the seal", w: 0.8 }],
        sceneMemory: {
          locationLabel: "Shrine Door",
          zoneLabel: "Old Rise",
          immediateObjective: "Unseal the shrine.",
          presentEntities: ["Shrine Door"],
          activeThreats: [],
          unresolvedHooks: ["Whispering seal"],
          lastConsequence: "The whisper intensified.",
        },
        choiceMeta: [
          {
            intent: "Advance before the whisper fades.",
            category: "progress",
            urgency: 0.9,
            groundedInState: true,
          },
          {
            intent: "Study the seal first.",
            category: "observe",
            urgency: 0.8,
            groundedInState: true,
          },
        ],
      },
      state: {
        player: {},
        world: {},
        narrative: {
          sceneMemory: {
            presentEntities: ["Shrine Door"],
          },
        },
        quests: { active: [] },
      },
    });

    expect(result.source).toBe("ai");
    expect(result.mood).toBe("mysterious");
    expect(result.suggestions).toEqual([
      { t: "follow the whisper", w: 0.9 },
      { t: "study the seal", w: 0.8 },
    ]);
    expect(result.sceneMemory?.locationLabel).toBe("Shrine Door");
  });

  it("builds action-aware fallback output with deterministic suggestions", () => {
    const result = resolveNarrativeRuntimeOutcome({
      state: {
        player: {
          archetypeSystem: "Overlay",
        },
        world: {},
        narrative: {
          sceneMemory: {
            locationLabel: "Sigil Hall",
            zoneLabel: "Threshold",
            presentEntities: ["Caretaker Echo"],
          },
        },
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
    expect(result.sceneMemory).toBeUndefined();
  });
});
