import { generateRace } from './RaceGenerator.js';
import { generateClass } from './ClassGenerator.js';
import { generateSkill, generateSkillSet } from './SkillGenerator.js';
import { generateTitle } from './NameGenerator.js';

export const ContentGenerator = {
  generateRace,
  generateClass,
  generateSkill,
  generateSkills: generateSkillSet,
  generateTitle,

  generateCharacterOptions: (count = 3) => {
    const races = [];
    const classes = [];
    for (let i = 0; i < count; i++) {
      races.push(generateRace());
      classes.push(generateClass());
    }
    return { races, classes };
  }
};
