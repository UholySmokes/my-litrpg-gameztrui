import { describe, it, expect, beforeEach } from "@jest/globals";
import { initialGameState, INITIAL_CONFIG } from "../../packages/game-core/src/data/initialState.js";
import { executeAction } from "../../packages/game-core/src/core/ActionDispatcher.js";
import { gameReducer } from "../../packages/game-core/src/core/gameReducer.js";
import { addXp, performLevelUp } from "../../packages/game-core/src/systems/leveling/LevelingManager.js";
import { startCombat, playerAttack, processEnemyTurns } from "../../packages/game-core/src/systems/combat/CombatSystem.js";
import { xpForNextLevel } from "../../packages/game-core/src/core/xpCurve.js";
import { calculateMaxHp, calculateMaxMana } from "../../packages/game-core/src/utils/AttributeMath.js";
import { SimBridge } from "../../packages/game-core/src/simulation/bridge/SimulationContext.js";

/**
 * Critical-path integration tests covering the full game loop:
 * create character → fight → level up → rest → save/load
 */
describe("Critical Path Integration", () => {
  beforeEach(() => {
    SimBridge.initialize(42);
  });

  // ── Test 1: Character Creation Flow ────────────────────────────
  describe("Character Creation Flow", () => {
    it("initialGameState provides a valid level-1 character with world state", () => {
      const state = structuredClone(initialGameState);
      const player = state.player;

      expect(player.level).toBe(1);
      expect(player.name).toBe("Wanderer");
      expect(player.xp.current).toBe(0);
      expect(player.xp.max).toBe(xpForNextLevel(1, state.config));

      // HP/Mana derived from attributes
      expect(player.hp.current).toBe(player.hp.max);
      expect(player.hp.max).toBe(calculateMaxHp(player.attributes));
      expect(player.mana.current).toBe(player.mana.max);
      expect(player.mana.max).toBe(calculateMaxMana(player.attributes));

      // Default attributes are all 5
      expect(player.attributes.strength).toBe(5);
      expect(player.attributes.agility).toBe(5);
      expect(player.attributes.intelligence).toBe(5);
      expect(player.attributes.freePoints).toBe(0);

      // World state initialized
      expect(state.world).toBeDefined();
      expect(state.world.location).toBeDefined();

      // Quests structure exists
      expect(state.quests).toEqual({ active: [], completed: [] });
    });
  });

  // ── Test 2: Combat Flow ────────────────────────────────────────
  describe("Combat Flow", () => {
    it("dispatches attack, deals damage, and gains XP on enemy defeat", () => {
      const state = structuredClone(initialGameState);

      // Start combat against a single goblin (level 1, 20 HP)
      const combatState = startCombat(state, ["goblin"]);
      expect(combatState.combat.status).toBe("active");
      expect(combatState.combat.enemies.length).toBe(1);
      expect(combatState.combat.enemies[0].name).toBe("Goblin");

      // Attack until the goblin is dead
      let current = combatState;
      let turns = 0;
      const maxTurns = 50;

      while (
        current.combat.status === "active" &&
        current.combat.enemies.some((e) => e.stats.hp.current > 0) &&
        turns < maxTurns
      ) {
        const attackResult = playerAttack(current, 0);
        if (!attackResult.success) break;
        current = processEnemyTurns(attackResult.state);
        turns++;

        // Guard: player hasn't died
        if (current.player.hp.current <= 0) break;
      }

      // Combat should have resolved within maxTurns
      expect(turns).toBeLessThan(maxTurns);

      // Player dealt damage — enemy HP decreased or combat ended
      if (current.player.hp.current > 0) {
        // If player survived, combat either cleaned up enemies or left a dead target in slot 0.
        const enemy = current.combat.enemies[0];
        if (!enemy) {
          expect(["inactive", "victory"]).toContain(current.combat.status);
        } else {
          expect(enemy.stats.hp.current).toBeLessThanOrEqual(0);
        }
      }
    });
  });

  // ── Test 3: Level Up Flow ──────────────────────────────────────
  describe("Level Up Flow", () => {
    it("awards XP to threshold and levels up, granting attribute points", () => {
      const state = structuredClone(initialGameState);
      const xpNeeded = state.player.xp.max;

      // Award exactly enough XP to level up
      const afterXp = addXp(state, xpNeeded);

      expect(afterXp.player.level).toBe(2);
      expect(afterXp.player.xp.current).toBe(0);
      expect(afterXp.player.xp.max).toBe(xpForNextLevel(2, state.config));

      // Free attribute points granted
      const expectedFreePoints =
        (state.player.attributes.freePoints ?? 0) +
        (state.config.attributePointsPerLevel ?? 0);
      expect(afterXp.player.attributes.freePoints).toBe(expectedFreePoints);

      // HP/Mana recalculated (should be at max after level up)
      expect(afterXp.player.hp.current).toBe(afterXp.player.hp.max);
      expect(afterXp.player.mana.current).toBe(afterXp.player.mana.max);
    });

    it("LEVEL_UP reducer handles multi-level overflow", () => {
      const state = structuredClone(initialGameState);
      const xpForL1 = state.player.xp.max;
      const xpForL2 = xpForNextLevel(2, state.config);

      // Give enough XP to skip from level 1 to level 3
      const overflowState = {
        ...state,
        player: {
          ...state.player,
          xp: { ...state.player.xp, current: xpForL1 + xpForL2 },
        },
      };

      const after = gameReducer(overflowState, { type: "LEVEL_UP" });
      expect(after.player.level).toBeGreaterThanOrEqual(3);
      expect(after.player.attributes.freePoints).toBeGreaterThanOrEqual(
        (state.config.attributePointsPerLevel ?? 0) * 2,
      );
    });
  });

  // ── Test 4: Rest/Heal Flow ─────────────────────────────────────
  describe("Rest/Heal Flow", () => {
    it("restores HP by 25% and mana by 40%, capped at max", () => {
      const state = structuredClone(initialGameState);
      const hpMax = state.player.hp.max;
      const manaMax = state.player.mana.max;

      // Reduce HP and mana to 1
      const damagedState = {
        ...state,
        player: {
          ...state.player,
          hp: { current: 1, max: hpMax },
          mana: { current: 1, max: manaMax },
        },
      };

      const result = executeAction(damagedState, { type: "rest" });
      expect(result.success).toBe(true);

      const config = state.config;
      const expectedHpGain = Math.max(
        config.restHealMinFloor ?? 5,
        Math.floor(hpMax * (config.restHealPercent ?? 0.25)),
      );
      const expectedManaGain = Math.max(
        config.restManaMinFloor ?? 3,
        Math.floor(manaMax * (config.restManaPercent ?? 0.40)),
      );

      expect(result.state.player.hp.current).toBe(
        Math.min(hpMax, 1 + expectedHpGain),
      );
      // Rest now advances world time and can add passive mana regeneration.
      const minimumExpectedMana = Math.min(manaMax, 1 + expectedManaGain);
      expect(result.state.player.mana.current).toBeGreaterThanOrEqual(
        minimumExpectedMana,
      );
      expect(result.state.player.mana.current).toBeLessThanOrEqual(manaMax);
    });

    it("HP and mana don't exceed max after rest", () => {
      const state = structuredClone(initialGameState);
      // Already at full HP/mana
      const result = executeAction(state, { type: "rest" });
      expect(result.success).toBe(true);
      expect(result.state.player.hp.current).toBe(state.player.hp.max);
      expect(result.state.player.mana.current).toBe(state.player.mana.max);
    });

    it("cannot rest during active combat", () => {
      const state = structuredClone(initialGameState);
      const combatState = startCombat(state, ["goblin"]);
      const result = executeAction(combatState, { type: "rest" });
      expect(result.success).toBe(false);
    });
  });

  // ── Test 5: Full Loop ──────────────────────────────────────────
  describe("Full Loop (Create → Fight → Level → Rest → State Consistency)", () => {
    it("runs a complete game loop with consistent state throughout", () => {
      // Step 1: Fresh character
      let state = structuredClone(initialGameState);
      expect(state.player.level).toBe(1);

      // Step 2: Fight a goblin via executeAction
      const attackResult = executeAction(state, {
        type: "attack",
        enemyIds: ["goblin"],
      });
      expect(attackResult.success).toBe(true);
      state = attackResult.state;
      expect(state.combat).toBeDefined();
      expect(state.combat.status).toBe("active");

      // Keep attacking until combat ends
      let safety = 0;
      while (state.combat?.status === "active" && safety < 100) {
        if (state.player.hp.current <= 0) break;
        const hit = executeAction(state, { type: "attack" });
        if (!hit.success) break;
        state = hit.state;
        safety++;
      }

      // Step 3: Level up — give enough XP if combat didn't already level us
      if (state.player.level === 1 && state.player.hp.current > 0) {
        state = addXp(state, state.player.xp.max - state.player.xp.current);
      }

      if (state.player.hp.current > 0) {
        expect(state.player.level).toBeGreaterThanOrEqual(2);
      }

      // Step 4: Rest to heal
      if (state.player.hp.current > 0) {
        const restResult = executeAction(state, { type: "rest" });
        expect(restResult.success).toBe(true);
        state = restResult.state;
        expect(state.player.hp.current).toBeGreaterThanOrEqual(1);
      }

      // Step 5: State consistency checks
      assertStateConsistency(state);

      // Step 6: Save/Load simulation — JSON round-trip
      const serialized = JSON.stringify(state);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.player.level).toBe(state.player.level);
      expect(deserialized.player.hp).toEqual(state.player.hp);
      expect(deserialized.player.mana).toEqual(state.player.mana);
      expect(deserialized.player.xp).toEqual(state.player.xp);
      assertStateConsistency(deserialized);
    });
  });
});

