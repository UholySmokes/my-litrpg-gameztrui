import { generateName } from './NameGenerator.js';

const TRAITS = [
  { name: 'Hardy', effect: { hp: 20 } },
  { name: 'Wise', effect: { mana: 20 } },
  { name: 'Swift', effect: { agi: 2 } },
  { name: 'Strong', effect: { str: 2 } },
  { name: 'Arcane', effect: { int: 2 } },
  { name: 'Lucky', effect: { luck: 5 } }
];

export function generateRace() {
  const name = generateName();
  const trait = TRAITS[Math.floor(Math.random() * TRAITS.length)];
  
  // Generate random base stat modifiers
  const modifiers = {
    str: Math.floor(Math.random() * 3) - 1,
    agi: Math.floor(Math.random() * 3) - 1,
    int: Math.floor(Math.random() * 3) - 1,
    const: Math.floor(Math.random() * 3) - 1,
    wis: Math.floor(Math.random() * 3) - 1,
    cha: Math.floor(Math.random() * 3) - 1,
    luck: Math.floor(Math.random() * 3) - 1
  };

  // Ensure positive net stats
  modifiers[Object.keys(modifiers)[Math.floor(Math.random() * 6)]] += 2;

  return {
    id: name.toLowerCase(),
    name: name,
    description: `A rare race known as the ${name}, naturally ${trait.name.toLowerCase()}.`,
    modifiers: modifiers,
    traits: [trait],
    baseStats: {
      hp: 100 + (modifiers.const || 0) * 10,
      mana: 50 + (modifiers.int || 0) * 10
    }
  };
}
