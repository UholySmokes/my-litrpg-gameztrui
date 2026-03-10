import { describe, it, expect, beforeEach, beforeAll, afterAll, jest } from "@jest/globals";
import { SimBridge } from "../packages/game-core/src/simulation/bridge/SimulationContext.js";
import { initialGameState } from "../packages/game-core/src/data/initialState.js";
import {
  ensureEssenceWeavingState,
  magicRefine,
  magicCompress,
} from "../packages/game-core/src/systems/magic/EssenceWeavingSystem.js";

function parseOutcomeTag(description) {
  const m = String(description || "").match(/\((clean success|strained success|partial misfire|backlash)\)\s*$/i);
  return m ? m[1].toLowerCase() : "unknown";
}

function baseState({ biome, weatherType = "clear", weatherIntensity = 0.3, timeOfDay = "day" } = {}) {
  return ensureEssenceWeavingState({
    ...initialGameState,
    world: {
      ...initialGameState.world,
      turnCount: 0,
      location: { current: "starting_zone", biome },
      time: { currentTime: 480, timeOfDay, isOutdoors: true, lastUpdate: 0 },
      weather: { byBiome: { [biome]: { type: weatherType, intensity: weatherIntensity, updatedTurn: 0 } } },
    },
    player: {
      ...initialGameState.player,
      magic: {
        ...(initialGameState.player.magic || {}),
        mana: { current: 200, max: 200 },
        reserves: { fire: 200, water: 200, earth: 200, air: 200, lightning: 200 },
      },
    },
    combat: { status: "inactive" },
  });
}

describe("Essence ecology scenario checks", () => {
  let logSpy;

  beforeAll(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterAll(() => {
    if (logSpy) logSpy.mockRestore();
  });

  beforeEach(() => {
    SimBridge.initialize(1337);
  });

  it("keeps off-biome viable via clamps and dominant advantage", () => {
    const state = baseState({ biome: "ruins", weatherType: "clear", timeOfDay: "day" });
    const ambient = state.world.essence.ambient;

    expect(ambient.global.drawMultByEssence.lightning).toBeGreaterThan(
      ambient.global.drawMultByEssence.shadow,
    );

    const allDraw = Object.values(ambient.global.drawMultByEssence);
    expect(Math.min(...allDraw)).toBeGreaterThanOrEqual(0.9);
    expect(Math.max(...allDraw)).toBeLessThanOrEqual(1.2);
  });

  it("time/weather nudges do not overpower biome identity", () => {
    const ruinsDay = baseState({ biome: "ruins", weatherType: "clear", timeOfDay: "day" });
    const ruinsDuskStorm = baseState({ biome: "ruins", weatherType: "storm", weatherIntensity: 1, timeOfDay: "dusk" });

    const dayDominant = ruinsDay.world.essence.ambient.global.drawMultByEssence.lightning;
    const duskShadow = ruinsDuskStorm.world.essence.ambient.global.drawMultByEssence.shadow;

    expect(dayDominant).toBeGreaterThanOrEqual(1.15);
    expect(duskShadow).toBeLessThan(dayDominant);
    expect(duskShadow).toBeGreaterThanOrEqual(0.9);
    expect(duskShadow).toBeLessThanOrEqual(1.2);
  });

  it("contamination reduces refine purity; clean_refining mitigates", () => {
    const clean = baseState({ biome: "coast", weatherType: "clear", weatherIntensity: 0.2, timeOfDay: "day" });
    const tainted = {
      ...clean,
      player: {
        ...clean.player,
        magic: {
          ...clean.player.magic,
          reservesTaint: { ...(clean.player.magic.reservesTaint || {}), fire: 1 },
        },
      },
    };

    const refinedClean = magicRefine(clean, { type: "magic_refine", essence: "fire", amount: 20, method: "steady" });
    const refinedTainted = magicRefine(tainted, { type: "magic_refine", essence: "fire", amount: 20, method: "steady" });

    const purityClean =
      refinedClean.state.player.magic.charges[
        refinedClean.state.player.magic.charges.length - 1
      ].purity;
    const purityTainted =
      refinedTainted.state.player.magic.charges[
        refinedTainted.state.player.magic.charges.length - 1
      ].purity;
    expect(purityTainted).toBeLessThan(purityClean);

    const withPerk = {
      ...tainted,
      player: {
        ...tainted.player,
        magic: {
          ...tainted.player.magic,
          perks: [{ id: "clean_refining", rank: 2 }],
        },
      },
    };
    const refinedPerk = magicRefine(withPerk, { type: "magic_refine", essence: "fire", amount: 20, method: "steady" });
    const purityPerk =
      refinedPerk.state.player.magic.charges[
        refinedPerk.state.player.magic.charges.length - 1
      ].purity;
    expect(purityPerk).toBeGreaterThan(purityTainted);
  });

  it("taint increases compression misfire frequency; safer_compression reduces it", () => {
    const iterations = 140;

    const runTrial = ({ seed, biome, weatherType, weatherIntensity, timeOfDay, taint, resonance, perks }) => {
      SimBridge.initialize(seed);
      const base = baseState({ biome, weatherType, weatherIntensity, timeOfDay });
      const s = {
        ...base,
        player: {
          ...base.player,
          magic: {
            ...base.player.magic,
            ...(taint != null ? { reservesTaint: { ...(base.player.magic.reservesTaint || {}), fire: taint } } : {}),
            ...(resonance != null ? { resonance: { current: resonance, max: 100, state: resonance >= 50 ? "ringing" : "humming" } } : {}),
            ...(perks ? { perks } : {}),
          },
        },
      };
      const refined = magicRefine(s, { type: "magic_refine", essence: "fire", amount: 10, method: "steady" });
      const compressed = magicCompress(refined.state, { type: "magic_compress", essence: "fire", tier: 2, method: "steady" });
      const tag = parseOutcomeTag(compressed.description);
      return tag === "partial misfire" || tag === "backlash";
    };

    let lowCount = 0;
    let highCount = 0;
    let saferCount = 0;

    for (let i = 0; i < iterations; i += 1) {
      const seed = 9000 + i;
      if (
        runTrial({
          seed,
          biome: "coast",
          weatherType: "clear",
          weatherIntensity: 0.1,
          timeOfDay: "day",
          taint: 0,
          resonance: 0,
        })
      ) {
        lowCount += 1;
      }

      const highMisfire = runTrial({
        seed,
        biome: "undercity",
        weatherType: "fog",
        weatherIntensity: 1,
        timeOfDay: "night",
        taint: 1,
        resonance: 70,
      });
      if (highMisfire) highCount += 1;

      const saferMisfire = runTrial({
        seed,
        biome: "undercity",
        weatherType: "fog",
        weatherIntensity: 1,
        timeOfDay: "night",
        taint: 1,
        resonance: 70,
        perks: [{ id: "safer_compression", rank: 2 }],
      });
      if (saferMisfire) saferCount += 1;
    }

    expect(highCount).toBeGreaterThan(lowCount);
    expect(saferCount).toBeLessThanOrEqual(highCount);
  });
});
