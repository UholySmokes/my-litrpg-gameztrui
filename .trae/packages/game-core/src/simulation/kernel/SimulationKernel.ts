/**
 * Deterministic Simulation Kernel
 * Fixed-tick loop that produces identical results from the same inputs
 */

import {
  SimulationKernel,
  SimulationState,
  Command,
  Event,
  Entity,
  EntityId,
  Tick,
  WorldState,
  SimulationSnapshot,
} from "../types/core";
import { isValidCommand, isValidEntity } from "../validation/basic";
import { resolveCommand } from "../combat/ActionResolver";
import { advanceActionPoints } from "../combat/ActionScheduler";
import { tickEffects } from "../effects/EffectEngine";
import { normalizeForHash, hashString } from "../../utils/stateHash.js";

// ============================================================================
// SEEDED PRNG IMPLEMENTATION
// ============================================================================

/**
 * Seeded pseudo-random number generator
 * Uses xorshift algorithm for deterministic randomness
 */
export class SeededPRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Generate next random number in sequence
   * Returns value between 0 and 1
   */
  next(): number {
    // xorshift32 algorithm
    this.seed ^= this.seed << 13;
    this.seed ^= this.seed >> 17;
    this.seed ^= this.seed << 5;

    // Convert to float between 0 and 1
    return (this.seed >>> 0) / 0xffffffff;
  }

  /**
   * Generate random integer between min and max (inclusive)
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate random float between min and max
   */
  randomFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Generate random boolean with given probability (default 0.5)
   */
  randomBool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Pick random element from array
   */
  randomChoice<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[this.randomInt(0, array.length - 1)];
  }

  /**
   * Reset PRNG to original seed
   */
  reset(): void {
    // Seed is stored internally, no action needed
  }

  /**
   * Get current seed value
   */
  getSeed(): number {
    return this.seed;
  }
}

// ============================================================================
// COMMAND QUEUE
// ============================================================================

export class CommandQueue {
  private queue: Command[] = [];
  private nextId: number = 1;

  /**
   * Add command to queue
   */
  enqueue(command: Command): void {
    if (!isValidCommand(command)) {
      throw new Error(`Invalid command: ${JSON.stringify(command)}`);
    }

    // Ensure command has unique ID
    if (!command.id) {
      command.id = `cmd_${this.nextId++}`;
    }

    this.queue.push(command);
  }

  /**
   * Get next command to process
   */
  dequeue(): Command | undefined {
    return this.queue.shift();
  }

  /**
   * Get all commands for current tick
   */
  getCommandsForTick(tick: Tick): Command[] {
    return this.queue.filter((cmd) => cmd.timestamp <= tick);
  }

  /**
   * Remove processed commands
   */
  removeProcessedCommands(processedTick: Tick): void {
    this.queue = this.queue.filter((cmd) => cmd.timestamp > processedTick);
  }

  /**
   * Clear all commands
   */
  clear(): void {
    this.queue = [];
    this.nextId = 1;
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Peek at next command without removing
   */
  peek(): Command | undefined {
    return this.queue[0];
  }
}

// ============================================================================
// SIMULATION KERNEL IMPLEMENTATION
// ============================================================================

export class DefaultSimulationKernel implements SimulationKernel {
  private state: SimulationState;
  private prng: SeededPRNG;
  private commandQueue: CommandQueue;
  private isRunning: boolean = false;
  private tickDuration: number = 100; // milliseconds per tick

  constructor(initialState: SimulationState, seed?: number) {
    const stateSeed =
      initialState && typeof initialState.seed === "number"
        ? initialState.seed
        : undefined;
    const resolvedSeed = Number.isFinite(seed)
      ? (seed as number)
      : Number.isFinite(stateSeed)
        ? (stateSeed as number)
        : 1;
    this.state = this.validateInitialState(initialState, resolvedSeed);
    this.state.seed = resolvedSeed;
    this.prng = new SeededPRNG(resolvedSeed);
    this.commandQueue = new CommandQueue();
  }

  // ============================================================================
  // CORE SIMULATION LOOP
  // ============================================================================

  /**
   * Advance simulation by one tick
   */
  tick(dt: number = 1): void {
    if (!this.isRunning) return;

    const currentTick = this.state.currentTick;

    // Process all commands for this tick
    this.processCommands();

    // Update entity states (cooldowns, effects, etc.)
    this.updateEntities(dt);

    // Update action points and turn order
    this.updateActionSchedule();

    // Process world state changes
    this.updateWorld(dt);

    // Generate automatic events (effect ticks, etc.)
    this.processAutomaticEvents();

    // Create snapshot every N ticks for fast reload
    if (currentTick % 100 === 0) {
      this.createSnapshot(currentTick);
    }

    // Advance tick counter
    this.state.currentTick += 1;
    this.state.world.currentTime += dt;
  }

