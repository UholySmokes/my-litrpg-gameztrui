# Repo Map

This repo has a shared-logic core plus multiple runtime shells. The fastest way to stay oriented is to separate "source of truth" from "compatibility surface."

## Source Of Truth

- `packages/game-core/src/`
  Shared gameplay logic, reducers, data registries, combat systems, progression, quest rewards, magic systems, save-state normalization, and content packs.

- `src/`
  Web app runtime and UI. This is where browser composition, auth, hooks, and presentation live.

- `src/core`, `src/data`, `src/systems`, `src/simulation`
  Mostly compatibility shims that re-export from `@voidverse/game-core`. Useful for older imports, but not the first place to edit gameplay behavior.

## Where To Start By Task

### Gameplay system changes

Start in:

- `packages/game-core/src/core/gameReducer.js`
- `packages/game-core/src/data/initialState.js`
- `packages/game-core/src/systems/combat/CombatSystem.js`
- `packages/game-core/src/systems/skills/SkillRegistry.js`

### Web runtime and UI flow

Entry chain:

1. `index.html`
2. `src/main.jsx`
3. `src/App.jsx`
4. `src/components/gameui/GameUIRoot.jsx`

State root:

- `src/hook/usegamestate.js`

High-value UI area:

- `src/components/gameui/`

### Saves and backend persistence

Web client:

- `src/core/CloudSaveService.js`

Firebase runtime:

- `functions/index.js`
- `functions/lib/saves-store.js`
- `functions/lib/sync-store.js`

High-value backend area:

- `functions/lib/`

### Godot runtime

- `godot/`

This contains the native client, Android export template, generated config, and data bundles.

## Navigation Warnings

- `README.md` is intended to describe the current repo shape, but gameplay truth still lives in `packages/game-core/src`, not under legacy import surfaces.
- The repo contains generated/output-heavy areas. Treat tracked IDE files, coverage, local Data Connect state, Firebase export snapshots, and temp docs as hygiene issues unless a contract explicitly says they are canonical.

## Practical Default

For day-to-day work, focus on:

- `packages/game-core/`
- `src/components/gameui/`
- `functions/lib/`
