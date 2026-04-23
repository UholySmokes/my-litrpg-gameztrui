# Magic Physics System Readiness & Multi-Platform Verification
## Status: IN PROGRESS - BlackboxAI Assessment [2026-04-XX]

### 0. Information Gathered (from file analysis)
- Magic physics simulation exists (`magic_physics_sim.js/.cjs`) but **broken** (CJS require in ESM repo).
- Backend API routing exists (`functions/lib/api-router.js`, `scripts/dev-api-server.mjs`) with Firebase/Supabase deps.
- Android toolchain fully scripted (`scripts/android-preflight.mjs`, `scripts/export-godot-android.mjs`) with Godot 4.6 export presets.
- Web dev server ready (`npm run dev`, Vite port 5173).
- Simulation/game tests exist (`npm test:smoke`, `npm run simulate`).
- No active "lvl 7" browser verification or specific backend failure logs found.

### 1. Detailed Plan (File-Level)
**A. Fix Magic Physics Engine (Priority 1)**
- Convert `magic_physics_sim.js` to valid ESM (dynamic import for CJS deps or full rewrite).
- Update `package.json` scripts: `simulate` → `simulate:cjs` fallback.
- Run `npm run simulate` + verify `magic_physics_results_*.json`.

**B. Backend Health Check & Fix (Priority 2)**
- Run `npm run dev:api` + `npm run test:smoke` to surface exact backend issue.
- Patch failing routes/configs in `functions/lib/*` (likely auth/DB).
- Verify Firebase/Supabase connection.

**C. Android Readiness (Priority 3)**
- Run `npm run android:preflight`.
- Export test APK: `npm run android:export:singleplayer`.

**D. Browser Playtest to Level 7 (Priority 4)**
- Run `npm run dev` → http://127.0.0.1:5173.
- Manual verification: char creation → lvl1 → fight/XP → lvl7 progression.
- Capture console/network logs for failures.

**E. Final Verification**
- Run `npm run check` suite.
- Update docs/ with status report.

### 2. Dependent Files to Edit
| Category | Files |
|----------|-------|
| Magic Sim | `magic_physics_sim.js`, `package.json` (scripts) |
| Backend | `functions/lib/api-router.js`, `scripts/dev-api-server.mjs`, `firebase.json`/`firestore.rules` |
| Android | None (scripts ready) |
| Docs/Tracking | `TODO.md`, `progress.md`, `docs/MAGIC_PHYSICS_LORE.md` |
| Tests | `tests/unit/*` if backend regressions |

### 3. Execution Steps (Checklist - Update on completion)
- [ ] **Step 1**: Fix `magic_physics_sim.js` ESM → run sim.
- [ ] **Step 2**: Backend smoke (`npm run dev:api && npm run test:smoke`).
- [ ] **Step 3**: Android preflight/export test.
- [ ] **Step 4**: Browser dev server + manual lvl7 playtest.
- [ ] **Step 5**: Full `npm run check` + lint/test.
- [ ] **Step 6**: Generate summary report + `attempt_completion`.

### 4. Follow-up Steps
| Step | Commands |
|------|----------|
| Installs | `npm ci` if deps drift |
| Testing | `npm run test:smoke`, `npm run validate:*` suite |
| Deployment | `npm run android:export:*` for real builds |
| Reporting | Update `progress.md`, `TEST_REPORT.md` |

**Proceeding step-by-step. Current: Awaiting sim fix approval/confirmation.**
