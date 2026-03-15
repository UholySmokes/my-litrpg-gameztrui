import { describe, expect, it } from "@jest/globals";
import { buildFallbackNarrative } from "../../src/hook/narrative/fallbackNarrative.js";

describe("narrative fallback builder", () => {
  it("builds deterministic initial fallback narrative from state context", () => {
    const result = buildFallbackNarrative({
      state: {
        player: {
          name: "Ari",
          class: { name: "Vanguard" },
          archetypeSystem: { name: "Authority" },
        },
        world: {
          location: { current: "Ashen Gate" },
        },
        quests: {
          active: [{ name: "First Directive" }],
        },
      },
      isInitial: true,
      variantSeed: 1,
    });

    expect(result).toContain("Ari, a Vanguard, arrives at Ashen Gate.");
    expect(result).toContain("Authority");
    expect(result).toContain('"First Directive"');
  });

  it("builds action fallback text deterministically for failed attempts", () => {
    const result = buildFallbackNarrative({
      userInput: "inspect sigil",
      actionResult: {
        success: false,
        reason: "the sigil stays dark",
      },
      state: {
        player: {
          archetypeSystem: "Overlay",
        },
      },
      variantSeed: 2,
    });

    expect(result).toContain("You attempt to inspect sigil");
    expect(result).toContain("the sigil stays dark");
    expect(result).toContain("Overlay");
  });
});
