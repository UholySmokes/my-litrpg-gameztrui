import { mergeInventoryItems } from "../../utils/shared.js";

function normalizeDurability(item) {
  const max = Number(item?.durability?.max);
  const resolvedMax = Number.isFinite(max) && max > 0 ? max : 100;
  return {
    current: resolvedMax,
    max: resolvedMax,
  };
}

export function applyShopServicePurchase(player = {}, item = {}) {
  const service = item?.service;
  if (!service) {
    return { player, message: "Service unavailable." };
  }

  if (service === "enhance_weapon" || service === "enhance_armor") {
    const equipment = { ...(player.equipment || {}) };
    const slot = service === "enhance_weapon" ? "weapon" : "armor";
    const statKey = service === "enhance_weapon" ? "attack" : "defense";
    const equippedItem = equipment[slot];
    if (!equippedItem) {
      return {
        player,
        message: `No ${slot} equipped for enhancement.`,
      };
    }

    equipment[slot] = {
      ...equippedItem,
      stats: {
        ...(equippedItem.stats || {}),
        [statKey]: (equippedItem.stats?.[statKey] || 0) + 5,
      },
    };

    return {
      player: { ...player, equipment },
      message: `${item.name} applied to your ${slot}.`,
    };
  }

  if (service === "repair") {
    const equipmentEntries = Object.entries(player.equipment || {});
    if (equipmentEntries.length === 0) {
      return {
        player,
        message: "No equipped gear needs repair.",
      };
    }

    const equipment = Object.fromEntries(
      equipmentEntries.map(([slot, equippedItem]) => [
        slot,
        {
          ...equippedItem,
          durability: normalizeDurability(equippedItem),
        },
      ]),
    );

    return {
      player: { ...player, equipment },
      message: "All equipped gear has been repaired.",
    };
  }

  if (service === "potion_restock") {
    const inventory = mergeInventoryItems(player.inventory || [], [
      { id: "health_potion", name: "Health Potion", quantity: 2 },
      { id: "mana_potion", name: "Mana Potion", quantity: 2 },
    ]);

    return {
      player: { ...player, inventory },
      message: "Potion restock delivered 2 Health Potions and 2 Mana Potions.",
    };
  }

  if (service === "attribute_respec") {
    const attributeInvestments = player.attributeInvestments || {};
    const refundablePoints = Object.values(attributeInvestments).reduce(
      (sum, value) => sum + (Number.isFinite(value) ? value : 0),
      0,
    );
    if (refundablePoints <= 0) {
      return {
        player,
        message: "No attribute points are currently invested.",
      };
    }

    const nextAttributes = { ...(player.attributes || {}) };
    Object.entries(attributeInvestments).forEach(([attribute, invested]) => {
      if (!Number.isFinite(invested) || invested <= 0) return;
      nextAttributes[attribute] = Math.max(
        0,
        Number(nextAttributes[attribute] || 0) - invested,
      );
    });
    nextAttributes.freePoints = Number(nextAttributes.freePoints || 0) + refundablePoints;

    return {
      player: {
        ...player,
        attributes: nextAttributes,
        attributeInvestments: {},
      },
      message: `Respec complete. Refunded ${refundablePoints} attribute points.`,
    };
  }

  if (service === "identify") {
    return {
      player,
      message: "Identification service is standing by for unidentified loot.",
    };
  }

  return {
    player,
    message: `${item.name || "Service"} completed.`,
  };
}