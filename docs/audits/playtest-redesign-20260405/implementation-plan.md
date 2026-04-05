# Implementation Plan — Playtest Redesign Audit

Parent audit: `docs/audits/playtest-redesign-20260405/browser-playtest-redesign-audit.md`  
Status: ready for execution  
Priority order: blockers first, then quality issues, then polish

---

## Milestone 1 — Fix Blocking Defects

These two bugs are the highest-severity findings. They should be fixed before any
redesign work because they affect fundamental trust in the creation flow.

### 1A. Wire starting-point selection into the Oath Mirror review panel

**Problem:** `selectionSummary` in `CharacterCreationMode.jsx` never populates
`originName`, `originDescription`, or `originBiome` from `selectedStartingPoint`.
The `CreationSummaryPanel` reads those missing fields and displays "Origin not
selected" even after the player has chosen a starting point.

**Root cause (line-level):**

- `selectionSummary` is a `useMemo` at
  [src/ui/modes/CharacterCreationMode.jsx](src/ui/modes/CharacterCreationMode.jsx) ~L229–295.
- It returns race, class, profession, system, and skill fields but never sets
  `originName`, `originDescription`, or `originBiome`.
- `CreationSummaryPanel` at
  [src/ui/panels/creation/CreationSummaryPanel.jsx](src/ui/panels/creation/CreationSummaryPanel.jsx) ~L78–95
  reads `selectionSummary.originName` and falls back to `"Origin not selected"`.

**Fix:**

1. In `CharacterCreationMode.jsx`, add three fields to the `selectionSummary` memo:

   ```js
   originName: selectedStartingPoint?.name || "Origin not selected",
   originDescription: selectedStartingPoint?.summary || "Choose an origin to shape your opening pressures.",
   originBiome: selectedStartingPoint?.type || null,
   ```

2. Add `selectedStartingPoint` to the `useMemo` dependency array.

**Files touched:** `src/ui/modes/CharacterCreationMode.jsx`  
**Risk:** low — additive field population, no removal.  
**Validation:** select a starting point, navigate to Oath Mirror review, confirm
the panel shows the correct origin name, description, and biome instead of fallback text.

---

### 1B. Honor the player's starting-point selection in world initialization

**Problem:** `seedWorldAfterCharacterCreation()` derives the starting zone from the
opening scene's biome tags, ignoring `player.startingZoneId`. The player's explicit
choice has no effect on where they actually spawn.

**Root cause (line-level):**

- `seedWorldAfterCharacterCreation()` at
  [packages/game-core/src/world/WorldInitializer.js](packages/game-core/src/world/WorldInitializer.js) ~L120–230
  resolves `zoneId` only from `opening.scene.biome` or `mainQuest.tags.biome`,
  with a fallback to `"city"`.
- The `player` object carries `startingZoneId` (set by `finalizeCharacter` at
  [src/hook/useCharacterCreationReworked.js](src/hook/useCharacterCreationReworked.js) ~L1041),
  but `seedWorldAfterCharacterCreation` never reads it.

**Fix:**

1. In `seedWorldAfterCharacterCreation()`, read `player.startingZoneId` and
   prefer it over scene/quest biome when it is a valid zone:

   ```js
   const playerZoneId = player?.startingZoneId || null;
   const zoneId = (playerZoneId && getZoneById(playerZoneId))
     ? playerZoneId
     : getZoneById(sceneBiome)
       ? sceneBiome
       : getZoneById(questBiome)
         ? questBiome
         : "city";
   ```

2. Keep the existing scene-biome and quest-biome fallback chain so that save
   files without `startingZoneId` still work.

**Files touched:** `packages/game-core/src/world/WorldInitializer.js`  
**Risk:** medium — changes spawn logic for all new characters. Existing saves are
unaffected because they already have a persisted `world.location.current`.  
**Validation:**
- Create a character selecting "Meridian Arcology" (id `city`), confirm spawn in city zone.
- Create a character selecting "Tideward Coast" (id `coast`), confirm spawn in coast zone.
- Create a character with no starting point selected (if the UI ever allows it),
  confirm fallback to scene-biome logic.

---

### 1C. Clear stale `wizardError` on selection change

**Problem:** When the player presses "Next" without completing a chamber, the
validation error (e.g. "Choose a race before leaving") persists even after the
player makes the required selection.

**Root cause (line-level):**

- `handleNext()` at [src/ui/modes/CharacterCreationMode.jsx](src/ui/modes/CharacterCreationMode.jsx) ~L540
  calls `setWizardError(validation.error)`.
- The error is not cleared when the underlying selection changes because
  `handleRaceSelect` / `handleClassSelect` callbacks do not call
  `setWizardError("")`.

**Fix:**

1. Add a `useEffect` that clears `wizardError` whenever `chamberChecks` changes:

   ```js
   useEffect(() => {
     setWizardError("");
   }, [chamberChecks]);
   ```

   This is safe because `chamberChecks` is already a `useMemo` derived from the
   current completion state — it only changes when a selection actually changes.

