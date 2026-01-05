
import { addXp } from '../src/lib/gamelogic.js';
import { xpForNextLevel } from '../src/lib/logic/levelSystem.js';

// Mock minimal state
const mockConfig = {
    xpScalingFactor: 1.5, // Should be ignored by new logic, but kept for structure
    maxLevel: 100,
    baseXpRequired: 100,
    attributePointsPerLevel: 3,
    xpBrackets: [
        { end: 10,   base: 50,    growth: 1.25 },
        { end: 50,   base: 200,   growth: 1.15 }
    ]
};

const mockPlayer = {
    name: "SimUser",
    level: 1,
    xp: { current: 0, max: 50 },
    hp: { current: 100, max: 100 },
    mana: { current: 50, max: 50 },
    attributes: { freePoints: 0 },
    justLeveledUp: false
};

const initialState = {
    config: mockConfig,
    player: { ...mockPlayer }
};

console.log("=== STARTING LEVEL 5 SIMULATION (100 RUNS) ===");

let successes = 0;
let failures = 0;

for (let i = 0; i < 100; i++) {
    let state = JSON.parse(JSON.stringify(initialState));
    let steps = 0;
    const maxSteps = 1000; // Fail-safe
    
    try {
        while (state.player.level < 5 && steps < maxSteps) {
            // Simulate killing a mob worth 20-50 XP
            const xpGain = Math.floor(Math.random() * 30) + 20;
            state = addXp(state, xpGain);
            steps++;
            
            // Validation Checks
            if (state.player.level > 100) throw new Error("Level overflow");
            if (state.player.xp.current < 0) throw new Error("Negative XP");
            if (Number.isNaN(state.player.xp.max)) throw new Error("NaN Max XP");
        }
        
        if (state.player.level >= 5) {
            successes++;
        } else {
            console.error(`Run ${i} timed out at Level ${state.player.level}`);
            failures++;
        }
    } catch (e) {
        console.error(`Run ${i} FAILED: ${e.message}`);
        failures++;
    }
}

console.log(`\n=== RESULTS ===`);
console.log(`Total Runs: 100`);
console.log(`Success: ${successes}`);
console.log(`Failures: ${failures}`);

if (failures === 0) {
    console.log("PASS: Leveling logic is stable.");
} else {
    console.log("FAIL: Bugs detected in leveling logic.");
}
