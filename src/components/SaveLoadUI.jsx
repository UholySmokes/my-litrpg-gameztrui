import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteSave,
  isCloudSaveConfigured,
  listSaves,
  loadGameState,
  saveGameState,
} from "../core/CloudSaveService.js";

const LOCAL_SAVE_KEY = "localSaves:v1";
const LOCAL_AUTOSAVE_KEY = "localAutosave:v1";
const SYNC_SAVEPOINT_NAMES = new Set(["Auto Savepoint", "Sync Savepoint"]);

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const readLocalSaves = () => {
  const raw = localStorage.getItem(LOCAL_SAVE_KEY);
  const parsed = safeJsonParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
};

const readAutosave = () => {
  const raw = localStorage.getItem(LOCAL_AUTOSAVE_KEY);
  const parsed = safeJsonParse(raw, null);
  return parsed && typeof parsed === "object" ? parsed : null;
};

const writeLocalSaves = (saves) => {
  localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(saves));
};

const isBlockedCloudSnapshot = (entry) =>
  Boolean(entry?.save_name && SYNC_SAVEPOINT_NAMES.has(entry.save_name));

const CLOUD_SNAPSHOT_BLOCK_MESSAGE =
  "Sync savepoints are recovery snapshots and cannot be loaded from the web UI yet.";

