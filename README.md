# LitRPG Narrative Engine

Immersive LitRPG experience built with React + Vite. The project combines deterministic quest/scene generation, class-specific resource systems (Rage, Chi, Stealth), and AI-assisted narrative to deliver a dynamic text adventure.

---

## ✨ Features

- **Character Creation Reworked** – deterministic race/class/talent rolls with seeded rerolls, profession hooks, and skill pools.
- **Dynamic Quest & Opening Scene Builder** – `QuestSetup.js` derives quests/scenes from character snapshots and cached seeds.
- **AI Narrative Layer** – `useNarrative` + `PromptAssembler` craft opening prompts and story beats, with caching to keep scenes consistent.
- **Combat + Class Resources** – turn-based combat, class abilities, and HUD widgets for Berserker Rage, Monk Chi combos, and stealth readiness.
- **Persistence** – Firebase-backed API routes for cloud features, local autosave, and deterministic rewinds.
- **Support Systems** – Gacha, Shop, Title unlocks, quest log, minion panel, etc.

---

## 🧱 Tech Stack

- **Frontend**: React 18 + Vite, hooks-first architecture
- **State/Game Logic**: Custom hook `useGameEngine`, immutable reducers, config-driven balance
- **Styling**: CSS modules + inline HUD styling for neon HUD aesthetic
- **Backend Integrations**: Firebase Hosting + Firebase Functions API, Genkit/Gemini narrative service
- **Tooling**: ESLint (React hooks rules), npm scripts, Node 18+

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+ (comes with Node)
- Firebase CLI (for local hosting/functions emulators)
- Firebase/Gemini credentials for Genkit agents (`GOOGLE_GENAI_API_KEY` or ADC)

### Installation

```bash
git clone https://github.com/<org>/my-litrpg-gameztrui.git
cd my-litrpg-gameztrui
npm install

```

### Environment

Create `.env.local` (for local dev only):

```bash
# Narrative API (client-side)
# Keep same-origin on Firebase hosting.
VITE_NARRATE_ENDPOINT=/api/narrate

# Cloud saves (optional; enables persistence)
# Leave empty to use same-origin /api/* via Firebase Hosting rewrites.
VITE_API_BASE_URL=...
VITE_AUTH_PROVIDER=microsoft.com

# Narrative API runs via /api/narrate (Firebase Genkit via Firebase Functions).

# Firebase Auth (required for cloud saves with Firebase ID tokens)
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

# Local dev auth fallback (optional)
# VITE_DEV_USER_ID=local-dev
# VITE_DEV_USER_EMAIL=local-dev@example.com

# Web gameplay gate (production-safe default)
# Dev builds always allow gameplay UI.
# Outside dev, gameplay UI is disabled unless explicitly enabled.
# VITE_WEB_GAMEPLAY_ENABLED=true
# (alias: VITE_ENABLE_WEB_GAMEPLAY=true)
```

Firebase local dev:

- Run `npm run dev:api` to start Firebase Hosting + Functions emulators.
- Run `npm run dev` for Vite (the dev proxy forwards `/api` to the hosting emulator).
- Keep `VITE_API_BASE_URL` empty for same-origin `/api/*` calls.

Narrative endpoint notes:
- Static hosting (GitHub Pages): deploy the API separately and set `VITE_NARRATE_ENDPOINT` to its full URL.
- Firebase Hosting + Functions: `/api/narrate` is served via hosting rewrite to the `api` function (`functions/lib/api-router.js`).
- For auth/cookies with `/api/saves`, call the API on the same host (use relative `/api` or set `VITE_API_BASE_URL` to your hosting URL).
- `/api/saves` now supports Firebase ID token auth (`Authorization: Bearer <token>`), with optional dev fallback headers when `VITE_DEV_USER_ID` is set.
- Runtime config: `public/runtime-config.js` is copied to `dist/runtime-config.js` during build. Leave it empty, or set `VITE_API_BASE_URL` / `VITE_NARRATE_ENDPOINT` in CI so `scripts/generate-runtime-config.js` injects values at build time.
- Health check: `/api/health` returns API availability.

### Run / Build / Test

- `npm run dev` – Start Vite dev server with HMR
- `npm run build` - Production tooling build (Vite)
- `npm run build:tooling` - Explicit tooling-only profile
- `npm run build:pwa` - Android-installable PWA profile (web gameplay enabled)
- `npm run preview` – Preview production build
- `npm run lint` – ESLint with React hooks rules
- `npm run test:pwa:installability` - Validate manifest/service-worker/installability contract in `dist`

### Replay Inspector (Dev Only)

The web tooling path includes a dev-only replay/hash inspector window backed by `GET /api/sync/replay`.

Usage:

1. Start API + web locally (`npm run dev:api` and `npm run dev`).
2. Open the game shell in a dev build.
3. Click `Replay Inspector` in quick actions.
4. Enter sync `runId` and click `Fetch`.
5. Inspect canonical tip, `hashTimeline`, and replay timeline rows.

Relevant files:

- `src/components/ReplayInspector.jsx`
- `src/core/SyncReplayService.js`
- `docs/contracts/replay_timeline_v1.md`
- `docs/reports/m8_replay_inspector_acceptance_checklist_2026-02-24.md`

---

## 🧭 Project Structure

```text
src/
├── components/       # UI: GameUI, CombatUI, CharacterCreation, Shop, Gacha
├── hook/             # Game engine, narrative, character creation hooks
├── core/             # Game state, quest setup, prompt assembly, AI service
├── systems/          # Combat, class mechanics (Rage/Chi/Stealth), inventory, etc.
├── data/             # Quest catalogs, opening scenes, registries
├── util/             # Formatters, status renderer, math helpers
└── lib/              # Legacy logic/glue (being consolidated into core/data)

```

Key documentation:

- `current_state.md` – living feature tracker
- `IMPLEMENTATION_PLAN.md` – multi-phase roadmap
- `CLASS_SYSTEMS_SUMMARY.md` – rage/chi/stealth design notes
- `RPG_BLUEPRINT.md` – attribute, race, and class reference

---

## 🧠 Gameplay Highlights

- **System Interface HUD** in `GameUI.jsx` shows HP/Mana, class resources, and quick actions.
- **ClassResourceBar.jsx** mirrors the same data inside `CombatUI.jsx` for live updates mid-fight.
- **Quest + Scene Generation** uses seeded RNG (mulberry32) so the same character snapshot always yields the same hooks.
- **Narrative Cache** ensures repeated openings aren’t re-generated unless the seed or snapshot changes.

---

## Android Delivery Tracks

Two supported Android paths:

1. Web PWA track (browser install):
   - `npm run build:pwa`
   - includes install manifest + service worker + install prompt UX
2. Godot native track (APK/AAB):
   - `npm run android:export:internal`
   - `npm run android:export:release`

Supporting docs:

- `docs/ANDROID_TOOLCHAIN_CONTRACT.md`
- `docs/ANDROID_READINESS_CHECKLIST.md`
- `docs/EXPERIMENTAL_SYSTEMS.md`

## 🔧 Contribution Tips

1. Run `npm run lint` before committing (hooks & unused-var rules are strict).
2. Keep constants/config in `state.config` or dedicated data files – no magic numbers.
3. When adding content (races, quests, scenes), use JSON/registry files to remain generator-friendly.
4. Update `current_state.md` and relevant docs when adding/removing systems.

---

## 📜 License

Currently internal / TBD. Contact the maintainers before distribution.


