import { describe, it, expect } from '@jest/globals';
import {
  applyDeathPenalty,
  DEATH_GOLD_PENALTY_PERCENT,
  DEATH_RESPAWN_HP,
  DEATH_RESPAWN_MANA,
} from '../../packages/game-core/src/systems/DeathPenalty.js';

describe('DeathPenalty', () => {
  const basePlayer = {
    hp: { current: 0, max: 100 },
    mana: { current: 0, max: 50 },
    gold: 1000,
  };

  it('exports correct constants', () => {
    expect(DEATH_GOLD_PENALTY_PERCENT).toBe(0.10);
    expect(DEATH_RESPAWN_HP).toBe(1);
    expect(DEATH_RESPAWN_MANA).toBe(1);
  });

  it('calculates 10% gold loss correctly', () => {
    const { updatedPlayer, deathNotification } = applyDeathPenalty(basePlayer, 'a goblin');
    expect(updatedPlayer.gold).toBe(900);
    expect(deathNotification.goldLost).toBe(100);
  });

  it('respawns player with 1 HP and 1 mana', () => {
    const { updatedPlayer } = applyDeathPenalty(basePlayer, 'a goblin');
    expect(updatedPlayer.hp.current).toBe(1);
    expect(updatedPlayer.mana.current).toBe(1);
  });

  it('does not lose gold when player has 0 gold', () => {
    const broke = { ...basePlayer, gold: 0 };
    const { updatedPlayer, deathNotification } = applyDeathPenalty(broke, 'a slime');
    expect(updatedPlayer.gold).toBe(0);
    expect(deathNotification.goldLost).toBe(0);
  });

  it('floors gold loss to integer', () => {
    const oddGold = { ...basePlayer, gold: 33 };
    const { updatedPlayer, deathNotification } = applyDeathPenalty(oddGold, 'a rat');
    expect(deathNotification.goldLost).toBe(3); // floor(33 * 0.10) = 3
    expect(updatedPlayer.gold).toBe(30);
  });

  it('death notification includes cause', () => {
    const { deathNotification } = applyDeathPenalty(basePlayer, 'a dragon');
    expect(deathNotification.cause).toBe('a dragon');
    expect(deathNotification.message).toContain('a dragon');
  });

  it('death notification includes gold lost amount', () => {
    const { deathNotification } = applyDeathPenalty(basePlayer, 'a wolf');
    expect(deathNotification.goldLost).toBe(100);
    expect(deathNotification.type).toBe('death');
    expect(deathNotification.respawnHp).toBe(1);
    expect(deathNotification.respawnMana).toBe(1);
  });

  it('handles missing cause gracefully', () => {
    const { deathNotification } = applyDeathPenalty(basePlayer);
    expect(deathNotification.cause).toBe('Unknown cause');
    expect(deathNotification.message).toContain('defeated');
  });

  it('works with currency.goldCoins field', () => {
    const currencyPlayer = {
      hp: { current: 0, max: 80 },
      mana: { current: 0, max: 40 },
      currency: { goldCoins: 500 },
    };
    const { updatedPlayer, deathNotification } = applyDeathPenalty(currencyPlayer, 'a bandit');
    expect(updatedPlayer.currency.goldCoins).toBe(450);
    expect(deathNotification.goldLost).toBe(50);
  });

  it('preserves other player state fields', () => {
    const richPlayer = { ...basePlayer, level: 5, name: 'Hero' };
    const { updatedPlayer } = applyDeathPenalty(richPlayer, 'a boss');
    expect(updatedPlayer.level).toBe(5);
    expect(updatedPlayer.name).toBe('Hero');
    expect(updatedPlayer.hp.max).toBe(100);
    expect(updatedPlayer.mana.max).toBe(50);
  });
});
