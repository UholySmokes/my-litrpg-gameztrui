import {
  Command,
  DamageEvent,
  Effect,
  Entity,
  EntityDeathEvent,
  EntityId,
  Event,
  HealEvent,
  SkillUsedEvent,
  StateChangedEvent,
  StatBlock,
  StatChangedEvent,
  Tick,
  UseItemCommand,
  UseSkillCommand,
  MoveCommand,
  EquipItemCommand,
  RestCommand,
} from "../types/core";
import { spendActionPoints } from "./ActionScheduler";
import { applyEffect as applySimulationEffect } from "../effects/EffectEngine";
import { getSkillById } from "../../systems/skills/SkillRegistry.js";
import {
  STACKING_RULES,
  getEffectDefinition,
} from "../../systems/effects/EffectRegistry.js";

export type ActionResolutionContext = {
  tick: Tick;
  timestamp: number;
  rng: () => number;
};

export type ActionResolutionResult = {
  success: boolean;
  reason?: string;
  entities: Map<EntityId, Entity>;
  events: Event[];
};

type ActionCost = {
  mana?: number;
  stamina?: number;
  actionPoints?: number;
  cooldownTicks?: number;
};

const DEFAULT_COSTS: Record<string, ActionCost> = {
  UseSkill: {
    mana: 5,
    stamina: 2,
    actionPoints: 1,
    cooldownTicks: 3,
  },
  Move: {
    actionPoints: 1,
  },
  EquipItem: {
    actionPoints: 1,
  },
  UseItem: {
    actionPoints: 1,
  },
  Rest: {
    actionPoints: 1,
  },
};

function cloneEntity(entity: Entity): Entity {
  return {
    ...entity,
    stats: {
      ...entity.stats,
      health: { ...entity.stats.health },
      mana: { ...entity.stats.mana },
      stamina: { ...entity.stats.stamina },
    },
    position: { ...entity.position },
    effects: [...entity.effects],
    equipment: [...entity.equipment],
    cooldowns: [...entity.cooldowns],
    tags: [...entity.tags],
  };
}

