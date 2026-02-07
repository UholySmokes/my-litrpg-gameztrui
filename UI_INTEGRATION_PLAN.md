# UI Integration Plan for Class Systems

## Current State Analysis

### Tech Stack
- **Framework:** React 19.2 with Vite 7.2
- **State Management:** Custom `useGameEngine` hook with `useState`
- **Event System:** `EventBus.js` (emit/on/off pattern) - ✅ Already exists
- **Styling:** CSS with CSS variables (holo-theme)

### Existing UI Components
| Component | Purpose | Integration Needed |
|-----------|---------|-------------------|
| `GameUI.jsx` | Main game interface | Class resource bars, ability buttons |
| `CombatUI.jsx` | Combat interface | Class abilities, status effects |
| `CharacterCreation.jsx` | Character setup | Class selection with mechanics preview |

### Dependencies Status
✅ **No missing dependencies** - All required packages are present:
- React 19.2
- Vite 7.2
- Jest 30.2 (for testing)

---

## Integration Tasks

### Priority 1: Class Resource Bars (CombatUI)

**Goal:** Display class-specific resources (Rage, Chi, Focus, Energy, Soul Shards, etc.)

**Implementation:**
```jsx
// New component: ClassResourceBar.jsx
import { 
  getRagePercentage, 
  getChiStatus, 
  getArcherStatus,
  getRogueStatus,
  getWarlockStatus 
} from '../systems/index.js';

function ClassResourceBar({ player }) {
  const classId = player.class?.id || player.class;
  
  // Render appropriate resource bar based on class
  switch(classId) {
    case 'berserker':
      return <RageBar rage={player.rage} isEnraged={player.isEnraged} />;
    case 'monk':
    case 'grandmaster':
      return <ChiBar chi={player.chi} comboCount={player.comboCount} />;
    case 'archer':
    case 'ranger':
      return <FocusBar focus={player.focus} />;
    case 'rogue':
    case 'assassin':
      return <EnergyBar energy={player.energy} />;
    case 'warlock':
      return <SoulShardBar shards={player.soulShards} />;
    default:
      return null;
  }
}
```

**Files to modify:**
1. Create `src/components/ClassResourceBar.jsx`
2. Import in `CombatUI.jsx`
3. Add to combat panel layout

---

### Priority 2: Class Ability Buttons (CombatUI)

**Goal:** Show class-specific abilities with cooldowns and costs

**Implementation:**
```jsx
// New component: ClassAbilities.jsx
import { 
  getBardStatus,
  getShamanStatus,
  getTemplarStatus,
  // ... other status functions
} from '../systems/index.js';

function ClassAbilities({ player, onUseAbility }) {
  const classId = player.class?.id || player.class;
  
  // Get abilities based on class
  const status = getClassStatus(player, classId);
  if (!status) return null;
  
  return (
    <div className="class-abilities">
      {status.abilities?.map(ability => (
        <button
          key={ability.id}
          className="holo-button"
          disabled={ability.currentCooldown > 0 || !canAfford(player, ability)}
          onClick={() => onUseAbility(ability.id)}
        >
          {ability.name}
          {ability.currentCooldown > 0 && ` (${ability.currentCooldown})`}
        </button>
      ))}
    </div>
  );
}
```

**Files to modify:**
1. Create `src/components/ClassAbilities.jsx`
2. Import in `CombatUI.jsx`
3. Add ability handler in `GameUI.jsx`

---

### Priority 3: Status Effect Display

**Goal:** Show active buffs/debuffs with icons and durations

**Implementation:**
```jsx
// New component: StatusEffects.jsx
function StatusEffects({ player }) {
  const effects = player.effects || [];
  const classBuffs = getActiveClassBuffs(player);
  
  return (
    <div className="status-effects">
      {effects.map(effect => (
        <div key={effect.id} className={`effect-icon ${effect.type}`}>
          {effect.name} ({effect.remainingDuration})
        </div>
      ))}
      {classBuffs.map(buff => (
        <div key={buff.id} className="class-buff">
          {buff.icon} {buff.name}
        </div>
      ))}
    </div>
  );
}
```

---

### Priority 4: Pet/Minion Display (Ranger, Warlock, Necromancer)

**Goal:** Show active pets/minions with HP and commands

**Implementation:**
```jsx
// New component: MinionPanel.jsx
function MinionPanel({ player, onMinionCommand }) {
  const pet = getActivePet(player);
  const demon = player.activeDemon;
  const undead = player.undead || [];
  
  if (!pet && !demon && undead.length === 0) return null;
  
  return (
    <div className="minion-panel">
      {pet && <PetCard pet={pet} onCommand={onMinionCommand} />}
      {demon && <DemonCard demon={demon} />}
      {undead.map(u => <UndeadCard key={u.id} undead={u} />)}
    </div>
  );
}
```

---

### Priority 5: Totem Display (Shaman)

**Goal:** Show active totems with durations

```jsx
// New component: TotemDisplay.jsx
function TotemDisplay({ player }) {
  const totems = player.totems || [];
  if (totems.length === 0) return null;
  
  return (
    <div className="totem-display">
      {totems.map(totem => (
        <div key={totem.id} className={`totem ${totem.element}`}>
          {totem.name} ({totem.duration})
        </div>
      ))}
    </div>
  );
}
```

---

### Priority 6: EventBus Integration

**Goal:** Connect UI to system events for real-time updates

