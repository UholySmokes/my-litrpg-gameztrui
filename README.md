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
- **Backend Integrations**: Firebase Hosting + Firebase Functions API, Foundry narrative service
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
- `npm run build` – Production build (Vite)
- `npm run preview` – Preview production build
- `npm run lint` – ESLint with React hooks rules

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

## 🔧 Contribution Tips

1. Run `npm run lint` before committing (hooks & unused-var rules are strict).
2. Keep constants/config in `state.config` or dedicated data files – no magic numbers.
3. When adding content (races, quests, scenes), use JSON/registry files to remain generator-friendly.
4. Update `current_state.md` and relevant docs when adding/removing systems.

---

## 📜 License

Currently internal / TBD. Contact the maintainers before distribution.

