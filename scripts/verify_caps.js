import { calculateDamagePipeline } from '../src/lib/gamelogic.js';
import { races } from '../src/lib/characterData.js';

const attacker = {
  name: 'Deus',
  race: races[0],
  attributes: { str: 9999, int: 9999, luck: 10 },
  hp: { current: 100, max: 100 },
  talents: ['destruction'],
  level: 600
};

const defender = {
  name: 'Target',
  attributes: { str: 10 },
  hp: { current: 100, max: 100 }
};

const skill = { name: 'Smite', damage: 999999, isMagic: true };
const res = calculateDamagePipeline(attacker, defender, skill);
console.log('Pipeline:', res.log);
const finalEntry = res.log[res.log.length - 1];
if (!res.log.some(e => e.stage === 'MAGNITUDE_CAP')) throw new Error('Expected magnitude cap stage');
console.log('PASS');
