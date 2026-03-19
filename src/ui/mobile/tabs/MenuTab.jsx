import React from "react";

const MENU_ITEMS = [
  { group: "Systems", items: [
    { id: "shop", icon: "🏪", label: "Shop" },
    { id: "gacha", icon: "🎰", label: "Gacha" },
    { id: "craft", icon: "🔨", label: "Crafting" },
    { id: "titles", icon: "🏆", label: "Titles" },
    { id: "archetype", icon: "⚛", label: "Archetype System" },
  ]},
  { group: "Game", items: [
    { id: "status", icon: "📊", label: "Full Status" },
    { id: "saveload", icon: "💾", label: "Save & Load" },
    { id: "theme", icon: "🎨", label: "Change Theme" },
  ]},
];

export default function MenuTab({
  onToggleShop,
  onToggleGacha,
  onToggleProfessions,
  onToggleTitleSystem,
  onOpenArchetypeSystem,
  onToggleStatusOverlay,
  onToggleSaveLoad,
  onToggleThemeSelector,
}) {
  const handlers = {
    shop: onToggleShop,
    gacha: onToggleGacha,
    craft: onToggleProfessions,
    titles: onToggleTitleSystem,
    archetype: onOpenArchetypeSystem,
    status: onToggleStatusOverlay,
    saveload: onToggleSaveLoad,
    theme: onToggleThemeSelector,
  };

  return (
    <div className="menu-tab">
      {MENU_ITEMS.map((group) => (
        <React.Fragment key={group.group}>
          <div className="menu-tab__group-title">{group.group}</div>
          {group.items.map((item) => (
            <button
              key={item.id}
              className="menu-tab__item"
              onClick={() => handlers[item.id]?.()}
            >
              <span className="menu-tab__item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
