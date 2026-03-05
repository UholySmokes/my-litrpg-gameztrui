# One Canon, Two Frontends — Orchestrator Report (Beginner-Friendly)

## 1) Studio Manager Summary

### Stage 0 — Quick Intake

- This repo is a hybrid monorepo: React/Vite web client at `src/`, Firebase Functions API at `functions/`, and a Godot 4 client at `godot/`.
- There is already an intent to centralize gameplay logic into `@voidverse/game-core` and contracts into `@voidverse/game-schemas` (workspace packages).
- The web app boot path (`src/main.jsx`) is UI startup + static data bootstrap; rules appear to be consumed from shared modules, not only inside React components.
- Godot startup is `godot/scenes/Main.tscn` with clients (`SyncClient`, `StoryClient`) that call API endpoints from `godot/data/config.json`.
- API router (`functions/lib/api-router.js`) exposes sync + story/narrate endpoints, so canon state transitions already flow through HTTP boundaries.

### What is “canon” today (messy but real)

Current canon is split across:
1. `packages/game-core/src/**` for core systems/engine,
2. `packages/game-schemas/src/**` for type/contracts,
3. `docs/contracts/**` for API envelopes/verbs,
4. `functions/lib/sync*.js` as server-authoritative commit/pull persistence.

### Biggest 3 risks

1. **Dual-source confusion risk**: many `src/systems/**` files mirror `packages/game-core/src/systems/**`; current files are mostly back-compat shims, but that architecture can drift if someone edits the wrong side.
2. **Contract drift risk**: Godot and web both consume endpoints/config independently; if command/event schemas evolve without explicit version gates, clients break differently.
3. **Generated/build artifact noise risk**: committed generated folders (especially Android/Godot build outputs) can hide meaningful diffs and increase accidental regressions.

**Beginner Tips:**
- Treat `packages/game-core` as your “single source of truth” for gameplay rules.
- Keep UI files focused on display/input; never hardcode balance numbers there.
- Add one schema/version field before changing payload shape.
- Small PRs are easier to test than one giant “architecture” PR.

---

## 2) Repo Auditor Report

### Referenced-but-missing

- No hard missing-import errors found in the current TypeScript + ESLint pass (`npm run typecheck`, `npm run lint`).
- `npm run lint` reports only two warnings in `tools/buildAbilityCatalog.mjs` (unused eslint-disable directives), not missing references.

**Smallest safe fix:** remove stale eslint-disable comments from `tools/buildAbilityCatalog.mjs`.
- **What to do:** delete unused disable comments.
- **Where to do it:** `tools/buildAbilityCatalog.mjs`.
- **How to verify:** run `npm run lint` and confirm warnings drop to zero.

### Exists-but-unused (high-confidence cleanup candidates)

1. `godot/android/build/**` appears to be generated build output checked into repo.
   - Why it matters: bloats repo and creates noisy diffs.
   - Small fix: move generated artifacts to ignored output folder + update docs.

2. `coverage/**` committed in repo root.
   - Why it matters: stale coverage snapshots create churn and merge conflicts.
   - Small fix: ensure coverage output is gitignored and removed from source control.

3. Multiple generated DataConnect client trees under root and package scopes (`src/dataconnect-generated`, `packages/*/src/dataconnect-generated`, `api/src/dataconnect-generated`).
   - Why it matters: if regeneration process is unclear, stale generated clients can silently mismatch runtime contracts.
   - Small fix: add a single “generation owner + command” doc section and verify all generated copies are intentional.

### Duplicate implementations

- There are many path-level duplicates between `src/systems/**` and `packages/game-core/src/systems/**` (same filenames). Today these are primarily compatibility shims in `src`, but this still looks like duplication to newcomers.

**Smallest safe fix:** add a one-page “edit here, not there” contributor note and block direct edits in shim directories via lint rule or CI check.
- **What to do:** enforce shim-only policy.
- **Where to do it:** `src/systems/**` (legacy shim layer), contributor docs.
- **How to verify:** CI check fails if a shim file contains anything other than re-export + comment.

