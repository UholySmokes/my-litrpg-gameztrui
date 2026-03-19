import { describe, expect, it } from "@jest/globals";
import {
  getPrimaryCombatEnemyIndex,
  getQuickActionItems,
  getQuickActionSkills,
} from "../../src/components/gameui/quickActionModel.js";

describe("quickActionModel", () => {
  it("prefers active skill collections and de-duplicates by id", () => {
    const player = {
      activeSkills: [{ id: "slash", name: "Slash" }, { id: "burst" }],
      skills: { active: [{ id: "slash", name: "Slash Again" }, { id: "guard" }] },
      abilities: [{ id: "burst", type: "active" }, { id: "ward", type: "active" }],
    };

    const skills = getQuickActionSkills(player);
    const ids = skills.map((skill) => skill.id);

    expect(ids).toEqual(["slash", "burst", "guard", "ward"]);
    expect(skills[1].name).toBe("burst");
  });

  it("builds item entries with usability and quantity metadata", () => {
    const player = {
      inventory: [
        { id: "hp_potion", name: "HP Potion", quantity: 3, type: "consumable" },
        { id: "ore_chunk", quantity: 1, effect: {} },
        { id: "mana_draught", effect: { mana: 12 } },
      ],
    };

    const items = getQuickActionItems(player);
    expect(items).toHaveLength(3);
    expect(items[0].usable).toBe(true);
    expect(items[0].quantity).toBe(3);
    expect(items[1].usable).toBe(false);
    expect(items[2].name).toBe("Mana_draught");
  });

  it("returns the first living enemy index for quick attack targeting", () => {
    const combatState = {
      enemies: [
        { stats: { hp: { current: 0 } } },
        { stats: { hp: { current: 15 } } },
        { stats: { hp: { current: 20 } } },
      ],
    };

    expect(getPrimaryCombatEnemyIndex(combatState)).toBe(1);
    expect(getPrimaryCombatEnemyIndex({ enemies: [] })).toBe(0);
  });
});
