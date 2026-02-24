# PLAN: Godot-First Hybrid Command Pixel RPG Roadmap

Last updated: 2026-02-24
Planning horizon: W1-W20 (2026-02-23 to 2026-07-12)

## 0. Execution Tracker (Live)
Last implementation check: 2026-02-24

### M0 - Planning and Contract Freeze
- [x] Baseline sync regression tests executed and evidence committed (`docs/reports/baseline_test_report_2026-02-23.md`)
- [x] Canonical state v2 contract drafted (`docs/contracts/canonical_state_v2.md`)
- [x] Command envelope v1 contract drafted (`docs/contracts/command_envelope_v1.md`)
- [x] Dependency map exists and is maintained (`PLAN.md` section `## 6`)
- [x] Decision log initialized (`PLAN.md` section `## 10`)
- [ ] Formal roadmap/contracts approval recorded by owners

### Next unblocked implementation slices
- [x] M1: add explicit command identity model (`RunEvent.eventType`) in schema + adapters
  - Evidence: `dataconnect/schema/schema.gql`, `functions/lib/sync-core.js`, `functions/lib/sync-store.js`, `functions/lib/sync-dataconnect-store.js`
  - Verification: `npm test -- tests/unit/SyncCoreDeterminism.test.js tests/unit/SyncDataconnectStore.test.js tests/unit/SyncProcess.test.js tests/unit/SyncValidation.test.js --runInBand` (27 passed)
- [x] M1: run Data Connect codegen + publish migration ADR/compatibility note artifact
  - Evidence: `docs/adr/adr-2026-02-23-m1-eventtype-discriminator.md`, generated SDK deltas under `src/dataconnect-generated`, `api/src/dataconnect-generated`, `packages/*/src/dataconnect-generated`, `functions/src/dataconnect-admin-generated`
  - Verification: `npx firebase dataconnect:sdk:generate` (successful generation for service `my-litrpg-gameztrui`)
- [x] M2: add `POST /api/sync/command` route + validation/idempotency tests
  - Evidence: `functions/lib/api-router.js`, `functions/lib/sync.js`, `tests/unit/SyncCommandRoutes.test.js`, `tests/unit/ApiRouterSyncRoutes.test.js`
  - Verification: `npm test -- tests/unit/ApiRouterSyncRoutes.test.js tests/unit/SyncCommandRoutes.test.js tests/unit/SyncProcess.test.js tests/unit/SyncValidation.test.js --runInBand` (25 passed)
- [x] M3: extend determinism suite to 100-run mixed-stream replay assertion
  - Evidence: `tests/unit/SyncCoreDeterminism.test.js`, `docs/reports/determinism_validation_2026-02-23.md`
  - Verification: `npm test -- tests/unit/SyncCoreDeterminism.test.js tests/unit/SyncProcess.test.js --runInBand` (11 passed)
- [x] M4 (partial): add shared runtime-to-Godot config generation script
  - Evidence: `scripts/generate-godot-config.js`, `godot/data/config.json`, `package.json` (`generate:godot-config`, updated `postbuild`)
  - Verification: `npm run generate:godot-config` (writes `godot/data/config.json`)
- [x] M4: add Godot `ConfigLoader.gd` consumption path + command/reconcile contract tests
  - Evidence: `godot/scripts/config_loader.gd`, `godot/scripts/world_controller.gd`, `godot/scripts/sync_client.gd`, `godot/scripts/trigger_queue.gd`, `godot/scenes/Main.tscn`, `tests/unit/GodotCommandContract.test.js`
  - Verification: `npm test -- tests/unit/GodotCommandContract.test.js tests/unit/GodotAuthResilienceContract.test.js --runInBand` (7 passed)
- [x] M4: add headless Godot runtime lane in CI and document runtime harness
  - Evidence: `.github/workflows/quality-gates.yml` (`godot-headless` job), `scripts/run-godot-headless.mjs`, `godot/scripts/headless_smoke.gd`, `godot/README.md`
  - Verification:
    - `npm run test:godot:headless` with `GODOT_BIN=D:\Godot_v4.6.1-stable_win64.exe\Godot_v4.6.1-stable_win64_console.exe` (PASS)
    - `npm test -- tests/unit/GodotCommandContract.test.js tests/unit/GodotAuthResilienceContract.test.js --runInBand` (7 passed)
- [x] M5: add `godot/scripts/story_client.gd` wrappers for `/story/start` + `/story/poll` and wire fallback behavior
  - Evidence: `godot/scripts/story_client.gd`, `godot/scripts/world_controller.gd`, `godot/scripts/prose_panel.gd`, `godot/scenes/Main.tscn`, `godot/scripts/headless_smoke.gd`, `tests/unit/GodotCommandContract.test.js`, `godot/README.md`
  - Verification:
    - `npm test -- tests/unit/GodotCommandContract.test.js tests/unit/GodotAuthResilienceContract.test.js tests/unit/HandlersNarrate.test.js --runInBand` (13 passed)
    - `npm run test:godot:headless` with `GODOT_BIN=D:\Godot_v4.6.1-stable_win64.exe\Godot_v4.6.1-stable_win64_console.exe` (PASS)
- [x] M6 (partial): add pixel map renderer foundation for tile-pattern maps and trigger markers
  - Evidence: `godot/scripts/pixel_map_renderer.gd`, `godot/scripts/world_controller.gd`, `godot/scenes/Main.tscn`, `godot/scripts/headless_smoke.gd`, `tests/unit/GodotCommandContract.test.js`, `godot/README.md`
  - Verification:
    - `npm test -- tests/unit/GodotCommandContract.test.js tests/unit/GodotAuthResilienceContract.test.js tests/unit/HandlersNarrate.test.js --runInBand` (13 passed)
    - `npm run test:godot:headless` with `GODOT_BIN=D:\Godot_v4.6.1-stable_win64.exe\Godot_v4.6.1-stable_win64_console.exe` (PASS)
