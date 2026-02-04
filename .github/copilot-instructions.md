# Copilot Instructions for AI Coding Agents

## Overview
This document provides essential guidelines for AI coding agents working within the `my-litrpg-gameztrui` codebase. It covers the architecture, workflows, conventions, and integration points critical for effective development.

## Architecture
- **State Flow**: Most mechanics are deterministic state transforms.
  - `src/core/gameReducer.js`: Canonical state transition reducer.
  - `src/core/ActionDispatcher.js`: Routes user actions to system functions (e.g. combat, movement).
  - `src/core/StateNormalizer.js`: Normalizes incoming state and provides default config values.
  - `src/core/EventBus.js`: Emits events and logs them into simulation via `src/simulation/bridge/SimulationContext.js`.

- **Component Boundaries**: Major components include:
  - **Simulation**: Handled by `sim_gamestart_fixed.js`, which manages game state during simulations.
  - **Narration**: `src/core/PromptAssembler.js` builds prompts from state + action results (systems should not generate prose).
  - **Systems**: Modular mechanics under `src/systems/**` (combat, effects, inventory, leveling, quest, etc.).

## Developer Workflows
- **Building**: Use the command `npm install` in the `api` directory to install dependencies.
- **Testing**: Ensure all tests are run after modifications. Use `npm test` to execute the test suite.
- **Debugging**: Utilize console logs and the built-in debugger in your IDE to trace issues.

## Project-Specific Conventions
- **Documentation**: Maintain updated documentation in `README.md`, `current_state.md`, and `.cursorrules`. Follow the coding standards outlined in `.cursorrules`.
- **State Management**: Avoid direct state mutations. Use reducers defined in `useGameState.js` for state updates.

## Copilot Agents
- Prefer using the custom agent in `.github/agents/systems.agent.md` when adding or refactoring modules under `src/systems/**`.

## Integration Points
- **External Dependencies**: The project relies on several external libraries. Ensure they are documented in `package.json` and installed via npm.
- **Cross-Component Communication**: Use event dispatchers for communication between components. Check `ActionDispatcher.js` for implementation details.

## AI Assistants (API)
- Azure AI Foundry assistants are wired through Functions env vars (do not hardcode IDs):
  - `NARRATOR_AGENT_ID` → `api/narrate/index.js` (NarratorAgent)
  - `QUEST_AGENT_ID` → `api/quest-create/index.js` (QuestGiver)
  - `FACTORY_AGENT_ID` → `api/factory-run/index.js` (ContentSmith)
  - Defaults/examples live in `api/local.settings.example.json`.

## Key Files/Directories
- **Documentation**: Refer to `current_state.md` for feature tracking and `system_specs.md` for game rules.
- **Simulation Scripts**: The main simulation script is located in `sim_gamestart_fixed.js`. Output files are generated in the format `simulation_results_*.json/csv`.

## Don'ts
- Do not hardcode numeric values for game balance.
- Avoid importing markdown files directly into code.
- Ensure all state changes are verifiable and do not skip null checks.

---

This document should be updated as the project evolves. For any unclear sections or additional information needed, please provide feedback for further iterations.