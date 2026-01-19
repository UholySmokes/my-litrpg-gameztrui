# LitRPG Game Systems - Implementation Plan & TODO List

**Date:** January 9, 2026  
**Based On:** Comprehensive Lore-to-Code Audit  
**Consolidation Plan:** Integrated from `consolidation_plan.md`

---

## OVERVIEW

This plan addresses:

1. **27 identified lore-to-code gaps** from the audit
2. **Codebase consolidation** (1000+ files → ~600 files)
3. **Generator-ready architecture** for future content expansion

**Total Estimated Effort:** 120-150 hours (6-8 weeks)

---

## PHASE 1: DATA LAYER CONSOLIDATION (Week 1)

**Priority:** CRITICAL  
**Estimated Time:** 12-16 hours

### Goals

- Reduce data fragmentation
- Create unified data access patterns
- Prepare for generator integration

### Tasks

#### 1.1 Create Data Registry Structure

**File:** `src/data/DataRegistry.js`

```javascript
export class DataRegistry {
  static getRaces() {
    /* ... */
  }
  static getClasses() {
    /* ... */
  }
  static getItems() {
    /* ... */
  }
  static getEnemies() {
    /* ... */
  }
  static getSkills() {
    /* ... */
  }
  static getTalents() {
    /* ... */
  }
}
```

**Subtasks:**

- [ ] Create `src/data/` directory
- [ ] Create `src/data/registries/` subdirectory
- [ ] Implement `DataRegistry.js` with factory pattern
- [ ] Add caching layer for performance
- [ ] Add validation methods

**Files to Create:**

- `src/data/DataRegistry.js`
- `src/data/registries/RaceDataRegistry.js`
- `src/data/registries/ClassDataRegistry.js`
- `src/data/registries/ItemDataRegistry.js`
- `src/data/registries/EnemyDataRegistry.js`

---

#### 1.2 Migrate Existing Data Files

**Current Locations:** `src/lib/`, `src/entities/`, `src/systems/`

**Migration Map:**

```text
src/entities/ItemRegistry.js → src/data/registries/ItemDataRegistry.js
src/systems/race/RaceRegistry.js → src/data/registries/RaceDataRegistry.js
src/systems/class/ClassRegistry.js → src/data/registries/ClassDataRegistry.js
src/entities/Enemy.js → src/data/registries/EnemyDataRegistry.js

```

**Subtasks:**

- [ ] Copy data to new locations
- [ ] Update export patterns
- [ ] Create compatibility shims in old locations
- [ ] Update all imports across codebase (gradual)
- [ ] Add deprecation warnings to old files

---

#### 1.3 Update Import Statements

**Affected Files:** ~50-100 files

**Subtasks:**

- [ ] Search for `import.*from.*entities/ItemRegistry`
- [ ] Search for `import.*from.*race/RaceRegistry`
- [ ] Search for `import.*from.*class/ClassRegistry`
- [ ] Update to use `DataRegistry` instead
- [ ] Run verification scripts to ensure no breaks

**Example Update:**

```javascript
// OLD
import { itemDatabase } from "../entities/ItemRegistry.js";
const item = itemDatabase["iron_sword"];

// NEW
import { DataRegistry } from "../data/DataRegistry.js";
const item = DataRegistry.getItemById("iron_sword");
```

---

## PHASE 2: CRITICAL GAMEPLAY SYSTEMS (Weeks 2-3)

**Priority:** HIGH  
**Estimated Time:** 40-50 hours

### 2.1 Berserker Rage System

**Priority:** CRITICAL  
**Time:** 8 hours

**Lore Gap:** "Frenzied warrior who gains power through rage and bloodlust"

**Implementation:**

#### File: `src/systems/class/RageSystem.js`

