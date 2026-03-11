import { describe, expect, it } from "@jest/globals";
import { DataRegistry } from "../../src/data/DataRegistry.js";
import {
  buildCharacterCreationDerivedState,
  buildCharacterCreationSkillPools,
} from "../../src/hook/useCharacterCreationReworked.js";

describe("character creation skill pools", () => {
  it("includes class-linked skills for every class option", () => {
    const classes = DataRegistry.getClasses();
    expect(classes.length).toBeGreaterThan(0);

    for (const cls of classes) {
      const pools = buildCharacterCreationSkillPools(cls, null);
      const allEntries = [...pools.active, ...pools.passive];
      const classEntries = allEntries.filter((entry) => entry?.source === "class");
      expect(classEntries.length).toBeGreaterThan(0);
      classEntries.forEach((entry) => {
        expect(typeof entry.id).toBe("string");
        expect(entry.id.trim().length).toBeGreaterThan(0);
        expect(typeof entry.name).toBe("string");
        expect(entry.name.trim().length).toBeGreaterThan(0);
        expect(typeof entry.description).toBe("string");
        expect(entry.description.trim().length).toBeGreaterThan(0);
      });
    }
  });

  it("includes race-linked active and passive entries for every race option", () => {
    const races = DataRegistry.getRaces();
    const anchorClass = DataRegistry.getClassById("warrior") || DataRegistry.getClasses()[0];
    expect(anchorClass).toBeTruthy();
    expect(races.length).toBeGreaterThan(0);

    for (const race of races) {
      const pools = buildCharacterCreationSkillPools(anchorClass, race);
      const raceActiveEntries = pools.active.filter((entry) => entry?.source === "race");
      const racePassiveEntries = pools.passive.filter((entry) => entry?.source === "race");

      expect(raceActiveEntries.length).toBeGreaterThan(0);
      expect(racePassiveEntries.length).toBeGreaterThan(0);

      [...raceActiveEntries, ...racePassiveEntries].forEach((entry) => {
        expect(typeof entry.id).toBe("string");
        expect(entry.id.trim().length).toBeGreaterThan(0);
        expect(typeof entry.name).toBe("string");
        expect(entry.name.trim().length).toBeGreaterThan(0);
        expect(typeof entry.description).toBe("string");
        expect(entry.description.trim().length).toBeGreaterThan(0);
      });
    }
  });

  it("builds finalized creation stats with race, class, and origin bonuses", () => {
    const warrior = DataRegistry.getClassById("warrior");
    const human = DataRegistry.getRaceById("pure_human") || DataRegistry.getRaces()[0];
    const origin = DataRegistry.getOriginById("ashmarked_prospector");
    const base = buildCharacterCreationDerivedState({
      attributePoints: {
        strength: 5,
        agility: 5,
        dexterity: 5,
        vitality: 5,
        intelligence: 5,
        wisdom: 5,
        charisma: 5,
        willpower: 5,
        luck: 5,
        soul: 5,
      },
    });

    const derived = buildCharacterCreationDerivedState({
      attributePoints: {
        strength: 5,
        agility: 5,
        dexterity: 5,
        vitality: 5,
        intelligence: 5,
        wisdom: 5,
        charisma: 5,
        willpower: 5,
        luck: 5,
        soul: 5,
      },
      selectedRace: human,
      selectedClass: warrior,
      selectedOrigin: origin,
    });

    expect(derived.attributes.strength).toBeGreaterThan(base.attributes.strength);
    expect(derived.attributes.vitality).toBeGreaterThan(base.attributes.vitality);
    expect(derived.attributes.charisma).toBeGreaterThanOrEqual(base.attributes.charisma);
    expect(derived.hp.current).toBe(derived.hp.max);
    expect(derived.mana.current).toBe(derived.mana.max);
  });
});
