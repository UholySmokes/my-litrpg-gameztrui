import React from "react";
import { describe, expect, it } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";
import GameQuickActions, {
  getQuickActionItems,
  getQuickActionSkills,
} from "../../src/components/gameui/GameQuickActions.jsx";

describe("GameQuickActions", () => {
  it("normalizes quick-action skills and inventory items", () => {
    const player = {
      activeSkills: [
        { id: "fireball", name: "Fireball", manaCost: 12, description: "Cast fire." },
        { id: "fireball", name: "Duplicate Fireball", manaCost: 20 },
      ],
      inventory: [
        {
          id: "minor_potion",
          name: "Minor Potion",
          quantity: 2,
          type: "consumable",
          effect: { heal: 20 },
        },
        {
          id: "rock",
          name: "Rock",
          quantity: 1,
        },
      ],
    };

    expect(getQuickActionSkills(player)).toEqual([
      expect.objectContaining({
        id: "fireball",
        name: "Fireball",
        manaCost: 12,
      }),
    ]);

    expect(getQuickActionItems(player)).toEqual([
      expect.objectContaining({
        id: "minor_potion",
        name: "Minor Potion",
        quantity: 2,
        usable: true,
      }),
      expect.objectContaining({
        id: "rock",
        name: "Rock",
        quantity: 1,
        usable: false,
      }),
    ]);
  });

  it("renders the direct actions and legacy toggles", () => {
    const markup = renderToStaticMarkup(
      React.createElement(GameQuickActions, {
        isDevBuild: true,
        combatState: { status: "inactive", enemies: [] },
        player: {
          activeSkills: [{ id: "fireball", name: "Fireball" }],
          inventory: [
            {
              id: "minor_potion",
              name: "Minor Potion",
              quantity: 1,
              type: "consumable",
              effect: { heal: 20 },
            },
          ],
        },
        submitAction: () => ({ ok: true }),
        onAttack: () => {},
        onEscape: () => {},
        onRest: () => {},
        onUseItem: () => {},
        onUseSkill: () => {},
        onToggleArchetypeSystem: () => {},
        onToggleCraft: () => {},
        onToggleGacha: () => {},
        onToggleQuests: () => {},
        onToggleReplayInspector: () => {},
        onToggleSaveLoad: () => {},
        onToggleShop: () => {},
        onToggleStatus: () => {},
        onToggleTitles: () => {},
      }),
    );

    expect(markup).toContain("Attack");
    expect(markup).toContain("Rest");
    expect(markup).toContain("Escape");
    expect(markup).toContain("Skill");
    expect(markup).toContain("Item");
    expect(markup).toContain("Quests");
    expect(markup).toContain("Shop");
    expect(markup).toContain("Replay Inspector");
  });
});
