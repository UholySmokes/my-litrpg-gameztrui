import { describe, it, expect } from "@jest/globals";
import {
  applyNarrationGuards,
  NARRATION_GUARD_FALLBACK,
} from "../../src/core/AIService.js";

describe("applyNarrationGuards", () => {
  it("trims narratives to the maximum length", () => {
    const longText = "a".repeat(1400);
    const result = applyNarrationGuards({ narrative: longText, mood: "neutral" });
    expect(result.narrative.length).toBeLessThanOrEqual(1200);
  });

  it("removes tone-breaking sentences", () => {
    const narrative =
      "As an AI, I cannot help with that. The market roars with life tonight.";
    const result = applyNarrationGuards({ narrative, mood: "neutral" });
    expect(result.narrative.toLowerCase()).not.toContain("as an ai");
    expect(result.narrative).toContain("market roars");
  });

  it("falls back when all content is filtered", () => {
    const narrative = "As an AI, I cannot help with that.";
    const result = applyNarrationGuards({ narrative, mood: "neutral" });
    expect(result.narrative).toBe(NARRATION_GUARD_FALLBACK);
  });
});
