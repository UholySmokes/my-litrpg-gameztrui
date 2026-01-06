import { executeSkill } from '../src/systems/combat/CombatSystem.js';
import { races } from '../src/entities/Player.js';
// import talentRegistry from '../src/data/talent.registry.json' with { type: 'json' };
// import skillRegistry from '../src/data/skill.registry.json' with { type: 'json' };

// Setup environment for testing race registry imports
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Note: In a real environment, we'd ensure proper ESM loading or mocking.
// For this script, we assume node runs it with access to src imports via relative paths.

const assassinRace = races.find(r => r.id === 'shadow_walker') || races[0];

const attacker = {
  name: 'Assassin',
  race: assassinRace,
  attributes: { str: 12, int: 8, luck: 5 },
  hp: { current: 100, max: 100 },
  mana: { current: 100, max: 100 },
  effects: [],
  talents: []
};

const defender = {
  name: 'Target Dummy',
  attributes: { str: 10 },
  hp: { current: 100, max: 100 },
  effects: []
};

console.log('=== VERIFY SKILL EFFECTS ===');
const res = executeSkill(attacker, defender, 'assassin_shadow_dash');
console.log('Damage:', res.damage, 'Cost:', res.cost, 'Cooldown:', res.cooldown);

// Use updated entities from result
const updatedAttacker = res.updatedAttacker || attacker;

console.log('Attacker Effects:', updatedAttacker.effects.map(e => e.name));
if (!updatedAttacker.effects.some(e => e.id === 'blur')) {
  throw new Error('Blur effect not applied to attacker');
}
console.log('PASS');

