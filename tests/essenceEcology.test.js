import { magicDraw, magicRefine, ensureEssenceWeavingState } from "../packages/game-core/src/systems/magic/EssenceWeavingSystem.js";

function makeBaseState() {
  return {
    player: {
      name: "Tester",
      hp: { current: 10, max: 10 },
      mana: { current: 0, max: 0 },
      magic: {
        mana: { max: 50 },
      },
    },
    world: {
      location: { current: "ruins_leyline_plaza", biome: "ruins" },
      time: { currentTime: 480, timeOfDay: "day", isOutdoors: true, lastUpdate: 0 },
      weather: { byBiome: { ruins: { type: "clear", intensity: 0, updatedTurn: 0 } } },
      turnCount: 0,
    },
  };
}

test("storm weather increases draw via density", () => {
  const base = makeBaseState();
  const clearResult = magicDraw(base, { type: "magic_draw", essence: "lightning" });
  const clearState = clearResult.state;
  const clearReserves = clearState.player.magic.reserves.lightning;

  const storm = makeBaseState();
  storm.world.weather.byBiome.ruins = { type: "storm", intensity: 1, updatedTurn: 0 };
  const stormResult = magicDraw(storm, { type: "magic_draw", essence: "lightning" });
  const stormState = stormResult.state;
  const stormReserves = stormState.player.magic.reserves.lightning;

  expect(stormReserves).toBeGreaterThan(clearReserves);
  expect(stormReserves / clearReserves).toBeGreaterThan(1.5);
});

test("anomaly affects refine purity through taint", () => {
  const base = makeBaseState();
  const hydrated = ensureEssenceWeavingState(base);
  const withReserve = {
    ...hydrated,
    player: {
      ...hydrated.player,
      magic: {
        ...hydrated.player.magic,
        reserves: { ...hydrated.player.magic.reserves, shadow: 10 },
      },
    },
  };

  const clean = magicRefine(withReserve, { type: "magic_refine", essence: "shadow", amount: 10, method: "steady" });
  const cleanPurity = clean.state.player.magic.charges.at(-1).purity;

  const tainted = makeBaseState();
  tainted.world.location = { current: "undercity_wet_gate", biome: "undercity" };
  tainted.world.weather = { byBiome: { undercity: { type: "fog", intensity: 1, updatedTurn: 0 } } };
  tainted.world.essence = {
    anomalies: {
      instances: [
        {
          id: "veil_sink",
          biomeId: "undercity",
          locationId: "undercity_wet_gate",
          nextDriftTurn: 999,
        },
      ],
    },
  };
  const taintedHydrated = ensureEssenceWeavingState(tainted);
  const taintedWithReserve = {
    ...taintedHydrated,
    player: {
      ...taintedHydrated.player,
      magic: {
        ...taintedHydrated.player.magic,
        reserves: { ...taintedHydrated.player.magic.reserves, shadow: 10 },
      },
    },
  };
  const taintedResult = magicRefine(taintedWithReserve, { type: "magic_refine", essence: "shadow", amount: 10, method: "steady" });
  const taintedPurity = taintedResult.state.player.magic.charges.at(-1).purity;

  expect(taintedPurity).toBeLessThan(cleanPurity);
});

