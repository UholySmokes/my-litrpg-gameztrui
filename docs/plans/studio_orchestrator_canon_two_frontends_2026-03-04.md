# Codex Studio Orchestrator Report — One Canon, Two Frontends

Date: 2026-03-04
Scope: Web/Text LitRPG + Godot client, aligned on one canon.

## 1) Studio Manager Summary (Stage 0 Quick Intake)

### 5-bullet beginner-friendly repo summary
- This repo is already a hybrid project: web app + Godot runtime + backend/API glue in one workspace.
- A lot of game logic is present and testable from Node scripts (lint, typecheck, smoke tests).
- There is a workspace split for reusable core pieces (`@voidverse/game-core`, `@voidverse/game-schemas`).
- The web app can be intentionally disabled outside dev builds to encourage Godot-first runtime behavior.
- There are many validation/report scripts, which is good for safe incremental changes.

### What is “canon” today (even if messy)
- Canon-like engine entry exists in `packages/game-core/src/engine/createSystemEngine.js`.
- Canon-like state/action type definitions exist in `packages/game-schemas/src/*.d.ts`.
- Canonical state contract docs already exist (`docs/contracts/canonical_state_v2.md`).
- In practice, there is still duplicated logic between root `src/` and `packages/game-core/src/`, so canon boundaries are not fully enforced yet.

### Biggest 3 risks
1. **Dual-source logic drift**: duplicate files in `src/` and `packages/game-core/src/` can diverge.
2. **Loose schemas**: state types are intentionally broad (`unknown` in many fields), making consistency harder.
3. **Runtime split confusion**: web gameplay gating + Godot-first intent can confuse where feature work should land.

**Beginner Tips:**
- “Canon” means one source of truth for rules and state transitions.
- If two files do the same thing in two places, bugs sneak in.
- Keep each change tiny: move one system at a time, then run smoke tests.
- Prefer changing `packages/game-core` for rules and `packages/game-schemas` for types.
- Let web/Godot call canon; don’t add new game rules in UI code.

---

## 2) Repo Auditor Report (Stage 1)

### Referenced-but-missing
- **Result:** No missing **relative** imports found in scanned code roots (`src`, `packages/game-core/src`, `packages/game-schemas/src`, `functions/src`, `godot`).
- **Why this matters:** missing imports are immediate runtime/build failures.
- **Smallest safe fix:** none needed right now; keep this check in CI.

### Exists-but-unused
- `tools/buildAbilityCatalog.mjs` has unused ESLint disable comments (`no-console`) near logging lines.
- **Why this matters:** small warning debt accumulates and hides real warnings.
- **Smallest safe fix:** remove those two `eslint-disable-next-line` comments.

### Duplicate implementations
- There is broad duplication between `src/` and `packages/game-core/src/` across core, systems, utils, entities, and simulation modules.
- Current status: many of the historically duplicated `src/` modules are now thin back-compat re-export shims to `@voidverse/game-core`; any **remaining** true duplicates should be re-identified from the current tree rather than relying on older file lists.
- **Why this matters:** one frontend may use stale behavior vs the other if only one copy is updated.
- **Smallest safe fix:** declare `packages/game-core` authoritative for rules; keep `src`-side shims that re-export from `@voidverse/game-core`, and, in small batches, migrate any still-duplicated implementations over to that shim pattern.

### “This will bite you later” list
1. **Web gameplay gating can hide gameplay regressions** if teams only test in Godot or only in web.
   - Small fix: add one smoke command that runs web + canonical engine replay checks together.
2. **State schema looseness (`unknown`) invites silent shape drift.**
   - Small fix: tighten only top-level action payloads first, not all fields at once.
3. **High script surface area** can confuse beginners which command to trust.
   - Small fix: define one “daily dev check” script and document it prominently.

**Beginner Tips:**
- Warnings are not “just noise”; keep them low.
- Duplicate logic is the #1 source of “works here, fails there.”
- Don’t fix all duplicates at once—do a short list of critical systems first.
- Always run the same check command before and after changes.
- If uncertain, choose “add an adapter/re-export” over “copy-paste logic.”

---

## 3) Canon Blueprint (Stage 2, minimal)

