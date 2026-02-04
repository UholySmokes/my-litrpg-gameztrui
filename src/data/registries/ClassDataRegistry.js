// =================================================================
// CLASS DATA REGISTRY
// Consolidated class data
// Migrated from: src/systems/class/ClassRegistry.js
// =================================================================

/**
 * CLASSES - 50 RPG Classes
 * Each class can be upgraded later to advanced versions
 */
export let classes = [
  {
    id: 'knight',
    name: 'Knight',
    description: 'Heavy armored warrior specializing in defense and protection. Masters of melee combat and shield techniques.',
    upgradePath: 'paladin',
    resourceSystem: 'mana',
    coreMechanics: ['shield_block', 'taunt']
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'Master of arcane magic, wielding powerful elemental spells and mystical energies.',
    upgradePath: 'archmage',
    resourceSystem: 'mana',
    coreMechanics: ['spell_schools', 'arcane_mastery']
  },
  {
    id: 'assassin',
    name: 'Assassin',
    description: 'Stealthy killer specializing in critical strikes, poisons, and shadow magic.',
    upgradePath: 'shadowblade',
    resourceSystem: 'energy',
    coreMechanics: ['stealth', 'poison', 'critical_strikes']
  },
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'Fierce melee fighter focused on raw physical power and weapon mastery.',
    upgradePath: 'berserker',
    resourceSystem: 'rage',
    coreMechanics: ['stance_system', 'weapon_mastery']
  },
  {
    id: 'rogue',
    name: 'Rogue',
    description: 'Sneaky thief and trickster, expert in lockpicking, traps, and quick strikes.',
    upgradePath: 'master_thief',
    resourceSystem: 'energy',
    coreMechanics: ['stealth', 'lockpicking', 'pickpocket', 'traps']
  },
  {
    id: 'priest',
    name: 'Priest',
    description: 'Divine healer and supporter, wielding holy magic to heal allies and smite enemies.',
    upgradePath: 'high_priest',
    resourceSystem: 'mana',
    coreMechanics: ['prayer_system', 'resurrection', 'holy_magic']
  },
  {
    id: 'paladin',
    name: 'Paladin',
    description: 'Holy warrior combining martial prowess with divine magic, protector of the innocent.',
    upgradePath: 'divine_knight',
    resourceSystem: 'mana',
    coreMechanics: ['lay_on_hands', 'divine_shield', 'auras']
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'Wilderness expert, master of archery, tracking, and nature magic.',
    upgradePath: 'beastmaster',
    resourceSystem: 'focus',
    coreMechanics: ['pet_companion', 'tracking', 'traps', 'favored_enemy']
  },
  {
    id: 'monk',
    name: 'Monk',
    description: 'Martial artist using unarmed combat, inner energy, and spiritual discipline.',
    upgradePath: 'grandmaster',
    resourceSystem: 'chi',
    coreMechanics: ['chi_system', 'combo_attacks', 'meditation', 'unarmed_scaling']
  },
  {
    id: 'bard',
    name: 'Bard',
    description: 'Charismatic performer using music, magic, and words to inspire allies and confuse enemies.',
    upgradePath: 'maestro',
    resourceSystem: 'mana',
    coreMechanics: ['performance_system', 'inspiration', 'charm', 'vicious_mockery']
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    description: 'Dark mage commanding undead minions and wielding death magic.',
    upgradePath: 'lich',
    resourceSystem: 'mana',
    coreMechanics: ['summon_undead', 'death_magic', 'life_drain']
  },
  {
    id: 'druid',
    name: 'Druid',
    description: 'Nature guardian who shapeshifts and wields the power of the wild.',
    upgradePath: 'archdruid',
    resourceSystem: 'mana',
    coreMechanics: ['shapeshift', 'nature_magic', 'wild_growth']
  },
  {
    id: 'warlock',
    name: 'Warlock',
    description: 'Pact-bound mage channeling demonic power and dark magic.',
    upgradePath: 'demon_lord',
    resourceSystem: 'mana',
    coreMechanics: ['summon_demons', 'dark_pact', 'soul_shards']
  },
  {
    id: 'shaman',
    name: 'Shaman',
    description: 'Spiritual guide communing with spirits and elements, balancing healing and destruction.',
    upgradePath: 'spirit_walker',
    resourceSystem: 'mana',
    coreMechanics: ['totem_system', 'spirit_link', 'ancestral_spirits', 'elemental_overload']
  },
  {
    id: 'battlemage',
    name: 'Battlemage',
    description: 'Warrior-mage hybrid combining melee combat with offensive magic.',
    upgradePath: 'spellblade',
    resourceSystem: 'mana',
    coreMechanics: ['spell_blade_synergy', 'arcane_strikes']
  },
  {
    id: 'archer',
    name: 'Archer',
    description: 'Ranged combat specialist with exceptional accuracy and speed.',
    upgradePath: 'sniper',
    resourceSystem: 'focus',
    coreMechanics: ['aimed_shot', 'multi_shot', 'rapid_fire']
  },
  {
    id: 'berserker',
    name: 'Berserker',
    description: 'Frenzied warrior who gains power through rage and bloodlust.',
    upgradePath: 'blood_warrior',
    resourceSystem: 'rage',
    coreMechanics: ['rage_system', 'enrage', 'bloodlust', 'rampage']
  },
  {
    id: 'summoner',
    name: 'Summoner',
    description: 'Master of summoning creatures and elementals to fight alongside them.',
    upgradePath: 'conjurer',
    resourceSystem: 'mana',
    coreMechanics: ['summon_elementals', 'multiple_summons', 'elemental_synergy']
  },
  {
    id: 'templar',
    name: 'Templar',
    description: 'Holy warrior specializing in anti-magic and protection against dark forces.',
    upgradePath: 'inquisitor',
    resourceSystem: 'mana',
    coreMechanics: ['anti_magic_field', 'spell_reflection', 'purge', 'holy_shield']
  },
  {
    id: 'shadowblade',
    name: 'Shadowblade',
    description: 'Elite assassin merging shadow magic with deadly blade techniques.',
    upgradePath: 'void_assassin',
    resourceSystem: 'energy',
    coreMechanics: ['shadow_step', 'mark_for_death', 'shadow_strikes']
  },
  {
    id: 'chronomancer',
    name: 'Chronomancer',
    description: 'Temporal arcanist who bends time to control turn flow, cooldowns, and burst windows.',
    upgradePath: 'time_archon',
    resourceSystem: 'mana',
    coreMechanics: ['cooldown_warp', 'time_dilation', 'rewind']
  },
  {
    id: 'alchemist',
    name: 'Alchemist',
    description: 'Combat chemist brewing bombs, mutagens, and elixirs on the fly.',
    upgradePath: 'master_alchemist',
    resourceSystem: 'mana',
    coreMechanics: ['transmutation', 'potion_bombs', 'mutagens']
  },
  {
    id: 'spellbreaker',
    name: 'Spellbreaker',
    description: 'Anti-mage duelist who shatters wards, interrupts casting, and punishes spell reliance.',
    upgradePath: 'null_knight',
    resourceSystem: 'focus',
    coreMechanics: ['spell_sunder', 'silence', 'mana_drain']
  },
  {
    id: 'gunslinger',
    name: 'Gunslinger',
    description: 'Ranged specialist using firearms, trick shots, and explosive rounds.',
    upgradePath: 'deadeye',
    resourceSystem: 'focus',
    coreMechanics: ['trick_shots', 'ammo_management', 'overwatch']
  },
  {
    id: 'warden',
    name: 'Warden',
    description: 'Stoic guardian wielding nature wards and protective runes to outlast any foe.',
    upgradePath: 'ancient_sentinel',
    resourceSystem: 'mana',
    coreMechanics: ['warding', 'thorns', 'protective_totems']
  },
  {
    id: 'psion',
    name: 'Psion',
    description: 'Mind-weaver who assaults the psyche with illusions, fear, and telekinetic force.',
    upgradePath: 'mind_lord',
    resourceSystem: 'mana',
    coreMechanics: ['mental_stacks', 'telekinesis', 'illusion']
  },
  {
    id: 'reaper',
    name: 'Reaper',
    description: 'Soul-harvester who marks prey, feeds on fear, and executes weakened targets.',
    upgradePath: 'soul_harvester',
    resourceSystem: 'energy',
    coreMechanics: ['execute', 'soul_fragments', 'curse_marks']
  },
  {
    id: 'tinkerer',
    name: 'Tinkerer',
    description: 'Gadgeteer deploying drones, traps, and overclocked contraptions to control the field.',
    upgradePath: 'machinist',
    resourceSystem: 'focus',
    coreMechanics: ['deployables', 'overclock', 'gadget_chains']
  },
  {
    id: 'oracle',
    name: 'Oracle',
    description: 'Prophetic support-caster who manipulates fate, mitigates disaster, and enables allies.',
    upgradePath: 'seer',
    resourceSystem: 'mana',
    coreMechanics: ['foresight', 'fate_marks', 'probability_shift']
  },
  {
    id: 'blade_dancer',
    name: 'Blade Dancer',
    description: 'Swift dual-wielder chaining steps, parries, and whirling slashes into relentless pressure.',
    upgradePath: 'storm_dancer',
    resourceSystem: 'energy',
    coreMechanics: ['combo_steps', 'riposte', 'whirling_blades']
  },
  {
    id: 'system_hacker',
    name: 'System Hacker',
    description: 'Rule-breaking technician who exploits interfaces and bends combat protocols.',
    upgradePath: 'reality_architect',
    resourceSystem: 'focus',
    coreMechanics: ['rule_break', 'exploit_threads', 'system_override']
  },
  {
    id: 'bloodline_vanguard',
    name: 'Bloodline Vanguard',
    description: 'Frontline warrior empowered by ancestral blood and inherited ferocity.',
    upgradePath: 'blood_titan',
    resourceSystem: 'rage',
    coreMechanics: ['blood_surge', 'ancestral_guard', 'lineage_rituals']
  },
  {
    id: 'shadow_tactician',
    name: 'Shadow Tactician',
    description: 'Battlefield controller who marks targets and strikes from cover.',
    upgradePath: 'umbra_commander',
    resourceSystem: 'energy',
    coreMechanics: ['shadow_marks', 'battlefield_control', 'assassination']
  },
  {
    id: 'aether_sage',
    name: 'Aether Sage',
    description: 'Mystic scholar who channels aether into lances and barriers.',
    upgradePath: 'aether_paragon',
    resourceSystem: 'mana',
    coreMechanics: ['aether_lance', 'mana_well', 'phase_barrier']
  },
  {
    id: 'rift_blade',
    name: 'Rift Blade',
    description: 'Swordmage who cuts through space and strikes across gaps.',
    upgradePath: 'rift_reaver',
    resourceSystem: 'mana',
    coreMechanics: ['rift_slash', 'blink_strike', 'void_guard']
  },
  {
    id: 'worldtree_warden',
    name: 'Worldtree Warden',
    description: 'Guardian of living roots who binds foes and mends allies.',
    upgradePath: 'worldtree_sentinel',
    resourceSystem: 'mana',
    coreMechanics: ['verdant_bind', 'life_bloom', 'barkskin']
  },
  {
    id: 'chrono_duelist',
    name: 'Chrono Duelist',
    description: 'Fencer who bends time windows to reset mistakes and surge tempo.',
    upgradePath: 'chrono_archon',
    resourceSystem: 'focus',
    coreMechanics: ['time_cut', 'rewind', 'tempo_boost']
  },
  {
    id: 'storm_caller',
    name: 'Storm Caller',
    description: 'Elementalist who commands thunder, shock, and stormfront pressure.',
    upgradePath: 'tempest_lord',
    resourceSystem: 'mana',
    coreMechanics: ['storm_bolt', 'thunderclap', 'eye_of_storm']
  },
  {
    id: 'grave_binder',
    name: 'Grave Binder',
    description: 'Necrotic binder who anchors souls and raises bonewarders.',
    upgradePath: 'grave_sentinel',
    resourceSystem: 'mana',
    coreMechanics: ['soul_chain', 'grave_shield', 'boneguard']
  },
  {
    id: 'beast_lord',
    name: 'Beast Lord',
    description: 'Alpha commander who directs pack assaults and dominates the field.',
    upgradePath: 'primal_overlord',
    resourceSystem: 'focus',
    coreMechanics: ['command_roar', 'pack_assault', 'alpha_guard']
  },
  {
    id: 'void_marauder',
    name: 'Void Marauder',
    description: 'Skirmisher who weaponizes darkness and entropy to break defenses.',
    upgradePath: 'void_warlord',
    resourceSystem: 'energy',
    coreMechanics: ['void_rend', 'shadow_meld', 'entropy_strike']
  },
  {
    id: 'rune_artificer',
    name: 'Rune Artificer',
    description: 'Arcane crafter who inscribes wards and detonates sigils.',
    upgradePath: 'rune_architect',
    resourceSystem: 'mana',
    coreMechanics: ['runic_blast', 'ward_inscribe', 'sigil_bind']
  },
  {
    id: 'starbound_archer',
    name: 'Starbound Archer',
    description: 'Marksman guided by starlight, layering burns and precision fire.',
    upgradePath: 'astral_marksman',
    resourceSystem: 'focus',
    coreMechanics: ['stellar_pierce', 'meteor_shot', 'orbit_step']
  },
  {
    id: 'soul_weaver',
    name: 'Soul Weaver',
    description: 'Spirit manipulator who tears souls and stitches vitality.',
    upgradePath: 'soul_sovereign',
    resourceSystem: 'mana',
    coreMechanics: ['soul_rend', 'spirit_mend', 'wraith_shroud']
  },
  {
    id: 'ironclad_engineer',
    name: 'Ironclad Engineer',
    description: 'Gadgeteer who overclocks systems and deploys fortified tech.',
    upgradePath: 'siege_machinist',
    resourceSystem: 'focus',
    coreMechanics: ['overclock', 'deployables', 'reinforce_plating']
  },
  {
    id: 'fatebinder',
    name: 'Fatebinder',
    description: 'Weaver of probability who shields through omen and destiny.',
    upgradePath: 'fate_archon',
    resourceSystem: 'mana',
    coreMechanics: ['destiny_cut', 'omen_shield', 'fate_twist']
  },
  {
    id: 'plague_doctor',
    name: 'Plague Doctor',
    description: 'Toxic specialist who spreads miasma and purges ailments.',
    upgradePath: 'pestilent_saint',
    resourceSystem: 'mana',
    coreMechanics: ['virulent_dart', 'antitoxin', 'miasma']
  },
  {
    id: 'mirror_mage',
    name: 'Mirror Mage',
    description: 'Illusionist who refracts damage and shields with prisms.',
    upgradePath: 'prism_archmage',
    resourceSystem: 'mana',
    coreMechanics: ['mirror_shard', 'prism_guard', 'mirror_step']
  },
  {
    id: 'hexblade',
    name: 'Hexblade',
    description: 'Cursed swordsman who binds targets with lingering hexes.',
    upgradePath: 'hex_reaper',
    resourceSystem: 'mana',
    coreMechanics: ['hex_strike', 'wither_hex', 'dark_guard']
  },
  {
    id: 'guardian_martyr',
    name: 'Guardian Martyr',
    description: 'Sacrificial bulwark who trades vitality for overwhelming shields.',
    upgradePath: 'martyr_saint',
    resourceSystem: 'mana',
    coreMechanics: ['sacrificial_aegis', 'vow_of_endurance', 'judgment']
  }
];

/**
 * Get class by ID
 * @param {string} classId - The class ID
 * @returns {object|null} Class definition or null
 */
function getClassById(classId) {
  return classes.find(c => c.id === classId) || null;
}

/**
 * Get classes by resource system
 * @param {string} resourceSystem - The resource system (mana, rage, chi, energy, focus)
 * @returns {Array} Classes using specified resource
 */
function getClassesByResource(resourceSystem) {
  return classes.filter(c => c.resourceSystem === resourceSystem);
}

/**
 * Get classes by upgrade path
 * @param {string} upgradePath - The upgrade path ID
 * @returns {Array} Classes with matching upgrade path
 */
function getClassesByUpgradePath(upgradePath) {
  return classes.filter(c => c.upgradePath === upgradePath);
}

/**
 * Check if class has specific mechanic
 * @param {string} classId - The class ID
 * @param {string} mechanic - The mechanic to check
 * @returns {boolean} True if class has mechanic
 */
function hasClassMechanic(classId, mechanic) {
  const classData = getClassById(classId);
  return classData?.coreMechanics?.includes(mechanic) || false;
}

export function setClasses(nextClasses) {
  if (Array.isArray(nextClasses)) {
    classes = nextClasses;
  }
}
