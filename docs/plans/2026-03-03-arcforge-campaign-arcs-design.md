# ArcForge — Campaign Arcs + Class/Race Sagas (Design)

**Date:** 2026-03-03

## Summary
Build a structured campaign arc engine (persistent, branching storylines with consequences) where runtime AI generates quests/scenes *inside strict schemas*, and every accepted generation is canon-locked into the player's save + event log so it becomes replayable, debuggable, and expandable into seasons/expansions.

This also introduces Class Sagas and Race Sagas: arc lanes that express build identity (unlock beats, mentors, rites, faction ties) and can gate evolutions/unlocks with narrative justification.

## Goals (highest potential)
- Multi-quest campaign arcs with persistent state: recurring NPCs/factions, branching, consequences that alter later content.
- Runtime AI generation for variety, but with hard contracts so output is coherent and trackable.
- Canon lock-in + replayability: once generated, content is stored and does not re-roll on replay.
- Class/race identity becomes story-driving, not cosmetic: sagas that interact with world arcs.
- Tooling-first QA so the system scales without narrative incoherence (validators, regression harness, inspection UI).

## Non-goals (for this design phase)
- MMO-style server-authoritative world or matchmaking.
- Replacing the existing deterministic simulation kernel/event sourcing spine.
- A full UI redesign (only targeted inspection/debug UI is assumed).

## Core Principles
1. Structure first, AI second: AI fills scenes/quests/dialogue; the arc engine controls state transitions and invariants.
2. Canon is append-only: AI can add canon facts; it cannot rewrite prior canon. Contradictions are rejected.
3. Quest objectives must be trackable: generated objectives must compile into criteria the quest tracker can evaluate.
4. Everything is versioned: arc blueprints, beat packet schema versions, and unlock rules.

---

## Key Concepts

### Arc Blueprint (static)
Authored, versioned definition of:
- arc identity (`arcId`, `version`)
- beats (nodes) and transitions (edges)
- required context (biome, factions, systems)
- allowed consequence ranges (what can change)
- content budgets (max new NPCs per beat, max branching depth, etc.)

### Arc Instance (runtime)
Per-save running state:
- current beat(s) + completed beats
- decision history + selected edge transitions
- persistent arc flags/counters
- references to canon-locked generated artifacts (beat packets, NPC IDs, faction IDs)

### Beat Packet (canon-locked generated artifact)
JSON output produced by AI for a beat, validated and stored:
- quests (with objectives/criteria)
- scenes (narrative beat seeds, dialogue hooks)
- new/updated canon entities (NPCs, factions, locations)
- rewards/unlocks proposals (bounded by blueprint constraints)

Beat packets are appended to canon and referenced forever by ID/hash.

### Canon Store
Normalized memory used to maintain coherence:
- entities: `npc.*`, `faction.*`, `location.*`, `artifact.*`
- facts: key-value claims with provenance (`createdByBeatPacketId`)
- relationships: affiliations, rivalries, debts, oaths

This is the "truth" the narrator and generator must respect.

---

## Data Model (shape; exact schema lives in `packages/game-schemas`)

### ArcBlueprint (illustrative)
```ts
type ArcBlueprint = {
  id: string;                 // "arc.voidverse.market_broker"
  version: number;            // 1
  name: string;
  kind: "world" | "class" | "race";
  tags?: { favoredClasses?: string[]; favoredRaces?: string[]; biome?: string };

  beats: Array<{
    id: string;               // "beat.intel", "beat.confrontation"
    summary: string;
    gates?: { minLevel?: number; classId?: string; raceId?: string; requiredFlags?: string[] };
    budgets?: { maxNewNpcs?: number; maxNewFactions?: number; maxNewLocations?: number };
    aiPromptHints?: string[];
    transitions: Array<{
      id: string;             // "edge.negotiate", "edge.raid"
      condition?: { flag?: string; decisionId?: string };
      setsFlags?: string[];
      nextBeatId: string | null; // null => arc complete
    }>;
  }>;

  invariants?: Array<string>; // human-readable now; machine-checkable later
};
```

