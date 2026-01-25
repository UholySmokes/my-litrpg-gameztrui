import {
  APGainedEvent,
  APSpentEvent,
  CombatActionEvent,
  DamageEvent,
  EffectAppliedEvent,
  EffectRemovedEvent,
  EntityDeathEvent,
  Event,
  HealEvent,
  SkillUsedEvent,
  StatChangedEvent,
  Tick,
  EntityId,
} from "../types/core";

type EntityNameResolver = (entityId?: EntityId) => string;

type CombatLogEntry = {
  id: string;
  tick: Tick;
  timestamp: number;
  type: Event["type"];
  text: string;
  details?: Record<string, unknown>;
};

type SerializerOptions = {
  resolveName?: EntityNameResolver;
  includeDetails?: boolean;
};

const emoji = {
  damage: "⚔️",
  crit: "💥",
  heal: "✨",
  skill: "🎯",
  effect: "🌀",
  removeEffect: "💨",
  death: "☠️",
  stat: "📊",
  ap: "⚡",
  error: "⚠️",
  combatAction: "🎲",
};

const defaultResolver: EntityNameResolver = (id) => id ?? "Unknown";

function formatDamage(
  event: DamageEvent,
  resolveName: EntityNameResolver,
): CombatLogEntry {
  const source = resolveName(event.sourceId);
  const target = resolveName(event.targetId);
  const icon = event.isCritical ? `${emoji.crit}` : emoji.damage;
  const critText = event.isCritical ? " CRIT" : "";
  return {
    id: event.id,
    tick: event.tick,
    timestamp: event.timestamp,
    type: event.type,
    text: `${icon} ${source} hits ${target} for ${event.amount} ${event.damageType} damage${critText}.`,
    details: {
      sourceId: event.sourceId,
      targetId: event.targetId,
      amount: event.amount,
      damageType: event.damageType,
      isCritical: event.isCritical,
    },
  };
}

function formatHeal(
  event: HealEvent,
  resolveName: EntityNameResolver,
): CombatLogEntry {
  const source = resolveName(event.sourceId);
  const target = resolveName(event.targetId);
  const prefix = event.sourceId === event.targetId ? "restores" : "heals";
  return {
    id: event.id,
    tick: event.tick,
    timestamp: event.timestamp,
    type: event.type,
    text: `${emoji.heal} ${source} ${prefix} ${target} for ${event.amount} HP.`,
    details: {
      sourceId: event.sourceId,
      targetId: event.targetId,
      amount: event.amount,
      healType: event.healType,
    },
  };
}

function formatSkill(
  event: SkillUsedEvent,
  resolveName: EntityNameResolver,
): CombatLogEntry {
  const user = resolveName(event.entityId);
  const target = event.targetId ? resolveName(event.targetId) : "self";
  const costParts = [];
  if (event.cost?.mana) costParts.push(`${event.cost.mana} MP`);
  if (event.cost?.stamina) costParts.push(`${event.cost.stamina} ST`);
  if (event.cost?.actionPoints) costParts.push(`${event.cost.actionPoints} AP`);
  const costText = costParts.length ? ` (cost ${costParts.join(", ")})` : "";
  return {
    id: event.id,
    tick: event.tick,
    timestamp: event.timestamp,
    type: event.type,
    text: `${emoji.skill} ${user} uses ${event.skillId} on ${target}${costText}.`,
    details: {
      casterId: event.entityId,
      targetId: event.targetId,
      cost: event.cost,
    },
  };
}

function formatEffectApplied(
  event: EffectAppliedEvent,
  resolveName: EntityNameResolver,
): CombatLogEntry {
  const entity = resolveName(event.entityId);
  const source = resolveName(event.sourceId);
  const stacks = event.stacks > 1 ? ` (x${event.stacks})` : "";
  return {
    id: event.id,
    tick: event.tick,
    timestamp: event.timestamp,
    type: event.type,
    text: `${emoji.effect} ${entity} gains ${event.effectId} from ${source}${stacks}.`,
    details: {
      entityId: event.entityId,
      sourceId: event.sourceId,
      effectId: event.effectId,
      stacks: event.stacks,
    },
  };
}

function formatEffectRemoved(
  event: EffectRemovedEvent,
  resolveName: EntityNameResolver,
): CombatLogEntry {
  const entity = resolveName(event.entityId);
  return {
    id: event.id,
    tick: event.tick,
    timestamp: event.timestamp,
    type: event.type,
    text: `${emoji.removeEffect} ${event.effectId} ends on ${entity} (${event.reason}).`,
    details: {
      entityId: event.entityId,
      effectId: event.effectId,
      reason: event.reason,
    },
  };
}

