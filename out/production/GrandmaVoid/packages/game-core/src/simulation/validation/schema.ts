/**
 * Schema validation for core simulation types
 * Ensures data integrity within the simulation boundary
 */

import {
  Entity,
  Command,
  Event,
  SimulationState,
  SimulationSnapshot,
  Tick,
  WorldState,
  Zone,
  StatBlock,
  Effect,
  ValidationError,
  ValidationResult,
} from "../types/core";

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export class ValidationErrorCollector {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];

  addError(field: string, code: string, message: string): void {
    this.errors.push({ field, code, message, severity: "error" });
  }

  addWarning(field: string, code: string, message: string): void {
    this.warnings.push({ field, code, message, severity: "warning" });
  }

  getResult(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings],
    };
  }

  reset(): void {
    this.errors = [];
    this.warnings = [];
  }
}

// ============================================================================
// BASIC TYPE VALIDATORS
// ============================================================================

export function validateString(
  value: unknown,
  fieldName: string,
  collector: ValidationErrorCollector,
): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    collector.addError(
      fieldName,
      "INVALID_STRING",
      `${fieldName} must be a non-empty string`,
    );
    return null;
  }
  return value;
}

export function validateNumber(
  value: unknown,
  fieldName: string,
  collector: ValidationErrorCollector,
  min?: number,
  max?: number,
): number | null {
  if (typeof value !== "number" || !isFinite(value)) {
    collector.addError(
      fieldName,
      "INVALID_NUMBER",
      `${fieldName} must be a valid number`,
    );
    return null;
  }

  if (min !== undefined && value < min) {
    collector.addError(
      fieldName,
      "BELOW_MINIMUM",
      `${fieldName} must be at least ${min}`,
    );
    return null;
  }

  if (max !== undefined && value > max) {
    collector.addError(
      fieldName,
      "ABOVE_MAXIMUM",
      `${fieldName} must be at most ${max}`,
    );
    return null;
  }

  return value;
}

export function validatePositiveNumber(
  value: unknown,
  fieldName: string,
  collector: ValidationErrorCollector,
): number | null {
  return validateNumber(value, fieldName, collector, 0);
}

export function validateTick(
  value: unknown,
  fieldName: string,
  collector: ValidationErrorCollector,
): number | null {
  return validateNumber(value, fieldName, collector, 0);
}

export function validateMap(
  value: unknown,
  fieldName: string,
  collector: ValidationErrorCollector,
): Map<any, any> | null {
  if (value instanceof Map) {
    return value;
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    collector.addWarning(
      fieldName,
      "COERCE_MAP",
      `${fieldName} should be a Map; converting from plain object`,
    );
    return new Map(Object.entries(value as Record<string, unknown>));
  }

  collector.addError(fieldName, "INVALID_MAP", `${fieldName} must be a Map`);
  return null;
}

export function validateStringArray(
  value: unknown,
  fieldName: string,
  collector: ValidationErrorCollector,
): string[] | null {
  if (!Array.isArray(value)) {
    collector.addError(
      fieldName,
      "INVALID_ARRAY",
      `${fieldName} must be an array of strings`,
    );
    return null;
  }

  const invalidIndex = value.findIndex((item) => typeof item !== "string");
  if (invalidIndex !== -1) {
    collector.addError(
      `${fieldName}[${invalidIndex}]`,
      "INVALID_STRING",
      `${fieldName} must contain only strings`,
    );
    return null;
  }

  return value as string[];
}

// ============================================================================
// RESOURCE VALIDATION
// ============================================================================

export function validateResource(
  resource: unknown,
  fieldName: string,
  collector: ValidationErrorCollector,
) {
  if (!resource || typeof resource !== "object") {
    collector.addError(
      fieldName,
      "INVALID_RESOURCE",
      `${fieldName} must be an object`,
    );
    return null;
  }

  const obj = resource as any;
  const current = validateNumber(
    obj.current,
    `${fieldName}.current`,
    collector,
    0,
  );
  const maximum = validateNumber(
    obj.maximum,
    `${fieldName}.maximum`,
    collector,
    1,
  );

  if (current !== null && maximum !== null && current > maximum) {
    collector.addError(
      fieldName,
      "CURRENT_EXCEEDS_MAXIMUM",
      "Current value cannot exceed maximum",
    );
    return null;
  }

  if (current !== null && maximum !== null) {
    return { current, maximum };
  }

  return null;
}