export default function SaveLoadUI({
  isOpen,
  onClose,
  gameState,
  onLoadState,
  addSystemMessage,
  user,
  variant = "modal",
}) {
  const [localSaves, setLocalSaves] = useState([]);
  const [autosave, setAutosave] = useState(null);
  const [remoteSaves, setRemoteSaves] = useState([]);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saveName, setSaveName] = useState("Auto Save");
  const dialogRef = useRef(null);
  const lastFocusedElementRef = useRef(null);
  const isModal = variant !== "window";

  const cloudConfigEnabled = useMemo(() => isCloudSaveConfigured(), []);
  const canUseRemote = useMemo(() => {
    return Boolean(cloudConfigEnabled && user?.id && user.id !== "local");
  }, [cloudConfigEnabled, user?.id]);

  const cloudStatusMessage = useMemo(() => {
    if (!cloudConfigEnabled) {
      return "Cloud saves disabled by configuration.";
    }
    if (!user?.id) {
      return "Sign in to enable cloud saves.";
    }
    if (user.id === "local") {
      return "Cloud saves disabled in local-only mode.";
    }
    return null;
  }, [cloudConfigEnabled, user?.id]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setLocalSaves(readLocalSaves());
    setAutosave(readAutosave());
  }, [isOpen]);

  const refreshRemote = useCallback(async () => {
    if (!canUseRemote) return;
    setIsBusy(true);
    setError(null);
    try {
      const result = await listSaves(user.id);
      if (!result.success) {
        throw new Error(result.error || "Failed to list saves");
      }
      setRemoteSaves(result.saves || []);
    } catch (err) {
      setError(err.message || "Failed to list saves");
    } finally {
      setIsBusy(false);
    }
  }, [canUseRemote, user?.id]);

  useEffect(() => {
    if (!isOpen) return;
    refreshRemote();
  }, [isOpen, canUseRemote, refreshRemote]);

  useEffect(() => {
    if (!isModal || !isOpen) return;
    lastFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      lastFocusedElementRef.current?.focus?.();
    };
  }, [isModal, isOpen]);

  useEffect(() => {
    if (!isModal || !isOpen || typeof onClose !== "function") return;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isModal, isOpen, onClose]);

  const handleLocalSave = () => {
    setError(null);
    const entry = {
      id: `local_${Date.now()}`,
      save_name: saveName || "Local Save",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      game_state: gameState,
    };
    const next = [entry, ...readLocalSaves()].slice(0, 20);
    writeLocalSaves(next);
    setLocalSaves(next);
    addSystemMessage?.(`Saved locally: ${entry.save_name}`, "system");
  };

  const handleLocalLoad = (entry) => {
    setError(null);
    if (!entry?.game_state) return;
    onLoadState?.(entry.game_state);
    addSystemMessage?.(`Loaded local save: ${entry.save_name}`, "system");
    onClose?.();
  };

  const handleLocalDelete = (entryId) => {
    const next = readLocalSaves().filter((s) => s.id !== entryId);
    writeLocalSaves(next);
    setLocalSaves(next);
  };

  const handleRemoteSave = async () => {
    if (!canUseRemote) return;
    setIsBusy(true);
    setError(null);
    try {
      const result = await saveGameState(user.id, gameState, saveName);
      if (!result.success) {
        throw new Error(result.error || "Failed to save");
      }
      addSystemMessage?.(`Saved to cloud: ${saveName}`, "system");
      await refreshRemote();
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setIsBusy(false);
    }
  };

  const handleRemoteLoad = async (entry) => {
    if (!canUseRemote) return;
    if (isBlockedCloudSnapshot(entry)) {
      setError(CLOUD_SNAPSHOT_BLOCK_MESSAGE);
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const result = await loadGameState(user.id, entry?.id);
      if (!result.success) {
        throw new Error(result.error || "Failed to load");
      }
      if (result.gameState?.saveMeta?.loadableInGameUi === false) {
        throw new Error(CLOUD_SNAPSHOT_BLOCK_MESSAGE);
      }
      onLoadState?.(result.gameState);
      addSystemMessage?.(`Loaded cloud save: ${result.saveName}`, "system");
      onClose?.();
    } catch (err) {
      setError(err.message || "Failed to load");
    } finally {
      setIsBusy(false);
    }
  };

  const handleRemoteDelete = async (saveId) => {
    if (!canUseRemote) return;
    setIsBusy(true);
    setError(null);
    try {
      const result = await deleteSave(user.id, saveId);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete");
      }
      await refreshRemote();
    } catch (err) {
      setError(err.message || "Failed to delete");
    } finally {
      setIsBusy(false);
    }
  };

  if (isModal && !isOpen) return null;

  const panel = (
    <div className="holo-panel" style={{ padding: "1.25rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h2 id="save-load-title" style={{ color: "var(--holo-cyan)", margin: 0 }}>
            Save and Load
          </h2>
          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Local saves always available. Cloud saves require cloud login.
          </div>
        </div>
        {onClose && (
          <button
            className="holo-button"
            onClick={onClose}
            style={{ borderColor: "var(--holo-alert)", color: "var(--holo-alert)" }}
          >
            Close
          </button>
        )}
      </div>

          {error && (
            <div style={{ color: "var(--holo-alert)", marginBottom: "0.75rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              aria-label="Save name"
              style={{
                flex: 1,
                padding: "0.55rem 0.75rem",
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(0,243,255,0.3)",
                color: "var(--text-main)",
              }}
            />
            <button className="holo-button" onClick={handleLocalSave} disabled={isBusy}>
              Save Local
            </button>
            <button
              className="holo-button"
              onClick={handleRemoteSave}
              disabled={isBusy || !canUseRemote}
              title={canUseRemote ? "Save to cloud" : "Cloud saves require login"}
            >
              Save Cloud
            </button>
          </div>

          <section style={{ marginBottom: "1rem" }}>
            <h3 style={{ color: "var(--holo-cyan)", margin: "0 0 0.5rem 0" }}>
              Local Saves
            </h3>
            {autosave?.game_state && (
              <div
                style={{
                  padding: "0.75rem",
                  border: "1px solid rgba(255, 215, 0, 0.3)",
                  borderRadius: "6px",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                  background: "rgba(255, 215, 0, 0.06)",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "var(--holo-gold)", fontWeight: 700 }}>
                    Autosave
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {autosave.updated_at || autosave.created_at || ""}
                  </div>
                </div>
                <button
                  className="holo-button"
                  onClick={() =>
                    handleLocalLoad({
                      id: "autosave",
                      save_name: "Autosave",
                      game_state: autosave.game_state,
                    })
                  }
                  disabled={isBusy}
                >
                  Load
                </button>
              </div>
            )}
            {localSaves.length === 0 ? (
              <div style={{ color: "var(--text-muted)" }}>No local saves yet.</div>
            ) : (
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {localSaves.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      padding: "0.75rem",
                      border: "1px solid rgba(0,243,255,0.25)",
                      borderRadius: "6px",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: "var(--text-main)", fontWeight: 600 }}>
                        {entry.save_name}
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {entry.updated_at}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="holo-button"
                        onClick={() => handleLocalLoad(entry)}
                        disabled={isBusy}
                      >
                        Load
                      </button>
                      <button
                        className="holo-button"
                        onClick={() => handleLocalDelete(entry.id)}
                        disabled={isBusy}
                        style={{ borderColor: "var(--holo-alert)", color: "var(--holo-alert)" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 style={{ color: "var(--holo-cyan)", margin: "0 0 0.5rem 0" }}>
              Cloud Saves
            </h3>
            {!canUseRemote ? (
              <div style={{ color: "var(--text-muted)" }}>
                {cloudStatusMessage || "Cloud saves unavailable."}
              </div>
            ) : remoteSaves.length === 0 ? (
              <div style={{ color: "var(--text-muted)" }}>No cloud saves yet.</div>
            ) : (
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {remoteSaves.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      padding: "0.75rem",
                      border: "1px solid rgba(0,243,255,0.25)",
                      borderRadius: "6px",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: "var(--text-main)", fontWeight: 600 }}>
                        {entry.save_name}
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {entry.updated_at}
                      </div>
                      {isBlockedCloudSnapshot(entry) ? (
                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          Recovery snapshot only
                        </div>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="holo-button"
                        onClick={() => handleRemoteLoad(entry)}
                        disabled={isBusy || isBlockedCloudSnapshot(entry)}
                        title={
                          isBlockedCloudSnapshot(entry)
                            ? CLOUD_SNAPSHOT_BLOCK_MESSAGE
                            : "Load cloud save"
                        }
                      >
                        Load
                      </button>
                      <button
                        className="holo-button"
                        onClick={() => handleRemoteDelete(entry.id)}
                        disabled={isBusy}
                        style={{ borderColor: "var(--holo-alert)", color: "var(--holo-alert)" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
    </div>
  );

  if (!isModal) {
    return <div style={{ maxHeight: "100%", overflow: "auto" }}>{panel}</div>;
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1300 }}>
      <div
        className="modal-content"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-load-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "820px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          background: "rgba(0, 0, 0, 0.92)",
          border: "1px solid rgba(0, 243, 255, 0.4)",
        }}
      >
        {panel}
      </div>
    </div>
  );
}