function formatStatChanged(
  event: StatChangedEvent,
  resolveName: EntityNameResolver,
): CombatLogEntry {
  const entity = resolveName(event.entityId);
  return {
    id: event.id,
    tick: event.tick,
    timestamp: event.timestamp,
    type: event.type,
    text: `${emoji.stat} ${entity}'s ${event.stat} changes from ${event.oldValue} to ${event.newValue} (${event.reason}).`,
    details: {
      entityId: event.entityId,
      stat: event.stat,
      oldValue: event.oldValue,
      newValue: event.newValue,
      reason: event.reason,
    },
  };
}

function formatDeath(
  event: EntityDeathEvent,
  resolveName: EntityNameResolver,
): CombatLogEntry {
  const victim = resolveName(event.entityId);
  const killer = event.killerId ? resolveName(event.killerId) : "unknown";
  return {
    id: event.id,
    tick: event.tick,
    timestamp: event.timestamp,
    type: event.type,
    text: `${emoji.death} ${victim} is slain by ${killer} (${event.deathCause}).`,
    details: {
      entityId: event.entityId,
      killerId: event.killerId,
      deathCause: event.deathCause,
    },
  };
}

function formatAP(
  event: APGainedEvent | APSpentEvent,
  resolveName: EntityNameResolver,
): CombatLogEntry {
  const entity = resolveName(event.entityId);
  const gain = event.type === "APGained";
  const amount = (event as APGainedEvent).amount;
  const totalOrRemaining = gain
    ? (event as APGainedEvent).total
    : (event as APSpentEvent).remaining;
  const suffix = gain ? "total" : "remaining";
  const reason = !gain ? (event as APSpentEvent).reason || "action" : undefined;
  const prefix = gain ? "gains" : "spends";
  const base = `${emoji.ap} ${entity} ${prefix} ${amount} AP (${suffix}: ${totalOrRemaining})`;
  const text = reason && !gain ? `${base} for ${reason}.` : `${base}.`;
  return {
    id: event.id,
    tick: event.tick,
    timestamp: event.timestamp,
    type: event.type,
    text,
    details: {
      entityId: event.entityId,
      amount,
      totalOrRemaining,
      reason,
    },
  };
}

function formatCombatAction(event: CombatActionEvent): CombatLogEntry {
  return {
    id: event.id,
    tick: event.tick,
    timestamp: event.timestamp,
    type: event.type,
    text: `${emoji.combatAction} ${event.action}`,
    details: {
      result: event.result,
    },
  };
}

function formatFallback(event: Event): CombatLogEntry {
  return {
    id: event.id,
    tick: event.tick,
    timestamp: event.timestamp,
    type: event.type,
    text: `${emoji.error} ${event.type} event recorded (details available).`,
    details: event as Record<string, unknown>,
  };
}

export function serializeEvent(
  event: Event,
  options: SerializerOptions = {},
): CombatLogEntry {
  const resolveName = options.resolveName ?? defaultResolver;
  switch (event.type) {
    case "Damage":
      return formatDamage(event as DamageEvent, resolveName);
    case "Heal":
      return formatHeal(event as HealEvent, resolveName);
    case "SkillUsed":
      return formatSkill(event as SkillUsedEvent, resolveName);
    case "EffectApplied":
      return formatEffectApplied(event as EffectAppliedEvent, resolveName);
    case "EffectRemoved":
      return formatEffectRemoved(event as EffectRemovedEvent, resolveName);
    case "StatChanged":
      return formatStatChanged(event as StatChangedEvent, resolveName);
    case "EntityDeath":
      return formatDeath(event as EntityDeathEvent, resolveName);
    case "APGained":
    case "APSpent":
      return formatAP(event as APGainedEvent | APSpentEvent, resolveName);
    case "CombatAction":
      return formatCombatAction(event as CombatActionEvent);
    default:
      return formatFallback(event);
  }
}

export function serializeEvents(
  events: Event[],
  options: SerializerOptions = {},
): CombatLogEntry[] {
  const includeDetails = options.includeDetails ?? true;
  return events
    .map((event) => serializeEvent(event, options))
    .map((entry) =>
      includeDetails
        ? entry
        : {
            ...entry,
            details: undefined,
          },
    );
}

export type { CombatLogEntry, SerializerOptions, EntityNameResolver };
