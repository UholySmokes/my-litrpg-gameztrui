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
      archetypeSystem: "revival_archive",
      resources: {
        echo_credits: 37,
      },
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
    expect(viewModel.summary.talents).toHaveLength(2);
    expect(viewModel.summary.talents[0]).toEqual(
      expect.objectContaining({ id: "arcane_focus", name: "Arcane Focus" }),
    );
    expect(viewModel.summary.talents[1]).toEqual(
      expect.objectContaining({ id: "oathbound", name: "Oathbound" }),
    );
    expect(viewModel.summary.talents[0].description).toBeTruthy();
    expect(viewModel.magic.reserveRows[0]).toEqual(
      expect.objectContaining({
        essence: "fire",
      }),
    );
    expect(viewModel.magic.preparedLabel).toBe("weave:lattice");
    expect(viewModel.magic.ownedPerkIds).toEqual(["stable_weaves"]);
    expect(viewModel.summary.archetypeSystem).toEqual(
      expect.objectContaining({
        id: "revival_archive",
        name: "Revival Archive",
        category: "System",
      }),
    );
    expect(viewModel.summary.archetypeSystem.resource).toEqual(
      expect.objectContaining({
        name: "Echo Credits",
        current: 37,
        max: 100,
      }),
    );
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

  it("builds prestige summaries and upgrade affordances from player state", () => {
    const viewModel = buildStatusOverlayViewModel({
      player: {
        name: "Ascendant",
        level: 55,
        class: null,
        race: null,
        attributes: {},
        prestige: {
          prestigeLevel: 2,
          soulShards: 34,
          xpMultiplier: 1.2,
          upgrades: {
            damage: 1,
            gold: 0,
            mana: 2,
            health: 0,
          },
        },
        progress: {
          prestigeHistory: [
            { atLevel: 50, prestigeLevel: 1, shardsEarned: 3 },
            { atLevel: 54, prestigeLevel: 2, shardsEarned: 3 },
          ],
        },
      },
      world: null,
      config: null,
      interactionState: {},
    });

    expect(viewModel.summary.prestigeLevel).toBe(2);
    expect(viewModel.summary.prestigeSoulShards).toBe(34);
    expect(viewModel.progression.prestige).toEqual(
      expect.objectContaining({
        canPrestige: true,
        shardPreview: expect.any(Number),
        soulShards: 34,
      }),
    );
    expect(viewModel.progression.prestige.upgradeRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "damage",
          level: 1,
          nextCost: 20,
          canAfford: true,
        }),
        expect.objectContaining({
          type: "mana",
          level: 2,
          nextCost: 30,
          canAfford: true,
        }),
      ]),
    );
    expect(viewModel.progression.prestige.history[0]).toEqual(
      expect.objectContaining({
        prestigeLevel: 2,
        atLevel: 54,
        shardsEarned: 3,
      }),
    );
  });
});