// ============================================================================
// STAT BLOCK VALIDATION
// ============================================================================

export function validateStatBlock(
  stats: unknown,
  fieldName: string,
  collector: ValidationErrorCollector,
): StatBlock | null {
  if (!stats || typeof stats !== "object") {
    collector.addError(
      fieldName,
      "INVALID_STAT_BLOCK",
      `${fieldName} must be an object`,
    );
    return null;
  }

  const obj = stats as any;
  const result: Partial<StatBlock> = {};

  // Primary stats (1-1000 range)
  const primaryStats = [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
  ] as const;
  type PrimaryStat = (typeof primaryStats)[number];
  for (const stat of primaryStats) {
    const value = validateNumber(
      obj[stat],
      `${fieldName}.${stat}`,
      collector,
      1,
      1000,
    );
    if (value !== null) {
      result[stat as PrimaryStat] = value;
    }
  }

  // Resources
  const resourceStats = ["health", "mana", "stamina"] as const;
  type ResourceStat = (typeof resourceStats)[number];
  for (const stat of resourceStats) {
    const resource = validateResource(
      obj[stat],
      `${fieldName}.${stat}`,
      collector,
    );
    if (resource) {
      result[stat as ResourceStat] = resource;
    }
  }

  // Combat stats (0+ range)
  const combatStats = [
    "attackPower",
    "defense",
    "speed",
    "criticalChance",
    "criticalMultiplier",
    "evasion",
    "accuracy",
  ] as const;
  type CombatStat = (typeof combatStats)[number];
  for (const stat of combatStats) {
    const value = validatePositiveNumber(
      obj[stat],
      `${fieldName}.${stat}`,
      collector,
    );
    if (value !== null) {
      result[stat as CombatStat] = value;
    }
  }

  // Special validation for critical chance (0-1)
  const critChance = validateNumber(
    obj.criticalChance,
    `${fieldName}.criticalChance`,
    collector,
    0,
    1,
  );
  if (critChance !== null) {
    result.criticalChance = critChance;
  }

  // Check if all required fields are present
  const requiredFields = [...primaryStats, ...resourceStats, ...combatStats];
  const missingFields = requiredFields.filter((field) => !(field in result));

  if (missingFields.length > 0) {
    collector.addError(
      fieldName,
      "MISSING_FIELDS",
      `Missing required stat fields: ${missingFields.join(", ")}`,
    );
    return null;
  }

  return result as StatBlock;
}

// ============================================================================
// EFFECT VALIDATION
// ============================================================================

export function validateEffect(
  effect: unknown,
  fieldName: string,
  collector: ValidationErrorCollector,
): Effect | null {
  if (!effect || typeof effect !== "object") {
    collector.addError(
      fieldName,
      "INVALID_EFFECT",
      `${fieldName} must be an object`,
    );
    return null;
  }

  const obj = effect as any;
  const result: Partial<Effect> = {};

  const id = validateString(obj.id, `${fieldName}.id`, collector);
  if (id !== null) {
    result.id = id;
  }
  const name = validateString(obj.name, `${fieldName}.name`, collector);
  if (name !== null) {
    result.name = name;
  }
  const duration = validateTick(
    obj.duration,
    `${fieldName}.duration`,
    collector,
  );
  if (duration !== null) {
    result.duration = duration;
  }
  const stacks = validatePositiveNumber(
    obj.stacks,
    `${fieldName}.stacks`,
    collector,
  );
  if (stacks !== null) {
    result.stacks = stacks;
  }
  const maxStacks = validatePositiveNumber(
    obj.maxStacks,
    `${fieldName}.maxStacks`,
    collector,
  );
  if (maxStacks !== null) {
    result.maxStacks = maxStacks;
  }
  const source = validateString(obj.source, `${fieldName}.source`, collector);
  if (source !== null) {
    result.source = source;
  }

  // Validate stacking rule
  const validStackingRules = ["refresh", "add", "replace", "merge"];
  if (validStackingRules.includes(obj.stackingRule)) {
    result.stackingRule = obj.stackingRule;
  } else {
    collector.addError(
      fieldName,
      "INVALID_STACKING_RULE",
      `Stacking rule must be one of: ${validStackingRules.join(", ")}`,
    );
  }

  // Validate tags
  if (Array.isArray(obj.tags)) {
    result.tags = obj.tags.filter((tag: any) => typeof tag === "string");
  } else {
    collector.addWarning(
      fieldName,
      "INVALID_TAGS",
      "Tags should be an array of strings",
    );
    result.tags = [];
  }

  // Validate modifiers
  if (obj.modifiers && typeof obj.modifiers === "object") {
    result.modifiers = obj.modifiers;
  } else {
    result.modifiers = {};
  }

  // Check stacks vs maxStacks
  if (result.stacks && result.maxStacks && result.stacks > result.maxStacks) {
    collector.addError(
      fieldName,
      "STACKS_EXCEED_MAXIMUM",
      "Stacks cannot exceed maxStacks",
    );
    return null;
  }

  // Check required fields
  const requiredFields = [
    "id",
    "name",
    "duration",
    "stacks",
    "maxStacks",
    "source",
    "stackingRule",
  ];
  const missingFields = requiredFields.filter((field) => !(field in result));

  if (missingFields.length > 0) {
    collector.addError(
      fieldName,
      "MISSING_FIELDS",
      `Missing required effect fields: ${missingFields.join(", ")}`,
    );
    return null;
  }

  return result as Effect;
}

