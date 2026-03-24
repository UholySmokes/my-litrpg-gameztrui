# Character Selection Redesign — Implementation Plan

Date: 2026-03-24
Depends on: `docs/plans/2026-03-19-character-selection-design.md`

## Target Outcome

- A shared character-selection roster layout rendered in-app.
- Two switchable visual skins (painted fantasy + pixel art) using one shared component structure.
- No regressions to existing selection/confirm flows.

## Implementation Steps

### Slice 1 - Shared Layout Component

- Add a reusable selection showcase component in the web creation flow (`src/ui/*`).
- Implement roster grid, selected-card spotlight panel, and bottom action bar.
- Keep content wired to existing character data/state shape.

### Slice 2 - Themeable Skin System

- Add a local theme mode enum (`painted`, `pixel`) and toggle control.
- Apply shared structure + variant class tokens so only style layers differ.
- Keep readability-first constraints for chips, labels, and CTA contrast.

### Slice 3 - Interaction Wiring

- Wire card click/select state, random action, back action, and confirm action.
- Ensure selected hero summary and stat chips update deterministically.

### Slice 4 - Validation

- Run targeted unit/component tests for selection behavior.
- Run lint on touched UI files.
- Capture one screenshot per skin in the running app for review parity.

## Risks

- Styling variance can drift into structural divergence.
  - Mitigation: keep one layout tree and variant-only CSS tokens.
- Pixel variant may reduce readability.
  - Mitigation: hard contrast minimums and chunkier border scales.