### “This will bite you later” list

1. **Schema versioning is not visibly enforced at all entrypoints.**
   - Why: web/Godot/API may each evolve payloads.
   - Safe fix: require `contentVersion` + `schemaVersion` in sync command envelope.

2. **Endpoint aliasing (`/api/narrate*` and `/api/story/*`) increases maintenance surface.**
   - Why: two names for same behavior doubles test matrix.
   - Safe fix: keep aliases, but document primary route and add deprecation headers on secondary paths.

3. **TODOs in shipped Godot addons are tracked but unresolved.**
   - Why: plugin edge cases can fail in-editor unexpectedly.
   - Safe fix: open issues for each TODO and tag as external/addon risk.

**Beginner Tips:**
- “Unused” doesn’t always mean “delete now”; first confirm if it is generated.
- Prefer policy docs + tiny CI checks over sweeping refactors.
- Every route alias should have one “primary canonical route” in docs.
- Keep cleanup tickets small and independent.

---

## 3) Canon Blueprint

### Recommended canon folder layout (minimal)

```text
packages/
  game-schemas/
    src/
      canon/
        state.ts
        actions.ts
        events.ts
        content.ts
        version.ts
  game-core/
    src/
      canon/
        reducer.ts
        applyAction.ts
        emitEvents.ts
      engine/
        createSystemEngine.js
```

### Minimal state shape

```ts
export type CanonState = {
  contentVersion: string;      // e.g. "2026.03.0"
  schemaVersion: number;       // e.g. 1
  runId: string;
  tick: number;
  player: {
    hp: number;
    mana: number;
    archetypeId: string;
    level: number;
    resources: Record<string, number>;
  };
  world: {
    mapId: string;
    flags: Record<string, boolean>;
    timeOfDay: "dawn"|"day"|"dusk"|"night";
  };
  quest: {
    activeQuestId: string | null;
    objectiveStates: Record<string, "locked"|"active"|"done"|"failed">;
  };
};
```

### Minimal action + event types

```ts
export type CanonAction =
  | { type: "MOVE"; toMapId: string }
  | { type: "INTERACT"; targetId: string }
  | { type: "CAST_SKILL"; skillId: string; targetId?: string }
  | { type: "COMPLETE_OBJECTIVE"; objectiveId: string }
  | { type: "SAVEPOINT_COMMIT" };

export type CanonEvent =
  | { type: "HP_CHANGED"; delta: number }
  | { type: "RESOURCE_CHANGED"; resource: string; delta: number }
  | { type: "QUEST_UPDATED"; questId: string; state: string }
  | { type: "SCENE_TEXT_READY"; textId: string }
  | { type: "STATE_COMMITTED"; commitId: string };
```

### Content schema recommendation

- Define canonical JSON schema for:
  1. archetypes,
  2. skills,
  3. quests,
  4. world maps,
  5. narrative templates.
- Store source data in JSON/TS files under `packages/game-schemas/src/canon/content/*`.
- Validate at load time in `game-core` and at CI level with a single `validate:canon-content` script.

### Versioning rule (simple and strict)

- Add `contentVersion` to every state snapshot and sync payload.
- Clients must send `supportedContentVersionRange` in handshake.
- Server rejects incompatible writes with clear error code (`CONTENT_VERSION_MISMATCH`).

**Why this matters (new dev version):**
You avoid “works on web but not Godot” because both clients speak the exact same state/action/event language.

**Beginner Tips:**
- Start with 5 action types only; add more later.
- Keep state flat enough to debug in logs.
- Version mismatch errors are healthy—they prevent corrupt saves.
- Schema files are a contract, not optional docs.

---

## 4) Gameplay Plan

### Core loop (1 sentence)

Explore map → trigger encounter/objective → spend class resources to resolve challenge → earn progression loot/XP/story flags → unlock harder encounters.

