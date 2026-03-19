# Round 1 — Game Design Team Plan

> **Team**: Director Chen, Kai (Systems), Yara (Content), Felix (Economy), Nadia (UX)
> **Date**: 2026-03-19
> **Avg Review Score**: 6.5/10 — "Deep systems, starved content, broken scaling"

---

## Current State Audit

| Domain | Current Count | Required for 1000-level game | Gap |
|--------|--------------|------------------------------|-----|
| Enemies | 8 (levels 1–10) | 60+ across 20 tiers | **Critical** |
| Locations | 24 across 8 zones + 2 partial zones | 48+ across 10 zones | **High** |
| Titles | 8 | 50+ | **High** |
| Gacha items | 20 across 3 pools | 80+ across 5 pools | **High** |
| XP brackets | 1 (`growth: 1.5`) | 6–8 piecewise | **Critical** |
| Rest heal | 0 HP / 0 Mana | Meaningful recovery | **Critical** |
| Starting attr spread | Flat 5 all stats all races | Racial differentiation | **High** |
| Endgame content | None | Dungeons / towers / bosses | **High** |
| Faction reputation | 11 factions defined, 0 player-facing rep | Reputation system | **Medium** |
| Bestiary/compendium | None | Collection tracking UI | **Medium** |
| Lane positioning | Exists (0.85x/0.7x modifiers) but no controls | Player-facing controls | **Medium** |
| Narrative memory | 120-entry window (DEFAULT_MAX_ENTRIES) | Hierarchical summarization | **Medium** |
| Classes | 18 base + evolutions | Adequate | OK |
| Races | 50+ with full skill trees | Adequate | OK |
| Magic (Essence Weaving) | 12 primes, full system | Adequate | OK |

---

## Phase 1: Critical Balance Fixes (Week 1–2)

### 1.1 XP Curve Rework

**Owner**: Kai (Systems)
**Priority**: MUST-HAVE
**Archetypes served**: All 6

#### The Problem

Current single bracket: `{ end: 1000, base: 100, growth: 1.5 }`

This means `xpForNextLevel(level) = 100 * 1.5^(level-1)`:

| Level | XP to next | Cumulative XP | Verdict |
|-------|-----------|---------------|---------|
| 1→2 | 100 | 100 | Fine |
| 10→11 | 3,844 | 11,256 | Fine |
| 20→21 | 114,805 | 337,621 | Grindy |
| 30→31 | 3,425,651 | ~10M | Punishing |
| 50→51 | 637,621,500 | ~1.9B | **Impossible** |
| 100→101 | 4.06×10^17 | ∞ | **Broken** |

The 1.5x growth factor becomes mathematically impossible around level 40–50. No amount of mob XP scaling can compensate.

#### Proposed Fix: 8-Bracket Piecewise Curve

Replace the single bracket with a piecewise system that slows growth at tier boundaries:

```javascript
const defaultBrackets = [
  { end: 10,   base: 100,    growth: 1.15 },  // Tutorial: ~100–405 XP per level
  { end: 25,   base: 420,    growth: 1.12 },  // Early: ~420–2,740
  { end: 50,   base: 2_800,  growth: 1.10 },  // Mid-early: ~2,800–33,200
  { end: 100,  base: 34_000, growth: 1.08 },  // Mid: ~34k–165k
  { end: 200,  base: 170_000, growth: 1.06 }, // Mid-late: ~170k–1.7M
  { end: 400,  base: 1_800_000, growth: 1.04 }, // Late: ~1.8M–10.5M
  { end: 700,  base: 11_000_000, growth: 1.02 }, // Endgame: ~11M–40M
  { end: 1000, base: 42_000_000, growth: 1.005 }, // Prestige: ~42M–49M
];
```

**Design rationale (Kai)**:
- Each bracket reduces the growth exponent as level rises
- Level 100 requires ~2.5 hours of on-level combat (not 200 years)
- Level 1000 is achievable in ~500 hours of total play — an endgame goal, not a wall
- The `base` of each bracket picks up roughly where the previous ends, ensuring smooth transitions
- Growth rates: `1.15 → 1.12 → 1.10 → 1.08 → 1.06 → 1.04 → 1.02 → 1.005`

**Verification**: Run `xpToReachLevel(1000, config)` — should return a finite, humanly achievable number (~2–5 billion total XP over full journey).

**Files to change**:
- `packages/game-core/src/data/initialState.js` — update `INITIAL_CONFIG.xpBrackets`
- `packages/game-core/src/core/xpCurve.js` — no code changes needed (already supports brackets)
- `system_specs.md` — update spec to match

**Existing mob XP rewards scale with this**: The `calculateGainedXP()` function already applies level-delta bonuses (+20% per level above, -10% per level below), so as long as mob base XP scales by tier, the rewards stay proportional.

---

### 1.2 Rest Healing Values

**Owner**: Kai (Systems)
**Priority**: MUST-HAVE
**Archetypes served**: Casual, Explorer, Story-first

#### The Problem

```javascript
restHealAmount: 0,
restManaAmount: 0,
```

Resting does literally nothing. Players cannot recover without potions or level-ups.

#### Proposed Fix

```javascript
restHealAmount: 0.25,    // Heal 25% of max HP on rest
restManaAmount: 0.40,    // Restore 40% of max Mana on rest
```

**Design rationale (Kai / Nadia)**:
- HP at 25%: enough to survive one more encounter but not infinite sustain; still incentivizes potions and healing skills for burst recovery
- Mana at 40%: magic users burn mana fast; 40% lets them cast 2–3 more spells before needing a full rest cycle again
- These are _percentage-based_, meaning `Math.floor(restHealAmount * player.hp.max)` — scales with level
- Formula interpretation: The current code likely multiplies these by max HP/Mana. If it expects flat values, the reducer must be updated to `Math.floor(config.restHealAmount * state.player.hp.max)`