```javascript
export const RAGE_CONFIG = {
  maxRage: 100,
  ragePerHit: 10,
  ragePerDamaged: 15,
  rageDecayPerTurn: 5,
  enrageThreshold: 80,
};

export function initializeRage(player) {
  if (player.class === "berserker") {
    player.rage = 0;
    player.isEnraged = false;
  }
  return player;
}

export function gainRage(player, amount, reason) {
  if (player.class !== "berserker") return player;

  const oldRage = player.rage || 0;
  player.rage = Math.min(RAGE_CONFIG.maxRage, oldRage + amount);

  // Check for enrage trigger
  if (player.rage >= RAGE_CONFIG.enrageThreshold && !player.isEnraged) {
    player.isEnraged = true;
    player.damageMultiplier = 1.5;
    player.defenseMultiplier = 0.7;
    emit("rage:enrage", { player: player.name });
  }

  return player;
}

export function processRageDecay(player) {
  if (player.class !== "berserker" || !player.rage) return player;

  player.rage = Math.max(0, player.rage - RAGE_CONFIG.rageDecayPerTurn);

  // Check for enrage end
  if (player.rage < RAGE_CONFIG.enrageThreshold && player.isEnraged) {
    player.isEnraged = false;
    player.damageMultiplier = 1.0;
    player.defenseMultiplier = 1.0;
    emit("rage:calm", { player: player.name });
  }

  return player;
}
```

**Integration Points:**

- [ ] Add rage gain to `playerAttack()` in `CombatSystem.js`
- [ ] Add rage gain to `takeDamage()` in `CombatSystem.js`
- [ ] Add rage decay to `processEnemyTurns()` in `CombatSystem.js`
- [ ] Apply damage/defense multipliers in `calculateDamage()`
- [ ] Add rage UI display component
- [ ] Create berserker-specific skills that consume rage

**Berserker Skills to Add:**

```javascript
{
  id: 'berserker_rampage',
  name: 'Rampage',
  description: 'Consume 50 rage to deal massive damage and gain lifesteal',
  rageCost: 50,
  cooldown: 15,
  effect: { damage: 2.0, lifesteal: 0.3, duration: 5 }
},
{
  id: 'berserker_bloodlust',
  name: 'Bloodlust',
  description: 'Consume all rage to gain attack speed based on rage spent',
  rageCost: 'all',
  cooldown: 30,
  effect: { attackSpeed: 'scaling' }
}

```

**Testing:**

- [ ] Test rage gain on hit
- [ ] Test rage gain on damage taken
- [ ] Test enrage trigger at 80 rage
- [ ] Test rage decay per turn
- [ ] Test damage/defense multipliers
- [ ] Test rage-consuming skills

---

### 2.2 Stealth System

**Priority:** HIGH  
**Time:** 6 hours

**Lore Gap:** Shadow Walker, Assassin, Rogue stealth mechanics

**Implementation:**

#### File: `src/systems/combat/StealthSystem.js`

```javascript
export const STEALTH_CONFIG = {
  baseDetectionRange: 10,
  stealthBreakOnAttack: true,
  ambushDamageMultiplier: 2.0,
  stealthDecayPerTurn: 10, // % chance to be detected
};

export function enterStealth(state) {
  const player = state.player;
  const raceId = player.race?.id || player.race;
  const classId = player.class?.id || player.class;

  // Check if class/race can stealth
  const canStealth =
    ["assassin", "rogue", "shadowblade"].includes(classId) ||
    raceId === "shadow_walker";

  if (!canStealth) {
    return { success: false, reason: "Cannot enter stealth", state };
  }

  // Cannot stealth in combat (unless special ability)
  if (state.combat?.status === "active") {
    return { success: false, reason: "Cannot stealth in combat", state };
  }

  const stealthBonus = hasRaceTag(raceId, "STEALTH_BOOST") ? 0.5 : 0;
  const stealthPower = player.attributes.agi * 2 * (1 + stealthBonus);

  return {
    success: true,
    state: {
      ...state,
      player: {
        ...player,
        isStealthed: true,
        stealthPower: stealthPower,
      },
    },
  };
}

export function checkDetection(player, enemy) {
  if (!player.isStealthed) return true; // Already detected

  const enemyPerception = enemy.perception || enemy.level * 2;
  const detectionRoll = Math.random() * 100;
  const detectionChance = Math.max(
    0,
    Math.min(100, (enemyPerception / player.stealthPower) * 100),
  );

  return detectionRoll < detectionChance;
}

export function applyAmbushDamage(damage, player) {
  if (player.isStealthed) {
    const ambushMultiplier = STEALTH_CONFIG.ambushDamageMultiplier;
    return {
      damage: Math.floor(damage * ambushMultiplier),
      isAmbush: true,
    };
  }
  return { damage, isAmbush: false };
}

export function breakStealth(state, reason) {
  if (!state.player.isStealthed) return state;

  const log = state.combat?.log ? [...state.combat.log] : [];
  log.push(`${state.player.name} breaks stealth! (${reason})`);

  return {
    ...state,
    player: {
      ...state.player,
      isStealthed: false,
      stealthPower: 0,
    },
    combat: state.combat ? { ...state.combat, log } : state.combat,
  };
}
```

