
const fs = require('fs');
const path = require('path');

const filePath = 'packages/game-core/src/data/skills/non_combat.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const replacements = [
    { regex: /\b(D&D|DnD|Dungeons\s*(&|and)\s*Dragons)\s*(5e)?\b/gi, replace: "ancient texts" },
    { regex: /\b(Game\s*Master|GM|DM|Dungeon\s*Master)\b/g, replace: "fate" },
    { regex: /\b(tabletop|RPG|roleplaying\s*game)\b/gi, replace: "adventure" },
    { regex: /In\s+ancient\s+texts,\s*/gi, replace: "" }, // Cleanup aftermath if needed
    { regex: /\(e\.g\.,?\s*[^)]*D&D[^)]*\)/gi, replace: "" },
];

function cleanText(text) {
    if (!text) return text;
    let newText = text;
    replacements.forEach(r => {
        newText = newText.replace(r.regex, r.replace);
    });
    // Remove double spaces
    newText = newText.replace(/\s+/g, ' ');
    return newText.trim();
}

data.forEach(skill => {
    if (skill.description) {
        skill.description = cleanText(skill.description);
    }
    if (skill.template && skill.template.synergies) {
        skill.template.synergies = skill.template.synergies.map(cleanText);
    }
    
    // Normalize magnitudes
    if (skill.effects) {
        skill.effects.forEach(effect => {
            // Ensure boolean-like effects are 1.0 or properly scaled
            if (['taunt', 'disarm', 'root', 'invisible', 'charm', 'stun', 'sleep', 'petrify'].includes(effect.id)) {
                effect.magnitude = 1.0;
            }
            // Ensure percentages are reasonable (cap at 1.0 for debuffs unless specific)
            if (['fear', 'sunder', 'confuse', 'slow', 'weaken'].includes(effect.id)) {
                if (effect.magnitude > 1.0) effect.magnitude = 1.0; 
            }
        });
    }
    
    // Fix damage object structure if needed
    if (skill.damage) {
        if (skill.damage.base === undefined) skill.damage.base = 0;
        if (skill.damage.multiplier === undefined) skill.damage.multiplier = 0;
    }
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log("Cleaned non_combat.json");