**Gameplay implications**:
- "Rest → fight → rest → fight" loop becomes viable for cautious players
- Doesn't trivialize difficulty because 25% HP won't save you from a 3-hit combo
- Mana recovery favors casters slightly — intentional; melee classes regenerate resources through combat (rage, chi, energy)

**Files to change**:
- `packages/game-core/src/data/initialState.js` — update `restHealAmount` and `restManaAmount`
- Verify the rest action handler in the game reducer applies percentage-based healing

---

### 1.3 Starting Attribute Spreads Per Race

**Owner**: Kai (Systems) + Yara (Content)
**Priority**: MUST-HAVE
**Archetypes served**: Optimizer, Roleplayer, Min-maxer

#### The Problem

```javascript
const INITIAL_ATTRIBUTES = {
  strength: 5, agility: 5, dexterity: 5, vitality: 5,
  intelligence: 5, wisdom: 5, charisma: 5, willpower: 5,
  luck: 5, soul: 5, freePoints: 0,
};
```

Every race starts identical. 50+ races with unique skill trees but zero stat identity at creation.

#### Proposed Fix: Race Attribute Modifier Table

Instead of overriding `INITIAL_ATTRIBUTES`, add a `raceAttributeModifiers` lookup to config. The character creation flow applies these as deltas from the base 5.

**Budget rule**: Each race gets **+8 / -3** total stat points from base (net +5). This creates meaningful choice without crippling builds.

**Sample races** (out of 50+):

| Race | STR | AGI | DEX | VIT | INT | WIS | CHA | WIL | LCK | SOL | Net |
|------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Pure Human | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 | 0 | 0 | +5 |
| Neo Human | 0 | +1 | +2 | 0 | +2 | +1 | +1 | 0 | 0 | -2 | +5 |
| Dragon Blood | +3 | 0 | 0 | +2 | +1 | 0 | 0 | +1 | 0 | -2 | +5 |
| Shadow Walker | 0 | +3 | +2 | -1 | 0 | 0 | -1 | +1 | +1 | 0 | +5 |
| Fae Touched | -1 | +2 | +1 | -1 | +2 | +1 | +2 | 0 | +1 | -2 | +5 |
| Ironhide | +2 | -1 | 0 | +3 | -1 | 0 | 0 | +2 | 0 | 0 | +5 |
| Void Walker | -1 | 0 | 0 | -1 | +3 | +2 | -1 | +1 | 0 | +2 | +5 |
| Stormforged | +2 | +1 | +1 | +1 | 0 | 0 | 0 | +1 | 0 | -1 | +5 |
| Phoenix Reborn | 0 | 0 | 0 | +2 | +1 | +1 | 0 | +1 | 0 | +2 | +5 |-2 elsewhere |
| Undead Awakened | +1 | 0 | +1 | +3 | 0 | -1 | -2 | +3 | 0 | 0 | +5 |

**Implementation**: Add `raceAttributeModifiers` map to config or a new `raceStartingStats.json` data file. During character creation, merge modifiers onto `INITIAL_ATTRIBUTES` (clamping minimum to 1).

**Files to change**:
- `packages/game-core/src/data/initialState.js` — add `raceAttributeModifiers` to `INITIAL_CONFIG` or create separate data file
- Character creation logic (wherever race selection applies) — apply modifiers
- All 50+ races need modifier entries (can batch-generate from existing race flavor data)

---

## Phase 2: Content Expansion Wave 1 (Week 3–6)

### 2.1 Enemy Roster Expansion: 8 → 60+

**Owner**: Yara (Content) + Kai (Systems)
**Priority**: MUST-HAVE
**Archetypes served**: All 6

#### Current enemies (8):

| ID | Name | Level | Type | XP | Gold |
|----|------|-------|------|----|------|
| goblin | Goblin | 1 | humanoid | 10 | 5 |
| wolf | Wolf | 2 | beast | 15 | 8 |
| orc | Orc | 3 | humanoid | 25 | 15 |
| skeleton | Skeleton | 4 | undead | 30 | 10 |
| troll | Troll | 5 | giant | 50 | 30 |
| bandit | Bandit | 3 | humanoid | 20 | 25 |
| dark_mage | Dark Mage | 6 | humanoid | 60 | 40 |
| dragon_whelp | Dragon Whelp | 10 | dragon | 150 | 100 |

#### Proposed Enemy Tier System

Enemies are organized into **level tiers** matching zones and XP brackets. Each tier has 6–8 enemies, including 1 elite (mini-boss HP, better drops).

**Stat Scaling Formula** (Kai):
```
base HP   = 20 + (level * 12) + (level^1.3 * 2)
attack    = 5 + (level * 2.5)
defense   = 2 + (level * 1.5)
speed     = 3 + (level * 0.5)
xpReward  = floor(10 * level^1.1)
goldReward = floor(5 * level^1.05)
```

Elite enemies: **3x HP**, **1.5x attack**, **2x XP/gold**, unique drop.

#### Full Enemy Roster (62 enemies)

**Tier 1: Levels 1–10 (City / Ruins starter zones)**

| ID | Name | Lvl | Type | Notes |
|----|------|-----|------|-------|
| goblin | Goblin | 1 | humanoid | (existing) |
| alley_rat | Alley Rat | 1 | beast | Tutorial-safe |
| street_thug | Street Thug | 2 | humanoid | City encounters |
| wolf | Wolf | 2 | beast | (existing) |
| stormglass_shard | Stormglass Shard | 3 | construct | Ruins-themed |
| orc | Orc | 3 | humanoid | (existing) |
| bandit | Bandit | 3 | humanoid | (existing) |
| skeleton | Skeleton | 4 | undead | (existing) |
| leyline_wisp | Leyline Wisp | 4 | elemental | Magic-type |
| troll | Troll | 5 | giant | (existing) |
| dark_mage | Dark Mage | 6 | humanoid | (existing) |
| quarantine_golem | Quarantine Golem | 7 | construct | Ruins elite |
| feral_hound_pack | Feral Hound Pack | 8 | beast | Multi-hit |
| ruin_crawler | Ruin Crawler | 9 | insectoid | Fast attacker |
| dragon_whelp | Dragon Whelp | 10 | dragon | (existing, tier boss) |

