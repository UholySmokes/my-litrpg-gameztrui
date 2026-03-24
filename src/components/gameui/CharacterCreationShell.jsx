import CharacterCreationFlow from "../shell/CharacterCreationFlow.jsx";

export default function CharacterCreationShell({
  advancedUnlocked,
  isActive,
  isTransitioning,
  onComplete,
  telemetryUser,
}) {
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
