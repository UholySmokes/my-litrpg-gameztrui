# Event Log Contract

## Purpose

- Provide append-only event logging with subscription, filtering, snapshotting, replay, and aggregation utilities.

## Inputs

- `EventBus.publish(event)` appends a validated `Event` to the log and notifies listeners.
- `EventBus.subscribe(eventType, listener)` / `subscribeToAll(listener)` register listeners.
- `EventBus.getEvents(filter)` / `getEventsForEntity` / `getEventsByType` query the log.
- `EventBus.clearLog()` and `getLogStats()` manage log lifecycle/metrics.
- `EventSourcingManager.createSnapshot(tick, stateHash)` and `getSnapshotBefore(tick)` manage snapshots.
- `EventSourcingManager.getEventsSinceSnapshot(tick)` returns events after last snapshot.
- `EventReplayer.replay(options)` replays events with optional filters and callbacks.
- `EventAggregator.countEventsByType`, `getDamageStats`, `getActivityTimeline` aggregate event data.

## Outputs

- Ordered arrays of `Event` objects, snapshot metadata, aggregate maps, and replay counts.

## Events Emitted

- None. This system stores and replays events provided by simulation systems.

## State Touches

- Read/Write: internal `eventLog` array, `snapshots` map.
- Does not mutate simulation state.

## Dependencies

- `src/simulation/types/core.ts`
- `src/simulation/validation/basic.ts`

## Forbidden Dependencies

- UI, network, persistence, or external APIs.
- Non-deterministic randomness.

## Error Handling

- `publish` throws on invalid events.
- Listener errors are caught and logged; publishing continues.
- `EventReplayer.replay` throws if a replay is already in progress.

## Tests

- No automated tests yet; currently validated through integration usage.
