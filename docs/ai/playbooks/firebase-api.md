# Firebase And API Playbook

Use this for Firebase Functions, emulator workflows, `/api/*` routes, Genkit or OpenAI-backed server behavior, and local API setup.

## Default Setup

- Operator: Codex
- Model: `gpt-5.4`
- Reasoning: `high`
- Hosting: `cloud`
- Compatibility context: `.gemini/extensions/firebase/`

## Start Here

- `functions/lib/`
- `functions/index.js`
- `docs/FIREBASE_QUICKSTART.md`
- `firebase.json`

## Working Rules

1. Keep server behavior aligned with the documented route contracts.
2. Treat provider selection and model defaults as explicit configuration.
3. Validate both route behavior and local emulator ergonomics when touched.
4. Keep AI runtime changes out of the generic developer workspace unless the task explicitly targets runtime agents.
