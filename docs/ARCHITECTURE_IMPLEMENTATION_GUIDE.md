# Architecture Implementation Guide

> **Purpose**: Step-by-step guide for implementing the Void-Verse SystemEngine architecture improvements  
> **Target Audience**: Developers working on the game engine  
> **Status**: Active Development

## Overview

This guide provides practical implementation steps for improving the existing codebase to fully align with the Void-Verse SystemEngine architecture principles outlined in `VOIDVERSE_ARCHITECTURE.md`.

## Current State Analysis

### What's Already Done ✅

1. **Monorepo Structure**: `@voidverse/game-core` and `@voidverse/game-schemas` packages exist
2. **Core State Management**: `gameReducer`, `ActionDispatcher`, `StateNormalizer` implemented
3. **Game Systems**: 20+ modular systems under `src/systems/`
4. **Deterministic PRNG**: `DeterministicRandom` utility exists
5. **Event System**: `EventBus` and `SystemEventObserver` implemented
6. **Azure Functions Backend**: API endpoints for persistence and AI services
7. **TypeScript Schemas**: Basic type definitions in game-schemas

### What Needs Improvement 🔧

1. **Schema Validation**: Runtime validation not fully implemented
2. **Platform Boundaries**: Some platform-specific code in game-core
3. **State Serialization**: Optimization needed for large states
4. **Tauri Integration**: Desktop platform not yet implemented
5. **Server Validation**: Action replay validation incomplete
6. **Documentation**: System contracts need formalization
7. **Testing**: Cross-platform determinism tests missing

## Code Review Findings & Future Enhancements

### Validation Schema Improvements (Medium Priority)

Based on code review feedback, the following enhancements should be made to the validation schemas:

1. **Nested Object Schemas** (packages/game-schemas/src/validation.js):
   - Extract ItemSchema for inventory items (currently inline)
   - Extract AttributesSchema for player attributes (currently z.record)
   - Improves maintainability and enables schema reuse

2. **Skill Schemas** (packages/game-schemas/src/validation.js):
   - Replace z.unknown() for activeSkills and passiveSkills with proper schemas
   - Define SkillSchema matching the actual skill structure
   - Enhances type safety and validation effectiveness

3. **Quest Schemas** (packages/game-schemas/src/validation.js):
   - Replace z.unknown() for quest arrays with proper QuestSchema
   - Validate quest structure and data integrity
   - Enables better error messages for quest validation

4. **Audit Script Refactoring** (scripts/audit-platform-code.sh):
   - Simplify complex grep pipeline with multiple exclusions
   - Consider whitelist file for acceptable patterns
   - Break into simpler, more maintainable patterns

These improvements will be addressed in Phase 1, Task 1.1 continuation.

## Implementation Roadmap

### Phase 1: Strengthen Core Contracts (Week 1-2)

#### Task 1.1: Enhance game-schemas Package

**Goal**: Add runtime validation and complete type definitions

**Steps**:

1. Install validation dependencies:
```bash
cd packages/game-schemas
npm install zod
```

2. Create validation schemas:
```typescript
// packages/game-schemas/src/validation.ts
import { z } from 'zod';

export const ActionSchema = z.object({
  type: z.string(),
  payload: z.unknown(),
  actorId: z.string(),
  timestamp: z.number(),
  clientSeed: z.string().optional(),
  nonce: z.number().optional(),
});

export const PlayerStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().int().positive(),
  hp: z.number(),
  maxHp: z.number().positive(),
  // ... complete schema
});

export const GameStateSchema = z.object({
  player: PlayerStateSchema,
  world: z.any(), // Define WorldStateSchema
  combat: z.any().nullable(),
  // ... complete schema
});

// Validation functions
export function validateAction(action: unknown) {
  return ActionSchema.safeParse(action);
}

export function validateGameState(state: unknown) {
  return GameStateSchema.safeParse(state);
}
```

3. Update package.json exports:
```json
{
  "exports": {
    "./validation": {
      "types": "./src/validation.d.ts",
      "default": "./src/validation.js"
    }
  }
}
```

4. Add tests:
```javascript
// packages/game-schemas/test/validation.test.js
import { describe, it, expect } from '@jest/globals';
import { validateAction, validateGameState } from '../src/validation.js';

describe('Action Validation', () => {
  it('validates correct action', () => {
    const action = {
      type: 'ATTACK',
      payload: { targetId: 'enemy1' },
      actorId: 'player1',
      timestamp: Date.now(),
    };
    const result = validateAction(action);
    expect(result.success).toBe(true);
  });

  it('rejects invalid action', () => {
    const action = { type: 'INVALID' };
    const result = validateAction(action);
    expect(result.success).toBe(false);
  });
});
```

