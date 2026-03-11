import { executeAction } from "../packages/game-core/src/core/ActionDispatcher.js";
import { initialGameState } from "../packages/game-core/src/data/initialState.js";

function tally(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function parseOutcomeTag(description) {
  const m = String(description || "").match(/\((clean success|strained success|partial misfire|backlash)\)\s*$/i);
  return m ? m[1].toLowerCase() : "unknown";
}

function runScenario({ biome, weatherType, weatherIntensity, iterations }) {
  let state = {
    ...initialGameState,
    world: {
      ...initialGameState.world,
      turnCount: 0,
      location: { current: "starting_zone", biome },
      weather: { byBiome: { [biome]: { type: weatherType, intensity: weatherIntensity, updatedTurn: 0 } } },
    },
    player: {
      ...initialGameState.player,
      hp: { current: 100, max: 100 },
      mana: { current: 200, max: 200 },
      magic: {
        mana: { current: 200, max: 200 },
        reserves: { fire: 80, water: 80, air: 80, lightning: 80 },
        perks: [],
      },
    },
    combat: { status: "inactive" },
  };

  const outcomes = new Map();
  for (let i = 0; i < iterations; i += 1) {
    state = executeAction(state, { type: "magic_refine", essence: "fire", method: "steady", amount: 10 }).state;
    state = executeAction(state, { type: "magic_compress", essence: "fire", tier: 2, method: "steady" }).state;
    state = executeAction(state, { type: "magic_weave", essences: ["fire", "air"], pattern: "spiral" }).state;
    const res = executeAction(state, { type: "magic_release" });
    state = res.state;
    tally(outcomes, parseOutcomeTag(res.description));
  }

  return {
    biome,
    weatherType,
    weatherIntensity,
    resonance: state.player.magic.resonance,
    outcomes: Object.fromEntries(outcomes.entries()),
  };
}

const scenarios = [
  { biome: "coast", weatherType: "storm", weatherIntensity: 1, iterations: 200 },
  { biome: "city", weatherType: "clear", weatherIntensity: 0.3, iterations: 200 },
  { biome: "volcanic", weatherType: "drought", weatherIntensity: 1, iterations: 200 },
];

const results = scenarios.map(runScenario);
console.log(JSON.stringify(results, null, 2));

