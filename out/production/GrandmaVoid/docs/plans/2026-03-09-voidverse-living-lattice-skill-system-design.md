# VoidVerse Living Lattice Skill System Design

Date: 2026-03-09
Project: `my-litrpg-gameztrui` / VoidVerse
Status: Approved

## Goals

- Unify class skills, race and bloodline skills, universal skills, magic skills, cultivation skills, profession skills, and talent-like powers into a single skill framework.
- Preserve the repo's existing character creation, registry-first content model, and deterministic progression surfaces.
- Keep Archetype Directives outside the lattice as a separate engine that can influence the lattice without becoming part of it.
- Enforce the absolute world rule that Grandma Void cannot be influenced, forced, manipulated, bound, or controlled under any circumstances.

## Non-Goals

- Implementing the separate Archetype Directive engine.
- Replacing existing class identity with a classless sandbox.
- Designing the full miracle-authority contract engine beyond the lattice-facing boundary.
- Granting any mechanic that can target or alter Grandma Void.

## Repo Grounding

This design is based on the current content and engine split in:

- `packages/game-core/src/systems/skills/SkillRegistry.js`
- `packages/game-core/src/systems/skills/SpellStudySystem.js`
- `packages/game-core/src/data/skills/class_abilities.json`
- `packages/game-core/src/data/skills/race_abilities.json`
- `packages/game-core/src/data/skills/universal.json`
- `packages/game-core/src/data/skills/profession_skills.json`
- `packages/game-core/src/data/talent.registry.json`
- `packages/game-core/src/characterCreation/CharacterCreationContract.js`
- `packages/game-core/src/data/OpeningScenePack.VoidverseStartScenes.js`
- `docs/lore/VOIDVERSE_ORIGIN.md`

## Core Decision

VoidVerse uses one skill system: `The Living Lattice`.

Every learnable, awakenable, inheritable, studied, cultivated, crafted, or temporarily granted power is represented as a `Lattice Skill` or a lattice-hosted miracle effect.

## Absolute Boundary: Grandma Void

Grandma Void is outside all player-accessible systems.

The lattice, bloodlines, cultivation methods, magic, professions, miracles, and external directive contracts may not:

- target Grandma Void
- compel Grandma Void
- manipulate Grandma Void
- siphon from Grandma Void directly
- bind, trick, rewrite, copy, or dominate Grandma Void

Any attempt auto-fails and resolves as refusal, backlash, collapse, silence, or narrative correction.

## Living Lattice Families

The lattice contains six persistent skill families and one temporary miracle layer.

### 1. Martial Arts

- Class attacks
- Stances
- Counters
- Weapon forms
- Movement chains

### 2. Bloodline Gifts

- Race powers
- Bloodline awakenings
- Mutation states
- Inherited body and soul advantages

### 3. Universal Techniques

- Survival
- Meditation
- Movement
- Scouting
- General utility

### 4. Magic

- Studied spells
- Rune logic
- Ritual casting
- Element shaping
- Structured magical techniques

### 5. Cultivation Methods

- Breathing manuals
- Core refinement
- Meridian shaping
- Tribulation breakthroughs
- Long-horizon body and soul growth

### 6. Profession Disciplines

- Smithing
- Alchemy
- Inscription
- Repair
- Cooking
- Harvesting
- Engineering

### 7. Miracles

Miracles are hosted by the lattice but split into two types:

- `Native Miracles`
- `Contract Miracles`

Miracles are temporary by nature. They are not ordinary permanent skill branches.

## External Directive Boundary

Archetype Directives are not a lattice family.

They belong to a separate engine that may influence the lattice through an external authority contract.

The directive engine may:

- grant temporary exceptions
- submit miracles to the lattice
- bias unlocks, mastery gain, caps, or slot behavior
- impose external costs, debt, or aftershock

The directive engine does not:

- become a skill family
- use lattice-native miracle creation rules
- use lattice-native miracle costs unless a contract explicitly maps them
- bypass the Grandma Void prohibition

## Miracle Split

### Native Miracles

Native miracles come from lattice-adjacent sources such as:

- talents
- bloodline crisis states
- cultivation breakthroughs
- relic resonance
- ritual culmination
- story-triggered impossible moments

Native miracles obey lattice miracle rules.

### Contract Miracles

