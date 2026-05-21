// =================================================================
// ACTION PARSER
// Parses user text input to determine game actions
// =================================================================

import {getAccessibleLocationIds, resolveTravelLocationId,} from "../world/WorldDataRegistry.js";

/**
 * Parses user input text and extracts game actions
 * @param {string} userInput - The raw text input from the user
 * @param {object} gameState - Current game state (for context)
 * @returns {object} Structured action object
 */
export function parseAction(userInput, gameState) {
  if (!userInput || typeof userInput !== "string") {
    return { type: "invalid", reason: "No input provided" };
  }

  const input = userInput.trim().toLowerCase();

  // Remove common filler words
  const cleanedInput = input
    .replace(
      /\b(please|can you|would you|could you|i want to|i'd like to)\b/gi,
      "",
    )
    .trim();

  const loreAction = parseLoreAction(cleanedInput, userInput);
  if (loreAction) return loreAction;

  const magicAction = parseMagic(cleanedInput);
  if (magicAction) return magicAction;

  const devourerAction = parseDevourer(cleanedInput);
  if (devourerAction) return devourerAction;

  const restAction = parseRest(cleanedInput);
  if (restAction) return restAction;


  // Parse different action types
  const useSkillAction = parseUseSkill(cleanedInput, gameState);
  if (useSkillAction) return useSkillAction;

  const useItemAction = parseUseItem(cleanedInput, gameState);
  if (useItemAction) return useItemAction;

  const escapeAction = parseEscape(cleanedInput);
  if (escapeAction) return escapeAction;

  const moveAction = parseMove(cleanedInput, gameState);
  if (moveAction) return moveAction;

  const attackAction = parseAttack(cleanedInput);
  if (attackAction) return attackAction;

  const inventoryAction = parseInventory(cleanedInput);
  if (inventoryAction) return inventoryAction;

  const statusAction = parseStatus(cleanedInput);
  if (statusAction) return statusAction;

  const lookAction = parseLook(cleanedInput);
  if (lookAction) return lookAction;

  const dialogueAction = parseDialogue(cleanedInput, userInput, gameState);
  if (dialogueAction) return dialogueAction;

  // Default: treat as narrative/exploration
  return {
    type: "narrative",
    originalInput: userInput,
    description: `Player said: "${userInput}"`,
  };
}

function parseLoreAction(input, rawInput) {
  const originalInput = typeof rawInput === "string" ? rawInput.trim() : input;

  if (/^(check|review|inspect|read)\s+(my\s+)?oath$/i.test(input)) {
    return {
      type: "lore_inspect",
      topic: "oath",
      originalInput,
    };
  }

  if (/^(review|check|inspect|read)\s+(my\s+)?ledger\s+debt$/i.test(input)) {
    return {
      type: "lore_inspect",
      topic: "ledger_debt",
      originalInput,
    };
  }

  if (/^(sense|inspect|read|scan)\s+(the\s+)?leyline\s+pressure$/i.test(input)) {
    return {
      type: "lore_inspect",
      topic: "leyline_pressure",
      originalInput,
    };
  }

  if (/^(inspect|check|review|read)\s+(the\s+)?system\s+label$/i.test(input)) {
    return {
      type: "lore_inspect",
      topic: "system_label",
      originalInput,
    };
  }

  if (/^(ask|question|talk)\s+(about\s+)?faction\s+terms$/i.test(input)) {
    return {
      type: "lore_inspect",
      topic: "faction_terms",
      originalInput,
    };
  }

  if (/^(check|inspect|review)\s+(soulcoin|soulcoins)$/i.test(input)) {
    return {
      type: "lore_inspect",
      topic: "soulcoin",
      originalInput,
    };
  }

  if (/^(study|inspect|review)\s+(the\s+)?voidspark$/i.test(input)) {
    return {
      type: "lore_inspect",
      topic: "voidspark",
      originalInput,
    };
  }

  return null;
}

function parseDialogue(input, rawInput, gameState) {
  const sceneMemory =
    gameState?.narrative && typeof gameState.narrative === "object"
      ? gameState.narrative.sceneMemory
      : null;
  const presentEntities = [
    ...(Array.isArray(sceneMemory?.presentEntities) ? sceneMemory.presentEntities : []),
    ...(Array.isArray(sceneMemory?.familiarEntities) ? sceneMemory.familiarEntities : []),
    ...(Array.isArray(sceneMemory?.partyEntities) ? sceneMemory.partyEntities : []),
  ]
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);

  const trimmedRaw = typeof rawInput === "string" ? rawInput.trim() : "";
  if (!trimmedRaw) return null;

  const hasSpeechVerb = /(^["'])|\b(say|ask|tell|speak|talk|shout|whisper|yell|reply|negotiate|question)\b/i.test(
    input,
  );
  const hasQuestionShape =
    /\?\s*$/.test(trimmedRaw) ||
    /^(who|what|when|where|why|how|can|could|would|will|do|does|did|are|is)\b/i.test(
      input,
    );

  if (!hasSpeechVerb && !(hasQuestionShape && presentEntities.length > 0)) {
    return null;
  }

  const explicitTargetMatch = trimmedRaw.match(
    /\b(?:ask|tell|say to|speak to|talk to|reply to|shout at|whisper to|question)\s+(?:the\s+)?([^,.!?]+?)(?:\s+about\b|\s*[:,?.!]|$)/i,
  );
  const explicitAboutMatch = trimmedRaw.match(/\babout\s+([^?.!]+)$/i);
  const quotedSpeechMatch = trimmedRaw.match(/["']([^"']+)["']/);
  const targetLabel = explicitTargetMatch?.[1]?.trim() || null;
  const spokenText = quotedSpeechMatch?.[1]?.trim() || trimmedRaw;
  const topic = explicitAboutMatch?.[1]?.trim() || null;
  const intent = hasQuestionShape || /\b(ask|question)\b/i.test(input) ? "question" : "speech";

  return {
    type: "dialogue",
    intent,
    originalInput: trimmedRaw,
    spokenText,
    targetLabel,
    topic,
    description:
      intent === "question"
        ? `Player asked: "${trimmedRaw}"`
        : `Player said: "${trimmedRaw}"`,
  };
}

function parseMagic(input) {
  const essenceCap =
    "(fire|water|earth|air|lightning|shadow|light|life|creation|destruction|space|time)";
  const essence =
    "(?:fire|water|earth|air|lightning|shadow|light|life|creation|destruction|space|time)";
  const form =
    "(bolt|pulse|lance|cone|wall|shield|vortex|veil|lattice)";

  {
    const match = input.match(
      new RegExp(
        `^prepare\\s+((?:${essence})(?:\\+(?:${essence}))*)\\s+${form}(?:\\s+(\\d+))?$`,
        "i",
      ),
    );
    if (match) {
      const essences = match[1]
        .toLowerCase()
        .split("+")
        .map((part) => part.trim())
        .filter(Boolean);
      return {
        type: "magic_prepare",
        essences,
        essence: essences[0] || null,
        form: match[2].toLowerCase(),
        scale: match[3] ? Number(match[3]) : 1,
        intent: "prepare",
        originalInput: input,
      };
    }
  }

  {
    const match = input.match(
      new RegExp(
        `^cast\\s+((?:${essence})(?:\\+(?:${essence}))*)\\s+${form}(?:\\s+(\\d+))?$`,
        "i",
      ),
    );
    if (match) {
      const essences = match[1]
        .toLowerCase()
        .split("+")
        .map((part) => part.trim())
        .filter(Boolean);
      return {
        type: "magic_cast",
        essences,
        essence: essences[0] || null,
        form: match[2].toLowerCase(),
        scale: match[3] ? Number(match[3]) : 1,
        intent: "cast",
        originalInput: input,
      };
    }
  }

  if (/^(cast|release)(?:\s+prepared(?:\s+(?:magic|weave))?)?$/i.test(input)) {
    return {
      type: "magic_cast",
      usePrepared: true,
      intent: "cast",
      originalInput: input,
    };
  }

  if (/^(sustain|maintain)(?:\s+working)?$/i.test(input)) {
    return {
      type: "magic_sustain",
      originalInput: input,
    };
  }

  {
    const match = input.match(
      new RegExp(
        `^(stabilize|recover(?:\\s+magic)?)(?:\\s+(open|guarded|focused))?(?:\\s+${essenceCap})?$`,
        "i",
      ),
    );
    if (match) {
      return {
        type: "magic_stabilize",
        stance: match[2]?.toLowerCase() || null,
        essence: match[3]?.toLowerCase() || null,
        originalInput: input,
      };
    }
  }

  {
    const match = input.match(
      new RegExp(`^(sense|meditate)(?:\\s+${essenceCap})?$`, "i"),
    );
    if (match) {
      return {
        type: "magic_sense",
        essence: match[2]?.toLowerCase() || null,
        originalInput: input,
      };
    }
  }

  {
    const match = input.match(
      new RegExp(`^attune\\s+(open|guarded|focused)(?:\\s+${essenceCap})?$`, "i"),
    );
    if (match) {
      return {
        type: "magic_attune",
        stance: match[1].toLowerCase(),
        essence: match[2]?.toLowerCase() || null,
        originalInput: input,
      };
    }
  }

  {
    const match = input.match(
      new RegExp(`^draw\\s+${essenceCap}(?:\\s+(\\d+))?$`, "i"),
    );
    if (match) {
      return {
        type: "magic_draw",
        essence: match[1].toLowerCase(),
        amount: match[2] ? Number(match[2]) : null,
        originalInput: input,
      };
    }
  }

  {
    const match = input.match(
      new RegExp(
        `^refine\\s+${essenceCap}(?:\\s+([a-z_-]+))?\\s+(\\d+)$`,
        "i",
      ),
    );
    if (match) {
      return {
        type: "magic_refine",
        essence: match[1].toLowerCase(),
        method: match[2]?.toLowerCase() || null,
        amount: Number(match[3]),
        originalInput: input,
      };
    }
  }

  {
    const match = input.match(
      new RegExp(
        `^compress\\s+${essenceCap}(?:\\s+([a-z_-]+))?\\s+(?:tier\\s*)?(0|1|2|3)$`,
        "i",
      ),
    );
    if (match) {
      return {
        type: "magic_compress",
        essence: match[1].toLowerCase(),
        method: match[2]?.toLowerCase() || null,
        tier: Number(match[3]),
        originalInput: input,
      };
    }
  }

  {
    const match = input.match(
      new RegExp(
        `^(shape|form)\\s+${essenceCap}\\s+([a-z_-]+)(?:\\s+(\\d+))?$`,
        "i",
      ),
    );
    if (match) {
      return {
        type: "magic_shape",
        essence: match[2].toLowerCase(),
        form: match[3].toLowerCase(),
        amount: match[4] ? Number(match[4]) : null,
        originalInput: input,
      };
    }
  }

  {
    const match = input.match(
      new RegExp(
        `^weave\\s+((?:${essence})(?:\\+(?:${essence}))+)\\s+([a-z_-]+)$`,
        "i",
      ),
    );
    if (match) {
      return {
        type: "magic_weave",
        essences: match[1]
          .toLowerCase()
          .split("+")
          .map((s) => s.trim())
          .filter(Boolean),
        pattern: match[2].toLowerCase(),
        originalInput: input,
      };
    }
  }

  {
    const match = input.match(
      /^anchor\s+(self|area|item)(?:\s+([a-z0-9_-]+))?$/i,
    );
    if (match) {
      return {
        type: "magic_anchor",
        kind: match[1].toLowerCase(),
        itemId: match[2] || null,
        originalInput: input,
      };
    }
  }

  {
    const match = input.match(
      new RegExp(`^purge\\s+(all|${essence})(?:\\s+(\\d+))?$`, "i"),
    );
    if (match) {
      const target = match[1].toLowerCase();
      return {
        type: "magic_purge",
        essence: target === "all" ? null : target,
        amount: match[2] ? Number(match[2]) : null,
        originalInput: input,
      };
    }
  }

  if (/^anchor(?:\s+(?:to\s+)?(?:stabilize|calm)\s+resonance)?$/i.test(input)) {
    return {
      type: "magic_anchor",
      kind: "self",
      itemId: null,
      originalInput: input,
    };
  }

  if (/^sense(?:\s+ambient(?:\s+essence)?)?$/i.test(input)) {
    return {
      type: "magic_sense",
      essence: null,
      originalInput: input,
    };
  }

  if (/^purge(?:\s+(?:contamination|tainted reserves))$/i.test(input)) {
    return {
      type: "magic_purge",
      essence: null,
      amount: null,
      originalInput: input,
    };
  }

  if (/^(release|cast)(?:\s+prepared(?:\s+(?:magic|weave))?)?$/i.test(input)) {
    return { type: "magic_release", originalInput: input };
  }

  {
    const match = input.match(
      /^(?:i\s+)?(?:(?:try|attempt)(?:ing)?\s+to\s+)?study\s+(.+)$/i,
    );
    if (match) {
      return {
        type: "magic_study",
        target: match[1].trim().toLowerCase(),
        originalInput: input,
      };
    }
  }

  {
    const match = input.match(/^journal(?:\s+note\s+"([^"]+)")?$/i);
    if (match) {
      return {
        type: "magic_journal",
        note: match[1] || null,
        originalInput: input,
      };
    }
  }

  return null;
}

function parseDevourer(input) {
  {
    const match = input.match(/^digest(?:\s+(.+))?$/i);
    if (match) {
      return {
        type: "devourer_digest",
        target: match[1] ? match[1].trim().toLowerCase() : null,
        originalInput: input,
      };
    }
  }

  {
    const match = input.match(/^refine\s+([a-z0-9_-]+)(?:\s+sample)?$/i);
    if (match) {
      return {
        type: "devourer_refine",
        target: match[1].trim().toLowerCase(),
        originalInput: input,
      };
    }
  }

  if (/^purge\s+taint$/i.test(input)) {
    return {
      type: "devourer_purge",
      originalInput: input,
    };
  }

  return null;
}

function parseUseSkill(input, gameState) {
  const combat = gameState?.combat || {};
  const inCombat = combat.status === "active" || combat.inCombat === true;
  if (!inCombat) return null;

  const rawPlayerSkills = [];
  if (Array.isArray(gameState?.player?.activeSkills)) {
    rawPlayerSkills.push(...gameState.player.activeSkills);
  }
  if (Array.isArray(gameState?.player?.skills?.active)) {
    rawPlayerSkills.push(...gameState.player.skills.active);
  }

  const playerSkills = rawPlayerSkills
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === "string") {
        return { id: entry, name: entry };
      }
      if (typeof entry === "object") {
        const id =
          typeof entry.id === "string" && entry.id
            ? entry.id
            : typeof entry.skillId === "string" && entry.skillId
              ? entry.skillId
              : null;
        const name =
          typeof entry.name === "string" && entry.name
            ? entry.name
            : typeof entry.label === "string" && entry.label
              ? entry.label
              : id;
        return id ? { id, name } : null;
      }
      return null;
    })
    .filter(Boolean);

  if (/^(use|cast)\s+skill$/i.test(input)) {
    const defaultSkill = playerSkills[0];
    if (!defaultSkill?.id) return null;
    return {
      type: "attack",
      skillId: defaultSkill.id,
      target: "nearest enemy",
      originalInput: input,
    };
  }

  const namedSkillMatch = input.match(/^(use|cast)\s+(.+)$/i);
  if (!namedSkillMatch) return null;

  const requested = String(namedSkillMatch[2] || "").trim().toLowerCase();
  if (!requested || requested === "item" || requested === "potion") {
    return null;
  }

  const matchedSkill = playerSkills.find((skill) => {
    const id = String(skill.id || "").toLowerCase();
    const name = String(skill.name || "").toLowerCase();
    return requested === id || requested === name || name.includes(requested);
  });

  if (!matchedSkill?.id) return null;

  return {
    type: "attack",
    skillId: matchedSkill.id,
    target: "nearest enemy",
    originalInput: input,
  };
}

