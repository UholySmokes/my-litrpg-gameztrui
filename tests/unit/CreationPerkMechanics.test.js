import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { SimBridge } from "@voidverse/game-core/simulation/bridge/SimulationContext.js";
import { addXp } from "@voidverse/game-core/systems/leveling/LevelingManager.js";
import { applyQuestRewards } from "@voidverse/game-core/systems/quest/QuestRewards.js";
import { executeAction } from "@voidverse/game-core/core/ActionDispatcher.js";
import { calculateDamage } from "@voidverse/game-core/systems/combat/combatResolution.js";
import { getDodgeChance } from "@voidverse/game-core/systems/combat/combatPreparation.js";
import { applyEffect } from "@voidverse/game-core/systems/effects/EffectSystem.js";
import { handleEnemyDefeatPhase } from "@voidverse/game-core/systems/combat/combatAftermath.js";
import { moveToLocation } from "@voidverse/game-core/systems/exploration/ExplorationSystem.js";
import { magicRelease, magicSense } from "@voidverse/game-core/systems/magic/EssenceWeavingSystem.js";
import { getLocationSummaries } from "@voidverse/game-core/world/WorldDataRegistry.js";

const LOCATION_IDS = getLocationSummaries()
  .map((entry) => entry?.id)
  .filter(Boolean)
  .map((id) => String(id))
  .sort();
const DEFAULT_LOCATION_ID = LOCATION_IDS[0] || "starting_zone";
const ALT_LOCATION_ID =
  LOCATION_IDS.find((id) => id !== DEFAULT_LOCATION_ID) || DEFAULT_LOCATION_ID;

function makeBaseState({ perks = [] } = {}) {
  return {
    config: { maxLevel: 99 },
    player: {
      name: "Hero",
      level: 1,
      perks,
      xp: { current: 0, max: 100 },
      hp: { current: 100, max: 100 },
      mana: { current: 50, max: 50 },
      attributes: { freePoints: 0 },
      inventory: [],
      equipment: {},
      titles: [],
      unlockedTitles: [],
      progress: { totalGoldEarned: 0, totalKills: 0, killsByEnemyId: {} },
      magic: {
        reserves: {},
        reservesTaint: {},
        charges: [],
        stability: {
          body: { current: 100, max: 100 },
          mind: { current: 100, max: 100 },
          cognitive: { current: 100, max: 100 },
        },
        resonance: { current: 0, max: 100, state: "calm" },
        anchors: { self: null, area: null, itemId: null },
      },
    },
    quests: { active: [], completed: [] },
    world: {
      id: "world1",
      location: {
        current: DEFAULT_LOCATION_ID,
        visited: [DEFAULT_LOCATION_ID],
        unlockedAreas: [DEFAULT_LOCATION_ID, ALT_LOCATION_ID],
        biome: "city",
      },
      flags: {},
      vars: {},
      counters: {},
      factionReputation: {},
      time: { currentTime: 480, timeOfDay: "day", isOutdoors: true, lastUpdate: 0 },
      turnCount: 0,
      weather: { byBiome: { city: { type: "clear", intensity: 0.3, updatedTurn: 0 } } },
    },
    combat: { status: "inactive", turn: "player", enemies: [], log: [] },
  };
}

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
  SimBridge.deactivate();
});

