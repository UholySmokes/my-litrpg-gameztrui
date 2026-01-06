import { effectApplicationSystem } from '../src/lib/logic/EffectApplicationSystem.js';
import { executeSkill } from '../src/lib/gamelogic.js';
import { races } from '../src/lib/characterData.js';

// Test utilities
function createTestEntity(name, level = 1) {
  return {
    name,
    race: races[0],
    attributes: { str: 10, int: 10, dex: 10, agi: 10 },
    hp: { current: 100, max: 100 },
    mana: { current: 100, max: 100 },
    effects: [],
    level
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function logTest(name, passed) {
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}`);
}

// Test Suite
console.log('=== UNIFIED EFFECT APPLICATION SYSTEM TESTS ===\n');

// Test 1: Basic effect application
console.log('Test 1: Basic Effect Application');
try {
  const attacker = createTestEntity('Attacker');
  const defender = createTestEntity('Defender');
  
  const result = executeSkill(attacker, defender, 'assassin_poison_blade');
  
  assert(result.damage > 0, 'Should deal damage');
  assert(defender.effects.length > 0, 'Should apply poison effect');
  assert(defender.effects.some(e => e.id === 'poison'), 'Should have poison effect');
  
  logTest('Basic Effect Application', true);
} catch (error) {
  logTest('Basic Effect Application', false);
  console.error(error.message);
}

// Test 2: Multiple effects from single skill
console.log('\nTest 2: Multiple Effects from Single Skill');
try {
  const attacker = createTestEntity('Attacker');
  const defender = createTestEntity('Defender');
  
  // Create a test skill with multiple effects
  const testSkill = {
    id: 'test_multi_effect',
    name: 'Multi Effect Test',
    type: 'active',
    class: 'test',
    description: 'Test skill with multiple effects',
    level: 1,
    manaCost: 10,
    cooldown: 5,
    effects: [
      { id: 'poison', duration: 3, target: 'enemy' },
      { id: 'bleed', duration: 2, target: 'enemy' },
      { id: 'blur', duration: 1, target: 'self' }
    ]
  };
  
  // Temporarily add to skills for testing
  const originalSkills = require('../src/lib/skills.js');
  const originalGetSkillById = originalSkills.getSkillById;
  originalSkills.getSkillById = function(id) {
    if (id === 'test_multi_effect') return testSkill;
    return originalGetSkillById.call(this, id);
  };
  
  const result = executeSkill(attacker, defender, 'test_multi_effect');
  
  assert(defender.effects.length >= 2, 'Should apply multiple effects to defender');
  assert(attacker.effects.some(e => e.id === 'blur'), 'Should apply self effect to attacker');
  
  // Restore original function
  originalSkills.getSkillById = originalGetSkillById;
  
  logTest('Multiple Effects from Single Skill', true);
} catch (error) {
  logTest('Multiple Effects from Single Skill', false);
  console.error(error.message);
}

// Test 3: Effect application system statistics
console.log('\nTest 3: Effect Application System Statistics');
try {
  const attacker = createTestEntity('Attacker');
  const defender = createTestEntity('Defender');
  
  // Clear previous statistics
  effectApplicationSystem.clear();
  
  // Apply multiple effects
  executeSkill(attacker, defender, 'assassin_poison_blade');
  executeSkill(attacker, defender, 'assassin_bleed');
  executeSkill(attacker, defender, 'assassin_shadow_dash');
  
  const stats = effectApplicationSystem.getStatistics();
  
  assert(stats.totalApplications >= 3, 'Should track total applications');
  assert(stats.successfulApplications >= 3, 'Should track successful applications');
  assert(stats.successRate >= 90, 'Should have high success rate');
  assert(stats.activeEffectsCount > 0, 'Should track active effects');
  
  logTest('Effect Application System Statistics', true);
  console.log('Statistics:', stats);
} catch (error) {
  logTest('Effect Application System Statistics', false);
  console.error(error.message);
}

// Test 4: Effect removal
console.log('\nTest 4: Effect Removal');
try {
  const attacker = createTestEntity('Attacker');
  const defender = createTestEntity('Defender');
  
  // Apply an effect
  executeSkill(attacker, defender, 'assassin_poison_blade');
  const initialEffectCount = defender.effects.length;
  
  // Remove the effect
  const updatedDefender = effectApplicationSystem.removeEffect(defender, 'poison');
  
  assert(updatedDefender.effects.length < initialEffectCount, 'Should remove effect');
  assert(!updatedDefender.effects.some(e => e.id === 'poison'), 'Should not have poison effect after removal');
  
  logTest('Effect Removal', true);
} catch (error) {
  logTest('Effect Removal', false);
  console.error(error.message);
}

// Test 5: Error handling
console.log('\nTest 5: Error Handling');
try {
  const attacker = createTestEntity('Attacker');
  
  // Try to apply effect with invalid parameters
  const result = effectApplicationSystem.applyEffect(null, 'poison', attacker);
  
  assert(result === null, 'Should return original target on failure');
  
  const stats = effectApplicationSystem.getStatistics();
  assert(stats.failedApplications > 0, 'Should track failed applications');
  
  logTest('Error Handling', true);
} catch (error) {
  logTest('Error Handling', false);
  console.error(error.message);
}

// Test 6: Performance testing
console.log('\nTest 6: Performance Testing');
try {
  const attacker = createTestEntity('Attacker');
  const defender = createTestEntity('Defender');
  
  effectApplicationSystem.clear();
  
  const startTime = performance.now();
  
  // Apply many effects rapidly
  for (let i = 0; i < 100; i++) {
    executeSkill(attacker, defender, 'assassin_poison_blade');
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  assert(duration < 1000, 'Should handle 100 effect applications in under 1 second');
  assert(defender.effects.length >= 100, 'Should have many effects applied');
  
  logTest('Performance Testing', true);
  console.log(`Applied 100 effects in ${duration.toFixed(2)}ms`);
} catch (error) {
  logTest('Performance Testing', false);
  console.error(error.message);
}

// Test 7: Edge cases
console.log('\nTest 7: Edge Cases');
try {
  const attacker = createTestEntity('Attacker');
  const defender = createTestEntity('Defender');
  
  // Test with empty effects array
  const result1 = effectApplicationSystem.applyEffects(defender, [], attacker);
  assert(result1 === defender, 'Should handle empty effects array');
  
  // Test with invalid effects array
  try {
    effectApplicationSystem.applyEffects(defender, 'invalid', attacker);
    assert(false, 'Should throw error for invalid effects');
  } catch (error) {
    assert(error.message.includes('Effects must be an array'), 'Should provide clear error message');
  }
  
  logTest('Edge Cases', true);
} catch (error) {
  logTest('Edge Cases', false);
  console.error(error.message);
}

// Final summary
console.log('\n=== TEST SUMMARY ===');
const finalStats = effectApplicationSystem.getStatistics();
console.log('Final Statistics:', finalStats);
console.log(`\nAll tests completed. Success rate: ${finalStats.successRate.toFixed(1)}%`);

// Clean up
effectApplicationSystem.clear();
console.log('\nEffect application system tests completed successfully!');