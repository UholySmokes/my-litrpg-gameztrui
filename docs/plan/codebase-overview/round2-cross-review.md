# Round 2 — Cross-Review & Consensus

> **Date:** 2026-03-19  
> **Facilitator:** Strategic Planner  
> **Participants:** Dev Team Alpha, Dev Team Beta, Game Design Team, Gamer Advisory Council, Technical Analysis Board  
> **Input:** 5 Round 1 proposals + verified codebase state  
> **Output:** Consensus decisions on 10 tensions + Unified Task List

---

## Verified Codebase State (Ground Truth)

Before debating, the following was verified against the actual code:

| Fact | Verified Value | Source |
|------|---------------|--------|
| Enemy count | **8** (levels 1–10) | `EnemyDataRegistry.js` — 8 `id:` entries |
| ActionDispatcher size | **601 lines** | `ActionDispatcher.js` |
| XP brackets | **1** (`{end:1000, base:100, growth:1.5}`) | `initialState.js:31` |
| Rest heal config | `restHealAmount: 0, restManaAmount: 0` | `initialState.js:19-20` |
| Rest heal actual behavior | 25% max HP fallback **AND** 25% max mana fallback | `ActionDispatcher.js:493-498` — both have identical fallback |
| XP bracket support | Multi-bracket already supported in code | `xpCurve.js:7-8` reads `config?.xpBrackets` array |
| ErrorBoundary | Already exists in `main.jsx` | False positive confirmed |

---

## Tension Debates & Consensus

### Tension 1: Enemy Count — 25-30 vs 50+ vs 62

**Positions:**
- **Game Design:** 62 enemies across 20 tiers, full bestiary-ready
- **Gamer Council:** 50+ minimum — "8 enemies for a 1000-level game is a joke"
- **Analysis Board:** 25-30 is credible alpha. 62 is scope creep for pre-release
- **Dev Alpha:** No opinion (infrastructure focus)
- **Dev Beta:** No opinion (engine/test focus)

**Debate:**

> **Analysis Board (Dr. Nakamura):** "Slay the Spire shipped ~50 enemies after years of development. We're building a text RPG. 25-30 across 5 tiers gives real variety at every stage without drowning in QA. Each enemy needs balance testing, narrative text, loot tables."

> **Gamer Council (Havoc):** "25 isn't enough. I will fight the same 5 enemies per tier. That gets repetitive in 30 minutes. 50 means 10 per tier across 5 tiers — that's minimum variety."

> **Game Design (Yara):** "I proposed 62 as the ideal. But I can phase it: 30 enemies in Phase 2 (one sprint), scale to 50+ in Phase 3. The data format is templated — adding enemies is fast once the template is set."

> **Analysis Board (Dr. Chen):** "Phased is smart. Ship 30, then expand. But track: each enemy needs a name, level range, stats, loot drops, and narrative flavor text. At ~2h per enemy including testing, 30 = 60 person-hours. 50 = 100h."

**CONSENSUS:** **30 enemies in Phase 2 (P1), expand to 50 in Phase 3 (P2).** Structured as 6 tiers × 5 enemies each for Phase 2. Game Design produces the data, Dev Beta writes balance verification tests. Analysis Board's 2h/enemy estimate accepted (60h for 30, spread across content + QA).

---

### Tension 2: ActionDispatcher Refactor — Do It vs Skip It

**Positions:**
- **Dev Beta:** 12h refactor to registry pattern. 601-line switch-case is a maintenance bomb
- **Gamer Council:** "Skip it. Players don't see architecture. Ship content."
- **Analysis Board:** ROI 0.4. Skip. No player-facing value
- **Dev Alpha:** Neutral (not their codebase area)
- **Game Design:** Neutral

**Debate:**

> **Dev Beta (Alex):** "Every new action type requires editing a 601-line switch-case. Quick-action buttons, new combat moves, new rest variants — they all go here. If we add 5 new action types this quarter, this file becomes 800+ lines. The refactor *enables* faster content shipping."

> **Gamer Council (Pixel):** "Okay, but does it take 12 hours away from making the game better for me? Yes. Defer it."

> **Analysis Board (Dr. Reyes):** "The ROI is 0.4 because the retention impact is near-zero. However, I concede Alex's point: if Q2 has 5+ new action types, the switch-case becomes a velocity bottleneck. Compromise: defer the FULL registry refactor, but extract quick-action handlers into a sub-module (3h) to unblock content work."

