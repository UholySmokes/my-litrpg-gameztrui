import { EventBus } from "../events/EventBus";

class SeededPRNG {
  constructor(seed) {
    this.seed = seed;
  }

  next() {
    this.seed ^= this.seed << 13;
    this.seed ^= this.seed >> 17;
    this.seed ^= this.seed << 5;
    return (this.seed >>> 0) / 0xffffffff;
  }

  randomInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  randomFloat(min, max) {
    return this.next() * (max - min) + min;
  }

  randomBool(probability = 0.5) {
    return this.next() < probability;
  }

  randomChoice(array) {
    if (!array || array.length === 0) return undefined;
    return array[this.randomInt(0, array.length - 1)];
  }
}

/**
 * Global simulation context that existing systems can access
 */
class SimulationContext {
  constructor() {
    this.prng = null;
    this.eventBus = null;
    this.currentTick = 0;
    this.seed = null;
    this.isActive = false;
    this.commandLog = [];
    this.eventCounter = 0;
    this.subscriptions = new Set();
  }

  /**
   * Initialize simulation context with seed
   */
  initialize(seed = 1) {
    const resolvedSeed = Number.isFinite(seed) ? seed : 1;
    this.seed = resolvedSeed;
    this.prng = new SeededPRNG(resolvedSeed);
    this.eventBus = new EventBus();
    this.currentTick = 0;
    this.isActive = true;
    this.commandLog = [];
    this.eventCounter = 0;

    console.log(`[SimBridge] Initialized with seed: ${resolvedSeed}`);

    this.rebindSubscriptions();
  }

  /**
   * Reset simulation to initial state
   */
  reset() {
    if (this.seed !== null) {
      this.prng = new SeededPRNG(this.seed);
      this.currentTick = 0;
      this.commandLog = [];
      this.eventCounter = 0;
      this.eventBus?.clearLog();
    }
  }

  /**
   * Deactivate simulation (fall back to Math.random)
   */
  deactivate() {
    this.isActive = false;
  }

  /**
   * Get random number - uses seeded PRNG if active, otherwise Math.random
   */
  random() {
    if (this.isActive && this.prng) {
      return this.prng.next();
    }
    return Math.random();
  }

  /**
   * Get random integer between min and max (inclusive)
   */
  randomInt(min, max) {
    if (this.isActive && this.prng) {
      return this.prng.randomInt(min, max);
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Get random float between min and max
   */
  randomFloat(min, max) {
    if (this.isActive && this.prng) {
      return this.prng.randomFloat(min, max);
    }
    return Math.random() * (max - min) + min;
  }

  /**
   * Get random boolean with given probability
   */
  randomBool(probability = 0.5) {
    if (this.isActive && this.prng) {
      return this.prng.randomBool(probability);
    }
    return Math.random() < probability;
  }

  /**
   * Pick random element from array
   */
  randomChoice(array) {
    if (!array || array.length === 0) return undefined;
    if (this.isActive && this.prng) {
      return this.prng.randomChoice(array);
    }
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Log a command for replay
   */
  logCommand(command) {
    if (this.isActive) {
      this.commandLog.push({
        ...command,
        tick: this.currentTick,
        timestamp: this.now(),
      });
    }
  }

  /**
   * Emit an event to the event bus
   */
  emitEvent(eventType, payload) {
    if (this.isActive && this.eventBus) {
      const eventId = `event_${this.currentTick}_${this.eventCounter++}`;
      const event = {
        id: eventId,
        type: eventType,
        tick: this.currentTick,
        timestamp: this.now(),
        ...payload,
      };
      this.eventBus.publish(event);
      return event;
    }
    return null;
  }

  /**
   * Advance simulation tick
   */
  advanceTick() {
    if (this.isActive) {
      this.currentTick++;
    }
  }

  /**
   * Deterministic timestamp helper
   */
  now() {
    return this.isActive ? this.currentTick : Date.now();
  }

  /**
   * Get current simulation state
   */
  getState() {
    return {
      seed: this.seed,
      currentTick: this.currentTick,
      isActive: this.isActive,
      commandCount: this.commandLog.length,
      eventCount: this.eventBus?.getEvents().length || 0,
    };
  }

  /**
   * Get event log
   */
  getEvents(filter) {
    if (this.eventBus) {
      return this.eventBus.getEvents(filter);
    }
    return [];
  }

  /**
   * Subscribe to simulation events (optionally filtered by type)
   */
  subscribeToEvents(listener, options = {}) {
    if (typeof listener !== "function") {
      return () => {};
    }

    const record = {
      listener,
      options,
      unsubscribe: null,
    };

    this.subscriptions.add(record);
    if (this.eventBus) {
      record.unsubscribe = record.options.eventType
        ? this.eventBus.subscribe(record.options.eventType, record.listener)
        : this.eventBus.subscribeToAll(record.listener);
    }

    return () => {
      if (record.unsubscribe) {
        record.unsubscribe();
      }
      this.subscriptions.delete(record);
    };
  }

  /**
   * Rebind subscriptions after event bus reset
   */
  rebindSubscriptions() {
    if (!this.eventBus) return;
    for (const record of this.subscriptions) {
      record.unsubscribe = record.options.eventType
        ? this.eventBus.subscribe(record.options.eventType, record.listener)
        : this.eventBus.subscribeToAll(record.listener);
    }
  }

  /**
   * Get command log
   */
  getCommands() {
    return [...this.commandLog];
  }

  /**
   * Export full simulation state for replay
   */
  exportReplayData() {
    return {
      seed: this.seed,
      commands: this.getCommands(),
      events: this.getEvents(),
      finalTick: this.currentTick,
    };
  }
}

// Global singleton instance
export const SimBridge = new SimulationContext();
