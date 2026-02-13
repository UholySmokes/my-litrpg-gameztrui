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
- Off-biome draw baseline: dominant `+20%` (`1.20`), off-biome `-10%` (`0.90`), clamped `0.90..1.20`.

Open questions (resolved):
- ~~Should decay and anomaly drift tick only on turn-advancing actions, or also on read-only actions like `SENSE`?~~
- ~~Do you want time as coarse phases (`dawn/day/dusk/night`) or a numeric clock (`hour 0-23`)?~~
- ~~Should weather be global, per-biome, or per-location? Also: deterministic schedule vs RNG changes?~~
- ~~Confirm essence set: `fire, water, earth, air, lightning, shadow, light, life, creation ,destruction, space, time` (anything missing like `ice` or `metal`)?~~
- ~~How strong should off-biome penalties be (e.g., dominant +20%, off-biome -10%), and what clamp limits?~~
  - Locked: draw dominant `1.20`, draw off-biome `0.90`; clamps `0.90..1.20` (also used for refine/potency/etc.).

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

- ~~Create an anomaly system with:~~
  - Definitions + spawn rules in the world registry.
  - Drift rules applied on turn-advancing actions (seeds 1 anomaly for the current biome if empty).
- ~~Decide visibility:~~
  - Exposed through `SENSE` output as anomaly names.

- ~~Ensure DRAW , REFINE , SENSE , ATTUNE consult the ambient snapshot:~~
  - DRAW : scaled by density and per-essence draw multipliers
  - DRAW uses `ambient.global.drawMultByEssence`.
  - REFINE uses `ambient.global.refineYieldMultByEssence` and taint/contamination pressure.
  - SENSE reports biome/time/weather/anomaly influences.
  - ATTUNE unchanged (still sets stance).
- ~~Keep this as a single “ambient modifier bundle” computed once per turn/action, not scattered math.~~
8) Deepen resource dynamics: potency, purity, decay

- ~~Add per-container stats for stored essence:~~
  - Charges now track `amount`, `purity`, `potency`, `createdTurn`, `lastTouchedTurn`, `expiresTurn`.
  - Per-turn decay reduces potency/amount and is influenced by interference + ambient taint.
- ~~Decide decay outcomes:~~
  - Implemented: potency and amount both decay each turn (potency slightly faster).
9) Contamination loop

- ~~Add contamination sources:~~
  - Drawing now accumulates per-essence `reservesTaint` based on ambient taint + contamination pressure.
  - Weather/anomalies can raise ambient taint and contamination pressure.
- ~~Add resolution paths:~~
  - Passive decay slowly reduces `reservesTaint` over time.
  - Added explicit `PURGE` action (`purge <essence|all> [amount]`) to actively scrub contamination at stability/resonance cost.
- ~~Make contamination matter by feeding into: refine yield, misfire odds, backlash severity.~~
  - Refining purity is reduced by blended (ambient + reserve) taint.
10) Cross-essence interference (opposition + mismatch)

- ~~Define an opposition matrix (fire↔water, light↔shadow, etc.) and maybe “adjacency harmony” (air+lightning synergize).~~
- ~~Compute an “interference score” for the player’s current stored/compressed mix:~~
  - Implemented as an overlap ratio for opposing pairs.
- ~~Interference impacts:~~
  - Implemented: interference increases storage decay rate.
11) Progression hooks (perks as modifiers, not new subsystems)

- ~~Add a perk framework for magic that can modify:~~
  - Implemented `player.magic.perks` (strings or `{ id, rank }`) and perk lookups.
  - Implemented perk effects: `safer_compression`, `clean_refining`, `refine_yield`, `stable_weaves`, `resonance_damping`.
- ~~Implement in tiers:~~
  - Basic rank tiers now progress for already-owned perks via usage XP.
  - No UI yet; no automatic perk unlock flow yet (ranking only applies to owned perks).
12) Risk model: from binary fail to outcome spectrum

