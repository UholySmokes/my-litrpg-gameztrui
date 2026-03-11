# Worldbuilding System Audit Report

**Date:** 2026-02-28  
**Scope:** Character Classes, Races, Skills, Magic, Professions, Crafting, Items  
**Codebase Version:** Current  

## 1. Executive Summary

The codebase exhibits a rich and ambitious worldbuilding design with over 20 distinct classes, races, and profession systems. However, the implementation suffers from **extreme architectural coupling**, particularly within the `CombatSystem.js` "God Class" and the fragmented logic between UI components and the core reducer.

While the *content* is vast (hundreds of skills, items, and recipes), the *systems* that drive them are fragile. Adding new content requires modifying core files, increasing the risk of regression bugs. The economy and crafting systems are largely disconnected from the core gameplay loop, relying on manual event dispatching rather than a unified event bus or system manager.

**Critical Risk:** The current architecture will not scale to a production-level RPG without significant refactoring to decouple systems.

---

## 2. System Architecture & Coupling

### 2.1 The "God Class" Problem: `CombatSystem.js`
The `CombatSystem.js` file is the most critical failure point. It manually imports and orchestrates logic for every single subsystem.

*   **Direct Dependency:** It imports `RageSystem`, `ChiSystem`, `StealthSystem`, `ManaSystem`, `CharmSystem`, `TimeSystem`, `ItemProcSystem`, etc.
*   **Hardcoded Logic:** 
    *   Resource management uses a switch statement (`case "mana"`, `case "rage"`, `case "chi"`) instead of a polymorphic resource interface.
    *   Turn processing has specific `if` checks for race traits (e.g., `entity.race?.id === "undead_awakened"`).
*   **Consequence:** Adding a new class with a unique resource (e.g., "Faith") requires modifying `CombatSystem.js` in multiple places (resource gain, consumption, display, turn start, turn end).

### 2.2 UI-Coupled Logic
Significant game logic resides in React components rather than the game engine.

*   **Crafting:** The validation of ingredients and the decision to award XP happens in `ProfessionUI.jsx` (UI layer), not in a `CraftingSystem`.
*   **Quest Triggers:** Quests are updated via `progressQuestObjectives` in the reducer, but specific actions like crafting do not automatically trigger this check unless manually dispatched.

---

## 3. Data Flow & Consistency

### 3.1 Stat Flow
*   **Race -> Stats:** `RaceSystem.js` applies stat bonuses correctly on level up.
*   **Class -> Stats:** Class bonuses are applied via `LevelingManager.js`.
*   **Items -> Stats:** `CombatSystem.js` calculates derived stats (Attack, Defense) on the fly.
*   **Inconsistency Risk:** There is no single "source of truth" for a player's *effective* stats. UI components often calculate stats differently than the combat engine.

### 3.2 Resource Management Patterns
Resources are handled inconsistently:
*   **Mana:** Has a dedicated `ManaSystem.js` with complex validation and feedback.
*   **Rage/Chi/Energy:** Handled by smaller, isolated systems but integrated manually into `CombatSystem`.
*   **Cooldowns:** Managed via `TalentManager.js` but often bypassed by direct state mutations in the reducer.

---

## 4. Economy & Crafting Integration

### 4.1 Fragmented Crafting
*   **Registry:** `ProfessionRegistry.js` contains excellent data (recipes, tiers).
*   **Execution:** `gameReducer.js` handles the raw item swap (ingredients -> result).
*   **Missing Logic:**
    *   No "quality" check based on skill level.
    *   No "failure chance" or "crit success" (e.g., crafting 2x items).
    *   No integration with `InventorySystem` capacity checks (player can craft even if inventory is full, potentially losing items).

### 4.2 Economy Disconnect
*   **Gold Sinks:** Shops exist, but prices are static.
*   **Dynamic Economy:** No system exists to adjust prices based on supply/demand or region.

---

## 5. Failure Points & Design Pitfalls

1.  **Race Condition in Effects:** `processEntityTurnEffects` in `CombatSystem.js` modifies HP directly. If multiple effects trigger simultaneously (e.g., specific item procs + DOTs), state updates might overwrite each other if not batched correctly.
2.  **Hardcoded Race Checks:** The code contains literal string checks like `if (race.id === "undead_awakened")`. Renaming a race ID in the registry will silently break combat mechanics.
3.  **Infinite Proc Loops:** `ItemProcSystem` can trigger damage, which can trigger `CombatSystem`, which can trigger `ItemProcSystem` again. There is no depth limiter on this recursion.
4.  **Save/Load Fragility:** The "God Class" approach means that if the save data structure changes for *one* system (e.g., how `rage` is stored), the entire `CombatSystem` might fail to load the character.

---

## 6. Recommendations

### 6.1 Architecture Refactoring
*   **Introduce `System` Interface:** Create a standard interface for all gameplay systems (`onTurnStart`, `onTurnEnd`, `onAction`, `onDamage`).
*   **Event Bus for Combat:** Replace direct imports in `CombatSystem` with an event-driven model.
    *   *Current:* `RageSystem.gainRage(player)`
    *   *Proposed:* `EventBus.emit("combat:damage_dealt", { source: player, amount: 10 })` -> `RageSystem` listens and updates state.
*   **Unified Resource Manager:** Create a `ResourceManager` that handles *any* resource defined in a registry, removing the switch statements from `CombatSystem`.

### 6.2 Logic Migration
*   **Move Logic out of UI:** Move `handleCraft` from `ProfessionUI.jsx` to a new `CraftingSystem.js`.
*   **Centralize Stat Calculation:** Create a `StatCalculator` service that takes a player state and returns *all* effective stats, used by both UI and Combat.

### 6.3 Mechanics & Balance
*   **Standardize Effects:** Convert all race/class mechanics into standard `StatusEffects`. Instead of hardcoding "Undead takes damage from heal", give Undead a permanent `StatusEffect` called `UNDEAD_PHYSIOLOGY` that intercepts heal events.
*   **Implement Crafting Depth:** Add `quality` output to crafting based on the difference between `skillLevel` and `recipeDifficulty`.

### 6.4 Reliability
*   **Unit Tests:** Create unit tests specifically for `CombatSystem` integrations (e.g., "Ensure Rage is gained when damage is dealt").
*   **Registry Validation:** Add a startup check that ensures all IDs referenced in code (e.g., "undead_awakened") actually exist in `RaceDataRegistry`.

---

## 7. Conclusion

The "Voidverse" RPG has a strong creative foundation but a brittle technical skeleton. The current "monolithic combat handler" pattern was likely sufficient for a prototype but is now a liability. Transitioning to an **Event-Driven Architecture (EDA)** and a **Component-Entity-System (CES)** hybrid approach is the necessary next step to ensure the game is maintainable, scalable, and bug-free.