**Deliverable**: Runtime validation for all actions and state structures

---

#### Task 1.2: Audit game-core for Platform-Specific Code

**Goal**: Remove all platform-specific dependencies from game-core

**Steps**:

1. Create audit script:
```bash
# scripts/audit-platform-code.sh
#!/bin/bash

echo "Checking for platform-specific code in game-core..."

# Check for DOM references
echo "\n=== DOM References ==="
grep -r "document\|window\|localStorage\|sessionStorage" packages/game-core/src/ || echo "None found ✓"

# Check for Node.js-specific APIs
echo "\n=== Node.js APIs ==="
grep -r "require('fs')\|require('path')\|process\.env" packages/game-core/src/ || echo "None found ✓"

# Check for network calls
echo "\n=== Network Calls ==="
grep -r "fetch(\|axios\|XMLHttpRequest" packages/game-core/src/ || echo "None found ✓"

echo "\n=== Audit Complete ==="
```

2. Run audit:
```bash
chmod +x scripts/audit-platform-code.sh
./scripts/audit-platform-code.sh
```

3. Refactor any violations:

Example violation:
```javascript
// BAD: packages/game-core/src/data/StaticDataBootstrap.js
export async function loadStaticData() {
  const response = await fetch('/api/static-data');
  return response.json();
}
```

Refactored:
```javascript
// GOOD: packages/game-core/src/data/StaticDataBootstrap.js
export function processStaticData(data) {
  // Pure data transformation, no I/O
  return normalizeData(data);
}

// Platform-specific code moved to main app
// src/data/StaticDataLoader.js
import { processStaticData } from '@voidverse/game-core/data/StaticDataBootstrap';

export async function loadStaticData() {
  const response = await fetch('/api/static-data');
  const rawData = await response.json();
  return processStaticData(rawData);
}
```

**Deliverable**: game-core package is 100% platform-neutral

---

#### Task 1.3: Formalize System Contracts

**Goal**: Document contracts for all game systems

**Steps**:

1. Create contract template:
```markdown
<!-- docs/system-contracts/TEMPLATE.md -->
# System: [System Name]

## Purpose
Brief description of what this system does.

## Contract

### Input
\`\`\`typescript
function systemName(
  state: GameState,
  payload: SystemPayload,
  context: SystemContext
): StateTransition
\`\`\`

### Output
\`\`\`typescript
interface StateTransition {
  state: GameState;
  events: GameEvent[];
  effects?: Effect[];
}
\`\`\`

### Dependencies
- Other systems this depends on
- Data registries required

### Side Effects
- Events emitted
- State mutations (specify which parts of state)

## Examples

### Example 1: [Common Case]
\`\`\`javascript
const result = systemName(state, payload, context);
// Expected output...
\`\`\`

### Example 2: [Edge Case]
\`\`\`javascript
// Edge case handling...
\`\`\`

## Determinism Guarantees
How this system ensures deterministic behavior.

## Performance Notes
Any performance considerations or optimizations.
```

2. Document core systems (start with these):
   - `docs/system-contracts/CombatSystem.md`
   - `docs/system-contracts/InventorySystem.md`
   - `docs/system-contracts/LevelingSystem.md`
   - `docs/system-contracts/SkillSystem.md`

3. Add contract validation to tests:
```javascript
// tests/contracts/CombatSystem.contract.test.js
import { describe, it, expect } from '@jest/globals';
import { CombatSystem } from '@voidverse/game-core/systems/combat';

describe('CombatSystem Contract', () => {
  it('returns StateTransition with all required fields', () => {
    const state = createTestState();
    const payload = { action: 'attack', targetId: 'enemy1' };
    const context = createTestContext();
    
    const result = CombatSystem.resolveAction(state, payload, context);
    
    expect(result).toHaveProperty('state');
    expect(result).toHaveProperty('events');
    expect(Array.isArray(result.events)).toBe(true);
  });

  it('maintains determinism with same seed', () => {
    const state = createTestState();
    const payload = { action: 'attack', targetId: 'enemy1' };
    
    const result1 = CombatSystem.resolveAction(
      state, 
      payload, 
      createTestContext({ seed: 'test123' })
    );
    
    const result2 = CombatSystem.resolveAction(
      state, 
      payload, 
      createTestContext({ seed: 'test123' })
    );
    
    expect(result1).toEqual(result2);
  });
});
```

