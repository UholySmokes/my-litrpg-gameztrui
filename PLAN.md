# PLAN.md Replacement: Godot-First Hybrid Command Pixel RPG (AI Narrative + Online Canonical Sync)

## Summary
As of **February 23, 2026**, the repo already has:
1. A complete Godot trigger-commit vertical slice (`godot/` + `/api/sync/*`).
2. A mature command-driven web RPG engine (`packages/game-core`, `src/hook/useNarrative.js`, `src/core/AIService.js`).
3. Narration endpoints with start/poll flow (`functions/lib/handlers.js`).

This plan reworks the project into a **Godot-first hybrid**:
1. Top-down 2D pixel exploration in Godot.
2. Command-driven RPG decisions and deterministic server outcomes.
3. AI-generated narrative and quest variation (not AI-generated core mechanics).
4. Firebase/Data Connect as canonical online authority.

## Locked Product Decisions
1. Primary runtime: **Godot-first**.
2. Core loop: **Hybrid command RPG** (pixel exploration + command decisions + deterministic RPG rules).
3. AI scope: **Narrative + quest variation only**.
4. Connectivity model: **Online canonical backend** with safe-mode degradation.
5. Scope: **Single-player runtime this phase** (no multiplayer mechanics in this rework).

## PLAN.md Operating Model (Keep Updated + Review Between Tasks)

### Required PLAN.md Structure
1. `# Goal`
2. `# Locked Decisions`
3. `# Task Ledger`
4. `# Current Sprint`
5. `# Between-Task Review Checklist`
6. `# Risks/Blockers`
7. `# Change Log`

### Task Ledger Template (copy into `PLAN.md`)
| ID | Task | Status | Owner | Started | Done | Evidence | Notes |
|---|---|---|---|---|---|---|---|
| P0-01 | Replace PLAN with new structure | TODO | | | | | |
| P0-02 | Baseline validation run | TODO | | | | | |

### Status Values
1. `TODO`
2. `IN_PROGRESS`
3. `BLOCKED`
4. `DONE`

### Mandatory Between-Task Review Checklist (run after every completed task)
1. Confirm task acceptance criteria were met.
2. Run the task’s required automated tests.
3. Run `npm run lint`.
4. Update `PLAN.md` Task Ledger status and add evidence (test names, commands, screenshots, commit hash).
5. Add one line to `PLAN.md` Change Log with date and what changed.
6. Re-evaluate `PLAN.md` Risks/Blockers and add/remove items.
7. Confirm the next task’s prerequisites are satisfied.
8. If a task changed API/schema, update contract docs the same day.
9. If test failures remain, set next task to `BLOCKED` and state exact unblock condition.
10. Do not start the next task until items 1-9 are complete.

## Step-by-Step Implementation Plan

## Phase 0: Replace Planning Surface and Capture Baseline
### Steps
1. `P0-01`: Replace `PLAN.md` content with this exact structure and phase list.
2. `P0-02`: Move current trigger-commit plan content from `PLAN.md` into `docs/archive/PLAN_trigger_commit_2026-02-23.md`.
3. `P0-03`: Record baseline command outputs in `docs/baseline/2026-02-23.md`:
   - `npm run test -- tests/unit/ApiRouterSyncRoutes.test.js`
   - `npm run test -- tests/unit/HandlersNarrate.test.js`
   - `npm run test -- tests/unit/SyncProcess.test.js`
   - `npm run test -- tests/unit/SyncValidation.test.js`
4. `P0-04`: Record baseline Godot manual smoke flow in `docs/baseline/godot_smoke_2026-02-23.md` (move, interact, savepoint, pull).

### Exit Criteria
1. `PLAN.md` has the new living format.
2. Baseline tests are recorded with pass/fail evidence.
3. Archive snapshot exists and is linked from `PLAN.md`.

## Phase 1: Canonical State v2 Contract (Server + Storage + Docs)
### Steps
1. `P1-01`: Create `docs/contracts/canonical_state_v2.md` with exact JSON shape for:
   - `worldProjection`
   - `rpgState`
   - `narrativeState`
   - `syncMeta`
