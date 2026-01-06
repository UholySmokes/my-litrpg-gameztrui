import { describe, it, expect } from '@jest/globals';
import { initialgamestate } from '../src/core/GameState.js';
import { addXp } from '../src/systems/leveling/LevelingManager.js';
import { xpForNextLevel } from '../src/systems/leveling/LevelingSystem.js';
import { renderstatusblock } from '../src/util/statusrenderer.js';

function simulateCharacterCreation(base) {
  const state = JSON.parse(JSON.stringify(base));
  return {
    ...state,
    player: {
      ...state.player,
      name: 'SimUser',
      race: { id: 'Human', name: 'Human' },
      class: 'Warrior',
      attributes: {
        ...state.player.attributes,
        freePoints: (state.player.attributes.freePoints ?? 0) + 5
      }
    }
  };
}

function allocateSkillPoints(state) {
  const free = state.player.attributes.freePoints ?? 0;
  const spend = Math.min(free, 5);
  return {
    ...state,
    player: {
      ...state.player,
      attributes: {
        ...state.player.attributes,
        str: (state.player.attributes.str ?? 5) + Math.floor(spend / 2),
        agi: (state.player.attributes.agi ?? 5) + Math.ceil(spend / 2),
        freePoints: free - spend
      }
    }
  };
}

function driveToLevel(state, targetLevel) {
  let s = JSON.parse(JSON.stringify(state));
  while (s.player.level < targetLevel) {
    const needed = s.player.xp.max - s.player.xp.current;
    s = addXp(s, needed);
    // Optional: small overflow to ensure progression stability
    s = addXp(s, Math.max(1, Math.floor(xpForNextLevel(s.player.level, s.config) * 0.01)));
  }
  return s;
}

describe('Simulate local flow to level 5', () => {
  it('runs up to 1000 times or stops after 50 consecutive success rounds', () => {
    let consecutiveSuccess = 0;
    let totalRuns = 0;
    const maxRuns = 1000;
    const requiredConsecutive = 50;

    while (totalRuns < maxRuns && consecutiveSuccess < requiredConsecutive) {
      totalRuns += 1;
      let state = JSON.parse(JSON.stringify(initialgamestate));
      try {
        // Simulate local start: character creation and skill allocation
        state = simulateCharacterCreation(state);
        state = allocateSkillPoints(state);
        // Drive progression to level 5
        state = driveToLevel(state, 5);
        renderstatusblock(state.player);

        expect(state.player.level).toBeGreaterThanOrEqual(5);
        expect(state.player.attributes.freePoints).toBeGreaterThanOrEqual(0);
        consecutiveSuccess += 1;
      } catch (e) {
        consecutiveSuccess = 0;
        throw e;
      }
    }

    expect(consecutiveSuccess).toBeGreaterThanOrEqual(requiredConsecutive);
    // Log summary (user requested logs)
    // eslint-disable-next-line no-console
    console.log(`[sim] Completed ${totalRuns} runs, ${consecutiveSuccess} consecutive successes`);
    // eslint-disable-next-line no-console
    console.log('[sim] Final state level check passed');
  });
});
