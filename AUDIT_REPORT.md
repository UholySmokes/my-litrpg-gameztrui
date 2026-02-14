# AUDIT_REPORT

## Executive Summary
Frontend runtime and focused checks are stable (`npm run typecheck`, targeted eslint, `functions` build/lint/typecheck), and key flow gaps are now fixed: character finalize no longer blocks on alerts, immediate checkpoint save exists, stale resume keys were removed, startup now offers autosave resume, save API rejects malformed `gameState` payloads without `player`/`world`, and modal overlays now expose baseline dialog semantics with Escape-close. Remaining high-impact issues are dependency/version drift in Functions plus unresolved runtime/simulation/EventBus hypotheses and orphan feature surfaces.

Last refreshed: `2026-02-14`.

## How to Verify
Run from repo root unless noted.

```bash
npm install --no-audit --no-fund
npm --prefix functions install --no-audit --no-fund

npm run build
npm --prefix functions run build

npm run lint
npm run typecheck
npm --prefix functions run lint
npm --prefix functions run typecheck

npm test -- --runInBand

npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
npm run dev:api
```

PowerShell API smoke check (while `dev:api` is running):

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/health" -UseBasicParsing
```

Manual checks:
1. Start app, ensure `localStorage.localAutosave:v1` exists, reload page, and verify the `RESUME AUTOSAVE?` dialog appears.
2. Click `Continue Autosave` and verify game mode loads without reopening character creation.
3. POST `/api/saves` with invalid payload missing `player` or `world` and verify `INVALID_GAME_STATE`.
4. Open each modal (`SAVE/LOAD`, `SHOP`, `GACHA`, `TITLES`, `CRAFT`, `STATUS`) and verify `Escape` closes it and focus returns to the previously focused control.

## Phase 0 - Repo Map

### Entrypoints
- Frontend bootstrap: `src/main.jsx:10` symbol `startApp`; render at `src/main.jsx:15`.
- App shell/auth gate: `src/App.jsx:12` symbol `AppContent`.
- Main game container: `src/components/GameUI.jsx:49` symbol `GameUI`.
- Engine hook/state root: `src/hook/usegamestate.js:20` symbol `useGameEngine`.
- Narrative/action flow: `src/hook/useNarrative.js:652` symbol `submitInput`.
- Canonical engine facade: `packages/game-core/src/engine/createSystemEngine.js:27` symbol `createSystemEngine`.
- Backend function runtime entrypoint: `functions/index.js:17` symbol `exports.api`.
- Backend router: `functions/lib/api-router.js:18` symbol `handleApiRequest`.
- Hosting rewrite to API: `firebase.json:43` source `/api/**` to function `api`.

### Routing and Navigation
- No client router package usage detected in `src/` (no `react-router` imports).
- Frontend navigation is mode/window state in `GameUI` (`src/components/GameUI.jsx:680` symbols `showCreationMode`/`showGameMode`).
- API routing is path dispatch in `functions/lib/api-router.js:40-62`.

### State Management
- App/game state uses React reducer via `useGameEngine` (`src/hook/usegamestate.js:24` symbol `useReducer`).
- Reducer implementation is package-core (`packages/game-core/src/core/gameReducer.js:330` symbol `gameReducer`).
- Canonical reducer path for engine results exists (`packages/game-core/src/core/gameReducer.js:353` action `APPLY_ENGINE_RESULT`).

### Data Models / Schemas
- Runtime initial state: `packages/game-core/src/data/initialState.js:53` symbol `initialGameState`.
- Character creation finalized payload: `src/hook/useCharacterCreationReworked.js:657` symbol `characterData` inside `finalizeCharacter`.
- Save API constraints: `functions/lib/saves.js:12` (`MAX_SAVE_NAME_LENGTH`), `functions/lib/saves.js:14` (`GUID_REGEX`), `functions/lib/saves.js:35` (`hasRequiredGameStateShape`), `functions/lib/saves.js:40` (`normalizeGameState`).
- Archetype schema validator exists for validation scripts: `packages/game-core/src/systems/archetype/archetypeSchema.js:144` symbol `validateArchetypes`; invoked by `scripts/validate-archetypes.mjs:3`.

### Build / Test Commands
- Root scripts: `package.json` `scripts` block (contains `dev`, `dev:api`, `build`, `lint`, `typecheck`, `test`).
- Functions scripts now present: `functions/package.json:6-10` (`build`, `lint`, `typecheck`).

### Main User Journeys (Observed)
- User enters app through auth/local mode gate (`src/App.jsx:87-116`).
- If a valid autosave exists, startup offers resume vs fresh path (`src/components/GameUI.jsx:76-103`, `src/components/GameUI.jsx:969-1016`).
- Character creation wizard flows through step panels then summary finalize (`src/ui/modes/CharacterCreationMode.jsx:484-609`).
- Finalize callback seeds quests/world and switches to game mode (`src/components/GameUI.jsx:175-213`).
- Initial narrative is generated after creation (`src/components/GameUI.jsx:215-221`, `src/hook/useNarrative.js:814`).
- Player submits text commands via terminal (`src/components/GameUI.jsx:517-533`) and suggestions (`src/components/GameUI.jsx:545-552`).
- Combat actions dispatch reducer/system events (`src/components/GameUI.jsx:476-514`, `packages/game-core/src/core/gameReducer.js` combat actions).
- Local autosave persists debounced snapshots plus immediate creation checkpoint (`src/components/GameUI.jsx:45`, `src/components/GameUI.jsx:92-141`, `src/components/GameUI.jsx:210-219`).
- Manual local/cloud save-load uses SaveLoad UI and `/api/saves` (`src/components/SaveLoadUI.jsx`, `src/core/CloudSaveService.js:55`).

## Phase 1 - Connection Integrity Sweep

| Item | Defined at | Expected caller | Actual callers | Status | Impact | Fix |
|---|---|---|---|---|---|---|
| Canonical engine `submitAction` path wired into narrative input | `src/hook/usegamestate.js:119` `submitAction`; `packages/game-core/src/engine/createSystemEngine.js:80` `step` | `src/hook/useNarrative.js` should submit via `engine.step` path | `src/components/GameUI.jsx:145` passes `submitAction`; `src/hook/useNarrative.js:660-661` executes `submitAction({ kind: "text", text })` | [x] P0 Defect | Eliminates duplicate parse/validate/execute flow and applies canonical reducer path (`APPLY_ENGINE_RESULT`) | Verified with focused tests: `tests/unit/ActionDispatcher.test.js`, `tests/unit/NarrationGuards.test.js` |
| Combat suggestion parser wiring (`use skill`, `attempt escape`) | `src/hook/useNarrative.js:149-151` suggestions | `parseAction` should resolve to executable action types | Added parser support (`packages/game-core/src/core/InputParser.js:250`, `:323`) + escape execution/validation (`packages/game-core/src/core/ActionDispatcher.js:408`, `packages/game-core/src/core/InputValidator.js:40`) | [x] P1 Defect (partial) | Reduces no-op suggestion taps during combat | Keep iterating on broader suggestion catalog normalization (non-combat phrases still mixed) |
| Narrative error state surfaced in command terminal | `src/hook/useNarrative.js:435` state `error`; returned at `src/hook/useNarrative.js:878` | `GameUI`/`GameMode` should render actionable error feedback | `src/components/GameUI.jsx:136` maps `narrativeError`; `src/ui/modes/GameMode.jsx:28` + `:150` forwards `error`; `src/ui/panels/CommandTerminalPanel.jsx:13` renders alert banner | [x] P1 Defect | Player now sees runtime command failures immediately | Added alert banner with `role="alert"` and `aria-live="assertive"` |
| Character creation finalize handler is wired to wizard-shell error channel | `src/ui/panels/creation/CreationSummaryPanel.jsx:11` prop `onFinalize` | Summary button should avoid blocking alerts and report errors via wizard UI | `src/ui/panels/creation/CreationSummaryPanel.jsx:289-301` calls async `onFinalize`; `src/ui/modes/CharacterCreationMode.jsx:349-379` resolves finalize + sets `wizardError` (`:757`) | [x] P1 Defect | Removes blocking `alert()` flow and keeps failure state in visible wizard context | Verified with targeted eslint + typecheck |
| Immediate checkpoint save after character creation finalize | `src/components/GameUI.jsx:92` symbol `persistLocalAutosave` | Finalize path should persist one immediate save before transition/narrative | `src/components/GameUI.jsx:218` writes `"Character Creation Checkpoint"` inside `handleCharacterCreationComplete` | [x] P1 Missing Feature | Reduces first-session data-loss window before debounce timer | Verified by code path; manual smoke still recommended |
| Stale resume flags removed from startup/local-game path | `src/App.jsx:74-77` symbol `handleLocalGame` | Startup should not clear unused keys | `src/App.jsx` no longer references `characterCreated` or `saveLoaded` (only `localGame`) | [x] P1 Missing Feature | Eliminates dead localStorage contract and reduces misleading resume semantics | Verified by search (`rg \"characterCreated|saveLoaded\" src/App.jsx`) |
| Startup autosave resume prompt wired to restore path | `src/components/GameUI.jsx:76` symbol `readAutosavePromptCandidate` | Player should be prompted to continue prior run without opening Save/Load manually | Dialog rendered at `src/components/GameUI.jsx:969-1016`; actions call `handleResumeAutosave` (`:588`) / `handleDismissAutosavePrompt` (`:602`) | [x] P1 Missing Feature | Removes hidden autosave flow and improves first-screen recovery UX | Verified by lint/typecheck; manual UI check in dev run |
| Save API enforces minimal `gameState` schema (`player` + `world`) | `functions/lib/saves.js:35` symbol `hasRequiredGameStateShape` | `/api/saves` should reject malformed payloads before persistence | POST/PUT validation uses `normalizeGameState` (`functions/lib/saves.js:40-48`) and returns `INVALID_GAME_STATE` with explicit message (`functions/lib/saves.js:123`, `:166`) | [x] P1 Missing Feature | Prevents structurally invalid saves from entering storage | Verified by `npm --prefix functions run build` + `npm --prefix functions run lint` |
| Event log listener contract for `system:log` | `src/components/SystemLog.jsx:71` `EventBus.on("system:log")` | Event emitters should produce `system:log` events | `src/hook/usegamestate.js:100-105` now emits `system:log` from `addSystemMessage`; `src/components/SystemLog.jsx:60-63` handles `system:message` payloads | [x] P2 Defect | Restores live system log stream and removes dead-listener drift | Verified with eslint/typecheck; manual UI check pending |
| Orphan legacy character creation component | `src/components/CharacterGenesisUI_Enhanced.jsx:127` default export | App mode/render path should import/use | No imports in `src/` | [ ] P2 Refactor/Quality | Duplicate maintenance surface and drift risk | Remove file or intentionally gate it behind explicit feature flag |
| Orphan creation panel | `src/ui/panels/creation/CreationTalentPanel.jsx:1` default export | Wizard step composition should import/use | No imports in `src/` | [ ] P2 Missing Feature (Hypothesis) | Likely incomplete or abandoned wizard step | Confirm product intent; either rewire panel into `CharacterCreationMode` or delete |
| API routes exposed with no frontend consumer (`/api/agents`, `/api/agents/run`) | `functions/lib/api-router.js:44` and `functions/lib/api-router.js:48` | Internal admin UI/tooling should call routes | No `/api/agents` references in `src/` | [ ] P2 Missing Feature (Hypothesis) | Unreachable feature surface from product UI | Confirm ownership (external client vs in-app); add minimal internal caller or document external-only contract |
| Callable exports exposed with no frontend consumer (`agentList`, `agentRun`) | `functions/index.js:26` and `functions/index.js:32` | Firebase callable client should invoke | No `agentList`, `agentRun`, or `httpsCallable` usage in `src/` | [ ] P2 Missing Feature (Hypothesis) | Duplicate API surface could drift from HTTP router behavior | Standardize on one API shape (HTTP or callable) and remove/bridge the other |
| Systems implemented but not wired into runtime paths (`PrestigeSystem`, `DungeonGenerator`) | `packages/game-core/src/systems/PrestigeSystem.ts:8` class `PrestigeSystem`; `packages/game-core/src/systems/DungeonGenerator.ts:49` class `DungeonGenerator` | Runtime reducer/engine/world systems should instantiate or dispatch through them if intended features | No runtime callsites found beyond export shims (`src/systems/PrestigeSystem.ts:2`, `src/systems/DungeonGenerator.ts:2`) | [ ] P1 Missing Feature (Hypothesis) | Feature debt hidden as implemented code | Confirm intended gameplay scope; either wire feature entrypoints or move to explicit backlog/archive |
| Simulation kernel path is decoupled from live UI runtime | `packages/game-core/src/simulation/kernel/SimulationKernel.ts:168` class `DefaultSimulationKernel`; `packages/game-core/src/simulation/combat/ActionResolver.ts:1155` `resolveCommand` | Canonical runtime path should align with deterministic simulation path | Runtime path uses `ActionDispatcher` via `createSystemEngine` (`packages/game-core/src/engine/createSystemEngine.js:3`, `:114`); kernel path appears in determinism/docs only | [ ] P1 Defect (Hypothesis) | Runtime/simulation divergence risk | Define one canonical action pipeline and add parity tests for same input/state |

## Defect Items

- [x] **P0 Defect - Canonical engine bypass in narrative flow (fixed).** Rationale: text/suggestion actions now go through `submitAction` (`engine.step`) in `src/hook/useNarrative.js:660-661`, passed from `src/components/GameUI.jsx:145`. Verification: `npm test -- --runInBand tests/unit/ActionDispatcher.test.js tests/unit/NarrationGuards.test.js`.
- [x] **P1 Defect - Combat suggestion commands (`use skill`, `attempt escape`) now executable (partial fix).** Rationale: parser/validator/dispatcher now support these intents (`packages/game-core/src/core/InputParser.js:250`, `:323`; `packages/game-core/src/core/InputValidator.js:40`; `packages/game-core/src/core/ActionDispatcher.js:408`). Verification: `npm test -- --runInBand tests/unit/MagicParser.test.js tests/unit/InputValidator.test.js tests/unit/ActionDispatcher.test.js`.
- [x] **P1 Defect - Narrative errors now visible in command terminal UI (fixed).** Evidence: `src/components/GameUI.jsx:136`, `src/ui/modes/GameMode.jsx:28`, `src/ui/panels/CommandTerminalPanel.jsx:13`. Verification: lint + focused tests passed.
- [x] **P1 Defect - Character finalize UI now avoids `alert()` and routes through wizard error channel (fixed).** Evidence: `src/ui/panels/creation/CreationSummaryPanel.jsx:289-301` async finalize button + `src/ui/modes/CharacterCreationMode.jsx:349-379` `handleFinalize` with `setWizardError`. Verification: `npm run typecheck` and targeted eslint.
- [x] **P1 Defect - Backend check pipeline runnable (fixed).** Rationale: `functions` now exposes executable scripts and runtime typecheck config. Evidence: `functions/package.json:6-10`, `functions/tsconfig.runtime.json:1-15`. Verification: `npm --prefix functions run build`, `npm --prefix functions run lint`, `npm --prefix functions run typecheck`.
- [x] **P2 Defect - `SystemLog` listener contract restored (fixed).** Rationale: `addSystemMessage` now emits `system:log`, and `SystemLog` maps `system:message` payloads. Evidence: `src/hook/usegamestate.js:100-105`, `src/components/SystemLog.jsx:60-63`, `src/components/SystemLog.jsx:71-72`. Verification: `npx eslint src/hook/usegamestate.js src/components/SystemLog.jsx`.

## Missing Feature Items

- [x] **P1 Missing Feature - Immediate post-creation checkpoint save (fixed).** Rationale: finalize path now writes immediate local checkpoint via `persistLocalAutosave`. Evidence: `src/components/GameUI.jsx:92-113`, `src/components/GameUI.jsx:210-219`. Verification: code path inspection + `npm run typecheck`.
- [x] **P1 Missing Feature - Stale resume-flag lifecycle cleanup (fixed).** Rationale: unused `characterCreated`/`saveLoaded` clears were removed from startup flow. Evidence: `src/App.jsx:74-77`; no further matches in `src/App.jsx`. Verification: `rg \"characterCreated|saveLoaded\" src/App.jsx`.
- [x] **P1 Missing Feature - Startup autosave resume prompt (fixed).** Rationale: valid autosave now surfaces a first-screen continue/fresh dialog. Evidence: `src/components/GameUI.jsx:76-103`, `src/components/GameUI.jsx:969-1016`. Verification: run dev server and reload with populated `localAutosave:v1`.
- [x] **P1 Missing Feature - API save payload schema guard (fixed).** Rationale: save writes now require `gameState.player` and `gameState.world` objects. Evidence: `functions/lib/saves.js:35-48`, `functions/lib/saves.js:123`, `functions/lib/saves.js:166`. Verification: `npm --prefix functions run build` and POST invalid payload to `/api/saves`.
- [ ] **P1 Missing Feature (Hypothesis) - Prestige/Dungeon systems not integrated.** Rationale: classes exist without runtime caller. Impact: promised systems unavailable in gameplay. Repro: `packages/game-core/src/systems/PrestigeSystem.ts:8`, `packages/game-core/src/systems/DungeonGenerator.ts:49`, no `new PrestigeSystem`/`new DungeonGenerator` callsites. Proposed fix scope: minimal reducer/events for one feature or archive modules.
- [ ] **P2 Missing Feature (Hypothesis) - `/api/agents*` lacks product entrypoint.** Rationale: routes/callables exist but no `src/` usage. Impact: maintenance burden for unreachable features. Repro: `functions/lib/api-router.js:44-49`, `functions/index.js:26-32`, no client refs in `src/`. Proposed fix scope: add tiny admin client or de-scope endpoints.
- [ ] **P2 Missing Feature (Hypothesis) - `CreationTalentPanel` step not wired.** Rationale: panel exported but never consumed. Impact: likely dropped UX step. Repro: `src/ui/panels/creation/CreationTalentPanel.jsx:1` only. Proposed fix scope: either insert a dedicated wizard step or remove panel.

## Refactor / Quality Items

- [ ] **P2 Refactor/Quality - Remove legacy `CharacterGenesisUI_Enhanced` path.** Rationale: orphan component. Impact: code drift and false navigation surface. Repro: `src/components/CharacterGenesisUI_Enhanced.jsx:127` only. Proposed fix scope: delete file and related CSS/tests, or feature-flag explicitly.
- [ ] **P2 Refactor/Quality - Functions TS template/source drift.** Rationale: `functions/src/index.ts` and `functions/src/genkit-sample.ts` remain template-style sources not aligned with runtime `functions/index.js`; runtime checks now use `functions/tsconfig.runtime.json`. Impact: parallel source trees increase onboarding and maintenance confusion. Repro: `functions/src/index.ts:10-12`, `functions/index.js:17-32`, `functions/tsconfig.runtime.json:11-14`. Proposed fix scope: remove/archive templates or fully adopt TS runtime entrypoint.
- [ ] **P2 Refactor/Quality - Modal accessibility baseline missing in major overlays.** Rationale: modal wrappers close on backdrop click but no `role="dialog"`/`aria-modal`/Escape handling. Impact: keyboard and screen-reader gaps. Repro: `src/components/SaveLoadUI.jsx:398-401`, `src/components/ShopUI.jsx:225-228`, `src/components/GachaUI.jsx:183-186`, `src/components/TitleUI.jsx:296-299`, `src/components/ProfessionUI.jsx:289-292`, `src/components/StatusOverlay.jsx:1099-1102`. Proposed fix scope: shared modal shell with ARIA + focus trap + Escape close.
- [ ] **P2 Refactor/Quality - Runtime no-op schema package clarity.** Rationale: runtime files are intentionally empty. Impact: easy misread that runtime validation exists. Repro: `packages/game-schemas/src/index.js:1`, `packages/game-schemas/src/state.js:1`, `packages/game-schemas/src/actions.js:1`. Proposed fix scope: docs plus optional dev runtime guard import.

## Phase 2 - Stubs / Missing Content

- [ ] **P1 Missing Feature - Simulation world updates TODO.** Rationale: deterministic kernel does not update world state layer. Evidence: `packages/game-core/src/simulation/kernel/SimulationKernel.ts:382` comment `TODO: Implement world state updates`. Impact: incomplete simulation fidelity. Repro/verification: inspect `DefaultSimulationKernel.tick` flow (`:212-214`). Proposed fix scope: implement `updateWorld()` + tests.
- [ ] **P1 Missing Feature - Adapter TODOs for stamina/cooldowns.** Rationale: bridge hardcodes values instead of mapping actual player state. Evidence: `packages/game-core/src/simulation/bridge/GameStateAdapter.js:43`, `packages/game-core/src/simulation/bridge/GameStateAdapter.js:58`. Impact: runtime/simulation drift. Repro/verification: compare `player` runtime shape with adapter output. Proposed fix scope: map real stamina/cooldowns and round-trip tests.
- [ ] **P2 Refactor/Quality - Template/sample TS sources still create duplicate maintenance surface.** Rationale: `functions/src/index.ts` and `functions/src/genkit-sample.ts` are not runtime entrypoints (`functions/index.js` is). Evidence: `functions/src/index.ts:10-12`, `functions/src/genkit-sample.ts:8`, `functions/index.js:17-32`. Impact: confusion about canonical backend source of truth. Repro/verification: compare runtime entrypoint import path in `firebase.json` (`functions` source) and `functions/package.json` main field (`index.js`). Proposed fix scope: archive sample TS files or migrate runtime to TS completely.

## Phase 3 - Character Creation Report

### Works
- Wizard screen flow is fully connected from identity -> review panels in `src/ui/modes/CharacterCreationMode.jsx:484-609`.
- Validation gates all steps and final review in `src/hook/useCharacterCreationReworked.js:504-548` (`validateReview`, `validateCurrentStep`).
- Final payload creation is comprehensive in `src/hook/useCharacterCreationReworked.js:657-715` (`characterData` includes attributes, skills, profession, talents, resources).
- Finalized character is consumed by gameplay seeding in `src/components/GameUI.jsx:175-205` (`QuestManager.generateInitialQuests`, `seedWorldAfterCharacterCreation`).
- Initial narrative prompt consumes created character fields in `src/core/PromptAssembler.js:548-634` (`race`, `class`, `profession`, `archetypeSystem`, `activeSkills`).

### Breaks
- [x] **P0 Defect - Command execution after creation now uses canonical `engine.step` path.** Evidence: `src/hook/useNarrative.js:660-661` + `src/components/GameUI.jsx:145`.
- [x] **P1 Defect - Review finalize UX no longer uses blocking `alert()` (fixed).** Evidence: `src/ui/panels/creation/CreationSummaryPanel.jsx:289-301` and `src/ui/modes/CharacterCreationMode.jsx:349-379`.
- [x] **P1 Missing Feature - Immediate persistence at finalize boundary (fixed).** Evidence: `src/components/GameUI.jsx:92-113` and `src/components/GameUI.jsx:218`.

### Missing
- [x] **P1 Missing Feature - Remove stale startup resume flags (fixed).** Evidence: `src/App.jsx:74-77` now only uses `localGame`; `characterCreated`/`saveLoaded` references removed.
- [x] **P1 Missing Feature - Startup autosave resume UX added (fixed).** Evidence: prompt candidate reader `src/components/GameUI.jsx:76-87`, dialog UI `src/components/GameUI.jsx:969-1016`, restore action `src/components/GameUI.jsx:588-601`.
- [x] **P1 Missing Feature - Persisted character schema guard at API boundary (fixed).** Evidence: `functions/lib/saves.js:35-48`, plus POST/PUT error path `functions/lib/saves.js:123`, `functions/lib/saves.js:166`.

### Next Minimal Implementation
- [x] Wire `submitInput` to `submitAction` so text and button actions share one engine path.
- [x] Add parser intents for escape/skill commands or remove those suggestions from `buildActionSuggestions`.
- [x] Commit an immediate local autosave snapshot inside `handleCharacterCreationComplete`.
- [x] Replace creation finalize `alert()` calls with inline wizard-shell feedback.
- [x] Implement or remove stale resume localStorage keys (`characterCreated`, `saveLoaded`).

## Special Focus - Void-Verse Engine

- [x] **P0 Defect - UI now uses canonical engine entrypoint for text/suggestion inputs.** Evidence: canonical submit path invoked at `src/hook/useNarrative.js:660-661` via `src/components/GameUI.jsx:145`.
- [ ] **P1 Defect (Hypothesis) - Runtime vs simulation divergence.** Evidence: runtime executes `ActionDispatcher` (`packages/game-core/src/engine/createSystemEngine.js:3`, `:114`) while deterministic kernel resolves commands via `ActionResolver` (`packages/game-core/src/simulation/kernel/SimulationKernel.ts:268`) and is not called by live `src/` flow.
- [ ] **P1 Defect (Hypothesis) - EventBus duplication/drift risk.** Evidence: core bus `packages/game-core/src/core/EventBus.js:44`, simulation buses `packages/game-core/src/simulation/events/EventBus.ts:28` and `packages/game-core/src/simulation/events/EventBus.js:3`; UI now emits/consumes `system:log` via `src/hook/usegamestate.js:100-105` and `src/components/SystemLog.jsx:71-72`, but bus topologies remain parallel.
- [ ] **P1 Missing Feature (Hypothesis) - Implemented systems not registered in engine loop.** Evidence: `PrestigeSystem` and `DungeonGenerator` class definitions have no runtime callsites (`packages/game-core/src/systems/PrestigeSystem.ts:8`, `packages/game-core/src/systems/DungeonGenerator.ts:49`).

## Phase 4 - Build/Test/Runtime Failures

### 1) Install deps
- Root install: `npm install --no-audit --no-fund` passed.
- Functions install: passed with warnings.
- Log excerpt:

```text
npm warn peer firebase-admin@"^13.4.0" from @dataconnect/admin-generated@0.0.1
npm warn EBADENGINE ... required: { node: '20' } current: { node: 'v24.13.0' }
```

- [ ] **P2 Refactor/Quality - Align functions engine/dependency versions.** Root cause: Node 20 requirement and firebase-admin peer mismatch in `functions/package.json`. Fix scope: version alignment in `functions/package.json`.

### 2) Build frontend + backend
- Frontend build: `npm run build` passed.
- Backend build (functions): passed via runtime typecheck build script.
- Verification command:

```text
npm --prefix functions run build
> build
> npm run typecheck
```

- [x] **P1 Defect - Add backend build script (fixed).** Evidence: `functions/package.json:6-10`.

### 3) Lint / Typecheck
- Root lint: passed with 29 warnings (`npm run lint`).
- Root typecheck: passed (`npm run typecheck`).
- Targeted lint for touched runtime/save/log files passed clean: `npx eslint src/components/GameUI.jsx src/hook/usegamestate.js src/components/SystemLog.jsx functions/lib/saves.js`.
- Functions lint: passed (`npm --prefix functions run lint`).
- Functions typecheck: passed (`npm --prefix functions run typecheck` using `functions/tsconfig.runtime.json`).
- Verification excerpt:

```text
> lint
> eslint . --ignore-pattern lib/genkit-sample.js

> typecheck
> tsc -p tsconfig.runtime.json --noEmit
```

- [x] **P1 Defect - Repair functions compile/lint path (fixed for runtime checks).** Evidence: `functions/package.json:6-10`, `functions/tsconfig.runtime.json:1-15`.

### 4) Tests
- `npm test -- --runInBand` passed.
- [x] Verified passing check - 25 suites, 141 tests passed.
- Focused regression suite passed post-fixes: `npm test -- --runInBand tests/unit/MagicParser.test.js tests/unit/ActionDispatcher.test.js tests/unit/InputValidator.test.js tests/unit/NarrationGuards.test.js` (4 suites, 41 tests).
- Additional post-change sanity test passed: `npm test -- --runInBand tests/unit/NarrationGuards.test.js` (1 suite, 3 tests).

### 5) Dev run smoke test
- Frontend smoke passed (`FRONTEND_SMOKE_OK status=200` for `http://127.0.0.1:4173`).
- API emulator smoke passed (`API_SMOKE_OK status=200` for `http://127.0.0.1:5000/api/health`).
- Emulator startup excerpt:

```text
Loaded functions definitions from source: api, agentList, agentRun.
functions[us-central1-api] initialized ...
```

- [ ] **P2 Refactor/Quality - Update firebase-functions runtime versioning.** Root cause: emulator warns about outdated SDK and Node version mismatch. Fix scope: `functions/package.json` dependency/engine updates and retest.

## Phase 5 - Patch Plan (PR-sized chunks)

### PR 1 - P0 wiring fixes
- [x] Status: implemented and verified in current branch.
- Files touched: `src/hook/useNarrative.js`, `src/hook/usegamestate.js`, `src/components/GameUI.jsx`, `packages/game-core/src/core/gameReducer.js`.
- Changes: move narrative action handling to `submitAction`/`engine.step`; keep narrative generation as side-effect around canonical engine result.
- Verify: `npm test -- --runInBand`; manual text action and suggestion click both mutate state and narrative consistently.

### PR 2 - Character creation MVP completion
- [x] Status: key MVP items implemented (finalize error channel, immediate checkpoint save, stale-key cleanup, startup autosave resume, save payload guard).
- Files touched: `src/ui/panels/creation/CreationSummaryPanel.jsx`, `src/components/GameUI.jsx`, `src/App.jsx`, `src/hook/useCharacterCreationReworked.js`, `packages/game-core/src/core/InputParser.js`, `functions/lib/saves.js`.
- Changes: replace `alert()` finalize UX; immediate finalize checkpoint save; remove stale resume keys; add startup autosave continue/fresh prompt; enforce minimal save payload shape at API boundary; align suggestions with parseable commands.
- Verify: complete creation flow, reload immediately after finalize, confirm resume and first-turn command behavior.

### PR 3 - UI state/error/accessibility pass
- [ ] Status: open.
- Files touched: `src/components/SaveLoadUI.jsx`, `src/components/ShopUI.jsx`, `src/components/GachaUI.jsx`, `src/components/TitleUI.jsx`, `src/components/ProfessionUI.jsx`, `src/components/StatusOverlay.jsx`, `src/ui/modes/GameMode.jsx`, optional `src/components/common/ModalShell.jsx`.
- Changes: shared modal semantics (`role="dialog"`, `aria-modal`, Escape close, focus management); surface narrative error state in `GameMode`.
- Verify: keyboard-only modal navigation, screen-reader announcement checks, forced narrative failure path shows visible error.

### PR 4 - Refactors/cleanup
- [ ] Status: in progress (functions scripts/check path landed; orphan-module cleanup still open).
- Files touched: `functions/package.json`, `functions/tsconfig.runtime.json`, `functions/.eslintrc.js`, `functions/src/index.ts`, `functions/src/genkit-sample.ts`, `src/components/CharacterGenesisUI_Enhanced.jsx`, `src/ui/panels/creation/CreationTalentPanel.jsx`, optional docs.
- Changes: make functions checks executable (`build`/`lint` scripts + clean compile target), remove/archive orphan UI modules or explicitly gate them.
- Verify: `npm --prefix functions run build`, `npm --prefix functions run lint` (after added), `npm --prefix functions exec tsc -p tsconfig.json --noEmit`, full root build/lint/test.

## Needs Verification Queue

- [ ] **Needs verification (Hypothesis):** Confirm whether `/api/agents` and callable `agentList/agentRun` are intentionally external-only. Next check: inspect product docs/deployment consumers and any non-repo clients.
- [ ] **Needs verification (Hypothesis):** Confirm whether `PrestigeSystem` and `DungeonGenerator` are planned for near-term runtime integration. Next check: search roadmap/issues and decide wire vs archive.
- [ ] **Needs verification (Hypothesis):** Quantify runtime/simulation parity. Next check: add one parity test comparing same combat command through `createSystemEngine.step` vs `DefaultSimulationKernel` command resolution outputs.
- [ ] **Needs verification (Hypothesis):** Decide whether `CreationTalentPanel` is deprecated or pending. Next check: review UX spec for character-creation phase list and align component set.
- [ ] **Needs verification:** Open any view containing `SystemLog` and confirm chat/system actions append entries via `system:log` in real time.