> **Dev Beta (Mei):** "I can accept a partial extraction. Move the top 3 action handlers (attack, rest, move) to separate files, keep the switch-case as a dispatcher. 3-4 hours. We get modular handlers without a full rewrite."

**CONSENSUS:** **Partial extraction only (P2, 4h).** Extract attack/rest/move handlers to separate files. Full registry refactor deferred to P3/backlog (8h remaining). This unblocks adding new action types without a 12h upfront cost.

---

### Tension 3: Rest Heal — Config vs Code vs Game Design

**Positions:**
- **Dev Beta:** Config says 0, code does 25% HP and 25% mana. Config is misleading — update it to match behavior
- **Analysis Board:** "15-minute fix. Change two numbers. ROI 64.0"
- **Game Design:** Proposed 25% HP / 40% mana as designed values
- **Gamer Council (Pixel):** "Rest should feel good. 25% is okay early, too little at high levels"

**Debate:**

> **Analysis Board (Dr. Okafor):** "The code already does 25% for BOTH HP and mana. Config says 0. The fix is literally `restHealAmount: 0.25` and `restManaAmount: 0.25` — wait, actually it's an absolute amount fallback, not a percentage config. The fallback is `Math.max(5, Math.floor(hp.max * 0.25))`. If we set config to a positive number, it uses that as a flat amount instead. We should keep the percentage-based fallback but make it explicit."

> **Game Design (Kai):** "I want 25% HP and 40% mana because mana recovery is harder to get otherwise. Spell casters are punished with 25% mana."

> **Dev Beta (Mei):** "The cleanest fix: change config to store percentage values (`restHealPercent: 0.25, restManaPercent: 0.40`) and update the 4 lines in ActionDispatcher to use them. Backward compatible — old saves with `restHealAmount: 0` still hit the fallback."

> **Gamer Council (Theorem):** "40% mana is generous but fair. Mana is the scarcer resource. I accept 25/40."

**CONSENSUS:** **Update config to percentage-based: 25% HP, 40% mana (P0, 1h).** Change `initialState.js` to `restHealPercent: 0.25, restManaPercent: 0.40`. Update ActionDispatcher to read percentages. Keep the `Math.max(5, ...)` floor for low-level characters. This is a P0 fix — ships with auth fix.

---

### Tension 4: Content vs Code Quality Priority

**Positions:**
- **Gamer Council:** "Content first. The game is 20% done with an 80% engine"
- **Dev Alpha:** "Security first. Auth bypass is a CVE"
- **Dev Beta:** "Quality gates prevent regressions that waste MORE time later"
- **Analysis Board:** "Security first → content → quality gates in parallel"
- **Game Design:** "Content is what players play"

**Debate:**

> **Dev Alpha (Priya):** "Auth bypass ships before ANYTHING. It's a half-day fix. Non-negotiable."

> **Gamer Council (Wanderer):** "Fine, fix auth. But then: enemies, locations, XP curve. Not CI pipelines."

> **Analysis Board (Dr. Singh):** "The right order is: (1) security P0 fixes [0.5 day], (2) XP curve + rest heal [1 day], (3) content expansion [ongoing], with quality gates (coverage thresholds, smoke tests) running in parallel — they don't block content work."

> **Dev Beta (Darius):** "Coverage thresholds take 2 hours. Smoke test expansion takes 4 hours. These can run in parallel with content work. They're not either/or."

> **Gamer Council (Pixel):** "If quality gates take 6 hours total and run in parallel, fine. But don't let a CI pipeline block enemy content for 3 weeks."

**CONSENSUS:** **Security P0 first (day 1), then XP/rest fixes, then content AND quality gates in parallel.** Coverage thresholds (2h) and smoke test expansion (4h) are P1 but explicitly non-blocking for content work. CI/CD pipeline is P2. Docker cleanup is P3.

---

### Tension 5: AI Memory Scope — 30-40 vs Hierarchical Summarization

**Positions:**
- **Analysis Board:** 30-40 entries. Simple, ships fast
- **Game Design:** Hierarchical summarization with 100+ compressed entries
- **Gamer Council (Wanderer):** "I want the AI to remember my story. 20 entries is amnesia"

**Debate:**

> **Analysis Board (Dr. Chen):** "Current code has DEFAULT_MAX_ENTRIES = 120 in the narrative memory. The '20-entry limit' in the player review was incorrect. The actual limit is already 120. The question is whether to add summarization on top."

> **Game Design (Nadia):** "120 raw entries is fine for now. Summarization is a P3 optimization — it's complex (LLM-driven compression) and the base is adequate."

