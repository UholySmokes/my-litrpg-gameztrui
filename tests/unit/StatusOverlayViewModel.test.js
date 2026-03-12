import { describe, expect, it } from "@jest/globals";
import { DataRegistry } from "../../src/data/DataRegistry.js";
import { buildStatusOverlayViewModel } from "../../src/components/statusOverlay/statusOverlayViewModel.js";

describe("StatusOverlay view model", () => {
  it("builds talent, magic, and evolution summaries from stable runtime data", () => {
    const playerClass = DataRegistry.getClassById("warrior");
    const playerRace = DataRegistry.getRaceById("pure_human");
    const player = {
      name: "Cipher",
      level: 14,
      class: playerClass,
      race: { ...playerRace, evolutionStageIndex: 0 },
      talents: ["arcane_focus", "oathbound"],
      xp: { current: 220, max: 500 },
      hp: { current: 82, max: 120 },
      mana: { current: 30, max: 65 },
      attributes: {
        strength: 12,
        dexterity: 9,
        agility: 8,
        vitality: 11,
        intelligence: 10,
        wisdom: 9,
        willpower: 8,
        luck: 7,
        charisma: 6,
        soul: 5,
        freePoints: 3,
      },
      attributeInvestments: {
        strength: 2,
      },
      professions: {
        blacksmith: { xp: 120 },
      },
      magic: {
        resonance: { current: 14.2, max: 100, state: "steady" },
        reserves: { fire: 4.5, water: 1.5 },
        reservesTaint: { fire: 0.12 },
        charges: [{ essence: "fire", amount: 1.25 }],
        prepared: { kind: "weave", pattern: "lattice" },
        anchors: { self: true, area: false, itemId: "focus_stone" },
        unlockedPatterns: { shape: ["pulse", "shield"] },
        perks: ["stable_weaves"],
        perkProgress: {
          stable_weaves: { totalXp: 42, rank: 2 },
        },
      },
      progress: {
        totalKills: 18,
        classEvolutions: 0,
        raceEvolutionStage: 0,
      },
      abilities: [],
      inventory: [{ id: "minor_health_potion", name: "Minor Health Potion", quantity: 2 }],
      equipment: {
        weapon: {
          id: "iron_sword",
          name: "Iron Sword",
          stats: { attack: 10 },
        },
      },
      starterTrees: ["vanguard"],
      alignment: "lawful_neutral",
      archetypeSystem: { id: "warden", name: "Warden", category: "guardian" },
      skillLoadoutId: "class_core",
      perks: ["steady_hands"],
    };
    const world = {
      essence: {
        ambient: {
          global: {
            drawMultByEssence: { fire: 1.2, water: 0.95 },
          },
          compositionByEssence: { fire: 0.55, water: 0.2 },
          provenance: {
            timeOfDay: "dawn",
            weatherType: "clear",
            weatherIntensity: 0.2,
            anomalyIds: ["sunflare"],
            sourceIds: ["leyline_well"],
          },
        },
      },
    };

    const viewModel = buildStatusOverlayViewModel({
      player,
      world,
      config: { baseAttributeValue: 5 },
      interactionState: {},
    });

    expect(viewModel.summary.talentLabel).toContain("Arcane Focus");
    expect(viewModel.summary.talentLabel).toContain("Oathbound");
    expect(viewModel.magic.reserveRows[0]).toEqual(
      expect.objectContaining({
        essence: "fire",
      }),
    );
    expect(viewModel.magic.preparedLabel).toBe("weave:lattice");
    expect(viewModel.magic.ownedPerkIds).toEqual(["stable_weaves"]);
    expect(viewModel.progression.classEvolutionOptions.length).toBeGreaterThan(0);
    expect(viewModel.progression.classEvolutionOptions[0]).toEqual(
      expect.objectContaining({
        requirementText: expect.any(String),
        unlocked: expect.any(Boolean),
      }),
    );
  });

  it("returns safe empty collections when optional slices are missing", () => {
    const viewModel = buildStatusOverlayViewModel({
      player: {
        name: "Minimal",
        class: null,
        race: null,
        attributes: {},
      },
      world: null,
      config: null,
      interactionState: {
        fusionSkillA: "",
        fusionSkillB: "",
        studySkillId: "",
      },
    });

    expect(Array.isArray(viewModel.attributes.attributeEntries)).toBe(true);
    expect(viewModel.magic.reserveRows).toEqual([]);
    expect(viewModel.progression.classEvolutionOptions).toEqual([]);
    expect(viewModel.collections.inventoryList).toEqual([]);
  });
});
