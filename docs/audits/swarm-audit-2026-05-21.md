# Void-Verse Codebase Audit — 2026-05-21

## Executive Summary

Void-Verse is a **LitRPG narrative engine** targeting browser (React 19/Vite) and native (Godot 4) delivery with a shared deterministic game-core package. The project's architecture is sound—reducer-driven state, a SystemEngine facade, seeded PRNG for replay, and a clean content-registry pattern. However, **the production build is currently broken**, 40 of 170 test suites fail, and several backend modules reference missing files. The codebase is mid-rewrite (runic shell replacement of the old WindowManager UI), which is structurally complete but has introduced import path errors and left integration seams unresolved.

---

## Game-Intent Inference

The project is building toward a **single-player text-driven RPG with systemic depth**: 55 races with evolution paths, 16+ classes across tiers, archetype frameworks (Systems/Authorities/Paths/Frameworks/Privileges/Overlays), magic physics, skirmish combat with lane positioning, profession/crafting/prestige, and AI-generated narration. The target shipped product is a polished browser RPG with optional cloud saves and a parallel Godot native client.

---

## Repo Coverage Summary

| Area | Files | LOC (approx) | Health |
|------|-------|--------------|--------|
| `packages/game-core/src/` | 160 | 7,250 | Core logic solid; 1 TODO (loreReqs) |
| `src/` (React web) | 272 | 20,350 | **Build broken**; shell rewrite 95% done |
| `functions/` | 44 | ~8,000 | **Missing modules** (`supabase.js`, `cors.js`) |
| `tests/` | 172 | ~12,000 | 40/170 suites failing |
| `godot/` | 364 files | N/A | Config generation scripted; not runtime-tested here |

---

## Critical Issues (Must Fix Now)

### 1. Production Build Broken — Missing ProgressBar Import

**Evidence:** `src/components/shell/AdventureShell.jsx:2`
```
import ProgressBar from "../../ui/ProgressBar.jsx";
```
File exists at `src/components/ui/ProgressBar.jsx`. From `src/components/shell/`, the correct relative path is `../ui/ProgressBar.jsx`.

**Additionally:** `src/components/ui/ProgressBar.jsx` has corruption:
- Line 1: `1import React from 'react';` (stray `1` prefix)
- Line 23: `ie` (stray garbage text)

**Impact:** `npm run build` fails. No production deployment possible.
**Fix effort:** 5 minutes.

---

### 2. Missing Backend Modules — `functions/lib/supabase.js` and `functions/lib/cors.js`

**Evidence:** `functions/lib/game-db.js:2` requires `./supabase` which does not exist anywhere in `functions/`. Similarly, tests reference `functions/lib/cors.js` which is absent.

**Impact:** 10+ API/sync test suites crash on import. Backend cannot boot if Supabase backend path is selected.
**Fix effort:** Create stub modules or implement the contracts.

---

### 3. Combat System Routing — `startCombat` Always Delegates to Skirmish

**Evidence:** `packages/game-core/src/systems/combat/CombatSystem.js:671-674`
```js
export function startCombat(state, enemyIds) {
  if (Array.isArray(enemyIds) && enemyIds.length > 0) {
    return startSkirmishCombat(state, enemyIds);
  }
```
The traditional `startCombat` path (lines 678+) is **dead code** — any non-empty array triggers the skirmish path. This causes:
- `ReducerRegressionGuards.test.js` lane ordering mismatch (`[2,1,3,2,1]` vs expected `[1,2,3]`)
- `critical-path.test.js` expecting 1 enemy but receiving 3 (skirmish encounter pool)
- `LevelingAndCombat.test.js` damage/cooldown assumptions broken

**Impact:** Core gameplay loop tests all fail; combat feel may differ from design intent.
**Fix effort:** 1-2 hours — either fix the guard condition or update tests to skirmish semantics.

---

### 4. Skill Engine Profiles Incomplete — Magic Tagging Missing

**Evidence:** `tests/unit/UnifiedAbilityEngine.test.js` fails because:
- `getSkillById("mage_fireball")?.magicProfile` is `undefined`
- Skills lack `engineProfile.family === "magic"` tags

**Impact:** Caster class validation fails; magic-combat integration incomplete.
**Fix effort:** 2-4 hours — populate `magicProfile` and `engineProfile` fields on relevant skills in the catalog.

---

### 5. World Registry Content Drift

**Evidence:** `tests/unit/WorldRegistryRuntime.test.js` — location `skydocks_drydock_seven` is `null`, faction/zone summaries have extra fields vs `objectContaining` expectations.

**Impact:** World exploration features may resolve to null locations; onboarding quests referencing missing landmarks.
**Fix effort:** 1-2 hours — sync authored world data with test expectations or backfill missing locations.

---

## High-Value Upgrades (Finish Next)

### 6. loreReqs Evolution Gating Unimplemented

**Evidence:** `packages/game-core/src/core/reducer/progressionActionHandlers.js:65`
```js
// TODO: Check loreReqs (faction rep, quest flags, etc.)
```
Class evolution currently ignores faction reputation, quest completion, and item ownership requirements.

**Impact:** Players can evolve classes without meeting lore prerequisites — trivializes progression.
**Fix effort:** 4-6 hours.

---

### 7. Magic Refine/Purge Actions Broken

**Evidence:** `tests/unit/ActionDispatcher.test.js:443` — `magic_refine` returns `success: false`; `magic_purge` doesn't reduce taint.

