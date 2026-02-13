# Copilot Instructions for AI Coding Agents

## Overview
This document provides essential guidelines for AI coding agents working within the `my-litrpg-gameztrui` codebase. It covers the architecture, workflows, conventions, and integration points critical for effective development.

## Architecture
- **State Flow**: Most mechanics are deterministic state transforms.
  - `src/core/gameReducer.js`: Canonical state transition reducer.
  - `src/core/ActionDispatcher.js`: Routes user actions to system functions (e.g. combat, movement).
  - `src/core/StateNormalizer.js`: Normalizes incoming state and provides default config values.
  - `src/core/EventBus.js`: Emits events and logs them into simulation via `src/simulation/bridge/SimulationContext.js`.

- **Component Boundaries**: Major components include:
  - **Simulation**: Handled by `sim_gamestart_fixed.js`, which manages game state during simulations.
  - **Narration**: `src/core/PromptAssembler.js` builds prompts from state + action results (systems should not generate prose).
  - **Systems**: Modular mechanics under `src/systems/**` (combat, effects, inventory, leveling, quest, etc.).
  - **Game Core**: Shared logic in `packages/game-core/` (workspace package `@voidverse/game-core`).

## Deployment Architecture
- **Frontend**: Firebase Hosting at `https://my-litrpg-gameztrui-3416-da75c.web.app`.
  - SWA workflow builds frontend only (`api_location: ""`).
  - Runtime config injected via `public/runtime-config.js`.
- **API**: Firebase Function `api` (rewritten from `/api/**` via `firebase.json`).
  - Deployed independently from the SWA.
  - Uses managed identity (service principal) for Azure AI Foundry auth.
- **Storage**: File-based DB (`GAME_DB_STORAGE=file`, `GAME_DB_PATH=data/game-db.json`).
  - Static data seeded during CI via `npm run seed:static`.
  - Seed script: `scripts/seed-static-data.cjs`.

## Developer Workflows
- **Building**: `npm install` at root (workspaces) and `cd api && npm install` for API deps.
- **Testing**: `npm test` to execute the test suite.
- **Seeding**: `npm run seed:static` to generate the static data bundle for file storage.
- **Debugging**: Use console logs and IDE debugger. Check `api/health` endpoint for runtime diagnostics.

## Environment Variables

### API (Function App)
- `FOUNDRY_ENDPOINT` — Azure AI Foundry endpoint URL.
- `FOUNDRY_DEPLOYMENT` — Model deployment name.
- `FOUNDRY_API_KEY` — API key (leave empty to use managed identity).
- `NARRATOR_AGENT_ID` — Foundry agent ID for narration (`api/narrate/index.js`).
- `QUEST_AGENT_ID` — Foundry agent ID for quests (`api/quest-create/index.js`).
- `FACTORY_AGENT_ID` — Foundry agent ID for content (`api/factory-run/index.js`).
- `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` — Service principal for `DefaultAzureCredential`.
- `GAME_DB_STORAGE` — `file` or `sql`.
- `GAME_DB_PATH` — Relative path for file DB (e.g. `data/game-db.json`).
- `NARRATE_RUN_TIMEOUT_MS` — Server-side run timeout (default 240000).
- `AZURE_AI_RUN_TIMEOUT_MS` — Foundry run polling timeout.
- `AZURE_AI_HTTP_TIMEOUT_MS` — Foundry HTTP request timeout.

### Frontend (runtime-config.js)
- `VITE_API_BASE_URL` — Base URL for API calls (leave empty for same-origin `/api`).
- `VITE_NARRATE_TIMEOUT_MS` — Client-side narrate request timeout (default 240000).
- `VITE_AUTH_PROVIDER` — Auth provider (optional, e.g. `aad`).

## Project-Specific Conventions
- **Documentation**: Maintain updated documentation in `README.md`, `current_state.md`, and `.cursorrules`. Follow the coding standards outlined in `.cursorrules`.
- **State Management**: Avoid direct state mutations. Use reducers defined in `useGameState.js` for state updates.

## Copilot Agents
- Prefer using the custom agent in `.github/agents/systems.agent.md` when adding or refactoring modules under `src/systems/**`.

## Integration Points
- **External Dependencies**: Documented in `package.json` and installed via npm.
- **Cross-Component Communication**: Use event dispatchers. Check `ActionDispatcher.js` for details.
- **API calls**: Frontend uses `src/core/AIService.js` which reads `VITE_API_BASE_URL` from runtime config. Fallback URLs are only used when no base URL is configured.

## Streaming Narration
- The narrate system supports a streaming mode via start + poll:
  - `POST /api/narrate-start` → Creates Foundry thread/run, returns `{ threadId, runId }` (HTTP 202).
  - `GET /api/narrate-poll?threadId=X&runId=X` → Returns `{ status, narrative, done }` (HTTP 200 when done, 202 while running).
- Client (`src/core/AIService.js`) uses `generateNarrativeStream()` with `onChunk` callbacks for live UI updates.
- Falls back transparently to synchronous `POST /api/narrate` on failure.
- `src/hook/useNarrative.js` inserts a placeholder narrative entry and updates it in-place as chunks arrive.

## Key Files/Directories
- `public/runtime-config.js` — Runtime configuration injected into the frontend.
- `api/lib/azure-ai-utils.js` — Shared Foundry HTTP utilities (fetchJson, auth).
- `api/lib/foundry-run.js` — Shared Foundry thread/run lifecycle (start, poll, await).
- `api/lib/game-db-file.js` — File-based DB backend.
- `api/narrate-start/` — Streaming start endpoint (POST).
- `api/narrate-poll/` — Streaming poll endpoint (GET).
- `scripts/seed-static-data.cjs` — Seeds static data bundle.
- `packages/game-core/` — Shared game logic workspace package.
- `src/core/AIService.js` — Client-side API service (narrate, quest, streaming).
- `src/data/StaticDataBootstrap.js` — Fetches static data bundle on app init.
- `.github/workflows/azure-static-web-apps-kind-ocean-050c15c10.yml` — CI/CD workflow.

## Don'ts
- Do not hardcode numeric values for game balance.
- Do not hardcode agent IDs — use env vars (`NARRATOR_AGENT_ID`, etc.).
- Avoid importing markdown files directly into code.
- Ensure all state changes are verifiable and do not skip null checks.
- Do not add API endpoints to the SWA `api/` path — all API functions live in the external Function App.

---

This document should be updated as the project evolves. For any unclear sections or additional information needed, please provide feedback for further iterations.

