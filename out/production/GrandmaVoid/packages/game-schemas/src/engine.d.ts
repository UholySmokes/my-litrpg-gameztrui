import type { GameState } from "./state";
import type { ParsedAction, ValidationResult } from "./actions";

/** Whether the engine is running client-side (optimistic) or server-side (authoritative). */
export type EngineMode = "client" | "server";

/** Configuration passed to createSystemEngine. */
export type EngineConfig = {
  mode: EngineMode;
  /** Content version string, e.g. "core@2026.02.07+sha256:..." */
  contentVersion: string;
  /** State schema migration key */
  stateVersion: number;
  /** Deterministic PRNG seed */
  seed: number;
  /** Stable device identifier – required for offline sync envelopes */
  clientId?: string;
};

/** Input to SystemEngine.step(). */
export type StepInput =
  | { kind: "text"; text: string }
  | { kind: "action"; action: ParsedAction };

/** An event emitted during a step (quest complete, level-up, etc.). */
export type EngineEvent = {
  type: string;
  tick: number;
  payload?: unknown;
};

/** Result of a single engine step. */
export type StepResult =
  | {
      ok: true;
      tick: number;
      nextState: GameState;
      events: EngineEvent[];
      action: ParsedAction;
      summary?: string;
    }
  | {
      ok: false;
      tick: number;
      reason: string;
      validation?: ValidationResult;
    };

/**
 * The deterministic SystemEngine facade.
 * Platform adapters (web, tauri, engine-client) call this instead of
 * importing dozens of internal modules.
 */
export interface SystemEngine {
  normalizeState(state: unknown): GameState;
  parseAction(text: string, state: GameState): ParsedAction;
  validateAction(action: ParsedAction, state: GameState): ValidationResult;
  executeAction(
    action: ParsedAction,
    state: GameState,
  ): {
    success: boolean;
    state: GameState;
    description?: string;
    reason?: string;
    changes?: unknown;
  };
  step(input: StepInput, state: GameState): StepResult;

  /** DJB2-based hash of a normalized state snapshot. */
  hashState(state: GameState): string;

  /** Export seed + command log for deterministic replay. */
  exportReplay(): {
    seed: number;
    commands: Array<{ type: string; payload: unknown }>;
    version: string;
  };

  /** Replay a saved command sequence from an initial state. */
  replay(
    replayData: {
      seed: number;
      commands: Array<{ type: string; payload: unknown }>;
    },
    initialState: GameState,
  ): { state: GameState };
}
