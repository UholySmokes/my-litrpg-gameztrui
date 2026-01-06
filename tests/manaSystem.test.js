/**
 * Comprehensive tests for the mana system
 * Tests mana cost calculation, consumption, validation, and integration
 */

import { calculateManaCost, validateManaCost, getManaCostTier } from '../src/lib/balance/manaBalance.js';
import { consumeMana, canAffordSkill, getManaEfficiency, regenerateMana } from '../src/lib/logic/manaSystem.js';

// Mock player state for testing
const createMockPlayer = (level = 1, currentMana = 100, maxMana = 100) => ({
  level,
  mana: {
    current: currentMana,
    max: maxMana
  },
  attributes: {
    str: 10,
    int: 10,
    will: 10
  }
});

// Mock skills for testing
const createMockSkill = (baseCost, cooldown = 3, effects = [], tags = []) => ({
  id: 'test_skill',
  name: 'Test Skill',
  manaCost: baseCost,
  cooldown,
  effects,
  tags
});

describe('Mana Balance System', () => {
  describe('calculateManaCost', () => {
    test('calculates base cost for level 1 player', () => {
      const player = createMockPlayer(1, 100, 100);
      const skill = createMockSkill(20);
      
      const cost = calculateManaCost(skill, player.level);
      expect(cost).toBe(20); // Base cost at level 1
    });

    test('scales cost with player level', () => {
      const skill = createMockSkill(20);
      
      const costLevel1 = calculateManaCost(skill, 1);
      const costLevel150 = calculateManaCost(skill, 150);
      const costLevel500 = calculateManaCost(skill, 500);
      
      expect(costLevel150).toBeGreaterThan(costLevel1);
      expect(costLevel500).toBeGreaterThan(costLevel150);
    });

    test('applies type multipliers correctly', () => {
      const player = createMockPlayer(1, 100, 100);
      
      const instantSkill = createMockSkill(20, 3, [], []);
      const aoeSkill = createMockSkill(20, 3, [], ['AoE']);
      const utilitySkill = createMockSkill(20, 3, [], ['Utility']);
      
      const instantCost = calculateManaCost(instantSkill, player.level);
      const aoeCost = calculateManaCost(aoeSkill, player.level);
      const utilityCost = calculateManaCost(utilitySkill, player.level);
      
      expect(aoeCost).toBeGreaterThan(instantCost); // AoE multiplier 1.3x
      expect(utilityCost).toBeLessThan(instantCost); // Utility multiplier 0.5x
    });

    test('applies cooldown efficiency correctly', () => {
      const player = createMockPlayer(1, 100, 100);
      
      const shortCooldownSkill = createMockSkill(20, 1);
      const longCooldownSkill = createMockSkill(20, 30);
      
      const shortCost = calculateManaCost(shortCooldownSkill, player.level);
      const longCost = calculateManaCost(longCooldownSkill, player.level);
      
      expect(longCost).toBeLessThan(shortCost); // Longer cooldown = lower cost
    });

    test('never returns cost less than 1', () => {
      const player = createMockPlayer(1, 100, 100);
      const cheapSkill = createMockSkill(1, 120); // Long cooldown reduces cost
      
      const cost = calculateManaCost(cheapSkill, player.level);
      expect(cost).toBeGreaterThanOrEqual(1);
    });
  });

  describe('validateManaCost', () => {
    test('validates sufficient mana correctly', () => {
      const player = createMockPlayer(1, 50, 100);
      const validation = validateManaCost(30, player);
      
      expect(validation.canCast).toBe(true);
      expect(validation.currentMana).toBe(50);
      expect(validation.requiredMana).toBe(30);
      expect(validation.manaDeficit).toBe(0);
      expect(validation.percentage).toBe(50);
    });

    test('validates insufficient mana correctly', () => {
      const player = createMockPlayer(1, 20, 100);
      const validation = validateManaCost(30, player);
      
      expect(validation.canCast).toBe(false);
      expect(validation.currentMana).toBe(20);
      expect(validation.requiredMana).toBe(30);
      expect(validation.manaDeficit).toBe(10);
      expect(validation.percentage).toBe(20);
    });

    test('handles missing mana properties gracefully', () => {
      const player = { level: 1 }; // No mana property
      const validation = validateManaCost(10, player);
      
      expect(validation.canCast).toBe(false);
      expect(validation.currentMana).toBe(0);
      expect(validation.requiredMana).toBe(10);
      expect(validation.manaDeficit).toBe(10);
      expect(validation.percentage).toBe(0);
    });
  });

  describe('getManaCostTier', () => {
    test('returns correct tier descriptions', () => {
      expect(getManaCostTier(10)).toBe('Basic attacks and utility');
      expect(getManaCostTier(30)).toBe('Core combat abilities');
      expect(getManaCostTier(75)).toBe('Strong AoE and control');
      expect(getManaCostTier(150)).toBe('High-impact ultimates');
      expect(getManaCostTier(300)).toBe('Game-changing effects');
      expect(getManaCostTier(750)).toBe('Reality-bending powers');
      expect(getManaCostTier(1500)).toBe('World-altering magic');
    });
  });
});