> **Gamer Council (Wanderer):** "Wait, it's already 120? That changes things. 120 is plenty for alpha. Summarization is nice-to-have."

**CONSENSUS:** **No immediate changes needed (current: 120 entries). Hierarchical summarization deferred to P3.** The original player concern was based on incorrect data. Current 120-entry window is adequate for alpha.

---

### Tension 6: Quick-Action Scope — 3 Buttons vs Full Action Bar

**Positions:**
- **Dev Beta:** 3 buttons (Attack/Rest/Escape), 8h effort
- **Game Design:** Full action bar with context-sensitive actions
- **Gamer Council (Pixel):** "3 buttons is the minimum. But I also want Use Skill and Use Item"

**Debate:**

> **Dev Beta (Alex):** "The existing `GameQuickActions.jsx` has panel-toggle buttons. In-game combat actions are separate. 3 core buttons (Attack, Rest, Escape) ship fast. Use Skill / Use Item need UI for skill/item selection — that's a picker component on top."

> **Gamer Council (Pixel):** "5 buttons: Attack, Rest, Escape, Use Skill, Use Item. Skill and Item open a sub-menu. This covers 95% of what I need."

> **Game Design (Nadia):** "Full action bar is Phase 4 polish. 5 buttons with sub-menus in Phase 3 is perfect."

> **Analysis Board (Dr. Chen):** "Attack + Rest + Escape = 8h. Adding Skill picker + Item picker = +6h. Total 14h for 5 buttons with sub-menus. That's reasonable."

**CONSENSUS:** **5 buttons with sub-menus (P1, 14h).** Attack, Rest, Escape as direct actions. Use Skill and Use Item open selection sub-menus. Full contextual action bar deferred to P3.

---

### Tension 7: Title Count — 52 vs 100+

**Positions:**
- **Game Design:** 52 titles across milestone tiers
- **Gamer Council (Archive):** 100+ — "Titles are the dopamine. More is better"
- **Analysis Board:** Agrees with Game Design's 52 as sufficient for alpha

**Debate:**

> **Game Design (Yara):** "52 covers every major milestone: level brackets, class evolutions, boss kills, quest completions, exploration, prestige. 100+ means inventing filler titles like 'Walked 1000 Steps.'"

> **Gamer Council (Archive):** "I want 100 because I want to show off. But if 52 covers real achievements and you add more later, I can wait."

> **Analysis Board (Dr. Nakamura):** "52 titles is 52 × ~15min = 13h of content creation. 100 titles = 25h. The marginal value of title #53-100 is low. Ship 52, add more based on player data."

**CONSENSUS:** **52 titles in Phase 2 (P2), expand based on player feedback.** Quality over quantity. Each title should feel earned. Gamer Council accepts if titles are visible in a collection UI (bestiary/achievement screen).

---

### Tension 8: Gacha Items — 85+ vs Fewer Well-Designed

**Positions:**
- **Game Design:** 85+ across 5 pools with pity system
- **Analysis Board:** Fewer well-designed items. 85 items with bad balance is worse than 30 good ones
- **Gamer Council (Archive):** "More is better for collectors, but pity system is mandatory"

**Debate:**

> **Analysis Board (Dr. Nakamura):** "Current: 20 items across 3 pools. Jumping to 85 means 65 new items. At ~1h each for design + balance + testing, that's 65h of content work. Too much for one sprint."

> **Game Design (Felix):** "Phase it: 40 items with pity system in Phase 2, expand to 85 in Phase 3. Pity system is 4h of code — it's a counter that guarantees a rare pull after N pulls."

> **Gamer Council (Archive):** "Pity system is non-negotiable. Even 40 items with pity > 85 items without pity."

> **Dev Beta (Mei):** "Pity system is a simple counter in gacha state. 4h sounds right."

**CONSENSUS:** **40 items + pity system in Phase 2 (P1), expand to 85 in Phase 3 (P2).** Pity system (guaranteed rare after N pulls) ships WITH the expanded pool. Current 20 items stay, add 20 new across 2 new pools.

---

### Tension 9: E2E Testing — Full Playwright vs Minimal Integration

**Positions:**
- **Dev Beta:** Full Playwright suite (Phase 4)
- **Analysis Board:** 5 integration tests. Playwright setup is 8+ hours for low ROI
- **Gamer Council:** "Don't care about tests. Ship content."

**Debate:**

