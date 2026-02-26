# Experimental Systems Status

## Current Experimental Modules
1. `packages/game-core/src/systems/PrestigeSystem.ts`
2. `packages/game-core/src/systems/DungeonGenerator.ts`

## Runtime Policy
1. These modules are available in `@voidverse/game-core` for isolated experimentation.
2. They are not integrated into the main web runtime flow.
3. App-level re-export shims were removed to prevent accidental production coupling.

## Integration Criteria
1. Define reducer/events integration points.
2. Add deterministic parity tests against simulation contracts.
3. Add feature flags and rollback path before runtime registration.

