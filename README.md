# Void-Verse: LitRPG Narrative Engine

A cross-platform LitRPG game with AI-driven narration, deep character progression, and deterministic gameplay systems. Play in the browser or natively on Android via Godot — backed by a shared engine that keeps every run reproducible and balanced.

## ⚠️ Development Status (2026-05-21)
The project is currently undergoing a significant transition and UI rewrite (Runic shell).
- **Build Status**: Current production build is broken due to import errors in the React shell (e.g., `ProgressBar` in `AdventureShell.jsx`).
- **Backend Integration**: Transitioning from Firebase to Supabase. Some backend modules (`functions/lib/supabase.js`, `functions/lib/cors.js`) are currently missing or in development.
- **Test Health**: Approximately 40 of 170 test suites are failing due to ongoing refactors in the combat and backend systems.
- **Audit Reports**: See `docs/audits/swarm-audit-2026-05-21.md` for the latest status.

## What's In The Box
- **55 Playable Races**: Evolution paths (Mortal → Awakened → Ascendant → Mythic → Transcendent), hidden traits, and meaningful trade-offs.
- **16+ Classes**: Three tiers with unique resource mechanics (rage, chi, mana, focus, energy) and 100+ skills per class.
- **AI-Assisted Narrative**: Typewriter display, mood tracking, and turn-based story generation via OpenAI (with Gemini/Cerebras fallback).
- **Deterministic Gameplay Engine**: Reducer-driven state, seeded PRNG, and action replay for sync/debugging.
- **Modular Systems**: 20+ systems including combat, loot, quests, crafting, magic, prestige, and more.
- **Cross-Platform**: Shared core across React Web app, Godot Native client, and Backend API.
- **Cloud Saves**: Autosave, resume, and cross-device sync (Firebase/Supabase).

## Architecture
```text
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
          │  Backend API       │
          │  (functions/ &     │
          │   supabase/)       │
          └────────────────────┘
```

**Source of Truth**: Gameplay logic lives in `packages/game-core/src/`. The paths `src/core`, `src/data`, `src/systems` are legacy shims — prioritize changes in the `packages/` directory.

### Runtime Entry Points
| Runtime | Entry | State Root |
|---------|-------|------------|
| Web | `index.html` → `src/main.jsx` | `src/hook/usegamestate.js` |
| API | `functions/index.js` → `functions/lib/api-router.js` | Firestore / Supabase |
| Godot | `godot/project.godot` | Generated config bundles |
| Simulation | `sim_gamestart_fixed.js` | In-memory |

## Tech Stack
- **Frontend**: React 19, Vite, OpenTelemetry.
- **Shared Engine**: `@voidverse/game-core` (Pure JS, deterministic).
- **Schemas**: Zod 4 (`@voidverse/game-schemas`).
- **Backend**: Firebase Functions (Node.js) & Supabase (PostgreSQL).
- **AI**: OpenAI (GPT-4o/o1), Google Gemini, Cerebras Cloud.
- **Native Client**: Godot 4 (GDScript).
- **Testing**: Jest 30, Playwright.
- **Observability**: OpenTelemetry.

## Getting Started

### Prerequisites
- **Node.js 20+** and **npm 9+**
- **Firebase CLI** — for local hosting and functions emulators.
- **Supabase CLI** — for local database development.
- **API Keys**: OpenAI (`OPENAI_API_KEY`), Gemini (`GOOGLE_GENAI_API_KEY`), or Cerebras (`CEREBRAS_API_KEY`).

### Installation
```bash
git clone https://github.com/<org>/my-litrpg-gameztrui.git
cd my-litrpg-gameztrui
npm install
npm run ai:setup
```

### Configuration
1. Run `npm run ai:setup` to seed your initial `.env.local`.
2. Update `.env.local` with your API keys (see `.env.example`).
3. For Firebase Functions emulators, place secrets in `functions/.secret.local`.

### Run
```bash
# Web app (Vite dev server on :5173)
npm run dev

# Local API dev server
npm run dev:api

# Both at once
npm run dev:stack
```

## Scripts

### Development & Build
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start web app |
| `npm run dev:api` | Start local API server |
| `npm run dev:stack` | Start both concurrently |
| `npm run build` | Production build (Vite) |
| `npm run lint` | Run ESLint across the project |
| `npm run typecheck` | TypeScript compiler check |

### Testing & Validation
| Command | Purpose |
|---------|---------|
| `npm test` | Full Jest test suite |
| `npm run test:smoke` | Critical-path smoke tests |
| `npm run check` | Comprehensive check: lint, typecheck, validation, smoke tests |
| `npm run validate:registries` | Check data registry integrity |
| `npm run validate:archetypes` | Validate race/class archetype definitions |
| `npm run validate:worldbuild` | World-building consistency check |
| `npm run validate:balance-corridors`| Validate numeric balance corridors |

### Simulation
| Command | Purpose |
|---------|---------|
| `npm run simulate` | Run full game-start simulation |
| `npm run simulate:quick` | Quick run (10 iterations, no logs) |
| `npm run simulate:full` | Full run (100 iterations) |

### Vercel Workflow
The project uses Vercel for preview and production web deployments.
- `npm run vercel:link`: Link to the canonical Vercel project.
- `npm run vercel:pull`: Pull environment variables and settings.
- `npm run vercel:build`: Build Vercel output locally.
- `npm run vercel:deploy:preview`: Deploy prebuilt output as a preview.

### Godot & Android
The project supports two Android delivery tracks:
1. **PWA**: `npm run build:pwa`
2. **Godot Native**: `npm run generate:godot-config` → `npm run android:export:release`
See `docs/ANDROID_TOOLCHAIN_CONTRACT.md` for toolchain requirements.

## Project Structure
```text
packages/
  game-core/src/          Shared engine: reducers, systems, data registries, PRNG
  game-schemas/           Zod schemas for cross-platform contracts
src/
  components/             React components (Web UI and Runic shell)
  hook/                   React hooks (state, narrative, save)
  world/                  World generation and exploration
functions/
  lib/                    Firebase Functions API handlers and persistence
supabase/                 Supabase migrations and configuration
api/                      Vercel API route definitions
godot/                    Godot 4 project source and assets
scripts/                  Build, validation, and generation tooling
tests/                    Unit, security, performance, and E2E tests
docs/                     Contracts, runbooks, and audit reports
shared/                   Shared utility scripts (e.g., save-cutover)
```

## AI Workspace
The project includes specialized AI tooling to support development.
- `npm run ai:doctor`: Diagnose AI tool and environment posture.
- `npm run ai:check`: Validate AI workspace policy.
- `npm run hermes:setup`: Bootstrap the Hermes AI integration.

## License
The codebase is currently under mixed licensing:
- **Apache License 2.0**: See `LICENSE` for details.
- **MIT License**: See `LICENSE.txt` for details.
All rights reserved for proprietary content and lore.

---
*TODO: Complete missing Supabase backend modules (`supabase.js`, `cors.js`) in `functions/lib/`.*
*TODO: Fix `ProgressBar` import corruption in `src/components/ui/ProgressBar.jsx`.*
