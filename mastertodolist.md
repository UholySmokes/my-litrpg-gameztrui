# Project: my-litrpg-gameztrui (React / Vite)

Goal: Replace the cramped fixed 3-column UI with a modern modular window system where panels can dock / float / resize / collapse, while the Narrative panel is always visible on the right.

Core Requirement: Character Creation → transitions into Game UI using the same window system, with smart rearrangement.

Notes:
- Keep this plan in sync with actual implementation status.
- Mark completed items with ✅ only when delivered in code.

## 1) High-Level UI Concept
Implement a Window Manager + Docking Layout System that supports:
- ✅ ~~draggable panels~~
- ✅ ~~resizable panels~~
- ✅ ~~collapse/minimize~~
- ✅ ~~pin (always open)~~
- ✅ ~~docking (snap to left / right / center areas)~~
- ✅ ~~z-index focus (active window on top)~~
- ✅ ~~persistent layout storage (localStorage)~~
- ✅ ~~modes: Character Creation Mode + Game Mode~~
- ✅ ~~Narrative always visible as a fixed right dock panel with optional minimize width toggle but never fully removed.~~

## 2) UI Layout Structure
### 2.1 Root Frame Zones
Create a root layout with 3 zones:

**A) Left HUD Dock Zone**
- ✅ Fixed area aligned left, width ~ 280px to 340px
- ✅ Contains small anchored HUD panels in stack
- ✅ Panels here are always docked, not floating by default in Game Mode
- ✅ HUD panels include:
  - ✅ VitalsPanel (HP/MP/XP/resources bars)
  - ✅ EquipmentPanel (weapon/armor slots)
  - ✅ StatusEffectsPanel (buff/debuff icons + timer)
  - ✅ InventoryPanel (compact list + weight + quick slots)

**B) Center Command Deck Zone**
- ✅ Main area: flexible width
- ✅ This is your core gameplay surface
- ✅ Contains:
  - ✅ NarrativeLogPanel (scrollable)
  - ✅ CommandTerminalPanel (input box + exec button)
  - ✅ ActionSuggestionsPanel (chip buttons "Explore / Speak / Review / Train...")
- ✅ This center area should feel like a command bridge / terminal.

**C) Right Narrative Memory Zone**
- ✅ Must ALWAYS EXIST and be visible.
- ✅ Width: 340px-460px
- ✅ Contains:
  - ✅ NarrativeMemoryPanel (summaries, recent events, bookmarks)
- ✅ Allowed interactions:
  - ✅ minimize to thin rail width (like 80px)
  - ✅ pinned state stays across modes
  - ✅ never fully disappears

## 3) Modes: Character Creation Mode vs Game Mode
### 3.1 Character Creation Mode Layout
When Character Creation runs:
- ✅ Left side becomes Floating Modules
- ✅ Instead of one huge left panel, spawn modular windows:
- ✅ Floating creation panels:
  - ✅ RacePanel
  - ✅ ClassPanel
  - ✅ AttributeAllocationPanel
  - ✅ TalentPanel
  - ✅ SkillSelectionPanel
  - ✅ IdentityPanel (Name + Gender)
  - ✅ CreationSummaryPanel
- ✅ ALL are translucent panels
- ✅ each can be dragged, resized, collapsed
- ✅ user can rearrange them freely
- ✅ default layout: panels appear distributed across center-left area
- ✅ Narrative stays docked right
- ✅ NarrativeMemoryPanel on right is always visible
- ✅ Additionally, there is a Creation Narrative inside the center area:
  - ✅ a mini log describing the creation steps / world context
  - ✅ typewriter effect allowed
- ✅ Finalize Button
- ✅ One window (CreationSummaryPanel) includes Initialize Avatar
- ✅ On finalize:
  - ✅ transition mode -> Game Mode
  - ✅ trigger window reconfiguration animation (smooth reposition)

### 3.2 Game Mode Layout
When creation is completed:

**A) Left HUD Dock auto-build**
- ✅ The floating creation windows transform into small dock panels:
  - ✅ VitalsPanel dock left top
  - ✅ EquipmentPanel dock left under vitals
  - ✅ InventoryPanel dock left under equipment
  - ✅ StatusEffectsPanel dock left bottom
- ✅ Left dock becomes permanent HUD cluster.

**B) Center = Command Deck**
- ✅ Center contains:
  - ✅ NarrativeLogPanel (dominant height)
  - ✅ CommandTerminalPanel (bottom input)
  - ✅ ActionSuggestionsPanel (buttons row)

**C) Right Narrative Memory stays**
- ✅ Right memory panel remains unchanged.

**D) Additional Feature Panels appear as Floating Windows**
- ✅ Panels like:
  - ✅ QuestPanel
  - ✅ GachaPanel
  - ✅ CraftingPanel
  - ✅ TitlesPanel
  - ✅ ShopPanel
- ✅ should appear only when toggled from icons.
- ✅ They open as floating windows above the Command Deck and can be moved anywhere.

## 4) Window System Technical Requirements
### 4.1 Window Component Definition
Create a unified GameWindow component:

Props:
- ✅ id
- ✅ title
- ✅ icon
- ✅ defaultPosition {x,y}
- ✅ defaultSize {w,h}
- ✅ dockZone: "left" | "center" | "right" | "float"
- ✅ minWidth / minHeight
- ✅ isResizable
- ✅ isDraggable
- ✅ isCollapsible
- ✅ isPinned
- ✅ alwaysVisible (for Narrative panel)
- ✅ zIndex
- ✅ children

