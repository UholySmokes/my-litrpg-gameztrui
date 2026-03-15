import { describe, expect, it } from "@jest/globals";
import {
  getPlayerArchetypeSystemId,
  getPlayerArchetypeSystemLabel,
  resolvePlayerArchetypeSystem,
} from "../../packages/game-core/src/systems/archetype/resolvePlayerArchetypeSystem.js";

describe("resolvePlayerArchetypeSystem", () => {
  it("resolves canonical system data from the runtime archetypeSystem id", () => {
    const archetypeSystem = resolvePlayerArchetypeSystem({
      archetypeSystem: "revival_archive",
    });

    expect(archetypeSystem).toEqual(
      expect.objectContaining({
        id: "revival_archive",
        name: "Revival Archive",
        category: "System",
      }),
    );
  });

  it("preserves runtime overrides while enriching from the registry", () => {
    const archetypeSystem = resolvePlayerArchetypeSystem({
      archetypeSystem: {
        id: "revival_archive",
        name: "Archive Override",
        summary: "Runtime summary.",
      },
    });

    expect(archetypeSystem).toEqual(
      expect.objectContaining({
        id: "revival_archive",
        name: "Archive Override",
        category: "System",
        summary: "Runtime summary.",
      }),
    );
    expect(getPlayerArchetypeSystemId({ archetypeSystem })).toBe("revival_archive");
    expect(getPlayerArchetypeSystemLabel({ archetypeSystem })).toBe("Archive Override");
  });
});
