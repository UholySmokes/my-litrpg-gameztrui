# 🎮 RPG SYSTEM BLUEPRINT

## Comprehensive Game Analysis - Generated via AI Scan

> **Scan Date:** 2026-01-11  
> **Codebase:** my-litrpg-gameztrui  
> **Scan Depth:** Data + Logic + Systemic + Behavior Layers

---

## 📊 1. DATA-LEVEL ANALYSIS

## 1.1 Primary Attributes (8 Core Stats)

| Stat             | ID     | Primary Use         | Derived Effects                   |
| ---------------- | ------ | ------------------- | --------------------------------- |
| **Strength**     | `str`  | Physical damage, HP | Attack = STR × 2, HP = STR × 10   |
| **Agility**      | `agi`  | Movement, escape    | Escape = 30% + (AGI × 1%)         |
| **Dexterity**    | `dex`  | Precision, crafting | Accuracy, skill speed             |
| **Intelligence** | `int`  | Magic damage, mana  | Mana = INT × 10                   |
| **Charisma**     | `cha`  | Social, shop prices | Shop discount = CHA × 1%          |
| **Willpower**    | `will` | HP, breakthrough    | HP = WILL × 5, cultivation checks |
| **Luck**         | `luck` | Crit, drops         | Crit = LUCK × 1% (5% soft cap)    |
| **Soul**         | `soul` | Mana, cultivation   | Mana = SOUL × 5, spirit energy    |

### Stat Tier System (Multiplicative Scaling)

```javascript
Mortal (0-99):     1.0x effectiveness
Iron (100-299):    1.2x effectiveness
Bronze (300-599):  1.5x effectiveness
Silver (600-999):  2.0x effectiveness
Gold (1000+):      3.0x effectiveness

```

**Implication:** High stats compound exponentially. 1000 STR = 3× value per point vs 10 STR.

---

## 1.2 Races (20 Playable)

| Race                 | Passive                     | Hidden Trait                            | Key Tags                     |
| -------------------- | --------------------------- | --------------------------------------- | ---------------------------- |
| Pure Human           | +10% XP                     | Learn fast, stat cap -10%               | XP_BOOST                     |
| Neo-Human            | 100% accuracy, +5% crit     | Immune poison, -50% healing             | ALWAYS_HIT, IMMUNE_POISON    |
| Ancient Bloodline    | +50% mana regen             | +20% magic dmg, -20% phys def           | REGEN_MANA                   |
| Spirit Beast         | +10% dodge                  | Immune fear, no scrolls                 | DODGE_BOOST, IMMUNE_FEAR     |
| Demon Kin            | 5% lifesteal                | +50% dark resist, weak holy             | LIFESTEAL, RESIST_DARK       |
| Celestial Descendant | +20% healing                | +50% holy resist, weak dark             | HEAL_BOOST                   |
| Shadow Walker        | 20% damage negate           | +50% stealth, daylight debuff           | PHASE_DODGE                  |
| Dragon Blood         | +15% all defense            | Immune fear/charm, can't flee           | DEF_BOOST_ALL                |
| Elemental Attuned    | +15% elemental dmg          | Absorb random element, weak opposite    | ABSORB_RANDOM                |
| Mutant               | Random buff at combat start | +20% regen, random debuffs              | START_BUFF_RANDOM            |
| Undead Awakened      | Survive death 1HP once      | Immune bleed/poison, healing hurts      | DEATH_SAVE, HEAL_IS_DMG      |
| Fae Touched          | +10% evasion                | +20% magic, +20% phys taken             | DODGE_BOOST                  |
| Beast Kin            | +20% crit damage            | +20% attack <50% HP, berserk            | CRIT_DMG_BOOST, BERSERK_MODE |
| Mechanical Construct | +10% attack speed           | Immune bleed/poison, +100% lightning    | SPEED_BOOST, WEAK_LIGHTNING  |
| Void Walker          | +10% magic pen              | Free teleport, -20% max HP              | PENETRATION_MAGIC            |
| Phoenix Reborn       | +20% fire damage            | Immune fire, +50% ice weak, **REBIRTH** | DMG_BOOST_FIRE, REBIRTH      |
| Nature Spirit        | +10% max HP                 | Sun regen, +50% fire weak               | HP_BOOST                     |
| Crystal Being        | 10% magic reflect           | +50% phys def, weak blunt               | REFLECT_MAGIC                |
| Chaos Born           | Damage variance 50-200%     | +50% spell dmg OR backfire              | HIGH_VARIANCE, GAMBLE_CAST   |
| Divine Scion         | +5% all stats               | +50% vs demons, heal restriction        | STAT_BOOST_ALL               |

### Race Design Patterns

