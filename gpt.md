# Void-Verse Ritual UI Rebuild Plan for Canva

## Summary
- Replace the Figma-first plan with a **Canva-first master design plan**. Canva is the visual source; runtime implementation is a second phase.
- Preserve the prior design decisions:
  - **Hybrid match** to the ritual UI references
  - **Repo-native Void-Verse content**
  - **Desktop-only**
  - **Same scope**: 5 core screens, variants, and 3 separate character-creation step screens
  - **Canonical source set**: images `1-8` and `13-16`
  - **Hero motif**: portal ring
- Discard the current archived concept board as a design source. Keep it only as history.
- Treat Canva as a **presentation-based design tool**, not as a direct runtime system. Runtime remains the React/Vite DOM UI already present in the repo.

## Canva Master Build
- Create a new Canva **Presentation** named `Void-Verse // Ritual UI Master`.
- Use **1600x900** pages throughout. All final pages must be desktop-targeted.
- Use a **mixed editable build**:
  - Nebula skies, floating debris fields, and some atmospheric textures may be image-backed.
  - UI chrome, text, CTA buttons, parchment panels, ritual cards, altar pedestals, and ledger layouts must be editable Canva elements.
- Build the document in this page order:
  - `00 Cover + Brief`
  - `01 Reference Wall - Canonical`
  - `02 Visual Tokens`
  - `03 Module Library`
  - `10 Landing - Default`
  - `10N Landing - Default - Notes`
  - `11 Landing - Local Flame Focus`
  - `11N Landing - Local Flame Focus - Notes`
  - `20 Chronicle Altar - Default`
  - `20N Chronicle Altar - Default - Notes`
  - `21 Chronicle Altar - Step Focus`
  - `21N Chronicle Altar - Step Focus - Notes`
  - `30 Character Creation - Name the Sigil`
  - `30N Character Creation - Name the Sigil - Notes`
  - `31 Character Creation - Temper the Vessel`
  - `31N Character Creation - Temper the Vessel - Notes`
  - `32 Character Creation - Seal the First Page`
  - `32N Character Creation - Seal the First Page - Notes`
  - `40 Celestial Ledger - Browse`
  - `40N Celestial Ledger - Browse - Notes`
  - `41 Celestial Ledger - Detail`
  - `41N Celestial Ledger - Detail - Notes`
  - `50 Adventure Shell - Level 1 Intro`
  - `50N Adventure Shell - Level 1 Intro - Notes`
  - `51 Adventure Shell - Command Focus`
  - `51N Adventure Shell - Command Focus - Notes`
  - `90 Export Manifest`
- Lock the visual system on `02 Visual Tokens`:
  - Colors: `Void Black`, `Abyss Blue`, `Deep Navy`, `Soul Cyan`, `Teal Mist`, `Relic Gold`, `Parchment`, `Ember`
  - Typography: `Cinzel` for display, `Cormorant Garamond` for ritual titles/parchment, `Manrope` for UI labels/body
  - Materials: portal glow, brass/stone frame trim, parchment note surfaces, utility rails, altar pedestal base, floating shard kit
- Build reusable grouped modules on `03 Module Library`:
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
- Use the **repo flow and naming**, not copied reference copy:
  - `Void-Verse`, `The Archive`, `Cloud Chronicle`, `Local Flame`, `Name the Sigil`, `Temper the Vessel`, `Seal the First Page`, `Celestial Ledger`
- Treat images `9-12` as secondary only. Use them for presentation cleanliness and board organization, not for the primary look.

## Runtime Handoff Plan
- Phase 1 ends with the Canva master and annotations. No repo-tracked code changes are part of Phase 1.
- Phase 2 implements from Canva into the existing React shell, not into HTML `<canvas>`.
- Runtime mapping:
  - Landing and entry shell -> `GameUIRoot` and `CharacterHub`
  - Creation trilogy -> `CharacterCreationShell` and its child surfaces
  - Adventure shell -> `AdventureShell`
- Do not attempt a direct Canva-to-code translation. Use Canva for:
  - Pixel reference
  - asset exports
  - spacing and hierarchy notes
  - state and interaction annotations
- `90 Export Manifest` must define exact export IDs and output type:
  - `vv-landing-portal-ring` `svg/png`
  - `vv-altar-dais` `png`
  - `vv-ritual-card-frame` `svg`
  - `vv-parchment-note` `png`
  - `vv-ledger-frame` `png`
  - `vv-utility-rail-icons` `svg/png`
  - `vv-floating-shard-set-a` `png`
- Each `- Notes` page must annotate:
  - spacing rhythm
  - typography scale
  - active vs inactive states
  - hover/selected emphasis
  - asset IDs used on that screen
  - any interaction or transition assumptions
- Runtime implementation order after Canva approval:
  1. Landing default + local flame focus
  2. Chronicle altar default + step focus
  3. Character creation trilogy
  4. Ledger browse + detail
  5. Adventure intro + command focus
- Public design interfaces introduced by this plan:
  - Canva page names above
  - token names mirrored later into CSS/custom properties
  - asset export IDs under the `vv-` naming convention
  - module names from `03 Module Library` used consistently across note pages

## Test Plan
- Canva artifact review:
  - Every required page exists and follows the naming contract.
  - The design is visually closer to the ritual UI reference family than to the archived concept board.
  - Portal ring is the dominant recurring motif on landing, altar, and adventure.
  - All major labels use repo-native Void-Verse naming.
  - Mixed editable rule is respected: UI structure editable, atmosphere allowed to be image-backed.
- Handoff review:
  - Every production page has a matching `- Notes` page.
  - Every notes page identifies state, spacing, and export dependencies.
  - `90 Export Manifest` is complete enough for an engineer to collect assets without guessing.
- Runtime implementation acceptance, once Phase 2 starts:
  - Desktop browser UI matches Canva at `1600px`, `1440px`, and `1280px` widths.
  - Landing, altar, creation, ledger, and adventure states preserve the same hierarchy and ornament system.
  - No generic dashboard styling leaks back in.
  - Adventure shell keeps the same ritual language as landing and creation, rather than visually resetting.

## Assumptions
- “Canvas” means **Canva Tool**, not HTML `<canvas>` and not a generic canvas board.
- The prior design intent remains in force unless changed later.
- Canva is acceptable as the master visual source even though it is weaker than Figma for inspectable engineering handoff; the note pages and export manifest compensate for that limitation.
- Desktop-only is the full scope for this plan.
- Runtime implementation remains in the current web stack and does not introduce a new canvas-rendered runtime.

Optimal model: `gpt-5.4`  
Reasoning strength: `high`  
Execution: `cloud`
