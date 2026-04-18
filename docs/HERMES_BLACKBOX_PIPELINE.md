# Hermes + BLACKBOXAI Collaboration Pipeline

## Overview
Pipeline for Hermes lore gen (factions, quests, zones) integrated into game state.

## Workflow
1. **Generate**: `node scripts/hermes-integration.js --generate lore-faction-generator faction --name "Shadow Guild" --type thief`
2. Hermes writes JSON to `docs/lore/generated/`.
3. Script watches/copies to `src/data/lore/`.
4. Game loads via `src/data/lore-loader.js` -> `injectLoreIntoState`.

## Test
- Watch mode: `node scripts/hermes-integration.js --watch`
- Load in console: `import loreLoader from './src/data/lore-loader.js'; loreLoader.loadLoreFiles()`

## Game Integration
- Factions auto-added to quests.
- Normalize for player interactions (e.g., faction quests trigger).

Updated 2026-04-18 by BLACKBOXAI.