  /**
   * Advance simulation by multiple ticks
   */
  step(ticks: number): void {
    for (let i = 0; i < ticks; i++) {
      this.tick();
    }
  }

  // ============================================================================
  // COMMAND PROCESSING
  // ============================================================================

  /**
   * Add command to processing queue
   */
  enqueueCommand(command: Command): void {
    this.commandQueue.enqueue(command);
  }

  /**
   * Process all pending commands for current tick
   */
  processCommands(): void {
    const currentTick = this.state.currentTick;
    const commandsToProcess = this.commandQueue.getCommandsForTick(currentTick);

    for (const command of commandsToProcess) {
      this.processCommand(command);
    }

    // Remove processed commands
    this.commandQueue.removeProcessedCommands(currentTick);
  }

  /**
   * Process individual command
   */
  private processCommand(command: Command): void {
    try {
      const resolution = resolveCommand(command, this.state.entities, {
        tick: this.state.currentTick,
        timestamp: this.getEventTimestamp(),
        rng: () => this.prng.next(),
      });

      if (!resolution.success) {
        this.createErrorEvent(
          command.entityId,
          resolution.reason ?? `Command failed: ${command.type}`,
          command.id,
        );
        return;
      }

      this.state.entities = resolution.entities;
      for (const event of resolution.events) {
        this.createEvent(event);
      }
    } catch (error) {
      this.createErrorEvent(
        command.entityId,
        `Command processing error: ${error}`,
        command.id,
      );
    }
  }

  // ============================================================================
  // ENTITY UPDATES
  // ============================================================================

  private updateEntities(dt: number): void {
    for (const [entityId, entity] of this.state.entities.entries()) {
      if (entity.isDead) continue;

      // Update cooldowns
      this.updateCooldowns(entity, dt);

      // Update effects
      let updatedEntity = this.updateEffects(entity, dt);
      if (updatedEntity.isDead) {
        this.state.entities.set(entityId, updatedEntity);
        continue;
      }

      // Regenerate resources
      this.regenerateResources(updatedEntity, dt);
      this.state.entities.set(entityId, updatedEntity);
    }
  }

  private updateActionSchedule(): void {
    const schedule = advanceActionPoints(
      this.state.entities,
      this.state.currentTick,
      this.getEventTimestamp(),
    );

    this.state.entities = schedule.entities;
    for (const event of schedule.events) {
      this.createEvent(event);
    }
  }

  private updateCooldowns(entity: Entity, dt: number): void {
    entity.cooldowns = entity.cooldowns
      .map((cooldown) => ({
        ...cooldown,
        remainingTicks: Math.max(0, cooldown.remainingTicks - dt),
      }))
      .filter((cooldown) => cooldown.remainingTicks > 0);
  }

  private updateEffects(entity: Entity, dt: number): Entity {
    const result = tickEffects(
      entity,
      dt,
      this.state.currentTick,
      this.getEventTimestamp(),
    );

    for (const event of result.events) {
      this.createEvent(event);
    }

    return result.entity;
  }

  private regenerateResources(entity: Entity, dt: number): void {
    // Basic resource regeneration
    const healthRegen = entity.stats.constitution * 0.1 * dt;
    const manaRegen = entity.stats.intelligence * 0.2 * dt;
    const staminaRegen = entity.stats.dexterity * 0.15 * dt;

    entity.stats.health.current = Math.min(
      entity.stats.health.maximum,
      entity.stats.health.current + healthRegen,
    );
    entity.stats.mana.current = Math.min(
      entity.stats.mana.maximum,
      entity.stats.mana.current + manaRegen,
    );
    entity.stats.stamina.current = Math.min(
      entity.stats.stamina.maximum,
      entity.stats.stamina.current + staminaRegen,
    );
  }

  // ============================================================================
  // WORLD UPDATES
  // ============================================================================

  private updateWorld(dt: number): void {
    // TODO: Implement world state updates
    // - Global timers
    // - Environmental effects
    // - Zone changes
  }

  // ============================================================================
  // EVENT GENERATION
  // ============================================================================

