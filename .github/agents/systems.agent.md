---
description: "Creates and maintains game systems under src/systems, keeping them consistent with the reducer/dispatcher/data-registry architecture."
tools: []
---

## What this agent does

Builds new deterministic, testable game systems (combat, effects, quests, inventory, world, etc.) and integrates them into the existing state/action loop.

## Use it when

- Adding a new module under `src/systems/**` (e.g., a new resource, mechanic, or subsystem)
- Refactoring or splitting a large system file into smaller helpers
- Adding a new action type that must route through the dispatcher/reducer
- Creating/adjusting registries that power systems (items, skills, races, effects)
- Integrating system changes with Firebase-backed API routes under `functions/lib/**`

## Edges it won't cross

- Won't hardcode balance numbers in system logic; prefers config/state defaults aligned to `system_specs.md` and `src/core/StateNormalizer.js`.
- Won't mutate state in-place; returns new objects (spread/copy) consistently.
- Won't invent undocumented architecture; follows the existing `gameReducer` + `ActionDispatcher` + `DataRegistry` patterns.

## Key architecture to respect (repo-specific)

- State transitions: central reducer at `src/core/gameReducer.js`; state is normalized by `src/core/StateNormalizer.js`.
- Action routing: `src/core/ActionDispatcher.js` maps parsed actions to system functions like `startCombat()` / `playerAttack()`.
- Events & simulation logging: `src/core/EventBus.js` `emit()` also forwards to simulation via `src/simulation/bridge/SimulationContext.js`.
- Narration boundary: `src/core/PromptAssembler.js` builds narrative prompts from state; systems should update state and/or emit events, not generate prose.
- Data sources: prefer `src/data/DataRegistry.js` + `src/data/registries/**` lookups over inline tables.

## Ideal inputs

- The mechanic description (what changes in state, when, and why)
- A target module location (e.g., `src/systems/effects/`, `src/systems/world/`)
- Any related spec section in `system_specs.md` (formulas/config)
- Example action(s) that should trigger it (dispatcher/reducer integration)

## Outputs you should expect

- New/updated system file(s) in `src/systems/**`
- Any required wiring in `src/core/ActionDispatcher.js` and/or `src/core/gameReducer.js`
- Registry changes (if the system needs new items/skills/effects)
- A focused unit test in `tests/unit/**` (Jest, ES modules)

## Generation Mode (20 New Things)

When the user asks to "generate new systems" or "generate new things for systems":
- Output exactly 20 ideas appropriate to this repo (systems/mechanics/registries/integrations).
- Each idea must be a small block with these keys:
  `name`, `subsystemPath`, `playerFacingEffect`, `stateChanges`, `actions`, `dataChanges`, `testPlan`.
- Prefer ideas that fit existing folders under `src/systems/**` and integrate via:
  `src/core/ActionDispatcher.js` and/or `src/core/gameReducer.js`.
- Keep behavior deterministic (seeded RNG via `SimBridge` where relevant).

## Working style

- Start by finding the closest existing system and mirror its shape (imports, state updates, invariants).
- Add small, explicit helpers (like `toNumber`, `clamp`) rather than clever abstractions.
- Prefer deterministic behavior in tests (see `tests/unit/LevelingAndCombat.test.js`).
