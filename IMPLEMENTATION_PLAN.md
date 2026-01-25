# Implementation Plan (Prioritized)

This plan is sorted by priority. Each item includes scope, concrete tasks, and
clear deliverables so you can track progress and avoid design drift.

## Priority 0: Deterministic Simulation Spine (non-negotiable foundation)

### 0.1 Define simulation boundaries and core data model

- Scope: Decide what lives inside the sim (pure state + transitions) vs outside (UI, network).
- Tasks:
  - Define entity model: stats, resources, effects, cooldowns, tags, equipment.
  - Define world model: zones, locations, time, factions, global flags.
  - Define command model: input-only actions (UseSkill, Move, Equip, etc).
  - Define event model: all state changes emit events.
  - Choose tick size and unit conventions (turn, tick, second).
- Deliverables:
  - TypeScript interfaces and schema validation for state, commands, events.
  - Written "sim boundary" rules (no UI, no network calls).

### 0.2 Deterministic simulation kernel

- Scope: Fixed-tick loop that produces identical results from the same inputs.
- Tasks:
  - Implement tick(dt) and step(n) interfaces.
  - Build a seeded PRNG owned by the sim.
  - Build a command queue processed deterministically each tick.
  - Ensure all randomness comes from the sim PRNG.
- Deliverables:
  - Sim kernel module with deterministic tick loop.
  - Unit tests proving identical output for same seed + commands.

### 0.3 Event bus and event sourcing

- Scope: Every state mutation produces events; state = initial + event log.
- Tasks:
  - Add event dispatcher inside the sim.
  - Append-only event log with ordering and tick id.
  - Snapshotting every N ticks for fast reload.
  - Replay function that rebuilds state from seed + events.
- Deliverables:
  - Event log format.
  - Snapshot and replay utilities.
  - Replay test to verify determinism.

### 0.4 Command validation layer

- Scope: One gate between UI "intent" and sim "reality".
- Tasks:
  - ~~Define validators for current command set (use_item, move, rest, attack).~~
  - Validate resource costs, cooldowns, AP/initiative, target legality.
  - ~~Return structured errors for invalid commands.~~
- Deliverables:
  - ~~Validation module.~~
  - ~~Tests for common invalid cases.~~

### 0.5 Data-driven content pipeline

- Scope: Skills/classes/items defined as data, not hardcoded.
- Tasks:
  - Define schemas for skills, classes, items, effects.
  - Introduce versioned content IDs (skill.fireball.v3).
  - Migration strategy for old saves when content changes.
- Deliverables:
  - Content schemas.
  - Migration layer stub + test fixture.

### 0.6 System contract docs

- Scope: Each system documents inputs, outputs, events, dependencies.
- Tasks:
  - ~~Create a short contract template.~~
  - ~~Document the command validation layer.~~
  - ~~Document the headless sim runner.~~
  - ~~Document the sim kernel.~~
  - ~~Document the event log.~~
- Deliverables:
  - ~~Contract docs in `docs/system-contracts/`.~~
  - ~~Contract docs for all Priority 0 systems.~~

### 0.7 ~~Executable reference simulation (headless)~~

- Scope: ~~Minimal runnable sim with no UI.~~
- Tasks:
  - ~~CLI entry to run a canned scenario for N ticks.~~
  - ~~Log events and final stats to stdout.~~
- Deliverables:
  - ~~Headless sim runner script.~~
  - ~~Example scenario config.~~

## Priority 1: Core Combat Loop and Progression

### 1.1 AP/initiative scheduler

- Scope: Tick-based action scheduling.
- Tasks:
  - Define AP gain formula and thresholds.
  - Implement ready queue with deterministic tie-breaks.
  - Emit TurnStarted, APS gained, AP spent events.
- Deliverables:
  - Scheduler module and tests.

### 1.2 Action resolution pipeline

- Scope: Standardized action processing.
- Tasks:
  - Define base damage/heal formulas and modifiers.
  - Apply costs (mana, stamina, cooldowns, AP).
  - Emit events for each state change.
- Deliverables:
  - Action resolver module.
  - Baseline combat formula tests.

### 1.3 Effect system with stacking rules

