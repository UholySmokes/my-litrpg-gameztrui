# Current State — Voidverse LitRPG

> Last updated: **2026-02-07**
>
> This document tracks the implementation status of all game features.
> **Update this file whenever features are added, bugs are fixed, or priorities change.**

---

## Quick Status

| Category               | Status      | Notes                                              |
| ---------------------- | ----------- | -------------------------------------------------- |
| Core Engine            | ✅ Complete | Reducer + Dispatcher + EventBus + StateNormalizer   |
| Character Creation     | ✅ Complete | Multi-step wizard with archetype system             |
| Combat System          | ✅ Complete | Turn-based, skills, stealth, rage, chi, escape      |
| Save / Load            | ✅ Complete | Azure SQL + Azure Functions                         |
| Skills Database        | ✅ Complete | 20/20 classes, evolution, fusion, non-combat skills |
| Effects Engine         | ✅ Complete | Status effects, charm, item procs, set bonuses      |
| Loot / Items           | ✅ Complete | Affix tiers, set bonuses, item procs                |
| Leveling / XP          | ✅ Complete | xpCurve, LevelingSystem + LevelingManager           |
| Shop System            | ✅ Complete | Basic shop UI                                       |
| Gacha System           | ✅ Complete | Working rolls                                       |
| Profession System      | ✅ Complete | Registry + UI                                       |
| Race System            | ✅ Complete | Registry + abilities + UI                           |
| Title System           | ✅ Complete | Title logic + data                                  |
| Archetype System       | ✅ Complete | SystemBuilder + ArchetypeSystemRegistry             |
| Exploration            | ✅ Complete | ExplorationSystem                                   |
| Magic / Mana           | ✅ Complete | ManaSystem + ManaBalance                            |
| World / Time           | ✅ Complete | TimeSystem + WorldInitializer + WorldDataRegistry   |
| Simulation Engine      | ✅ Complete | Kernel, validation, determinism, combat logging     |
| Observability          | ✅ Complete | OpenTelemetry tracing (OTLP)                        |
| Monorepo Packages      | ✅ Complete | @voidverse/game-core, @voidverse/game-schemas       |
| Windowed UI            | ✅ Complete | DockZone, WindowManager, layout presets             |
| Quest System           | 🔄 Partial  | 21 quests defined (8 main + 13 side), needs more    |
| Dungeon Generator      | ✅ Complete | Cellular automata, 9 tile types, difficulty scaling  |
| Prestige System        | ✅ Complete | Soul shards, XP multipliers, 4 upgrade types         |

---

## Architecture

### State Flow

```
User Input → InputParser → InputValidator → ActionDispatcher → gameReducer → StateNormalizer → New State → UI
```

### AI Integration

```
User Input → PromptAssembler (state + action context) → AIService → InputParser → ActionDispatcher
```

### Event Bus

```
System functions → EventBus.emit() → SystemEventObserver → SimulationContext (bridge) → narrativeLog
```

### Codebase Layout