function parseEscape(input) {
  if (/^(escape|attempt escape|flee|retreat)$/i.test(input)) {
    return {
      type: "escape",
      originalInput: input,
    };
  }
  return null;
}

/**
 * Parses "use item" or "drink potion" type actions
 */
function parseUseItem(input, gameState) {
  const usePatterns = [
    /^(use|drink|eat|consume|take|apply)\s+(.+)$/i,
    /^(.+)\s+(potion|pills|elixir|food|item)$/i,
  ];

  for (const pattern of usePatterns) {
    const match = input.match(pattern);
    if (match) {
      const itemName = match[2] || match[1];
      const item = findItemByName(itemName, gameState);

      if (item) {
        return {
          type: "use_item",
          itemId: item.id,
          itemName: item.name,
          originalInput: input,
        };
      }
    }
  }

  // Check for direct item mentions
  const inventory = gameState?.player?.inventory || [];
  for (const item of inventory) {
    if (!item?.name) continue;
    const itemNameLower = item.name.toLowerCase();
    if (
      input.includes(itemNameLower) &&
      (input.includes("use") ||
        input.includes("drink") ||
        input.includes("eat"))
    ) {
      return {
        type: "use_item",
        itemId: item.id,
        itemName: item.name,
        originalInput: input,
      };
    }
  }

  return null;
}

