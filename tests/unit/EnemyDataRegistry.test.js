import { enemies, getEnemyTemplate, getEnemiesByLevelRange } from '@voidverse/game-core/data/registries/EnemyDataRegistry.js';

describe('EnemyDataRegistry', () => {
  test('contains exactly 30 enemies', () => {
    expect(enemies).toHaveLength(30);
  });

  test('all enemies have required fields', () => {
    const requiredFields = ['id', 'name', 'level', 'type', 'description', 'baseStats', 'xpReward', 'goldReward'];
    const requiredStats = ['hp', 'attack', 'defense', 'speed'];

    for (const enemy of enemies) {
      for (const field of requiredFields) {
        expect(enemy).toHaveProperty(field);
      }
      for (const stat of requiredStats) {
        expect(enemy.baseStats).toHaveProperty(stat);
        expect(typeof enemy.baseStats[stat]).toBe('number');
        expect(enemy.baseStats[stat]).toBeGreaterThan(0);
      }
      expect(typeof enemy.xpReward).toBe('number');
      expect(typeof enemy.goldReward).toBe('number');
      expect(enemy.xpReward).toBeGreaterThan(0);
      expect(enemy.goldReward).toBeGreaterThan(0);
    }
  });

  test('no duplicate IDs', () => {
    const ids = enemies.map(e => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  describe('stat scaling per tier', () => {
    const tiers = [
      { name: 'Tier 1', minLvl: 1, maxLvl: 10, hp: [20, 150], atk: [5, 25], def: [2, 12] },
      { name: 'Tier 2', minLvl: 11, maxLvl: 25, hp: [80, 200], atk: [15, 35], def: [8, 20] },
      { name: 'Tier 3', minLvl: 26, maxLvl: 50, hp: [200, 600], atk: [35, 80], def: [20, 45] },
      { name: 'Tier 4', minLvl: 51, maxLvl: 100, hp: [600, 2000], atk: [80, 200], def: [45, 100] },
      { name: 'Tier 5', minLvl: 101, maxLvl: 200, hp: [2000, 8000], atk: [200, 500], def: [100, 250] },
      { name: 'Tier 6', minLvl: 201, maxLvl: 350, hp: [8000, 30000], atk: [500, 1500], def: [250, 600] },
    ];

    for (const tier of tiers) {
      test(`${tier.name} (levels ${tier.minLvl}-${tier.maxLvl}) stats within expected ranges`, () => {
        const tierEnemies = enemies.filter(e => e.level >= tier.minLvl && e.level <= tier.maxLvl);
        expect(tierEnemies.length).toBeGreaterThan(0);

        for (const enemy of tierEnemies) {
          const { hp, attack, defense } = enemy.baseStats;
          expect(hp).toBeGreaterThanOrEqual(tier.hp[0]);
          expect(hp).toBeLessThanOrEqual(tier.hp[1]);
          expect(attack).toBeGreaterThanOrEqual(tier.atk[0]);
          expect(attack).toBeLessThanOrEqual(tier.atk[1]);
          expect(defense).toBeGreaterThanOrEqual(tier.def[0]);
          expect(defense).toBeLessThanOrEqual(tier.def[1]);
        }
      });
    }
  });

  test('getEnemyTemplate returns correct enemy', () => {
    const goblin = getEnemyTemplate('goblin');
    expect(goblin).not.toBeNull();
    expect(goblin.name).toBe('Goblin');

    const voidTitan = getEnemyTemplate('void_titan');
    expect(voidTitan).not.toBeNull();
    expect(voidTitan.level).toBe(350);
  });

  test('getEnemiesByLevelRange returns enemies in range', () => {
    const earlyEnemies = getEnemiesByLevelRange(1, 10);
    expect(earlyEnemies.length).toBeGreaterThanOrEqual(5);
    for (const e of earlyEnemies) {
      expect(e.level).toBeGreaterThanOrEqual(1);
      expect(e.level).toBeLessThanOrEqual(10);
    }
  });
});
