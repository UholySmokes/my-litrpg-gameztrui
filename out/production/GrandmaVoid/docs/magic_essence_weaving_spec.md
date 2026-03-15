# Magic Specification: Essence Weaving (Hybrid Mana Pool)

This document defines the canonical rules for “Essence Weaving” magic.

Core premise:
- The world contains ambient essence.
- The player can sense, draw, refine/compress into charges, and shape/weave effects.
- The player’s `Mana Pool` is **capacity** for contained essence (hybrid model).

## Terms

| Term | Meaning |
|---|---|
| Ambient Essence | Essence present in the world/biome, not owned by the player |
| Mana Pool | Total capacity to hold essence internally (not “spell points”) |
| Reserve | Raw essence stored in the body, unstable and risky |
| Charge | Prepared essence unit that is stable enough to shape/use |
| Density | How “compressed” a charge is. Higher density uses less capacity per unit but increases risk |
| Stability | Three-limit governor: Body / Mind / Cognitive |
| Paradigm | Player’s equipped theory/laws; contradictions strain Cognitive Stability |

## Essence Primes (v1)

Start with 8 primes:
- Fire, Water, Earth, Air
- Lightning
- Shadow, Light
- Life (optional: add Death later as a paired axis)

## Player-Facing HUD (text)

Default compact:

```
HP 80/100 | Stamina 45/60 | Mana Pool 50/100
Essences: Fire 30 | Water 20 | Earth 15 | Air 25 | Lightning 10 | Shadow 5 | Light 8
Stability: Body 72/100 | Mind 61/100 | Cognitive 40/100
```

Notes:
- `Mana Pool X/Y` is **free/total** capacity.
- Essence values shown are **total contained** per prime (`Reserve + Charges`) in “quanta”.

## Data Model (canonical)

### Player state additions

Add `player.magic`:

```json
{
  "mana": { "current": 50, "max": 100 },
  "magic": {
    "stability": {
      "body": { "current": 72, "max": 100 },
      "mind": { "current": 61, "max": 100 },
      "cognitive": { "current": 40, "max": 100 }
    },
    "affinity": {
      "fire": 0.15,
      "water": 0.10,
      "earth": 0.05,
      "air": 0.12,
      "lightning": 0.02,
      "shadow": 0.00,
      "light": 0.01,
      "life": 0.00
    },
    "attunement": {
      "fire": 1,
      "water": 1,
      "earth": 1,
      "air": 1,
      "lightning": 1,
      "shadow": 1,
      "light": 1,
      "life": 1
    },
    "reserves": {
      "fire": 0,
      "water": 0,
      "earth": 0,
      "air": 0,
      "lightning": 0,
      "shadow": 0,
      "light": 0,
      "life": 0
    },
    "charges": [
      {
        "id": "chg_001",
        "essence": "fire",
        "amount": 12,
        "density": 1.0,
        "purity": 0.7,
        "binding": { "type": "rhythm", "pattern": "spiral" },
        "createdTurn": 120,
        "expiresTurn": 170
      }
    ],
    "anchors": {
      "self": null,
      "area": null,
      "itemId": null
    },
    "paradigm": {
      "id": "conservationist",
      "tenets": ["no_creation", "transform_allowed", "move_allowed"],
      "contradictions": ["void_creation", "true_ex_nihilo"]
    },
    "memoryShards": []
  }
}
```

### Capacity accounting (hybrid mana)

Define **used capacity**:

```
manaUsed = sum(reserves[essence]) + sum(charge.amount / charge.density)
manaFree = max(0, mana.max - manaUsed)
```

Canonical constraint:
- `mana.current` MUST be `manaFree`.

### World/biome additions

Add `world.essence`:

```json
{
  "world": {
    "essence": {
      "ambient": {
        "fire": 0.10,
        "water": 0.25,
        "earth": 0.35,
        "air": 0.20,
        "lightning": 0.05,
        "shadow": 0.03,
        "light": 0.08,
        "life": 0.12
      },
      "sources": [
        { "id": "src_campfire", "type": "fire", "strength": 0.9, "radius": 8 },
        { "id": "src_river", "type": "water", "strength": 0.8, "radius": 12 }
      ]
    }
  }
}
```

Ambient values are normalized densities in `[0..1]`.

## System Configuration (defaults)