### 3 gameplay verbs

1. **Scout** (move + inspect): reveals opportunities/risks.
2. **Commit** (fight/interact/cast): spends resources for progress.
3. **Recover** (rest/synergize/loot): stabilizes before next push.

### 3 rewards

1. Character power gain (XP/level/talent point).
2. Build expression (new skill synergy/archetype node).
3. Narrative unlock (new quest branch/lore codex).

### 3 failure states

1. Combat defeat (retreat to savepoint with penalty).
2. Resource collapse (out of mana/chi/rage tempo).
3. Quest timeout/branch lock (missed opportunity).

### 5 fun-check metrics

1. **TTK (time-to-kill)** regular encounter: target 3–5 turns early game.
2. **Resource pressure**: average 60–80% resource usage per encounter.
3. **Decision density**: meaningful choices per turn ≥ 2.
4. **Recovery pacing**: full recovery available at most every 2–3 encounters.
5. **Quest momentum**: objective completion every 3–8 minutes.

**Beginner Tips:**
- If fights are long and boring, reduce enemy HP before changing everything else.
- Measure one metric at a time.
- “Hard” is okay; “confusing” is not.
- Keep a tiny test encounter for fast iteration.

---

## 5) Archetype & Balance Pack

### 8 archetypes (strengths/weaknesses)

1. **Vanguard** — high armor/control, weak burst.
2. **Berserker** — burst + rage scaling, weak sustain.
3. **Monk** — combo tempo + chi control, weak ranged pressure.
4. **Warden** — mitigation + ally buffs, weak solo speed.
5. **Arcanist** — high magic burst, weak when mana-starved.
6. **Ranger** — kiting + crit uptime, weak in tight melee maps.
7. **Shadow** — stealth opener + debuffs, weak in prolonged direct trades.
8. **Artificer** — traps/utility, weak immediate damage.

### Power budget rules (anti-infinite scaling)

- Per level, total effective combat power increase target: **+8% to +12%**.
- Any single stacking buff cannot exceed **+35%** contribution to final damage.
- Multipliers should be additive-then-multiplicative in fixed order to prevent exploit chains.
- Soft caps for crit chance, dodge, and cooldown reduction.

### Example numbers

- **Early game (L1–L5):**
  - Player HP: 80–140
  - Main attack damage: 12–22
  - Resource pool: 50–100
  - Elite HP: 200–260

- **Mid game (L15–L20):**
  - Player HP: 420–650
  - Main attack damage: 55–90
  - Resource pool: 140–220
  - Elite HP: 950–1350

**Beginner Tips:**
- Pick one baseline archetype (Vanguard) and tune others relative to it.
- Use caps before nerfing fun skills.
- Avoid hidden formulas at first; transparent math is easier.
- Write balance assumptions in comments/docs.

---

## 6) Quest & Narration Pack

### 6 state-driven quest templates (JSON)

