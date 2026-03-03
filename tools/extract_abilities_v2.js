
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../packages/game-core/src/systems/class/ClassAbilityRegistry.js');
const outputDir = path.join(__dirname, '../packages/game-core/src/data/skills');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const content = fs.readFileSync(inputPath, 'utf8');

// Helper to extract object definition
function extractObject(name) {
    const startMarker = `const ${name} = {`;
    const startIndex = content.indexOf(startMarker);
    if (startIndex === -1) {
        console.error(`Could not find ${name}`);
        return null;
    }
    
    // Simple brace counting to find the end
    let depth = 0;
    let endIndex = -1;
    let foundStart = false;
    let braceStart = -1;
    
    for (let i = startIndex; i < content.length; i++) {
        const char = content[i];
        if (char === '{') {
            if (!foundStart) braceStart = i;
            depth++;
            foundStart = true;
        } else if (char === '}') {
            depth--;
            if (depth === 0 && foundStart) {
                endIndex = i + 1;
                break;
            }
        }
    }
    
    if (endIndex === -1) {
        console.error(`Could not find end of ${name}`);
        return null;
    }
    
    const objStr = content.substring(braceStart, endIndex);
    
    // Evaluate safely
    try {
        // We use Function constructor as a safer eval replacement or just eval
        // But since we have pure data, we can just use eval
        // However, we need to wrap it in parens to force expression context
        return eval('(' + objStr + ')');
    } catch (e) {
        console.error(`Error evaluating ${name}:`, e);
        return null;
    }
}

try {
    const abilities = extractObject('ABILITIES');
    const tier1 = extractObject('TIER1_ABILITY_SETS');
    const tier2 = extractObject('TIER2_ABILITY_SETS');
    
    if (!abilities || !tier1 || !tier2) {
        throw new Error('Failed to extract objects');
    }

    console.log(`Extracted ${Object.keys(abilities).length} abilities.`);
    
    // Helper to write file
    function writeClassFile(className, abilityIds) {
        const classAbilities = abilityIds.map(id => {
            const ability = abilities[id];
            if (!ability) {
                console.warn(`Warning: Ability ${id} not found for class ${className}`);
                return null;
            }
            return ability;
        }).filter(a => a !== null);
        
        // Ensure directory exists
        const filename = `class_${className}.json`;
        const filePath = path.join(outputDir, filename);
        
        fs.writeFileSync(filePath, JSON.stringify(classAbilities, null, 2));
        console.log(`Wrote ${filename} with ${classAbilities.length} abilities.`);
    }
    
    // Process Tier 1
    for (const [className, ids] of Object.entries(tier1)) {
        writeClassFile(className, ids);
    }
    
    // Process Tier 2
    for (const [className, ids] of Object.entries(tier2)) {
        writeClassFile(className, ids);
    }
    
    console.log('Migration extraction complete.');
    
} catch (err) {
    console.error(err);
}
