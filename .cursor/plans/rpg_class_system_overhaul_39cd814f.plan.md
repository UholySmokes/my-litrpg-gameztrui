---
name: RPG Class System Overhaul
overview: Transform the game from trash-tier classes to RPG-style classes (Knight, Mage, Assassin, etc.) with a comprehensive skill system featuring 4 active skills (from 20) and 12 passive skills (from 40) per class, skill levels 1-10, and upgrade/evolution/fusion mechanics. Expand the HP window to a full sidebar system interface with detailed status display.
todos:
  - id: todo-1767613764164-nkex6igo0
    content: ""
    status: pending
  - id: todo-combat-1
    content: Create enemy database (src/lib/enemyData.js) with enemy templates, stats, skills, and drop tables
    status: completed
  - id: todo-combat-2
    content: "Implement combat logic functions in gamelogic.js: calculateDamage, startCombat, playerAttack, enemyAttack, processEnemyTurns, handleEnemyDefeat, endCombat, escapeCombat"
    status: completed
  - id: todo-combat-3
    content: Create CombatUI component (src/components/CombatUI.jsx) to display enemies, combat log, and action buttons
    status: completed
  - id: todo-combat-4
    content: "Integrate combat system with GameUI: add CombatUI display, handle combat actions, update executeAction for attack case"
    status: completed
  - id: todo-combat-5
    content: Update action parser to handle combat commands (attack, use skill, escape)
    status: completed
  - id: todo-combat-6
    content: "Add combat rewards system: XP distribution, item drops, gold rewards"
    status: completed
  - id: todo-shop-1
    content: Create shop database (src/lib/shopData.js) with items, skills, upgrades, materials, and services
    status: completed
  - id: todo-shop-2
    content: Create ShopUI component (modal overlay) and integrate with system interface sidebar (always accessible)
    status: completed
  - id: todo-shop-3
    content: Add currency system to game state (Gold Coins and Soulpoints) and implement purchase/sell logic
    status: completed
  - id: todo-gacha-1
    content: Create gacha database (src/lib/gachaData.js) with pools, rates, and rarity tiers
    status: completed
  - id: todo-gacha-2
    content: Create GachaUI component (modal overlay, always accessible from sidebar) and implement pull mechanics with Gold Coins/Soulpoints
    status: completed
  - id: todo-quest-1
    content: Create QuestLogUI component to display active and completed quests
    status: completed
  - id: todo-quest-2
    content: Add quest log section to system interface sidebar
    status: completed
  - id: todo-title-1
    content: Create title database (src/lib/titleData.js) with titles, secondary bonuses (unlocked), main bonuses (equipped), and unlock conditions
    status: completed
  - id: todo-title-2
    content: Create TitleUI component and add title management to game state (only one title can be equipped at a time)
    status: completed
  - id: todo-title-3
    content: Implement title purchase (Gold Coins/Soulpoints), unlock, and equip functionality with stacking bonuses (secondary always active, main when equipped)
    status: completed
  - id: todo-actions-1
    content: Implement AI-generated action suggestion system (6 clickable buttons, primary interaction method, updates after every action)
    status: completed
  - id: todo-actions-2
    content: Add action buttons to bottom of narrative text window (alongside text input) with click handlers
    status: completed
  - id: todo-rewind-1
    content: Add state history tracking (previousState) to game state
    status: completed
  - id: todo-rewind-2
    content: Implement rewind functionality with single-step limit and disabled state at start
    status: completed
  - id: todo-rewind-3
    content: Add rewind button to UI with proper disabled states and validation
    status: completed
---

# RPG Class System Overhaul

## Overview

Transform the class system from "trash tier" jobs to traditional RPG classes with an expanded skill system, skill progression (levels 1-10), and a comprehensive system interface sidebar.

## Files to Modify

### 1. Class System Updates

- **[src/lib/characterData.js](src/lib/characterData.js)**: Replace 20 trash-tier classes with RPG classes (mix of traditional and unique)
  - Update class definitions with RPG-appropriate names and descriptions
  - Each class should have upgrade paths defined for future implementation

### 2. Skill System Overhaul

