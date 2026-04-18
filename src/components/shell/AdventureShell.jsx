import { useEffect, useMemo, useRef, useState } from "react";
import ProgressBar from "../../ui/ProgressBar.jsx";
import GameQuickActions from "../gameui/GameQuickActions.jsx";
import {
  DEFAULT_START_LOCATION_ID,
  getLocationById,
  getZoneById,
} from "../../world/WorldDataRegistry.js";
import { buildPlayerIdentity } from "./shellState.js";
import SurfaceDialog from "./SurfaceDialog.jsx";
import CommandTerminalPanel from "../../ui/panels/CommandTerminalPanel.jsx";
import ActionSuggestionsPanel from "../../ui/panels/ActionSuggestionsPanel.jsx";
import {
  buildAdventureRoomManifest,
  filterOpenAdventureRooms,
  splitAdventureRooms,
} from "./adventureRoomManifest.jsx";
import { buildArchetypeSystemViewModel } from "../archetypeSystem/archetypeSystemViewModel.js";
import {
  deriveAdventureOnboardingTier,
  getAdventureOnboardingContext,
} from "../../core/creationOnboarding.js";

function formatMeter(current, max) {
  return `${Number(current || 0)}/${Number(max || 0)}`;
}

function resolvePrimaryObjective(quests) {
  const activeQuests = Array.isArray(quests?.active) ? quests.active : [];
  const primaryQuest = activeQuests[0];
  if (!primaryQuest) {
    return {
      questName: "No active directive",
      objectiveText: "Roam, study the field, and choose which archive wing to disturb next.",
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

function ArchiveFacet({ label, value, note }) {
  return (
    <div className="archive-facet">
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <em>{note}</em> : null}
    </div>
  );
}

function summarizeOathText(player) {
  const raw =
    typeof player?.startingPrompt === "string"
      ? player.startingPrompt
      : player?.characterCreationBlueprint?.startingPrompt;
  const text = String(raw || "").trim();
  if (!text) return "Unsealed";
  if (text.length <= 42) return text;
  return `${text.slice(0, 39).trimEnd()}...`;
}

function RoomGateway({ room, onOpen, compact = false }) {
  return (
    <button
      type="button"
      className={[
        compact ? "archive-system-gateway" : "archive-room-gateway",
        room.tone ? `archive-room-gateway--${room.tone}` : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onOpen}
    >
      <span>{room.entryAction}</span>
      <strong>{room.title}</strong>
      <p>{room.subtitle}</p>
    </button>
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
    quests,
    combatState,
    narrative,
    command,
    system,
  } = view;
  const [activeRoomId, setActiveRoomId] = useState(null);
  const previousCombatStatusRef = useRef(null);

  const playerIdentity = buildPlayerIdentity(player);
  const profileLabel =
    user?.id === "local" ? "Local Chronicle" : user?.email || user?.id || "Bound Traveler";
  const locationId =
    typeof state?.world?.location === "string"
      ? state.world.location
      : state?.world?.location?.current || DEFAULT_START_LOCATION_ID;
  const location = getLocationById(locationId);
  const zone = getZoneById(location?.zoneId);
  const objective = useMemo(() => resolvePrimaryObjective(quests), [quests]);
  const archetypeView = useMemo(() => buildArchetypeSystemViewModel(player), [player]);
  const onboardingTier = useMemo(
    () => deriveAdventureOnboardingTier({ state, player, quests }),
    [player, quests, state],
  );
  const onboardingContext = useMemo(
    () => getAdventureOnboardingContext({ state, player, quests }),
    [player, quests, state],
  );
  const temporaryEffectCount = Array.isArray(player?.statusEffects)
    ? player.statusEffects.length
    : 0;
  const identityBadges = useMemo(
    () => [
      {
        label: "Origin",
        value:
          player?.oathOrigin?.name || player?.origin?.name || playerIdentity.race,
        tone: "identity",
      },
      {
        label: "Class",
        value: playerIdentity.classLabel,
        tone: "identity",
      },
      {
        label: "Invocation",
        value: summarizeOathText(player),
        tone: "identity",
      },
      {
        label: "System",
        value: archetypeView?.name || player?.archetypeSystem?.name || "Core path",
        tone: "identity",
      },
      {
        label: "Flux",
        value: temporaryEffectCount > 0 ? `${temporaryEffectCount} active` : "Stable",
        tone: temporaryEffectCount > 0 ? "ember" : "identity",
      },
    ],
    [
      archetypeView?.name,
      player,
      playerIdentity.classLabel,
      playerIdentity.race,
      temporaryEffectCount,
    ],
  );


const topMeters = [
    { label: "HP", current: player?.hp?.current ?? 0, max: player?.hp?.max ?? 1, color: '#ef4444', tooltip: 'Health - Damage brings you closer to archive ejection' },
    { label: "MP", current: player?.mana?.current ?? 0, max: player?.mana?.max ?? 1, color: '#3b82f6', tooltip: 'Mana - Archive weave energy' },
    { label: "XP", current: player?.xp?.current ?? 0, max: player?.xp?.max ?? 1, color: '#eab308', tooltip: 'Experience - Progress toward milestone thresholds' },
  ];
  if (onboardingTier >= 2) {
    const gold = player?.currency?.goldCoins ?? player?.player?.gold ?? 0;
    topMeters.push({
      label: "Gold",
      current: gold,
      max: 999999,
      color: '#f59e0b',
      tooltip: 'Gold coins - Trade medium for rare matrices and services'
    });
  }
  if (archetypeView?.resource) {
    topMeters.push({
      label: archetypeView.resource.name,
      current: archetypeView.resource.current,
      max: archetypeView.resource.max,
      color: '#8b5cf6',
      tooltip: `${archetypeView.resource.name} - ${archetypeView.resource.desc || 'System resource'}`
    });
  }

  const roomManifest = useMemo(
    () => buildAdventureRoomManifest({ view, quickActionsProps, isDevBuild }),
    [isDevBuild, quickActionsProps, view],
  );
  const { primaryRooms, systemRooms } = useMemo(
    () => splitAdventureRooms(roomManifest),
    [roomManifest],
  );
  const openRooms = useMemo(
    () => filterOpenAdventureRooms(roomManifest, activeRoomId),
    [activeRoomId, roomManifest],
  );

  const latestPassage = narrative.latestEntryText || "The archive waits for your next move.";
  const combatStatus =
    combatState?.status === "active"
      ? `${Array.isArray(combatState?.enemies) ? combatState.enemies.length : 0} threats stirring`
      : "Field quiet";
  const currentPressure = onboardingContext?.active
    ? {
        title:
          onboardingContext?.currentStep?.questTemplate?.name ||
          objective.questName,
        text:
          onboardingContext?.currentStep?.questTemplate?.description ||
          objective.objectiveText,
        progressLabel: `${onboardingContext.completedStepIds.length + 1}/3`,
      }
    : null;
  const onboardingNote =
    onboardingTier < 2
      ? "Level 1 marks arrival, not the first earned milestone. Reach 100 XP to claim Level 2."
      : onboardingTier < 3
        ? "Your tools are opening. Review the build, clear one live pressure point, and lock in the first earned step."
        : "The archive has widened. Push deeper directives or reopen any sealed wing.";

  useEffect(() => {
    const currentStatus = combatState?.status || "inactive";
    const previousStatus = previousCombatStatusRef.current;
    if (currentStatus === "active" && previousStatus !== "active") {
      setActiveRoomId((current) => (current === "battle" ? current : "battle"));
    }
    previousCombatStatusRef.current = currentStatus;
  }, [combatState?.status]);

  const handleOpenRoom = (room) => {
    if (room.group === "system") {
      room.onOpen?.();
      return;
    }
    room.onOpen?.();
    setActiveRoomId(room.id);
  };

  const handleCloseRoom = (room) => {
    if (room.group === "system") {
      room.onClose?.();
      return;
    }
    if (room.isOpen && typeof room.onClose === "function") {
      room.onClose();
    }
    setActiveRoomId((current) => (current === room.id ? null : current));
  };

  return (
    <section className="adventure-shell adventure-shell--archive">
      <header className="adventure-shell__topbar adventure-shell__topbar--archive anime-slide-down">
        <div className="adventure-shell__brand">
          <div className="adventure-shell__eyebrow anime-shimmer">The Archive</div>
          <h2 className="adventure-shell__title">{playerIdentity.name}</h2>
          <div className="adventure-shell__meta">
            Level {playerIdentity.level} {playerIdentity.race} {playerIdentity.classLabel}
          </div>
        </div>

        <div className="archive-facet-strip anime-stagger">
          <ArchiveFacet label="Profile" value={profileLabel} />
          <ArchiveFacet label="Landing" value={location?.name || "Unknown Reach"} />
          <ArchiveFacet label="Reach" value={zone?.name || location?.zoneId || "Unmapped"} />
          <ArchiveFacet label="Mood" value={narrative.currentMood || "neutral"} />
        </div>
      </header>

      <div className="archive-layout">
        <section className="archive-portal anime-slide-up">
          <div className="archive-portal__sigil-column" aria-hidden="true">
            <div className="archive-portal__ring">
              <div className="archive-portal__ring-middle">
                <div className="archive-portal__ring-core">
                  <span>{zone?.name || "Unknown Zone"}</span>
                  <strong>{location?.name || "Unknown Reach"}</strong>
                  <em>{playerIdentity.classLabel}</em>
                </div>
              </div>
            </div>
          </div>

          <div className="archive-portal__copy">
            <div className="archive-portal__kicker">
              {zone?.name || "Unknown Zone"} / {location?.name || "Unknown Reach"}
            </div>
            <h3 className="archive-portal__title">{objective.questName}</h3>
            <p className="archive-portal__objective">{objective.objectiveText}</p>

            <div className="archive-badge-row">
              {identityBadges.map((badge) => (
                <span
                  key={`${badge.label}-${badge.value}`}
                  className={[
                    "archive-badge",
                    badge.tone === "ember" ? "archive-badge--ember" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <strong>{badge.label}</strong>
                  <span>{badge.value}</span>
                </span>
              ))}
            </div>

            <p className="archive-portal__note">{onboardingNote}</p>
          </div>
        </section>

        <aside className="archive-sidecar">
          <section className="archive-sidecar__panel">
            <div className="adventure-shell__eyebrow">Pressure Thread</div>
            <h3 className="surface-section__title">Current weave</h3>
            {currentPressure ? (
              <div className="archive-pressure-card">
                <div className="archive-pressure-card__row">
                  <strong>{currentPressure.title}</strong>
                  <span>Step {currentPressure.progressLabel}</span>
                </div>
                <p>{currentPressure.text}</p>
              </div>
            ) : (
              <div className="archive-pressure-card archive-pressure-card--quiet">
                <strong>No live onboarding thread</strong>
                <p>Roam the archive wings, read the field, and choose which directive to disturb next.</p>
              </div>
            )}
          </section>

          <section className="archive-sidecar__panel">
            <div className="adventure-shell__eyebrow">Vital Readout</div>
            <h3 className="surface-section__title">Current reserves</h3>
<div className="archive-meter-grid">
              {topMeters.map((meter) => (
                <ProgressBar 
                  key={meter.label}
                  current={meter.current}
                  max={meter.max}
                  label={meter.label}
                  color={meter.color}
                  tooltip={meter.tooltip}
                />
              ))}
            </div>
          </section>
        </aside>

        <section className="archive-console">
          <div className="archive-console__header">
            <div>
              <div className="adventure-shell__eyebrow">Oracle Dais</div>
              <h3 className="surface-section__title">Issue the next move and study the latest echo</h3>
            </div>
            <div className="archive-console__status">{combatStatus}</div>
          </div>

          <div className="archive-console__passage anime-pulse">{latestPassage}</div>

          <div className="archive-console__timeline">
            <CommandTerminalPanel
              userInput={command?.userInput}
              onInputChange={command?.onInputChange}
              onSubmit={command?.onSubmit}
              isLoading={command?.isLoading}
              error={command?.error}
              inputRef={command?.inputRef}
              placeholder={`What do you do in ${location?.name || zone?.name || "this place"}?`}
            />
            <ActionSuggestionsPanel
              suggestions={command?.suggestions}
              onSelect={command?.onSuggestionSelect}
            />
          </div>
        </section>

        <section className="archive-room-cluster">
          <div className="archive-cluster__header">
            <div className="adventure-shell__eyebrow">Primary Wings</div>
            <h3 className="surface-section__title">Open the central chambers</h3>
          </div>
          <div className="archive-room-grid anime-stagger">
            {primaryRooms.map((room) => (
              <RoomGateway
                key={room.id}
                room={room}
                onOpen={() => handleOpenRoom(room)}
              />
            ))}
          </div>
        </section>

        <section className="archive-systems-cluster">
          <div className="archive-cluster__header">
            <div className="adventure-shell__eyebrow">Auxiliary Annex</div>
            <h3 className="surface-section__title">Support rooms and sealed records</h3>
          </div>
          <div className="archive-systems-grid anime-stagger">
            {systemRooms.map((room) => (
              <RoomGateway
                key={room.id}
                room={room}
                compact={true}
                onOpen={() => handleOpenRoom(room)}
              />
            ))}
          </div>
        </section>

        <section className="archive-actions">
          <div className="archive-cluster__header">
            <div className="adventure-shell__eyebrow">Immediate Sigils</div>
            <h3 className="surface-section__title">Act without leaving the floor</h3>
          </div>
          <GameQuickActions
            {...quickActionsProps}
            isDevBuild={isDevBuild}
            onboardingTier={onboardingTier}
            onOpenInventory={() => setActiveRoomId("inventory")}
            onTrackUiAction={system?.trackUiAction}
          />
        </section>
      </div>

      {openRooms.map((room) => (
        <SurfaceDialog
          key={room.id}
          isOpen={true}
          onClose={() => handleCloseRoom(room)}
          title={room.title}
          subtitle={room.subtitle}
          size={room.size}
          tone={room.tone}
          fullscreen={true}
        >
          {room.render()}
        </SurfaceDialog>
      ))}
    </section>
  );
}
