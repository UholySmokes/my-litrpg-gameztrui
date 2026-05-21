import React, {useDeferredValue, useEffect, useId, useMemo, useRef, useState,} from "react";
import {getLocationById} from "../../world/WorldDataRegistry.js";
import {
  buildDevConsoleSessionLog,
  COMMAND_HINTS,
  DEV_CONSOLE_COMMANDS,
  executeDevConsoleCommand,
  QUICK_COMMANDS,
  toNumber,
} from "./devConsoleModel.js";

function formatTimestamp(value) {
  const numeric = toNumber(value, null);
  if (numeric === null) return "--";
  try {
    return new Date(numeric).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return String(numeric);
  }
}

function SessionLogRow({ entry }) {
  return (
    <div className={`dev-console-dock__log-row dev-console-dock__log-row--${entry.source}`}>
      <div className="dev-console-dock__log-meta">
        <span className="dev-console-dock__log-time">{formatTimestamp(entry.timestamp)}</span>
        <span className="dev-console-dock__log-channel">{entry.channel}</span>
      </div>
      <div className="dev-console-dock__log-text">{entry.text}</div>
    </div>
  );
}

export default function DevConsoleDock({
  state,
  dispatch,
  setState,
  addSystemMessage,
  runStoryCommand,
}) {
  const gridId = useId();
  const [isReduced, setIsReduced] = useState(true);
  const [commandText, setCommandText] = useState("");
  const [resultMessage, setResultMessage] = useState("Ready for live state and story input.");
  const [isRunning, setIsRunning] = useState(false);
  const dockRef = useRef(null);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const root = document.documentElement;
    const dockElement = dockRef.current;
    if (!dockElement) return undefined;

    const syncDockHeight = () => {
      root.style.setProperty("--dev-console-height", `${dockElement.offsetHeight}px`);
    };

    syncDockHeight();

    if (typeof ResizeObserver !== "function") {
      window.addEventListener("resize", syncDockHeight);
      return () => {
        window.removeEventListener("resize", syncDockHeight);
        root.style.removeProperty("--dev-console-height");
      };
    }

    const observer = new ResizeObserver(syncDockHeight);
    observer.observe(dockElement);
    window.addEventListener("resize", syncDockHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncDockHeight);
      root.style.removeProperty("--dev-console-height");
    };
  }, [isReduced]);

  const player = useMemo(() => state?.player || {}, [state?.player]);
  const locationId = state?.world?.location?.current || state?.world?.location || null;
  const location = locationId ? getLocationById(locationId) : null;
  const sessionLog = useMemo(() => buildDevConsoleSessionLog(state), [state]);
  const deferredLog = useDeferredValue(sessionLog);

  const summary = useMemo(
    () => ({
      name: player?.name || "Unbound Traveler",
      level: toNumber(player?.level, 1),
      gold: toNumber(player?.currency?.goldCoins ?? player?.gold, 0),
      soulpoints: toNumber(player?.currency?.soulpoints ?? player?.soulpoints, 0),
      hp: `${toNumber(player?.hp?.current, 0)} / ${toNumber(player?.hp?.max, 0)}`,
      mana: `${toNumber(player?.mana?.current, 0)} / ${toNumber(player?.mana?.max, 0)}`,
      xp: `${toNumber(player?.xp?.current, 0)} / ${toNumber(player?.xp?.max, 0)}`,
      location: location?.name || String(locationId || "Unknown Reach"),
    }),
    [location?.name, locationId, player],
  );

  const handleExecute = async (nextCommand = commandText) => {
    if (isRunning) return;
    setIsRunning(true);
    try {
      const result = await executeDevConsoleCommand(nextCommand, {
        dispatch,
        setState,
        addSystemMessage,
        runStoryCommand,
        resolveLocationById: getLocationById,
        state,
      });
      setResultMessage(result.message);
      if (result.ok) {
        setCommandText("");
      }
    } catch (error) {
      setResultMessage(error?.message || "Dev command failed.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyLog = async () => {
    try {
      await navigator.clipboard.writeText(
        deferredLog
          .map((entry) => `[${formatTimestamp(entry.timestamp)}] ${entry.channel}: ${entry.text}`)
          .join("\n"),
      );
      setResultMessage("Session log copied to clipboard.");
    } catch {
      setResultMessage("Clipboard copy is unavailable in this session.");
    }
  };

  return (
    <aside
      ref={dockRef}
      className={`dev-console-dock ${isReduced ? "dev-console-dock--reduced" : ""}`}
      aria-label="Developer console"
    >
      <div className="dev-console-dock__header">
        <div className="dev-console-dock__meta">
          <div className="dev-console-dock__eyebrow">Lattice Console</div>
          <div className="dev-console-dock__title-row">
            <span className="dev-console-dock__indicator" aria-hidden="true" />
            <div className="dev-console-dock__title">{summary.name}</div>
          </div>
          <div className="dev-console-dock__summary">
            Level {summary.level} | {summary.location} | {deferredLog.length} retained log entries
          </div>
        </div>
        <button
          type="button"
          className="dev-console-dock__toggle"
          onClick={() => setIsReduced((prev) => !prev)}
          aria-expanded={!isReduced}
          aria-controls={gridId}
          aria-label={isReduced ? "Expand developer console" : "Retract developer console"}
        >
          {isReduced ? "Expand" : "Retract"}
        </button>
      </div>

      <div id={gridId} className="dev-console-dock__body" hidden={isReduced}>
        <section className="dev-console-dock__panel dev-console-dock__panel--command">
          <div className="dev-console-dock__panel-heading">
            <div>
              <div className="dev-console-dock__panel-label">Command</div>
              <h3 className="dev-console-dock__panel-title">Influence story or state</h3>
            </div>
            <div className="dev-console-dock__result">{resultMessage}</div>
          </div>

          <div className="dev-console-dock__command-row">
            <input
              className="dev-console-dock__input"
              value={commandText}
              onChange={(event) => setCommandText(event.target.value)}
              placeholder="Type story text or /xp 100, /teleport coast_tideward_pier, /system ..."
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleExecute();
                }
              }}
            />
            <button
              type="button"
              className="dev-console-dock__run"
              onClick={() => void handleExecute()}
              disabled={isRunning}
            >
              {isRunning ? "Running" : "Execute"}
            </button>
          </div>

          <div className="dev-console-dock__quick-grid">
            {QUICK_COMMANDS.map((entry) => (
              <button
                key={entry.label}
                type="button"
                className={`dev-console-dock__quick dev-console-dock__quick--${entry.tone}`}
                onClick={() => void handleExecute(entry.command)}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <div className="dev-console-dock__hint-list">
            {COMMAND_HINTS.map((entry) => (
              <span key={entry} className="dev-console-dock__hint-chip">
                {entry}
              </span>
            ))}
          </div>

          <div style={{ display: "grid", gap: "0.55rem", marginTop: "0.85rem" }}>
            <div className="dev-console-dock__panel-label">Command Reference</div>
            <div className="dev-console-dock__hint-list" aria-label="Command reference">
              {DEV_CONSOLE_COMMANDS.map((entry) => (
                <button
                  key={entry.usage}
                  type="button"
                  className="dev-console-dock__hint-chip dev-console-dock__hint-chip--clickable"
                  title={entry.description}
                  onClick={() => {
                    const next = entry.example || entry.usage;
                    setCommandText(next);
                    setResultMessage(entry.description);
                  }}
                >
                  {entry.usage}
                </button>
              ))}
            </div>
          </div>

          <div className="dev-console-dock__stats">
            <div className="dev-console-dock__stat-card"><span>HP</span><strong>{summary.hp}</strong></div>
            <div className="dev-console-dock__stat-card"><span>Mana</span><strong>{summary.mana}</strong></div>
            <div className="dev-console-dock__stat-card"><span>XP</span><strong>{summary.xp}</strong></div>
            <div className="dev-console-dock__stat-card"><span>Gold</span><strong>{summary.gold}</strong></div>
            <div className="dev-console-dock__stat-card"><span>Soulpoints</span><strong>{summary.soulpoints}</strong></div>
          </div>
        </section>

        <section className="dev-console-dock__panel dev-console-dock__panel--log">
          <div className="dev-console-dock__panel-heading">
            <div>
              <div className="dev-console-dock__panel-label">Session Log</div>
              <h3 className="dev-console-dock__panel-title">Retained runtime timeline</h3>
            </div>
            <button
              type="button"
              className="dev-console-dock__copy"
              onClick={() => void handleCopyLog()}
            >
              Copy Log
            </button>
          </div>

          <div className="dev-console-dock__log-list">
            {deferredLog.length > 0 ? (
              deferredLog
                .slice()
                .reverse()
                .map((entry) => <SessionLogRow key={entry.id} entry={entry} />)
            ) : (
              <div className="dev-console-dock__empty">No retained session events yet.</div>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
