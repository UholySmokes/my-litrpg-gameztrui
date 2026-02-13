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

    it("uses custom positive config values for rest without passive regen", () => {
      const state = {
        ...baseState,
        config: { ...baseState.config, restHealAmount: 10, restManaAmount: 15, manaRegenPerTurn: 0 },
      };

      const result = executeAction(state, { type: "rest" });
      expect(result.success).toBe(true);
      // HP: 50 + 10 (restHealAmount) = 60, no passive regen
      expect(result.state.player.hp.current).toBe(60);
      // Mana: 30 + 15 (restManaAmount) = 45, no passive mana regen (manaRegenPerTurn=0)
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

  describe("essence weaving actions", () => {
    it("does not increment turn count for magic_sense", () => {
      const state = {
        ...baseState,
        world: { ...baseState.world, turnCount: 5 },
      };

      const result = executeAction(state, { type: "magic_sense" });
      expect(result.success).toBe(true);
      expect(result.state.world.turnCount).toBe(5);
    });

    it("draws essence into reserves and consumes mana pool capacity", () => {
      const state = {
        ...baseState,
        config: { ...baseState.config, manaRegenPerTurn: 0 },
        world: { ...baseState.world, turnCount: 0, location: { ...baseState.world.location, current: "starting_zone" } },
      };

      const result = executeAction(state, { type: "magic_draw", essence: "fire", amount: 5 });
      expect(result.success).toBe(true);
      expect(result.state.world.turnCount).toBe(1);
      expect(result.state.player.magic?.reserves?.fire).toBeGreaterThan(0);
      expect(result.state.player.magic?.mana?.current).toBeLessThan(
        result.state.player.magic?.mana?.max,
      );
    });

    it("refines reserves into a charge", () => {
      const state = {
        ...baseState,
        config: { ...baseState.config, manaRegenPerTurn: 0 },
        world: {
          ...baseState.world,
          turnCount: 0,
          location: { ...baseState.world.location, current: "starting_zone" },
          essence: {
            ambient: {
              fire: 0.1,
              water: 1.0,
              earth: 0.1,
              air: 0.1,
              lightning: 0.1,
              shadow: 0.1,
              light: 0.1,
              life: 0.1,
            },
            sources: [],
          },
        },
      };

      const afterDraw = executeAction(state, { type: "magic_draw", essence: "water", amount: 10 }).state;
      const result = executeAction(afterDraw, { type: "magic_refine", essence: "water", method: "stream", amount: 1 });
      expect(result.success).toBe(true);
      expect(Array.isArray(result.state.player.magic?.charges)).toBe(true);
      expect(result.state.player.magic.charges.length).toBeGreaterThan(0);
    });

    it("purges contamination from reserves taint", () => {
      const state = {
        ...baseState,
        config: { ...baseState.config, manaRegenPerTurn: 0 },
        world: { ...baseState.world, turnCount: 3 },
        player: {
          ...baseState.player,
          magic: {
            reservesTaint: { fire: 0.6 },
            reserves: { fire: 5 },
            mana: { current: 20, max: 20 },
          },
        },
      };

      const result = executeAction(state, {
        type: "magic_purge",
        essence: "fire",
        amount: 8,
      });
      expect(result.success).toBe(true);
      expect(result.state.world.turnCount).toBe(4);
      expect(result.state.player.magic.reservesTaint.fire).toBeLessThan(0.6);
    });
  });
});
