
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../packages/game-core/src/systems/class/ClassAbilityRegistry.js');
const outputDir = path.join(__dirname, '../packages/game-core/src/data/skills');

const content = fs.readFileSync(inputPath, 'utf8');

// Helper to extract object definition
function extractObject(name) {
    const startMarker = `const ${name} = {`;
    const startIndex = content.indexOf(startMarker);
    if (startIndex === -1) throw new Error(`Could not find ${name}`);
    
    // Simple brace counting to find the end
    let depth = 0;
    let endIndex = -1;
    let foundStart = false;
    
    for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '{') {
            depth++;
            foundStart = true;
        } else if (content[i] === '}') {
            depth--;
            if (depth === 0 && foundStart) {
                endIndex = i + 1;
                break;
            }
        }
    }
    
    if (endIndex === -1) throw new Error(`Could not find end of ${name}`);
    
    const objStr = content.substring(startIndex, endIndex);
    // Remove "const name = " to get just the object
    const jsonStr = objStr.substring(objStr.indexOf('{'));
    
    // Evaluate safely
    return eval(`(${jsonStr})`);
}

try {
    const abilities = extractObject('ABILITIES');
    const tier1 = extractObject('TIER1_ABILITY_SETS');
    const tier2 = extractObject('TIER2_ABILITY_SETS');
    
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