- [x] M6: expand hub foundation to 3-map traversal + sprite pass hook points
  - Evidence: `godot/data/world_manifest.json`, `godot/scripts/pixel_map_renderer.gd`, `godot/scenes/Main.tscn`, `godot/scripts/world_controller.gd`, `godot/scripts/headless_smoke.gd`, `tests/unit/GodotCommandContract.test.js`, `godot/README.md`
  - Verification:
    - `npm test -- tests/unit/GodotCommandContract.test.js tests/unit/GodotAuthResilienceContract.test.js tests/unit/HandlersNarrate.test.js --runInBand` (13 passed)
    - `npm run test:godot:headless` with `GODOT_BIN=D:\Godot_v4.6.1-stable_win64.exe\Godot_v4.6.1-stable_win64_console.exe` (PASS)
- [x] M6: hook real sprite assets + perf instrumentation baselines for map traversal
  - Evidence: `docs/ART_ASSET_LIST.md` (integration status), `godot/assets/**` (placeholder runtime pack), `scripts/generate-godot-placeholder-assets.ps1`, `godot/scenes/Main.tscn`, `godot/scripts/world_controller.gd`, `godot/scripts/pixel_map_renderer.gd`, `godot/scripts/headless_perf_probe.gd`, `scripts/run-godot-perf-probe.mjs`, `docs/reports/godot_map_traversal_perf_baseline_2026-02-24.md`
  - Verification:
    - `npm test -- tests/unit/GodotCommandContract.test.js tests/unit/GodotAuthResilienceContract.test.js tests/unit/HandlersNarrate.test.js --runInBand` (13 passed)
    - `npm run test:godot:headless` with `GODOT_BIN=D:\Godot_v4.6.1-stable_win64.exe\Godot_v4.6.1-stable_win64_console.exe` (PASS)
    - `npm run test:godot:perf` with `GODOT_BIN=D:\Godot_v4.6.1-stable_win64.exe\Godot_v4.6.1-stable_win64_console.exe` (PASS, baseline report written)
- [x] M7: start progression depth slice by locking initial command verb set + scenario harness skeleton
  - Evidence: `functions/lib/sync-command-contract.js`, `functions/lib/sync.js`, `functions/lib/sync-core.js`, `tests/helpers/syncProgressionHarness.cjs`, `tests/unit/SyncProgressionScenarioHarness.test.js`, `docs/contracts/command_verbs_v1.md`, `docs/contracts/command_envelope_v1.md`
  - Verification: `npm test -- tests/unit/SyncCommandRoutes.test.js tests/unit/SyncProcess.test.js tests/unit/SyncCoreDeterminism.test.js tests/unit/SyncProgressionScenarioHarness.test.js --runInBand` (20 passed)
- [x] M7 (partial): wire deterministic combat rewards + inventory/quest/savepoint progression mutations
  - Evidence: `functions/lib/sync-core.js`, `functions/lib/sync-snapshots.js`, `tests/unit/SyncProgressionScenarioHarness.test.js`, `docs/contracts/gameplay_progression_v1.md`, `docs/contracts/canonical_state_v2.md`
  - Verification: `npm test -- tests/unit/SyncCommandRoutes.test.js tests/unit/SyncProcess.test.js tests/unit/SyncCoreDeterminism.test.js tests/unit/SyncValidation.test.js tests/unit/SyncProgressionScenarioHarness.test.js --runInBand` (31 passed)
- [x] M7 (partial): add deterministic save/load parity assertions for progression snapshots
  - Evidence: `tests/unit/SyncProgressionScenarioHarness.test.js`
  - Verification: `npm test -- tests/unit/SyncProcess.test.js tests/unit/SyncCoreDeterminism.test.js tests/unit/SyncValidation.test.js tests/unit/SyncProgressionScenarioHarness.test.js --runInBand` (24 passed)
- [x] M7 (partial): publish progression scenario matrix artifact for auditability
  - Evidence: `docs/reports/m7_progression_scenario_matrix_2026-02-24.md`
  - Verification: `npm test -- tests/unit/SyncProcess.test.js tests/unit/SyncCoreDeterminism.test.js tests/unit/SyncValidation.test.js tests/unit/SyncProgressionScenarioHarness.test.js --runInBand` (24 passed)
- [x] M7 (partial): cover deterministic setback branch for combat/inventory/quest progression
  - Evidence: `tests/unit/SyncProgressionScenarioHarness.test.js`
  - Verification: `npm test -- tests/unit/SyncProcess.test.js tests/unit/SyncCoreDeterminism.test.js tests/unit/SyncValidation.test.js tests/unit/SyncProgressionScenarioHarness.test.js --runInBand` (25 passed)
- [x] M8 (partial): add replay timeline API foundation for tooling/hash inspector
  - Evidence: `functions/lib/sync.js`, `functions/lib/api-router.js`, `functions/lib/sync-store.js`, `functions/lib/sync-dataconnect-store.js`, `tests/unit/SyncReplayRoute.test.js`, `tests/unit/ApiRouterSyncRoutes.test.js`, `docs/contracts/replay_timeline_v1.md`
  - Verification: `npm test -- tests/unit/ApiRouterSyncRoutes.test.js tests/unit/SyncReplayRoute.test.js tests/unit/SyncCommandRoutes.test.js tests/unit/SyncProcess.test.js tests/unit/SyncDataconnectStore.test.js --runInBand` (26 passed)
