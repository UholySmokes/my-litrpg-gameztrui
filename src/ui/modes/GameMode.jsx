import WindowManager from "../windowing/WindowManager.jsx";
import VitalsPanel from "../panels/VitalsPanel.jsx";
import EquipmentPanel from "../panels/EquipmentPanel.jsx";
import InventoryPanel from "../panels/InventoryPanel.jsx";
import StatusEffectsPanel from "../panels/StatusEffectsPanel.jsx";
import NarrativeLogPanel from "../panels/NarrativeLogPanel.jsx";
import CommandTerminalPanel from "../panels/CommandTerminalPanel.jsx";
import ActionSuggestionsPanel from "../panels/ActionSuggestionsPanel.jsx";
import NarrativeMemoryPanel from "../panels/NarrativeMemoryPanel.jsx";
import QuestPanel from "../panels/QuestPanel.jsx";
import CombatUI from "../../components/CombatUI.jsx";
import ShopUI from "../../components/ShopUI.jsx";
import GachaUI from "../../components/GachaUI.jsx";
import TitleUI from "../../components/TitleUI.jsx";
import ProfessionUI from "../../components/ProfessionUI.jsx";
import StatusOverlay from "../../components/StatusOverlay.jsx";
import SaveLoadUI from "../../components/SaveLoadUI.jsx";

export default function GameMode({
  player,
  config,
  gameState,
  chatLog,
  userInput,
  onInputChange,
  onSubmit,
  isLoading,
  suggestions,
  onSuggestionSelect,
  inputRef,
  narrativeSummary,
  narrativeEntries,
  latestEntry,
  latestEntryText,
  narrativeMemoryRef,
  onScrollUp,
  onScrollDown,
  quests,
  combatState,
  onAttack,
  onUseSkill,
  onEscape,
  showShop = false,
  showGacha = false,
  showTitleSystem = false,
  showProfessions = false,
  showStatusOverlay = false,
  showSaveLoad = false,
  onCloseShop = () => {},
  onCloseGacha = () => {},
  onCloseTitleSystem = () => {},
  onCloseProfessions = () => {},
  onCloseStatusOverlay = () => {},
  onCloseSaveLoad = () => {},
  showQuests = false,
  onCloseQuests = () => {},
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
  onLoadState = () => {},
  addSystemMessage = () => {},
  user = null,
  focusWindowRequest = null,
}) {
  const windows = [
    {
      id: "vitals",
      title: "Vitals",
      dockZone: "left",
      minWidth: 260,
      minHeight: 180,
      content: <VitalsPanel player={player} config={config} />,
    },
    {
      id: "equipment",
      title: "Equipment",
      dockZone: "left",
      minWidth: 260,
      minHeight: 180,
      content: <EquipmentPanel player={player} />,
    },
    {
      id: "inventory",
      title: "Inventory",
      dockZone: "left",
      minWidth: 260,
      minHeight: 180,
      content: <InventoryPanel inventory={player?.inventory || []} />,
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
      id: "narrativeLog",
      title: "Narrative Log",
      dockZone: "center",
      minWidth: 420,
      minHeight: 240,
      content: <NarrativeLogPanel chatLog={chatLog} />,
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
    {
      id: "narrativeMemory",
      title: "Narrative Memory",
      dockZone: "right",
      lockDockZone: "right",
      allowRightDock: true,
      allowDockCompact: true,
      compactLabel: "MEM",
      minWidth: 320,
      minHeight: 240,
      content: (
        <NarrativeMemoryPanel
          summary={narrativeSummary}
          entries={narrativeEntries}
          latestEntry={latestEntry}
          latestEntryText={latestEntryText}
          containerRef={narrativeMemoryRef}
          onScrollUp={onScrollUp}
          onScrollDown={onScrollDown}
        />
      ),
    },
    ...(showQuests
      ? [
          {
            id: "quests",
            title: "Quests",
            dockZone: "float",
            position: { x: 420, y: 100 },
            size: { w: 420, h: 380 },
            minWidth: 320,
            minHeight: 240,
            onClose: onCloseQuests,
            content: <QuestPanel quests={quests} />,
          },
        ]
      : []),
    {
      id: "combat",
      title: "Combat",
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
            onClose: onCloseStatusOverlay,
            content: (
              <StatusOverlay
                player={player}
                config={config}
                isOpen={true}
                onClose={onCloseStatusOverlay}
                variant="window"
                onAllocateAttribute={onAllocateAttribute}
                onDeallocateAttribute={onDeallocateAttribute}
                onEvolveSkill={onEvolveSkill}
                onFuseSkills={onFuseSkills}
                onEvolveClass={onEvolveClass}
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