/**
 * Parses movement actions
 */
function parseMove(input, gameState) {
  const directionOnlyMatch = input.match(
    /^(north|south|east|west|up|down|forward|backward|left|right)$/i,
  );
  if (directionOnlyMatch) {
    const direction = directionOnlyMatch[1].toLowerCase();
    return {
      type: "move",
      direction,
      targetLocation: direction,
      originalInput: input,
    };
  }

  const directionalVerbMatch = input.match(
    /^(go|move|walk|run|travel|head|proceed)\s+(north|south|east|west|up|down|forward|backward|left|right)$/i,
  );
  if (directionalVerbMatch) {
    const direction = directionalVerbMatch[2].toLowerCase();
    return {
      type: "move",
      direction,
      targetLocation: direction,
      originalInput: input,
    };
  }

  const targetedMoveMatch = input.match(
    /^(go|move|walk|run|travel|head|proceed)(?:\s+to)?\s+(.+)$/i,
  );
  if (!targetedMoveMatch) {
    return null;
  }

  const candidate = String(targetedMoveMatch[2] || "")
    .replace(/^the\s+/i, "")
    .trim();
  if (!candidate) {
    return null;
  }

  const allowedLocationIds = getAccessibleLocationIds(gameState);
  const resolvedTargetId = resolveTravelLocationId(candidate, { allowedLocationIds });
  if (!resolvedTargetId) {
    return null;
  }

  return {
    type: "move",
    targetLocation: candidate,
    originalInput: input,
  };
}

