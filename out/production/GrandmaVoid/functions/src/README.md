# `functions/src` Status

This folder is **template/reference-only** and is **not** the deployed runtime path for the API.

Canonical runtime for Firebase Functions in this repository:
- Entry point: `functions/index.js`
- Route + handler logic: `functions/lib/**/*.js`

Why this folder exists:
- It retains Firebase starter/template TypeScript artifacts and generated examples.
- It can be used for future migration experiments, but current production behavior does not execute these files.

Guardrails:
- Runtime ownership is documented in `docs/FIREBASE_QUICKSTART.md`.
- Contract checks are enforced by `npm run validate:runtime-contract`.
