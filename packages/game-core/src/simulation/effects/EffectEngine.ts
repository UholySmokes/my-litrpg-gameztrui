import {
  Effect,
  Entity,
  EntityId,
  EffectAppliedEvent,
  EffectRemovedEvent,
  DamageEvent,
  HealEvent,
  EntityDeathEvent,
  Event,
  StatBlock,
  Tick,
} from "../types/core";

export type EffectApplicationResult = {
  entity: Entity;
  events: Event[];
};

export type EffectTickResult = {
  entity: Entity;
  events: Event[];
};

export type EffectRemovalReason = "expired" | "dispelled" | "replaced";

function normalizeEffect(effect: Effect, sourceFallback?: EntityId): Effect {
  return {
    ...effect,
    stacks: Number.isFinite(effect.stacks) ? effect.stacks : 1,
    maxStacks: Number.isFinite(effect.maxStacks)
      ? effect.maxStacks
      : Number.isFinite(effect.stacks)
        ? effect.stacks
        : 1,
    stackingRule: effect.stackingRule ?? "refresh",
    duration: Number.isFinite(effect.duration) ? effect.duration : -1,
    source: effect.source ?? sourceFallback ?? "system",
    modifiers: effect.modifiers ?? {},
    tags: Array.isArray(effect.tags) ? effect.tags : [],
  };
}

function resolveDuration(
  existing: number,
  incoming: number,
  mode: "refresh" | "add" | "merge",
): number {
  if (existing === -1 || incoming === -1) {
    return -1;
  }

  if (mode === "add") {
    return existing + incoming;
  }

  return Math.max(existing, incoming);
}

function mergeStatModifiers(
  existing: Partial<StatBlock> | undefined,
  incoming: Partial<StatBlock> | undefined,
): Partial<StatBlock> {
  const base = existing ?? {};
  const next = incoming ?? {};
  const keys = new Set([...Object.keys(base), ...Object.keys(next)]);
  const merged: Partial<StatBlock> = {};
  keys.forEach((key) => {
    const baseValue = (base as any)[key];
    const nextValue = (next as any)[key];
    if (typeof baseValue === "number" && typeof nextValue === "number") {
      (merged as any)[key] = baseValue + nextValue;
      return;
    }
    (merged as any)[key] = nextValue ?? baseValue;
  });
  return merged;
}

function mergeModifiers(
  existing: Effect["modifiers"],
  incoming: Effect["modifiers"],
) {
  return {
    statModifiers: mergeStatModifiers(
      existing?.statModifiers,
      incoming?.statModifiers,
    ),
    damagePerTick:
      (existing?.damagePerTick ?? 0) + (incoming?.damagePerTick ?? 0),
    healingPerTick:
      (existing?.healingPerTick ?? 0) + (incoming?.healingPerTick ?? 0),
  };
}

function createEventId(
  prefix: string,
  tick: Tick,
  entityId: EntityId,
  index: number,
): string {
  return `${prefix}_${tick}_${entityId}_${index}`;
}

export function applyEffect(
  entity: Entity,
  effect: Effect,
  tick: Tick,
  timestamp: number,
  sourceId?: EntityId,
): EffectApplicationResult {
  const normalized = normalizeEffect(effect, sourceId);
  const events: Event[] = [];
  const effects = Array.isArray(entity.effects) ? [...entity.effects] : [];
  const existingIndex = effects.findIndex(
    (entry) => entry.id === normalized.id,
  );
  let updatedEffect = normalized;

  if (existingIndex >= 0) {
    const existing = normalizeEffect(effects[existingIndex], sourceId);
    switch (normalized.stackingRule) {
      case "refresh": {
        updatedEffect = {
          ...existing,
          duration: resolveDuration(
            existing.duration,
            normalized.duration,
            "refresh",
          ),
        };
        effects[existingIndex] = updatedEffect;
        break;
      }
      case "add": {
        const maxStacks = normalized.maxStacks ?? existing.maxStacks;
        const nextStacks = Math.min(
          maxStacks,
          existing.stacks + normalized.stacks,
        );
        const nextDuration = resolveDuration(
          existing.duration,
          normalized.duration,
          "add",
        );
        updatedEffect = {
          ...existing,
          stacks: nextStacks,
          duration: nextDuration,
        };
        effects[existingIndex] = updatedEffect;
        break;
      }
      case "merge": {
        const maxStacks = normalized.maxStacks ?? existing.maxStacks;
        const nextStacks = Math.min(
          maxStacks,
          existing.stacks + normalized.stacks,
        );
        updatedEffect = {
          ...existing,
          stacks: nextStacks,
          duration: resolveDuration(
            existing.duration,
            normalized.duration,
            "merge",
          ),
          modifiers: mergeModifiers(existing.modifiers, normalized.modifiers),
          tags: Array.from(
            new Set([...(existing.tags || []), ...(normalized.tags || [])]),
          ),
        };
        effects[existingIndex] = updatedEffect;
        break;
      }
      case "replace":
      default: {
        effects[existingIndex] = normalized;
        updatedEffect = normalized;
        events.push({
          id: createEventId("effect_removed", tick, entity.id, events.length),
          type: "EffectRemoved",
          tick,
          timestamp,
          entityId: entity.id,
          effectId: existing.id,
          reason: "replaced",
        } as EffectRemovedEvent);
        break;
      }
    }
  } else {
    effects.push(normalized);
  }

  events.push({
    id: createEventId("effect_applied", tick, entity.id, events.length),
    type: "EffectApplied",
    tick,
    timestamp,
    entityId: entity.id,
    effectId: updatedEffect.id,
    sourceId: updatedEffect.source,
    stacks: updatedEffect.stacks,
  } as EffectAppliedEvent);

  return {
    entity: {
      ...entity,
      effects,
    },
    events,
  };
}

