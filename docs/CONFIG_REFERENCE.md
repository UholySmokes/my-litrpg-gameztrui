# Config Reference

## Core Balance Keys
- `maxLevel`: Maximum player level.
- `attributePointsPerLevel`: Free attribute points gained on level up.
- `baseAttributeValue`: Default attribute baseline for new characters.
- `strToDamageMultiplier`: Strength to damage scaling multiplier.
- `baseLuckCritChance`: Base crit chance multiplier per luck point.
- `agilityEscapeBonus`: Escape chance bonus per agility point.
- `baseEscapeChance`: Base escape chance before agility scaling.
- `defenseReductionFactor`: Multiplier applied to defense when reducing damage.

## XP Curve Keys
- `xpBrackets`: Piecewise curve defining XP scaling by level.
- `xpBonusPerLevelDiff`: Bonus XP multiplier per level above the player.
- `xpMalusPerLevelDiff`: XP penalty multiplier per level below the player.
- `xpNoRewardBelowDelta`: Level delta below which XP is zero.
- `xpMinMultiplier`: Minimum XP multiplier floor.

## Rest And Regen Keys
- `restHealAmount`: Flat HP restored when resting.
- `restManaAmount`: Flat mana restored when resting.
- `manaRegenPerTurn`: Mana regen per turn in combat.
- `classEvolutionLevel`: Level required for class evolution.

## Notes
- These defaults originate in `src/core/StateNormalizer.js` and `src/data/initialState.js`.
- Dungeon generation tuning is provided via `DungeonGenerator` constructor or `generate` overrides.
