import React from "react";
import { MOBILE_SYSTEM_MENU as MENU_ITEMS } from "../mobileAtriumNav.js";

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
      <div className="mobile-section-title">Room Access</div>
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
