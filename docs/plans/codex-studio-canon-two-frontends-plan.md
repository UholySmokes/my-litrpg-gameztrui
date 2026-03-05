# Codex Studio: One Canon, Two Frontends Plan

## 1) Studio Manager Summary

### Stage 0 — Quick Intake (from current repo)
- This repo already has **two frontend surfaces**: a React web app (`src/main.jsx`, `src/App.jsx`) and a Godot project (`godot/project.godot`).
- The project already has a **shared engine package** (`packages/game-core`) and a **schema package** (`packages/game-schemas`), which is the right direction for one-canon architecture.
- The web app still contains legacy mirrors/shims (`src/core/*`, `src/simulation/*`) that overlap with `packages/game-core/*`, so canonical ownership is currently mixed.
- Backend/API runtime is in Firebase Functions (`functions/index.js`, `functions/lib/*`) and exposes sync + narration routes.
- Tests and validation are present (`npm run test:smoke`, `npm run typecheck`) and pass, which is a strong beginner-friendly base for safe incremental changes.

### What is “canon” today (messy but identifiable)
- **Closest thing to canon logic:** `packages/game-core/src/engine/createSystemEngine.js` + systems/data under `packages/game-core/src/*`.
- **Closest thing to canon contracts:** `packages/game-schemas/src/*.d.ts`.
- **Reality gap:** `game-schemas` runtime files are currently no-op JS placeholders, so runtime canon enforcement is mostly in `game-core` + tests.

### Biggest 3 risks
1. **Drift risk**: duplicated logic between `src/*` and `packages/game-core/*` can diverge silently.
2. **Contract risk**: schema package has type contracts but little runtime guardrail; invalid content/state can still enter runtime.
3. **Integration risk**: Godot can consume data, but there is no single documented bridge contract for action/state/event envelopes.

**Beginner Tips:**
- Think of canon as your "game law book"; frontends should only read/submit actions.
- Keep one source of truth for formulas and state transitions.
- If two files do the same thing, mark one as legacy and stop adding new logic there.
- Prefer small migrations (one subsystem at a time).
- Passing smoke tests after every small change is your safety net.

---

## 2) Repo Auditor Report

### Referenced-but-missing
- No hard missing runtime imports found in main gameplay paths during quick scan + typecheck.
- Soft warning: custom static check flags package-directory requires in `functions/lib/*` (`../src/dataconnect-admin-generated`), but this resolves via that directory’s `package.json` (`main`/`exports`), so it is likely valid.
  - **What to do:** keep as-is, but add a tiny unit test that `require("../src/dataconnect-admin-generated")` resolves.
  - **Where to do it:** `functions/lib` tests.
  - **How to verify:** run `npm --prefix functions test` (or equivalent targeted test).

### Exists-but-unused (high confidence)
- Large generated/coverage artifacts are committed (e.g., `coverage/lcov-report/*`), which are not runtime dependencies.
  - **What to do:** keep reports out of source-of-truth directories and consider git-ignore for transient reports.
  - **Where to do it:** root `.gitignore` + CI artifact config.
  - **How to verify:** clean clone + build/test still pass.

### Duplicate implementations (high impact)
- Direct duplicate module families exist in both web app and canon package:
  - `src/core/*` and `packages/game-core/src/core/*` (10 same filenames).
  - `src/simulation/*` and `packages/game-core/src/simulation/*` (15 same filenames).
  - `src/util/{numberFormat,statusrenderer}.js` and package equivalents.
  - **Why it matters:** future bug fixes may be applied to one copy only.
  - **Smallest safe fix:** freeze `src/*` copies as back-compat shims that re-export from `@voidverse/game-core`, then migrate import paths gradually.
  - **What to do:** convert one duplicate area per patch (start with `src/core`).
  - **Where to do it:** `src/core/*.js`.
  - **How to verify:** `npm run test:smoke` + compare behavior in one manual play session.

### “This will bite you later” list
1. **Legacy alias routes** in API (`/api/story/*` and `/api/narrate*`) map to same handlers.
   - What: keep aliases but add deprecation response headers + docs timeline.
   - Where: `functions/lib/api-router.js`.
   - Verify: curl both routes and confirm matching body + deprecation metadata.
2. **Schema/runtime mismatch risk**: `game-schemas` JS files are runtime no-op.
   - What: add runtime zod validation entrypoints for state/action/content.
   - Where: `packages/game-schemas/src/validation.js` + exports.
   - Verify: intentionally malformed payload fails validation tests.
