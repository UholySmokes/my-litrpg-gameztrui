
import { describe, expect, it } from "@jest/globals";
import fs from 'fs';
import path from 'path';
import { getAllSkills } from '../../packages/game-core/src/systems/skills/SkillRegistry.js';
import { validateEngineProfileShape } from '../../packages/game-core/src/systems/abilities/engineProfile.js';

const skillsDataDir = path.resolve(process.cwd(), 'packages/game-core/src/data/skills');

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

            // Ability-set files are maps (ownerId -> abilityId[]), not arrays.
            if (fileName.endsWith('_ability_sets.json')) {
                expect(skills).toBeTruthy();
                expect(Array.isArray(skills)).toBe(false);
                expect(typeof skills).toBe('object');

                Object.entries(skills).forEach(([ownerId, abilityIds]) => {
                    expect(typeof ownerId).toBe('string');
                    expect(ownerId.length).toBeGreaterThan(0);
                    expect(Array.isArray(abilityIds)).toBe(true);
                    abilityIds.forEach((abilityId) => {
                        expect(typeof abilityId).toBe('string');
                        expect(abilityId.length).toBeGreaterThan(0);
                    });
                });
                return;
            }
            
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

describe("Skill engine profile validation", () => {
    it("ensures every executable skill exposes a valid engine profile", () => {
        const skills = getAllSkills().filter(
            (skill) => skill && ['active', 'passive', 'buff', 'debuff'].includes(skill.type),
        );
        expect(skills.length).toBeGreaterThan(0);

        skills.forEach((skill) => {
            const validation = validateEngineProfileShape(skill.engineProfile);
            expect(validation.valid).toBe(true);
        });
    });
});