2. `P1-02`: Extend `dataconnect/schema/schema.gql`:
   - `RunSession.gameStateJson: String`
   - `RunSession.narrativeStateJson: String`
   - `RunSession.schemaVersion: Int`
   - `RunEvent.eventType: String`
   - `RunEvent.eventPayloadJson: String`
   - `RunEvent.actionType: String`
   - Keep existing trigger fields for backward compatibility.
3. `P1-03`: Regenerate Data Connect clients used by:
   - `functions/src/dataconnect-admin-generated`
   - `src/dataconnect-generated`
   - `packages/game-schemas/src/dataconnect-generated`
4. `P1-04`: Update adapters in `functions/lib/sync-dataconnect-store.js` and `functions/lib/sync-store.js` to read/write v2 fields.
5. `P1-05`: Add migration logic in `functions/lib/sync.js`:
   - Existing runs with v1 fields are auto-upgraded to v2 on first write.
   - Upgrade must preserve existing `seq`, `tick`, `stateHash`, and quest flags.
6. `P1-06`: Add migration tests in `tests/unit/SyncProcess.test.js` for v1 -> v2 upgrade.

### Exit Criteria
1. v1 and v2 run sessions are both readable.
2. New writes always persist v2 fields.
3. Existing sync routes still pass all current tests.

## Phase 2: Add Canonical Command Transport
### Steps
1. `P2-01`: Define `CommandEnvelope` in `docs/contracts/command_envelope_v1.md`:
   - `id`, `runId`, `clientId`, `clientSeq`, `createdAt`, `contentVersion`, `commandText`, `context`.
2. `P2-02`: Add route in `functions/lib/api-router.js`:
   - `POST /api/sync/command`.
3. `P2-03`: Add handler in `functions/lib/sync.js`:
   - `command(req, res)` with same auth/reconcile semantics as commit endpoints.
4. `P2-04`: Extend event normalization in `functions/lib/sync-core.js` to support `eventType: COMMAND` alongside trigger commits.
5. `P2-05`: Persist command events in `RunEvent` using `eventType=COMMAND`, `eventPayloadJson`, `actionType`.
6. `P2-06`: Return command responses with:
   - `accepted/rejected`
   - `reconcileRequired`
   - `canonicalState`
   - `actionResult`
   - `contentVersion`
7. `P2-07`: Add route/behavior tests in `tests/unit/ApiRouterSyncRoutes.test.js` and new `tests/unit/SyncCommandRoutes.test.js`.

### Exit Criteria
1. `/api/sync/command` is live and authenticated.
2. Command events are stored and replay-safe.
3. Existing `/api/sync/commit*` behavior remains unchanged.

## Phase 3: Server-Side Deterministic Command Execution
### Steps
1. `P3-01`: Create `scripts/build-server-engine-bundle.mjs` to bundle deterministic engine code from `packages/game-core` into `functions/lib/server-engine.bundle.cjs`.
2. `P3-02`: Add script hooks:
   - Root `package.json`: `build:server-engine`.
   - Ensure CI runs this before unit tests touching command execution.
3. `P3-03`: Add `functions/lib/command-engine.js` that loads bundled engine and exposes:
   - `parseCommand`
   - `executeCommandAgainstCanonicalState`
4. `P3-04`: Wire `/api/sync/command` to execute deterministic action transitions and update `rpgState`.
5. `P3-05`: Increment canonical `seq/tick` for accepted commands exactly once.
6. `P3-06`: Add deterministic parity tests:
   - Same command sequence against same seed returns same `{seq,tick,stateHash}`.
   - Add `tests/unit/SyncCoreDeterminism.test.js` cases for command streams.
7. `P3-07`: Add failure-mode tests:
   - invalid command
   - stale `clientSeq`
   - contentVersion mismatch
   - replayed `id` idempotency.

### Exit Criteria
1. Server command execution is deterministic and canonical.
2. Replay parity tests pass.
3. No regression in trigger-commit determinism tests.

## Phase 4: Godot Command Terminal + Sync Integration
### Steps
1. `P4-01`: Update `godot/scenes/Main.tscn` to add:
   - command input `LineEdit`
   - submit button
   - suggestions container
   - command log panel.
2. `P4-02`: Add `godot/scripts/command_terminal.gd`:
   - input submission
   - command history navigation
   - disable/enable on request in-flight
   - display validation errors.
