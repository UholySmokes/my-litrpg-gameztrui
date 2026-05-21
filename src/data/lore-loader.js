// src/data/lore-loader.js - Load and normalize Hermes-generated lore for game state
/* global process */
import fs from 'fs';
import path from 'path';

const ROOT = import.meta.dirname ? new URL('.', import.meta.url).pathname : process.cwd();
const LORE_DIR = path.join(ROOT, 'data/lore');

export function loadLoreFiles() {
  if (!fs.existsSync(LORE_DIR)) return {};
  const files = fs.readdirSync(LORE_DIR).filter(f => f.endsWith('.json'));
  const lore = {};
  for (const file of files) {
    try {
      const fullPath = path.join(LORE_DIR, file);
      lore[file.replace('.json', '')] = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } catch (error) {
      console.error(`Lore load error for ${file}:`, error.message);
    }
  }
  return lore;
}

export function normalizeFaction(faction) {
  return {
    id: faction.id || faction.name.toLowerCase().replace(/\s+/g, '_'),
    name: faction.name,
    leader: faction.leader || {},
    members: faction.members || [],
    bases: faction.bases || [],
    quests: faction.quests || [],
    enemies: faction.enemies || [],
    economy: faction.economy || {},
  };
}

export function getAvailableFactions(lore) {
  return Object.values(lore).map(normalizeFaction);
}

export function injectLoreIntoState(state, lore) {
  return {
    ...state,
    world: {
      ...state.world,
      lore,
    },
    quests: {
      ...state.quests,
      factions: getAvailableFactions(lore),
    },
  };
}

// Auto-load on module import for dev
if (import.meta.env.DEV) {
  const lore = loadLoreFiles();
  console.log('Loaded lore:', Object.keys(lore));
}

export default { loadLoreFiles, normalizeFaction, getAvailableFactions, injectLoreIntoState };