// ============================================================================
// ENTITY VALIDATION
// ============================================================================

export function validateEntity(
  entity: unknown,
  fieldName: string,
  collector: ValidationErrorCollector,
): Entity | null {
  if (!entity || typeof entity !== "object") {
    collector.addError(
      fieldName,
      "INVALID_ENTITY",
      `${fieldName} must be an object`,
    );
    return null;
  }

  const obj = entity as any;
  const result: Partial<Entity> = {};

  // Basic fields
  const entityId = validateString(obj.id, `${fieldName}.id`, collector);
  if (entityId !== null) {
    result.id = entityId;
  }
  const entityName = validateString(obj.name, `${fieldName}.name`, collector);
  if (entityName !== null) {
    result.name = entityName;
  }
  const level = validateNumber(obj.level, `${fieldName}.level`, collector, 1);
  if (level !== null) {
    result.level = level;
  }
  const experience = validatePositiveNumber(
    obj.experience,
    `${fieldName}.experience`,
    collector,
  );
  if (experience !== null) {
    result.experience = experience;
  }
  const faction = validateString(
    obj.faction,
    `${fieldName}.faction`,
    collector,
  );
  if (faction !== null) {
    result.faction = faction;
  }

  // Validate entity type
  const validTypes = ["player", "enemy", "npc", "object"];
  if (validTypes.includes(obj.type)) {
    result.type = obj.type;
  } else {
    collector.addError(
      fieldName,
      "INVALID_ENTITY_TYPE",
      `Entity type must be one of: ${validTypes.join(", ")}`,
    );
  }

  // Validate stats
  const stats = validateStatBlock(obj.stats, `${fieldName}.stats`, collector);
  if (stats) {
    result.stats = stats;
  }

  // Validate position
  if (obj.position && typeof obj.position === "object") {
    const lane = validateNumber(
      obj.position.lane,
      `${fieldName}.position.lane`,
      collector,
      0,
      3,
    );
    const slot = validateNumber(
      obj.position.slot,
      `${fieldName}.position.slot`,
      collector,
      0,
      2,
    );
    if (lane !== null && slot !== null) {
      result.position = { lane, slot };
    }
  } else {
    collector.addError(
      fieldName,
      "INVALID_POSITION",
      "Position must be an object with lane and slot",
    );
  }

  // Validate action points
  const actionPoints = validatePositiveNumber(
    obj.actionPoints,
    `${fieldName}.actionPoints`,
    collector,
  );
  if (actionPoints !== null) {
    result.actionPoints = actionPoints;
  }
  const maxActionPoints = validatePositiveNumber(
    obj.maxActionPoints,
    `${fieldName}.maxActionPoints`,
    collector,
  );
  if (maxActionPoints !== null) {
    result.maxActionPoints = maxActionPoints;
  }
  const initiative = validatePositiveNumber(
    obj.initiative,
    `${fieldName}.initiative`,
    collector,
  );
  if (initiative !== null) {
    result.initiative = initiative;
  }

  // Validate arrays
  result.effects = Array.isArray(obj.effects)
    ? (obj.effects
        .map((e: any, i: number) =>
          validateEffect(e, `${fieldName}.effects[${i}]`, collector),
        )
        .filter(Boolean) as Effect[])
    : [];

  result.equipment = Array.isArray(obj.equipment) ? obj.equipment : [];
  result.cooldowns = Array.isArray(obj.cooldowns) ? obj.cooldowns : [];
  result.tags = Array.isArray(obj.tags)
    ? obj.tags.filter((t: any) => typeof t === "string")
    : [];

  // Validate boolean fields
  result.isDead = Boolean(obj.isDead);

  // Check action points vs max
  if (
    result.actionPoints &&
    result.maxActionPoints &&
    result.actionPoints > result.maxActionPoints
  ) {
    collector.addError(
      fieldName,
      "ACTION_POINTS_EXCEED_MAXIMUM",
      "Action points cannot exceed maximum",
    );
    return null;
  }

  // Check required fields
  const requiredFields = [
    "id",
    "name",
    "type",
    "level",
    "experience",
    "stats",
    "position",
    "faction",
  ];
  const missingFields = requiredFields.filter((field) => !(field in result));

  if (missingFields.length > 0) {
    collector.addError(
      fieldName,
      "MISSING_FIELDS",
      `Missing required entity fields: ${missingFields.join(", ")}`,
    );
    return null;
  }

  return result as Entity;
}