describe('Mana Consumption System', () => {
  describe('consumeMana', () => {
    test('successfully consumes mana when available', () => {
      const player = createMockPlayer(1, 100, 100);
      const skill = createMockSkill(30);
      
      const result = consumeMana(skill, player);
      
      expect(result.success).toBe(true);
      expect(result.manaConsumed).toBe(30);
      expect(result.remainingMana).toBe(70);
      expect(result.error).toBeNull();
      expect(result.feedback).toBeDefined();
    });

    test('fails when insufficient mana (default behavior)', () => {
      const player = createMockPlayer(1, 20, 100);
      const skill = createMockSkill(30);
      
      const result = consumeMana(skill, player);
      
      expect(result.success).toBe(false);
      expect(result.manaConsumed).toBe(0);
      expect(result.remainingMana).toBe(20);
      expect(result.error).toContain('Insufficient mana');
      expect(result.feedback).toBeDefined();
    });

    test('allows partial consumption when enabled', () => {
      const player = createMockPlayer(1, 20, 100);
      const skill = createMockSkill(30);
      
      const result = consumeMana(skill, player, { allowPartial: true });
      
      expect(result.success).toBe(true);
      expect(result.manaConsumed).toBe(20);
      expect(result.remainingMana).toBe(0);
      expect(result.error).toBeNull();
    });

    test('provides feedback when enabled', () => {
      const player = createMockPlayer(1, 100, 100);
      const skill = createMockSkill(30);
      
      const result = consumeMana(skill, player, { showFeedback: true });
      
      expect(result.feedback).toBeDefined();
      expect(result.feedback.type).toBe('consumption');
      expect(result.feedback.manaConsumed).toBe(30);
      expect(result.feedback.remainingMana).toBe(70);
      expect(result.feedback.animation).toBe('mana-consume');
    });

    test('disables feedback when requested', () => {
      const player = createMockPlayer(1, 100, 100);
      const skill = createMockSkill(30);
      
      const result = consumeMana(skill, player, { showFeedback: false });
      
      expect(result.feedback).toBeNull();
    });

    test('handles errors gracefully', () => {
      const player = createMockPlayer(1, 100, 100);
      const invalidSkill = null;
      
      const result = consumeMana(invalidSkill, player);
      
      expect(result.success).toBe(true); // Null skill uses default cost
      expect(result.manaConsumed).toBe(15); // Default cost with multipliers
      expect(result.error).toBeNull();
    });
  });

  describe('canAffordSkill', () => {
    test('returns affordability status correctly', () => {
      const player = createMockPlayer(1, 50, 100);
      const affordableSkill = createMockSkill(30);
      const expensiveSkill = createMockSkill(60);
      
      const affordableResult = canAffordSkill(affordableSkill, player);
      const expensiveResult = canAffordSkill(expensiveSkill, player);
      
      expect(affordableResult.canAfford).toBe(true);
      expect(affordableResult.manaCost).toBe(30);
      expect(affordableResult.currentMana).toBe(50);
      
      expect(expensiveResult.canAfford).toBe(false);
      expect(expensiveResult.manaCost).toBeGreaterThan(50);
    });

    test('provides feedback for unaffordable skills', () => {
      const player = createMockPlayer(1, 20, 100);
      const expensiveSkill = createMockSkill(30);
      
      const result = canAffordSkill(expensiveSkill, player, { includeFeedback: true });
      
      expect(result.canAfford).toBe(false);
      expect(result.feedback).toBeDefined();
      expect(result.feedback.type).toBe('insufficient');
    });

    test('disables feedback when requested', () => {
      const player = createMockPlayer(1, 20, 100);
      const expensiveSkill = createMockSkill(30);
      
      const result = canAffordSkill(expensiveSkill, player, { includeFeedback: false });
      
      expect(result.feedback).toBeNull();
    });
  });

  describe('getManaEfficiency', () => {
    test('rates efficiency based on cost percentage', () => {
      const player = createMockPlayer(1, 100, 100);
      
      const cheapSkill = createMockSkill(5);   // 5% of max mana
      const moderateSkill = createMockSkill(25); // 25% of max mana
      const expensiveSkill = createMockSkill(60); // 60% of max mana
      
      const cheapResult = getManaEfficiency(cheapSkill, player);
      const moderateResult = getManaEfficiency(moderateSkill, player);
      const expensiveResult = getManaEfficiency(expensiveSkill, player);
      
      expect(cheapResult.rating).toBe('excellent');
      expect(moderateResult.rating).toBe('fair');
      expect(expensiveResult.rating).toBe('poor');
    });

    test('provides appropriate recommendations', () => {
      const player = createMockPlayer(1, 100, 100);
      const skill = createMockSkill(10); // Excellent efficiency
      
      const result = getManaEfficiency(skill, player);
      
      expect(result.recommendation).toContain('spam freely');
      expect(result.costPercentage).toBe(10);
      expect(result.manaCost).toBe(10);
    });
  });

  describe('regenerateMana', () => {
    test('regenerates mana correctly', () => {
      const player = createMockPlayer(1, 30, 100);
      
      const result = regenerateMana(player, 20);
      
      expect(result.mana.current).toBe(50);
      expect(result.feedback).toBeDefined();
      expect(result.feedback.type).toBe('regeneration');
      expect(result.feedback.amount).toBe(20);
    });

    test('respects maximum mana by default', () => {
      const player = createMockPlayer(1, 90, 100);
      
      const result = regenerateMana(player, 20);
      
      expect(result.mana.current).toBe(100); // Capped at max
      expect(result.feedback.amount).toBe(10); // Only 10 actually regenerated
    });

    test('allows exceeding max mana when requested', () => {
      const player = createMockPlayer(1, 90, 100);
      
      const result = regenerateMana(player, 20, { respectMax: false });
      
      expect(result.mana.current).toBe(110); // Exceeds max
      expect(result.feedback.amount).toBe(20);
    });

    test('provides no feedback for zero regeneration', () => {
      const player = createMockPlayer(1, 100, 100);
      
      const result = regenerateMana(player, 0);
      
      expect(result.mana.current).toBe(100);
      expect(result.feedback).toBeNull();
    });
  });
});

