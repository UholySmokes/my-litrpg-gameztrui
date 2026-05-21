import {
  ensureEssenceWeavingState,
  magicCompress,
  magicDraw,
  magicPurge,
  magicRefine,
  magicRelease,
  magicSense,
  magicWeave,
  processEssenceEcologyTurn,
} from "../packages/game-core/src/systems/magic/EssenceWeavingSystem.js";
import {SimBridge} from "../packages/game-core/src/simulation/bridge/SimulationContext.js";
import {INITIAL_CONFIG} from "../packages/game-core/src/data/initialState.js";

function makeBaseState() {
  return {
    config: INITIAL_CONFIG,
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

test("drawing in tainted ambient increases reserve taint", () => {
  const foggy = makeBaseState();
  foggy.world.location = { current: "undercity_wet_gate", biome: "undercity" };
  foggy.world.weather = { byBiome: { undercity: { type: "fog", intensity: 1, updatedTurn: 0 } } };
  const result = magicDraw(foggy, { type: "magic_draw", essence: "shadow", amount: 5 });
  const taint = result.state.player.magic.reservesTaint.shadow;
  expect(taint).toBeGreaterThan(0);
});

test("stored charges decay over turn-advancing ticks", () => {
  const base = makeBaseState();
  const hydrated = ensureEssenceWeavingState(base);
  const withReserve = {
    ...hydrated,
    player: {
      ...hydrated.player,
      magic: {
        ...hydrated.player.magic,
        reserves: { ...hydrated.player.magic.reserves, lightning: 10 },
      },
    },
  };
  const refined = magicRefine(withReserve, {
    type: "magic_refine",
    essence: "lightning",
    amount: 10,
    method: "steady",
  });
  const before = refined.state.player.magic.charges.at(-1).amount;

  const advanced = {
    ...refined.state,
    world: { ...refined.state.world, turnCount: (refined.state.world.turnCount || 0) + 10 },
  };
  const ticked = processEssenceEcologyTurn(advanced);
  const after = ticked.player.magic.charges.at(-1).amount;
  expect(after).toBeLessThan(before);
});

test("resonance increases after refine/compress/release", () => {
  const base = makeBaseState();
  const hydrated = ensureEssenceWeavingState(base);
  const withReserve = {
    ...hydrated,
    player: {
      ...hydrated.player,
      magic: {
        ...hydrated.player.magic,
        reserves: { ...hydrated.player.magic.reserves, lightning: 10, fire: 10, water: 10 },
      },
    },
  };

  const refined = magicRefine(withReserve, { type: "magic_refine", essence: "lightning", amount: 10, method: "steady" });
  const r1 = refined.state.player.magic.resonance.current;
  expect(r1).toBeGreaterThan(0);

  const compressed = magicCompress(refined.state, { type: "magic_compress", essence: "lightning", tier: 1, method: "steady" });
  const r2 = compressed.state.player.magic.resonance.current;
  expect(r2).toBeGreaterThan(r1);

  const prepped = magicWeave(compressed.state, { type: "magic_weave", essences: ["fire", "water"], pattern: "lattice" });
  const released = magicRelease(prepped.state);
  const r3 = released.state.player.magic.resonance.current;
  expect(r3).toBeGreaterThan(r2);
});

test("resonance decays over turns", () => {
  const base = makeBaseState();
  const hydrated = ensureEssenceWeavingState(base);
  const withResonance = {
    ...hydrated,
    player: {
      ...hydrated.player,
      magic: {
        ...hydrated.player.magic,
        resonance: { current: 50, max: 100, state: "ringing" },
      },
    },
    world: {
      ...hydrated.world,
      turnCount: 10,
    },
  };
  const ticked = processEssenceEcologyTurn(withResonance);
  expect(ticked.player.magic.resonance.current).toBeLessThan(50);
});

test("purge reduces taint on all channels", () => {
  const base = makeBaseState();
  const hydrated = ensureEssenceWeavingState(base);
  const withTaint = {
    ...hydrated,
    player: {
      ...hydrated.player,
      magic: {
        ...hydrated.player.magic,
        reservesTaint: {
          ...hydrated.player.magic.reservesTaint,
          fire: 0.5,
          shadow: 0.4,
        },
      },
    },
  };

  const purged = magicPurge(withTaint, { type: "magic_purge", essence: null, amount: 10 });
  expect(purged.ok).not.toBe(false);
  expect(purged.state.player.magic.reservesTaint.fire).toBeLessThan(0.5);
  expect(purged.state.player.magic.reservesTaint.shadow).toBeLessThan(0.4);
});

test("critical resonance triggers overload side effects", () => {
  SimBridge.initialize(1337);
  const base = makeBaseState();
  const hydrated = ensureEssenceWeavingState({
    ...base,
    player: {
      ...base.player,
      magic: {
        ...base.player.magic,
        reserves: { fire: 20 },
        reservesTaint: { fire: 0.2 },
        resonance: { current: 96, max: 100, state: "shrieking" },
      },
    },
  });

  const result = magicDraw(hydrated, { type: "magic_draw", essence: "fire", amount: 4 });
  expect(result.description.toLowerCase()).toContain("overload surge");
  expect(result.state.player.magic.overload?.count || 0).toBeGreaterThan(0);
});

test("sense reports overload risk labels", () => {
  const base = makeBaseState();
  const hydrated = ensureEssenceWeavingState({
    ...base,
    player: {
      ...base.player,
      magic: {
        ...base.player.magic,
        resonance: { current: 92, max: 100, state: "shrieking" },
      },
    },
  });

  const sensed = magicSense(hydrated, { type: "magic_sense", essence: "fire" });
  expect(sensed.description.toLowerCase()).toContain("overload risk");
});

test("owned perks can rank up via action training", () => {
  const base = makeBaseState();
  const hydrated = ensureEssenceWeavingState({
    ...base,
    player: {
      ...base.player,
      magic: {
        ...(base.player.magic || {}),
        perks: [{ id: "resonance_damping", rank: 1 }],
        perkProgress: {
          resonance_damping: { totalXp: 29 },
        },
      },
    },
  });

  const result = magicDraw(hydrated, { type: "magic_draw", essence: "fire", amount: 5 });
  const ranked = result.state.player.magic.perks.find(
    (perk) =>
      perk &&
      typeof perk === "object" &&
      !Array.isArray(perk) &&
      perk.id === "resonance_damping",
  );

  expect(ranked?.rank).toBe(2);
  expect(result.description).toContain("Mastery breakthrough");
});

test("training does not auto-unlock perks", () => {
  const base = ensureEssenceWeavingState(makeBaseState());
  const state = {
    ...base,
    player: {
      ...base.player,
      magic: {
        ...base.player.magic,
        perks: [],
        perkProgress: {},
      },
    },
  };

  const result = magicDraw(state, { type: "magic_draw", essence: "fire", amount: 5 });
  expect(result.state.player.magic.perks).toEqual([]);
  expect(result.state.player.magic.perkProgress?.resonance_damping).toBeUndefined();
});

test("layer B disabled blocks purge action", () => {
  const base = makeBaseState();
  const hydrated = ensureEssenceWeavingState({
    ...base,
    config: {
      magicRollout: { layerA: true, layerB: false, layerC: true, layerD: true },
    },
    player: {
      ...base.player,
      magic: {
        ...(base.player.magic || {}),
        reservesTaint: { fire: 0.5 },
      },
    },
  });

  const purged = magicPurge(hydrated, { type: "magic_purge", essence: "fire", amount: 8 });
  expect(purged.ok).toBe(false);
  expect(String(purged.reason || "").toLowerCase()).toContain("layer b");
});

test("layer C disabled prevents overload surges", () => {
  SimBridge.initialize(1337);
  const base = makeBaseState();
  const hydrated = ensureEssenceWeavingState({
    ...base,
    config: {
      magicRollout: { layerA: true, layerB: true, layerC: false, layerD: true },
    },
    player: {
      ...base.player,
      magic: {
        ...(base.player.magic || {}),
        reserves: { fire: 20 },
        resonance: { current: 96, max: 100, state: "shrieking" },
      },
    },
  });

  const result = magicDraw(hydrated, { type: "magic_draw", essence: "fire", amount: 4 });
  expect(result.description.toLowerCase()).not.toContain("overload surge");
  expect(result.state.player.magic.overload?.count || 0).toBe(0);
});