// ============================================================================
// WORLD VALIDATION
// ============================================================================

export function validateZone(
  zone: unknown,
  fieldName: string,
  collector: ValidationErrorCollector,
): Zone | null {
  if (!zone || typeof zone !== "object") {
    collector.addError(
      fieldName,
      "INVALID_ZONE",
      `${fieldName} must be an object`,
    );
    return null;
  }

  const obj = zone as any;
  const result: Partial<Zone> = {};

  const zoneId = validateString(obj.id, `${fieldName}.id`, collector);
  if (zoneId !== null) {
    result.id = zoneId;
  }
  const zoneName = validateString(obj.name, `${fieldName}.name`, collector);
  if (zoneName !== null) {
    result.name = zoneName;
  }

  const validTypes = ["combat", "exploration", "social", "safe"];
  if (validTypes.includes(obj.type)) {
    result.type = obj.type;
  } else {
    collector.addError(
      fieldName,
      "INVALID_ZONE_TYPE",
      `Zone type must be one of: ${validTypes.join(", ")}`,
    );
  }

  const connections = validateStringArray(
    obj.connections,
    `${fieldName}.connections`,
    collector,
  );
  if (connections) {
    result.connections = connections;
  }
  const defaultEntities = validateStringArray(
    obj.defaultEntities,
    `${fieldName}.defaultEntities`,
    collector,
  );
  if (defaultEntities) {
    result.defaultEntities = defaultEntities;
  }

  if (obj.environmentalEffects !== undefined) {
    const env = validateStringArray(
      obj.environmentalEffects,
      `${fieldName}.environmentalEffects`,
      collector,
    );
    if (env) {
      result.environmentalEffects = env;
    }
  }

  const requiredFields = [
    "id",
    "name",
    "type",
    "connections",
    "defaultEntities",
  ];
  const missingFields = requiredFields.filter((field) => !(field in result));

  if (missingFields.length > 0) {
    collector.addError(
      fieldName,
      "MISSING_FIELDS",
      `Missing required zone fields: ${missingFields.join(", ")}`,
    );
    return null;
  }

  return result as Zone;
}

