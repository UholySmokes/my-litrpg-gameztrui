# Magic System Unification Design

Date: 2026-03-24
Project: `my-litrpg-gameztrui`
Status: Drafted for implementation handoff

## Goal

Unify fragmented magic content and runtime handling under one canonical magic contract so web, Godot, narrative prompts, progression hooks, and save hydration all consume the same structure.

## Problems Observed

- Magic-like data appears across multiple sources with differing field shapes.
- Runtime consumers require ad-hoc mapping logic instead of one shared contract.
- Save payloads can drift when old records use legacy or partial magic descriptors.
- Prompt assembly and gameplay hooks do not consistently read the same capability metadata.

## Design Principles

1. **Single source of truth** for canonical magic definitions.
2. **Compatibility first** through aliasing/migration instead of hard breakage.
3. **Deterministic consumption** across simulation and presentation layers.
4. **Lore-safe constraints** so category semantics remain stable.
5. **Tooling visibility** with validation/report outputs that expose drift quickly.

## Canonical Contract

Each magic definition should carry:

- `id` (stable canonical id)
- `name`
- `family` (e.g., elemental, void, bloodline, ritual, support)
- `tier` or `rarity`
- `costs` (resource + risk)
- `limits` (hard constraints, cooldowns, domain boundaries)
- `hooks` (combat, exploration, narrative, crafting, progression)
- `synergies` (optional structured references)
- `tags` (query/filter surfaces)
- `lore_guards` (forbidden semantics/targets)

## Runtime Surfaces To Align

- Canonical data pack in `packages/game-core/src/data/*`.
- Registry and runtime resolution in `packages/game-core/src/systems/*`.
- Character creation surfaces in web and Godot integration layers.
- Prompt assembly and narrative generation surfaces.
- Save normalization/migration paths.

## Non-Goals

- Rebalancing every spell in a single pass.
- Rewriting the full combat engine in this slice.
- Shipping entirely new content families before migration is stable.

## Success Criteria

- Canonical magic registry is loaded from one normalized contract.
- Existing runtime call sites continue working through aliases/adapters.
- Save hydration upgrades legacy magic payloads deterministically.
- Validation catches schema drift and forbidden semantics.
- Web/Godot/prompt systems consume aligned fields without bespoke per-surface hacks.

## Risks

- **Migration regressions** for older saves.
  - Mitigation: alias map + deterministic migration tests.
- **Content drift during rollout**.
  - Mitigation: CI validation and generated drift report artifacts.
- **Over-scoping into rebalance work**.
  - Mitigation: ship contract+migration first, rebalance second.