**Tier 2: Levels 11–25 (Wilds / Skydocks)**

| ID | Name | Lvl | Type | Notes |
|----|------|-----|------|-------|
| rootbound_shaman | Rootbound Shaman | 12 | humanoid | Healer enemy |
| bloom_spore | Bloom Spore | 13 | plant | DoT attacker |
| ember_drake | Ember Drake | 15 | dragon | Fire-element |
| sky_pirate | Sky Pirate | 16 | humanoid | Ranged + dodge |
| gantry_automaton | Gantry Automaton | 18 | construct | High defense |
| wind_elemental | Wind Elemental | 19 | elemental | Speed-based |
| moss_hulk | Moss Hulk | 20 | plant | Regen enemy |
| **skyforge_warden** | **Skyforge Warden** | 22 | construct | **Elite** |
| stormhawk | Stormhawk | 24 | beast | Flying, evasive |
| ashland_berserker | Ashland Berserker | 25 | humanoid | Rage mechanic |

**Tier 3: Levels 26–50 (Undercity / Mountain / Coast)**

| ID | Name | Lvl | Type | Notes |
|----|------|-----|------|-------|
| tunnel_lurker | Tunnel Lurker | 28 | beast | Ambush attacks |
| veil_assassin | Veil Assassin | 30 | humanoid | Stealth + crit |
| crystal_golem | Crystal Golem | 32 | construct | Reflects magic |
| abyssal_crab | Abyssal Crab | 34 | beast | Coast encounter |
| **memory_shade** | **Memory Shade** | 36 | undead | **Elite**, copies player skill |
| tide_serpent | Tide Serpent | 38 | beast | Water element |
| corrupted_warden | Corrupted Warden | 40 | humanoid | Faction-enemy |
| vent_wyrm | Vent Wyrm | 42 | dragon | Volcanic zone |
| ledger_phantom | Ledger Phantom | 45 | spirit | Undercity boss |
| ridgeline_basilisk | Ridgeline Basilisk | 48 | beast | Petrify chance |
| **caldera_titan** | **Caldera Titan** | 50 | giant | **Elite**, tier boss |

**Tier 4: Levels 51–100 (Desert / Volcanic / Dreamscape)**

| ID | Name | Lvl | Type | Notes |
|----|------|-----|------|-------|
| sand_wraith | Sand Wraith | 55 | undead | Mirage attacks |
| mirage_stalker | Mirage Stalker | 58 | spirit | Illusion copies |
| lava_elemental | Lava Elemental | 62 | elemental | Fire/Earth dual |
| ash_dragon | Ash Dragon | 65 | dragon | AoE fire breath |
| dream_weaver | Dream Weaver | 68 | spirit | Status effects |
| **obsidian_colossus** | **Obsidian Colossus** | 72 | construct | **Elite** |
| dust_djinn | Dust Djinn | 75 | elemental | Wish mechanic |
| void_tendril | Void Tendril | 80 | aberration | Anti-magic |
| mnemonic_hydra | Mnemonic Hydra | 85 | dragon | Multi-head regen |
| temporal_echo | Temporal Echo | 90 | spirit | Reverses damage |
| **spirefall_phantom** | **Spirefall Phantom** | 100 | spirit | **Elite**, tier boss |

**Tier 5: Levels 101–200 (Expanded zones / Endgame approaches)**

| ID | Name | Lvl | Type | Notes |
|----|------|-----|------|-------|
| voidscar_behemoth | Voidscar Behemoth | 120 | aberration | Void element |
| soulforged_knight | Soulforged Knight | 140 | construct | Soul-based |
| leyline_archon | Leyline Archon | 160 | elemental | All-element |
| **elder_wyrm** | **Elder Wyrm** | 180 | dragon | **Elite** |
| reality_fracture | Reality Fracture | 200 | aberration | Tier boss |

**Tier 6: Levels 201–500 (Deep endgame)**

| ID | Name | Lvl | Type | Notes |
|----|------|-----|------|-------|
| epoch_sentinel | Epoch Sentinel | 250 | construct | Time-locked |
| abyssal_leviathan | Abyssal Leviathan | 300 | beast | Massive HP pool |
| celestial_shade | Celestial Shade | 350 | spirit | Light/Dark dual |
| **primordial_drake** | **Primordial Drake** | 400 | dragon | **Elite** |
| system_anomaly | System Anomaly | 500 | aberration | Tier boss |

**Tier 7: Levels 501–1000 (Prestige content)**

| ID | Name | Lvl | Type | Notes |
|----|------|-----|------|-------|
| world_eater | World Eater | 600 | aberration | Raid-tier |
| spire_echo | Spire Echo | 700 | construct | Echoes of the Fallen Spire |
| void_sovereign | Void Sovereign | 800 | aberration | Near-final |
| **grandmother_void_avatar** | **Grandmother Void Avatar** | 900 | aberration | **Elite** |
| shattered_spire_core | Shattered Spire Core | 1000 | construct | Final boss |

**Files to change**:
- `packages/game-core/src/data/registries/EnemyDataRegistry.js` — expand `enemies` array
- Create `packages/game-core/src/data/generated/enemy-tiers.json` for bulk data if preferred
- Update `getEnemiesByLevelRange()` — already supports range queries, no code change needed

---

### 2.2 Location Expansion: 24 → 50+

