# Project Health & Integrity Report

## Executive Summary
This report reflects the current repository state as of 2026-02-28.

Overall health moved from critical failure to controlled risk:
- Backend route handlers are present.
- Godot export presets are present.
- Workspace dependencies are installed.
- Worldbuilding integrity checks are passing in strict mode.

**Overall Health Status**: LOW (buildable, testable, and guarded by runtime/config integrity checks).

---

## 1. Resolved Blockers

### Backend Handler Availability (Resolved)
- Location: `functions/lib/handlers.js`
- Current state: File exists and exports expected handlers used by `functions/lib/api-router.js`.
- Result: Prior `MODULE_NOT_FOUND` startup risk for API routing is removed.

### Godot Export Presets (Resolved)
- Location: `godot/export_presets.cfg`
- Current state: File exists (restored from backup during remediation).
- Result: Build tooling that depends on export presets can run again.

### Dependency Presence (Resolved for current workspace)
- `node_modules` exists at repo root and in `functions/`.
- Result: Local runtime/test setup is no longer blocked by missing installs.

### Environment Example Coverage (Resolved)
- `functions/.env.example` now documents narrate-run variables:
  - `NARRATE_RUNS_COLLECTION`
  - `NARRATE_RUNS_FILE_PATH`
  - `NARRATE_RUN_TTL_MS`
- Root `.env.example` now documents tracing variables:
  - `TRACE_ENABLED`
  - `OTEL_TRACES_ENABLED`
  - `OTEL_EXPORTER_OTLP_ENDPOINT`

### Python Requirements Baseline (Resolved)
- `user_agent/requirements.txt` now exists.
- Result: Dockerized Python path has explicit dependency baseline, even when currently stdlib-only.

### Runtime Architecture Ownership (Resolved)
- Canonical runtime path is now explicitly documented as JS-first:
  - `functions/index.js` (entrypoint)
  - `functions/lib/**/*.js` (API routing and handlers)
- Documentation added in `docs/FIREBASE_QUICKSTART.md` under "Runtime Ownership (Functions)".
- CI/runtime guard added to detect contract drift before merge.

---

## 2. Active Risks

No active structural blockers identified in this pass.

---

## 3. Worldbuilding Integrity Snapshot

Validation evidence:
- `npm run validate:worldbuild:strict`: PASS (2026-02-28)
- `npm test -- tests/unit/WorldbuildIntegrityAudit.test.js tests/unit/SkillRegistryCanonicalization.test.js`: PASS

Current integrity metrics (`audit_worldbuild_metrics.json`):
- `classesMissingSkills`: `[]`
- `skillOwnersNotClassOrReserved`: `[]`
- `missingRecipeIngredientCount`: `0`
- `missingRecipeResultCount`: `0`
- `missingQuestFavoredClassCount`: `0`
- `missingQuestRewardItemCount`: `0`
- `manifestMismatchCount`: `0`

Note:
- `itemCount` is currently elevated by recipe-driven placeholder generation. This is valid for integrity closure but should be tracked so placeholders do not leak into player-facing balance/economy systems.

---

## 4. Component Status Matrix

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend (React/Vite) | Stable | No immediate blocker found in this pass. |
| Backend (Firebase Functions) | Stable | Runtime ownership documented, env docs updated, runtime contract guard in place. |
| Game Engine (Godot) | Stable | `export_presets.cfg` present again. |
| Shared Packages (`game-core`, `game-schemas`) | Stable | Worldbuild validation and targeted tests passing. |
| Tooling/Docs | Strong | `functions/src` template-only status explicitly annotated; runtime ownership now clear in-code and in docs. |

---

## 5. Prioritized Next Actions

1. Expand runtime/env guard scripts if additional required infra files or env keys are introduced.
2. Continue reducing placeholder item footprint through authored item replacement workflow.
   - Workflow command: `npm run report:worldbuild:placeholders`
   - Output: `docs/reports/placeholder_item_curation_queue.json` + dated markdown summary
