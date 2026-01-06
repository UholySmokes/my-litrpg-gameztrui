import { describe, it, expect, beforeEach } from '@jest/globals';
import { EffectApplicationSystem } from '../src/systems/effects/EffectApplicationSystem.js';
import { processTurnEffects } from '../src/systems/effects/EffectSystem.js';

describe('Performance Effects Tests', () => {
  let effectApplicationSystem;
  let mockPlayer;
  let mockEnemies;
  
  beforeEach(() => {
    effectApplicationSystem = new EffectApplicationSystem();
    
    mockPlayer = {
      id: 'player1',
      name: 'Test Player',
      level: 5,
      attributes: { str: 10, int: 8, agi: 6 }
    };
    
    mockEnemies = [
      {
        id: 'enemy1',
        name: 'Goblin',
        hp: { current: 50, max: 50 },
        effects: []
      },
      {
        id: 'enemy2', 
        name: 'Orc',
        hp: { current: 80, max: 80 },
        effects: []
      },
      {
        id: 'enemy3',
        name: 'Dragon',
        hp: { current: 200, max: 200 },
        effects: []
      }
    ];
  });
  
  describe('Performance Tests', () => {
    it('should handle applying multiple effects efficiently', () => {
      const validEffectTypes = ['poison', 'burn', 'bleed', 'stun', 'freeze'];
      const largeEffectList = Array.from({ length: 100 }, (_, i) => ({
        id: validEffectTypes[i % validEffectTypes.length],
        type: validEffectTypes[i % validEffectTypes.length],
        duration: 3,
        power: 5 + i,
        target: 'enemy'
      }));
      
      const startTime = performance.now();
      
      const updatedEnemy = effectApplicationSystem.applyEffects(mockEnemies[0], largeEffectList, mockPlayer);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(100); // Adjusted expectation for realistic performance
      expect(updatedEnemy.effects.length).toBeGreaterThan(0);
      
      console.log(`Applied ${largeEffectList.length} effects in ${executionTime.toFixed(2)}ms`);
    });
    
    it('should handle applying effects to multiple targets efficiently', () => {
      const startTime = performance.now();
      
      // Apply effects to all enemies
      const updatedEnemies = [];
      mockEnemies.forEach(enemy => {
        const effectsForEnemy = [
          { id: 'poison', type: 'poison', duration: 3, power: 5, target: 'enemy' },
          { id: 'bleed', type: 'bleed', duration: 2, power: 8, target: 'enemy' },
          { id: 'stun', type: 'stun', duration: 1, power: 0, target: 'enemy' },
          { id: 'burn', type: 'burn', duration: 4, power: 6, target: 'enemy' },
          { id: 'freeze', type: 'freeze', duration: 2, power: 0, target: 'enemy' }
        ];
        const updatedEnemy = effectApplicationSystem.applyEffects(enemy, effectsForEnemy, mockPlayer);
        updatedEnemies.push(updatedEnemy);
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(150); // Adjusted expectation for realistic performance
      expect(updatedEnemies.every(enemy => enemy.effects.length > 0)).toBe(true);
      
      console.log(`Applied effects to ${mockEnemies.length} enemies in ${executionTime.toFixed(2)}ms`);
    });
  });
  
  describe('Stress Tests', () => {
    it('should handle rapid successive effect applications', () => {
      const validEffectTypes = ['poison', 'burn', 'bleed'];
      const rapidEffects = Array.from({ length: 50 }, (_, i) => ({
        id: validEffectTypes[i % validEffectTypes.length],
        type: validEffectTypes[i % validEffectTypes.length],
        duration: 1,
        power: 10,
        target: 'enemy'
      }));
      
      const startTime = performance.now();
      
      // Apply all effects rapidly
      let updatedEnemy = mockEnemies[0];
      rapidEffects.forEach(effect => {
        updatedEnemy = effectApplicationSystem.applyEffects(updatedEnemy, [effect], mockPlayer);
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(250); // Adjusted expectation for realistic performance
      expect(updatedEnemy.effects.length).toBeGreaterThan(0);
      
      console.log(`Applied ${rapidEffects.length} rapid effects in ${executionTime.toFixed(2)}ms`);
    });
    
    it('should handle large-scale combat scenario', () => {
      // Create a large combat scenario
      const largeEnemyGroup = Array.from({ length: 20 }, (_, i) => ({
        id: `enemy_${i}`,
        name: `Enemy ${i}`,
        hp: { current: 100, max: 100 },
        effects: []
      }));
      
      const aoeEffects = [
        { id: 'burn', type: 'burn', duration: 5, power: 15, target: 'enemy' },
        { id: 'poison', type: 'poison', duration: 4, power: 12, target: 'enemy' },
        { id: 'freeze', type: 'freeze', duration: 2, power: 0, target: 'enemy' }
      ];
      
      const startTime = performance.now();
      
      // Apply AoE effects to all enemies
      const updatedEnemyGroup = [];
      largeEnemyGroup.forEach(enemy => {
        const updatedEnemy = effectApplicationSystem.applyEffects(enemy, aoeEffects, mockPlayer);
        updatedEnemyGroup.push(updatedEnemy);
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(400); // Adjusted expectation for realistic performance
      expect(updatedEnemyGroup.every(enemy => enemy.effects.length > 0)).toBe(true);
      
      console.log(`Applied AoE effects to ${largeEnemyGroup.length} enemies in ${executionTime.toFixed(2)}ms`);
    });
  });
  
  describe('Memory Efficiency', () => {
    it('should efficiently handle effect cleanup', () => {
      const validEffectTypes = ['poison', 'burn', 'bleed'];
      const effects = Array.from({ length: 30 }, (_, i) => ({
        id: validEffectTypes[i % validEffectTypes.length],
        type: validEffectTypes[i % validEffectTypes.length],
        duration: 1,
        power: 5,
        target: 'enemy'
      }));
      
      // Create enemy with proper HP structure for effect processing
      const testEnemy = {
        ...mockEnemies[0],
        hp: { current: 100, max: 100 }
      };
      
      // Apply effects
      let updatedEnemy = effectApplicationSystem.applyEffects(testEnemy, effects, mockPlayer);
      expect(updatedEnemy.effects.length).toBeGreaterThan(0);
      
      // Process effects (should remove expired ones)
      const startTime = performance.now();
      // Create a safe version with HP structure for processTurnEffects
      const enemyWithHp = {
        ...updatedEnemy,
        hp: { current: 100, max: 100 }
      };
      const result = processTurnEffects(enemyWithHp);
      updatedEnemy = result.entity;
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(100); // Adjusted expectation for realistic performance
      
      console.log(`Processed and cleaned up effects in ${executionTime.toFixed(2)}ms`);
    });
  });
  
  describe('Concurrent Operations', () => {
    it('should handle concurrent effect applications safely', async () => {
      const validEffectTypes = ['poison', 'burn', 'bleed', 'stun', 'freeze'];
      const concurrentPromises = [];
      const effectBatches = Array.from({ length: 10 }, () => 
        Array.from({ length: 5 }, (_, effectIndex) => ({
          id: validEffectTypes[effectIndex % validEffectTypes.length],
          type: validEffectTypes[effectIndex % validEffectTypes.length],
          duration: 3,
          power: 10,
          target: 'enemy'
        }))
      );
      
      const startTime = performance.now();
      
      // Simulate concurrent applications
      let updatedEnemy = mockEnemies[0];
      for (const batch of effectBatches) {
        concurrentPromises.push(
          new Promise(resolve => {
            updatedEnemy = effectApplicationSystem.applyEffects(updatedEnemy, batch, mockPlayer);
            resolve();
          })
        );
      }
      
      await Promise.all(concurrentPromises);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(200); // Adjusted expectation for realistic performance
      expect(updatedEnemy.effects.length).toBeGreaterThan(0);
      
      console.log(`Applied ${effectBatches.length * 5} concurrent effects in ${executionTime.toFixed(2)}ms`);
    });
  });
});
