import WindowManager from "../windowing/WindowManager.jsx";
import VitalsPanel from "../panels/VitalsPanel.jsx";
import EquipmentPanel from "../panels/EquipmentPanel.jsx";
import EquipmentSelectionPanel from "../panels/EquipmentSelectionPanel.jsx";
import InventoryPanel from "../panels/InventoryPanel.jsx";
import StatusEffectsPanel from "../panels/StatusEffectsPanel.jsx";
import NarrativeHubPanel from "../panels/NarrativeHubPanel.jsx";
import CommandTerminalPanel from "../panels/CommandTerminalPanel.jsx";
import ActionSuggestionsPanel from "../panels/ActionSuggestionsPanel.jsx";
import QuestPanel from "../panels/QuestPanel.jsx";
import CombatUI from "../../components/CombatUI.jsx";
import ShopUI from "../../components/ShopUI.jsx";
import GachaUI from "../../components/GachaUI.jsx";
import TitleUI from "../../components/TitleUI.jsx";
import ProfessionUI from "../../components/ProfessionUI.jsx";
import StatusOverlay from "../../components/StatusOverlay.jsx";
import SaveLoadUI from "../../components/SaveLoadUI.jsx";
import ReplayInspector from "../../components/ReplayInspector.jsx";

function deriveStoryWindowContext(latestEntry) {
  const narrativeText = String(latestEntry?.text || "").toLowerCase();
  if (!narrativeText) {
    return {
      vitalsTitle: "Vitals",
      inventoryTitle: "Inventory",
      questTitle: "Quests",
      combatTitle: "Combat",
      vitalsHint: "Current survival metrics.",
      inventoryHint: "Current carried items.",
      questHint: "Track your active objectives.",
    };
  }

  const combatWords = ["enemy", "battle", "ambush", "strike", "combat", "wound"];
  const inventoryWords = ["item", "supply", "reagent", "loot", "pack", "gear"];
  const questWords = ["quest", "objective", "lead", "directive", "mission"];
  const recoveryWords = ["rest", "recover", "fatigue", "strain", "exhausted"];

  const hasCombat = combatWords.some((word) => narrativeText.includes(word));
  const hasInventory = inventoryWords.some((word) => narrativeText.includes(word));
  const hasQuest = questWords.some((word) => narrativeText.includes(word));
  const hasRecovery = recoveryWords.some((word) => narrativeText.includes(word));

  return {
    vitalsTitle: hasRecovery ? "Vitals - Recovery Focus" : "Vitals",
    inventoryTitle: hasInventory ? "Inventory - Story Supplies" : "Inventory",
    questTitle: hasQuest ? "Quests - Current Leads" : "Quests",
    combatTitle: hasCombat ? "Combat - Story Clash" : "Combat",
    vitalsHint: hasRecovery
      ? "The latest narrative emphasizes recovery and resource stability."
      : "Current survival metrics.",
    inventoryHint: hasInventory
      ? "Recent narrative events reference supplies and carried resources."
      : "Current carried items.",
    questHint: hasQuest
      ? "Narrative focus is aligned with objective progress."
      : "Track your active objectives.",
  };
}