**Owner**: Yara (Content)
**Priority**: MUST-HAVE
**Archetypes served**: Explorer, Roleplayer, Casual

#### Current zones and location counts:

| Zone | Current | Target | Delta |
|------|---------|--------|-------|
| city | 4 | 6 | +2 |
| ruins | 3 | 5 | +2 |
| wilds | 3 | 5 | +2 |
| skydocks | 3 | 5 | +2 |
| undercity | 3 | 5 | +2 |
| mountain | 3 | 5 | +2 |
| coast | 3 | 5 | +2 |
| desert | 3 | 5 | +2 |
| volcanic | 3 | 5 | +2 |
| dreamscape | 3 | 5 | +2 |
| **Total** | **~24** (some zones partial) | **51** | **+27** |

#### New Locations (27 additions)

Each zone gets 2 additional locations, one public and one restricted:

**City (+2)**:
- `city_synthwire_clinic` — "Synthwire Clinic" (public) — A body-mod parlor where augmentations are prayers and side effects are sermons
- `city_contract_court` — "Contract Court" (restricted) — The Aurum Exchange's legal arena where deals become binding metaphysics

**Ruins (+2)**:
- `ruins_echo_vault` — "Echo Vault" (public) — A chamber where every sound replays the Spirefall in miniature
- `ruins_shard_garden` — "Shard Garden" (restricted) — Stormglass spires grown like crystal flowers, humming with trapped lightning

**Wilds (+2)**:
- `wilds_spore_hollow` — "Spore Hollow" (public) — A fungal cathedral where bioluminescence maps the undersoil like a circuit board
- `wilds_thornwall_pass` — "Thornwall Pass" (restricted) — Living brambles that negotiate passage in sap and blood

**Skydocks (+2)**:
- `skydocks_drydock_seven` — "Drydock Seven" (public) — An abandoned repair bay where decommissioned engines whisper engine-law in static
- `skydocks_stormwatch_tower` — "Stormwatch Tower" (restricted) — The highest point in the arc, where weather is predicted and sometimes negotiated

**Undercity (+2)**:
- `undercity_pipeline_junction` — "Pipeline Junction" (public) — Where three leyline feeds converge and the air tastes like copper and regret
- `undercity_ink_sanctum` — "Ink Sanctum" (restricted) — The inner vault where living ink writes contracts that cannot be unwritten

**Mountain (+2)**:
- `mountain_echo_basin` — "Echo Basin" (public) — A bowl-shaped valley where shouts return as someone else's voice
- `mountain_geode_labyrinth` — "Geode Labyrinth" (restricted) — Natural crystal caves that change layout when no one is watching

**Coast (+2)**:
- `coast_breakwater_shrine` — "Breakwater Shrine" (public) — A salt-crusted altar where the Tideward Order prays to things beneath
- `coast_abyssal_shelf` — "Abyssal Shelf" (restricted) — The continental edge where deep-water creatures surface to trade or threaten

**Desert (+2)**:
- `desert_glasswalker_shrine` — "Glasswalker Shrine" (public) — A monument to those who learned to walk on fused sand without burning
- `desert_time_scar` — "Time Scar" (restricted) — A fissure where past and present overlap and your shadow arrives before you do

**Volcanic (+2)**:
- `volcanic_forge_cathedral` — "Forge Cathedral" (public) — A vast chamber where smithing is liturgy and the anvils sing response
- `volcanic_magma_throne` — "Magma Throne" (restricted) — The deepest vent, where something ancient sits and radiates patience

**Dreamscape (+2)**:
- `dreamscape_lucid_archive` — "Lucid Archive" (public) — A library of dreams that have been cataloged, shelved, and occasionally checked out
- `dreamscape_nightmare_gate` — "Nightmare Gate" (restricted) — The threshold past which dreams become hostile negotiations

**Files to change**:
- `packages/game-core/src/world/WorldDataRegistry.js` — append to `locations` array

---

### 2.3 Title Expansion: 8 → 52

**Owner**: Yara (Content) + Felix (Economy)
**Priority**: MUST-HAVE
**Archetypes served**: Optimizer, Completionist, Min-maxer

#### Design Philosophy

Titles should be milestones that mark real accomplishment. Categories:
1. **Combat milestones** (kill counts, specific enemies)
2. **Progression milestones** (level thresholds)
3. **Economy milestones** (gold, pulls, purchases)
4. **Exploration milestones** (locations visited, zones cleared)
5. **System mastery** (skills, magic, crafting)
6. **Faction-earned** (reputation thresholds — Phase 3)
7. **Hidden/secret** (special conditions)

#### New Titles (44 additions, total 52)

**Combat Titles (12 new)**:

| ID | Name | Unlock Condition | Main Bonus |
|----|------|-----------------|------------|
| first_blood | First Blood | Kill 1 enemy | str +1 |
| centurion | Centurion | Kill 100 enemies | str +5, attack +3 |
| slaughter_lord | Slaughter Lord | Kill 1000 enemies | str +10, crit +5% |
| beast_tracker | Beast Tracker | Kill 20 beasts | agi +3, speed +2 |
| construct_breaker | Construct Breaker | Kill 15 constructs | str +4, defense +3 |
| undead_purifier | Undead Purifier | Kill 25 undead | wil +5, light dmg +10% |
| dragon_lord | Dragon Lord | Kill 5 dragon-type | all stats +3 |
| elemental_conqueror | Elemental Conqueror | Kill 30 elementals | int +5, resist all +5% |
| aberration_hunter | Aberration Hunter | Kill 10 aberrations | soul +5, void resist +10% |
| flawless_victor | Flawless Victor | Win combat at full HP | agi +5, dodge +3% |
| comeback_king | Comeback King | Win at < 5% HP | vit +5, hp regen +2 |
| one_hit_wonder | One Hit Wonder | One-shot an enemy 5+ levels above you | str +8, crit dmg +10% |