**Files touched:** `src/ui/modes/CharacterCreationMode.jsx`  
**Risk:** low — additive effect, no removal of existing error logic.  
**Validation:** trigger "Choose a race before leaving" by pressing Next without
selecting a race, then select a race, confirm the error clears without pressing Next.

---

## Milestone 2 — Soul Crucible Pacing

**Recommendation 1 from the audit:** reframe creation as a paced ritual funnel.

The goal is not to remove decisions from Soul Crucible, but to stage them so
the player encounters one decision category at a time instead of a dense stack.

### 2A. Add collapsible progressive disclosure to Soul Crucible sections

**Approach:** wrap each `ChamberSection` inside Soul Crucible in a collapsible
accordion. Only the first incomplete section starts expanded; completed sections
collapse to a one-line summary showing what was chosen.

**Files touched:**
- `src/ui/modes/CharacterCreationMode.jsx` (Soul Crucible `case` block ~L675–773)
- New component: `src/ui/panels/creation/CollapsibleChamberSection.jsx` (thin
  wrapper around existing `ChamberSection`)

**Behavior:**
1. On render, find the first step in `["attributes", "skills", "perks", "starter-tree", "alignment"]`
   that is not yet locked.
2. Expand only that section. All earlier (locked) sections show a collapsed
   summary line (e.g. "Attributes — 15 points allocated").
3. Clicking a collapsed section toggles it open (for review), but the primary
   focus stays on the first unlocked section.

**Risk:** medium — changes the visual layout of the most complex chamber.  
**Validation:** walk through Soul Crucible, confirm only one section is expanded
at a time, confirm all sections are still accessible, confirm finalize still works.

### 2B. Add a compact live build-summary strip

**Audit suggestion 4:** show a compact live summary during Soul Crucible so
players do not need to scroll to recover identity context.

**Approach:** render a sticky one-line strip at the top of the Soul Crucible
chamber showing: `{Race} · {Class} · {System} — {N} of 5 sections complete`.
Reads from existing `selectionSummary` and `completionById`.

**Files touched:**
- `src/ui/modes/CharacterCreationMode.jsx` (add strip above Soul Crucible sections)

**Risk:** low — purely additive UI.

---

## Milestone 3 — Oath Single Source of Truth

**Recommendation 2 from the audit:** make the Oath the single source of truth for
destination, identity lock-in, and level 1 framing.

### 3A. Echo chosen starting point in the first post-creation passage

**Audit suggestion 8:** the first narrative text after creation should mention
the chosen starting point by name.

**Approach:** in `generateInitialNarrativeText()`, inject the starting point name
into the prompt context or template so the opening narration references it.

**Files touched:**
- `src/components/gameui/useGameUiCharacterCreationFlow.js` (pass starting point to narrative generator)
- `src/core/PromptAssembler.js` or narrative template (include starting zone name
  in the assembled prompt)

**Risk:** medium — changes AI-generated narrative framing.  
**Validation:** create a character with "Meridian Arcology", confirm the opening
narration mentions the city / Meridian Arcology by name.

### 3B. Show a clear handoff confirmation before switching to adventure

**Audit quality issue 4:** the creation-to-adventure handoff lacks a clear moment
where review state becomes world state.

**Approach:** after the player clicks "Seal", show a brief confirmation overlay
(2–3 seconds) that displays: character name, chosen starting point, and a
transition message like "Your chronicle begins in {destination}…" before the
surface switches to `"adventure"`.

**Files touched:**
- `src/components/gameui/useGameUiCharacterCreationFlow.js` (the 1200ms transition
  already exists — extend it with visible confirmation content)
- `src/components/gameui/GameUIRoot.jsx` (render the confirmation overlay during
  the `isTransitioning` state)

**Risk:** low-medium — modifies the existing transition window.

---

## Milestone 4 — Protect First-Play Impression

**Recommendation 4 from the audit:** protect the opening fantasy from utility noise.

### 4A. Defer install prompt until after first interaction

**Audit suggestion 1:** delay or visually demote the install prompt until after the
player has entered genesis or dismissed it once.

**Current state:** `PwaInstallPrompt` is mounted with `enabled={shouldShowHub}` in
`GameUIRoot.jsx` ~L510. It appears immediately on the hub screen.

**Fix:**

1. Add a `hasInteracted` state to `GameUIRoot` (set to `true` when the player
   clicks the creation CTA or any hub action).
2. Change the prop to `enabled={shouldShowHub && hasInteracted}`.
3. Alternatively, add a 10-second delay inside `PwaInstallPrompt` before rendering.

**Files touched:**
- `src/components/gameui/GameUIRoot.jsx` (add interaction gate)
- or `src/components/PwaInstallPrompt.jsx` (add internal delay)

**Risk:** low — the install prompt already handles dismissal gracefully.

### 4B. Quiet runtime and accessibility noise

