# Simulation Kernel Contract

## Purpose

- Provide a deterministic, fixed-tick simulation loop with a seeded PRNG and command queue.
- Own simulation state evolution and append-only event log updates.

## Inputs

- `new DefaultSimulationKernel(initialState, seed?)` where `initialState` is a `SimulationState`.
- `tick(dt = 1)` and `step(ticks)` to advance time.
- `enqueueCommand(command)` for validated `Command` objects.
- `start()`, `pause()`, `reset()` to control lifecycle.
- `setSeed(seed)` to reset deterministic randomness.

## Outputs

- `getState()` returns a `SimulationState` snapshot.
- `getEntity(id)` returns `Entity | undefined`.
- `getEvents(sinceTick?)` and `getEventsForEntity(entityId, sinceTick?)` return event log slices.

## Events Emitted

- Appends `Event` entries to `state.eventLog` (e.g., Damage, Heal, SkillUsed, StatChanged, EffectApplied/Removed, EntityDeath).
- Error handling currently emits a placeholder error event (`type: "StatChanged"`) until a dedicated error schema exists.

## State Touches

- Read/Write: `state.entities`, `state.world`, `state.eventLog`, `state.snapshots`.
- Internal: `commandQueue`, `SeededPRNG`.

## Dependencies

- `src/simulation/types/core.ts`
- `src/simulation/validation/basic.ts`

## Forbidden Dependencies

- UI, network, file I/O, storage, external APIs.
- Non-deterministic randomness (must use `SeededPRNG`).

## Error Handling

- `CommandQueue.enqueue` throws on invalid command.
- `processCommand` catches errors and emits an error event while continuing the simulation.

## Tests

- `src/simulation/kernel/SimulationKernel.determinism.ts` (PRNG + kernel determinism tests).
