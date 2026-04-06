# Void-Verse: LitRPG Narrative Engine

A cross-platform LitRPG game with AI-driven narration, deep character progression, and deterministic gameplay systems. Play in the browser or natively on Android via Godot — backed by a shared engine that keeps every run reproducible and balanced.

## What's In The Box

- **55 playable races** with evolution paths (Mortal → Awakened → Ascendant → Mythic → Transcendent), hidden traits, and meaningful trade-offs.
- **16+ classes** across three tiers with unique resource mechanics — rage, chi, mana, focus, energy — and 100+ skills per class (active + passive).
- **AI-assisted narrative** with typewriter display, mood tracking, and per-turn story generation via OpenAI (with Gemini fallback).
- **Deterministic gameplay engine** — reducer-driven state, seeded PRNG, action replay for sync and debugging.
- **20+ modular systems** — combat, loot, quests, crafting, professions, magic, prestige, inventory, effects, and more.
- **Cross-platform** — React web app, Godot native client, and Firebase API all share `@voidverse/game-core`.
- **Cloud saves** with autosave, resume, and cross-device sync.

## Architecture

```
┌─────────────┐    ┌──────────────────┐    ┌──────────────┐
│  React Web  │    │  Godot Native    │    │  Simulation  │
│  (src/)     │    │  (godot/)        │    │  CLI         │
└──────┬──────┘    └────────┬─────────┘    └──────┬───────┘
       │                    │                     │
       └────────────┬───────┴─────────────────────┘
                    │
          ┌─────────┴──────────┐
          │  @voidverse/       │
          │  game-core         │
          │  (packages/        │
          │   game-core/src/)  │
          └─────────┬──────────┘
                    │
          ┌─────────┴──────────┐
          │  Firebase API      │
          │  (functions/)      │
          └────────────────────┘
```

**Source of truth**: Gameplay logic lives in `packages/game-core/src/`. The paths `src/core`, `src/data`, `src/systems` are back-compat shims — start changes in the package, not the shims.

### Runtime Entry Points

| Runtime | Entry | State Root |
|---------|-------|------------|
| Web | `index.html` → `src/main.jsx` → `src/App.jsx` → `GameUIRoot.jsx` | `src/hook/usegamestate.js` |
| API | `functions/index.js` → `functions/lib/api-router.js` | Firestore / file backend |
| Godot | `godot/project.godot` | Generated config bundles |
| Simulation | `sim_gamestart_fixed.js` | In-memory |

### Save Flow

Web client (`src/core/CloudSaveService.js`) ↔ API save store (`functions/lib/saves-store.js`) + sync store (`functions/lib/sync-store.js`).

## Project Structure

```text
packages/
  game-core/src/          Shared engine: reducers, systems, data registries, PRNG
  game-schemas/           Zod schemas for cross-platform type contracts
src/
  components/gameui/      Web UI shell, character creation, overlays
  hook/                   React hooks (state, narrative, save, UI control)
  data/                   Static content (titles, shops, quests, gacha)
  world/                  World generation and exploration
functions/
  lib/                    API route handlers, persistence backends
godot/
  scenes/                 Game scenes (.tscn)
  scripts/                GDScript logic
  assets/                 Graphics, audio, animations
  data/                   Generated race/class/skill bundles
docs/                     Contracts, runbooks, and the repo map
scripts/                  Build, validation, and generation tooling
tests/                    Unit, security, performance, and E2E tests
```

See [docs/REPO_MAP.md](docs/REPO_MAP.md) for task-based navigation.

## Getting Started

### Prerequisites

- **Node.js 20+** and **npm 9+**
- **Firebase CLI** — for local hosting and functions emulators
- **OpenAI API key** (`OPENAI_API_KEY`) — primary AI narration provider
- **Gemini API key** (`GOOGLE_GENAI_API_KEY`) or Application Default Credentials — recommended fallback provider

For local Firebase emulators, place provider secrets in `functions/.secret.local`.

### Install

```bash
git clone https://github.com/<org>/my-litrpg-gameztrui.git
cd my-litrpg-gameztrui
npm install
npm run ai:setup
```

### Configure

Create `.env.local`:

