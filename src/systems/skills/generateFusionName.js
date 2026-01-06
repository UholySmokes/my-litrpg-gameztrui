/**
 * Generate fusion name
 */
export function generateFusionName(skillA, skillB, fusionType) {
    const names = [skillA.name, skillB.name];

    switch (fusionType) {
        case 'synergistic':
            return `${skillA.name} Synergy`;
        case 'elemental':
            return `${skillA.name} Elemental Fusion`;
        default:
            return `${skillA.name} + ${skillB.name}`;
    }
}
