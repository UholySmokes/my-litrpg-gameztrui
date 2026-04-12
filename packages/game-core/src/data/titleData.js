// =================================================================
// TITLE DATABASE - Titles with secondary and main bonuses
// =================================================================

import { hasQuestOrOnboardingMilestoneCompleted } from "../world/OpeningTutorialBundleRegistry.js";

export let titleDatabase = [
  {
    id: 'novice_adventurer',
    name: 'Novice Adventurer',
    description: 'Your first steps into adventure',
    secondaryBonus: { str: 1, agi: 1 },
    mainBonus: { str: 3, agi: 3, luck: 2 },
    unlockConditions: {
      level: 1,
      quest: null,
      purchase: { goldCoins: 0 } // Free, unlocked at start
    }
  },
  {
    id: 'monster_slayer',
    name: 'Monster Slayer',
    description: 'Defeated 10 monsters',
    secondaryBonus: { attack: 2 },
    mainBonus: { attack: 5, str: 2 },
    unlockConditions: {
      level: 3,
      quest: null,
      killCount: 10
    }
  },
  {
    id: 'wealthy_merchant',
    name: 'Wealthy Merchant',
    description: 'Accumulated 1000 gold coins',
    secondaryBonus: { luck: 1 },
    mainBonus: { luck: 3, goldGain: 0.1 }, // 10% more gold
    unlockConditions: {
      level: 5,
      quest: null,
      totalGold: 1000
    }
  },
  {
    id: 'skill_master',
    name: 'Skill Master',
    description: 'Mastered 5 skills to level 10',
    secondaryBonus: { int: 1 },
    mainBonus: { int: 3, skillPower: 0.15 }, // 15% more skill power
    unlockConditions: {
      level: 10,
      quest: null,
      maxedSkills: 5
    }
  },
  {
    id: 'dragon_slayer',
    name: 'Dragon Slayer',
    description: 'Defeated a dragon',
    secondaryBonus: { str: 2, int: 2 },
    mainBonus: { str: 5, int: 5, attack: 10, magic: 10 },
    unlockConditions: {
      level: 8,
      quest: null,
      killType: 'dragon_whelp'
    }
  },
  {
    id: 'legendary_hero',
    name: 'Legendary Hero',
    description: 'Reached level 20',
    secondaryBonus: { str: 2, agi: 2, int: 2, will: 2 },
    mainBonus: { str: 10, agi: 10, int: 10, will: 10, allStats: 5 },
    unlockConditions: {
      level: 20,
      quest: null,
      purchase: null
    }
  },
  {
    id: 'shop_owner',
    name: 'Shop Owner',
    description: 'Purchased from shop',
    secondaryBonus: { cha: 1 },
    mainBonus: { cha: 3, shopDiscount: 0.1 }, // 10% shop discount
    unlockConditions: {
      level: 1,
      quest: null,
      purchase: { goldCoins: 500 }
    }
  },
  {
    id: 'gacha_master',
    name: 'Gacha Master',
    description: 'Performed 100 gacha pulls',
    secondaryBonus: { luck: 2 },
    mainBonus: { luck: 5, gachaBonus: 0.05 }, // 5% better gacha rates
    unlockConditions: {
      level: 1,
      quest: null,
      purchase: { soulpoints: 1000 },
      gachaPulls: 100
    }
  }
];

export function setTitleDatabase(nextTitles) {
  if (Array.isArray(nextTitles)) {
    titleDatabase = nextTitles;
  }
}

/**
 * Get title by ID
 */
export function getTitleById(titleId) {
  return titleDatabase.find(t => t.id === titleId) || null;
}

function getUnlockedTitleIds(gameState) {
  const unlocked = Array.isArray(gameState?.player?.unlockedTitles)
    ? gameState.player.unlockedTitles
    : Array.isArray(gameState?.player?.titles)
      ? gameState.player.titles
      : [];

  return new Set(
    unlocked.filter((id) => typeof id === 'string' && id.trim()),
  );
}