> **Dev Beta (Darius):** "Full Playwright is Phase 4 — it's already the lowest-priority item in our plan. We're not blocking anything."

> **Analysis Board (Dr. Okafor):** "5 critical path integration tests (create character → fight → level → rest → save/load) give 80% of the confidence at 20% of the cost. Playwright setup + test writing = 12h. 5 targeted integration tests = 4h."

> **Dev Beta (Darius):** "Fine. 5 integration tests in Phase 3, full Playwright in Phase 4/backlog."

**CONSENSUS:** **5 critical-path integration tests in Phase 3 (P2, 4h). Full Playwright deferred to P3 backlog.** Tests cover: character creation, combat, leveling, rest, save/load round-trip.

---

### Tension 10: Death Penalty — Unaddressed Need

**Positions:**
- **Gamer Council:** Raised it. "What happens when I die? XP loss? Item loss? Respawn where?"
- **All other teams:** Did not address it

**Debate:**

> **Gamer Council (Havoc):** "Right now death seems to just... end combat? No penalty? No death screen? This matters for game feel."

> **Game Design (Kai):** "Currently on death, combat ends and the player returns to town with 1 HP. No XP loss, no item loss. This is actually fine for an alpha — punishing death penalties drive away casual players. We should add: (1) a clear death notification, (2) a gold penalty (lose 10% gold), and (3) respawn at last safe zone."

> **Analysis Board (Dr. Chen):** "Simple death penalty (gold loss + notification) is 4h of work. Don't add corpse runs or XP loss — that's design debt."

> **Gamer Council (Pixel):** "10% gold loss is fine. Just make it clear I died and why."

> **Gamer Council (Havoc):** "I want hardcore mode eventually — permadeath option. But 10% gold for alpha is fine."

**CONSENSUS:** **10% gold loss on death + death notification UI (P2, 4h).** Clear death screen with cause-of-death message. Respawn at last safe zone with 1 HP/1 mana. Hardcore/permadeath mode deferred to P3.

---

## Unmentioned Needs Assessment

The Gamer Council raised several needs that no other team addressed:

| Need | Verdict | Reasoning | Priority |
|------|---------|-----------|----------|
| Interactive tutorial | **P2** — Add in Phase 3 | Critical for onboarding. 3-step intro quest: "move → fight → rest" | 8h |
| Death penalty mechanics | **P2** — Addressed above | 10% gold + notification | 4h |
| Multiple save slots | **P3** — Backlog | Current save system works. Multiple slots is nice-to-have | 12h |
| Audio/sound design | **P3** — Backlog | Text RPG can ship without audio. Add ambient + SFX later | 40h+ |
| Social features | **P3** — Backlog | Single-player alpha doesn't need social | 80h+ |
| Currency sinks | **P2** — Phase 3 | Gold accumulates with no purpose. Add: item repair, potion restock, skill respec fee | 8h |

---

## UNIFIED TASK LIST

All 5 teams have agreed to the following merged plan. Tasks are ordered by dependency and ROI within each priority tier.

### Phase 0 — Ship Today (P0)

| ID | Title | Effort | Team | Files Affected | Notes |
|----|-------|--------|------|----------------|-------|
| U-001 | Auth bypass: production project ID guard | 3h | Alpha | `functions/lib/auth.js` | Dr. Singh: "Half-day, zero regression risk" |
| U-002 | Rest heal: update config to 25% HP / 40% mana | 1h | Beta | `initialState.js`, `ActionDispatcher.js` | ROI 64.0. Change to percentage-based config |
| U-003 | XP curve: add 8-bracket piecewise config | 4h | Design + Beta | `initialState.js`, tests | Data-only change — `xpCurve.js` already supports arrays |
| U-004 | Rate limiting: add express-rate-limit middleware | 6h | Alpha | `functions/index.js`, `functions/lib/rate-limit.js` | Already in package-lock, not imported |
| U-005 | Body size validation: reject oversized payloads | 2h | Alpha | `functions/index.js` | Pair with rate limiting |

**Phase 0 total: 16h (2 person-days)**

---

### Phase 1 — Next Sprint (P1)

