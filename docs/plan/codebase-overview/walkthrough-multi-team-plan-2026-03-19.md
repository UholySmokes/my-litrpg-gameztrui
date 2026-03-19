# Voidverse Multi-Team Planning Process — Completion Walkthrough

**Date:** March 19, 2026  
**Plan ID:** `voidverse-fix-plan-2026-03-19`  
**Process:** 3-phase multi-team consensus (Research → Review → Planning)  
**Final Output:** [plan.yaml](plan.yaml) — 47 tasks, 572.5 hours

---

## Executive Summary

The Voidverse LitRPG underwent a structured 3-phase planning process to produce a prioritized, consensus-backed development plan. Phase 1 (Research) performed a full-codebase audit across all systems, APIs, and content. Phase 2 (Review) convened a 6-person dev team and a 6-archetype player group to evaluate findings independently. Phase 3 (Planning) assembled 5 specialized teams of 5 people each, conducted 2 rounds of structured debate, resolved 10 contested points through facilitated consensus, and produced a unified 47-task plan.

**Key outcome:** The plan corrected 4 factual errors from earlier reviews, resolved all cross-team tensions without vetoes, and produced a dependency-ordered task list spanning 4 priority tiers (P0–P3) totaling 572.5 person-hours.

**Gamer Council verdict:** *"The game is 20% finished with an 80% finished engine. Ship content before code quality."*

---

## Table of Contents

