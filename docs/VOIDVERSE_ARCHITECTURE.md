# Void-Verse SystemEngine Architecture

> **Version**: 1.0  
> **Last Updated**: 2026-02-07  
> **Status**: Implementation In Progress

## Executive Summary

The Void-Verse SystemEngine is a platform-neutral game engine architecture designed to support deterministic gameplay across web, desktop (Tauri), and potentially mobile platforms. The architecture prioritizes:

1. **Platform Neutrality**: Core game logic works identically across all platforms
2. **Deterministic Execution**: Same inputs produce identical outputs for replay and verification
3. **Offline-First**: Full gameplay capability without server connectivity
4. **Server Validation**: Optional server-side verification for anti-cheat and persistence
5. **Monorepo Organization**: Shared packages for maximum code reuse

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Platform Layer                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   Web    │  │  Tauri   │  │  Mobile  │  │  Server  │    │
│  │  (Vite)  │  │ (Desktop)│  │(Planned) │  │  (Azure) │    │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘    │
└────────┼─────────────┼─────────────┼─────────────┼──────────┘
         │             │             │             │
         └─────────────┴─────────────┴─────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │    @voidverse/game-schemas        │
         │   (Platform-Neutral Contracts)    │
         │  • Action Types                   │
         │  • State Schema                   │
         │  • Validation Rules               │
         └─────────────────┬─────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │     @voidverse/game-core          │
         │    (Platform-Neutral Engine)      │
         │  • State Management               │
         │  • Game Systems                   │
         │  • Deterministic PRNG             │
         │  • Event System                   │
         └─────────────────┬─────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │      Platform-Specific Layer       │
         │  • Rendering                       │
         │  • Local Storage                   │
         │  • Network I/O                     │
         │  • Input Handling                  │
         └───────────────────────────────────┘
```

## Core Principles

### 1. Deterministic State Management

All game state transitions are deterministic and reproducible:

- **Single Source of Truth**: `gameReducer` handles all state transitions
- **Immutable State**: State is never mutated directly
- **Event Sourcing**: All changes emit events for replay capability
- **Seeded RNG**: All randomness uses deterministic PRNG with known seeds

```javascript
// Deterministic state transition
const newState = gameReducer(oldState, action, { seed: knownSeed });
// Same inputs → Same output, always
```

### 2. Platform-Neutral Core

The game-core package contains zero platform-specific code:

- ❌ No DOM manipulation
- ❌ No file system access
- ❌ No network calls
- ❌ No platform-specific APIs
- ✅ Pure state transformations
- ✅ Deterministic algorithms
- ✅ Event emission
- ✅ Validation logic

### 3. Schema-First Development

All actions and state structures are defined as TypeScript schemas:

```typescript
// @voidverse/game-schemas
export interface GameAction {
  type: string;
  payload: unknown;
  timestamp: number;
  actorId: string;
}

export interface GameState {
  player: PlayerState;
  world: WorldState;
  combat: CombatState;
  config: GameConfig;
}
```

### 4. Boundary Isolation

Clear boundaries between layers:

```
UI Layer (React)
    ↓ dispatches actions
Core Layer (game-core)
    ↓ emits events
Platform Layer (Storage/Network)
```

## Package Structure

### @voidverse/game-core

**Purpose**: Platform-neutral game engine

**Contents**:
- `/core/` - State management (reducer, dispatcher, normalizer)
- `/systems/` - Game mechanics (combat, skills, items, etc.)
- `/entities/` - Game entity models
- `/data/` - Static data and registries
- `/simulation/` - Deterministic simulation kernel
- `/utils/` - Pure utility functions
- `/constants/` - Game constants

**Dependencies**:
- `@voidverse/game-schemas` (schemas only)
- Zero platform-specific dependencies

**Exports**:
```javascript
export { gameReducer } from './core/gameReducer.js';
export { ActionDispatcher } from './core/ActionDispatcher.js';
export { StateNormalizer } from './core/StateNormalizer.js';
// ... all systems and utilities
```

### @voidverse/game-schemas

**Purpose**: TypeScript contracts and validation schemas

**Contents**:
- `/actions.d.ts` - Action type definitions
- `/state.d.ts` - State structure definitions
- `/validation.d.ts` - Validation schemas (planned)

**Key Feature**: Runtime validation with TypeScript types

```typescript
// Type-safe action creators
export function createAction<T extends ActionType>(
  type: T,
  payload: ActionPayload[T]
): GameAction;

// Runtime validation
export function validateAction(action: unknown): action is GameAction;
export function validateState(state: unknown): state is GameState;
```

## Platform Implementations

### Web Platform (Current)

**Technology**: Vite + React + Azure Static Web Apps

**Storage**: 
- IndexedDB for local saves (via browser APIs)
- Azure SQL for cloud persistence

**Rendering**: React components in `/src/components/` and `/src/ui/`

**State Management**: React hooks wrapping game-core

```javascript
// src/hook/usegamestate.js
import { gameReducer } from '@voidverse/game-core';