| ID | Title | Effort | Team | Files Affected | Notes |
|----|-------|--------|------|----------------|-------|
| U-006 | Jest coverage thresholds (50% branches) | 2h | Beta | `package.json` | Non-blocking for content. Runs in parallel |
| U-007 | Expand smoke tests 6→24 files | 4h | Beta | `package.json` | Non-blocking for content |
| U-008 | Quick-action buttons (5: Attack/Rest/Escape/Skill/Item) | 14h | Beta + Design | `GameQuickActions.jsx`, new `ActionButtons.jsx`, `SkillPicker.jsx`, `ItemPicker.jsx` | Consensus: 5 buttons with sub-menus |
| U-009 | Enemy expansion: 8→30 (6 tiers × 5 each) | 30h | Design | `EnemyDataRegistry.js`, new enemy data files | Phase 1 of content. ~2h/enemy including testing |
| U-010 | Race attribute modifiers (net +5 budget) | 6h | Design + Beta | `initialState.js`, `CharacterCreation.jsx`, race data | Racial differentiation for build identity |
| U-011 | Gacha expansion: 20→40 items + pity system | 24h | Design + Beta | Gacha registries, `GachaSystem.js` | 20 new items across 2 new pools + pity counter |
| U-012 | Auto-stat allocation presets | 4h | Beta | New `AutoStatAllocator.js`, UI component | "Balanced / Offensive / Defensive / Custom" presets |
| U-013 | PrestigeSystem: resolve .js/.ts dual files | 0.5h | Beta | `PrestigeSystem.js`, `PrestigeSystem.ts` | Delete .js, keep .ts as canonical |

**Phase 1 total: 84.5h (~10.5 person-days)**

---

### Phase 2 — This Quarter (P2)

| ID | Title | Effort | Team | Files Affected | Notes |
|----|-------|--------|------|----------------|-------|
| U-014 | GitHub Actions deploy pipeline | 12h | Alpha | `.github/workflows/`, `firebase.json` | CI/CD for staging → production |
| U-015 | Staging environment setup | 8h | Alpha | Firebase config, env files | Separate Firebase project for staging |
| U-016 | ActionDispatcher partial extraction | 4h | Beta | `ActionDispatcher.js`, new handler files | Extract attack/rest/move to separate modules |
| U-017 | Enemy expansion: 30→50 (add 20 more) | 20h | Design | `EnemyDataRegistry.js` | Phase 2 of content expansion |
| U-018 | Location expansion: 24→40 | 16h | Design | Location data files | 2 new full zones + flesh out stubs |
| U-019 | Titles: add 44 new titles (8→52) | 12h | Design | Title registry | Milestone-based: levels, bosses, quests, exploration |
| U-020 | Death penalty: 10% gold loss + notification UI | 4h | Beta + Design | Combat system, new `DeathScreen.jsx` | Clear death cause message, respawn at safe zone |
| U-021 | Currency sinks: repair, potions, respec | 8h | Design + Beta | Economy system, shop data | Prevent gold accumulation |
| U-022 | Lane positioning controls (player-facing) | 6h | Beta | Combat UI, lane system | Expose existing 0.85x/0.7x modifiers to player choice |
| U-023 | 5 critical-path integration tests | 4h | Beta | `tests/integration/` | Create char → fight → level → rest → save/load |
| U-024 | Split monolith function into 3 | 8h | Alpha | `functions/index.js`, new function files | Separate narrate/sync/admin functions |
| U-025 | Interactive tutorial (3-step intro quest) | 8h | Design + Beta | New tutorial system, quest data | Move → Fight → Rest onboarding |
| U-026 | Bestiary / collection tracker UI | 8h | Beta + Design | New `Bestiary.jsx`, bestiary data | Track discovered enemies, items, titles |
| U-027 | Combat log (damage breakdown) | 6h | Beta | Combat system, new `CombatLog.jsx` | Per-hit breakdown: "Base 40 × Crit 1.5 × Lane 0.85" |
| U-028 | Declarative route table | 4h | Alpha | `functions/lib/api-router.js` | Replace manual route wiring |
| U-029 | Gacha expansion: 40→85 items | 24h | Design | Gacha registries | Phase 2 of gacha content |

**Phase 2 total: 152h (~19 person-days)**

---

### Phase 3 — Backlog (P3)

