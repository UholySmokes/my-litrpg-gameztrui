# Current State - AI Save Game

This document tracks the implementation status of all game features.
**Update this file whenever features are added, bugs are fixed, or priorities change.**

---

## Quick Status

| Category           | Status      | Notes                             |
| ------------------ | ----------- | --------------------------------- |
| Core Game Loop     | ✅ Complete | Playable                          |
| Character Creation | ✅ Complete | Full race/class/skill selection   |
| Combat System      | ✅ Complete | Turn-based, skills, escape        |
| Save/Load          | ✅ Complete | Supabase integration              |
| Skills Database    | ✅ Complete | 20/20 classes complete            |
| Shop System        | ✅ Complete | Basic shop UI                     |
| Gacha System       | ✅ Complete | Working rolls                     |
| Quest System       | 🔄 Partial  | Structure exists, limited content |

---

## Completed Features

### Core Systems

- [x] **Game State Management** (`gamestate.js`)
  - Centralized state object
  - Config section for game constants
  - Immutable state updates
- [x] **Game Logic** (`gamelogic.js`)
  - XP and level up system
  - Damage calculation
  - Item usage
  - Location movement
  - Action execution dispatcher

- [x] **Combat System**
  - Turn-based combat
  - Player attacks
  - Enemy attacks with AI
  - Skill usage with cooldowns
  - Escape mechanics
  - Victory/defeat handling
  - XP and loot rewards

### Character System

- [x] **Character Creation** (`CharacterCreation.jsx`, `useCharacterCreation.js`)
  - 20 races with stat bonuses
  - 20 classes with descriptions
  - Random EX-rank talent selection (3 choices from 120)
  - Skill selection (4 active, 12 passive from class pool)
  - Gender and name input

- [x] **Races** (`characterData.js`)
  - 20 unique races defined
  - Stat bonuses for each race
  - Evolution stage system (Mortal → ?)

- [x] **Classes** (`characterData.js`)
  - 20 classes defined
  - Upgrade paths specified
  - Class descriptions

- [x] **Talents** (`characterData.js`)
  - 120 EX-rank talents defined
  - Overpowered abilities (LitRPG style)

### Skills System

- [x] **Skills Architecture** (`skills.js`)
  - Class-based skill pools
  - Active skills (20 per class)
  - Passive skills (40 per class)
  - Universal learnable skills structure
  - Skill unlock conditions system

- [x] **Completed Class Skills (All 20 Classes):**
  - ✅ Knight (20 active, 40 passive)
  - ✅ Mage (20 active, 40 passive)
  - ✅ Assassin (20 active, 40 passive)
  - ✅ Warrior (20 active, 40 passive)
  - ✅ Rogue (20 active, 40 passive)
  - ✅ Priest (20 active, 40 passive)
  - ✅ Paladin (20 active, 40 passive)
  - ✅ Ranger (20 active, 40 passive)
  - ✅ Monk (20 active, 40 passive)
  - ✅ Bard (20 active, 40 passive)
  - ✅ Necromancer (20 active, 40 passive)
  - ✅ Druid (20 active, 40 passive)
  - ✅ Warlock (20 active, 40 passive)
  - ✅ Shaman (20 active, 40 passive)
  - ✅ Battlemage (20 active, 40 passive)
  - ✅ Archer (20 active, 40 passive)
  - ✅ Berserker (20 active, 40 passive)
  - ✅ Summoner (20 active, 40 passive)
  - ✅ Templar (20 active, 40 passive)
  - ✅ Shadowblade (20 active, 40 passive)

### UI Components

- [x] **Title Screen** (`TitleUI.jsx`)
- [x] **Game UI** (`GameUI.jsx`) - Main game interface
- [x] **Combat UI** (`CombatUI.jsx`) - Battle interface
- [x] **Class Resource HUD** (`GameUI.jsx`, `ClassResourceBar.jsx`) - Rage/Chi/Stealth meters now visible in the System Interface panel and Combat UI
- [x] **Character Creation** (`CharacterCreation.jsx`)
- [x] **Quest Log** (`QuestLogUI.jsx`)
- [x] **Shop UI** (`ShopUI.jsx`)
- [x] **Gacha UI** (`GachaUI.jsx`)
- [x] **Save/Load Screen** (`SaveLoadScreen.jsx`, `SaveLoadUI.jsx`)
- [x] **Auth UI** (`AuthUI.jsx`)
- [x] **Error Boundary** (`ErrorBoundary.jsx`)

