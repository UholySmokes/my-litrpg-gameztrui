import { describe, expect, it } from "@jest/globals";
import {
  buildActionSuggestions,
  buildSummaryPrompt,
  computeDominantMood,
  normalizeActionSuggestions,
  resolveActionSuggestions,
} from "../../src/hook/narrative/narrativeSuggestions.js";

function compactSuggestions(entries) {
  return entries.map(({ t, w, label, command, category, enabled }) => ({
    t,
    w,
    label,
    command,
    category,
    enabled,
  }));
}

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

    expect(suggestions[0].t).toBe("Run. Live now, revenge later.");
    expect(suggestions.some((entry) => entry.t.includes("Run. Live now"))).toBe(true);
    expect(suggestions.slice(0, 3).every((entry) => entry.category === "progress")).toBe(true);
    expect(suggestions.findIndex((entry) => entry.t === "look around")).toBeGreaterThan(2);
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
      compactSuggestions(
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
      ),
    ).toEqual([
      {
        t: "follow the whisper",
        w: 0.9,
        label: "follow the whisper",
        command: "follow the whisper",
        category: "progress",
        enabled: true,
      },
      {
        t: "ask about the sigil",
        w: 0.8,
        label: "ask about the sigil",
        command: "ask about the sigil",
        category: "social",
        enabled: true,
      },
      {
        t: "check status",
        w: 0.9,
        label: "check status",
        command: "check status",
        category: "observe",
        enabled: true,
      },
    ]);

    expect(
      compactSuggestions(
        resolveActionSuggestions({
          preferredSuggestions: [],
          fallbackSuggestions: [{ t: "check status", w: 0.9 }],
          state: { quests: { active: [] } },
        }),
      ),
    ).toEqual([
      {
        t: "check status",
        w: 0.9,
        label: "check status",
        command: "check status",
        category: "observe",
        enabled: true,
      },
    ]);
  });

  it("normalizes weights from choice meta and dedupes case-insensitively", () => {
    expect(
      compactSuggestions(
        normalizeActionSuggestions(
          ["Inspect the Seal", "inspect the seal", { t: "Speak with locals", w: 0.2 }],
          {
            choiceMeta: [{ urgency: 0.7 }, { urgency: 0.2 }, { urgency: 0.4 }],
            maxItems: 3,
          },
        ),
      ),
    ).toEqual([
      {
        t: "Inspect the Seal",
        w: 0.7,
        label: "Inspect the Seal",
        command: "Inspect the Seal",
        category: "",
        enabled: true,
      },
      {
        t: "Speak with locals",
        w: 0.4,
        label: "Speak with locals",
        command: "Speak with locals",
        category: "",
        enabled: true,
      },
    ]);
  });

  it("rejects impossible or ungrounded suggestions and backfills with safe alternatives", () => {
    expect(
      compactSuggestions(
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
      ),
    ).toEqual([
      {
        t: "inspect the sigil",
        w: 0.8,
        label: "inspect the sigil",
        command: "inspect the sigil",
        category: "observe",
        enabled: true,
      },
      {
        t: "rest to recover",
        w: 0.85,
        label: "rest to recover",
        command: "rest to recover",
        category: "recovery",
        enabled: true,
      },
      {
        t: "check status",
        w: 0.9,
        label: "check status",
        command: "check status",
        category: "observe",
        enabled: true,
      },
    ]);
  });

  it("keeps remaining opening-scene choices visible before generic defaults", () => {
    const resolved = compactSuggestions(
      resolveActionSuggestions({
        preferredSuggestions: [
          "Take your first step into the foundry",
          "Look around the scaffolds",
          "Search for the first threat",
        ],
        preferredChoiceMeta: [
          { category: "progress", urgency: 0.96, groundedInState: true },
          { category: "progress", urgency: 0.82, groundedInState: true },
          { category: "progress", urgency: 0.74, groundedInState: true },
        ],
        fallbackSuggestions: buildActionSuggestions({
          world: {
            vars: {
              startingSceneId: "start_fog_clan_ashes",
              openingSceneChoicePending: true,
            },
          },
          player: {},
        }),
        state: {
          world: {
            vars: {
              startingSceneId: "start_fog_clan_ashes",
              openingSceneChoicePending: true,
            },
          },
          quests: { active: [] },
        },
      }),
    );

    expect(resolved[0].t).toBe("Take your first step into the foundry");
    expect(resolved[1].t).toBe("Look around the scaffolds");
    expect(resolved[2].t).toBe("Search for the first threat");
    expect(
      resolved.findIndex((entry) => entry.t === "look around"),
    ).toBeGreaterThan(
      resolved.findIndex((entry) => entry.t === "Speak the hidden phrase your mother burned into you."),
    );
  });
});
