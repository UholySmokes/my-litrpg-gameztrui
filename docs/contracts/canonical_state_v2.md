# Canonical State v2 Contract

Status: Draft (implementation-aligned)  
Last updated: 2026-02-23

## 1. Purpose

Define the canonical gameplay state shape owned by the backend for command-driven sync.

## 2. Top-Level Shape

Canonical state v2 is grouped into four domains:

```json
{
  "worldProjection": {},
  "rpgState": {},
  "narrativeState": {},
  "syncMeta": {}
}
```

## 3. Domain Definitions

### `worldProjection`

Current world/movement projection needed by runtime clients.

```json
{
  "worldId": "voidverse_slice_world_001",
  "mapId": "map_village_square",
  "playerPos": { "x": 6, "y": 8 },
  "entityStates": {}
}
```

### `rpgState`

Deterministic gameplay progression state.

```json
{
  "questFlags": {}
}
```

### `narrativeState`

Narrative continuity fields required for deterministic fallback and story memory linkage.

```json
{
  "runId": "slice-run-001"
}
```

### `syncMeta`

Versioning, sequencing, and integrity fields.

```json
{
  "seq": 12,
  "tick": 12,
  "stateHash": "sha256hex",
  "contentVersion": "sha256hex",
  "stateVersion": 1
}
```

## 4. Current API Compatibility

Current runtime responses expose a flattened `canonicalState` object. The mapping is:

- `canonicalState.worldId` -> `worldProjection.worldId`
- `canonicalState.mapId` -> `worldProjection.mapId`
- `canonicalState.playerPos` -> `worldProjection.playerPos`
- `canonicalState.entityStates` -> `worldProjection.entityStates`
- `canonicalState.questFlags` -> `rpgState.questFlags`
- `canonicalState.runId` -> `narrativeState.runId`
- `canonicalState.seq` -> `syncMeta.seq`
- `canonicalState.tick` -> `syncMeta.tick`
- `canonicalState.stateHash` -> `syncMeta.stateHash`
- `canonicalState.contentVersion` -> `syncMeta.contentVersion`
- `canonicalState.stateVersion` -> `syncMeta.stateVersion`

This allows dual-read during migration while clients adopt the grouped v2 contract.

## 5. Determinism Invariants

- State transition input is commit/command data plus canonical prior state only.
- `seq` is strictly monotonic (`next = prev + 1` on accept).
- `tick` advances exactly once per accepted mutation.
- `stateHash` is SHA-256 over canonicalized deterministic payload fields.
- Rejected commits/commands never mutate canonical tip.

## 6. Versioning and Migration

- Contract version: v2 (domain-grouped layout).
- Storage `stateVersion` remains numeric and is persisted in canonical run session.
- During migration, server may continue returning flattened shape while adapters emit v2 grouped form for downstream consumers.

