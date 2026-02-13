/**
 * Core simulation types and interfaces
 * This defines the pure data model - no UI, no network calls
 */

// ============================================================================
// BASIC TYPES
// ============================================================================

export type Tick = number;
export type EntityId = string;
export type SkillId = string;
export type ItemId = string;
export type EffectId = string;
export type ZoneId = string;
export type FactionId = string;

export type Resource = {
  current: number;
  maximum: number;
};

export type StatBlock = {
  // Primary stats
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;

  // Derived stats
  health: Resource;
  mana: Resource;
  stamina: Resource;

  // Combat stats
  attackPower: number;
  defense: number;
  speed: number;
  criticalChance: number;
  criticalMultiplier: number;
  evasion: number;
  accuracy: number;
};

// ============================================================================
// ENTITY MODEL
// ============================================================================

export type Effect = {
  id: EffectId;
  name: string;
  duration: Tick; // -1 for permanent
  stacks: number;
  maxStacks: number;
  source: EntityId;
  stackingRule: "refresh" | "add" | "replace" | "merge";
  modifiers: {
    statModifiers?: Partial<StatBlock>;
    damagePerTick?: number;
    healingPerTick?: number;
  };
  tags: string[];
};

export type Equipment = {
  slot: "weapon" | "armor" | "accessory1" | "accessory2" | "accessory3";
  itemId: ItemId;
  modifiers?: Partial<StatBlock>;
  effects?: EffectId[];
};

export type Cooldown = {
  skillId: SkillId;
  remainingTicks: Tick;
  totalTicks: Tick;
};

export type Entity = {
  id: EntityId;
  name: string;
  type: "player" | "enemy" | "npc" | "object";

  // Core attributes
  level: number;
  experience: number;
  stats: StatBlock;

  // Combat state
  position: { lane: number; slot: number };
  actionPoints: number;
  maxActionPoints: number;
  initiative: number;

  // Dynamic state
  effects: Effect[];
  equipment: Equipment[];
  cooldowns: Cooldown[];

  // Metadata
  faction: FactionId;
  tags: string[];
  isDead: boolean;
};

// ============================================================================
// WORLD MODEL
// ============================================================================

export type Zone = {
  id: ZoneId;
  name: string;
  type: "combat" | "exploration" | "social" | "safe";
  connections: ZoneId[];
  defaultEntities: EntityId[];
  environmentalEffects?: EffectId[];
};

export type Location = {
  zoneId: ZoneId;
  coordinates: { x: number; y: number };
  timestamp: Tick;
};

export type WorldState = {
  currentTick: Tick;
  currentTime: number; // In-game time in seconds
  zones: Map<ZoneId, Zone>;
  globalFlags: Map<string, boolean>;
  globalCounters: Map<string, number>;
  activeEntities: EntityId[];
};

// ============================================================================
// COMMAND MODEL
// ============================================================================

export type BaseCommand = {
  id: string;
  type: string;
  entityId: EntityId;
  timestamp: Tick;
};

export type UseSkillCommand = BaseCommand & {
  type: "UseSkill";
  skillId: SkillId;
  targetId?: EntityId;
  targetLane?: number;
};

export type MoveCommand = BaseCommand & {
  type: "Move";
  fromPosition: { lane: number; slot: number };
  toPosition: { lane: number; slot: number };
};

export type EquipItemCommand = BaseCommand & {
  type: "EquipItem";
  itemId: ItemId;
  slot: Equipment["slot"];
};

export type UseItemCommand = BaseCommand & {
  type: "UseItem";
  itemId: ItemId;
  targetId?: EntityId;
};

export type RestCommand = BaseCommand & {
  type: "Rest";
  duration: Tick;
};

export type MagicSenseCommand = BaseCommand & {
  type: "MagicSense";
  essence?: string;
};

export type MagicAttuneCommand = BaseCommand & {
  type: "MagicAttune";
  stance?: string;
};

export type MagicDrawCommand = BaseCommand & {
  type: "MagicDraw";
  essence: string;
  amount?: number;
};

export type MagicRefineCommand = BaseCommand & {
  type: "MagicRefine";
  essence: string;
  method?: string;
  amount?: number;
};

export type MagicCompressCommand = BaseCommand & {
  type: "MagicCompress";
  essence: string;
  method?: string;
  tier?: number;
};

export type MagicShapeCommand = BaseCommand & {
  type: "MagicShape";
  essence?: string;
  form?: string;
  amount?: number;
};

export type MagicWeaveCommand = BaseCommand & {
  type: "MagicWeave";
  essences?: string[];
  pattern?: string;
};

export type MagicAnchorCommand = BaseCommand & {
  type: "MagicAnchor";
  kind?: string;
  itemId?: string;
};

export type MagicPurgeCommand = BaseCommand & {
  type: "MagicPurge";
  essence?: string | null;
  amount?: number;
};

export type MagicReleaseCommand = BaseCommand & {
  type: "MagicRelease";
};

