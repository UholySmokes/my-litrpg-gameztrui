# Platform Neutrality Audit Report

> **Date**: 2026-02-07  
> **Package**: @voidverse/game-core  
> **Status**: Needs Refactoring

## Executive Summary

The platform neutrality audit identified several areas where platform-specific code exists in the game-core package. While many findings are false positives (e.g., "window" appearing in text descriptions), there are legitimate violations that need to be addressed to achieve true platform neutrality.

## Audit Results

### ✅ PASSED: No Direct Violations

- **File System Access**: None found
- **Crypto Usage**: None found (good - should be injected)

### ⚠️  WARNINGS: Verify These

1. **Network References** (false positive):
   - `packages/game-core/src/simulation/validation/basic.ts:126` - This is validation CODE that checks for "axios", not actual usage
   - **Action**: None needed - this is correct

2. **Time Functions**:
   - Multiple uses of `performance.now()` and `Date.now()`
   - **Current Status**: Some are legitimate (performance measurement), some should be injected
   - **Action**: Review each usage

### ❌ FAILED: Must Fix

1. **Node.js-Specific File**:
   - `packages/game-core/src/observability/initTracing.node.js`
   - Uses `process.env` directly
   - **Action**: Move to platform-specific layer or inject environment

2. **Window/DOM Checks**:
   - Several files check `typeof window === "undefined"` to detect Node.js environment
   - Files affected:
     - `SimulationKernel.determinism.ts:321`
     - `ActionScheduler.determinism.ts:146`
     - `ActionResolver.determinism.ts:185`
   - **Action**: Use injected environment detection

## Detailed Analysis

### 1. Environment Detection

**Current Pattern** (❌):
```typescript
// SimulationKernel.determinism.ts
if (typeof window === "undefined" && typeof process !== "undefined") {
  // Node.js-specific code
}
```

**Recommended Pattern** (✅):
```typescript
// Inject environment info via context
export function createSimulationKernel(config) {
  const env = config.environment || 'unknown';
  
  if (env === 'node') {
    // Node.js-specific code
  }
}
```

### 2. Observability Module

**Current State**:
- `initTracing.node.js` is explicitly Node.js-specific (filename says so)
- Reads `process.env.TRACE_ENABLED` and `process.env.OTEL_EXPORTER_OTLP_ENDPOINT`

**Options**:
1. **Option A**: Move out of game-core entirely
   - Location: `/src/observability/` (main app)
   - Import game-core, add tracing wrapper
   
2. **Option B**: Make configuration injectable
   ```javascript
   // game-core/src/observability/initTracing.js (renamed, no .node)
   export function initTracing(config) {
     const tracingEnabled = config.tracingEnabled ?? false;
     const endpoint = config.otlpEndpoint ?? "http://localhost:4318";
     // ... rest of logic
   }
   
   // Platform-specific code (Node.js)
   // src/observability/initTracing.node.js
   import { initTracing } from '@voidverse/game-core/observability/initTracing';
   
   const config = {
     tracingEnabled: toBool(process.env.TRACE_ENABLED),
     otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
   };
   
   initTracing(config);
   ```

**Recommendation**: Option B - keeps tracing logic in game-core, but configuration is platform-provided

### 3. Time Functions

**Current Usage**:

1. **Performance Measurement** (✅ acceptable):
   ```typescript
   // EventBus.ts
   const startTime = performance.now();
   // ... do work
   const duration = performance.now() - startTime;
   ```
   - This is fine - just measuring execution time
   - Not part of game logic
   - Doesn't affect determinism

2. **Game Timestamps** (❌ must fix):
   ```javascript
   // SystemBuilder.js
   id: baseProfile.id || `player_${Date.now()}`
   ```
   - This affects game state!
   - Different platforms = different IDs = non-determinism
   
   **Fix**:
   ```javascript
   // Inject ID generator
   id: baseProfile.id || context.generateId()
   
   // Context provides deterministic ID generator
   context.generateId = () => `player_${context.rng.next()}`;
   ```

3. **Simulation Time** (✅ already handled):
   ```javascript
   // SimulationContext.js
   return this.isActive ? this.currentTick : Date.now();
   ```
   - Uses simulation time when active
   - Falls back to real time only when inactive
   - This is acceptable

## Action Items

### High Priority (Breaks Platform Neutrality)

1. **Fix SystemBuilder.js ID generation**:
   - File: `packages/game-core/src/systems/archetype/SystemBuilder.js`
   - Line: 9
   - Change: Use injected ID generator instead of `Date.now()`
   - Impact: Ensures deterministic player IDs

2. **Refactor observability module**:
   - File: `packages/game-core/src/observability/initTracing.node.js`
   - Action: Make configuration injectable
   - Impact: Allows same code to work on all platforms

