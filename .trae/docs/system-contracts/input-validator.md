# Input Validator Contract

## Purpose
- Validate parsed player actions before execution.

## Inputs
- `action`: object containing `type` and optional fields per action.
- `gameState`: current game state snapshot.

## Outputs
- `{ valid: true }` for accepted actions.
- `{ valid: false, reason: string }` for rejected actions.

## Events Emitted
- None. This module is read-only.

## State Touches
- Read: `gameState.player`, `gameState.world`, `gameState.combat`.
- Write: none.

## Dependencies
- `src/entities/ItemRegistry.js` for item metadata.

## Forbidden Dependencies
- State mutation, UI, network, or persistence.

## Error Handling
- Returns structured failures instead of throwing for invalid actions.

## Tests
- `tests/unit/InputValidator.test.js`