3. **Canon boundary not documented for Godot**.
   - What: add one short contract doc for `ActionEnvelope`, `StepResult`, `SyncPullResult`.
   - Where: `docs/contracts/canon-bridge.md`.
   - Verify: one Godot mock client can process sample JSON without custom branching.

**Beginner Tips:**
- Duplicates are normal during transitions; just stop creating *new* duplicates.
- “Unused” does not always mean delete immediately—first confirm no tool reads it.
- Add deprecation headers before deleting old routes.
- For risky cleanup, do one directory per PR.
- Keep a rollback plan: revert only that PR if needed.

---

## 3) Canon Blueprint

### Recommended canon layout (minimal)
- `packages/game-core/` → deterministic rules + reducer/systems + engine facade.
- `packages/game-schemas/` → shared contracts (types + runtime validation).
- `content/` (new, optional first step) → JSON packs for archetypes, quests, world tables.
- `adapters/` (conceptual) → web + godot read/write only via engine + schema envelopes.

### Minimal state shape (v1)
```ts
interface GameState {
  contentVersion: string;
  stateVersion: number;
  runId: string;
  seq: number;
  tick: number;
  player: { level: number; xp: number; hp: number; mana: number; attributes: Record<string, number>; inventory: unknown[]; equipment: Record<string, unknown>; flags: Record<string, unknown> };
  world: { id: string; location: string; turnCount: number; time: string; weather: string; flags: Record<string, unknown>; counters: Record<string, number> };
  quests: { active: QuestState[]; completed: QuestState[] };
  combat?: CombatState;
  narrative?: NarrativeState;
}
```

### Minimal action/event types
- **Actions in:** `move`, `attack`, `rest`, `use_item`, `magic_*`, `quest_accept`, `quest_turn_in`.
- **Events out:** `DamageApplied`, `LootGranted`, `QuestUpdated`, `LevelUp`, `NarrationQueued`, `StateSnapshotCommitted`.

### Content schema recommendation
- Keep TypeScript declarations, but add runtime zod validators for:
  - archetypes,
  - quest templates,
  - enemy/item registries,
  - world nodes.
- Rule: **load content only if validators pass**.

### Versioning rule
- `contentVersion = "<packId>@<version>+sha256:<hash>"`
- `stateVersion = integer` for migrations.
- Accept state only when:
  - `state.stateVersion` is supported, and
  - `state.contentVersion` is compatible with loaded content pack.

**What to do / Where / Verify**
- What: add a single `assertContentCompatibility(state, manifest)` function.
- Where: `packages/game-core/src/engine`.
- Verify: unit test passes for compatible pair and fails for mismatched versions.

**Beginner Tips:**
- `contentVersion` = “which rulebook edition is loaded.”
- `stateVersion` = “save file format version.”
- Keep migration logic tiny and explicit.
- Never guess missing fields; normalize once in engine.
- Validate content at boot, not mid-combat.

---

## 4) Gameplay Plan

### Core loop (one sentence)
- **Explore → choose a tactical action → resolve deterministic outcome → gain resources/progression → unlock harder opportunities.**

### 3 gameplay verbs
1. **Engage** (attack/cast/control).
2. **Position** (move/retreat/scout).
3. **Prepare** (rest/refine/equip/craft).

### 3 reward types
- Power gain (xp/levels/perks).
- Build depth (new abilities/gear synergies).
- World progress (quest states/unlocks/reputation).

### 3 failure states
- HP defeat (combat loss).
- Resource collapse (mana/stamina instability).
- Strategic lockout (bad route choices, temporary retreat required).

### 5 fun-check metrics
1. Early TTK: 2–4 turns for standard enemy.
2. Resource pressure: at least 1 constrained resource per fight.
3. Meaningful choice rate: at least 2 viable actions/turn.
4. Recovery cadence: major heal/reset every 2–3 encounters.
5. Progress pulse: visible reward every 5–10 minutes.

**What / Where / Verify**
- What: add these as balancing guardrails in a single JSON doc.
- Where: `docs/contracts/gameplay-balance-guardrails.json`.
- Verify: playtest script logs metrics and flags out-of-range values.

**Beginner Tips:**
- A fun loop is mostly pacing + meaningful choices.
- If every fight feels same length, vary enemy intent not just HP.
- Add one metric at a time; don’t optimize all at once.
- Use “time-to-first-fun” as a north star.
- Keep numbers editable in data, not hardcoded.

---

## 5) Archetype & Balance Pack