**Progression Titles (10 new)**:

| ID | Name | Unlock Condition | Main Bonus |
|----|------|-----------------|------------|
| journeyman | Journeyman | Reach level 10 | all stats +2 |
| veteran_blade | Veteran Blade | Reach level 25 | str +5, agi +5 |
| ascendant | Ascendant | Reach level 50 | all stats +5 |
| centurion_mark | Centurion Mark | Reach level 100 | all stats +8, xp +5% |
| arcane_paragon | Arcane Paragon | Reach level 200 | int +15, mana +20% |
| mythic_walker | Mythic Walker | Reach level 300 | all stats +12 |
| eternal_champion | Eternal Champion | Reach level 500 | all stats +20 |
| world_pillar | World Pillar | Reach level 700 | all stats +25, hp +10% |
| spire_inheritor | Spire Inheritor | Reach level 900 | all stats +30 |
| transcendent | Transcendent | Reach level 1000 | all stats +50, legendary passive |

**Economy Titles (6 new)**:

| ID | Name | Unlock Condition | Main Bonus |
|----|------|-----------------|------------|
| coin_collector | Coin Collector | Earn 500 gold total | luck +2, gold +5% |
| gold_magnate | Gold Magnate | Earn 10,000 gold total | cha +5, gold +10% |
| soul_investor | Soul Investor | Spend 500 soulpoints | soul +5 |
| lucky_roller | Lucky Roller | Gacha pull 10 times | luck +3 |
| big_spender | Big Spender | Spend 50,000 gold total | cha +8, shop discount 15% |
| fortune_blessed | Fortune Blessed | Pull 3 legendary items from gacha | luck +10, gacha +5% |

**Exploration Titles (8 new)**:

| ID | Name | Unlock Condition | Main Bonus |
|----|------|-----------------|------------|
| city_dweller | City Dweller | Visit all city locations | cha +3 |
| ruin_delver | Ruin Delver | Visit all ruins locations | int +3 |
| wild_wanderer | Wild Wanderer | Visit all wilds locations | agi +3, nature resist +5% |
| sky_walker | Sky Walker | Visit all skydock locations | agi +4 |
| depth_crawler | Depth Crawler | Visit all undercity locations | wil +3 |
| world_explorer | World Explorer | Visit all 51+ locations | all stats +10, speed +5 |
| cartographer | Cartographer | Visit 30 unique locations | wis +5, reveal hidden paths |
| zone_master | Zone Master | Clear all zones | all stats +15 |

**System Mastery Titles (5 new)**:

| ID | Name | Unlock Condition | Main Bonus |
|----|------|-----------------|------------|
| essence_initiate | Essence Initiate | Perform first essence weaving | int +2, mana +5% |
| master_weaver | Master Weaver | Weave 50 essences | int +8, weave stability +10% |
| class_evolved | Class Evolved | Complete first class evolution | primary class stat +5 |
| multiclass_adept | Multiclass Adept | Achieve 3+ class evolutions | all stats +5 |
| skill_savant | Skill Savant | Learn 20 skills | skill power +10% |

**Hidden Titles (3 new)**:

| ID | Name | Unlock Condition | Main Bonus |
|----|------|-----------------|------------|
| glitch_walker | Glitch Walker | Trigger a System anomaly | soul +10, void resist +15% |
| veil_piercer | Veil Piercer | Access all restricted areas | wil +8, detect hidden |
| spirefall_witness | Spirefall Witness | Visit the Stormglass Crater at specific narrative event | all stats +8/unique passive |

**Files to change**:
- `packages/game-core/src/data/titleData.js` — expand `titleDatabase` array
- Title unlock logic in `titleData.js` — extend `meetsConditions()` for new condition types (location visits, kill-by-type)
- `packages/game-core/src/data/initialState.js` — no changes (starts with only `novice_adventurer`)

---

### 2.4 Gacha Pool Expansion

**Owner**: Felix (Economy)
**Priority**: HIGH — nice-to-have in Phase 2, must-have by Phase 3
**Archetypes served**: Collector, Gambler, Min-maxer

#### Current state: 3 pools, ~20 items total

#### Proposed: 5 pools, 85+ items

**New pools**:

1. **Equipment Pool** (existing, expanded: 2 → 5 items per rarity = 25 items)
2. **Skill Pool** (existing, expanded: 1 → 3 items per rarity = 15 items)
3. **Premium Pool** (existing, expanded: 1 → 3 items per rarity = 15 items)
4. **Cosmetic/Title Pool** (NEW): Pull for visual effects, title variants, aura effects
5. **Essence Pool** (NEW): Pull for refined essences, rare weaving patterns, resonance catalysts

**Rarity rate rebalance** (Felix):

| Rarity | Equipment | Skill | Premium | Cosmetic | Essence |
|--------|-----------|-------|---------|----------|---------|
| Common | 50% | 40% | 25% | 40% | 35% |
| Uncommon | 30% | 30% | 30% | 30% | 30% |
| Rare | 15% | 20% | 25% | 20% | 22% |
| Epic | 4% | 8% | 15% | 8% | 10% |
| Legendary | 1% | 2% | 5% | 2% | 3% |

**Files to change**:
- `packages/game-core/src/data/gachaData.js` — expand pools and items

---

## Phase 3: Systems Completion (Week 7–10)

### 3.1 Endgame Content: Dungeons, Towers, Bosses

**Owner**: Director Chen + Yara + Kai
**Priority**: MUST-HAVE
**Archetypes served**: Optimizer, Hardcore, Completionist

#### 3.1.1 Dungeon System

**Design**: Dungeons are multi-room sequences with fixed enemy encounters, traps, and a boss at the end. They are zone-specific and level-gated.

