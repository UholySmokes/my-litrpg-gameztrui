# Codebase Research Report — 6-Person Dev Team Review

**Report reviewed:** `docs/plan/codebase-overview/research_findings_full-codebase.yaml`  
**Date:** 2026-03-19  
**Review method:** YAML report analysis + source validation of 15+ key files

---

## 1. Lead Architect

### Assessment
The monorepo architecture with `@voidverse/game-core` and `@voidverse/game-schemas` as npm workspace packages is a solid structural choice — it cleanly separates game logic from presentation and API layers. The `createSystemEngine` facade pattern provides platform-agnostic consumption across both web and Godot runtimes. The back-compat shim re-exports in `src/core/` (e.g., `src/core/gameReducer.js` re-exporting from `@voidverse/game-core`) demonstrate a disciplined migration approach.

### Concerns
- **ActionDispatcher is a monolith.** At ~600 lines with a giant switch-case ([ActionDispatcher.js](packages/game-core/src/core/ActionDispatcher.js#L85)), this is the single largest coupling point in the codebase. Every new action type requires modifying this file, increasing merge conflict risk and reducing cohesion.
- **Dual `.js` and `.ts` for PrestigeSystem.** Both [PrestigeSystem.js](packages/game-core/src/systems/PrestigeSystem.js) and [PrestigeSystem.ts](packages/game-core/src/systems/PrestigeSystem.ts) exist in the same directory — unclear which is canonical. This signals an incomplete TypeScript migration.
- **Custom API router instead of framework.** The manual string-matching router in [api-router.js](functions/lib/api-router.js#L20) is now at ~150 lines with 20+ route branches. This lacks middleware support (no request logging, CORS, rate-limiting pipeline) and will become harder to maintain.
- **SimBridge is a mutable global singleton.** [SimulationContext.js](packages/game-core/src/simulation/bridge/SimulationContext.js#L40) exposes `SimBridge` as module-level state, making concurrent simulation or testing isolation fragile.

### Recommendations
1. **HIGH:** Refactor `ActionDispatcher` into a registry-based dispatch pattern (action type → handler map) to eliminate the switch-case monolith.
2. **MEDIUM:** Resolve the PrestigeSystem dual-file situation — pick JS or TS and delete the other.
3. **MEDIUM:** Evaluate replacing the custom router with a lightweight framework (e.g., Hono) or at minimum extract route definitions into a declarative table.
4. **LOW:** Make `SimBridge` instantiable rather than singleton for test isolation.

### Risk Rating: **MEDIUM**

---

## 2. Backend Engineer

### Assessment
The sync/commit protocol in [sync.js](functions/lib/sync.js) is surprisingly mature — it includes hash verification, batch commits, canary access policies, limited rollout percentage gating, and route latency tracking. Firestore security rules in [firestore.rules](firestore.rules) are correctly user-scoped with owner-match checks on all collections. The async narrate poll pattern (start → runId → poll) is a good design for avoiding long-running HTTP connections.

### Concerns
- **Dev auth bypass in production risk.** [auth.js](functions/lib/auth.js#L40) `isDevAuthEnabled()` defaults to `true` when `FUNCTIONS_EMULATOR=true` and also accepts an explicit `DEV_AUTH_ENABLED` env var. If a production deployment mistakenly sets either, auth is fully bypassed. The `x-dev-user-id` header at [auth.js](functions/lib/auth.js#L66) allows arbitrary user impersonation when dev auth is active.
- **No API rate limiting.** Grep confirms zero rate-limiting middleware or logic across all API routes in `functions/`. The only throttle reference is in `bulk-generation-service.js` for internal budget control — client-facing endpoints are unprotected.
- **Firebase Function resource allocation.** [index.js](functions/index.js#L17) allocates `1GiB` memory and `540s` timeout for the single `api` function. All routes share this — a narrate call that hits Gemini could consume the full timeout budget, starving lightweight routes like `/api/health`.
- **No input size validation.** `handleApiRequest` in [api-router.js](functions/lib/api-router.js#L20) does not enforce request body size limits. Large payloads could cause OOM on the 1GiB function.

### Recommendations
1. **CRITICAL:** Add a production safety guard in `isDevAuthEnabled()` that checks for a known production project ID and force-returns `false`. Log a warning if `DEV_AUTH_ENABLED` is set in a non-emulator environment.
2. **HIGH:** Implement per-route rate limiting, at minimum for `/api/narrate*` and `/api/sync/commit*` endpoints.
3. **MEDIUM:** Split the monolithic `api` function into separate functions per route group (sync, narrate, saves) with appropriate resource allocations.
4. **MEDIUM:** Add request body size validation at the router entry point.

### Risk Rating: **HIGH**

---

## 3. Frontend Engineer

### Assessment
The React architecture follows modern patterns well — lazy-loaded components via `Suspense` ([App.jsx](src/App.jsx#L9-L10)), `useReducer` for state management ([usegamestate.js](src/hook/usegamestate.js#L26)), and `useMemo`/`useCallback` for performance. The `WebGameplayGate` pattern cleanly separates dev/tooling web builds from production Godot builds. The ThemeProvider context and CSS custom properties show a well-organized styling approach.

### Concerns
- **State cloning strategy is expensive.** [usegamestate.js](src/hook/usegamestate.js#L10) uses `structuredClone` or `JSON.parse(JSON.stringify(...))` to clone the full initial state on every reset. For a game with deeply nested state (combat, inventory, world, quests), this is a significant allocation.
- **No error boundary visible in App.** [App.jsx](src/App.jsx) wraps content in `Suspense` but has no `ErrorBoundary` component visible in the JSX tree. A rendering error in the lazy-loaded `GameUI` would crash the entire app without recovery.
- **SystemEventObserver runs on every state change.** [usegamestate.js](src/hook/usegamestate.js#L53) calls `SystemEventObserver.evaluate(prevState, state, dispatch)` in a `useEffect` on every `state` update. If the observer dispatches actions, this creates a cascading re-render loop risk.
- **UI component coverage gap.** The research report admits `src/ui/` and `src/components/` were not fully explored — this is a blind spot for understanding the actual rendering architecture.

### Recommendations
1. **MEDIUM:** Add an `ErrorBoundary` wrapper around the lazy-loaded game content in `App.jsx`.
2. **LOW:** Audit `SystemEventObserver.evaluate` for dispatch loops — add a guard to prevent re-entrant dispatches within the same render cycle.
3. **LOW:** Consider using `useRef` for initial state to avoid cloning on every component mount.
4. **INFO:** Follow up with a dedicated UI component audit to fill the research gap.

### Risk Rating: **MEDIUM**

---

## 4. QA Engineer

### Assessment
The testing infrastructure is impressive for a project of this size — ~96 unit test files covering all major systems, Firestore security rule tests, simulation parity tests (`RuntimeSimulationParity`, `SyncCoreDeterminism`), and ~15 validation scripts for registries, archetypes, balance corridors, and worldbuild integrity. The CI pipeline runs the full suite: lint → typecheck → unit tests → firestore rules → validation scripts → build.

### Concerns
- **Smoke test suite is minimal.** [package.json](package.json#L26) `test:smoke` only runs 6 specific test files. This is the gatekeeper for `check` and `check:inner-loop` — a broken `CombatSystem` or `LevelingManager` would pass smoke but fail in CI.
- **No code coverage enforcement.** There is no `test:coverage` script and no coverage threshold configured in the Jest config ([package.json](package.json#L140)). The `coverage/` directory exists but appears to be manually generated, not CI-enforced.
- **Three test files are explicitly ignored.** [package.json](package.json#L148-L150) ignores `skillEffects.test.js`, `endToEndEffects.test.js`, and `magnitudeCapsFusion.test.js` — these likely contain broken or outdated tests that need triage.
- **No E2E test coverage.** Playwright is a devDependency but no Playwright test files or configurations were found in the research. The browser-based game flow is untested end-to-end.
- **Deterministic PRNG testing gap.** While `SeededPRNG` in [SimulationContext.js](packages/game-core/src/simulation/bridge/SimulationContext.js#L3) uses XorShift32, there's no test verifying the PRNG produces the same sequence across JS engines (Node vs browser vs Godot GDScript). Drift here would break replay parity.

### Recommendations
1. **HIGH:** Expand the smoke test suite to include at least `CombatSystem`, `LevelingManager`, `ActionDispatcher`, and `DataRegistry` tests.
2. **HIGH:** Add Jest coverage thresholds (e.g., 70% branch coverage) and enforce in CI via the `quality-gates.yml` workflow.
3. **MEDIUM:** Triage the 3 ignored test files — fix or remove them with a documented reason.
4. **MEDIUM:** Create at least one Playwright E2E test for the character creation → first action flow.
5. **LOW:** Add a cross-engine PRNG sequence snapshot test.

### Risk Rating: **MEDIUM**

---

## 5. DevOps Engineer

### Assessment
The CI/CD setup is solid for the project stage — three GitHub Actions workflows (`pr-fast.yml`, `quality-gates.yml`, `nightly-replay-load.yml`) cover PR validation, push quality gates with Godot headless testing, and nightly replay load tests. The `pr-fast.yml` uses `dorny/paths-filter` for change detection, which avoids unnecessary test runs. Firebase emulator configuration in [firebase.json](firebase.json#L62-L73) covers Functions, Hosting, Firestore, and DataConnect.

### Concerns
- **No deploy workflow.** None of the three CI workflows include a deployment step to Firebase Hosting or Functions. Deployments appear to be manual (`firebase deploy`), introducing human error risk.
- **Docker setup is disconnected from main workflow.** [docker-compose.yml](docker-compose.yml) defines `web` and `api` services, but the `Dockerfile` only builds the `user_agent/` Python service — not the Node.js API or web frontend. [Dockerfile.web](Dockerfile.web) is referenced but untested in CI.
- **No `.nvmrc` validation visibility.** Both CI workflows reference `.nvmrc` for Node version, but the file wasn't mentioned in the research report. If it's missing or out of sync with `"engines": {"node": ">=20.0.0"}`, CI will silently use a different version.
- **Emulator port conflicts.** [package.json](package.json#L12) `dev` runs Vite on port 5173, while [firebase.json](firebase.json#L65) hosting emulator uses 5000 and functions uses 5001. The `dev:api` script kills ports 5000/5001/4000/4400/4500, but no validation ensures ports are actually free.
- **No staging environment.** Scripts reference staging (`test:staging:endpoint-probe`, `test:staging:soak-smoke`, `report:staging:signoff`) but no staging Firebase project or deploy target is configured in `firebase.json`.

### Recommendations
1. **HIGH:** Add a deploy workflow for Firebase (at minimum for `main` branch pushes or manual trigger).
2. **MEDIUM:** Fix Docker setup — either make the Dockerfiles usable for the actual API/web stacks or remove them to avoid confusion.
3. **MEDIUM:** Add `.nvmrc` validation as a CI step or document the expected Node version clearly.
4. **LOW:** Add a `firebase use` target configuration for staging vs production environments.

### Risk Rating: **MEDIUM**

---

## 6. Game Systems Designer

### Assessment
The RPG system depth is exceptional — 20 classes, 40+ races, 12 essence types in the magic system, skill fusion/evolution, archetypes with 6 category dimensions, profession system, prestige mechanics, and a piecewise XP curve with configurable brackets. The systems directory hierarchy in `packages/game-core/src/systems/` with 17 domain subdirectories shows strong content organization. The `DataRegistry` facade pattern and JSON-based skill data files (`{className}.{active|passive}.json`) enable content authoring without code changes.

### Concerns
- **Balance validation is script-based, not runtime.** `validate:balance-corridors` runs as a script — there's no runtime balance guard. A content change to a JSON data file could ship an overpowered skill without CI catching it (validation only runs in `quality-gates.yml`, not `pr-fast.yml`).
- **Magic system rollout is feature-flagged mid-system.** [ActionDispatcher.js](packages/game-core/src/core/ActionDispatcher.js#L28) `isLayerDEnabled` gates magic actions at the dispatcher level. This means parts of the magic system can be in production while other parts are behind flags, creating partial-feature states that are hard to test holistically.
- **XP curve maxLevel=1000 is untested at scale.** [initialState.js](packages/game-core/src/data/initialState.js#L9) sets `maxLevel: 1000` with a bracket-based growth curve. The research doesn't mention simulation or stress testing for high-level gameplay balance (levels 500-1000).
- **No content versioning enforcement.** `initialGameState` includes `contentVersion: "core@0.1.0"` but there's no mechanism visible for migrating existing saves when content data changes (e.g., adding a new skill to `knight.active.json`).
- **PrestigeSystem status unclear.** Both `.js` and `.ts` variants exist, `defaultPrestigeStats` is imported by `StateNormalizer`, but the prestige mechanics completeness is unknown.

### Recommendations
1. **HIGH:** Add balance corridor validation to `pr-fast.yml` so content changes are caught before merge.
2. **MEDIUM:** Document the magic rollout flag lifecycle — when is `layerD` expected to be removed? Add a test that verifies all magic actions work with flags on AND off.
3. **MEDIUM:** Run simulation suite at high levels (500-1000) and validate XP/stat scaling doesn't break.
4. **LOW:** Design a content migration strategy for save compatibility when data files change.
5. **LOW:** Audit and complete the PrestigeSystem — resolve the dual-file situation and document what's implemented vs. planned.

### Risk Rating: **MEDIUM**

---

## Team Consensus

### Top 3 Strengths

1. **Mature monorepo architecture with clean separation.** The `@voidverse/game-core` workspace package, `createSystemEngine` facade, and `DataRegistry` patterns create a well-layered system that supports both web and Godot runtimes from a single shared codebase.

2. **Comprehensive testing and validation infrastructure.** ~96 unit tests, Firestore security rule tests, simulation determinism parity tests, and ~15 validation scripts provide unusually strong quality confidence for a game project. The CI pipeline enforces lint, typecheck, tests, and multiple validation passes.

3. **Deep RPG system design with content-data separation.** 17 game system domains, JSON-based skill/class/race data, archetype framework, and the `DataRegistry` facade allow game designers to author content without modifying engine code. The balance corridor and worldbuild validation scripts add guardrails.

### Top 5 Risks (ordered by severity)

1. **CRITICAL — Dev auth bypass exploitable in production.** `isDevAuthEnabled()` in [auth.js](functions/lib/auth.js#L40) can be triggered by env misconfiguration, enabling full auth bypass and user impersonation via `x-dev-user-id` header. No production safety guard exists.

2. **HIGH — No API rate limiting.** All client-facing API endpoints (narrate, sync, saves) have zero rate limiting. A malicious or misconfigured client could exhaust Gemini API quota or Firestore write limits.

3. **HIGH — No automated deployment pipeline.** Firebase deployments are manual, risking inconsistent production states and eliminating deployment audit trails.

4. **MEDIUM — ActionDispatcher maintainability ceiling.** The 600-line switch-case monolith is the core routing point for all game actions. Adding new systems (which happens frequently) increases coupling and merge conflicts.

5. **MEDIUM — Code coverage not enforced.** No coverage thresholds in CI, three test files explicitly ignored, and smoke suite covers only 6 of 96+ test files. Regressions in untested areas will go undetected.

### Recommended Next Actions

1. **Immediately** add a production safety guard to `isDevAuthEnabled()` to prevent auth bypass in non-emulator environments.
2. **This sprint** add API rate limiting for `/api/narrate*` and `/api/sync/commit*` routes.
3. **This sprint** add balance corridor validation to `pr-fast.yml` workflow.
4. **Next sprint** create a Firebase deploy workflow with staging/production environment targets.
5. **Next sprint** expand smoke tests and add Jest coverage thresholds enforced in CI.
6. **Backlog** refactor `ActionDispatcher` into a registry-based dispatch pattern.
7. **Backlog** resolve PrestigeSystem dual-file, Docker setup inconsistencies, and ignored test files.
