import React from "react";

const TABS = [
  { id: "adventure", icon: "⚔", label: "Adventure" },
  { id: "character", icon: "👤", label: "Character" },
  { id: "inventory", icon: "🎒", label: "Inventory" },
  { id: "quests", icon: "📜", label: "Quests" },
  { id: "menu", icon: "⚙", label: "Menu" },
];

export { TABS };

export default function MobileTabBar({ activeTab, onTabChange }) {
  return (
    <nav className="mobile-tab-bar" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`mobile-tab-bar__item${activeTab === tab.id ? " mobile-tab-bar__item--active" : ""}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span aria-hidden="true">{tab.icon}</span>
          <span className="mobile-tab-bar__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
