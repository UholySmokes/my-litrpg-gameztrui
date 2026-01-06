
import { applyEffect, processTurnEffects, hasEffectTag, getEffectTagMagnitude } from '../src/lib/logic/effectProcessor.js';
import { EFFECT_DEFINITIONS } from '../src/lib/logic/effectRegistry.js';

// Mock Entities
const createEntity = (name) => ({
  name,
  hp: { current: 100, max: 100 },
  effects: []
});

console.log("=== STARTING STATUS EFFECT ENGINE VERIFICATION ===");

let failures = 0;

// Test 1: Application and Stacking (Duration)
try {
  console.log("\n[Test 1] Effect Application & Duration Stacking");
  let player = createEntity('Hero');
  
  // Apply Haste (Duration 3, DONT_STACK usually, but let's test stacking rules)
  // Haste definition says DONT_STACK, so it should just refresh duration.
  
  player = applyEffect(player, 'haste');
  const initialDuration = player.effects[0].remainingDuration;
  console.log(`Applied Haste. Duration: ${initialDuration}`);
  
  player = applyEffect(player, 'haste');
  const newDuration = player.effects[0].remainingDuration;
  console.log(`Re-applied Haste. New Duration: ${newDuration}`);
  
  if (player.effects.length !== 1) throw new Error("Haste duplicated instead of refreshing");
  if (newDuration > initialDuration) throw new Error("Haste duration stacked (expected refresh only)");
  
  console.log("PASS");
} catch (e) {
  console.error("FAIL:", e.message);
  failures++;
}

// Test 2: Intensity Stacking (Might)
try {
  console.log("\n[Test 2] Intensity Stacking (Might)");
  let player = createEntity('Warrior');
  
  // Apply Might (Stacking Intensity)
  player = applyEffect(player, 'might');
  const stack1 = player.effects[0].stacks;
  const mag1 = player.effects[0].magnitude;
  
  player = applyEffect(player, 'might');
  const stack2 = player.effects[0].stacks;
  const mag2 = player.effects[0].magnitude;
  
  console.log(`Stacks: ${stack1} -> ${stack2}`);
  console.log(`Magnitude: ${mag1} -> ${mag2}`);
  
  if (stack2 !== 2) throw new Error("Stacks did not increment");
  if (mag2 <= mag1) throw new Error("Magnitude did not increase");
  
  console.log("PASS");
} catch (e) {
  console.error("FAIL:", e.message);
  failures++;
}

// Test 3: DoT Processing (Burn)
try {
  console.log("\n[Test 3] DoT Processing (Burn)");
  let enemy = createEntity('Goblin');
  
  // Apply Burn
  enemy = applyEffect(enemy, 'burn'); // Mag 10
  
  // Process Turn
  const result = processTurnEffects(enemy);
  enemy = result.entity;
  
  console.log(`Damage Taken: ${result.damageTaken}`);
  console.log(`Remaining Duration: ${enemy.effects[0].remainingDuration}`);
  
  if (result.damageTaken !== 10) throw new Error(`Incorrect DoT damage: ${result.damageTaken}`);
  if (enemy.hp.current !== 90) throw new Error("HP not updated correctly");
  
  console.log("PASS");
} catch (e) {
  console.error("FAIL:", e.message);
  failures++;
}

// Test 4: Effect Expiration
try {
  console.log("\n[Test 4] Effect Expiration");
  let player = createEntity('Mage');
  
  // Apply Stun (Duration 1)
  player = applyEffect(player, 'stun');
  
  // Process Turn 1 (Should tick down to 0 and remove)
  // Logic: Decrement happens -> remaining becomes 0 -> removed?
  // Our logic: Decrement -> if <= 0 remove.
  // Duration 1 -> -1 -> 0. Remove?
  
  // Let's verify logic in processor:
  // return { ...effect, remainingDuration: effect.remainingDuration - 1 };
  // filter(effect => effect.remainingDuration > 0)
  
  // So Duration 1 -> 0 -> Removed immediately after turn 1.
  
  const res1 = processTurnEffects(player);
  player = res1.entity;
  
  console.log(`Turn 1 Effects: ${player.effects.length}`);
  
  if (player.effects.length !== 0) throw new Error("Stun did not expire correctly");
  
  console.log("PASS");
} catch (e) {
  console.error("FAIL:", e.message);
  failures++;
}

// Test 5: Tag Lookup
try {
  console.log("\n[Test 5] Effect Tag Lookup");
  let player = createEntity('Rogue');
  player = applyEffect(player, 'blur'); // Tags: ['DODGE_BOOST']
  
  const hasDodge = hasEffectTag(player, 'DODGE_BOOST');
  const magnitude = getEffectTagMagnitude(player, 'DODGE_BOOST'); // 0.20
  
  console.log(`Has Dodge Tag: ${hasDodge}`);
  console.log(`Dodge Magnitude: ${magnitude}`);
  
  if (!hasDodge) throw new Error("Tag lookup failed");
  if (magnitude !== 0.20) throw new Error("Magnitude lookup failed");
  
  console.log("PASS");
} catch (e) {
  console.error("FAIL:", e.message);
  failures++;
}

console.log(`\n=== RESULTS ===`);
if (failures === 0) {
  console.log("ALL TESTS PASSED. Effect Engine is stable.");
} else {
  console.log(`${failures} TESTS FAILED.`);
}