function getProgress(gameState) {
  const player = gameState?.player || {};
  const progress =
    player.progress &&
    typeof player.progress === 'object' &&
    !Array.isArray(player.progress)
      ? player.progress
      : {};
  const killsByEnemyId =
    progress.killsByEnemyId &&
    typeof progress.killsByEnemyId === 'object' &&
    !Array.isArray(progress.killsByEnemyId)
      ? progress.killsByEnemyId
      : {};

  return { ...progress, killsByEnemyId };
}

/**
 * Check if title unlock conditions are met
 */
function checkTitleUnlockConditions(title, gameState) {
  if (!title?.unlockConditions) return true;

  const conditions = title.unlockConditions;
  const state = gameState || {};
  const player = state.player || {};
  const progress = getProgress(state);
  const abilities = Array.isArray(player.abilities) ? player.abilities : [];

  if (conditions.level && (player.level || 1) < conditions.level) {
    return false;
  }

  if (conditions.quest) {
    if (!hasQuestOrOnboardingMilestoneCompleted(state, conditions.quest)) {
      return false;
    }
  }

  if (conditions.killCount && (progress.totalKills || 0) < conditions.killCount) {
    return false;
  }

  if (conditions.totalGold && (progress.totalGoldEarned || 0) < conditions.totalGold) {
    return false;
  }

  if (conditions.maxedSkills) {
    const maxedSkills = abilities.filter((ability) => (ability?.level || 0) >= 10).length;
    if (maxedSkills < conditions.maxedSkills) {
      return false;
    }
  }

  if (conditions.killType) {
    if ((progress.killsByEnemyId?.[conditions.killType] || 0) <= 0) {
      return false;
    }
  }

  if (conditions.gachaPulls && (progress.gachaPulls || 0) < conditions.gachaPulls) {
    return false;
  }

  return true;
}

/**
 * Get available titles (unlock conditions met)
 */
export function getAvailableTitles(gameState) {
  const unlockedIds = getUnlockedTitleIds(gameState);
  return titleDatabase.filter(title => {
    if (!title?.id) return false;
    if (unlockedIds.has(title.id)) return false;
    return checkTitleUnlockConditions(title, gameState);
  });
}

/**
 * Get purchasable titles
 */
export function getPurchasableTitles(gameState) {
  const unlockedIds = getUnlockedTitleIds(gameState);
  return titleDatabase.filter(title => {
    if (!title?.unlockConditions?.purchase) return false;
    if (unlockedIds.has(title.id)) return false;
    return checkTitleUnlockConditions(title, gameState);
  });
}

