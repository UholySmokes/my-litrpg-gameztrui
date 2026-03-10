# ADR 2026-02-23: RunEvent `eventType` Discriminator

Status: Accepted  
Date: 2026-02-23  
Milestone: M1 - Canonical State v2 Schema and Migration

## Context

Roadmap M1 requires explicit command-vs-trigger identity in persisted event streams while preserving backward compatibility for existing trigger-era runs.

## Decision

Use `RunEvent.eventType` as the explicit discriminator (instead of introducing a separate `CommandLog` table in this phase).

Chosen values:

- `TRIGGER`
- `COMMAND`

Fallback behavior during migration:

- Missing/unknown values normalize to `TRIGGER`.
- Existing trigger-only events remain valid without destructive migration.

## Implementation

Schema change:

- `dataconnect/schema/schema.gql`: added `RunEvent.eventType` (nullable string for dual-read transition).

Adapter/store changes:

- `functions/lib/sync-core.js`: added mixed-stream normalization helpers (`normalizeEventType`, `normalizeSyncEvent`).
- `functions/lib/sync-store.js`: read/write `event_type` + normalize legacy rows.
- `functions/lib/sync-dataconnect-store.js`: normalize Data Connect event records and pass `eventType` on create where supported.

Codegen:

```bash
npx firebase dataconnect:sdk:generate
```

Generated SDK updates were applied across:

- `src/dataconnect-generated/*`
- `api/src/dataconnect-generated/*`
- `packages/game-schemas/src/dataconnect-generated/*`
- `packages/game-core/src/dataconnect-generated/*`
- `functions/src/dataconnect-admin-generated/*`

## Compatibility Notes

- v1 trigger-commit payloads continue to function.
- Event consumers can now rely on explicit identity when present and deterministic defaulting when absent.
- No hard cutover required; this is migration-safe for mixed historical data.

## Verification Evidence

- `npm test -- tests/unit/SyncCoreDeterminism.test.js tests/unit/SyncDataconnectStore.test.js tests/unit/SyncProcess.test.js tests/unit/SyncValidation.test.js --runInBand` (pass)
- `npm test -- tests/unit/ApiRouterSyncRoutes.test.js tests/unit/SyncCommandRoutes.test.js tests/unit/SyncProcess.test.js tests/unit/SyncValidation.test.js --runInBand` (pass)

