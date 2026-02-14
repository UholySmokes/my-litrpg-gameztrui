# AUDIT_REPORT

## Executive Summary
Frontend runtime and tests are stable (`npm run build`, `npm test -- --runInBand` pass), but the repository has multiple fix-ready wiring and completeness gaps: the UI command path bypasses the canonical `SystemEngine.step()` pipeline, some defined systems/components/routes are unreachable from product flow, backend Functions checks are incomplete (`functions/package.json` has no `build`/`lint` scripts and `tsc` fails), and character-creation persistence/accessibility still has gaps (stale resume keys, delayed autosave-only checkpoint, modal semantics/error annunciation). Priority should be P0 engine-wiring unification, then backend checkability and character-creation MVP completion.

## How to Verify
Run from repo root unless noted.

```bash
npm install --no-audit --no-fund
npm --prefix functions install --no-audit --no-fund

npm run build
npm --prefix functions run build

npm run lint
npm run typecheck
npm --prefix functions exec tsc -p tsconfig.json --noEmit

npm test -- --runInBand

npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
npm run dev:api
```

PowerShell API smoke check (while `dev:api` is running):

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/health" -UseBasicParsing
```

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
- Save API constraints: `functions/lib/saves.js:12` (`MAX_SAVE_NAME_LENGTH`), `functions/lib/saves.js:14` (`GUID_REGEX`), `functions/lib/saves.js:31` (`normalizeGameState`).
- Archetype schema validator exists for validation scripts: `packages/game-core/src/systems/archetype/archetypeSchema.js:144` symbol `validateArchetypes`; invoked by `scripts/validate-archetypes.mjs:3`.

### Build / Test Commands
- Root scripts: `package.json` `scripts` block (contains `dev`, `dev:api`, `build`, `lint`, `typecheck`, `test`).
- Functions package currently has no `scripts` block: `functions/package.json:1-18`.

### Main User Journeys (Observed)
- User enters app through auth/local mode gate (`src/App.jsx:87-116`).
- Character creation wizard flows through step panels then summary finalize (`src/ui/modes/CharacterCreationMode.jsx:484-609`).
- Finalize callback seeds quests/world and switches to game mode (`src/components/GameUI.jsx:175-213`).
- Initial narrative is generated after creation (`src/components/GameUI.jsx:215-221`, `src/hook/useNarrative.js:814`).
- Player submits text commands via terminal (`src/components/GameUI.jsx:517-533`) and suggestions (`src/components/GameUI.jsx:545-552`).
- Combat actions dispatch reducer/system events (`src/components/GameUI.jsx:476-514`, `packages/game-core/src/core/gameReducer.js` combat actions).
- Local autosave persists debounced snapshots (`src/components/GameUI.jsx:45`, `src/components/GameUI.jsx:106-123`).
- Manual local/cloud save-load uses SaveLoad UI and `/api/saves` (`src/components/SaveLoadUI.jsx`, `src/core/CloudSaveService.js:55`).

## Phase 1 - Connection Integrity Sweep

| Item | Defined at | Expected caller | Actual callers | Status | Impact | Fix |
|---|---|---|---|---|---|---|
| Canonical engine `submitAction` path is unused by narrative input | `src/hook/usegamestate.js:119` `submitAction`; `packages/game-core/src/engine/createSystemEngine.js:80` `step` | `src/hook/useNarrative.js:652` `submitInput` should use single engine-step path | `submitAction` appears only in `src/hook/usegamestate.js:119` and return object (`src/hook/usegamestate.js:141`) | [ ] P0 Defect | Divergent action semantics and skipped `SystemEventObserver.evaluateToEvents` path | Route text/suggestion input to `submitAction({ kind: "text", text })`; reduce duplicate parse/validate/execute logic |
| Suggestion labels include unsupported parser intents | `src/hook/useNarrative.js:153` `"use skill"` and `src/hook/useNarrative.js:155` `"attempt escape"` | `packages/game-core/src/core/InputParser.js:12` `parseAction` should map suggestion text to concrete action | Suggestion click forwards raw label (`src/ui/panels/ActionSuggestionsPanel.jsx:28`, `src/components/GameUI.jsx:545-549`); parser has no `parseSkill`/`parseEscape` branch (`packages/game-core/src/core/InputParser.js:30-57`) | [ ] P1 Defect | User-visible no-op/soft-fail commands | Add parser intents + dispatcher support or remove unsupported labels from suggestion builder |
| Narrative error state is produced but not surfaced in game UI | `src/hook/useNarrative.js:441` state `error`; returned at `src/hook/useNarrative.js:928` | `GameUI`/`GameMode` should render error feedback | `GameUI` destructures no `error` from hook (`src/components/GameUI.jsx:133-141`); `GameMode` props have no `error` (`src/ui/modes/GameMode.jsx:19-81`) | [ ] P1 Defect | Hidden runtime failures; user loses actionable feedback | Thread `error` prop into `GameMode` and add visible, accessible error banner |
| Event log listener contract is broken (`system:log`) | `src/components/SystemLog.jsx:67` `EventBus.on("system:log")` | Event emitters should produce `system:log` events | No `emit("system:log", ...)` found; only listener site in `SystemLog.jsx` | [ ] P2 Defect | Dead event-log UI path and misleading observability surface | Either emit `system:log` events from reducer/systems or remove/deprecate `SystemLog` |
| Orphan legacy character creation component | `src/components/CharacterGenesisUI_Enhanced.jsx:127` default export | App mode/render path should import/use | No imports in `src/` | [ ] P2 Refactor/Quality | Duplicate maintenance surface and drift risk | Remove file or intentionally gate it behind explicit feature flag |
| Orphan creation panel | `src/ui/panels/creation/CreationTalentPanel.jsx:1` default export | Wizard step composition should import/use | No imports in `src/` | [ ] P2 Missing Feature (Hypothesis) | Likely incomplete or abandoned wizard step | Confirm product intent; either rewire panel into `CharacterCreationMode` or delete |
| API routes exposed with no frontend consumer (`/api/agents`, `/api/agents/run`) | `functions/lib/api-router.js:44` and `functions/lib/api-router.js:48` | Internal admin UI/tooling should call routes | No `/api/agents` references in `src/` | [ ] P2 Missing Feature (Hypothesis) | Unreachable feature surface from product UI | Confirm ownership (external client vs in-app); add minimal internal caller or document external-only contract |
| Callable exports exposed with no frontend consumer (`agentList`, `agentRun`) | `functions/index.js:26` and `functions/index.js:32` | Firebase callable client should invoke | No `agentList`, `agentRun`, or `httpsCallable` usage in `src/` | [ ] P2 Missing Feature (Hypothesis) | Duplicate API surface could drift from HTTP router behavior | Standardize on one API shape (HTTP or callable) and remove/bridge the other |
| Systems implemented but not wired into runtime paths (`PrestigeSystem`, `DungeonGenerator`) | `packages/game-core/src/systems/PrestigeSystem.ts:8` class `PrestigeSystem`; `packages/game-core/src/systems/DungeonGenerator.ts:49` class `DungeonGenerator` | Runtime reducer/engine/world systems should instantiate or dispatch through them if intended features | No runtime callsites found beyond export shims (`src/systems/PrestigeSystem.ts:2`, `src/systems/DungeonGenerator.ts:2`) | [ ] P1 Missing Feature (Hypothesis) | Feature debt hidden as implemented code | Confirm intended gameplay scope; either wire feature entrypoints or move to explicit backlog/archive |
| Simulation kernel path is decoupled from live UI runtime | `packages/game-core/src/simulation/kernel/SimulationKernel.ts:168` class `DefaultSimulationKernel`; `packages/game-core/src/simulation/combat/ActionResolver.ts:1155` `resolveCommand` | Canonical runtime path should align with deterministic simulation path | Runtime path uses `ActionDispatcher` via `createSystemEngine` (`packages/game-core/src/engine/createSystemEngine.js:3`, `:114`); kernel path appears in determinism/docs only | [ ] P1 Defect (Hypothesis) | Runtime/simulation divergence risk | Define one canonical action pipeline and add parity tests for same input/state |

## Defect Items

- [ ] **P0 Defect - Canonical engine bypass in narrative flow.** Rationale: two execution paths (`engine.step` vs direct parse/validate/execute). Impact: inconsistent events/tick semantics. Repro: compare `src/hook/usegamestate.js:119-124` with `src/hook/useNarrative.js:667-747`. Proposed fix scope: `src/hook/useNarrative.js`, `src/hook/usegamestate.js`, `packages/game-core/src/core/gameReducer.js`.
- [ ] **P1 Defect - Unsupported suggestion commands.** Rationale: UI emits text that parser does not map. Impact: degraded UX and silent no-op behavior. Repro: inspect suggestion literals at `src/hook/useNarrative.js:153-155` versus parser branches in `packages/game-core/src/core/InputParser.js:30-57`. Proposed fix scope: parser intents and/or suggestion dictionary.
- [ ] **P1 Defect - Narrative errors not visible in GameMode.** Rationale: hook exposes `error` but view drops it. Impact: failures become opaque. Repro: `src/hook/useNarrative.js:928` vs `src/components/GameUI.jsx:133-141` and `src/ui/modes/GameMode.jsx:19-81`. Proposed fix scope: pass-through prop + UI alert block.
- [ ] **P1 Defect - Backend check pipeline incomplete.** Rationale: missing `build`/`lint` scripts and failing `tsc` in functions package. Impact: backend regressions can ship undetected. Repro: Phase 4 logs and `functions/package.json:1-18`. Proposed fix scope: `functions/package.json`, `functions/tsconfig.json`, dependency/type alignment.
- [ ] **P2 Defect - `SystemLog` listener has no emitter contract.** Rationale: event channel is never produced. Impact: dead logging behavior. Repro: `src/components/SystemLog.jsx:67` and no `emit("system:log")` in repo. Proposed fix scope: remove or wire event channel.

## Missing Feature Items

- [ ] **P1 Missing Feature - Immediate post-creation checkpoint save.** Rationale: only debounced autosave (`AUTOSAVE_DEBOUNCE_MS=2000`) exists after character finalize. Impact: data loss window on abrupt close. Repro: `src/components/GameUI.jsx:45`, `src/components/GameUI.jsx:106-123`, finalize path at `src/components/GameUI.jsx:175-205`. Proposed fix scope: synchronous local checkpoint write in finalize callback.
- [ ] **P1 Missing Feature - Resume flags lifecycle is incomplete.** Rationale: keys are cleared but never consumed. Impact: confusing/unimplemented resume semantics. Repro: `src/App.jsx:76-77` and no other `characterCreated`/`saveLoaded` localStorage usage. Proposed fix scope: implement read/write resume flow or remove keys.
- [ ] **P1 Missing Feature (Hypothesis) - Prestige/Dungeon systems not integrated.** Rationale: classes exist without runtime caller. Impact: promised systems unavailable in gameplay. Repro: `packages/game-core/src/systems/PrestigeSystem.ts:8`, `packages/game-core/src/systems/DungeonGenerator.ts:49`, no `new PrestigeSystem`/`new DungeonGenerator` callsites. Proposed fix scope: minimal reducer/events for one feature or archive modules.
- [ ] **P2 Missing Feature (Hypothesis) - `/api/agents*` lacks product entrypoint.** Rationale: routes/callables exist but no `src/` usage. Impact: maintenance burden for unreachable features. Repro: `functions/lib/api-router.js:44-49`, `functions/index.js:26-32`, no client refs in `src/`. Proposed fix scope: add tiny admin client or de-scope endpoints.
- [ ] **P2 Missing Feature (Hypothesis) - `CreationTalentPanel` step not wired.** Rationale: panel exported but never consumed. Impact: likely dropped UX step. Repro: `src/ui/panels/creation/CreationTalentPanel.jsx:1` only. Proposed fix scope: either insert a dedicated wizard step or remove panel.

## Refactor / Quality Items

- [ ] **P2 Refactor/Quality - Remove legacy `CharacterGenesisUI_Enhanced` path.** Rationale: orphan component. Impact: code drift and false navigation surface. Repro: `src/components/CharacterGenesisUI_Enhanced.jsx:127` only. Proposed fix scope: delete file and related CSS/tests, or feature-flag explicitly.
- [ ] **P2 Refactor/Quality - Functions TS template/source drift.** Rationale: `functions/src/index.ts` and `functions/src/genkit-sample.ts` are template-style sources not aligned with runtime `functions/index.js`. Impact: typecheck noise and onboarding confusion. Repro: `functions/src/index.ts:10-12`, `functions/index.js:17-32`, `functions/tsconfig.json:14-16`. Proposed fix scope: remove/ignore templates or adopt TS build pipeline.
- [ ] **P2 Refactor/Quality - Modal accessibility baseline missing in major overlays.** Rationale: modal wrappers close on backdrop click but no `role="dialog"`/`aria-modal`/Escape handling. Impact: keyboard and screen-reader gaps. Repro: `src/components/SaveLoadUI.jsx:398-401`, `src/components/ShopUI.jsx:225-228`, `src/components/GachaUI.jsx:183-186`, `src/components/TitleUI.jsx:296-299`, `src/components/ProfessionUI.jsx:289-292`, `src/components/StatusOverlay.jsx:1099-1102`. Proposed fix scope: shared modal shell with ARIA + focus trap + Escape close.
- [ ] **P2 Refactor/Quality - Runtime no-op schema package clarity.** Rationale: runtime files are intentionally empty. Impact: easy misread that runtime validation exists. Repro: `packages/game-schemas/src/index.js:1`, `packages/game-schemas/src/state.js:1`, `packages/game-schemas/src/actions.js:1`. Proposed fix scope: docs plus optional dev runtime guard import.

## Phase 2 - Stubs / Missing Content

- [ ] **P1 Missing Feature - Simulation world updates TODO.** Rationale: deterministic kernel does not update world state layer. Evidence: `packages/game-core/src/simulation/kernel/SimulationKernel.ts:382` comment `TODO: Implement world state updates`. Impact: incomplete simulation fidelity. Repro/verification: inspect `DefaultSimulationKernel.tick` flow (`:212-214`). Proposed fix scope: implement `updateWorld()` + tests.
- [ ] **P1 Missing Feature - Adapter TODOs for stamina/cooldowns.** Rationale: bridge hardcodes values instead of mapping actual player state. Evidence: `packages/game-core/src/simulation/bridge/GameStateAdapter.js:43`, `packages/game-core/src/simulation/bridge/GameStateAdapter.js:58`. Impact: runtime/simulation drift. Repro/verification: compare `player` runtime shape with adapter output. Proposed fix scope: map real stamina/cooldowns and round-trip tests.
- [ ] **P2 Refactor/Quality - Template/sample TS sources trigger avoidable compile failures.** Rationale: `functions/src/genkit-sample.ts` imports unsupported path and unused symbols. Evidence: file import at `functions/src/genkit-sample.ts:8`; tsc failures listed in Phase 4. Impact: noisy CI and false-negative backend health. Repro/verification: run `npx tsc -p functions/tsconfig.json --noEmit`. Proposed fix scope: prune or isolate sample files from production compile target.

## Phase 3 - Character Creation Report

### Works
- Wizard screen flow is fully connected from identity -> review panels in `src/ui/modes/CharacterCreationMode.jsx:484-609`.
- Validation gates all steps and final review in `src/hook/useCharacterCreationReworked.js:504-548` (`validateReview`, `validateCurrentStep`).
- Final payload creation is comprehensive in `src/hook/useCharacterCreationReworked.js:657-715` (`characterData` includes attributes, skills, profession, talents, resources).
- Finalized character is consumed by gameplay seeding in `src/components/GameUI.jsx:175-205` (`QuestManager.generateInitialQuests`, `seedWorldAfterCharacterCreation`).
- Initial narrative prompt consumes created character fields in `src/core/PromptAssembler.js:548-634` (`race`, `class`, `profession`, `archetypeSystem`, `activeSkills`).

### Breaks
- [ ] **P0 Defect - Command execution after creation still bypasses canonical `engine.step`.** Impact: post-creation gameplay may diverge from engine contract. Repro: `src/hook/useNarrative.js:667-747` vs `src/hook/usegamestate.js:119-124`. Proposed fix scope: unify path through `submitAction`.
- [ ] **P1 Defect - Review finalize UX uses blocking `alert()` calls.** Impact: poor UX/a11y and no structured error reporting. Repro: `src/ui/panels/creation/CreationSummaryPanel.jsx:293-299`. Proposed fix scope: replace alerts with wizard-shell error/status channel.
- [ ] **P1 Missing Feature - Immediate persistence not guaranteed at finalize boundary.** Impact: early-session loss if tab closes before debounce. Repro: finalize path `src/components/GameUI.jsx:175-205` with autosave debounce `src/components/GameUI.jsx:45`, `:106-123`. Proposed fix scope: write one immediate checkpoint on finalize success.

### Missing
- [ ] **P1 Missing Feature - Startup resume strategy is incomplete.** Impact: user intent around resumed character/save is ambiguous. Repro: `src/App.jsx:76-77` only localStorage key interactions for `characterCreated`/`saveLoaded`. Proposed fix scope: implement deterministic resume read path or remove flags.
- [ ] **P1 Missing Feature - Persisted character schema guard at API boundary.** Impact: malformed game_state payloads can persist unchecked beyond generic JSON constraints. Repro: `functions/lib/saves.js:31-38` accepts serialized payload without domain schema validation. Proposed fix scope: validate minimal required player/world keys before store.

### Next Minimal Implementation
- [ ] Wire `submitInput` to `submitAction` so text and button actions share one engine path.
- [ ] Add parser intents for escape/skill commands or remove those suggestions from `buildActionSuggestions`.
- [ ] Commit an immediate local autosave snapshot inside `handleCharacterCreationComplete`.
- [ ] Replace creation finalize `alert()` calls with inline wizard-shell feedback.
- [ ] Implement or remove stale resume localStorage keys (`characterCreated`, `saveLoaded`).

## Special Focus - Void-Verse Engine

- [ ] **P0 Defect - UI bypasses canonical engine entrypoint.** Evidence: canonical path `src/hook/usegamestate.js:119-124`; bypass path `src/hook/useNarrative.js:667-747`.
- [ ] **P1 Defect (Hypothesis) - Runtime vs simulation divergence.** Evidence: runtime executes `ActionDispatcher` (`packages/game-core/src/engine/createSystemEngine.js:3`, `:114`) while deterministic kernel resolves commands via `ActionResolver` (`packages/game-core/src/simulation/kernel/SimulationKernel.ts:268`) and is not called by live `src/` flow.
- [ ] **P1 Defect (Hypothesis) - EventBus duplication/drift risk.** Evidence: core bus `packages/game-core/src/core/EventBus.js:44`, simulation buses `packages/game-core/src/simulation/events/EventBus.ts:28` and `packages/game-core/src/simulation/events/EventBus.js:3`; UI listener expects `system:log` only (`src/components/SystemLog.jsx:67`) with no emitter.
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
- Backend build (functions): failed.
- Log excerpt:

```text
npm error Missing script: "build"
```

- [ ] **P1 Defect - Add backend build script.** Root cause: no `scripts` block in `functions/package.json:1-18`. Fix scope: add `build` (and likely `clean`) script or intentionally document prebuilt `lib` strategy.

### 3) Lint / Typecheck
- Root lint: passed with 29 warnings (`npm run lint`).
- Root typecheck: passed (`npm run typecheck`).
- Functions lint: failed (missing script).
- Functions tsc: failed.
- Log excerpt:

```text
npm error Missing script: "lint"
error TS2503: Cannot find namespace 'Handlebars'.
error TS2305: Module '"firebase-functions"' has no exported member 'setGlobalOptions'.
error TS2307: Cannot find module 'firebase-functions/https'...
```

- [ ] **P1 Defect - Repair functions compile/lint path.** Root cause: unaligned template TS sources and dependency/type versions. Fix scope: `functions/package.json`, `functions/src/index.ts`, `functions/src/genkit-sample.ts`, dependency versions/types.

### 4) Tests
- `npm test -- --runInBand` passed.
- [x] Verified passing check - 25 suites, 141 tests passed.

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
- Files touched: `src/hook/useNarrative.js`, `src/hook/usegamestate.js`, `src/components/GameUI.jsx`, `packages/game-core/src/core/gameReducer.js`.
- Changes: move narrative action handling to `submitAction`/`engine.step`; keep narrative generation as side-effect around canonical engine result.
- Verify: `npm test -- --runInBand`; manual text action and suggestion click both mutate state and narrative consistently.

### PR 2 - Character creation MVP completion
- Files touched: `src/ui/panels/creation/CreationSummaryPanel.jsx`, `src/components/GameUI.jsx`, `src/App.jsx`, `src/hook/useCharacterCreationReworked.js`, `packages/game-core/src/core/InputParser.js`.
- Changes: replace `alert()` finalize UX; immediate finalize checkpoint save; either wire or remove stale resume keys; align suggestions with parseable commands.
- Verify: complete creation flow, reload immediately after finalize, confirm resume and first-turn command behavior.

### PR 3 - UI state/error/accessibility pass
- Files touched: `src/components/SaveLoadUI.jsx`, `src/components/ShopUI.jsx`, `src/components/GachaUI.jsx`, `src/components/TitleUI.jsx`, `src/components/ProfessionUI.jsx`, `src/components/StatusOverlay.jsx`, `src/ui/modes/GameMode.jsx`, optional `src/components/common/ModalShell.jsx`.
- Changes: shared modal semantics (`role="dialog"`, `aria-modal`, Escape close, focus management); surface narrative error state in `GameMode`.
- Verify: keyboard-only modal navigation, screen-reader announcement checks, forced narrative failure path shows visible error.

### PR 4 - Refactors/cleanup
- Files touched: `functions/package.json`, `functions/tsconfig.json`, `functions/src/index.ts`, `functions/src/genkit-sample.ts`, `src/components/CharacterGenesisUI_Enhanced.jsx`, `src/ui/panels/creation/CreationTalentPanel.jsx`, optional docs.
- Changes: make functions checks executable (`build`/`lint` scripts + clean compile target), remove/archive orphan UI modules or explicitly gate them.
- Verify: `npm --prefix functions run build`, `npm --prefix functions run lint` (after added), `npm --prefix functions exec tsc -p tsconfig.json --noEmit`, full root build/lint/test.

## Needs Verification Queue

- [ ] **Needs verification (Hypothesis):** Confirm whether `/api/agents` and callable `agentList/agentRun` are intentionally external-only. Next check: inspect product docs/deployment consumers and any non-repo clients.
- [ ] **Needs verification (Hypothesis):** Confirm whether `PrestigeSystem` and `DungeonGenerator` are planned for near-term runtime integration. Next check: search roadmap/issues and decide wire vs archive.
- [ ] **Needs verification (Hypothesis):** Quantify runtime/simulation parity. Next check: add one parity test comparing same combat command through `createSystemEngine.step` vs `DefaultSimulationKernel` command resolution outputs.
- [ ] **Needs verification (Hypothesis):** Decide whether `CreationTalentPanel` is deprecated or pending. Next check: review UX spec for character-creation phase list and align component set.