```
// Capacity
startManaMax: 100

// Stability
startStability: 100
minStabilityForSafeWeaving: 40

// Charge decay
baseChargeLifetimeTurns: 50

// Drawing
baseDrawRate: 4                 // quanta per turn at ambient=1.0
drawStabilityBodyCostPerQuantum: 0.15

// Refinement
refineMindCostPerQuantum: 0.10
refinePurityBase: 0.55
refinePuritySkillScale: 0.35

// Compression
compressionDensityTiers: [1.0, 1.5, 2.2, 3.3]
compressionBodyCostBase: 2
compressionMindCostBase: 1
compressionMisfireBase: 0.03

// Shaping/Weaving
shapeMindCostBase: 1
weaveCognitiveCostBase: 2
weaveBacklashBase: 0.02
```

## Core Loop Mechanics

### 1) SENSE / ATTUNE

SENSE produces a ranked list of nearby essences.

Output payload shape (minimum):

```json
{
  "type": "sense_result",
  "top": [
    { "essence": "water", "strength": 0.62, "hint": "cool damp air" },
    { "essence": "earth", "strength": 0.44, "hint": "pressure and grit" }
  ],
  "sources": [
    { "id": "src_river", "essence": "water", "strength": 0.8, "distance": 10 }
  ]
}
```

Resolution rule:

```
perceivedStrength = clamp01(ambientStrength * perceptionFactor + noise)
perceptionFactor = 0.6 + 0.4 * mindStabilityPct
noise = uniform(-0.08, 0.08) * (1 - attunementFactor)
attunementFactor = clamp01(0.2 + 0.1 * attunement[essence])
```

ATTUNE selects a stance that biases future SENSE/DRAW.

Suggested stances:
- `OPEN`: balanced
- `FOCUSED <ESSENCE>`: +sense and +draw for one essence
- `GUARDED`: lower draw rate, lower backlash chance

### 2) DRAW

DRAW transfers ambient essence into `reserves[essence]` while consuming capacity.

Preconditions:
- `manaFree > 0`
- ambient density for that essence is non-trivial, or a nearby `source` exists

Per-turn draw amount:

```
env = max(ambient[essence], bestSourceStrengthInRange)
att = clamp01(0.25 + 0.075 * attunement[essence])
aff = 1 + affinity[essence]
stance = 1.0 (OPEN) | 1.25 (FOCUSED) | 0.75 (GUARDED)

drawRate = baseDrawRate * env * att * aff * stance
drawAmount = min(drawRate, manaFree)
```

Costs:

```
bodyCost = drawAmount * drawStabilityBodyCostPerQuantum
```

### 3) REFINE (Reserve → Charge)

REFINE converts raw reserves into a prepared charge (safer to shape).

Inputs:
- `essence`, `amount`, and optional `method`

Purity (0..1):

```
purity = clamp01(refinePurityBase + refinePuritySkillScale * refineSkillFactor)
refineSkillFactor = clamp01(0.15 * attunement[essence] + 0.5 * mindStabilityPct)
```

Cost:

```
mindCost = amount * refineMindCostPerQuantum
```

Charge lifetime:

```
lifetimeTurns = baseChargeLifetimeTurns * (0.6 + 0.4 * purity)
```

### 4) COMPRESS (Increase Density)

Compression increases density (reduces capacity use) and increases potency but raises failure/backlash.

Tier selection:
- `tier 0`: density `1.0`
- `tier 1`: density `1.5`
- `tier 2`: density `2.2`
- `tier 3`: density `3.3`

Potency multiplier:

```
potency = 1 + 0.35 * (density - 1)
```

Costs:

```
bodyCost = compressionBodyCostBase * amount * (density ** 1.2) / 10
mindCost = compressionMindCostBase * amount * (density ** 1.1) / 10
```

Misfire chance:

```
risk = (density - 1) * 0.06 + (amount / 50) * 0.04
stabilityPenalty = 0.15 * (1 - bodyStabilityPct) + 0.10 * (1 - mindStabilityPct)
misfireChance = clamp01(compressionMisfireBase + risk + stabilityPenalty)
```

Misfire outcomes (pick one):
- partial compression (density increases less than intended)
- heat/strain spike (extra Body loss)
- uncontrolled leak (charge loses amount)
- involuntary RELEASE (small uncontrolled effect)

### 5) SHAPE / WEAVE / RELEASE