- **Create [src/lib/skills.js](src/lib/skills.js)**: New comprehensive skill database
  - **Class Skills (Starting Skills)**:
    - Define 20 active skills per class (players see 4 choices during creation)
    - Define 40 passive skills per class (players see 12 choices during creation)
    - These are the skills available during character creation
  - **Universal Skills (Learnable Skills)**:
    - Database structure to support thousands of additional skills
    - Skills can be learned through gameplay when conditions are fulfilled
    - Each skill has: id, name, description, type (active/passive), class (or 'universal'), level (1-10), unlockConditions, upgradeCost, evolutionPath, fusionCompatibility
    - Unlock conditions can include: level requirement, quest completion, item possession, skill prerequisites, location, NPC interaction, etc.
  - Skills can be upgraded (increase level 1-10), evolved (transform to better version), or fused (combine skills)
  - Structure supports both class-specific and universal skills

- **[src/lib/characterData.js](src/lib/characterData.js)**: Update skill database structure
  - Modify `skillsDatabase` to reference the new skills system
  - Update `getSkillsByClass()` to return 4 active and 12 passive skills (randomly selected from full pool)
  - Add helper functions to query learnable skills based on unlock conditions

### 3. Game State Updates

- **[src/lib/gamestate.js](src/lib/gamestate.js)**: Update player abilities structure
  - Change `abilities` array to include skill levels
  - Add skill upgrade/evolution/fusion tracking
  - Track learned skills separately from available skills
  - Structure: `{ id, name, type, level, class, source (class/learned), canUpgrade, canEvolve, canFuse }`
  - Add `availableSkills` array to track skills that can be learned (conditions met but not yet learned)

### 4. Character Creation Updates

- **[src/components/CharacterCreation.jsx](src/components/CharacterCreation.jsx)**: Update skill selection UI
  - Show all available skills (4 active, 12 passive) but maintain selection limits
  - Display skill descriptions and previews
  - Add visual indicators for skill levels (even though starting at level 1)

### 5. System Interface Sidebar

- **[src/components/gameui.jsx](src/components/gameui.jsx)**: Complete sidebar overhaul
  - Expand `status-hud` to full sidebar width
  - Replace simple HP display with comprehensive system interface
  - Add scrollable container for system interface
  - Implement health and mana bars (both with visual bars like current HP bar)
  - Add Save/Load and Exit Local Game buttons at bottom
  - **Add new sections to system interface:**
    - **[SHOP]** - Access shop system (items, skills, equipment upgrades, materials, services)
    - **[GACHA]** - Access gacha system (equipment, skills, random items)
    - **[QUEST LOG]** - Display active and completed quests with objectives
    - **[TITLE SYSTEM]** - Show current title, available titles, and title bonuses
  - Format matches exact specification:
    ```
    [SYSTEM INTERFACE]
    [STATUS: <Name>]
    --------------------------------------------------
    Level:  <#> (XP: <Current>/<Max>)   Title: <Current Title>
    Race:   <Race>        (Current Evolution Stage)
    Class:  <Class>
    Talent: <Unique Cheat>
    --------------------------------------------------
    [VITALITY]
    Health: <Current>/<Max>      Mana: <Current>/<Max>
    
    [ATTRIBUTES] (Free Points: <#>)
    > Strength:      <#>  (Physical power)
    > Agility:       <#>  (Speed/Dodge)
    > Dexterity:     <#>  (Precision/Crafting)
    > Intelligence:  <#>  (Magic/Learning)
    > Charisma:      <#>  (Influence)
    > Will:          <#>  (Mental Defense/Pressure)
    > Luck:          <#>  (Drop Rate/Crit)
    > Soul Strength: <#>  (Psychic/Focus)
    
    [ABILITIES]
  - <Active Skill Name> (Lvl <#>)
  - <Passive Skill Name> (Lvl <#>)
    
    [INVENTORY]
  - <Weapon/Armor/Items>
    ```


### 6. Status Renderer Update

- **[src/util/statusrenderer.js](src/util/statusrenderer.js)**: Update to match new format
  - Update `renderstatusblock()` to output the exact format specified
  - Include skill levels in abilities list
  - Format evolution stage correctly

### 7. Skills Management Interface (Future)

- **Create [src/components/SkillsMenu.jsx](src/components/SkillsMenu.jsx)**: New component for skill management
  - Display all learned skills with current levels
  - Show available skills that can be learned (conditions fulfilled)
  - Show locked skills with their unlock conditions (for reference)
  - Upgrade interface (spend resources to increase level 1-10)
  - Evolution interface (transform skills to evolved versions)
  - Fusion interface (combine compatible skills)
  - Learn new skills interface (when conditions are met)
  - Search/filter functionality for thousands of skills
  - This will be a separate menu accessible from the main UI

