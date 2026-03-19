# Dev Team Beta — Round 1 Implementation Plan

**Team:** Alex (Frontend), Mei (Game Engine), Darius (QA Lead), Luna (Simulation), Raj (TypeScript/Schemas)  
**Date:** 2026-03-19  
**Scope:** 11 dev-team issues + 5 player-facing concerns  
**Phases:** 4 phases across 12 weeks

---

## Executive Summary

The codebase is architecturally sound (reducer-driven state, deterministic PRNG, modular systems) but has critical gaps in **test infrastructure** (no coverage enforcement, 6/97 smoke tests), a growing **maintainability ceiling** (601-line switch-case in ActionDispatcher), and **player UX barriers** (text-only input, punishing rest mechanics, missing mid-game XP brackets). This plan addresses these in priority order: quality foundation first, then engine refactors, then UX, then advanced testing.

### Key Finding: ErrorBoundary Already Exists

The dev team review flagged "No ErrorBoundary in App.jsx" — but investigation shows `ErrorBoundary` **already wraps `<App />` in `main.jsx` (L24-26)**. This issue is **resolved**. The component exists at `src/components/ErrorBoundary.jsx`. No action needed.

### Key Finding: QuickActions Already Exist (Partially)

`GameQuickActions.jsx` exists with panel-toggle buttons (Quests, Shop, Gacha, etc.) but lacks **in-game action buttons** (Attack, Rest, Move, Use Skill). The player concern is about gameplay actions, not menu navigation. This needs new work.

### Key Finding: Rest Heal Has Fallback

The `restHealAmount: 0` in `INITIAL_CONFIG` looks punishing, but `ActionDispatcher.js` L493-494 already falls back to `Math.max(5, Math.floor(hp.max * 0.25))` when the config value is 0. The rest mechanic is **not broken**. However, the `0` default is misleading and should be changed to make the actual behavior explicit.

---

## Phase 1: Quality Foundation (Week 1-2)

### Task 1.1 — Add Jest Coverage Thresholds

**Owner:** Darius  
**Priority:** HIGH  
**Effort:** 2 hours  
**Issue:** #6 — No coverage enforcement means regressions slip silently.

**Files to modify:**
- `package.json` — Add `coverageThreshold` to the `jest` config block

**What it does:**  
Add minimum coverage thresholds to prevent regressions. Start conservative (50% branches, 60% statements) since the project has no baseline. Raise thresholds over time as coverage improves.

```json
"coverageThreshold": {
  "global": {
    "branches": 50,
    "functions": 55,
    "lines": 60,
    "statements": 60
  }
}
```

Also update `test:ci` script to include `--coverage`:
```
"test:ci": "node --experimental-vm-modules node_modules/jest/bin/jest.js --no-cache --runInBand --coverage"
```

**Dependencies:** None  
**Risk if skipped:** Every merged PR could silently reduce coverage. Found issues compound over time. **HIGH** — this is the single highest-ROI change in the entire plan.

---

### Task 1.2 — Expand Smoke Test Suite

**Owner:** Darius  
**Priority:** HIGH  
**Effort:** 4 hours  
**Issue:** #7 — Smoke suite covers only 6 of 97 test files.

**Files to modify:**
- `package.json` — Expand the `test:smoke` script file list

**What it does:**  
Add the highest-value test files to the smoke suite. Selection criteria: tests that cover core gameplay loops, state management, and API contracts. Target: 20-25 files covering ActionDispatcher, combat, leveling, inventory, quests, prestige, game state adapter, data registry, and sync routes.

**Recommended additions (18 files):**
```
tests/unit/ActionDispatcher.test.js
tests/unit/LevelingAndCombat.test.js
tests/unit/InventorySystem.test.js
tests/unit/PrestigeSystem.test.js
tests/unit/GameSystems.test.js
tests/unit/GameStateAdapter.test.js
tests/unit/DataRegistry.test.js
tests/unit/InputValidator.test.js
tests/unit/QuestObjectiveProgression.test.js
tests/unit/CombatPhaseResolution.test.js
tests/unit/CombatPhasePreparation.test.js
tests/unit/CombatPhaseAftermath.test.js
tests/unit/EffectEngineAndLog.test.js
tests/unit/NarrativeStateUpdater.test.js
tests/unit/AuthGuardBackend.test.js
tests/unit/SyncProcess.test.js
tests/unit/SyncCommandContract.test.js
tests/unit/AmbientShiftObserver.test.js
```

