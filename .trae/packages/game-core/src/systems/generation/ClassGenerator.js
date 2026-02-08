import { generateName } from "./NameGenerator.js";
import { generateSkillSet } from "./SkillGenerator.js";
import { randomChoice, randomInt } from "../../utils/DeterministicRandom.js";

const ARCHETYPES = [
  { name: "Mage", stats: { int: 3, wis: 2, cha: 1 } },
  { name: "Sorcerer", stats: { int: 2, cha: 3, luck: 1 } },
  { name: "Warlock", stats: { int: 2, wis: 1, const: 3 } },
  { name: "Druid", stats: { wis: 3, int: 1, str: 2 } },
  { name: "Spellblade", stats: { str: 2, int: 2, agi: 2 } },
  { name: "Chronomancer", stats: { int: 4, agi: 2, const: -1 } },
  { name: "Voidwalker", stats: { int: 3, agi: 3, wis: -1 } },
];

export function generateClass() {
  const archetype = randomChoice(ARCHETYPES);
  const prefix = generateName(); // e.g., "Vor"
  const className = `${prefix} ${archetype.name}`; // "Vor Mage"

  // Generate unique skills for this class
  const skills = generateSkillSet(5, 1);

  // Base stats modified by randomness
  const stats = { ...archetype.stats };
  Object.keys(stats).forEach((key) => {
    stats[key] += randomInt(0, 2);
  });

  return {
    id: className.toLowerCase().replace(/ /g, "_"),
    name: className,
    archetype: archetype.name,
    description: `A unique specialization of the ${archetype.name} arts, focusing on ${skills[0].element}.`,
    baseStats: stats,
    skills: skills,
    progression: {
      hpGrowth: 10 + (stats.const || 0) * 2,
      manaGrowth: 20 + (stats.int || 0) * 3,
    },
  };
}
