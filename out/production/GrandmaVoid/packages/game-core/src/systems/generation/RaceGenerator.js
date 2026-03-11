import { generateName } from "./NameGenerator.js";
import { randomChoice, randomInt } from "../../utils/DeterministicRandom.js";

const TRAITS = [
  { name: "Hardy", effect: { hp: 20 } },
  { name: "Wise", effect: { mana: 20 } },
  { name: "Swift", effect: { agi: 2 } },
  { name: "Strong", effect: { str: 2 } },
  { name: "Arcane", effect: { int: 2 } },
  { name: "Lucky", effect: { luck: 5 } },
];

export function generateRace() {
  const name = generateName();
  const trait = randomChoice(TRAITS);

  // Generate random base stat modifiers
  const modifiers = {
    str: randomInt(-1, 1),
    agi: randomInt(-1, 1),
    int: randomInt(-1, 1),
    const: randomInt(-1, 1),
    wis: randomInt(-1, 1),
    cha: randomInt(-1, 1),
    luck: randomInt(-1, 1),
  };

  // Ensure positive net stats
  modifiers[Object.keys(modifiers)[randomInt(0, 5)]] += 2;

  return {
    id: name.toLowerCase(),
    name: name,
    description: `A rare race known as the ${name}, naturally ${trait.name.toLowerCase()}.`,
    modifiers: modifiers,
    traits: [trait],
    baseStats: {
      hp: 100 + (modifiers.const || 0) * 10,
      mana: 50 + (modifiers.int || 0) * 10,
    },
  };
}