```
.
├── api/                          # Azure Functions backend
│   ├── narrate/                  #   NarratorAgent  (NARRATOR_AGENT_ID)
│   ├── quest-create/             #   QuestGiver     (QUEST_AGENT_ID)
│   ├── factory-run/              #   ContentSmith   (FACTORY_AGENT_ID)
│   ├── runs/                     #   Game run management
│   ├── run-events/               #   Run event tracking
│   ├── run-snapshots/            #   Run state snapshots
│   ├── saves/                    #   Cloud save/load
│   ├── health/                   #   Health check endpoint
│   ├── static-data/              #   Static data serving
│   ├── VoidverseFunction/        #   Misc function endpoint
│   ├── lib/                      #   Shared: auth, sql, azure-ai-utils, tracing, game-db
│   └── sql/schema.sql            #   Database schema
│
├── packages/                     # Monorepo workspaces
│   ├── game-core/                #   @voidverse/game-core (shared engine code)
│   └── game-schemas/             #   @voidverse/game-schemas (action/state schemas)
│
├── src/
│   ├── core/                     # Engine layer (16 files)
│   │   ├── gameReducer.js        #   Canonical state transition reducer
│   │   ├── ActionDispatcher.js   #   Routes actions to system functions
│   │   ├── StateNormalizer.js    #   Normalizes state + default config
│   │   ├── EventBus.js           #   Event emission
│   │   ├── SystemEventObserver.js#   Event → simulation bridge
│   │   ├── PromptAssembler.js    #   Builds AI prompts from state
│   │   ├── AIService.js          #   LLM integration
│   │   ├── AuthService.js        #   Authentication
│   │   ├── CloudSaveService.js   #   Cloud persistence
│   │   ├── InputParser.js        #   Raw input → structured action
│   │   ├── InputValidator.js     #   Action validation
│   │   ├── narrativeLog.js       #   Narrative log management
│   │   ├── titleLogic.js         #   Title evaluation
│   │   ├── xpCurve.js            #   XP curve formulas
│   │   ├── BrowserFixes.js       #   Browser compatibility
│   │   └── EnvCheck.js           #   Environment validation
│   │
│   ├── systems/                  # Modular game mechanics (20 subdirs, 40+ files)
│   │   ├── archetype/            #   ArchetypeSystemRegistry, SystemBuilder
│   │   ├── class/                #   ClassRegistry, ClassAbilityRegistry, RageSystem, ChiSystem
│   │   ├── combat/               #   CombatSystem, StealthSystem
│   │   ├── effects/              #   EffectSystem, EffectRegistry, EffectApplicationSystem, CharmSystem
│   │   ├── exploration/          #   ExplorationSystem
│   │   ├── generation/           #   ClassGenerator, ContentGenerator, NameGenerator, RaceGenerator, SkillGenerator
│   │   ├── inventory/            #   InventorySystem
│   │   ├── items/                #   ItemProcSystem, SetBonusSystem
│   │   ├── leveling/             #   LevelingSystem, LevelingManager
│   │   ├── loot/                 #   LootSystem, AffixTierRegistry, affixStats
│   │   ├── magic/                #   ManaSystem, ManaBalance
│   │   ├── profession/           #   ProfessionRegistry
│   │   ├── quest/                #   QuestManager
│   │   ├── race/                 #   RaceRegistry, RaceAbilityRegistry, RaceSystem
│   │   ├── skills/               #   SkillRegistry, SkillEvolutionSystem, SkillFusionSystem,
│   │   │                         #   SpellStudySystem, NonCombatSkillRegistry,
│   │   │                         #   TalentDefinitions, TalentManager, TalentRegistry
│   │   ├── titles/               #   TitleSystem
│   │   ├── world/                #   TimeSystem, WorldInitializer
│   │   ├── DungeonGenerator.ts   #   (stub)
│   │   └── PrestigeSystem.ts     #   (stub)
│   │
│   ├── components/               # React UI components (22 .jsx files)
│   │   ├── AdminTools.jsx
│   │   ├── AuthUI.jsx
│   │   ├── CharacterGenesisUI_Enhanced.jsx
│   │   ├── ClassAbilities.jsx
│   │   ├── ClassResourceBar.jsx
│   │   ├── CombatUI.jsx
│   │   ├── EquipmentSlots.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── ExperienceBar.jsx
│   │   ├── GachaUI.jsx
│   │   ├── GameUI.jsx
│   │   ├── HudVitals.jsx
│   │   ├── MinionPanel.jsx
│   │   ├── ProfessionUI.jsx
│   │   ├── QuestTracker.jsx
│   │   ├── RaceAbilities.jsx
│   │   ├── SaveLoadUI.jsx
│   │   ├── ShopUI.jsx
│   │   ├── StatusEffects.jsx
│   │   ├── StatusOverlay.jsx
│   │   ├── SystemLog.jsx
│   │   └── TitleUI.jsx
│   │
│   ├── ui/                       # Advanced UI layer (25 .jsx files)
│   │   ├── modes/                #   CharacterCreationMode, GameMode
│   │   ├── panels/               #   ActionSuggestions, CommandTerminal, Equipment,
│   │   │                         #   EquipmentSelection, Inventory, NarrativeHub,
│   │   │                         #   NarrativeLog, NarrativeMemory, Quest,
│   │   │                         #   StatusEffects, Vitals, CreationNarrative
│   │   │   └── creation/         #   8 creation step panels (Identity, Race, Class,
│   │   │                         #   Archetype, Attributes, Skills, Talent, Summary)
│   │   └── windowing/            #   DockZone, GameWindow, WindowManager, WindowRegistry,
│   │                             #   layoutPresets, useWindowLayout
│   │
│   ├── data/                     # Data layer
│   │   ├── DataRegistry.js       #   Central data registry
│   │   ├── initialState.js       #   Default game state
│   │   ├── StaticDataBootstrap.js#   Static data loader
│   │   ├── registries/           #   ClassData, EnemyData, ItemData, RaceData, WorldData registries
│   │   ├── gachaData.js
│   │   ├── shopData.js
│   │   ├── titleData.js
│   │   ├── QuestCatalog.js
│   │   └── OpeningScenes.js
│   │
│   ├── entities/                 # Entity models: Player, Enemy, ItemRegistry
│   ├── world/                    # WorldDataRegistry, WorldInitializer
│   ├── simulation/               # Simulation engine (TypeScript + JS)
│   │   ├── bridge/               #   GameStateAdapter, SimulationBridge, SimulationContext
│   │   ├── combat/               #   ActionResolver, ActionScheduler (+determinism variants)
│   │   ├── effects/              #   EffectEngine
│   │   ├── events/               #   EventBus (TS)
│   │   ├── kernel/               #   SimulationKernel (+determinism variant)
│   │   ├── logging/              #   CombatLogSerializer
│   │   ├── types/                #   core.ts
│   │   └── validation/           #   basic.ts, schema.ts
│   │
│   ├── hook/                     # React hooks
│   │   ├── usegamestate.js       #   Central state hook
│   │   ├── useCharacterCreationReworked.js
│   │   ├── useNarrative.js
│   │   └── useSimulation.js
│   │
│   ├── context/                  # ThemeContext.jsx
│   ├── constants/                # attributes.js
│   ├── observability/            # initTracing.node.js, traceShim.js
│   ├── util/                     # numberFormat.js, statusrenderer.js
│   └── utils/                    # AttributeMath, CombatMath, DeterministicRandom, shared
│
├── tests/
│   ├── unit/                     # 13 test files
│   │   ├── DataRegistry.test.js
│   │   ├── EffectEngineAndLog.test.js
│   │   ├── GameSystems.test.js
│   │   ├── InputValidator.test.js
│   │   ├── InventorySystem.test.js
│   │   ├── LevelingAndCombat.test.js
│   │   ├── LocationResolution.test.js
│   │   ├── NarrationGuards.test.js
│   │   ├── PromptAssembler.test.js
│   │   ├── SkillProgression.test.js
│   │   ├── TracingShim.test.js
│   │   ├── WorldDataRegistry.test.js
│   │   └── WorldInitializer.test.js
│   └── __mocks__/
│
├── scripts/                      # Dev utilities
│   ├── generate-runtime-config.js
│   ├── seed-static-data.cjs
│   ├── validate-registries.mjs
│   ├── analyze-middleware-dependencies.cjs
│   ├── generate-dependency-graph.cjs
│   └── collect-test-errors.js
│
├── sim_gamestart_fixed.js        # Main simulation entry point
├── package.json                  # Monorepo root (workspaces: packages/*)
├── vite.config.js                # Vite build config
├── tsconfig.json                 # TypeScript config
├── eslint.config.js              # ESLint flat config
├── docker-compose.yml            # Docker multi-service
├── swa-cli.config.json           # Azure SWA CLI config
└── docs/                         # Documentation assets
```

