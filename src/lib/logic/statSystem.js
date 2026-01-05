// =================================================================
// STAT SYSTEM - Attribute Scaling & Tier Logic
// =================================================================

/**
 * Calculates the effectiveness of a stat based on current value and tiers.
 * LitRPG trope: "Quality over Quantity" - Higher stats can have compounding effects 
 * or unlock "Rank" multipliers.
 * 
 * Default Model: Tiered Multipliers
 * 1-99 (Mortal): 1x effectiveness
 * 100-299 (Iron): 1.2x effectiveness
 * 300-599 (Bronze): 1.5x effectiveness
 * 600-999 (Silver): 2.0x effectiveness
 * 1000+ (Gold): 3.0x effectiveness
 */

const DEFAULT_TIERS = [
    { threshold: 1000, multiplier: 3.0, rank: "Gold" },
    { threshold: 600, multiplier: 2.0, rank: "Silver" },
    { threshold: 300, multiplier: 1.5, rank: "Bronze" },
    { threshold: 100, multiplier: 1.2, rank: "Iron" },
    { threshold: 0,   multiplier: 1.0, rank: "Mortal" }
];

export function getStatTier(value, config) {
    const tiers = config?.statTiers || DEFAULT_TIERS;
    // Find the first tier where value >= threshold
    // Tiers should be sorted descending by threshold
    return tiers.find(t => value >= t.threshold) || tiers[tiers.length - 1];
}

/**
 * Calculates derived secondary stats (Attack, HP, etc.) from primary attributes.
 * Applies Tier multipliers to make high stats "feel" powerful.
 */
export function calculateDerivedStat(attributeValue, baseMultiplier, config) {
    const tier = getStatTier(attributeValue, config);
    // Formula: (Value * BaseMultiplier) * TierMultiplier
    // This makes 1000 STR worth 3x more per point than 10 STR.
    // 10 STR * 2 * 1 = 20 Attack
    // 1000 STR * 2 * 3 = 6000 Attack (Linear would be 2000)
    return Math.floor(attributeValue * baseMultiplier * tier.multiplier);
}

/**
 * Calculates max HP based on stats
 */
export function calculateMaxHp(stats, config) {
    const str = stats.str || 0;
    const will = stats.will || 0;
    const baseHp = config?.startHp || 100;
    
    // HP Scaling
    const hpFromStr = calculateDerivedStat(str, config?.hpPerStr || 10, config);
    const hpFromWill = calculateDerivedStat(will, config?.hpPerWill || 5, config);
    
    return baseHp + hpFromStr + hpFromWill;
}

/**
 * Calculates Attack Power
 */
export function calculateAttackPower(stats, weaponDamage, config) {
    const str = stats.str || 0;
    const baseAttack = config?.baseAttackDamage || 5;
    
    // Attack Scaling
    const attackFromStr = calculateDerivedStat(str, config?.strToDamageMultiplier || 2, config);
    
    return baseAttack + attackFromStr + (weaponDamage || 0);
}
