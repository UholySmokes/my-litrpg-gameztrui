# Magic System Unification Design

Date: 2026-03-24
Status: Approved direction before implementation

## Goal

Unify the repo's split magic model so class spells and the magic ecology system resolve through one canonical engine while keeping class-specific spell fantasy front-and-center for players.

## Current Repo Surfaces

- `packages/game-core/src/systems/magic/UnifiedMagicSystem.js`
- `packages/game-core/src/systems/magic/EssenceWeavingSystem.js`
- `packages/game-core/src/core/ActionDispatcher.js`
- `packages/game-core/src/systems/combat/CombatSystem.js`
- `packages/game-core/src/data/skills/class_mage.json`
- `packages/game-core/src/systems/skills/SkillRegistry.js`
- `src/components/statusOverlay/statusOverlayViewModel.js`
- `src/components/statusOverlay/StatusMagicSection.jsx`
- `src/core/PromptAssembler.js`
- `tests/essenceEcology.test.js`
- `tests/unit/MagicCombatCasting.test.js`

## Approved Direction

- Keep named class spells such as Fireball, Ice Lance, Holy Smite, and similar abilities as the main player-facing interface.
- Treat the ecology pipeline as the shared source of truth for magical resolution, not as a disconnected side system.
- Preserve ritual-style commands like `draw`, `refine`, `weave`, and `release` for deeper magic play, preparation, and progression.
- Make magic read as one system in combat, UI, prompts, and narrative output instead of two adjacent systems with separate rules.

## Scope

- Add a canonical spell-to-ecology mapping contract for magical class abilities.
- Route magical class abilities through unified resolution so they participate in resonance, stability or cast-pressure behavior, ambient influence, and prepared or sustained state where appropriate.
- Narrow the old mana-only path so it no longer acts as the balancing authority for magical class abilities.
- Update status, prompt, and narrative surfaces so unified magic state is readable to the player.
- Expand focused regression coverage around combat casting, ecology progression, interruption, overload, and mixed spell-plus-ritual play.

## Non-Goals

- Replacing named class spells with ritual commands for all players.
- Rewriting every non-magic resource system.
- Removing ritual casting depth from the ecology system.
- Performing a flag-day rewrite that changes every spell and UI surface at once without a staged rollout.

## Architecture

Class abilities should keep their current identity and registry presence, but magical abilities should gain a canonical `magicProfile` that maps each spell into the shared engine. That profile should express primary essence, optional secondary essences, form, delivery, resonance behavior, pressure or strain behavior, taint sensitivity, and whether the spell is quick-cast, prepared-cast, or sustained.

`UnifiedMagicSystem` should become the main combat and world-casting resolver for named magical abilities. `EssenceWeavingSystem` should remain the ecology and progression layer for ambient draw, reserves, taint, purge, overload, pattern unlocks, and related state shaping. The key change is that class spells stop using separate spell math and instead become curated wrappers over the same canonical model.

## Rollout

### Phase 1

- Introduce `magicProfile` on magical class abilities without changing player-facing spell names or ids.
- Start routing magical combat casts through unified resolution so they generate shared magic-state consequences.

### Phase 2

- Remove balancing authority from the old mana-only path for magical class abilities.
- Keep legacy mana helpers only for true generic-resource or non-ecology cases if still needed.

### Phase 3

- Align parser, status, prompt, and narrative surfaces so preparation, resonance, and spell identity read as one coherent system.

## Risks And Mitigations

- Risk: combat spell feel drifts when class spells start inheriting ecology rules.
- Mitigation: keep class spell names and intent stable, then tune their `magicProfile` rather than exposing raw ritual complexity.

- Risk: ecology rules become too invasive for low-complexity casts.
- Mitigation: support lightweight quick-cast profiles that still feed the unified state without requiring full ritual setup every time.

- Risk: UI and prompts reveal confusing intermediate state during migration.
- Mitigation: update status and prompt surfaces in the same implementation track as the combat-path unification.

## Validation

- Existing class spells continue to function and preserve class fantasy.
- Named magical combat abilities mutate the same unified magic state that ritual casting uses.
- Ecology behavior remains intact for draw, refine, compress, weave, purge, and release.
- Status overlay and prompt output show one coherent magic state.
- Regression tests explicitly cover interruption, overload, sustained upkeep, and mixed class-plus-ritual usage.
