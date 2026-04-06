import { useEffect, useMemo, useRef, useState } from "react";
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

function formatMeter(current, max) {
  return `${Number(current || 0)}/${Number(max || 0)}`;
}

function resolvePrimaryObjective(quests) {
  const activeQuests = Array.isArray(quests?.active) ? quests.active : [];
  const primaryQuest = activeQuests[0];
  if (!primaryQuest) {
    return {
      questName: "No active directive",
      objectiveText: "Roam, study the field, and choose the next ritual gate.",
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

function AtriumCard({ title, label, value }) {
  return (
    <div className="atrium-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {title ? <em>{title}</em> : null}
    </div>
  );
}

function RoomGateway({ room, onOpen, compact = false }) {
  return (
    <button
      type="button"
      className={[
        compact ? "atrium-system-gateway" : "atrium-room-gateway",
        room.tone ? `atrium-room-gateway--${room.tone}` : "",
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
  const topMeters = [
    { label: "HP", value: formatMeter(player?.hp?.current, player?.hp?.max) },
    { label: "MP", value: formatMeter(player?.mana?.current, player?.mana?.max) },
    { label: "XP", value: formatMeter(player?.xp?.current, player?.xp?.max) },
    { label: "Gold", value: String(player?.currency?.goldCoins ?? player?.gold ?? 0) },
  ];

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

  const latestPassage = narrative.latestEntryText || "The lattice waits for your next move.";
  const combatStatus =
    combatState?.status === "active"
      ? `${Array.isArray(combatState?.enemies) ? combatState.enemies.length : 0} threats`
      : "Quiet field";

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
    <section className="adventure-shell adventure-shell--atrium">
      <header className="adventure-shell__topbar adventure-shell__topbar--atrium anime-slide-down">
        <div className="adventure-shell__brand">
          <div className="adventure-shell__eyebrow anime-shimmer">World Atrium</div>
          <h2 className="adventure-shell__title">{playerIdentity.name}</h2>
          <div className="adventure-shell__meta">
            Level {playerIdentity.level} {playerIdentity.race} {playerIdentity.classLabel}
          </div>
        </div>

        <div className="adventure-shell__statusstrip anime-stagger">
          <AtriumCard label="Profile" value={profileLabel} />
          <AtriumCard label="Location" value={location?.name || "Unknown Reach"} />
          <AtriumCard label="Zone" value={zone?.name || location?.zoneId || "Unmapped"} />
          <AtriumCard label="Mood" value={narrative.currentMood || "neutral"} />
        </div>
      </header>

      <div className="atrium-layout">
        <section className="atrium-hero anime-slide-up">
          <div className="atrium-hero__copy">
            <div className="atrium-hero__kicker">
              {zone?.name || "Unknown Zone"} / {location?.name || "Unknown Reach"}
            </div>
            <h3 className="atrium-hero__title">{objective.questName}</h3>
            <p className="atrium-hero__objective">{objective.objectiveText}</p>
          </div>

          <div className="atrium-hero__meters">
            {topMeters.map((meter) => (
              <div key={meter.label} className="atrium-meter">
                <span>{meter.label}</span>
                <strong>{meter.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="atrium-pulse">
          <div className="atrium-pulse__header">
            <div>
              <div className="adventure-shell__eyebrow">Command Dais</div>
              <h3 className="surface-section__title">Issue your next command and review the latest generated text</h3>
            </div>
            <div className="atrium-pulse__status">{combatStatus}</div>
          </div>

          <div className="atrium-pulse__passage anime-pulse">{latestPassage}</div>

          <div className="atrium-pulse__timeline">
            <CommandTerminalPanel
              userInput={command?.userInput}
              onInputChange={command?.onInputChange}
              onSubmit={command?.onSubmit}
              isLoading={command?.isLoading}
              error={command?.error}
              inputRef={command?.inputRef}
              placeholder={`What will you do in ${location?.name || zone?.name || "this place"}?`}
            />
            <ActionSuggestionsPanel
              suggestions={command?.suggestions}
              onSelect={command?.onSuggestionSelect}
            />
          </div>
        </section>

        <section className="atrium-room-cluster">
          <div className="atrium-cluster__header">
            <div className="adventure-shell__eyebrow">Core Rooms</div>
            <h3 className="surface-section__title">Traverse the primary chambers</h3>
          </div>
          <div className="atrium-room-grid anime-stagger">
            {primaryRooms.map((room) => (
              <RoomGateway
                key={room.id}
                room={room}
                onOpen={() => handleOpenRoom(room)}
              />
            ))}
          </div>
        </section>

        <section className="atrium-systems-cluster">
          <div className="atrium-cluster__header">
            <div className="adventure-shell__eyebrow">System Rooms</div>
            <h3 className="surface-section__title">Open supporting sanctums</h3>
          </div>
          <div className="atrium-systems-grid anime-stagger">
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

        <section className="atrium-actions">
          <div className="atrium-cluster__header">
            <div className="adventure-shell__eyebrow">Direct Controls</div>
            <h3 className="surface-section__title">Act without leaving the floor</h3>
          </div>
          <GameQuickActions {...quickActionsProps} isDevBuild={isDevBuild} />
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
