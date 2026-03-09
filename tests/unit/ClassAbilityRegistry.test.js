import { describe, expect, it } from "@jest/globals";
import { DataRegistry } from "../../src/data/DataRegistry.js";
import {
  getClassAbilitiesFor,
  getClassAbilityById,
} from "../../src/systems/class/ClassAbilityRegistry.js";

describe("Class ability registry", () => {
  it("returns lattice-aware abilities for playable classes", () => {
    const playableClass = DataRegistry.getClasses()[0];
    expect(playableClass?.id).toBeTruthy();

    const abilities = getClassAbilitiesFor(playableClass.id);
    expect(Array.isArray(abilities)).toBe(true);
    expect(abilities.length).toBeGreaterThan(0);

    abilities.forEach((ability) => {
      expect(ability.ownerType).toBe("class");
      expect(ability.ownerId).toBe(playableClass.id);
      expect(ability.class).toBe(playableClass.id);
      expect(ability.lattice?.id).toBe(ability.id);
      expect(typeof ability.runtimeRole).toBe("string");
      expect(typeof ability.latticeFamily).toBe("string");
      expect(ability.grandmaVoidBoundaryId).toBe("grandma_void");
    });
  });

  it("keeps direct ability lookups lattice-aware", () => {
    const playableClass = DataRegistry.getClasses()[0];
    const firstAbility = getClassAbilitiesFor(playableClass.id)?.[0];
    expect(firstAbility?.id).toBeTruthy();

    const directLookup = getClassAbilityById(firstAbility.id);
    expect(directLookup?.id).toBe(firstAbility.id);
    expect(directLookup?.ownerType).toBe("class");
    expect(directLookup?.lattice?.id).toBe(firstAbility.id);
    expect(directLookup?.grandmaVoidBoundaryId).toBe("grandma_void");
  });
});
