import { describe, it, expect } from "@jest/globals";
import { executeAction } from "../../packages/game-core/src/core/ActionDispatcher.js";
import { initialGameState } from "../../packages/game-core/src/data/initialState.js";
import {
  applyCastingInterruptionFromDamage,
  startCombat,
} from "../../packages/game-core/src/systems/combat/CombatSystem.js";

describe("Combat casting", () => {
  it("routes named mage spells through unified magic state in combat", () => {
    const engaged = startCombat({
      ...initialGameState,
      player: {
        ...initialGameState.player,
        class: "mage",
        hp: { current: 100, max: 100 },
        mana: { current: 80, max: 80 },
        magic: {
          ...initialGameState.player.magic,
          mana: { current: 80, max: 80 },
          strain: { current: 0, max: 100, state: "steady" },
          resonance: { current: 0, max: 100, state: "quiet" },
        },
      },
      world: { ...initialGameState.world, turnCount: 0 },
    }, ["goblin"]);

    const cast = executeAction(engaged, {
      type: "attack",
      enemyIndex: 0,
      skillId: "fireball",
    });

    expect(cast.success).toBe(true);
    expect(cast.state.player.magic.strain.current).toBeGreaterThan(0);
    expect(cast.state.player.magic.resonance.current).toBeGreaterThan(0);
    expect(cast.state.player.abilityState.families.magic.strain.current).toBe(
      cast.state.player.magic.strain.current,
    );
    expect(cast.state.player.mana.current).toBeLessThan(80);
  });

  it("prepares and casts unified magic in combat", () => {
    const engaged = startCombat({
      ...initialGameState,
      player: {
        ...initialGameState.player,
        class: "mage",
        hp: { current: 100, max: 100 },
        mana: { current: 60, max: 60 },
        magic: {
          ...initialGameState.player.magic,
          mana: { current: 60, max: 60 },
        },
      },
      world: { ...initialGameState.world, turnCount: 0 },
    }, ["goblin"]);

    const prepared = executeAction(engaged, {
      type: "magic_prepare",
      essence: "fire",
      form: "bolt",
      scale: 2,
    });
    expect(prepared.success).toBe(true);
    expect(prepared.state.player.magic.prepared?.request?.form).toBe("bolt");

    const cast = executeAction(prepared.state, {
      type: "magic_cast",
      usePrepared: true,
      enemyIndex: 0,
    });
    expect(cast.success).toBe(true);
    expect(cast.state.player.magic.prepared).toBeNull();
    expect(cast.state.player.abilityState.preparedDirective).toBeNull();
    expect(cast.state.player.magic.strain.current).toBeGreaterThan(0);
    expect(cast.state.player.magic.resonance.current).toBeGreaterThan(0);
    expect(cast.state.player.mana.current).toBeLessThan(60);
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
    expect(next.player.abilityState?.families?.magic?.prepared ?? null).toBeNull();
    expect(next.combat.log.length).toBeGreaterThan(0);
  });

  it("stabilize reduces unified magic strain", () => {
    const base = {
      ...initialGameState,
      player: {
        ...initialGameState.player,
        magic: {
          ...initialGameState.player.magic,
          strain: { current: 42, max: 100, state: "tense" },
        },
      },
    };

    const stabilized = executeAction(base, {
      type: "magic_stabilize",
    });
    expect(stabilized.success).toBe(true);
    expect(stabilized.state.player.magic.strain.current).toBeLessThan(42);
  });
});

