# System Specifications - Laws of the Universe

This document defines the mathematical and mechanical rules of the LitRPG game.
All game logic MUST reference these specifications. Any changes to game balance must be documented here first.

---

## Table of Contents

1. [Attributes](#attributes)
2. [Combat Formulas](#combat-formulas)
3. [Progression System](#progression-system)
4. [Resources](#resources)
5. [Skills System](#skills-system)
6. [Equipment](#equipment)
7. [Gacha & Drops](#gacha--drops)
8. [Economy](#economy)

---

## Attributes

### Primary Attributes

| Attribute | Abbr | Effect |
|-----------|------|--------|
| Strength | STR | Physical damage: `baseDamage + (STR × strToDamageMultiplier)` |
| Agility | AGI | Escape chance bonus: `baseEscapeChance + (AGI × agilityEscapeBonus)` |
| Dexterity | DEX | Accuracy and precision (future: hit chance) |
| Intelligence | INT | Magic damage and mana pool (future) |
| Charisma | CHA | NPC interactions, shop prices (future) |
| Willpower | WILL | Status effect resistance (future) |
| Luck | LUCK | Critical hit chance: `LUCK × baseLuckCritChance` |
| Soul | SOUL | Cultivation/spiritual abilities (future) |

### Attribute Configuration

```
baseAttributeValue: 5           // Starting value for all attributes
strToDamageMultiplier: 2        // STR × 2 = bonus physical damage
baseLuckCritChance: 0.01        // 1% crit chance per LUCK point (5 LUCK = 5% crit)
agilityEscapeBonus: 0.01        // 1% escape chance per AGI point
```

### Attribute Allocation

- Players gain `attributePointsPerLevel` (3) free points per level up
- Free points stored in `player.attributes.freePoints`
- No maximum cap on individual attributes (unlimited growth potential - LitRPG style)

---

## Combat Formulas

### Damage Calculation

```javascript
// Base damage formula
baseDamage = attacker.attack || baseAttackDamage

// If using a skill with damage modifier
if (skill && skill.damage) {
  baseDamage = skill.damage.base || baseDamage
  if (skill.damage.multiplier) {
    baseDamage = floor(baseDamage × skill.damage.multiplier)
  }
}

// Defense reduction
finalDamage = max(1, baseDamage - floor(defender.defense × defenseReductionFactor))

// Critical hit check
critChance = attacker.attributes.luck × baseLuckCritChance
if (random() < critChance) {
  finalDamage = floor(finalDamage × criticalHitMultiplier)
}
```

### Combat Configuration

```
baseAttackDamage: 5             // Default attack if no weapon
criticalHitMultiplier: 1.5      // 50% bonus damage on crit
defenseReductionFactor: 0.5     // Defense reduces damage by 50% of its value
armorModel: 'flat'              // 'flat' or 'dr' (diminishing returns)
armorDrK: 100                   // K constant for DR curve armor/(armor+K)
armorDrMax: 0.8                 // Max mitigation cap for DR model
baseEscapeChance: 0.3           // 30% base chance to escape
```

### Armor Mitigation Models

- **Flat**: `finalDamage = max(1, baseDamage - floor(DEF × defenseReductionFactor))`
- **Diminishing returns**: `mitigation = min(armorDrMax, DEF / (DEF + armorDrK))`; `finalDamage = max(1, floor(baseDamage × (1 - mitigation)))`

Example (DR model, K=100, max=0.8, baseDamage=100):
- DEF 10 → mitigation ~9% → dmg ~91
- DEF 50 → mitigation ~33% → dmg ~67
- DEF 100 → mitigation 50% → dmg 50
- DEF 400 → mitigation capped at 80% → dmg 20

### Player Attack Power

```javascript
playerAttack = (STR × strToDamageMultiplier) + (weapon.stats.attack || 0)
// Example: 5 STR, Iron Sword (+10 attack)
// playerAttack = (5 × 2) + 10 = 20
```

### Player Defense

```javascript
playerDefense = STR + (armor.stats.defense || 0)
// Example: 5 STR, Leather Armor (+5 defense)
// playerDefense = 5 + 5 = 10
```

### Escape Mechanics

```javascript
escapeChance = baseEscapeChance + (AGI × agilityEscapeBonus)
// Example: 5 AGI
// escapeChance = 0.3 + (5 × 0.01) = 0.35 = 35%
```

---

## Progression System

### XP & Leveling

```
xpScalingFactor: 1.5            // XP required increases by 50% each level
maxLevel: 100                   // Maximum achievable level
```

### XP Requirements Table

| Level | XP Required | Cumulative XP |
|-------|-------------|---------------|
| 1 → 2 | 100 | 100 |
| 2 → 3 | 150 | 250 |
| 3 → 4 | 225 | 475 |
| 4 → 5 | 338 | 813 |
| 5 → 6 | 506 | 1,319 |
| 10 → 11 | ~2,563 | ~8,550 |
| 20 → 21 | ~65,193 | ~217,310 |
| 50 → 51 | ~63.7M | ~212.3M |

### XP Formula

```javascript
xpForNextLevel = floor(currentMaxXP × xpScalingFactor)
// Level 1: 100 XP needed
// Level 2: floor(100 × 1.5) = 150 XP needed
// Level 3: floor(150 × 1.5) = 225 XP needed
```

### Level Up Effects

On level up:
1. Level increases by 1
2. Overflow XP carries to next level
3. HP restored to max
4. Mana restored to max
5. `attributePointsPerLevel` (3) free points added
6. `justLeveledUp` flag set for UI notification

---

## Resources

### Health Points (HP)

```
startHp: 100                    // Starting max HP
```

- HP cannot go below 0
- When HP reaches 0, `player.isDead = true`
- HP restored to max on level up
- HP can be increased by equipment (future)

### Mana Points (MP)

```
startMana: 50                   // Starting max mana
```

- Mana consumed by skill usage
- Skills with `manaCost: 0` are free to use
- Mana restored to max on level up
- Basic Attack costs 0 mana

### Inventory

```
maxInventorySize: 20            // Maximum inventory slots
```

- Stackable items (consumables) share a slot
- Equipment takes individual slots
- Inventory is a flat array (no categories)

---

## Skills System

### Skill Types

1. **Active Skills** - Require activation, consume mana, have cooldowns
2. **Passive Skills** - Always active, provide permanent bonuses

### Skill Cost Ranges

```
skillManaCostMin: 5             // Minimum mana cost for skills
skillManaCostMax: 50            // Maximum mana cost for skills
skillCooldownMin: 2             // Minimum cooldown (seconds/turns)
skillCooldownMax: 120           // Maximum cooldown (ultimate abilities)
```

### Skill Structure

```javascript
// Active Skill
{
  id: 'class_skill_name',
  name: 'Skill Name',
  type: 'active',
  class: 'className',          // Or 'universal' for learnable skills
  description: 'What the skill does.',
  level: 1,
  manaCost: 15,                // 5-50 range
  cooldown: 5                  // 2-120 range
}

// Passive Skill
{
  id: 'class_passive_name',
  name: 'Passive Name',
  type: 'passive',
  class: 'className',
  description: 'Permanent effect description.',
  level: 1
}
```

### Skill Selection at Character Creation

- Players choose from 4 randomly selected active skills (from pool of 20)
- Players choose from 12 randomly selected passive skills (from pool of 40)
- Each class has unique skill pools

### Universal Skills

- Can be learned by any class when conditions are met
- Conditions: level requirements, location, quest completion, items, prerequisites

---

## Equipment

### Equipment Slots

```javascript
equipment: {
  weapon: null,      // Primary weapon
  armor: null,       // Body armor
  accessory1: null,  // Ring, amulet, etc.
  accessory2: null   // Secondary accessory
}
```

### Equipment Rules

1. Equipment must be moved from inventory to equipment slot (not copied)
2. Only one item per slot
3. Equipment stats add directly to player stats
4. Equipped items stored as full objects (not just IDs)

### Equipment Stats

```javascript
// Weapon example
{
  id: 'iron_sword',
  name: 'Iron Sword',
  type: 'equipment',
  equipSlot: 'weapon',
  stats: { attack: 10 }
}

// Armor example
{
  id: 'leather_armor',
  name: 'Leather Armor',
  type: 'equipment',
  equipSlot: 'armor',
  stats: { defense: 5 }
}
```

---

## Gacha & Drops

### Drop Rates

```
commonDropRate: 0.70            // 70% chance for common items
rareDropRate: 0.25              // 25% chance for rare items
epicDropRate: 0.05              // 5% chance for epic items
```

### Enemy Drop Calculation

Enemy drops are calculated based on:
1. Enemy level
2. Enemy type (boss, elite, normal)
3. Base drop rates (configurable)

### Gacha System

- Uses same drop rates as enemy drops
- Consumes currency (soulpoints)
- Can drop equipment, consumables, or skills

---

## Economy

### Currency Types

1. **Gold Coins** - Standard currency for shops
2. **Soul Points** - Premium currency for gacha

### Shop Pricing (Future)

```javascript
// Base price modified by CHA
finalPrice = basePrice × (1 - (CHA × 0.01))
// 10 CHA = 10% discount
```

---

## Classes

### Available Classes (20 total)

**Melee Physical:**
- Knight, Warrior, Berserker, Paladin, Templar

**Stealth/Agility:**
- Assassin, Rogue, Shadowblade

**Ranged Physical:**
- Ranger, Archer

**Divine/Support:**
- Priest, Bard

**Nature/Spiritual:**
- Druid, Shaman

**Dark Magic:**
- Necromancer, Warlock

**Hybrid:**
- Battlemage, Monk

**Summoning:**
- Summoner

**Pure Magic:**
- Mage

### Class Upgrade Paths

Each class has an advanced form (e.g., Knight → Paladin → Divine Knight)

---

## Races

### Available Races (20 total)

Each race provides stat bonuses at character creation:

| Race | Primary Bonuses |
|------|-----------------|
| Pure Human | +1 CHA, +1 WILL |
| Neo-Human | +1 STR, +1 AGI, +1 DEX, -1 SOUL |
| Ancient Bloodline | +2 INT, +1 CHA, +1 WILL, +1 LUCK, +2 SOUL |
| Dragon Blood | +2 STR, +1 AGI, +2 INT, +1 CHA, +2 WILL, +1 SOUL |
| ... | (See characterData.js for full list) |

---

## Status Effects (Future)

| Effect | Description |
|--------|-------------|
| Poison | Damage over time |
| Bleed | Damage over time, stacks |
| Stun | Skip turn |
| Silence | Cannot use skills |
| Slow | Reduced speed/turn order |
| Burn | Fire damage over time |
| Freeze | Skip turn, bonus damage from physical |

---

## Version History

- **0.1.1** - Current version
- Initial system specs document created

---

## Quick Reference Card

```
DAMAGE = max(1, (ATK - DEF×0.5)) × (1.5 if crit)
CRIT_CHANCE = LUCK × 0.01
ESCAPE_CHANCE = 0.3 + (AGI × 0.01)
XP_NEXT = current_max × 1.5
POINTS_PER_LEVEL = 3
```