- [x] M8 (next): add dev-only web replay/hash inspector view consuming `GET /api/sync/replay`
  - Evidence: `src/components/ReplayInspector.jsx`, `src/core/SyncReplayService.js`, `src/components/GameUI.jsx`, `src/ui/modes/GameMode.jsx`, `tests/unit/SyncReplayService.test.js`
  - Verification:
    - `npm test -- tests/unit/SyncReplayService.test.js tests/unit/ApiRouterSyncRoutes.test.js tests/unit/SyncReplayRoute.test.js --runInBand` (10 passed)
    - `npm run build` (PASS; runtime config and `godot/data/config.json` regenerated by `postbuild`)
- [x] M8 (next): add tooling acceptance checklist + README updates for replay/hash inspector workflow
  - Evidence: `docs/reports/m8_replay_inspector_acceptance_checklist_2026-02-24.md`, `README.md`
  - Verification: `npm test -- tests/unit/SyncReplayService.test.js --runInBand` (3 passed)
- [x] M8 (next): add production-safe dev flag gate so gameplay UI path is disabled by default outside approved tooling environments
  - Evidence: `src/core/WebGameplayGate.js`, `src/App.jsx`, `tests/unit/WebGameplayGate.test.js`, `README.md`
  - Verification:
    - `npm test -- tests/unit/WebGameplayGate.test.js tests/unit/SyncReplayService.test.js tests/unit/ApiRouterSyncRoutes.test.js tests/unit/SyncReplayRoute.test.js --runInBand` (14 passed)
    - `npm run build` (PASS; runtime config and `godot/data/config.json` regenerated by `postbuild`)
- [x] M8 (next): publish web tooling scope doc (replay inspector + gameplay gate policy + operator flow)
  - Evidence: `docs/WEB_TOOLING_SCOPE_M8.md`
  - Verification: `npm test -- tests/unit/WebGameplayGate.test.js tests/unit/SyncReplayService.test.js --runInBand` (7 passed)
- [x] M9 (partial): add quality-gate CI coverage for replay tooling + gameplay gate tests
  - Evidence: `.github/workflows/quality-gates.yml`
  - Verification: `npm test -- tests/unit/WebGameplayGate.test.js tests/unit/SyncReplayService.test.js tests/unit/SyncReplayRoute.test.js tests/unit/ApiRouterSyncRoutes.test.js --runInBand` (14 passed)
- [x] M9 (next): scaffold quality gate packet template (CI history + security register + telemetry health sections)
  - Evidence: `docs/reports/m9_quality_gate_packet_template.md`
  - Verification: `npm test -- tests/unit/SyncReplayRoute.test.js --runInBand` (3 passed)
- [x] M9 (next): add telemetry ingest route contract scaffold (`POST /api/telemetry`) for Godot/web runtime observability
  - Evidence: `functions/lib/telemetry.js`, `functions/lib/api-router.js`, `tests/unit/TelemetryRoute.test.js`, `docs/contracts/telemetry_ingest_v1.md`
  - Verification: `npm test -- tests/unit/TelemetryRoute.test.js tests/unit/ApiRouterSyncRoutes.test.js tests/unit/SyncReplayRoute.test.js --runInBand` (10 passed)
- [x] M9 (next): add Godot telemetry reporter payload schema + client-to-endpoint contract test coverage
  - Evidence: `godot/scripts/telemetry_reporter.gd`, `godot/scripts/world_controller.gd`, `godot/scenes/Main.tscn`, `godot/scripts/config_loader.gd`, `scripts/generate-godot-config.js`, `godot/data/config.json`, `tests/unit/GodotCommandContract.test.js`, `docs/contracts/godot_telemetry_payload_v1.md`
  - Verification:
    - `npm run generate:godot-config` (PASS)
    - `npm test -- tests/unit/GodotCommandContract.test.js tests/unit/GodotAuthResilienceContract.test.js tests/unit/TelemetryRoute.test.js --runInBand` (12 passed)
    - `npm run test:godot:headless` with `GODOT_BIN=D:\Godot_v4.6.1-stable_win64.exe\Godot_v4.6.1-stable_win64_console.exe` (PASS)
- [x] M9 (next): add telemetry ingest health smoke script + report artifact for quality gate packet inputs
  - Evidence: `scripts/run-telemetry-ingest-smoke.mjs`, `package.json`, `docs/reports/telemetry_ingest_health_smoke_2026-02-24.md`
  - Verification: `npm run test:telemetry:smoke` (PASS; status 202, accepted 2, dropped 0)
- [x] M9 (next): harden CI matrix with nightly replay/load workflow and artifact capture
  - Evidence: `.github/workflows/nightly-replay-load.yml`, `package.json`, `docs/reports/m9_quality_gate_packet_template.md`, `docs/reports/m9_nightly_replay_load_bootstrap_2026-02-24.md`
  - Verification:
    - `npm test -- tests/unit/SyncCoreDeterminism.test.js tests/unit/SyncProgressionScenarioHarness.test.js tests/unit/SyncReplayRoute.test.js tests/unit/TelemetryRoute.test.js --runInBand` (14 passed)
    - `npm run simulate:nightly` (PASS; success rate 97.0%)
    - `npm run test:telemetry:smoke` (PASS; status 202, accepted 2, dropped 0)
- [x] M9 (next): publish security controls register with triaged dependency findings and remediation owners
  - Evidence: `docs/M9_SECURITY_CONTROLS_REGISTER.md`, `package.json`
  - Verification:
    - `npm run audit:security:root` (expected findings; exit 1 with 5 vulnerabilities captured)
    - `npm run audit:security:functions` (expected findings; exit 1 with 3 vulnerabilities captured, including 1 critical)
