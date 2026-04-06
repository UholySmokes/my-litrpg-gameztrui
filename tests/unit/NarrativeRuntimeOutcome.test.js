import { describe, expect, it } from "@jest/globals";
import { resolveNarrativeRuntimeOutcome } from "../../src/hook/narrative/narrativeRuntimeOutcome.js";

describe("narrative runtime outcome policy", () => {
  it("treats successful AI output as canonical for mood and suggestions", () => {
    const result = resolveNarrativeRuntimeOutcome({
      aiResult: {
        story: "The whisper curls from the shrine door.",
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
    expect(result.story).toBe("The whisper curls from the shrine door.");
    expect(result.narrative).toBe(result.story);
    expect(result.mood).toBe("mysterious");
    expect(result.suggestions.length).toBeGreaterThanOrEqual(3);
    expect(result.suggestions[0]).toEqual(
      expect.objectContaining({ t: "follow the whisper", w: 0.9 }),
    );
    expect(result.suggestions[1]).toEqual(
      expect.objectContaining({ t: "study the seal", w: 0.8 }),
    );
    expect(result.suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ t: "look around", w: 1 }),
      ]),
    );
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
    expect(result.story).toContain("inspect sigil");
    expect(result.story).toContain("the sigil stays dark");
    expect(result.narrative).toContain("inspect sigil");
    expect(result.narrative).toContain("the sigil stays dark");
    expect(result.narrative).toBe(result.story);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.sceneMemory).toEqual(
      expect.objectContaining({
        locationLabel: "Sigil Hall",
        zoneLabel: "Threshold",
        presentEntities: ["Caretaker Echo"],
      }),
    );
  });
});