Contract miracles are delivered by the external directive engine through an `External Authority Contract`.

The lattice only:

- validates legality
- checks state compatibility
- resolves effect application
- serializes output
- records narration and aftermath hooks

The lattice does not determine:

- whether a directive miracle is authorized
- its true cost basis
- its authority debt
- its duration law
- its external punishment model

## Lattice Skill Record

Each persistent lattice skill should normalize to one canonical shape.

```ts
type LatticeSkill = {
  id: string;
  name: string;
  family:
    | "martial"
    | "bloodline"
    | "universal"
    | "magic"
    | "cultivation"
    | "profession";
  sourceType:
    | "class"
    | "race"
    | "bloodline"
    | "universal"
    | "study"
    | "cultivation"
    | "profession"
    | "story"
    | "relic";
  slotType: "active" | "passive";
  runtimeRole?:
    | "standard"
    | "reaction"
    | "stance"
    | "channel"
    | "ritual";
  rank: "seed" | "thread" | "knot" | "weave" | "mandate";
  mastery: number;
  stability: number;
  affinityTags: string[];
  resourceType: string;
  growthTriggers: string[];
  milestoneGate?: string | null;
  saturationClass?: string | null;
  nativeMiracleLink?: string | null;
};
```

`slotType` is the persisted loadout bucket that fits the current blueprint.

`runtimeRole` is a derived execution role layered on top of an equipped or learned skill. A skill can be stored as `active` or `passive` while still behaving as a reaction, stance, channel, or ritual at runtime.

## Compatibility Adapter Boundary

The lattice must be introduced behind an adapter. Live runtime callsites should not consume raw `LatticeSkill` records until the adapter layer is complete.

Minimum adapter rules:

- `type` -> `slotType`
- `ownerType`, `ownerId`, and `class` -> `sourceType` plus ownership metadata
- `manaCost`, `cost`, and `costType` -> `resourceType` plus runtime cost payload
- `template.function`, `setStance`, `isMagic`, `element`, `tags`, and effect signatures -> `family` and `runtimeRole`
- `unlockConditions` stay as explicit deterministic gates and are not replaced by prose `growthTriggers`

Recommended migration shape:

```ts
type LatticeSkillAdapterResult = {
  lattice: LatticeSkill;
  runtimeView: {
    type: "active" | "passive";
    ownerType: string;
    ownerId: string;
    manaCost?: number;
    cooldown?: number;
    template?: Record<string, unknown>;
    unlockConditions?: Record<string, unknown>;
  };
};
```

This preserves the current `SkillRegistry.js` execution surfaces while allowing the canonical lattice model to exist underneath them.

## Rank Ladder

Persistent lattice skills use these ranks:

- `Seed`
- `Thread`
- `Knot`
- `Weave`
- `Mandate`

`Apex` is not a normal lattice rank. It is reserved for exceptional cases outside the ordinary progression loop.

## Mastery Model

Every persistent skill has:

- `mastery: 0-999`
- `stability`
- `rank`

Mastery gain formula:

```text
masteryGain =
basePractice
x contextFit
x dangerWeight
x noveltyWeight
x familyModifier
x fatiguePenalty
```

Default baseline:

- `basePractice = 6`
- `contextFit = 0.5` logged practice, `1.0` verified field use, `1.25` elite challenge use, `1.5` survival-grade use
- `dangerWeight = 0.8` safe practice, `1.0` live use, `1.35` boss or crisis use, `1.6` failure-survived use
- `noveltyWeight = 1.15` on first validated use in a scene or encounter bucket, decays to `0.7`
- `fatiguePenalty` floors at `0.35`

This rewards dangerous, logged use over repetitive low-risk grinding.

### Deterministic Progress Events

All mastery inputs should come from recorded progress events, not prose judgments.

```ts
type LatticeProgressEvent = {
  eventId: string;
  skillId: string;
  emitterId: string;
  encounterTemplateId: string;
  progressFingerprint: string;
  contextGrade: "practice" | "field" | "elite" | "survival";
  noveltyBucket: "new_scene" | "new_encounter_type" | "repeat";
  challengeTier: 0 | 1 | 2 | 3;
  threatRating: number;
  threatRatio: number;
  outcome: "success" | "partial" | "failure_survived";
  milestoneFlags: string[];
};
```

