import React, { lazy, Suspense } from "react";

const AdventureTab = lazy(() => import("./tabs/AdventureTab.jsx"));
const CharacterTab = lazy(() => import("./tabs/CharacterTab.jsx"));
const InventoryTab = lazy(() => import("./tabs/InventoryTab.jsx"));
const QuestsTab = lazy(() => import("./tabs/QuestsTab.jsx"));
const MenuTab = lazy(() => import("./tabs/MenuTab.jsx"));

const LOADING = (
  <div style={{ padding: "2rem", textAlign: "center", opacity: 0.5, fontFamily: "monospace" }}>
    Loading…
  </div>
);

export default function MobileTabRouter({ activeTab, tabProps }) {
  let content;
  switch (activeTab) {
    case "adventure":
      content = <AdventureTab {...tabProps} />;
      break;
    case "character":
      content = <CharacterTab {...tabProps} />;
      break;
    case "inventory":
      content = <InventoryTab {...tabProps} />;
      break;
    case "quests":
      content = <QuestsTab {...tabProps} />;
      break;
    case "menu":
      content = <MenuTab {...tabProps} />;
      break;
    default:
      content = <AdventureTab {...tabProps} />;
  }

  return (
    <div className="mobile-tab-content" role="tabpanel">
      <div className="mobile-tab-content__panel">
        <Suspense fallback={LOADING}>{content}</Suspense>
      </div>
    </div>
  );
}