3. `P4-03`: Extend `godot/scripts/sync_client.gd` with:
   - `command(envelope: Dictionary) -> Dictionary`.
4. `P4-04`: Update `godot/scripts/world_controller.gd` to:
   - build command envelope
   - call sync command endpoint
   - apply canonical returned state
   - reconcile on 409/`reconcileRequired`.
5. `P4-05`: Keep movement trigger flow unchanged and compatible with command flow in same run.
6. `P4-06`: Add Godot contract tests similar to existing string-contract style:
   - `tests/unit/GodotCommandContract.test.js`.

### Exit Criteria
1. Commands can be submitted from Godot and mutate canonical state.
2. Trigger and command streams coexist on one run ID.
3. Reconcile flow works for both event types.

## Phase 5: AI Story Streaming in Godot
### Steps
1. `P5-01`: Add `godot/scripts/story_client.gd` with:
   - `story_start(payload)`
   - `story_poll(threadId, runId)`.
2. `P5-02`: On accepted command/trigger, call `/api/story/start`; poll until done or timeout.
3. `P5-03`: Render narrative in `ProsePanel` with:
   - title
   - current beat
   - suggested next actions.
4. `P5-04`: Handle failures with deterministic fallback lines:
   - no blank prose states
   - clear safe-mode messaging.
5. `P5-05`: Add backend tests for story coupling:
   - command result -> prompt payload shape
   - poll terminal states.
6. `P5-06`: Add manual smoke script `docs/playtests/godot_story_flow.md`.

### Exit Criteria
1. Godot can generate story beats through `/api/story/*`.
2. Timeout and failure fallback paths are user-visible and stable.
3. Suggestions returned by narrative layer are displayed in UI.

## Phase 6: Pixel RPG Presentation Upgrade
### Steps
1. `P6-01`: Replace placeholder `ColorRect` actors with tilemap/sprite pipeline in `godot/scenes/Main.tscn`.
2. `P6-02`: Add map art/content directories:
   - `godot/assets/tilesets/`
   - `godot/assets/sprites/`
   - `godot/data/maps/`.
3. `P6-03`: Expand `godot/data/world_manifest.json` from slice to a small hub zone set (3-5 maps).
4. `P6-04`: Add in-game UI panels for:
   - vitals
   - inventory summary
   - quest tracker
   - combat status.
5. `P6-05`: Keep command terminal always available while moving/exploring.
6. `P6-06`: Add performance checks for 60 FPS target on baseline desktop profile.

### Exit Criteria
1. Godot gameplay is visually pixel-RPG (not debug rectangles).
2. Multi-map travel and triggers remain canonical.
3. Command + exploration loop remains uninterrupted.

## Phase 7: Combat, Inventory, Quest Depth on Canonical State
### Steps
1. `P7-01`: Finalize executable command verb set in `docs/contracts/command_verbs_v1.md`:
   - `look`, `move`, `talk`, `attack`, `use`, `rest`, `status`, `inventory`, magic verbs.
2. `P7-02`: Ensure server command engine applies combat and inventory changes to `rpgState`.
3. `P7-03`: Add combat overlay in Godot for target, action result, and turn summary.
4. `P7-04`: Add quest objective updates and completion feed from canonical state changes.
5. `P7-05`: Add save/load parity validation:
   - load from canonical pull reproduces combat/quest/inventory exactly.
6. `P7-06`: Add scenario tests for full loop:
   - exploration -> encounter -> combat -> quest flag -> save -> load.

### Exit Criteria
1. RPG progression systems run through canonical server state.
2. Save/load parity proven across full loop.
3. Quest and combat are visible and actionable in Godot.

## Phase 8: Narrative-Quest Content Pipeline (AI-Assisted, Guardrailed)
### Steps
1. `P8-01`: Create `godot/data/quest_seeds/*.json` for deterministic quest skeletons.
2. `P8-02`: Update backend prompt assembly for Godot mode to include:
   - current map
   - active quest objectives
   - recent command outcomes
   - mood continuity.
3. `P8-03`: Enforce suggestion guardrail:
   - only return suggestions that map to known command verbs.
4. `P8-04`: Add narrative memory persistence with `StoryMemory`:
   - keep concise run summary
   - prune/rotate memory.
5. `P8-05`: Add tests for memory continuity and suggestion validity.

