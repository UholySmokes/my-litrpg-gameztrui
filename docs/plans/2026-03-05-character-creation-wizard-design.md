# Character Creation Wizard (Basic + Advanced Unlock) — Design

Date: 2026-03-05  
Project: `my-litrpg-gameztrui` (Void-Verse)  
Status: Approved (user confirmed “yes”)

## Goals

- Deliver a **large, WotR-feeling** character creation experience without forcing deep rules complexity up front.
- Keep **first character** creation **fast and forgiving** (target: ~3–5 minutes).
- Keep **all choices reversible during creation** (no dead ends, no hidden permanent traps).
- Unlock an **Advanced** mode **after the first character** for optimizer depth (multiclass + trees).
- Produce a **stable “character blueprint”** that can be validated, stored, and replayed deterministically.

## Non-Goals (for this slice)

- Full WotR-style micro-choices at creation time (feat chains, deep prerequisites, long archetype forks).
- Permanent/irreversible character creation choices (we can add “hardcore mode” later).
- Full cosmetic pipeline (portraits/appearance) in the first pass.

## User Decisions Captured

- Commitment: **Reversible**.
- First character tabs: `Name`, `Race`, `Class`, `Origin`, `Attributes`, `Skills`, `Feats/Perks`, `Archetype System`, `Alignment`.
- Complexity: **push depth into later level-ups**.
- UI: **Wizard**.
- Advanced unlock: **after first character**, adds **multiclass + trees** (more later).

## Recommended Approach

**Option C: “Wizard + Summary + Undo”**

- A guided **8-step wizard** for the first character.
- Always-visible **Character Sheet Summary** (derived stats + warnings + preview).
- Full reversibility until the user presses **Finish**.
- Advanced mode appears after first character and adds optional branches.

## UX: Basic Wizard (First Character)

### Persistent elements

- **Progress**: stepper (1..8) with step titles and completion state.
- **Right-side summary** (“Character Sheet”):
  - current selections (race/class/origin/alignment)
  - derived stats (HP, damage baseline, resistances, etc. as available)
  - starting gear preview
  - synergy hints (using existing archetype recommendation logic)
  - warnings (e.g., “low STR for melee build”)
- **Controls** (always available):
  - `Back`, `Next`
  - `Reset Step`
  - `Randomize` (with “keep name” toggle)

### Step 1 — Name

- Fields: `name` (required), optional short `tagline` (flavor).
- Buttons: `Randomize Name`.

### Step 2 — Race

- Race cards with:
  - short fantasy pitch
  - stat modifiers / passives
  - “recommended for” tags (non-binding)

### Step 3 — Class

- Class cards with:
  - role / playstyle pitch
  - base scaling style (simple, not deep)
  - “later you’ll choose” notice (trees/paths occur at level-up)

### Step 4 — Origin

- Origin/background cards:
  - 1 trait + proficiency/starting bonus (simple)
  - roleplay hook tags (for narrative generation)

### Step 5 — Attributes

- **Point-buy** (simple) + presets:
  - Presets: `Recommended`, `Glass Cannon`, `Tank`, `Balanced` (names TBD).
  - Always shows derived deltas in summary panel.

### Step 6 — Skills

- Allocate skill points:
  - show impact hints (“+X% success”, “unlocks Y options”) where possible.

### Step 7 — Feats/Perks

- Pick a small number (1–2) of **low-coupling perks**:
  - explicitly mark: “respec available later”
  - avoid feat chain prerequisites in Basic mode

### Step 8 — Alignment

- Lightweight alignment selection:
  - primarily narrative / tag-based gating initially
  - show “this may influence” hints, but do not hard-lock core gameplay on day 1

### Finish

- Final review screen (inline, not a separate step):
  - highlight any warnings
  - confirm “You can respec later”

## UX: Advanced Mode (Unlocked After First Character)

### Unlock rule

- Advanced mode becomes available when `player_profile.characters_created >= 1`.

### Added surfaces

- **Multiclass**:
  - allow adding a second class (with clear tradeoffs)
- **Trees**:
  - enable class/archetype trees **as planning** (not forcing deep commitments at creation)

### Principle

- Advanced adds depth, but still keeps creation reversible until `Finish`.

## Data Model: Character Blueprint

Represent creation output as a single validated object (example keys; exact schema may differ):

- `id`
- `name`, `tagline`
- `race_id`, `class_id`, `origin_id`, `alignment_id`
- `attributes` (point-buy allocations)
- `skills` (allocations)
- `perks` (selected perk IDs)
- `archetype_system_id` (or recommendation seed / chosen track)
- `version` (schema version for migrations)

### Storage

- Persist blueprint in canonical state / save system as an append-only “creation event” plus current blueprint snapshot.
- Keep creation deterministic and replayable (fits existing sync/replay architecture).

### Respec policy (initial)

- During wizard: always reversible.
- Post-creation: allow full rebuild/respec (details deferred), but ensure the system can re-derive stats from blueprint + progression deltas.

## Telemetry (minimal, high value)

- Step time and drop-off:
  - `character_create_step_viewed`
  - `character_create_step_completed`
  - `character_create_finished`
- Randomize usage:
  - `character_create_randomize_used`
- Warning correlations:
  - which warnings appear and whether players abandon

## Acceptance Criteria

- First-time user can create a character in < 5 minutes.
- Every step is reversible; no step contains “dead end” validation failures without guidance.
- Summary panel updates live and matches derived stats after finalize.
- Advanced mode is hidden for first character and visible after at least one character exists.
- Blueprint persists and can be replayed/loaded without mismatch.

## Risks / Mitigations

- Risk: wizard becomes “big but empty”.
  - Mitigation: summary panel + strong copy + presets + warnings.
- Risk: advanced depth causes balance issues.
  - Mitigation: keep advanced choices as planners; lock deep commitments to level-up flows.

## Open Questions (for next pass)

- Exact point-buy curve and attribute caps.
- Respec currency/cost model (free early, then priced; or tokens).
- How alignment affects mechanics vs narrative vs gating.
- Which “trees” are purely planning at creation vs actual locked picks.

