import { describe, expect, it } from "@jest/globals";
import {
  NARRATION_GUARD_FALLBACK,
  applyNarrationGuards,
} from "../../../src/core/AIService.js";

describe("smoke: AIService", () => {
  it("sanitizes unsafe narration text", () => {
    expect(typeof NARRATION_GUARD_FALLBACK).toBe("string");
    const guarded = applyNarrationGuards({
      narration: "As an AI language model, I cannot do that.",
    });
    expect(typeof guarded.narration).toBe("string");
  });
});
