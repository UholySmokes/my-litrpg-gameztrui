
const fs = require('fs');
const path = require('path');

const srcPath = 'packages/game-core/src/systems/skills/SkillRegistry.js';
const outDir = 'packages/game-core/src/data/skills';

const src = fs.readFileSync(srcPath, 'utf8');

// Helper to extract array content
function extractArray(name) {
  // Regex to find: const name = [ ... ];
  // We use a simple parser because the file structure is very regular
  const startRegex = new RegExp(`const\\s+${name}\\s*=\\s*\\[`);
  const match = startRegex.exec(src);
  if (!match) return null;

  const startIndex = match.index + match[0].length - 1; // pointing to '['
  let depth = 0;
  let endIndex = -1;
  let inString = false;
  let stringChar = '';

  for (let i = startIndex; i < src.length; i++) {
    const char = src[i];
    
    if (inString) {
      if (char === stringChar && src[i-1] !== '\\') {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      continue;
    }

    if (char === '[') depth++;
    else if (char === ']') {
      depth--;
      if (depth === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }

  if (endIndex === -1) return null;

  const arrayStr = src.substring(startIndex, endIndex);
  // Eval is dangerous generally, but we are parsing our own source file which we know contains just data here.
  // We need to handle 'undefined' or other variables if present, but looking at the file it seems to be just object literals.
  try {
    // Replace unquoted property keys with quoted ones if necessary (simplified)
    // Actually, eval'ing the array string directly is easiest if it's valid JS.
    const data = eval(arrayStr);
    return data;
  } catch (e) {
    console.error(`Error parsing ${name}:`, e);
    return null;
  }
}

// List of arrays to extract
const arraysToExtract = [
  'knightActiveSkills', 'knightPassiveSkills',
  'mageActiveSkills', 'magePassiveSkills',
  'assassinActiveSkills', 'assassinPassiveSkills',
  'warriorActiveSkills', 'warriorPassiveSkills',
  'rogueActiveSkills', 'roguePassiveSkills',
  'priestActiveSkills', 'priestPassiveSkills',
  'paladinActiveSkills', 'paladinPassiveSkills',
  'rangerActiveSkills', 'rangerPassiveSkills',
  'monkActiveSkills', 'monkPassiveSkills',
  'bardActiveSkills', 'bardPassiveSkills',
  'necromancerActiveSkills', 'necromancerPassiveSkills',
  'druidActiveSkills', 'druidPassiveSkills',
  'warlockActiveSkills', 'warlockPassiveSkills',
  'shamanActiveSkills', 'shamanPassiveSkills',
  'battlemageActiveSkills', 'battlemagePassiveSkills',
  'archerActiveSkills', 'archerPassiveSkills',
  'berserkerActiveSkills', 'berserkerPassiveSkills',
  'summonerActiveSkills', 'summonerPassiveSkills',
  'templarActiveSkills', 'templarPassiveSkills',
  'shadowbladeActiveSkills', 'shadowbladePassiveSkills',
  'universalSkillsDatabase'
];

if (!fs.existsSync(outDir)){
    fs.mkdirSync(outDir, { recursive: true });
}

arraysToExtract.forEach(name => {
  const data = extractArray(name);
  if (data) {
    // Determine filename
    let filename;
    if (name === 'universalSkillsDatabase') {
        filename = 'universal.json';
    } else {
        // e.g. knightActiveSkills -> knight.active.json
        const match = name.match(/^(\w+)(Active|Passive)Skills$/);
        if (match) {
            filename = `${match[1]}.${match[2].toLowerCase()}.json`;
        } else {
            filename = `${name}.json`;
        }
    }
    
    fs.writeFileSync(path.join(outDir, filename), JSON.stringify(data, null, 2));
    console.log(`Extracted ${name} to ${filename}`);
  } else {
    console.warn(`Could not extract ${name}`);
  }
});
