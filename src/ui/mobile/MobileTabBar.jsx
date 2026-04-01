import React from "react";
import { MOBILE_ATRIUM_TABS as TABS } from "./mobileAtriumNav.js";

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
          <span aria-hidden="true" className="mobile-tab-bar__icon">
            {tab.icon}
          </span>
          <span className="mobile-tab-bar__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