---

## Completed Features

### Core Engine (`src/core/`)

- [x] **gameReducer.js** — Canonical state transition reducer
- [x] **ActionDispatcher.js** — Routes user actions to system functions
- [x] **StateNormalizer.js** — Normalizes state, provides default config values
- [x] **EventBus.js** — Event emission; events logged into SimulationContext
- [x] **SystemEventObserver.js** — Observes & forwards system events
- [x] **InputParser.js** — Parses raw user input into structured actions
- [x] **InputValidator.js** — Validates actions before dispatch
- [x] **PromptAssembler.js** — Builds AI prompts from state + action results
- [x] **AIService.js** — LLM integration
- [x] **AuthService.js** — Authentication handling
- [x] **CloudSaveService.js** — Azure SQL cloud persistence
- [x] **narrativeLog.js** — Narrative log management
- [x] **titleLogic.js** — Title evaluation logic
- [x] **xpCurve.js** — XP requirements per level

### Game Systems (`src/systems/`)

- [x] **Archetype** — ArchetypeSystemRegistry, SystemBuilder
- [x] **Class** — ClassRegistry, ClassAbilityRegistry, RageSystem, ChiSystem
- [x] **Combat** — CombatSystem, StealthSystem
- [x] **Effects** — EffectSystem, EffectRegistry, EffectApplicationSystem, CharmSystem
- [x] **Exploration** — ExplorationSystem
- [x] **Generation** — ClassGenerator, ContentGenerator, NameGenerator, RaceGenerator, SkillGenerator
- [x] **Inventory** — InventorySystem
- [x] **Items** — ItemProcSystem, SetBonusSystem
- [x] **Leveling** — LevelingSystem, LevelingManager
- [x] **Loot** — LootSystem, AffixTierRegistry, affixStats
- [x] **Magic** — ManaSystem, ManaBalance
- [x] **Profession** — ProfessionRegistry
- [x] **Quest** — QuestManager (limited content)
- [x] **Race** — RaceRegistry, RaceAbilityRegistry, RaceSystem
- [x] **Skills** — SkillRegistry, SkillEvolutionSystem, SkillFusionSystem, SpellStudySystem, NonCombatSkillRegistry, TalentDefinitions, TalentManager, TalentRegistry
- [x] **Titles** — TitleSystem
- [x] **World** — TimeSystem, WorldInitializer
- [x] **DungeonGenerator.ts** — Cellular automata dungeon generation, 9 tile types, difficulty scaling
- [x] **PrestigeSystem.ts** — Soul shards, XP multipliers, 4 upgrade types, prestige reset