- Scope: Buffs/debuffs with clear rules.
- Tasks:
  - Define effect fields: duration, stacks, source, stacking rule.
  - Implement refresh/add/replace/merge behaviors.
  - Ensure effect removal emits events.
- Deliverables:
  - Effect engine and tests.

### 1.4 Combat log as first-class output

- Scope: Every state change produces readable, filterable events.
- Tasks:
  - Define event payloads for combat-specific changes.
  - Create log serializers for UI or debugging.
- Deliverables:
  - Event schema entries for all combat events.

### 1.5 Stat pressure and thresholds

- Scope: Soft caps, hard thresholds, and imbalance penalties.
- Tasks:
  - Define soft cap curves for main stats.
  - Define threshold traits (e.g., INT > 120 unlocks Overclocked Mind).
  - Add imbalance penalties (e.g., high INT without WIS triggers events).
- Deliverables:
  - Threshold table and tests.
  - Event emissions for threshold changes.

### 1.6 Skill evolution and mutation

- Scope: Skills evolve or corrupt based on use.
- Tasks:
  - Track skill usage, catalysts, and mutation probability.
  - Define evolution paths and corrupted variants.
  - Add mutation events to narrative hooks.
- Deliverables:
  - Skill evolution data and resolver.
  - Tests for evolution and mutation triggers.

### 1.7 Failure as content

- Scope: Death and failure create progression.
- Tasks:
  - Define death traits, soul scars, echo stats.
  - Add inheritance rules across runs.
- Deliverables:
  - Death progression system and event outputs.

### 1.8 Class identity drift

- Scope: Classes subtly morph based on use.
- Tasks:
  - Define hidden alignment vectors (Order vs Chaos, Body vs Mind, etc).
  - Map usage patterns to alignment changes.
  - Modify class abilities over time without renaming class labels.
- Deliverables:
  - Alignment model and drift rules.

## Priority 2: Tactical Depth and AI Behavior

### 2.1 Targeting model and selectors

- Scope: Deterministic target selection.
- Tasks:
  - Define selector types (SingleEnemy, FrontmostInLane, AllEnemies, etc).
  - Implement target legality checks.
- Deliverables:
  - Targeting module and tests.

### 2.2 JRPG lane/slot battlefield model

- Scope: Tactical positioning without grid complexity.
- Tasks:
  - Define lanes, slots, and distance bands.
  - Implement intercept rules for front-line protection.
  - Add formation actions (swap, shift, lane change).
- Deliverables:
  - Formation model and rules.
  - Decision: number of lanes and intercept strength.

### 2.3 Intent/preview system

- Scope: Show predicted outcomes before committing.
- Tasks:
  - Use the same formulas as action resolution without consuming RNG.
  - Display damage ranges, hit/crit chance, AP cost.
- Deliverables:
  - Preview resolver and UI data schema.

### 2.4 Reaction system

- Scope: Interrupts and counters without real-time complexity.
- Tasks:
  - Add reaction triggers (OnHit, OnMove, OnCast, OnDeath).
  - Define reaction resource (ReactionPoint) and rules.
- Deliverables:
  - Reaction system and tests.

### 2.5 Threat/aggro model

- Scope: AI targeting and future party play.
- Tasks:
  - Track threat from damage, heals, taunts.
  - Use threat to influence AI target selection.
- Deliverables:
  - Threat model and AI hooks.

### 2.6 AI-driven NPC build logic

- Scope: System-aware, meta-reactive NPCs.
- Tasks:
  - Implement build heuristics (stat weighting, skill synergies).
  - Allow NPCs to discover strong combos from system signals.
- Deliverables:
  - NPC build planner and tests.

## Priority 3: Living World and Narrative Systems

### 3.1 World and lore persistence

- Scope: Established facts remain consistent.
- Tasks:
  - Store locations, NPCs, items as structured entries.
  - Update state when new entities are introduced.
  - Optional: lightweight knowledge graph for relationships.
- Deliverables:
  - World state store and retrieval APIs.

### 3.2 Dynamic narrative generation

- Scope: LLM generates descriptions grounded in state.
- Tasks:
  - Create prompt templates by mode (combat, exploration, dialogue).
  - Include few-shot examples for consistent tone.
  - Inject state context (time, injuries, recent events).