Define a spell attempt by:
- Inputs: essences + amounts (from charges, optionally from reserves at higher risk)
- Geometry: `cone | wall | jet | vortex | lattice | pulse | sphere`
- Binding: `boundary | rhythm | anchor | symmetry`
- Intent: e.g. `heat | push | freeze | reveal | bind | sever | shield`

#### Shaping (single-essence)

Effect magnitude:

```
magnitude = amount * potency * geometryFactor * intentFactor * controlFactor
controlFactor = clamp01(0.4 + 0.06 * attunement[essence] + 0.3 * mindStabilityPct)
```

Costs:

```
mindCost = shapeMindCostBase + 0.06 * magnitude
```

#### Weaving (multi-essence)

Weave coherence:

```
coherence = baseCoherence * stabilityFactor * theoryFactor
baseCoherence = average(purity_i) * (1 - oppositionPenalty)
stabilityFactor = (0.4 + 0.3 * mindStabilityPct + 0.3 * cognitiveStabilityPct)
theoryFactor = 1.0 if paradigm allows transformation else 0.6
```

Opposition penalty (pairwise, max):

| Pair | Penalty |
|---|---:|
| Fire + Water | 0.25 |
| Light + Shadow | 0.35 |
| Air + Earth | 0.10 |

Resolution:

```
successChance = clamp01(coherence - (amountTotal / 200))
backlashChance = clamp01(weaveBacklashBase + (1 - coherence) * 0.20 + (densityAvg - 1) * 0.05)
```

Costs:

```
cognitiveCost = weaveCognitiveCostBase + 0.08 * amountTotal
mindCost = 1 + 0.05 * amountTotal
```

RELEASE applies the effect and removes the consumed charge amounts.

## Law of Balance (Essence Costs)

Each essence has a “preferred payment” profile (in addition to generic stability costs).

| Essence | Extra Cost Theme | Typical Consequence |
|---|---|---|
| Fire | dehydration / overheating | stamina drain, HP chip if pushed |
| Water | chill / numbness | slower actions, reduced dexterity |
| Earth | rigidity / weight | temporary movement penalty |
| Air | oxygen debt / vertigo | aim wobble, concentration slip |
| Lightning | nerve stress | paralysis chance, Body instability |
| Shadow | memory erosion | lost recent log lines / skill misremember |
| Light | attention burn | Mind fatigue, tunnel vision |
| Life | metabolic debt | HP cost, longer recovery |

## Crisis Magic

Trigger:

```
if threatScore >= crisisThreshold and (hpPct <= 0.15 or lethalIncoming)
```

Effect selection:
- Choose an essence present in the environment (top ambient or source).
- Choose a defensive geometry by situation (wall/shield/veil).
- Apply with low coherence (ugly but strong).

Aftermath:
- Add `memoryShard`:

```json
{
  "turn": 220,
  "essence": "water",
  "geometry": "wall",
  "intent": "block",
  "notes": "You felt cold pressure and panic; the air crystallized."
}
```

## Research Loop

Journal entries are the progression currency for deeper techniques.

Minimum journal payload:

```json
{
  "turn": 300,
  "topic": "compression_spiral_fire",
  "inputs": { "fire": 12 },
  "method": "spiral",
  "result": "partial",
  "stabilityDelta": { "body": -8, "mind": -3, "cognitive": 0 },
  "notes": "Spiral held at tier 1; tier 2 leaked."
}
```

Paradigms are equipped “theory loadouts” that gate/enable effects and enforce Cognitive Stability.

## Canonical Example: Fire Tornado (discoverable)

Prereqs:
- Charges: Fire and Air
- Compression tier 1+ for both
- Mind ≥ 50, Cognitive ≥ 40 recommended

Sequence:

```
SENSE FIRE
DRAW FIRE
REFINE FIRE SPIRAL 12
COMPRESS FIRE SPIRAL TIER 2

SENSE AIR
DRAW AIR
REFINE AIR COLUMN 9
COMPRESS AIR COLUMN TIER 2

WEAVE FIRE+AIR VORTEX ANCHOR SELF
RELEASE
```

Weave intent defaults:
- Fire: heat
- Air: rotation + lift
- Pattern: vortex

## Minimal Command Set (canonical verbs)

Everything is `VERB [parameters...]`.

