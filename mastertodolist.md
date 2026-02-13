# Project: my-litrpg-gameztrui (React / Vite)
always ask if something is ambigious

1) Lock down targets and invariants

- ~~Define the “ambient essence model” contract: a single function that answers “given location + time + weather , what’s ambient composition, density, and quality?”~~
  - Draft contract: `computeAmbientSnapshot({ locationId, biomeId, timePhase, weatherType, weatherIntensity, anomalyIds }) -> { compositionByEssence, global, provenance, tags }`
  - `compositionByEssence[essence]`: `{ density, purity, taint }`
  - `global`: `{ drawMultByEssence, refineYieldMultByEssence, stabilityCapDelta, compressRiskMultByEssence, potencyMultByEssence }`
  - Invariant: time + weather should be nudges; biome + anomaly are primary identity.
- ~~Define the “storage model” contract: how stored/refined/compressed/anchored essence changes over time, and what stats it exposes (potency, purity, interference, decay rate).~~
  - Draft contract: `tickEssenceStorage(state, { turnsElapsed }) -> state`
  - Each stored/compressed unit tracks: `{ essence, amount, potency, purity, taint, lastTouchedTurn }`
  - Derived each turn: `{ interferenceScore, decayRate }` from fullness + opposing pairs + taint.
- ~~Decide which effects are additive nudges vs hard gates (your intent: time/weather nudge, not dominate).~~
  - Rule: biome/anomaly are primary identity; time/weather are nudges.

Decisions locked:
- Tick decay + anomaly drift only on turn-advancing actions (not on read-only `SENSE`).
- Time uses coarse phases: `dawn/day/dusk/night`.
- Weather is tracked per-biome.
- Essence set: `fire, water, earth, air, lightning, shadow, light, life, creation, destruction, space, time`.
- Off-biome modifier range target: `-10%` to `+20%`.

Open questions (need your call before I cross this step):
- ~~Should decay and anomaly drift tick only on turn-advancing actions, or also on read-only actions like `SENSE`?~~
- ~~Do you want time as coarse phases (`dawn/day/dusk/night`) or a numeric clock (`hour 0-23`)?~~
- ~~Should weather be global, per-biome, or per-location? Also: deterministic schedule vs RNG changes?~~
- ~~Confirm essence set: `fire, water, earth, air, lightning, shadow, light, life, creation ,destruction, space, time` (anything missing like `ice` or `metal`)?~~
- ~~How strong should off-biome penalties be (e.g., dominant +20%, off-biome -10%), and what clamp limits?~~

2) Extend world state to support ecology

- ~~Add (or formalize) world.location.biome (or derive biome from location id).~~
  - Implemented: `world.location.biome` normalized from location `zoneId` and updated on move.
- ~~Add world.time (at least: hour segment or named phase like dawn/day/dusk/night).~~
  - Implemented: `world.time` is now `{ currentTime, timeOfDay, isOutdoors, lastUpdate }` (with legacy number support in schema).
- ~~Add world.weather (at least: clear/rain/storm/drought/fog; plus intensity 0–1 if you want smoothness).~~
  - Implemented: `world.weather.byBiome[biomeId] = { type, intensity, updatedTurn }` (default `clear`, `0.3`).
- ~~Add world.essence.ambient to store the current computed snapshot plus its provenance (biome/time/weather/anomaly ids) so descriptions can reference it.~~
  - Implemented: `world.essence.ambient` now accepts snapshot shape (legacy record supported + auto-migrated).
3) Implement biome dominant triads (data-first)

- ~~Create a biome table: for each biome, define:~~
  - Implemented in `WorldDataRegistry` using existing biome ids.
  - Includes: dominant triad, draw/refine multipliers, stability cap delta, taint baseline.
- ~~Ensure mixed builds remain viable: clamp penalties so off‑biome is “less efficient” not “nonfunctional”.~~
  - Off-biome defaults are mild (`0.95` draw, `0.98-0.99` refine), clamped to `0.9..1.2`.
4) Add time-of-day modulation

- ~~Choose time phases (e.g., dawn/day/dusk/night; optionally midnight as special).~~
  - Using `dawn/day/dusk/night`, plus a **midnight window** when `currentTime` is `00:00–02:00`.
- ~~Define per-phase modifiers:~~
  - Stability cap nudge: dawn `+5`, night `-2`.
  - Draw/refine nudges: dawn boosts `light/life`, dusk boosts `shadow/air`, night slightly boosts `shadow/time/space`.
  - Midnight trade: `compressRiskMult` up (`~+12%`) and `potencyMult` up (`~+8%`) during `00:00–02:00`.
- ~~Make these modifiers small and multiplicative on top of biome (so they “nudge”).~~
  - All per-essence multipliers clamp to `0.9..1.2`.
5) Add weather-driven ambient and contamination pressure

- ~~Define weather profiles:~~
  - Implemented in ambient snapshot builders (runtime + state normalization).
  - Composition shifts (storm boosts lightning/air density, etc.).
  - Refine yield nudges (rain helps water refinement).
  - Compression difficulty modifiers (e.g., rain increases fire compression risk).
  - Contamination pressure baseline via `contaminationRiskMultByEssence` + taint nudges.
- ~~Add an intensity scalar to avoid binary swings (even if you later keep intensity fixed at 1).~~
6) Localized anomalies (hotspots that drift)

- Create an anomaly system with:
- ~~Create an anomaly system with:~~
  - Definitions + spawn rules in the world registry.
  - Drift rules applied on turn-advancing actions (seeds 1 anomaly for the current biome if empty).
- Decide visibility:
  - Exposed through `SENSE` output as anomaly names.

