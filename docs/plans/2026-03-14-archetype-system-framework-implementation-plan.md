# Repo-Wide Archetype / System Framework — Implementation Plan

Date: 2026-03-24
Depends on: `docs/plans/2026-03-14-archetype-system-framework-design.md`

## Target Outcome

- Canonical repo-wide system framework with category semantics enforced by validation.
- Godot and web flows consuming aligned generated system content.
- Save-state and runtime systems resilient to legacy archetype payloads.

## Implementation Steps

### Slice 1 - Canonical Schema + Validators

- Finalize schema fields and category constraints in `packages/game-core/src/systems/archetype/*`.
- Add semantic validation (description standards, category fit, prohibited placeholder phrasing, hierarchy compliance).
- Emit machine-readable validation reports by rule family.

### Slice 2 - Content Migration

- Migrate existing archetype entries into canonical categories and IDs.
- Generate normalized content pack outputs for downstream consumers.
- Preserve alias mapping for legacy IDs used in older saves.

### Slice 3 - Runtime Integrations

- Update character creation hooks (web + Godot subset generation) to consume canonical entries.
- Update prompt, quest, and progression wiring to read standardized fields.
- Keep save hydration path using normalizer/migration logic.

### Slice 4 - Godot Alignment

- Replace local placeholder archetype source with generated curated subset.
- Ensure Godot stores selected canonical ID + compact resolved summary.

### Slice 5 - Verification

- Add tests for category-rule validation, migration aliasing, and save normalization.
- Add integration checks for creation payload consumption in web and Godot adapters.
