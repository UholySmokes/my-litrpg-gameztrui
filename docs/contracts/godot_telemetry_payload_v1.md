# Godot Telemetry Payload v1

Status: Draft (M9 client contract scaffold)  
Last updated: 2026-02-24

## 1. Producer

- Script: `godot/scripts/telemetry_reporter.gd`
- Transport target: `POST /api/telemetry`

## 2. Payload Shape

```json
{
  "source": "godot",
  "sessionId": "godot-session-1730000000",
  "build": "godot-dev",
  "clientTime": "2026-02-24T16:01:00Z",
  "tags": {
    "client": "godot",
    "runId": "slice-run-001",
    "mapId": "map_village_square",
    "clientId": "godot-client"
  },
  "events": [
    {
      "type": "sync_response",
      "level": "info",
      "ts": "2026-02-24T16:00:00Z",
      "message": "sync_response_ok",
      "data": {
        "status": 200,
        "canonicalSeq": 12,
        "acceptedCount": 1,
        "rejectedCount": 0,
        "reconcileRequired": false
      }
    }
  ]
}
```

## 3. Event Semantics

Minimum event fields:

1. `type` (required)
2. `level` (`debug|info|warn|error`)
3. `ts` (ISO timestamp)
4. `message` (optional string)
5. `data` (optional object)

## 4. Flush Behavior

- Reporter queues events locally via `enqueue_event(...)`.
- `flush(...)` sends up to `max_batch_size` events per request.
- On successful HTTP response (`2xx`), sent events are removed from queue and backoff state is reset.
- For retriable failures (network/5xx/timeouts), events remain queued and exponential backoff is applied (`retry_base_backoff_sec` up to `retry_max_backoff_sec`).
- For non-retriable failures (`400`, `401`, `403`, `404`, `422`), the current batch is dropped and response metadata includes `dropped`.

## 5. Compatibility

- Backend ingest contract: `docs/contracts/telemetry_ingest_v1.md`