**Integration Points:**

- [ ] Add stealth check to `startCombat()` (ambush opportunity)
- [ ] Add detection check per turn in `processEnemyTurns()`
- [ ] Apply ambush damage in `playerAttack()`
- [ ] Break stealth after attack (configurable)
- [ ] Add stealth UI indicator
- [ ] Add "Enter Stealth" action button

**Stealth Skills to Add:**

```javascript
{
  id: 'assassin_vanish',
  name: 'Vanish',
  description: 'Enter stealth during combat',
  manaCost: 30,
  cooldown: 60,
  effect: { stealth: true, duration: 2 }
},
{
  id: 'rogue_backstab',
  name: 'Backstab',
  description: 'Deal massive damage from stealth',
  manaCost: 20,
  cooldown: 10,
  requiresStealth: true,
  effect: { damage: 3.0, breakStealth: true }
}

```

**Testing:**

- [ ] Test stealth entry out of combat
- [ ] Test detection mechanics
- [ ] Test ambush damage bonus
- [ ] Test stealth breaking on attack
- [ ] Test stealth skills

---

### 2.3 Monk Chi System

**Priority:** HIGH  
**Time:** 7 hours

**Lore Gap:** "Martial artist using unarmed combat, inner energy, and spiritual discipline"

**Implementation:**

#### File: `src/systems/class/ChiSystem.js`

```javascript
export const CHI_CONFIG = {
  maxChi: 100,
  chiPerHit: 15,
  chiPerMeditate: 30,
  comboMultipliers: [1.0, 1.1, 1.25, 1.5, 2.0], // 5-hit combo
  unarmedDamageBase: 5,
  unarmedDamagePerLevel: 2,
};

export function initializeChi(player) {
  if (player.class === "monk") {
    player.chi = CHI_CONFIG.maxChi;
    player.comboCount = 0;
  }
  return player;
}

export function gainChi(player, amount, reason) {
  if (player.class !== "monk") return player;

  player.chi = Math.min(CHI_CONFIG.maxChi, (player.chi || 0) + amount);
  emit("chi:gain", { player: player.name, amount, reason });

  return player;
}

export function consumeChi(player, amount) {
  if (player.class !== "monk") return { success: false, player };

  if ((player.chi || 0) < amount) {
    return { success: false, player, reason: "Insufficient chi" };
  }

  player.chi -= amount;
  return { success: true, player };
}

export function calculateMonkDamage(player) {
  if (player.class !== "monk") return 0;

  const baseDamage = CHI_CONFIG.unarmedDamageBase;
  const levelScaling = player.level * CHI_CONFIG.unarmedDamagePerLevel;
  const attributeBonus = Math.floor(
    (player.attributes.str + player.attributes.dex) / 2,
  );

  return baseDamage + levelScaling + attributeBonus;
}

export function processCombo(player) {
  if (player.class !== "monk") return { player, multiplier: 1.0 };

  const comboIndex = Math.min(
    player.comboCount,
    CHI_CONFIG.comboMultipliers.length - 1,
  );
  const multiplier = CHI_CONFIG.comboMultipliers[comboIndex];

  // Increment combo
  player.comboCount = Math.min(
    player.comboCount + 1,
    CHI_CONFIG.comboMultipliers.length - 1,
  );

  return { player, multiplier };
}

export function resetCombo(player) {
  if (player.class === "monk") {
    player.comboCount = 0;
  }
  return player;
}

export function meditate(state) {
  const player = state.player;

  if (player.class !== "monk") {
    return { success: false, reason: "Only monks can meditate", state };
  }

  if (state.combat?.status === "active") {
    return { success: false, reason: "Cannot meditate in combat", state };
  }

  const chiGained = CHI_CONFIG.chiPerMeditate;
  player.chi = Math.min(CHI_CONFIG.maxChi, (player.chi || 0) + chiGained);

  return {
    success: true,
    chiGained,
    state: { ...state, player },
  };
}
```