### Character System

- [x] **Character Creation** — Multi-step wizard (`CharacterGenesisUI_Enhanced.jsx`, `useCharacterCreationReworked.js`)
  - 8 creation panels: Identity → Race → Class → Archetype → Attributes → Skills → Talent → Summary
  - 20 races with stat bonuses, race abilities
  - 20 classes with abilities, resource systems (rage, chi, stealth)
  - Archetype system integration
  - EX-rank talent selection
  - Skill selection from class pool
- [x] **20 complete class skill sets** (20 active + 40 passive each = ~1,200 skills)
- [x] **Skill evolution, fusion, spell study, and non-combat skill systems**
- [x] **Talent system** — TalentDefinitions, TalentManager, TalentRegistry

### UI Components

**Components (`src/components/`)** — 22 files:
- [x] TitleUI, GameUI, CombatUI, CharacterGenesisUI_Enhanced
- [x] ClassAbilities, ClassResourceBar, RaceAbilities
- [x] EquipmentSlots, ExperienceBar, HudVitals, StatusEffects, StatusOverlay
- [x] MinionPanel, ProfessionUI, QuestTracker
- [x] ShopUI, GachaUI, SaveLoadUI, AuthUI
- [x] AdminTools, SystemLog, ErrorBoundary

**Advanced UI (`src/ui/`)** — 25 files:
- [x] **Modes** — CharacterCreationMode, GameMode
- [x] **Panels** — ActionSuggestions, CommandTerminal, Equipment, EquipmentSelection, Inventory, NarrativeHub, NarrativeLog, NarrativeMemory, Quest, StatusEffects, Vitals, CreationNarrative
- [x] **Creation Panels** — 8 step-based panels for character creation wizard
- [x] **Windowing** — DockZone, GameWindow, WindowManager, WindowRegistry, layoutPresets, useWindowLayout

### Data Layer (`src/data/`)

- [x] **DataRegistry.js** — Central registry
- [x] **StaticDataBootstrap.js** — Loads static data at boot
- [x] **5 typed registries** — Class, Enemy, Item, Race, World
- [x] **initialState.js** — Default game state
- [x] **gachaData, shopData, titleData, QuestCatalog, OpeningScenes**

### Entities & World

- [x] **Player.js, Enemy.js, ItemRegistry.js** (`src/entities/`)
- [x] **WorldDataRegistry.js, WorldInitializer.js** (`src/world/`)

### Simulation Engine (`src/simulation/`)

- [x] **SimulationKernel** (+ determinism variant) — Core simulation loop
- [x] **ActionResolver / ActionScheduler** (+ determinism variants) — Combat action resolution
- [x] **EffectEngine** — Status effect processing in simulation
- [x] **EventBus (TS)** — Typed event system
- [x] **CombatLogSerializer** — Log output formatting
- [x] **Validation** — basic.ts, schema.ts
- [x] **Bridge** — GameStateAdapter, SimulationBridge, SimulationContext

### API / Azure Functions (`api/`)