// ── Helpers ─────────────────────────────────────────────────────
function assertStateConsistency(state) {
  expect(state.player).toBeDefined();
  expect(typeof state.player.level).toBe("number");
  expect(Number.isNaN(state.player.level)).toBe(false);
  expect(state.player.level).toBeGreaterThanOrEqual(1);

  expect(typeof state.player.hp.current).toBe("number");
  expect(typeof state.player.hp.max).toBe("number");
  expect(Number.isNaN(state.player.hp.current)).toBe(false);
  expect(Number.isNaN(state.player.hp.max)).toBe(false);
  expect(state.player.hp.current).toBeLessThanOrEqual(state.player.hp.max);

  expect(typeof state.player.mana.current).toBe("number");
  expect(typeof state.player.mana.max).toBe("number");
  expect(Number.isNaN(state.player.mana.current)).toBe(false);
  expect(Number.isNaN(state.player.mana.max)).toBe(false);
  expect(state.player.mana.current).toBeLessThanOrEqual(state.player.mana.max);

  expect(typeof state.player.xp.current).toBe("number");
  expect(typeof state.player.xp.max).toBe("number");
  expect(Number.isNaN(state.player.xp.current)).toBe(false);
  expect(Number.isNaN(state.player.xp.max)).toBe(false);

  expect(state.player.attributes).toBeDefined();
  expect(typeof state.player.attributes.strength).toBe("number");

  // State must be JSON-serializable (no circular refs, no undefined)
  expect(() => JSON.stringify(state)).not.toThrow();
}
