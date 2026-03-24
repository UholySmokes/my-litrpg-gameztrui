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
import GameQuickActions from "../gameui/GameQuickActions.jsx";
import NarrativeHubPanel from "../../ui/panels/NarrativeHubPanel.jsx";
import QuestPanel from "../../ui/panels/QuestPanel.jsx";
import VitalsPanel from "../../ui/panels/VitalsPanel.jsx";
import InventoryPanel from "../../ui/panels/InventoryPanel.jsx";
import EquipmentPanel from "../../ui/panels/EquipmentPanel.jsx";
import EquipmentSelectionPanel from "../../ui/panels/EquipmentSelectionPanel.jsx";
import CommandTerminalPanel from "../../ui/panels/CommandTerminalPanel.jsx";
import ActionSuggestionsPanel from "../../ui/panels/ActionSuggestionsPanel.jsx";
import { buildPlayerIdentity } from "./shellState.js";
import SurfaceDialog from "./SurfaceDialog.jsx";

function SurfaceSection({ eyebrow, title, children }) {
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

export default function AdventureShell({
  view,
  quickActionsProps,
  isDevBuild = false,
}) {
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

  const playerIdentity = buildPlayerIdentity(player);
  const isCombatActive = combatState?.status === "active";
  const profileLabel =
    user?.id === "local" ? "Local Chronicle" : user?.email || user?.id || "Bound Traveler";

  return (
    <section className="adventure-shell">
      <header className="adventure-shell__header">
        <div className="adventure-shell__brand">
          <div className="adventure-shell__eyebrow">Void-Verse // Adventure</div>
          <h2 className="adventure-shell__title">{playerIdentity.name}</h2>
          <div className="adventure-shell__meta">
            Level {playerIdentity.level} • {playerIdentity.race} • {playerIdentity.classLabel}
          </div>
        </div>

        <div className="adventure-shell__statusbar">
          <div className="adventure-shell__statuspill">
            <span>Profile</span>
            <strong>{profileLabel}</strong>
          </div>
          <div className="adventure-shell__statuspill">
            <span>Mood</span>
            <strong>{narrative.currentMood || "neutral"}</strong>
          </div>
          <div className="adventure-shell__statuspill">
            <span>System</span>
            <strong>{player?.archetypeSystem?.name || player?.archetypeSystem || "Unbound"}</strong>
          </div>
        </div>
      </header>

      <div className="adventure-shell__frame">
        <aside className="adventure-shell__rail adventure-shell__rail--left">
          <SurfaceSection eyebrow="Vitals" title="Combat Readiness">
            <VitalsPanel player={player} config={config} />
          </SurfaceSection>

          <SurfaceSection eyebrow="Loadout" title="Equipment">
            <EquipmentPanel
              player={player}
              onSelectSlot={surfaces.handleOpenEquipmentSlot}
            />
          </SurfaceSection>
        </aside>

        <main className="adventure-shell__main">
          <section className="adventure-shell__hero">
            <div className="adventure-shell__hero-copy">
              <div className="adventure-shell__hero-kicker">Current Chronicle</div>
              <div className="adventure-shell__hero-text">
                {narrative.latestEntryText || "The lattice waits for your first command."}
              </div>
              {narrative.summary ? (
                <div className="adventure-shell__hero-summary">{narrative.summary}</div>
              ) : null}
            </div>
            <div className="adventure-shell__hero-actions">
              <button
                type="button"
                className="holo-button"
                onClick={quickActionsProps.onToggleStatus}
              >
                Open Status
              </button>
              <button
                type="button"
                className="holo-button"
                onClick={quickActionsProps.onToggleSaveLoad}
              >
                Save / Load
              </button>
              <button
                type="button"
                className="holo-button holo-button--solid"
                onClick={quickActionsProps.onToggleQuests}
              >
                Journal
              </button>
            </div>
          </section>

          <SurfaceSection eyebrow="Narrative" title="Story Feed">
            <NarrativeHubPanel
              entries={narrative.entries}
              summary={narrative.summary}
              latestEntry={narrative.latestEntry}
              latestEntryText={narrative.latestEntryText}
              memoryRef={narrative.memoryRef}
              currentMood={narrative.currentMood}
            />
          </SurfaceSection>

          <div className="adventure-shell__command-grid">
            <SurfaceSection eyebrow="Command" title="Input">
              <CommandTerminalPanel
                userInput={command.userInput}
                onInputChange={command.onInputChange}
                onSubmit={command.onSubmit}
                isLoading={command.isLoading}
                error={command.error}
                inputRef={command.inputRef}
              />
            </SurfaceSection>

            <SurfaceSection eyebrow="Suggestions" title="Next Moves">
              <ActionSuggestionsPanel
                suggestions={command.suggestions}
                onSelect={command.onSuggestionSelect}
              />
            </SurfaceSection>
          </div>

          <SurfaceSection eyebrow="Actions" title="Battlefield Controls">
            <GameQuickActions
              {...quickActionsProps}
              isDevBuild={isDevBuild}
            />
          </SurfaceSection>
        </main>

        <aside className="adventure-shell__rail adventure-shell__rail--right">
          <SurfaceSection eyebrow="Supplies" title="Inventory">
            <InventoryPanel inventory={player?.inventory || []} />
          </SurfaceSection>

          <SurfaceSection eyebrow="Quests" title="Active Objectives">
            <QuestPanel quests={quests} />
          </SurfaceSection>

          <SurfaceSection
            eyebrow={isCombatActive ? "Combat" : "Field State"}
            title={isCombatActive ? "Encounter" : "Awaiting Contact"}
          >
            {isCombatActive ? (
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
              <div className="adventure-shell__quiet-state">
                No active combat. Issue a command, scout the world, or open a subsystem
                to prepare your next move.
              </div>
            )}
          </SurfaceSection>
        </aside>
      </div>

      <SurfaceDialog
        isOpen={surfaces.showQuests}
        onClose={surfaces.handleCloseQuests}
        title="Quest Journal"
        subtitle="Track active objectives and current narrative leads."
      >
        <QuestPanel quests={quests} />
      </SurfaceDialog>

      <SurfaceDialog
        isOpen={surfaces.showBestiary}
        onClose={surfaces.handleCloseBestiary}
        title="Collection Tracker"
        subtitle="Enemies, items, and title discoveries logged by the lattice."
      >
        <Bestiary player={player} gameState={state} />
      </SurfaceDialog>

      <SurfaceDialog
        isOpen={surfaces.showArchetypeSystem}
        onClose={surfaces.handleCloseArchetypeSystem}
        title="System Profile"
        subtitle="Inspect the active canon system bound to this character."
        size="xl"
      >
        <ArchetypeSystemPanel player={player} />
      </SurfaceDialog>

      <SurfaceDialog
        isOpen={Boolean(surfaces.equipmentSelectSlot)}
        onClose={surfaces.handleCloseEquipmentSelect}
        title={`Select ${surfaces.equipmentSelectLabel}`}
        subtitle="Compare compatible items and update your current loadout."
      >
        <EquipmentSelectionPanel
          player={player}
          slotKey={surfaces.equipmentSelectSlot}
          onEquipItem={actions.onEquipItem}
          onUnequipItem={actions.onUnequipItem}
          onEquipTitle={actions.onEquipTitle}
          onUnequipTitle={actions.onUnequipTitle}
        />
      </SurfaceDialog>

      <ShopUI
        isOpen={surfaces.showShop}
        onClose={surfaces.handleCloseShop}
        gameState={state}
        onPurchase={actions.onShopPurchase}
        variant="modal"
      />

      <GachaUI
        isOpen={surfaces.showGacha}
        onClose={surfaces.handleCloseGacha}
        gameState={state}
        onPull={actions.onGachaPull}
        variant="modal"
      />

      <TitleUI
        isOpen={surfaces.showTitleSystem}
        onClose={surfaces.handleCloseTitleSystem}
        gameState={state}
        onEquip={actions.onTitleEquip}
        onUnequip={actions.onTitleUnequip}
        onPurchase={actions.onTitlePurchase}
        variant="modal"
      />

      <ProfessionUI
        isOpen={surfaces.showProfessions}
        onClose={surfaces.handleCloseProfessions}
        gameState={state}
        onCraft={actions.onCraft}
        variant="modal"
      />

      <StatusOverlay
        player={player}
        world={state?.world}
        config={config}
        isOpen={surfaces.showStatusOverlay}
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

      <SaveLoadUI
        isOpen={surfaces.showSaveLoad}
        onClose={surfaces.handleCloseSaveLoad}
        gameState={state}
        variant="modal"
        onLoadState={system.onLoadState}
        addSystemMessage={system.addSystemMessage}
        user={user}
      />

      {isDevBuild ? (
        <SurfaceDialog
          isOpen={surfaces.showReplayInspector}
          onClose={surfaces.handleCloseReplayInspector}
          title="Replay Inspector"
          subtitle="Developer replay and sync timeline diagnostics."
          size="xl"
        >
          <ReplayInspector gameState={state} />
        </SurfaceDialog>
      ) : null}
    </section>
  );
}
