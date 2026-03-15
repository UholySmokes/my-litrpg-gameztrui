import GameMode from "../../ui/modes/GameMode.jsx";
import GameQuickActions from "./GameQuickActions.jsx";

export default function GameModeShell({
  gameModeProps,
  isActive,
  isDevBuild,
  isTransitioning,
  quickActionsProps,
}) {
  return (
    <div
      className={[
        "mode-shell",
        "mode-shell--game",
        isActive ? "mode-shell--active" : "",
        isTransitioning ? "mode-shell--fade-in" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <GameQuickActions isDevBuild={isDevBuild} {...quickActionsProps} />
      <GameMode {...gameModeProps} />
    </div>
  );
}
