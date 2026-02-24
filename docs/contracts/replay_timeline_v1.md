# Replay Timeline v1 Contract

Status: Draft (M8 tooling starter slice)  
Last updated: 2026-02-24

## 1. Endpoint

`GET /api/sync/replay`

Auth: same as sync routes.

## 2. Query Parameters

- `runId` (required): canonical run id.
- `afterSeq` (optional, default `0`): return events after this client sequence.
- `limit` (optional, default `200`, max `500`): max returned events.
- `includeRejected` (optional, default `false`): include rejected events in timeline.

## 3. Response Shape

```json
{
  "ok": true,
  "runId": "run-abc",
  "contentVersion": "sha256hex",
  "canonicalState": {},
  "timeline": [
    {
      "commitId": "run-abc-1",
      "clientSeq": 1,
      "seq": 1,
      "tick": 1,
      "eventType": "TRIGGER",
      "triggerType": "ENTER_TILE",
      "accepted": true,
      "errorCode": null,
      "message": null,
      "stateHash": "sha256hex",
      "createdAt": "2026-02-24T12:00:00.000Z"
    }
  ],
  "hashTimeline": [
    { "seq": 1, "tick": 1, "stateHash": "sha256hex" }
  ]
}
```

## 4. Semantics

- `timeline` is ordered by `clientSeq` ascending.
- `timeline` defaults to accepted events only.
- `hashTimeline` includes accepted checkpoints only and is intended for replay/hash inspector UIs.
- `canonicalState` is the current run tip after all accepted events.

## 5. Errors

- `400`: `MISSING_RUN_ID`
- `404`: `RUN_NOT_FOUND`
- `401`: `UNAUTHENTICATED`
- `500`: `UNEXPECTED_SYNC_ERROR`
