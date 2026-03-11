# Event Bus Contract

## Purpose
- Provide lightweight pub/sub for internal game systems.

## Inputs
- `on(event, handler)` registers a handler for a string event name.
- `off(event, handler)` removes a handler for an event.
- `emit(event, payload)` dispatches an event payload to handlers.

## Outputs
- `on` returns an unsubscribe function.
- `emit` returns nothing and does not throw if no listeners exist.

## Events Emitted
- None. This module only relays events.

## State Touches
- Read: internal `listeners` map.
- Write: internal `listeners` map.

## Dependencies
- None.

## Forbidden Dependencies
- UI, network, or persistence.

## Error Handling
- Handlers are wrapped in try/catch; errors are logged and do not stop dispatch.

## Tests
- Manual verification through systems emitting events.