`contextFit`, `dangerWeight`, and `noveltyWeight` must be derived from these enums and flags so that replay, rollback, and deterministic simulation can reproduce the same result.

Authoritative event rules:

- only trusted runtime emitters such as combat resolution, profession resolution, study resolution, and cultivation resolution may create `LatticeProgressEvent` records
- `progressFingerprint` must dedupe repeat submissions for the same `skillId + encounterTemplateId + chapterBucket + emitterId`
- `noveltyBucket = new_scene` or `new_encounter_type` may score only once per fingerprint window
- `contextGrade = elite` requires `threatRatio >= 1.15`
- `contextGrade = survival` requires `threatRatio >= 1.35` and `outcome = failure_survived`
- native miracle residue may not emit new progress events for the same skill during the same encounter

This prevents staged danger loops, duplicate event spam, and miracle-farming exploits.

## Rank-Up Gates

Rank requires both mastery and a family-specific recorded milestone.

- `Seed -> Thread`: `100 mastery` + `10 validatedUses`
- `Thread -> Knot`: `250 mastery` + one recorded family milestone flag
- `Knot -> Weave`: `450 mastery` + `branchChoiceId` or `fusionRecordId`
- `Weave -> Mandate`: `700 mastery` + `mandateFeatId`

Family milestone examples:

- `Martial`: `counter_win`, `duel_clear`, `stance_chain_maintained`
- `Bloodline`: `awakening_survived`, `mutation_stabilized`, `lineage_relic_bound`
- `Universal`: `travel_route_mastered`, `survival_chain_complete`, `utility_problem_resolved`
- `Magic`: `study_log_complete`, `rune_pattern_verified`, `combat_cast_clear`
- `Cultivation`: `bottleneck_broken`, `tribulation_survived`, `refinement_threshold_met`
- `Profession`: `recipe_mastered`, `contract_fulfilled`, `rare_quality_created`

This keeps progression deterministic: counters, flags, and IDs decide advancement, not narrative interpretation at runtime.

## Unified Scaling Formula

All persistent lattice skills resolve through a shared formula.

```text
skillPower =
baseCoefficient
x rankMultiplier
x masteryMultiplier
x statFactor
x resourceQuality
x resonanceBonus
x stabilityFactor
x targetResistance
```

Recommended defaults:

- `rankMultiplier = 1.0, 1.2, 1.5, 1.9, 2.4`
- `masteryMultiplier = 1 + (mastery / 1000) x 0.6`
- `resourceQuality = 0.85 to 1.25`
- `resonanceBonus = 0.9 to 1.25`
- `stabilityFactor = 0.75 to 1.2`

## Normalized Stat Adapter

The repo contains multiple stat vocabularies across docs and registry layers.

Implementation should not hardcode one stat schema into the lattice. Instead, the lattice should read from a normalized actor adapter that exposes:

- physical force
- finesse
- intellect
- will
- vitality
- soul depth
- social leverage

Each family maps into that adapter differently.

## Resonance and Saturation

`Resonance` rewards coherent builds.

`Saturation` punishes overstacking and degenerate repetition.

Resonance:

```text
resonance =
1.0
+ 0.03 per aligned major tag pair
+ 0.05 if 3+ equipped skills share one style identity
+ 0.05 if profession, cultivation, and combat loops reinforce each other
cap 1.25
```

Saturation:

```text
saturation =
0.08 per repeated major tag after the 2nd
+ 0.06 per repeated same-family active after the 3rd
+ 0.10 miracle residue if a native miracle was used recently
cap 0.45
```

Outcomes:

- High resonance reduces friction and improves performance.
- High saturation increases cost, instability, and anti-grind penalties.

Resolution order:

- apply saturation penalties first
- apply resonance bonuses second

This ensures aligned mono-builds do not erase the anti-stack brake.

## Family Roles

### Martial Arts

- Highest responsiveness in combat
- Strongly tied to timing, counters, and positioning
- Lower setup, lower abstraction

### Bloodline Gifts

- Spike-based growth
- High identity impact
- Often gated by stress, inheritance, or mutation cost

### Universal Techniques

- Broadest access
- Lowest peak coefficients
- Strong utility and survival value

### Magic

- Highest flexibility
- Strong preparation and study dependence
- Better with structure, journals, runes, and disciplined casting

### Cultivation Methods

