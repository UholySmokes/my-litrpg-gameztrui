import { useCallback } from "react";
import { gachaPools } from "../../data/gachaData.js";
import { getTitleBonuses } from "../../core/titleLogic.js";
import { mergeInventoryItems } from "../../utils/shared.js";
import { applyShopServicePurchase } from "./shopServiceUtils.js";

const normalizeAttributeLabel = (attributeKey) => {
  if (!attributeKey) return "attribute";
  return attributeKey.charAt(0).toUpperCase() + attributeKey.slice(1);
};

export function useGameUiInteractionHandlers({
  addSystemMessage,
  dispatch,
  dispatchSystemEvent,
  submitAction,
  state,
}) {
  const handleEvolveSkill = useCallback(
    (skillId) => {
      dispatch({
        type: "EVOLVE_SKILL",
        payload: { skillId },
      });
    },
    [dispatch],
  );

  const handleFuseSkills = useCallback(
    (skillAId, skillBId) => {
      dispatch({
        type: "FUSE_SKILLS",
        payload: { skillAId, skillBId },
      });
    },
    [dispatch],
  );

  const handleEvolveClass = useCallback(
    (evolutionId = null) => {
      dispatch({
        type: "EVOLVE_CLASS",
        payload: evolutionId ? { evolutionId } : {},
      });
    },
    [dispatch],
  );

  const handleEvolveRace = useCallback(
    (evolutionId = null) => {
      dispatch({
        type: "EVOLVE_RACE",
        payload: evolutionId ? { evolutionId } : {},
      });
    },
    [dispatch],
  );

  const handlePerformPrestige = useCallback(() => {
    dispatch({ type: "PERFORM_PRESTIGE" });
  }, [dispatch]);

  const handleBuyPrestigeUpgrade = useCallback(
    (upgradeType) => {
      if (!upgradeType) return;
      dispatch({
        type: "BUY_PRESTIGE_UPGRADE",
        payload: { upgradeType },
      });
    },
    [dispatch],
  );

  const handleStudySpell = useCallback(
    (payload = { mode: "create" }) => {
      dispatchSystemEvent({
        type: "STUDY_SPELL",
        payload,
      });
    },
    [dispatchSystemEvent],
  );

  const handleShopPurchase = useCallback(
    (item) => {
      const player = state?.player || {};
      const currentCurrency = player.currency || {};
      const currentGold = currentCurrency.goldCoins ?? player.gold ?? 0;
      const currentSoul = currentCurrency.soulpoints ?? player.soulpoints ?? 0;

      const titleBonuses = getTitleBonuses(player);
      const shopDiscount = Number.isFinite(titleBonuses.shopDiscount)
        ? Math.min(Math.max(titleBonuses.shopDiscount, 0), 0.9)
        : 0;
      const multiplier = 1 - shopDiscount;

      const baseGoldCost = item?.price?.goldCoins ?? 0;
      const baseSoulCost = item?.price?.soulpoints ?? 0;
      const goldCost =
        baseGoldCost > 0 ? Math.max(0, Math.floor(baseGoldCost * multiplier)) : 0;
      const soulCost =
        baseSoulCost > 0 ? Math.max(0, Math.floor(baseSoulCost * multiplier)) : 0;

      if (currentGold < goldCost || currentSoul < soulCost) {
        addSystemMessage(`Cannot afford ${item.name}`, "system");
        return;
      }

      const nextGold = currentGold - goldCost;
      const nextSoul = currentSoul - soulCost;

      let nextPlayer = {
        ...player,
        gold: nextGold,
        soulpoints: nextSoul,
        currency: {
          ...currentCurrency,
          goldCoins: nextGold,
          soulpoints: nextSoul,
        },
      };
      let serviceMessage = null;

      if (item?.itemId) {
        nextPlayer.inventory = mergeInventoryItems(player.inventory || [], [
          {
            ...(item.itemData || {}),
            id: item.itemId,
            name: item.name,
            quantity: item.quantity ?? 1,
          },
        ]);
      } else if (item?.skillData?.id) {
        const abilities = Array.isArray(player.abilities) ? player.abilities : [];
        const alreadyKnown = abilities.some(
          (ability) => ability.id === item.skillData.id,
        );
        nextPlayer.abilities = alreadyKnown
          ? abilities
          : [...abilities, item.skillData];
      } else if (item?.service) {
        const serviceResult = applyShopServicePurchase(nextPlayer, item);
        nextPlayer = serviceResult.player;
        serviceMessage = serviceResult.message;
      }

      dispatchSystemEvent({
        type: "UPDATE_STATE",
        payload: {
          player: nextPlayer,
        },
      });

      const costText =
        goldCost > 0
          ? `${goldCost} gold`
          : soulCost > 0
            ? `${soulCost} soulpoints`
            : "free";
      addSystemMessage(
        serviceMessage
          ? `${serviceMessage} Cost: ${costText}.`
          : `Purchased ${item.name} for ${costText}`,
        "system",
      );

      return;
    },
    [addSystemMessage, dispatchSystemEvent, state],
  );

  const handleGachaPull = useCallback(
    (poolType, results = []) => {
      const pool = gachaPools[poolType];
      if (!pool) {
        addSystemMessage(
          `Gacha pull failed: unknown pool ${poolType}.`,
          "system",
        );
        return;
      }

      dispatchSystemEvent({
        type: "GACHA_PULL",
        payload: {
          poolId: poolType,
          poolName: pool.name,
          cost: pool.cost,
          results,
        },
      });

      addSystemMessage(`Pulled from ${pool.name} pool.`, "system");
      if (results.length === 0) {
        addSystemMessage("No items received.", "system");
      } else {
        results.forEach((result) => {
          addSystemMessage(
            `Obtained ${result.name} [${(result.rarity || "unknown").toUpperCase()}]`,
            "system",
          );
        });
      }
    },
    [addSystemMessage, dispatchSystemEvent],
  );

  const handleTitleEquip = useCallback(
    (titleId) => {
      dispatchSystemEvent({
        type: "EQUIP_TITLE",
        payload: { titleId },
      });
    },
    [dispatchSystemEvent],
  );

  const handleTitleUnequip = useCallback(
    (titleId) => {
      dispatchSystemEvent({
        type: "UNEQUIP_TITLE",
        payload: { titleId },
      });
    },
    [dispatchSystemEvent],
  );

  const handleEquipItem = useCallback(
    (slot, item) => {
      if (!slot || !item) return;
      dispatch({
        type: "EQUIP_ITEM",
        payload: { slot, item },
      });
    },
    [dispatch],
  );

  const handleUnequipItem = useCallback(
    (slot) => {
      if (!slot) return;
      dispatch({
        type: "UNEQUIP_ITEM",
        payload: { slot },
      });
    },
    [dispatch],
  );

  const handleAllocateAttributePoint = useCallback(
    (attributeKey) => {
      if (!attributeKey) return;
      const freePoints = state?.player?.attributes?.freePoints ?? 0;
      if (freePoints <= 0) {
        addSystemMessage("No free attribute points available.", "system");
        return;
      }

      dispatchSystemEvent({
        type: "ALLOCATE_ATTRIBUTE_POINT",
        payload: { attribute: attributeKey },
      });
    },
    [addSystemMessage, dispatchSystemEvent, state],
  );

  const handleDeallocateAttributePoint = useCallback(
    (attributeKey) => {
      if (!attributeKey) return;
      const invested = state?.player?.attributeInvestments?.[attributeKey] ?? 0;
      if (invested <= 0) {
        addSystemMessage(
          `No invested points to refund for ${normalizeAttributeLabel(attributeKey)}.`,
          "system",
        );
        return;
      }

      dispatchSystemEvent({
        type: "DEALLOCATE_ATTRIBUTE_POINT",
        payload: { attribute: attributeKey },
      });
    },
    [addSystemMessage, dispatchSystemEvent, state],
  );

  const handleCraft = useCallback(
    (recipe) => {
      const inventory = state?.player?.inventory || [];
      const hasIngredients = recipe.ingredients.every((ingredient) => {
        const inventoryItem = inventory.find((item) => item.id === ingredient.id);
        return inventoryItem && inventoryItem.quantity >= ingredient.count;
      });

      if (!hasIngredients) {
        addSystemMessage(`Missing ingredients for ${recipe.name}`, "system");
        return;
      }

      dispatchSystemEvent({
        type: "CRAFT_ITEM",
        payload: { recipe },
      });

      dispatchSystemEvent({
        type: "AWARD_PROFESSION_XP",
        payload: {
          professionId: recipe.profession,
          xp: recipe.xp,
        },
      });

      addSystemMessage(`Crafted ${recipe.name} (+${recipe.xp} XP)`, "system");
    },
    [addSystemMessage, dispatchSystemEvent, state],
  );

  const handleTitlePurchase = useCallback(
    (titleOrId) => {
      const titleId =
        typeof titleOrId === "string" ? titleOrId : titleOrId?.id || null;
      if (!titleId) return;

      dispatchSystemEvent({
        type: "PURCHASE_TITLE",
        payload: { titleId },
      });
      addSystemMessage(`Purchased title: ${titleId}`, "system");
    },
    [addSystemMessage, dispatchSystemEvent],
  );

  const handleCombatAttack = useCallback(
    (enemyIndex = 0) => {
      if (state?.combat?.status !== "active") return;
      dispatchSystemEvent({
        type: "PLAYER_ATTACK",
        payload: { enemyIndex },
      });
    },
    [dispatchSystemEvent, state],
  );

  const handleSelectSkirmishUnit = useCallback(
    (unitId) => {
      if (!unitId || state?.combat?.status !== "active" || state?.combat?.mode !== "skirmish") {
        return;
      }
      dispatchSystemEvent({
        type: "PLAYER_SELECT_SKIRMISH_UNIT",
        payload: { unitId },
      });
    },
    [dispatchSystemEvent, state],
  );

  const handleSelectSkirmishTarget = useCallback(
    (targetId) => {
      if (
        !targetId ||
        state?.combat?.status !== "active" ||
        state?.combat?.mode !== "skirmish"
      ) {
        return;
      }
      dispatchSystemEvent({
        type: "PLAYER_SELECT_SKIRMISH_TARGET",
        payload: { targetId },
      });
    },
    [dispatchSystemEvent, state],
  );

  const handleMoveSkirmishUnit = useCallback(
    (lane, slot) => {
      if (state?.combat?.status !== "active" || state?.combat?.mode !== "skirmish") return;
      dispatchSystemEvent({
        type: "PLAYER_SKIRMISH_MOVE",
        payload: { lane, slot },
      });
    },
    [dispatchSystemEvent, state],
  );

  const handleSetCombatLane = useCallback(
    (lane) => {
      if (state?.combat?.status !== "active") return;
      dispatchSystemEvent({
        type: "PLAYER_SET_COMBAT_LANE",
        payload: { lane },
      });
    },
    [dispatchSystemEvent, state],
  );

  const handleSetCombatStance = useCallback(
    (stance) => {
      if (state?.combat?.status !== "active") return;
      dispatchSystemEvent({
        type: "PLAYER_SET_COMBAT_STANCE",
        payload: { stance },
      });
    },
    [dispatchSystemEvent, state],
  );

  const handleRest = useCallback(() => {
    if (state?.combat?.status === "active" && state?.combat?.mode === "skirmish") {
      dispatchSystemEvent({ type: "PLAYER_SKIRMISH_WAIT" });
      return;
    }

    const result =
      typeof submitAction === "function"
        ? submitAction({
            kind: "action",
            action: {
              type: "rest",
              originalInput: "rest",
            },
          })
        : null;

    if (result && result.ok === false) {
      addSystemMessage(
        result.reason || "Rest is not available right now.",
        "system",
        );
      }
  }, [addSystemMessage, dispatchSystemEvent, state, submitAction]);

  const handleSkillUse = useCallback(
    (skillId, enemyIndex = 0) => {
      if (state?.combat?.status !== "active") return;
      if (state?.combat?.mode === "skirmish") {
        dispatchSystemEvent({
          type: "PLAYER_SKIRMISH_USE_SKILL",
          payload: { skillId },
        });
        return;
      }
      dispatchSystemEvent({
        type: "PLAYER_USE_SKILL",
        payload: { skillId, enemyIndex },
      });
    },
    [dispatchSystemEvent, state],
  );

  const handleClassAbilityUse = useCallback(
    (abilityId, enemyIndex = 0) => {
      if (state?.combat?.status !== "active") return;
      dispatchSystemEvent({
        type: "PLAYER_USE_CLASS_ABILITY",
        payload: { abilityId, enemyIndex },
      });
    },
    [dispatchSystemEvent, state],
  );

  const handleRaceAbilityUse = useCallback(
    (abilityId, enemyIndex = 0) => {
      if (state?.combat?.status !== "active") return;
      dispatchSystemEvent({
        type: "PLAYER_USE_RACE_ABILITY",
        payload: { abilityId, enemyIndex },
      });
    },
    [dispatchSystemEvent, state],
  );

  const handleUseItem = useCallback(
    (itemId, itemName = "") => {
      if (!itemId) return;
      if (state?.combat?.status === "active" && state?.combat?.mode === "skirmish") {
        dispatchSystemEvent({
          type: "PLAYER_SKIRMISH_USE_ITEM",
          payload: { itemId },
        });
        return;
      }
      const result =
        typeof submitAction === "function"
          ? submitAction({
              kind: "action",
              action: {
                type: "use_item",
                itemId,
                itemName,
                originalInput: `use ${itemName || itemId}`,
              },
            })
          : null;

      if (result && result.ok === false) {
        addSystemMessage(
          result.reason || `Cannot use ${itemName || itemId}.`,
          "system",
        );
      }
    },
    [addSystemMessage, dispatchSystemEvent, state, submitAction],
  );

  const handleCombatEscape = useCallback(() => {
    if (state?.combat?.status !== "active") return;
    dispatchSystemEvent({ type: "PLAYER_ESCAPE" });
  }, [dispatchSystemEvent, state]);

  return {
    handleAllocateAttributePoint,
    handleBuyPrestigeUpgrade,
    handleClassAbilityUse,
    handleCombatAttack,
    handleCombatEscape,
    handleCraft,
    handleDeallocateAttributePoint,
    handleEquipItem,
    handleEvolveClass,
    handleEvolveRace,
    handleEvolveSkill,
    handleFuseSkills,
    handleGachaPull,
    handleMoveSkirmishUnit,
    handlePerformPrestige,
    handleRaceAbilityUse,
    handleShopPurchase,
    handleRest,
    handleSelectSkirmishTarget,
    handleSelectSkirmishUnit,
    handleSetCombatLane,
    handleSetCombatStance,
    handleSkillUse,
    handleStudySpell,
    handleTitleEquip,
    handleTitlePurchase,
    handleTitleUnequip,
    handleUseItem,
    handleUnequipItem,
  };
}
