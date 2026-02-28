# Project Health & Integrity Report

## Executive Summary
This report reflects the current repository state as of 2026-02-28.

Overall health moved from critical failure to controlled risk:
- Backend route handlers are present.
- Godot export presets are present.
- Workspace dependencies are installed.
- Worldbuilding integrity checks are passing in strict mode.

**Overall Health Status**: MODERATE (buildable and testable, with cleanup/documentation debt).

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

---

## 2. Active Risks

### High: Environment Variable Documentation Drift
- `functions/lib/narrate-runs-store.js` supports `NARRATE_RUN_TTL_MS`, but `functions/.env.example` does not document it.
- Root `.env.example` does not document tracing-related variables used by observability initialization.
- Risk: Operators do not have a complete contract for runtime configuration.
- Recommendation: Add explicit variable docs and defaults in both `.env.example` files.

### Medium: Functions Runtime Source-of-Truth Is Ambiguous
- `functions/package.json` uses CommonJS `main: index.js`.
- `functions/tsconfig.json` targets `outDir: lib`.
- `functions/src/` has limited TypeScript surface (`index.ts`, `genkit-sample.ts`) while core API runtime lives in `functions/lib/*.js`.
- Risk: Unclear ownership between TS and JS paths can cause accidental breakage during refactors/build scripting.
- Recommendation: Choose one canonical runtime path:
  - Option A: full TS source in `src/` with generated `lib/`.
  - Option B: JS runtime in `lib/` and remove conflicting TS compile assumptions.

### Low: Python Packaging Hygiene
- `user_agent/requirements.txt` is absent.
- Risk: Future non-stdlib additions can become implicit and non-reproducible.
- Recommendation: add `requirements.txt` (empty is acceptable) or remove dependency-check logic in Docker path if intentionally stdlib-only.

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
| Backend (Firebase Functions) | Stable with config debt | Runtime handlers restored; env docs incomplete. |
| Game Engine (Godot) | Stable | `export_presets.cfg` present again. |
| Shared Packages (`game-core`, `game-schemas`) | Stable | Worldbuild validation and targeted tests passing. |
| Tooling/Docs | Needs cleanup | Health doc previously stale; env contracts need updates. |

---

## 5. Prioritized Next Actions

1. Update `functions/.env.example` and root `.env.example` with full runtime and tracing variable contracts.
2. Decide and document the canonical `functions/` runtime architecture (JS-first vs TS-first), then align scripts/files accordingly.
3. Add `user_agent/requirements.txt` (or remove Docker check) to make Python runtime intent explicit.
4. Add a lightweight CI check that fails if critical infra files disappear (`functions/lib/handlers.js`, `godot/export_presets.cfg`).
