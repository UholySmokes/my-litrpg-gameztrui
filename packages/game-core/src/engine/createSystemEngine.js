import { parseAction } from "../core/InputParser.js";
import { validateActionComprehensive } from "../core/InputValidator.js";
import { executeAction } from "../core/ActionDispatcher.js";
import { normalizeGameState } from "../core/StateNormalizer.js";
import { SystemEventObserver } from "../core/SystemEventObserver.js";
import { SimBridge } from "../simulation/bridge/SimulationContext.js";
import {
  replaySimulation,
  exportReplay as exportReplayData,
} from "../simulation/bridge/SimulationBridge.js";
import { hashState, normalizeForHash, hashString } from "../utils/stateHash.js";

/**
 * SystemEngine facade — the single entry point for all platform adapters.
 *
 * Accepts an EngineConfig and returns a stateful engine instance that owns
 * deterministic simulation context (seed, tick, PRNG).
 *
 * @param {object} [config]
 * @param {"client"|"server"} [config.mode="client"]
 * @param {string}  [config.contentVersion="core@0.1.0"]
 * @param {number}  [config.stateVersion=1]
 * @param {number}  [config.seed=1]
 * @param {string}  [config.clientId]
 * @returns {object} SystemEngine
 */
export function createSystemEngine(config = {}) {
  const {
    mode = "client",
    contentVersion = "core@0.1.0",
    stateVersion = 1,
    seed = 1,
    clientId,
  } = config;

  // Initialize SimBridge only if it's not already active with the same seed.
  // This prevents re-render stomping in React (singleton guard).
  if (!SimBridge.isActive || SimBridge.seed !== seed) {
    SimBridge.initialize(seed);
  }

  let currentTick = SimBridge.currentTick || 0;

  /**
   * Normalize raw/partial state into a valid GameState.
   */
  function normalizeState(state) {
    return normalizeGameState(state);
  }

  /**
   * Parse free-text input into a structured ParsedAction.
   */
  function parse(text, state) {
    return parseAction(text, state);
  }

  /**
   * Validate an action against the current state (cheat-prevention layer).
   */
  function validateAction(action, state) {
    return validateActionComprehensive(action, state);
  }

  /**
   * Execute a validated action against state.
   * Returns { success, state, description?, reason?, changes? }.
   */
  function execute(action, state) {
    return executeAction(action, state, {});
  }

  /**
   * Unified step: parse (if text) → validate → execute → observe → return StepResult.
   *
   * @param {{ kind: "text", text: string } | { kind: "action", action: object }} input
   * @param {object} state
   * @returns {object} StepResult
   */
  function step(input, state) {
    // 1. Resolve action
    let action;
    if (input.kind === "text") {
      action = parseAction(input.text, state);
      if (!action || !action.type) {
        return {
          ok: false,
          tick: currentTick,
          reason: "Could not parse input into a valid action.",
        };
      }
    } else if (input.kind === "action") {
      action = input.action;
    } else {
      return {
        ok: false,
        tick: currentTick,
        reason: `Unknown input kind: ${input?.kind}`,
      };
    }

    // 2. Validate
    const validation = validateActionComprehensive(action, state);
    if (validation && !validation.valid) {
      return {
        ok: false,
        tick: currentTick,
        reason: validation.reason || "Action validation failed.",
        validation,
      };
    }

    // 3. Execute
    const result = executeAction(action, state, {});
    if (!result || !result.success) {
      return {
        ok: false,
        tick: currentTick,
        reason: result?.reason || "Action execution failed.",
      };
    }

    const nextState = result.state ?? state;

    // 4. Observe — collect system events (quest complete, level-up, inventory)
    const events = SystemEventObserver.evaluateToEvents(
      state,
      nextState,
      currentTick,
    );

    // 5. Advance tick (only for state-mutating actions)
    currentTick += 1;
    SimBridge.advanceTick();

    // 6. Log command for replay
    SimBridge.logCommand({ type: action.type, payload: action });

    return {
      ok: true,
      tick: currentTick,
      nextState,
      events,
      action,
      summary: result.description,
    };
  }

  /**
   * DJB2-based hash of a normalized state snapshot.
   */
  function hash(state) {
    return hashState(state);
  }

  /**
   * Export seed + command log for deterministic replay.
   */
  function exportReplayFn() {
    const data = SimBridge.exportReplayData
      ? SimBridge.exportReplayData()
      : { seed, commands: SimBridge.commandLog || [] };
    return {
      seed: data.seed ?? seed,
      commands: data.commands || [],
      version: contentVersion,
    };
  }

  /**
   * Replay a saved command sequence from an initial state.
   */
  async function replay(replayData, initialState) {
    const result = await replaySimulation(replayData, { initialState });
    return { state: result.state };
  }

  return {
    // Full SystemEngine interface
    normalizeState,
    parseAction: parse,
    validateAction,
    executeAction: execute,
    step,
    hashState: hash,
    exportReplay: exportReplayFn,
    replay,

    // Backward-compatible aliases (Phase 1 callers)
    normalizeGameState: normalizeState,
    validateActionComprehensive: validateAction,

    // Metadata
    mode,
    contentVersion,
    stateVersion,
    seed,
    clientId,

    /** Current engine tick */
    get tick() {
      return currentTick;
    },
  };
}

