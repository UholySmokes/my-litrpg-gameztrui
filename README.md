# LitRPG Narrative Engine

Immersive LitRPG experience built with React + Vite. The project combines deterministic quest/scene generation, class-specific resource systems (Rage, Chi, Stealth), and AI-assisted narrative to deliver a dynamic text adventure.

---

## ✨ Features

- **Character Creation Reworked** – deterministic race/class/talent rolls with seeded rerolls, profession hooks, and skill pools.
- **Dynamic Quest & Opening Scene Builder** – `QuestSetup.js` derives quests/scenes from character snapshots and cached seeds.
- **AI Narrative Layer** – `useNarrative` + `PromptAssembler` craft opening prompts and story beats, with caching to keep scenes consistent.
- **Combat + Class Resources** – turn-based combat, class abilities, and HUD widgets for Berserker Rage, Monk Chi combos, and stealth readiness.
- **Persistence** – Supabase save/load, local autosave, and deterministic rewinds.
- **Support Systems** – Gacha, Shop, Title unlocks, quest log, minion panel, etc.

---

## 🧱 Tech Stack

- **Frontend**: React 18 + Vite, hooks-first architecture
- **State/Game Logic**: Custom hook `useGameEngine`, immutable reducers, config-driven balance
- **Styling**: CSS modules + inline HUD styling for neon HUD aesthetic
- **Backend Integrations**: Supabase (auth + cloud saves), OpenAI-compatible narrative service
- **Tooling**: ESLint (React hooks rules), npm scripts, Node 18+

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+ (comes with Node)
- Supabase + OpenAI/API keys (optional but needed for save + AI narrative)

### Installation

```bash
git clone https://github.com/<org>/my-litrpg-gameztrui.git
cd my-litrpg-gameztrui
npm install

```

### Environment

Create `.env.local` (for local dev only):

```bash
# Supabase (optional; enables persistence)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# OpenAI is not used on GitHub Pages.
# If you run a serverless host, set OPENAI_API_KEY on the server.
OPENAI_API_KEY=...
```

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