### 8 archetypes (strength / weakness)
1. Vanguard — durable frontline / weak burst.
2. Duelist — high single-target pressure / low AoE.
3. Arcanist — scalable spell output / fragile and mana-sensitive.
4. Warden — control and mitigation / low finishing power.
5. Reaper — execute and lifesteal / vulnerable early.
6. Tactician — buffs/debuffs and tempo / lower raw stats.
7. Ranger — safe ranged uptime / weak in close lock.
8. Alchemist — utility and attrition / setup-heavy turns.

### Power budget rules (simple)
- Budget = `Offense + Defense + Utility`.
- Early game target total: **100 points**.
- Mid game target total: **160 points**.
- Hard cap any one axis at 50% of total budget.

### Example numbers
- Early (Lv1–5):
  - Vanguard O/D/U: 28/52/20
  - Arcanist O/D/U: 48/22/30
- Mid (Lv15):
  - Vanguard O/D/U: 44/80/36
  - Arcanist O/D/U: 74/34/52

**What / Where / Verify**
- What: encode archetype budget table as data.
- Where: `packages/game-core/src/data/archetypes/*.json`.
- Verify: `npm run validate:archetypes` and fail when cap is exceeded.

**Beginner Tips:**
- Balance by role, not by making everything equal.
- Utility is real power—count it.
- If one build wins all situations, add a counter scenario.
- Don’t let scaling be multiplicative everywhere.
- “Strong now, weak later” can be healthy identity.

---

## 6) Quest & Narration Pack

### 6 quest templates (state-driven JSON)
```json
[
  {
    "id": "quest_clear_den",
    "trigger": { "location": "wolf_den", "minLevel": 1 },
    "objectives": [{ "type": "kill", "target": "wolf", "count": 5 }],
    "rewards": { "xp": 120, "gold": 40 },
    "fail": { "type": "retreats", "max": 3 }
  },
  {
    "id": "quest_recover_relic",
    "trigger": { "flag": "heard_relic_rumor" },
    "objectives": [{ "type": "collect", "item": "sun_relic", "count": 1 }],
    "rewards": { "xp": 180, "item": "ward_charm" }
  },
  {
    "id": "quest_escort_apprentice",
    "trigger": { "location": "academy_gate" },
    "objectives": [{ "type": "reach", "location": "north_outpost" }],
    "constraints": { "npcAlive": true },
    "rewards": { "xp": 150, "rep": { "academy": 10 } }
  },
  {
    "id": "quest_stabilize_rift",
    "trigger": { "worldVar": "riftLevel", "gte": 2 },
    "objectives": [{ "type": "use_skill", "skill": "seal_rune", "count": 3 }],
    "rewards": { "xp": 220, "currency": "soulpoints", "amount": 30 }
  },
  {
    "id": "quest_bounty_duelist",
    "trigger": { "reputation": { "guild": 5 } },
    "objectives": [{ "type": "defeat", "target": "rogue_duelist", "count": 1 }],
    "rewards": { "xp": 200, "gold": 90 }
  },
  {
    "id": "quest_supply_run",
    "trigger": { "timeOfDay": "dusk" },
    "objectives": [{ "type": "deliver", "item": "med_kit", "to": "field_clinic" }],
    "rewards": { "xp": 100, "rep": { "settlement": 6 } },
    "fail": { "type": "timeLimit", "turns": 8 }
  }
]
```

### Narration rules (state → text)
- Always include: current location, tension, immediate objective.
- Reflect mechanics plainly: damage, resist, resource spend, status effects.
- Keep tone adaptive to state (`danger`, `victory`, `recovery`).
- End with 2–3 actionable options derived from valid actions.

### Example narrated scene (for `quest_clear_den`)
- “The den mouth yawns like a broken jaw in the hillside. Your lantern catches five pairs of eyes and the scrape of claws on shale. You steady your breath, feel mana pool at your fingertips, and mark the alpha’s limp—an opening. Objective updated: Cull 5 wolves (0/5). You can **attack the nearest wolf**, **shift to the left ridge for better footing**, or **brace and recover 10 mana**.”

**What / Where / Verify**
- What: store quest templates as canonical JSON and render narration from state+events only.
- Where: `packages/game-core/src/data/quests/` + narrator adapter.
- Verify: deterministic replay of same state/event seed produces same objective progress and same option set.

**Beginner Tips:**
- Write quest logic as data first, prose second.
- Narrator should describe outcomes, not invent hidden rule changes.
- Keep objective counters explicit in text.
- Offer options that are actually legal actions.
- Reuse templates with different targets/locations.

---

## 7) Godot Integration Plan

### Where integration scripts should live
- `godot/scripts/canon/`
  - `canon_client.gd` (HTTP/WebSocket wrapper)
  - `canon_state_store.gd` (authoritative snapshot cache)
  - `canon_event_router.gd` (dispatch engine events to UI/scenes)

