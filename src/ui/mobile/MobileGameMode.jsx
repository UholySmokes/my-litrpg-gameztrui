import React, { useState, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import MobileStatBar from "./MobileStatBar.jsx";
import MobileTabBar from "./MobileTabBar.jsx";
import MobileTabRouter from "./MobileTabRouter.jsx";
import CombatOverlay from "./CombatOverlay.jsx";
import "./mobile-base.css";
import "./themes/dark-grimoire.css";
import "./themes/void-nexus.css";
import "./themes/jade-meridian.css";
import "./themes/ironbound-codex.css";
import "./themes/runic-edda.css";

/**
 * Top-level mobile game layout orchestrator.
 * Replaces WindowManager-based GameMode on viewports < 768px.
 *
 * Structure:
 *   [MobileStatBar]   — persistent top bar
 *   [MobileTabRouter] — active tab content
 *   [MobileTabBar]    — bottom navigation
 *   [CombatOverlay]   — full-screen when combat is active
 */
export default function MobileGameMode({
  player,
  config,
  gameState,
  userInput,
  onInputChange,
  onSubmit,
  isLoading,
  error,
  suggestions,
  onSuggestionSelect,
  inputRef,
  narrativeEntries,
  latestEntry,
  latestEntryText,
  quests,
  combatState,
  onAttack,
  onUseSkill,
  onUseClassAbility,
  onUseRaceAbility,
  onEscape,
  equipmentSelectSlot,
  onSelectEquipmentSlot,
  onEquipItem,
  onUnequipItem,
  // Toggles for modal screens
  showShop,
  showGacha,
  showArchetypeSystem,
  showTitleSystem,
  showProfessions,
  showStatusOverlay,
  showSaveLoad,
  onCloseShop,
  onCloseGacha,
  onCloseArchetypeSystem,
  onOpenArchetypeSystem,
  onCloseTitleSystem,
  onCloseProfessions,
  onCloseStatusOverlay,
  onCloseSaveLoad,
  onShopPurchase,
  onGachaPull,
  onTitleEquip,
  onTitleUnequip,
  onTitlePurchase,
  onCraft,
  onAllocateAttribute,
  onDeallocateAttribute,
  onEvolveSkill,
  onFuseSkills,
  onEvolveClass,
  onEvolveRace,
  onStudySpell,
  onLoadState,
  addSystemMessage,
  user,
  onEquipTitle,
  onUnequipTitle,
}) {
  const [activeTab, setActiveTab] = useState("adventure");
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  const onToggleThemeSelector = useCallback(() => setShowThemeSelector((v) => !v), []);

  // Shared props passed to all tabs
  const tabProps = {
    player,
    config,
    gameState,
    userInput,
    onInputChange,
    onSubmit,
    isLoading,
    error,
    suggestions,
    onSuggestionSelect,
    inputRef,
    narrativeEntries,
    latestEntry,
    latestEntryText,
    quests,
    combatState,
    equipmentSelectSlot,
    onSelectEquipmentSlot,
    onEquipItem,
    onUnequipItem,
    // Menu toggles
    onToggleShop: showShop !== undefined ? onCloseShop : undefined,
    onToggleGacha: showGacha !== undefined ? onCloseGacha : undefined,
    onToggleProfessions: showProfessions !== undefined ? onCloseProfessions : undefined,
    onToggleTitleSystem: showTitleSystem !== undefined ? onCloseTitleSystem : undefined,
    onOpenArchetypeSystem,
    onToggleStatusOverlay: showStatusOverlay !== undefined ? onCloseStatusOverlay : undefined,
    onToggleSaveLoad: showSaveLoad !== undefined ? onCloseSaveLoad : undefined,
    onToggleThemeSelector,
    onShopPurchase,
    onGachaPull,
    onTitleEquip,
    onTitleUnequip,
    onTitlePurchase,
    onCraft,
    onAllocateAttribute,
    onDeallocateAttribute,
    onEvolveSkill,
    onFuseSkills,
    onEvolveClass,
    onEvolveRace,
    onStudySpell,
    onLoadState,
    addSystemMessage,
    user,
    onEquipTitle,
    onUnequipTitle,
  };

  return (
    <div className="mobile-game">
      <MobileStatBar player={player} config={config} />

      <MobileTabRouter activeTab={activeTab} tabProps={tabProps} />

      <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Full-screen combat overlay */}
      <CombatOverlay
        player={player}
        config={config}
        combatState={combatState}
        onAttack={onAttack}
        onUseSkill={onUseSkill}
        onUseClassAbility={onUseClassAbility}
        onUseRaceAbility={onUseRaceAbility}
        onEscape={onEscape}
      />
    </div>
  );
}
