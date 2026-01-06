// =================================================================
// CLASS REGISTRY
// Defines all available character classes and their upgrade paths
// =================================================================

/**
 * CLASSES - 20 RPG Classes (mix of traditional and unique)
 * Each class can be upgraded later to advanced versions
 */
export const classes = [
  {
    id: 'knight',
    name: 'Knight',
    description: 'Heavy armored warrior specializing in defense and protection. Masters of melee combat and shield techniques.',
    upgradePath: 'paladin'
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'Master of arcane magic, wielding powerful elemental spells and mystical energies.',
    upgradePath: 'archmage'
  },
  {
    id: 'assassin',
    name: 'Assassin',
    description: 'Stealthy killer specializing in critical strikes, poisons, and shadow magic.',
    upgradePath: 'shadowblade'
  },
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'Fierce melee fighter focused on raw physical power and weapon mastery.',
    upgradePath: 'berserker'
  },
  {
    id: 'rogue',
    name: 'Rogue',
    description: 'Sneaky thief and trickster, expert in lockpicking, traps, and quick strikes.',
    upgradePath: 'master_thief'
  },
  {
    id: 'priest',
    name: 'Priest',
    description: 'Divine healer and supporter, wielding holy magic to heal allies and smite enemies.',
    upgradePath: 'high_priest'
  },
  {
    id: 'paladin',
    name: 'Paladin',
    description: 'Holy warrior combining martial prowess with divine magic, protector of the innocent.',
    upgradePath: 'divine_knight'
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'Wilderness expert, master of archery, tracking, and nature magic.',
    upgradePath: 'beastmaster'
  },
  {
    id: 'monk',
    name: 'Monk',
    description: 'Martial artist using unarmed combat, inner energy, and spiritual discipline.',
    upgradePath: 'grandmaster'
  },
  {
    id: 'bard',
    name: 'Bard',
    description: 'Charismatic performer using music, magic, and words to inspire allies and confuse enemies.',
    upgradePath: 'maestro'
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    description: 'Dark mage commanding undead minions and wielding death magic.',
    upgradePath: 'lich'
  },
  {
    id: 'druid',
    name: 'Druid',
    description: 'Nature guardian who shapeshifts and wields the power of the wild.',
    upgradePath: 'archdruid'
  },
  {
    id: 'warlock',
    name: 'Warlock',
    description: 'Pact-bound mage channeling demonic power and dark magic.',
    upgradePath: 'demon_lord'
  },
  {
    id: 'shaman',
    name: 'Shaman',
    description: 'Spiritual guide communing with spirits and elements, balancing healing and destruction.',
    upgradePath: 'spirit_walker'
  },
  {
    id: 'battlemage',
    name: 'Battlemage',
    description: 'Warrior-mage hybrid combining melee combat with offensive magic.',
    upgradePath: 'spellblade'
  },
  {
    id: 'archer',
    name: 'Archer',
    description: 'Ranged combat specialist with exceptional accuracy and speed.',
    upgradePath: 'sniper'
  },
  {
    id: 'berserker',
    name: 'Berserker',
    description: 'Frenzied warrior who gains power through rage and bloodlust.',
    upgradePath: 'blood_warrior'
  },
  {
    id: 'summoner',
    name: 'Summoner',
    description: 'Master of summoning creatures and elementals to fight alongside them.',
    upgradePath: 'conjurer'
  },
  {
    id: 'templar',
    name: 'Templar',
    description: 'Holy warrior specializing in anti-magic and protection against dark forces.',
    upgradePath: 'inquisitor'
  },
  {
    id: 'shadowblade',
    name: 'Shadowblade',
    description: 'Elite assassin merging shadow magic with deadly blade techniques.',
    upgradePath: 'void_assassin'
  }
];

export function getClassById(id) {
  return classes.find(c => c.id === id) || null;
}
