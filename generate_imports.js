
const classes = [
  'knight', 'mage', 'assassin', 'warrior', 'rogue', 
  'priest', 'paladin', 'ranger', 'monk', 'bard', 
  'necromancer', 'druid', 'warlock', 'shaman', 'battlemage', 
  'archer', 'berserker', 'summoner', 'templar', 'shadowblade'
];

console.log('// Class Skill Imports');
classes.forEach(cls => {
    console.log(`import ${cls}Active from "../../data/skills/${cls}.active.json" with { type: "json" };`);
    console.log(`import ${cls}Passive from "../../data/skills/${cls}.passive.json" with { type: "json" };`);
});

console.log('// Universal Skill Imports');
console.log(`import universalSkills from "../../data/skills/universal.json" with { type: "json" };`);
console.log(`import nonCombatSkillsData from "../../data/skills/non_combat.json" with { type: "json" };`);

console.log('\n// Database Construction');
console.log('const classSkillsDatabase = {');
classes.forEach(cls => {
    console.log(`  ${cls}: { active: ${cls}Active, passive: ${cls}Passive },`);
});
console.log('};');
