// =================================================================
// ACTION PARSER
// Parses user text input to determine game actions
// =================================================================

/**
 * Parses user input text and extracts game actions
 * @param {string} userInput - The raw text input from the user
 * @param {object} gameState - Current game state (for context)
 * @returns {object} Structured action object
 */
export function parseAction(userInput, gameState) {
  if (!userInput || typeof userInput !== 'string') {
    return { type: 'invalid', reason: 'No input provided' };
  }

  const input = userInput.trim().toLowerCase();
  
  // Remove common filler words
  const cleanedInput = input
    .replace(/\b(please|can you|would you|could you|i want to|i'd like to)\b/gi, '')
    .trim();

  // Parse different action types
  const useItemAction = parseUseItem(cleanedInput, gameState);
  if (useItemAction) return useItemAction;

  const moveAction = parseMove(cleanedInput, gameState);
  if (moveAction) return moveAction;

  const attackAction = parseAttack(cleanedInput, gameState);
  if (attackAction) return attackAction;

  const lookAction = parseLook(cleanedInput);
  if (lookAction) return lookAction;

  const inventoryAction = parseInventory(cleanedInput);
  if (inventoryAction) return inventoryAction;

  const statusAction = parseStatus(cleanedInput);
  if (statusAction) return statusAction;

  // Default: treat as narrative/exploration
  return {
    type: 'narrative',
    originalInput: userInput,
    description: `Player said: "${userInput}"`
  };
}

/**
 * Parses "use item" or "drink potion" type actions
 */
function parseUseItem(input, gameState) {
  const usePatterns = [
    /^(use|drink|eat|consume|take|apply)\s+(.+)$/i,
    /^(.+)\s+(potion|pills|elixir|food|item)$/i
  ];

  for (const pattern of usePatterns) {
    const match = input.match(pattern);
    if (match) {
      const itemName = match[2] || match[1];
      const item = findItemByName(itemName, gameState);
      
      if (item) {
        return {
          type: 'use_item',
          itemId: item.id,
          itemName: item.name,
          originalInput: input
        };
      }
    }
  }

  // Check for direct item mentions
  const inventory = gameState.player.inventory || [];
  for (const item of inventory) {
    const itemNameLower = item.name.toLowerCase();
    if (input.includes(itemNameLower) && (input.includes('use') || input.includes('drink') || input.includes('eat'))) {
      return {
        type: 'use_item',
        itemId: item.id,
        itemName: item.name,
        originalInput: input
      };
    }
  }

  return null;
}

/**
 * Parses movement actions
 */
function parseMove(input, gameState) {
  const movePatterns = [
    /^(go|move|walk|run|travel|head|proceed)\s+(north|south|east|west|up|down|forward|backward|left|right|to)\s*(.+)?$/i,
    /^(go|move|walk|run|travel|head|proceed)\s+(.+)$/i,
    /^(north|south|east|west|up|down|forward|backward|left|right)$/i
  ];

  for (const pattern of movePatterns) {
    const match = input.match(pattern);
    if (match) {
      const direction = match[2] || match[1];
      const location = match[3] || direction;
      
      return {
        type: 'move',
        direction: direction.toLowerCase(),
        targetLocation: location.toLowerCase(),
        originalInput: input
      };
    }
  }

  // Check for location names in world
  const world = gameState.world || {};
  const visitedLocations = world.location?.visited || [];
  const currentLocation = world.location?.current || '';
  
  for (const location of visitedLocations) {
    if (input.includes(location.toLowerCase()) && (input.includes('go') || input.includes('move') || input.includes('to'))) {
      return {
        type: 'move',
        targetLocation: location,
        originalInput: input
      };
    }
  }

  return null;
}

/**
 * Parses attack/combat actions
 */
function parseAttack(input, gameState) {
  const attackPatterns = [
    /^(attack|hit|strike|fight|combat|engage)\s+(.+)$/i,
    /^(attack|hit|strike|fight|combat|engage)$/i
  ];

  for (const pattern of attackPatterns) {
    const match = input.match(pattern);
    if (match) {
      const target = match[2] || 'nearest enemy';
      
      return {
        type: 'attack',
        target: target,
        originalInput: input
      };
    }
  }

  return null;
}

/**
 * Parses "look" or "examine" actions
 */
function parseLook(input) {
  const lookPatterns = [
    /^(look|examine|inspect|check|observe|view|see)\s+(.+)$/i,
    /^(look|examine|inspect|check|observe|view|see|around)$/i
  ];

  for (const pattern of lookPatterns) {
    const match = input.match(pattern);
    if (match) {
      return {
        type: 'look',
        target: match[2] || 'around',
        originalInput: input
      };
    }
  }

  return null;
}

/**
 * Parses inventory check actions
 */
function parseInventory(input) {
  const inventoryPatterns = [
    /^(inventory|inv|items|bag|backpack|equipment|gear)$/i,
    /^(show|check|list|open)\s+(inventory|inv|items|bag|backpack|equipment|gear)$/i
  ];

  for (const pattern of inventoryPatterns) {
    if (pattern.test(input)) {
      return {
        type: 'inventory',
        originalInput: input
      };
    }
  }

  return null;
}

/**
 * Parses status check actions
 */
function parseStatus(input) {
  const statusPatterns = [
    /^(status|stats|stat|character|char|info|information)$/i,
    /^(show|check|view|display)\s+(status|stats|stat|character|char|info|information)$/i
  ];

  for (const pattern of statusPatterns) {
    if (pattern.test(input)) {
      return {
        type: 'status',
        originalInput: input
      };
    }
  }

  return null;
}

/**
 * Finds an item in inventory by name (fuzzy matching)
 */
function findItemByName(itemName, gameState) {
  const inventory = gameState.player.inventory || [];
  const searchTerm = itemName.toLowerCase().trim();
  
  // Exact match
  for (const item of inventory) {
    if (item.name.toLowerCase() === searchTerm) {
      return item;
    }
  }
  
  // Partial match
  for (const item of inventory) {
    const itemNameLower = item.name.toLowerCase();
    if (itemNameLower.includes(searchTerm) || searchTerm.includes(itemNameLower)) {
      return item;
    }
  }
  
  // Check for common item name variations
  const itemVariations = {
    'potion': ['health potion', 'minor health potion', 'major health potion'],
    'sword': ['rusty sword', 'iron sword', 'steel sword'],
    'armor': ['leather armor', 'chain mail']
  };
  
  for (const [key, variations] of Object.entries(itemVariations)) {
    if (searchTerm.includes(key)) {
      for (const variation of variations) {
        for (const item of inventory) {
          if (item.name.toLowerCase().includes(variation)) {
            return item;
          }
        }
      }
    }
  }
  
  return null;
}
