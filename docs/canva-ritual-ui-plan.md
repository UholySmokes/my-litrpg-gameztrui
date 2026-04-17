# Void-Verse // Ritual UI Master - Canva Design Plan

## Summary
Canva-first master for Void-Verse Ritual UI. Desktop-only (1600x900). Phase 1 deliverable. Runtime Phase 2 (React/Godot).

**Preserved Intent:**
- Hybrid ritual UI refs (canonical images 1-8,13-16).
- Repo-native: Void-Verse, The Archive, Cloud Chronicle, Local Flame, Name the Sigil, Temper the Vessel, Seal the First Page, Celestial Ledger.
- Hero: portal ring.
- Discard archived concept board.

**Format:** Canva Presentation. Mixed: editable UI chrome/text/CTAs/parchment/altar/ledger, image nebula skies/debris.

## Page Order (1600x900)
1. 00 Cover + Brief
2. 01 Reference Wall - Canonical
3. 02 Visual Tokens
4. 03 Module Library
5. 10 Landing - Default
6. 10N Landing - Default - Notes
7. 11 Landing - Local Flame Focus
8. 11N Landing - Local Flame Focus - Notes
9. 20 Chronicle Altar - Default
10. 20N Chronicle Altar - Default - Notes
11. 21 Chronicle Altar - Step Focus
12. 21N Chronicle Altar - Step Focus - Notes
13. 30 Character Creation - Name the Sigil
14. 30N Character Creation - Name the Sigil - Notes
15. 31 Character Creation - Temper the Vessel
16. 31N Character Creation - Temper the Vessel - Notes
17. 32 Character Creation - Seal the First Page
18. 32N Character Creation - Seal the First Page - Notes
19. 40 Celestial Ledger - Browse
20. 40N Celestial Ledger - Browse - Notes
21. 41 Celestial Ledger - Detail
22. 41N Celestial Ledger - Detail - Notes
23. 50 Adventure Shell - Level 1 Intro
24. 50N Adventure Shell - Level 1 Intro - Notes
25. 51 Adventure Shell - Command Focus
26. 51N Adventure Shell - Command Focus - Notes
27. 90 Export Manifest

## Visual Tokens (Lock on 02)
**Colors:**
- Void Black
- Abyss Blue
- Deep Navy
- Soul Cyan
- Teal Mist
- Relic Gold
- Parchment
- Ember

**Typography:**
- Cinzel (display)
- Cormorant Garamond (ritual titles/parchment)
- Manrope (UI labels/body)

**Materials:**
- Portal glow
- Brass/stone frame trim
- Parchment note surfaces
- Utility rails
- Altar pedestal base
- Floating shard kit

## Module Library (Reusable Groups on 03)
- Top navigation chrome
- Portal ring hero
- Primary CTA pair
- Parchment card
- Scroll note
- Ritual step card
- Altar pedestal
- Ledger card
- Filter/tab pill
- Side utility rail
- Floating shard/debris cluster

**Repo Asset Inspirations (ART_ASSET_LIST.md):**
- Portal: Encounter Gate (pulsing).
- Parchment: Dialog panel.
- Altar: Save Obelisk.
- Ledger/Command: Terminal frame.
- Shards: VFX particles.

## Screens & Runtime Mapping
- Landing (10/11): GameUIRoot/CharacterHub → Portal ring, nav, Local Flame variant.
- Chronicle Altar (20/21): Cloud Chronicle → Altar pedestal, step cards.
- Char Creation (30-32): CharacterCreationShell → Sigil/Vessel/Page steps, ritual cards.
- Celestial Ledger (40/41): Inventory/Quest → Browse/detail, ledger cards, filters.
- Adventure Shell (50/51): AdventureShell → Level intro, command focus.

## Notes Pages (-N)
Annotate:
- Spacing rhythm
- Typo scale
- Active/inactive/hover/selected states
- Asset IDs
- Interactions/transitions

## Export Manifest (90)
```
vv-landing-portal-ring svg/png
vv-altar-dais png
vv-ritual-card-frame svg
vv-parchment-note png
vv-ledger-frame png
vv-utility-rail-icons svg/png
vv-floating-shard-set-a png
```

## Test Plan
- [ ] All pages exist/named correctly.
- [ ] Closer to ritual refs than archived board.
- [ ] Portal ring on landing/altar/adventure.
- [ ] Repo naming.
- [ ] Editable UI, image atmos.
- [ ] Notes complete for handoff.
- [ ] Exports collectable no guesswork.

**Public Interfaces:** Page names, token/module names → CSS vars Phase 2, vv- exports.