export type Command =
  | UseSkillCommand
  | MoveCommand
  | EquipItemCommand
  | UseItemCommand
  | RestCommand
  | MagicSenseCommand
  | MagicAttuneCommand
  | MagicDrawCommand
  | MagicRefineCommand
  | MagicCompressCommand
  | MagicShapeCommand
  | MagicWeaveCommand
  | MagicAnchorCommand
  | MagicPurgeCommand
  | MagicReleaseCommand;

// ============================================================================
// EVENT MODEL
// ============================================================================

export type BaseEvent = {
  id: string;
  type: string;
  tick: Tick;
  entityId?: EntityId;
  timestamp: number;
};

export type DamageEvent = BaseEvent & {
  type: "Damage";
  sourceId: EntityId;
  targetId: EntityId;
  amount: number;
  damageType: string;
  isCritical: boolean;
};

export type HealEvent = BaseEvent & {
  type: "Heal";
  sourceId: EntityId;
  targetId: EntityId;
  amount: number;
  healType: string;
};

export type EffectAppliedEvent = BaseEvent & {
  type: "EffectApplied";
  entityId: EntityId;
  effectId: EffectId;
  sourceId: EntityId;
  stacks: number;
};

export type EffectRemovedEvent = BaseEvent & {
  type: "EffectRemoved";
  entityId: EntityId;
  effectId: EffectId;
  reason: "expired" | "dispelled" | "replaced";
};

export type StatChangedEvent = BaseEvent & {
  type: "StatChanged";
  entityId: EntityId;
  stat: keyof StatBlock;
  oldValue: number;
  newValue: number;
  reason: string;
};

export type EntityDeathEvent = BaseEvent & {
  type: "EntityDeath";
  entityId: EntityId;
  killerId?: EntityId;
  deathCause: string;
};

export type SkillUsedEvent = BaseEvent & {
  type: "SkillUsed";
  entityId: EntityId;
  skillId: SkillId;
  targetId?: EntityId;
  cost: {
    mana?: number;
    stamina?: number;
    actionPoints?: number;
  };
};

export type StateChangedEvent = BaseEvent & {
  type: "StateChanged";
  actionType: string;
  changes?: Record<string, unknown>;
  description?: string;
};

export type CombatActionEvent = BaseEvent & {
  type: "CombatAction";
  action: string;
  result?: unknown;
};

export type TurnStartedEvent = BaseEvent & {
  type: "TurnStarted";
  entityId: EntityId;
  actionPoints: number;
  initiative: number;
  order: number;
};

export type APGainedEvent = BaseEvent & {
  type: "APGained";
  entityId: EntityId;
  amount: number;
  total: number;
};

export type APSpentEvent = BaseEvent & {
  type: "APSpent";
  entityId: EntityId;
  amount: number;
  remaining: number;
  reason?: string;
};

export type ErrorEvent = BaseEvent & {
  type: "Error";
  message: string;
  commandId?: string;
};

export type Event =
  | DamageEvent
  | HealEvent
  | EffectAppliedEvent
  | EffectRemovedEvent
  | StatChangedEvent
  | EntityDeathEvent
  | SkillUsedEvent
  | StateChangedEvent
  | CombatActionEvent
  | TurnStartedEvent
  | APGainedEvent
  | APSpentEvent
  | ErrorEvent;

// ============================================================================
// SIMULATION STATE
// ============================================================================

export type SimulationState = {
  world: WorldState;
  entities: Map<EntityId, Entity>;
  eventLog: Event[];
  snapshots: Map<Tick, SimulationSnapshot>;

  // Simulation metadata
  seed: number;
  currentTick: Tick;
  isRunning: boolean;
};

export type SimulationSnapshot = {
  tick: Tick;
  worldState: WorldState;
  entities: Map<EntityId, Entity>;
  eventLogIndex: number; // Index in event log where snapshot was taken
  stateHash?: string;
};

// ============================================================================
// SIMULATION BOUNDARIES
// ============================================================================

/**
 * Rules for what belongs inside vs outside the simulation:
 *
 * INSIDE (pure, deterministic):
 * - All state mutations
 * - All random number generation (via seeded PRNG)
 * - All game logic and rules
 * - Event generation and logging
 * - Command validation
 *
 * OUTSIDE (side effects):
 * - UI rendering and user input
 * - Network requests
 * - File I/O
 * - Database operations
 * - External API calls
 * - Console logging (use events instead)
 */

export interface SimulationKernel {
  // Core simulation loop
  tick(dt: number): void;
  step(ticks: number): void;

  // Command processing
  enqueueCommand(command: Command): void;
  processCommands(): void;

  // State access
  getState(): SimulationState;
  getEntity(id: EntityId): Entity | undefined;

  // Event handling
  getEvents(sinceTick?: Tick): Event[];
  getEventsForEntity(entityId: EntityId, sinceTick?: Tick): Event[];

  // Determinism controls
  setSeed(seed: number): void;
  getSeed(): number;

  // Lifecycle
  start(): void;
  pause(): void;
  reset(): void;
}

// ============================================================================
// VALIDATION
// ============================================================================

export type ValidationError = {
  field: string;
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
};

export interface CommandValidator {
  validate(command: Command, state: SimulationState): ValidationResult;
}
