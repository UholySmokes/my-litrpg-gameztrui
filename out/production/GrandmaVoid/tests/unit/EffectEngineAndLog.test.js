import { describe, it, expect } from "@jest/globals";
import {
  applyEffect,
  tickEffects,
} from "../../src/simulation/effects/EffectEngine.ts";
import { serializeEvent } from "../../src/simulation/logging/CombatLogSerializer.ts";

function createEntity(overrides = {}) {
  return {
    id: "player",
    name: "Player",
    type: "player",
    level: 1,
    experience: 0,
    stats: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      health: { current: 100, maximum: 100 },
      mana: { current: 50, maximum: 50 },
      stamina: { current: 50, maximum: 50 },
      attackPower: 10,
      defense: 5,
      speed: 5,
      criticalChance: 0,
      criticalMultiplier: 1.5,
      evasion: 0,
      accuracy: 1,
    },
    position: { lane: 1, slot: 0 },
    actionPoints: 5,
    maxActionPoints: 5,
    initiative: 5,
    effects: [],
    equipment: [],
    cooldowns: [],
    faction: "player",
    tags: [],
    isDead: false,
    ...overrides,
  };
}

describe("EffectEngine", () => {
  it("stacks additive effects deterministically", () => {
    const entity = createEntity();
    const baseEffect = {
      id: "burn",
      stacks: 1,
      maxStacks: 3,
      stackingRule: "add",
      duration: 2,
      modifiers: { damagePerTick: 5 },
    };

    const first = applyEffect(entity, baseEffect, 1, 100, "player");
    expect(first.entity.effects).toHaveLength(1);
    expect(first.entity.effects[0].stacks).toBe(1);
    expect(
      first.events.find((evt) => evt.type === "EffectApplied"),
    ).toBeDefined();

    const second = applyEffect(first.entity, baseEffect, 2, 200, "player");
    expect(second.entity.effects).toHaveLength(1);
    expect(second.entity.effects[0].stacks).toBe(2);
    expect(second.entity.effects[0].duration).toBeGreaterThan(0);
  });

  it("ticks damage, expires effect, and records death deterministically", () => {
    const entity = createEntity();
    const applied = applyEffect(
      entity,
      {
        id: "lethal_dot",
        stacks: 1,
        stackingRule: "add",
        duration: 1,
        modifiers: { damagePerTick: 120 },
      },
      5,
      500,
      "enemy_0",
    );

    const tickResult = tickEffects(applied.entity, 1, 6, 600);
    const damageEvent = tickResult.events.find((evt) => evt.type === "Damage");
    const removeEvent = tickResult.events.find(
      (evt) => evt.type === "EffectRemoved",
    );
    const deathEvent = tickResult.events.find(
      (evt) => evt.type === "EntityDeath",
    );

    expect(damageEvent).toBeDefined();
    expect(damageEvent.amount).toBeGreaterThan(0);
    expect(removeEvent).toBeDefined();
    expect(deathEvent).toBeDefined();
    expect(tickResult.entity.isDead).toBe(true);
    expect(tickResult.entity.stats.health.current).toBe(0);
  });
});

describe("CombatLogSerializer", () => {
  it("serializes critical damage events with emoji and entity names", () => {
    const event = {
      id: "damage_1",
      type: "Damage",
      tick: 10,
      timestamp: 1000,
      sourceId: "player",
      targetId: "enemy_0",
      entityId: "enemy_0",
      amount: 25,
      damageType: "skill",
      isCritical: true,
    };

    const entry = serializeEvent(event, {
      resolveName: (id) =>
        id === "player" ? "Hero" : id === "enemy_0" ? "Goblin" : id,
    });

    expect(entry.text).toContain("Hero");
    expect(entry.text).toContain("Goblin");
    expect(entry.text).toContain("💥");
  });

  it("serializes effect application with stacks", () => {
    const event = {
      id: "effect_1",
      type: "EffectApplied",
      tick: 11,
      timestamp: 1100,
      entityId: "player",
      sourceId: "enemy_0",
      effectId: "poison",
      stacks: 2,
    };

    const entry = serializeEvent(event, {
      resolveName: (id) => (id === "player" ? "Hero" : "Goblin"),
    });

    expect(entry.text).toContain("Hero");
    expect(entry.text).toContain("poison");
    expect(entry.text).toContain("x2");
  });
});
