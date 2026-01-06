import { systemDescribeTalent } from '../src/lib/logic/TalentManager.sys.mjs';

console.log('=== VERIFY DESCRIPTIONS ===');
const desc = systemDescribeTalent('destruction');
if (!desc.includes('PROTOCOL') || !desc.includes('INITIATED')) throw new Error('Talent description should be grandiose/system-style');
console.log('PASS');