**Dependencies:** None  
**Risk if skipped:** The `check` script (`npm run check`) runs `test:smoke` as its final gate. With only 6 files, broken core systems pass silently. **HIGH**.

---

### Task 1.3 — Triage 3 Ignored Test Files

**Owner:** Darius  
**Priority:** MEDIUM  
**Effort:** 3 hours  
**Issue:** #8 — Tests ignored without documentation.

**Files to investigate:**
- `tests/skillEffects.test.js`
- `tests/endToEndEffects.test.js`
- `tests/magnitudeCapsFusion.test.js`

**What it does:**  
For each ignored file: (1) Run it standalone to identify failures, (2) Determine if tests are obsolete, broken, or pending feature work, (3) Either fix and un-ignore, delete with rationale, or add a `// SKIP REASON: ...` comment and a tracking issue.

**Files to modify:**
- `package.json` — Update `testPathIgnorePatterns` with documentation or removal
- The 3 test files themselves — Fix or annotate

**Dependencies:** None  
**Risk if skipped:** Unknown test debt accumulates. Developers don't know if these tests were skipped due to bugs, refactors, or technical debt. **MEDIUM**.

---

### Task 1.4 — Make `restHealAmount` Config Explicit

**Owner:** Mei  
**Priority:** LOW  
**Effort:** 30 minutes  
**Issue:** Player concern — "Rest heals nothing" is misleading.

**Files to modify:**
- `packages/game-core/src/data/initialState.js` — Change `restHealAmount: 0` to `restHealAmount: 25` (% of max HP) and `restManaAmount: 0` to `restManaAmount: 25`

**What it does:**  
The ActionDispatcher already falls back to 25% max HP when config is 0. But the `0` default misleads reviewers and players reading config. Set explicit values matching actual behavior. Update related test expectations.

**Files also affected:**
- `tests/unit/ActionDispatcher.test.js` — Update the test that sets `restHealAmount: 0` to verify the new explicit default
- `docs/CONFIG_REFERENCE.md` — Update documentation

**Dependencies:** None  
**Risk if skipped:** Continued confusion in reviews and audits. Config appears punishing when it isn't. **LOW**.

---

## Phase 2: Engine Refactor (Week 3-4)

### Task 2.1 — ActionDispatcher Registry Pattern

**Owner:** Mei  
**Priority:** MEDIUM  
**Effort:** 12 hours  
**Issue:** #1 — 601-line switch-case monolith.

**Files to modify:**
- `packages/game-core/src/core/ActionDispatcher.js` — Refactor to registry pattern

**Files to create:**
- `packages/game-core/src/core/actionHandlers/index.js` — Handler registry
- `packages/game-core/src/core/actionHandlers/magicHandlers.js` — Magic action handlers (magic_sense, magic_attune, etc.)
- `packages/game-core/src/core/actionHandlers/combatHandlers.js` — Attack, escape
- `packages/game-core/src/core/actionHandlers/explorationHandlers.js` — Move, look
- `packages/game-core/src/core/actionHandlers/playerHandlers.js` — Rest, allocate, status, inventory, narrative
- `packages/game-core/src/core/actionHandlers/prestigeHandlers.js` — Prestige actions

**What it does:**  
Replace the switch-case with a `Map<string, HandlerFn>` registry. Each handler file exports a function `(state, action, options) => Result`. The main `executeAction` becomes:

```js
const handler = actionRegistry.get(action.type);
if (!handler) return { success: false, reason: `Unknown action type: ${action.type}`, state };
return handler(state, action, options);
```

Post-action logic (turn increment, time advance, essence ecology) stays in `executeAction` as a shared epilogue.

**Dependencies:** Task 1.1 (coverage threshold prevents regression during refactor)  
**Risk if skipped:** Every new action type adds to the 601-line switch. Adding, modifying, or reviewing actions gets slower. New developers struggle to understand the flow. **MEDIUM** — not urgent but compounds.

---

### Task 2.2 — PrestigeSystem .js/.ts Consolidation

**Owner:** Raj  
**Priority:** MEDIUM  
**Effort:** 3 hours  
**Issue:** #2 — Dual .js/.ts files for PrestigeSystem.