/**
 * Parses attack/combat actions
 */
function parseAttack(input) {
  const attackPatterns = [
    /^(attack|hit|strike|fight|combat|engage)\s+(.+)$/i,
    /^(attack|hit|strike|fight|combat|engage)$/i,
  ];

  for (const pattern of attackPatterns) {
    const match = input.match(pattern);
    if (match) {
      const target = match[2] || "nearest enemy";

      return {
        type: "attack",
        target: target,
        originalInput: input,
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
    /^(look|examine|inspect|check|observe|view|see|around)$/i,
  ];

  for (const pattern of lookPatterns) {
    const match = input.match(pattern);
    if (match) {
      return {
        type: "look",
        target: match[2] || "around",
        originalInput: input,
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
    /^(show|check|list|open)\s+(inventory|inv|items|bag|backpack|equipment|gear)$/i,
  ];

  for (const pattern of inventoryPatterns) {
    if (pattern.test(input)) {
      return {
        type: "inventory",
        originalInput: input,
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
    /^(show|check|view|display)\s+((?:system\s+)?status|stats|stat|character|char|info|information)$/i,
  ];

  for (const pattern of statusPatterns) {
    if (pattern.test(input)) {
      return {
        type: "status",
        originalInput: input,
      };
    }
  }

  return null;
}

/**
 * Parses rest/recovery actions
 */
function parseRest(input) {
  const restPatterns = [
    /^(rest|sleep|camp|recover)$/i,
    /^(take a rest|take rest|make camp)$/i,
  ];

  for (const pattern of restPatterns) {
    if (pattern.test(input)) {
      return {
        type: "rest",
        originalInput: input,
      };
    }
  }

  return null;
}

/**
 * Finds an item in inventory by name (fuzzy matching)
 */
function findItemByName(itemName, gameState) {
  const inventory = gameState?.player?.inventory || [];
  if (!itemName || typeof itemName !== "string") return null;
  const searchTerm = itemName.toLowerCase().trim();

  // Exact match
  for (const item of inventory) {
    if (!item?.name) continue;
    if (item.name.toLowerCase() === searchTerm) {
      return item;
    }
  }

  // Partial match
  for (const item of inventory) {
    if (!item?.name) continue;
    const itemNameLower = item.name.toLowerCase();
    if (
      itemNameLower.includes(searchTerm) ||
      searchTerm.includes(itemNameLower)
    ) {
      return item;
    }
  }

  // Check for common item name variations
  const itemVariations = {
    potion: ["health potion", "minor health potion", "major health potion"],
    sword: ["rusty sword", "iron sword", "steel sword"],
    armor: ["leather armor", "chain mail"],
  };

  for (const [key, variations] of Object.entries(itemVariations)) {
    if (searchTerm.includes(key)) {
      for (const variation of variations) {
        for (const item of inventory) {
          if (!item?.name) continue;
          if (item.name.toLowerCase().includes(variation)) {
            return item;
          }
        }
      }
    }
  }

  return null;
}