**Integration Points:**

- [ ] Add chi gain to `playerAttack()` for monks
- [ ] Replace mana with chi for monk skills
- [ ] Apply combo multiplier in `calculateDamage()`
- [ ] Reset combo on missed attack or taking damage
- [ ] Add chi UI display
- [ ] Add "Meditate" action button (out of combat)
- [ ] Calculate unarmed damage for monks

**Monk Skills to Add:**

```javascript
{
  id: 'monk_palm_strike',
  name: 'Palm Strike',
  description: 'Strike with focused chi energy',
  chiCost: 20,
  cooldown: 0,
  effect: { damage: 1.5, chiGain: 15 }
},
{
  id: 'monk_iron_body',
  name: 'Iron Body',
  description: 'Harden your body with chi',
  chiCost: 40,
  cooldown: 30,
  effect: { defense: 2.0, duration: 5 }
},
{
  id: 'monk_flurry_of_blows',
  name: 'Flurry of Blows',
  description: 'Unleash a rapid combo of strikes',
  chiCost: 50,
  cooldown: 20,
  effect: { hits: 5, damagePerHit: 0.6 }
}

```

**Testing:**

- [ ] Test chi gain on hit
- [ ] Test chi consumption for skills
- [ ] Test combo system (1-5 hits)
- [ ] Test combo reset on miss/damage
- [ ] Test unarmed damage scaling
- [ ] Test meditation out of combat

---

### 2.4 Charm & Illusion System

**Priority:** MEDIUM-HIGH  
**Time:** 5 hours

**Lore Gap:** Fae Touched, Bard charm and illusion mechanics

**Implementation:**

#### File: `src/systems/effects/CharmSystem.js`

```javascript
export const CHARM_CONFIG = {
  baseCharmChance: 0.5,
  charmDurationBase: 3,
  illusionDurationBase: 5,
  maxCharmedEnemies: 2,
};

export function attemptCharm(state, enemyIndex, charmPower) {
  const enemy = state.combat.enemies[enemyIndex];

  // Check if already charmed
  if (enemy.isCharmed) {
    return { success: false, reason: "Already charmed", state };
  }

  // Check charm limit
  const charmedCount = state.combat.enemies.filter((e) => e.isCharmed).length;
  if (charmedCount >= CHARM_CONFIG.maxCharmedEnemies) {
    return { success: false, reason: "Max charmed enemies reached", state };
  }

  // Calculate charm chance
  const playerCha = state.player.attributes.cha || 5;
  const enemyWill = enemy.stats?.will || enemy.level;
  const charmChance =
    CHARM_CONFIG.baseCharmChance * (playerCha / enemyWill) * charmPower;

  const roll = Math.random();

  if (roll < charmChance) {
    const newEnemies = [...state.combat.enemies];
    newEnemies[enemyIndex] = {
      ...enemy,
      isCharmed: true,
      charmDuration: CHARM_CONFIG.charmDurationBase,
      originalTeam: "enemy",
      currentTeam: "player",
    };

    const log = [
      ...state.combat.log,
      `✨ ${state.player.name} charms ${enemy.name}!`,
    ];

    emit("charm:success", { target: enemy.name });

    return {
      success: true,
      state: {
        ...state,
        combat: {
          ...state.combat,
          enemies: newEnemies,
          log,
        },
      },
    };
  }

  return { success: false, reason: "Charm resisted", state };
}

export function processCharmDuration(state) {
  if (!state.combat || state.combat.status !== "active") return state;

  const newEnemies = state.combat.enemies.map((enemy) => {
    if (enemy.isCharmed) {
      const newDuration = enemy.charmDuration - 1;

      if (newDuration <= 0) {
        // Charm expires
        const log = [...state.combat.log, `${enemy.name}'s charm fades.`];
        state = { ...state, combat: { ...state.combat, log } };

        return {
          ...enemy,
          isCharmed: false,
          charmDuration: 0,
          currentTeam: enemy.originalTeam,
        };
      }

      return { ...enemy, charmDuration: newDuration };
    }
    return enemy;
  });

  return {
    ...state,
    combat: {
      ...state.combat,
      enemies: newEnemies,
    },
  };
}