### Canon folder layout recommendation
- `packages/game-schemas/`
  - `src/state.d.ts` (state shape)
  - `src/actions.d.ts` (input verbs/payloads)
  - `src/events.d.ts` (new: emitted events)
  - `src/content.d.ts` (content pack shape)
- `packages/game-core/`
  - `src/engine/createSystemEngine.js` (single engine entry)
  - `src/core/*` (validation/reducer/action dispatch)
  - `src/content/*` (optional, if content runtime helpers are needed)
- `src/` and `godot/`
  - adapters only (UI/input/network mapping), no game rule math.

### Minimal state shape (starter, not fancy)
```ts
type CanonState = {
  meta: {
    tick: number;
    contentVersion: string;
    stateVersion: number;
    runId: string;
  };
  player: {
    level: number;
    hp: { current: number; max: number };
    mana: { current: number; max: number };
    inventory: Array<{ id: string; quantity: number }>;
  };
  world: {
    locationId: string;
    timeOfDay: "dawn" | "day" | "dusk" | "night";
    flags: Record<string, boolean>;
  };
  quests: {
    active: Array<{ id: string; step: string }>;
    completed: string[];
  };
};
```

### Minimal action/event types
- **Actions (input):** `MOVE`, `ATTACK`, `REST`, `USE_ITEM`, `INTERACT`, `ACCEPT_QUEST`, `TURN_IN_QUEST`.
- **Events (output):** `DAMAGE_APPLIED`, `RESOURCE_CHANGED`, `QUEST_UPDATED`, `LEVEL_UP`, `LOOT_GRANTED`, `NARRATIVE_BEAT`.

### Content schema recommendation
- Keep content data-driven via JSON: enemies, quests, skills, loot tables.
- Validate content in CI with `zod`/schema script.
- Add stable IDs everywhere (`quest_id`, `enemy_id`, etc.) to avoid fragile string matching.

### Versioning rule (`contentVersion`)
- Use: `contentVersion = "<pack>@<YYYY.MM.DD>+<shortsha>"`.
- Engine should stamp step outputs with this exact version.
- Godot/web can reject mismatched save replays if version drift is detected.

**What to do / where / verify**
- **Do:** add `events.d.ts` + small canon type alias `CanonState`.
- **Where:** `packages/game-schemas/src/`.
- **Verify:** run `npm run typecheck` and `npm run test:smoke`.

**Beginner Tips:**
- Keep canon types small first; expand when needed.
- Actions are what player/client asks to do.
- Events are what the engine says happened.
- IDs should be stable and explicit.
- Version strings protect save/replay compatibility.

---

## 4) Gameplay Plan (Stage 3)

### Core loop sentence
- **Explore -> choose risk (fight/interact) -> resolve deterministic action -> gain progression -> unlock harder opportunities.**

### 3 gameplay verbs
1. **Engage** (attack/cast/control in encounters)
2. **Traverse** (move/maps/triggers/positioning)
3. **Prepare** (rest, consume, configure loadout)

### 3 rewards
1. XP/level progression
2. Loot/material upgrades
3. Quest unlock flags and narrative branches

### 3 failure states
1. HP collapse (defeat / forced retreat)
2. Resource starvation (mana/chi/rage economy collapse)
3. Positioning failure (bad map trigger path / avoidable encounter)

### 5 fun-check metrics
1. **TTK (time to kill)** normal enemy target window.
2. **Survivability margin** (avg HP left after standard fight).
3. **Resource pressure** (actions before forced rest).
4. **Upgrade cadence** (meaningful reward every N encounters).
5. **Failure clarity** (can player explain why they lost?).

**What to do / where / verify**
- **Do:** define metric targets in one markdown table.
- **Where:** `docs/contracts/gameplay_progression_v1.md` (append section).
- **Verify:** run a 20-run simulation and compare medians to targets.

**Beginner Tips:**
- Metrics stop balance from becoming guesswork.
- Track medians, not just one lucky run.
- TTK too low = boring; too high = grindy.
- Reward cadence keeps players motivated.
- Failures should feel fair and readable.

---

## 5) Archetype & Balance Pack (Stage 3)

