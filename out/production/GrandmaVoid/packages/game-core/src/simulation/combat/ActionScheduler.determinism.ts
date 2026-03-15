import { advanceActionPoints, spendActionPoints } from "./ActionScheduler";
import { Entity, EntityId } from "../types/core";

function createTestEntity(id: EntityId, options: Partial<Entity> = {}): Entity {
  return {
    id,
    name: options.name ?? id,
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
      speed: 10,
      criticalChance: 0.1,
      criticalMultiplier: 1.5,
      evasion: 0.05,
      accuracy: 0.9,
    },
    position: { lane: 1, slot: 0 },
    actionPoints: 0,
    maxActionPoints: 10,
    initiative: 10,
    effects: [],
    equipment: [],
    cooldowns: [],
    faction: "player",
    tags: [],
    isDead: false,
    ...options,
  } as Entity;
}

function buildEntityMap(...entities: Entity[]): Map<EntityId, Entity> {
  return new Map(entities.map((entity) => [entity.id, entity]));
}

function summarizeEvents(events: any[]) {
  return events.map((event) => ({
    type: event.type,
    entityId: event.entityId,
    actionPoints: event.actionPoints,
    initiative: event.initiative,
    order: event.order,
    amount: event.amount,
    total: event.total,
    remaining: event.remaining,
  }));
}

function testSchedulerDeterminism(): boolean {
  const entityA = createTestEntity("alpha", {
    actionPoints: 9,
    initiative: 5,
    stats: { ...createTestEntity("temp").stats, speed: 10 },
  });
  const entityB = createTestEntity("bravo", {
    actionPoints: 8,
    initiative: 8,
    stats: { ...createTestEntity("temp").stats, speed: 20 },
  });

  const mapA = buildEntityMap(entityB, entityA);
  const mapB = buildEntityMap(entityA, entityB);

  const resultA = advanceActionPoints(mapA, 1, 1);
  const resultB = advanceActionPoints(mapB, 1, 1);

  const readyMatch =
    JSON.stringify(resultA.readyQueue) === JSON.stringify(resultB.readyQueue);
  if (!readyMatch) {
    console.error(
      "Scheduler ready queue mismatch",
      resultA.readyQueue,
      resultB.readyQueue,
    );
    return false;
  }

  const eventsA = summarizeEvents(resultA.events);
  const eventsB = summarizeEvents(resultB.events);
  if (JSON.stringify(eventsA) !== JSON.stringify(eventsB)) {
    console.error("Scheduler events mismatch", eventsA, eventsB);
    return false;
  }

  return true;
}

function testSpendActionPoints(): boolean {
  const entity = createTestEntity("alpha", { actionPoints: 7 });
  const entities = buildEntityMap(entity);
  const { entities: updatedEntities, event } = spendActionPoints(
    entities,
    entity.id,
    5,
    2,
    2,
    "test",
  );

  const updated = updatedEntities.get(entity.id);
  if (!updated || updated.actionPoints !== 2) {
    console.error("AP spend failed", updated?.actionPoints);
    return false;
  }

  if (!event || event.type !== "APSpent" || event.remaining !== 2) {
    console.error("AP spent event invalid", event);
    return false;
  }

  return true;
}

export function runActionSchedulerTests(): boolean {
  console.log("Running action scheduler tests...");
  const tests = [testSchedulerDeterminism, testSpendActionPoints];
  let passed = 0;

  for (const test of tests) {
    try {
      if (test()) {
        passed++;
      }
    } catch (error) {
      console.error("Action scheduler test error", error);
    }
  }

  console.log(
    `Action scheduler results: ${passed}/${tests.length} tests passed`,
  );
  return passed === tests.length;
}

if (typeof window === "undefined" && typeof process !== "undefined") {
  runActionSchedulerTests();
}
