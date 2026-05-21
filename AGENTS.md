# AGENTS

## Canonical AI Workflow

**Start here:** `docs/ai/README.md` — defines Codex-first workflow, playbooks, and tool matrix.

## Quick Navigation

### Find What You Need

- **Architecture & Data**: `README.md` (tech stack, entry points, directory structure)
- **Coding Standards & Patterns**: `.cursorrules` (immutability, balance values in config, naming conventions)
- **Frontend & Deployment**: `.github/instructions/40-firebase-api-runtime-boundary.instructions.md`
- **Game Mechanics**: `.github/instructions/30-game-balance-and-determinism.instructions.md`
- **Testing & Jest**: `.github/instructions/20-test-and-jest-triage.instructions.md`
- **Generated Code Guard**: `.github/instructions/10-generated-code-guard.instructions.md`

### Key Files & Directories

| Path                                     | Purpose                                                         |
|------------------------------------------|-----------------------------------------------------------------|
| `packages/game-core/src/`                | **Source of truth** for gameplay logic, reducers, systems, PRNG |
| `src/core/`, `src/data/`, `src/systems/` | Legacy shims — changes should go to `packages/game-core/src/`   |
| `src/components/`                        | React components (Web UI, Runic shell)                          |
| `functions/lib/`                         | Firebase API handlers and persistence                           |
| `scripts/`                               | Build, validation, generation tooling                           |
| `tests/`                                 | Unit, integration, and E2E tests                                |

### Development Commands

```bash
npm run dev              # Frontend (Vite, :5173)
npm run dev:api         # Firebase Functions emulator
npm run dev:stack       # Both concurrently
npm run lint            # ESLint validation
npm run test(:smoke)    # Jest suite (or smoke tests only)
npm run check           # Lint + typecheck + validation + smoke tests
npm run validate:*      # Check registries, archetypes, balance, worldbuild
npm run simulate        # Game-start simulation (10+ iterations)
```

### Entry Points

| Runtime    | Entry                                                | State Root                 |
|------------|------------------------------------------------------|----------------------------|
| Web        | `index.html` → `src/main.jsx`                        | `src/hook/usegamestate.js` |
| API        | `functions/index.js` → `functions/lib/api-router.js` | Firestore / Supabase       |
| Godot      | `godot/project.godot`                                | Generated config bundles   |
| Simulation | `sim_gamestart_fixed.js`                             | In-memory                  |

## Core Patterns

### State Management

- Reducer-driven: `src/core/gameReducer.js`, `src/core/ActionDispatcher.js`
- **MUST be immutable** — use spread operators, never mutate state directly
- Pure functions: no side effects, no direct I/O in reducers

### Game Balance

- **Never hardcode numbers** — all balance values come from `state.config` or external data files
- See `.cursorrules` critical rules #1–3 for examples
- Use `packages/game-core/src/data/` and registries for skill, race, class definitions

### Deterministic RNG

- Use `packages/game-core/src/utils/DeterministicRandom.js` for all randomness in game logic
- Never use `Math.random()` directly — breaks replay and testing
- Seeded PRNG allows reproducible simulations across runs

### Naming Conventions

- **Skill IDs**: `class_skill_name` (e.g., `knight_charge`)
- **Item IDs**: `adjective_noun` (e.g., `rusty_sword`)
- **Config keys**: `camelCase` (e.g., `criticalHitMultiplier`)
- **File IDs**: lowercase, snake_case, `[a-z0-9_]` only

## Project Status (2026-05-21)

- React shell import errors (e.g., `ProgressBar`) blocking production builds — check `README.md` for details
- ~40 of 170 test suites failing due to combat/backend refactors
- Supabase migration in progress; Firebase Functions still operational for emulator/deployed testing
- Lint debt exists repo-wide; focus on focused lint checks per
  `.github/instructions/20-test-and-jest-triage.instructions.md`

## Playtest Audit Context

- Browser playtest redesign audit target: root web shell at `/`, usually `http://127.0.0.1:5173/` locally; active path is `App.jsx -> GameUIRoot.jsx -> CharacterHub -> CharacterCreationShell -> AdventureShell`.
- Audit framing: level 1 immediately after character creation is the mandatory fresh-start completion point; level 2 at 100 XP is the first earned milestone and remains optional addendum-only evidence.
- Recurring UX trust defects: Oath-to-spawn mismatch, contradictory Oath review state (`Origin not selected` alongside a visible starting point), Soul Crucible decision density, install prompt competing with first-impression onboarding, and stale warning/runtime-accessibility noise that makes the shell feel less reliable than the golden path actually is.
- Audit artifacts: `docs/audits/playtest-redesign-20260405/`, with primary synthesis in `docs/audits/playtest-redesign-20260405/mandatory-synthesis.md`, runtime target notes in `docs/audits/playtest-redesign-20260405/runtime-readiness.md`, and implementation plan in `docs/audits/playtest-redesign-20260405/implementation-plan.md`.
- Repo-wide lint debt exists outside this audit scope; recent `npm run lint` failures should not be read as playtest-audit-specific regressions.
