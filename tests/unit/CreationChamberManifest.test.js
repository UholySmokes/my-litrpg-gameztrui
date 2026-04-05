import { describe, expect, it } from "@jest/globals";
import {
  buildCreationChamberManifest,
  validateCreationChamber,
} from "../../src/ui/modes/creationChamberManifest.js";

describe("creation chamber manifest", () => {
  it("omits advanced-only steps in basic mode", () => {
    const chambers = buildCreationChamberManifest(false);

    expect(chambers.find((chamber) => chamber.id === "doctrine-forge").includedSteps).toEqual([
      "class",
      "profession",
    ]);
    expect(chambers.find((chamber) => chamber.id === "soul-crucible").includedSteps).toEqual([
      "attributes",
      "skills",
      "perks",
      "alignment",
    ]);
  });

  it("keeps advanced-only steps in advanced mode", () => {
    const chambers = buildCreationChamberManifest(true);

    expect(chambers.find((chamber) => chamber.id === "doctrine-forge").includedSteps).toEqual([
      "class",
      "multiclass",
      "profession",
    ]);
    expect(chambers.find((chamber) => chamber.id === "soul-crucible").includedSteps).toEqual([
      "attributes",
      "skills",
      "perks",
      "starter-tree",
      "alignment",
    ]);
  });

  it("gates chamber progression on unresolved selections", () => {
    expect(
      validateCreationChamber("binding-hall", {
        hasName: true,
        hasSystem: false,
      }),
    ).toEqual({
      valid: false,
      error: "Bind a governing system to proceed. Your designation is set.",
    });

    expect(
      validateCreationChamber("soul-crucible", {
        attributesLocked: true,
        skillsLocked: true,
        perksLocked: true,
        starterTreeLocked: true,
        alignmentLocked: false,
      }),
    ).toEqual({
      valid: false,
      error: "Choose an alignment to complete the Soul Crucible.",
    });
  });
});
