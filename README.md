# LitRPG Narrative Engine

Immersive LitRPG experience built with React + Vite. The project combines deterministic quest/scene generation, class-specific resource systems (Rage, Chi, Stealth), and AI-assisted narrative to deliver a dynamic text adventure.

---

## ✨ Features

- **Character Creation Reworked** – deterministic race/class/talent rolls with seeded rerolls, profession hooks, and skill pools.
- **Dynamic Quest & Opening Scene Builder** – `QuestSetup.js` derives quests/scenes from character snapshots and cached seeds.
- **AI Narrative Layer** – `useNarrative` + `PromptAssembler` craft opening prompts and story beats, with caching to keep scenes consistent.
- **Combat + Class Resources** – turn-based combat, class abilities, and HUD widgets for Berserker Rage, Monk Chi combos, and stealth readiness.
- **Persistence** – Azure SQL cloud saves via Functions, local autosave, and deterministic rewinds.
- **Support Systems** – Gacha, Shop, Title unlocks, quest log, minion panel, etc.

---

## 🧱 Tech Stack

- **Frontend**: React 18 + Vite, hooks-first architecture
- **State/Game Logic**: Custom hook `useGameEngine`, immutable reducers, config-driven balance
- **Styling**: CSS modules + inline HUD styling for neon HUD aesthetic
- **Backend Integrations**: Azure SQL (cloud saves) + Azure Functions, Azure Foundry narrative service
- **Tooling**: ESLint (React hooks rules), npm scripts, Node 18+

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+ (comes with Node)
- Azure SQL + Functions (optional; needed for cloud saves) and narrative API endpoint

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
# For static hosting, set to your deployed API URL.
VITE_NARRATE_ENDPOINT=...

# Cloud saves (optional; enables persistence)
# Uses Azure Functions + Azure SQL (Managed Identity).
VITE_API_BASE_URL=...
VITE_AUTH_PROVIDER=aad

# Narrative API runs via /api/narrate (Azure Foundry + managed identity).
# No OpenAI key is required for this setup.
```

Azure Functions local dev (for `api/`):

- Copy `api/local.settings.example.json` to `api/local.settings.json`.
- Fill in `FOUNDRY_PROJECT_ENDPOINT`, agent IDs, and Azure credentials.
- Keep `api/local.settings.json` out of git (it is ignored).
- Cloud auth uses Azure Static Web Apps / Easy Auth (`/.auth/login/<provider>`). Set `VITE_AUTH_PROVIDER` if you use a provider other than `aad`.

Narrative endpoint notes:
- Static hosting (GitHub Pages): deploy the API separately and set `VITE_NARRATE_ENDPOINT` to its full URL.
- Azure Static Web Apps / Functions: `/api/narrate` uses Azure Foundry credentials (see `api/narrate/index.js`).
- For SWA auth to work with `/api/saves`, call the API on the same host (use relative `/api` or set `VITE_API_BASE_URL` to the SWA host, not the raw Function App URL).
- Runtime config: `public/runtime-config.js` is copied to `dist/runtime-config.js` during build. Leave it empty, or set `VITE_API_BASE_URL` / `VITE_NARRATE_ENDPOINT` in CI so `scripts/generate-runtime-config.js` injects values at build time.
- SWA routing: keep `public/staticwebapp.config.json` in the build output so `/runtime-config.js` is served as a static file.
- Health check: `/api/health` verifies Azure SQL connectivity (requires auth in SWA).

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
- `AZURE_SQL_SCHEMA.md` – Azure SQL schema for cloud saves

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
