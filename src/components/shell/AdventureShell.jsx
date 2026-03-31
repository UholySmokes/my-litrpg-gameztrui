import { useMemo, useState } from "react";
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
import InventoryPanel from "../../ui/panels/InventoryPanel.jsx";
import EquipmentPanel from "../../ui/panels/EquipmentPanel.jsx";
import EquipmentSelectionPanel from "../../ui/panels/EquipmentSelectionPanel.jsx";
import CommandTerminalPanel from "../../ui/panels/CommandTerminalPanel.jsx";
import ActionSuggestionsPanel from "../../ui/panels/ActionSuggestionsPanel.jsx";
import { getLocationById, getZoneById } from "../../world/WorldDataRegistry.js";
import { buildPlayerIdentity } from "./shellState.js";
import SurfaceDialog from "./SurfaceDialog.jsx";

function SurfaceSection({ eyebrow, title, children, className = "" }) {
  return (
    <section className={`surface-section ${className}`.trim()}>
      <div className="surface-section__header">
        {eyebrow ? <div className="surface-section__eyebrow">{eyebrow}</div> : null}
        {title ? <h3 className="surface-section__title">{title}</h3> : null}
      </div>
      <div className="surface-section__body">{children}</div>
    </section>
  );
}

function formatMeter(current, max) {
  return `${Number(current || 0)}/${Number(max || 0)}`;
}

function resolvePrimaryObjective(quests) {
  const activeQuests = Array.isArray(quests?.active) ? quests.active : [];
  const primaryQuest = activeQuests[0];
  if (!primaryQuest) {
    return {
      questName: "No active directive",
      objectiveText: "Roam, study the field, and choose your next move.",
    };
  }

  const nextObjective = Array.isArray(primaryQuest.objectives)
    ? primaryQuest.objectives.find((objective) => !objective?.completed)
    : null;

  return {
    questName: primaryQuest.name || "Primary Directive",
    objectiveText:
      nextObjective?.description ||
      primaryQuest.description ||
      "Advance the current directive.",
  };
}