| Verb | Purpose | Examples |
|---|---|---|
| `SENSE` | Read ambient essence | `SENSE`, `SENSE FIRE` |
| `ATTUNE` | Set a stance | `ATTUNE OPEN`, `ATTUNE FOCUSED FIRE` |
| `DRAW` | Pull essence into reserves | `DRAW WATER`, `DRAW FIRE 10` |
| `REFINE` | Convert reserves to charges | `REFINE FIRE SPIRAL 12` |
| `COMPRESS` | Increase charge density | `COMPRESS FIRE SPIRAL TIER 2` |
| `SHAPE` | Single-essence effect | `SHAPE FIRE JET 8` |
| `WEAVE` | Multi-essence effect | `WEAVE FIRE+AIR VORTEX` |
| `ANCHOR` | Bind to self/item/area | `ANCHOR SELF`, `ANCHOR ITEM ring_01` |
| `RELEASE` | Apply the prepared shape/weave | `RELEASE` |
| `STUDY` | Analyze targets for signatures | `STUDY goblin`, `STUDY river` |
| `JOURNAL` | Record a result or observation | `JOURNAL`, `JOURNAL NOTE "tier 2 leaked"` |
| `THEORY` | Manage paradigms | `THEORY EQUIP conservationist` |

Optional synonyms accepted by parser:
- `MEDITATE` as alias for `SENSE`
- `FORM` as alias for `SHAPE`
- `CAST` as alias for `RELEASE` (purely cosmetic)

## Command Grammar (EBNF)

```
command        = verb , { ws , token } ;
verb           = "sense" | "attune" | "draw" | "refine" | "compress" | "shape" | "weave" | "anchor" | "release" | "study" | "journal" | "theory" ;

token          = word | number | essence_combo | quoted ;
word           = letter , { letter | digit | "_" | "-" } ;
number         = digit , { digit } ;
quoted         = '"' , { any_char_except_quote } , '"' ;

essence_combo  = essence , { "+" , essence } ;
essence        = "fire" | "water" | "earth" | "air" | "lightning" | "shadow" | "light" | "life" ;

ws             = " " , { " " } ;
```

## Parsed Actions (canonical shapes)

To implement Essence Weaving, extend the parsed action union with:

```ts
type ParsedAction =
  | { type: "magic_sense"; essence?: string | null }
  | { type: "magic_attune"; stance: "open" | "focused" | "guarded"; essence?: string | null }
  | { type: "magic_draw"; essence: string; amount?: number | null }
  | { type: "magic_refine"; essence: string; method?: string | null; amount: number }
  | { type: "magic_compress"; essence: string; method?: string | null; tier: 0 | 1 | 2 | 3 }
  | { type: "magic_shape"; essence: string; form: string; amount?: number | null }
  | { type: "magic_weave"; essences: string[]; pattern: string; anchor?: { kind: "self" | "area" | "item"; itemId?: string | null } | null }
  | { type: "magic_anchor"; kind: "self" | "area" | "item"; itemId?: string | null }
  | { type: "magic_release" }
  | { type: "magic_study"; target: string }
  | { type: "magic_journal"; note?: string | null }
  | { type: "magic_theory"; op: "equip" | "list" | "status"; paradigmId?: string | null };
```

## Parser Rules (regex-first, text-RPG friendly)

Parsing precedence:
1. Magic verbs
2. Existing action verbs (use/move/attack/look/inventory/status/rest)
3. Default narrative

Canonical patterns (case-insensitive):

