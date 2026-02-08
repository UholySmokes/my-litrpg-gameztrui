# Page Design — Guided Character Creation Wizard (Desktop-first)

## Global Styles (applies to all pages)
- Layout system: Hybrid CSS Grid (outer app shell) + Flexbox (panel internals). Windowed UI continues to be managed by the existing WindowManager/docking layer.
- Theme tokens (CSS variables):
  - `--holo-primary`, `--holo-secondary`, `--holo-accent` remain as the core accents; class selection may update them.
  - Background: near-black with subtle scanline/noise overlay; panels use translucent dark surfaces.
  - Typography: UI monospace for labels + readable sans for body text; 3 sizes (sm, md, lg).
- Buttons:
  - Primary: filled using `--holo-primary`; hover brightens + subtle glow.
  - Secondary: outline using `--holo-secondary`; hover fill.
  - Disabled: reduced opacity + no hover glow.
- Links: accent-colored, underline on hover.

---

## Page 1 — Character Creation (Guided Wizard)

### Meta Information
- Title: Character Creation — Voidverse
- Description: Guided multi-phase wizard for creating a character while preserving the existing game state schema.
- Open Graph: same title/description; image can be omitted for in-game SPA.

### Page Structure
- Outer: existing windowed UI layout with a persistent right dock zone.
- Center: **Wizard Shell Window** (new) that provides phase navigation and guidance.
- Left/float: existing creation panels can still exist as windows, but the wizard controls which one is “active/focused” per phase.

### Sections & Components
1) **Wizard Shell (center dock zone)**
   - Header row:
     - Title: “Character Genesis”
     - Stepper: ordered phases with completion state (Incomplete / Complete / Current).
     - Global actions: Back, Next, Reroll (if available), Help (short rules), Exit.
   - Main body (two-column):
     - Left: Phase checklist + validation hints (e.g., “Select a Profession to continue”).
     - Right: “Active Phase Canvas” that embeds the corresponding existing panel UI.
   - Footer:
     - Inline error bar for validation messages.
     - Progress indicator (0–100%) computed from phase completion.

2) **Phase: Identity**
   - Embed: existing Identity panel.
   - Required inputs: name, gender.
   - Microcopy: “These can be changed later only if your rules allow it (if not, label as locked).”

3) **Phase: Race**
   - Embed: existing Race panel.
   - Show: race description, key bonuses, ability preview.
   - Interaction: selecting a race immediately refreshes dependent recommendations (see Archetype phase).

4) **Phase: Class**
   - Embed: existing Class panel.
   - Show: class description, resource system preview.
   - Interaction: selecting a class updates theme tokens and recalculates recommendation inputs.

5) **Phase: Profession (NEW)**
   - Embed: a new “Creation Profession Panel” that reuses the same profession registry/data as the existing Profession UI.
   - Required: one profession selection.
   - Show (minimum): profession name, short fantasy summary, tier-1 unlock skill list.

6) **Phase: Archetype System (Recommendation + Selection)**
   - Embed: existing System selection panel plus a recommendation strip.
   - Recommendation strip (top of phase canvas):
     - Up to 3 recommendation cards: name, 1-line rationale (based on race/class/profession), “Select” CTA.
     - “Why these?” expandable area listing the factors used (no hidden logic).
   - Manual override: allow browsing the full system list and selecting a non-recommended option.

7) **Phase: Attributes**
   - Embed: existing Attributes panel.
   - Show: derived HP/Mana/resources preview alongside the allocator.
   - Validation: Next disabled until remaining points == 0.

8) **Phase: Skills**
   - Embed: existing Skills panel.
   - Validation: require exact active/passive counts; show counter chips (e.g., “2/3 active”).

9) **Phase: Review & Finalize**
   - Embed: existing Summary panel.
   - Include: profession + profession skills, selected archetype system, and a “Recommended archetype” badge if the chosen one matches top recommendation.
   - Finalize: triggers creation completion and transitions to Game Screen.

10) **Persistent right-side: Narrative Memory**
   - Must remain visible in creation mode.
   - Shows a compact audit trail of locked-in choices (“Race locked: …”, “Profession chosen: …”).

### Responsive behavior (desktop-first)
- 1280px+: wizard shell uses two-column body; recommendation cards render in a row.
- 900–1279px: wizard body collapses checklist into a top accordion; recommendation cards become a horizontal scroll row.

---

## Page 2 — Game Screen (Windowed UI Layout)

### Meta Information
- Title: Voidverse — Run
- Description: Main gameplay surface with dockable panels.

### Page Structure
- Keep existing DockZone layout and window presets.
- Ensure newly created characters populate all panels without schema changes.

### Sections & Components
- Center command deck: narrative log + command terminal + action suggestions (unchanged).
- Left status/inventory zone: vitals/status effects/inventory/equipment (unchanged).
- Right narrative memory zone: always visible (unchanged).
- Profession panel (if present): should immediately reflect the selected profession and tier-1 skills granted during creation.

### Interaction states
- On first load after finalize: show a one-time “Creation Complete” toast and open any default panels currently expected by the