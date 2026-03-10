# XP Balance Milestones (Hybrid Progression)

> Values are illustrative targets based on the bracketed curve in `src/lib/logic/levelSystem.js`. Adjust by tuning `state.config.xpBrackets` and level-delta bonus/malus.

| Level | XP to Next | Cumulative XP | Notes |
|-------|------------|---------------|-------|
| 1 | ~50 | ~50 | Very fast onboarding (1–2 fights) |
| 10 | ~930 | ~3.4k | Early game wraps quickly |
| 50 | ~10k | ~270k | Mid-game pacing steady |
| 100 | ~31k | ~1.3M | |
| 250 | ~61k | ~9M | |
| 500 | ~116k | ~32M | |
| 750 | ~203k | ~64M | |
| 1000 | ~342k | ~114M | Target total playtime ~400–800h depending on fights/hour & non-combat share |

## Level-Delta XP (calculateGainedXP)

Defaults: +20% per level above, -10% per level below, 0 XP if 10+ levels below, floor 0.

| Player Lv | Mob Lv | Base XP | Earned XP |
|-----------|--------|---------|-----------|
| 10 | 5  | 100 | 50 |
| 10 | 10 | 100 | 100 |
| 10 | 15 | 100 | 200 |

## Simulation script (L1→20 fights-per-level)

See `scripts/simulateXpLoop.js` for an equal-level fight simulation that prints fights needed per level using the current curve.
