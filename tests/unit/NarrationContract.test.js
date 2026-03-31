import { describe, expect, it } from "@jest/globals";
import { createRequire } from "module";
import { normalizeNarrationPayload as normalizeFrontendPayload } from "../../src/core/narrationContract.js";

const require = createRequire(import.meta.url);
const {
  normalizeNarrationPayload: normalizeBackendPayload,
} = require("../../functions/lib/narration-contract.js");

function runSharedContractAssertions(normalizePayload) {
  const legacy = normalizePayload(
    {
      narrative: "The shrine hums awake.",
      mood: "mysterious",
      suggestions: ["inspect the altar"],
    },
    {
      narrative: "Fallback.",
      suggestions: ["continue"],
    },
  );

  expect(legacy.narrative).toBe("The shrine hums awake.");
  expect(legacy.suggestions).toEqual(["inspect the altar"]);
  expect(legacy.sceneMemory).toBeUndefined();
  expect(legacy.choiceMeta).toBeUndefined();

  const structured = normalizePayload(
    {
      narrative: "The ward opens one silent layer at a time.",
      mood: "serene",
      suggestions: [
        { t: "inspect the seal", w: 0.6 },
        { t: "speak with the caretaker echo", w: 0.4 },
      ],
      sceneMemory: {
        locationLabel: "Vault Threshold",
        zoneLabel: "Glass Ward",
        immediateObjective: "Learn who opened the vault first.",
        presentEntities: ["Caretaker Echo", "Caretaker Echo"],
        activeThreats: ["Shifting ward"],
        unresolvedHooks: ["Missing key"],
        lastConsequence: "The inner seal unlocked.",
      },
      choiceMeta: [
        {
          intent: "Study the mechanism before touching it.",
          category: "observe",
          urgency: 0.8,
          groundedInState: true,
        },
        {
          intent: "Question the echo while it remains stable.",
          category: "social",
          urgency: 0.5,
          groundedInState: true,
        },
      ],
    },
    {
      narrative: "Fallback.",
      suggestions: ["continue"],
    },
  );

  expect(structured.sceneMemory).toEqual({
    locationLabel: "Vault Threshold",
    zoneLabel: "Glass Ward",
    immediateObjective: "Learn who opened the vault first.",
    presentEntities: ["Caretaker Echo"],
    activeThreats: ["Shifting ward"],
    unresolvedHooks: ["Missing key"],
    lastConsequence: "The inner seal unlocked.",
  });
  expect(structured.choiceMeta).toEqual([
    {
      intent: "Study the mechanism before touching it.",
      category: "observe",
      urgency: 0.8,
      groundedInState: true,
    },
    {
      intent: "Question the echo while it remains stable.",
      category: "social",
      urgency: 0.5,
      groundedInState: true,
    },
  ]);

  const malformed = normalizePayload(
    {
      narrative: "The path stays open for another heartbeat.",
      suggestions: ["continue"],
      sceneMemory: "invalid",
      choiceMeta: [{ category: "nonsense" }, "bad"],
    },
    {
      narrative: "Fallback.",
      suggestions: ["continue"],
    },
  );

  expect(malformed.sceneMemory).toBeUndefined();
  expect(malformed.choiceMeta).toBeUndefined();
}

describe("narration contract normalization", () => {
  it("supports legacy and structured payloads on the frontend", () => {
    runSharedContractAssertions(normalizeFrontendPayload);
  });

  it("supports legacy and structured payloads on the backend", () => {
    runSharedContractAssertions(normalizeBackendPayload);
  });
});
