# Copilot Instructions for AI Coding Agents

## Overview
This document describes the current architecture and workflows for `my-litrpg-gameztrui`.

## Architecture
- State flow is reducer-driven (`src/core/gameReducer.js`, `src/core/ActionDispatcher.js`).
- Narrative prompts are assembled in `src/core/PromptAssembler.js`.
- Shared game logic lives in `packages/game-core/`.

## Deployment Architecture
- Frontend: Firebase Hosting (`https://my-litrpg-gameztrui-3416-da75c.web.app`).
- API: Firebase Function `api` (`functions/index.js`).
- Routing: `/api/**` is rewritten to function `api` in `firebase.json`.
- Runtime config is injected via `public/runtime-config.js`.

## Developer Workflows
- Install deps: `npm install`.
- Frontend dev: `npm run dev`.
- API emulator dev: `npm run dev:api`.
- Build: `npm run build`.
- Test: `npm test`.

## Environment Variables

### API
- `GOOGLE_GENAI_API_KEY` - Gemini API key (optional when using Vertex ADC).
- `GEMINI_MODEL` - optional model override.
- `GEMINI_TEMPERATURE` - optional generation temperature.
- `NARRATE_RUN_TIMEOUT_MS` - run timeout.
- `GAME_DB_STORAGE` - save backend (`firestore` or `file`).

### Frontend
- `VITE_API_BASE_URL` - base URL for API calls (leave empty for same-origin `/api`).
- `VITE_NARRATE_ENDPOINT` - optional explicit narrate endpoint.
- `VITE_NARRATE_TIMEOUT_MS` - client timeout.
- `VITE_AUTH_PROVIDER` - optional auth provider.

## Key Files
- `functions/index.js` - Firebase Function export.
- `functions/lib/api-router.js` - API route router.
- `src/core/AIService.js` - client API service.
- `public/runtime-config.js` - runtime frontend config.
- `firebase.json` - rewrites + emulators.

## Conventions
- Keep gameplay numbers in config/data files, not inline magic values.
- Keep reducers pure and avoid direct state mutation.
- Avoid hardcoded external API hosts if same-origin `/api` is available.
