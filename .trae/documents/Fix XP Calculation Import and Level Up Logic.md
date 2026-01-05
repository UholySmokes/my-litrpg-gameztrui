I have identified the issue. The function `calculateGainedXP` is being called in `src/lib/gamelogic.js` but it is not imported.

**Plan:**
1.  **Add Import**: In `src/lib/gamelogic.js`, import `calculateGainedXP` and `xpForNextLevel` from `./logic/levelSystem`.
2.  **Fix Level Up Logic**: Update the `levelUp` function in `src/lib/gamelogic.js` to use `xpForNextLevel` from `levelSystem.js` instead of the hardcoded `xpScalingFactor`. This ensures consistency with the new level system we implemented earlier.

This will resolve the `ReferenceError: calculateGainedXP is not defined` and ensure the XP system works as designed.