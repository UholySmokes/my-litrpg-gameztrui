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

export default function GameMode({
  player,
  config,
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
    {
      id: "quests",
      title: "Active Quests",
      dockZone: "float",
      position: { x: 540, y: 120 },
      size: { w: 320, h: 380 },
      minWidth: 280,
      minHeight: 240,
      content: <QuestPanel quests={quests} />,
    },
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
  ];

  return <WindowManager mode="game" windows={windows} />;
}