```
SENSE [ESSENCE]
  ^(sense|attune to|meditate)(\s+(fire|water|earth|air|lightning|shadow|light|life))?$

ATTUNE OPEN|GUARDED|FOCUSED [ESSENCE]
  ^attune\s+(open|guarded|focused)(\s+(fire|water|earth|air|lightning|shadow|light|life))?$

DRAW ESSENCE [AMOUNT]
  ^draw\s+(fire|water|earth|air|lightning|shadow|light|life)(\s+(\d+))?$

REFINE ESSENCE METHOD AMOUNT
  ^refine\s+(fire|water|earth|air|lightning|shadow|light|life)(\s+([a-z_\-]+))?\s+(\d+)$

COMPRESS ESSENCE METHOD TIER N
  ^compress\s+(fire|water|earth|air|lightning|shadow|light|life)(\s+([a-z_\-]+))?\s+(tier\s*)?(0|1|2|3)$

SHAPE ESSENCE FORM [AMOUNT]
  ^(shape|form)\s+(fire|water|earth|air|lightning|shadow|light|life)\s+([a-z_\-]+)(\s+(\d+))?$

WEAVE E1+E2(+E3) PATTERN [ANCHOR ...]
  ^weave\s+((?:fire|water|earth|air|lightning|shadow|light|life)(?:\+(?:fire|water|earth|air|lightning|shadow|light|life))+)\s+([a-z_\-]+)(?:\s+anchor\s+(self|area|item)(?:\s+([a-z0-9_\-]+))?)?$

ANCHOR SELF|AREA|ITEM [ITEM_ID]
  ^anchor\s+(self|area|item)(\s+([a-z0-9_\-]+))?$

RELEASE
  ^(release|cast)$

STUDY TARGET
  ^study\s+(.+)$

JOURNAL [NOTE "..."]
  ^journal(?:\s+note\s+"([^"]+)")?$

THEORY LIST|STATUS|EQUIP ID
  ^theory\s+(list|status|equip)(?:\s+([a-z0-9_\-]+))?$
```

## Starter Techniques (10)

These are learnable on day 1 and designed to be fast to type.

| Technique | Essence | Command | Typical Output |
|---|---|---|---|
| Spark | Fire | `SHAPE FIRE SPARK 2` | light ignition, tiny damage |
| Warmth Mantle | Fire | `SHAPE FIRE AURA 3` | cold resistance, stamina tax |
| Water Sip | Water | `SHAPE WATER SIP 2` | minor stamina recovery |
| Mist Veil | Water+Air | `WEAVE WATER+AIR VEIL` | lowers enemy accuracy |
| Stone Skin | Earth | `SHAPE EARTH SHELL 6` | temporary defense buff |
| Dust Blind | Earth+Air | `WEAVE EARTH+AIR CLOUD` | inflicts blind (short) |
| Air Step | Air | `SHAPE AIR STEP 3` | reposition, evade bonus |
| Lightning Arc | Lightning | `SHAPE LIGHTNING ARC 5` | burst damage, nerve strain |
| Shadow Veil | Shadow | `SHAPE SHADOW VEIL 4` | stealth, memory-tax risk |
| Light Reveal | Light | `SHAPE LIGHT REVEAL 3` | exposes stealth, mind fatigue |

## Discoverable Laws (20)

Laws are passive unlocks that expand what the player can stably do.

| Law ID | Tier | Unlock Trigger | Effect |
|---|---:|---|---|
| `conservation` | 1 | 10 journal entries in one biome | -10% Cognitive cost for transforms |
| `sympathy` | 1 | Study 5 essence signatures | Enables resonance targeting in range |
| `opposition` | 1 | Survive a backlash event | Reduces opposition penalties by 20% |
| `boundary` | 1 | Maintain an anchor 30 turns | +20% binding stability |
| `rhythm` | 1 | Refine 20 charges | +0.05 average purity |
| `cohesion` | 2 | Craft 3 bound items | Charges last +30% |
| `entropy` | 2 | Overheat with Fire 3 times | Fire effects harder to sustain, stronger burst |
| `phase` | 2 | Shadow veil success 10 times | Shadow shaping less memory-taxed |
| `illumination` | 2 | Reveal hidden enemy 10 times | Light reveal radius +25% |
| `conduction` | 2 | Chain lightning event | Lightning arcs gain chaining rule |
| `pressure` | 2 | Earth wall blocks 200 dmg | Earth shapes gain knockback resist |
| `flow` | 2 | Water shield used 20 times | Water bindings leak less (coherence +0.05) |
| `vortex` | 2 | First successful Fire+Air weave | Unlocks vortex geometry multiplier |
| `crystallization` | 3 | Cold biome mastery | Water→Ice transmutation allowed |
| `metallurgy` | 3 | Smelt with Earth 10 times | Earth→Metal refinement allowed |
| `sonics` | 3 | Air resonance test | Air→Sound shaping allowed |
| `distance_resonance` | 3 | Sympathy law + 50 studies | Remote shaping (reduced magnitude) |
| `equilibrium` | 3 | Balance 3 opposed weaves | Backlash chance -15% |
| `identity` | 4 | Dao questline | Enables “law-tier” intents (high cost) |
| `gravity` | 4 | Celestial research arc | Gravity-pattern weaving enabled |

