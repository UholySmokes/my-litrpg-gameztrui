# AUDIT_REPORT

## Executive Summary
This repository is structurally healthy for frontend runtime and tests (frontend build passes, all 25 Jest suites pass), but it has fix-ready wiring risks: the UI action pipeline bypasses the canonical `SystemEngine.step()` path, action suggestions include phrases not parsable into gameplay actions, backend Functions lack a build script and fail TypeScript checks, and some UI/system artifacts are orphaned or partially wired. Character creation works end-to-end in-session, but persistence/resume and accessibility basics still need a targeted pass.

## How to Verify
Run these from repo root unless noted.

```bash
npm install
npm --prefix functions install
npm run build
npm run lint
npm run typecheck
npm test -- --runInBand
npm --prefix functions run build
npm --prefix functions exec tsc --noEmit
npm run dev -- --host 127.0.0.1 --port 4173
npm run dev:api
```

## Phase 0 - Repo Map

### Entrypoints and architecture
- Frontend boot: `src/main.jsx:10` (`startApp`) -> renders `App` at `src/main.jsx:15`.
- Frontend app shell/auth gate: `src/App.jsx` (`AppContent`, local mode + auth mode).
- Primary game container: `src/components/GameUI.jsx` (creation mode + game mode, state mutation handlers).
- Local state engine hook: `src/hook/usegamestate.js` (`useGameEngine`, reducer + engine instance).
- Narrative/action hook: `src/hook/useNarrative.js` (`submitInput`, AI narrative + action execution).
- Canonical engine facade: `packages/game-core/src/engine/createSystemEngine.js`.
- Reducer/action logic: `packages/game-core/src/core/gameReducer.js`, `packages/game-core/src/core/ActionDispatcher.js`.
- Backend functions entrypoint: `functions/index.js` (`exports.api`, `exports.agentList`, `exports.agentRun`).
- Backend API router: `functions/lib/api-router.js`.
- Hosting/API rewrites: `firebase.json:41` and `firebase.json:43` (`/api/**` -> function `api`).

### Routing and navigation
- No client router package is used (single app shell + internal mode switching).
- UI navigation is mode and window toggles (`src/components/GameUI.jsx:680`, `src/components/GameUI.jsx:754`).
- API routing is function-router based (`functions/lib/api-router.js:40` onward).

### State management
- React `useReducer` root state in `src/hook/usegamestate.js:24`.
- Reducer is shimmed to package core: `src/core/gameReducer.js` -> `@voidverse/game-core/core/gameReducer.js`.
- Engine instance created in `src/hook/usegamestate.js:31` with `createSystemEngine`.

### Data models/schemas
- Initial runtime game state: `packages/game-core/src/data/initialState.js`.
- Character creation data assembly: `src/hook/useCharacterCreationReworked.js:581` (`finalizeCharacter`).
- Save schema constraints (GUID, save name length, serialized game_state): `functions/lib/saves.js`.
- `@voidverse/game-schemas` runtime files are no-op wrappers (`packages/game-schemas/src/index.js:1`, `packages/game-schemas/src/state.js:1`, `packages/game-schemas/src/actions.js:1`).

### Build/test command surface
- Root scripts: `package.json:12` onward (`dev`, `dev:api`, `build`, `lint`, `typecheck`, `test`).
- Functions package has no scripts block (`functions/package.json:1-18`).

### Main user journeys (current)
- User opens app, auth/local mode resolved in `src/App.jsx`.
- User completes character creation in `CharacterCreationMode` (hook-backed step validation).
- On finalize, `GameUI` seeds quests/world and starts initial narrative (`src/components/GameUI.jsx:175`).
- User plays via text commands (`useNarrative.submitInput`) and windowed game panels.
- Combat UI uses explicit action handlers (`src/components/CombatUI.jsx:136`, `src/components/CombatUI.jsx:216`) -> reducer events.
- State autosaves locally every debounce cycle (`src/components/GameUI.jsx:110` effect block).
- Save/Load panel persists to local storage and optional `/api/saves` backend (`src/components/SaveLoadUI.jsx`, `src/core/CloudSaveService.js`).

## Phase 1 - Connection Integrity Sweep

