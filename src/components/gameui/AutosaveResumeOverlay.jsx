import { useCallback, useState } from "react";
import {
  readAutosavePromptCandidate,
  rememberAutosavePromptDismissal,
  isRecord,
} from "./autosaveResume.js";

export default function AutosaveResumeOverlay({
  isTransitioning,
  onLoadState,
}) {
  const [autosavePrompt, setAutosavePrompt] = useState(() =>
    readAutosavePromptCandidate(),
  );

  const handleResumeAutosave = useCallback(() => {
    if (!isRecord(autosavePrompt?.game_state)) {
      setAutosavePrompt(null);
      return;
    }

    onLoadState(autosavePrompt.game_state, {
      message: `Resumed autosave: ${autosavePrompt?.save_name || "Autosave"}`,
      closeSaveLoad: false,
    });
    rememberAutosavePromptDismissal(autosavePrompt);
    setAutosavePrompt(null);
  }, [autosavePrompt, onLoadState]);

  const handleDismissAutosavePrompt = useCallback(() => {
    rememberAutosavePromptDismissal(autosavePrompt);
    setAutosavePrompt(null);
  }, [autosavePrompt]);

  if (!autosavePrompt || isTransitioning) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 950,
        padding: "1.25rem",
      }}
    >
      <div
        className="holo-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="autosave-resume-title"
        style={{ width: "min(540px, 100%)", padding: "1.25rem" }}
      >
        <h2 id="autosave-resume-title" style={{ marginTop: 0 }}>
          RESUME AUTOSAVE?
        </h2>
        <p style={{ color: "var(--text-main)", marginBottom: "0.5rem" }}>
          A previous run was detected. Continue from the latest autosave or start a
          fresh character setup.
        </p>
        <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
          Last update: {autosavePrompt.updated_at || autosavePrompt.created_at || "unknown"}
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button
            className="holo-button"
            style={{ borderColor: "var(--holo-cyan)", color: "var(--holo-cyan)" }}
            onClick={handleResumeAutosave}
          >
            Continue Autosave
          </button>
          <button
            className="holo-button"
            style={{ borderColor: "var(--holo-gold)", color: "var(--holo-gold)" }}
            onClick={handleDismissAutosavePrompt}
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}