export function useGameState() {
  const [state, setState] = useState(initialState);
  
  const dispatch = (action) => {
    const newState = gameReducer(state, action);
    setState(newState);
  };
  
  return [state, dispatch];
}
```

### Desktop Platform (Tauri) - Planned

**Technology**: Tauri + React

**Storage**:
- SQLite for local saves (native file system)
- Optional Azure SQL sync

**Offline Support**: Full gameplay without internet

**Platform-Specific Code**:
```rust
// src-tauri/src/storage.rs
// SQLite integration for local persistence

use rusqlite::{Connection, Result};

pub fn save_game(state: &GameState) -> Result<()> {
  // Save to local SQLite database
}

pub fn load_game(save_id: i64) -> Result<GameState> {
  // Load from local SQLite database
}
```

### Server Platform (Azure Functions)

**Purpose**: Server-side validation and persistence

**Technology**: Azure Functions (Node.js)

**Endpoints**:
- `/api/saves` - Cloud save/load
- `/api/narrate` - AI narration generation
- `/api/quest-create` - Quest generation
- `/api/factory-run` - Content generation
- `/api/runs` - Run tracking and replay

**Validation**: Uses same game-core for validation

```javascript
// api/saves/index.js
import { validateAction, gameReducer } from '@voidverse/game-core';

export async function POST(req) {
  const { actions, initialState } = await req.json();
  
  // Replay actions server-side for validation
  let state = initialState;
  for (const action of actions) {
    if (!validateAction(action)) {
      return { error: 'Invalid action' };
    }
    state = gameReducer(state, action);
  }
  
  // Save validated state
  await saveToDatabase(state);
  return { success: true };
}
```

## Data Flow Patterns

### 1. Client-Only Gameplay (Offline)

```
User Input
  ↓
Input Parser
  ↓
Action Validation (client)
  ↓
Game Reducer (client)
  ↓
State Update
  ↓
UI Update
  ↓
Local Storage (IndexedDB/SQLite)
```

### 2. Server-Validated Gameplay (Online)

```
User Input
  ↓
Input Parser (client)
  ↓
Action Validation (client)
  ↓
Game Reducer (client)
  ↓
State Update (client)
  ↓
UI Update (client)
  ↓
Action Batch → Server
                ↓
            Validation (server)
                ↓
            Game Reducer (server)
                ↓
            Azure SQL Storage
                ↓
            Confirmation ← Client
```

### 3. AI-Enhanced Gameplay

```
User Input
  ↓
Input Parser
  ↓
Context Assembly (PromptAssembler)
  ↓
Azure AI Assistant (Narrator/QuestGiver/ContentSmith)
  ↓
Generated Content
  ↓
Content Parser
  ↓
Action Validation
  ↓
Game Reducer
  ↓
State Update (with narrative)
  ↓
UI Update
```

## Key Contracts and Boundaries

### State Contract

```typescript
interface GameState {
  // Core state
  player: PlayerState;
  world: WorldState;
  combat: CombatState | null;
  inventory: InventoryState;
  
  // Configuration
  config: GameConfig;
  
  // Metadata
  seed: string;
  timestamp: number;
  version: string;
}
```

### Action Contract

```typescript
interface GameAction {
  type: ActionType;
  payload: ActionPayload;
  actorId: string;
  timestamp: number;
  
  // Optional: for server validation
  clientSeed?: string;
  nonce?: number;
}

type ActionType = 
  | 'MOVE'
  | 'ATTACK'
  | 'USE_SKILL'
  | 'USE_ITEM'
  | 'EQUIP'
  | 'REST'
  | 'EXPLORE'
  // ... etc
```

### System Contract

Every game system must follow this contract:

```javascript
/**
 * System Contract
 * 
 * @param {GameState} state - Current game state
 * @param {ActionPayload} payload - Action-specific data
 * @param {SystemContext} context - RNG, EventBus, etc.
 * @returns {StateTransition} - { state, events, effects }
 */
export function systemFunction(state, payload, context) {
  // 1. Validate inputs
  // 2. Calculate outcomes (deterministically)
  // 3. Generate state changes
  // 4. Emit events
  // 5. Return immutable state update
  
  return {
    state: newState,
    events: [...events],
    effects: [...effects]
  };
}
```

## Deterministic PRNG

All randomness uses a seeded PRNG:

```javascript
// src/utils/DeterministicRandom.js
export class DeterministicRandom {
  constructor(seed) {
    this.seed = seed;
    this.state = this.initState(seed);
  }
  
  next() {
    // xorshift128+ algorithm
    // Same seed → Same sequence
  }
  
