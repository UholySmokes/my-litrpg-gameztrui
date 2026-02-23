# Godot 4 Vertical Slice (Firebase Trigger-Commit)

This folder contains a desktop-first Godot 4 scaffold for the locked vertical slice:

1. One tiny 2D map loop (`map_village_square` <-> `map_training_glade`).
2. One NPC (`npc_guide`) with a quest-flag chain.
3. One encounter gate transition trigger.
4. Save + load via `SAVEPOINT` commit and `sync/pull`.
5. Story beat/prose panel rendering from canonical state.

## Runtime Config

Set these exports in the Godot editor on the `AuthClient` and `SyncClient` nodes:

1. `AuthClient.api_key`: Firebase Web API key.
2. `SyncClient.api_base_url`: API host root, e.g. `https://<region>-<project>.cloudfunctions.net/api`.
3. `Main.run_id`: stable run ID for this save slot/session.

## Input

1. `WASD` / arrow keys: local movement (client-authoritative).
2. `E`: interact trigger precheck + immediate commit.
3. `F`: savepoint trigger precheck + immediate commit.
4. `L`: pull canonical state for load/reconcile.

## Trigger Model Notes

1. `ENTER_TILE` commits are batched (`<=100ms`, max 4).
2. `INTERACT`, `ZONE_EXIT`, `ENCOUNTER_GATE`, `SAVEPOINT` flush pending batch and send immediately.
3. Client prechecks are local (distance, LoS, cooldown).
4. Server remains authoritative for trigger validation and state transitions.
