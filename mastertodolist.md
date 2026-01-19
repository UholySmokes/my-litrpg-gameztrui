# Master TODO List

1. **Core schema migration** ✅
   - Update `initialState`, `useCharacterCreationReworked`, and `CharacterGenesisUI_Enhanced` to emit canonical attribute keys.
2. **Normalization layer** ✅
   - Flip `AttributeMath` alias map to canonical-first and align RaceSystem (initial stats + growth).
3. **Gameplay systems** ✅
   - Update LevelingManager and combat/class systems to consume canonical stats and recompute HP/Mana via AttributeMath.
4. **UI + renderers** ✅
   - HUD (HudVitals/ClassResourceBar) + EquipmentSlots consume canonical attributes via AttributeMath.
   - CharacterGenesis selection summary renders skill descriptions + rank metadata.
   - Loadout toggle + StatusOverlay provide canonical vitals, derived stats, and tooltip-rich summaries.
   - ASCII `statusrenderer` now mirrors AttributeMath output; right-column SystemLog replaced by the unified Command Feed.

5. **Data/guides & verification** *(in progress)*
   - Run a post-migration smoke pass (character creation → quest handoff, combat loop, crafting) and log findings.
   - Align generators/spec docs + README/UI integration notes with canonical attribute architecture.
   - Capture updated screenshots/UX notes for Loadout, StatusOverlay, and Command Feed.
   - Verify ProfessionUI ingredient counter across existing recipes and flag any remaining data gaps.

6. **Leveling & attribute allocation** *(new)*
   - Level-ups currently fail to grant free attribute points and derived stats do not scale; inspect leveling flow and AttributeMath integration.
   - Expose free point controls directly in StatusOverlay by placing [+] and [-] buttons beside each canonical attribute and wiring them into the allocation logic.

7. **HUD framing + feed UX** *(new)*
   - Wrap the full in-game UI with a thematic frame so every rendered panel sits inside a cohesive border treatment.
   - Add a dedicated scrollbar to the Command Feed so long sessions remain navigable without expanding the entire sidebar.
   - Add a dedicated scrollbar to the AI Narrative Memory so long sessions remain navigable without expanding the entire middle panel.

8. **AI Narrative Memory polish** *(new)*
   - Increase the narrative text size slightly for legibility and render new entries with a typewriter (letter-by-letter) animation.
   - Prevent duplicate intro paragraphs—the opening prompt currently echoes twice per generation.
