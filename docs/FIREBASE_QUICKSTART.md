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

## Firebase-Native Agent Flows (OpenAI + Gemini Fallback)

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

- Narration agents (`narrator`, `combat`, `dialogue`, `world`, `system`, `quest`) default to OpenAI Responses (`openai-responses`) when `AI_TEXT_PROVIDER=openai`.
- OpenAI path uses `OPENAI_API_KEY` + `OPENAI_MODEL` (default `gpt-5.4-mini`), with `OPENAI_ALLOWED_MODELS` allowlist support.
- On retryable OpenAI failures (429/5xx/timeout), runtime auto-falls back to Gemini (`google-ai-studio`/`vertex-ai`) and marks `fallbackUsed=true`.
- `content_smith` remains Gemini-first to keep the existing bulk generation flow unchanged.
- Gemini execution uses `genkit` + `@genkit-ai/google-genai` and falls back to Vertex ADC when no Gemini API key is set.
- Vertex location defaults to `global` (`GENKIT_VERTEX_LOCATION` to override).
- Gemini auth uses `GOOGLE_GENAI_API_KEY` (or `GOOGLE_API_KEY`) when provided, otherwise Vertex ADC credentials.

## Local setup for these agents

1. A template now exists at `functions/.env.example`.
2. Create `functions/.env.local` from that template.
3. Add provider credentials in `functions/.env.local`:
   - `OPENAI_API_KEY=<your-openai-key>`
   - `GOOGLE_GENAI_API_KEY=<your-gemini-key>` (recommended fallback)
   - or `GOOGLE_APPLICATION_CREDENTIALS=<path-to-service-account.json>` (Vertex fallback)
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

- `AI_TEXT_PROVIDER` (optional, default `openai`)
- `OPENAI_API_KEY` (required for OpenAI primary execution)
- `OPENAI_MODEL` (optional, default `gpt-5.4-mini`)
- `OPENAI_ALLOWED_MODELS` (optional CSV allowlist, defaults to `OPENAI_MODEL` + `gpt-5.4-mini`)
- `OPENAI_TEMPERATURE` (optional fallback temperature for OpenAI path)
- `GOOGLE_GENAI_API_KEY` (recommended for Gemini fallback auth)
- `GOOGLE_API_KEY` (optional Gemini alias)
- `GEMINI_MODEL` (optional Gemini model default, `gemini-2.5-flash`)
- `GENKIT_ALLOWED_MODELS` (optional Gemini allowlist, defaults to `GEMINI_MODEL` + `gemini-2.5-flash`)
- `GEMINI_TEMPERATURE` (optional Gemini temperature)
- `GENKIT_VERTEX_LOCATION` (optional, default `global`)

Deployed secret handling:

- Set `OPENAI_API_KEY` in Firebase/Google Secret Manager and bind it to runtime functions.
- Keep local keys in `functions/.env.local` for emulator use only.

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

