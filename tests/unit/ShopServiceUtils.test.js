import { describe, expect, it } from "@jest/globals";
import { applyShopServicePurchase } from "../../src/components/gameui/shopServiceUtils.js";

describe("shop service utilities", () => {
  it("repairs equipped gear by restoring durability to max", () => {
    const result = applyShopServicePurchase(
      {
        equipment: {
          weapon: {
            id: "iron_sword",
            durability: { current: 22, max: 80 },
          },
        },
      },
      { service: "repair" },
    );

    expect(result.player.equipment.weapon.durability).toEqual({ current: 80, max: 80 });
  });

  it("restocks potions into the player inventory", () => {
    const result = applyShopServicePurchase(
      {
        inventory: [{ id: "health_potion", name: "Health Potion", quantity: 1 }],
      },
      { service: "potion_restock" },
    );

    expect(result.player.inventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "health_potion", quantity: 3 }),
        expect.objectContaining({ id: "mana_potion", quantity: 2 }),
      ]),
    );
  });

  it("refunds attribute investments during respec", () => {
    const result = applyShopServicePurchase(
      {
        attributes: { strength: 8, agility: 7, freePoints: 1 },
        attributeInvestments: { strength: 3, agility: 2 },
      },
      { service: "attribute_respec" },
    );

    expect(result.player.attributes).toEqual(
      expect.objectContaining({ strength: 5, agility: 5, freePoints: 6 }),
    );
    expect(result.player.attributeInvestments).toEqual({});
  });
});