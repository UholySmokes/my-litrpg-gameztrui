# Playtest Checklist

## Core Loop
- Start a new run and confirm initial stats and inventory render.
- Enter combat and verify turn order, damage logs, and resource changes.
- Use an active skill with mana cost and confirm cooldown updates.
- Defeat an enemy and verify XP gain and loot drops.
- Level up and confirm HP and mana reset plus free points.

## Systems Coverage
- Equip and unequip at least one item per slot.
- Add a new profession and craft a recipe.
- Trigger a status effect and confirm it expires.
- Save and reload a run, then verify state parity.

## Magic Ecology Coverage
- Use `magic_sense` and confirm ambient context includes biome/time/weather/anomalies/sources.
- Run `draw -> refine -> compress -> weave -> release` and confirm resonance rises and outcomes stay readable.
- Trigger high resonance and verify overload side effects can occur and are narrated clearly.
- Build reserve taint, then use `magic_purge` and confirm taint drops at stability/resonance cost.
- Move between locations and confirm turn advances now also tick time/weather/ecology decay.
- Open Status and verify Magic Ecology panel shows resonance, reserves/taint, ambient drivers, patterns, and perks.
- Complete at least one source-discovery quest (`storm_water` or `ash_fire`) via auto-complete hooks.

## Regression Checks
- Try to use an item at zero quantity.
- Attempt to move to a locked area.
- Attempt to escape combat at low HP.