### BeatPacket (illustrative)
```ts
type BeatPacket = {
  id: string;                 // "beatpkt.<uuid>" or hash
  arcId: string;
  arcVersion: number;
  beatId: string;
  schemaVersion: number;

  canon: {
    entities: Array<{ id: string; type: "npc"|"faction"|"location"|"artifact"; name: string; notes?: string }>;
    facts: Array<{ key: string; value: string; subjectId?: string; confidence?: number }>;
    relationships: Array<{ a: string; rel: string; b: string; notes?: string }>;
  };

  quests: Array<{
    id: string;               // stable within save
    name: string;
    description: string;
    objectives: Array<{
      id: string;
      description: string;
      criteria: Record<string, unknown>;  // MUST compile to trackable criteria
    }>;
    rewards?: { xp?: number; items?: Array<{ id: string; quantity: number }> };
    tags?: Record<string, unknown>;
  }>;

  scenes: Array<{
    id: string;
    type: "intro"|"mid"|"outro";
    text: string;             // narrative seed text (not the live narration)
    dialogueHooks?: Array<{ speakerId?: string; intent: string; note: string }>;
  }>;

  unlocks?: Array<{
    kind: "class_evolution"|"race_awakening"|"skill_unlock";
    targetId: string;
    rationale: string;
  }>;
};
```

### ArcInstance (illustrative)
```ts
type ArcInstance = {
  id: string;                 // "inst.<uuid>"
  blueprintId: string;
  blueprintVersion: number;
  kind: "world" | "class" | "race";

  currentBeatId: string;
  completedBeatIds: string[];
  flags: Record<string, boolean>;
  counters: Record<string, number>;
  decisionHistory: Array<{ beatId: string; decisionId: string; edgeId: string; at: number }>;
  beatPacketIds: Record<string, string>; // beatId -> beatPacketId
};
```

---

## Runtime Flow (end-to-end)

### 1) Arc selection / initialization
- When a new run starts, pick:
  - 1 world arc (season spine)
  - 1 class saga (class identity arc)
  - 0-1 race saga (race identity arc)
- Create `ArcInstance`s and attach to the save state.

### 2) Beat activation
Each turn (or on major events), the Arc Engine:
- evaluates gates/triggers for active instances
- decides whether a beat should:
  - create a new quest
  - inject a scene hook
  - wait (gated)

### 3) Beat packet generation (AI) + validation
If beat has no canon packet yet:
- build generator input from: player snapshot, world state, arc state, canon summary, blueprint constraints
- call the generator to produce a `BeatPacket` JSON
- run validation:
  - schema validation (required fields, types)
  - semantic validation (budgets, no contradictions, objective criteria is trackable)
- on success:
  - persist beat packet in save (and/or backend) + store hash/id
  - append canon entities/facts + emit an "ArcBeatPacketAccepted" event
- on failure:
  - retry with tightened prompt and error hints
  - fallback to authored safe template if retries exhausted

### 4) Quest lifecycle + beat completion
- Convert `BeatPacket.quests[]` into active quests via QuestManager initialization.
- Quest progress is tracked through objective criteria.
- When a beat's required quest(s) complete, the arc advances via selected transition edge:
  - update flags/counters
  - set `currentBeatId = nextBeatId`
  - optionally generate next beat packet later (lazy)

### 5) Class/race saga unlocks
At specific beats, a saga can propose:
- class evolution unlock (ties into existing class evolution options)
- race awakening/ability unlock (ties into race ability sets)
- skill unlock (ties into existing skills JSON)

The arc system is responsible for gating (requirements) and canon justification (mentor, rite, cost, consequence).

---

## AI Contracts (what makes runtime AI scalable)

### Generator input must include
- Arc blueprint beat summary + constraints + budgets
- Player identity: class, race, archetype system (if present), level, recent decisions
- Canon summary: key entities/facts relevant to this arc
- Allowed objective criteria vocabulary (the set of criteria keys the quest tracker supports)
- Reward bounds (XP, items, unlock kinds) based on current level band

### Generator output requirements
- Must return strict JSON matching `BeatPacket` schema.
- Objectives MUST include `criteria` that are trackable (no vague "learn more").
- Any new canon entities must have stable IDs and minimal required metadata.