```json
[
  {
    "id": "quest_clear_bandit_camp",
    "trigger": { "flag": "heard_bandit_rumor", "equals": true },
    "objectives": [
      { "id": "reach_camp", "type": "MOVE", "target": "map_bandit_camp" },
      { "id": "defeat_bandit_leader", "type": "COMBAT_WIN", "target": "bandit_leader" }
    ],
    "successFlags": ["bandit_threat_removed"],
    "failFlags": ["bandits_reinforced"]
  },
  {
    "id": "quest_repair_waystone",
    "trigger": { "flag": "waystone_broken", "equals": true },
    "objectives": [
      { "id": "collect_core", "type": "ITEM_COLLECT", "target": "arcane_core", "count": 1 },
      { "id": "repair_waystone", "type": "INTERACT", "target": "waystone_01" }
    ],
    "successFlags": ["fast_travel_unlocked"],
    "failFlags": ["night_ambush_risk"]
  },
  {
    "id": "quest_escort_herbalist",
    "trigger": { "flag": "herbalist_request", "equals": true },
    "objectives": [
      { "id": "meet_herbalist", "type": "INTERACT", "target": "npc_herbalist" },
      { "id": "reach_glade", "type": "MOVE", "target": "map_training_glade" }
    ],
    "successFlags": ["herbalist_safe"],
    "failFlags": ["herbalist_wounded"]
  },
  {
    "id": "quest_trial_of_chi",
    "trigger": { "playerArchetype": "Monk" },
    "objectives": [
      { "id": "perform_combo", "type": "CAST_SKILL", "target": "chi_combo_3" },
      { "id": "meditate", "type": "INTERACT", "target": "shrine_chi" }
    ],
    "successFlags": ["chi_mastery_1"],
    "failFlags": ["chi_backlash"]
  },
  {
    "id": "quest_shadow_contract",
    "trigger": { "playerArchetype": "Shadow" },
    "objectives": [
      { "id": "infiltrate", "type": "MOVE", "target": "map_ruined_outlook" },
      { "id": "steal_ledgers", "type": "INTERACT", "target": "cache_ledgers" }
    ],
    "successFlags": ["guild_favor"],
    "failFlags": ["alert_raised"]
  },
  {
    "id": "quest_hold_the_gate",
    "trigger": { "flag": "gate_under_attack", "equals": true },
    "objectives": [
      { "id": "survive_waves", "type": "COMBAT_WAVES", "count": 3 },
      { "id": "seal_gate", "type": "INTERACT", "target": "ancient_gate" }
    ],
    "successFlags": ["gate_stable"],
    "failFlags": ["region_overrun"]
  }
]
```

### Narration rules (state -> text)

1. Narration must mention: current objective, current risk, and immediate next choice.
2. If resource below 25%, include pressure sentence (“Your mana thins...”).
3. If quest state changed this turn, show one “system log” line.
4. Keep output in 2 paragraphs max for gameplay readability.
5. Use deterministic tags (`[QUEST:...]`, `[RESOURCE:...]`) for debug mode.

### Example narrated scene (for `quest_repair_waystone`)

> `[QUEST:quest_repair_waystone][RESOURCE:mana=18%]`
> The cracked waystone hums like a wounded bell, and pale runes blink beneath your fingertips as the Arcane Core settles into place. The air tastes metallic—too much unstable charge, not enough control.
>
> **System:** Objective updated — `repair_waystone` is now **active**. Your mana reserves are critically low. You can either channel the final pulse now (high risk, fast completion) or retreat ten steps to recover before trying again.

**Beginner Tips:**
- Tie every narration line to a state field.
- Avoid lore-only paragraphs during combat turns.
- Reuse templates; don’t handwrite every scene.
- Keep “next choice” explicit so players don’t stall.

---

## 7) Godot Integration Plan

### Where to place integration scripts

- Keep Godot HTTP/session client scripts in `godot/scripts/` (`sync_client.gd`, `story_client.gd`, `config_loader.gd`).
- Add a thin `canon_bridge.gd` in `godot/scripts/` to map Godot inputs -> canonical actions.
- Keep no rule math in scene scripts (`world_controller.gd` should orchestrate only).

### Event/state consumption model

1. Input in Godot creates canonical action envelope.
2. `SyncClient` posts action to `POST /api/sync/command` (or `/sync/command` relative to `apiBaseUrl` that already includes `/api`).
3. API responds with updated canonical state + emitted events.
4. Godot applies state snapshot to scene (HP bars, quest panel, map markers).
5. `StoryClient` optionally requests prose for current state transition.

### End-to-end example

- **Input:** Player presses `E` near NPC.
- **Canon action:** `{ type: "INTERACT", targetId: "npc_guide" }`.
- **Server transition:** quest objective flips from `locked` -> `active`; emits `QUEST_UPDATED`.
- **State response:** `quest.activeQuestId` set; `world.flags.met_guide=true`.
- **UI reaction in Godot:** objective panel refreshes + narration panel starts then polls narration via `POST /api/story/start` followed by `GET /api/story/poll`.