- Ensure DRAW , REFINE , SENSE , ATTUNE consult the ambient snapshot:
  - DRAW : scaled by density and per-essence draw multipliers
- ~~Ensure DRAW , REFINE , SENSE , ATTUNE consult the ambient snapshot:~~
  - DRAW uses `ambient.global.drawMultByEssence`.
  - REFINE uses `ambient.global.refineYieldMultByEssence` and taint/contamination pressure.
  - SENSE reports biome/time/weather/anomaly influences.
  - ATTUNE unchanged (still sets stance).
- ~~Keep this as a single “ambient modifier bundle” computed once per turn/action, not scattered math.~~
8) Deepen resource dynamics: potency, purity, decay

- ~~Add per-container stats for stored essence:~~
  - Charges now track `amount`, `purity`, `potency`, `createdTurn`, `lastTouchedTurn`, `expiresTurn`.
  - Per-turn decay reduces potency/amount and is influenced by interference + ambient taint.
- Decide decay outcomes:
  - Implemented: potency and amount both decay each turn (potency slightly faster).
9) Contamination loop

- ~~Add contamination sources:~~
  - Drawing now accumulates per-essence `reservesTaint` based on ambient taint + contamination pressure.
  - Weather/anomalies can raise ambient taint and contamination pressure.
- Add resolution paths:
  - Passive decay slowly reduces `reservesTaint` over time.
  - (No explicit PURGE action yet.)
- ~~Make contamination matter by feeding into: refine yield, misfire odds, backlash severity.~~
  - Refining purity is reduced by blended (ambient + reserve) taint.
10) Cross-essence interference (opposition + mismatch)

- ~~Define an opposition matrix (fire↔water, light↔shadow, etc.) and maybe “adjacency harmony” (air+lightning synergize).~~
- ~~Compute an “interference score” for the player’s current stored/compressed mix:~~
  - Implemented as an overlap ratio for opposing pairs.
- Interference impacts:
  - Implemented: interference increases storage decay rate.
11) Progression hooks (perks as modifiers, not new subsystems)

- Add a perk framework for magic that can modify:
  - compression risk multiplier
  - capacity usage reduction for compressed forms
  - stability threshold increase
  - backlash severity reduction
  - refine efficiency and purity improvements
- Implement in tiers:
  - Tier 1: quality-of-life (slightly safer, slightly faster)
  - Tier 2: specialization (element-specific tuning, interference reduction)
  - Tier 3: signature capability (dual-refine, stable multi-weave)
12) Risk model: from binary fail to outcome spectrum

- Replace “success/fail” with outcome categories:
  - clean success
  - strained success (reduced potency, stability hit)
  - partial misfire (pattern drift, leaks essence)
  - backlash (tiered consequences)
- Introduce “resonance” as a tracked meter influenced by:
  - action intensity (compress/weave)
  - interference score
  - contamination
  - environmental pressure (anomalies, storms)
- Define overload thresholds that trigger “wild magic”-style side effects that still keep gameplay readable.
13) Action synergy: persistent SHAPE/ANCHOR states

- Ensure SHAPE and ANCHOR create explicit, persistent state objects:
  - remaining essence, decay timer, stability contribution, tags (e.g., “spear”, “ward”, “focus”)
- Define synergy rules:
  - WEAVE can consume SHAPE for bonus potency/accuracy
  - ANCHOR can stabilize WEAVE (lower misfire/backlash odds)
  - Persistent states decay slowly out of combat and faster in combat (or vice versa, as desired)
14) Combat integration: cast time + interruption

- Assign cast time bands to magic actions (instant/short/long/channel).
- Add an interruption check:
  - if hit during cast, roll vs stability/resonance to determine: fizzles, partial, backlash
- Add tactical levers:
  - pre-cast setup (shape/anchor) reduces cast time or interruption vulnerability
  - high-cost weaves trade: big payoff, big risk, bigger interruption window
15) Discovery loop: patterns, rare sources, attunement quests

- Implement “pattern unlock” conditions:
  - location-based (must sense/attune in zone)
  - essence-pair experimentation (discover on first successful weave of combo)
  - quest reward unlocks (narrative progression)
- Add rare essence source definitions:
  - unique ambient variants that enable branches (storm-water, ash-fire)
- Add a lightweight quest hook:
  - completion grants perk point, pattern, or a new anomaly that becomes accessible.
16) Feedback overhaul (player-facing clarity)

- Define a consistent vocabulary ladder for:
  - stability states (steady → wavering → volatile → fracturing)
  - resonance states (quiet → humming → ringing → shrieking)
  - contamination states (clean → tainted → foul)
- Update SENSE output to explain why :
  - “Stormfront overhead: lightning density high; fire compression dampened; taint risk elevated.”
- Add “meaningful change” thresholds to avoid spam:
  - only announce ambient shifts when modifiers cross a boundary or anomaly appears/drifts.
17) Testing & balancing plan (before tuning numbers)

- Create scenario-based tests (design-level, not just unit):
  - same action in different biomes produces expected relative outcomes
  - time/weather nudges do not overwhelm biome identity
  - contamination meaningfully changes refine/misfire probabilities
  - perks reduce risk in the intended dimensions without eliminating it
- Add a simple balancing harness (even a debug mode) to simulate 1000 casts and inspect distributions.
18) Rollout strategy (reduce risk to existing gameplay)

- Ship in layers:
  - Layer A: ecology snapshot + SENSE feedback (no major balance impact)
  - Layer B: decay/contamination/interference (resource depth)
  - Layer C: risk spectrum + resonance overload (feel + drama)
  - Layer D: perks + discovery + combat casting (progression + pacing)
- After each layer: rebalance coefficients and adjust feedback thresholds.
