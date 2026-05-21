import {useCallback, useState} from "react";
import CharacterCreationFlow from "../shell/CharacterCreationFlow.jsx";
import CharacterQuickstartMode from "../../ui/modes/CharacterQuickstartMode.jsx";

export default function CharacterCreationShell({
  advancedUnlocked,
  isActive,
  isTransitioning,
  onComplete,
  telemetryUser,
}) {
  const [mode, setMode] = useState(null);

  const handleQuickComplete = useCallback((characterData, creationOutcome) => {
    onComplete(characterData, creationOutcome);
  }, [onComplete]);

  if (mode === "quickstart") {
    return (
      <div
        className={[
          "creation-shell",
          isActive ? "mode-shell--active" : "",
          isTransitioning ? "mode-shell--fade-out" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <CharacterQuickstartMode
          onComplete={handleQuickComplete}
          user={telemetryUser}
          telemetryUser={telemetryUser}
        />
      </div>
    );
  }

  if (mode === "full") {
    return (
      <div
        className={[
          "creation-shell",
          isActive ? "mode-shell--active" : "",
          isTransitioning ? "mode-shell--fade-out" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <CharacterCreationFlow
          advancedUnlocked={advancedUnlocked}
          telemetryUser={telemetryUser}
          onComplete={onComplete}
        />
      </div>
    );
  }

  return (
    <div className="creation-shell creation-mode-select">
      <div className="mode-select-container">
        <h1 className="mode-select-title">The Threshold</h1>
        <p className="mode-select-subtitle">Choose your entry into the void.</p>
        <div className="mode-select-options">
          <button className="mode-select-card mode-select-card--quick" onClick={() => setMode("quickstart")}>
            <span className="mode-select-card-icon">[!]</span>
            <span className="mode-select-card-title">Quickstart</span>
            <span
              className="mode-select-card-desc">Name → Race → Class → Oath → Go. Defaults for everything else.</span>
          </button>
          <button className="mode-select-card mode-select-card--full" onClick={() => setMode("full")}>
            <span className="mode-select-card-icon">[*]</span>
            <span className="mode-select-card-title">Full Creation</span>
            <span className="mode-select-card-desc">Every choice, every detail. Archetype, Attributes, Skills, Perks & more.</span>
          </button>
        </div>
      </div>
    </div>
  );
}