- [x] M9 (next): define telemetry ingest SLO/error-budget policy and harden Godot retry behavior
  - Evidence: `docs/M9_TELEMETRY_SLO_RETRY_POLICY.md`, `godot/scripts/telemetry_reporter.gd`, `docs/contracts/godot_telemetry_payload_v1.md`, `tests/unit/GodotCommandContract.test.js`
  - Verification:
    - `npm test -- tests/unit/GodotCommandContract.test.js tests/unit/TelemetryRoute.test.js --runInBand` (9 passed)
    - `npm run test:godot:headless` with `GODOT_BIN=D:\Godot_v4.6.1-stable_win64.exe\Godot_v4.6.1-stable_win64_console.exe` (PASS)
- [x] M10 (partial): add staging soak smoke harness and runbook baseline for parity/auth/reconnect readiness checks
  - Evidence: `scripts/run-staging-soak-smoke.mjs`, `package.json`, `docs/M10_STAGING_SOAK_RUNBOOK.md`, `docs/reports/m10_staging_soak_smoke_2026-02-24.md`
  - Verification: `npm run test:staging:soak-smoke` with `GODOT_BIN=D:\Godot_v4.6.1-stable_win64.exe\Godot_v4.6.1-stable_win64_console.exe` (PASS; 4 checks, 0 failed)
- [x] M10 (partial): add reconnect-storm command integrity test coverage and wire into soak harness
  - Evidence: `tests/unit/SyncReconnectStorm.test.js`, `scripts/run-staging-soak-smoke.mjs`
  - Verification:
    - `npm test -- tests/unit/SyncReconnectStorm.test.js tests/unit/SyncCommandRoutes.test.js --runInBand` (8 passed)
    - `npm run test:staging:soak-smoke` with `GODOT_BIN=D:\Godot_v4.6.1-stable_win64.exe\Godot_v4.6.1-stable_win64_console.exe` (PASS; 4 checks, 0 failed)
- [x] M10 (partial): add auth-guard command route coverage and include it in staging soak smoke checks
  - Evidence: `tests/unit/SyncCommandRoutes.test.js`, `scripts/run-staging-soak-smoke.mjs`
  - Verification:
    - `npm test -- tests/unit/SyncCommandRoutes.test.js tests/unit/SyncReconnectStorm.test.js --runInBand` (9 passed)
    - `npm run test:staging:soak-smoke` with `GODOT_BIN=D:\Godot_v4.6.1-stable_win64.exe\Godot_v4.6.1-stable_win64_console.exe` (PASS; 4 checks, 0 failed)

## 1. Executive Summary
Primary objective: ship a Godot-first, single-player, command-driven pixel RPG where canonical state is owned by the online backend and all core gameplay transitions are deterministic.

Secondary objectives:
- Use AI for narrative and quest flavor only, never for core rules or balance math.
- Convert the existing web runtime to tooling and observability for faster debugging and safer rollout.
- Reach production via staged launch with explicit rollback levers and reliability guardrails.

Success definition for this roadmap window:
- Internal Alpha by 2026-04-19 (end of W8): Godot exploration + command mutation + reconcile loop works end-to-end.
- Beta by 2026-05-31 (end of W14): combat/inventory/quest loop is canonical and save/load parity is proven.
- Release Candidate by 2026-06-28 (end of W18): quality, security, and staging soak gates pass.
- General Availability by 2026-07-12 (end of W20): staged production rollout completes within error budget.

Prioritization method:
- Default model: RICE-lite (Reach, Impact, Confidence, Effort bands).
- Platform/foundation override: Cost of Delay + Risk Reduction weighted above feature breadth.
- Tie-break rule: choose items that reduce critical-path uncertainty first.

## 2. Scope & Non-Goals
In scope:
- Godot as primary runtime for exploration, interaction, and command entry.
- Canonical state v2 contract covering `worldProjection`, `rpgState`, `narrativeState`, and `syncMeta`.
- `POST /api/sync/command` with idempotency (`id`), ordering (`clientSeq`), and reconcile signaling.
- Server-side deterministic command engine based on shared game-core logic.
- AI story start/poll integration with deterministic fallback narrative for timeout/failure.
- Pixel presentation pass: tilemaps, sprite pipeline, 3-5 map hub, persistent command terminal.
- Canonical combat/inventory/quest transitions and load parity across sessions.
- Web app repositioned to inspector/replay/debug tooling.
- Godot runtime observability via batched telemetry reporting to backend endpoint.
- Unified runtime config generation so Godot and Web consume the same environment flags/URLs.

Explicit in-scope interface changes:
- `functions/lib/api-router.js`: add `POST /api/sync/command`.
- `functions/lib/sync.js`: add command handler and migration-on-write logic.
- `functions/lib/sync-core.js`: normalize mixed trigger/command event streams.
- `dataconnect/schema/schema.gql`: add v2 session/event fields.
- `godot/scripts/sync_client.gd`: add command API wrapper.
- `godot/scripts/story_client.gd`: add story start/poll wrappers.
- `godot/scripts/telemetry_reporter.gd`: batch and ship Godot runtime logs/errors.
- `functions/lib/api-router.js`: add telemetry ingest route (`POST /api/telemetry` or equivalent observability route).
- `scripts/generate-godot-config.js`: generate `godot/data/config.json` from shared runtime config source.

Non-goals (for this 20-week window):
- Multiplayer, co-op, guild, or shared-world mechanics.
- Migration away from Node/Firebase/Data Connect stack.
- AI-generated combat formulas, economy tuning, or XP curves.
- Production parity between Godot and web gameplay clients.
- Full content expansion beyond MVP hub + core questline loop.