**Deliverable**: All core systems have documented contracts and validation tests

---

### Phase 2: Optimize State Management (Week 3-4)

#### Task 2.1: Implement Efficient State Serialization

**Goal**: Reduce state size and improve save/load performance

**Steps**:

1. Create serialization utilities:
```javascript
// packages/game-core/src/core/StateSerialization.js

/**
 * Removes computed properties before serialization
 */
export function prepareForSerialization(state) {
  return {
    ...state,
    // Remove computed properties
    player: {
      ...state.player,
      // Remove derived stats
      totalDamage: undefined,
      totalDefense: undefined,
      // Keep only base properties
    },
    // Add version for migration support
    _version: '1.0.0',
    _timestamp: Date.now(),
  };
}

/**
 * Re-hydrates computed properties after deserialization
 */
export function prepareAfterDeserialization(state) {
  // Recalculate derived stats
  const player = {
    ...state.player,
    totalDamage: calculateTotalDamage(state.player),
    totalDefense: calculateTotalDefense(state.player),
  };
  
  return StateNormalizer.normalize({
    ...state,
    player,
  });
}

/**
 * Efficient serialization
 */
export function serializeState(state) {
  const prepared = prepareForSerialization(state);
  return JSON.stringify(prepared);
}

/**
 * Deserialization with validation
 */
export function deserializeState(serialized) {
  const parsed = JSON.parse(serialized);
  
  // Validate schema
  const validation = validateGameState(parsed);
  if (!validation.success) {
    throw new Error('Invalid state: ' + validation.error);
  }
  
  return prepareAfterDeserialization(parsed);
}
```

2. Add compression support:
```javascript
// packages/game-core/src/core/StateCompression.js
import pako from 'pako';

export function compressState(state) {
  const serialized = serializeState(state);
  const compressed = pako.deflate(serialized);
  return btoa(String.fromCharCode(...compressed));
}

export function decompressState(compressed) {
  const decoded = atob(compressed);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  const decompressed = pako.inflate(bytes, { to: 'string' });
  return deserializeState(decompressed);
}
```

3. Benchmark serialization:
```javascript
// tests/performance/serialization.benchmark.js
describe('State Serialization Performance', () => {
  it('serializes large state in <100ms', () => {
    const largeState = createLargeTestState();
    const start = Date.now();
    const serialized = serializeState(largeState);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(100);
    expect(serialized.length).toBeLessThan(1000000); // <1MB
  });
  
  it('compression reduces size by >50%', () => {
    const state = createTestState();
    const serialized = serializeState(state);
    const compressed = compressState(state);
    
    const ratio = compressed.length / serialized.length;
    expect(ratio).toBeLessThan(0.5);
  });
});
```

**Deliverable**: Optimized state serialization with <100ms save/load times

---

#### Task 2.2: Implement Event Log Management

**Goal**: Handle large event logs efficiently

**Steps**:

1. Create event log rotation system:
```javascript
// packages/game-core/src/core/EventLog.js

export class EventLog {
  constructor(maxEvents = 1000) {
    this.events = [];
    this.maxEvents = maxEvents;
    this.snapshots = [];
  }
  
  append(event) {
    this.events.push({
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now(),
    });
    
    // Rotate if needed
    if (this.events.length > this.maxEvents) {
      this.rotate();
    }
  }
  
  rotate() {
    // Create snapshot before rotation
    this.snapshots.push({
      events: this.events.slice(0, this.maxEvents / 2),
      timestamp: Date.now(),
    });
    
    // Keep only recent events
    this.events = this.events.slice(this.maxEvents / 2);
  }
  
  getRecentEvents(count = 100) {
    return this.events.slice(-count);
  }
  
  getAllEvents() {
    // Reconstruct from snapshots + current events
    const allEvents = [];
    for (const snapshot of this.snapshots) {
      allEvents.push(...snapshot.events);
    }
    allEvents.push(...this.events);
    return allEvents;
  }
}
```

2. Integrate with game state:
```javascript
// packages/game-core/src/core/gameReducer.js
import { EventLog } from './EventLog.js';

export function gameReducer(state, action, context = {}) {
  const eventLog = state.eventLog || new EventLog();
  
  // Process action
  const result = ActionDispatcher.dispatch(state, action, context);
  
  // Log all events
  for (const event of result.events) {
    eventLog.append(event);
  }
  
  return {
    ...result.state,
    eventLog,
  };
}
```

**Deliverable**: Event log system with automatic rotation and snapshot management

---

### Phase 3: Tauri Desktop Integration (Week 5-6)

