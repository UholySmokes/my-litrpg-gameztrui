/**
 * Content pack manifest — pinned into game state so the engine
 * can validate compatibility and trigger content migrations.
 */
export type ContentManifest = {
  /** Pack identifier, e.g. "core" */
  id: string;
  /** Semver or date-based version, e.g. "2026.02.07" */
  version: string;
  /** SHA-256 hex digest of the bundle payload */
  hash: string;
  /** Expected state schema version — used for migration gating */
  stateVersion: number;
  /** Minimum client version required to load this content */
  minClientVersion?: string;
  /** Individual bundle entries */
  bundles: Array<{ key: string; hash: string }>;
};
