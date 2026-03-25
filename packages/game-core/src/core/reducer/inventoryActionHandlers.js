import { mergeInventoryItems, toNumber } from "../../utils/shared.js";
import { updatePlayerVitals } from "../PlayerVitals.js";
import { applyAutoTitleUnlocks } from "../../systems/titles/TitleApplication.js";
import { canPurchaseTitle, getTitleById } from "../titleLogic.js";

export function handleInventoryAction(state, action) {
  switch (action.type) {
    case "EQUIP_ITEM": {
      const { slot, item } = action.payload || {};
      if (!state.player || !slot || !item?.id) return state;
      const equipment = { ...(state.player.equipment || {}) };
      const inventory = [...(state.player.inventory || [])];
      const itemIndex = inventory.findIndex((i) => i.id === item.id);
      const availableQuantity =
        itemIndex >= 0 ? toNumber(inventory[itemIndex]?.quantity, 1) : 0;
      if (availableQuantity <= 0) {
        return state;
      }

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

      if (inventory[itemIndex].quantity > 1) {
          inventory[itemIndex] = {
            ...inventory[itemIndex],
            quantity: inventory[itemIndex].quantity - 1,
          };
      } else {
        inventory.splice(itemIndex, 1);
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

    case "UNEQUIP_ITEM": {
      const slot = action.payload?.slot;
      if (!slot || !state.player) return state;
      const equipment = { ...(state.player.equipment || {}) };
      const inventory = [...(state.player.inventory || [])];
      const unequipped = equipment[slot];
      if (!unequipped) return state;

      delete equipment[slot];
      const quantity = toNumber(unequipped.quantity, 1);
      const nextInventory = mergeInventoryItems(inventory, [
        { ...unequipped, quantity },
      ]);

      return {
        ...state,
        player: {
          ...state.player,
          equipment,
          inventory: nextInventory,
        },
      };
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
        if (item.type === "equipment" && item.equipSlot && !equipmentState[item.equipSlot]) {
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

      const pityRare = action.payload?.newPullsSinceRare;
      const pityEpic = action.payload?.newPullsSinceEpic;

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
            ...(pityRare != null ? { gachaPullsSinceRare: pityRare } : {}),
            ...(pityEpic != null ? { gachaPullsSinceEpic: pityEpic } : {}),
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

    default:
      return null;
  }
}
