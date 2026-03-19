# Balance Changelog

All balance-relevant changes to game systems, skill data, and progression values.

---

## 2026-03-19 — Skills & Archetypes Remediation

### TalentManager floor caps (Phase 1)
- **System:** `TalentManager.js` — `applyCostOverride`, `applyCooldownOverride`
- **Change:** `costMultiplier` and `cooldownMultiplier` paths now enforce `Math.max(1, ...)` floor.
- **Before:** A talent with `costMultiplier: 0.0` could reduce any skill to 0 mana cost.
- **After:** Multiplier-based overrides never drop below 1. `bypassCost`/`bypassCooldown` (ABSOLUTE-priority talents) remain unchanged — those are intentional zero-cost/zero-cooldown overrides.

### PrestigeSystem integration (Phase 1)
- **System:** `PrestigeSystem.js`, `gameReducer.js`
- **Change:** Converted PrestigeSystem from TypeScript experimental stub to JavaScript pure-function API. Wired `PERFORM_PRESTIGE` and `BUY_PRESTIGE_UPGRADE` reducer actions.
- **Values:** Min level 50, shards = floor(level^1.5 / 100), XP multiplier = 1 + 0.1×prestigeLevel, upgrade cost = 10×(level+1).
- **Impact:** Enables post-50 prestige loop. No existing progression paths affected.

### ClassDataRegistry parentId validation (Phase 1)
- **System:** `ClassDataRegistry.js`
- **Change:** Module-load IIFE validates all `parentId` references resolve to valid class IDs. Logs warnings for broken references.
- **Impact:** Dev-time safety net only; no runtime behavior change.

### Zero-cost magic skills audit (Phase 2)
- **System:** All `*.active.json` skill files
- **Finding:** 36 skills with `manaCost: 0`, all have `isMagic: false`. These are physical/resource-class skills (berserker rage, monk chi, warrior rage) that legitimately don't use mana. No mana-class zero-cost magic skills found.
- **Action:** No changes required.

### AOE pricing parity audit (Phase 2)
- **System:** All `*.active.json` skill files
- **Finding:** AOE skills (whirlwind, cleave, bladestorm, frost_nova, divine_storm, etc.) consistently cost 1.5–3× more mana and have higher cooldowns than same-class single-target skills.
- **Action:** No changes required — pricing is already proportionate.

### classEvolutionStepReduction documentation (Phase 2)
- **System:** `ArchetypeSystemRegistry.js`
- **Change:** Added JSDoc block to `IMPACT_BASE` explaining the `classEvolutionStepReduction` mechanic: Paths/Overlays base reduction of 1, evolution/ascension tag +1, clamped [0, 3].

### Race evolution profile validation (Phase 3)
- **System:** `RaceDataRegistry.js`
- **Change:** Added module-load IIFE that validates every race's computed evolution profile maps to a valid key in `RACE_EVOLUTION_PROFILES`. Logs warnings for unresolved profiles.