#### Task 3.1: Create Tauri Project Structure

**Goal**: Set up desktop application with Tauri

**Steps**:

1. Initialize Tauri:
```bash
# In repository root
npm install -D @tauri-apps/cli
npm install @tauri-apps/api

# Create Tauri app
npx tauri init
```

2. Configure Tauri:
```json
// src-tauri/tauri.conf.json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "Voidverse",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "fs": {
        "all": false,
        "scope": ["$APPDATA/voidverse/*"]
      },
      "path": {
        "all": true
      }
    }
  }
}
```

3. Add npm scripts:
```json
// package.json
{
  "scripts": {
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

**Deliverable**: Tauri project structure with working dev environment

---

#### Task 3.2: Implement SQLite Storage Layer

**Goal**: Local database for desktop saves

**Steps**:

1. Add SQLite dependency:
```toml
# src-tauri/Cargo.toml
[dependencies]
rusqlite = "0.30"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

2. Create storage module:
```rust
// src-tauri/src/storage.rs
use rusqlite::{Connection, Result};
use serde_json::Value;

pub struct GameStorage {
    conn: Connection,
}

impl GameStorage {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS saves (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                state TEXT NOT NULL,
                timestamp INTEGER NOT NULL
            )",
            [],
        )?;
        
        Ok(GameStorage { conn })
    }
    
    pub fn save_game(&self, name: &str, state: &str) -> Result<i64> {
        self.conn.execute(
            "INSERT INTO saves (name, state, timestamp) VALUES (?1, ?2, ?3)",
            [name, state, &timestamp().to_string()],
        )?;
        Ok(self.conn.last_insert_rowid())
    }
    
    pub fn load_game(&self, id: i64) -> Result<String> {
        let mut stmt = self.conn.prepare(
            "SELECT state FROM saves WHERE id = ?1"
        )?;
        let state: String = stmt.query_row([id], |row| row.get(0))?;
        Ok(state)
    }
    
    pub fn list_saves(&self) -> Result<Vec<SaveInfo>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, timestamp FROM saves ORDER BY timestamp DESC"
        )?;
        
        let saves = stmt.query_map([], |row| {
            Ok(SaveInfo {
                id: row.get(0)?,
                name: row.get(1)?,
                timestamp: row.get(2)?,
            })
        })?;
        
        saves.collect()
    }
}

#[derive(serde::Serialize)]
pub struct SaveInfo {
    pub id: i64,
    pub name: String,
    pub timestamp: i64,
}
```

3. Create Tauri commands:
```rust
// src-tauri/src/main.rs
use tauri::command;

#[command]
fn save_game(name: String, state: String) -> Result<i64, String> {
    let storage = get_storage()?;
    storage.save_game(&name, &state)
        .map_err(|e| e.to_string())
}

#[command]
fn load_game(id: i64) -> Result<String, String> {
    let storage = get_storage()?;
    storage.load_game(id)
        .map_err(|e| e.to_string())
}

#[command]
fn list_saves() -> Result<Vec<SaveInfo>, String> {
    let storage = get_storage()?;
    storage.list_saves()
        .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_game,
            load_game,
            list_saves
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

4. Create JavaScript wrapper:
```javascript
// src/platform/tauri/storage.js
import { invoke } from '@tauri-apps/api/tauri';

export class TauriStorage {
  async saveGame(name, state) {
    const serialized = serializeState(state);
    const id = await invoke('save_game', { name, state: serialized });
    return id;
  }
  
  async loadGame(id) {
    const serialized = await invoke('load_game', { id });
    return deserializeState(serialized);
  }
  
  async listSaves() {
    return await invoke('list_saves');
  }
}
```

**Deliverable**: Working SQLite storage layer for desktop application

---

### Phase 4: Server-Side Validation (Week 7-8)

#### Task 4.1: Implement Action Replay Validation

**Goal**: Server validates game state by replaying actions

**Steps**:

1. Create validation endpoint:
```javascript
// api/validate-run/index.js
import { gameReducer, validateAction } from '@voidverse/game-core';
import { sql } from '../lib/sql.js';

