import { describe, it, expect, beforeEach } from 'vitest';
import { effectApplicationSystem } from '../src/lib/logic/EffectApplicationSystem.js';
import { getSkillById } from '../src/lib/skills.js';
import { emit } from '../src/lib/logic/eventBus.js';

// Mock eventBus for testing
vi.mock('../src/lib/logic/eventBus.js', () => ({
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
}));

describe('Skill Effects Integration Tests', () => {
  let mockAttacker;
  let mockDefender;
  
  beforeEach(() => {
    mockAttacker = {
      id: 'player1',
      name: 'Test Player',
      level: 10,
      hp: { current: 100, max: 100 },
      mana: { current: 50, max: 50 },
      attributes: { str: 15, int: 12, dex: 10 }
    };
    
    mockDefender = {
      id: 'enemy1',
      name: 'Test Enemy',
      level: 8,
      hp: { current: 80, max: 80 },
      effects: []
    };
    
    // Clear mock calls
    emit.mockClear();
  });
  
  describe('Poison Effects', () => {
    it('should apply poison effect correctly', () => {
      const poisonEffect = { id: 'poison', duration: 5, target: 'enemy' };
      
      effectApplicationSystem.applyEffect(mockDefender, poisonEffect, mockAttacker);
      
      expect(mockDefender.effects).toHaveLength(1);
      expect(mockDefender.effects[0].id).toBe('poison');
      expect(mockDefender.effects[0].duration).toBe(5);
      expect(emit).toHaveBeenCalledWith('effect:applied', expect.objectContaining({
        effectId: 'poison',
        target: 'enemy1'
      }));
    });
    
    it('should stack poison effects correctly', () => {
      const poisonEffect1 = { id: 'poison', duration: 3, target: 'enemy' };
      const poisonEffect2 = { id: 'poison', duration: 4, target: 'enemy' };
      
      effectApplicationSystem.applyEffect(mockDefender, poisonEffect1, mockAttacker);
      effectApplicationSystem.applyEffect(mockDefender, poisonEffect2, mockAttacker);
      
      expect(mockDefender.effects).toHaveLength(1);
      expect(mockDefender.effects[0].duration).toBe(4); // Should take the longer duration
    });
    
    it('should apply poison from assassin_poison_blade skill', () => {
      const skill = getSkillById('assassin_poison_blade');
      expect(skill.effects).toBeDefined();
      expect(skill.effects).toContainEqual(expect.objectContaining({ id: 'poison' }));
      
      effectApplicationSystem.applyEffects(mockDefender, skill.effects, mockAttacker);
      
      expect(mockDefender.effects).toHaveLength(1);
      expect(mockDefender.effects[0].id).toBe('poison');
    });
  });
  
  describe('Bleed Effects', () => {
    it('should apply bleed effect correctly', () => {
      const bleedEffect = { id: 'bleed', duration: 3, target: 'enemy' };
      
      effectApplicationSystem.applyEffect(mockDefender, bleedEffect, mockAttacker);
      
      expect(mockDefender.effects).toHaveLength(1);
      expect(mockDefender.effects[0].id).toBe('bleed');
      expect(mockDefender.effects[0].duration).toBe(3);
    });
    
    it('should apply bleed from knight_rend skill', () => {
      const skill = getSkillById('knight_rend');
      expect(skill.effects).toBeDefined();
      expect(skill.effects).toContainEqual(expect.objectContaining({ id: 'bleed' }));
      
      effectApplicationSystem.applyEffects(mockDefender, skill.effects, mockAttacker);
      
      expect(mockDefender.effects).toHaveLength(1);
      expect(mockDefender.effects[0].id).toBe('bleed');
    });
    
    it('should apply bleed from assassin_bleed skill', () => {
      const skill = getSkillById('assassin_bleed');
      expect(skill.effects).toBeDefined();
      expect(skill.effects).toContainEqual(expect.objectContaining({ id: 'bleed' }));
      
      effectApplicationSystem.applyEffects(mockDefender, skill.effects, mockAttacker);
      
      expect(mockDefender.effects).toHaveLength(1);
      expect(mockDefender.effects[0].id).toBe('bleed');
    });
  });
  
  describe('Stun Effects', () => {
    it('should apply stun effect correctly', () => {
      const stunEffect = { id: 'stun', duration: 2, target: 'enemy' };
      
      effectApplicationSystem.applyEffect(mockDefender, stunEffect, mockAttacker);
      
      expect(mockDefender.effects).toHaveLength(1);
      expect(mockDefender.effects[0].id).toBe('stun');
      expect(mockDefender.effects[0].duration).toBe(2);
    });
    
    it('should apply stun from knight_shield_bash skill', () => {
      const skill = getSkillById('knight_shield_bash');
      expect(skill.effects).toBeDefined();
      expect(skill.effects).toContainEqual(expect.objectContaining({ id: 'stun' }));
      
      effectApplicationSystem.applyEffects(mockDefender, skill.effects, mockAttacker);
      
      expect(mockDefender.effects).toHaveLength(1);
      expect(mockDefender.effects[0].id).toBe('stun');
    });
    
    it('should apply stun with chance from knight_concussive_blow skill', () => {
      const skill = getSkillById('knight_concussive_blow');
      expect(skill.effects).toBeDefined();
      expect(skill.effects).toContainEqual(expect.objectContaining({ 
        id: 'stun',
        chance: 0.6 
      }));
    });
  });
  
  describe('Slow Effects', () => {
    it('should apply slow effect correctly', () => {
      const slowEffect = { id: 'slow', duration: 3, target: 'enemy' };
      
      effectApplicationSystem.applyEffect(mockDefender, slowEffect, mockAttacker);
      
      expect(mockDefender.effects).toHaveLength(1);
      expect(mockDefender.effects[0].id).toBe('slow');
      expect(mockDefender.effects[0].duration).toBe(3);
    });
    
    it('should apply slow from mage_ice_bolt skill', () => {
      const skill = getSkillById('mage_ice_bolt');
      expect(skill.effects).toBeDefined();
      expect(skill.effects).toContainEqual(expect.objectContaining({ id: 'slow' }));
      
      effectApplicationSystem.applyEffects(mockDefender, skill.effects, mockAttacker);
      
      expect(mockDefender.effects).toHaveLength(1);
      expect(mockDefender.effects[0].id).toBe('slow');
    });
    
    it('should apply slow from warrior_thunder_clap skill', () => {
      const skill = getSkillById('warrior_thunder_clap');
      expect(skill.effects).toBeDefined();
      expect(skill.effects).toContainEqual(expect.objectContaining({ 
        id: 'slow',
        aoe: true 
      }));
    });
    
    it('should apply slow from warrior_hamstring skill', () => {
      const skill = getSkillById('warrior_hamstring');
      expect(skill.effects).toBeDefined();
      expect(skill.effects).toContainEqual(expect.objectContaining({ id: 'slow' }));
      
      effectApplicationSystem.applyEffects(mockDefender, skill.effects, mockAttacker);
      
      expect(mockDefender.effects).toHaveLength(1);
      expect(mockDefender.effects[0].id).toBe('slow');
    });
  });
  
  describe('Freeze Effects', () => {
    it('should apply freeze effect correctly', () => {
      const freezeEffect = { id: 'freeze', duration: 2, target: 'enemy' };
      
      effectApplicationSystem.applyEffect(mockDefender, freezeEffect, mockAttacker);
      
      expect(mockDefender.effects).toHaveLength(1);
      expect(mockDefender.effects[0].id).toBe('freeze');
      expect(mockDefender.effects[0].duration).toBe(2);
    });
    
    it('should apply freeze from mage_frost_nova skill', () => {
      const skill = getSkillById('mage_frost_nova');
      expect(skill.effects).toBeDefined();
      expect(skill.effects).toContainEqual(expect.objectContaining({ 
        id: 'freeze',
        aoe: true 
      }));
    });
  });
  
  describe('Fear Effects', () => {
    it('should apply fear effect correctly', () => {
      const fearEffect = { id: 'fear', duration: 3, target: 'enemy' };
      
      effectApplicationSystem.applyEffect(mockDefender, fearEffect, mockAttacker);
      
      expect(mockDefender.effects).toHaveLength(1);
      expect(mockDefender.effects[0].id).toBe('fear');
      expect(mockDefender.effects[0].duration).toBe(3);
    });
    
    it('should apply fear from warrior_intimidating_shout skill', () => {
      const skill = getSkillById('warrior_intimidating_shout');
      expect(skill.effects).toBeDefined();
      expect(skill.effects).toContainEqual(expect.objectContaining({ 
        id: 'fear',
        aoe: true 
      }));
    });
  });
  
  describe('Blur Effects', () => {
    it('should apply blur effect correctly', () => {
      const blurEffect = { id: 'blur', duration: 3, target: 'self' };
      
      effectApplicationSystem.applyEffect(mockAttacker, blurEffect, mockAttacker);
      
      expect(mockAttacker.effects).toHaveLength(1);
      expect(mockAttacker.effects[0].id).toBe('blur');
      expect(mockAttacker.effects[0].duration).toBe(3);
    });
    
    it('should apply blur from assassin_shadow_dash skill', () => {
      const skill = getSkillById('assassin_shadow_dash');
      expect(skill.effects).toBeDefined();
      expect(skill.effects).toContainEqual(expect.objectContaining({ 
        id: 'blur',
        target: 'self' 
      }));
      
      effectApplicationSystem.applyEffects(mockAttacker, skill.effects, mockAttacker);
      
      expect(mockAttacker.effects).toHaveLength(1);
      expect(mockAttacker.effects[0].id).toBe('blur');
    });
  });
  
  describe('Might Effects', () => {
    it('should apply might effect correctly', () => {
      const mightEffect = { id: 'might', duration: 3, target: 'self' };
      
      effectApplicationSystem.applyEffect(mockAttacker, mightEffect, mockAttacker);
      
      expect(mockAttacker.effects).toHaveLength(1);
      expect(mockAttacker.effects[0].id).toBe('might');
      expect(mockAttacker.effects[0].duration).toBe(3);
    });
    
    it('should apply might from knight_war_cry skill', () => {
      const skill = getSkillById('knight_war_cry');
      expect(skill.effects).toBeDefined();
      expect(skill.effects).toContainEqual(expect.objectContaining({ 
        id: 'might',
        target: 'self' 
      }));
      
      effectApplicationSystem.applyEffects(mockAttacker, skill.effects, mockAttacker);
      
      expect(mockAttacker.effects).toHaveLength(1);
      expect(mockAttacker.effects[0].id).toBe('might');
    });
  });
  
  describe('AoE Effects', () => {
    it('should handle AoE effects correctly', () => {
      const aoeEffect = { id: 'damage', duration: 1, target: 'enemy', aoe: true };
      
      const multipleTargets = [
        { ...mockDefender, id: 'enemy1' },
        { ...mockDefender, id: 'enemy2' },
        { ...mockDefender, id: 'enemy3' }
      ];
      
      multipleTargets.forEach(target => {
        effectApplicationSystem.applyEffect(target, aoeEffect, mockAttacker);
      });
      
      multipleTargets.forEach(target => {
        expect(target.effects).toHaveLength(1);
        expect(target.effects[0].aoe).toBe(true);
      });
    });
    
    it('should identify AoE skills correctly', () => {
      const aoeSkills = [
        'mage_frost_nova',
        'warrior_thunder_clap',
        'warrior_intimidating_shout'
      ];
      
      aoeSkills.forEach(skillId => {
        const skill = getSkillById(skillId);
        expect(skill.effects).toBeDefined();
        expect(skill.effects.some(e => e.aoe)).toBe(true);
      });
    });
  });
  
  describe('Effect Stacking and Duration', () => {
    it('should handle effect stacking correctly', () => {
      const poison1 = { id: 'poison', duration: 3, target: 'enemy' };
      const poison2 = { id: 'poison', duration: 5, target: 'enemy' };
      
      effectApplicationSystem.applyEffect(mockDefender, poison1, mockAttacker);
      expect(mockDefender.effects[0].duration).toBe(3);
      
      effectApplicationSystem.applyEffect(mockDefender, poison2, mockAttacker);
      expect(mockDefender.effects).toHaveLength(1);
      expect(mockDefender.effects[0].duration).toBe(5); // Should take longer duration
    });
    
    it('should handle different effect types separately', () => {
      const poison = { id: 'poison', duration: 3, target: 'enemy' };
      const bleed = { id: 'bleed', duration: 2, target: 'enemy' };
      const stun = { id: 'stun', duration: 1, target: 'enemy' };
      
      effectApplicationSystem.applyEffect(mockDefender, poison, mockAttacker);
      effectApplicationSystem.applyEffect(mockDefender, bleed, mockAttacker);
      effectApplicationSystem.applyEffect(mockDefender, stun, mockAttacker);
      
      expect(mockDefender.effects).toHaveLength(3);
      expect(mockDefender.effects.map(e => e.id)).toEqual(['poison', 'bleed', 'stun']);
    });
  });
  
  describe('Effect Application with Chance', () => {
    it('should handle effects with chance correctly', () => {
      const stunEffect = { id: 'stun', duration: 2, chance: 0.6 };
      
      // Mock Math.random to return values below and above chance threshold
      const originalRandom = Math.random;
      
      // Test successful application
      Math.random = () => 0.3; // Below 0.6
      const defender1 = { ...mockDefender, effects: [] };
      effectApplicationSystem.applyEffect(defender1, stunEffect, mockAttacker);
      expect(defender1.effects).toHaveLength(1);
      
      // Test failed application
      Math.random = () => 0.8; // Above 0.6
      const defender2 = { ...mockDefender, effects: [] };
      effectApplicationSystem.applyEffect(defender2, stunEffect, mockAttacker);
      expect(defender2.effects).toHaveLength(0);
      
      Math.random = originalRandom;
    });
  });
  
  describe('Effect Targeting', () => {
    it('should handle self-targeting effects correctly', () => {
      const selfEffect = { id: 'buff', duration: 5, target: 'self' };
      
      effectApplicationSystem.applyEffect(mockAttacker, selfEffect, mockAttacker);
      
      expect(mockAttacker.effects).toHaveLength(1);
      expect(mockAttacker.effects[0].id).toBe('buff');
    });
    
    it('should handle enemy-targeting effects correctly', () => {
      const enemyEffect = { id: 'debuff', duration: 3, target: 'enemy' };
      
      effectApplicationSystem.applyEffect(mockDefender, enemyEffect, mockAttacker);
      
      expect(mockDefender.effects).toHaveLength(1);
      expect(mockDefender.effects[0].id).toBe('debuff');
    });
  });
  
  describe('Effect Processing', () => {
    it('should process effects correctly', () => {
      const poison = { id: 'poison', duration: 3, target: 'enemy' };
      const bleed = { id: 'bleed', duration: 2, target: 'enemy' };
      
      mockDefender.effects = [poison, bleed];
      
      // Process one turn
      effectApplicationSystem.processEffects(mockDefender);
      
      expect(mockDefender.effects).toHaveLength(2);
      expect(mockDefender.effects[0].duration).toBe(2);
      expect(mockDefender.effects[1].duration).toBe(1);
    });
    
    it('should remove expired effects', () => {
      const poison = { id: 'poison', duration: 1, target: 'enemy' };
      const bleed = { id: 'bleed', duration: 3, target: 'enemy' };
      
      mockDefender.effects = [poison, bleed];
      
      // Process one turn (poison should expire)
      effectApplicationSystem.processEffects(mockDefender);
      
      expect(mockDefender.effects).toHaveLength(1);
      expect(mockDefender.effects[0].id).toBe('bleed');
      expect(mockDefender.effects[0].duration).toBe(2);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle invalid effects gracefully', () => {
      const invalidEffect = null;
      
      expect(() => {
        effectApplicationSystem.applyEffect(mockDefender, invalidEffect, mockAttacker);
      }).not.toThrow();
      
      expect(mockDefender.effects).toHaveLength(0);
    });
    
    it('should handle effects without duration', () => {
      const noDurationEffect = { id: 'instant', target: 'enemy' };
      
      expect(() => {
        effectApplicationSystem.applyEffect(mockDefender, noDurationEffect, mockAttacker);
      }).not.toThrow();
    });
    
    it('should handle effects without target', () => {
      const noTargetEffect = { id: 'test', duration: 3 };
      
      expect(() => {
        effectApplicationSystem.applyEffect(mockDefender, noTargetEffect, mockAttacker);
      }).not.toThrow();
    });
  });
  
  describe('Performance', () => {
    it('should handle multiple effect applications efficiently', () => {
      const startTime = performance.now();
      
      // Apply 100 effects
      for (let i = 0; i < 100; i++) {
        const effect = { id: `effect${i}`, duration: 5, target: 'enemy' };
        effectApplicationSystem.applyEffect(mockDefender, effect, mockAttacker);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(100); // Should complete in under 100ms
      expect(mockDefender.effects).toHaveLength(100);
    });
  });
});