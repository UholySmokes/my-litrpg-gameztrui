import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'packages/game-core/src/data/archetypes');
const categoryFiles = ['systems.json', 'authorities.json', 'paths.json', 'frameworks.json', 'privileges.json', 'overlays.json'];

const CATEGORY_DEFAULTS = {
  System: {
    statPriority: ['intelligence', 'wisdom'],
    tone: {
      voice: "analytical and precise",
      sentenceStyle: "structured, data-driven observations"
    },
    resourceColor: "#00F3FF"
  },
  Authority: {
    statPriority: ['strength', 'charisma'],
    tone: {
      voice: "commanding and absolute",
      sentenceStyle: "imperative, royal decrees"
    },
    resourceColor: "#FFD700"
  },
  Path: {
    statPriority: ['wisdom', 'vitality'],
    tone: {
      voice: "mystical and philosophical",
      sentenceStyle: "metaphorical, flowery prose"
    },
    resourceColor: "#96F2D7"
  },
  Framework: {
    statPriority: ['intelligence', 'agility'],
    tone: {
      voice: "cerebral and abstract",
      sentenceStyle: "complex, multi-layered concepts"
    },
    resourceColor: "#E599F7"
  },
  Privilege: {
    statPriority: ['luck', 'agility'],
    tone: {
      voice: "conspiratorial and secretive",
      sentenceStyle: "whispered hints, hidden meanings"
    },
    resourceColor: "#8CE99A"
  },
  Overlay: {
    statPriority: ['strength', 'agility'],
    tone: {
      voice: "chaotic and unstable",
      sentenceStyle: "fragmented, glitchy, urgent"
    },
    resourceColor: "#FF8787"
  }
};

function generateMechanics(archetype) {
  const category = archetype.category || 'System';
  const defaults = CATEGORY_DEFAULTS[category];
  
  // 1. Stat Modifiers
  if (!archetype.statModifiers) {
    archetype.statModifiers = {};
    const primary = defaults.statPriority[0];
    const secondary = defaults.statPriority[1];
    
    archetype.statModifiers[primary] = 3;
    archetype.statModifiers[secondary] = 2;
    
    // Adjust based on tags
    if (archetype.tags.includes('magic')) archetype.statModifiers.intelligence = (archetype.statModifiers.intelligence || 0) + 1;
    if (archetype.tags.includes('combat')) archetype.statModifiers.strength = (archetype.statModifiers.strength || 0) + 1;
    if (archetype.tags.includes('speed')) archetype.statModifiers.agility = (archetype.statModifiers.agility || 0) + 1;
    if (archetype.tags.includes('defense')) archetype.statModifiers.vitality = (archetype.statModifiers.vitality || 0) + 1;
  }

  // 2. Resource
  if (!archetype.archetypeResource) {
    let resourceName = "System Energy";
    if (archetype.id === 'revival_archive') resourceName = "Echo Credits";
    else if (archetype.id === 'dragon_blood_authority') resourceName = "Blood Purity";
    else if (archetype.id === 'fate_selection_engine') resourceName = "Fate Points";
    else if (archetype.name.includes('Mana')) resourceName = "Mana Surge";
    else if (archetype.name.includes('Soul')) resourceName = "Soul Fragments";
    else if (archetype.name.includes('Tech')) resourceName = "Energy Cells";
    
    archetype.archetypeResource = {
      name: resourceName,
      startValue: 0,
      maxValue: 100,
      regenRate: 1,
      color: defaults.resourceColor
    };
  }

  // 3. Narrative Tone
  if (!archetype.narrativeTone) {
    // Extract vocabulary from description (simple keyword extraction)
    const words = archetype.description
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 5) // filter short words
      .slice(0, 5); // take first 5 interesting words

    archetype.narrativeTone = {
      voice: defaults.tone.voice,
      vocabulary: [...new Set(words)], // dedupe
      sentenceStyle: defaults.tone.sentenceStyle
    };
  }

  // 4. Passives (Placeholder)
  if (!archetype.archetypePassives) {
    archetype.archetypePassives = [
      {
        id: `${archetype.id}_passive_1`,
        trigger: "passive",
        effect: "stat_boost",
        amount: 1
      }
    ];
  }

  return archetype;
}

for (const filename of categoryFiles) {
  const filepath = join(DATA_DIR, filename);
  try {
    const content = readFileSync(filepath, 'utf-8');
    let archetypes = JSON.parse(content);
    
    archetypes = archetypes.map(generateMechanics);
    
    writeFileSync(filepath, JSON.stringify(archetypes, null, 2), 'utf-8');
    console.log(`Updated mechanics for ${filename}`);
  } catch (e) {
    console.error(`Failed to update ${filename}:`, e);
  }
}

console.log('✅ Archetype mechanics populated!');
