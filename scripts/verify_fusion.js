import { canFuseSkills, fuseSkills, canFuseSkillWithItem, fuseSkillWithItem } from '../src/lib/logic/SkillEvolutionManager.js';
import { getSkillById } from '../src/lib/skills.js';

console.log('=== VERIFY FUSION ===');

const player = { level: 20 };
const sA = getSkillById('assassin_backstab');
const sB = getSkillById('assassin_stealth');

if (!canFuseSkills(sA, sB, { ...player })) throw new Error('Expected fusion to be possible for same-class skills');
const fusion = fuseSkills(sA, sB);
console.log('Fusion:', fusion);

const catalystItem = { id: 'void_catalyst', name: 'Void Catalyst', tags: ['Catalyst'] };
if (!canFuseSkillWithItem(sA, catalystItem, player)) throw new Error('Expected skill+item fusion with Catalyst');
const infused = fuseSkillWithItem(sA, catalystItem);
console.log('Infused:', infused);
console.log('PASS');
