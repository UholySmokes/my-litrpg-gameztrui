import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'packages/game-core/src/data/archetypes');
const categoryFiles = ['systems.json', 'authorities.json', 'paths.json', 'frameworks.json', 'privileges.json', 'overlays.json'];

function truncate(str, limit) {
    if (!str) return str;
    if (str.length <= limit) return str;
    return str.substring(0, limit - 3) + '...';
}

function fixArchetype(archetype) {
    // Fix ID
    if (archetype.id) {
        archetype.id = archetype.id.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    }

    // Fix Summary
    if (archetype.summary) {
        archetype.summary = truncate(archetype.summary, 120);
    }

    // Fix Description
    if (archetype.description) {
        archetype.description = truncate(archetype.description, 600);
    }

    // Fix Arrays (CoreLoop, Progression, NarrativeHooks, QuestHooks)
    const fixArray = (arr, limit, minCount, maxCount, name) => {
        if (!arr) arr = [];
        // Truncate items
        arr = arr.map(item => truncate(item, limit));
        
        // Pad if needed
        while (arr.length < minCount) {
            arr.push(`Unlock further potential in ${name} (Placeholder).`);
        }
        
        // Trim if too many
        return arr.slice(0, maxCount);
    };

    archetype.coreLoop = fixArray(archetype.coreLoop, 200, 3, 5, "core loop");
    archetype.progression = fixArray(archetype.progression, 200, 3, 5, "progression");
    archetype.narrativeHooks = fixArray(archetype.narrativeHooks, 200, 2, 4, "narrative");
    archetype.questHooks = fixArray(archetype.questHooks, 200, 2, 4, "quests");

    // Fix Tags
    if (!archetype.tags) archetype.tags = [];
    archetype.tags = archetype.tags.map(t => t.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
    // Deduplicate tags
    archetype.tags = [...new Set(archetype.tags)];
    
    while (archetype.tags.length < 2) {
        archetype.tags.push("system");
    }
    // Deduplicate again in case we added existing
    archetype.tags = [...new Set(archetype.tags)];
    if (archetype.tags.length < 2) archetype.tags.push("generic");
    
    archetype.tags = archetype.tags.slice(0, 6);

    return archetype;
}

for (const filename of categoryFiles) {
    const filepath = join(DATA_DIR, filename);
    try {
        const content = readFileSync(filepath, 'utf-8');
        let archetypes = JSON.parse(content);
        
        archetypes = archetypes.map(fixArchetype);
        
        writeFileSync(filepath, JSON.stringify(archetypes, null, 2), 'utf-8');
        console.log(`Fixed ${filename}`);
    } catch (e) {
        console.error(`Failed to fix ${filename}:`, e);
    }
}
console.log('Done fixing archetypes.');