- Deliverables:
  - Prompt library and system-level guidelines.

### 3.3 AI-initiated events and main quest seeds

- Scope: World moves even when player is idle.
- Tasks:
  - Add a "story drive" component that can emit events.
  - Generate a main quest seed at start and store it.
- Deliverables:
  - Event generator and quest seed storage.

### 3.4 Narrative hooks from system events

- Scope: Systems automatically write lore.
- Tasks:
  - Translate key events into lore entries.
  - Example: surviving 5 lethal hits creates "The Unkillable".
- Deliverables:
  - Event-to-lore mapper.

### 3.5 Offline/background simulation

- Scope: World progresses without the player.
- Tasks:
  - Define time compression rules.
  - Run background ticks and summarize changes.
- Deliverables:
  - Offline sim runner.
  - Daily summary generator.

## Priority 4: UI and Debug Tooling

### 4.1 Systems HUD

- Scope: LitRPG feel and transparency.
- Tasks:
  - Event feed with filters.
  - Buff/debuff stack viewer with sources and durations.
  - Build inspector showing stat breakdown.
- Deliverables:
  - HUD components and data bindings.

### 4.2 Skill evolution tree

- Scope: Make progression legible.
- Tasks:
  - Visualize evolution paths and mutation chance.
  - Show requirements and catalysts.
- Deliverables:
  - Skill tree UI and tooltip content.

### 4.3 State diff and replay tools

- Scope: Debug and share runs.
- Tasks:
  - State diff viewer (before/after a command).
  - Replay scrubber built on event logs + snapshots.
- Deliverables:
  - Replay UI and diff panel.

### 4.4 Formation and target preview UI

- Scope: Make lane tactics clear.
- Tasks:
  - Formation grid showing lanes/slots.
  - Target highlights and intercept arrows.
- Deliverables:
  - Formation UI and preview overlays.

## Priority 5: Persistence, Meta-Progression, and Multiplayer Readiness

### 5.1 Save/load and run storage

- Scope: Deterministic replay and sharing.
- Tasks:
  - Persist seed, snapshots, and event logs.
  - Restore runs and resume from snapshots.
- Deliverables:
  - Save/load API and storage format.

### 5.2 Meta-progression across runs

- Scope: World and knowledge persist across characters.
- Tasks:
  - Define meta unlocks and inherited modifiers.
  - Allow the world to react faster to known exploits.
- Deliverables:
  - Meta progression data and rules.

### 5.3 Supabase integration plan

- Scope: Auth, persistence, and realtime later.
- Tasks:
  - Store run data (seed, snapshots, events).
  - Add user profiles and run history.
  - Avoid per-tick writes; batch events.
- Deliverables:
  - Data schema and storage strategy.

### 5.4 Authoritative server boundary

- Scope: Multiplayer-ready architecture without full build.
- Tasks:
  - Define client as UI + command source only.
  - Define server as authoritative sim kernel.
  - Extract sim into shared package.
- Deliverables:
  - Boundary document and module layout.

### 5.5 Multiplayer-friendly mechanics (solo-safe)

- Scope: Mechanics that scale to party play later.
- Tasks:
  - Add synergy tags (Bleed, Hex, Barrier, Combo Primer).
  - Support shared objectives (aggro tables, aura zones).
- Deliverables:
  - Tag system and initial mechanics set.

### 5.6 Headless batch simulation runner

- Scope: Balance and emergent build discovery.
- Tasks:
  - Run thousands of fights with seeded builds.
  - Output win rates, turn counts, and damage distributions.
- Deliverables:
  - Batch sim CLI and report format.

## Milestone checkpoints (sanity gates)

1) Post-Priority 0: You can replay a deterministic combat scenario from seed + commands.
2) Post-Priority 1: Basic combat feels complete (AP, effects, logs, evolutions).
3) Post-Priority 2: Tactical play exists (lanes, reactions, AI, threat).
4) Post-Priority 3: World feels alive (lore persistence, AI events, offline sim).
5) Post-Priority 4: UI feels like a LitRPG system OS.
6) Post-Priority 5: Runs persist, share, and scale to multiplayer later.
