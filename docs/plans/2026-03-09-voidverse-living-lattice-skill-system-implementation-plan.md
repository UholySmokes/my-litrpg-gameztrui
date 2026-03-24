# VoidVerse Living Lattice Skill System — Implementation Plan

Date: 2026-03-24
Depends on: `docs/plans/2026-03-09-voidverse-living-lattice-skill-system-design.md`

## Target Outcome

- A single canonical lattice skill model spanning class/race/universal/magic/cultivation/profession/talent surfaces.
- Deterministic compatibility with existing character creation and progression systems.
- Hard lore guardrail enforcement for Grandma Void boundary rules.

## Implementation Steps

### Slice 1 - Canonical Data Contract

- Introduce/normalize a lattice skill schema in `packages/game-core/src/data/skills/*`.
- Add explicit family/category fields and stable IDs for all migrated entries.
- Add migration map for legacy skill source files.

### Slice 2 - Registry Unification

- Refactor `SkillRegistry` loading to ingest lattice entries from one source contract.
- Preserve backward compatibility aliases for existing call sites.
- Add validation failures for duplicate IDs, missing families, and invalid progression metadata.

### Slice 3 - Runtime Integration

- Wire lattice families into progression hooks, character creation content pack reads, and prompt assembly hooks.
- Ensure save/load normalization can hydrate old saves into lattice-compatible records.

### Slice 4 - Lore Boundary Enforcement

- Add semantic rule checks that reject or quarantine entries violating Grandma Void constraints.
- Add tests that enforce auto-fail behavior for forbidden targeting semantics.

### Slice 5 - Verification

- Unit tests for registry load, family filtering, migration aliases, and constraint violations.
- Snapshot tests for representative character creation and prompt assembly payloads.