3. **Replace environment detection**:
   - Files:
     - `SimulationKernel.determinism.ts`
     - `ActionScheduler.determinism.ts`
     - `ActionResolver.determinism.ts`
   - Action: Use injected environment config
   - Impact: No reliance on global variables

### Medium Priority (Code Quality)

1. **Document acceptable time usage**:
   - Create guideline: `performance.now()` OK for metrics, not for logic
   - Add lint rule or comment convention
   - Update developer docs

### Low Priority (Nice to Have)

1. **Improve audit script**:
   - Filter out false positives (description text)
   - Add whitelist for acceptable patterns
   - Distinguish between detection code and usage code

## Implementation Plan

### Step 1: Fix SystemBuilder (5 minutes)

```javascript
// Before
id: baseProfile.id || `player_${Date.now()}`

// After
id: baseProfile.id || generatePlayerId(context)

// Helper function
function generatePlayerId(context) {
  // Use deterministic random number from context
  const randomSuffix = context.rng ? 
    context.rng.range(100000, 999999) : 
    Math.floor(Math.random() * 900000) + 100000;
  return `player_${randomSuffix}`;
}
```

### Step 2: Refactor Observability (15 minutes)

```javascript
// game-core/src/observability/initTracing.js (platform-neutral)
export function initTracing(config = {}) {
  const {
    tracingEnabled = false,
    otlpEndpoint = "http://localhost:4318",
    serviceName = "voidverse-game",
    environment = "development"
  } = config;
  
  if (!tracingEnabled) {
    return null;
  }
  
  // ... rest of tracing setup using config values
}

// Then in platform-specific code:
// Node.js: src/observability/initTracing.node.js
import { initTracing } from '@voidverse/game-core/observability/initTracing';

export function initNodeTracing() {
  return initTracing({
    tracingEnabled: toBool(process.env.TRACE_ENABLED),
    otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    serviceName: process.env.SERVICE_NAME || "voidverse-game",
    environment: process.env.NODE_ENV || "development"
  });
}

// Browser: src/observability/initTracing.browser.js
import { initTracing } from '@voidverse/game-core/observability/initTracing';

export function initBrowserTracing() {
  return initTracing({
    tracingEnabled: window.__VOIDVERSE_CONFIG__?.tracingEnabled,
    otlpEndpoint: window.__VOIDVERSE_CONFIG__?.otlpEndpoint,
    serviceName: "voidverse-game-web",
    environment: import.meta.env.MODE
  });
}
```

### Step 3: Environment Detection (10 minutes)

```typescript
// game-core: Create EnvironmentContext.ts
export interface EnvironmentContext {
  platform: 'node' | 'browser' | 'tauri' | 'unknown';
  isDevelopment: boolean;
  // Add other environment-specific info as needed
}

// Then inject this in simulation code
export function createSimulationKernel(config: {
  environment: EnvironmentContext;
  // ... other config
}) {
  if (config.environment.platform === 'node') {
    // Node-specific optimizations
  }
}
```

## Testing Strategy

### Validation Tests

```javascript
// tests/platform-neutrality/index.test.js
describe('Platform Neutrality', () => {
  it('game-core has no direct DOM access', () => {
    // Import all game-core modules
    // Verify no window/document access
  });
  
  it('game-core has no direct Node.js APIs', () => {
    // Verify no process/fs/path usage
  });
  
  it('all configuration is injectable', () => {
    // Verify all external dependencies can be provided
  });
});
```

### Cross-Platform Tests

```javascript
// tests/cross-platform/determinism.test.js
describe('Cross-Platform Determinism', () => {
  it('produces same output with injected config', () => {
    const mockNodeEnv = {
      platform: 'node',
      isDevelopment: true
    };
    
    const mockBrowserEnv = {
      platform: 'browser',
      isDevelopment: true
    };
    
    const nodeState = runSimulation({ environment: mockNodeEnv });
    const browserState = runSimulation({ environment: mockBrowserEnv });
    
    expect(nodeState).toEqual(browserState);
  });
});
```

## Success Criteria

- [ ] Audit script passes with zero failures
- [ ] All configuration is injectable (no direct env access)
- [ ] Cross-platform determinism tests pass
- [ ] Documentation updated with patterns and guidelines
- [ ] Code review confirms compliance

## Timeline

- **Phase 1** (High Priority): 1 hour
  - Fix SystemBuilder
  - Refactor observability
  - Update environment detection

- **Phase 2** (Medium Priority): 2 hours
  - Add tests
  - Update documentation
  - Review all time usage

- **Phase 3** (Low Priority): 1 hour
  - Improve audit script
  - Add lint rules
  - Create developer guide

**Total Estimated Time**: 4 hours

## References

- Main Architecture: `docs/VOIDVERSE_ARCHITECTURE.md`
- Implementation Guide: `docs/ARCHITECTURE_IMPLEMENTATION_GUIDE.md`
- Audit Script: `scripts/audit-platform-code.sh`