- ~~Replace “success/fail” with outcome categories:~~
  - Actions now label outcomes as `clean success`, `strained success`, `partial misfire`, `backlash`.
- ~~Introduce “resonance” as a tracked meter influenced by:~~
  - Added `player.magic.resonance` with `quiet/humming/ringing/shrieking` states.
  - Resonance increases on DRAW/REFINE/COMPRESS/WEAVE/RELEASE and decays on turn ticks.
  - Resonance factors include action intensity, interference, contamination/taint, and environment pressure.
- ~~Define overload thresholds that trigger “wild magic”-style side effects that still keep gameplay readable.~~
  - Implemented: high resonance still affects misfire/coherence, plus explicit overload events (`stability feedback`, `taint bloom`, `charge fracture`, `reserve bleed`) at high/critical resonance with readable narration.
13) Action synergy: persistent SHAPE/ANCHOR states

- ~~Ensure SHAPE and ANCHOR create explicit, persistent state objects:~~
  - ANCHOR persists on `player.magic.anchors`.
  - SHAPE/WEAVE now leave short-lived entries in `player.magic.activeWorkings` (expires by turn).
- ~~Define synergy rules:~~
  - ANCHOR stabilizes (reduces) compress misfire risk and resonance gain; also boosts weave coherence.
14) Combat integration: cast time + interruption

- ~~Assign cast time bands to magic actions (instant/short/long/channel).~~
  - Implemented cast-time turns for `magic_release` in combat: shape=short (1), weave=long (2), anchor reduces by 1.
- ~~Add an interruption check:~~
  - Damage during casting interrupts with outcome: fizzle / partial / backlash.
- ~~Add tactical levers:~~
  - ANCHOR reduces cast time and improves interruption odds.
  - Non-attack combat actions now advance the enemy turn, so casting carries real risk.
15) Discovery loop: patterns, rare sources, attunement quests

- ~~Implement “pattern unlock” conditions:~~
  - Implemented: unfamiliar patterns can be attempted; successful RELEASE unlocks the pattern.
  - Implemented: quests can auto-complete on unlocked patterns; rewards can grant patterns/perks.
- ~~Add rare essence source definitions:~~
  - Implemented: rare source defs (`storm_water`, `ash_fire`) contribute to ambient modifiers and are tracked in `world.essence.sources` when present.
- ~~Add a lightweight quest hook:~~
  - Added a side quest template that auto-completes when the player unlocks a weave pattern.
16) Feedback overhaul (player-facing clarity)

- ~~Define a consistent vocabulary ladder for:~~
  - Implemented in SENSE output.
- ~~Update SENSE output to explain why :~~
  - SENSE now includes stability/resonance/contamination labels, plus notable draw multipliers and source/anomaly names.
- ~~Add “meaningful change” thresholds to avoid spam:~~
  - Implemented: system announces ambient shifts when weather/time/anomaly/source changes cross thresholds.
17) Testing & balancing plan (before tuning numbers)

- ~~Create scenario-based tests (design-level, not just unit):~~
  - Added ecology scenario tests (biome dominance vs nudges, contamination/perk effects, misfire rates).
- ~~Add a simple balancing harness (even a debug mode) to simulate 1000 casts and inspect distributions.~~
  - Added `tools/magicBalanceHarness.mjs` (prints outcome distributions as JSON).
18) Rollout strategy (reduce risk to existing gameplay)

- ~~Ship in layers:~~
  - Implemented rollout flags via `config.magicRollout.layerA..layerD` (default all enabled).
  - Layer A gates ambient ecology snapshot/detail context in SENSE.
  - Layer B gates decay/contamination/interference + PURGE availability.
  - Layer C gates resonance pressure + overload events.
  - Layer D gates perk progression, discovery persistence, and combat cast-time staging.
- ~~After each layer: rebalance coefficients and adjust feedback thresholds.~~
  - Rollout now supports per-layer toggling, so balancing can be done incrementally without code edits.
