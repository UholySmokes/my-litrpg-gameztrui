// =================================================================
// GAME LOGIC HELPER FUNCTIONS
// These functions are pure: they take a state and return a new state.
// They do not modify the original state object.
// =================================================================

import { getItemData } from './gameData';
import { getSkillById } from './skills';
import { createEnemy, getEnemySkillById, calculateEnemyDrops } from './enemyData';

const DEBUG_LOGGING_ENABLED = false;

/**
 * Adds XP to the player and handles level-ups.
 * @param {object} state - The current game state object.
 * @param {number} amount - The amount of XP to add.
 * @returns {object} A new game state object with the updated XP and level.
 */
export function addXp(state, amount) {
    // Create a new state with the added XP
    let newState = {
      ...state,
      player: {
        ...state.player,
        xp: {
          ...state.player.xp,
          current: state.player.xp.current + amount
        }
      }
    };
  
    // Loop to handle multiple level-ups from a single XP gain
    while (newState.player.xp.current >= newState.player.xp.max) {
      newState = levelUp(newState);
    }
  
    return newState;
  }
  
  /**
   * Handles the level-up logic. Resets XP, increases Level, restores resources, and adds free points.
   * NOTE: This function is typically called by addXp(), not directly.
   * @param {object} state - The current game state object (with enough XP to level up).
   * @returns {object} A new game state object with the player leveled up.
   */
  export function levelUp(state) {
    const maxLevel = state.config?.maxLevel ?? state.player.level;
    if (state.player.level >= maxLevel) {
      // Already at or beyond max level; keep XP capped at max.
      return {
        ...state,
        player: {
          ...state.player,
          xp: {
            ...state.player.xp,
            current: Math.min(state.player.xp.current, state.player.xp.max)
          }
        }
      };
    }
    // #region agent log
    if (DEBUG_LOGGING_ENABLED) fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gamelogic.js:43',message:'levelUp entry',data:{currentLevel:state.player.level,justLeveledUp:state.player.justLeveledUp},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    // Calculate overflow XP after leveling up
    const overflowXp = state.player.xp.current - state.player.xp.max;
  
    // Create a new state with all the level-up changes
    const newState = {
      ...state,
      player: {
        ...state.player,
        // 1. Increase Level
        level: state.player.level + 1,
        
        // 2. Reset XP and increase maxXp for the next level
        xp: {
          ...state.player.xp,
          current: overflowXp,
          max: Math.floor(state.player.xp.max * state.config.xpScalingFactor)
        },
  
        // 3. Restore HP and Mana to full
        hp: {
          ...state.player.hp,
          current: state.player.hp.max
        },
        mana: {
          ...state.player.mana,
          current: state.player.mana.max
        },
  
        // 4. Add Free Attribute Points
        attributes: {
          ...state.player.attributes,
          freePoints: state.player.attributes.freePoints + state.config.attributePointsPerLevel
        },
  
        // 5. Set a flag for the UI to display a notification
        justLeveledUp: true
      }
    };
  
    // #region agent log
    if (DEBUG_LOGGING_ENABLED) fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gamelogic.js:79',message:'levelUp exit',data:{newLevel:newState.player.level,justLeveledUp:newState.player.justLeveledUp},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.log(`LEVEL UP! ${newState.player.name} is now level ${newState.player.level}!`);
    return newState;
  }
  
  /**
   * Applies damage to the player. If HP drops to 0 or below, sets the isDead flag.
   * @param {object} state - The current game state object.
   * @param {number} amount - The amount of damage to take.
   * @returns {object} A new game state object with the updated HP.
   */
  export function takeDamage(state, amount) {
    // Calculate new HP, ensuring it doesn't go below 0
    const newHp = Math.max(0, state.player.hp.current - amount);
  
    // Create a new state with the updated HP
    const newState = {
      ...state,
      player: {
        ...state.player,
        hp: {
          ...state.player.hp,
          current: newHp
        },
        // Set a flag if the player has been defeated
        isDead: newHp <= 0
      }
    };
    
    if (newState.player.isDead) {
      console.log(`${newState.player.name} has been defeated!`);
    }
  
    return newState;
  }

  /**
   * Resets the justLeveledUp flag after the UI has displayed the level-up notification.
   * @param {object} state - The current game state object.
   * @returns {object} A new game state object with justLeveledUp set to false.
   */
  export function resetLevelUpFlag(state) {
    return {
      ...state,
      player: {
        ...state.player,
        justLeveledUp: false
      }
    };
  }

  /**
   * Adds an item to the player's inventory.
   * Looks up the item in the gameData database to get full item definition.
   * @param {object} state - The current game state object.
   * @param {object|string} item - The item to add (can be an item object or just an item ID string).
   * @returns {object} A new game state object with the item added to inventory.
   */
  export function addItem(state, item) {
    // If item is just a string ID, look it up in the database
    let itemData;
    if (typeof item === 'string') {
      itemData = getItemData(item);
      if (!itemData) {
        console.warn(`Item "${item}" not found in database. Adding as basic item.`);
        itemData = { id: item, name: item, type: 'misc', quantity: 1 };
      }
    } else {
      // If it's an object, check if we need to enrich it with database data
      itemData = getItemData(item.id) || item;
      // Merge provided data with database data (provided data takes precedence)
      itemData = { ...itemData, ...item };
    }
    
    const inventory = [...state.player.inventory];
    const existingItemIndex = inventory.findIndex(invItem => invItem.id === itemData.id);
    
    if (existingItemIndex >= 0) {
      // Item already exists, increase quantity
      inventory[existingItemIndex] = {
        ...inventory[existingItemIndex],
        quantity: inventory[existingItemIndex].quantity + (itemData.quantity || 1)
      };
    } else {
      // New item, add to inventory with full data from database
      inventory.push({
        ...itemData,
        quantity: itemData.quantity || 1
      });
    }

    return {
      ...state,
      player: {
        ...state.player,
        inventory
      }
    };
  }

  /**
   * Uses a consumable item from inventory and applies its effects
   * @param {object} state - The current game state object
   * @param {string} itemId - The ID of the item to use
   * @returns {object} A new game state object with item consumed and effects applied
   */
  export function useItem(state, itemId) {
    // #region agent log
    if (DEBUG_LOGGING_ENABLED) fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gamelogic.js:188',message:'useItem entry',data:{itemId,inventoryLength:state.player.inventory?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    const inventory = [...state.player.inventory];
    const itemIndex = inventory.findIndex(item => item.id === itemId);
    
    // #region agent log
    if (DEBUG_LOGGING_ENABLED) fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gamelogic.js:190',message:'item search result',data:{itemIndex,itemFound:itemIndex !== -1},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    if (itemIndex === -1) {
      // Item not found in inventory
      return state;
    }
    
    const item = inventory[itemIndex];
    // #region agent log
    if (DEBUG_LOGGING_ENABLED) fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gamelogic.js:197',message:'item found',data:{itemId:item.id,itemType:item.type,quantity:item.quantity},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    const itemData = getItemData(itemId);
    
    // #region agent log
    if (DEBUG_LOGGING_ENABLED) fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gamelogic.js:198',message:'itemData lookup',data:{hasItemData:!!itemData,itemDataType:itemData?.type,isConsumable:itemData?.type === 'consumable'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    if (!itemData || itemData.type !== 'consumable') {
      // Item cannot be used
      return state;
    }
    
    // Start with base state
    let newState = { ...state };
    
    // Apply item effects
    if (itemData.effect) {
      if (itemData.effect.heal) {
        // Heal HP
        const newHp = Math.min(
          state.player.hp.max,
          state.player.hp.current + itemData.effect.heal
        );
        newState = {
          ...newState,
          player: {
            ...newState.player,
            hp: {
              ...newState.player.hp,
              current: newHp
            }
          }
        };
      }
      
      if (itemData.effect.mana) {
        // Restore Mana
        const newMana = Math.min(
          state.player.mana.max,
          state.player.mana.current + itemData.effect.mana
        );
        newState = {
          ...newState,
          player: {
            ...newState.player,
            mana: {
              ...newState.player.mana,
              current: newMana
            }
          }
        };
      }
    }
    
    // Remove item from inventory (or decrease quantity)
    if (item.quantity > 1) {
      inventory[itemIndex] = {
        ...item,
        quantity: item.quantity - 1
      };
    } else {
      inventory.splice(itemIndex, 1);
    }
    
    newState = {
      ...newState,
      player: {
        ...newState.player,
        inventory
      }
    };
    
    return newState;
  }

  /**
   * Moves the player to a new location
   * @param {object} state - The current game state object
   * @param {string} locationId - The ID of the location to move to
   * @returns {object} A new game state object with updated location
   */
  export function moveToLocation(state, locationId) {
    const world = { ...state.world };
    const visitedLocations = [...world.location.visited];
    const currentLocation = world.location.current;
    
    // Don't move if already at target location
    if (currentLocation === locationId) {
      return state;
    }
    
    // Add to visited locations if not already there
    if (!visitedLocations.includes(locationId)) {
      visitedLocations.push(locationId);
      // Award exploration XP for first-time visit
      const explorationXp = state.config?.explorationXpPerNewLocation ?? 0;
      if (explorationXp > 0) {
        world.turnCount = world.turnCount + 0; // no-op, keep structure
        return addXp({
          ...state,
          world: {
            ...world,
            location: {
              ...world.location,
              current: locationId,
              visited: visitedLocations
            },
            turnCount: world.turnCount + 1
          }
        }, explorationXp);
      }
    }
    
    return {
      ...state,
      world: {
        ...world,
        location: {
          ...world.location,
          current: locationId,
          visited: visitedLocations
        },
        turnCount: world.turnCount + 1
      }
    };
  }

  /**
   * Executes an action and returns the result
   * This is the main dispatcher that routes actions to appropriate logic functions
   * @param {object} state - The current game state object
   * @param {object} action - The action object from actionParser
   * @returns {object} Result object with success flag, new state, and description
   */
  export function executeAction(state, action) {
    if (!action || !action.type) {
      return {
        success: false,
        reason: 'Invalid action',
        state: state
      };
    }
    
    let newState = state;
    let description = '';
    const changes = {};
    let incrementsTurn = true;
    
    switch (action.type) {
      case 'use_item':
        const itemBeforeUse = state.player.hp.current;
        newState = useItem(state, action.itemId);
        const itemAfterUse = newState.player.hp.current;
        
        if (itemBeforeUse !== itemAfterUse) {
          description = `Used ${action.itemName || action.itemId}`;
          changes.itemUsed = action.itemName || action.itemId;
          changes.hp = {
            current: newState.player.hp.current,
            max: newState.player.hp.max
          };
        } else {
          return {
            success: false,
            reason: `Could not use ${action.itemName || action.itemId}`,
            state: state
          };
        }
        break;
      
      case 'move':
        if (action.targetLocation) {
          newState = moveToLocation(state, action.targetLocation);
          description = `Moved to ${action.targetLocation}`;
          changes.location = action.targetLocation;
          incrementsTurn = false; // moveToLocation already increments turnCount
        } else {
          return {
            success: false,
            reason: 'No target location specified',
            state: state
          };
        }
        break;
      
      case 'attack':
        // If not already in combat, start combat with a default encounter
        if (!state.combat || state.combat.status !== 'active') {
          const enemyIds = action.enemyIds && action.enemyIds.length > 0 ? action.enemyIds : ['goblin'];
          newState = startCombat(state, enemyIds);
          description = `Engaged combat with ${newState.combat.enemies.map(e => e.name).join(', ')}`;
          changes.combatStarted = true;
        } else {
          const enemyIndex = action.enemyIndex !== undefined ? action.enemyIndex : 0;
          const result = playerAttack(state, enemyIndex, action.skillId || null);
          if (!result.success) {
            return { success: false, reason: result.reason, state: state };
          }
          newState = result.state;
          const targetName = newState.combat.enemies?.[enemyIndex]?.name || 'enemy';
          description = `Attacked ${targetName}`;
          changes.damage = result.damage;
        }
        break;
      
      case 'look':
      case 'inventory':
        // These are read-only actions, no state change
        return {
          success: true,
          description: `Viewed ${action.type}`,
          state: state,
          readOnly: true
        };
      
      case 'status':
        // Status action - display character status
        return {
          success: true,
          description: 'Status displayed',
          state: state,
          readOnly: true,
          showStatus: true // Flag to show status block
        };
      
      case 'narrative':
        // Narrative actions don't change game state
        return {
          success: true,
          description: action.originalInput || 'Explored',
          state: state,
          readOnly: true
        };
      
      default:
        return {
          success: false,
          reason: `Unknown action type: ${action.type}`,
          state: state
        };
    }
    
    // Increment turn count for state-changing actions
    if (!action.readOnly && incrementsTurn) {
      newState = {
        ...newState,
        world: {
          ...newState.world,
          turnCount: newState.world.turnCount + 1
        }
      };
    }
    
    return {
      success: true,
      description: description || 'Action completed',
      state: newState,
      changes: Object.keys(changes).length > 0 ? changes : undefined
    };
  }

  // =================================================================
  // COMBAT SYSTEM FUNCTIONS
  // =================================================================
  
  /**
   * Calculate damage based on attacker stats and defender defense
   * Uses config values from state for all calculations
   * @param {object} attacker - Attacker stats object
   * @param {object} defender - Defender stats object
   * @param {object} skill - Optional skill being used
   * @param {object} config - Game config from state.config
   */
  export function calculateDamage(attacker, defender, skill = null, config = null) {
    const cfg = config || {};
    
    let baseDamage = (attacker.attack ?? cfg.baseAttackDamage ?? 0);
    
    // Apply skill damage multiplier if skill is used
    if (skill && skill.damage) {
      baseDamage = skill.damage.base || baseDamage;
      if (skill.damage.multiplier) {
        baseDamage = Math.floor(baseDamage * skill.damage.multiplier);
      }
    }
    
    // Calculate final damage (reduced by defense using config factor)
    const defense = defender.defense ?? 0;
    const defenseReductionFactor = cfg.defenseReductionFactor ?? 0;

    let finalDamage;
    if (cfg.armorModel === 'dr') {
      const k = cfg.armorDrK ?? 100;
      const maxMitigation = cfg.armorDrMax ?? 0.8;
      const mitigation = Math.min(maxMitigation, defense / (defense + k));
      finalDamage = Math.max(1, Math.floor(baseDamage * (1 - mitigation)));
    } else {
      // flat reduction
      finalDamage = Math.max(1, baseDamage - Math.floor(defense * defenseReductionFactor));
    }
    
    // Critical hit chance (based on luck using config values)
    const luck = attacker.attributes?.luck ?? cfg.baseAttributeValue ?? 0;
    const critChance = luck * (cfg.baseLuckCritChance ?? 0);
    const isCritical = Math.random() < critChance;
    
    return {
      damage: isCritical ? Math.floor(finalDamage * (cfg.criticalHitMultiplier ?? 1)) : finalDamage,
      isCritical
    };
  }
  
  /**
   * Start combat with enemies
   */
  export function startCombat(state, enemyIds) {
    if (!enemyIds || enemyIds.length === 0) {
      return state;
    }
    
    const enemies = enemyIds.map(id => createEnemy(id)).filter(e => e !== null);
    
    if (enemies.length === 0) {
      return state;
    }
    
    return {
      ...state,
      combat: {
        status: 'active',
        turn: 'player',
        enemies: enemies,
        log: [`Combat started! You face ${enemies.map(e => e.name).join(', ')}.`]
      }
    };
  }
  
  /**
   * Player attacks an enemy
   * Uses config values for damage calculation
   */
  export function playerAttack(state, enemyIndex, skillId = null) {
    if (state.combat.status !== 'active') {
      return { success: false, reason: 'Not in combat', state };
    }
    
    if (enemyIndex < 0 || enemyIndex >= state.combat.enemies.length) {
      return { success: false, reason: 'Invalid enemy', state };
    }
    
    const enemy = state.combat.enemies[enemyIndex];
    if (enemy.stats.hp.current <= 0) {
      return { success: false, reason: 'Enemy already defeated', state };
    }
    
    // Get config values (with fallbacks)
    const strToDamageMultiplier = state.config?.strToDamageMultiplier || 2;
    const baseAttributeValue = state.config?.baseAttributeValue || 5;
    
    // Get player stats using config multipliers
    const playerStats = {
      attack: (state.player.attributes?.str || baseAttributeValue) * strToDamageMultiplier + (state.player.equipment?.weapon?.stats?.attack || 0),
      attributes: state.player.attributes
    };
    
    // Calculate damage, passing config for all calculations
    const damageResult = calculateDamage(
      playerStats,
      enemy.stats,
      skillId ? getSkillById(skillId) : null,
      state.config
    );
    
    // Apply damage
    const newEnemyHp = Math.max(0, enemy.stats.hp.current - damageResult.damage);
    const newEnemies = [...state.combat.enemies];
    newEnemies[enemyIndex] = {
      ...enemy,
      stats: {
        ...enemy.stats,
        hp: { ...enemy.stats.hp, current: newEnemyHp }
      }
    };
    
    // Update combat log
    const critText = damageResult.isCritical ? ' (CRITICAL!)' : '';
    const newLog = [...state.combat.log, 
      `You attack ${enemy.name} for ${damageResult.damage} damage${critText}!`
    ];
    
    let newState = {
      ...state,
      combat: {
        ...state.combat,
        enemies: newEnemies,
        log: newLog,
        turn: 'enemy'
      }
    };
    
    // Check if enemy is defeated
    if (newEnemyHp <= 0) {
      newState = handleEnemyDefeat(newState, enemyIndex);
    }
    
    return { success: true, damage: damageResult.damage, state: newState };
  }
  
  /**
   * Enemy attacks player
   */
  export function enemyAttack(state, enemyIndex) {
    if (state.combat.status !== 'active') {
      return state;
    }
    
    if (enemyIndex < 0 || enemyIndex >= state.combat.enemies.length) {
      return state;
    }
    
    const enemy = state.combat.enemies[enemyIndex];
    if (enemy.stats.hp.current <= 0) {
      return state;
    }
    
    // Simple AI: use random skill or basic attack
    const availableSkills = enemy.skills.filter(skillId => {
      const skill = getEnemySkillById(skillId);
      if (!skill) return false;
      const cooldown = enemy.skillCooldowns?.[skillId] || 0;
      return cooldown <= 0 && (!skill.manaCost || enemy.stats.mana.current >= skill.manaCost);
    });
    
    let skill = null;
    if (availableSkills.length > 0 && Math.random() < 0.5) {
      const skillId = availableSkills[Math.floor(Math.random() * availableSkills.length)];
      skill = getEnemySkillById(skillId);
      
      // Update cooldowns and mana
      const newEnemies = [...state.combat.enemies];
      newEnemies[enemyIndex] = {
        ...enemy,
        stats: {
          ...enemy.stats,
          mana: {
            ...enemy.stats.mana,
            current: enemy.stats.mana.current - (skill.manaCost || 0)
          }
        },
        skillCooldowns: {
          ...enemy.skillCooldowns,
          [skillId]: skill.cooldown || 0
        }
      };
      
      // Update state with new enemy
      state = {
        ...state,
        combat: {
          ...state.combat,
          enemies: newEnemies
        }
      };
    }
    
    // Calculate damage using config values
    const baseAttributeValue = state.config?.baseAttributeValue || 5;
    const playerDefense = (state.player.attributes?.str || baseAttributeValue) + (state.player.equipment?.armor?.stats?.defense || 0);
    const playerStats = { defense: playerDefense };
    const damageResult = calculateDamage(enemy.stats, playerStats, skill, state.config);
    
    // Apply damage to player
    const newHp = Math.max(0, state.player.hp.current - damageResult.damage);
    const critText = damageResult.isCritical ? ' (CRITICAL!)' : '';
    const skillText = skill ? ` using ${skill.name}` : '';
    
    const newLog = [...state.combat.log, 
      `${enemy.name} attacks you${skillText} for ${damageResult.damage} damage${critText}!`
    ];
    
    return takeDamage({
      ...state,
      combat: {
        ...state.combat,
        log: newLog
      }
    }, damageResult.damage);
  }
  
  /**
   * Process all enemy turns
   */
  export function processEnemyTurns(state) {
    // #region agent log
    if (DEBUG_LOGGING_ENABLED) fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gamelogic.js:624',message:'processEnemyTurns entry',data:{combatStatus:state.combat?.status,combatTurn:state.combat?.turn,enemiesCount:state.combat?.enemies?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    if (state.combat.status !== 'active' || state.combat.turn !== 'enemy') {
      // #region agent log
      if (DEBUG_LOGGING_ENABLED) fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gamelogic.js:625',message:'processEnemyTurns early return',data:{combatStatus:state.combat?.status,combatTurn:state.combat?.turn},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      return state;
    }
    
    let newState = state;
    
    // Process each alive enemy
    state.combat.enemies.forEach((enemy, index) => {
      if (enemy.stats.hp.current > 0) {
        // #region agent log
        if (DEBUG_LOGGING_ENABLED) fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gamelogic.js:633',message:'enemy attack before',data:{enemyIndex:index,combatStatus:newState.combat?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        newState = enemyAttack(newState, index);
        // #region agent log
        if (DEBUG_LOGGING_ENABLED) fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gamelogic.js:634',message:'enemy attack after',data:{enemyIndex:index,combatStatus:newState.combat?.status,playerIsDead:newState.player.isDead},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        
        // Update cooldowns
        const updatedEnemy = newState.combat.enemies[index];
        if (updatedEnemy && updatedEnemy.skillCooldowns) {
          const newCooldowns = {};
          Object.keys(updatedEnemy.skillCooldowns).forEach(skillId => {
            if (updatedEnemy.skillCooldowns[skillId] > 0) {
              newCooldowns[skillId] = updatedEnemy.skillCooldowns[skillId] - 1;
            }
          });
          
          const newEnemies = [...newState.combat.enemies];
          newEnemies[index] = {
            ...updatedEnemy,
            skillCooldowns: newCooldowns
          };
          
          newState = {
            ...newState,
            combat: {
              ...newState.combat,
              enemies: newEnemies
            }
          };
        }
      }
    });
    
    // Check if player is dead
    if (newState.player.isDead) {
      // #region agent log
      if (DEBUG_LOGGING_ENABLED) fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gamelogic.js:664',message:'player dead, ending combat',data:{combatStatus:newState.combat?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      return endCombat(newState, 'defeat');
    }
    
    // Switch back to player turn
    // #region agent log
    if (DEBUG_LOGGING_ENABLED) fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gamelogic.js:669',message:'switching to player turn',data:{combatStatus:newState.combat?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    return {
      ...newState,
      combat: {
        ...newState.combat,
        turn: 'player'
      }
    };
  }
  
  /**
   * Handle enemy defeat
   */
  export function handleEnemyDefeat(state, enemyIndex) {
    const enemy = state.combat.enemies[enemyIndex];
    const drops = calculateEnemyDrops(enemy);
    
    // Add drops to player
    let newState = state;
    
    // Add gold
    if (drops.gold > 0) {
      newState = {
        ...newState,
        player: {
          ...newState.player,
          currency: {
            ...newState.player.currency,
            goldCoins: (newState.player.currency?.goldCoins || 0) + drops.gold
          }
        }
      };
    }
    
    // Add items
    drops.items.forEach(item => {
      newState = addItem(newState, item);
    });
    
    // Add XP
    // Use Level-Delta logic to calculate actual XP gained
    const xpGained = calculateGainedXP(state.player.level, enemy.level, drops.xp, state.config);
    newState = addXp(newState, xpGained);
    
    // Remove enemy from combat
    const newEnemies = newState.combat.enemies.filter((_, idx) => idx !== enemyIndex);
    
    const newLog = [...newState.combat.log, 
      `${enemy.name} defeated! Gained ${xpGained} XP (Base: ${drops.xp}), ${drops.gold} gold, and ${drops.items.length} item(s).`
    ];
    
    newState = {
      ...newState,
      combat: {
        ...newState.combat,
        enemies: newEnemies,
        log: newLog
      }
    };
    
    // Check if all enemies defeated
    if (newEnemies.length === 0 || newEnemies.every(e => e.stats.hp.current <= 0)) {
      return endCombat(newState, 'victory');
    }
    
    return newState;
  }
  
  /**
   * End combat
   */
  export function endCombat(state, result) {
    const newLog = [...state.combat.log];
    
    if (result === 'victory') {
      newLog.push('Victory! All enemies defeated!');
    } else if (result === 'defeat') {
      newLog.push('Defeat! You have been knocked unconscious.');
    } else if (result === 'escape') {
      newLog.push('You successfully escaped from combat!');
    }
    
    return {
      ...state,
      combat: {
        status: result === 'victory' ? 'victory' : result === 'defeat' ? 'defeat' : 'inactive',
        turn: 'player',
        enemies: [],
        log: newLog
      }
    };
  }
  
  /**
   * Escape from combat
   * Uses config values for escape chance calculation
   */
  export function escapeCombat(state) {
    if (state.combat.status !== 'active') {
      return { success: false, reason: 'Not in combat', state };
    }
    
    // Get config values (with fallbacks for safety)
    const baseEscapeChance = state.config?.baseEscapeChance || 0.3;
    const agilityEscapeBonus = state.config?.agilityEscapeBonus || 0.01;
    const baseAttributeValue = state.config?.baseAttributeValue || 5;
    
    // Escape chance based on agility using config values
    const agility = state.player.attributes?.agi || baseAttributeValue;
    const escapeChance = baseEscapeChance + (agility * agilityEscapeBonus);
    const escaped = Math.random() < escapeChance;
    
    if (escaped) {
      return { 
        success: true, 
        state: endCombat(state, 'escape') 
      };
    } else {
      const newLog = [...state.combat.log, 'Escape attempt failed!'];
      return {
        success: false,
        reason: 'Escape failed',
        state: {
          ...state,
          combat: {
            ...state.combat,
            log: newLog,
            turn: 'enemy'
          }
        }
      };
    }
  }
  
  // =================================================================
  // EXAMPLE USAGE (commented out - uncomment and import initialgamestate to test)
  // =================================================================
  
  // import { initialgamestate } from './gamestate';
  // 
  // // Assume 'initialGameState' is the object from your initialgamestate.txt file
  // let currentState = JSON.parse(JSON.stringify(initialgamestate)); // Create a deep copy to simulate a real game state
  // 
  // console.log("--- Initial State ---");
  // console.log(`Level: ${currentState.player.level}, XP: ${currentState.player.xp.current}/${currentState.player.xp.max}, HP: ${currentState.player.hp.current}`);
  // 
  // // --- Test addXp and levelUp ---
  // console.log("\n--- Gaining 150 XP (should trigger a level-up) ---");
  // currentState = addXp(currentState, 150);
  // console.log(`Level: ${currentState.player.level}, XP: ${currentState.player.xp.current}/${currentState.player.xp.max}, HP: ${currentState.player.hp.current}, Free Points: ${currentState.player.attributes.freePoints}`);
  // console.log(`Just Leveled Up Flag: ${currentState.player.justLeveledUp}`);
  // 
  // // --- Test takeDamage ---
  // console.log("\n--- Taking 120 damage ---");
  // currentState = takeDamage(currentState, 120);
  // console.log(`HP: ${currentState.player.hp.current}`);
  // console.log(`Is Dead Flag: ${currentState.player.isDead}`);
  // 
  // // --- Test multiple level-ups ---
  // console.log("\n--- Gaining 300 XP (should trigger two level-ups) ---");
  // currentState = addXp(currentState, 300);
  // console.log(`Level: ${currentState.player.level}, XP: ${currentState.player.xp.current}/${currentState.player.xp.max}, HP: ${currentState.player.hp.current}, Free Points: ${currentState.player.attributes.freePoints}`);