### Data & Services

- [x] **Game Data** (`gameData.js`) - Item database
- [x] **Enemy Data** (`enemyData.js`) - Enemy definitions
- [x] **Shop Data** (`shopData.js`) - Shop items
- [x] **Gacha Data** (`gachaData.js`) - Gacha pools
- [x] **Title Data** (`titleData.js`) - Achievement titles
- [x] **AI Service** (`aiService.js`) - LLM integration
- [x] **Auth Service** (`authService.js`) - Authentication
- [x] **Supabase Service** (`supabaseService.js`) - Cloud saves
- [x] **Prompt Assembler** (`promptAssembler.js`) - AI context building
- [x] **Action Parser** (`actionParser.js`) - Input parsing
- [x] **Action Validator** (`actionValidator.js`) - Action validation

### Persistence

- [x] **Supabase Integration**
  - User authentication
  - Cloud save/load
  - Multiple save slots
  - Auto-save support

---

## Known Bugs

### Critical

- None currently known

### Medium Priority

- [ ] Mana doesn't regenerate outside of level-up (no passive regen)
- [ ] Skill cooldowns not visually displayed in UI
- [ ] Some hardcoded values in `gamelogic.js` should use config

### Low Priority

- [ ] Debug logging (fetch calls) still present in `gamelogic.js`
- [ ] No sound effects or music
- [ ] No animation on combat actions

---

## In Progress

### Current Sprint

1. ✅ **Creating anchor documentation files** (system_specs.md, current_state.md, .cursorrules) - COMPLETE
2. ✅ **Expanding gamestate.js config** with all game constants - COMPLETE
3. ✅ **Refactoring hardcoded values** in gamelogic.js - COMPLETE
4. ✅ **Completing all 17 remaining class skill sets** - COMPLETE

### Upcoming

- Universal skills expansion (thousands of learnable skills)
- Advanced combat mechanics (status effects)
- Equipment crafting system
- Class advancement/evolution
- Skill upgrade, evolution, and fusion mechanics

---

## Architecture Notes

### State Flow

```text
User Input → ActionParser → ActionValidator → GameLogic → New State → UI Update

```

### AI Integration

```text
User Input → PromptAssembler (builds context) → AI Service → ActionParser → GameLogic

```

### File Organization

```text
src/
├── components/     # React UI components
├── hook/           # Custom React hooks
├── lib/            # Game logic and data
└── util/           # Helper utilities

```

### Key Patterns

1. **Immutable State Updates**
   - All game logic functions return new state objects
   - Never mutate state directly
   - Use spread operator for updates

2. **Config-Driven Design**
   - Game constants in `state.config`
   - No magic numbers in logic code
   - Easy balance adjustments

3. **Separation of Concerns**
   - Data in `/lib/*Data.js` files
   - Logic in `gamelogic.js`
   - UI in `/components/*.jsx`

---

## Metrics

- **Total Lines of Code:** ~8,000+
- **React Components:** 12
- **Game Systems:** 8 major
- **Classes:** 20 (all complete)
- **Skills:** ~1,200 complete (20 active + 40 passive per class × 20 classes)

---

## Version History

| Version | Date     | Changes                                                               |
| ------- | -------- | --------------------------------------------------------------------- |
| 0.2.0   | Current  | Complete skill database (1,200 skills), anchor docs, config expansion |
| 0.1.1   | Previous | Added anchor docs, config expansion                                   |
| 0.1.0   | Initial  | Core game systems                                                     |

---

## Notes for AI Assistant

When implementing new features:

1. Check this file first to understand what exists
2. Reference `system_specs.md` for formulas and rules
3. Follow patterns in `.cursorrules`
4. Update this file when adding features
5. Use `state.config` for all game constants
