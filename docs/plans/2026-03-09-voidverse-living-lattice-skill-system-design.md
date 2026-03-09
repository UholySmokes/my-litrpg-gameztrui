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

The lattice, bloodlines, cultivation methods, spellforms, professions, miracles, and external directive contracts may not:

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

### 4. Spellforms

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
    | "spellform"
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
  slotType:
    | "active"
    | "passive"
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
- `contextFit = 0.5` off-use, `1.0` normal, `1.25` ideal, `1.5` breakthrough context
- `dangerWeight = 0.8` safe practice, `1.0` live use, `1.35` boss/crisis, `1.6` near-failure survival
- `noveltyWeight = 1.15` on first meaningful use in a scene, decays to `0.7`
- `fatiguePenalty` floors at `0.35`

This rewards dangerous, story-relevant use over repetitive low-risk grinding.

## Rank-Up Gates

Rank requires both mastery and a family-specific milestone.

- `Seed -> Thread`: `100 mastery` + `10 meaningful uses`
- `Thread -> Knot`: `250 mastery` + one family milestone
- `Knot -> Weave`: `450 mastery` + branch or fusion proof
- `Weave -> Mandate`: `700 mastery` + world-impact feat

Family milestones:

- `Martial`: counters, duel victories, stance discipline, combat achievements
- `Bloodline`: awakening stress, mutation survival, lineage catalyst, ancestral relic
- `Universal`: survival repetition, travel, situational excellence, utility milestones
- `Spellform`: study logs, casting proof, rune comprehension, safe repetition under pressure
- `Cultivation`: bottleneck breaks, tribulation survival, refinement thresholds
- `Profession`: recipe mastery, contract fulfillment, craft quality thresholds, rare-output success

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

### Spellforms

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

- surviving use
- accepting consequences
- repeated identity-aligned crisis manifestation

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
};
```

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

## Contract Miracle Rules

Contract miracles come from an external authority contract.

They must provide enough data for lattice validation and effect resolution, but they do not inherit native miracle rules.

Minimum lattice-facing contract shape:

```ts
type ExternalAuthorityContract = {
  contractId: string;
  authorityId: string;
  miraclePayloadId: string;
  grantType: string;
  scope: string;
  duration: string;
  overrideFlags: string[];
  costOwner: "directive-engine" | "shared" | "external";
  aftershockOwner: "directive-engine" | "shared" | "external";
  rejectionClauses: string[];
};
```

One mandatory rejection clause is:

- `cannot_target_or_influence_grandma_void = true`

## Loadout Model

Persistent lattice loadout:

- `4 Active`
- `12 Passive`
- `2 Reaction`
- `1 Stance or Channel`
- `1 Profession Focus`
- `1 Cultivation Method`

Miracles are not standard permanent loadout slots.

They are hosted temporarily through:

- native eligibility windows
- external authority contract submission

## Character Creation Fit

This design preserves the current blueprint model in `CharacterCreationContract.js`.

Recommended mapping:

- `activeSkillIds` -> active lattice skills
- `passiveSkillIds` -> passive lattice skills
- `skillLoadoutId` -> optional curated lattice starter package
- `archetypeSystemId` -> external directive engine selection, not a lattice family

## Integration Mapping

Current repo content should map like this:

- `class_abilities.json` -> martial arts techniques
- `*.active.json` and `*.passive.json` -> curated family-specific lattice entries
- `race_abilities.json` -> bloodline gifts
- `universal.json` -> universal techniques and some spellforms
- `SpellStudySystem.js` outputs -> spellforms
- `profession_skills.json` -> profession disciplines
- `talent.registry.json` -> native miracle eligibility definitions

## Validation Rules

The lattice should reject:

- illegal family/source combinations
- impossible rank jumps
- miracle payloads that violate Grandma Void prohibition
- contract miracles without a valid authority contract envelope
- progression loops that bypass saturation and fatigue controls

## Acceptance Criteria

- One canonical skill model can describe class, bloodline, universal, spellform, cultivation, and profession content.
- Talents resolve as native miracles instead of permanent always-on advantages.
- Directive miracles can be hosted by the lattice without being rewritten into native miracle logic.
- The skill system remains deterministic enough to fit existing registry and replay expectations.
- No system path can target, manipulate, or compel Grandma Void.

## Open Questions For Implementation

- Exact normalized stat adapter field names.
- Whether `Mandate` should remain the top persistent rank or split again later.
- How much of `universal.json` should remain mundane versus be reclassified as spellforms.
- How miracles should appear in UI and logs relative to persistent skills.