## 3. Assumptions
- A1: Existing sync/commit route tests are valid as regression anchors.
- A2: Existing story handlers remain usable and can be extended without full rewrite.
- A3: Data Connect schema changes can be deployed with dual-read compatibility.
- A4: At least one dedicated Godot engineer remains assigned through W14.
- A5: Narrative model quota and budget are approved for canary-scale traffic.
- A6: Existing auth model and token refresh flow remain compatible with new command endpoint.
- A7: Team capacity baseline is 4.3 FTE effective (engineering + QA + DevOps + content).
- A8: CI can support added tests with nightly split for heavier replay/load suites.
- A9: Art production for pixel assets is scoped to MVP quality, not final polished content pack.
- A10: Firestore hardening requirements committed for March 2026 remain mandatory and non-negotiable.

## 4. Constraints
- C1: Schedule is fixed to 20 weeks; scope reduction is the primary control lever.
- C2: Backward compatibility for legacy trigger-commit run data is required during transition.
- C3: Determinism failures block release progression regardless of feature completeness.
- C4: Security/privacy review is required before canary and before percentage expansion.
- C5: No destructive schema migration without tested rollback path.
- C6: Production rollout must include feature flag kill switches for command/story paths.
- C7: Client UX cannot hard-fail when narrative service is degraded; fallback prose is mandatory.
- C8: Test evidence and docs updates are release artifacts, not optional cleanup.
- C9: Web runtime de-scope cannot break internal debugging visibility.
- C10: All week ranges map to concrete dates; gate reviews occur at fixed week ends.

## 5. Roadmap (Phases & Milestones)
Phase windows:
- Phase 0 (Alignment and Discovery): W1 (2026-02-23 to 2026-03-01)
- Phase 1 (Foundations): W1-W6 (2026-02-23 to 2026-04-05)
- Phase 2 (Core Delivery): W5-W13 (2026-03-23 to 2026-05-24)
- Phase 3 (Hardening and Launch): W12-W18 (2026-05-11 to 2026-06-28)
- Phase 4 (Iteration and Scale): W19-W20 (2026-06-29 to 2026-07-12)

| Phase | Timebox | Milestone | Deliverable | DoD (testable) | Dependencies | Owner | Notes |
|------:|---------|-----------|-------------|----------------|-------------|-------|------|
| 0 | W1 | M0 - Planning and Contract Freeze | Approved roadmap + v2 contracts + baseline snapshots | `PLAN.md`, `docs/contracts/canonical_state_v2.md`, and `docs/contracts/command_envelope_v1.md` approved; baseline test report committed | None | Tech Lead + PM | Validation: architecture review, baseline evidence. Type: Foundation |
| 1 | W1-W3 | M1 - Canonical State v2 Schema and Migration | Data Connect schema and adapters support v1 read/v2 write with explicit command identity model | Schema compiles, client codegen succeeds, migration tests pass, existing sync tests remain green, and command-vs-trigger representation is explicit (`eventType` discriminator or `CommandLog` table) | M0 | Backend Lead | Validation: `SyncProcess` + `SyncValidation` suite and schema review. Type: Foundation |
| 1 | W2-W4 | M2 - Command Transport API | `POST /api/sync/command` with auth/idempotency/reconcile semantics | Route tests pass for malformed payload, stale seq, replay id, mismatch, and success paths | M0, M1 | Backend Lead | Validation: route + behavior tests. Type: Product capability |
| 1 | W3-W6 | M3 - Deterministic Server Command Engine | Bundled server command engine from shared core | Fixed-seed replay on mixed streams returns identical `{seq,tick,stateHash}` across 100 runs | M1, M2 | Systems Engineer + Backend | Validation: determinism suite and failure-mode tests. Type: Quality |
| 2 | W5-W8 | M4 - Godot Command Terminal, Config, and Runtime CI | Godot command input/history/reconcile UX, generated config loader, and headless engine test runner in CI | Godot can submit commands, apply canonical updates, recover from reconcile-required responses, load runtime config from generated JSON, and pass headless in-engine tests in PR CI | M2, M3 | Godot Engineer + QA Lead | Validation: headless Godot CI, command contract tests, smoke script. Type: Product capability + Quality |
| 2 | W7-W9 | M5 - Story Integration with Safe Fallback | Godot story client wired to story start/poll and fallback renderer | Success/failure/timeout branches covered; no blank prose panel state in smoke tests | M4 | Backend + Godot Engineer | Validation: story handler tests + manual narrative flow. Type: Product capability |
| 2 | W8-W11 | M6 - Pixel Presentation MVP | Tilemap/sprite pipeline + 3-5 map hub + persistent HUD/terminal | Multi-map traversal + trigger interactions hold 60 FPS target on baseline machine | M4 | Godot Engineer + Content | Validation: map traversal checklist + FPS capture. Type: Product capability |
| 2 | W10-W13 | M7 - Canonical Combat, Inventory, Quest Depth | Server-authoritative progression systems integrated in loop | Full scenario test (explore -> encounter -> combat -> quest update -> save/load) passes deterministically | M3, M6 | Gameplay Engineer | Validation: scenario tests + save/load parity checks. Type: Product capability |
| 3 | W12-W14 | M8 - Web Runtime Re-scope to Tooling | Inspector/replay/hash timeline UI and dev-only gameplay flag | Tools display canonical stream accurately; production build excludes gameplay route by default | M2, M3 | Fullstack Engineer | Validation: tooling acceptance suite + README updates. Type: Operations |
| 3 | W13-W16 | M9 - Quality and Security Gate Buildout | Expanded CI (excluding already-landed Godot headless lane), nightly replay/load jobs, security controls documentation | CI stability >= 95% over 10 runs; security findings triaged with owners and due dates; Godot headless lane has been green since Alpha | M5, M7, M8 | QA Lead + DevOps + Backend | Validation: CI dashboard + security review output. Type: Quality |
| 3 | W16-W17 | M10 - Staging Reliability Soak | Staging runbook executed with replay parity and auth/reconnect stress cases | 100-run parity passes, reconnect/reconcile smoke passes, rollback drill succeeds | M9 | Release Manager + DevOps | Validation: staging sign-off packet. Type: Operations |
| 3 | W18 | M11 - Internal Canary Release | Internal users on production path with telemetry and on-call coverage | Canary guardrails hold for 5 consecutive days with no unresolved Sev-1/Sev-2 | M10 | Tech Lead + SRE | Validation: canary report and on-call incident log. Type: Operations |
| 4 | W19 | M12 - Limited Percentage Rollout | Controlled external rollout by feature flag percentage | Guardrails hold at each percentage step and rollback tested once live | M11 | SRE + PM | Validation: rollout gate checklist. Type: Operations |
| 4 | W20 | M13 - Full Rollout and Post-Launch Handoff | Full release plus post-launch operating playbook | GA complete; backlog triaged for Phase 5; runbooks and ownership finalized | M12 | Tech Lead + PM + DevOps | Validation: GA review and handoff package. Type: Operations |