describe("creation perk mechanics", () => {
  it("applies quick_learner (+5% XP) inside addXp and still levels up correctly", () => {
    const state = makeBaseState({ perks: ["quick_learner"] });
    const next = addXp(state, 10);
    expect(next.player.xp.current).toBe(11);

    const nearLevel = {
      ...state,
      player: { ...state.player, xp: { current: 95, max: 100 } },
    };
    const leveled = addXp(nearLevel, 5);
    expect(leveled.player.level).toBe(2);
    expect(leveled.player.xp.current).toBe(1);
  });

  it("routes quest XP through addXp (quick_learner applies and level-ups occur)", () => {
    const state = makeBaseState({ perks: ["quick_learner"] });
    const nearLevel = {
      ...state,
      player: { ...state.player, xp: { current: 95, max: 100 } },
    };
    const next = applyQuestRewards(nearLevel, { xp: 5 });
    expect(next.player.level).toBe(2);
    expect(next.player.xp.current).toBe(1);
    expect(next.player.justLeveledUp).toBe(true);
  });

  it("applies scavenger (+10% gold) to quest rewards", () => {
    const state = makeBaseState({ perks: ["scavenger"] });
    const next = applyQuestRewards(state, { gold: 10 });
    expect(next.player.currency.goldCoins).toBe(11);
    expect(next.player.progress.totalGoldEarned).toBe(11);
  });

  it("applies scavenger (+10% gold) to combat drops", () => {
    const base = makeBaseState({ perks: [] });
    const enemy = {
      id: "enemy_1",
      name: "Test Enemy",
      level: 1,
      dropTable: [],
      goldReward: 10,
      xpReward: 0,
      stats: { hp: { current: 0, max: 1 } },
    };
    const withoutPerk = handleEnemyDefeatPhase(
      { ...base, combat: { ...base.combat, status: "active", enemies: [enemy], log: [] } },
      0,
    );
    expect(withoutPerk.player.currency.goldCoins).toBe(10);

    const withPerkState = makeBaseState({ perks: ["scavenger"] });
    const withPerk = handleEnemyDefeatPhase(
      { ...withPerkState, combat: { ...withPerkState.combat, status: "active", enemies: [enemy], log: [] } },
      0,
    );
    expect(withPerk.player.currency.goldCoins).toBe(11);
  });

  it("applies iron_stomach (+10% consumable potency) to use_item heal and mana", () => {
    const baselineState = makeBaseState({ perks: [] });
    const perkState = makeBaseState({ perks: ["iron_stomach"] });

    const baselineHeal = executeAction(
      {
        ...baselineState,
        combat: { ...baselineState.combat, status: "active", turn: "enemy" },
        player: {
          ...baselineState.player,
          hp: { current: 50, max: 100 },
          inventory: [{ id: "minor_health_potion", quantity: 1 }],
        },
      },
      { type: "use_item", itemId: "minor_health_potion" },
    );
    const perkHeal = executeAction(
      {
        ...perkState,
        combat: { ...perkState.combat, status: "active", turn: "enemy" },
        player: {
          ...perkState.player,
          hp: { current: 50, max: 100 },
          inventory: [{ id: "minor_health_potion", quantity: 1 }],
        },
      },
      { type: "use_item", itemId: "minor_health_potion" },
    );
    expect(baselineHeal.success).toBe(true);
    expect(perkHeal.success).toBe(true);
    expect(perkHeal.state.player.hp.current - baselineHeal.state.player.hp.current).toBe(3);

    const baselineMana = executeAction(
      {
        ...baselineState,
        combat: { ...baselineState.combat, status: "active", turn: "enemy" },
        player: {
          ...baselineState.player,
          mana: { current: 0, max: 100 },
          inventory: [{ id: "mana_potion", quantity: 1 }],
        },
      },
      { type: "use_item", itemId: "mana_potion" },
    );
    const perkMana = executeAction(
      {
        ...perkState,
        combat: { ...perkState.combat, status: "active", turn: "enemy" },
        player: {
          ...perkState.player,
          mana: { current: 0, max: 100 },
          inventory: [{ id: "mana_potion", quantity: 1 }],
        },
      },
      { type: "use_item", itemId: "mana_potion" },
    );
    expect(baselineMana.success).toBe(true);
    expect(perkMana.success).toBe(true);
    expect(perkMana.state.player.mana.current - baselineMana.state.player.mana.current).toBe(5);
  });

  it("applies battle_focus (+5% damage) only when above 80% HP", () => {
    const defender = { name: "Dummy", stats: { strength: 0 }, defense: 0, hp: { current: 100, max: 100 } };
    const attackerBase = {
      name: "Hero",
      perks: ["battle_focus"],
      stats: { strength: 10, intelligence: 10, luck: 0 },
      hp: { current: 80, max: 100 },
    };

    const baseline = calculateDamage(attackerBase, defender).damage;
    const boosted = calculateDamage({ ...attackerBase, hp: { current: 81, max: 100 } }, defender).damage;
    expect(boosted).toBe(Math.floor(baseline * 1.05));
  });

  it("applies cautious (+5% dodge) only when below 30% HP", () => {
    const entity = { perks: ["cautious"], hp: { current: 29, max: 100 }, effects: [] };
    expect(getDodgeChance(entity)).toBe(0.05);

    const atThreshold = { ...entity, hp: { current: 30, max: 100 } };
    expect(getDodgeChance(atThreshold)).toBe(0);
  });

  it("applies sturdy_grip to control effects (negate or shorten) deterministically", () => {
    SimBridge.initialize(1);
    const sturdy = { name: "Hero", perks: ["sturdy_grip"], effects: [] };
    const resisted = applyEffect(sturdy, "stun");
    expect(resisted.effects.length).toBe(0);

    SimBridge.initialize(4096);
    const applied = applyEffect(sturdy, "root");
    expect(applied.effects.length).toBe(1);
    expect(applied.effects[0].id).toBe("root");
    expect(applied.effects[0].remainingDuration).toBe(2);
  });

  it("captures arcane_sense traces on travel and surfaces them in magic_sense output", () => {
    const state = makeBaseState({ perks: ["arcane_sense"] });
    expect(ALT_LOCATION_ID).not.toBe(DEFAULT_LOCATION_ID);
    const moved = moveToLocation(state, ALT_LOCATION_ID);
    expect(moved.world.vars.arcaneTrace).toBeTruthy();
    expect(moved.world.vars.arcaneTrace.summary).toContain("Arcane traces");

    const sensed = magicSense(moved, {});
    expect(sensed.description).toContain("Arcane traces");
  });

  it("uses ritualist to catch a failed weave into a strained success", () => {
    // Deterministic seed that triggers the 15% ritual catch branch for this prepared weave.
    SimBridge.initialize(6);
    const state = makeBaseState({ perks: ["ritualist"] });
    const prepared = {
      kind: "weave",
      essences: ["light", "shadow", "air", "earth"],
      pattern: "vortex",
      unfamiliar: true,
    };
    const primed = {
      ...state,
      player: {
        ...state.player,
        magic: {
          ...state.player.magic,
          prepared,
          reserves: { light: 5, shadow: 5, air: 5, earth: 5 },
          resonance: { current: 100, max: 100, state: "humming" },
          stability: {
            body: { current: 100, max: 100 },
            mind: { current: 0, max: 100 },
            cognitive: { current: 0, max: 100 },
          },
        },
      },
    };

    const result = magicRelease(primed);
    expect(result.description).toContain("ritualist save");
  });
});