export function createIllusion(state, illusionType) {
  const player = state.player;

  const illusion = {
    id: `illusion_${Date.now()}`,
    name: `${player.name}'s Illusion`,
    type: illusionType, // 'decoy', 'mirror_image'
    hp: { current: 1, max: 1 }, // One-hit
    duration: CHARM_CONFIG.illusionDurationBase,
    isIllusion: true,
    ownerId: player.id,
  };

  const log = [
    ...(state.combat?.log || []),
    `✨ ${player.name} creates an illusion!`,
  ];

  return {
    success: true,
    state: {
      ...state,
      player: {
        ...player,
        illusions: [...(player.illusions || []), illusion],
      },
      combat: state.combat
        ? {
            ...state.combat,
            log,
          }
        : state.combat,
    },
  };
}
```

**Integration Points:**

- [ ] Add charm check in `enemyAttack()` (charmed enemies attack their allies)
- [ ] Process charm duration in `processEnemyTurns()`
- [ ] Add illusion targeting logic (enemies may attack illusions)
- [ ] Process illusion duration decay
- [ ] Add charm/illusion UI indicators

**Charm/Illusion Skills:**

```javascript
{
  id: 'fae_charm',
  name: 'Enchanting Glamour',
  description: 'Charm an enemy to fight for you',
  manaCost: 30,
  cooldown: 20,
  effect: { charm: { duration: 3, chance: 0.7 } }
},
{
  id: 'fae_mirror_image',
  name: 'Mirror Image',
  description: 'Create illusory copies',
  manaCost: 25,
  cooldown: 15,
  effect: { illusion: { count: 2, duration: 5 } }
},
{
  id: 'bard_mesmerize',
  name: 'Mesmerizing Performance',
  description: 'Charm all enemies (low chance)',
  manaCost: 50,
  cooldown: 60,
  effect: { charmAoE: { chance: 0.3, duration: 2 } }
}

```

**Testing:**

- [ ] Test charm success/failure
- [ ] Test charmed enemy attacking allies
- [ ] Test charm duration decay
- [ ] Test charm limit (max 2)
- [ ] Test illusion creation
- [ ] Test enemies attacking illusions

---

## PHASE 3: EFFECT SYSTEM COMPLETION (Week 4)

**Priority:** HIGH  
**Estimated Time:** 16-20 hours

### 3.1 Consolidate Effect Processing

**Goal:** Complete migration to `EffectApplicationSystem.js`

**Tasks:**

- [ ] Audit all effect processing code
- [ ] Migrate remaining logic from `effectProcessor.js`
- [ ] Standardize effect definitions in `EffectRegistry.js`
- [ ] Implement comprehensive error handling
- [ ] Add effect validation

---

### 3.2 Implement Missing Effect Types

#### New Effect Types Needed

```javascript
export const EFFECT_TYPES = {
  // Existing
  DOT: "DOT",
  HOT: "HOT",
  BUFF: "BUFF",
  DEBUFF: "DEBUFF",
  STUN: "STUN",

  // NEW
  CHARM: "CHARM", // Enemy fights for you
  CONFUSE: "CONFUSE", // Enemy attacks random target
  TAUNT: "TAUNT", // Enemy must attack taunter
  INVISIBLE: "INVISIBLE", // Cannot be targeted
  TRANSFORM: "TRANSFORM", // Change form (shapeshift)
  SHIELD: "SHIELD", // Absorb damage
  REFLECT: "REFLECT", // Bounce damage back
  SILENCE: "SILENCE", // Cannot cast spells
  DISARM: "DISARM", // Cannot use weapon
  ROOT: "ROOT", // Cannot move
  SLOW: "SLOW", // Reduced speed
  HASTE: "HASTE", // Increased speed
};
```

**Subtasks:**

- [ ] Implement CHARM effect processing
- [ ] Implement CONFUSE effect processing
- [ ] Implement TAUNT/threat system
- [ ] Implement INVISIBLE effect
- [ ] Implement SHIELD absorption
- [ ] Implement REFLECT damage
- [ ] Implement SILENCE/DISARM restrictions
- [ ] Implement ROOT/SLOW/HASTE movement

---

## PHASE 4: ENVIRONMENTAL SYSTEMS (Week 5)

**Priority:** MEDIUM  
**Estimated Time:** 12-16 hours

### 4.1 Day/Night Cycle System

**Lore Gap:** Nature Spirit sun regen, Shadow Walker daylight penalty

#### File: `src/systems/world/TimeSystem.js`

```javascript
export const TIME_CONFIG = {
  dayLengthMinutes: 20, // Real-time minutes
  nightLengthMinutes: 10,
  dawnDuration: 2,
  duskDuration: 2,
};