### 8. Shop System

- **Create [src/lib/shopData.js](src/lib/shopData.js)**: Shop database
  - Define shop inventory with items, skills, equipment upgrades, materials, and services
  - Items include: potions, consumables, equipment
  - Skills available for purchase
  - Equipment upgrade/enhancement services
  - Crafting materials
  - Services: repair, identify, etc.
  - Currency system (to be specified - placeholder for gold/gems/tokens)

- **Create [src/components/ShopUI.jsx](src/components/ShopUI.jsx)**: Shop interface component
  - Display available items with prices
  - Filter by category (items, skills, upgrades, materials, services)
  - Purchase functionality
  - Currency display (Gold Coins and Soulpoints)
  - Integration with inventory system
  - **Access**: Always accessible from sidebar (modal overlay)

- **[src/lib/gamestate.js](src/lib/gamestate.js)**: Add currency to player state
  - Add currency object to track different currency types
  - Structure: `{ goldCoins: 0, soulpoints: 0 }`
  - Gold Coins: Primary currency for shop purchases
  - Soulpoints: Secondary currency for gacha and premium purchases

- **[src/lib/gamelogic.js](src/lib/gamelogic.js)**: Add shop transaction functions
  - `purchaseItem(state, itemId, currencyType)` - Handle purchases
  - `sellItem(state, itemId)` - Handle selling items
  - Currency validation and deduction

### 9. Gacha System

- **Create [src/lib/gachaData.js](src/lib/gachaData.js)**: Gacha pools and rates
  - Define gacha pools (equipment, skills, items)
  - Rarity tiers (common, uncommon, rare, epic, legendary)
  - Drop rates for each tier
  - Special banners/events support

- **Create [src/components/GachaUI.jsx](src/components/GachaUI.jsx)**: Gacha interface component
  - Display available gacha pools
  - Show drop rates
  - Single pull and multi-pull options
  - Animation/display for pulls
  - Results display with rarity colors
  - **Access**: Always accessible from sidebar (modal overlay)
  - **Currency**: Uses Gold Coins and/or Soulpoints (depending on pool)

- **[src/lib/gamelogic.js](src/lib/gamelogic.js)**: Add gacha functions
  - `performGachaPull(state, poolId, pullCount)` - Execute gacha pull
  - `calculateGachaResult(poolId, pullCount)` - Determine rewards based on rates
  - Currency cost handling

### 10. Quest Log System

- **[src/lib/gamestate.js](src/lib/gamestate.js)**: Enhance quest system
  - Quest structure already exists, ensure it supports:
    - Active quests with objectives
    - Completed quests history
    - Quest rewards (XP, items, titles, currency)
    - Quest prerequisites

- **Create [src/components/QuestLogUI.jsx](src/components/QuestLogUI.jsx)**: Quest log interface
  - Display active quests with progress
  - Show completed quests
  - Quest details: objectives, rewards, description
  - Progress indicators for objectives
  - Filter by active/completed

- **[src/components/gameui.jsx](src/components/gameui.jsx)**: Add quest log section to system interface
  - Show active quests in sidebar
  - Quick access to quest details

### 11. Title System

- **Create [src/lib/titleData.js](src/lib/titleData.js)**: Title database
  - Define titles with:
    - id, name, description
    - How to obtain (purchase, achievement, quest reward, etc.)
    - **Secondary bonus**: Small stat bonus when title is unlocked (always active, stacks)
    - **Main bonus**: Grander stat bonus when title is equipped (only active when equipped)
    - Unlock conditions
    - Purchase cost (if purchasable) - uses Gold Coins or Soulpoints

- **[src/lib/gamestate.js](src/lib/gamestate.js)**: Add title tracking
  - `currentTitle` - Currently equipped title (only one can be equipped at a time)
  - `unlockedTitles` - Array of unlocked title IDs (all provide secondary bonuses)
  - `availableTitles` - Titles that can be purchased/unlocked
  - Title bonuses stack: All unlocked titles provide secondary bonuses, equipped title provides main bonus
  - When title is unequipped, main bonus is removed but secondary bonus remains