  roll(sides) {
    return Math.floor(this.next() * sides) + 1;
  }
  
  range(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }
}

// Usage in systems
const rng = context.rng; // Provided by dispatcher
const damage = rng.range(10, 20); // Deterministic damage roll
```

## Migration Strategy

### Phase 1: Strengthen Contracts (Current)

1. ✅ Define TypeScript schemas in `@voidverse/game-schemas`
2. ✅ Extract core logic to `@voidverse/game-core`
3. ✅ Ensure deterministic PRNG usage throughout
4. ⏳ Add runtime validation for actions and state

### Phase 2: Tauri Integration (Next)

1. Create Tauri project structure
2. Implement SQLite storage layer
3. Port React UI to Tauri
4. Add offline capability
5. Test determinism across platforms

### Phase 3: Enhanced Server Validation

1. Implement action replay validation on server
2. Add anti-cheat measures
3. Enhance Azure SQL schema for audit logs
4. Add run verification endpoints

### Phase 4: Mobile Support (Future)

1. Evaluate React Native or Capacitor
2. Port UI to mobile layouts
3. Optimize for mobile storage and performance
4. Test cross-platform save compatibility

## Testing Strategy

### Unit Tests

- Pure function tests for all systems
- Determinism verification tests
- Schema validation tests

```javascript
describe('CombatSystem', () => {
  it('produces identical results with same seed', () => {
    const state1 = gameReducer(initialState, action, { seed: 'test123' });
    const state2 = gameReducer(initialState, action, { seed: 'test123' });
    expect(state1).toEqual(state2);
  });
});
```

### Integration Tests

- Full game flow tests
- Multi-action sequence tests
- Event emission verification

### Platform Tests

- Cross-platform state compatibility
- Storage layer abstractions
- Network resilience

## Performance Considerations

### State Size

- Keep state lean; avoid redundant data
- Use normalized data structures
- Implement state snapshots for large histories

### Serialization

```javascript
// Efficient state serialization
export function serializeState(state) {
  // Remove computed properties
  // Use efficient encoding
  return JSON.stringify(state);
}

export function deserializeState(serialized) {
  const state = JSON.parse(serialized);
  // Re-hydrate computed properties
  return StateNormalizer.normalize(state);
}
```

### Event Log Management

- Implement event log rotation
- Create periodic state snapshots
- Compress old event logs

## Security Considerations

### Client-Side

- No sensitive data in client state
- No admin-level operations from client
- Validate all user input

### Server-Side

- Replay validation for critical actions
- Rate limiting on API endpoints
- Entra ID authentication for Azure SQL
- Action signatures for tamper detection

```javascript
// Action signing (planned)
export function signAction(action, privateKey) {
  const signature = crypto.sign(action, privateKey);
  return { ...action, signature };
}

export function verifyAction(action, publicKey) {
  return crypto.verify(action, action.signature, publicKey);
}
```

## Observability

### Telemetry

```javascript
// OpenTelemetry integration
import { trace } from '@opentelemetry/api';

export function tracedReducer(state, action) {
  const span = trace.getTracer('game').startSpan('gameReducer');
  span.setAttribute('action.type', action.type);
  
  try {
    const newState = gameReducer(state, action);
    span.setStatus({ code: SpanStatusCode.OK });
    return newState;
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    throw error;
  } finally {
    span.end();
  }
}
```

### Logging

- Structured logging for all state transitions
- Event logs for gameplay analysis
- Performance metrics for optimization

## Future Enhancements

### 1. Content Versioning

Track content versions for save compatibility:

```typescript
interface GameContent {
  version: string;
  skills: Record<string, SkillDefinition>;
  items: Record<string, ItemDefinition>;
  // ...
}

// Migration when loading old saves
function migrateContent(save: SaveData): SaveData {
  if (save.contentVersion < CURRENT_VERSION) {
    return applyMigrations(save);
  }
  return save;
}
```

### 2. Multiplayer Foundation

- Add party state management
- Implement shared world state
- Design conflict resolution for concurrent actions

### 3. Modding Support

- Plugin architecture for custom systems
- Content definition via JSON/YAML
- Sandboxed script execution

## Conclusion

The Void-Verse SystemEngine architecture provides a solid foundation for:

- **Cross-platform gameplay** with identical behavior
- **Offline-first design** with optional server features
- **Deterministic execution** for replay and verification
- **Scalable architecture** ready for future expansion

By maintaining strict boundaries between platform-neutral core logic and platform-specific implementations, the engine achieves maximum code reuse while maintaining flexibility for each platform's unique requirements.

## References

- `current_state.md` - Implementation status
- `IMPLEMENTATION_PLAN.md` - Development roadmap
- `.github/copilot-instructions.md` - Developer guidelines
- `system_specs.md` - Game mechanics documentation