**Implementation in GameUI.jsx:**
```jsx
import { on, off } from '../core/EventBus.js';

useEffect(() => {
  const handlers = [
    on('combat:rageGain', ({ rage }) => {
      // Trigger rage bar animation
    }),
    on('bard:startPerformance', ({ song }) => {
      // Show performance indicator
    }),
    on('ranger:petAttack', ({ damage }) => {
      // Flash pet attack animation
    }),
  ];
  
  return () => handlers.forEach(unsub => unsub());
}, []);
```

---

## New Components to Create — ✅ ALL CREATED

| Component | Purpose | Priority | Status |
|-----------|---------|----------|--------|
| `ClassResourceBar.jsx` | Display class resources | High | ✅ Created |
| `ClassAbilities.jsx` | Class ability buttons | High | ✅ Created |
| `StatusEffects.jsx` | Buff/debuff icons | Medium | ✅ Created |
| `MinionPanel.jsx` | Pet/demon/undead display | Medium | ✅ Created |
| `TotemDisplay.jsx` | Shaman totems | Medium | ⬜ Not created |
| `AuraIndicator.jsx` | Paladin auras | Low | ⬜ Not created |
| `StanceIndicator.jsx` | Warrior stances | Low | ⬜ Not created |
| `ComboCounter.jsx` | Monk combo display | Low | ⬜ Not created |

---

## Files to Modify

### CombatUI.jsx
```diff
+ import ClassResourceBar from './ClassResourceBar';
+ import ClassAbilities from './ClassAbilities';
+ import StatusEffects from './StatusEffects';
+ import MinionPanel from './MinionPanel';

  return (
    <div className="holo-panel">
+     <ClassResourceBar player={player} />
+     <StatusEffects player={player} />
      {/* existing enemy list */}
+     <ClassAbilities player={player} onUseAbility={onUseAbility} />
+     <MinionPanel player={player} onMinionCommand={onMinionCommand} />
      {/* existing combat log */}
    </div>
  );
```

### GameUI.jsx
```diff
+ import { on, off } from '../core/EventBus.js';
+ import { 
+   useAimedShot, useMultiShot, // Archer
+   startPerformance, stopPerformance, // Bard
+   placeTotem, // Shaman
+   // ... other abilities
+ } from '../systems/index.js';

+ // Add ability handler
+ const handleClassAbility = useCallback((abilityId, targetIndex) => {
+   setState(prevState => {
+     // Route to appropriate system based on ability
+     return executeClassAbility(prevState, abilityId, targetIndex);
+   });
+ }, []);
```

### usegamestate.js
```diff
+ import { 
+   processPerformance,
+   processTotemEffects,
+   processPetTurn,
+   // ... other turn processors
+ } from '../systems/index.js';

+ // Add to turn processing
+ const processTurn = useCallback(() => {
+   setState(prevState => {
+     let newState = prevState;
+     newState = processPerformance(newState);
+     newState = processTotemEffects(newState);
+     newState = processPetTurn(newState);
+     return newState;
+   });
+ }, []);
```

---

## CSS Additions (styles.css)

```css
/* Class Resource Bars */
.rage-bar { background: linear-gradient(90deg, #ff4444, #ff8800); }
.chi-bar { background: linear-gradient(90deg, #44ff88, #88ffcc); }
.focus-bar { background: linear-gradient(90deg, #4488ff, #88ccff); }
.energy-bar { background: linear-gradient(90deg, #ffff44, #ffcc00); }
.soul-shard { color: #aa44ff; }

/* Combo Counter */
.combo-counter {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--holo-cyan);
  animation: pulse 0.3s ease-in-out;
}

/* Totem Icons */
.totem.fire { color: #ff4400; }
.totem.water { color: #0088ff; }
.totem.earth { color: #886600; }
.totem.air { color: #aaccff; }

/* Status Effects */
.effect-icon.BUFF { border-color: #44ff44; }
.effect-icon.DEBUFF { border-color: #ff4444; }
.effect-icon.DOT { border-color: #ff8800; }
.effect-icon.HOT { border-color: #44ff88; }
```

---

## Implementation Order

1. **Week 1: Core Resource Display**
   - Create `ClassResourceBar.jsx`
   - Integrate into `CombatUI.jsx`
   - Add CSS for resource bars

2. **Week 2: Ability System**
   - Create `ClassAbilities.jsx`
   - Add ability routing in `GameUI.jsx`
   - Connect to existing combat flow

3. **Week 3: Status & Minions**
   - Create `StatusEffects.jsx`
   - Create `MinionPanel.jsx`
   - Add EventBus listeners

4. **Week 4: Polish**
   - Add animations
   - Add sound effects hooks
   - Performance optimization

---

## Testing Checklist

- [ ] Berserker rage bar fills/empties correctly
- [ ] Monk combo counter increments on hits
- [ ] Bard song effects apply each turn
- [ ] Ranger pet attacks automatically
- [ ] Shaman totems display and expire
- [ ] Templar abilities have correct cooldowns
- [ ] All class abilities deduct correct resources
- [ ] EventBus events trigger UI updates (EventBus not yet wired into GameUI.jsx)

---

## No Missing Dependencies

The current `package.json` has everything needed:
- ✅ React 19.2 (UI framework)
- ✅ Vite 7.2 (build tool)
- ✅ Jest 30.2 (testing)

**Optional additions for polish:**
- `framer-motion` - For smooth animations
- `react-icons` - For ability/effect icons
- `howler` - For sound effects

```bash
npm install framer-motion react-icons howler
```

---

## Summary

**Immediate Actions:**
1. Create 4 new UI components
2. Modify `CombatUI.jsx` to include class displays
3. Add ability handler in `GameUI.jsx`
4. Add CSS for new elements

**No blockers** - All systems are implemented and ready for UI integration.