### 8 archetypes (strength / weakness)
1. **Vanguard** — high armor / low burst.
2. **Berserker** — spike melee / self-risk windows.
3. **Monk** — combo tempo / punishable downtime.
4. **Ranger** — safe DPS / weak if cornered.
5. **Rogue** — crit/control / fragile when exposed.
6. **Arcanist** — high utility / mana hungry.
7. **Warden** — team sustain / low solo clear speed.
8. **Invoker** — flexible elements / setup-dependent.

### Power budget rules
- Budget each archetype to equal **100 power points** at each tier.
- Split budget buckets: offense 35, defense 30, utility 20, economy 15.
- No archetype gets top score in more than 2 buckets.

### Example numbers (early/mid)
- **Early (lvl 1-10):**
  - HP bands: 80-130
  - Main hit: 12-22
  - Resource pool: 40-90
- **Mid (lvl 11-25):**
  - HP bands: 220-380
  - Main hit: 35-70
  - Resource pool: 110-220

Anti-infinite-scaling guardrails:
- Softcaps on crit multiplier and resource regen.
- Diminishing returns after two same-stat boosters.

**What to do / where / verify**
- **Do:** encode archetype budget table JSON.
- **Where:** `src/data/registries/` (or `packages/game-core/src/data/registries/` as canonical location).
- **Verify:** run validation script + one simulation set per archetype.

**Beginner Tips:**
- “Budget” means every class pays for its strengths.
- If one class is best at everything, balance is broken.
- Use numeric bands, not vague labels like “high damage.”
- Add softcaps before players discover infinite loops.
- Rebalance one variable at a time.

---

## 6) Quest & Narration Pack (Stage 3)

### 6 quest templates (JSON)
```json
[
  {"id":"quest_hunt","type":"kill_target","goal":{"enemyId":"wolf_alpha","count":1},"states":["offered","accepted","complete","turned_in"],"rewards":{"xp":120,"gold":45}},
  {"id":"quest_collect","type":"collect_items","goal":{"itemId":"amber_herb","count":6},"states":["offered","accepted","complete","turned_in"],"rewards":{"xp":90,"gold":35}},
  {"id":"quest_deliver","type":"delivery","goal":{"from":"npc_guide","to":"npc_alchemist"},"states":["offered","accepted","complete","turned_in"],"rewards":{"xp":75,"gold":30}},
  {"id":"quest_explore","type":"reach_location","goal":{"locationId":"map_ruined_outlook"},"states":["offered","accepted","complete","turned_in"],"rewards":{"xp":110,"gold":40}},
  {"id":"quest_defend","type":"survive_waves","goal":{"waves":3},"states":["offered","accepted","complete","turned_in"],"rewards":{"xp":150,"gold":55}},
  {"id":"quest_ritual","type":"perform_sequence","goal":{"actions":["magic_sense","magic_refine","magic_anchor"]},"states":["offered","accepted","complete","turned_in"],"rewards":{"xp":160,"gold":60}}
]
```

### Narration rules (state -> LitRPG text)
1. Mention **current objective** first.
2. Mention **one mechanical signal** (HP/resource/quest step).
3. Mention **one world signal** (time/weather/location).
4. End with **2-3 actionable choices** tied to valid verbs.
5. Keep tense and POV consistent (2nd person present works well).

### Example narrated scene
- “The Guide’s sigil pulses once as your quest log marks **Hunt the Alpha (0/1)**. Your health is steady, but your mana reserve sits at **41/60**, enough for one safe weave before rest. Dusk pulls long shadows across the training glade, and fresh tracks cut toward the ruined path. You can **[Track the alpha]**, **[Rest at the waypoint]**, or **[Inspect the tracks for an ambush bonus]**.”

**What to do / where / verify**
- **Do:** add quest template JSON and narration formatter rules.
- **Where:** canonical content folder (`packages/game-core/src/data` or dedicated `packages/game-content/`).
- **Verify:** run one deterministic seed twice; ensure same quest state + same narrator structure.

**Beginner Tips:**
- Put quest state in data, not hardcoded strings in UI.
- Narration should explain mechanics, not hide them.
- Give choices that map to real actions.
- Reuse templates for faster content creation.
- Determinism helps debugging story bugs.

---

## 7) Godot Integration Plan (Stage 4)

