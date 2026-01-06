
import { calculateDamage } from '../src/systems/combat/CombatSystem.js';
import { races } from '../src/entities/Player.js';

// Mock Entities
const createMockPlayer = (raceId, str=10, int=10, luck=5) => {
  const race = races.find(r => r.id === raceId);
  return {
    name: `Player_${raceId}`,
    race: race,
    attributes: { str, int, luck },
    hp: { current: 100, max: 100 }
  };
};

const createMockEnemy = (def=10) => {
  return {
    name: 'Goblin',
    attributes: { str: def * 2 } // defense = str / 2
  };
};

console.log("=== STARTING RACE TRAIT VERIFICATION ===");

let failures = 0;

// Test 1: Neo-Human Crit Bonus
try {
  console.log("\n[Test 1] Neo-Human Critical Hit Bonus");
  const player = createMockPlayer('neo_human', 10, 10, 0); // 0 Luck, usually 0% crit
  // Neo-Human has +5% crit from 'Targeting Array'
  
  let critCount = 0;
  for(let i=0; i<1000; i++) {
    const result = calculateDamage(player, createMockEnemy(0));
    if (result.isCritical) critCount++;
  }
  
  console.log(`Crit Rate with 0 Luck: ${(critCount/1000*100).toFixed(1)}% (Expected ~5%)`);
  if (critCount < 20) throw new Error("Crit rate too low for Neo-Human");
  console.log("PASS");
} catch (e) {
  console.error("FAIL:", e.message);
  failures++;
}

// Test 2: Phoenix Fire Damage Boost
try {
  console.log("\n[Test 2] Phoenix Fire Damage Boost");
  const player = createMockPlayer('phoenix_reborn', 10, 10, 0); 
  const enemy = createMockEnemy(0);
  
  const fireSkill = { name: 'Fireball', damage: 100, element: 'fire', isMagic: true };
  const iceSkill = { name: 'Icebolt', damage: 100, element: 'ice', isMagic: true };
  
  // Base Magic Dmg = 10 INT * 2 = 20. Skill = 100. Total = 120.
  // Phoenix has +20% Fire Dmg.
  
  const fireResult = calculateDamage(player, enemy, fireSkill);
  const iceResult = calculateDamage(player, enemy, iceSkill);
  
  console.log(`Fire Damage: ${fireResult.damage} (Expected > 120)`);
  console.log(`Ice Damage: ${iceResult.damage} (Expected ~120)`);
  
  if (fireResult.damage <= iceResult.damage) throw new Error("Fire bonus not applied");
  console.log("PASS");
} catch (e) {
  console.error("FAIL:", e.message);
  failures++;
}

// Test 3: Mechanical Construct Weakness (Defender)
try {
  console.log("\n[Test 3] Mechanical Construct Lightning Weakness");
  const player = createMockPlayer('pure_human'); // Attacker
  const bot = createMockPlayer('mechanical_construct'); // Defender (Player as defender for test)
  
  const lightningSkill = { name: 'Zap', damage: 100, element: 'lightning' };
  const fireSkill = { name: 'Burn', damage: 100, element: 'fire' };
  
  // Base Dmg ~120. Bot Def ~5. Net ~115.
  // Bot takes +50% from Lightning.
  
  const lightningResult = calculateDamage(player, bot, lightningSkill);
  const fireResult = calculateDamage(player, bot, fireSkill);
  
  console.log(`Lightning Dmg Taken: ${lightningResult.damage}`);
  console.log(`Fire Dmg Taken: ${fireResult.damage}`);
  
  if (lightningResult.damage <= fireResult.damage) throw new Error("Lightning weakness not applied");
  console.log("PASS");
} catch (e) {
  console.error("FAIL:", e.message);
  failures++;
}

// Test 4: Void Walker Damage Negation
try {
  console.log("\n[Test 4] Void Walker Damage Negation (Probabilistic)");
  const player = createMockPlayer('pure_human');
  const voidWalker = createMockPlayer('shadow_walker');
  
  let negatedCount = 0;
  const runs = 1000;
  
  for(let i=0; i<runs; i++) {
    const res = calculateDamage(player, voidWalker);
    if (res.damage === 0 && res.messages.some(m => m.includes("Void Step"))) {
      negatedCount++;
    }
  }
  
  console.log(`Negated Attacks: ${negatedCount}/${runs} (${(negatedCount/runs*100).toFixed(1)}%)`);
  if (negatedCount < 150 || negatedCount > 250) throw new Error("Negation rate outside expected range (20%)");
  console.log("PASS");
} catch (e) {
  console.error("FAIL:", e.message);
  failures++;
}

console.log(`\n=== RESULTS ===`);
if (failures === 0) {
  console.log("ALL TESTS PASSED. Race System is fully operational.");
} else {
  console.log(`${failures} TESTS FAILED.`);
}