**Audit quality issue 6 and suggestion 9:** resolve unlabeled form fields and
missing field metadata.

**Approach:** audit all `<input>` and `<select>` elements in the creation flow for
missing `aria-label`, `id`, or `<label>` associations. Add them where needed.

**Files touched:** various creation panel components under `src/ui/panels/creation/`.  
**Risk:** low — additive accessibility attributes.

---

## Milestone 5 — First-Scene Payoff

**Recommendation 5:** strengthen the first playable scene as the reward for the
creation ritual.

### 5A. Make freeform command examples match the opening scene

**Audit suggestion 7:** the freeform command field examples should reflect actions
the current room actually permits.

**Approach:** source suggestion chips from the current location's affordances
instead of using static examples. If the narrative runtime already provides
suggestions, ensure they are visible and prioritized over generic placeholders.

**Files touched:**
- Check `src/hook/narrative/useNarrativeRuntime.js` and the adventure shell for
  how suggestions are sourced and displayed.
- May need to pass `world.location` context to the suggestion generator.

**Risk:** medium — depends on existing suggestion infrastructure.

### 5B. Add plain-language level 1 note

**Audit suggestion 6:** add a note near the handoff that level 1 is initial
readiness, not the first earned milestone.

**Approach:** in the adventure shell header or the first system message, include a
brief note: "Level 1 — Your chronicle has begun. Earn 100 XP to reach Level 2."

**Files touched:**
- `src/components/gameui/useGameUiCharacterCreationFlow.js` (in `addSystemMessage`)
- or the adventure shell header component

**Risk:** low — additive UI text.

---

## Milestone 6 — Remaining Polish Suggestions

These are lower priority and can be picked up independently after the first five
milestones.

| # | Suggestion | Key File(s) | Effort |
|---|-----------|-------------|--------|
| 2 | Add explanation under SYSTEM MATCH badges | `CharacterCreationMode.jsx` (system-match rendering) | S |
| 3 | Replace stale leave-chamber warnings with state-aware text | `creationChamberManifest.js` (validation messages) | S |
| 5 | Rephrase "RESET INITIALIZATION (3 REMAINING)" counter | locate in `CharacterCreationMode.jsx` or `CreationAttributesPanel` | S |
| 10 | Add lightweight clean-session indicator for QA | `GameUIRoot.jsx` or a new dev-only overlay | S |

S = small (< 1 hour estimated scope)

---

## Execution Order

```
Milestone 1  (blockers)
  ├── 1A  Wire origin into selectionSummary         ← no dependencies
  ├── 1B  Honor startingZoneId in WorldInitializer   ← no dependencies
  └── 1C  Clear stale wizardError                    ← no dependencies
          (all three can be done in parallel)

Milestone 2  (Soul Crucible pacing)
  ├── 2A  Collapsible progressive disclosure         ← after 1A (needs working summary)
  └── 2B  Live build-summary strip                   ← after 1A

Milestone 3  (Oath source of truth)
  ├── 3A  Echo starting point in narrative           ← after 1B (needs correct zone)
  └── 3B  Handoff confirmation overlay               ← after 1A + 1B

Milestone 4  (first-play impression)
  ├── 4A  Defer install prompt                       ← independent
  └── 4B  Quiet accessibility noise                  ← independent

Milestone 5  (first-scene payoff)
  ├── 5A  Context-aware command examples             ← after 1B
  └── 5B  Level 1 system message                     ← independent

Milestone 6  (polish)
  └── all items independent                          ← after milestone 1
```

---

## Verification Checklist

After each milestone, run:

```
npm run build        # must pass
npm run typecheck    # must pass
npm run test:smoke   # must pass (145 tests, 6 suites)
```

After milestone 1, manually play through:
- [ ] Fresh creation → Oath Mirror shows correct origin name
- [ ] Fresh creation → spawn location matches chosen starting point
- [ ] Chamber navigation → stale warnings clear when selection is made

After milestone 3, manually confirm:
- [ ] Opening narration references chosen starting point
- [ ] Handoff overlay shows character name and destination

---

## Files Index

| File | Milestones |
|------|-----------|
| `src/ui/modes/CharacterCreationMode.jsx` | 1A, 1C, 2A, 2B, 6 |
| `packages/game-core/src/world/WorldInitializer.js` | 1B |
| `src/components/gameui/useGameUiCharacterCreationFlow.js` | 3A, 3B, 5B |
| `src/components/gameui/GameUIRoot.jsx` | 3B, 4A |
| `src/components/PwaInstallPrompt.jsx` | 4A |
| `src/ui/panels/creation/CreationSummaryPanel.jsx` | (reads fixed data from 1A) |
| `src/ui/modes/creationChamberManifest.js` | 6 (suggestion 3) |
| `src/core/PromptAssembler.js` | 3A |
| `src/ui/panels/creation/CollapsibleChamberSection.jsx` | 2A (new file) |
| `src/ui/panels/creation/CreationStartingPointPanel.jsx` | (no changes needed) |
