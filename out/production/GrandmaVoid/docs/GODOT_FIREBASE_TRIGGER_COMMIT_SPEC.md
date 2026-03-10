# Godot Firebase Trigger-Commit Spec (Implemented)

## Canonical Endpoints

1. `POST /api/sync/commit`
2. `POST /api/sync/commit-batch`
3. `GET /api/sync/pull`
4. `POST /api/sync/action` (legacy wrapper with deprecation headers)
5. `POST /api/story/event`, `POST /api/story/start`, `GET /api/story/poll` (narrate wrappers)

## Trigger Types

1. `ENTER_TILE` (batchable only)
2. `INTERACT` (immediate)
3. `ZONE_EXIT` (immediate)
4. `ENCOUNTER_GATE` (immediate)
5. `SAVEPOINT` (immediate)

## Commit Envelope

```json
{
  "id": "string",
  "runId": "string",
  "clientId": "string",
  "clientSeq": 1,
  "createdAt": "2026-02-23T10:00:00.000Z",
  "contentVersion": "sha256",
  "triggerType": "ENTER_TILE|INTERACT|ZONE_EXIT|ENCOUNTER_GATE|SAVEPOINT",
  "trigger": {
    "triggerId": "string",
    "mapId": "string",
    "x": 0,
    "y": 0,
    "targetId": "optional"
  }
}
```

## Batch Rules

1. Only `ENTER_TILE` is accepted by `/api/sync/commit-batch`.
2. Max batch size: `4`.
3. Max batch window: `100ms` between first and last `createdAt`.
4. Ordered by `clientSeq` and validated strictly server-side.

## Determinism Rules

1. `hashCanonicalState(state)` uses SHA-256 over stable canonical JSON.
2. Deterministic RNG seed derivation: `runSeed + seq + subsystemTag`.
3. Reducer/simulation path excludes wall clock as state input; commit timestamps are explicit inputs.
4. State hash contract tracked as `{seq, tick, stateHash}`.

## Content Version Enforcement

1. `contentVersion` is computed from the shipped world manifest.
2. Server rejects unknown trigger/map/target IDs and mismatched content version.
3. Server validates trigger coordinates and prerequisite flags against manifest.

## Reconciliation Rule

1. Rejected commit returns `reconcileRequired: true`.
2. Client must halt pending gameplay commits, call `GET /api/sync/pull`, apply canonical state, clear queue, resume.

## Firestore Rules Milestone

1. Restrictive rules are now checked by emulator test: `tests/security/firestoreRules.test.js`.
2. CI gate runs with emulator through `npm run test:firestore-rules:emulator`.
3. The emulator gate requires Java 21+; CI pins Temurin 21 and local wrapper script auto-selects Temurin 21 on Windows when installed.
4. Deadline remains hard: before **March 10, 2026**.
