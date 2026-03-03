
import { describe, expect, it } from "@jest/globals";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsDataDir = path.resolve(__dirname, '../../packages/game-core/src/data/skills');

const getJsonFiles = (dir) => {
    const files = fs.readdirSync(dir);
    return files.filter(f => f.endsWith('.json')).map(f => path.join(dir, f));
};

describe("Skill JSON Schema Validation", () => {
    const files = getJsonFiles(skillsDataDir);

    files.forEach(file => {
        const fileName = path.basename(file);
        
        it(`should have valid structure for ${fileName}`, () => {
            const content = fs.readFileSync(file, 'utf8');
            const skills = JSON.parse(content);
            
            expect(Array.isArray(skills)).toBe(true);
            
            skills.forEach(skill => {
                expect(skill).toHaveProperty('id');
                expect(typeof skill.id).toBe('string');
                expect(skill.id.length).toBeGreaterThan(0);
                
                expect(skill).toHaveProperty('name');
                expect(typeof skill.name).toBe('string');
                
                if (skill.type) {
                    expect(['active', 'passive', 'buff', 'debuff']).toContain(skill.type);
                }
                
                if (skill.class) {
                    expect(typeof skill.class).toBe('string');
                }
                
                if (skill.manaCost !== undefined) {
                    expect(typeof skill.manaCost).toBe('number');
                    expect(skill.manaCost).toBeGreaterThanOrEqual(0);
                }
                
                if (skill.cooldown !== undefined) {
                    expect(typeof skill.cooldown).toBe('number');
                    expect(skill.cooldown).toBeGreaterThanOrEqual(0);
                }
            });
        });
    });
});
