# Telemetry Ingest v1 Contract

Status: Draft (M9 observability scaffold)  
Last updated: 2026-02-24

## 1. Endpoint

`POST /api/telemetry`

Auth: same auth model as sync routes (Bearer token or local dev override headers).

## 2. Request Body

```json
{
  "source": "godot",
  "sessionId": "session-1",
  "build": "godot-4.6.1",
  "clientTime": "2026-02-24T16:01:00.000Z",
  "tags": {
    "client": "godot",
    "platform": "windows"
  },
  "events": [
    {
      "type": "sync_pull",
      "level": "info",
      "ts": "2026-02-24T16:00:00.000Z",
      "message": "pull success",
      "data": { "seq": 12, "tick": 12 }
    }
  ]
}
```

Validation:

- `events` is required and must contain `1-200` entries.
- `events[n].type` is required.
- `events[n].ts` must be a valid timestamp if provided.
- `events[n].level` is normalized to one of: `debug`, `info`, `warn`, `error`.

## 3. Success Response

HTTP `202`

```json
{
  "ok": true,
  "requestId": "uuid",
  "accepted": 1,
  "dropped": 0,
  "receivedAt": "2026-02-24T16:01:01.000Z"
}
```

## 4. Error Responses

- `400`: `INVALID_TELEMETRY_BATCH`, `INVALID_TELEMETRY_EVENT`
- `401`: `UNAUTHENTICATED`
- `500`: `UNEXPECTED_TELEMETRY_ERROR`
