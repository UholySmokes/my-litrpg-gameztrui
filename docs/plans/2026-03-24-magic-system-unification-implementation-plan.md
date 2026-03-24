# Magic System Unification — Implementation Plan

Date: 2026-03-24
Depends on: `docs/plans/2026-03-24-magic-system-unification-design.md`

## Target Outcome

- A unified canonical magic contract used by all active runtime consumers.
- Backward compatibility for legacy data and save payloads.
- Validation + tests guarding against regression and semantic drift.

## Implementation Steps

### Slice 1 - Schema + Validator

- Define canonical magic schema in `packages/game-core/src/systems`-adjacent contract layer.
- Add validator rules for required fields, costs/limits shape, hook availability, and lore guard constraints.
- Emit machine-readable validation output for CI and local inspection.

### Slice 2 - Data Normalization

- Normalize existing magic records into canonical shape.
- Introduce alias map for legacy ids/field names.
- Generate a migration report identifying converted, aliased, and rejected entries.

### Slice 3 - Registry Integration

- Update runtime registry loading to consume canonical definitions first.
- Keep compatibility adapters for old call sites until all consumers are migrated.
- Add duplicate-id and unresolved-alias hard-fail checks.

### Slice 4 - Consumer Alignment

- Update character creation readers (web + Godot subset) to consume canonical fields.
- Update prompt assembly input shaping so magic metadata is consistent.
- Ensure progression/combat hooks read shared hook fields instead of bespoke shape checks.

### Slice 5 - Save Migration + Verification

- Add save normalization migration from legacy magic descriptors to canonical identifiers + resolved summary.
- Add tests for deterministic hydration and backward compatibility snapshots.
- Add focused integration checks for creation + prompt + runtime registry paths.

## Validation Commands (planned)

- `npm run test -- WebGameplayGate` (example focused run pattern)
- `npm run test -- magic` (or nearest scoped suite)
- `npm run lint`
- `npm run typecheck`

## Rollout Notes

- Ship contract + migration scaffolding first.
- Land consumer migrations in small PR slices.
- Remove deprecated adapters only after compatibility window closes.