| Item | Defined at | Expected caller | Actual callers | Status | Impact | Fix |
|---|---|---|---|---|---|---|
| `submitAction` canonical engine path | `src/hook/usegamestate.js:119` (`submitAction`), `packages/game-core/src/engine/createSystemEngine.js:80` (`step`) | `useNarrative.submitInput` should call one canonical `engine.step` flow | No repo callsites for `submitAction` (`rg -n "submitAction"` only definitions) | [ ] P0 Defect | Engine event collection (`evaluateToEvents`) and canonical step semantics are bypassed in UI command flow | Route narrative input through `submitAction`/`APPLY_ENGINE_RESULT` and remove duplicate execution path |
| Suggestion strings not parsable to gameplay actions (`"use skill"`, `"attempt escape"`) | `src/hook/useNarrative.js:153`, `src/hook/useNarrative.js:155` | `InputParser.parseAction` should produce actionable type | `packages/game-core/src/core/InputParser.js:14-414` has no `skill`/`escape` parser tokens; suggestion click passes raw label (`src/ui/panels/ActionSuggestionsPanel.jsx:28`, `src/components/GameUI.jsx:548`) | [ ] P1 Defect | User sees high-confidence actions that silently degrade to narrative/no-op state mutation | Add parser intents for skill/escape OR change suggestion generation to parser-supported commands |
| EventBus listener with no producer (`system:log`) | `src/components/SystemLog.jsx:67` | Some system should emit `EventBus.emit("system:log", ...)` | No emit sites (`rg -n "system:log"` only in `SystemLog.jsx`) | [ ] P2 Defect | Dead UI log pipeline; misleading maintenance surface | Either wire emitters or remove component and replace with existing narrative/combat logs |
| Orphan legacy character creation component | `src/components/CharacterGenesisUI_Enhanced.jsx:127` | App/game shell import or route | No imports outside file (`rg -n "CharacterGenesisUI_Enhanced" src` returns only definition) | [ ] P2 Refactor/Quality | Duplicate maintenance burden and stale behavior drift risk | Remove file or reintroduce intentionally behind explicit feature flag |
| Stale local-storage flags (`characterCreated`, `saveLoaded`) | `src/App.jsx:76-77` | Read/write logic in startup flow | No other references in repo | [ ] P1 Missing Feature | Persistence resume gating is partially wired and currently ineffective | Either remove dead keys or implement startup resume logic that uses them |
| Backend agent routes have no frontend consumer | `functions/lib/api-router.js:44`, `functions/lib/api-router.js:48`; callable exports in `functions/index.js` | Admin/ops UI or explicit client | No `/api/agents` or callable agent usage in `src/` | [ ] P2 Missing Feature - Needs verification (Hypothesis) | Potentially unreachable functionality if no external client exists | Confirm intended external caller; if internal, add minimal UI/CLI integration or document ownership |
| Archetype schema module appears unregistered | `packages/game-core/src/systems/archetype/archetypeSchema.js` | Validation pipeline/system builder import | No external refs detected by repo scan | [ ] P2 Refactor/Quality - Needs verification (Hypothesis) | Dead schema can drift from runtime reality | Either wire into build-time validation or remove |

## Defects (Actionable)

- [ ] **P0 Defect** Unify canonical engine execution path.
  - Rationale: Current UI bypasses `engine.step()`.
  - Impact: Divergent runtime behavior vs intended engine loop/events.
  - Repro/verification: Compare `src/hook/usegamestate.js:119` (`engine.step`) with `src/hook/useNarrative.js:668`, `src/hook/useNarrative.js:676`, `src/hook/useNarrative.js:730` (parse/validate/execute directly).
  - Proposed fix scope: 1 hook (`useNarrative`), 1 hook interface (`useGameEngine`), reducer action path (`APPLY_ENGINE_RESULT`).

- [ ] **P1 Defect** Suggestions emit unsupported commands.
  - Rationale: High-probability suggestions include unsupported parser intents.
  - Impact: User command taps can fail to mutate game state unexpectedly.
  - Repro/verification: Click suggestion `"attempt escape"` or `"use skill"`; parser action list in `packages/game-core/src/core/InputParser.js:14-414` lacks matching action type.
  - Proposed fix scope: parser intents + validator + dispatcher mapping OR suggestion dictionary cleanup.

- [ ] **P2 Defect** `SystemLog` event contract broken.
  - Rationale: listener has no emitting counterpart.
  - Impact: Invisible functionality and dead code path.
  - Repro/verification: Search `system:log` usage; only in `src/components/SystemLog.jsx:67-68`.
  - Proposed fix scope: either remove component or wire emits in reducer/systems.

## Missing Features (Actionable)