### Validation gates (must-pass)
- No new entity ID collisions.
- Budgets respected (e.g., max 2 new NPCs).
- No contradiction with canon store (e.g., "NPC is dead" vs existing "NPC alive" fact).
- Rewards within bounds; unlocks must match allowed kinds.

---

## Canon & Memory Strategy

### Canon storage
Store in save as:
- `canon.entities` map by ID
- `canon.facts` list (append-only)
- `canon.relationships` list

### Canon summarization for prompts
Maintain a rolling, compact "arc + canon digest":
- top entities (NPCs/factions) with 1-2 facts each
- last 3 decisions and their consequences
- current beat intent + active quest names

### Contradiction detection (minimum viable)
Treat facts as key-value claims; block direct conflicts on:
- identity (name/species/class)
- alive/dead status
- faction allegiance
- location of critical artifacts

---

## Integration Points (current codebase)

This design intentionally aligns with existing patterns:
- Quest generation already exists and has "trackable criteria" expectations.
- Skills/classes/races are already data-driven JSON/registries.
- Prompt assembly already centralizes narrative context building.
- Deterministic sim/event sourcing can store arc events + beat packet hashes to replay canon.

Expected modules (names indicative; not committed in this doc):
- `packages/game-core/src/systems/arc/ArcManager.js`
- `packages/game-core/src/data/arcs/*.json` (blueprints)
- `packages/game-schemas/src/arcs/*` (schema validation)
- `src/core/PromptAssembler.js` (inject arc/canon digest into context section)
- `src/components/ReplayInspector.jsx`-style "Arc Inspector" panel (tooling)

---

## Tooling / QA (makes runtime AI safe)

### Arc Validator CLI
- Validates arc blueprints (graph correctness, unreachable beats, budget defaults).
- Validates beat packets (schema + semantic invariants).
- Produces a "compat report" for quest criteria keys used.

### Regression Harness
- Runs a matrix of seeds + canned decisions.
- Ensures: no schema failures, no canon contradictions, reasonable reward bounds.
- Stores golden beat packets for a small curated set ("smoke canon suite").

### Arc Inspector UI (dev-only)
- Shows active arcs, current beat, flags/counters, recent decisions.
- Lists canon entities introduced by each beat packet.
- Provides "replay from beat" debug affordances via stored beat packets.

---

## Content Strategy (initial set)

### World arcs (season spines)
Start with 1-2 world arcs that connect to existing tones/biomes:
- "Neon Market Broker" (city intrigue, factions, investigation -> confrontation)
- "Fallen Spire Stabilization" (ruins, essence anomalies, timed pressure)

### Class sagas (identity lanes)
One saga per Tier-1 class at first, focused on:
- mentor + trial + consequence
- a signature mechanic reinforcement
- an evolution gate beat at level band ~12 (aligns with current evolution requirements)

### Race sagas (identity lanes)
Pick 3-5 races with strong hooks (e.g., void walkers, phoenix, neo-human) and:
- one rite/awakening beat
- one "cost" consequence that binds future story

---

## Rollout Plan (staged)

### Phase A — Structure only (no AI generation)
- Add arc instance state shape and a tiny authored blueprint.
- Beat packets are authored fixtures.
- Ensure quest/objective wiring and beat advancement is correct.

### Phase B — AI generation + canon lock-in
- Add generator call + schema validation + retry/fallback.
- Persist beat packets in save; ensure replay uses stored packets.
- Add minimal arc digest to prompts.

### Phase C — Tooling + regression
- Validator CLI + smoke canon suite.
- Arc Inspector UI panel.
- Add contradiction checks and reward bounds checks.

### Phase D — Expansion
- More arcs, more class/race sagas, faction reputation integration, seasonal packaging.

---

## Risks & Mitigations
- AI incoherence: strict schemas + semantic validators + fallback templates.
- State explosion (branching): cap branching depth; decision budgets; merge beats back into spine.
- Prompt bloat: digest canon + recent decisions; avoid dumping full histories.
- Save bloat: store beat packets compactly; allow compaction (keep hashes + summaries, archive full text).