**Core mechanics**:
- Each dungeon has 5–8 rooms
- Each room: combat encounter (1–3 enemies), trap/puzzle, or rest point
- Completing a dungeon awards bonus XP, gold, guaranteed rare+ drop, and a title fragment
- Daily lockout per dungeon (prevents farming)
- Difficulty scales to player level within a range (e.g., "level 20–35 dungeon" scales enemies to max(playerLevel, 20))

**Initial Dungeon List (10)**:

| ID | Dungeon Name | Zone | Level Range | Boss |
|----|-------------|------|-------------|------|
| dungeon_shattered_halls | Shattered Halls | ruins | 8–15 | Quarantine Golem (enhanced) |
| dungeon_bazaar_vaults | Bazaar Vaults | city | 12–20 | Vault Guardian |
| dungeon_rootweb_depths | Rootweb Depths | wilds | 20–30 | Thornheart Treant |
| dungeon_gantry_gauntlet | Gantry Gauntlet | skydocks | 25–35 | Storm Automaton |
| dungeon_ink_labyrinth | Ink Labyrinth | undercity | 30–45 | Living Ledger |
| dungeon_crystal_mines | Crystal Mines | mountain | 40–55 | Geode Colossus |
| dungeon_tidal_abyss | Tidal Abyss | coast | 50–65 | Abyssal Kraken |
| dungeon_mirage_tomb | Mirage Tomb | desert | 60–80 | Sand Pharaoh |
| dungeon_caldera_core | Caldera Core | volcanic | 75–100 | Lava Titan |
| dungeon_dream_spire | Dream Spire | dreamscape | 90–120 | Nightmare Sovereign |

**Data structure** per dungeon:
```javascript
{
  id: "dungeon_shattered_halls",
  name: "Shattered Halls",
  zoneId: "ruins",
  levelRange: { min: 8, max: 15 },
  rooms: 6,
  encounters: [
    { type: "combat", enemies: ["stormglass_shard", "skeleton"], count: 2 },
    { type: "trap", trapType: "leyline_surge", damage: "10% maxHP" },
    { type: "rest" },
    { type: "combat", enemies: ["ruin_crawler"], count: 3 },
    { type: "combat", enemies: ["quarantine_golem"], isBoss: true },
  ],
  rewards: { xpMultiplier: 2.0, goldMultiplier: 1.5, guaranteedRarity: "rare" },
  lockout: "daily",
}
```

**Files to create**:
- `packages/game-core/src/data/dungeons/` — dungeon definitions
- `packages/game-core/src/systems/dungeon/DungeonSystem.js` — dungeon runner logic

#### 3.1.2 Tower System (Endless Climb)

**Design**: A single infinite-scaling tower where each floor is a combat encounter. Floors scale in difficulty. Progress is saved. Rewards improve per 10-floor milestone.

- Floor difficulty: `enemyLevel = playerLevel + floor(floorNumber * 0.3)`
- Every 10 floors: milestone reward (title fragment, rare item, XP burst)
- Every 50 floors: mini-boss with guaranteed epic+ drop
- Leaderboard tracks highest floor reached

#### 3.1.3 World Bosses

**Design**: Weekly spawning enemies with massive HP pools meant for extended multi-session combat. Rewards scale with contribution.

**Initial bosses (3)**:
1. **The Spirefall Echo** (level 100) — ruins zone, requires ruins rep
2. **The Abyssal Gate** (level 200) — coast zone, tidal mechanics
3. **Grandmother Void's Shadow** (level 500) — dreamscape, ultimate challenge

---

### 3.2 Faction Reputation System

**Owner**: Yara + Felix
**Priority**: MUST-HAVE
**Archetypes served**: Roleplayer, Explorer, Completionist

#### Design

11 factions already exist in data with names, summaries, HQs, goals, and rivalries. Currently zero player-facing mechanics.

**Reputation tiers**:

| Level | Name | Rep Required | Benefit |
|-------|------|-------------|---------|
| 0 | Unknown | 0 | Default |
| 1 | Acknowledged | 100 | Can access faction HQ |
| 2 | Trusted | 500 | Faction shop discounts (10%) |
| 3 | Honored | 1500 | Faction quests, unique skills |
| 4 | Revered | 4000 | Faction title, exclusive gear |
| 5 | Exalted | 10000 | Faction passive, endgame unlock |

**Earning rep**:
- Kill enemies in faction's zone: +5–15 rep
- Complete faction quests: +50–200 rep
- Dungeon completion in faction zone: +100 rep
- Faction-specific daily tasks: +25 rep

**Rival faction penalty**: Gaining rep with a faction costs 25% rep with its rival (from the `rivals` field already in data).

**Player state addition**:
```javascript
player.factionReputation = {
  arcane_wardens: { current: 0, tier: 0 },
  aurum_exchange: { current: 0, tier: 0 },
  // ... all 11 factions
};
```

**Files to create**:
- `packages/game-core/src/systems/faction/FactionReputationSystem.js`
- `packages/game-core/src/data/factionRewards.json`

**Files to change**:
- `packages/game-core/src/data/initialState.js` — add `factionReputation` to player state
- `packages/game-core/src/world/WorldDataRegistry.js` — already has faction data, no changes

---

### 3.3 Lane Positioning Controls

**Owner**: Kai (Systems) + Nadia (UX)
**Priority**: HIGH
**Archetypes served**: Optimizer, Hardcore

#### Current State

The combat system already calculates lane distance and applies modifiers:
- Distance 0: 100% damage (melee range)
- Distance 1: 85% damage
- Distance 2+: 70% damage

But lanes are assigned internally. Players cannot move.

#### Proposed: Player Lane Actions

Add two combat actions:
- **Advance** — Move 1 lane closer to target enemy (reduces distance)
- **Retreat** — Move 1 lane further from target enemy (increases distance)