### Exit Criteria
1. AI output is consistent with game rules and command grammar.
2. Narrative memory improves continuity across sessions.
3. Suggestions are always executable commands.

## Phase 9: Web App Re-scope as Tooling + Observability
### Steps
1. `P9-01`: Define web role in `docs/web_tooling_scope.md`:
   - admin tools
   - run inspector
   - balance harness
   - content editor.
2. `P9-02`: Add run replay/debug view based on canonical event streams.
3. `P9-03`: Add state hash timeline inspector to catch divergence early.
4. `P9-04`: Keep existing React gameplay path behind dev flag only.
5. `P9-05`: Update README sections for Godot-first primary flow.

### Exit Criteria
1. Web is explicitly tooling-first.
2. Godot is clearly the primary gameplay client.
3. Replay/inspection tools support debugging production-like runs.

## Phase 10: Quality Gates, Security, Rollout
### Steps
1. `P10-01`: Expand CI test matrix:
   - sync routes
   - command routes
   - determinism replay
   - story handlers
   - Firestore rules emulator.
2. `P10-02`: Add load tests for `/api/sync/command` and `/api/story/*`.
3. `P10-03`: Add error budget and retry policy docs for story and sync paths.
4. `P10-04`: Staging checklist:
   - 100-run deterministic replay parity
   - auth expiry resilience
   - reconnect/reconcile resilience.
5. `P10-05`: Production rollout in three stages:
   - internal canary users
   - limited % rollout
   - full rollout after stability window.
6. `P10-06`: Rollback plan:
   - disable command endpoint via feature flag
   - fall back to trigger-only mode
   - preserve saves and run events.

### Exit Criteria
1. CI and staging gates pass consistently.
2. Production rollout has clear rollback levers.
3. No unresolved P0-P10 blockers remain in `PLAN.md`.

## Important Public API / Interface / Type Changes

1. Add `POST /api/sync/command` in `functions/lib/api-router.js`.
2. Add command handler in `functions/lib/sync.js`.
3. Extend sync state contract in `functions/lib/sync-core.js` to include `rpgState` and `narrativeState` in canonical payload.
4. Update `GET /api/sync/pull` response to include v2 canonical state sections.
5. Extend Data Connect schema in `dataconnect/schema/schema.gql`:
   - `RunSession.gameStateJson`
   - `RunSession.narrativeStateJson`
   - `RunSession.schemaVersion`
   - `RunEvent.eventType`
   - `RunEvent.eventPayloadJson`
   - `RunEvent.actionType`
6. Add Godot client interface in `godot/scripts/sync_client.gd`:
   - `command(envelope)`.
7. Add Godot story interface in `godot/scripts/story_client.gd`:
   - `story_start`, `story_poll`.

## Test Cases and Scenarios (Must Exist Before Final Rollout)

1. Command envelope validation rejects malformed payloads.
2. Idempotency by `id` works for repeated command submissions.
3. `clientSeq` ordering is strictly enforced across mixed trigger+command streams.
4. Reconcile flow works when command event is rejected.
5. Command determinism replay produces stable `{seq,tick,stateHash}`.
6. Content version mismatch rejects both triggers and commands.
7. Story start/poll handles success, failure, timeout, and missing run.
8. Suggestions returned by AI always map to valid command verbs.
9. Godot auth token refresh and one-retry behavior remains intact.
10. Save/load restores full v2 canonical state with no drift.
11. Mixed gameplay scenario:
    - move on map
    - command interact
    - trigger encounter
    - command combat action
    - savepoint
    - pull/reload
    - state parity confirmed.
12. Safe-mode scenario:
    - API unavailable
    - local UX remains responsive
    - reconnect pulls canonical tip and resumes.

## Assumptions and Defaults

1. Node/Firebase runtime remains in place; no platform migration in this phase.
2. Movement remains client-authoritative between validated trigger commits.
3. Canonical server authority applies to all state-changing command outcomes.
4. AI does not author core game math/rules at runtime.
5. Single-player only; multiplayer is explicitly out of scope.
6. Existing `/api/sync/action` legacy route remains during transition and is deprecated, not removed.
7. Existing March 2026 Firestore hardening commitments remain mandatory and are not de-scoped by this plan.