- Slowest growth curve
- Strongest long-horizon multipliers
- Raises ceilings of other families rather than replacing them

### Profession Disciplines

- Economic, support, and world-interaction power
- Feed other families with tools, catalysts, inscriptions, equipment, and consumables

## Native Miracle Rules

Talents are reinterpreted as `Native Miracles`.

Native miracles are temporary lattice-hosted impossible states. They do not rank like ordinary skills.

They deepen through:

- `survivedActivations`
- `aftershockAcceptedCount`
- `crisisTagMatchCount`

Suggested native miracle fields:

```ts
type NativeMiracle = {
  id: string;
  trigger: string;
  eligibility: string[];
  effectWindow: string;
  strain: number;
  aftershock: string[];
  scar: string[];
  survivedActivations: number;
  aftershockAcceptedCount: number;
  crisisTagMatchCount: number;
};
```

`crisisTagMatchCount` must be driven by explicit combat or simulation tags such as `hp_below_threshold`, `ally_down`, `boss_phase_shift`, or `wipe_imminent`. Native miracles should never deepen from freeform narrative judgment.

Native miracle residue may modify aftermath, but it cannot create additional progress events, novelty credit, or crisis-tag credit for the same skill during the same encounter.

Native miracle output:

```text
miracleOutput =
miracleBase
x triggerSeverity
x soulWillFactor
x scarDepth
```

Common consequences:

- exhaustion
- cooldown lock
- damaged channels
- memory burn
- oath debt
- temporary stat collapse

## Legacy Talent Cutover Rules

Design truth: talents belong to the native miracle layer.

Implementation truth: the current talent registry contains legacy always-on bypass effects that cannot all be moved directly into a temporary miracle window without breaking live builds.

Before cutover, each legacy talent entry must be assigned to one migration lane:

- `direct_native_miracle`: brief impossible effects that work as temporary miracle activations
- `persistent_lattice_modifier`: enduring identity effects moved into normal lattice families such as class, bloodline, universal, profession, or cultivation
- `external_contract_only`: effects that require off-lattice or authority-grade rule breaking and therefore belong with the directive engine, not native miracles

No legacy always-on bypass should remain embedded inside the native miracle subsystem after migration.

Hard blacklist for `persistent_lattice_modifier`:

- `mana_cost_zero`
- `cooldown_removal`
- `damage_immunity`
- `death_immunity`
- `critical_guarantee`
- `hundred_percent_drop`
- `override_drop_quality`
- `status_immunity`
- `remove_stat_cap`
- `control_rng`

Persistent lattice modifiers may only grant bounded numeric shifts, scoped conditional effects, or identity-defining passive hooks with explicit caps and trigger windows. Absolute bypasses, immunity states, guaranteed outcomes, uncapped growth, and loot-forcing effects must be reassigned to `direct_native_miracle` or `external_contract_only`.

## Contract Miracle Rules

Contract miracles come from an external authority contract.

They must provide enough data for lattice validation and effect resolution, but they do not inherit native miracle rules.

Minimum lattice-facing contract shape:

```ts
type ExternalAuthorityContract = {
  contractId: string;
  authorityId: string;
  miraclePayloadId: string;
  payloadTier: number;
  grantType: string;
  scope: string;
  duration: string;
  maxConcurrentContracts: number;
  overrideFlags: string[];
  exclusiveOverrideTags: string[];
  collisionPolicy: "reject" | "replace" | "queue";
  hostLockout: string[];
  costOwner: "directive-engine" | "shared" | "external";
  aftershockOwner: "directive-engine" | "shared" | "external";
  rejectionClauses: string[];
};
```

One mandatory rejection clause is:

- `cannot_target_or_influence_grandma_void = true`

Host-side lattice caps still apply to contract miracles:

- the lattice validates `payloadTier` against the actor's current host tolerance
- `maxConcurrentContracts` limits how many contract miracles may coexist on one actor or scene authority frame
- `exclusiveOverrideTags` prevent incompatible contract miracles from stacking
- `collisionPolicy` decides whether a new contract is rejected, replaces an existing one, or queues
- `hostLockout` applies anti-chain cooldowns and prevents consecutive contract spam even when the external engine pays the real cost
- contract miracles must remain visible in combat logs and UI as external-authority effects, not silent rule overrides

## Loadout Model

