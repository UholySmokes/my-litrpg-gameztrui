# LitRPG Narrative Engine

Immersive LitRPG experience built with React + Vite, shared gameplay systems in `@voidverse/game-core`, Firebase-backed APIs, and a parallel Godot client.

## Features

- Character creation with deterministic race, class, perk, profession, and skill-pool selection.
- Shared gameplay systems for combat, progression, quests, magic, saves, and content generation.
- Web runtime with AI-assisted narration and cloud save support.
- Native Godot runtime with generated config and character option bundles.

## Source Of Truth

The repo has two main application layers, and they are not equal:

- Gameplay systems and reducers live in `packages/game-core/src/**`.
- Web UI and browser runtime live in `src/**`.
- `src/core`, `src/data`, `src/systems`, and `src/simulation` are mostly back-compat re-export shims that point at `@voidverse/game-core`.

If we are changing gameplay behavior, start in `packages/game-core/src`, not the shim paths under `src`.

## Runtime Entry Points

Web app startup flows through:

1. `index.html`
2. `src/main.jsx`
3. `src/App.jsx`
4. `src/components/gameui/GameUIRoot.jsx`

State for the web runtime is rooted in `src/hook/usegamestate.js`.

Backend runtime starts at `functions/index.js`, with route handling in `functions/lib/**`.

Godot runtime and export assets live under `godot/`.

Save flow crosses both clients and backend storage:

- Web client: `src/core/CloudSaveService.js`
- API save store: `functions/lib/saves-store.js`
- API sync store: `functions/lib/sync-store.js`

## Project Structure

```text
packages/game-core/src/       Shared gameplay logic, reducers, data registries, and systems
src/components/gameui/        Web gameplay shell and UI composition
src/hook/                     Browser runtime hooks (state, narrative, UI control)
functions/lib/                Firebase API handlers and persistence backends
godot/                        Native client, exports, generated config, and assets
docs/                         Contracts, workflow notes, and repo maps
```

For a quicker navigation guide, see `docs/REPO_MAP.md`.

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Firebase CLI for local hosting/functions emulators
- Gemini credentials (`GOOGLE_GENAI_API_KEY`) or ADC for agent-backed narration

### Installation

```bash
git clone https://github.com/<org>/my-litrpg-gameztrui.git
cd my-litrpg-gameztrui
npm install
```

### Environment

Create `.env.local` for local-only configuration:

```bash
VITE_NARRATE_ENDPOINT=/api/narrate
VITE_API_BASE_URL=
VITE_AUTH_PROVIDER=microsoft.com

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...

# Optional:
# VITE_FIREBASE_MESSAGING_SENDER_ID=...
# VITE_FIREBASE_STORAGE_BUCKET=...
# VITE_FIREBASE_MEASUREMENT_ID=...
# VITE_FIREBASE_AUTH_TENANT_ID=...
# VITE_FIREBASE_AUTH_EMULATOR_URL=http://127.0.0.1:9099
# VITE_DEV_USER_ID=local-dev
# VITE_DEV_USER_EMAIL=local-dev@example.com
# VITE_WEB_GAMEPLAY_ENABLED=true
```

For Firebase local dev:

- Run `npm run dev:api` to start Hosting + Functions emulators.
- Run `npm run dev` for the Vite web app.
- Leave `VITE_API_BASE_URL` empty to use same-origin `/api/*`.

## Common Commands

- `npm run dev` starts the web app.
- `npm run dev:api` starts Firebase emulators.
- `npm run build` builds the web tooling profile.
- `npm run lint` runs ESLint.
- `npm test` runs Jest.
- `npm run check` runs the main repo validation suite.
- `npm run check:functions` validates the Firebase runtime package.
- `npm run android:preflight` validates the local Godot/Android toolchain.

## Android Delivery Tracks

Two supported Android paths:

1. Web PWA track via `npm run build:pwa`
2. Godot native track via `npm run android:preflight`, `npm run android:export:internal`, and `npm run android:export:release`

Supporting docs:

- `docs/ANDROID_TOOLCHAIN_CONTRACT.md`
- `docs/ANDROID_READINESS_CHECKLIST.md`
- `docs/REPO_MAP.md`

## Contribution Notes

1. Keep gameplay numbers and registry content in shared data/config, not scattered magic values.
2. Treat checked-in generated or local-machine artifacts as hygiene bugs unless the repo explicitly documents them as source files.
3. When changing runtime behavior, update the closest contract or workflow doc if the repo surface changed.

## License

Currently internal / TBD. Contact the maintainers before distribution.