- **Create [src/components/TitleUI.jsx](src/components/TitleUI.jsx)**: Title management interface
  - Display current title
  - Show available titles (unlocked and purchasable)
  - Equip/change title functionality
  - Purchase titles with currency
  - Show title bonuses

- **[src/lib/gamelogic.js](src/lib/gamelogic.js)**: Add title functions
  - `unlockTitle(state, titleId)` - Unlock title through achievement/quest (applies secondary bonus)
  - `purchaseTitle(state, titleId, currencyType)` - Purchase title with Gold Coins or Soulpoints (applies secondary bonus)
  - `equipTitle(state, titleId)` - Equip title and apply main bonus (only one title can be equipped, unequips previous)
  - `unequipTitle(state)` - Unequip current title (removes main bonus, keeps secondary bonuses)
  - `calculateTitleBonuses(state)` - Calculate total stat bonuses: all unlocked titles (secondary) + equipped title (main)

- **[src/components/gameui.jsx](src/components/gameui.jsx)**: Add title section to system interface
  - Display current title in status section
  - Link to title management

### 12. Auto-Generated Action Options

- **[src/components/gameui.jsx](src/components/gameui.jsx)**: Add action suggestion system
  - Display 6 clickable action buttons at bottom of narrative text window
  - **Placement**: Alongside text input (not replacing it)
  - **Primary interaction**: Action buttons are the primary way to interact
  - **Update frequency**: Update after every action (regenerate suggestions based on new state)
  - Actions are AI-generated based on current narrative context
  - Buttons trigger the action when clicked (same as typing the command)
  - Actions update dynamically based on game state and narrative

- **[src/hook/useNarrative.js](src/hook/useNarrative.js)**: Enhance to generate action suggestions
  - Add function to generate 6 context-aware action options
  - **Update trigger**: Regenerate suggestions after every action/state change
  - Use AI to suggest relevant actions based on:
    - Current location
    - Available items
    - Active quests
    - Narrative context
    - Combat status
  - Return action suggestions that can be clicked
  - Suggestions should be the primary interaction method (text input still available)

- **Action Button Component**: Create reusable action button component
  - Styled to match game UI
  - Click handler that submits action to game engine
  - Disabled state for invalid actions

### 13. Rewind System

- **[src/lib/gamestate.js](src/lib/gamestate.js)**: Add state history tracking
  - `previousState` - Store the state before last action
  - Only store one previous state (not full history)
  - Initialize as null at game start

- **[src/lib/gamelogic.js](src/lib/gamelogic.js)**: Add rewind functions
  - `saveStateForRewind(state)` - Save current state before action
  - `rewindLastAction(state)` - Restore previous state
  - Validation: Cannot rewind if no previous state exists

- **[src/components/gameui.jsx](src/components/gameui.jsx)**: Add rewind button
  - Place rewind button near action options
  - Disabled when:
    - At game start (no previous state)
    - Already rewound once (can only rewind one step)
  - Visual indicator when disabled
  - Confirmation dialog before rewinding (optional)

- **[src/hook/usegamestate.js](src/hook/usegamestate.js)**: Integrate state saving
  - Save state before executing actions
  - Handle rewind action
  - Clear previous state after successful rewind (prevent double rewind)

## Implementation Details

### Class Examples (20 total, mix of traditional and unique)

- Traditional: Knight, Mage, Assassin, Warrior, Rogue, Priest, Paladin, Ranger, Monk, Bard
- Unique: Shadowblade, Arcane Knight, Battlemage, Necromancer, Druid, Berserker, Warlock, Shaman, etc.

### Skill Selection Logic

- On class selection, randomly select 4 active skills from 20 available
- Randomly select 12 passive skills from 40 available
- Player can see all available options but must select 1 active and 3 passive

### Skill Progression

- All skills start at level 1
- Can be upgraded to level 10 (requires resources/XP)
- Evolution: Transform skill to better version (e.g., "Fireball" → "Greater Fireball")
- Fusion: Combine two compatible skills into one powerful skill

### Universal Skills System

- Thousands of skills available beyond class skills
- Skills have unlock conditions (level, quest, item, location, NPC, prerequisite skills, etc.)
- Skills can be learned when conditions are fulfilled
- Skills database structure must support efficient querying of available skills based on current game state
- Skills menu will show: Learned Skills, Available to Learn, Locked (with conditions)

### UI Layout Changes

