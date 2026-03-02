
const fs = require('fs');
const path = require('path');

const srcPath = 'packages/game-core/src/systems/skills/NonCombatSkillRegistry.js';
const outDir = 'packages/game-core/src/data/skills';

const src = fs.readFileSync(srcPath, 'utf8');

// Helper to extract exported array content
function extractExportedArray(name) {
  // Regex to find: export const name = [ ... ];
  const startRegex = new RegExp(`export\\s+const\\s+${name}\\s*=\\s*\\[`);
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
  try {
    const data = eval(arrayStr);
    return data;
  } catch (e) {
    console.error(`Error parsing ${name}:`, e);
    return null;
  }
}

if (!fs.existsSync(outDir)){
    fs.mkdirSync(outDir, { recursive: true });
}

const data = extractExportedArray('nonCombatSkills');
if (data) {
    const filename = 'non_combat.json';
    fs.writeFileSync(path.join(outDir, filename), JSON.stringify(data, null, 2));
    console.log(`Extracted nonCombatSkills to ${filename}`);
} else {
    console.warn(`Could not extract nonCombatSkills`);
}
