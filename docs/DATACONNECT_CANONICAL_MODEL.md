# Data Connect Canonical Model

The Firebase Data Connect schema now models the trigger-commit runtime directly.

## Canonical Tables

1. `UserProfile`
2. `RunSession`
3. `RunEvent`
4. `SaveSlot`
5. `StoryMemory`

## Contract Alignment

1. `RunSession` stores canonical sync tip fields (`runId`, `seq`, `tick`, `stateHash`, `contentVersion`, `stateVersion`) and dynamic JSON payloads (`playerPosJson`, `entityStatesJson`, `questFlagsJson`).
2. `RunEvent` stores commit-level audit records (`commitId`, `clientSeq`, `triggerType`, acceptance/rejection metadata).
3. `SaveSlot` remains compatible with existing SDK operations while adding optional runtime JSON fields.
4. `StoryMemory` stores per-run memory fragments (`memoryKey`, `memoryJson`, `lastSeq`).

## Backend Selection

`functions/lib/sync-store.js` now supports:

1. `SYNC_DB_STORAGE=file` (local dev/tests)
2. `SYNC_DB_STORAGE=firestore` (fallback path)
3. `SYNC_DB_STORAGE=dataconnect` (canonical path)

Default behavior:

1. If `GAME_DB_STORAGE=file`, sync stays file-backed.
2. Otherwise sync defaults to Data Connect with automatic Firestore fallback unless `SYNC_DATACONNECT_STRICT=true`.
