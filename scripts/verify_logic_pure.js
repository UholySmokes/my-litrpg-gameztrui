
console.log("Starting Logic Verification...");

// 1. Stat Update Logic (Mimicking the Hook's new logic)
const INITIAL_FREE_POINTS = 15;
const baseStats = { str: 5, agi: 5, dex: 5, int: 5, cha: 5, will: 5, luck: 5, soul: 5 };
let currentStats = { ...baseStats };

function getRemainingPoints(stats) {
    const totalAllocated = Object.values(stats).reduce((a, b) => a + b, 0);
    const basePoints = 8 * 5;
    return INITIAL_FREE_POINTS - (totalAllocated - basePoints);
}

function allocate(attr) {
    // Mimic setState(prev => ...)
    const prev = { ...currentStats };
    const currentTotal = Object.values(prev).reduce((a, b) => a + b, 0);
    const currentRemaining = INITIAL_FREE_POINTS - (currentTotal - (8 * 5));
    
    if (currentRemaining <= 0) {
        console.log(`[Block] Cannot allocate ${attr}. Points remaining: ${currentRemaining}`);
        return;
    }
    
    currentStats = {
        ...prev,
        [attr]: prev[attr] + 1
    };
    console.log(`[Success] Allocated ${attr}. New Value: ${currentStats[attr]}. Remaining: ${getRemainingPoints(currentStats)}`);
}

// Test Allocation
console.log(`Initial Remaining: ${getRemainingPoints(currentStats)}`);
allocate('str'); // 14 left
allocate('str'); // 13 left
for(let i=0; i<13; i++) allocate('agi'); // Use up rest
allocate('dex'); // Should fail

// 2. Class Selection Logic
let selectedClass = null;
let selectedPassiveSkills = [];

function selectClass(id) {
    // The fix: Check equality
    if (selectedClass === id) {
        console.log(`[Info] Class ${id} already selected. Doing nothing.`);
        return;
    }
    console.log(`[Action] Selecting class ${id}. Clearing passives.`);
    selectedClass = id;
    selectedPassiveSkills = [];
}

selectClass('warrior');
selectedPassiveSkills.push('skill1');
console.log(`Passives: ${selectedPassiveSkills}`);

selectClass('warrior'); // Should not clear
console.log(`Passives after re-select (Expected: ['skill1']): ${selectedPassiveSkills}`);

selectClass('mage'); // Should clear
console.log(`Passives after change (Expected: []): ${selectedPassiveSkills}`);

console.log("Logic Verification Complete.");