describe('Mana System Integration', () => {
  test('integrates cost calculation with consumption', () => {
    const player = createMockPlayer(1, 100, 100);
    const skill = createMockSkill(25);
    
    const cost = calculateManaCost(skill, player.level);
    const consumption = consumeMana(skill, player);
    
    expect(consumption.manaConsumed).toBe(cost);
    expect(consumption.remainingMana).toBe(100 - cost);
  });

  test('validates affordability before consumption', () => {
    const player = createMockPlayer(1, 20, 100);
    const expensiveSkill = createMockSkill(30);
    
    const affordability = canAffordSkill(expensiveSkill, player);
    const consumption = consumeMana(expensiveSkill, player);
    
    expect(affordability.canAfford).toBe(false);
    expect(consumption.success).toBe(false);
    expect(consumption.error).toContain('Insufficient mana');
  });

  test('provides consistent feedback across functions', () => {
    const player = createMockPlayer(1, 20, 100);
    const expensiveSkill = createMockSkill(30);
    
    const affordability = canAffordSkill(expensiveSkill, player, { includeFeedback: true });
    const consumption = consumeMana(expensiveSkill, player);
    
    expect(affordability.feedback).toBeDefined();
    expect(consumption.feedback).toBeDefined();
    expect(affordability.feedback.type).toBe('insufficient');
    expect(consumption.feedback.type).toBe('insufficient');
  });
});

describe('Edge Cases and Error Handling', () => {
  test('handles missing skill properties gracefully', () => {
      const player = createMockPlayer(1, 100, 100);
      const incompleteSkill = { id: 'test' }; // Missing manaCost
      
      const cost = calculateManaCost(incompleteSkill, player.level);
      const consumption = consumeMana(incompleteSkill, player);
      
      expect(cost).toBe(15); // Default cost with level 1 multipliers
      expect(consumption.success).toBe(true);
      expect(consumption.manaConsumed).toBe(15);
    });

  test('handles extreme level values', () => {
    const skill = createMockSkill(20);
    
    const costLevel1000 = calculateManaCost(skill, 1000);
    const costLevel1 = calculateManaCost(skill, 1);
    
    expect(costLevel1000).toBeGreaterThan(costLevel1);
    expect(costLevel1000).toBeGreaterThan(1000); // Should be very high at level 1000
  });

  test('handles zero max mana gracefully', () => {
      const player = createMockPlayer(1, 0, 0);
      const skill = createMockSkill(10);
      
      const validation = validateManaCost(10, player);
      const efficiency = getManaEfficiency(skill, player);
      
      expect(validation.canCast).toBe(false);
      expect(validation.percentage).toBe(0);
      expect(efficiency.rating).toBe('good'); // Special handling for zero max mana
    });

  test('maintains precision with large numbers', () => {
    const player = createMockPlayer(500, 10000, 10000);
    const skill = createMockSkill(100);
    
    const cost = calculateManaCost(skill, player.level);
    const consumption = consumeMana(skill, player);
    
    expect(Number.isInteger(cost)).toBe(true);
    expect(Number.isInteger(consumption.manaConsumed)).toBe(true);
    expect(Number.isInteger(consumption.remainingMana)).toBe(true);
  });
});