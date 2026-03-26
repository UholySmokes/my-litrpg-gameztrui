# Swarm Consensus Review (2026-03-26)

> Skill used: `swarm` (repo-wide review orchestration)

## Executive summary
The repo is already a serious multi-surface LitRPG platform (web, Godot, API, simulation) with strong deterministic and contract-first foundations. The highest-ROI next steps are not net-new mechanics; they are finishing incomplete integration edges and reducing release polish debt.

## Repository mapping and intent inference
- **Core gameplay truth:** `packages/game-core/src`.
- **Web runtime:** `src/` with shell orchestration in `GameUIRoot`.
- **API/runtime contracts:** `functions/lib` + route table.
- **Native runtime:** `godot/` with generated config and content subsets.

Inferred product direction: one canonical deterministic RPG state model surfaced across web + Godot, with AI narrative layered safely on top.

## Coverage summary
This sweep covered:
- Architecture and contracts (`README.md`, `docs/REPO_MAP.md`, `PLAN.md`).
- Runtime orchestration (`src/App.jsx`, `src/components/gameui/GameUIRoot.jsx`).
- Test/validation posture (`package.json`, scripts, smoke/quality commands).
- Completion debt docs (`progress.md`, `docs/ART_ASSET_LIST.md`, archetype framework design doc).

Checks run during review:
- `npm run validate:repo-hygiene` ✅
- `npm run test:smoke` ⚠️ (missing local dependency bootstrap in environment)

## Evidence-backed top issues
1. **Local narration contract mismatch in local-play path**
   - `progress.md` notes proxied narrator returns `401` for local dev headers and falls back to offline narrative.
2. **Placeholder visual assets still not fully replaced**
   - `docs/ART_ASSET_LIST.md` marks final replacement as still open.
3. **Godot canonical archetype alignment still unfinished**
   - `docs/plans/2026-03-14-archetype-system-framework-design.md` calls out Godot divergence and required canonical subset generation/migration.
4. **Ignored Jest suites indicate deferred regression coverage debt**
   - `package.json` has explicit `testPathIgnorePatterns` for multiple suites.
5. **Bootstrap fragility for local verification commands**
   - smoke commands hard-fail when `node_modules` are absent.

## Ranked recommendations (consensus shortlist)

### 1) Fix local narration auth path for dev/local mode
- Player impact: high (restores true narrative path during local validation).
- Effort: small/medium.
- Risk: low.
- Validation: local-play smoke with auth header assertions.

### 2) Complete placeholder-to-production art replacement
- Player impact: high (perceived quality).
- Effort: medium/large.
- Risk: medium.
- Validation: placeholder-count gates + visual regression snapshots.

### 3) Finish Godot canonical subset generation + migration mapping
- Player impact: medium/high (cross-platform consistency).
- Effort: medium.
- Risk: medium.
- Validation: generated subset snapshot tests + save migration fixtures.

### 4) Reintegrate or formally retire ignored tests
- Player impact: medium (fewer hidden regressions).
- Effort: medium.
- Risk: low/medium.
- Validation: move recovered suites into smoke/CI lanes or replace with deterministic narrower suites.

### 5) Add dependency/bootstrap preflight to core test commands
- Player impact: indirect but meaningful via faster QA iteration.
- Effort: small.
- Risk: low.
- Validation: run in fresh clone and verify actionable setup output.

## Implementation order (dependency-aware)
1. Local narration auth fix.
2. Test/bootstrap preflight guard.
3. Re-enable/retire ignored tests.
4. Godot canonical subset sync.
5. Placeholder art replacement completion wave.

## Risks / blockers / unknowns
- Current environment lacks installed `node_modules`, limiting full smoke verification.
- Unknown whether local narration `401` behavior differs in staging/prod auth config.
- Cross-runtime content migration risk remains until canonical subset pipeline is fully enforced.

## Rejected ideas
- Large new feature additions before completion debt burn-down (rejected: low ROI this cycle).
- Broad architecture rewrite (rejected: architecture is already coherent; enforcement/completion is the gap).

## Consensus call
The swarm recommendation is to prioritize **completion and consistency hardening** over new feature expansion for the next delivery cycle.
