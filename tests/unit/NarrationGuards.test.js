import { describe, it, expect } from "@jest/globals";
import {
  applyNarrationGuards,
  NARRATION_GUARD_FALLBACK,
} from "../../src/core/AIService.js";

describe("applyNarrationGuards", () => {
  it("trims stories to the maximum length", () => {
    const longText = "a".repeat(1400);
    const result = applyNarrationGuards({ story: longText, mood: "neutral" });
    expect(result.story.length).toBeLessThanOrEqual(1200);
    expect(result.narrative.length).toBeLessThanOrEqual(1200);
    expect(result.narrative).toBe(result.story);
  });

  it("removes tone-breaking sentences", () => {
    const story =
      "As an AI, I cannot help with that. The market roars with life tonight.";
    const result = applyNarrationGuards({ story, mood: "neutral" });
    expect(result.story.toLowerCase()).not.toContain("as an ai");
    expect(result.story).toContain("market roars");
    expect(result.narrative.toLowerCase()).not.toContain("as an ai");
    expect(result.narrative).toContain("market roars");
  });

  it("falls back when all content is filtered", () => {
    const story = "As an AI, I cannot help with that.";
    const result = applyNarrationGuards({ story, mood: "neutral" });
    expect(result.story).toBe(NARRATION_GUARD_FALLBACK);
    expect(result.narrative).toBe(NARRATION_GUARD_FALLBACK);
  });
});
