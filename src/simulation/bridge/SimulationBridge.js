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

import { executeAction } from "../../core/ActionDispatcher.js";
import { SimBridge } from "./SimulationContext.js";
export { SimBridge } from "./SimulationContext.js";

/**
 * Wrapper for action execution that logs commands and emits events
 */
export function wrapActionExecution(actionType, actionPayload, executeFn) {
  SimBridge.logCommand({ type: actionType, payload: actionPayload });

  const result = executeFn();

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