function CombatDrawerSummary({ combatState }) {
  const enemies = Array.isArray(combatState?.enemies)
    ? combatState.enemies.filter((enemy) => (enemy?.stats?.hp?.current || 0) > 0)
    : [];
  const enemyPreview = enemies
    .slice(0, 3)
    .map((enemy) => enemy?.name || "Unknown foe")
    .join(", ");
  const playerLane = Number.isFinite(combatState?.lanes?.player)
    ? combatState.lanes.player
    : 1;

  return (
    <div className="adventure-shell__combat-drawer">
      <div className="adventure-shell__combat-drawer-label">Combat Focus</div>
      <h4 className="adventure-shell__combat-drawer-title">
        {enemies.length} hostile {enemies.length === 1 ? "signature" : "signatures"} locked
      </h4>
      <p className="adventure-shell__combat-drawer-copy">
        Use the center stage for targeting and abilities. The drawer stays compact so the
        battlefield remains readable.
      </p>
      <div className="adventure-shell__combat-drawer-stat">
        <span>Frontline</span>
        <strong>Lane {playerLane}</strong>
      </div>
      <div className="adventure-shell__combat-drawer-stat">
        <span>Enemies</span>
        <strong>{enemyPreview || "No visible targets"}</strong>
      </div>
    </div>
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

  const [drawerTab, setDrawerTab] = useState(
    combatState?.status === "active" ? "combat" : "quests",
  );
  const playerIdentity = buildPlayerIdentity(player);
  const isCombatActive = combatState?.status === "active";
  const profileLabel =
    user?.id === "local" ? "Local Chronicle" : user?.email || user?.id || "Bound Traveler";
  const locationId =
    typeof state?.world?.location === "string"
      ? state.world.location
      : state?.world?.location?.current || "starting_zone";
  const location = getLocationById(locationId);
  const zone = getZoneById(location?.zoneId);
  const objective = useMemo(() => resolvePrimaryObjective(quests), [quests]);
  const topMeters = [
    { label: "HP", value: formatMeter(player?.hp?.current, player?.hp?.max) },
    { label: "MP", value: formatMeter(player?.mana?.current, player?.mana?.max) },
    { label: "XP", value: formatMeter(player?.xp?.current, player?.xp?.max) },
    { label: "Gold", value: String(player?.currency?.goldCoins ?? player?.gold ?? 0) },
  ];

  return (
    <section className="adventure-shell">
      <header className="adventure-shell__topbar">
        <div className="adventure-shell__brand">
          <div className="adventure-shell__eyebrow">Tactical Chronicle</div>
          <h2 className="adventure-shell__title">{playerIdentity.name}</h2>
          <div className="adventure-shell__meta">
            Level {playerIdentity.level} {playerIdentity.race} {playerIdentity.classLabel}
          </div>
        </div>

        <div className="adventure-shell__statusstrip">
          <div className="adventure-shell__statuscard">
            <span>Profile</span>
            <strong>{profileLabel}</strong>
          </div>
          <div className="adventure-shell__statuscard">
            <span>Location</span>
            <strong>{location?.name || "Unknown Reach"}</strong>
          </div>
          <div className="adventure-shell__statuscard">
            <span>Zone</span>
            <strong>{zone?.name || location?.zoneId || "Unmapped"}</strong>
          </div>
          <div className="adventure-shell__statuscard">
            <span>Mood</span>
            <strong>{narrative.currentMood || "neutral"}</strong>
          </div>
        </div>
      </header>

      <div className="adventure-shell__layout">
        <aside className="adventure-shell__journal">
          <SurfaceSection eyebrow="Chronicle" title="Latest Passage" className="adventure-shell__passage">
            <div className="adventure-shell__passage-text">
              {narrative.latestEntryText || "The lattice waits for your first command."}
            </div>
            {narrative.summary ? (
              <div className="adventure-shell__passage-summary">{narrative.summary}</div>
            ) : null}
          </SurfaceSection>

          <SurfaceSection eyebrow="Narrative" title="Story Feed" className="adventure-shell__feed">
            <NarrativeHubPanel
              entries={narrative.entries}
              summary={narrative.summary}
              latestEntry={narrative.latestEntry}
              latestEntryText={narrative.latestEntryText}
              memoryRef={narrative.memoryRef}
              currentMood={narrative.currentMood}
            />
          </SurfaceSection>

          <SurfaceSection eyebrow="Command" title="What Do You Do?">
            <CommandTerminalPanel
              userInput={command.userInput}
              onInputChange={command.onInputChange}
              onSubmit={command.onSubmit}
              isLoading={command.isLoading}
              error={command.error}
              inputRef={command.inputRef}
            />
          </SurfaceSection>

          <SurfaceSection eyebrow="Suggested" title="Parser-Safe Moves">
            <ActionSuggestionsPanel
              suggestions={command.suggestions}
              onSelect={command.onSuggestionSelect}
            />
          </SurfaceSection>
        </aside>

        <main className="adventure-shell__stage">
          <section className="adventure-shell__scene-card">
            <div className="adventure-shell__scene-copy">
              <div className="adventure-shell__scene-kicker">
                {zone?.name || "Unknown Zone"} · {location?.name || "Unknown Reach"}
              </div>
              <h3 className="adventure-shell__scene-title">{objective.questName}</h3>
              <p className="adventure-shell__scene-objective">{objective.objectiveText}</p>
            </div>

            <div className="adventure-shell__scene-meters">
              {topMeters.map((meter) => (
                <div key={meter.label} className="adventure-shell__meter">
                  <span>{meter.label}</span>
                  <strong>{meter.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section
            className={`adventure-shell__battle-stage ${
              isCombatActive ? "adventure-shell__battle-stage--combat" : ""
            }`}
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
              <div className="adventure-shell__quiet-stage">
                <div className="adventure-shell__quiet-title">Field State Stable</div>
                <p>
                  No encounter is active. Push into a new route, inspect the terrain, or
                  prepare your build before the next clash.
                </p>
                <div className="adventure-shell__quiet-actions">
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
              </div>
            )}
          </section>

          <SurfaceSection eyebrow="Action Bank" title="Direct Controls">
            <GameQuickActions {...quickActionsProps} isDevBuild={isDevBuild} />
          </SurfaceSection>
        </main>

        <aside className="adventure-shell__drawer">
          <div className="adventure-shell__drawer-tabs">
            {[
              { id: "combat", label: "Combat" },
              { id: "inventory", label: "Inventory" },
              { id: "quests", label: "Quest Log" },
              { id: "loadout", label: "Loadout" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`adventure-shell__drawer-tab ${
                  drawerTab === tab.id ? "adventure-shell__drawer-tab--active" : ""
                }`}
                onClick={() => setDrawerTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="adventure-shell__drawer-body">
            {drawerTab === "combat" ? (
              isCombatActive ? (
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
                <div className="adventure-shell__drawer-empty">
                  Combat controls appear here when an encounter begins.
                </div>
              )
            ) : null}

            {drawerTab === "inventory" ? (
              <InventoryPanel inventory={player?.inventory || []} />
            ) : null}

            {drawerTab === "quests" ? <QuestPanel quests={quests} /> : null}

            {drawerTab === "loadout" ? (
              <EquipmentPanel
                player={player}
                onSelectSlot={surfaces.handleOpenEquipmentSlot}
              />
            ) : null}
          </div>
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
          <ReplayInspector />
        </SurfaceDialog>
      ) : null}
    </section>
  );
}