- [x] **narrate/** — NarratorAgent (env: `NARRATOR_AGENT_ID`)
- [x] **quest-create/** — QuestGiver (env: `QUEST_AGENT_ID`)
- [x] **factory-run/** — ContentSmith (env: `FACTORY_AGENT_ID`)
- [x] **runs/** — Game run management
- [x] **run-events/** — Run event tracking
- [x] **run-snapshots/** — State snapshots per run
- [x] **saves/** — Cloud save/load (Azure SQL)
- [x] **health/** — Health check
- [x] **static-data/** — Static data serving
- [x] **VoidverseFunction/** — Misc endpoint
- [x] **lib/** — auth, sql, azure-ai-utils, tracing, game-db, game-db-file, draft-store

### Persistence

- [x] **Azure SQL** — Schema in `api/sql/schema.sql`
  - Entra ID authentication (SWA / Easy Auth)
  - Cloud save/load, multiple slots
  - Run tracking, event logging, snapshots

### Observability

- [x] **OpenTelemetry** — `initTracing.node.js`, `traceShim.js` (OTLP exporter)
- [x] **API tracing** — `api/lib/tracing.js`

### Monorepo Packages

- [x] **@voidverse/game-core** — Shared engine code (core, systems, entities, data, simulation, utils, world, observability, constants)
- [x] **@voidverse/game-schemas** — Action + state schema definitions (TypeScript)

### Testing

- [x] **16 unit test files** covering: ActionDispatcher, DataRegistry, EffectEngine, GameSystems, InputValidator, InventorySystem, LevelingAndCombat, LocationResolution, NarrationGuards, PromptAssembler, SchemaValidation, SkillProgression, SystemBuilderPlatformNeutrality, TracingShim, WorldDataRegistry, WorldInitializer
- [x] **Jest** with `--experimental-vm-modules` (ESM support)

### DevOps & Tooling

- [x] **Docker** — Dockerfile, Dockerfile.api, Dockerfile.web, docker-compose.yml
- [x] **Azure SWA** — swa-cli.config.json, CNAME
- [x] **Scripts** — registry validation, middleware analysis, dependency graph generation, static data seeding, runtime config generation
- [x] **Simulation CLI** — `npm run simulate`, `simulate:quick`, `simulate:csv`, `simulate:full`

---

## Known Issues

### Medium Priority

- [x] ~~Mana doesn't regenerate outside of level-up (no passive regen)~~ — Fixed: `processTimeEffects` now runs on all non-combat turn-advancing actions; rest restores 25% HP/mana by default
- [x] ~~Skill cooldowns not visually displayed in UI~~ — Fixed: cooldowns shown in `ClassAbilities.jsx` and `CombatUI.jsx`
- [ ] Quest system has 21 quests (8 main + 13 side) but could use more varied quest chains

### Low Priority

- [ ] No sound effects or music
- [ ] No animation on combat actions
- [ ] Multiple `simulation_results_*.json` files in root (16 files; should be in output dir)

---

## Upcoming / Incomplete

- [ ] **Quest content** — Expand QuestCatalog with more varied quest chains and branching narratives
- [ ] **Universal skills** — Thousands of learnable cross-class skills
- [ ] **Equipment crafting** — Crafting system for gear
- [ ] **Class advancement/evolution** — Upgrade paths implementation
- [ ] **Advanced status effects** — Deeper effect interactions in combat
- [ ] **Sound & animation** — Sound effects, music, and combat animations

---

## Metrics

| Metric                | Value                                  |
| --------------------- | -------------------------------------- |
| Source files           | ~299                                   |
| Total lines of code   | ~75,000                                |
| React components      | 22 (`src/components/`)                 |
| UI panel components   | 25 (`src/ui/`)                         |
| Game system modules   | 20 directories, 40+ files              |
| Classes               | 20 (all complete)                      |
| Skills                | ~1,200 (20 active + 40 passive × 20)  |
| Azure Function endpoints | 10                                  |
| Unit test files       | 16                                     |
| Monorepo packages     | 2 (@voidverse/game-core, game-schemas) |

---

## Key Patterns

1. **Deterministic State Transforms** — Most mechanics are pure state transforms through `gameReducer.js`
2. **Immutable State** — Never mutate state directly; use reducers in `usegamestate.js`
3. **Config-Driven Balance** — Game constants in `state.config`; no magic numbers
4. **Systems should not generate prose** — `PromptAssembler` builds prompts from state + action results; narration goes through the narrate API
5. **Registry Architecture** — All data goes through typed registries (`src/data/registries/`)
6. **Event-Driven** — `EventBus` → `SystemEventObserver` → `SimulationContext` for cross-system communication

---

## Notes for AI Assistants

1. Check this file first to understand what exists
2. Reference `system_specs.md` for formulas and rules
3. Follow patterns in `.cursorrules`
4. Update this file when adding features
5. Use `state.config` for all game constants
6. Do not hardcode numeric values for game balance
7. Use the `systems` agent for work under `src/systems/**`
8. AI agent IDs come from env vars — never hardcode them