1. [Process Overview](#1-process-overview)
2. [Deliverables](#2-deliverables)
3. [Key Corrections & Learnings](#3-key-corrections--learnings)
4. [10 Consensus Decisions](#4-consensus-decisions)
5. [Plan Overview](#5-plan-overview)
6. [Cross-Team Sign-Off](#6-cross-team-sign-off)
7. [Next Steps](#7-next-steps)
8. [Appendix A — Team Rosters](#appendix-a--team-rosters)
9. [Appendix B — Process Diagram](#appendix-b--process-diagram)

---

## 1. Process Overview

### Phase 1 — Research (Codebase Analysis)

A comprehensive 3-pass analysis of the full monorepo using hybrid retrieval (semantic search, grep, directory mapping, targeted file reads). The output was a structured YAML report covering architecture, systems, APIs, content, and infrastructure.

| Attribute | Value |
|-----------|-------|
| **Output** | `research_findings_full-codebase.yaml` |
| **Scope** | All source, config, data, and infrastructure files |
| **Method** | 3-pass hybrid: broad discovery → system refinement → deep dive on engine/sync/world |
| **Key finding** | Monorepo LitRPG with React + Firebase + Godot. Rich RPG systems, thin content, 1 critical security gap |

### Phase 2 — Review (Two-Panel Independent Review)

Two independent panels reviewed the research findings and produced separate assessments.

| Panel | Size | Focus | Output |
|-------|------|-------|--------|
| **Dev Team** | 6 engineers (Architect, Backend, Frontend, QA, DevOps, Game Systems) | Code quality, security, infrastructure, architecture | [review-dev-team.md](review-dev-team.md) |
| **Player Group** | 6 player archetypes (Min-Maxer, Explorer, Narrative, Casual, Hardcore PvE, Collector) | Gameplay, content, UX, balance, fun | [review-player-group.md](review-player-group.md) |

**Dev Team verdict:** Architecture is mature, 1 critical finding (auth bypass), 2 high-severity risks, 4 medium findings.  
**Player Group verdict:** Average excitement 6.5/10. Deep systems, starved content, broken XP scaling.

### Phase 3 — Planning (5 Teams × 5 People × 2 Rounds)

Five specialized teams each produced Round 1 proposals independently, then convened for a facilitated Round 2 cross-review where 10 contested tensions were debated to unanimous consensus.

| Round | Activity | Outcome |
|-------|----------|---------|
| **Round 1** | Each team independently proposes phased task lists from their domain perspective | 5 separate implementation plans |
| **Round 2** | Facilitated cross-review: 10 tensions debated, codebase facts verified, consensus reached | Unified 47-task plan with all 5 teams signing off |

---

## 2. Deliverables

| # | File | Description | Phase |
|---|------|-------------|-------|
| 1 | [research_findings_full-codebase.yaml](research_findings_full-codebase.yaml) | Structured full-codebase research output | Research |
| 2 | [review-dev-team.md](review-dev-team.md) | 6-person engineering review | Review |
| 3 | [review-player-group.md](review-player-group.md) | 6-archetype player review | Review |
| 4 | [round1-dev-team-alpha.md](round1-dev-team-alpha.md) | Dev Team Alpha (backend/security/infra) Round 1 proposal | Planning |
| 5 | [round1-dev-team-beta.md](round1-dev-team-beta.md) | Dev Team Beta (frontend/engine/tests) Round 1 proposal | Planning |
| 6 | [round1-game-design-team.md](round1-game-design-team.md) | Game Design Team Round 1 proposal | Planning |
| 7 | [round1-gamer-council.md](round1-gamer-council.md) | Gamer Advisory Council Round 1 priorities | Planning |
| 8 | [round1-analysis-board.md](round1-analysis-board.md) | Technical Analysis Board Round 1 feasibility assessment | Planning |
| 9 | [round2-cross-review.md](round2-cross-review.md) | Round 2 consensus debates, unified task list, sign-off | Planning |
| 10 | [plan.yaml](plan.yaml) | Final 47-task plan (machine-readable) | Planning |

---

## 3. Key Corrections & Learnings

The multi-team process surfaced 4 factual errors from earlier phases. Each was verified against source code before consensus decisions were made.

| # | Claim (from Review) | Actual (Verified) | Source | Impact |
|---|---------------------|-------------------|--------|--------|
| 1 | Rest heal amount is 0 — recovery is broken | Config says 0, but `ActionDispatcher.js:493-498` has a **25% max HP fallback** and **25% max mana fallback** via `Math.max(5, Math.floor(hp.max * 0.25))`. Behavior was correct for HP; mana had the same fallback (not "no fallback" as initially reported). Config was misleading, not the behavior. | `ActionDispatcher.js`, `initialState.js` | Changed from "fix broken mechanic" to "update config to match behavior + adjust mana to 40%" |
| 2 | AI narrative memory limited to 20 entries | Actual limit is **120 entries** (`DEFAULT_MAX_ENTRIES = 120` in narrative memory). Original player review was incorrect. | Narrative memory system | Removed from priority list entirely. Summarization deferred to P3 |
| 3 | Only 3 enemies in the game | Actual count is **8 enemies** (levels 1–10) in `EnemyDataRegistry.js`. Still critically low for a 1000-level game, but not as dire as reported. | `EnemyDataRegistry.js` — 8 `id:` entries | Enemy count corrected to 8; expansion targets adjusted |
| 4 | No ErrorBoundary in App.jsx | **ErrorBoundary already exists** — wraps `<App />` in `main.jsx` (L24-26). Component at `src/components/ErrorBoundary.jsx`. False positive in dev review. | `main.jsx` | Removed from task list entirely |

**Lesson:** Multi-team verification against source code prevented 4 incorrect tasks from entering the plan, saving an estimated 12+ hours of misdirected effort.

---

## 4. Consensus Decisions

Ten contested points were debated in Round 2 cross-review. All reached unanimous consensus.

### Decision 1 — Enemy Count: Phased Expansion

| Position | Team(s) | Argument |
|----------|---------|----------|
| 25–30 | Analysis Board | Credible alpha scope. 62 is scope creep. Each enemy needs balance + QA |
| 50+ | Gamer Council | "8 enemies for a 1000-level game is a joke." Minimum variety threshold |
| 62 across 20 tiers | Game Design | Full bestiary-ready. Templated format makes expansion fast |

**Consensus:** **30 enemies (P1, 60h) → 50 (P2, 20h) → 62+ (P3, 12h).** 6 tiers × 5 enemies in Phase 1. Game Design produces data, Dev Beta writes balance tests. ~2h/enemy estimate accepted.

---

### Decision 2 — ActionDispatcher Refactor: Partial Only

| Position | Team(s) | Argument |
|----------|---------|----------|
| Full 12h refactor | Dev Beta | 601-line switch-case is a maintenance bomb. Enables faster content shipping |
| Skip entirely | Gamer Council, Analysis Board | ROI 0.4. Players don't see architecture. Ship content |

**Consensus:** **Partial extraction only (P2, 4h).** Extract attack/rest/move handlers to separate files. Full registry refactor deferred to P3 (8h). Unblocks new action types without 12h upfront cost.

---

### Decision 3 — Rest Heal: Percentage-Based Config

| Position | Team(s) | Argument |
|----------|---------|----------|
| Update config to match code | Dev Beta, Analysis Board | Config says 0, code does 25%. Fix the lie. ROI 64.0 |
| 25% HP / 40% mana | Game Design | Mana recovery is harder to obtain — casters need the boost |

**Consensus:** **25% HP / 40% mana, percentage-based config (P0, 1h).** New config keys `restHealPercent` / `restManaPercent`. Keep `Math.max(5, ...)` floor for low-level characters.

---

### Decision 4 — Content vs Code Quality Priority

| Position | Team(s) | Argument |
|----------|---------|----------|
| Content first | Gamer Council, Game Design | "The game is 20% done with an 80% engine" |
| Security first | Dev Alpha | Auth bypass is CVE-level. Non-negotiable |
| Quality gates in parallel | Dev Beta, Analysis Board | Coverage thresholds (2h) + smoke tests (4h) don't block content |

**Consensus:** **Security P0 → Content + Quality gates in parallel.** Auth fix ships day 1. Quality gates (6h total) run alongside content work. CI/CD pipeline is P2. Docker cleanup is P3.

---

### Decision 5 — AI Memory: No Change Needed

| Position | Team(s) | Argument |
|----------|---------|----------|
| 30–40 entries | Analysis Board | Simple, ships fast |
| Hierarchical summarization | Game Design | 100+ compressed entries for richer narrative |
| More memory | Gamer Council | "20 entries is amnesia" |

**Consensus:** **No immediate changes (current: 120 entries).** The original concern was based on incorrect data — the limit is already 120, not 20. Hierarchical summarization deferred to P3.

---

### Decision 6 — Quick-Action Buttons: 5 with Sub-Menus

| Position | Team(s) | Argument |
|----------|---------|----------|
| 3 buttons (8h) | Dev Beta | Attack/Rest/Escape ships fast |
| Full action bar | Game Design | Context-sensitive, fully dynamic |
| 5 minimum | Gamer Council | "I also want Use Skill and Use Item" |

**Consensus:** **5 buttons with sub-menus (P1, 14h).** Attack, Rest, Escape as direct actions. Use Skill and Use Item open selection pickers. Full contextual action bar deferred to P3.

---

### Decision 7 — Title Count: 52

| Position | Team(s) | Argument |
|----------|---------|----------|
| 52 | Game Design, Analysis Board | Covers every major milestone. Quality over quantity |
| 100+ | Gamer Council | "Titles are the dopamine. More is better" |

**Consensus:** **52 titles (P2, 12h), expand based on player feedback.** Each title should feel earned. Collector archetype accepts if titles are visible in a collection UI.

---

### Decision 8 — Gacha Items: Phased + Pity

| Position | Team(s) | Argument |
|----------|---------|----------|
| 85+ | Game Design | Full pool across 5 tiers |
| Fewer, well-designed | Analysis Board | 85 items with bad balance is worse than 30 good ones |
| Pity is mandatory | Gamer Council | "Even 40 items with pity > 85 items without pity" |

**Consensus:** **40 items + pity system (P1, 24h) → 85 items (P2, 24h).** Pity system (guaranteed rare after N pulls) ships with the expanded pool. Current 20 items stay; add 20 new across 2 pools.

---

### Decision 9 — E2E Testing: Targeted Integration

| Position | Team(s) | Argument |
|----------|---------|----------|
| Full Playwright suite | Dev Beta | Comprehensive but acknowledged as low priority |
| 5 integration tests | Analysis Board | 80% confidence at 20% cost |
| Don't care | Gamer Council | "Ship content" |

**Consensus:** **5 critical-path integration tests (P2, 4h). Full Playwright deferred to P3 (12h).** Tests cover: character creation → combat → leveling → rest → save/load round-trip.

---

### Decision 10 — Death Penalty: Gold Loss + Notification

| Position | Team(s) | Argument |
|----------|---------|----------|
| Needs addressing | Gamer Council | "Right now death seems to just... end combat? No penalty?" |
| Previously unaddressed | All other teams | Not in any Round 1 proposal |

**Consensus:** **10% gold loss on death + death notification UI (P2, 4h).** Clear death screen with cause-of-death message. Respawn at last safe zone with 1 HP/1 mana. Hardcore/permadeath mode deferred to P3.

---

## 5. Plan Overview

### Summary by Priority Tier

| Priority | Tier | Tasks | Effort | Timeline |
|----------|------|-------|--------|----------|
| **P0** | Ship Today | 5 | 16h | Day 1–2 |
| **P1** | Next Sprint | 8 | 84.5h | Week 1–3 |
| **P2** | This Quarter | 16 | 152h | Week 4–12 |
| **P3** | Backlog | 18 | 320h | Future |
| | **Total** | **47** | **572.5h** | |

### P0 — Ship Today (5 tasks, 16h)

| ID | Task | Effort | Team |
|----|------|--------|------|
| U-001 | Auth bypass: production project ID guard | 3h | Alpha |
| U-002 | Rest heal: update config to 25% HP / 40% mana | 1h | Beta |
| U-003 | XP curve: add 8-bracket piecewise config | 4h | Design + Beta |
| U-004 | Rate limiting: add express-rate-limit middleware | 6h | Alpha |
| U-005 | Body size validation: reject oversized payloads | 2h | Alpha |

### P1 — Next Sprint (8 tasks, 84.5h)

| ID | Task | Effort | Team |
|----|------|--------|------|
| U-006 | Jest coverage thresholds (50% branches) | 2h | Beta |
| U-007 | Expand smoke tests 6→24 files | 4h | Beta |
| U-008 | Quick-action buttons (5 with sub-menus) | 14h | Beta + Design |
| U-009 | Enemy expansion: 8→30 (6 tiers × 5) | 30h | Design |
| U-010 | Race attribute modifiers (net +5 budget) | 6h | Design + Beta |
| U-011 | Gacha expansion: 20→40 items + pity system | 24h | Design + Beta |
| U-012 | Auto-stat allocation presets | 4h | Beta |
| U-013 | PrestigeSystem: resolve .js/.ts dual files | 0.5h | Beta |

### P2 — This Quarter (16 tasks, 152h)

| ID | Task | Effort | Team |
|----|------|--------|------|
| U-014 | GitHub Actions deploy pipeline | 12h | Alpha |
| U-015 | Staging environment setup | 8h | Alpha |
| U-016 | ActionDispatcher partial extraction | 4h | Beta |
| U-017 | Enemy expansion: 30→50 | 20h | Design |
| U-018 | Location expansion: 24→40 | 16h | Design |
| U-019 | Titles: 8→52 | 12h | Design |
| U-020 | Death penalty: 10% gold + notification | 4h | Beta + Design |
| U-021 | Currency sinks: repair, potions, respec | 8h | Design + Beta |
| U-022 | Lane positioning controls | 6h | Beta |
| U-023 | 5 critical-path integration tests | 4h | Beta |
| U-024 | Split monolith function into 3 | 8h | Alpha |
| U-025 | Interactive tutorial (3-step intro quest) | 8h | Design + Beta |
| U-026 | Bestiary / collection tracker UI | 8h | Beta + Design |
| U-027 | Combat log (damage breakdown) | 6h | Beta |
| U-028 | Declarative route table | 4h | Alpha |
| U-029 | Gacha expansion: 40→85 items | 24h | Design |

### P3 — Backlog (18 tasks, 320h)

| ID | Task | Effort | Team |
|----|------|--------|------|
| U-030 | ActionDispatcher full registry refactor | 8h | Beta |
| U-031 | Dungeon system (10 dungeons) | 40h | Design + Beta |
| U-032 | Endless tower mode | 20h | Design + Beta |
| U-033 | World bosses (3) | 16h | Design + Beta |
| U-034 | Faction reputation (5 tiers × 11 factions) | 20h | Design + Beta |
| U-035 | AI narrative summarization (hierarchical) | 16h | Beta |
| U-036 | Full Playwright E2E suite | 12h | Beta |
| U-037 | Docker cleanup / align with real stack | 4h | Alpha |
| U-038 | .nvmrc + CI Node version validation | 2h | Alpha |
| U-039 | Progressive system reveal | 8h | Design + Beta |
| U-040 | Multiple save slots | 12h | Beta |
| U-041 | Enemy expansion: 50→62+ | 12h | Design |
| U-042 | Location expansion: 40→51 | 10h | Design |
| U-043 | Hardcore mode (permadeath option) | 6h | Design + Beta |
| U-044 | Skill fusion transparency | 8h | Design + Beta |
| U-045 | Loot stat range visibility | 6h | Design + Beta |
| U-046 | Audio/sound design (ambient + SFX) | 40h | Design |
| U-047 | Social features | 80h | Beta |

### Effort Distribution by Team

| Team | P0 | P1 | P2 | P3 | Total |
|------|:--:|:--:|:--:|:--:|------:|
| Alpha | 11h | — | 32h | 6h | **49h** |
| Beta | 1h | 24.5h | 46h | 130h | **201.5h** |
| Design | 4h | 60h | 68h | 152h | **284h** |
| Beta + Design (shared) | — | — | 6h | 32h | **38h** |

---

## 6. Cross-Team Sign-Off

All 5 teams approved the unified plan unanimously.

| Team | Approved | Conditions |
|------|:--------:|------------|
| Dev Team Alpha | ✅ | Auth fix ships first. CI pipeline stays P2 |
| Dev Team Beta | ✅ | Coverage thresholds (P1) run parallel. Partial refactor accepted |
| Game Design Team | ✅ | Content phases respected. Enemy count targets achievable |
| Gamer Advisory Council | ✅ | 5 quick-action buttons, 30+ enemies in sprint 1, pity system guaranteed |
| Technical Analysis Board | ✅ | ROI-ordered plan. No scope creep in P0/P1. Phased expansion is data-driven |

---

## 7. Next Steps

1. **P0 execution (Day 1–2):** Auth bypass fix, rest heal config, XP curve brackets, rate limiting, body validation. 16h of work across Alpha and Beta.
2. **P1 sprint kickoff (Week 1):** Begin enemy content pipeline (30 enemies), quick-action UI, gacha expansion with pity system.
3. **Quality gates in parallel:** Jest coverage thresholds and smoke test expansion run alongside content work — explicitly non-blocking.
4. **Plan tracking:** Use `plan.yaml` task IDs (U-001 through U-047) for commit references and progress tracking.
5. **Retrospective gate:** After P1 completion, review enemy count feedback and gacha pity tuning before committing to P2 expansion targets.

---

## Appendix A — Team Rosters

### Dev Team Alpha — Backend, Security, Infrastructure

| Name | Role |
|------|------|
| Marcus | Tech Lead |
| Priya | Security |
| Jin | API Dev |
| Olga | DB Engineer |
| Sam | DevOps |

### Dev Team Beta — Frontend, Engine, Testing

| Name | Role |
|------|------|
| Alex | Frontend |
| Mei | Game Engine |
| Darius | QA Lead |
| Luna | Simulation |
| Raj | TypeScript/Schemas |

### Game Design Team — Content, Balance, Systems Design

| Name | Role |
|------|------|
| Director Chen | Design Lead |
| Kai | Systems Designer |
| Yara | Content Designer |
| Felix | Economy Designer |
| Nadia | UX Designer |

### Gamer Advisory Council — Player Experience Validation

| Handle | Archetype | What Makes Them Quit |
|--------|-----------|---------------------|
| Theorem | Min-Maxer / Theorycrafter | Hidden formulas, dead builds, illusion of choice |
| Wanderer | Explorer / Lore Hunter | Empty worlds, railroaded stories, nothing to discover |
| Pixel | Casual / Mobile Gamer | Confusing UX, no progress in 10 minutes, walls with no bypass |
| Havoc | Hardcore PvE | No challenge, no skill expression, boring endgame |
| Archive | Collector / Completionist | Nothing to collect, no tracker, RNG without mercy |

### Technical Analysis Board — Feasibility, ROI, Risk Assessment

| Name | Specialization |
|------|---------------|
| Dr. Reyes | Software Architecture |
| Dr. Nakamura | Industry Benchmarking |
| Dr. Singh | Security & Risk |
| Dr. Chen | Product Strategy |
| Dr. Okafor | Quality Assurance |

---

## Appendix B — Process Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 1 — RESEARCH                       │
│                                                             │
│  Full codebase → 3-pass hybrid analysis → YAML findings     │
│  Output: research_findings_full-codebase.yaml               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 2 — REVIEW                         │
│                                                             │
│  ┌──────────────────┐    ┌───────────────────────┐          │
│  │  6-Person Dev     │    │  6-Archetype Player   │          │
│  │  Team Review      │    │  Group Review         │          │
│  │  (10 tech issues) │    │  (6 gameplay issues)  │          │
│  └────────┬─────────┘    └──────────┬────────────┘          │
│           └──────────┬──────────────┘                       │
│  Output: review-dev-team.md, review-player-group.md         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 3 — PLANNING                       │
│                                                             │
│  ROUND 1: 5 teams × 5 people — independent proposals       │
│  ┌───────┐ ┌───────┐ ┌────────┐ ┌────────┐ ┌──────────┐   │
│  │Alpha  │ │Beta   │ │Design  │ │Gamer   │ │Analysis  │   │
│  │(infra)│ │(front)│ │(content│ │Council │ │Board     │   │
│  │       │ │       │ │balance)│ │(player)│ │(ROI/risk)│   │
│  └───┬───┘ └───┬───┘ └───┬────┘ └───┬────┘ └────┬─────┘   │
│      └────┬────┴────┬────┴────┬─────┘           │          │
│           │         │         │                  │          │
│           ▼         ▼         ▼                  │          │
│  ROUND 2: Cross-review — 10 tension debates ◄───┘          │
│           │                                                 │
│           ▼                                                 │
│  ✅ Unanimous consensus → 47-task unified plan              │
│  Output: round2-cross-review.md, plan.yaml                  │
└─────────────────────────────────────────────────────────────┘
```

---

*This document is a read-only walkthrough. The executable plan is in [plan.yaml](plan.yaml).*
