# Godot Pixel RPG - Art Deliverables List

## 1. Project Overview & Specs
- **Engine:** Godot 4.x
- **Perspective:** Top-down (Zelda-like or Stardew-like)
- **Grid Size:** 32x32 pixels
- **Resolution:** Pixel-perfect 1x (no baked scaling)
- **Format:** Aseprite source (`.ase`) + Exported PNG Sheets
- **Palette:** [Artist's Choice / Provide Reference] - Consistent contrast across all assets.
- **Lighting:** Assumed global light (e.g., top-left source) for shadows.

## 2. Characters (32x32 base)

### Player Character ("The Traveler")
- **Style:** Heroic but humble, distinct silhouette.
- **Animations (4 directions: Up, Down, Left, Right):**
  - `Idle` (4 frames)
  - `Walk` (8 frames)
  - `Interact/Reach` (4-6 frames)
  - `Attack/Swing` (6 frames) - *Future-proofing for combat*
  - `Hurt/Hit` (4 frames)
  - `Death/Collapse` (6-8 frames)

### NPC: The Guide
- **Style:** Mysterious, robed or distinct attire, visibly different from player.
- **Animations (4 directions):**
  - `Idle` (4-6 frames) - Breathing, looking around.
  - `Walk` (8 frames) - For following or pacing.
  - `Talk` (4 frames) - Mouth movement or gesture.

### Enemies (Basic Set)
- **Slime / Blob:**
  - `Idle`, `Move` (bounce), `Attack` (lunge), `Hurt`, `Death` (splat).
- **Shadow Construct:**
  - `Idle` (floating/pulsing), `Move`, `Attack`, `Death` (dissolve).

## 3. Environment & Tilesets (32x32)

### Village Square (Hub)
- **Ground:** Cobblestone, Dirt path, Grass (with transitions/autotile bitmasks).
- **Walls/Fences:** Wooden fence, Stone low-wall.
- **Water:** Simple pond/fountain tiles (animated 4-8 frames).
- **Props:**
  - Wooden Bench (2 angles)
  - Street Lamp (Lit/Unlit versions)
  - Wooden Crates (Single, Stacked)
  - Signpost (Blank, Written)
  - Barrels
  - Market Stall (Empty/Full)

### Training Glade (Nature)
- **Ground:** Forest floor, Thick grass, Dirt patches.
- **Vegetation:**
  - Trees (Oak/Pine - 64x64 or larger base, transparency for behind-play)
  - Bushes (destructible variant optional)
  - Rocks/Boulders
- **Cliffs/Edges:** Earth/Grass cliff edges (autotile compatible).

### Ruined Outlook (Dungeon/Ancient)
- **Ground:** Cracked stone tiles, Overgrown stone.
- **Walls:** Ancient stone walls (crumbling variants).
- **Props:**
  - Rubble piles
  - Broken pillars
  - Ancient statues (intact & broken)

## 4. Special Objects & Interactables

### Functional Objects
- **Encounter Gate (Portal):**
  - Idle (pulsing energy) - 8 frames.
  - Active/Open - 8 frames.
  - Closed/Dormant.
- **Save Crystal (Village):**
  - Floating/Rotating crystal animation (blue/gold) - 16 frames loop.
- **Save Obelisk (Ruins):**
  - Stone structure with glowing runes (pulsing) - 8 frames.
- **Chest/Loot Container:**
  - Closed, Opening (anim), Open.

## 5. Visual Effects (VFX)
*Keep these on separate sheets, additive-friendly if needed.*

- **Transition/Teleport:** Swirl or flash for entering gates.
- **Save Effect:** Rising particles or pillar of light when saving.
- **Impact/Hit:** Generic hit spark (for combat feedback).
- **Emotes (Pop-ups):**
  - `!` (Alert/Quest)
  - `?` (Confused)
  - `...` (Thinking)
  - `Heart` (Heal/Bond)

## 6. UI & HUD

### Interface Elements
- **Dialog/Prose Panel:**
  - 9-slice frame background (Paper/Parchment style).
  - Corner decorations.
- **Command Terminal:**
  - Dark/Tech or Magitech frame style (9-slice).
  - Blinking cursor block.
- **Health/Mana Bars:**
  - Empty container, Full fill, Decor borders.

### Icons (16x16 or 24x24 within 32x32 canvas)
- **Actions:** Sword (Attack), Hand (Interact), Door (Exit), Scroll (Quest).
- **Inventory:** Potion, Map, Key, Coin.

### Cursors
- **Pointer:** Standard arrow (Normal, Click/Press).
- **Hover:** Hand or Highlight reticle.
- **Text:** I-beam (for command terminal).

## 7. Deliverable Format Checklist
- [ ] **Source:** `.ase` or `.psd` files organized by category.
- [ ] **Export:** `.png` sprite sheets (transparent background).
- [ ] **Structure:**
  - `/characters/{name}_{action}_{dir}.png`
  - `/tilesets/{theme}_atlas.png`
  - `/props/{item_name}.png`
  - `/ui/{element}_sheet.png`
- [ ] **License File:** Included `LICENSE` or `NOTICE` text file specifying rights.
