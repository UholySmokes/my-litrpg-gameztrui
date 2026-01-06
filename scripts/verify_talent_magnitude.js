import { calculateMagnitude, getMagnitudeCaps } from '../src/lib/logic/TalentManager.sys.mjs';

console.log('=== VERIFY TALENT MAGNITUDE ===');

const mag1 = calculateMagnitude('destruction', 50);
const mag2 = calculateMagnitude('destruction', 100);
const mag3 = calculateMagnitude('destruction', 600);

console.log('Level 50:', mag1);
console.log('Level 100:', mag2);
console.log('Level 600:', mag3);

if (mag1.label !== 'Region-Scale') throw new Error('Level 50 should be Region-Scale');
if (mag2.label !== 'City-Scale') throw new Error('Level 100 should be City-Scale');
if (mag3.label !== 'Planet-Scale') throw new Error('Level 600 should be Planet-Scale');

const caps = getMagnitudeCaps('destruction', 600);
if (caps.damageCap < 500000) throw new Error('Planet-Scale damage cap too low');

console.log('PASS');
