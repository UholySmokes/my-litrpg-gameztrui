import { describe, it, expect, beforeEach } from 'vitest';
import { 
  calculateMagnitude, 
  getMagnitudeCaps, 
  applyMagnitudeDamageCap, 
  applyMagnitudeAoECap,
  getTalentSystemDescription,
  getMagnitudeDescription,
  calculateSystemStrain,
  calculateExistenceStability,
  getTalentInfo,
  getAllTalentInfo
} from '../src/lib/logic/TalentManager.sys.mjs';
import { 
  canFuseSkills, 
  fuseSkills, 
  canFuseSkillWithItem, 
  fuseSkillWithItem,
  getFusionRequirements,
  getFusionSuccessChance
} from '../src/lib/logic/SkillEvolutionManager.js';
import { getSkillById } from '../src/lib/skills.js';

describe('Magnitude, Caps, Fusion, and Descriptions Tests', () => {
  describe('Talent Magnitude System', () => {
    it('should calculate magnitude for Region-Scale at low levels', () => {
      const magnitude = calculateMagnitude('destruction', 50);
      
      expect(magnitude.label).toBe('Region-Scale');
      expect(magnitude.aoeRadius).toBe(200);
      expect(magnitude.damageCap).toBe(20000);
      expect(magnitude.description).toBe('Regional devastation');
    });
    
    it('should calculate magnitude for City-Scale at medium levels', () => {
      const magnitude = calculateMagnitude('destruction', 150);
      
      expect(magnitude.label).toBe('City-Scale');
      expect(magnitude.aoeRadius).toBe(1000);
      expect(magnitude.damageCap).toBe(100000);
      expect(magnitude.description).toBe('City-wide destruction');
    });
    
    it('should calculate magnitude for Planet-Scale at high levels', () => {
      const magnitude = calculateMagnitude('destruction', 600);
      
      expect(magnitude.label).toBe('Planet-Scale');
      expect(magnitude.aoeRadius).toBe(10000);
      expect(magnitude.damageCap).toBe(1000000);
      expect(magnitude.description).toBe('Planetary annihilation capability');
    });
    
    it('should handle different talent types correctly', () => {
      const talents = ['destruction', 'creation', 'time', 'space', 'divine'];
      
      talents.forEach(talentId => {
        const magnitude = calculateMagnitude(talentId, 100);
        expect(magnitude).toBeDefined();
        expect(magnitude.label).toBe('City-Scale');
        expect(magnitude.damageCap).toBeGreaterThan(0);
        expect(magnitude.aoeRadius).toBeGreaterThan(0);
      });
    });
    
    it('should handle invalid talent IDs gracefully', () => {
      const magnitude = calculateMagnitude('invalid_talent', 100);
      
      expect(magnitude.label).toBe('Region-Scale');
      expect(magnitude.damageCap).toBe(1000);
      expect(magnitude.aoeRadius).toBe(50);
    });
  });
  
  describe('Magnitude Caps', () => {
    it('should get magnitude caps correctly', () => {
      const caps = getMagnitudeCaps('destruction', 200);
      
      expect(caps.aoeRadius).toBe(1000);
      expect(caps.damageCap).toBe(100000);
      expect(caps.label).toBe('City-Scale');
      expect(caps.description).toBe('City-wide destruction');
    });
    
    it('should apply damage cap correctly', () => {
      const caps = { damageCap: 5000 };
      
      expect(applyMagnitudeDamageCap(3000, caps)).toBe(3000);
      expect(applyMagnitudeDamageCap(6000, caps)).toBe(5000);
      expect(applyMagnitudeDamageCap(5000, caps)).toBe(5000);
    });
    
    it('should apply AoE radius cap correctly', () => {
      const caps = { aoeRadius: 100 };
      
      expect(applyMagnitudeAoECap(50, caps)).toBe(50);
      expect(applyMagnitudeAoECap(150, caps)).toBe(100);
      expect(applyMagnitudeAoECap(100, caps)).toBe(100);
    });
    
    it('should handle missing caps gracefully', () => {
      expect(applyMagnitudeDamageCap(5000, null)).toBe(5000);
      expect(applyMagnitudeDamageCap(5000, {})).toBe(5000);
      expect(applyMagnitudeAoECap(50, null)).toBe(50);
      expect(applyMagnitudeAoECap(50, {})).toBe(50);
    });
  });
  
  describe('System Descriptions', () => {
    it('should generate system descriptions correctly', () => {
      const description = getTalentSystemDescription('destruction');
      
      expect(description).toBe('PROTOCOL: PLANETARY_ANNIHILATION_SEQUENCE_INITIATED');
    });
    
    it('should generate magnitude descriptions correctly', () => {
      const description = getMagnitudeDescription('destruction', 300);
      
      expect(description).toBe('Magnitude: City-Scale - City-wide destruction');
    });
    
    it('should handle talents without system descriptions', () => {
      const description = getTalentSystemDescription('unknown_talent');
      
      expect(description).toBe('PROTOCOL: UNKNOWN_TALENT_SYSTEM_ONLINE');
    });
  });
  
  describe('System Strain and Existence Stability', () => {
    it('should calculate system strain correctly', () => {
      const strain = calculateSystemStrain(['destruction', 'creation'], 100);
      
      expect(strain).toBeGreaterThan(0);
      expect(strain).toBeLessThanOrEqual(1000);
    });
    
    it('should calculate existence stability correctly', () => {
      const stability = calculateExistenceStability(500);
      
      expect(stability).toBe(50); // 100 - (500 / 10)
    });
    
    it('should handle zero strain correctly', () => {
      const stability = calculateExistenceStability(0);
      
      expect(stability).toBe(100);
    });
    
    it('should handle maximum strain correctly', () => {
      const stability = calculateExistenceStability(1000);
      
      expect(stability).toBe(0);
    });
    
    it('should not go below zero stability', () => {
      const stability = calculateExistenceStability(2000);
      
      expect(stability).toBe(0);
    });
  });
  
  describe('Talent Information', () => {
    it('should get comprehensive talent info', () => {
      const info = getTalentInfo('destruction', 150);
      
      expect(info.id).toBe('destruction');
      expect(info.magnitude).toBeDefined();
      expect(info.systemDescription).toBeDefined();
      expect(info.magnitudeDescription).toBeDefined();
      expect(info.isValid).toBe(true);
    });
    
    it('should get all talent info', () => {
      const allInfo = getAllTalentInfo(100);
      
      expect(allInfo).toBeInstanceOf(Array);
      expect(allInfo.length).toBeGreaterThan(0);
      
      const destructionInfo = allInfo.find(info => info.id === 'destruction');
      expect(destructionInfo).toBeDefined();
      expect(destructionInfo.magnitude.label).toBe('City-Scale');
    });
  });
  
  describe('Skill Fusion System', () => {
    let mockPlayer;
    let skillA;
    let skillB;
    
    beforeEach(() => {
      mockPlayer = {
        level: 20,
        fusionCount: 0,
        fusionHistory: []
      };
      
      skillA = getSkillById('knight_shield_bash');
      skillB = getSkillById('knight_rend');
    });
    
    it('should check if skills can be fused', () => {
      const canFuse = canFuseSkills(skillA, skillB, mockPlayer);
      
      expect(canFuse).toBe(true); // Same class, should be fuseable
    });
    
    it('should reject fusion for low-level players', () => {
      mockPlayer.level = 5;
      const canFuse = canFuseSkills(skillA, skillB, mockPlayer);
      
      expect(canFuse).toBe(false);
    });
    
    it('should reject fusion for maxed fusion count', () => {
      mockPlayer.fusionCount = 5;
      const canFuse = canFuseSkills(skillA, skillB, mockPlayer);
      
      expect(canFuse).toBe(false);
    });
    
    it('should reject fusion of same skill', () => {
      const canFuse = canFuseSkills(skillA, skillA, mockPlayer);
      
      expect(canFuse).toBe(false);
    });
    
    it('should fuse skills correctly', () => {
      const fusedSkill = fuseSkills(skillA, skillB, mockPlayer.level);
      
      expect(fusedSkill).toBeDefined();
      expect(fusedSkill.id).toContain('fusion');
      expect(fusedSkill.name).toContain('Synergy');
      expect(fusedSkill.effects).toBeDefined();
      expect(fusedSkill.fusion).toBeDefined();
      expect(fusedSkill.fusion.parents).toContain(skillA.id);
      expect(fusedSkill.fusion.parents).toContain(skillB.id);
    });
    
    it('should calculate fusion properties correctly', () => {
      const fusedSkill = fuseSkills(skillA, skillB, mockPlayer.level);
      
      expect(fusedSkill.damage).toBeGreaterThan(0);
      expect(fusedSkill.manaCost).toBeLessThanOrEqual(Math.max(skillA.manaCost, skillB.manaCost));
      expect(fusedSkill.cooldown).toBeLessThanOrEqual(Math.max(skillA.cooldown, skillB.cooldown));
    });
    
    it('should combine effects from both skills', () => {
      const fusedSkill = fuseSkills(skillA, skillB, mockPlayer.level);
      
      expect(fusedSkill.effects.length).toBeGreaterThan(0);
      
      const effectIds = fusedSkill.effects.map(e => e.id);
      expect(effectIds).toContain('stun'); // From shield bash
      expect(effectIds).toContain('bleed'); // From rend
    });
  });
  
  describe('Skill-Item Fusion', () => {
    let mockPlayer;
    let skill;
    let item;
    
    beforeEach(() => {
      mockPlayer = {
        level: 20,
        fusionCount: 0
      };
      
      skill = getSkillById('knight_shield_bash');
      item = {
        id: 'test_catalyst',
        name: 'Test Catalyst',
        tags: ['Catalyst'],
        quality: 'rare',
        description: 'A test catalyst item'
      };
    });
    
    it('should check if skill can be fused with item', () => {
      const canFuse = canFuseSkillWithItem(skill, item, mockPlayer);
      
      expect(canFuse).toBe(true); // Has catalyst tag
    });
    
    it('should reject fusion for low-level players', () => {
      mockPlayer.level = 10;
      const canFuse = canFuseSkillWithItem(skill, item, mockPlayer);
      
      expect(canFuse).toBe(false); // Below minimum fusion level
    });
    
    it('should fuse skill with item correctly', () => {
      const infusedSkill = fuseSkillWithItem(skill, item, mockPlayer.level);
      
      expect(infusedSkill).toBeDefined();
      expect(infusedSkill.id).toContain('infused');
      expect(infusedSkill.name).toContain(item.name);
      expect(infusedSkill.infusion).toBeDefined();
      expect(infusedSkill.infusion.itemId).toBe(item.id);
    });
    
    it('should enhance skill properties with item', () => {
      const originalDamage = skill.damage || 0;
      const infusedSkill = fuseSkillWithItem(skill, item, mockPlayer.level);
      
      expect(infusedSkill.damage).toBeGreaterThan(originalDamage);
      expect(infusedSkill.tags).toContain('infused');
    });
  });
  
  describe('Fusion Requirements and Success Chances', () => {
    it('should get fusion requirements correctly', () => {
      const requirements = getFusionRequirements();
      
      expect(requirements.minLevel).toBe(10);
      expect(requirements.minFusionLevel).toBe(15);
      expect(requirements.maxFusions).toBe(5);
    });
    
    it('should calculate fusion success chance', () => {
      const context = {
        type: 'skill+skill',
        skillA: { class: 'knight' },
        skillB: { class: 'knight' },
        player: { level: 30 }
      };
      
      const chance = getFusionSuccessChance(context);
      
      expect(chance).toBeGreaterThan(0.5);
      expect(chance).toBeLessThanOrEqual(0.95);
    });
    
    it('should apply class synergy bonus to success chance', () => {
      const sameClassContext = {
        type: 'skill+skill',
        skillA: { class: 'knight' },
        skillB: { class: 'knight' },
        player: { level: 25 }
      };
      
      const differentClassContext = {
        type: 'skill+skill',
        skillA: { class: 'knight' },
        skillB: { class: 'mage' },
        player: { level: 25 }
      };
      
      const sameClassChance = getFusionSuccessChance(sameClassContext);
      const differentClassChance = getFusionSuccessChance(differentClassContext);
      
      expect(sameClassChance).toBeGreaterThan(differentClassChance);
    });
  });
  
  describe('Hidden Conditions', () => {
    it('should check elemental alignment', () => {
      const fireSkill = { tags: ['Fire_Damage'], description: 'Fire attack' };
      const iceSkill = { tags: ['Ice_Damage'], description: 'Ice attack' };
      const fireItem = { tags: ['Fire'], description: 'Fire item' };
      
      // Should allow fusion with elemental alignment
      const context = {
        type: 'skill+item',
        skill: fireSkill,
        item: fireItem,
        player: { level: 20 }
      };
      
      // Elemental alignment should increase success chance
      const chance = getFusionSuccessChance(context);
      expect(chance).toBeGreaterThan(0.5);
    });
    
    it('should handle complementary effects', () => {
      const stunSkill = { effects: [{ id: 'stun' }] };
      const damageSkill = { effects: [{ id: 'damage' }] };
      
      // These should have good fusion potential due to complementary effects
      const context = {
        type: 'skill+skill',
        skillA: stunSkill,
        skillB: damageSkill,
        player: { level: 25 }
      };
      
      const chance = getFusionSuccessChance(context);
      expect(chance).toBeGreaterThan(0.5);
    });
  });
  
  describe('Fusion History and Tracking', () => {
    let mockPlayer;
    
    beforeEach(() => {
      mockPlayer = {
        level: 20,
        fusionCount: 0,
        fusionHistory: []
      };
    });
    
    it('should track fusion history', () => {
      const fusionResult = { id: 'test_fusion' };
      
      // This would be called internally by fusion functions
      const { addFusionToHistory } = require('../src/lib/logic/SkillEvolutionManager.js');
      addFusionToHistory(mockPlayer, fusionResult);
      
      expect(mockPlayer.fusionCount).toBe(1);
      expect(mockPlayer.fusionHistory).toHaveLength(1);
      expect(mockPlayer.fusionHistory[0].result).toBe('test_fusion');
      expect(mockPlayer.fusionHistory[0].level).toBe(20);
    });
    
    it('should get player fusion history', () => {
      const { getPlayerFusionHistory, addFusionToHistory } = require('../src/lib/logic/SkillEvolutionManager.js');
      
      const fusionResult1 = { id: 'fusion1' };
      const fusionResult2 = { id: 'fusion2' };
      
      addFusionToHistory(mockPlayer, fusionResult1);
      addFusionToHistory(mockPlayer, fusionResult2);
      
      const history = getPlayerFusionHistory(mockPlayer);
      
      expect(history).toHaveLength(2);
      expect(history[0].result).toBe('fusion1');
      expect(history[1].result).toBe('fusion2');
    });
  });
});