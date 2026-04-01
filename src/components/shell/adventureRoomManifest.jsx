import Bestiary from "../Bestiary.jsx";
import CombatUI from "../CombatUI.jsx";
import GachaUI from "../GachaUI.jsx";
import ProfessionUI from "../ProfessionUI.jsx";
import ReplayInspector from "../ReplayInspector.jsx";
import SaveLoadUI from "../SaveLoadUI.jsx";
import ShopUI from "../ShopUI.jsx";
import StatusOverlay from "../StatusOverlay.jsx";
import TitleUI from "../TitleUI.jsx";
import ArchetypeSystemPanel from "../ArchetypeSystemPanel.jsx";
import NarrativeHubPanel from "../../ui/panels/NarrativeHubPanel.jsx";
import QuestPanel from "../../ui/panels/QuestPanel.jsx";
import InventoryPanel from "../../ui/panels/InventoryPanel.jsx";
import EquipmentPanel from "../../ui/panels/EquipmentPanel.jsx";
import EquipmentSelectionPanel from "../../ui/panels/EquipmentSelectionPanel.jsx";
import CommandTerminalPanel from "../../ui/panels/CommandTerminalPanel.jsx";
import ActionSuggestionsPanel from "../../ui/panels/ActionSuggestionsPanel.jsx";

function RoomSection({ eyebrow, title, children }) {
  return (
    <section className="surface-section">
      <div className="surface-section__header">
        {eyebrow ? <div className="surface-section__eyebrow">{eyebrow}</div> : null}
        {title ? <h3 className="surface-section__title">{title}</h3> : null}
      </div>
      <div className="surface-section__body">{children}</div>
    </section>
  );
}

function BattleTheaterIdle({ combatState }) {
  const enemies = Array.isArray(combatState?.enemies)
    ? combatState.enemies.filter((enemy) => (enemy?.stats?.hp?.current || 0) > 0)
    : [];
  const enemyPreview = enemies
    .slice(0, 3)
    .map((enemy) => enemy?.name || "Unknown foe")
    .join(", ");

  return (
    <div className="atrium-room-idle">
      <div className="atrium-room-idle__eyebrow">Battle Theater</div>
      <h4 className="atrium-room-idle__title">No encounter is live</h4>
      <p className="atrium-room-idle__copy">
        The theater is primed, but no hostile pattern is currently bound to the atrium.
      </p>
      <div className="atrium-room-idle__metrics">
        <div>
          <span>Visible threat count</span>
          <strong>{enemies.length}</strong>
        </div>
        <div>
          <span>Tracked signatures</span>
          <strong>{enemyPreview || "None"}</strong>
        </div>
      </div>
    </div>
  );
}

