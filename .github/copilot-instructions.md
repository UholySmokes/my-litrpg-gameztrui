# Copilot Instructions for AI Coding Agents

## Overview
This document provides essential guidelines for AI coding agents working within the `my-litrpg-gameztrui` codebase. It covers the architecture, workflows, conventions, and integration points critical for effective development.

## Architecture
- **State Flow**: The architecture is designed around a state management system that governs game mechanics and player interactions. Key files include:
  - `gamestate.js`: Central configuration for game constants.
  - `gamelogic.js`: Contains the core logic for game mechanics.

- **Component Boundaries**: Major components include:
  - **Simulation**: Handled by `sim_gamestart_fixed.js`, which manages game state during simulations.
  - **API**: Refer to `api/README.md` for API structure and usage.

## Developer Workflows
- **Building**: Use the command `npm install` in the `api` directory to install dependencies.
- **Testing**: Ensure all tests are run after modifications. Use `npm test` to execute the test suite.
- **Debugging**: Utilize console logs and the built-in debugger in your IDE to trace issues.

## Project-Specific Conventions
- **Documentation**: Maintain updated documentation in `README.md`, `current_state.md`, and `.cursorrules`. Follow the coding standards outlined in `.cursorrules`.
- **State Management**: Avoid direct state mutations. Use reducers defined in `useGameState.js` for state updates.

## Integration Points
- **External Dependencies**: The project relies on several external libraries. Ensure they are documented in `package.json` and installed via npm.
- **Cross-Component Communication**: Use event dispatchers for communication between components. Check `ActionDispatcher.js` for implementation details.

## Key Files/Directories
- **Documentation**: Refer to `current_state.md` for feature tracking and `system_specs.md` for game rules.
- **Simulation Scripts**: The main simulation script is located in `sim_gamestart_fixed.js`. Output files are generated in the format `simulation_results_*.json/csv`.

## Don'ts
- Do not hardcode numeric values for game balance.
- Avoid importing markdown files directly into code.
- Ensure all state changes are verifiable and do not skip null checks.

---

This document should be updated as the project evolves. For any unclear sections or additional information needed, please provide feedback for further iterations.