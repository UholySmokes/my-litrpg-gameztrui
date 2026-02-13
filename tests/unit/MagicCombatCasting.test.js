import { describe, it, expect } from "@jest/globals";
import { executeAction } from "../../packages/game-core/src/core/ActionDispatcher.js";
import { initialGameState } from "../../packages/game-core/src/data/initialState.js";
import { applyCastingInterruptionFromDamage } from "../../packages/game-core/src/systems/combat/CombatSystem.js";

describe("Combat casting", () => {
  it("requires extra release turns in combat and then completes", () => {
    const base = {
      ...initialGameState,
      world: { ...initialGameState.world, turnCount: 0 },
      player: {
        ...initialGameState.player,
        hp: { current: 100, max: 100 },
        mana: { current: 50, max: 50 },
        magic: {
          mana: { current: 50, max: 50 },
          reserves: { fire: 50 },
        },
      },
      combat: {
        status: "active",
        turn: "player",
        enemies: [],
        skillCooldowns: {},
        classAbilityCooldowns: {},
        raceAbilityCooldowns: {},
        playerTurnEffectsProcessed: false,
        log: [],
        lanes: { player: 1, enemies: [] },
      },
    };

    const shaped = executeAction(base, {
      type: "magic_shape",
      essence: "fire",
      form: "pulse",
      amount: 10,
    });
    expect(shaped.success).toBe(true);
    expect(shaped.state.player.magic.prepared?.kind).toBe("shape");

    const started = executeAction(shaped.state, { type: "magic_release" });
    expect(started.success).toBe(true);
    expect(started.state.player.magic.casting).toBeTruthy();
    expect(started.state.player.magic.prepared).toBeTruthy();

    const finished = executeAction(started.state, { type: "magic_release" });
    expect(finished.success).toBe(true);
    expect(finished.state.player.magic.casting).toBeNull();
    expect(finished.state.player.magic.prepared).toBeNull();
  });

  it("interrupts casting on damage and clears prepared", () => {
    const state = {
      ...initialGameState,
      player: {
        ...initialGameState.player,
        hp: { current: 10, max: 10 },
        magic: {
          stability: {
            body: { current: 100, max: 100 },
            mind: { current: 100, max: 100 },
            cognitive: { current: 100, max: 100 },
          },
          resonance: { current: 0, max: 100, state: "quiet" },
          anchors: { self: null, area: null, itemId: null },
          casting: { kind: "release", remainingTurns: 2 },
          prepared: { kind: "weave", essences: ["fire", "water"], pattern: "lattice" },
        },
      },
      combat: {
        status: "active",
        turn: "enemy",
        enemies: [],
        log: [],
        lanes: { player: 1, enemies: [] },
      },
    };

    const next = applyCastingInterruptionFromDamage(state, 2);
    expect(next.player.magic.casting).toBeNull();
    expect(next.player.magic.prepared).toBeNull();
    expect(next.combat.log.length).toBeGreaterThan(0);
  });
});

