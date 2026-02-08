# Simulation Integration Architecture

## Overview

This document describes how the deterministic simulation core integrates with the existing game systems without duplicating logic.

## Design Principles

1. **No Duplication**: Wrap existing systems rather than rewriting them
2. **Incremental Migration**: Add determinism layer by layer
3. **Backward Compatibility**: Game works with or without simulation enabled
4. **Opt-in Determinism**: Simulation can be toggled for testing/debugging

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    React UI Layer                        │
│  (GameUI, useGameEngine, useNarrative, useSimulation)   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Game State Management Layer                 │
│    (gameReducer, ActionDispatcher, InputParser)         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Simulation Bridge Layer (NEW)               │
│  • SimulationBridge: Global context for PRNG & events   │
│  • GameStateAdapter: Convert state ↔ entities           │
│  • DeterministicRandom: Drop-in Math.random replacement │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 Game Systems Layer                       │
│  (CombatSystem, LootSystem, EffectSystem, etc.)         │
│  Modified to use DeterministicRandom instead of Math    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│            Deterministic Simulation Core                 │
│  • SimulationKernel: Seeded PRNG, tick loop             │
│  • EventBus: Event sourcing, replay                     │
│  • Types: Entity model, commands, events                │
└─────────────────────────────────────────────────────────┘
```

## Key Components

### SimulationBridge (`src/simulation/bridge/SimulationBridge.js`)

Global singleton that provides:

- **Seeded PRNG**: Deterministic random number generation
- **Event Logging**: Captures all state mutations as events
- **Command Logging**: Records all player actions for replay
- **Tick Management**: Tracks simulation time

**Usage:**

```javascript
import { SimBridge } from '../simulation/bridge/SimulationBridge.js';

// Initialize with seed (typically in useGameEngine)
SimBridge.initialize(12345);

// Use in game systems
const roll = SimBridge.random(); // Instead of Math.random()
SimBridge.emitEvent('CombatAction', { damage: 50 });
```

### DeterministicRandom (`src/systems/combat/DeterministicRandom.js`)

Drop-in replacement for Math.random() that uses SimBridge:

```javascript
// Before:
const damage = Math.floor(Math.random() * 20) + 10;

// After:
import { randomInt } from '../combat/DeterministicRandom.js';
const damage = randomInt(10, 30);
```

### GameStateAdapter (`src/simulation/bridge/GameStateAdapter.js`)

Converts between existing game state and simulation entity model:

```javascript
import { playerToEntity, gameStateToSimulation } from './GameStateAdapter.js';

// Convert player to entity
const playerEntity = playerToEntity(gameState.player);

// Convert full game state
const simState = gameStateToSimulation(gameState);
```

### useSimulation Hook (`src/hook/useSimulation.js`)

React hook for managing simulation in development:

```javascript
import { useDevSimulation } from '../hook/useSimulation.js';

function GameUI() {
  const simulation = useDevSimulation();
  
  // Initialize simulation
  simulation.initialize();
  
  // Export replay data for debugging
  const replay = simulation.exportReplayData();
  console.log('Replay:', replay);
}
```

## Integration Steps

### Phase 1: Foundation (Current)

- ✅ Created SimulationBridge with seeded PRNG
- ✅ Created DeterministicRandom adapter
- ✅ Created GameStateAdapter for state conversion
- ✅ Created useSimulation hook for dev tools

### Phase 2: Combat System Integration (Next)

- 🔄 Replace Math.random() in CombatSystem.js with DeterministicRandom
- 🔄 Add event emissions for combat actions
- 🔄 Test determinism with identical seeds

### Phase 3: Loot & Effects

- ⏳ Replace Math.random() in LootSystem.js
- ⏳ Replace Math.random() in EffectSystem.js
- ⏳ Add event emissions for loot drops and effect applications

### Phase 4: Full Integration

- ⏳ Wire SimBridge into gameReducer
- ⏳ Add command logging for all actions
- ⏳ Implement replay functionality
- ⏳ Add determinism tests

## Usage Patterns

### Enabling Simulation

**Development Mode:**

```javascript
// In browser console or dev tools
localStorage.setItem('dev_simulation_enabled', 'true');
localStorage.setItem('dev_simulation_seed', '12345');
// Reload page
```

**Programmatic:**

```javascript
import { initializeSimulation } from '../simulation/bridge/SimulationBridge.js';

// Initialize with specific seed
initializeSimulation(12345);
```

### Exporting Replay Data

```javascript
import { exportReplay } from '../simulation/bridge/SimulationBridge.js';

const replayData = exportReplay();
console.log('Seed:', replayData.seed);
console.log('Commands:', replayData.commands);
console.log('Events:', replayData.events);

// Save to file for bug reports
const json = JSON.stringify(replayData, null, 2);
// Download or send to server
```

### Testing Determinism

```javascript
import { SimBridge } from '../simulation/bridge/SimulationBridge.js';

// Run 1
SimBridge.initialize(12345);
// ... play game ...
const events1 = SimBridge.getEvents();

// Run 2 with same seed
SimBridge.initialize(12345);
// ... play same actions ...
const events2 = SimBridge.getEvents();

// Should be identical
console.assert(
  JSON.stringify(events1) === JSON.stringify(events2),
  'Simulation is not deterministic!'
);
```

## Migration Checklist

For each system that uses randomness:

1. **Find Math.random() calls**

   ```bash
   grep -r "Math.random" src/systems/
   ```

2. **Replace with DeterministicRandom**

   ```javascript
   // Before
   if (Math.random() < 0.5) { ... }
   
   // After
   import { random } from '../combat/DeterministicRandom.js';
   if (random() < 0.5) { ... }
   ```

3. **Add event emissions**

   ```javascript
   import { SimBridge } from '../../simulation/bridge/SimulationBridge.js';
   
   // After important state changes
   SimBridge.emitEvent('DamageDealt', {
     sourceId: 'player',
     targetId: 'enemy_0',
     amount: damage,
     isCritical: crit,
   });
   ```

4. **Test with fixed seed**
   - Run action with seed X
   - Record outcome
   - Reset and run with same seed X
   - Verify identical outcome

## Benefits

1. **Debugging**: Replay exact game states from bug reports
2. **Testing**: Deterministic tests for combat, loot, progression
3. **Balance**: Analyze exact probabilities and outcomes
4. **Multiplayer**: Foundation for server-authoritative simulation
5. **Speedrun**: Verify run legitimacy via replay validation

## Performance Considerations

- SimBridge adds minimal overhead (~1-2% in testing)
- Event log is capped at 10,000 events (configurable)
- Snapshots taken every 100 ticks for fast replay
- Can be disabled in production if needed

## Future Enhancements

1. **Replay UI**: Visual timeline of events
2. **Save/Load**: Serialize simulation state
3. **Network Sync**: Multiplayer deterministic simulation
4. **AI Training**: Use event logs for ML training data
5. **Analytics**: Aggregate events for balance analysis
