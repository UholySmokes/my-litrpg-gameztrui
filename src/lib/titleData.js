// =================================================================
// TITLE DATABASE - Titles with secondary and main bonuses
// =================================================================

export const titleDatabase = [
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

/**
 * Get title by ID
 */
export function getTitleById(titleId) {
  return titleDatabase.find(t => t.id === titleId) || null;
}

/**
 * Check if title unlock conditions are met
 */
export function checkTitleUnlockConditions(title, gameState) {
  if (!title.unlockConditions) return true;
  
  const conditions = title.unlockConditions;
  
  // Check level
  if (conditions.level && gameState.player.level < conditions.level) {
    return false;
  }
  
  // Check quest
  if (conditions.quest) {
    const questCompleted = gameState.quests?.completed?.some(q => q.id === conditions.quest);
    if (!questCompleted) {
      return false;
    }
  }
  
  // Check purchase (handled separately in purchase function)
  if (conditions.purchase) {
    // This is checked at purchase time
  }
  
  // Check kill count
  if (conditions.killCount) {
    // Would need to track kills in game state
    // For now, assume not met
    return false;
  }
  
  // Check total gold
  if (conditions.totalGold) {
    // Would need to track total gold earned
    // For now, check current gold
    const totalGold = gameState.player.currency?.goldCoins || 0;
    if (totalGold < conditions.totalGold) {
      return false;
    }
  }
  
  // Check maxed skills
  if (conditions.maxedSkills) {
    const maxedSkills = gameState.player.abilities?.filter(a => a.level >= 10).length || 0;
    if (maxedSkills < conditions.maxedSkills) {
      return false;
    }
  }
  
  // Check kill type
  if (conditions.killType) {
    // Would need to track enemy kills by type
    return false;
  }
  
  // Check gacha pulls
  if (conditions.gachaPulls) {
    // Would need to track gacha pull count
    return false;
  }
  
  return true;
}

/**
 * Get available titles (unlock conditions met)
 */
export function getAvailableTitles(gameState) {
  const unlockedIds = gameState.player.unlockedTitles || [];
  return titleDatabase.filter(title => {
    if (unlockedIds.includes(title.id)) return false; // Already unlocked
    return checkTitleUnlockConditions(title, gameState);
  });
}

/**
 * Get purchasable titles
 */
export function getPurchasableTitles(gameState) {
  return titleDatabase.filter(title => {
    return title.unlockConditions?.purchase && 
           !(gameState.player.unlockedTitles || []).includes(title.id);
  });
}