### Where to place integration scripts
- Keep Godot runtime adapters under `godot/scripts/` (existing runtime/client model already documented).
- Add a `CanonClient.gd` wrapper that only sends actions and receives canonical state/events.

### Event/state consumption model
- Godot sends command envelope (`runId`, action, seq hint).
- Canon backend validates and mutates.
- Godot receives `nextState + events + meta(contentVersion/stateVersion/tick)`.
- UI scenes react to events, not local rule recomputation.

### End-to-end example flow
1. Player presses `E` near NPC.
2. Godot builds `INTERACT` action and POSTs to `/api/sync/command`.
3. Canon engine resolves action and emits `QUEST_UPDATED` event.
4. Response returns updated quest flag + tick increment.
5. Godot updates quest panel + narrator panel from returned state/event payload.

**What to do / where / verify**
- **Do:** add tiny `CanonClient.gd` + map one `INTERACT` path.
- **Where:** `godot/scripts/` and existing `WorldController` call points.
- **Verify:** run headless smoke and confirm quest flag changes after one interact.

**Beginner Tips:**
- Godot should ask canon, not decide canon.
- Use events for UI updates; it’s cleaner.
- Start with one action (`INTERACT`) before adding many.
- Keep payloads small and explicit.
- Log request/response JSON during early integration.

---

## 8) QA / Tests / Acceptance Checks (Stage 5)

### Minimal smoke checklist
- Canon typecheck passes.
- Lint passes (or only known warnings).
- Unit smoke tests pass.
- One deterministic replay hash remains stable across two runs.
- Godot headless command path works for one action.

### 5 regression tests
1. Same seed + same actions => same final state hash.
2. Invalid action rejected without mutating tick/state.
3. `contentVersion` mismatch triggers compatibility warning path.
4. Quest transition order cannot skip required states.
5. Godot UI updates from emitted events even if narration API is delayed.

### Instrumentation suggestions
- Structured command log: `{runId, seq, actionType, tickBefore, tickAfter, stateHash}`.
- Event counters per session: `QUEST_UPDATED`, `LEVEL_UP`, etc.
- Error taxonomy: validation vs transport vs schema mismatch.

### Failure modes + rollback strategy
- **Mode:** schema mismatch on client update.
  - **Rollback:** pin previous `contentVersion` and disable new content pack.
- **Mode:** duplicate-logic divergence.
  - **Rollback:** route adapter to package-canon import only.
- **Mode:** replay instability.
  - **Rollback:** block release and compare action log deltas.

**What to do / where / verify**
- **Do:** add one determinism regression test and one invalid-action non-mutation test.
- **Where:** `tests/unit/`.
- **Verify:** run `npm run test:smoke` + determinism test command.

**Beginner Tips:**
- Determinism tests are your safety net.
- Rejections should never mutate state.
- Logs make “random bugs” debuggable.
- Rollback plans reduce release fear.
- Keep QA checklist short and repeatable.

---

## 9) Next 7 Steps (Beginner-Friendly) + Merge Plan (Stage 6)

1. **Pick canon source of truth explicitly** (`packages/game-core` + `packages/game-schemas`).
2. **Add a tiny `events.d.ts` contract** and one canonical event enum.
3. **Replace one duplicated module pair with re-export** (start with `InputParser`).
4. **Add archetype budget JSON** with 8 archetypes and validation.
5. **Add quest template JSON file** with 6 templates.
6. **Wire one Godot action (`INTERACT`) through canon end-to-end.**
7. **Add two regression tests** (determinism + invalid-action no mutation).

### Suggested patch sets (small + reversible)
- **Patch Set A (Canon contracts):** `events.d.ts`, contentVersion format doc update.
- **Patch Set B (De-dup start):** one module re-export migration + import path cleanup.
- **Patch Set C (Gameplay content):** archetype budget JSON + quest templates + tests.

### Acceptance checks per patch
- **A:** typecheck + smoke tests pass.
- **B:** no behavior change in smoke tests + no new lint issues.
- **C:** schema/validation passes + deterministic replay unchanged for baseline scenario.

**Beginner Tips:**
- One patch = one intent.
- Keep rollback easy: small PRs.
- Start with contracts before mechanics.
- Validate every patch immediately.
- Document each decision in plain language.