export function initializeTime(state) {
  return {
    ...state,
    world: {
      ...state.world,
      time: {
        currentTime: 0, // 0-1440 (24 hours in minutes)
        timeOfDay: "day", // 'dawn', 'day', 'dusk', 'night'
        isOutdoors: true,
      },
    },
  };
}

export function updateTime(state, deltaMinutes) {
  const time = state.world.time;
  const newTime = (time.currentTime + deltaMinutes) % 1440;

  let timeOfDay = "day";
  if (newTime >= 0 && newTime < 360) timeOfDay = "night";
  else if (newTime >= 360 && newTime < 420) timeOfDay = "dawn";
  else if (newTime >= 420 && newTime < 1080) timeOfDay = "day";
  else if (newTime >= 1080 && newTime < 1140) timeOfDay = "dusk";
  else timeOfDay = "night";

  return {
    ...state,
    world: {
      ...state.world,
      time: {
        ...time,
        currentTime: newTime,
        timeOfDay,
      },
    },
  };
}

export function isDaytime(state) {
  return (
    state.world?.time?.timeOfDay === "day" ||
    state.world?.time?.timeOfDay === "dawn"
  );
}

export function isNighttime(state) {
  return (
    state.world?.time?.timeOfDay === "night" ||
    state.world?.time?.timeOfDay === "dusk"
  );
}

export function isOutdoors(state) {
  return state.world?.time?.isOutdoors !== false;
}
```

**Integration Points:**

- [ ] Add time update to game loop
- [ ] Apply Nature Spirit sun regen in `processTurnEffects()`
- [ ] Apply Shadow Walker daylight penalty in `calculateDamage()`
- [ ] Add time display to UI
- [ ] Add indoor/outdoor location tracking

**Testing:**

- [ ] Test time progression
- [ ] Test time of day transitions
- [ ] Test sun regen for Nature Spirit
- [ ] Test daylight penalty for Shadow Walker

---

### 4.2 Weather System (Optional)

**Lore Gap:** Nature Spirit stronger in rain/forest

**Priority:** LOW  
**Time:** 4 hours

---

## PHASE 5: ITEM SYSTEM ENHANCEMENTS (Week 6)

**Priority:** MEDIUM  
**Estimated Time:** 12-16 hours

### 5.1 Item Proc System

**Goal:** Legendary items have unique effects

#### File: `src/systems/items/ItemProcSystem.js`

```javascript
export function checkItemProc(attacker, defender, damage, item) {
  if (!item.uniquePassive) return { damage, messages: [] };

  const proc = item.uniquePassive.proc;
  const roll = Math.random();

  if (roll < proc.chance) {
    const messages = [`${item.uniquePassive.name} activates!`];

    switch (proc.effect) {
      case "true_damage":
        const trueDamage = Math.floor(damage * proc.multiplier);
        return { damage: trueDamage, messages, isTrueDamage: true };

      case "lifesteal":
        const healAmount = Math.floor(damage * proc.value);
        attacker.hp.current = Math.min(
          attacker.hp.max,
          attacker.hp.current + healAmount,
        );
        messages.push(`Healed ${healAmount} HP!`);
        return { damage, messages, healed: healAmount };

      case "chain_lightning":
        // Damage additional targets
        return { damage, messages, chainTargets: proc.targets };

      default:
        return { damage, messages };
    }
  }

  return { damage, messages: [] };
}
```

**Legendary Item Updates:**

```javascript
'legendary_blade': {
  // ... existing properties
  uniquePassive: {
    id: 'reality_slash',
    name: 'Reality Slash',
    description: '10% chance to deal true damage (ignores armor)',
    proc: { chance: 0.10, effect: 'true_damage', multiplier: 2.0 }
  }
},
'dragon_scale_armor': {
  // ... existing properties
  uniquePassive: {
    id: 'draconic_presence',
    name: 'Draconic Presence',
    description: 'Enemies have -10% accuracy when attacking you',
    aura: { effect: 'accuracy_reduction', value: 0.10 }
  }
}