### Milestone Work Package Detail
| Milestone | Work packages (must complete) | Required test/evidence | Exit artifact |
|-----------|-------------------------------|------------------------|---------------|
| M0 | Baseline tests, contract draft review, dependency map, decision log initialization | Baseline command outputs and smoke notes committed | Signed-off roadmap + contract docs |
| M1 | Schema extension, codegen, adapter dual-read/write, migration-on-write path, explicit command representation decision (`eventType` enum vs `CommandLog` table) and query plan | `tests/unit/SyncProcess.test.js`, `tests/unit/SyncValidation.test.js`, schema diff review notes | Migration ADR + compatibility notes + command schema decision record |
| M2 | API route wiring, request validation, idempotency storage check, response envelope standardization | `tests/unit/ApiRouterSyncRoutes.test.js`, `tests/unit/SyncCommandRoutes.test.js` | Command API contract doc |
| M3 | Engine bundling script, command parser wrapper, deterministic state transitions, parity harness | `tests/unit/SyncCoreDeterminism.test.js` + 100-run replay output | Determinism validation report |
| M4 | Godot terminal scene updates, request in-flight disable/enable state, error rendering, reconcile branch UX, `ConfigLoader.gd` reading generated `godot/data/config.json`, headless Godot runner in CI replacing string-only regex confidence | Headless Godot test run (exit 0/1), `tests/unit/GodotCommandContract.test.js`, manual checklist | Godot command UX spec + Godot runtime test harness doc |
| M5 | Story client wrappers, polling loop, timeout handling, fallback prose templates, suggestion rendering | `tests/unit/HandlersNarrate.test.js` + flow script | Narrative fallback playbook |
| M6 | Tilemap ingestion, sprite integration, hub map data, HUD panel updates, perf instrumentation | FPS capture + map traversal logs | Art/content MVP manifest |
| M7 | Command verb set lock, combat transition wiring, inventory mutation, quest state transitions, save/load parity | End-to-end scenario suite + parity snapshots | Gameplay progression contract |
| M8 | Replay inspector, hash timeline view, run diff tooling, web gameplay dev flag path | Tooling UI acceptance checklist | Web tooling scope doc |
| M9 | CI matrix hardening, nightly load tests, security checklist, retry/error-budget docs, telemetry endpoint SLO review | CI pass history + security issue register + telemetry ingest health report | Quality gate packet |
| M10 | Staging soak execution, auth expiry tests, reconnect storm tests, rollback rehearsal | Staging sign-off report | Release readiness report |
| M11 | Canary enablement, alert tuning, on-call drills, incident templates | 5-day canary metrics + incident summary | Canary decision memo |
| M12 | Percentage ramp plan execution (10%->25%->50%), live rollback verification | Rollout dashboard snapshots | Rollout gate approvals |
| M13 | 100% enablement, postmortem, backlog re-prioritization, ownership handoff | GA review notes + runbook links | Phase closeout dossier |

### Phase Gate Criteria
| Gate | Target date | Pass criteria | Fail action | Owner |
|------|-------------|---------------|-------------|-------|
| Alpha | 2026-04-19 | M0-M4 complete; command loop and reconcile UX proven | Freeze new scope, extend Phase 1 by up to 1 week, cut non-critical content | Tech Lead |
| Beta | 2026-05-31 | M5-M8 complete; full gameplay loop deterministic; tooling baseline ready | Remove low-priority content, shift rollout by one sprint | PM + Tech Lead |
| RC | 2026-06-28 | M9-M10 complete; security and staging soak pass | Block canary, run remediation sprint | Release Manager |
| GA | 2026-07-12 | M11-M13 complete; guardrails stable during ramp | Hold at safe rollout percentage and execute rollback if needed | SRE + Tech Lead |

## 6. Dependencies & Critical Path
Dependency matrix:
| Dependency | Needed by | Risk if late | Mitigation owner | Latest safe week |
|------------|-----------|--------------|------------------|------------------|
| Canonical state v2 contract approval | M1, M2, M3 | Schema/API churn and rework | Tech Lead | W1 |
| Data Connect schema deploy window | M1 | Blocks migration and command event persistence | Backend Lead | W3 |
| Shared game-core server bundle stability | M3, M7 | Determinism and progression blocked | Systems Engineer | W6 |
| Headless Godot CI harness operational in PR lane | M4, M5, M6, Alpha gate | Runtime regressions missed by regex-only checks | QA Lead + Godot Lead | W6 |
| Generated shared runtime config available to Godot | M4, M5, M11 | Environment drift between Web and Godot behavior | Fullstack Lead | W7 |
| Telemetry ingestion endpoint and batching protocol defined | M4, M9, M11 | Godot client remains opaque during Alpha/Canary incidents | Backend Lead | W7 |
| Godot command UX integration bandwidth | M4, M5, M6 | Delays Alpha and Beta gates | Godot Lead | W8 |
| Command verb set freeze | M7, M5 | Narrative suggestions become invalid | Gameplay Lead | W10 |
| Tooling data model lock | M8 | Inspector/replay mismatch with production payloads | Fullstack Lead | W12 |
| Security review availability | M9, M10 | Canary delayed despite feature readiness | Security Owner | W15 |
| Staging environment parity with prod | M10, M11 | Canary findings become unreliable | DevOps | W16 |

