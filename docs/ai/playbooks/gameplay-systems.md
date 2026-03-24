# Gameplay Systems Playbook

Use this for deterministic gameplay logic, reducers, progression systems, combat hooks, loot flows, and save-safe system changes.

## Default Setup

- Operator: Codex
- Model: `gpt-5.4`
- Reasoning: `high`
- Hosting: `cloud`

## Start Here

- `packages/game-core/src/`
- `docs/REPO_MAP.md`
- `tests/`

## Working Rules

1. Change shared gameplay logic in `packages/game-core/src/`, not legacy shim paths.
2. Keep formulas and registry content in config/data surfaces when possible.
3. Preserve deterministic state transitions and replay assumptions.
4. Run targeted tests plus `npm run typecheck`.

## Typical Validation

- `npm test`
- `npm run test:smoke`
- `npm run validate:registries`
- `npm run validate:archetypes`