```

**Subtasks:**

- [ ] Implement proc checking in `calculateDamage()`
- [ ] Add true damage type (ignores armor)
- [ ] Add chain lightning targeting
- [ ] Add item aura system
- [ ] Update legendary items with procs
- [ ] Add proc UI notifications

---

### 5.2 Item Level Requirements

**Goal:** Prevent low-level players from using high-tier items

**Subtasks:**

- [ ] Add `levelRequirement` to item definitions
- [ ] Check level requirement in `equipItem()`
- [ ] Display level requirement in item tooltips
- [ ] Add level-scaled item drops

---

## PHASE 6: TEST SUITE CONSOLIDATION (Week 7)

**Priority:** MEDIUM  
**Estimated Time:** 16-20 hours

### 6.1 Create Unified Test Framework

#### File: `tests/GameSystemTests.js`

```javascript
export class GameSystemTests {
  static async runAll() {
    const results = {
      talents: await this.testTalents(),
      skills: await this.testSkillEffects(),
      effects: await this.testEffects(),
      caps: await this.testCaps(),
      fusion: await this.testFusion(),
      descriptions: await this.testDescriptions(),
      races: await this.testRaces(),
      loreToCode: await this.testLoreToCode(),
    };
    return results;
  }

  static async testLoreToCode() {
    // Validate all lore descriptions have corresponding mechanics
    const races = DataRegistry.getRaces();
    const failures = [];

    for (const race of races) {
      const lore = race.description;
      const traits = RACE_TRAITS[race.id];

      // Extract implied mechanics from lore
      const impliedMechanics = extractImpliedMechanics(lore);

      // Check if traits implement all implied mechanics
      for (const mechanic of impliedMechanics) {
        if (!isImplemented(mechanic, traits)) {
          failures.push({
            race: race.id,
            mechanic,
            lore,
          });
        }
      }
    }

    return {
      passed: failures.length === 0,
      failures,
    };
  }
}
```

**Subtasks:**

- [ ] Create `tests/` directory
- [ ] Migrate 12 verification scripts
- [ ] Implement `testLoreToCode()` validation
- [ ] Create automated test runner
- [ ] Add CI/CD integration
- [ ] Generate test reports

---

### 6.2 Lore-to-Code Validation Tests

**Goal:** Automatically detect when lore implies mechanics not in code

**Algorithm:**

1. Parse lore descriptions for keywords
2. Map keywords to expected mechanics
3. Check if mechanics exist in code
4. Report gaps

**Keywords to Mechanics Map:**

```javascript
const LORE_KEYWORDS = {
  resurrect: ["REBIRTH", "revive mechanic"],
  stealth: ["STEALTH_BOOST", "stealth system"],
  charm: ["CHARM", "charm system"],
  rage: ["rage resource", "enrage mechanic"],
  summon: ["summon system", "minion management"],
  shapeshift: ["shapeshift system", "form management"],
  immune: ["IMMUNE_*", "immunity tags"],
  resist: ["RESIST_*", "resistance tags"],
  weak: ["WEAK_*", "weakness tags"],
};
```

---

## PHASE 7: SERVICE LAYER RESTRUCTURING (Week 8)

**Priority:** LOW  
**Estimated Time:** 8-12 hours

### 7.1 Create Services Directory

**Structure:**

```text
src/
├── services/
│   ├── ServiceManager.js
│   ├── AIService.js
│   ├── AuthService.js
│   ├── DatabaseService.js
│   └── index.js