**Impact:** Magic system's essence weaving loop (draw → refine → cast) is non-functional.
**Fix effort:** 2-4 hours — trace `ActionDispatcher` routing for `magic_refine` type.

---

### 8. Quest Seeding Order Changed

**Evidence:** `tests/unit/GameSystems.test.js:44` — `generateInitialQuests` now returns `bq_system_basics` second instead of `bq_first_conflict`.

**Impact:** Tutorial onboarding sequence differs from design spec; first-play experience may confuse players.
**Fix effort:** 30 minutes — either update test or fix quest ordering in QuestManager.

---

### 9. Ignored Test Suites Creating Hidden Risk

**Evidence:** `package.json` `testPathIgnorePatterns` excludes:
- `tests/skillEffects.test.js`
- `tests/endToEndEffects.test.js`
- `tests/magnitudeCapsFusion.test.js`

These likely cover skill effect application, end-to-end combat chains, and magnitude cap fusion — core balance systems.

**Impact:** Regressions in effect stacking, damage caps, and fusion mechanics go undetected.
**Fix effort:** 2-4 hours — fix or formally retire each.

---

### 10. Deterministic Combat Values Drifted

**Evidence:** `LevelingAndCombat.test.js:100` — expected enemy HP after attack is 9, actual is 11. `executeSkill` returns 0 damage for STR-scaled physical skills.

**Impact:** Damage formula or stat resolution changed without updating tests; balance tuning unreliable.
**Fix effort:** 1-2 hours — verify stat resolution pipeline and update golden values.

---

## Stretch Additions (D-tier)

### 11. Chronicle Progress Tracker

The `syncChronicleProgress` system exists and fires in `GameUIRoot.jsx:622` but the chronicle data model appears thin. Adding visible per-session milestone achievements (first kill, first quest, first evolution) would strengthen the "shipped RPG" feel.

### 12. Offline-First Narrative Fallback Polish

Local-play mode uses an offline narrative fallback when the API returns 401. The fallback text generation could be enriched with template variety tied to player context (location, quest state, combat result).

### 13. PWA Install Prompt Timing

Currently gated on `shouldShowHub && hasHubInteracted`. Could delay further until the player has completed at least one adventure turn, reducing friction on first visit.

---

## Rejected Ideas

| Idea | Reason |
|------|--------|
| Add multiplayer/co-op | No networking infrastructure beyond save sync; massive scope |
| Migrate entirely to Supabase | Backend module doesn't even exist yet; Firebase is functional |
| Rewrite game-core in TypeScript | Only 2 `.ts` files exist in core; JS + Zod schemas work fine |
| Add 3D rendering to web client | Contradicts text-RPG design intent |

---

## Ranked Recommendations

| # | Title | Category | Effort | Risk |
|---|-------|----------|--------|------|
| 1 | Fix ProgressBar import + file corruption | **Build** | 5 min | None |
| 2 | Create `functions/lib/supabase.js` stub | **Backend** | 30 min | Low |
| 3 | Create `functions/lib/cors.js` module | **Backend** | 30 min | Low |
| 4 | Fix `startCombat` routing guard | **Gameplay** | 1-2 hr | Medium |
| 5 | Populate skill `magicProfile`/`engineProfile` | **Content** | 2-4 hr | Low |
| 6 | Sync world registry with test expectations | **Content** | 1-2 hr | Low |
| 7 | Implement `loreReqs` checking | **Progression** | 4-6 hr | Medium |
| 8 | Fix magic refine/purge action dispatch | **Gameplay** | 2-4 hr | Low |
| 9 | Align quest seeding order | **Onboarding** | 30 min | None |
| 10 | Fix damage formula / stat resolution drift | **Balance** | 1-2 hr | Medium |
| 11 | Reintegrate ignored test suites | **Quality** | 2-4 hr | Low |

---

## Implementation Order (Dependency-Aware)

```
Phase 1 — Unblock Build (immediate)
  [1] Fix ProgressBar import path + clean corruption
  
Phase 2 — Backend Stubs (same session)
  [2] Create supabase.js stub
  [3] Create cors.js module

Phase 3 — Core Gameplay Fixes (next session)
  [4] Fix startCombat routing
  [10] Fix damage/stat resolution
  [8] Fix magic refine/purge

Phase 4 — Content & Progression (1-2 days)
  [5] Skill engine profiles
  [6] World registry sync
  [7] loreReqs implementation
  [9] Quest ordering

Phase 5 — Test Hardening (ongoing)
  [11] Reintegrate ignored suites
```

---

## Test Health Summary

- **Passing:** 130/170 suites, 742/785 individual tests
- **Failing:** 40 suites (many due to 2 root causes: missing backend modules + combat routing)
- **Skipped:** 1 suite, 3 individual tests
- **Ignored:** 3 suites (explicitly excluded in config)

---

## Risks, Blockers, Assumptions

- **Blocker:** Production build broken — nothing ships until #1 is fixed.
- **Risk:** Combat routing change (#4) may require rebalancing skirmish encounter pools if the old 1v1 combat path was design-intended for certain contexts.
- **Assumption:** The `startSkirmishCombat` delegation is intentional for multi-enemy encounters but the guard should allow single-enemy traditional combat when only 1 ID is passed.
- **Unknown:** Whether the ignored test suites (`skillEffects`, `endToEndEffects`, `magnitudeCapsFusion`) fail due to known design changes or actual regressions.

---

## Execution Profile

- **Model:** gpt-5.4 (or equivalent high-reasoning agent)
- **Reasoning strength:** high
- **Hosting:** cloud
- **Local usage:** lightweight validation scripts only
