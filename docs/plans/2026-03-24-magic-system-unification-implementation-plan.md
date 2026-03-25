# Magic System Unification Implementation Plan

Date: 2026-03-24
Depends on: `docs/plans/2026-03-24-magic-system-unification-design.md`

## Target Outcome

- Named class spells remain the main player-facing experience.
- Magical class abilities resolve through the same canonical engine as ecology casting.
- Combat, ritual casting, status UI, and prompt surfaces all describe one consistent magic state.
- Focused automated coverage protects the migration.

## Implementation Steps

### Slice 1 - Canonical Spell Profile Contract

- Add a `magicProfile` contract for magical class abilities in the shared skill or ability layer.
- Map existing mage and adjacent caster spells onto canonical essence, form, delivery, and pressure behavior.
- Keep current spell ids, names, cooldowns, and basic fantasy intact.

### Slice 2 - Combat Resolver Unification

- Update the combat magic path so magical skills resolve through `UnifiedMagicSystem` first.
- Stop treating magical class skills as ordinary mana-cost abilities with optional unified metadata.
- Ensure resulting combat resolution mutates unified magic state consistently for mana, preparation, resonance, and cast-pressure effects.

### Slice 3 - Ecology And Legacy Boundary Cleanup

- Narrow `ManaSystem` and `ManaBalance` so they are no longer the balancing authority for magical class abilities.
- Preserve legacy helpers only where they still serve non-ecology or generic resource use cases.
- Keep `EssenceWeavingSystem` as the source of truth for ecology-side progression and risk mechanics.

### Slice 4 - UI And Narrative Coherence

- Update status overlay labels and view-model shaping so prepared state and unified spell identity are readable.
- Update prompt and narrative suggestion surfaces so resonance and prepared magic reflect the unified system rather than a partial ecology subset.
- Keep ritual commands and named spell usage compatible.

### Slice 5 - Verification

- Extend focused unit coverage for magical class casting into unified state mutation.
- Preserve and rerun ecology coverage for draw, refine, compress, weave, purge, and release.
- Add or update regression tests for interruption, overload, sustained upkeep, and mixed class-plus-ritual flows.

## Verification Commands

- `npm test -- tests/unit/MagicCombatCasting.test.js`
- `npm test -- tests/essenceEcology.test.js`
- `npm test -- tests/unit/PromptAssembler.test.js`
- `npm test -- tests/unit/StatusOverlayViewModel.test.js`

## Model Recommendation

- Optimal model: `gpt-5.4`
- Reasoning strength: `high`
- Execution location: `cloud`
