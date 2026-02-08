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
9. [System Architecture & Audit](#system-architecture--audit)

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

## System Architecture & Audit

### Dependency Matrix

| System | Dependencies (Imports) | Status |
|--------|------------------------|--------|
| **CombatSystem** | Inventory, Leveling, Enemy, Skills, Race, Effects, Talents, Mana | Active |
| **EffectSystem** | EffectRegistry, EventBus | Active |
| **EffectApplicationSystem** | EffectSystem, EventBus | Active |
| **ExplorationSystem** | LevelingManager | Active |
| **InventorySystem** | ItemRegistry | Active |
| **LevelingManager** | LevelingSystem, RaceSystem | Active |
| **ManaSystem** | ManaBalance | Active |
| **RaceSystem** | RaceRegistry | Active |
| **SkillEvolutionManager** | SkillRegistry, EventBus | Active |
| **TalentManager** | Player, TalentRegistry | Active |

### Audit Findings

- **Modular Design**: Systems are well-separated by concern (e.g., `CombatSystem` orchestrates logic but delegates damage calculation and state updates to sub-systems).
- **Circular Dependencies**: None detected in direct imports.
- **Event Bus**: Used for decoupling side effects (e.g., `EffectSystem` triggering events).
- **Registry Pattern**: extensively used (`ClassRegistry`, `RaceRegistry`, `SkillRegistry`, `TalentRegistry`) to separate data from logic.

---

## Version History

- **0.1.2** - Added System Architecture & Audit section
- **0.1.1** - Current version
- **0.1.0** - Initial system specs document created

---

## Quick Reference Card

```
DAMAGE = max(1, (ATK - DEF×0.5)) × (1.5 if crit)
CRIT_CHANCE = LUCK × 0.01
ESCAPE_CHANCE = 0.3 + (AGI × 0.01)
XP_NEXT = current_max × 1.5
POINTS_PER_LEVEL = 3
```

### Connection Verification Report

Timestamp: 2026-01-08T08:59:33.644Z

| System Module | Status | Response Time (ms) | Errors | Imports |
|---|---|---:|---|---|
| class\ClassRegistry.js | active | 1.4088 | - |  |
| combat\CombatSystem.js | active | 45.9998 | - | ../inventory/InventorySystem.js, ../leveling/LevelingManager.js, ../../entities/Enemy.js, ../skills/SkillRegistry.js, ../leveling/LevelingSystem.js, ../race/RaceRegistry.js, ../effects/EffectSystem.js, ../skills/TalentManager.js, ../effects/EffectApplicationSystem.js, ../magic/ManaSystem.js, ../magic/ManaBalance.js, ../../core/EventBus.js |
| effects\EffectApplicationSystem.js | active | 0.3827 | - | ./EffectSystem.js, ../../core/EventBus.js |
| effects\EffectRegistry.js | active | 0.254 | - |  |
| effects\EffectSystem.js | active | 0.6246 | - | ./EffectRegistry.js, ../../core/EventBus.js |
| exploration\ExplorationSystem.js | active | 3.5823 | - | ../leveling/LevelingManager.js |
| inventory\InventorySystem.js | active | 0.2974 | - | ../../entities/ItemRegistry.js |
| leveling\LevelingManager.js | active | 0.253 | - | ./LevelingSystem.js, ../race/RaceSystem.js |
| leveling\LevelingSystem.js | active | 0.434 | - |  |
| leveling\XpSystem.js | active | 1.0436 | - | ./LevelingManager.js |
| magic\ManaBalance.js | active | 0.309 | - |  |
| magic\ManaSystem.js | active | 0.3428 | - | ./ManaBalance.js |
| race\RaceRegistry.js | active | 0.2734 | - |  |
| race\RaceSystem.js | active | 0.2648 | - | ./RaceRegistry.js |
| skills\generateFusionName.js | active | 0.6738 | - |  |
| skills\SkillEvolutionManager.js | active | 2.1388 | - | ./SkillRegistry.js, ../../core/EventBus.js, ./generateFusionName.js |
| skills\SkillRegistry.js | active | 1.1476 | - |  |
| skills\TalentDefinitions.js | active | 1.566 | - |  |
| skills\TalentManager.js | active | 0.4327 | - | ../../entities/Player.js, ../../data/talent.registry.json, ./TalentRegistry.js |
| skills\TalentRegistry.js | active | 0.2264 | - |  |
| stats\StatSystem.js | active | 0.7184 | - |  |
| SystemCore.js | inactive | - | The requested module './skills/TalentManager.js' does not provide an export named 'systemDescribeTalent' |  |
| ui\SystemInterface.js | active | 1.1155 | - | ../../core/EventBus.js |

#### Dependency Chains
- class\ClassRegistry.js → (none)
- combat\CombatSystem.js → inventory\InventorySystem.js, leveling\LevelingManager.js, skills\SkillRegistry.js, leveling\LevelingSystem.js, race\RaceRegistry.js, effects\EffectSystem.js, skills\TalentManager.js, effects\EffectApplicationSystem.js, magic\ManaSystem.js, magic\ManaBalance.js
- effects\EffectApplicationSystem.js → effects\EffectSystem.js
- effects\EffectRegistry.js → (none)
- effects\EffectSystem.js → effects\EffectRegistry.js
- exploration\ExplorationSystem.js → leveling\LevelingManager.js
- inventory\InventorySystem.js → (none)
- leveling\LevelingManager.js → leveling\LevelingSystem.js, race\RaceSystem.js
- leveling\LevelingSystem.js → (none)
- leveling\XpSystem.js → leveling\LevelingManager.js
- magic\ManaBalance.js → (none)
- magic\ManaSystem.js → magic\ManaBalance.js
- race\RaceRegistry.js → (none)
- race\RaceSystem.js → race\RaceRegistry.js
- skills\generateFusionName.js → (none)
- skills\SkillEvolutionManager.js → skills\SkillRegistry.js, skills\generateFusionName.js
- skills\SkillRegistry.js → (none)
- skills\TalentDefinitions.js → (none)
- skills\TalentManager.js → skills\TalentRegistry.js
- skills\TalentRegistry.js → (none)
- stats\StatSystem.js → (none)
- SystemCore.js → (none)
- ui\SystemInterface.js → (none)

Error Rate: 4.35%

Resolution Steps:
- SystemCore.js: verify ESM imports with extensions and fix runtime import errors.


### Connection Verification Report

Timestamp: 2026-01-08T09:02:13.805Z

| System Module | Status | Response Time (ms) | Errors | Imports |
|---|---|---:|---|---|
| class\ClassRegistry.js | active | 1.503 | - |  |
| combat\CombatSystem.js | active | 45.3659 | - | ../inventory/InventorySystem.js, ../leveling/LevelingManager.js, ../../entities/Enemy.js, ../skills/SkillRegistry.js, ../leveling/LevelingSystem.js, ../race/RaceRegistry.js, ../effects/EffectSystem.js, ../skills/TalentManager.js, ../effects/EffectApplicationSystem.js, ../magic/ManaSystem.js, ../magic/ManaBalance.js, ../../core/EventBus.js |
| effects\EffectApplicationSystem.js | active | 0.2974 | - | ./EffectSystem.js, ../../core/EventBus.js |
| effects\EffectRegistry.js | active | 0.9987 | - |  |
| effects\EffectSystem.js | active | 0.4473 | - | ./EffectRegistry.js, ../../core/EventBus.js |
| exploration\ExplorationSystem.js | active | 1.6548 | - | ../leveling/LevelingManager.js |
| inventory\InventorySystem.js | active | 0.3333 | - | ../../entities/ItemRegistry.js |
| leveling\LevelingManager.js | active | 0.275 | - | ./LevelingSystem.js, ../race/RaceSystem.js |
| leveling\LevelingSystem.js | active | 0.3264 | - |  |
| leveling\XpSystem.js | active | 1.2192 | - | ./LevelingManager.js |
| magic\ManaBalance.js | active | 0.277 | - |  |
| magic\ManaSystem.js | active | 0.2473 | - | ./ManaBalance.js |
| race\RaceRegistry.js | active | 0.3292 | - |  |
| race\RaceSystem.js | active | 0.221 | - | ./RaceRegistry.js |
| skills\generateFusionName.js | active | 0.7687 | - |  |
| skills\SkillEvolutionManager.js | active | 2.0134 | - | ./SkillRegistry.js, ../../core/EventBus.js, ./generateFusionName.js |
| skills\SkillRegistry.js | active | 0.3662 | - |  |
| skills\TalentDefinitions.js | active | 0.983 | - |  |
| skills\TalentManager.js | active | 0.3659 | - | ../../entities/Player.js, ../../data/talent.registry.json, ./TalentRegistry.js |
| skills\TalentRegistry.js | active | 0.2353 | - |  |
| stats\StatSystem.js | active | 0.7698 | - |  |
| SystemCore.js | active | 3.624 | - |  |
| ui\SystemInterface.js | active | 0.2715 | - | ../../core/EventBus.js |

#### Dependency Chains
- class\ClassRegistry.js → (none)
- combat\CombatSystem.js → inventory\InventorySystem.js, leveling\LevelingManager.js, skills\SkillRegistry.js, leveling\LevelingSystem.js, race\RaceRegistry.js, effects\EffectSystem.js, skills\TalentManager.js, effects\EffectApplicationSystem.js, magic\ManaSystem.js, magic\ManaBalance.js
- effects\EffectApplicationSystem.js → effects\EffectSystem.js
- effects\EffectRegistry.js → (none)
- effects\EffectSystem.js → effects\EffectRegistry.js
- exploration\ExplorationSystem.js → leveling\LevelingManager.js
- inventory\InventorySystem.js → (none)
- leveling\LevelingManager.js → leveling\LevelingSystem.js, race\RaceSystem.js
- leveling\LevelingSystem.js → (none)
- leveling\XpSystem.js → leveling\LevelingManager.js
- magic\ManaBalance.js → (none)
- magic\ManaSystem.js → magic\ManaBalance.js
- race\RaceRegistry.js → (none)
- race\RaceSystem.js → race\RaceRegistry.js
- skills\generateFusionName.js → (none)
- skills\SkillEvolutionManager.js → skills\SkillRegistry.js, skills\generateFusionName.js
- skills\SkillRegistry.js → (none)
- skills\TalentDefinitions.js → (none)
- skills\TalentManager.js → skills\TalentRegistry.js
- skills\TalentRegistry.js → (none)
- stats\StatSystem.js → (none)
- SystemCore.js → (none)
- ui\SystemInterface.js → (none)

Error Rate: 0.00%

Resolution Steps:
- All modules imported successfully.


### Connection Verification Report

Timestamp: 2026-01-08T09:24:28.832Z

| System Module | Status | Response Time (ms) | Errors | Imports |
|---|---|---:|---|---|
| class\ClassRegistry.js | active | 1.3194 | - |  |
| combat\CombatSystem.js | active | 31.4769 | - | ../inventory/InventorySystem.js, ../leveling/LevelingManager.js, ../../entities/Enemy.js, ../skills/SkillRegistry.js, ../leveling/LevelingSystem.js, ../race/RaceRegistry.js, ../effects/EffectSystem.js, ../skills/TalentManager.js, ../effects/EffectApplicationSystem.js, ../magic/ManaSystem.js, ../magic/ManaBalance.js, ../../core/EventBus.js |
| effects\EffectApplicationSystem.js | active | 0.2995 | - | ./EffectSystem.js, ../../core/EventBus.js |
| effects\EffectRegistry.js | active | 0.231 | - |  |
| effects\EffectSystem.js | active | 0.2127 | - | ./EffectRegistry.js, ../../core/EventBus.js |
| exploration\ExplorationSystem.js | active | 1.0179 | - | ../leveling/LevelingManager.js |
| inventory\InventorySystem.js | active | 0.4636 | - | ../../entities/ItemRegistry.js |
| leveling\LevelingManager.js | active | 0.3243 | - | ./LevelingSystem.js, ../race/RaceSystem.js |
| leveling\LevelingSystem.js | active | 0.273 | - |  |
| leveling\XpSystem.js | active | 0.9085 | - | ./LevelingManager.js |
| magic\ManaBalance.js | active | 0.2478 | - |  |
| magic\ManaSystem.js | active | 0.2869 | - | ./ManaBalance.js |
| race\RaceRegistry.js | active | 0.2772 | - |  |
| race\RaceSystem.js | active | 0.2245 | - | ./RaceRegistry.js |
| skills\generateFusionName.js | active | 0.7197 | - |  |
| skills\SkillEvolutionManager.js | active | 2.0001 | - | ./SkillRegistry.js, ../../core/EventBus.js, ./generateFusionName.js |
| skills\SkillRegistry.js | active | 0.5248 | - |  |
| skills\TalentDefinitions.js | active | 0.2399 | - |  |
| skills\TalentManager.js | active | 0.4786 | - | ../../entities/Player.js, ../../data/talent.registry.json, ./TalentRegistry.js |
| skills\TalentRegistry.js | active | 0.2396 | - |  |
| stats\StatSystem.js | active | 0.753 | - |  |
| SystemCore.js | active | 3.0027 | - |  |
| ui\SystemInterface.js | active | 0.2805 | - | ../../core/EventBus.js |

#### Dependency Chains
- class\ClassRegistry.js → (none)
- combat\CombatSystem.js → inventory\InventorySystem.js, leveling\LevelingManager.js, skills\SkillRegistry.js, leveling\LevelingSystem.js, race\RaceRegistry.js, effects\EffectSystem.js, skills\TalentManager.js, effects\EffectApplicationSystem.js, magic\ManaSystem.js, magic\ManaBalance.js
- effects\EffectApplicationSystem.js → effects\EffectSystem.js
- effects\EffectRegistry.js → (none)
- effects\EffectSystem.js → effects\EffectRegistry.js
- exploration\ExplorationSystem.js → leveling\LevelingManager.js
- inventory\InventorySystem.js → (none)
- leveling\LevelingManager.js → leveling\LevelingSystem.js, race\RaceSystem.js
- leveling\LevelingSystem.js → (none)
- leveling\XpSystem.js → leveling\LevelingManager.js
- magic\ManaBalance.js → (none)
- magic\ManaSystem.js → magic\ManaBalance.js
- race\RaceRegistry.js → (none)
- race\RaceSystem.js → race\RaceRegistry.js
- skills\generateFusionName.js → (none)
- skills\SkillEvolutionManager.js → skills\SkillRegistry.js, skills\generateFusionName.js
- skills\SkillRegistry.js → (none)
- skills\TalentDefinitions.js → (none)
- skills\TalentManager.js → skills\TalentRegistry.js
- skills\TalentRegistry.js → (none)
- stats\StatSystem.js → (none)
- SystemCore.js → (none)
- ui\SystemInterface.js → (none)

Error Rate: 0.00%

Resolution Steps:
- All modules imported successfully.


### Connection Verification Report

Timestamp: 2026-01-08T10:13:08.847Z

| System Module | Status | Response Time (ms) | Errors | Imports |
|---|---|---:|---|---|
| class\ClassRegistry.js | active | 1.3612 | - |  |
| combat\CombatSystem.js | active | 40.9351 | - | ../inventory/InventorySystem.js, ../leveling/LevelingManager.js, ../../entities/Enemy.js, ../skills/SkillRegistry.js, ../leveling/LevelingSystem.js, ../race/RaceRegistry.js, ../effects/EffectSystem.js, ../skills/TalentManager.js, ../effects/EffectApplicationSystem.js, ../magic/ManaSystem.js, ../magic/ManaBalance.js, ../../core/EventBus.js |
| effects\EffectApplicationSystem.js | active | 0.4033 | - | ./EffectSystem.js, ../../core/EventBus.js |
| effects\EffectRegistry.js | active | 0.2639 | - |  |
| effects\EffectSystem.js | active | 0.2254 | - | ./EffectRegistry.js, ../../core/EventBus.js |
| exploration\ExplorationSystem.js | active | 0.9477 | - | ../leveling/LevelingManager.js |
| inventory\InventorySystem.js | active | 0.2781 | - | ../../entities/ItemRegistry.js |
| leveling\LevelingManager.js | active | 0.2375 | - | ./LevelingSystem.js, ../race/RaceSystem.js |
| leveling\LevelingSystem.js | active | 0.25 | - |  |
| leveling\XpSystem.js | active | 0.9151 | - | ./LevelingManager.js |
| magic\ManaBalance.js | active | 0.2358 | - |  |
| magic\ManaSystem.js | active | 0.2229 | - | ./ManaBalance.js |
| race\RaceRegistry.js | active | 0.2036 | - |  |
| race\RaceSystem.js | active | 0.1937 | - | ./RaceRegistry.js |
| skills\generateFusionName.js | active | 0.6307 | - |  |
| skills\SkillEvolutionManager.js | active | 2.4245 | - | ./SkillRegistry.js, ../../core/EventBus.js, ./generateFusionName.js |
| skills\SkillRegistry.js | active | 0.3589 | - |  |
| skills\TalentDefinitions.js | active | 0.3135 | - |  |
| skills\TalentManager.js | active | 4.1892 | - | ../../entities/Player.js, ../../data/talent.registry.json, ./TalentRegistry.js |
| skills\TalentRegistry.js | active | 1.7767 | - |  |
| stats\StatSystem.js | active | 1.2698 | - |  |
| SystemCore.js | active | 4.5354 | - |  |
| ui\SystemInterface.js | active | 0.2824 | - | ../../core/EventBus.js |

#### Dependency Chains
- class\ClassRegistry.js → (none)
- combat\CombatSystem.js → inventory\InventorySystem.js, leveling\LevelingManager.js, skills\SkillRegistry.js, leveling\LevelingSystem.js, race\RaceRegistry.js, effects\EffectSystem.js, skills\TalentManager.js, effects\EffectApplicationSystem.js, magic\ManaSystem.js, magic\ManaBalance.js
- effects\EffectApplicationSystem.js → effects\EffectSystem.js
- effects\EffectRegistry.js → (none)
- effects\EffectSystem.js → effects\EffectRegistry.js
- exploration\ExplorationSystem.js → leveling\LevelingManager.js
- inventory\InventorySystem.js → (none)
- leveling\LevelingManager.js → leveling\LevelingSystem.js, race\RaceSystem.js
- leveling\LevelingSystem.js → (none)
- leveling\XpSystem.js → leveling\LevelingManager.js
- magic\ManaBalance.js → (none)
- magic\ManaSystem.js → magic\ManaBalance.js
- race\RaceRegistry.js → (none)
- race\RaceSystem.js → race\RaceRegistry.js
- skills\generateFusionName.js → (none)
- skills\SkillEvolutionManager.js → skills\SkillRegistry.js, skills\generateFusionName.js
- skills\SkillRegistry.js → (none)
- skills\TalentDefinitions.js → (none)
- skills\TalentManager.js → skills\TalentRegistry.js
- skills\TalentRegistry.js → (none)
- stats\StatSystem.js → (none)
- SystemCore.js → (none)
- ui\SystemInterface.js → (none)

Error Rate: 0.00%

Resolution Steps:
- All modules imported successfully.

