import {
  resolveUseSkillCommand,
  resolveRestCommand,
  ActionResolutionContext,
} from "./ActionResolver";
import { Entity, EntityId, UseSkillCommand, RestCommand } from "../types/core";

function createEntity(id: EntityId, overrides: Partial<Entity> = {}): Entity {
  return {
    id,
    name: overrides.name ?? id,
    type: "player",
    level: 1,
    experience: 0,
    stats: {
      strength: 12,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      health: { current: 100, maximum: 100 },
      mana: { current: 30, maximum: 30 },
      stamina: { current: 20, maximum: 20 },
      attackPower: 10,
      defense: 4,
      speed: 10,
      criticalChance: 0.2,
      criticalMultiplier: 1.5,
      evasion: 0.05,
      accuracy: 0.9,
    },
    position: { lane: 1, slot: 0 },
    actionPoints: 5,
    maxActionPoints: 10,
    initiative: 10,
    effects: [],
    equipment: [],
    cooldowns: [],
    faction: "player",
    tags: [],
    isDead: false,
    ...overrides,
  } as Entity;
}

function buildMap(...entities: Entity[]): Map<EntityId, Entity> {
  return new Map(entities.map((entity) => [entity.id, entity]));
}

function createRng(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

function testSkillResolutionDeterminism(): boolean {
  const attacker = createEntity("attacker");
  const target = createEntity("target", {
    stats: {
      ...createEntity("temp").stats,
      health: { current: 80, maximum: 100 },
      defense: 6,
    },
  });

  const command: UseSkillCommand = {
    id: "cmd_skill_1",
    type: "UseSkill",
    entityId: attacker.id,
    skillId: "basic_strike",
    targetId: target.id,
    timestamp: 0,
  };

  const ctx1: ActionResolutionContext = {
    tick: 1,
    timestamp: 1,
    rng: createRng(42),
  };
  const ctx2: ActionResolutionContext = {
    tick: 1,
    timestamp: 1,
    rng: createRng(42),
  };

  const resultA = resolveUseSkillCommand(
    command,
    buildMap(attacker, target),
    ctx1,
  );
  const resultB = resolveUseSkillCommand(
    command,
    buildMap(attacker, target),
    ctx2,
  );

  const eventsA = JSON.stringify(resultA.events);
  const eventsB = JSON.stringify(resultB.events);

  if (eventsA !== eventsB) {
    console.error("Skill resolution events mismatch", eventsA, eventsB);
    return false;
  }

  const hpA = resultA.entities.get(target.id)?.stats.health.current;
  const hpB = resultB.entities.get(target.id)?.stats.health.current;
  if (hpA !== hpB) {
    console.error("Skill resolution HP mismatch", hpA, hpB);
    return false;
  }

  return true;
}

function testRestResolution(): boolean {
  const actor = createEntity("resting", {
    stats: {
      ...createEntity("temp").stats,
      health: { current: 60, maximum: 100 },
      mana: { current: 10, maximum: 30 },
      stamina: { current: 5, maximum: 20 },
    },
    actionPoints: 3,
  });

  const command: RestCommand = {
    id: "cmd_rest_1",
    type: "Rest",
    entityId: actor.id,
    timestamp: 0,
    duration: 2,
  };

  const ctx: ActionResolutionContext = {
    tick: 1,
    timestamp: 1,
    rng: createRng(10),
  };

  const result = resolveRestCommand(command, buildMap(actor), ctx);
  const updated = result.entities.get(actor.id);

  if (!updated) {
    console.error("Missing rest actor after resolution");
    return false;
  }

  if (updated.stats.health.current <= actor.stats.health.current) {
    console.error("Rest did not restore health");
    return false;
  }

  if (updated.actionPoints >= actor.actionPoints) {
    console.error("Rest did not spend action points");
    return false;
  }

  return true;
}

export function runActionResolverTests(): boolean {
  console.log("Running action resolver tests...");
  const tests = [testSkillResolutionDeterminism, testRestResolution];
  let passed = 0;

  for (const test of tests) {
    try {
      if (test()) {
        passed++;
      }
    } catch (error) {
      console.error("Action resolver test error", error);
    }
  }

  console.log(
    `Action resolver results: ${passed}/${tests.length} tests passed`,
  );
  return passed === tests.length;
}

if (typeof window === "undefined" && typeof process !== "undefined") {
  runActionResolverTests();
}
