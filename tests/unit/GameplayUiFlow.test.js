import { describe, expect, it, jest } from "@jest/globals";
import CombatUI from "../../src/components/CombatUI.jsx";
import GameQuickActions from "../../src/components/gameui/GameQuickActions.jsx";

function collectButtons(node, buttons = []) {
  if (!node) return buttons;
  if (Array.isArray(node)) {
    node.forEach((child) => collectButtons(child, buttons));
    return buttons;
  }

  if (typeof node !== "object") return buttons;

  if (node.type === "button") {
    buttons.push(node);
  }

  collectButtons(node.props?.children, buttons);
  return buttons;
}

function buttonText(node) {
  const children = Array.isArray(node?.props?.children)
    ? node.props.children
    : [node?.props?.children];

  return children
    .flat(Infinity)
    .filter((part) => typeof part === "string" || typeof part === "number")
    .join("")
    .trim();
}

describe("GameQuickActions", () => {
  it("wires each quick action button to the provided toggle callback", () => {
    const callbacks = {
      onToggleArchetypeSystem: jest.fn(),
      onToggleCraft: jest.fn(),
      onToggleGacha: jest.fn(),
      onToggleQuests: jest.fn(),
      onToggleReplayInspector: jest.fn(),
      onToggleSaveLoad: jest.fn(),
      onToggleShop: jest.fn(),
      onToggleStatus: jest.fn(),
      onToggleTitles: jest.fn(),
    };

    const element = GameQuickActions({ ...callbacks, isDevBuild: false });
    const buttons = collectButtons(element);

    expect(buttons.map(buttonText)).toEqual([
      "Quests",
      "Shop",
      "Gacha",
      "Craft",
      "Status",
      "System",
      "Titles",
      "Save and Load",
    ]);

    buttons.forEach((button) => button.props.onClick());

    expect(callbacks.onToggleQuests).toHaveBeenCalledTimes(1);
    expect(callbacks.onToggleShop).toHaveBeenCalledTimes(1);
    expect(callbacks.onToggleGacha).toHaveBeenCalledTimes(1);
    expect(callbacks.onToggleCraft).toHaveBeenCalledTimes(1);
    expect(callbacks.onToggleStatus).toHaveBeenCalledTimes(1);
    expect(callbacks.onToggleArchetypeSystem).toHaveBeenCalledTimes(1);
    expect(callbacks.onToggleTitles).toHaveBeenCalledTimes(1);
    expect(callbacks.onToggleSaveLoad).toHaveBeenCalledTimes(1);
    expect(callbacks.onToggleReplayInspector).not.toHaveBeenCalled();
  });

  it("adds the replay inspector button in dev builds only", () => {
    const callbacks = {
      onToggleArchetypeSystem: jest.fn(),
      onToggleCraft: jest.fn(),
      onToggleGacha: jest.fn(),
      onToggleQuests: jest.fn(),
      onToggleReplayInspector: jest.fn(),
      onToggleSaveLoad: jest.fn(),
      onToggleShop: jest.fn(),
      onToggleStatus: jest.fn(),
      onToggleTitles: jest.fn(),
    };

    const element = GameQuickActions({ ...callbacks, isDevBuild: true });
    const buttons = collectButtons(element);

    expect(buttons).toHaveLength(9);
    expect(buttonText(buttons[8])).toBe("Replay Inspector");
  });
});

describe("CombatUI", () => {
  const combatState = {
    status: "active",
    skillCooldowns: {},
    enemies: [
      {
        id: "alpha",
        name: "Alpha",
        level: 4,
        stats: { hp: { current: 12, max: 12 } },
        lane: 2,
      },
      {
        id: "beta",
        name: "Beta",
        level: 7,
        stats: { hp: { current: 0, max: 18 } },
        lane: 3,
      },
      {
        id: "gamma",
        name: "Gamma",
        level: 9,
        stats: { hp: { current: 20, max: 20 } },
        lane: 4,
      },
    ],
    lanes: { player: 1, enemies: [2, 3, 4] },
  };

  const playerState = {
    activeSkills: [
      { id: "skill_one", name: "Skill One", manaCost: 5 },
      { id: "skill_two", name: "Skill Two", manaCost: 8 },
      { id: "skill_three", name: "Skill Three", manaCost: 12 },
      { id: "skill_four", name: "Skill Four", manaCost: 16 },
      { id: "skill_five", name: "Skill Five", manaCost: 20 },
    ],
  };

  it("renders direct combat actions for the active encounter", () => {
    const onAttack = jest.fn();
    const onUseSkill = jest.fn();
    const onEscape = jest.fn();

    const element = CombatUI({
      combatState,
      playerState,
      onAttack,
      onUseSkill,
      onEscape,
    });
    const buttons = collectButtons(element);
    const labels = buttons.map(buttonText);

    expect(labels).toEqual(
      expect.arrayContaining([
        "Attack Alpha",
        "Attack Gamma",
        "Attempt Escape",
        "Skill One (Cost: 5 MP)",
        "Skill Four (Cost: 16 MP)",
      ]),
    );

    buttons.find((button) => buttonText(button) === "Attack Gamma").props.onClick();
    buttons.find((button) => buttonText(button) === "Attempt Escape").props.onClick();
    buttons.find((button) => buttonText(button).startsWith("Skill One")).props.onClick();

    expect(onAttack).toHaveBeenCalledWith(2);
    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(onUseSkill).toHaveBeenCalledWith("skill_one", 0);
  });

  it("limits the visible skill buttons to the first four skills", () => {
    const element = CombatUI({
      combatState,
      playerState,
      onAttack: jest.fn(),
      onUseSkill: jest.fn(),
      onEscape: jest.fn(),
    });
    const buttons = collectButtons(element);
    const skillButtons = buttons.filter((button) =>
      buttonText(button).includes("MP"),
    );

    expect(skillButtons).toHaveLength(4);
    expect(skillButtons.map(buttonText)).not.toContain(
      "Skill Five (Cost: 20 MP)",
    );
  });

  it("returns null when combat is not active", () => {
    expect(
      CombatUI({
        combatState: { status: "inactive" },
        playerState,
        onAttack: jest.fn(),
        onUseSkill: jest.fn(),
        onEscape: jest.fn(),
      }),
    ).toBeNull();
  });
});