Must include:
- ✅ chrome header (title + icons)
- ✅ buttons: collapse / pin / close / dock
- ✅ fancy glow border + blur background

### 4.2 Dragging Behavior
- ✅ Dragging header moves window in float mode
- ✅ When dragged near left/right edges: show snap overlay
- ✅ Dropping window snaps/docks into that zone
- ✅ Dock rules:
  - ✅ left dock: stacks vertically, full dock width
  - ✅ right dock: only narrative allowed to occupy full zone
  - ✅ center dock: optional (Command Deck stays in center)

### 4.3 Resizing Behavior
- ✅ Resize handle bottom-right
- ✅ Must not resize beyond viewport bounds
- ✅ Must respect minWidth/minHeight
- ✅ Resizing works in float mode
- ✅ Docked windows may have fixed width and resizable height

### 4.4 Collapse/Minimize
- ✅ Collapsed window becomes:
  - ✅ header-only bar
  - ✅ remains in its zone
  - ✅ can be expanded again
- ✅ if docked left: collapsed panels stack as slim bars

### 4.5 Persistent Layout Storage
- ✅ Store per-mode layout in localStorage.
- ✅ Example storage keys:
  - ✅ layout_characterCreation
  - ✅ layout_gameMode
- ✅ Persist:
  - ✅ each window position/size
  - ✅ dock zone
  - ✅ collapsed state
  - ✅ pinned state
- ✅ On load:
  - ✅ restore layout if exists
  - ✅ else use default layout config

## 5) UI Style & Visual Language
Theme: Ultra-modern sci-fi / glass + neon holo

Look requirements:
- ✅ translucent glass panels with blur (backdrop-filter: blur(14px))
- ✅ soft glow borders (cyan + purple)
- ✅ subtle scanline effect allowed
- ✅ consistent spacing (no cramped panels)
- ✅ rounded corners 16px-22px
- ✅ smooth transitions 150-250ms
- ✅ focus glow on active window
- ✅ low contrast background with grid / particles

Typography:
- ✅ primary = modern UI font (Inter / system)
- ✅ terminal = monospace

Animations:
- ✅ window pop-in
- ✅ mode transition reflow animation
- ✅ dock snapping highlight
- ✅ subtle hover glows

## 6) Navigation + Panel Spawn System
- ✅ Add a compact icon toolbar (top or left edge of center zone) to toggle floating windows:

Buttons:
- ✅ ~~Quests~~
- ✅ ~~Gacha~~
- ✅ ~~Crafting~~
- ✅ ~~Titles~~
- ✅ ~~Shop~~
- ✅ ~~Status~~

Behavior:
- ✅ ~~click → open floating window (if closed)~~
- ✅ ~~click again → focus + bring to front~~
- ✅ ~~close button hides window but remembers last position~~

## 7) File Structure (Recommended)
- ✅ Implement in clean modules:

src/ui/windowing/
  WindowManager.jsx
  WindowRegistry.js
  GameWindow.jsx
  DockZone.jsx
  useWindowLayout.js
  layoutPresets.js

src/ui/panels/
  NarrativeMemoryPanel.jsx
  NarrativeLogPanel.jsx
  CommandTerminalPanel.jsx
  ActionSuggestionsPanel.jsx
  VitalsPanel.jsx
  EquipmentPanel.jsx
  InventoryPanel.jsx
  StatusEffectsPanel.jsx
  QuestPanel.jsx
  GachaPanel.jsx
  CraftingPanel.jsx
  TitlesPanel.jsx

src/ui/modes/
  CharacterCreationMode.jsx
  GameMode.jsx

## 8) Required UX: Not cramped ever again
Rules to enforce:
- ✅ no panel should contain scroll within scroll unless necessary
- ✅ in Character Creation mode, panels start medium sized and spread out
- ✅ important panel (Race/Class) should not be forced into narrow columns
- ✅ narrative must not overlap, must stay readable
- ✅ implement Focus Mode: double click a window = maximize it in center temporarily

## 9) Transition Between Modes (The Cool Part)
When player clicks Initialize Avatar:
- ✅ ~~animate floating windows smoothly into dock positions~~
- ✅ ~~fade out creation-only panels~~
- ✅ ~~fade in game HUD panels~~
- ✅ ~~keep narrative continuous (no blank screen)~~
- ✅ ~~keep memory panel unchanged~~

## 10) Success Criteria Checklist
- ✅ ~~Narrative panel always visible on right~~
- ✅ ~~Character creation is modular, draggable, resizable~~
- ✅ ~~Game UI uses same system with left dock HUD and center command deck~~
- ✅ ~~Extra panels open as floating windows~~
- ✅ ~~Layout persists between sessions~~
- ✅ ~~No cramped fixed 3-column layout~~
- ✅ ~~Modern high-tech vibe~~

## 11) Narrative Pipeline Hardening (In Progress)
Goal: Make narrative flow consistent, safe, and bounded.

Tasks:
- ⬜ Audit narrative log flows and ordering (chatLog vs narrative.chatLog)
- ⬜ Define unified narrative log schema + migration path
- ⬜ Add prompt history bounds + stable ordering (PromptAssembler)
- ⬜ Harden AIService fallbacks/timeouts + response format consistency
- ⬜ Refresh narrative summary cadence + UI memory consistency