- [ ] **P1 Missing Feature** Persistence resume gating for character creation.
  - Rationale: startup clears flags (`src/App.jsx:76-77`) but no logic consumes them.
  - Impact: Incomplete resume flow semantics.
  - Repro/verification: repo search for `characterCreated` and `saveLoaded` shows no readers/writers beyond removeItem.
  - Proposed fix scope: either fully implement startup resume read-path or remove flags entirely.

- [ ] **P2 Missing Feature - Needs verification (Hypothesis)** Agent endpoints integration.
  - Rationale: API exposes `/api/agents` and `/api/agents/run`; frontend has no caller.
  - Impact: Feature may be unreachable from product UI.
  - Repro/verification: route definitions at `functions/lib/api-router.js:44-49`; no `src` references.
  - Proposed fix scope: docs-only if external consumer exists; otherwise add internal admin trigger surface.

## Refactor/Quality (Actionable)

- [ ] **P2 Refactor/Quality** Remove or rewire orphan `CharacterGenesisUI_Enhanced`.
  - Rationale: duplicate creation UI not used.
  - Impact: stale code drift and duplicated bug surface.
  - Repro/verification: `src/components/CharacterGenesisUI_Enhanced.jsx:127` only reference.
  - Proposed fix scope: delete + snapshot tests update, or explicitly gate/route it.

- [ ] **P2 Refactor/Quality - Needs verification (Hypothesis)** `archetypeSchema.js` is unreferenced.
  - Rationale: no import callsites found.
  - Impact: schema may not enforce anything.
  - Repro/verification: repo grep for `archetypeSchema` yields no usage.
  - Proposed fix scope: either import in validation scripts or remove.

- [ ] **P2 Refactor/Quality** Modal accessibility baseline pass.
  - Rationale: modal overlays rely on click-close but lack dialog semantics and keyboard handling.
  - Impact: keyboard/screen-reader accessibility gap.
  - Repro/verification: modal overlays at `src/components/SaveLoadUI.jsx:398`, `src/components/ShopUI.jsx:225`, `src/components/GachaUI.jsx:183`, `src/components/TitleUI.jsx:296`, `src/components/ProfessionUI.jsx:289`, `src/components/StatusOverlay.jsx:1099`; no `role="dialog"`/`aria-modal` or Escape handler in these files.
  - Proposed fix scope: shared modal wrapper with focus trap + Escape + ARIA.

## Phase 2 - Stubs / Missing Content

- [ ] **P1 Missing Feature** `SimulationKernel` world update TODO.
  - Rationale: explicit TODO in deterministic kernel.
  - Evidence: `packages/game-core/src/simulation/kernel/SimulationKernel.ts:382` (`TODO: Implement world state updates`).
  - Impact: simulation fidelity incomplete.
  - Repro/verification: inspect kernel command execution path around world progression.
  - Proposed fix scope: implement world-state mutation stage + regression tests.

- [ ] **P1 Missing Feature** `GameStateAdapter` stamina/cooldowns TODOs.
  - Evidence: `packages/game-core/src/simulation/bridge/GameStateAdapter.js:43`, `packages/game-core/src/simulation/bridge/GameStateAdapter.js:58`.
  - Impact: adapter omits combat-relevant fields, risking runtime/simulation drift.
  - Repro/verification: compare live player shape vs adapter output.
  - Proposed fix scope: map stamina/cooldowns in adapter + serialization tests.

- [ ] **P2 Refactor/Quality** Runtime no-op schema package usage clarity.
  - Evidence: `packages/game-schemas/src/index.js:1`, `packages/game-schemas/src/state.js:1`, `packages/game-schemas/src/actions.js:1`.
  - Impact: easy to assume runtime validation exists when it is type-only.
  - Repro/verification: import package at runtime and inspect outputs (no-op).
  - Proposed fix scope: docs + optional runtime guards in dev mode.

## Phase 3 - Character Creation Report

### Works
- UI flow is complete from wizard to finalization callback:
  - `src/ui/modes/CharacterCreationMode.jsx:125` (`CharacterCreationMode`) -> `CreationSummaryPanel` finalize (`src/ui/modes/CharacterCreationMode.jsx:600-609`).
- Validation gates all key steps before finalize:
  - `src/hook/useCharacterCreationReworked.js:504` (`validateReview`) and `src/hook/useCharacterCreationReworked.js:581` (`finalizeCharacter`).
