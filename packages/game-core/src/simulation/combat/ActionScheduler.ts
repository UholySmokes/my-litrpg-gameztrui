import {
  Entity,
  EntityId,
  Event,
  Tick,
  APGainedEvent,
  APSpentEvent,
  TurnStartedEvent,
} from "../types/core";

export type SchedulerConfig = {
  apGainBase: number;
  speedDivisor: number;
  apThreshold: number;
  maxActionPoints?: number;
};

export type SchedulerTickResult = {
  entities: Map<EntityId, Entity>;
  readyQueue: EntityId[];
  events: Event[];
};

const DEFAULT_CONFIG: SchedulerConfig = {
  apGainBase: 1,
  speedDivisor: 10,
  apThreshold: 10,
};

function resolveConfig(config?: Partial<SchedulerConfig>): SchedulerConfig {
  return {
    ...DEFAULT_CONFIG,
    ...(config || {}),
  };
}

function getSpeed(entity: Entity): number {
  const speed = Number.isFinite(entity.stats?.speed)
    ? entity.stats.speed
    : entity.initiative;
  return Number.isFinite(speed) ? speed : 0;
}

function createEventId(
  prefix: string,
  tick: Tick,
  entityId: EntityId,
  index: number,
): string {
  return `${prefix}_${tick}_${entityId}_${index}`;
}

export function advanceActionPoints(
  entities: Map<EntityId, Entity>,
  tick: Tick,
  timestamp: number,
  config?: Partial<SchedulerConfig>,
): SchedulerTickResult {
  const resolved = resolveConfig(config);
  const updatedEntities = new Map<EntityId, Entity>();
  const events: Event[] = [];
  let eventIndex = 0;

  const sortedEntries = Array.from(entities.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  for (const [entityId, entity] of sortedEntries) {
    if (!entity) {
      continue;
    }

    if (entity.isDead) {
      updatedEntities.set(entityId, entity);
      continue;
    }

    const speed = getSpeed(entity);
    const gain =
      Math.max(1, Math.floor(speed / resolved.speedDivisor)) +
      resolved.apGainBase;
    const maxActionPoints = Number.isFinite(entity.maxActionPoints)
      ? entity.maxActionPoints
      : (resolved.maxActionPoints ?? resolved.apThreshold);
    const nextActionPoints = Math.min(
      maxActionPoints,
      entity.actionPoints + gain,
    );

    const updatedEntity = {
      ...entity,
      actionPoints: nextActionPoints,
    };
    updatedEntities.set(entityId, updatedEntity);

    const gained = nextActionPoints - entity.actionPoints;
    if (gained > 0) {
      events.push({
        id: createEventId("ap_gain", tick, entityId, eventIndex++),
        type: "APGained",
        tick,
        timestamp,
        entityId,
        amount: gained,
        total: nextActionPoints,
      } as APGainedEvent);
    }
  }

  const readyEntities = Array.from(updatedEntities.values())
    .filter(
      (entity) =>
        entity && !entity.isDead && entity.actionPoints >= resolved.apThreshold,
    )
    .sort((a, b) => {
      if (b.initiative !== a.initiative) {
        return b.initiative - a.initiative;
      }
      if (b.actionPoints !== a.actionPoints) {
        return b.actionPoints - a.actionPoints;
      }
      return a.id.localeCompare(b.id);
    });

  const readyQueue = readyEntities.map((entity) => entity.id);

  readyEntities.forEach((entity, order) => {
    events.push({
      id: createEventId("turn_start", tick, entity.id, eventIndex++),
      type: "TurnStarted",
      tick,
      timestamp,
      entityId: entity.id,
      actionPoints: entity.actionPoints,
      initiative: entity.initiative,
      order,
    } as TurnStartedEvent);
  });

  return {
    entities: updatedEntities,
    readyQueue,
    events,
  };
}

export function spendActionPoints(
  entities: Map<EntityId, Entity>,
  entityId: EntityId,
  amount: number,
  tick: Tick,
  timestamp: number,
  reason?: string,
): { entities: Map<EntityId, Entity>; event: Event | null } {
  const entity = entities.get(entityId);
  if (!entity) {
    return { entities, event: null };
  }

  const spendAmount = Math.max(0, Math.floor(amount));
  if (spendAmount <= 0) {
    return { entities, event: null };
  }

  const remaining = Math.max(0, entity.actionPoints - spendAmount);
  const updatedEntities = new Map(entities);
  updatedEntities.set(entityId, {
    ...entity,
    actionPoints: remaining,
  });

  const event: APSpentEvent = {
    id: createEventId("ap_spent", tick, entityId, 0),
    type: "APSpent",
    tick,
    timestamp,
    entityId,
    amount: spendAmount,
    remaining,
    ...(reason ? { reason } : {}),
  };

  return {
    entities: updatedEntities,
    event,
  };
}
