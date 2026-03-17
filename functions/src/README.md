# `functions/src` Status

This folder is **not** the deployed runtime path for the API.

Canonical runtime for Firebase Functions in this repository:
- Entry point: `functions/index.js`
- Route + handler logic: `functions/lib/**/*.js`

What lives here now:
- `functions/src/dataconnect-admin-generated/**` (required by unit tests that exercise Data Connect-backed stores).

Guardrails:
- Runtime ownership is documented in `docs/FIREBASE_QUICKSTART.md`.
- Contract checks are enforced by `npm run validate:runtime-contract`.

Template-only scaffolds:
- Firebase/Genkit starter TypeScript scaffolds live under `functions/_templates/` and are **not** deployed.