- Character object includes core gameplay fields (`attributes`, `skills`, `profession`, `archetypeSystem`, resources, hp/mana/xp):
  - `src/hook/useCharacterCreationReworked.js:657-715`.
- Created character is consumed by gameplay initialization:
  - Quest seeding: `src/components/GameUI.jsx:175` + `packages/game-core/src/systems/quest/QuestManager.js:11`.
  - World seeding: `src/components/GameUI.jsx:194` + `packages/game-core/src/world/WorldInitializer.js:112`.
  - Initial narrative prompt consumption of race/class/profession/system/skills: `src/core/PromptAssembler.js:548-633`.

### Breaks
- [ ] **P0 Defect** Canonical engine path not used for text command execution (`submitAction` unused).
- [ ] **P1 Defect** Suggestion labels include unsupported parser intents (`use skill`, `attempt escape`).
- [ ] **P1 Missing Feature** Startup persistence flags are stale (`characterCreated`/`saveLoaded`).

### Missing
- [ ] **P1 Missing Feature** Explicit post-finalize persistence checkpoint (currently relies on debounce autosave in `src/components/GameUI.jsx:110`).
  - Risk: abrupt close before debounce may lose session start.
- [ ] **P2 Missing Feature** Character schema validation at persistence boundary (backend stores generic serialized `game_state`, see `functions/lib/saves.js`).

### Next minimal implementation
- [ ] Wire `useNarrative.submitInput` to `useGameEngine.submitAction` and keep one mutation path.
- [ ] Add parser intents for skill and escape commands (or remove those suggestions).
- [ ] On successful finalize, write a deterministic local checkpoint immediately (before debounce).
- [ ] Replace legacy `characterCreated/saveLoaded` key handling with an explicit resume strategy.

## Special Focus - Void-Verse Engine Checks

- [ ] **P0 Defect** UI bypasses canonical engine entrypoint.
  - Evidence: canonical path exists (`src/hook/usegamestate.js:119`), but narrative flow calls parse/validate/execute directly (`src/hook/useNarrative.js:668`, `src/hook/useNarrative.js:676`, `src/hook/useNarrative.js:730`).

- [ ] **P1 Defect** Runtime vs simulation divergence risk from dual mutation paths.
  - Evidence: text actions go through `ActionDispatcher` (`packages/game-core/src/core/ActionDispatcher.js`); combat buttons dispatch reducer events (`packages/game-core/src/core/gameReducer.js:576-651`, `src/components/GameUI.jsx:476-513`).
  - Needs verification: compare equivalent scenarios (e.g., combat attack/escape) across both paths for identical state/event outputs.

- [ ] **P1 Defect** EventBus drift/partial bridge.
  - Evidence: many systems emit events (`packages/game-core/src/systems/combat/CombatSystem.js:3078`, `packages/game-core/src/systems/class/ChiSystem.js:87`, `packages/game-core/src/systems/world/TimeSystem.js:144`), but core-to-simulation bridge in `packages/game-core/src/core/EventBus.js:51-88` has narrow explicit mappings plus generic events; listener coverage is minimal.

- [ ] **P1 Missing Feature** Systems implemented but not clearly registered in runtime validation path.
  - Evidence: `packages/game-core/src/systems/archetype/archetypeSchema.js` has no detected imports.
  - Needs verification: confirm whether build-time tooling loads this schema out-of-band.

## Phase 4 - Build/Test/Runtime Failures

### 1) Install deps
- Root: `npm install` -> success.
- Functions: `npm install` -> success with warnings.
  - Log excerpt:
    - `npm warn EBADENGINE ... required: { node: '20' } current: { node: 'v24.13.0' }`
    - `peer firebase-admin@"^13.4.0" from @dataconnect/admin-generated@0.0.1` (installed `firebase-admin@12.7.0`).
- [ ] **P2 Refactor/Quality** Normalize backend Node/toolchain + peer dependency alignment.

### 2) Build frontend + backend
- Frontend: `npm run build` -> success.
- Backend: `npm --prefix functions run build` -> failure.
  - Log excerpt: `npm error Missing script: "build"`.
- Root cause: `functions/package.json` defines no scripts block (`functions/package.json:1-18`).
- [ ] **P1 Defect** Add explicit backend build/check scripts (even if runtime currently ships prebuilt `lib`).

### 3) Lint/typecheck
- Lint: `npm run lint` -> passes with warnings (29 warnings).
  - Includes hook dependency warnings (`src/hook/useNarrative.js:808`, `src/hook/useNarrative.js:920`) and unused vars.