- Sidebar expands to full width (currently 25%, should be ~30-35% for better readability)
- Center narrative area adjusts accordingly
- System interface is scrollable with fixed header/footer
- Health and Mana bars use same visual style as current HP bar

## Testing Considerations

- Verify all 20 classes have proper skill pools
- Test skill selection in character creation
- Verify system interface displays all data correctly
- Test scrolling in sidebar
- Verify save/load buttons work correctly at bottom
- Test skill unlock condition checking
- Verify skills database can efficiently query thousands of skills
- Test skills menu with large skill database
- Test shop purchase/sell functionality
- Test gacha pull mechanics and rates
- Verify quest log displays correctly
- Test title system: purchase, unlock, equip, bonuses
- Test action suggestion generation and clicking
- Test rewind functionality (single step, disabled states)

## New Features Implementation Details

### Shop System

- **Items**: Potions, consumables, equipment
- **Skills**: Available skills for purchase
- **Upgrades**: Equipment enhancement services
- **Materials**: Crafting materials
- **Services**: Repair, identify, etc.
- **Currency**: Gold Coins (primary) and Soulpoints (secondary/premium)
- **Access**: Always accessible from sidebar, opens as modal overlay

### Gacha System

- **Pools**: Equipment, skills, random items
- **Rarity Tiers**: Common, Uncommon, Rare, Epic, Legendary
- **Mechanics**: Single pull and multi-pull options
- **Currency**: Uses Gold Coins and/or Soulpoints (depending on pool)
- **Access**: Always accessible from sidebar, opens as modal overlay

### Quest Log

- **Display**: Active quests with objectives and progress
- **History**: Completed quests
- **Integration**: Accessible from system interface sidebar

### Title System

- **Obtainment**: Purchase (Gold Coins/Soulpoints), achievements, quest rewards
- **Bonus System**:
  - **Secondary Bonus**: All unlocked titles provide small stat bonuses (always active, stack with each other)
  - **Main Bonus**: Only equipped title provides grander stat bonus (only one title can be equipped at a time)
  - Bonuses stack with other bonuses (equipment, skills, etc.)
  - When title is unequipped, main bonus is removed but secondary bonus remains
- **Management**: Equip/change titles (only one at a time), view available titles
- **Display**: Current title shown in status section

### Auto-Generated Action Options

- **Count**: 6 clickable action buttons
- **Location**: Bottom of narrative text window, alongside text input
- **Primary Interaction**: Action buttons are the primary way to interact (text input still available)
- **Update Frequency**: Regenerate after every action/state change
- **Generation**: AI-generated based on current narrative context
- **Functionality**: Clicking button executes action (same as typing the command)

### Rewind System

- **Limitation**: Can only rewind one step back
- **Disabled States**: 
  - At game start (no previous state)
  - After rewinding once (cannot rewind twice)
- **Scope**: Restores last action/choice only
- **UI**: Rewind button with visual disabled state

## Clarifications and Specifications

### Currency System

- **Gold Coins**: Primary currency for shop purchases, general transactions
- **Soulpoints**: Secondary/premium currency for gacha and premium purchases
- Both currencies tracked in player state: `{ goldCoins: 0, soulpoints: 0 }`

### Shop & Gacha Access

- **Always Accessible**: Both shop and gacha are always accessible from the sidebar
- **Modal Overlays**: Both open as modal overlays (not separate screens)
- No location/NPC restrictions

### Title System Details

- **Secondary Bonus**: All unlocked titles provide small stat bonuses (always active, stack with each other)
- **Main Bonus**: Only equipped title provides grander stat bonus
- **Equip Limit**: Only one title can be equipped at a time
- **Bonus Stacking**: Title bonuses stack with other bonuses (equipment, skills, etc.)
- **Unequip Behavior**: When title is unequipped, main bonus is removed but secondary bonus remains active

### Action Options System

- **Count**: 6 clickable action buttons
- **Placement**: Bottom of narrative text window, alongside text input (not replacing it)
- **Primary Interaction**: Action buttons are the primary way to interact
- **Update Frequency**: Regenerate after every action/state change
- **Generation**: AI-generated based on current narrative context
- Text input remains available as alternative input method

### Rewind System

- **Single Step Only**: Can only rewind one step back
- **Disabled When**: 
  - At game start (no previous state exists)
  - After rewinding once (cannot rewind twice in a row)
- **Scope**: Restores last action/choice only