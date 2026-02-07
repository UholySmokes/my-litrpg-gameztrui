import type { ParsedAction } from "./actions";

/**
 * Canonical action envelope sent from client to server.
 * Server validates and assigns authoritative seq/tick.
 */
export type ActionEnvelope = {
  /** UUID — unique per action submission */
  id: string;
  /** UUID — identifies the game run */
  runId: string;
  /** Stable device identifier (persisted in localStorage or local DB) */
  clientId: string;
  /** Monotonically increasing per clientId within a run */
  clientSeq: number;
  /** ISO 8601 timestamp of when the client created this envelope */
  createdAt: string;
  /** Content version the client was using */
  contentVersion: string;
  /** The player input */
  input: { kind: "text"; text: string } | { kind: "action"; action: ParsedAction };
};

/**
 * Server response after processing an action envelope.
 */
export type ActionSubmitResult =
  | {
      accepted: true;
      seq: number;
      tick: number;
      nextStateHash: string;
      snapshot?: unknown;
    }
  | {
      accepted: false;
      reason: string;
      canonicalTip?: { seq: number; tick: number; stateHash: string };
    };

/**
 * Response from sync:pull — the server's canonical tip for a run.
 */
export type SyncPullResult = {
  seq: number;
  tick: number;
  stateHash: string;
  snapshot?: unknown;
};
