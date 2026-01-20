import { DataRegistry } from "../data/DataRegistry.js";
import { performLevelUp } from "../systems/leveling/LevelingManager.js";
import { toCanonicalAttributeKey } from "../constants/attributes.js";
import { calculateMaxHp, calculateMaxMana } from "../utils/AttributeMath.js";
import { normalizeGameState } from "./StateNormalizer.js";
import {
  getEffectiveAttributes,
  getAutoUnlockableTitles,
  canPurchaseTitle,
  getTitleById,
  getTitleBonuses,
} from "../systems/titles/TitleSystem.js";
import {
  playerAttack,
  startCombat,
  escapeCombat,
  processEnemyTurns,
} from "../systems/combat/CombatSystem.js";

const ensureCombatStructure = (state) =>
  state.combat || {
    status: "inactive",
    turn: "player",
    enemies: [],
    log: [],
  };

const toNumber = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const mergeResources = (existing = {}, rewardResources = {}) => {
  const next = { ...existing };
  Object.entries(rewardResources).forEach(([key, delta]) => {
    if (!Number.isFinite(delta)) return;
    next[key] = toNumber(next[key], 0) + delta;
  });
  return next;
};

const updatePlayerVitals = (player, config, attributesOverride) => {
  const effectiveAttributes = getEffectiveAttributes(
    player,
    config,
    attributesOverride,
  );
  const nextHpMax = calculateMaxHp(effectiveAttributes);
  const nextManaMax = calculateMaxMana(effectiveAttributes);

  const rawHp = player?.hp;
  const hp =
    rawHp && typeof rawHp === "object" && rawHp !== null
      ? rawHp
      : { current: toNumber(rawHp, nextHpMax), max: nextHpMax };
  const rawMana = player?.mana;
  const mana =
    rawMana && typeof rawMana === "object" && rawMana !== null
      ? rawMana
      : { current: toNumber(rawMana, nextManaMax), max: nextManaMax };

  return {
    ...player,
    hp: {
      ...hp,
      max: nextHpMax,
      current: clamp(toNumber(hp.current, nextHpMax), 0, nextHpMax),
    },
    mana: {
      ...mana,
      max: nextManaMax,
      current: clamp(toNumber(mana.current, nextManaMax), 0, nextManaMax),
    },
  };
};

const appendSystemMessages = (state, messages = []) => {
  if (!Array.isArray(messages) || messages.length === 0) return state;
  const timestamp = Date.now();
  const entries = messages
    .filter((message) => typeof message === "string" && message.trim())
    .map((text, idx) => ({
      type: "system",
      text,
      timestamp: timestamp + idx,
    }));

  if (entries.length === 0) return state;
  return {
    ...state,
    chatLog: [...(state.chatLog || []), ...entries].slice(-100),
  };
};

const applyAutoTitleUnlocks = (state, { announce = false } = {}) => {
  if (!state?.player) return state;
  const unlockable = getAutoUnlockableTitles(state);
  if (!Array.isArray(unlockable) || unlockable.length === 0) return state;

  const unlocked = new Set(
    (state.player.unlockedTitles || state.player.titles || []).filter(
      (id) => typeof id === "string" && id,
    ),
  );

  const newlyUnlocked = [];
  unlockable.forEach((title) => {
    if (!title?.id) return;
    if (unlocked.has(title.id)) return;
    unlocked.add(title.id);
    newlyUnlocked.push(title);
  });

  if (newlyUnlocked.length === 0) return state;

  const unlockedTitles = Array.from(unlocked);
  const player = updatePlayerVitals(
    {
      ...state.player,
      unlockedTitles,
      titles: unlockedTitles,
    },
    state.config,
  );

  const nextState = {
    ...state,
    player,
  };

  if (!announce) return nextState;
  return appendSystemMessages(
    nextState,
    newlyUnlocked.map((title) => `Unlocked title: ${title.name}`),
  );
};

const mergeInventoryItems = (inventory = [], rewardItems = []) => {
  if (!Array.isArray(rewardItems) || rewardItems.length === 0) return inventory;
  const next = [...inventory];
  rewardItems.forEach((item) => {
    if (!item?.id) return;
    const quantity = toNumber(item.quantity, 1);
    const index = next.findIndex((entry) => entry.id === item.id);
    if (index >= 0) {
      const existing = next[index];
      next[index] = {
        ...existing,
        quantity: toNumber(existing?.quantity, 0) + quantity,
      };
    } else {
      next.push({ ...item, quantity });
    }
  });
  return next;
};