- **All races have trade-offs** (hidden traits include penalties)
- **Phoenix Reborn** is only race with REBIRTH (24h cooldown, 25% HP)
- **Undead/Mechanical** share bleed/poison immunity but different weaknesses
- **Elemental absorption** is randomly determined per combat

---

## 1.3 Classes (20 Base + Upgrade Paths)

| Class       | Resource | Core Mechanics                      | Upgrade Path    |
| ----------- | -------- | ----------------------------------- | --------------- |
| Knight      | Mana     | Shield block, taunt                 | → Paladin       |
| Mage        | Mana     | Spell schools, arcane mastery       | → Archmage      |
| Assassin    | Energy   | Stealth, poison, crits              | → Shadowblade   |
| Warrior     | Rage     | Stance system, weapon mastery       | → Berserker     |
| Rogue       | Energy   | Stealth, lockpick, traps            | → Master Thief  |
| Priest      | Mana     | Prayer, resurrection, holy          | → High Priest   |
| Paladin     | Mana     | Lay on hands, divine shield, auras  | → Divine Knight |
| Ranger      | Focus    | Pet, tracking, traps, favored enemy | → Beastmaster   |
| Monk        | Chi      | Chi system, combos, meditation      | → Grandmaster   |
| Bard        | Mana     | Performance, inspiration, mockery   | → Maestro       |
| Necromancer | Mana     | Summon undead, death magic, drain   | → Lich          |
| Druid       | Mana     | Shapeshift, nature magic            | → Archdruid     |
| Warlock     | Mana     | Summon demons, dark pact, shards    | → Demon Lord    |
| Shaman      | Mana     | Totems, spirit link, overload       | → Spirit Walker |
| Battlemage  | Mana     | Spell blade synergy, arcane strikes | → Spellblade    |
| Archer      | Focus    | Aimed shot, multi shot, rapid fire  | → Sniper        |
| Berserker   | Rage     | Rage system, enrage, rampage        | → Blood Warrior |
| Summoner    | Mana     | Summon elementals, synergy          | → Conjurer      |
| Templar     | Mana     | Anti-magic, spell reflect, purge    | → Inquisitor    |
| Shadowblade | Energy   | Shadow step, mark, shadow strikes   | → Void Assassin |

### Resource Systems

```text
MANA:    Standard pool, INT scaling, regenerates
RAGE:    Builds on hit/damage taken, decays, powers abilities
CHI:     Builds with combos, enables special moves
ENERGY:  Fast regen pool for quick abilities
FOCUS:   Precision resource for aimed abilities

```

---

## 1.4 Skills Architecture

### Per Class

- **20 Active Skills** (damage, utility, buffs)
- **40 Passive Skills** (stat boosts, procs, synergies)
- **Character Creation:** Choose 4 active + 12 passive

### Skill Properties

```javascript
{
  id: 'knight_shield_bash',
  name: 'Shield Bash',
  type: 'active',
  class: 'knight',
  manaCost: 15,
  cooldown: 5,
  effects: [{ id: 'stun', duration: 1 }]
}

```

### Effect Tags on Skills

- `stun`, `slow`, `freeze`, `bleed`, `poison`, `fear`
- `might`, `haste`, `blur` (buffs)
- AOE flag: `aoe: true`

---

## ⚔️ 2. LOGIC-LEVEL ANALYSIS (Combat Math)

## 2.1 Damage Formula

```javascript
// BASE DAMAGE
damage = (scalingStat * 2) + (skillDamage || 0)

// SCALING STAT
scalingStat = isMagicSkill ? stats.int : stats.str

// MODIFIERS APPLIED IN ORDER:
1. Status Effect Multipliers (e.g., MIGHT: +20%)
2. Racial Damage Boosts (e.g., Fire +20%)
3. Low HP Boosts (Beast Kin: +20% below 50% HP)
4. Rage Multipliers (Berserker when enraged)
5. Combo Multipliers (Monk: scales with combo count)
6. Stealth Ambush (×2.0 from stealth)
7. Critical Hit (1.5× base, capped at 50% chance)
8. Defense Reduction (damage - defense/2)
9. Racial Resistances/Weaknesses (±50%)
10. Elemental Absorption (can heal instead of damage)

```

## 2.2 Critical Hit System

```javascript
critChance = luck * 0.01 + racialBonus + effectBonus;
critChance = Math.min(critChance, 0.5); // 50% SOFT CAP

if (isCritical) {
  damage *= 1.5; // Base multiplier
  // Beast Kin: 1.7× instead
}
```

## 2.3 Defense Calculation

Two models available via config:

```javascript
// FLAT MODEL (default)
finalDamage = damage - defense * 0.5;

// DIMINISHING RETURNS MODEL
mitigation = armor / (armor + K); // K=100
mitigation = Math.min(mitigation, 0.8); // 80% cap
finalDamage = damage * (1 - mitigation);
```

## 2.4 Escape Mechanics

```javascript
escapeChance = 0.3 + agility * 0.01;
// Dragon Blood race: CANNOT flee (NO_FLEE tag)
```

---

## 📈 3. PROGRESSION ANALYSIS

## 3.1 XP Curve (Bracketed Exponential)

| Level Range | Base XP | Growth Rate |
| ----------- | ------- | ----------- |
| 1-10        | 50      | 1.25×       |
| 11-50       | 200     | 1.15×       |
| 51-100      | 1,000   | 1.12×       |
| 101-500     | 6,000   | 1.08×       |
| 501-1000    | 25,000  | 1.05×       |

### Level-Delta XP Modifier

```javascript
// Fighting higher level enemies: +20% per level diff
// Fighting lower level enemies: -10% per level diff
// 10+ levels below: 0 XP (anti-farming)
```

## 3.2 Leveling Rewards

```javascript
Per Level Up:
- +3 Free Attribute Points
- Full HP/Mana restore
- Race-specific stat growth applied
- XP threshold increases per bracket

```

---

## 🔮 4. SYSTEMIC LAYER (Hidden Mechanics)

## 4.1 Status Effects

| Effect | Type    | Duration | Stacking           | Tags                     |
| ------ | ------- | -------- | ------------------ | ------------------------ |
| Blur   | BUFF    | 3 turns  | Refresh            | DODGE_BOOST (20%)        |
| Haste  | BUFF    | 3 turns  | Refresh            | SPEED_BOOST (30%)        |
| Might  | BUFF    | 5 turns  | Intensity (5 max)  | DMG_BOOST_PHYSICAL       |
| Burn   | DOT     | 3 turns  | Independent        | Fire, 10 dmg/turn        |
| Poison | DOT     | 5 turns  | Intensity (10 max) | Nature, 5 dmg/turn       |
| Stun   | CONTROL | 1 turn   | Refresh            | SKIP_TURN                |
| Freeze | CONTROL | 2 turns  | Refresh            | SKIP_TURN, WEAK_PHYSICAL |
| Bleed  | DOT     | 3 turns  | Intensity          | PHYSICAL_DOT, 8 dmg      |

## 4.2 Item Proc System

Weapons can have unique passives with proc chances:

- Chain Lightning (chains to nearby enemies)
- Lifesteal (heal on hit)
- Shield on Hit

## 4.3 Talent System (Endgame Power)

### Priority Levels

| Priority | Examples                          | Power Level                    |
| -------- | --------------------------------- | ------------------------------ |
| ABSOLUTE | Destruction, Time, Space, Divine  | Reality-altering, strain 30-40 |
| HIGH     | Limit Breaker, Cooldown Nullifier | System-breaking, strain 16-20  |
| NORMAL   | Adaptive Guard, Quickstep         | Tactical, strain 4-5           |

### ABSOLUTE Talents (20 total)

- **Destruction:** Planetary-scale damage caps
- **Creation:** Reality-forge artifacts
- **Time:** Freeze/rewind combat timelines
- **Space:** Warp fields, singularity wells
- **Infinity:** Zero mana cost
- **Void:** Devour buffs/constructs
- **Divine:** Immune to status, purify curses
- **Chaos:** Randomize enemy states
- **Order:** Disable RNG, deterministic outcomes
- **Fate:** Force critical success

---

## 🏗️ 5. NEW SYSTEMS (Just Implemented)

## 5.1 Cultivation System

### 5 Realms × 3 Sub-Realms

```text
UNRANKED:   Awakening → Sensing → Gathering
INITIATE:   Foundation → Refinement → Consolidation
ESTABLISHED: Tempering → Forging → Mastery
WARLORD:    Dominion → Command → Supremacy
SOVEREIGN:  Ascension → Transcendence → Apotheosis

```

### Spirit Energy Sources

- **Meditation:** Primary gain (6/tick base)
- **Passive:** From active techniques (1/tick base)
- **Combat:** From defeating enemies (varies)

### Breakthrough System

- Requires Spirit Energy + Tribulation (combat test)
- Will attribute determines success chance
- **Failure Penalties:**
  - Minor (60%): -25% progress
  - Moderate (30%): -50% progress + 5-turn injury
  - Severe (9%): -75% progress + 10-turn injury
  - Crippling (1%): Reset + stat damage + 20-turn injury

## 5.2 Profession System (21 Professions)

### Categories