```

**Subtasks:**

- [ ] Create `src/services/` directory
- [ ] Move `aiService.js` → `services/AIService.js`
- [ ] Move `authService.js` → `services/AuthService.js`
- [ ] Move `supabaseService.js` → `services/DatabaseService.js`
- [ ] Create `ServiceManager.js`
- [ ] Update imports

---

## PHASE 8: REMAINING CLASS MECHANICS (Weeks 9-10)

**Priority:** MEDIUM-LOW  
**Estimated Time:** 24-32 hours

### 8.1 Bard Performance System

**Time:** 5 hours

### 8.2 Ranger Pet Companion System

**Time:** 8 hours

### 8.3 Shaman Totem System

**Time:** 6 hours

### 8.4 Templar Anti-Magic System

**Time:** 5 hours

### 8.5 Other Class Mechanics

**Time:** 10-12 hours

---

## GENERATOR INTEGRATION REQUIREMENTS

### Race Generator Schema

```javascript
{
  id: string,
  name: string,
  description: string, // Lore text
  evolutionStage: string,
  statBonuses: { str, agi, dex, int, cha, will, luck, soul },
  impliedMechanics: string[], // Extracted from lore
  passiveTrait: {
    id, name, description, tags, value
  },
  hiddenTrait: {
    id, name, description, tags, positive, negative
  },
  specialMechanics: {} // Rebirth, etc.
}

```

### Class Generator Schema

```javascript
{
  id: string,
  name: string,
  description: string, // Role description
  upgradePath: string,
  impliedMechanics: string[],
  resourceSystem: 'mana' | 'rage' | 'chi' | 'energy',
  coreMechanics: string[], // ['summon', 'shapeshift', etc.]
  skills: []
}

```

### Item Generator Schema

```javascript
{
  id: string,
  name: string,
  description: string, // Flavor text
  type: string,
  rarity: string,
  levelRequirement: number,
  stats: {},
  uniquePassive: {
    id, name, description, proc: {}
  },
  impliedEffects: string[] // Extracted from flavor text
}

```

---

## SUCCESS METRICS

### Code Quality

- [ ] File count reduced from 1000+ to ~600
- [ ] Import complexity reduced by 50%
- [ ] 90%+ test coverage
- [ ] All lore descriptions have mechanics

### Gameplay Depth

- [ ] 20/20 races fully implemented
- [ ] 15/20 classes have unique mechanics
- [ ] 10+ legendary items with procs
- [ ] 5+ environmental interactions

### Performance

- [ ] No degradation in load times
- [ ] Efficient effect processing
- [ ] Optimized bundle sizes

---

## RISK MITIGATION

### Backward Compatibility

- Create compatibility shims for old imports
- Gradual deprecation with warnings
- Maintain old file structure during migration

### Testing Coverage

- Run full test suite after each phase
- Automated regression testing
- Performance benchmarking

### Documentation

- Update all documentation
- Provide migration guides
- Document new patterns

---

## NEXT IMMEDIATE ACTIONS

1. ✅ Review and approve this plan
2. 🔄 Begin Phase 1: Data Registry Consolidation
3. 🔄 Implement Berserker Rage System (highest priority)
4. 🔄 Set up automated lore-to-code validation
5. 🔄 Create project tracking board

---

**Plan End**  
**Total Tasks:** 150+  
**Estimated Completion:** 8-10 weeks  
**Priority:** Phases 1-3 are critical path