**Files to modify:**
- `packages/game-core/src/systems/PrestigeSystem.ts` — Becomes the canonical source
- `packages/game-core/src/systems/PrestigeSystem.js` — Delete after migration

**Files to verify:**
- All importers of `PrestigeSystem.js` — Update import paths if needed
- `tests/unit/PrestigeSystem.test.js` — Verify tests still pass with .ts source

**What it does:**  
The .js and .ts files are functionally identical (the .ts adds type annotations). Delete the .js file, keep the .ts, and ensure all imports resolve correctly through the existing `babel-jest` transform. Verify tsconfig includes the file.

**Dependencies:** Task 1.1  
**Risk if skipped:** Developers edit the wrong file. Drift between .js and .ts versions causes subtle bugs. **MEDIUM**.

---

### Task 2.3 — SystemEventObserver Re-entrant Dispatch Guard

**Owner:** Mei  
**Priority:** MEDIUM  
**Effort:** 2 hours  
**Issue:** #4 — Re-entrant dispatch risk.

**Files to modify:**
- `packages/game-core/src/core/SystemEventObserver.js` — Add depth guard

**What it does:**  
The `enqueueDispatch` uses `queueMicrotask` batching which mitigates but doesn't prevent re-entrancy. Add a simple depth counter:

```js
let _evaluateDepth = 0;
const MAX_EVALUATE_DEPTH = 2;

evaluate(prevState, nextState, dispatch) {
  if (_evaluateDepth >= MAX_EVALUATE_DEPTH) {
    console.warn('SystemEventObserver: max re-entrant depth reached, skipping');
    return;
  }
  _evaluateDepth++;
  try {
    // ... existing logic
  } finally {
    _evaluateDepth--;
  }
}
```

**Dependencies:** None  
**Risk if skipped:** A future observer callback that dispatches an action causing another state change creates an infinite render loop. Currently theoretical but becomes real as more observers are added. **MEDIUM**.

---

### Task 2.4 — Optimize State Cloning on Reset

**Owner:** Mei  
**Priority:** LOW  
**Effort:** 1 hour  
**Issue:** #5 — `structuredClone` on reset.

**Files to modify:**
- `src/hook/usegamestate.js` — Replace `structuredClone` fallback with a factory pattern

**What it does:**  
The current `cloneInitialState()` uses `structuredClone` (or JSON serialize fallback) every time `RESET_GAME_STATE` fires. Since `initialGameState` is a static import, use a factory function in `initialState.js` that constructs a fresh state object instead of deep-cloning a frozen template. This avoids the O(n) clone cost.

**Dependencies:** None  
**Risk if skipped:** Minor perf impact on game reset. Players won't notice. **LOW**.

---

## Phase 3: Frontend + UX (Week 5-8)

### Task 3.1 — Add Gameplay Quick-Action Buttons

**Owner:** Alex  
**Priority:** HIGH (player-facing)  
**Effort:** 8 hours  
**Issue:** Player concern — Text-only input is a barrier.

**Files to modify:**
- `src/components/gameui/GameQuickActions.jsx` — Add context-sensitive gameplay action buttons
- `src/components/gameui/useGameUiWindowController.js` — Wire gameplay actions
- `src/App.css` — Mobile-responsive styles for action buttons

**What it does:**  
The existing `GameQuickActions` only has panel-toggle buttons (Quests, Shop, etc.). Add a **gameplay actions row** with context-sensitive buttons:
- **Exploration mode:** Attack (if enemies nearby), Rest, Move (directional), Status
- **Combat mode:** Attack, Escape, Use Skill (dropdown)
- **General:** Inventory, Look

Buttons should be driven by current game state (hide Attack when not in combat, show Rest only when out of combat). Mobile: stack buttons vertically with larger touch targets (48px minimum).

**Dependencies:** None  
**Risk if skipped:** Mobile and casual players churn. Text-only input is the #1 player complaint. **HIGH**.

---

### Task 3.2 — Auto-Allocate Stats Option

**Owner:** Alex + Mei  
**Priority:** MEDIUM (player-facing)  
**Effort:** 6 hours  
**Issue:** Player concern — 10 attributes to manage is overwhelming.