```bash
VITE_NARRATE_ENDPOINT=/api/narrate
VITE_API_BASE_URL=
VITE_AUTH_PROVIDER=microsoft.com

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

<details>
<summary>Optional variables</summary>

```bash
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_FIREBASE_AUTH_TENANT_ID=...
VITE_FIREBASE_AUTH_EMULATOR_URL=http://127.0.0.1:9099
VITE_DEV_USER_ID=local-dev
VITE_DEV_USER_EMAIL=local-dev@example.com
VITE_WEB_GAMEPLAY_ENABLED=true
```

</details>

For Firebase Functions emulator secrets, create `functions/.secret.local`:

```bash
OPENAI_API_KEY=...
# Optional Gemini fallback
# GOOGLE_GENAI_API_KEY=...
```

### Run

```bash
# Web app (Vite dev server on :5173)
npm run dev

# Firebase emulators (hosting :5000, functions :5001)
npm run dev:api

# Both at once
npm run dev:stack
```

Leave `VITE_API_BASE_URL` empty to use same-origin `/api/*`.
Runtime builds outside dev enable web gameplay by default unless a build profile overrides it.

## AI Workspace

The canonical AI workspace lives in [docs/ai/README.md](docs/ai/README.md).

```bash
npm run ai:setup
npm run ai:doctor
npm run ai:check
```

- `ai:setup` seeds local-only scaffolding for Codex-first workstations.
- `ai:doctor` reports tool and environment posture.
- `ai:check` validates AI workspace policy and runs as part of `npm run check`.

## Commands

### Development

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start web app |
| `npm run dev:api` | Start Firebase emulators |
| `npm run dev:stack` | Start both concurrently |
| `npm run ai:setup` | Seed local AI workspace files |
| `npm run ai:doctor` | Diagnose AI tool and env posture |
| `npm run ai:check` | Validate AI workspace policy |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

### Testing

| Command | Purpose |
|---------|---------|
| `npm test` | Full Jest suite |
| `npm run test:smoke` | Critical-path smoke tests |
| `npm run test:firestore-rules` | Firestore security rules |
| `npm run test:performance` | Performance baselines |
| `npm run check` | Lint + typecheck + validation + smoke tests |
| `npm run check:functions` | Validate Firebase Functions package |

### Simulation

| Command | Purpose |
|---------|---------|
| `npm run simulate` | Run game-start simulation |
| `npm run simulate:quick` | Quick run (10 iterations, no logs) |
| `npm run simulate:full` | Full run (100 iterations) |

### Validation

| Command | Purpose |
|---------|---------|
| `npm run validate:registries` | Check data registry integrity |
| `npm run validate:archetypes` | Validate archetype definitions |
| `npm run validate:worldbuild` | World-building consistency check |
| `npm run validate:balance-corridors` | Balance corridor validation |

### Android

Two delivery tracks:

1. **PWA** — `npm run build:pwa`
2. **Godot native** — `npm run android:preflight` → `npm run android:export:internal` → `npm run android:export:release`

See [docs/ANDROID_TOOLCHAIN_CONTRACT.md](docs/ANDROID_TOOLCHAIN_CONTRACT.md) and [docs/ANDROID_READINESS_CHECKLIST.md](docs/ANDROID_READINESS_CHECKLIST.md).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite |
| Shared engine | `@voidverse/game-core` (pure JS, deterministic) |
| Schemas | Zod 4 (`@voidverse/game-schemas`) |
| API | Firebase Functions (Node.js) |
| Database | Firestore |
| AI | OpenAI Responses API + Google Gemini fallback |
| Native client | Godot 4 + GDScript |
| Testing | Jest 30, Playwright |
| Observability | OpenTelemetry |

## Contributing

1. **Gameplay logic goes in `packages/game-core/src/`** — not the shim paths under `src/`.
2. Keep balancing numbers and registry content in config/data files, not inline magic values.
3. Run `npm run check` before submitting changes.
4. Update the nearest contract or workflow doc when changing runtime behavior.
5. Treat checked-in generated artifacts as hygiene bugs unless explicitly documented as source.

## License

All rights reserved. Contact the maintainers for licensing inquiries.
