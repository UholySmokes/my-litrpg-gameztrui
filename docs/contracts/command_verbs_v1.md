# Command Verbs v1 Contract

Status: Draft (initial verb freeze for M7 start slice)  
Last updated: 2026-02-24

## 1. Scope

This document locks the initial `TRIGGER` command verb set used by:

- `POST /api/sync/command` payload validation.
- Sync core trigger normalization and replay.
- Progression scenario harness baselines.

## 2. Allowed Verbs

`command.type = "TRIGGER"` supports only:

1. `ENTER_TILE`
2. `INTERACT`
3. `ZONE_EXIT`
4. `ENCOUNTER_GATE`
5. `SAVEPOINT`

## 3. Envelope Consistency Rules

- `command.verb` is required for v1 command clients.
- If `command.triggerType` is present, it must equal `command.verb`.
- If top-level `triggerType` is present, it must equal `command.verb`.
- Unsupported verb values are rejected with `UNSUPPORTED_COMMAND_VERB`.
- Mismatched verb/trigger values are rejected with `COMMAND_VERB_TRIGGER_MISMATCH`.

## 4. Execution Policy

Verb policy used by sync batching/reconcile behavior:

- `ENTER_TILE`: `batchable = true`, `immediate = false`
- `INTERACT`: `batchable = false`, `immediate = true`
- `ZONE_EXIT`: `batchable = false`, `immediate = true`
- `ENCOUNTER_GATE`: `batchable = false`, `immediate = true`
- `SAVEPOINT`: `batchable = false`, `immediate = true`

## 5. Change Control

- Additions or removals of verbs require:
1. Update to this contract.
2. Update to `functions/lib/sync-command-contract.js`.
3. Updated route/core validation tests and progression scenario evidence.