export async function POST(req) {
  const { runId, actions, initialState } = await req.json();
  
  // Replay actions server-side
  let state = initialState;
  const errors = [];
  
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    
    // Validate action format
    const validation = validateAction(action);
    if (!validation.success) {
      errors.push({
        actionIndex: i,
        error: 'Invalid action format',
        details: validation.error
      });
      continue;
    }
    
    // Apply action
    try {
      state = gameReducer(state, action, {
        seed: initialState.seed,
        timestamp: action.timestamp
      });
    } catch (error) {
      errors.push({
        actionIndex: i,
        error: 'Action failed',
        details: error.message
      });
    }
  }
  
  // Save validated state
  if (errors.length === 0) {
    await sql.query(
      `UPDATE runs SET 
        state = @state,
        validated_at = GETDATE(),
        is_valid = 1
       WHERE id = @runId`,
      { runId, state: JSON.stringify(state) }
    );
  }
  
  return {
    success: errors.length === 0,
    errors,
    finalState: state
  };
}
```

2. Add client-side integration:
```javascript
// src/core/CloudSaveService.js
export async function saveWithValidation(state, actions) {
  // Save locally first
  const localSaveId = await saveLocally(state);
  
  // Submit to server for validation
  try {
    const response = await fetch('/api/validate-run', {
      method: 'POST',
      body: JSON.stringify({
        runId: state.runId,
        actions,
        initialState: state.initialState
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      console.warn('Server validation failed:', result.errors);
      // Still keep local save, but mark as unvalidated
      return { localSaveId, validated: false, errors: result.errors };
    }
    
    return { localSaveId, validated: true };
  } catch (error) {
    // Network error - offline mode
    console.warn('Could not validate with server:', error);
    return { localSaveId, validated: false, offline: true };
  }
}
```

**Deliverable**: Server-side action replay validation with error reporting

---

## Testing Checklist

### Cross-Platform Determinism Tests

```javascript
// tests/cross-platform/determinism.test.js
describe('Cross-Platform Determinism', () => {
  const testCases = [
    {
      name: 'Simple combat',
      actions: [
        { type: 'ATTACK', payload: { targetId: 'enemy1' } },
        { type: 'USE_SKILL', payload: { skillId: 'fireball' } }
      ]
    },
    {
      name: 'Complex skill rotation',
      actions: [/* ... */]
    }
  ];
  
  for (const testCase of testCases) {
    it(`produces identical results: ${testCase.name}`, () => {
      const seed = 'test-seed-123';
      const initialState = createTestState();
      
      // Simulate on "platform 1"
      let state1 = initialState;
      for (const action of testCase.actions) {
        state1 = gameReducer(state1, action, { seed });
      }
      
      // Simulate on "platform 2"
      let state2 = initialState;
      for (const action of testCase.actions) {
        state2 = gameReducer(state2, action, { seed });
      }
      
      expect(state1).toEqual(state2);
    });
  }
});
```

### Performance Benchmarks

```javascript
// tests/performance/benchmarks.test.js
describe('Performance Benchmarks', () => {
  it('processes 1000 actions in <1 second', () => {
    const state = createTestState();
    const actions = generateRandomActions(1000);
    
    const start = Date.now();
    let finalState = state;
    for (const action of actions) {
      finalState = gameReducer(finalState, action);
    }
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(1000);
  });
  
  it('serializes state in <50ms', () => {
    const state = createLargeTestState();
    
    const start = Date.now();
    const serialized = serializeState(state);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(50);
  });
});
```

## Success Metrics

### Phase 1 Complete When:
- [ ] All actions and state have runtime validation
- [ ] game-core has zero platform-specific code
- [ ] All systems have documented contracts
- [ ] Contract validation tests pass

### Phase 2 Complete When:
- [ ] State serialization is <100ms for typical save
- [ ] Event log management handles 10,000+ events
- [ ] Save file size reduced by >40%

### Phase 3 Complete When:
- [ ] Tauri app launches and runs game
- [ ] SQLite storage works for save/load
- [ ] Desktop app works fully offline
- [ ] State compatibility verified between web and desktop

### Phase 4 Complete When:
- [ ] Server validates runs by replaying actions
- [ ] Validation errors are clearly reported
- [ ] Anti-cheat measures in place
- [ ] Audit logs track all validated runs

## Continuous Improvement

### Weekly Reviews
- Check test coverage (target: >80%)
- Review performance metrics
- Update documentation
- Address technical debt

### Monthly Audits
- Security review
- Performance profiling
- Cross-platform compatibility check
- Architecture compliance audit

## Resources

- Main Architecture Doc: `docs/VOIDVERSE_ARCHITECTURE.md`
- System Specs: `system_specs.md`
- Current State: `current_state.md`
- Implementation Plan: `IMPLEMENTATION_PLAN.md`

## Questions?

If anything is unclear, refer to:
1. `.github/copilot-instructions.md` for developer guidelines
2. `.cursorrules` for coding standards
3. Create a GitHub issue for architectural questions