### Event/state consumption model
1. Godot UI emits player intent (`move`, `attack`, etc.).
2. Adapter sends canonical `ActionEnvelope`.
3. Canon backend/engine returns authoritative step result + state hash.
4. State store replaces local snapshot; event router emits UI-friendly signals.

### End-to-end example
- Input: player taps “Attack Wolf A”.
- Adapter POSTs `/api/sync/commit` with `{ input:{kind:"action",action:{type:"attack",enemyIndex:0}} }`.
- Canon resolves action in engine, increments tick, returns events + next snapshot hash.
- Godot updates HP bars, combat log panel, quest tracker from returned state/events only.

**What / Where / Verify**
- What: implement one thin adapter for `attack` path only first.
- Where: `godot/scripts/canon/` + one combat UI scene script.
- Verify: same attack from web and Godot on same seed yields same state hash.

**Beginner Tips:**
- Keep Godot “dumb” about rules; let canon decide outcomes.
- Cache last good snapshot for quick rollback UI.
- Route by event type, not by scene-specific hacks.
- Start with one action vertical slice.
- Log `runId/seq/tick/stateHash` on every response.

---

## 8) QA / Tests / Acceptance Checks

### Minimal smoke checklist
- Engine boot with valid content manifest.
- One text action path (`"attack"`) parses + validates + executes.
- Sync commit/pull roundtrip returns stable `seq/tick/stateHash`.
- Web UI can render updated state without local rule recompute.
- Godot adapter can consume one commit response and update one label.

### 5 regression tests
1. Determinism: same seed + same commands => same final hash.
2. Content mismatch: incompatible `contentVersion` rejected.
3. Migration gate: unknown `stateVersion` rejected with clear reason.
4. Duplicate action envelope id is idempotent (no double apply).
5. Quest objective counter increments exactly once per qualifying event.

### Instrumentation suggestions
- Structured logs on every step: `runId, seq, tick, actionType, stateHashBefore, stateHashAfter`.
- Emit warning on desync detection (client hash != server hash).
- Add lightweight per-action timing metric.

### Failure modes + rollback
- Failure: bad content pack deploy.
  - Rollback: pin previous `contentVersion` manifest.
- Failure: schema-breaking client update.
  - Rollback: enforce server compatibility gate + feature flag.
- Failure: duplicate logic divergence.
  - Rollback: route all callers through `@voidverse/game-core` exports only.

**What / Where / Verify**
- What: add one `determinism-smoke` CI job.
- Where: repo CI workflow + existing test harness.
- Verify: CI fails on any hash drift for locked test vectors.

**Beginner Tips:**
- Regressions are normal; fast detection is the win.
- Hash checks are your best “same rules everywhere” alarm.
- Start with one golden replay file.
- Prefer idempotent server actions.
- Make rollback a script, not a hero move.

---

## 9) Next 7 Steps (Beginner-Friendly)

1. **Document canon ownership** (one page).
   - What: define which folders can contain rules.
   - Where: `docs/contracts/canon-ownership.md`.
   - Verify: PR checklist blocks rule edits outside canon.
2. **Freeze duplicate web core files** into re-export shims.
   - What: stop new logic in `src/core` duplicates.
   - Where: `src/core/*`.
   - Verify: smoke tests pass unchanged.
3. **Add runtime schema checks** in `game-schemas`.
   - What: validate action/state/content at boundaries.
   - Where: `packages/game-schemas/src/validation.js`.
   - Verify: malformed fixture fails test.
4. **Create quest template JSON directory**.
   - What: move 1–2 quests from ad hoc code into data.
   - Where: `packages/game-core/src/data/quests/`.
   - Verify: existing quest flow still works.
5. **Build one Godot attack adapter**.
   - What: submit one canonical action and render response.
   - Where: `godot/scripts/canon/`.
   - Verify: tick increments and UI updates.
6. **Add determinism golden test**.
   - What: lock one seed + command log + expected hash.
   - Where: `tests/unit` or package test folder.
   - Verify: identical hash across runs.
7. **Deprecation cleanup plan for alias API routes**.
   - What: timeline + headers + migration notes.
   - Where: `functions/lib/api-router.js` + docs.
   - Verify: both old and new routes tested, old route warns.

**Beginner Tips:**
- One completed vertical slice beats five partial migrations.
- Every step should have a “done means” test.
- Keep docs near code to reduce drift.
- Prefer deleting complexity over adding abstraction.
- If stuck, make the next step smaller.

