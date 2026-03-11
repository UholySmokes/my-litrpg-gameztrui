# Command Envelope v1 Contract

Status: Draft (target transport contract)  
Last updated: 2026-02-24

## 1. Endpoint

`POST /api/sync/command`

Auth: same as existing sync endpoints (Bearer token, with local dev override support).

## 2. Request Body

Command envelope fields:

```json
{
  "id": "run-abc-42",
  "runId": "run-abc",
  "clientId": "godot-client",
  "clientSeq": 42,
  "createdAt": "2026-02-23T10:00:00.000Z",
  "contentVersion": "sha256hex",
  "command": {
    "type": "TRIGGER",
    "verb": "ENTER_TILE",
    "triggerType": "ENTER_TILE",
    "trigger": {
      "triggerId": "tile_intro_square",
      "mapId": "map_village_square",
      "x": 6,
      "y": 8,
      "targetId": "optional"
    }
  }
}
```

### Field semantics

- `id`: idempotency key scoped to a run.
- `runId`: canonical run session id.
- `clientId`: stable client instance id.
- `clientSeq`: strictly increasing sequence expected by server.
- `createdAt`: ISO-8601 timestamp from client.
- `contentVersion`: active world/content hash expected by server.
- `command.type`: command family (`TRIGGER` in v1 slice).
- `command.verb`: canonical command verb for trigger execution (see `docs/contracts/command_verbs_v1.md`).
- `command.triggerType`: optional compatibility alias for trigger verb; if present, must match `command.verb`.
- `command.trigger`: deterministic trigger payload fields.

### Supported v1 command verbs

`TRIGGER` supports:

1. `ENTER_TILE`
2. `INTERACT`
3. `ZONE_EXIT`
4. `ENCOUNTER_GATE`
5. `SAVEPOINT`

Validation behavior:

- Unknown verb values return `UNSUPPORTED_COMMAND_VERB`.
- Mismatched `verb`/`triggerType` values return `COMMAND_VERB_TRIGGER_MISMATCH`.

## 3. v1 Transitional Compatibility

During migration, the server may normalize `command` payloads into the existing commit shape and route them through current commit processing.

Normalization target:

```json
{
  "id": "...",
  "runId": "...",
  "clientId": "...",
  "clientSeq": 1,
  "createdAt": "...",
  "contentVersion": "...",
  "triggerType": "ENTER_TILE",
  "trigger": {
    "triggerId": "...",
    "mapId": "...",
    "x": 0,
    "y": 0,
    "targetId": null
  }
}
```

## 4. Success Response

HTTP `200`:

```json
{
  "ok": true,
  "runId": "run-abc",
  "accepted": [{ "id": "run-abc-42", "clientSeq": 42, "accepted": true, "seq": 42, "tick": 42, "stateHash": "sha256hex" }],
  "rejected": [],
  "reconcileRequired": false,
  "canonicalState": {},
  "contentVersion": "sha256hex",
  "saveSlotId": null,
  "reconcile": null
}
```

## 5. Reconcile Response

HTTP `409` when command is rejected and client must reconcile:

```json
{
  "ok": false,
  "reconcileRequired": true,
  "accepted": [],
  "rejected": [{ "id": "run-abc-42", "accepted": false, "errorCode": "OUT_OF_ORDER_CLIENT_SEQ", "message": "Commit sequence must be exactly canonical seq + 1." }],
  "reconcile": {
    "pullPath": "/api/sync/pull?runId=run-abc&afterSeq=41"
  }
}
```

## 6. Error Classes

- `400`: malformed envelope/fields (`INVALID_*`).
- `401`: unauthenticated.
- `409`: sequence/state/content mismatch, reconcile required.
- `500`: unexpected server failure.
