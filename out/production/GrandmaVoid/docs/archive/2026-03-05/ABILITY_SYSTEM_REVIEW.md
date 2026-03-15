# Ability System Review & Refactor Plan

**Date:** 2026-03-03
**Team:** Engineering, Design, Narrative, QA

## 1. Executive Summary

The team reviewed the `ability_catalog.json` and its sources. We found a fragmented architecture ("Split Brain") where skills were defined across inconsistent JS registries and JSON files. This caused data loss (105 profession skills had `null` descriptions) and makes balancing difficult.

**Status:**

- **Critical Fix Applied:** Created `packages/game-core/src/data/skills/profession_skills.json` to define missing skills.
- **Tooling Fix Applied:** Patched `tools/buildAbilityCatalog.mjs` to correctly merge data from multiple sources (preserving both descriptions and system metadata like Tiers).
- **Current Health:** The catalog is now complete (no nulls) and accurate.

## 2. Team Discussion Transcript

**Struct (Lead Dev):** "The current architecture is brittle. We have `ClassAbilityRegistry.js` defining data in code, while other skills live in `src/data/skills/*.json`. The build script has to support too many extraction methods. We need a unified schema."

**Flow (Designer):** "I agree. I couldn't see the descriptions for Alchemy skills because they were hidden in a registry file as simple IDs. Now that we have `profession_skills.json`, I can actually write flavor text for them. But I want *all* skills (Class/Race) in JSON so I can balance damage numbers without touching JS."

**Glitch (QA):** "The dependency graph is implicit. 'Tier 2 unlocks Tier 1' is hardcoded logic in `ProfessionRegistry.js`. If we want a visual skill tree, we need explicit `prerequisites: ['id']` fields in the data. The current 'Merge' fix Struct did is good, but let's validate it doesn't create cycles."

**Sparks (Narrative):** "The new descriptions are generic ('Complex techniques for...'). I need to go into `profession_skills.json` and rewrite them to fit our lore. At least the file exists now!"

**Struct:** "Verdict: The immediate bleeding is stopped. The catalog is valid. The long-term plan is to migrate `ClassAbilityRegistry.js` and `RaceAbilityRegistry.js` into the `src/data/skills/` folder as standard JSONs."

## 3. Recommendations & Next Steps

### Phase 1: Consolidation (Approved/Done)

- [x] Create definitions for ghost profession skills.
- [x] Fix catalog generator to merge `details` from different sources.

### Phase 2: Migration (Completed)

- [x] **Migrate Class Abilities:** Converted `ClassAbilityRegistry.js` inline `ABILITIES` object into JSON data files under `packages/game-core/src/data/skills/class_<classId>.json`.
- [x] **Migrate Race Abilities:** Converted `RaceAbilityRegistry.js` inline race ability definitions into JSON data files under `packages/game-core/src/data/skills/race_<raceId>.json`.
- [x] **Refactor Registries:** Updated Class/Race ability registries to load JSON sources (`class_abilities.json`, `class_ability_sets.json`, `race_abilities.json`, `race_ability_sets.json`) instead of defining large inline registries.
- [x] **Migration Tooling:** `tools/migrate_registries_to_json.cjs` now regenerates aggregate + split JSON files in a stable format.

### Phase 3: Validation

- [ ] Add a JSON Schema validator to the build script to ensure no future skills are added without descriptions or types.