export function validateWorldState(
  world: unknown,
  fieldName: string,
  collector: ValidationErrorCollector,
): WorldState | null {
  if (!world || typeof world !== "object") {
    collector.addError(
      fieldName,
      "INVALID_WORLD_STATE",
      `${fieldName} must be an object`,
    );
    return null;
  }

  const obj = world as any;
  const result: Partial<WorldState> = {};

  const currentTick = validateTick(
    obj.currentTick,
    `${fieldName}.currentTick`,
    collector,
  );
  if (currentTick !== null) {
    result.currentTick = currentTick;
  }
  const currentTime = validatePositiveNumber(
    obj.currentTime,
    `${fieldName}.currentTime`,
    collector,
  );
  if (currentTime !== null) {
    result.currentTime = currentTime;
  }

  const zonesMap = validateMap(obj.zones, `${fieldName}.zones`, collector);
  if (zonesMap) {
    const normalized = new Map<string, Zone>();
    zonesMap.forEach((value, key) => {
      const zoneKey = typeof key === "string" && key ? key : null;
      if (!zoneKey) {
        collector.addError(
          `${fieldName}.zones`,
          "INVALID_ZONE_KEY",
          "Zone key must be a non-empty string",
        );
        return;
      }

      const zone = validateZone(
        value,
        `${fieldName}.zones[${zoneKey}]`,
        collector,
      );
      if (zone) {
        normalized.set(zoneKey, zone);
      }
    });
    result.zones = normalized;
  }

  const flagMap = validateMap(
    obj.globalFlags,
    `${fieldName}.globalFlags`,
    collector,
  );
  if (flagMap) {
    const normalized = new Map<string, boolean>();
    flagMap.forEach((value, key) => {
      const flagKey = typeof key === "string" && key ? key : null;
      if (!flagKey) {
        collector.addError(
          `${fieldName}.globalFlags`,
          "INVALID_FLAG_KEY",
          "Flag key must be a non-empty string",
        );
        return;
      }
      if (typeof value !== "boolean") {
        collector.addError(
          `${fieldName}.globalFlags.${flagKey}`,
          "INVALID_FLAG_VALUE",
          "Flag value must be boolean",
        );
        return;
      }
      normalized.set(flagKey, value);
    });
    result.globalFlags = normalized;
  }

  const counterMap = validateMap(
    obj.globalCounters,
    `${fieldName}.globalCounters`,
    collector,
  );
  if (counterMap) {
    const normalized = new Map<string, number>();
    counterMap.forEach((value, key) => {
      const counterKey = typeof key === "string" && key ? key : null;
      if (!counterKey) {
        collector.addError(
          `${fieldName}.globalCounters`,
          "INVALID_COUNTER_KEY",
          "Counter key must be a non-empty string",
        );
        return;
      }

      const numeric = validateNumber(
        value,
        `${fieldName}.globalCounters.${counterKey}`,
        collector,
      );
      if (numeric !== null) {
        normalized.set(counterKey, numeric);
      }
    });
    result.globalCounters = normalized;
  }

  const activeEntities = validateStringArray(
    obj.activeEntities,
    `${fieldName}.activeEntities`,
    collector,
  );
  if (activeEntities) {
    result.activeEntities = activeEntities;
  }

  const requiredFields = [
    "currentTick",
    "currentTime",
    "zones",
    "globalFlags",
    "globalCounters",
    "activeEntities",
  ];
  const missingFields = requiredFields.filter((field) => !(field in result));

  if (missingFields.length > 0) {
    collector.addError(
      fieldName,
      "MISSING_FIELDS",
      `Missing required world fields: ${missingFields.join(", ")}`,
    );
    return null;
  }

  return result as WorldState;
}

export function validateSnapshot(
  snapshot: unknown,
  fieldName: string,
  collector: ValidationErrorCollector,
): SimulationSnapshot | null {
  if (!snapshot || typeof snapshot !== "object") {
    collector.addError(
      fieldName,
      "INVALID_SNAPSHOT",
      `${fieldName} must be an object`,
    );
    return null;
  }

  const obj = snapshot as any;
  const result: Partial<SimulationSnapshot> = {};

  const tick = validateTick(obj.tick, `${fieldName}.tick`, collector);
  if (tick !== null) {
    result.tick = tick;
  }

  const eventLogIndex = validateNumber(
    obj.eventLogIndex,
    `${fieldName}.eventLogIndex`,
    collector,
    0,
  );
  if (eventLogIndex !== null) {
    result.eventLogIndex = eventLogIndex;
  }

  if (obj.stateHash !== undefined) {
    const stateHash = validateString(
      obj.stateHash,
      `${fieldName}.stateHash`,
      collector,
    );
    if (stateHash !== null) {
      result.stateHash = stateHash;
    }
  }

  const worldState = validateWorldState(
    obj.worldState,
    `${fieldName}.worldState`,
    collector,
  );
  if (worldState) {
    result.worldState = worldState;
  }

  const entitiesMap = validateMap(
    obj.entities,
    `${fieldName}.entities`,
    collector,
  );
  if (entitiesMap) {
    const normalized = new Map<string, Entity>();
    entitiesMap.forEach((value, key) => {
      const entityKey = typeof key === "string" && key ? key : null;
      if (!entityKey) {
        collector.addError(
          `${fieldName}.entities`,
          "INVALID_ENTITY_KEY",
          "Entity key must be a non-empty string",
        );
        return;
      }

      const entity = validateEntity(
        value,
        `${fieldName}.entities[${entityKey}]`,
        collector,
      );
      if (entity) {
        normalized.set(entityKey, entity);
      }
    });
    result.entities = normalized;
  }

  const requiredFields = ["tick", "worldState", "entities", "eventLogIndex"];
  const missingFields = requiredFields.filter((field) => !(field in result));

  if (missingFields.length > 0) {
    collector.addError(
      fieldName,
      "MISSING_FIELDS",
      `Missing required snapshot fields: ${missingFields.join(", ")}`,
    );
    return null;
  }

  return result as SimulationSnapshot;
}