Critical path (with practical slack):
1. M0 -> M1 -> M2 -> M3 -> M4 -> M7 -> M9 -> M10 -> M11 -> M12 -> M13.
2. Near-critical branch: M5 must complete by W14 to avoid M9 slip.
3. Optional compression lever: trim map breadth in M6 to preserve M7/M9 schedule.

Cross-team integration checkpoints:
- End of W4: backend contract checkpoint (M1 + M2).
- End of W8: Godot end-to-end checkpoint (M4 + early M5).
- End of W13: progression and tooling checkpoint (M7 + M8).
- End of W17: release readiness checkpoint (M10).

## 7. Risks & Mitigations
| Risk | Category | Probability | Impact | Mitigation | Contingency | Trigger / Leading indicator | Owner |
|------|----------|-------------|--------|------------|-------------|-----------------------------|-------|
| Determinism drift in command execution | Technical | Medium | Critical | Shared engine bundle + fixed-seed replay in CI | Freeze deploys, run parity diff triage swarm | Any replay mismatch in staging or nightly | Systems Engineer |
| Scope creep in content/UI | Scope | High | High | Verb freeze by W10, map cap fixed at 3-5 | Defer non-core content to post-GA | New unplanned features after Beta lock | PM |
| Godot/backend interface churn | Coordination | Medium | High | Contract tests and weekly integration demos | Temporary adapter layer with strict deprecation date | Same interface broken in 2 consecutive sprints | Tech Lead |
| Story service instability | Reliability | Medium | Medium | Timeout budget + deterministic fallback lines | Auto-disable story calls by flag and keep gameplay live | Fallback usage > 5% for 3 days | Backend Lead |
| Prompt/log data leakage | Security/Privacy | Low | Critical | Redaction rules, least-privilege logging, pre-canary security review | Pause rollout and rotate credentials | Unresolved high-severity security finding at M9 | Security Owner |
| CI instability from heavier suites | Delivery | Medium | Medium | Separate fast PR lane and nightly heavy lane | Temporarily gate heavy suites nightly only | PR lane flakiness > 5% over 1 week | QA Lead |
| Single-owner bottlenecks | People | Medium | High | Backup ownership and paired reviews on critical modules | Reassign sprint scope and protect critical path tasks | Any critical task blocked > 3 business days | Engineering Manager |
| Live rollout incident response gaps | Operations | Low | Critical | On-call drills and prewritten runbooks before canary | Roll back to last stable flag percentage | Sev-1 with no response within SLA | SRE |

## 8. Metrics (Success + Guardrails)
### Metric Catalog
| Metric | Type | Definition | Source | Cadence | Owner | Target / Alert |
|--------|------|------------|--------|---------|-------|----------------|
| Session completion rate | Outcome | Completed playable loop sessions / started sessions | Analytics events | Weekly | PM | Target >= 70% by canary end |
| Command adoption | Outcome | Sessions with >= 3 accepted commands / active sessions | Sync event stream | Weekly | Product Analyst | Target >= 60% |
| Story continuity score | Outcome | Internal playtest rubric average (1-5) | Playtest forms | Biweekly | Narrative Lead | Target >= 4.0 |
| Milestone on-time rate | Output | Milestones delivered by planned week | Plan ledger | Weekly | PMO/PM | Target >= 85% |
| New path test coverage delta | Output | Coverage increase on touched modules vs baseline | Coverage reports | Weekly | QA Lead | Target +25% |
| Determinism replay pass rate | Output | Successful identical replay runs / total runs | Replay harness | Nightly | Systems Engineer | Target 100% |
| Godot headless runtime test pass rate | Output | Passing headless Godot in-engine test jobs / total Godot CI jobs | CI pipeline | Per PR + daily summary | QA Lead | Target 100%, Alert < 98% over 3 days |
| `/api/sync/command` p95 latency | Guardrail | p95 server response time under expected load | APM traces | Daily | Backend Lead | Alert > 350 ms |
| Sync error rate | Guardrail | Failed sync requests / total sync requests | API logs | Daily | SRE | Alert > 1.0% |
| State hash divergence rate | Guardrail | Divergence incidents / total run comparisons | Replay inspector | Daily | Systems Engineer | Alert > 0 in staging, > 0.1% prod |
| Story fallback rate | Guardrail | Story fallback responses / story attempts | Story service logs | Daily | Backend Lead | Alert > 5% |
| Godot telemetry ingest success rate | Guardrail | Accepted telemetry batches / sent telemetry batches | Telemetry endpoint logs | Daily | Backend Lead | Alert < 99% |
| Infra cost delta | Guardrail | Cost vs pre-command baseline for equivalent usage | Billing dashboard | Weekly | DevOps | Alert > +20% |
| Incident MTTR | Guardrail | Mean time to recover for Sev-1/2 incidents | Incident tracker | Weekly | SRE | Alert > 60 minutes |

### Instrumentation Backlog (must be done by W12)
- Add command result reason codes for rejected requests.
- Add reconcile cause telemetry buckets.
- Add story timeout classification tags.
- Add run replay hash checkpoint sampling per phase of play.
- Add rollout stage tag to all relevant operational metrics.
- Add Godot telemetry payload schema with client/session/build tags.
- Add config checksum metric to detect runtime config drift between Godot and Web.