| ID | Title | Effort | Team | Files Affected | Notes |
|----|-------|--------|------|----------------|-------|
| U-030 | ActionDispatcher full registry refactor | 8h | Beta | `ActionDispatcher.js` | Complete the partial extraction from U-016 |
| U-031 | Dungeon system (10 dungeons) | 40h | Design + Beta | New dungeon system | Multi-room instanced content |
| U-032 | Endless tower mode | 20h | Design + Beta | New tower system | Escalating floors with leaderboard |
| U-033 | World bosses (3) | 16h | Design + Beta | Boss data, combat system | Scripted multi-phase encounters |
| U-034 | Faction reputation (5 tiers × 11 factions) | 20h | Design + Beta | New reputation system | Earn rep through quests/kills, unlock faction rewards |
| U-035 | AI narrative summarization (hierarchical) | 16h | Beta | Narrative memory system | Compress old entries, maintain themes |
| U-036 | Full Playwright E2E suite | 12h | Beta | `tests/e2e/` | Automated browser testing |
| U-037 | Docker cleanup / align with real stack | 4h | Alpha | `Dockerfile`, `docker-compose.yml` | Low priority — emulators work without Docker |
| U-038 | .nvmrc + CI Node version validation | 2h | Alpha | `.nvmrc`, CI config | Prevent version drift |
| U-039 | Progressive system reveal | 8h | Design + Beta | UI system | Hide advanced systems until player discovers them |
| U-040 | Multiple save slots | 12h | Beta | Save/load system | 3 save slots with naming |
| U-041 | Enemy expansion: 50→62+ | 12h | Design | `EnemyDataRegistry.js` | Final content polish |
| U-042 | Location expansion: 40→51 | 10h | Design | Location data | Complete remaining zone stubs |
| U-043 | Hardcore mode (permadeath option) | 6h | Design + Beta | Character creation, death system | Optional toggle at character creation |
| U-044 | Skill fusion transparency | 8h | Design + Beta | Skill system, UI | Show compatible pairs, success chance |
| U-045 | Loot stat range visibility | 6h | Design + Beta | Loot system, tooltip UI | Show affix ranges, roll quality |
| U-046 | Audio/sound design (ambient + SFX) | 40h | Design | Asset pipeline | Deferred — text RPG can ship without |
| U-047 | Social features | 80h | Beta | New social system | Single-player alpha doesn't need this |

**Phase 3 total: 320h (~40 person-days)**

---

## Priority Summary

| Priority | Task Count | Total Effort | Timeline |
|----------|-----------|-------------|----------|
| **P0** — Ship today | 5 | 16h | Day 1–2 |
| **P1** — Next sprint | 8 | 84.5h | Week 1–3 |
| **P2** — This quarter | 16 | 152h | Week 4–12 |
| **P3** — Backlog | 18 | 320h | Future |
| **TOTAL** | **47** | **572.5h** | — |

---

## Consensus Decision Summary

| # | Tension | Decision | Reasoning |
|---|---------|----------|-----------|
| 1 | Enemy count | **30 (P1) → 50 (P2) → 62+ (P3)** | Phased expansion. 30 is credible alpha, 50 gives variety, 62+ is polish |
| 2 | ActionDispatcher refactor | **Partial extraction 4h (P2), full refactor 8h (P3)** | Unblocks new actions without 12h upfront cost |
| 3 | Rest heal | **25% HP / 40% mana, percentage-based config (P0)** | Config was misleading. Behavior was fine for HP. Mana gets 40% for caster viability |
| 4 | Content vs Code Quality | **Security P0 → Content + Quality in parallel** | Quality gates (6h total) don't block content. Security is non-negotiable |
| 5 | AI memory | **No change needed (already 120 entries)** | Original concern based on incorrect data. Summarization deferred to P3 |
| 6 | Quick-action scope | **5 buttons with sub-menus (P1, 14h)** | Attack/Rest/Escape direct + Skill/Item pickers |
| 7 | Title count | **52 (P2), expand based on feedback** | Quality over quantity. Each title earns dopamine |
| 8 | Gacha items | **40 + pity (P1) → 85 (P2)** | Pity system is mandatory. Phased content expansion |
| 9 | E2E testing | **5 integration tests (P2, 4h). Full Playwright P3** | 80% confidence at 20% cost |
| 10 | Death penalty | **10% gold loss + death notification (P2, 4h)** | Simple, fair, visible. Hardcore mode deferred |

---

## Cross-Team Sign-Off

| Team | Approves? | Conditions |
|------|-----------|------------|
| **Dev Team Alpha** | ✅ | Auth fix ships first. CI pipeline stays P2 |
| **Dev Team Beta** | ✅ | Coverage thresholds (P1) run parallel. Partial refactor accepted |
| **Game Design** | ✅ | Content phases respected. Enemy count targets achievable |
| **Gamer Council** | ✅ | 5 quick-action buttons, 30+ enemies in sprint 1, pity system guaranteed |
| **Analysis Board** | ✅ | ROI-ordered plan. No scope creep in P0/P1. Phased expansion is data-driven |