function createEventId(
  prefix: string,
  tick: Tick,
  commandId: string,
  index: number,
): string {
  return `${prefix}_${tick}_${commandId}_${index}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

type SkillEffectConfig = {
  id: string;
  target?: "self" | "ally" | "enemy" | string;
  duration?: number;
  chance?: number;
  stacks?: number;
  maxStacks?: number;
  stacking?: string;
  stackingRule?: Effect["stackingRule"];
  modifiers?: {
    statModifiers?: Partial<StatBlock>;
    damagePerTick?: number;
    healingPerTick?: number;
  };
  magnitude?: number;
  damagePerTick?: number;
  healingPerTick?: number;
  tags?: string[];
};

type SkillDefinition = {
  id: string;
  effects?: SkillEffectConfig[];
};

function mapStackingRule(
  stacking?: string,
  fallback: Effect["stackingRule"] = "refresh",
): Effect["stackingRule"] {
  switch (stacking) {
    case STACKING_RULES.STACK_DURATION:
      return "add";
    case STACKING_RULES.STACK_INTENSITY:
      return "merge";
    case STACKING_RULES.INDEPENDENT:
    case STACKING_RULES.DONT_STACK:
      return "refresh";
    default:
      return fallback;
  }
}

function mergeStatModifiers(
  base?: Partial<StatBlock>,
  overrides?: Partial<StatBlock>,
): Partial<StatBlock> | undefined {
  const merged: Partial<StatBlock> = { ...(base || {}) };
  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      if (typeof value === "number") {
        (merged as any)[key] = value;
      }
    }
  }
  return Object.keys(merged).length ? merged : undefined;
}

function convertSkillEffectToSimulationEffect(
  effectConfig: SkillEffectConfig,
  commandId: string,
  effectIndex: number,
  sourceId: EntityId,
): Effect | null {
  if (!effectConfig?.id) {
    return null;
  }

  const template = getEffectDefinition(effectConfig.id) || null;
  const templateTags = Array.isArray((template as any)?.tags)
    ? ((template as any).tags as string[])
    : [];
  const stackingBehavior =
    effectConfig.stacking || template?.stacking || STACKING_RULES.DONT_STACK;
  const stackingRule = mapStackingRule(
    effectConfig.stackingRule || stackingBehavior,
  );
  const isIndependent = stackingBehavior === STACKING_RULES.INDEPENDENT;
  const baseEffectId = effectConfig.id;
  const effectId = isIndependent
    ? `${baseEffectId}_${commandId}_${effectIndex}`
    : baseEffectId;

  const duration = Number.isFinite(effectConfig.duration)
    ? Number(effectConfig.duration)
    : Number.isFinite(template?.duration)
      ? Number(template?.duration)
      : 1;
  const stacks = Number.isFinite(effectConfig.stacks)
    ? Number(effectConfig.stacks)
    : 1;
  const maxStacksCandidate =
    effectConfig.maxStacks ?? (template as any)?.maxStacks;
  const maxStacks = Number.isFinite(maxStacksCandidate)
    ? Number(maxStacksCandidate)
    : stacks;

  const resolvedDamage =
    effectConfig.modifiers?.damagePerTick ??
    effectConfig.damagePerTick ??
    (template?.type === "DOT" ? template?.magnitude : undefined) ??
    effectConfig.magnitude;
  const resolvedHealing =
    effectConfig.modifiers?.healingPerTick ??
    effectConfig.healingPerTick ??
    (template?.type === "HOT" ? template?.magnitude : undefined);

  const statModifiers = mergeStatModifiers(
    (template as any)?.statModifiers,
    effectConfig.modifiers?.statModifiers,
  );

  return {
    id: effectId,
    name: template?.name || baseEffectId,
    duration,
    stacks,
    maxStacks: Math.max(stacks, maxStacks),
    source: sourceId,
    stackingRule,
    modifiers: {
      statModifiers,
      damagePerTick: Number(resolvedDamage ?? 0),
      healingPerTick: Number(resolvedHealing ?? 0),
    },
    tags: [...new Set([...templateTags, ...(effectConfig.tags || [])])],
  };
}

function applySkillEffects(
  skill: SkillDefinition,
  attacker: Entity,
  target: Entity,
  ctx: ActionResolutionContext,
  command: UseSkillCommand,
  events: Event[],
): { attacker: Entity; target: Entity } {
  if (!skill || !Array.isArray(skill.effects) || skill.effects.length === 0) {
    return { attacker, target };
  }

  let updatedAttacker = attacker;
  let updatedTarget = target;
  let effectIndex = 0;

  for (const effectConfig of skill.effects) {
    if (!effectConfig?.id) {
      continue;
    }

    const chance =
      typeof effectConfig.chance === "number"
        ? clamp(effectConfig.chance, 0, 1)
        : 1;
    if (ctx.rng() > chance) {
      continue;
    }

    const applyToSelf = effectConfig.target === "self";
    const destination = applyToSelf ? updatedAttacker : updatedTarget;
    if (!destination) {
      continue;
    }

    const converted = convertSkillEffectToSimulationEffect(
      effectConfig,
      command.id,
      effectIndex++,
      attacker.id,
    );
    if (!converted) {
      continue;
    }

    const result = applySimulationEffect(
      destination,
      converted,
      ctx.tick,
      ctx.timestamp,
      attacker.id,
    );

    if (result.events.length > 0) {
      events.push(...result.events);
    }

    if (destination.id === updatedAttacker.id) {
      updatedAttacker = result.entity;
      if (updatedTarget.id === updatedAttacker.id) {
        updatedTarget = updatedAttacker;
      }
    } else if (destination.id === updatedTarget.id) {
      updatedTarget = result.entity;
    }
  }

  return { attacker: updatedAttacker, target: updatedTarget };
}

function applyResourceCost(
  entity: Entity,
  resource: "mana" | "stamina",
  amount: number,
  tick: Tick,
  timestamp: number,
  commandId: string,
  events: Event[],
  reason: string,
  indexRef: { value: number },
): Entity {
  const current = entity.stats[resource].current;
  const next = clamp(current - amount, 0, entity.stats[resource].maximum);
  if (next !== current) {
    events.push({
      id: createEventId("stat", tick, commandId, indexRef.value++),
      type: "StatChanged",
      tick,
      timestamp,
      entityId: entity.id,
      stat: resource,
      oldValue: current,
      newValue: next,
      reason,
    } as StatChangedEvent);
  }

  return {
    ...entity,
    stats: {
      ...entity.stats,
      [resource]: {
        ...entity.stats[resource],
        current: next,
      },
    },
  };
}

function applyDamage(
  source: Entity,
  target: Entity,
  amount: number,
  isCritical: boolean,
  tick: Tick,
  timestamp: number,
  commandId: string,
  events: Event[],
  indexRef: { value: number },
  damageType = "skill",
): Entity {
  const currentHp = target.stats.health.current;
  const nextHp = Math.max(0, currentHp - amount);
  const updatedTarget = {
    ...target,
    stats: {
      ...target.stats,
      health: {
        ...target.stats.health,
        current: nextHp,
      },
    },
  };

  events.push({
    id: createEventId("damage", tick, commandId, indexRef.value++),
    type: "Damage",
    tick,
    timestamp,
    entityId: target.id,
    sourceId: source.id,
    targetId: target.id,
    amount,
    damageType,
    isCritical,
  } as DamageEvent);

  if (nextHp <= 0 && !target.isDead) {
    events.push({
      id: createEventId("death", tick, commandId, indexRef.value++),
      type: "EntityDeath",
      tick,
      timestamp,
      entityId: target.id,
      killerId: source.id,
      deathCause: damageType,
    } as EntityDeathEvent);

    return {
      ...updatedTarget,
      isDead: true,
    };
  }

  return updatedTarget;
}

function applyHealing(
  source: Entity,
  target: Entity,
  amount: number,
  tick: Tick,
  timestamp: number,
  commandId: string,
  events: Event[],
  indexRef: { value: number },
  healType = "rest",
): Entity {
  const currentHp = target.stats.health.current;
  const nextHp = clamp(currentHp + amount, 0, target.stats.health.maximum);
  if (nextHp !== currentHp) {
    events.push({
      id: createEventId("heal", tick, commandId, indexRef.value++),
      type: "Heal",
      tick,
      timestamp,
      entityId: target.id,
      sourceId: source.id,
      targetId: target.id,
      amount: nextHp - currentHp,
      healType,
    } as HealEvent);
  }

  return {
    ...target,
    stats: {
      ...target.stats,
      health: {
        ...target.stats.health,
        current: nextHp,
      },
    },
  };
}

function checkCosts(
  entity: Entity,
  cost: ActionCost,
): { ok: boolean; reason?: string } {
  if (cost.mana && entity.stats.mana.current < cost.mana) {
    return { ok: false, reason: "Insufficient mana" };
  }
  if (cost.stamina && entity.stats.stamina.current < cost.stamina) {
    return { ok: false, reason: "Insufficient stamina" };
  }
  if (cost.actionPoints && entity.actionPoints < cost.actionPoints) {
    return { ok: false, reason: "Insufficient action points" };
  }
  return { ok: true };
}

function applyActionPoints(
  entities: Map<EntityId, Entity>,
  entityId: EntityId,
  cost: ActionCost,
  tick: Tick,
  timestamp: number,
  events: Event[],
  reason: string,
): Map<EntityId, Entity> {
  if (!cost.actionPoints) {
    return entities;
  }

  const { entities: updated, event } = spendActionPoints(
    entities,
    entityId,
    cost.actionPoints,
    tick,
    timestamp,
    reason,
  );

  if (event) {
    events.push(event);
  }

  return updated;
}

export function resolveUseSkillCommand(
  command: UseSkillCommand,
  entities: Map<EntityId, Entity>,
  ctx: ActionResolutionContext,
): ActionResolutionResult {
  const events: Event[] = [];
  const indexRef = { value: 0 };
  const attacker = entities.get(command.entityId);
  const targetId = command.targetId ?? command.entityId;
  const target = entities.get(targetId);

  if (!attacker || !target) {
    return {
      success: false,
      reason: "Missing attacker or target",
      entities,
      events,
    };
  }

  const skill = getSkillById(command.skillId) as SkillDefinition | null;
  if (!skill) {
    return {
      success: false,
      reason: `Unknown skill: ${command.skillId}`,
      entities,
      events,
    };
  }

  const cost = DEFAULT_COSTS.UseSkill;
  const costCheck = checkCosts(attacker, cost);
  if (!costCheck.ok) {
    return {
      success: false,
      reason: costCheck.reason,
      entities,
      events,
    };
  }

  let updatedEntities = new Map(entities);
  let updatedAttacker = cloneEntity(attacker);
  let updatedTarget =
    attacker.id === target.id ? updatedAttacker : cloneEntity(target);

  if (cost.mana) {
    updatedAttacker = applyResourceCost(
      updatedAttacker,
      "mana",
      cost.mana,
      ctx.tick,
      ctx.timestamp,
      command.id,
      events,
      "skill_cost",
      indexRef,
    );
  }
  if (cost.stamina) {
    updatedAttacker = applyResourceCost(
      updatedAttacker,
      "stamina",
      cost.stamina,
      ctx.tick,
      ctx.timestamp,
      command.id,
      events,
      "skill_cost",
      indexRef,
    );
  }

  updatedEntities.set(updatedAttacker.id, updatedAttacker);
  updatedEntities = applyActionPoints(
    updatedEntities,
    updatedAttacker.id,
    cost,
    ctx.tick,
    ctx.timestamp,
    events,
    "skill",
  );
  updatedAttacker = updatedEntities.get(updatedAttacker.id) ?? updatedAttacker;

  const attackPower =
    updatedAttacker.stats.attackPower + updatedAttacker.stats.strength * 0.5;
  const defense =
    updatedTarget.stats.defense + updatedTarget.stats.constitution * 0.3;
  const baseDamage = Math.max(1, Math.floor(attackPower - defense * 0.5));
  const critChance = clamp(updatedAttacker.stats.criticalChance ?? 0, 0, 1);
  const isCritical = ctx.rng() < critChance;
  const critMultiplier = updatedAttacker.stats.criticalMultiplier || 1.5;
  const finalDamage = Math.max(
    0,
    Math.floor(baseDamage * (isCritical ? critMultiplier : 1)),
  );

  updatedTarget = applyDamage(
    updatedAttacker,
    updatedTarget,
    finalDamage,
    isCritical,
    ctx.tick,
    ctx.timestamp,
    command.id,
    events,
    indexRef,
  );

  const cooldowns = updatedAttacker.cooldowns.filter(
    (cooldown) => cooldown.skillId !== command.skillId,
  );
  if (cost.cooldownTicks) {
    cooldowns.push({
      skillId: command.skillId,
      remainingTicks: cost.cooldownTicks,
      totalTicks: cost.cooldownTicks,
    });
  }

  if (updatedAttacker.id === updatedTarget.id) {
    updatedTarget = {
      ...updatedTarget,
      cooldowns,
    };
    updatedAttacker = updatedTarget;
  } else {
    updatedAttacker = {
      ...updatedAttacker,
      cooldowns,
    };
  }

  const effectResults = applySkillEffects(
    skill,
    updatedAttacker,
    updatedTarget,
    ctx,
    command,
    events,
  );
  updatedAttacker = effectResults.attacker;
  updatedTarget = effectResults.target;

  events.push({
    id: createEventId("skill", ctx.tick, command.id, indexRef.value++),
    type: "SkillUsed",
    tick: ctx.tick,
    timestamp: ctx.timestamp,
    entityId: updatedAttacker.id,
    skillId: command.skillId,
    targetId: updatedTarget.id,
    cost: {
      mana: cost.mana,
      stamina: cost.stamina,
      actionPoints: cost.actionPoints,
    },
  } as SkillUsedEvent);

  updatedEntities.set(updatedAttacker.id, updatedAttacker);
  updatedEntities.set(updatedTarget.id, updatedTarget);

  return {
    success: true,
    entities: updatedEntities,
    events,
  };
}

export function resolveMoveCommand(
  command: MoveCommand,
  entities: Map<EntityId, Entity>,
  ctx: ActionResolutionContext,
): ActionResolutionResult {
  const events: Event[] = [];
  const actor = entities.get(command.entityId);
  if (!actor) {
    return { success: false, reason: "Missing entity", entities, events };
  }

  const cost = DEFAULT_COSTS.Move;
  const costCheck = checkCosts(actor, cost);
  if (!costCheck.ok) {
    return { success: false, reason: costCheck.reason, entities, events };
  }

  let updatedEntities = new Map(entities);
  const updatedActor = {
    ...cloneEntity(actor),
    position: { ...command.toPosition },
  };
  updatedEntities.set(updatedActor.id, updatedActor);

  updatedEntities = applyActionPoints(
    updatedEntities,
    updatedActor.id,
    cost,
    ctx.tick,
    ctx.timestamp,
    events,
    "move",
  );

  events.push({
    id: createEventId("move", ctx.tick, command.id, 0),
    type: "StateChanged",
    tick: ctx.tick,
    timestamp: ctx.timestamp,
    entityId: updatedActor.id,
    actionType: "Move",
    changes: {
      from: command.fromPosition,
      to: command.toPosition,
    },
    description: "Entity moved",
  } as StateChangedEvent);

  return {
    success: true,
    entities: updatedEntities,
    events,
  };
}

export function resolveEquipItemCommand(
  command: EquipItemCommand,
  entities: Map<EntityId, Entity>,
  ctx: ActionResolutionContext,
): ActionResolutionResult {
  const events: Event[] = [];
  const actor = entities.get(command.entityId);
  if (!actor) {
    return { success: false, reason: "Missing entity", entities, events };
  }

  const cost = DEFAULT_COSTS.EquipItem;
  const costCheck = checkCosts(actor, cost);
  if (!costCheck.ok) {
    return { success: false, reason: costCheck.reason, entities, events };
  }

  const equipment = actor.equipment.filter(
    (item) => item.slot !== command.slot,
  );
  equipment.push({ slot: command.slot, itemId: command.itemId });

  let updatedEntities = new Map(entities);
  const updatedActor = {
    ...cloneEntity(actor),
    equipment,
  };
  updatedEntities.set(updatedActor.id, updatedActor);

  updatedEntities = applyActionPoints(
    updatedEntities,
    updatedActor.id,
    cost,
    ctx.tick,
    ctx.timestamp,
    events,
    "equip",
  );

  events.push({
    id: createEventId("equip", ctx.tick, command.id, 0),
    type: "StateChanged",
    tick: ctx.tick,
    timestamp: ctx.timestamp,
    entityId: updatedActor.id,
    actionType: "EquipItem",
    changes: {
      itemId: command.itemId,
      slot: command.slot,
    },
    description: "Item equipped",
  } as StateChangedEvent);

  return {
    success: true,
    entities: updatedEntities,
    events,
  };
}

export function resolveUseItemCommand(
  command: UseItemCommand,
  entities: Map<EntityId, Entity>,
  ctx: ActionResolutionContext,
): ActionResolutionResult {
  const events: Event[] = [];
  const actor = entities.get(command.entityId);
  const targetId = command.targetId ?? command.entityId;
  const target = entities.get(targetId);
  if (!actor || !target) {
    return { success: false, reason: "Missing entity", entities, events };
  }

  const cost = DEFAULT_COSTS.UseItem;
  const costCheck = checkCosts(actor, cost);
  if (!costCheck.ok) {
    return { success: false, reason: costCheck.reason, entities, events };
  }

  let updatedEntities = new Map(entities);
  let updatedActor = cloneEntity(actor);
  let updatedTarget =
    actor.id === target.id ? updatedActor : cloneEntity(target);
  const indexRef = { value: 0 };

  const healthGain = Math.max(
    1,
    Math.floor(updatedTarget.stats.health.maximum * 0.1),
  );
  updatedTarget = applyHealing(
    updatedActor,
    updatedTarget,
    healthGain,
    ctx.tick,
    ctx.timestamp,
    command.id,
    events,
    indexRef,
    "item",
  );

  const manaGain = Math.max(
    1,
    Math.floor(updatedTarget.stats.mana.maximum * 0.05),
  );
  const manaBefore = updatedTarget.stats.mana.current;
  const manaAfter = clamp(
    manaBefore + manaGain,
    0,
    updatedTarget.stats.mana.maximum,
  );
  if (manaAfter !== manaBefore) {
    events.push({
      id: createEventId("stat", ctx.tick, command.id, indexRef.value++),
      type: "StatChanged",
      tick: ctx.tick,
      timestamp: ctx.timestamp,
      entityId: updatedTarget.id,
      stat: "mana",
      oldValue: manaBefore,
      newValue: manaAfter,
      reason: "item",
    } as StatChangedEvent);
  }
  updatedTarget = {
    ...updatedTarget,
    stats: {
      ...updatedTarget.stats,
      mana: {
        ...updatedTarget.stats.mana,
        current: manaAfter,
      },
    },
  };

  updatedEntities.set(updatedTarget.id, updatedTarget);
  updatedEntities = applyActionPoints(
    updatedEntities,
    updatedActor.id,
    cost,
    ctx.tick,
    ctx.timestamp,
    events,
    "item",
  );

  updatedActor = updatedEntities.get(updatedActor.id) ?? updatedActor;
  updatedEntities.set(updatedActor.id, updatedActor);

  return {
    success: true,
    entities: updatedEntities,
    events,
  };
}

export function resolveRestCommand(
  command: RestCommand,
  entities: Map<EntityId, Entity>,
  ctx: ActionResolutionContext,
): ActionResolutionResult {
  const events: Event[] = [];
  const actor = entities.get(command.entityId);
  if (!actor) {
    return { success: false, reason: "Missing entity", entities, events };
  }

  const cost = DEFAULT_COSTS.Rest;
  const costCheck = checkCosts(actor, cost);
  if (!costCheck.ok) {
    return { success: false, reason: costCheck.reason, entities, events };
  }

  const duration = Math.max(1, Math.floor(command.duration || 1));
  let updatedActor = cloneEntity(actor);

  const healthGain = Math.max(
    1,
    Math.floor(updatedActor.stats.health.maximum * 0.1) * duration,
  );
  const manaGain = Math.max(
    1,
    Math.floor(updatedActor.stats.mana.maximum * 0.1) * duration,
  );
  const staminaGain = Math.max(
    1,
    Math.floor(updatedActor.stats.stamina.maximum * 0.15) * duration,
  );

  const indexRef = { value: 0 };
  updatedActor = applyHealing(
    updatedActor,
    updatedActor,
    healthGain,
    ctx.tick,
    ctx.timestamp,
    command.id,
    events,
    indexRef,
    "rest",
  );

  updatedActor = applyResourceCost(
    updatedActor,
    "mana",
    -manaGain,
    ctx.tick,
    ctx.timestamp,
    command.id,
    events,
    "rest",
    indexRef,
  );

  updatedActor = applyResourceCost(
    updatedActor,
    "stamina",
    -staminaGain,
    ctx.tick,
    ctx.timestamp,
    command.id,
    events,
    "rest",
    indexRef,
  );

  let updatedEntities = new Map(entities);
  updatedEntities.set(updatedActor.id, updatedActor);
  updatedEntities = applyActionPoints(
    updatedEntities,
    updatedActor.id,
    cost,
    ctx.tick,
    ctx.timestamp,
    events,
    "rest",
  );

  return {
    success: true,
    entities: updatedEntities,
    events,
  };
}

export function resolveCommand(
  command: Command,
  entities: Map<EntityId, Entity>,
  ctx: ActionResolutionContext,
): ActionResolutionResult {
  switch (command.type) {
    case "UseSkill":
      return resolveUseSkillCommand(command as UseSkillCommand, entities, ctx);
    case "Move":
      return resolveMoveCommand(command as MoveCommand, entities, ctx);
    case "EquipItem":
      return resolveEquipItemCommand(
        command as EquipItemCommand,
        entities,
        ctx,
      );
    case "UseItem":
      return resolveUseItemCommand(command as UseItemCommand, entities, ctx);
    case "Rest":
      return resolveRestCommand(command as RestCommand, entities, ctx);
    default:
      return {
        success: false,
        reason: "Unknown command",
        entities,
        events: [],
      };
  }
}