const applyQuestRewards = (state, reward) => {
  if (!reward || typeof reward !== "object") return state;

  let playerChanged = false;
  let worldChanged = false;
  const player = { ...(state.player || {}) };
  const world = { ...(state.world || {}) };

  if (Number.isFinite(reward.xp) && reward.xp !== 0) {
    if (
      player.xp &&
      typeof player.xp === "object" &&
      player.xp !== null &&
      "current" in player.xp
    ) {
      player.xp = {
        ...player.xp,
        current: toNumber(player.xp.current, 0) + reward.xp,
      };
    } else {
      player.xp = toNumber(player.xp, 0) + reward.xp;
    }
    playerChanged = true;
  }

  if (reward.resources && typeof reward.resources === "object") {
    player.resources = mergeResources(player.resources, reward.resources);
    playerChanged = true;
  }

  if (Number.isFinite(reward.gold) && reward.gold !== 0) {
    const rawDelta = toNumber(reward.gold, 0);
    const titleBonuses = getTitleBonuses(player);
    const goldGain = Number.isFinite(titleBonuses.goldGain)
      ? titleBonuses.goldGain
      : 0;
    const delta =
      rawDelta > 0 ? Math.ceil(rawDelta * (1 + goldGain)) : rawDelta;
    const currentGold = toNumber(player.currency?.goldCoins ?? player.gold, 0);
    const nextGold = currentGold + delta;

    player.gold = nextGold;
    player.currency = {
      ...(player.currency || {}),
      goldCoins: nextGold,
      soulpoints: toNumber(player.currency?.soulpoints ?? player.soulpoints, 0),
    };
    if (player.soulpoints !== undefined) {
      player.soulpoints = toNumber(player.soulpoints, 0);
    }

    const progress =
      player.progress && typeof player.progress === "object"
        ? player.progress
        : {};
    const earnedDelta = Math.max(0, delta);
    player.progress = {
      ...progress,
      totalGoldEarned: toNumber(progress.totalGoldEarned, 0) + earnedDelta,
    };

    playerChanged = true;
  }

  if (Number.isFinite(reward.soulpoints) && reward.soulpoints !== 0) {
    const delta = toNumber(reward.soulpoints, 0);
    const currentSoul = toNumber(
      player.currency?.soulpoints ?? player.soulpoints,
      0,
    );
    const nextSoul = currentSoul + delta;

    player.soulpoints = nextSoul;
    player.currency = {
      ...(player.currency || {}),
      goldCoins: toNumber(player.currency?.goldCoins ?? player.gold, 0),
      soulpoints: nextSoul,
    };

    playerChanged = true;
  }

  if (Array.isArray(reward.items) && reward.items.length > 0) {
    player.inventory = mergeInventoryItems(player.inventory, reward.items);
    playerChanged = true;
  }

  if (Array.isArray(reward.titles) && reward.titles.length > 0) {
    const unlockedIds = player.unlockedTitles || player.titles || [];
    const titleSet = new Set(unlockedIds);
    reward.titles.forEach((title) => {
      if (typeof title === "string" && title) {
        titleSet.add(title);
      }
    });
    const unlockedTitles = Array.from(titleSet);
    player.unlockedTitles = unlockedTitles;
    player.titles = unlockedTitles;
    Object.assign(player, updatePlayerVitals(player, state.config));
    playerChanged = true;
  }

  if (reward.flags && typeof reward.flags === "object") {
    world.flags = {
      ...(world.flags || {}),
      ...reward.flags,
    };
    worldChanged = true;
  }

  if (!playerChanged && !worldChanged) {
    return state;
  }

  return {
    ...state,
    ...(playerChanged ? { player } : {}),
    ...(worldChanged ? { world } : {}),
  };
};

const gameReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_STATE":
      return normalizeGameState({
        ...state,
        ...(action.payload || {}),
      });

    case "SYNC_STATE":
      return normalizeGameState(action.payload || state);

    case "SET_STATE":
      if (typeof action.payload === "function") {
        return normalizeGameState(action.payload(state));
      }
      return normalizeGameState(action.payload);

    case "ADD_SYSTEM_MESSAGE": {
      const { message, type = "system" } = action.payload;
      return {
        ...state,
        chatLog: [
          ...(state.chatLog || []),
          {
            type,
            text: message,
            timestamp: Date.now(),
          },
        ].slice(-100), // Keep last 100 messages
      };
    }

    case "ADD_XP": {
      const currentXp = toNumber(
        state.player.xp?.current ?? state.player.xp,
        0,
      );
      const nextXp = currentXp + action.payload;

      return {
        ...state,
        player: {
          ...state.player,
          xp:
            typeof state.player.xp === "object" && state.player.xp !== null
              ? { ...state.player.xp, current: nextXp }
              : nextXp,
        },
      };
    }

    case "COMPLETE_QUEST":
      if (!action.payload?.questId) {
        return state;
      }
      const { questId, reward, questMeta } = action.payload;
      const nextState = {
        ...state,
        quests: {
          ...state.quests,
          active: state.quests.active.filter((q) => q.id !== questId),
          completed: [
            ...state.quests.completed,
            {
              id: questId,
              date: Date.now(),
              ...(questMeta ? { meta: questMeta } : {}),
            },
          ],
        },
      };
      return applyAutoTitleUnlocks(applyQuestRewards(nextState, reward), {
        announce: true,
      });

    case "UPDATE_RESOURCES": {
      const current = state.player.resources || {};
      const updated = { ...current };

      Object.entries(action.payload).forEach(([key, delta]) => {
        if (!Number.isFinite(delta)) return;
        const currentValue = toNumber(current[key], 0);
        const maxValue = 100; // Default max; could be per-resource config later
        updated[key] = clamp(currentValue + delta, 0, maxValue);
      });

      return {
        ...state,
        player: {
          ...state.player,
          resources: updated,
        },
      };
    }

    case "CONSUME_ITEM": {
      const { itemId } = action.payload;
      const item = DataRegistry.getItemById(itemId);

      if (!item || item.type !== "consumable") {
        return state; // Silent fail: validation happens in dispatcher
      }

      const inventory = [...(state.player.inventory || [])];
      const itemIndex = inventory.findIndex((i) => i.id === itemId);

      if (itemIndex === -1) {
        return state; // Item not in inventory
      }

      let newState = { ...state };

      // Apply effects with clamping
      if (item.effect?.heal) {
        const currentHp = state.player.hp?.current ?? 0;
        const maxHp = state.player.hp?.max ?? 100;
        const newHp = Math.min(maxHp, currentHp + item.effect.heal);
        newState.player = {
          ...newState.player,
          hp: { ...newState.player.hp, current: newHp },
        };
      }

      if (item.effect?.mana) {
        const currentMana = state.player.mana?.current ?? 0;
        const maxMana = state.player.mana?.max ?? 100;
        const newMana = Math.min(maxMana, currentMana + item.effect.mana);
        newState.player = {
          ...newState.player,
          mana: { ...newState.player.mana, current: newMana },
        };
      }

      // Remove item from inventory
      if (inventory[itemIndex].quantity > 1) {
        inventory[itemIndex] = {
          ...inventory[itemIndex],
          quantity: inventory[itemIndex].quantity - 1,
        };
      } else {
        inventory.splice(itemIndex, 1);
      }

      newState.player.inventory = inventory;
      return newState;
    }

    case "EQUIP_ITEM": {
      const { slot, item } = action.payload;
      const equipment = { ...(state.player.equipment || {}) };
      const inventory = [...(state.player.inventory || [])];

      // Remove equipped item and return to inventory
      if (equipment[slot]) {
        const prevItem = equipment[slot];
        const existingIndex = inventory.findIndex((i) => i.id === prevItem.id);
        if (existingIndex >= 0) {
          inventory[existingIndex] = {
            ...inventory[existingIndex],
            quantity: (inventory[existingIndex].quantity || 1) + 1,
          };
        } else {
          inventory.push({ ...prevItem, quantity: 1 });
        }
      }

      // Remove new item from inventory
      const itemIndex = inventory.findIndex((i) => i.id === item.id);
      if (itemIndex >= 0) {
        if (inventory[itemIndex].quantity > 1) {
          inventory[itemIndex] = {
            ...inventory[itemIndex],
            quantity: inventory[itemIndex].quantity - 1,
          };
        } else {
          inventory.splice(itemIndex, 1);
        }
      }

      equipment[slot] = item;

      return {
        ...state,
        player: {
          ...state.player,
          equipment,
          inventory,
        },
      };
    }

    case "PLAYER_ATTACK": {
      const enemyIndex = action.payload?.enemyIndex ?? 0;
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") {
        return state;
      }
      const result = playerAttack(
        { ...state, combat: combatState },
        enemyIndex,
      );
      if (!result.success) {
        return state;
      }
      return applyAutoTitleUnlocks(processEnemyTurns(result.state), {
        announce: true,
      });
    }

    case "PLAYER_USE_SKILL": {
      const { skillId, enemyIndex = 0 } = action.payload || {};
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") {
        return state;
      }
      const result = playerAttack(
        { ...state, combat: combatState },
        enemyIndex,
        skillId,
      );
      if (!result.success) {
        return state;
      }
      return applyAutoTitleUnlocks(processEnemyTurns(result.state), {
        announce: true,
      });
    }

    case "PLAYER_ESCAPE": {
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") {
        return state;
      }
      const result = escapeCombat({ ...state, combat: combatState });
      return result.state || state;
    }

    case "PLAYER_START_COMBAT": {
      const enemyIds = action.payload?.enemyIds || [];
      return startCombat(state, enemyIds);
    }

    case "CRAFT_ITEM": {
      const recipe = action.payload?.recipe;
      if (!recipe || !state.player) return state;
      const inventory = [...(state.player.inventory || [])];
      const hasIngredients = recipe.ingredients.every((ingredient) => {
        const existing = inventory.find((item) => item.id === ingredient.id);
        return existing && existing.quantity >= ingredient.count;
      });
      if (!hasIngredients) return state;

      recipe.ingredients.forEach((ingredient) => {
        const index = inventory.findIndex((item) => item.id === ingredient.id);
        if (index === -1) return;
        const item = inventory[index];
        if (item.quantity > ingredient.count) {
          inventory[index] = {
            ...item,
            quantity: item.quantity - ingredient.count,
          };
        } else {
          inventory.splice(index, 1);
        }
      });

      const craftedItem = {
        ...recipe.result,
        quantity: toNumber(recipe.result?.count ?? recipe.result?.quantity, 1),
      };
      const nextInventory = mergeInventoryItems(inventory, [craftedItem]);

      return {
        ...state,
        player: {
          ...state.player,
          inventory: nextInventory,
        },
      };
    }

    case "AWARD_PROFESSION_XP": {
      const { professionId, xp = 0 } = action.payload || {};
      if (!state.player || !professionId || xp <= 0) return state;
      const professions = { ...(state.player.professions || {}) };
      const currentXp = professions[professionId]?.xp || 0;
      professions[professionId] = {
        xp: currentXp + xp,
      };
      return {
        ...state,
        player: {
          ...state.player,
          professions,
        },
      };
    }

    case "GACHA_PULL": {
      const { cost = {}, results = [] } = action.payload || {};
      const goldCost = toNumber(cost.goldCoins, 0);
      const soulCost = toNumber(cost.soulpoints, 0);

      const currentGold = toNumber(state.player.gold, 0);
      const currentSoul = toNumber(
        state.player.currency?.soulpoints ?? state.player.soulpoints,
        0,
      );

      if (currentGold < goldCost || currentSoul < soulCost) {
        return state;
      }

      const rewardItems = results
        .filter((reward) => reward && (reward.itemData || reward.id))
        .map((reward) => {
          const base = reward.itemData || {};
          const id = base.id || reward.id;
          return {
            ...base,
            id,
            name: reward.name || base.name || id,
            quantity: 1,
            rarity: reward.rarity || base.rarity,
          };
        });

      const equipmentState = { ...(state.player.equipment || {}) };
      const inventoryRewards = [];

      rewardItems.forEach((item) => {
        if (
          item.type === "equipment" &&
          item.equipSlot &&
          !equipmentState[item.equipSlot]
        ) {
          equipmentState[item.equipSlot] = item;
        } else {
          inventoryRewards.push(item);
        }
      });

      const nextInventory = mergeInventoryItems(
        state.player.inventory,
        inventoryRewards,
      );

      const nextSoul = currentSoul - soulCost;
      const progress =
        state.player.progress && typeof state.player.progress === "object"
          ? state.player.progress
          : {};
      const pullCount = Array.isArray(results) ? results.length : 0;

      const nextState = {
        ...state,
        player: {
          ...state.player,
          gold: currentGold - goldCost,
          soulpoints:
            state.player.soulpoints !== undefined
              ? toNumber(state.player.soulpoints, 0) - soulCost
              : state.player.soulpoints,
          currency: {
            ...(state.player.currency || {}),
            goldCoins: currentGold - goldCost,
            soulpoints: nextSoul,
          },
          inventory: nextInventory,
          equipment: equipmentState,
          progress: {
            ...progress,
            gachaPulls: toNumber(progress.gachaPulls, 0) + pullCount,
          },
        },
      };

      return applyAutoTitleUnlocks(nextState, { announce: true });
    }

    case "PURCHASE_TITLE": {
      const titleId = action.payload?.titleId;
      if (!titleId || !state.player) return state;

      const title = getTitleById(titleId);
      if (!title) return state;
      if (!canPurchaseTitle(title, state)) return state;

      const unlocked = new Set(
        (state.player.unlockedTitles || state.player.titles || []).filter(
          (id) => typeof id === "string" && id,
        ),
      );

      const cost = title.unlockConditions.purchase || {};
      const goldCost = toNumber(cost.goldCoins, 0);
      const soulCost = toNumber(cost.soulpoints, 0);

      const currentGold = toNumber(
        state.player.currency?.goldCoins ?? state.player.gold,
        0,
      );
      const currentSoul = toNumber(
        state.player.currency?.soulpoints ?? state.player.soulpoints,
        0,
      );

      if (currentGold < goldCost || currentSoul < soulCost) {
        return state;
      }

      const nextGold = currentGold - goldCost;
      const nextSoul = currentSoul - soulCost;
      unlocked.add(titleId);
      const unlockedTitles = Array.from(unlocked);

      const updatedPlayer = updatePlayerVitals(
        {
          ...state.player,
          gold: nextGold,
          soulpoints: nextSoul,
          currency: {
            ...(state.player.currency || {}),
            goldCoins: nextGold,
            soulpoints: nextSoul,
          },
          titles: unlockedTitles,
          unlockedTitles,
        },
        state.config,
      );

      return {
        ...state,
        player: updatedPlayer,
      };
    }

    case "EQUIP_TITLE": {
      const titleId = action.payload?.titleId;
      if (!titleId || !state.player) return state;

      const unlockedIds = state.player.unlockedTitles || state.player.titles || [];
      if (!Array.isArray(unlockedIds) || !unlockedIds.includes(titleId)) {
        return state;
      }

      return {
        ...state,
        player: updatePlayerVitals(
          {
            ...state.player,
            equippedTitle: titleId,
          },
          state.config,
        ),
      };
    }

    case "UNEQUIP_TITLE": {
      if (!state.player?.equippedTitle) return state;
      return {
        ...state,
        player: updatePlayerVitals(
          {
            ...state.player,
            equippedTitle: null,
          },
          state.config,
        ),
      };
    }

    case "LEVEL_UP": {
      if (!state?.player?.xp) {
        return state;
      }

      let nextState = state;
      let leveledUp = false;

      while (
        nextState.player?.xp?.current >= nextState.player?.xp?.max &&
        nextState.player?.level < (nextState.config?.maxLevel ?? Infinity)
      ) {
        const previousLevel = nextState.player.level;
        nextState = performLevelUp(nextState);
        if (nextState.player.level === previousLevel) {
          break; // Prevent infinite loop if performLevelUp no-ops (e.g., already at cap)
        }
        leveledUp = true;
      }

      return leveledUp
        ? applyAutoTitleUnlocks(nextState, { announce: true })
        : state;
    }

    case "ALLOCATE_ATTRIBUTE_POINT": {
      const attributeKey = toCanonicalAttributeKey(action.payload?.attribute);
      if (!attributeKey) return state;

      const player = state.player || {};
      const attributes = { ...(player.attributes || {}) };
      const freePoints = toNumber(attributes.freePoints, 0);
      if (freePoints <= 0) return state;

      const attributeInvestments = { ...(player.attributeInvestments || {}) };
      attributes[attributeKey] = toNumber(attributes[attributeKey], 0) + 1;
      attributes.freePoints = freePoints - 1;
      attributeInvestments[attributeKey] =
        toNumber(attributeInvestments[attributeKey], 0) + 1;
      return {
        ...state,
        player: updatePlayerVitals(
          {
            ...player,
            attributes,
            attributeInvestments,
          },
          state.config,
          attributes,
        ),
      };
    }

    case "DEALLOCATE_ATTRIBUTE_POINT": {
      const attributeKey = toCanonicalAttributeKey(action.payload?.attribute);
      if (!attributeKey) return state;

      const player = state.player || {};
      const attributes = { ...(player.attributes || {}) };
      const attributeInvestments = { ...(player.attributeInvestments || {}) };
      const invested = toNumber(attributeInvestments[attributeKey], 0);
      if (invested <= 0) return state;

      const currentValue = toNumber(attributes[attributeKey], 0);
      const freePoints = toNumber(attributes.freePoints, 0);

      attributes[attributeKey] = Math.max(0, currentValue - 1);
      attributes.freePoints = freePoints + 1;
      const nextInvested = invested - 1;
      if (nextInvested > 0) {
        attributeInvestments[attributeKey] = nextInvested;
      } else {
        delete attributeInvestments[attributeKey];
      }
      return {
        ...state,
        player: updatePlayerVitals(
          {
            ...player,
            attributes,
            attributeInvestments,
          },
          state.config,
          attributes,
        ),
      };
    }

    default:
      return state;
  }
};

export { gameReducer };