**Files to create:**
- `packages/game-core/src/systems/leveling/AutoAllocator.js` — Pure function for stat distribution

**Files to modify:**
- `packages/game-core/src/core/ActionDispatcher.js` (or new handler in Phase 2 registry) — Add `auto_allocate` action type
- UI component for level-up screen — Add "Auto-Allocate" button

**What it does:**  
Provide a one-click option that distributes unspent attribute points based on the player's class archetype:
- **Warrior:** STR > VIT > AGI  
- **Mage:** INT > WIS > VIT  
- **Rogue:** AGI > DEX > STR  
- **Balanced:** Even distribution

The allocator is a pure function taking `(unspentPoints, archetype) => attributeDeltas`. Deterministic, testable, no RNG.

**Dependencies:** Task 2.1 (if registry pattern is adopted, add as new handler)  
**Risk if skipped:** Casual players feel lost during level-up. Not a blocker but reduces retention. **MEDIUM**.

---

### Task 3.3 — Add Mid-Game XP Brackets

**Owner:** Luna + Mei  
**Priority:** MEDIUM (player-facing)  
**Effort:** 4 hours  
**Issue:** Player concern — XP curve becomes impossible past mid-game.

**Files to modify:**
- `packages/game-core/src/core/xpCurve.js` — Add additional brackets to `defaultBrackets`

**What it does:**  
Currently only one bracket: `[{ end: 1000, base: 100, growth: 1.5 }]`. The growth rate of 1.5 means XP requirements grow 50% per level, becoming astronomical by level 30+. Add intermediate brackets to flatten the mid-game:

```js
const defaultBrackets = [
  { end: 20,   base: 100,  growth: 1.15 },  // Early game: gentle
  { end: 50,   base: 250,  growth: 1.25 },  // Mid game: moderate  
  { end: 100,  base: 800,  growth: 1.35 },  // Late game: challenging
  { end: 1000, base: 3000, growth: 1.50 },  // End game: prestige territory
];
```

**Files also affected:**
- `tests/unit/LevelingAndCombat.test.js` — Update XP expectation tests
- Run simulation (`npm run simulate:quick`) to validate progression curve

**Dependencies:** None (but Luna should run simulations to validate)  
**Risk if skipped:** Players hit a wall at level 25-30 and quit. The single bracket with 1.5 growth is exponentially punishing. **MEDIUM** — directly impacts retention.

---

## Phase 4: Advanced Testing & Hardening (Week 9-12)

### Task 4.1 — Playwright E2E Test Foundation

**Owner:** Darius  
**Priority:** MEDIUM  
**Effort:** 12 hours  
**Issue:** #9 — Playwright is a devDependency but unused.

**Files to create:**
- `playwright.config.js` — Playwright configuration
- `tests/e2e/smoke.spec.js` — Basic smoke test (app loads, login/local mode, game renders)
- `tests/e2e/gameplay-loop.spec.js` — Core loop: character creation → explore → combat → rest

**Files to modify:**
- `package.json` — Add `test:e2e` script

**What it does:**  
Stand up the Playwright test infrastructure. Start with 2-3 smoke-level E2E tests that verify the app renders and the basic gameplay loop works. Configure to run against `vite preview` (production build). Add to CI as an optional quality gate initially.

**Dependencies:** Task 3.1 (gameplay buttons make E2E tests more reliable than text input)  
**Risk if skipped:** No regression protection for the full user flow. Unit tests can't catch CSS layout breaks, lazy-load failures, or React hydration issues. **MEDIUM**.

---

### Task 4.2 — PRNG Sequence Snapshot Test

**Owner:** Luna  
**Priority:** LOW  
**Effort:** 3 hours  
**Issue:** #10 — No cross-engine PRNG snapshot test.

**Files to create:**
- `tests/unit/PRNGSequenceSnapshot.test.js` — Snapshot test for PRNG outputs

**What it does:**  
Generate a deterministic sequence of 1000 PRNG values from `SimBridge.initialize(42)` and snapshot-test it. Any change to the PRNG algorithm will break this test, flagging the need to update save-game compatibility or migration logic.

**Dependencies:** None  
**Risk if skipped:** Silent PRNG drift between engine versions breaks replay determinism. **LOW** — currently single-engine, but critical if Godot engine parity matters.

---

### Task 4.3 — SimBridge Isolation