// ============================================================================
// COMMAND VALIDATION
// ============================================================================

export function validateCommand(
  command: unknown,
  fieldName: string,
  collector: ValidationErrorCollector,
): Command | null {
  if (!command || typeof command !== "object") {
    collector.addError(
      fieldName,
      "INVALID_COMMAND",
      `${fieldName} must be an object`,
    );
    return null;
  }

  const obj = command as any;
  const result: Partial<Command> = {};

  // Base command fields
  const commandId = validateString(obj.id, `${fieldName}.id`, collector);
  if (commandId !== null) {
    result.id = commandId;
  }
  const entityId = validateString(
    obj.entityId,
    `${fieldName}.entityId`,
    collector,
  );
  if (entityId !== null) {
    result.entityId = entityId;
  }
  const timestamp = validateTick(
    obj.timestamp,
    `${fieldName}.timestamp`,
    collector,
  );
  if (timestamp !== null) {
    result.timestamp = timestamp;
  }

  // Validate command type
  const validTypes = ["UseSkill", "Move", "EquipItem", "UseItem", "Rest"];
  if (validTypes.includes(obj.type)) {
    result.type = obj.type;
  } else {
    collector.addError(
      fieldName,
      "INVALID_COMMAND_TYPE",
      `Command type must be one of: ${validTypes.join(", ")}`,
    );
    return null;
  }

  // Type-specific validation
  switch (result.type) {
    case "UseSkill": {
      const skillId = validateString(
        obj.skillId,
        `${fieldName}.skillId`,
        collector,
      );
      if (skillId !== null) {
        result.skillId = skillId;
      }
      if (obj.targetId) {
        const targetId = validateString(
          obj.targetId,
          `${fieldName}.targetId`,
          collector,
        );
        if (targetId !== null) {
          result.targetId = targetId;
        }
      }
      if (obj.targetLane !== undefined) {
        const targetLane = validateNumber(
          obj.targetLane,
          `${fieldName}.targetLane`,
          collector,
          0,
          3,
        );
        if (targetLane !== null) {
          result.targetLane = targetLane;
        }
      }
      break;
    }

    case "Move": {
      // Position validation would go here
      break;
    }

    case "EquipItem": {
      const equipItemId = validateString(
        obj.itemId,
        `${fieldName}.itemId`,
        collector,
      );
      if (equipItemId !== null) {
        result.itemId = equipItemId;
      }
      const validSlots = [
        "weapon",
        "armor",
        "accessory1",
        "accessory2",
        "accessory3",
      ];
      if (validSlots.includes(obj.slot)) {
        result.slot = obj.slot;
      } else {
        collector.addError(
          fieldName,
          "INVALID_EQUIPMENT_SLOT",
          `Slot must be one of: ${validSlots.join(", ")}`,
        );
      }
      break;
    }

    case "UseItem": {
      const useItemId = validateString(
        obj.itemId,
        `${fieldName}.itemId`,
        collector,
      );
      if (useItemId !== null) {
        result.itemId = useItemId;
      }
      if (obj.targetId) {
        const targetId = validateString(
          obj.targetId,
          `${fieldName}.targetId`,
          collector,
        );
        if (targetId !== null) {
          result.targetId = targetId;
        }
      }
      break;
    }

    case "Rest": {
      const duration = validateTick(
        obj.duration,
        `${fieldName}.duration`,
        collector,
      );
      if (duration !== null) {
        result.duration = duration;
      }
      break;
    }
  }

  // Check required fields
  const requiredFields = ["id", "type", "entityId", "timestamp"];
  const missingFields = requiredFields.filter((field) => !(field in result));

  if (missingFields.length > 0) {
    collector.addError(
      fieldName,
      "MISSING_FIELDS",
      `Missing required command fields: ${missingFields.join(", ")}`,
    );
    return null;
  }

  return result as Command;
}