  private processAutomaticEvents(): void {
    for (const entity of this.state.entities.values()) {
      // Generate effect tick events
      for (const effect of entity.effects) {
        if (effect.modifiers.damagePerTick) {
          this.createEvent({
            id: this.nextEventId("damage"),
            type: "Damage",
            tick: this.state.currentTick,
            timestamp: this.getEventTimestamp(),
            entityId: entity.id,
            sourceId: effect.source,
            targetId: entity.id,
            amount: effect.modifiers.damagePerTick,
            damageType: "effect",
            isCritical: false,
          } as Event);
        }

        if (effect.modifiers.healingPerTick) {
          this.createEvent({
            id: this.nextEventId("heal"),
            type: "Heal",
            tick: this.state.currentTick,
            timestamp: this.getEventTimestamp(),
            entityId: entity.id,
            sourceId: effect.source,
            targetId: entity.id,
            amount: effect.modifiers.healingPerTick,
            healType: "effect",
          } as Event);
        }
      }
    }
  }

  private getEventTimestamp(): number {
    return this.state.world
      ? this.state.world.currentTime
      : this.state.currentTick;
  }

  private nextEventId(prefix: string): string {
    return `${prefix}_${this.state.currentTick}_${this.state.eventLog.length}`;
  }

  private createEvent(event: Event): void {
    this.state.eventLog.push(event);
  }

  private createErrorEvent(
    entityId: EntityId,
    message: string,
    commandId?: string,
  ): void {
    this.createEvent({
      id: this.nextEventId("error"),
      type: "Error",
      tick: this.state.currentTick,
      timestamp: this.getEventTimestamp(),
      entityId,
      message,
      commandId,
    } as Event);
  }

  // ============================================================================
  // SNAPSHOTTING
  // ============================================================================

  private createSnapshot(tick: Tick): void {
    const stateHash = this.computeStateHash();
    const snapshot: SimulationSnapshot = {
      tick,
      worldState: { ...this.state.world },
      entities: new Map(this.state.entities),
      eventLogIndex: this.state.eventLog.length,
      stateHash,
    };

    this.state.snapshots.set(tick, snapshot);

    // Keep only last 50 snapshots to manage memory
    if (this.state.snapshots.size > 50) {
      const oldestTick = Math.min(...this.state.snapshots.keys());
      this.state.snapshots.delete(oldestTick);
    }
  }

  private computeStateHash(): string {
    const snapshotPayload = {
      seed: this.state.seed,
      currentTick: this.state.currentTick,
      world: this.state.world,
      entities: this.state.entities,
    };
    const normalized = normalizeForHash(snapshotPayload);
    return hashString(JSON.stringify(normalized));
  }

  // ============================================================================
  // STATE ACCESS
  // ============================================================================

  getState(): SimulationState {
    return { ...this.state };
  }

  getEntity(id: EntityId): Entity | undefined {
    return this.state.entities.get(id);
  }

  getEvents(sinceTick?: Tick): Event[] {
    if (sinceTick === undefined) {
      return [...this.state.eventLog];
    }
    return this.state.eventLog.filter((event) => event.tick > sinceTick);
  }

  getEventsForEntity(entityId: EntityId, sinceTick?: Tick): Event[] {
    return this.getEvents(sinceTick).filter(
      (event) => event.entityId === entityId,
    );
  }

  // ============================================================================
  // DETERMINISM CONTROLS
  // ============================================================================

  setSeed(seed: number): void {
    this.prng = new SeededPRNG(seed);
    this.state.seed = seed;
  }

  getSeed(): number {
    return this.state.seed;
  }

  /**
   * Get the PRNG instance for deterministic randomness
   */
  getPRNG(): SeededPRNG {
    return this.prng;
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  start(): void {
    this.isRunning = true;
  }

  pause(): void {
    this.isRunning = false;
  }

  reset(): void {
    this.state.currentTick = 0;
    this.state.world.currentTime = 0;
    this.state.eventLog = [];
    this.state.snapshots.clear();
    this.commandQueue.clear();
    this.prng = new SeededPRNG(this.state.seed);
    this.isRunning = false;
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  private validateInitialState(
    state: SimulationState,
    seedFallback: number,
  ): SimulationState {
    if (!state) {
      throw new Error("Initial state cannot be null");
    }

    if (!state.entities) {
      state.entities = new Map();
    }

    if (!state.eventLog) {
      state.eventLog = [];
    }

    if (!state.snapshots) {
      state.snapshots = new Map();
    }

    if (typeof state.seed !== "number") {
      state.seed = seedFallback;
    }

    if (typeof state.currentTick !== "number") {
      state.currentTick = 0;
    }

    if (typeof state.isRunning !== "boolean") {
      state.isRunning = false;
    }

    return state;
  }
}