export function removeEffect(
  entity: Entity,
  effectId: string,
  tick: Tick,
  timestamp: number,
  reason: EffectRemovalReason = "dispelled",
): EffectApplicationResult {
  const events: Event[] = [];
  const effects = Array.isArray(entity.effects) ? [...entity.effects] : [];
  const index = effects.findIndex((entry) => entry.id === effectId);
  if (index < 0) {
    return { entity, events };
  }

  effects.splice(index, 1);
  events.push({
    id: createEventId("effect_removed", tick, entity.id, events.length),
    type: "EffectRemoved",
    tick,
    timestamp,
    entityId: entity.id,
    effectId,
    reason,
  } as EffectRemovedEvent);

  return {
    entity: {
      ...entity,
      effects,
    },
    events,
  };
}

export function tickEffects(
  entity: Entity,
  dt: number,
  tick: Tick,
  timestamp: number,
): EffectTickResult {
  const events: Event[] = [];
  const effects = Array.isArray(entity.effects) ? [...entity.effects] : [];
  const updatedEffects: Effect[] = [];
  let currentHealth = entity.stats.health.current;

  effects.forEach((effect) => {
    const normalized = normalizeEffect(effect, effect.source);
    const damagePerTick = normalized.modifiers?.damagePerTick ?? 0;
    const healingPerTick = normalized.modifiers?.healingPerTick ?? 0;

    if (damagePerTick > 0) {
      const nextHealth = Math.max(0, currentHealth - damagePerTick);
      events.push({
        id: createEventId("damage", tick, entity.id, events.length),
        type: "Damage",
        tick,
        timestamp,
        entityId: entity.id,
        sourceId: normalized.source,
        targetId: entity.id,
        amount: currentHealth - nextHealth,
        damageType: "effect",
        isCritical: false,
      } as DamageEvent);
      currentHealth = nextHealth;
    }

    if (healingPerTick > 0) {
      const nextHealth = Math.min(
        entity.stats.health.maximum,
        currentHealth + healingPerTick,
      );
      if (nextHealth !== currentHealth) {
        events.push({
          id: createEventId("heal", tick, entity.id, events.length),
          type: "Heal",
          tick,
          timestamp,
          entityId: entity.id,
          sourceId: normalized.source,
          targetId: entity.id,
          amount: nextHealth - currentHealth,
          healType: "effect",
        } as HealEvent);
      }
      currentHealth = nextHealth;
    }

    if (normalized.duration === -1) {
      updatedEffects.push(normalized);
      return;
    }

    const nextDuration = Math.max(0, normalized.duration - dt);
    if (nextDuration <= 0) {
      events.push({
        id: createEventId("effect_removed", tick, entity.id, events.length),
        type: "EffectRemoved",
        tick,
        timestamp,
        entityId: entity.id,
        effectId: normalized.id,
        reason: "expired",
      } as EffectRemovedEvent);
      return;
    }

    updatedEffects.push({
      ...normalized,
      duration: nextDuration,
    });
  });

  let isDead = entity.isDead;
  if (!isDead && currentHealth <= 0) {
    events.push({
      id: createEventId("death", tick, entity.id, events.length),
      type: "EntityDeath",
      tick,
      timestamp,
      entityId: entity.id,
      killerId: effects[0]?.source ?? "system",
      deathCause: "effect",
    } as EntityDeathEvent);
    isDead = true;
  }

  return {
    entity: {
      ...entity,
      isDead,
      effects: updatedEffects,
      stats: {
        ...entity.stats,
        health: {
          ...entity.stats.health,
          current: currentHealth,
        },
      },
    },
    events,
  };
}