export default function GameMode({
  player,
  config,
  gameState,
  userInput,
  onInputChange,
  onSubmit,
  isLoading,
  error = null,
  suggestions,
  onSuggestionSelect,
  inputRef,
  narrativeSummary,
  narrativeCurrentMood = "neutral",
  narrativeEntries,
  latestEntry,
  latestEntryText,
  narrativeMemoryRef,
  equipmentSelectSlot,
  onSelectEquipmentSlot,
  onCloseEquipmentSelect = () => {},
  onEquipItem = () => {},
  onUnequipItem = () => {},
  onEquipTitle = () => {},
  onUnequipTitle = () => {},
  quests,
  combatState,
  onAttack,
  onUseSkill,
  onUseClassAbility,
  onUseRaceAbility,
  onEscape,
  showShop = false,
  showGacha = false,
  showTitleSystem = false,
  showProfessions = false,
  showStatusOverlay = false,
  showSaveLoad = false,
  showReplayInspector = false,
  onCloseShop = () => {},
  onCloseGacha = () => {},
  onCloseTitleSystem = () => {},
  onCloseProfessions = () => {},
  onCloseStatusOverlay = () => {},
  onCloseSaveLoad = () => {},
  showQuests = false,
  onCloseQuests = () => {},
  onCloseReplayInspector = () => {},
  onShopPurchase = () => {},
  onGachaPull = () => {},
  onTitleEquip = () => {},
  onTitleUnequip = () => {},
  onTitlePurchase = () => {},
  onCraft = () => {},
  onAllocateAttribute = () => {},
  onDeallocateAttribute = () => {},
  onEvolveSkill = () => {},
  onFuseSkills = () => {},
  onEvolveClass = () => {},
  onEvolveRace = () => {},
  onStudySpell = () => {},
  onLoadState = () => {},
  addSystemMessage = () => {},
  user = null,
  focusWindowRequest = null,
}) {
  const equipmentSelectLabel = equipmentSelectSlot
    ? equipmentSelectSlot.charAt(0).toUpperCase() + equipmentSelectSlot.slice(1)
    : "";
  const storyContext = deriveStoryWindowContext(latestEntry);
  const windows = [
    {
      id: "vitals",
      title: storyContext.vitalsTitle,
      dockZone: "left",
      minWidth: 260,
      minHeight: 180,
      content: (
        <VitalsPanel
          player={player}
          config={config}
          storyHint={storyContext.vitalsHint}
        />
      ),
    },
    {
      id: "equipment",
      title: "Equipment",
      dockZone: "left",
      minWidth: 260,
      minHeight: 180,
      content: (
        <EquipmentPanel player={player} onSelectSlot={onSelectEquipmentSlot} />
      ),
    },
    {
      id: "inventory",
      title: storyContext.inventoryTitle,
      dockZone: "left",
      minWidth: 260,
      minHeight: 180,
      content: (
        <InventoryPanel
          inventory={player?.inventory || []}
          storyHint={storyContext.inventoryHint}
        />
      ),
    },
    {
      id: "statusEffects",
      title: "Status Effects",
      dockZone: "left",
      minWidth: 260,
      minHeight: 160,
      content: <StatusEffectsPanel player={player} />,
    },
    {
      id: "narrative",
      title: "Narrative",
      dockZone: "center",
      minWidth: 520,
      minHeight: 320,
      content: (
        <NarrativeHubPanel
          entries={narrativeEntries}
          summary={narrativeSummary}
          latestEntry={latestEntry}
          latestEntryText={latestEntryText}
          memoryRef={narrativeMemoryRef}
          currentMood={narrativeCurrentMood}
        />
      ),
    },
    {
      id: "commandTerminal",
      title: "Command Terminal",
      dockZone: "center",
      minWidth: 420,
      minHeight: 140,
      content: (
        <CommandTerminalPanel
          userInput={userInput}
          onInputChange={onInputChange}
          onSubmit={onSubmit}
          isLoading={isLoading}
          error={error}
          inputRef={inputRef}
        />
      ),
    },
    {
      id: "actionSuggestions",
      title: "Action Suggestions",
      dockZone: "center",
      minWidth: 420,
      minHeight: 120,
      content: (
        <ActionSuggestionsPanel
          suggestions={suggestions}
          onSelect={onSuggestionSelect}
        />
      ),
    },
    ...(showQuests
      ? [
          {
            id: "quests",
            title: storyContext.questTitle,
            dockZone: "float",
            position: { x: 420, y: 100 },
            size: { w: 420, h: 380 },
            minWidth: 320,
            minHeight: 240,
            openFullscreenOnce: true,
            onClose: onCloseQuests,
            content: <QuestPanel quests={quests} storyHint={storyContext.questHint} />,
          },
        ]
      : []),
    {
      id: "combat",
      title: storyContext.combatTitle,
      dockZone: "float",
      position: { x: 520, y: 520 },
      size: { w: 420, h: 420 },
      minWidth: 320,
      minHeight: 240,
      content:
        combatState?.status === "active" ? (
          <CombatUI
            combatState={combatState}
            playerState={player}
            onAttack={onAttack}
            onUseSkill={onUseSkill}
            onUseClassAbility={onUseClassAbility}
            onUseRaceAbility={onUseRaceAbility}
            onEscape={onEscape}
          />
        ) : (
          <div style={{ color: "var(--text-dim)" }}>No active combat.</div>
        ),
    },
    ...(showShop
      ? [
          {
            id: "shop",
            title: "Shop",
            dockZone: "float",
            position: { x: 160, y: 80 },
            size: { w: 640, h: 520 },
            minWidth: 420,
            minHeight: 320,
            openFullscreenOnce: true,
            onClose: onCloseShop,
            content: (
              <ShopUI
                isOpen={true}
                onClose={onCloseShop}
                gameState={gameState}
                variant="window"
                onPurchase={onShopPurchase}
              />
            ),
          },
        ]
      : []),
    ...(showGacha
      ? [
          {
            id: "gacha",
            title: "Gacha",
            dockZone: "float",
            position: { x: 220, y: 140 },
            size: { w: 640, h: 520 },
            minWidth: 420,
            minHeight: 320,
            openFullscreenOnce: true,
            onClose: onCloseGacha,
            content: (
              <GachaUI
                isOpen={true}
                onClose={onCloseGacha}
                gameState={gameState}
                variant="window"
                onPull={onGachaPull}
              />
            ),
          },
        ]
      : []),
    ...(showTitleSystem
      ? [
          {
            id: "titles",
            title: "Titles",
            dockZone: "float",
            position: { x: 300, y: 100 },
            size: { w: 640, h: 520 },
            minWidth: 420,
            minHeight: 320,
            openFullscreenOnce: true,
            onClose: onCloseTitleSystem,
            content: (
              <TitleUI
                isOpen={true}
                onClose={onCloseTitleSystem}
                gameState={gameState}
                variant="window"
                onEquip={onTitleEquip}
                onUnequip={onTitleUnequip}
                onPurchase={onTitlePurchase}
              />
            ),
          },
        ]
      : []),
    ...(showProfessions
      ? [
          {
            id: "craft",
            title: "Crafting",
            dockZone: "float",
            position: { x: 240, y: 180 },
            size: { w: 720, h: 560 },
            minWidth: 520,
            minHeight: 360,
            openFullscreenOnce: true,
            onClose: onCloseProfessions,
            content: (
              <ProfessionUI
                isOpen={true}
                onClose={onCloseProfessions}
                gameState={gameState}
                variant="window"
                onCraft={onCraft}
              />
            ),
          },
        ]
      : []),
    ...(showStatusOverlay
      ? [
          {
            id: "status",
            title: "Status",
            dockZone: "float",
            position: { x: 160, y: 160 },
            size: { w: 720, h: 560 },
            minWidth: 520,
            minHeight: 360,
            openFullscreenOnce: true,
            onClose: onCloseStatusOverlay,
            content: (
              <StatusOverlay
                player={player}
                world={gameState?.world}
                config={config}
                isOpen={true}
                onClose={onCloseStatusOverlay}
                variant="window"
                onAllocateAttribute={onAllocateAttribute}
                onDeallocateAttribute={onDeallocateAttribute}
                onEvolveSkill={onEvolveSkill}
                onFuseSkills={onFuseSkills}
                onEvolveClass={onEvolveClass}
                onEvolveRace={onEvolveRace}
                onStudySpell={onStudySpell}
              />
            ),
          },
        ]
      : []),
    ...(showSaveLoad
      ? [
          {
            id: "saveLoad",
            title: "Save / Load",
            dockZone: "float",
            position: { x: 200, y: 140 },
            size: { w: 720, h: 520 },
            minWidth: 520,
            minHeight: 360,
            openFullscreenOnce: true,
            onClose: onCloseSaveLoad,
            content: (
              <SaveLoadUI
                isOpen={true}
                onClose={onCloseSaveLoad}
                gameState={gameState}
                variant="window"
                onLoadState={onLoadState}
                addSystemMessage={addSystemMessage}
                user={user}
              />
            ),
          },
        ]
      : []),
    ...(showReplayInspector
      ? [
          {
            id: "replayInspector",
            title: "Replay Inspector",
            dockZone: "float",
            position: { x: 180, y: 120 },
            size: { w: 900, h: 620 },
            minWidth: 620,
            minHeight: 360,
            openFullscreenOnce: true,
            onClose: onCloseReplayInspector,
            content: <ReplayInspector gameState={gameState} />,
          },
        ]
      : []),
    ...(equipmentSelectSlot
      ? [
          {
            id: "equipmentSelect",
            title: `Select ${equipmentSelectLabel}`,
            dockZone: "float",
            position: { x: 240, y: 160 },
            size: { w: 520, h: 520 },
            minWidth: 360,
            minHeight: 320,
            onClose: onCloseEquipmentSelect,
            content: (
              <EquipmentSelectionPanel
                player={player}
                slotKey={equipmentSelectSlot}
                onEquipItem={onEquipItem}
                onUnequipItem={onUnequipItem}
                onEquipTitle={onEquipTitle}
                onUnequipTitle={onUnequipTitle}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <WindowManager
      mode="game"
      windows={windows}
      focusWindowRequest={focusWindowRequest}
      forceFloating={true}
    />
  );
}