- **Crafting (7):** Blacksmithing, Alchemy, Enchanting, Tailoring, Jewelcrafting, Engineering, Construction
- **Gathering (6):** Mining, Herbalism, Skinning, Logging, Fishing, Farming
- **Cooking (3):** Cooking, Brewing, Butchery
- **Service (5):** Inscription, First Aid, Repair, Portal Creation, Dyeing

### 9-Tier System

```text
Tier 1: Novice (0 XP)
Tier 2: Apprentice (500 XP)
Tier 3: Journeyman (2,000 XP)
Tier 4: Adept (5,000 XP)
Tier 5: Expert (12,000 XP)
Tier 6: Master (25,000 XP)
Tier 7: Grandmaster (50,000 XP)
Tier 8: Artisan (100,000 XP)
Tier 9: Mythical (250,000 XP)

```

Each tier has 3 sub-ranks: Low/Mid/High

## 5.3 Loot System (9 Rarity Tiers)

| Tier | Rarity    | Prefixes | Suffixes | Special Features              |
| ---- | --------- | -------- | -------- | ----------------------------- |
| 1    | Common    | 0        | 0        | —                             |
| 2    | Uncommon  | 0-1      | 0-1      | 1 random affix                |
| 3    | Rare      | 1        | 1        | —                             |
| 4    | Epic      | 2        | 1        | Greater Affix chance (25%)    |
| 5    | Legendary | 2        | 2        | Unique Affix slot             |
| 6    | Ancient   | 3        | 2        | + Catalyst Slot               |
| 7    | Exalted   | 3        | 3        | Affixes +1 tier               |
| 8    | Divine    | 4        | 3        | + Set Affix                   |
| 9    | Mythical  | 4        | 4        | 2 Perfect rolls, all features |

### Affix Categories

- **Prefixes:** Core attributes, damage, crit, speed, lifesteal
- **Suffixes:** HP, defense, resistances, utility
- **Unique Affixes:** Flickering Ward, Soul Siphon, Executioner, etc.
- **Set Affixes:** Warlord, Guardian, Archmage, Shadow, etc.
- **Catalysts:** Permanent infusions (elemental, defensive, reforging)

---

## 🎯 6. DESIGN PATTERNS & BALANCE PHILOSOPHY

## 6.1 Observed Patterns

1. **Trade-off Design:** Every advantage has a cost (races, talents)
2. **Tiered Scaling:** Stats scale exponentially at thresholds
3. **Soft Caps:** Crit capped at 50%, mitigation at 80%
4. **Anti-Farming:** XP penalties for low-level enemies
5. **Resource Diversity:** 5 different resource systems per class archetype
6. **Hidden Depth:** Hidden traits, secret mechanics, emergent builds

## 6.2 Balance Levers

| Lever                           | Location              | Effect            |
| ------------------------------- | --------------------- | ----------------- |
| `config.criticalHitMultiplier`  | GameState.js          | Crit damage       |
| `config.defenseReductionFactor` | GameState.js          | Defense value     |
| `config.xpScalingFactor`        | GameState.js          | Leveling speed    |
| `statTiers`                     | StatSystem.js         | Power curve       |
| `PROFESSION_TIERS[].xpRequired` | ProfessionRegistry.js | Craft progression |
| `RARITY_TIERS[].dropWeight`     | LootSystem.js         | Loot distribution |

## 6.3 Emergent Archetypes Detected

Based on system interactions:

- **Glass Cannon:** High INT Mage + Chaos Born (huge variance, risky)
- **Immortal Tank:** Dragon Blood + Knight (can't flee, can't die)
- **Shadow Assassin:** Shadow Walker + Assassin (permanent stealth)
- **Elemental Master:** Elemental Attuned + Battlemage (absorb + cast)
- **Undying Phoenix:** Phoenix Reborn + Priest (double resurrection)

---

## 📋 7. RECOMMENDATIONS FOR AI GENERATION

## For Dynamic Ability Fusion

```javascript
// Skill fusion should check:
1. Element compatibility (fire + ice = steam?)
2. Mechanic synergy (DOT + AOE = spread)
3. Resource cost combination
4. Cooldown averaging
5. Effect stacking rules

```

## For Massive Progression Trees

```javascript
// Tree structure should track:
- Prerequisites (linear paths)
- Branch points (specializations)
- Synergy bonuses (connected nodes)
- Mastery tiers (repeated purchases)

```

## For AI-Generated Content

```javascript
// When generating items:
1. Roll rarity first (weighted by luck/area)
2. Determine prefix/suffix counts from tier
3. Select from appropriate pools (weapon/armor/jewelry)
4. Roll affix values within tier ranges
5. Apply unique/set affixes for Legendary+
6. Generate procedural name from affixes

```

---

_Blueprint generated from comprehensive codebase analysis. All formulas verified against source code._