// ============================================================================
// EVENT VALIDATION
// ============================================================================

export function validateEvent(
  event: unknown,
  fieldName: string,
  collector: ValidationErrorCollector,
): Event | null {
  if (!event || typeof event !== "object") {
    collector.addError(
      fieldName,
      "INVALID_EVENT",
      `${fieldName} must be an object`,
    );
    return null;
  }

  const obj = event as any;
  const result: Partial<Event> = {};

  // Base event fields
  const eventId = validateString(obj.id, `${fieldName}.id`, collector);
  if (eventId !== null) {
    result.id = eventId;
  }
  const eventTick = validateTick(obj.tick, `${fieldName}.tick`, collector);
  if (eventTick !== null) {
    result.tick = eventTick;
  }
  const eventTimestamp = validatePositiveNumber(
    obj.timestamp,
    `${fieldName}.timestamp`,
    collector,
  );
  if (eventTimestamp !== null) {
    result.timestamp = eventTimestamp;
  }

  if (obj.entityId) {
    const eventEntityId = validateString(
      obj.entityId,
      `${fieldName}.entityId`,
      collector,
    );
    if (eventEntityId !== null) {
      result.entityId = eventEntityId;
    }
  }

  // Validate event type
  const validTypes = [
    "Damage",
    "Heal",
    "EffectApplied",
    "EffectRemoved",
    "StatChanged",
    "EntityDeath",
    "SkillUsed",
    "StateChanged",
    "CombatAction",
    "TurnStarted",
    "APGained",
    "APSpent",
    "Error",
  ];
  if (validTypes.includes(obj.type)) {
    result.type = obj.type;
  } else {
    collector.addError(
      fieldName,
      "INVALID_EVENT_TYPE",
      `Event type must be one of: ${validTypes.join(", ")}`,
    );
    return null;
  }

  // Type-specific validation would go here...
  if (result.type === "Error") {
    const message = validateString(
      obj.message,
      `${fieldName}.message`,
      collector,
    );
    if (message !== null) {
      result.message = message;
    }
    if (obj.commandId !== undefined) {
      const commandId = validateString(
        obj.commandId,
        `${fieldName}.commandId`,
        collector,
      );
      if (commandId !== null) {
        result.commandId = commandId;
      }
    }
  }

  if (result.type === "TurnStarted") {
    const actionPoints = validatePositiveNumber(
      obj.actionPoints,
      `${fieldName}.actionPoints`,
      collector,
    );
    if (actionPoints !== null) {
      result.actionPoints = actionPoints;
    }
    const initiative = validateNumber(
      obj.initiative,
      `${fieldName}.initiative`,
      collector,
      0,
    );
    if (initiative !== null) {
      result.initiative = initiative;
    }
    const order = validateNumber(obj.order, `${fieldName}.order`, collector, 0);
    if (order !== null) {
      result.order = order;
    }
  }

  if (result.type === "APGained") {
    const amount = validatePositiveNumber(
      obj.amount,
      `${fieldName}.amount`,
      collector,
    );
    if (amount !== null) {
      result.amount = amount;
    }
    const total = validatePositiveNumber(
      obj.total,
      `${fieldName}.total`,
      collector,
    );
    if (total !== null) {
      result.total = total;
    }
  }

  if (result.type === "APSpent") {
    const amount = validatePositiveNumber(
      obj.amount,
      `${fieldName}.amount`,
      collector,
    );
    if (amount !== null) {
      result.amount = amount;
    }
    const remaining = validatePositiveNumber(
      obj.remaining,
      `${fieldName}.remaining`,
      collector,
    );
    if (remaining !== null) {
      result.remaining = remaining;
    }
    if (obj.reason !== undefined) {
      const reason = validateString(
        obj.reason,
        `${fieldName}.reason`,
        collector,
      );
      if (reason !== null) {
        result.reason = reason;
      }
    }
  }

  // Check required fields
  const requiredFields = ["id", "type", "tick", "timestamp"];
  const missingFields = requiredFields.filter((field) => !(field in result));

  if (missingFields.length > 0) {
    collector.addError(
      fieldName,
      "MISSING_FIELDS",
      `Missing required event fields: ${missingFields.join(", ")}`,
    );
    return null;
  }

  return result as Event;
}