Persisted creation-time loadout in blueprint version 1:

- `4 Active`
- `12 Passive`

Derived runtime roles layered on top of equipped or learned skills:

- up to `2` equipped active skills may carry `runtimeRole = reaction`
- up to `1` equipped skill may carry `runtimeRole = stance` or `runtimeRole = channel`
- rituals are learned magic entries with `runtimeRole = ritual`, not dedicated creation-time slots
- profession focus derives from `professionId` plus unlocked profession skills
- cultivation methods enter the lattice as passive skills in version 1 and may become a dedicated slot only in a future blueprint revision

Equip semantics:

- reactions are pre-flagged active skills and still consume active slots
- stance and channel share one concentration slot; activating one drops the other unless a miracle or contract explicitly says otherwise
- rituals are out-of-combat by default unless a skill record explicitly marks them as combat-valid
- runtime-role changes may occur only at rest, during a loadout swap, or through a named miracle or contract effect
- UI should always show both the persisted slot bucket and the current runtime role when they differ

Miracles are not standard permanent loadout slots.

They are hosted temporarily through:

- native eligibility windows
- external authority contract submission

## Character Creation Fit

This design preserves the current blueprint model in `CharacterCreationContract.js`.

Recommended mapping:

- `activeSkillIds` -> active lattice skills
- `passiveSkillIds` -> passive lattice skills, including any cultivation method selected in version 1
- `professionId` -> starting profession focus
- `skillLoadoutId` -> optional curated lattice starter package plus any default runtime-role suggestions
- `archetypeSystemId` -> external directive engine selection, not a lattice family

Reactions, stance or channel behavior, and ritual behavior are derived runtime roles, not new blueprint arrays in version 1.

## Integration Mapping

Current repo content should map like this:

- `class_abilities.json` -> per-skill classification, not file-level classification
- `*.active.json` and `*.passive.json` -> curated family-specific lattice entries classified by skill semantics, not file origin alone
- `race_abilities.json` -> bloodline gifts
- `universal.json` -> universal techniques, profession-adjacent utility, and some magic skills based on tags and effects
- `SpellStudySystem.js` outputs -> magic skills
- `profession_skills.json` -> profession disciplines
- `talent.registry.json` -> native miracle definitions plus a migration audit for legacy bypass entries

Per-skill family classification rules:

- if a skill has `isMagic`, spell-tagged metadata, elemental effect signatures, or `template.function = spell`, classify it as `magic`
- if a skill centers on weapon flow, counters, stance pressure, mobility chains, or non-magical combat execution, classify it as `martial`
- if a skill is fundamentally lineage-bound, classify it as `bloodline` even if it produces magical effects
- if a skill exists to craft, refine, repair, harvest, or produce, classify it as `profession`
- if a skill changes long-horizon body or soul refinement, classify it as `cultivation`
- otherwise default to `universal` only when no stronger family applies

Hybrid rule:

- each skill's existing `family` field is its primary family for scaling, progression, and saturation checks
- hybrid behavior is expressed through `affinityTags`, `template.synergies`, and optional secondary family tags
- battlemage, spellblade, rune-smith, and similar hybrids should not duplicate family ownership; they keep one primary family and advertise cross-family interaction through tags

## Validation Rules

The lattice should reject:

- illegal family/source combinations
- impossible rank jumps
- miracle payloads that violate Grandma Void prohibition
- contract miracles without a valid authority contract envelope
- progression loops that bypass saturation and fatigue controls

## Acceptance Criteria

- One canonical skill model can describe class, bloodline, universal, magic, cultivation, and profession content.
- The canonical lattice model can be introduced behind an adapter without breaking current active and passive runtime flows.
- Progression gates resolve from explicit counters, flags, and IDs rather than subjective narrative judgments.
- Talents resolve as native miracles after legacy always-on entries are migrated or reassigned before cutover.
- Directive miracles can be hosted by the lattice without being rewritten into native miracle logic.
- The skill system remains deterministic enough to fit existing registry and replay expectations.
- No system path can target, manipulate, or compel Grandma Void.

## Open Questions For Implementation

- Exact normalized stat adapter field names.
- Whether `Mandate` should remain the top persistent rank or split again later.
- How much of `universal.json` should remain mundane versus be reclassified as magic.
- How miracles should appear in UI and logs relative to persistent skills.