const additionalTitleSpecs = [
  ['wayfarer', 'Wayfarer', 'Learned to move with purpose', { agi: 1 }, { agi: 2, luck: 1 }, { level: 2, quest: null, purchase: null }],
  ['trailblazer', 'Trailblazer', 'Opened a path where none was obvious', { agi: 1, str: 1 }, { allStats: 1 }, { level: 4, quest: null, purchase: null }],
  ['sanctum_runner', 'Sanctum Runner', 'Kept pace even inside dangerous ruins', { will: 1 }, { will: 2, agi: 1 }, { level: 6, quest: null, purchase: null }],
  ['spire_breaker', 'Spire Breaker', 'Survived the first real tower of danger', { attack: 1 }, { attack: 4, str: 1 }, { level: 8, quest: null, purchase: null }],
  ['field_commander', 'Field Commander', 'Led allies through a difficult front', { str: 1, will: 1 }, { attack: 4, will: 2 }, { level: 12, quest: null, purchase: null }],
  ['arcane_explorer', 'Arcane Explorer', 'Read strange currents without flinching', { int: 1 }, { int: 3, magic: 2 }, { level: 14, quest: null, purchase: null }],
  ['battle_hardened', 'Battle Hardened', 'Carried the scars of many victories', { str: 1 }, { attack: 5, str: 1 }, { level: 18, quest: null, purchase: null }],
  ['seasoned_adventurer', 'Seasoned Adventurer', 'The road finally felt familiar', { luck: 1 }, { luck: 2, agi: 1 }, { level: 24, quest: null, purchase: null }],
  ['frontier_warden', 'Frontier Warden', 'Kept the outer routes safe', { will: 1, str: 1 }, { allStats: 1 }, { level: 30, quest: null, purchase: null }],
  ['realm_vanguard', 'Realm Vanguard', 'Held the line when the world needed it most', { str: 1, will: 1 }, { attack: 6, magic: 2 }, { level: 40, quest: null, purchase: null }],
  ['mythic_stride', 'Mythic Stride', 'Walked into danger and made it look routine', { agi: 1, luck: 1 }, { allStats: 2, luck: 2 }, { level: 60, quest: null, purchase: null }],
  ['first_stride_veteran', 'First Stride Veteran', 'Remembered the first lesson and kept moving', { agi: 1 }, { agi: 2, luck: 1 }, { level: 1, quest: 'bq_first_stride', purchase: null }],
  ['systems_student', 'Systems Student', 'Learned to trust the interface', { int: 1 }, { int: 2, will: 1 }, { level: 1, quest: 'bq_system_basics', purchase: null }],
  ['first_blood_pledge', 'First Blood Pledge', 'Proved you could win your first fight', { attack: 1 }, { attack: 3, str: 1 }, { level: 1, quest: 'bq_first_conflict', purchase: null }],
  ['arcane_awakened', 'Arcane Awakened', 'Heard the hidden current in the air', { int: 1, will: 1 }, { magic: 3, int: 1 }, { level: 1, quest: 'bq_arcane_awareness', purchase: null }],
  ['spire_rescuer', 'Spire Rescuer', 'Kept the leylines from collapsing', { attack: 1, int: 1 }, { attack: 4, magic: 2 }, { level: 20, quest: 'mq_fallen_spire', purchase: null }],
  ['market_infiltrator', 'Market Infiltrator', 'Learned how to move unseen among crowds', { agi: 1, luck: 1 }, { agi: 2, luck: 2 }, { level: 18, quest: 'mq_whisper_market', purchase: null }],
  ['ember_bloom_ally', 'Ember Bloom Ally', 'Earned the trust of burning roots', { will: 1 }, { will: 2, int: 1 }, { level: 22, quest: 'mq_ember_bloom', purchase: null }],
  ['starforge_vanguard', 'Starforge Vanguard', 'Held the line at the skydock forge', { str: 1, attack: 1 }, { attack: 5, magic: 2 }, { level: 25, quest: 'mq_starforge_siege', purchase: null }],
  ['caldera_conductor', 'Caldera Conductor', 'Brought the volcanic rupture under control', { attack: 1, luck: 1 }, { attack: 4, will: 1 }, { level: 28, quest: 'mq_ashen_caldera', purchase: null }],
  ['veil_archivist', 'Veil Archivist', 'Walked away with knowledge that should not exist', { int: 2 }, { int: 4, luck: 1 }, { level: 32, quest: 'mq_veil_archive', purchase: null }],
  ['collarbreaker', 'Collarbreaker', 'Freed yourself from the chokehold of fear', { str: 1 }, { str: 3, will: 1 }, { level: 1, quest: null, killCount: 10 }],
  ['blooded_veteran', 'Blooded Veteran', 'Earned a reputation through relentless fighting', { attack: 1 }, { attack: 4, str: 1 }, { level: 1, quest: null, killCount: 25 }],
  ['battlefield_scholar', 'Battlefield Scholar', 'Learned enough from combat to start teaching it', { int: 1 }, { int: 3, attack: 2 }, { level: 1, quest: null, killCount: 50 }],
  ['war_path_master', 'War Path Master', 'Moved through conflict like it was a map', { str: 1, will: 1 }, { attack: 5, will: 2 }, { level: 1, quest: null, killCount: 75 }],
  ['siege_breaker', 'Siege Breaker', 'Crushed a hundred hostile fronts', { attack: 2 }, { attack: 6, str: 2 }, { level: 1, quest: null, killCount: 100 }],
  ['monster_archivist', 'Monster Archivist', 'Collected a record of your earliest victories', { luck: 1 }, { luck: 2, int: 1 }, { level: 1, quest: null, killCount: 150 }],
  ['reality_bruiser', 'Reality Bruiser', 'Hit so many things the world started to complain', { str: 2 }, { attack: 7, str: 2 }, { level: 1, quest: null, killCount: 200 }],
  ['eternal_warsmith', 'Eternal Warsmith', 'Built a life around the rhythm of battle', { will: 2 }, { attack: 8, allStats: 1 }, { level: 1, quest: null, killCount: 300 }],
  ['goblin_culler', 'Goblin Culler', 'Made goblins think twice about the road ahead', { luck: 1 }, { attack: 2, luck: 1 }, { level: 1, quest: null, killType: 'goblin' }],
  ['bone_breaker', 'Bone Breaker', 'Learned that skeletons stay down when you are thorough', { will: 1 }, { attack: 2, will: 1 }, { level: 1, quest: null, killType: 'skeleton' }],
  ['beast_tamer', 'Beast Tamer', 'Earned the respect of the wild by winning against it', { agi: 1 }, { agi: 2, luck: 1 }, { level: 1, quest: null, killType: 'wolf' }],
  ['dragon_hunter', 'Dragon Hunter', 'Survived the kind of fight people write songs about', { attack: 2, int: 1 }, { attack: 6, magic: 3 }, { level: 1, quest: null, killType: 'dragon_whelp' }],
  ['shadow_bane', 'Shadow Bane', 'Refused to let darkness define the battlefield', { will: 1, int: 1 }, { magic: 4, will: 2 }, { level: 1, quest: null, killType: 'shadow_knight' }],
  ['void_hunter', 'Void Hunter', 'Looked into the abyss and came back with trophies', { allStats: 1 }, { attack: 6, magic: 4 }, { level: 1, quest: null, killType: 'void_titan' }],
  ['coin_counter', 'Coin Counter', 'Kept every earned coin accounted for', { luck: 1 }, { goldGain: 0.05, luck: 1 }, { level: 1, quest: null, totalGold: 1000 }],
  ['guild_financier', 'Guild Financier', 'Proved you could build wealth without wasting it', { luck: 1 }, { goldGain: 0.08, cha: 1 }, { level: 1, quest: null, totalGold: 5000 }],
  ['treasury_magnate', 'Treasury Magnate', 'Stockpiled enough wealth to fund expeditions', { cha: 1 }, { goldGain: 0.12, luck: 1 }, { level: 1, quest: null, totalGold: 10000 }],
  ['golden_emperor', 'Golden Emperor', 'Your treasury became a kingdom of its own', { allStats: 1 }, { goldGain: 0.15, allStats: 1 }, { level: 1, quest: null, totalGold: 25000 }],
  ['lucky_draw', 'Lucky Draw', 'Your first streak of fortune caught attention', { luck: 1 }, { gachaBonus: 0.01, luck: 1 }, { level: 1, quest: null, gachaPulls: 10 }],
  ['rare_hunter', 'Rare Hunter', 'Learned how to wait for the good pulls', { luck: 1 }, { gachaBonus: 0.02, int: 1 }, { level: 1, quest: null, gachaPulls: 50 }],
  ['pity_bender', 'Pity Bender', 'You and the fortune engine now have a complicated relationship', { luck: 2 }, { gachaBonus: 0.03, luck: 1 }, { level: 1, quest: null, gachaPulls: 100 }],
  ['fortune_vessel', 'Fortune Vessel', 'Luck seems to prefer resting in your hands', { luck: 2 }, { gachaBonus: 0.05, allStats: 1 }, { level: 1, quest: null, gachaPulls: 250 }],
  ['apprentice_savant', 'Apprentice Savant', 'Proved you could master several skills at once', { int: 1 }, { skillPower: 0.03, int: 2 }, { level: 1, quest: null, maxedSkills: 3 }],
  ['master_of_forms', 'Master of Forms', 'Reached the point where skill mastery became a habit', { will: 1 }, { skillPower: 0.05, allStats: 1 }, { level: 1, quest: null, maxedSkills: 5 }],
];

const additionalTitles = additionalTitleSpecs.map(([id, name, description, secondaryBonus, mainBonus, unlockConditions]) => ({
  id,
  name,
  description,
  secondaryBonus,
  mainBonus,
  unlockConditions,
}));

titleDatabase.push(...additionalTitles);