**Owner:** Luna  
**Priority:** LOW  
**Effort:** 4 hours  
**Issue:** #11 — Mutable global singleton.

**Files to modify:**
- `packages/game-core/src/simulation/bridge/SimulationContext.js` — Add `createSimBridge()` factory

**What it does:**  
Add a factory function `createSimBridge(seed)` that returns an isolated instance. Keep the global `SimBridge` as a convenience alias but allow tests to create independent instances. This prevents test pollution when multiple test files call `SimBridge.initialize()` with different seeds concurrently.

**Dependencies:** None  
**Risk if skipped:** Test ordering dependencies. Parallel test execution may produce non-deterministic results when tests share the SimBridge singleton. **LOW**.

---

## Risk Matrix

| Issue | Severity | Phase | Skip Risk |
|-------|----------|-------|-----------|
| No Jest coverage thresholds | HIGH | 1 | Silent regression accumulation |
| Smoke suite covers 6/97 files | HIGH | 1 | `npm run check` gate is meaningless |
| No gameplay quick-action buttons | HIGH (UX) | 3 | Mobile/casual player churn |
| ActionDispatcher 601-line monolith | MEDIUM | 2 | Maintainability ceiling, slower development |
| PrestigeSystem dual files | MEDIUM | 2 | Wrong-file edits, drift |
| SystemEventObserver re-entrancy | MEDIUM | 2 | Theoretical infinite loop |
| Ignored tests undocumented | MEDIUM | 1 | Unknown technical debt |
| XP curve impossible mid-game | MEDIUM (UX) | 3 | Player retention drop |
| Auto-allocate stats | MEDIUM (UX) | 3 | Casual player confusion |
| No Playwright E2E tests | MEDIUM | 4 | No full-flow regression protection |
| restHealAmount misleading config | LOW | 1 | Review confusion (behavior is correct) |
| State cloning on reset | LOW | 2 | Minor perf impact |
| PRNG snapshot test missing | LOW | 4 | Silent determinism drift |
| SimBridge mutable singleton | LOW | 4 | Test pollution risk |

---

## Team Disagreements

### Alex vs. Mei: Quick-Action Button Scope
**Alex** wants full context-sensitive buttons with skill dropdowns and directional movement.  
**Mei** argues for a minimal first iteration (Attack/Rest/Escape only) shipped in half the time.  
**Resolution:** Ship minimal set first (Attack, Rest, Escape, Status, Inventory). Skill selection and movement can follow in a fast-follow iteration. The core player complaint is "I can't do anything without typing."

### Darius vs. Luna: Coverage Threshold Starting Point
**Darius** wants to start at 70% to force immediate backfill.  
**Luna** argues that starting too high will block PRs and slow velocity, especially for simulation code with hard-to-test paths.  
**Resolution:** Start at 50% branches / 60% statements. Ratchet up by 5% per month. The goal is to stop regression, not to retroactively cover everything.

### Raj vs. Mei: PrestigeSystem — Delete .js or .ts?
**Raj** wants to keep .ts as canonical (it has proper types).  
**Mei** points out the project has no full TypeScript build pipeline — babel-jest transforms TS but types aren't checked in CI for game-core.  
**Resolution:** Keep .ts as canonical. The existing `babel-jest` transform handles it. Add a follow-up task to enable `tsc --noEmit` for `packages/game-core` in CI.

### ErrorBoundary — Issue Already Resolved
The entire team agrees this is a false positive. `ErrorBoundary` already wraps the app in `main.jsx`. The dev review didn't check deep enough. **No action needed.** Marked as resolved.

---

## Effort Summary

| Phase | Tasks | Total Effort | Key Deliverables |
|-------|-------|-------------|------------------|
| Phase 1 (Wk 1-2) | 4 | ~9.5 hours | Coverage gates, expanded smoke tests, config fix |
| Phase 2 (Wk 3-4) | 4 | ~18 hours | Registry-pattern ActionDispatcher, PrestigeSystem cleanup |
| Phase 3 (Wk 5-8) | 3 | ~18 hours | Gameplay buttons, auto-allocate, XP curve fix |
| Phase 4 (Wk 9-12) | 3 | ~19 hours | Playwright E2E, PRNG snapshots, SimBridge isolation |
| **Total** | **14** | **~64.5 hours** | |
