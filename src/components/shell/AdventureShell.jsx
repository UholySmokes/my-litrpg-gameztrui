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

  const [activePortal, setActivePortal] = useState(null);
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
  const portalCards = [
    {
      id: "narrative",
      title: "Narrative Feed",
      eyebrow: "Story",
      copy: "Open the chronicle stream, recap summary, and mood telemetry.",
    },
    {
      id: "command",
      title: "Command Console",
      eyebrow: "Input",
      copy: "Issue parser-safe commands and drive the narrative engine.",
    },
    {
      id: "combat",
      title: "Combat Stage",
      eyebrow: "Battle",
      copy: "Launch the tactical encounter surface with abilities and lanes.",
    },
    {
      id: "inventory",
      title: "Inventory Matrix",
      eyebrow: "Items",
      copy: "Inspect carried gear, slots, and progression drops in detail.",
    },
    {
      id: "quests",
      title: "Quest Log",
      eyebrow: "Objectives",
      copy: "Review active directives, objectives, and progress trails.",
    },
    {
      id: "loadout",
      title: "Loadout Bay",
      eyebrow: "Equipment",
      copy: "Open equipment slots and tune your combat-ready build.",
    },
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

      <div className="adventure-shell__layout adventure-shell__layout--portal">
        <section className="adventure-shell__scene-card">
          <div className="adventure-shell__scene-copy">
            <div className="adventure-shell__scene-kicker">
              {zone?.name || "Unknown Zone"} / {location?.name || "Unknown Reach"}
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

        <section className="adventure-shell__portal-grid">
          {portalCards.map((portal) => (
            <button
              key={portal.id}
              type="button"
              className="adventure-shell__portal-card"
              onClick={() => setActivePortal(portal.id)}
            >
              <span>{portal.eyebrow}</span>
              <strong>{portal.title}</strong>
              <p>{portal.copy}</p>
            </button>
          ))}
        </section>

        <SurfaceSection eyebrow="Action Bank" title="Direct Controls">
          <GameQuickActions {...quickActionsProps} isDevBuild={isDevBuild} />
        </SurfaceSection>
      </div>

      <SurfaceDialog
        isOpen={activePortal === "narrative"}
        onClose={() => setActivePortal(null)}
        title="Narrative Feed"
        subtitle="Chronicle history, latest passage, and mood telemetry."
        size="xl"
      >
        <NarrativeHubPanel
          entries={narrative.entries}
          summary={narrative.summary}
          latestEntry={narrative.latestEntry}
          latestEntryText={narrative.latestEntryText}
          memoryRef={narrative.memoryRef}
          currentMood={narrative.currentMood}
        />
      </SurfaceDialog>

      <SurfaceDialog
        isOpen={activePortal === "command"}
        onClose={() => setActivePortal(null)}
        title="Command Console"
        subtitle="Issue intent, push parser-safe directives, and steer the run."
        size="xl"
      >
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
      </SurfaceDialog>

      <SurfaceDialog
        isOpen={activePortal === "combat"}
        onClose={() => setActivePortal(null)}
        title="Combat Stage"
        subtitle="Dedicated tactical viewport."
        size="xl"
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
          <CombatDrawerSummary combatState={combatState} />
        )}
      </SurfaceDialog>

      <SurfaceDialog
        isOpen={activePortal === "inventory"}
        onClose={() => setActivePortal(null)}
        title="Inventory Matrix"
        subtitle="Items, rarity, and progression stockpile."
      >
        <InventoryPanel inventory={player?.inventory || []} />
      </SurfaceDialog>

      <SurfaceDialog
        isOpen={activePortal === "quests"}
        onClose={() => setActivePortal(null)}
        title="Quest Log"
        subtitle="Track active directives and objective chains."
      >
        <QuestPanel quests={quests} />
      </SurfaceDialog>

      <SurfaceDialog
        isOpen={activePortal === "loadout"}
        onClose={() => setActivePortal(null)}
        title="Loadout Bay"
        subtitle="Manage equipped slots and combat setup."
      >
        <EquipmentPanel
          player={player}
          onSelectSlot={surfaces.handleOpenEquipmentSlot}
        />
      </SurfaceDialog>

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