- Root typecheck: `npm run typecheck` -> success.
- Functions typecheck: `npm --prefix functions exec tsc --noEmit` -> failure.
  - Log excerpt:
    - `Cannot find namespace 'Handlebars'`
    - `Cannot find module 'firebase-functions/https'`
    - `Module 'firebase-functions' has no exported member 'setGlobalOptions'`
    - `src/dataconnect-admin-generated/index.d.ts ... no exported member 'OperationOptions'`
- [ ] **P1 Defect** Repair functions TypeScript compile path and dependency/types versions.

### 4) Tests
- `npm test -- --runInBand` -> success (25/25 suites, 141/141 tests).
- [x] Verified fixed (from pre-audit reconciliation): duplicate staged Data Connect package collision no longer present; tests run cleanly.

### 5) Dev run smoke test
- Frontend smoke: launched `npm run dev -- --host 127.0.0.1 --port 4173` and confirmed listener on `127.0.0.1:4173`.
- API smoke: launched `npm run dev:api` and confirmed emulator listeners on `127.0.0.1:5000` and `127.0.0.1:5001`.
- [x] Verified fixed: staged duplicate SDK additions were reconciled before this audit.

## Phase 5 - Patch Plan (PR-sized chunks)

### PR 1 - P0 wiring fixes
- Goal: one canonical action execution path through `engine.step`.
- Files touched:
  - `src/hook/usegamestate.js`
  - `src/hook/useNarrative.js`
  - `src/components/GameUI.jsx`
  - `packages/game-core/src/engine/createSystemEngine.js` (only if interface adjustment needed)
- Changes:
  - Replace direct parse/validate/execute in narrative flow with `submitAction` from engine hook.
  - Preserve AI narrative generation while using `APPLY_ENGINE_RESULT` updates.
- Verify:
  - `npm test -- --runInBand`
  - Manual: execute text command, confirm state mutation + narrative + event log continuity.

### PR 2 - Character creation MVP completion
- Goal: tighten creation persistence/resume and parser command usability.
- Files touched:
  - `src/hook/useCharacterCreationReworked.js`
  - `src/components/GameUI.jsx`
  - `src/App.jsx`
  - `packages/game-core/src/core/InputParser.js`
- Changes:
  - Immediate checkpoint save on successful finalize.
  - Remove or properly wire `characterCreated/saveLoaded` startup logic.
  - Add parser intents for `use skill` / `escape` text flow.
- Verify:
  - Manual creation flow from fresh load -> finalize -> reload -> resume behavior.
  - Combat suggestion click for `escape` and `use skill` mutates state as expected.

### PR 3 - UI state/error/accessibility pass
- Goal: modal/dialog baseline and error visibility consistency.
- Files touched:
  - `src/components/SaveLoadUI.jsx`
  - `src/components/ShopUI.jsx`
  - `src/components/GachaUI.jsx`
  - `src/components/TitleUI.jsx`
  - `src/components/ProfessionUI.jsx`
  - `src/components/StatusOverlay.jsx`
  - (optional shared utility) `src/components/common/ModalShell.jsx`
- Changes:
  - Add dialog roles/aria metadata, Escape handling, focus trap, and close button semantics.
  - Ensure async errors are announced consistently.
- Verify:
  - Keyboard-only modal interaction test.
  - Screen reader basic pass on modal open/close.

### PR 4 - Refactors/cleanup
- Goal: reduce drift and dead surface.
- Files touched:
  - `src/components/CharacterGenesisUI_Enhanced.jsx` (remove or gate)
  - `src/components/SystemLog.jsx` (remove or wire)
  - `packages/game-core/src/systems/archetype/archetypeSchema.js` (wire/remove)
  - `functions/package.json` + `functions/tsconfig.json` + type/dependency adjustments
- Changes:
  - Remove or wire orphan components/modules.
  - Add backend scripts (`build`, `typecheck`, `lint` where appropriate).
  - Resolve functions TS compile errors.
- Verify:
  - `npm --prefix functions run build`
  - `npm --prefix functions exec tsc --noEmit`
  - Repo-wide lint/test smoke.

## Needs Verification Queue
- [ ] Needs verification: confirm whether `/api/agents*` is intentionally external-only.
- [ ] Needs verification: confirm whether `archetypeSchema.js` is consumed by out-of-band tooling.
- [ ] Needs verification: compare state/event parity between text command path and combat button path for equivalent actions.
