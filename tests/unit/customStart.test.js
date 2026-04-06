import { describe, expect, it } from "@jest/globals";
import { optimizeStartCommand } from "../../src/core/customStart.js";

describe("optimizeStartCommand", () => {
  it("does not inject a forced starting location into optimized commands", () => {
    const result = optimizeStartCommand(
      "start by asking the first locals what trouble is already moving",
    );

    expect(result.optimized).toBe(
      "by asking the first locals what trouble is already moving.",
    );
    expect(result.optimized).not.toMatch(/\bAt\s+[A-Z]/);
    expect(result.alternatives).toHaveLength(3);
    expect(result.alternatives.join(" ")).not.toContain("Rebirth Alcove");
    expect(result.inference).toEqual({
      locationId: null,
      location: null,
      zone: null,
    });
  });
});