**Beginner Tips:**
- Keep one bridge file for input mapping; easier debugging.
- Log action + commit id for every request.
- Always apply server state, even if local prediction exists.
- Start with 1 action (`INTERACT`) before adding all controls.

---

## 8) QA / Tests / Acceptance Checks

### Minimal smoke checklist

1. Web boot: app renders without console errors.
2. API health: `/api/health` returns 200.
3. Sync command: valid command returns updated state.
4. Godot headless smoke runs and finds required nodes.
5. Story path: `/story/start` fallback prose works when remote fails.

### 5 regression tests

1. **Schema guard test:** reject unknown action types.
2. **Version guard test:** reject mismatched `contentVersion`.
3. **Determinism test:** same seed + actions => same state hash.
4. **Quest transition test:** objectives only move allowed states.
5. **Alias parity test:** `/api/story/*` and `/api/narrate-*` behavior parity.

### Instrumentation suggestions

- Add per-action logs: `runId`, `commitId`, `actionType`, `schemaVersion`, `contentVersion`.
- Emit state hash every N commits for replay integrity.
- Tag client logs with `clientType=web|godot` to compare divergences.

### Failure modes + rollback strategy

1. **Mode:** content update breaks old clients.
   - Rollback: server pin to previous `contentVersion`, disable new quest IDs.
2. **Mode:** action schema mismatch.
   - Rollback: return strict 4xx with upgrade hint; do not mutate state.
3. **Mode:** Godot runtime config missing key.
   - Rollback: use defaults from `config_loader.gd` + warning banner.

**Beginner Tips:**
- Determinism tests are your best friend for “one canon.”
- Log IDs first, pretty dashboards later.
- Failed version checks are success of safety rules.
- Keep one rollback playbook in docs, not in memory.

---

## 9) Next 7 Steps (Beginner-Friendly)

1. **Declare canon ownership doc**
   - What: add `docs/canon/OWNERSHIP.md` defining `game-core` + `game-schemas` ownership.
   - Where: `docs/canon/OWNERSHIP.md`.
   - Verify: new contributors can answer “where do rules live?” in under 30s.

2. **Add canonical version fields to command envelope**
   - What: include `schemaVersion` + `contentVersion` in `/sync/command` request/response.
   - Where: sync contract docs + API validators.
   - Verify: regression test rejects mismatches.

3. **Create one canonical action enum in game-schemas**
   - What: define action/event union types and reuse in web/API adapters.
   - Where: `packages/game-schemas/src/canon/actions.ts`, `events.ts`.
   - Verify: TypeScript compile fails on unknown action strings.

4. **Freeze shim layer policy**
   - What: enforce `src/systems/**` as re-export-only.
   - Where: lint/CI rule + contributor docs.
   - Verify: CI fails when non-shim logic is added to shim paths.

5. **Ship one vertical slice parity test (web + Godot contract)**
   - What: one scripted flow `INTERACT npc_guide` -> quest update.
   - Where: API integration test + Godot headless assertion.
   - Verify: both clients produce same resulting `quest` state.

6. **Reduce route alias ambiguity**
   - What: mark one primary narration route family; deprecate secondary with headers.
   - Where: `functions/lib/api-router.js` + docs.
   - Verify: tests assert headers on deprecated endpoints.

7. **Clean generated artifact policy**
   - What: decide what generated files are source-of-truth vs build output.
   - Where: `.gitignore` + `docs/WORKFLOW.md`.
   - Verify: clean git status after build/test commands.

**Beginner Tips:**
- Do steps 1–3 first; they unlock everything else.
- Keep each step in its own PR if possible.
- If uncertain, choose strict validation over silent fallback.
- “One canon” is mostly a process discipline, not a giant rewrite.
