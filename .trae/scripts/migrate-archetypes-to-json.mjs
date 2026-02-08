import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INPUT_FILE = join(process.cwd(), 'packages/game-core/src/systems/archetype/ArchetypeSystemRegistry.js');
const OUTPUT_DIR = join(process.cwd(), 'packages/game-core/src/data/archetypes');

// Read the source file
const sourceCode = readFileSync(INPUT_FILE, 'utf-8');

// Extract the ARCHETYPE_DEFINITIONS array
const match = sourceCode.match(/export let ARCHETYPE_DEFINITIONS\s*=\s*(\[[\s\S]*?\]);/);
if (!match) {
  console.error('Could not find ARCHETYPE_DEFINITIONS array');
  process.exit(1);
}

// Evaluate the array content safely to get the JSON object
let definitions;
try {
  // Use Function constructor to evaluate the JS object string
  // This handles unquoted keys, trailing commas, etc.
  definitions = new Function('return ' + match[1])();
} catch (e) {
  console.error('Failed to parse ARCHETYPE_DEFINITIONS:', e);
  process.exit(1);
}

// Group by category
const categories = {
  System: [],
  Authority: [],
  Path: [],
  Framework: [],
  Privilege: [],
  Overlay: []
};

definitions.forEach(def => {
  const category = def.category || 'System';
  if (categories[category]) {
    categories[category].push(def);
  } else {
    console.warn(`Unknown category: ${category}, defaulting to System`);
    categories.System.push(def);
  }
});

// Write category files
const categoryFileMap = {
  System: 'systems.json',
  Authority: 'authorities.json',
  Path: 'paths.json',
  Framework: 'frameworks.json',
  Privilege: 'privileges.json',
  Overlay: 'overlays.json'
};

mkdirSync(OUTPUT_DIR, { recursive: true });

for (const [category, archetypes] of Object.entries(categories)) {
  const filename = categoryFileMap[category];
  const filepath = join(OUTPUT_DIR, filename);
  writeFileSync(filepath, JSON.stringify(archetypes, null, 2), 'utf-8');
  console.log(`✓ Wrote ${archetypes.length} archetypes to ${filename}`);
}

console.log('\n✅ Migration complete!');
