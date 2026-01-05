I have performed the analysis and codebase review.

**Simulation Findings:**
1.  **XP System Integrity**: The XP system logic in `levelSystem.js` and `gamelogic.js` is mathematically sound and protected against integer overflow and infinite loops.
2.  **Level Up Logic**: The `levelUp` function correctly uses the `xpForNextLevel` calculation from `levelSystem.js`, ensuring the intended bracketed progression curve is followed.
3.  **AI JSON Handling**: The AI response parsing in `aiService.js` is a potential weak point. It uses `JSON.parse` directly on the AI's output. If the AI returns Markdown (e.g., ```json ... ```), this will crash the game.

**Plan:**
1.  **Create Simulation Script**: I will create a script `scripts/level_simulation.js` to simulate 100 level-up runs to Level 5. This script will:
    *   Initialize a mock game state.
    *   Simulate XP gain (e.g., killing monsters).
    *   Track level-ups and stats.
    *   Log any anomalies (negative XP, level skips, stat inconsistencies).
    *   Verify the XP curve matches the configuration.
2.  **Run Simulation**: Execute the script and report the results.
3.  **Harden AI Parsing**: I will modify `src/lib/aiService.js` to include a regex cleaner that strips Markdown code blocks before parsing JSON. This proactively prevents the "JSON Hallucination" bug identified in my research.

This plan addresses your request to "run 100 different simulations" and fix "common bugs in AI generated code".