## 9. Resourcing & Operating Model
### Role Allocation
| Role | Effective FTE | Primary responsibility | Backup responsibility |
|------|----------------|------------------------|-----------------------|
| Tech Lead | 1.0 | Architecture, critical path decisions, gate approvals | Release readiness review |
| Backend Engineer | 1.0 | Sync routes, migration, story integration | Load/security fixes |
| Systems Engineer | 0.7 | Determinism engine and replay harness | Backend incident triage |
| Godot Engineer | 1.0 | Client UX, command terminal, gameplay integration | Tooling integration support |
| Fullstack/Tools Engineer | 1.0 | Replay inspector, web tooling, docs updates | QA automation support |
| QA Automation | 0.5 | Test matrix, regression automation, gate evidence | Release checklist support |
| DevOps/SRE | 0.3 | CI reliability, rollout, monitoring, on-call prep | Incident response |
| Narrative/Content | 0.5 | Story prompts, fallback prose, quest seed curation | Playtest analysis |
| PM | 0.5 | Prioritization, milestone governance, stakeholder updates | Risk tracking |

### Operating Cadence
| Cadence item | Frequency | Inputs | Outputs | Owner |
|--------------|-----------|--------|---------|-------|
| Sprint planning | Weekly | Risk register, dependency status, failed tests | Updated milestone commitments | PM + Tech Lead |
| Integration demo | Biweekly | Latest staging build and test evidence | Go/no-go for next phase tasks | Tech Lead |
| Contract review | Weekly through W10 | API/schema diffs, failing contract tests | Approved interface changes only | Backend Lead + Godot Lead |
| Risk review | Weekly | Triggers, incidents, staffing changes | Updated mitigation actions | PM |
| Gate review | End of W8/W14/W18/W20 | Gate checklist and metric pack | Advance/hold decision | Release Manager |
| Incident drill | Twice before canary | Runbooks and alert routing | MTTR validation and runbook fixes | SRE |

### Required Artifacts by Milestone
| Milestone | Mandatory artifact |
|-----------|--------------------|
| M0 | Roadmap + dependency map + baseline report |
| M1 | Migration ADR + schema compatibility notes |
| M2 | Command envelope contract and API examples |
| M3 | Determinism report with replay evidence |
| M4 | Godot command UX behavior spec |
| M5 | Story fallback playbook |
| M7 | Progression contract and scenario matrix |
| M9 | Quality/security gate packet |
| M10 | Staging readiness packet |
| M11-M13 | Rollout logs, incident summary, GA closeout |

Execution rules:
- Definition of Ready: owner, dependency, DoD test, and rollback plan identified.
- Definition of Done: merged code, passing tests, updated docs, and linked evidence.
- Blocking rule: no milestone closes with unresolved Sev-1 or critical determinism defect.

## 10. Decision Log
| Decision | Date | Rationale | Alternatives considered | Revisit trigger |
|----------|------|-----------|-------------------------|-----------------|
| Godot is the primary gameplay runtime | 2026-02-23 | Best fit for desired exploration UX and current vertical slice trajectory | Keep React as primary runtime | Revisit if Alpha misses by > 2 weeks |
| AI scope is narrative and quest flavor only | 2026-02-23 | Preserves deterministic mechanics and balancing control | AI-generated rules and combat systems | Revisit after 8 weeks stable post-GA metrics |
| Canonical online state is required for progression | 2026-02-23 | Ensures replayability, observability, and consistent saves | Client-authoritative state | Revisit if guardrails cannot be met by RC |
| Legacy trigger routes remain during migration | 2026-02-23 | Lowers migration risk and protects old runs | Hard cutover to command-only | Revisit when command route reaches >= 95% usage for 4 weeks |
| Web gameplay path becomes dev-only | 2026-02-23 | Focuses team on one production client while preserving debug value | Keep dual production clients | Revisit if tooling users require direct browser play |
| Rollout must be staged with feature flags | 2026-02-23 | Limits blast radius for sync or data regressions | Big-bang launch | Revisit only if deployment architecture changes |
| Scope flex is preferred over schedule slip | 2026-02-23 | Protects fixed release horizon and stakeholder expectations | Extend release date to keep all scope | Revisit if critical path blockers remain unresolved by W16 |
| Determinism and security defects are release blockers | 2026-02-23 | Core trust and safety requirement | Ship with known issues and patch later | Revisit never unless product strategy changes materially |

## 11. Open Questions
| Open question | Decision deadline | Interim assumption | Risk if assumption is wrong | Owner |
|---------------|-------------------|--------------------|-----------------------------|-------|
| Should v2 use `RunEvent.eventType` discriminator only, or introduce a dedicated `CommandLog` table? | 2026-03-06 | Start with explicit discriminator; promote to `CommandLog` if query/ops complexity remains high | Debugging complexity and slower deprecation of trigger-era semantics | Backend Lead + Tech Lead |
| Can we guarantee a dedicated Godot engineer through W14? | 2026-03-06 | Yes | Alpha/Beta slip due to integration bottleneck | Engineering Manager |
| Is AI model quota and budget approved for canary and limited rollout? | 2026-03-13 | Yes, with monitoring | Story feature throttling or disabled in rollout | PM + Backend Lead |
| Is the Data Connect schema deployment window fixed and rollback-capable? | 2026-03-06 | Yes | Migration delay affecting M1-M3 critical path | Backend Lead |
| Do we have security reviewer allocation for W15-W18 gates? | 2026-04-24 | Yes | RC slip despite feature readiness | Security Owner |
| What baseline machine profile defines the 60 FPS acceptance target? | 2026-03-20 | Current dev desktop profile | Ambiguous perf gates and rework | Godot Lead |
