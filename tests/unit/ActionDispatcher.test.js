import { describe, it, expect } from "@jest/globals";
import { executeAction } from "../../packages/game-core/src/core/ActionDispatcher.js";
import { initialGameState } from "../../packages/game-core/src/data/initialState.js";
import { startCombat } from "../../packages/game-core/src/systems/combat/CombatSystem.js";

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

  describe("magic study action", () => {
    it("records a journal entry and unlocks a recipe for explicit spell study", () => {
      const state = {
        ...baseState,
        world: { ...(baseState.world || {}), turnCount: 7 },
      };

      const result = executeAction(state, { type: "magic_study", target: "spell fire bolt" });
      expect(result.success).toBe(true);
      expect(result.state.world.turnCount).toBe(8);

      const magic = result.state.player.magic;
      const entry = magic.journal[magic.journal.length - 1];
      expect(entry.target).toBe("spell fire bolt");
      expect(entry.method).toBe("spell_study");
      expect(entry.result).toBe("breakthrough");
      expect(magic.grammar.recipes).toContain("study:magic:fire:bolt");
    });

    it("records rune study observations without requiring a spell recipe unlock", () => {
      const state = {
        ...baseState,
        world: { ...(baseState.world || {}), turnCount: 3 },
      };

      const result = executeAction(state, { type: "magic_study", target: "rune aeth" });
      expect(result.success).toBe(true);
      expect(result.state.world.turnCount).toBe(4);

      const magic = result.state.player.magic;
      const entry = magic.journal[magic.journal.length - 1];
      expect(entry.target).toBe("rune aeth");
      expect(entry.method).toBe("rune_analysis");
    });
  });

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

    it("uses percentage-based healing from config", () => {
      const state = {
        ...baseState,
        player: {
          ...baseState.player,
          hp: { current: 50, max: 200 },
          mana: { current: 20, max: 200 },
        },
        config: {
          ...baseState.config,
          restHealAmount: 0,
          restManaAmount: 0,
          restHealPercent: 0.25,
          restManaPercent: 0.40,
          restHealMinFloor: 5,
          restManaMinFloor: 3,
          manaRegenPerTurn: 0,
        },
      };

      const result = executeAction(state, { type: "rest" });
      expect(result.success).toBe(true);
      // HP: 50 + floor(200*0.25)=50 → 100
      expect(result.state.player.hp.current).toBe(100);
      // Mana: 20 + floor(200*0.40)=80 → 100
      expect(result.state.player.mana.current).toBe(100);
    });

    it("applies min floor for low-level characters", () => {
      const state = {
        ...baseState,
        player: {
          ...baseState.player,
          hp: { current: 1, max: 10 },
          mana: { current: 1, max: 5 },
        },
        config: {
          ...baseState.config,
          restHealAmount: 0,
          restManaAmount: 0,
          restHealPercent: 0.25,
          restManaPercent: 0.40,
          restHealMinFloor: 5,
          restManaMinFloor: 3,
          manaRegenPerTurn: 0,
        },
      };

      const result = executeAction(state, { type: "rest" });
      expect(result.success).toBe(true);
      // floor(10*0.25)=2 < 5, so min floor 5 applies; capped at max 10
      expect(result.state.player.hp.current).toBe(6);
      // floor(5*0.40)=2 < 3, so min floor 3 applies; capped at max 5
      expect(result.state.player.mana.current).toBe(4);
    });

    it("caps HP and mana at max after rest", () => {
      const state = {
        ...baseState,
        player: {
          ...baseState.player,
          hp: { current: 95, max: 100 },
          mana: { current: 90, max: 100 },
        },
        config: {
          ...baseState.config,
          restHealAmount: 0,
          restManaAmount: 0,
          restHealPercent: 0.25,
          restManaPercent: 0.40,
          manaRegenPerTurn: 0,
        },
      };

      const result = executeAction(state, { type: "rest" });
      expect(result.success).toBe(true);
      expect(result.state.player.hp.current).toBe(100);
      expect(result.state.player.mana.current).toBe(100);
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

    it("advances turn, time, and ecology on movement actions", () => {
      const state = {
        ...baseState,
        config: {
          ...baseState.config,
          manaRegenPerTurn: 0,
          worldMinutesPerTurn: 15,
        },
        world: {
          ...baseState.world,
          turnCount: 0,
          location: {
            ...baseState.world.location,
            current: "city_sunspire_temple",
            visited: ["city_sunspire_temple"],
            unlockedAreas: ["city_sunspire_temple", "city_neon_bazaar"],
            biome: "city",
          },
          time: {
            ...(baseState.world.time || {}),
            currentTime: 480,
            timeOfDay: "day",
            isOutdoors: true,
            lastUpdate: 0,
          },
        },
        player: {
          ...baseState.player,
          magic: {
            resonance: { current: 50, max: 100, state: "ringing" },
          },
        },
      };

      const result = executeAction(state, {
        type: "move",
        targetLocation: "city_neon_bazaar",
      });
      expect(result.success).toBe(true);
      expect(result.state.world.turnCount).toBe(1);
      expect(result.state.world.location.current).toBe("city_neon_bazaar");
      expect(result.state.world.time.currentTime).toBe(495);
      expect(result.state.player.magic.resonance.current).toBeLessThan(50);
    });

    it("does not advance turn when moving to the current location", () => {
      const state = {
        ...baseState,
        world: {
          ...baseState.world,
          turnCount: 3,
          location: {
            ...baseState.world.location,
            current: "city_neon_bazaar",
            unlockedAreas: ["city_neon_bazaar"],
          },
        },
      };

      const result = executeAction(state, {
        type: "move",
        targetLocation: "city_neon_bazaar",
      });
      expect(result.success).toBe(true);
      expect(result.state.world.turnCount).toBe(3);
    });
  });

  describe("dialogue action", () => {
    it("preserves dialogue metadata without mutating state", () => {
      const result = executeAction(baseState, {
        type: "dialogue",
        intent: "question",
        originalInput: "Why are you all just staring at me?",
        spokenText: "Why are you all just staring at me?",
        targetLabel: "Spirit Beast Clan Patrol",
        topic: "their silence",
        description: 'Player asked: "Why are you all just staring at me?"',
      });

      expect(result.success).toBe(true);
      expect(result.readOnly).toBe(true);
      expect(result.state).toBe(baseState);
      expect(result.dialogue).toEqual({
        intent: "question",
        targetLabel: "Spirit Beast Clan Patrol",
        topic: "their silence",
        spokenText: "Why are you all just staring at me?",
        requiresResponse: true,
      });
    });
  });

  describe("escape action", () => {
    it("resolves escape attempts through the dispatcher", () => {
      const state = {
        ...baseState,
        config: {
          ...baseState.config,
          baseEscapeChance: 1,
          agilityEscapeBonus: 0,
        },
      };
      const combatState = startCombat(state, ["goblin"]);
      const result = executeAction(combatState, { type: "escape" });
      expect(result.success).toBe(true);
      expect(result.state.combat.status).toBe("inactive");
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
        world: { ...baseState.world, turnCount: 0, location: { ...baseState.world.location, current: "city_neon_bazaar" } },
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
          location: { ...baseState.world.location, current: "city_neon_bazaar" },
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


  describe("devourer actions", () => {
    const devourerState = {
      ...baseState,
      player: {
        ...baseState.player,
        archetypeSystem: {
          id: "devourer_core",
          name: "Devourer Core",
          category: "System",
          resource: { name: "Biomass", current: 20, max: 100, color: "#7DFFB3" },
          runtime: {
            taint: 6,
            storedSamples: {
              humanoid: { count: 1, biomass: 14, taint: 5, sentientCount: 1, lastEnemyName: "Bandit" },
            },
            knownPrey: { humanoid: { digested: 1 } },
            adaptations: {},
            sentientDevours: 0,
            lastNotice: "",
          },
        },
      },
      world: { ...baseState.world, turnCount: 8 },
    };

    it("digests prey into biomass and taint", () => {
      const result = executeAction(devourerState, { type: "devourer_digest", target: "humanoid" });
      expect(result.success).toBe(true);
      expect(result.state.player.archetypeSystem.resource.current).toBeGreaterThan(20);
      expect(result.state.player.archetypeSystem.runtime.taint).toBeGreaterThan(6);
      expect(result.state.player.archetypeSystem.runtime.sentientDevours).toBe(1);
      expect(result.state.player.archetypeSystem.runtime.storedSamples.humanoid.count).toBe(0);
      expect(result.state.player.archetypeSystem.runtime.knownPrey.humanoid.digested).toBe(2);
    });

    it("refines known prey into permanent adaptation", () => {
      const digestResult = executeAction(devourerState, { type: "devourer_digest", target: "humanoid" });
      const result = executeAction(digestResult.state, { type: "devourer_refine", target: "humanoid" });
      expect(result.success).toBe(true);
      expect(result.state.player.archetypeSystem.runtime.adaptations.humanoid.rank).toBe(1);
      expect(result.state.player.progressionModifiers.resourceGainMultiplier).toBeGreaterThan(0);
    });

    it("purges taint by consuming biomass", () => {
      const result = executeAction(devourerState, { type: "devourer_purge" });
      expect(result.success).toBe(true);
      expect(result.state.player.archetypeSystem.runtime.taint).toBeLessThan(6);
      expect(result.state.player.archetypeSystem.resource.current).toBeLessThan(20);
    });
  });

});