**Cost**: Each movement costs the player's turn (no attack that round).

**Strategic implications**:
- Melee classes want lane 0 for full damage
- Ranged classes benefit from lane 1–2 (reduced incoming melee damage)
- Some enemies will also use lane movement (retreating ranged mobs)
- Skill modifiers: some skills ignore lane distance, some have range requirements

**Files to change**:
- `packages/game-core/src/systems/combat/CombatSystem.js` — add `advance` and `retreat` combat actions
- Combat action handler (game reducer) — expose lane movement as valid actions
- UI — add Advance/Retreat buttons during combat

---

### 3.4 Gacha Pity System

**Owner**: Felix (Economy)
**Priority**: MUST-HAVE
**Archetypes served**: Collector, Gambler, Casual

#### Design

Pity counter: After N pulls without a given rarity, guarantee that rarity.

| Rarity | Pity Threshold | Behavior |
|--------|---------------|----------|
| Rare | 10 pulls | Guaranteed rare+ on pull 10 |
| Epic | 30 pulls | Guaranteed epic+ on pull 30 |
| Legendary | 90 pulls | Guaranteed legendary on pull 90 |

**Soft pity**: Starting at 50% of threshold, each pull increases rate by +2% per pull over soft pity.

**Per-pool tracking**: Each pool has its own pity counter. Stored in player state:
```javascript
player.gachaPity = {
  equipment: { pullsSinceRare: 0, pullsSinceEpic: 0, pullsSinceLegendary: 0 },
  skills: { pullsSinceRare: 0, pullsSinceEpic: 0, pullsSinceLegendary: 0 },
  premium: { pullsSinceRare: 0, pullsSinceEpic: 0, pullsSinceLegendary: 0 },
};
```

**Files to change**:
- `packages/game-core/src/data/gachaData.js` — modify pull function to check pity
- `packages/game-core/src/data/initialState.js` — add `gachaPity` to player state

---

### 3.5 Bestiary / Compendium

**Owner**: Yara + Nadia
**Priority**: MEDIUM — nice-to-have
**Archetypes served**: Completionist, Explorer

#### Design

Track enemies killed, items found, locations visited, essences discovered.

**Player state addition**:
```javascript
player.compendium = {
  enemies: {
    goblin: { killed: 5, firstKillTimestamp: ..., discovered: true },
    // ...
  },
  items: { wooden_sword: { found: true, count: 2 } },
  locations: { starting_zone: { visited: true, firstVisitTimestamp: ... } },
  essences: { fire: { discovered: true, totalDrawn: 150 } },
};
```

**Files to create**:
- `packages/game-core/src/systems/compendium/CompendiumSystem.js`

**Files to change**:
- `packages/game-core/src/data/initialState.js` — add empty compendium
- Combat aftermath — record kills
- Travel system — record visits
- Essence weaving — record discoveries

---

## Phase 4: Polish & Accessibility (Week 11–14)

### 4.1 Quick-Action System

**Owner**: Nadia (UX)
**Priority**: MUST-HAVE
**Archetypes served**: Casual, Mobile, All

#### Problem

Currently text-only input. No buttons for common actions.

#### Design

Context-aware quick-action bar showing 3–5 buttons based on game state:

**In exploration**:
- [Look Around] [Travel] [Rest] [Inventory] [Status]

**In combat**:
- [Attack] [Skill] [Item] [Advance] [Retreat] [Flee]

**In town/social**:
- [Shop] [Gacha] [Quest Board] [Talk] [Rest]

**Implementation**: Quick actions are derived from current game state, not hardcoded. The system inspects `state.mode` (exploration/combat/social) and surfaces valid actions.

**Files to create**:
- `src/ui/QuickActionBar.js` — React component
- `packages/game-core/src/core/QuickActionResolver.js` — derives valid actions from state

---

### 4.2 Progressive System Reveal (Onboarding)

**Owner**: Nadia (UX)
**Priority**: MUST-HAVE
**Archetypes served**: Casual, New players

#### Problem

10 attributes, magic system, gacha, titles, factions all visible from start. Overwhelming.

#### Design: Staged Unlock

| Level | Systems Unlocked | UI Addition |
|-------|-----------------|------------|
| 1 | STR/AGI/VIT only visible. Basic combat. | Minimal HUD |
| 3 | Full attributes visible. Skills appear. | Attribute panel |
| 5 | Equipment system unlocked. | Inventory panel |
| 8 | Title system unlocked. First title hint. | Title indicator |
| 10 | Class evolution available. Gacha unlocked. | Class + gacha buttons |
| 15 | Magic system (essence weaving layer A). | Magic tab |
| 20 | Faction reputation visible. | Faction panel |
| 25 | Full magic (all layers). Lane positioning. | Advanced combat UI |
| 30+ | All systems available. | Full HUD |

**Implementation**: A `systemVisibility` config driven by player level. UI components check `isSystemUnlocked(state, "magic")` before rendering.

**Files to create**:
- `packages/game-core/src/core/SystemVisibility.js`

---

### 4.3 Auto-Stat Allocation

**Owner**: Nadia + Kai
**Priority**: NICE-TO-HAVE
**Archetypes served**: Casual, Story-first

#### Design

For players who don't want to manually distribute 3 attribute points per level:

- **Smart Auto**: Allocates based on class archetype (warriors get STR/VIT, mages get INT/WIS, etc.)
- **Balanced Auto**: Distributes evenly across all stats
- **Custom Priority**: Player ranks 3 stats, auto-allocates to those

Toggle in settings. Can be changed at any time. No penalty.

---

### 4.4 Narrative Memory Improvement

**Owner**: Director Chen + Kai
**Priority**: HIGH
**Archetypes served**: Story-first, Roleplayer

#### Current State

