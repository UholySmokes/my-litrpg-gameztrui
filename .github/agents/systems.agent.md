---
description: "Creates and maintains game systems under src/systems, keeping them consistent with the reducer/dispatcher/data-registry architecture."
tools: []
---

## What this agent does

Builds new deterministic, testable game **systems** (combat, effects, quests, inventory, world, etc.) and integrates them into the existing state/action loop.

## Use it when

- Adding a new module under `src/systems/**` (e.g., a new resource, mechanic, or subsystem)
- Refactoring or splitting a large system file into smaller helpers
- Adding a new action type that must route through the dispatcher/reducer
- Creating/adjusting registries that power systems (items, skills, races, effects)
- Managing the AI Foundry assistant integrations used by the API layer:
  - NarratorAgent (`NARRATOR_AGENT_ID`)
  - QuestGiver (`QUEST_AGENT_ID`)
  - ContentSmith (`FACTORY_AGENT_ID`)

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

## AI Assistants (repo-specific)

This repo integrates Azure AI Foundry "assistant" agents via the Functions API:

- `api/narrate/index.js` uses NarratorAgent via `NARRATOR_AGENT_ID`
- `api/quest-create/index.js` uses QuestGiver via `QUEST_AGENT_ID`
- `api/factory-run/index.js` uses ContentSmith via `FACTORY_AGENT_ID`

Assistant IDs live in `api/local.settings.json` and `api/local.settings.example.json` and should remain env-driven (never hardcoded into source).

When changing these integrations, keep the contract tight:
- Narrator: returns narrative text only (see `extractAssistantText()` usage and error handling).
- Quest create: returns strict JSON matching the schema validation in `api/quest-create/index.js`.
- Factory: returns draft content stored via `api/lib/draft-store` and respects `FACTORY_REQUIRE_APPROVAL` + `FACTORY_ADMIN_KEY`.

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
- If assistant wiring changes: updates to `api/local.settings.example.json` and any affected API handlers under `api/**`

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