export function buildAdventureRoomManifest({ view, quickActionsProps, isDevBuild = false }) {
  const {
    user,
    state,
    player,
    config,
    quests,
    combatState,
    narrative,
    command,
    surfaces,
    actions,
    system,
  } = view;

  const systemRooms = [
    {
      id: "status",
      title: "Status Scryglass",
      subtitle: "Read full attributes, systems, evolution lanes, and magical strain.",
      tone: "azure",
      entryAction: "Inspect status",
      size: "xl",
      group: "system",
      availability: true,
      isOpen: Boolean(surfaces.showStatusOverlay),
      onOpen: quickActionsProps.onToggleStatus,
      onClose: surfaces.handleCloseStatusOverlay,
      render: () => (
        <StatusOverlay
          player={player}
          world={state?.world}
          config={config}
          isOpen={true}
          onClose={surfaces.handleCloseStatusOverlay}
          variant="modal"
          onAllocateAttribute={actions.onAllocateAttribute}
          onDeallocateAttribute={actions.onDeallocateAttribute}
          onEvolveSkill={actions.onEvolveSkill}
          onFuseSkills={actions.onFuseSkills}
          onEvolveClass={actions.onEvolveClass}
          onEvolveRace={actions.onEvolveRace}
          onStudySpell={actions.onStudySpell}
          onOpenArchetypeSystem={surfaces.handleToggleArchetypeSystem}
        />
      ),
    },
    {
      id: "bestiary",
      title: "Bestiary Conservatory",
      subtitle: "Catalog witnessed enemies, relic drops, and recorded discoveries.",
      tone: "verdigris",
      entryAction: "Open conservatory",
      size: "xl",
      group: "system",
      availability: true,
      isOpen: Boolean(surfaces.showBestiary),
      onOpen: quickActionsProps.onToggleBestiary,
      onClose: surfaces.handleCloseBestiary,
      render: () => <Bestiary player={player} gameState={state} />,
    },
    {
      id: "system",
      title: "System Observatory",
      subtitle: "Inspect the active archetype system and its progression doctrine.",
      tone: "violet",
      entryAction: "Open observatory",
      size: "xl",
      group: "system",
      availability: true,
      isOpen: Boolean(surfaces.showArchetypeSystem),
      onOpen: quickActionsProps.onToggleArchetypeSystem,
      onClose: surfaces.handleCloseArchetypeSystem,
      render: () => <ArchetypeSystemPanel player={player} />,
    },
    {
      id: "titles",
      title: "Title Reliquary",
      subtitle: "Manage earned titles, ceremonial bonuses, and prestige loadouts.",
      tone: "gold",
      entryAction: "Open reliquary",
      size: "xl",
      group: "system",
      availability: true,
      isOpen: Boolean(surfaces.showTitleSystem),
      onOpen: quickActionsProps.onToggleTitles,
      onClose: surfaces.handleCloseTitleSystem,
      render: () => (
        <TitleUI
          isOpen={true}
          onClose={surfaces.handleCloseTitleSystem}
          gameState={state}
          onEquip={actions.onTitleEquip}
          onUnequip={actions.onTitleUnequip}
          onPurchase={actions.onTitlePurchase}
          variant="modal"
        />
      ),
    },
    {
      id: "craft",
      title: "Profession Workshop",
      subtitle: "Advance crafted output, recipes, and profession progression lanes.",
      tone: "ember",
      entryAction: "Open workshop",
      size: "xl",
      group: "system",
      availability: true,
      isOpen: Boolean(surfaces.showProfessions),
      onOpen: quickActionsProps.onToggleCraft,
      onClose: surfaces.handleCloseProfessions,
      render: () => (
        <ProfessionUI
          isOpen={true}
          onClose={surfaces.handleCloseProfessions}
          gameState={state}
          onCraft={actions.onCraft}
          variant="modal"
        />
      ),
    },
    {
      id: "shop",
      title: "Shop Caravan",
      subtitle: "Trade for consumables, upgrades, and expedition support.",
      tone: "gold",
      entryAction: "Enter caravan",
      size: "xl",
      group: "system",
      availability: true,
      isOpen: Boolean(surfaces.showShop),
      onOpen: quickActionsProps.onToggleShop,
      onClose: surfaces.handleCloseShop,
      render: () => (
        <ShopUI
          isOpen={true}
          onClose={surfaces.handleCloseShop}
          gameState={state}
          onPurchase={actions.onShopPurchase}
          variant="modal"
        />
      ),
    },
    {
      id: "gacha",
      title: "Gacha Constellarium",
      subtitle: "Invoke the lattice for randomized pulls and relic acquisition.",
      tone: "violet",
      entryAction: "Open constellarium",
      size: "xl",
      group: "system",
      availability: true,
      isOpen: Boolean(surfaces.showGacha),
      onOpen: quickActionsProps.onToggleGacha,
      onClose: surfaces.handleCloseGacha,
      render: () => (
        <GachaUI
          isOpen={true}
          onClose={surfaces.handleCloseGacha}
          gameState={state}
          onPull={actions.onGachaPull}
          variant="modal"
        />
      ),
    },
    {
      id: "save",
      title: "Save Vault",
      subtitle: "Preserve or restore the current chronicle thread.",
      tone: "azure",
      entryAction: "Open vault",
      size: "xl",
      group: "system",
      availability: true,
      isOpen: Boolean(surfaces.showSaveLoad),
      onOpen: quickActionsProps.onToggleSaveLoad,
      onClose: surfaces.handleCloseSaveLoad,
      render: () => (
        <SaveLoadUI
          isOpen={true}
          onClose={surfaces.handleCloseSaveLoad}
          gameState={state}
          variant="modal"
          onLoadState={system.onLoadState}
          addSystemMessage={system.addSystemMessage}
          user={user}
        />
      ),
    },
    {
      id: "replay",
      title: "Replay Observatory",
      subtitle: "Developer diagnostics for replay and sync inspection.",
      tone: "void",
      entryAction: "Inspect replay",
      size: "xl",
      group: "system",
      availability: Boolean(isDevBuild),
      isOpen: Boolean(isDevBuild && surfaces.showReplayInspector),
      onOpen: quickActionsProps.onToggleReplayInspector,
      onClose: surfaces.handleCloseReplayInspector,
      render: () => <ReplayInspector />,
    },
    {
      id: "equipmentSelect",
      title: `Loadout Detail // ${surfaces.equipmentSelectLabel}`,
      subtitle: "Compare compatible items and commit a new slot binding.",
      tone: "ember",
      entryAction: "Inspect slot",
      size: "lg",
      group: "system",
      availability: Boolean(surfaces.equipmentSelectSlot),
      isOpen: Boolean(surfaces.equipmentSelectSlot),
      onOpen: () => {},
      onClose: surfaces.handleCloseEquipmentSelect,
      render: () => (
        <EquipmentSelectionPanel
          player={player}
          slotKey={surfaces.equipmentSelectSlot}
          onEquipItem={actions.onEquipItem}
          onUnequipItem={actions.onUnequipItem}
          onEquipTitle={actions.onEquipTitle}
          onUnequipTitle={actions.onUnequipTitle}
        />
      ),
    },
  ];

  const primaryRooms = [
    {
      id: "chronicle",
      title: "Chronicle Archive",
      subtitle: "Review the latest narration, summary, and emotional telemetry.",
      tone: "azure",
      entryAction: "Open archive",
      size: "xl",
      group: "primary",
      availability: true,
      render: () => (
        <NarrativeHubPanel
          entries={narrative.entries}
          summary={narrative.summary}
          latestEntry={narrative.latestEntry}
          latestEntryText={narrative.latestEntryText}
          memoryRef={narrative.memoryRef}
          currentMood={narrative.currentMood}
        />
      ),
    },
    {
      id: "command",
      title: "Command Dais",
      subtitle: "Issue parser-safe intent and route the next move through the lattice.",
      tone: "gold",
      entryAction: "Open dais",
      size: "xl",
      group: "primary",
      availability: true,
      render: () => (
        <div className="atrium-room-stack">
          <RoomSection eyebrow="Command" title="What Do You Invoke?">
            <CommandTerminalPanel
              userInput={command.userInput}
              onInputChange={command.onInputChange}
              onSubmit={command.onSubmit}
              isLoading={command.isLoading}
              error={command.error}
              inputRef={command.inputRef}
            />
          </RoomSection>
          <RoomSection eyebrow="Suggestions" title="Parser-Safe Invocations">
            <ActionSuggestionsPanel
              suggestions={command.suggestions}
              onSelect={command.onSuggestionSelect}
            />
          </RoomSection>
        </div>
      ),
    },
    {
      id: "battle",
      title: "Battle Theater",
      subtitle: "Project live combat lanes, enemy pressure, and tactical actions.",
      tone: "ember",
      entryAction: "Enter theater",
      size: "xl",
      group: "primary",
      availability: true,
      render: () =>
        combatState?.status === "active" ? (
          <CombatUI
            combatState={combatState}
            playerState={player}
            onAttack={actions.onAttack}
            onUseSkill={actions.onUseSkill}
            onUseClassAbility={actions.onUseClassAbility}
            onUseRaceAbility={actions.onUseRaceAbility}
            onEscape={actions.onEscape}
            onSetCombatLane={actions.onSetCombatLane}
          />
        ) : (
          <BattleTheaterIdle combatState={combatState} />
        ),
    },
    {
      id: "inventory",
      title: "Inventory Vault",
      subtitle: "Inspect carried inventory, rarities, and expedition stock.",
      tone: "verdigris",
      entryAction: "Open vault",
      size: "lg",
      group: "primary",
      availability: true,
      render: () => <InventoryPanel inventory={player?.inventory || []} />,
    },
    {
      id: "quests",
      title: "Quest Codex",
      subtitle: "Track active directives, objectives, and lead chains.",
      tone: "violet",
      entryAction: "Open codex",
      size: "lg",
      group: "primary",
      availability: true,
      isOpen: Boolean(surfaces.showQuests),
      onClose: surfaces.handleCloseQuests,
      render: () => <QuestPanel quests={quests} />,
    },
    {
      id: "loadout",
      title: "Loadout Forge",
      subtitle: "Bind equipment slots and refine the active build.",
      tone: "ember",
      entryAction: "Open forge",
      size: "lg",
      group: "primary",
      availability: true,
      render: () => (
        <EquipmentPanel
          player={player}
          onSelectSlot={surfaces.handleOpenEquipmentSlot}
        />
      ),
    },
  ];

  return [...primaryRooms, ...systemRooms];
}

export function filterOpenAdventureRooms(roomManifest, activeRoomId) {
  return roomManifest.filter(
    (room) => room.availability && (room.isOpen || room.id === activeRoomId),
  );
}

export function splitAdventureRooms(roomManifest) {
  return {
    primaryRooms: roomManifest.filter(
      (room) => room.availability && room.group === "primary",
    ),
    systemRooms: roomManifest.filter(
      (room) =>
        room.availability &&
        room.group === "system" &&
        room.id !== "equipmentSelect",
    ),
  };
}