// ============================================================================
// SIMULATION STATE VALIDATION
// ============================================================================

export function validateSimulationState(
  state: unknown,
  fieldName: string,
  collector: ValidationErrorCollector,
): SimulationState | null {
  if (!state || typeof state !== "object") {
    collector.addError(
      fieldName,
      "INVALID_SIMULATION_STATE",
      `${fieldName} must be an object`,
    );
    return null;
  }

  const obj = state as any;
  const result: Partial<SimulationState> = {};

  // Validate world state
  const worldState = validateWorldState(
    obj.world,
    `${fieldName}.world`,
    collector,
  );
  if (worldState) {
    result.world = worldState;
  }

  // Validate entities
  const entitiesMap = validateMap(
    obj.entities,
    `${fieldName}.entities`,
    collector,
  );
  if (entitiesMap) {
    const normalized = new Map<string, Entity>();
    entitiesMap.forEach((value, key) => {
      const entityKey = typeof key === "string" && key ? key : null;
      if (!entityKey) {
        collector.addError(
          `${fieldName}.entities`,
          "INVALID_ENTITY_KEY",
          "Entity key must be a non-empty string",
        );
        return;
      }

      const entity = validateEntity(
        value,
        `${fieldName}.entities[${entityKey}]`,
        collector,
      );
      if (entity) {
        normalized.set(entityKey, entity);
      }
    });
    result.entities = normalized;
  }

  // Validate event log
  if (Array.isArray(obj.eventLog)) {
    result.eventLog = obj.eventLog
      .map((e: any, i: number) =>
        validateEvent(e, `${fieldName}.eventLog[${i}]`, collector),
      )
      .filter(Boolean) as Event[];
  } else {
    collector.addError(
      fieldName,
      "INVALID_EVENT_LOG",
      "Event log must be an array",
    );
  }

  // Validate snapshots
  const snapshotsMap = validateMap(
    obj.snapshots,
    `${fieldName}.snapshots`,
    collector,
  );
  if (snapshotsMap) {
    const normalized = new Map<Tick, SimulationSnapshot>();
    snapshotsMap.forEach((value, key) => {
      const tickKey = typeof key === "number" ? key : Number(key);
      if (!Number.isFinite(tickKey)) {
        collector.addError(
          `${fieldName}.snapshots`,
          "INVALID_SNAPSHOT_KEY",
          "Snapshot key must be a number",
        );
        return;
      }

      const snapshot = validateSnapshot(
        value,
        `${fieldName}.snapshots[${tickKey}]`,
        collector,
      );
      if (snapshot) {
        normalized.set(tickKey, snapshot);
      }
    });
    result.snapshots = normalized;
  }

  // Validate metadata
  const seed = validateNumber(obj.seed, `${fieldName}.seed`, collector);
  if (seed !== null) {
    result.seed = seed;
  }
  const currentTick = validateTick(
    obj.currentTick,
    `${fieldName}.currentTick`,
    collector,
  );
  if (currentTick !== null) {
    result.currentTick = currentTick;
  }
  result.isRunning = Boolean(obj.isRunning);

  // Check required fields
  const requiredFields = [
    "world",
    "entities",
    "eventLog",
    "snapshots",
    "seed",
    "currentTick",
    "isRunning",
  ];
  const missingFields = requiredFields.filter((field) => !(field in result));

  if (missingFields.length > 0) {
    collector.addError(
      fieldName,
      "MISSING_FIELDS",
      `Missing required simulation state fields: ${missingFields.join(", ")}`,
    );
    return null;
  }

  return result as SimulationState;
}

// ============================================================================
// MAIN VALIDATION FUNCTIONS
// ============================================================================

export function validateEntityStrict(entity: unknown): ValidationResult {
  const collector = new ValidationErrorCollector();
  validateEntity(entity, "entity", collector);
  return collector.getResult();
}

export function validateCommandStrict(command: unknown): ValidationResult {
  const collector = new ValidationErrorCollector();
  validateCommand(command, "command", collector);
  return collector.getResult();
}

export function validateEventStrict(event: unknown): ValidationResult {
  const collector = new ValidationErrorCollector();
  validateEvent(event, "event", collector);
  return collector.getResult();
}

export function validateSimulationStateStrict(
  state: unknown,
): ValidationResult {
  const collector = new ValidationErrorCollector();
  validateSimulationState(state, "state", collector);
  return collector.getResult();
}
