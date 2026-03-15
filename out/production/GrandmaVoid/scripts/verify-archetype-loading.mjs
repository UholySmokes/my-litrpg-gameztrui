import { ARCHETYPE_DEFINITIONS, getArchetypeSystemById, getAllArchetypeSystems } from '../packages/game-core/src/systems/archetype/ArchetypeSystemRegistry.js';

console.log(`Loaded ${ARCHETYPE_DEFINITIONS.length} definitions.`);
console.log(`Loaded ${getAllArchetypeSystems().length} systems.`);

if (ARCHETYPE_DEFINITIONS.length === 0) {
    console.error('❌ ARCHETYPE_DEFINITIONS is empty.');
    process.exit(1);
}

const firstId = ARCHETYPE_DEFINITIONS[0].id;
const system = getArchetypeSystemById(firstId);

if (system && system.id === firstId) {
  console.log(`✅ getArchetypeSystemById('${firstId}') works.`);
} else {
  console.error(`❌ getArchetypeSystemById('${firstId}') failed.`);
  process.exit(1);
}