`DEFAULT_MAX_ENTRIES = 120` — narrative entries are capped at 120. Older entries are dropped.

#### Proposed: Hierarchical Summarization

Instead of dropping entries, compress old ones:
1. **Active window** (last 40 entries): Full detail, sent to AI prompt
2. **Recent summary** (entries 41–120): Auto-summarized into 3–5 paragraph recap
3. **Session archive** (entries 121+): Compressed into key-fact bullets (names, deaths, choices, locations)

The AI prompt receives: active window + recent summary + archived key facts. This provides continuity without token explosion.

**Files to change**:
- `packages/game-core/src/core/narrativeLog.js` — add summarization tiers
- `src/core/PromptAssembler.js` — include summary + archive in prompt context

---

### 4.5 Mobile UX

**Owner**: Nadia
**Priority**: NICE-TO-HAVE

- Touch-friendly quick-action buttons (min 44px tap targets)
- Swipe gestures for combat actions
- Collapsible stat panels
- Portrait-mode optimized layout
- Reduced text density on small screens

---

## Internal Debates & Decisions

### Debate 1: XP Curve — Logarithmic vs Piecewise
**Kai** argued for a single logarithmic curve (`base * ln(level)^2`). **Director Chen** overruled in favor of piecewise brackets because: (a) the existing `xpCurve.js` already supports bracket arrays, requiring zero code change; (b) designers can tune individual tiers independently; (c) saves migration is simpler.

**Decision**: Piecewise brackets. ✅

### Debate 2: Rest Heal — Percentage vs Flat
**Felix** wanted flat values (e.g., heal 50 HP) to create a potion economy. **Nadia** and **Kai** argued percentage-based scales naturally and prevents "rest is useless at level 50" syndrome. **Felix** conceded but requested potions remain stronger than rest.

**Decision**: 25% HP / 40% Mana percentage-based. Potions heal 50–100% and are instant (usable in combat). ✅

### Debate 3: Pity System — Hard vs Soft
**Felix** wanted soft-pity only (increasing rates). **Yara** and **Nadia** insisted on hard pity for player trust. Compromise: soft pity starts at 50% threshold, hard pity at 100%.

**Decision**: Both soft and hard pity. ✅

### Debate 4: Lane Controls — Free Action vs Turn Cost
**Kai** wanted movement to be free. **Director Chen** said free movement removes all tactical cost and makes ranged builds dominant. Compromise: movement costs the turn but gains a positioning buff for the next round.

**Decision**: Movement costs the turn. ✅

### Debate 5: Content Generation — Hand-authored vs AI-assisted Bulk
**Yara** voiced concern about 62 enemies being too much hand-authored content. **Director Chen** approved AI-assisted generation from the existing `generation/` pipeline, with Yara reviewing stat balance and flavor text.

**Decision**: AI-assisted generation with human review for balance and lore coherence. ✅

---

## Priority Summary

| Item | Priority | Phase | Owner |
|------|----------|-------|-------|
| XP curve rework (8 brackets) | **CRITICAL** | 1 | Kai |
| Rest heal values (25%/40%) | **CRITICAL** | 1 | Kai |
| Race attribute modifiers | **HIGH** | 1 | Kai + Yara |
| Enemy roster (8→62) | **CRITICAL** | 2 | Yara + Kai |
| Locations (24→51) | **HIGH** | 2 | Yara |
| Titles (8→52) | **HIGH** | 2 | Yara + Felix |
| Gacha expansion (20→85+) | **HIGH** | 2 | Felix |
| Dungeon system (10 dungeons) | **HIGH** | 3 | Chen + Yara + Kai |
| Faction reputation | **HIGH** | 3 | Yara + Felix |
| Lane controls (advance/retreat) | **MEDIUM** | 3 | Kai + Nadia |
| Gacha pity system | **HIGH** | 3 | Felix |
| Bestiary/compendium | **MEDIUM** | 3 | Yara + Nadia |
| Tower system (endless climb) | **MEDIUM** | 3 | Kai |
| World bosses (3) | **MEDIUM** | 3 | Chen + Yara |
| Quick-action bar | **HIGH** | 4 | Nadia |
| Progressive system reveal | **HIGH** | 4 | Nadia |
| Narrative memory improvement | **HIGH** | 4 | Chen + Kai |
| Auto-stat allocation | **MEDIUM** | 4 | Nadia + Kai |
| Mobile UX | **LOW** | 4 | Nadia |

---

## Files Impact Summary

### Phase 1 (3–5 files):
- `packages/game-core/src/data/initialState.js`
- `system_specs.md`
- New: `packages/game-core/src/data/raceStartingStats.json` (or inline in config)
- Character creation handler (apply race modifiers)

### Phase 2 (4–6 files):
- `packages/game-core/src/data/registries/EnemyDataRegistry.js`
- `packages/game-core/src/world/WorldDataRegistry.js`
- `packages/game-core/src/data/titleData.js`
- `packages/game-core/src/data/gachaData.js`

### Phase 3 (8–12 new files):
- New: `packages/game-core/src/systems/dungeon/DungeonSystem.js`
- New: `packages/game-core/src/data/dungeons/*.json`
- New: `packages/game-core/src/systems/faction/FactionReputationSystem.js`
- New: `packages/game-core/src/data/factionRewards.json`
- New: `packages/game-core/src/systems/compendium/CompendiumSystem.js`
- Modified: `packages/game-core/src/systems/combat/CombatSystem.js`
- Modified: `packages/game-core/src/data/initialState.js`

### Phase 4 (4–6 new files):
- New: `src/ui/QuickActionBar.js`
- New: `packages/game-core/src/core/QuickActionResolver.js`
- New: `packages/game-core/src/core/SystemVisibility.js`
- Modified: `packages/game-core/src/core/narrativeLog.js`
- Modified: `src/core/PromptAssembler.js`
