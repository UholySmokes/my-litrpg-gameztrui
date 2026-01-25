/**
 * SimulationBridge - Integration layer between deterministic simulation and existing game systems
 *
 * This bridge wraps existing game logic with:
 * - Seeded PRNG for deterministic randomness
 * - Event logging for all state mutations
 * - Command queue for replay capability
 *
 * Design principle: Don't duplicate logic, wrap and instrument existing systems
 */

import { EventBus } from "../events/EventBus";
import { SeededPRNG } from "../kernel/SimulationKernel";
import { executeAction } from "../../core/ActionDispatcher.js";

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
      active: true,
    };

    const detach = () => {
      if (!record.active) {
        return;
      }
      record.active = false;
      if (typeof record.unsubscribe === "function") {
        record.unsubscribe();
      }
      this.subscriptions.delete(record);
    };

    this.subscriptions.add(record);

    if (this.eventBus) {
      record.unsubscribe = options.eventType
        ? this.eventBus.subscribe(options.eventType, listener)
        : this.eventBus.subscribeToAll(listener);
    }

    return detach;
  }

  rebindSubscriptions() {
    if (!this.eventBus || this.subscriptions.size === 0) {
      return;
    }

    for (const record of this.subscriptions) {
      if (!record.active) {
        continue;
      }
      if (typeof record.unsubscribe === "function") {
        record.unsubscribe();
      }
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

/**
 * Wrapper for action execution that logs commands and events
 */
export function wrapActionExecution(actionType, actionPayload, executeFn) {
  // Log command
  SimBridge.logCommand({
    type: actionType,
    payload: actionPayload,
  });

  // Execute action
  const result = executeFn();

  // Emit state change event
  if (result && result.success) {
    SimBridge.emitEvent("StateChanged", {
      actionType,
      changes: result.changes || {},
      description: result.description,
    });
  }

  return result;
}

/**
 * Wrapper for combat actions that need deterministic randomness
 */
export function wrapCombatAction(actionName, params, executeFn) {
  // Log combat command
  SimBridge.logCommand({
    type: "Combat",
    action: actionName,
    params,
  });

  // Execute with seeded randomness
  const result = executeFn(SimBridge);

  // Emit combat event
  if (result) {
    SimBridge.emitEvent("CombatAction", {
      action: actionName,
      result,
    });
  }

  return result;
}

/**
 * Initialize simulation for a game session
 */
export function initializeSimulation(seed) {
  SimBridge.initialize(seed);
  return SimBridge;
}

/**
 * Get simulation statistics
 */
export function getSimulationStats() {
  return SimBridge.getState();
}

/**
 * Export replay data for debugging
 */
export function exportReplay() {
  return SimBridge.exportReplayData();
}

/**
 * Replay simulation from seed and commands
 */
export async function replaySimulation(
  replayData,
  { initialState = null, onEvent, execute = null } = {},
) {
  if (!replayData || !Array.isArray(replayData.commands)) {
    throw new Error("Replay data is missing commands.");
  }

  if (!initialState && typeof execute !== "function") {
    throw new Error("Replay requires an initialState or execute handler.");
  }

  // Reset with original seed
  SimBridge.initialize(replayData.seed);

  let state = initialState;
  const executeCommand =
    typeof execute === "function"
      ? execute
      : (currentState, command) => {
          const action = command.payload ?? { type: command.type, ...command };
          const result = executeAction(currentState, action, {});
          return result;
        };

  // Replay commands deterministically
  for (const command of replayData.commands) {
    const result = executeCommand(state, command, SimBridge);
    if (result && result.success && !result.readOnly) {
      state = result.state ?? state;
      SimBridge.advanceTick();
    }

    if (onEvent) {
      onEvent(command, result, state);
    }
  }

  return {
    state,
    simState: SimBridge.getState(),
  };
}
