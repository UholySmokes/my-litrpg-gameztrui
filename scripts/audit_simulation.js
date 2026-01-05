
import { xpForNextLevel, calculateGainedXP, xpToReachLevel } from '../src/lib/logic/levelSystem.js';
import { calculateAttackPower } from '../src/lib/logic/statSystem.js';

// Mock Config mimicking updated gamestate.js
const config = {
    maxLevel: 1000,
    xpBrackets: [
        { end: 10,   base: 50,    growth: 1.25 },
        { end: 50,   base: 200,   growth: 1.15 },
        { end: 100,  base: 1000,  growth: 1.12 },
        { end: 500,  base: 6000,  growth: 1.08 },
        { end: 1000, base: 25000, growth: 1.05 }
    ],
    statTiers: [
        { threshold: 1000, multiplier: 3.0, rank: "Gold" },
        { threshold: 600, multiplier: 2.0, rank: "Silver" },
        { threshold: 300, multiplier: 1.5, rank: "Bronze" },
        { threshold: 100, multiplier: 1.2, rank: "Iron" },
        { threshold: 0,   multiplier: 1.0, rank: "Mortal" }
    ],
    xpBonusPerLevelDiff: 0.2,
    xpMalusPerLevelDiff: 0.1,
    xpNoRewardBelowDelta: 10,
    baseAttackDamage: 5,
    strToDamageMultiplier: 2
};

console.log("=== FINAL AUDIT: XP CURVE ===");
let intendedOverflow = false;
for (let lvl = 1; lvl <= 1000; lvl+=50) {
    const xpNeeded = xpForNextLevel(lvl, config);
    const totalXp = xpToReachLevel(lvl, config);
    
    if (!Number.isSafeInteger(xpNeeded) || !Number.isSafeInteger(totalXp)) {
        console.log(`[CRITICAL] Integer Overflow detected at Level ${lvl}. XP Needed: ${xpNeeded}`);
        intendedOverflow = true;
        break;
    }
    
    if (lvl % 100 === 0 || lvl === 1 || lvl === 1000) {
         console.log(`Level ${lvl}: XP Next=${xpNeeded.toLocaleString()}, Total=${totalXp.toLocaleString()}`);
    }
}
if (!intendedOverflow) console.log("XP Curve is SAFE.");

console.log("\n=== FINAL AUDIT: STAT SCALING (TIERED) ===");
const testStats = [10, 50, 99, 100, 200, 299, 300, 500, 599, 600, 999, 1000, 2000];

testStats.forEach(str => {
    const attributes = { str };
    const attack = calculateAttackPower(attributes, 0, config);
    // Base 5 + (Str * 2 * Multiplier)
    const multiplier = config.statTiers.find(t => str >= t.threshold).multiplier;
    const expected = 5 + Math.floor(str * 2 * multiplier);
    
    console.log(`STR ${str}: Attack = ${attack} (Multiplier x${multiplier})`);
    if (attack !== expected) console.error(`Mismatch! Expected ${expected}, got ${attack}`);
});

console.log("\n=== FINAL AUDIT: XP EXPLOIT CHECK ===");
// Player Level 1 vs Level 10 (High Bonus)
const gainedHigh = calculateGainedXP(1, 10, 100, config);
console.log(`Lvl 1 killing Lvl 10 Mob (Base 100): ${gainedHigh} XP (Bonus Check)`);

// Player Level 100 vs Level 1 (Malus)
const gainedLow = calculateGainedXP(100, 1, 100, config);
console.log(`Lvl 100 killing Lvl 1 Mob (Base 100): ${gainedLow} XP (Should be 0 due to zeroBelow=10)`);

// Player Level 10 vs Level 5 (Partial Malus)
const gainedMid = calculateGainedXP(10, 5, 100, config);
console.log(`Lvl 10 killing Lvl 5 Mob (Base 100): ${gainedMid} XP (Malus Check)`);
