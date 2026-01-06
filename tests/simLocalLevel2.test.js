import { describe, it, expect } from '@jest/globals';
import { initialgamestate } from '../src/core/GameState.js';
import { addXp } from '../src/systems/leveling/LevelingManager.js';

describe('Simulate local load to level 2', () => {
  it('runs up to 100 times or stops after 10 consecutive no-error rounds', () => {
    let consecutiveSuccess = 0;
    let totalRuns = 0;
    const maxRuns = 100;

    while (totalRuns < maxRuns && consecutiveSuccess < 10) {
      totalRuns += 1;
      let state = JSON.parse(JSON.stringify(initialgamestate));

      try {
        // Simulate local load: no auth, start at level 1
        // Drive XP to reach level 2 deterministically
        const needed = state.player.xp.max - state.player.xp.current;
        state = addXp(state, needed);

        expect(state.player.level).toBeGreaterThanOrEqual(2);
        consecutiveSuccess += 1;
      } catch (e) {
        consecutiveSuccess = 0;
        throw e;
      }
    }

    expect(consecutiveSuccess).toBeGreaterThanOrEqual(10);
    // Useful log for visibility
    // eslint-disable-next-line no-console
    console.log(`Simulation completed: ${totalRuns} runs, ${consecutiveSuccess} consecutive successes`);
  });
});
