import CharacterCreationMode from "../../ui/modes/CharacterCreationMode.jsx";

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
        "mode-shell",
        "mode-shell--creation",
        isActive ? "mode-shell--active" : "",
        isTransitioning ? "mode-shell--fade-out" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <CharacterCreationMode
        advancedUnlocked={advancedUnlocked}
        telemetryUser={telemetryUser}
        onComplete={onComplete}
      />
    </div>
  );
}
