# Firebase Quickstart (Hosting + Functions)

This repository includes a Firebase Hosting + Cloud Functions implementation under `functions/`.

## Runtime Ownership (Functions)

`functions/` is JS-first at runtime:
- Production entrypoint: `functions/index.js`
- Request routing and business logic: `functions/lib/**/*.js`
- Package contract: `functions/package.json` uses CommonJS with `main: index.js`

`functions/src/` is not the deployed runtime path for API handling. It primarily contains generated artifacts (notably `functions/src/dataconnect-admin-generated/**`) and should not be treated as the source of truth for `/api/*` behavior.

Template-only Firebase/Genkit TypeScript scaffolds are kept under `functions/_templates/` to avoid confusion with deployed code.

## What This Enables

- Hosting rewrites `/api/*` to a single Firebase function named `api`.
- The Firebase function currently implements:
  - `GET /api/health`
  - `POST /api/narrate`
  - `POST /api/narrate-start`
  - `GET /api/narrate-poll`
  - `GET /api/saves`
  - `GET /api/saves/:id`
  - `POST /api/saves`
  - `PUT /api/saves/:id`
  - `DELETE /api/saves/:id`

The endpoints keep the same response shape (`ok`, `narrative`, `mood`, `suggestions`).

Auth requirements:

- `GET /api/health` and `GET /api/agents` are public.
- AI execution endpoints require auth (`/api/agents/run`, `/api/narrate*`, callable `agentRun`).
- Save endpoints (`/api/saves*`) require auth.
- In local non-production runs, `x-dev-user-id` / `DEV_USER_ID` can be used as a dev fallback.

## Firebase-Native Agent Flows (Genkit + Gemini)

The Firebase function now also exposes Google/Firebase-native multi-agent routes:

- `GET /api/agents` (lists available agents)
- `POST /api/agents/run` (runs one agent synchronously)
- Callable functions:
  - `agentList`
  - `agentRun`

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

- Uses `genkit` + `@genkit-ai/google-genai`.
- If `GOOGLE_GENAI_API_KEY` is set, it uses Gemini Developer API (`googleAI`) and does not require Vertex API enablement.
- If no API key is set, it uses Vertex AI (`vertexAI`) with ADC credentials.
- Model defaults to `GEMINI_MODEL` or `gemini-2.5-flash`.
- Vertex location defaults to `global` (`GENKIT_VERTEX_LOCATION` to override).
- Uses `GOOGLE_GENAI_API_KEY` (or `GOOGLE_API_KEY`) when provided, otherwise falls back to Vertex ADC credentials.

## Local setup for these agents

1. A template now exists at `functions/.env.example`.
2. Create `functions/.env.local` from that template.
3. Add one auth method in `functions/.env.local`:
   - `GOOGLE_GENAI_API_KEY=<your-key>`
   - or `GOOGLE_APPLICATION_CREDENTIALS=<path-to-service-account.json>`
4. Start emulators:

```bash
npm run dev:api
```

5. Test:

```bash
curl -X GET http://127.0.0.1:5000/api/agents
curl -X POST http://127.0.0.1:5000/api/agents/run \
  -H "Content-Type: application/json" \
  -H "x-dev-user-id: local-dev" \
  -d '{"agent":"narrator","input":{"game_state":{"location":"Ashen Gate","hp":42}}}'

curl -X POST http://127.0.0.1:5000/api/saves \
  -H "Content-Type: application/json" \
  -H "x-dev-user-id: local-dev" \
  -d '{"saveName":"Auto Save","gameState":{"location":"Ashen Gate"}}'

curl -X GET http://127.0.0.1:5000/api/saves \
  -H "x-dev-user-id: local-dev"
```

Callable usage (Web SDK):

```js
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions(undefined, "us-central1");
const agentRun = httpsCallable(functions, "agentRun");
const agentList = httpsCallable(functions, "agentList");

const listResult = await agentList();
const runResult = await agentRun({
  agent: "narrator",
  input: { game_state: { location: "Ashen Gate", hp: 42 } }
});
```

## Required Environment Variables (Functions)

Firebase-native agent vars:

- `GOOGLE_GENAI_API_KEY` (recommended for Gemini API key auth)
- `GOOGLE_API_KEY` (optional alias)
- `GEMINI_MODEL` (optional, default `gemini-2.5-flash`)
- `GENKIT_ALLOWED_MODELS` (optional CSV allowlist, defaults to `GEMINI_MODEL` + `gemini-2.5-flash`)
- `GEMINI_TEMPERATURE` (optional, per-agent defaults apply)
- `GENKIT_VERTEX_LOCATION` (optional, default `global`)

Narration/timeouts:

- `/api/narrate*` now runs on Firebase Genkit agents.
- `NARRATE_RUN_TIMEOUT_MS` (optional, default `120000`)

Save storage and local auth:

- `GAME_DB_STORAGE` (optional: `firestore` or `file`)
- `GAME_DB_PATH` (optional file path for `file` backend)
- `GAME_SAVES_COLLECTION` (optional Firestore collection name, default `game_saves`)
- `DEV_USER_ID` / `DEV_USER_EMAIL` (optional local dev auth fallback for `/api/saves`)

## Frontend Configuration

The frontend uses same-origin API paths only:

- `VITE_API_BASE_URL` (optional path prefix such as `/`) for `/api/*`.
- If unset, it will call same-origin `/api/*`.
- Absolute external URLs are ignored by runtime config and client endpoint resolvers.

Frontend auth config (Firebase Auth):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- Optional: `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MEASUREMENT_ID`
- Optional: `VITE_FIREBASE_AUTH_TENANT_ID`
- Optional for local auth emulator: `VITE_FIREBASE_AUTH_EMULATOR_URL`
- Provider selector: `VITE_AUTH_PROVIDER` (default `microsoft.com`; `aad` alias also maps to `microsoft.com`)

Local dev fallback (optional):

- `VITE_DEV_USER_ID`
- `VITE_DEV_USER_EMAIL`

For Firebase Hosting, prefer **same-origin** (do not set `VITE_API_BASE_URL`) and rely on hosting rewrites.

## Files Added

- `firebase.json` (Hosting rewrites `/api/**` → Function `api`)
- `functions/` (Firebase Cloud Functions implementation)

