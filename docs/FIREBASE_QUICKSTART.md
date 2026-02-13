# Firebase Quickstart (Hosting + Functions)

This repository currently contains an Azure Functions backend under `api/`.
In parallel, it now includes a Firebase Hosting + Cloud Functions implementation under `functions/`.

## What This Enables

- Hosting rewrites `/api/*` to a single Firebase function named `api`.
- The Firebase function currently implements:
  - `GET /api/health`
  - `POST /api/narrate`
  - `POST /api/narrate-start`
  - `GET /api/narrate-poll`

The endpoints mirror the existing Azure versions and keep the same response shape (`ok`, `narrative`, `mood`, `suggestions`).

## Firebase-Native Agent Flows (Genkit + Gemini)

The Firebase function now also exposes Google/Firebase-native multi-agent routes:

- `GET /api/agents` (lists available agents)
- `POST /api/agents/run` (runs one agent synchronously)

Supported agents:

- `narrator`
- `quest`
- `content_smith`
- `combat`
- `dialogue`
- `world`
- `system`

Example request:

```json
{
  "agent": "narrator",
  "input": {
    "game_state": {
      "location": "Ashen Gate",
      "playerHp": 42
    }
  },
  "model": "gemini-2.5-flash",
  "temperature": 0.9
}
```

Runtime notes:

- Uses `genkit` + `@genkit-ai/google-genai` with Vertex AI plugin.
- Model defaults to `GEMINI_MODEL` or `gemini-2.5-flash`.
- Vertex location defaults to `global` (`GENKIT_VERTEX_LOCATION` to override).
- Uses `GOOGLE_GENAI_API_KEY` (or `GOOGLE_API_KEY`) when provided, otherwise falls back to Vertex ADC credentials.

## Required Environment Variables (Functions)

Set these in your Firebase Functions environment (or in local emulators via `.env` in `functions/`):

- `FOUNDRY_PROJECT_ENDPOINT`
- `FOUNDRY_API_KEY`
- `FOUNDRY_API_VERSION` (optional, default `2025-05-01`)

Agent IDs (mode routing):

- `NARRATOR_AGENT_ID` (required)
- `COMBAT_AGENT_ID` (optional)
- `DIALOGUE_AGENT_ID` (optional)
- `SYSTEM_AGENT_ID` (optional)
- `WORLD_AGENT_ID` (optional)

Timeouts:

- `FOUNDRY_HTTP_TIMEOUT_MS` (optional, default `30000`)
- `NARRATE_RUN_TIMEOUT_MS` (optional, default `120000`)

## Frontend Configuration

The frontend uses:

- `VITE_API_BASE_URL` (if set) to call `/api/*` endpoints on the deployed host.
- If unset, it will call same-origin `/api/*`.

For Firebase Hosting, prefer **same-origin** (do not set `VITE_API_BASE_URL`) and rely on hosting rewrites.

## Files Added

- `firebase.json` (Hosting rewrites `/api/**` → Function `api`)
- `functions/` (Firebase Cloud Functions implementation)

