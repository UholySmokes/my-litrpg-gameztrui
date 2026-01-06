import { describe, it, expect, beforeEach } from 'vitest';
import { effectApplicationSystem } from '../src/lib/logic/EffectApplicationSystem.js';
import { calculateDamagePipeline } from '../src/lib/gamelogic.js';
import { fuseSkills } from '../src/lib/logic/SkillEvolutionManager.js';
import { getSkillById } from '../src/lib/skills.js';
import { emit } from '../src/lib/logic/eventBus.js';

// Mock eventBus for testing
vi.mock('../src/lib/logic/eventBus.js', () => ({
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
}));

describe('End-to-End Effect Integration Tests', () => {
  let mockPlayer;
  let mockEnemy;
  let mockCombatState;
  
  beforeEach(() => {
    mockPlayer = {
      id: 'player1',
      name: 'Test Player',
      level: 25,
      hp: { current: 150, max: 150 },
      mana: { current: 80, max: 80 },
      attributes: { str: 20, int: 18, dex: 15, luck: 12 },
      talents: ['destruction'],
      effects: []
    };
    
    mockEnemy = {
      id: 'enemy1',
      name: 'Test Enemy',
      level: 20,
      hp: { current: 120, max: 120 },
      attributes: { str: 15, int: 10, dex: 12 },
      effects: [],
      tags: ['humanoid']
    };
    
    mockCombatState = {
      player: mockPlayer,
      enemies: [mockEnemy],
      turn: 'player',
      effects: []
    };
    
    // Clear mock calls
    emit.mockClear();
  });
  
  describe('Combined Effect Application', () => {
    it('should handle multiple effects from different skills', () => {
      // Get skills with different effects
      const poisonBlade = getSkillById('assassin_poison_blade');
      const shieldBash = getSkillById('knight_shield_bash');
      
      // Apply poison effect
      effectApplicationSystem.applyEffects(mockEnemy, poisonBlade.effects, mockPlayer);
      
      // Apply stun effect
      effectApplicationSystem.applyEffects(mockEnemy, shieldBash.effects, mockPlayer);
      
      expect(mockEnemy.effects).toHaveLength(2);
      expect(mockEnemy.effects.map(e => e.id)).toEqual(['poison', 'stun']);
      
      // Verify effect durations
      const poison = mockEnemy.effects.find(e => e.id === 'poison');
      const stun = mockEnemy.effects.find(e => e.id === 'stun');
      
      expect(poison.duration).toBe(5);
      expect(stun.duration).toBe(1);
    });
    
    it('should handle effect stacking and interactions', () => {
      // Create custom effects that interact
      const burnEffect = { id: 'burn', duration: 3, target: 'enemy', potency: 2 };
      const freezeEffect = { id: 'freeze', duration: 2, target: 'enemy' };
      
      // Apply both effects
      effectApplicationSystem.applyEffect(mockEnemy, burnEffect, mockPlayer);
      effectApplicationSystem.applyEffect(mockEnemy, freezeEffect, mockPlayer);
      
      expect(mockEnemy.effects).toHaveLength(2);
      
      // Process one turn
      effectApplicationSystem.processEffects(mockEnemy);
      
      // Check remaining durations
      const burn = mockEnemy.effects.find(e => e.id === 'burn');
      const freeze = mockEnemy.effects.find(e => e.id === 'freeze');
      
      expect(burn.duration).toBe(2);
      expect(freeze.duration).toBe(1);
    });
    
    it('should handle self and enemy targeting in same combat round', () => {
      // Apply self-buff
      const mightEffect = { id: 'might', duration: 3, target: 'self' };
      effectApplicationSystem.applyEffect(mockPlayer, mightEffect, mockPlayer);
      
      // Apply enemy debuff
      const poisonEffect = { id: 'poison', duration: 4, target: 'enemy' };
      effectApplicationSystem.applyEffect(mockEnemy, poisonEffect, mockPlayer);
      
      expect(mockPlayer.effects).toHaveLength(1);
      expect(mockPlayer.effects[0].id).toBe('might');
      
      expect(mockEnemy.effects).toHaveLength(1);
      expect(mockEnemy.effects[0].id).toBe('poison');
    });
  });
  
  describe('Combat Integration with Effects', () => {
    it('should apply effects during combat damage calculation', () => {
      // Apply a damage-boosting effect to player
      const rageEffect = { id: 'rage', duration: 2, target: 'self', damageMultiplier: 1.5 };
      effectApplicationSystem.applyEffect(mockPlayer, rageEffect, mockPlayer);
      
      // Calculate damage with effect active
      const result = calculateDamagePipeline(mockPlayer, mockEnemy, null);
      
      expect(result.damage).toBeGreaterThan(0);
      expect(result.log).toBeDefined();
      expect(Array.isArray(result.log)).toBe(true);
    });
    
    it('should handle talent-based magnitude caps in combat', () => {
      // Player has destruction talent which provides magnitude caps
      const result = calculateDamagePipeline(mockPlayer, mockEnemy, null);
      
      expect(result.damage).toBeGreaterThan(0);
      
      // Check if magnitude cap was applied (should be logged)
      const magnitudeLog = result.log.find(entry => entry.stage === 'MAGNITUDE_CAP');
      expect(magnitudeLog).toBeDefined();
      expect(magnitudeLog.reason).toContain('damage cap');
    });
    
    it('should handle skill-based effects in combat', () => {
      // Use a skill with effects
      const rendSkill = getSkillById('knight_rend');
      
      // Simulate skill execution with effects
      effectApplicationSystem.applyEffects(mockEnemy, rendSkill.effects, mockPlayer);
      
      expect(mockEnemy.effects).toHaveLength(1);
      expect(mockEnemy.effects[0].id).toBe('bleed');
      expect(mockEnemy.effects[0].duration).toBe(3);
    });
  });
  
  describe('Effect Fusion Integration', () => {
    it('should handle fused skills with combined effects', () => {
      // Get two skills to fuse
      const shieldBash = getSkillById('knight_shield_bash');
      const rend = getSkillById('knight_rend');
      
      // Fuse the skills
      const fusedSkill = fuseSkills(shieldBash, rend, mockPlayer.level);
      
      expect(fusedSkill.effects).toBeDefined();
      expect(fusedSkill.effects.length).toBeGreaterThan(0);
      
      // Apply fused skill effects
      effectApplicationSystem.applyEffects(mockEnemy, fusedSkill.effects, mockPlayer);
      
      // Should have both original effects
      const effectIds = mockEnemy.effects.map(e => e.id);
      expect(effectIds).toContain('stun');
      expect(effectIds).toContain('bleed');
    });
    
    it('should handle skill-item fusion with enhanced effects', () => {
      // Create a mock item with effects
      const catalystItem = {
        id: 'poison_catalyst',
        name: 'Poison Catalyst',
        tags: ['Catalyst', 'Poison'],
        effects: [{ id: 'poison_enhance', duration: 2, potency: 1.5 }],
        quality: 'rare'
      };
      
      const poisonBlade = getSkillById('assassin_poison_blade');
      
      // This would be done by the fusion system
      const enhancedEffects = [
        ...poisonBlade.effects,
        ...catalystItem.effects.map(e => ({ ...e, potency: (e.potency || 1) * 0.7 }))
      ];
      
      effectApplicationSystem.applyEffects(mockEnemy, enhancedEffects, mockPlayer);
      
      expect(mockEnemy.effects.length).toBeGreaterThan(0);
      
      // Check for enhanced poison effect
      const poisonEffect = mockEnemy.effects.find(e => e.id === 'poison');
      expect(poisonEffect).toBeDefined();
    });
  });
  
  describe('AoE Effect Application', () => {
    it('should handle AoE effects on multiple enemies', () => {
      // Create multiple enemies
      const enemies = [
        { ...mockEnemy, id: 'enemy1' },
        { ...mockEnemy, id: 'enemy2' },
        { ...mockEnemy, id: 'enemy3' }
      ];
      
      // Create AoE effect
      const aoeFear = { id: 'fear', duration: 2, target: 'enemy', aoe: true };
      
      // Apply to all enemies
      enemies.forEach(enemy => {
        effectApplicationSystem.applyEffect(enemy, aoeFear, mockPlayer);
      });
      
      // Verify all enemies have the effect
      enemies.forEach(enemy => {
        expect(enemy.effects).toHaveLength(1);
        expect(enemy.effects[0].id).toBe('fear');
        expect(enemy.effects[0].aoe).toBe(true);
      });
    });
    
    it('should handle mixed single-target and AoE effects', () => {
      // Create multiple enemies
      const enemies = [
        { ...mockEnemy, id: 'enemy1' },
        { ...mockEnemy, id: 'enemy2' }
      ];
      
      // Single target effect on first enemy
      const poisonEffect = { id: 'poison', duration: 3, target: 'enemy' };
      effectApplicationSystem.applyEffect(enemies[0], poisonEffect, mockPlayer);
      
      // AoE effect on both
      const slowEffect = { id: 'slow', duration: 2, target: 'enemy', aoe: true };
      enemies.forEach(enemy => {
        effectApplicationSystem.applyEffect(enemy, slowEffect, mockPlayer);
      });
      
      // First enemy should have both effects
      expect(enemies[0].effects).toHaveLength(2);
      expect(enemies[0].effects.map(e => e.id)).toEqual(['poison', 'slow']);
      
      // Second enemy should only have slow effect
      expect(enemies[1].effects).toHaveLength(1);
      expect(enemies[1].effects[0].id).toBe('slow');
    });
  });
  
  describe('Effect Timing and Turn Management', () => {
    it('should handle effects across multiple combat turns', () => {
      // Apply long-duration effect
      const poisonEffect = { id: 'poison', duration: 5, target: 'enemy' };
      effectApplicationSystem.applyEffect(mockEnemy, poisonEffect, mockPlayer);
      
      // Simulate 3 combat turns
      for (let turn = 0; turn < 3; turn++) {
        effectApplicationSystem.processEffects(mockEnemy);
      }
      
      // Should have 2 turns remaining
      const remainingPoison = mockEnemy.effects.find(e => e.id === 'poison');
      expect(remainingPoison.duration).toBe(2);
    });
    
    it('should handle effect expiration correctly', () => {
      // Apply short-duration effect
      const stunEffect = { id: 'stun', duration: 1, target: 'enemy' };
      effectApplicationSystem.applyEffect(mockEnemy, stunEffect, mockPlayer);
      
      // Process one turn (should expire)
      effectApplicationSystem.processEffects(mockEnemy);
      
      // Effect should be removed
      expect(mockEnemy.effects).toHaveLength(0);
    });
    
    it('should handle simultaneous effect application and processing', () => {
      // Apply multiple effects at once
      const effects = [
        { id: 'poison', duration: 3, target: 'enemy' },
        { id: 'bleed', duration: 2, target: 'enemy' },
        { id: 'slow', duration: 4, target: 'enemy' }
      ];
      
      effectApplicationSystem.applyEffects(mockEnemy, effects, mockPlayer);
      
      expect(mockEnemy.effects).toHaveLength(3);
      
      // Process one turn
      effectApplicationSystem.processEffects(mockEnemy);
      
      // Check remaining durations
      expect(mockEnemy.effects.find(e => e.id === 'poison').duration).toBe(2);
      expect(mockEnemy.effects.find(e => e.id === 'bleed').duration).toBe(1);
      expect(mockEnemy.effects.find(e => e.id === 'slow').duration).toBe(3);
    });
  });
  
  describe('Complex Effect Interactions', () => {
    it('should handle conflicting effects (e.g., freeze vs burn)', () => {
      // Apply conflicting effects
      const freezeEffect = { id: 'freeze', duration: 3, target: 'enemy' };
      const burnEffect = { id: 'burn', duration: 4, target: 'enemy' };
      
      effectApplicationSystem.applyEffect(mockEnemy, freezeEffect, mockPlayer);
      effectApplicationSystem.applyEffect(mockEnemy, burnEffect, mockPlayer);
      
      expect(mockEnemy.effects).toHaveLength(2);
      
      // Process turns to see interaction
      effectApplicationSystem.processEffects(mockEnemy);
      
      // Both effects should still be active
      expect(mockEnemy.effects.find(e => e.id === 'freeze').duration).toBe(2);
      expect(mockEnemy.effects.find(e => e.id === 'burn').duration).toBe(3);
    });
    
    it('should handle effect potency and stacking', () => {
      // Apply same effect with different potencies
      const weakPoison = { id: 'poison', duration: 3, target: 'enemy', potency: 1 };
      const strongPoison = { id: 'poison', duration: 3, target: 'enemy', potency: 3 };
      
      // Apply weak first, then strong
      effectApplicationSystem.applyEffect(mockEnemy, weakPoison, mockPlayer);
      effectApplicationSystem.applyEffect(mockEnemy, strongPoison, mockPlayer);
      
      // Should keep the stronger potency
      const finalPoison = mockEnemy.effects.find(e => e.id === 'poison');
      expect(finalPoison.potency).toBe(3);
    });
    
    it('should handle effect chance in multi-target scenarios', () => {
      // Create multiple enemies
      const enemies = [
        { ...mockEnemy, id: 'enemy1' },
        { ...mockEnemy, id: 'enemy2' },
        { ...mockEnemy, id: 'enemy3' }
      ];
      
      // Effect with 50% chance
      const chanceEffect = { id: 'stun', duration: 2, target: 'enemy', chance: 0.5 };
      
      // Mock Math.random for consistent testing
      const originalRandom = Math.random;
      let callCount = 0;
      Math.random = () => {
        callCount++;
        return callCount % 2 === 0 ? 0.3 : 0.7; // Alternate between success and failure
      };
      
      // Apply to all enemies
      enemies.forEach(enemy => {
        effectApplicationSystem.applyEffect(enemy, chanceEffect, mockPlayer);
      });
      
      // Should have roughly half the enemies affected
      const affectedCount = enemies.filter(e => e.effects.length > 0).length;
      expect(affectedCount).toBeGreaterThan(0);
      expect(affectedCount).toBeLessThan(3);
      
      Math.random = originalRandom;
    });
  });
  
  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid effect data gracefully', () => {
      const invalidEffects = [
        null,
        undefined,
        {},
        { id: null },
        { id: 'test', duration: -1 },
        { id: 'test', duration: 'invalid' }
      ];
      
      invalidEffects.forEach(effect => {
        expect(() => {
          effectApplicationSystem.applyEffect(mockEnemy, effect, mockPlayer);
        }).not.toThrow();
      });
      
      // Enemy should not have any invalid effects
      expect(mockEnemy.effects.every(e => e.id && e.duration >= 0)).toBe(true);
    });
    
    it('should handle missing target entities gracefully', () => {
      const validEffect = { id: 'poison', duration: 3, target: 'enemy' };
      
      expect(() => {
        effectApplicationSystem.applyEffect(null, validEffect, mockPlayer);
        effectApplicationSystem.applyEffect(undefined, validEffect, mockPlayer);
        effectApplicationSystem.applyEffect({}, validEffect, mockPlayer);
      }).not.toThrow();
    });
    
    it('should handle circular effect dependencies', () => {
      // Create effects that might reference each other
      const effectA = { id: 'effectA', duration: 2, target: 'enemy', requires: 'effectB' };
      const effectB = { id: 'effectB', duration: 2, target: 'enemy', requires: 'effectA' };
      
      effectApplicationSystem.applyEffect(mockEnemy, effectA, mockPlayer);
      effectApplicationSystem.applyEffect(mockEnemy, effectB, mockPlayer);
      
      // Both should be applied without infinite loops
      expect(mockEnemy.effects).toHaveLength(2);
      expect(mockEnemy.effects.map(e => e.id)).toEqual(['effectA', 'effectB']);
    });
  });
});