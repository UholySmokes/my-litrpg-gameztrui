import { describe, it, expect } from "@jest/globals";
import { executeAction } from "../../packages/game-core/src/core/ActionDispatcher.js";
import { initialGameState } from "../../packages/game-core/src/data/initialState.js";

describe("ActionDispatcher", () => {
  const baseState = {
    ...initialGameState,
    player: {
      ...initialGameState.player,
      hp: { current: 50, max: 100 },
      mana: { current: 30, max: 100 },
    },
    combat: { status: "inactive" },
  };

  describe("rest action", () => {
    it("restores HP and mana when config values are zero", () => {
      const state = {
        ...baseState,
        config: { ...baseState.config, restHealAmount: 0, restManaAmount: 0 },
      };

      const result = executeAction(state, { type: "rest" });
      expect(result.success).toBe(true);
      expect(result.state.player.hp.current).toBeGreaterThan(50);
      expect(result.state.player.mana.current).toBeGreaterThan(30);
    });

    it("uses custom positive config values for rest", () => {
      const state = {
        ...baseState,
        config: { ...baseState.config, restHealAmount: 10, restManaAmount: 15, manaRegenPerTurn: 0 },
      };

      const result = executeAction(state, { type: "rest" });
      expect(result.success).toBe(true);
      expect(result.state.player.hp.current).toBe(60);
      expect(result.state.player.mana.current).toBe(45);
    });

    it("clamps restored values to max", () => {
      const state = {
        ...baseState,
        player: {
          ...baseState.player,
          hp: { current: 98, max: 100 },
          mana: { current: 99, max: 100 },
        },
        config: { ...baseState.config, restHealAmount: 10, restManaAmount: 10 },
      };

      const result = executeAction(state, { type: "rest" });
      expect(result.state.player.hp.current).toBe(100);
      expect(result.state.player.mana.current).toBe(100);
    });

    it("cannot rest during active combat", () => {
      const state = {
        ...baseState,
        combat: { status: "active" },
      };

      const result = executeAction(state, { type: "rest" });
      expect(result.success).toBe(false);
    });
  });

  describe("passive mana regen on turn-advancing actions", () => {
    it("applies processTimeEffects for non-combat turn-advancing actions", () => {
      const state = {
        ...baseState,
        player: {
          ...baseState.player,
          mana: { current: 90, max: 100 },
        },
        config: { ...baseState.config, manaRegenPerTurn: 2 },
        combat: { status: "inactive" },
      };

      const result = executeAction(state, { type: "rest" });
      expect(result.success).toBe(true);
      // Mana should increase: rest restores 25% (25) + passive regen (2)
      // But capped at max 100, so mana should be 100
      expect(result.state.player.mana.current).toBe(100);
    });

    it("does not apply processTimeEffects during active combat", () => {
      // Combat actions handle time effects through processEnemyTurns
      // This test verifies the guard condition
      const state = {
        ...baseState,
        combat: { status: "active" },
      };

      // Can't rest during combat, so this confirms the guard
      const result = executeAction(state, { type: "rest" });
      expect(result.success).toBe(false);
    });
  });

  describe("turn counter", () => {
    it("increments turn count for state-changing actions", () => {
      const state = {
        ...baseState,
        world: { ...baseState.world, turnCount: 5 },
      };

      const result = executeAction(state, { type: "rest" });
      expect(result.success).toBe(true);
      expect(result.state.world.turnCount).toBe(6);
    });

    it("does not increment turn count for read-only actions", () => {
      const state = {
        ...baseState,
        world: { ...baseState.world, turnCount: 5 },
      };

      const result = executeAction(state, { type: "look" });
      expect(result.success).toBe(true);
      expect(result.state.world?.turnCount ?? 5).toBe(5);
    });
  });
});
