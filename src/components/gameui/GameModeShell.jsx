import { lazy, Suspense, useState, useEffect } from "react";
import GameMode from "../../ui/modes/GameMode.jsx";
import GameQuickActions from "./GameQuickActions.jsx";

const MobileGameMode = lazy(() => import("../../ui/mobile/MobileGameMode.jsx"));

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

export default function GameModeShell({
  gameModeProps,
  isActive,
  isDevBuild,
  isTransitioning,
  quickActionsProps,
}) {
  const isMobile = useIsMobile();

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
      {isMobile ? (
        <Suspense fallback={<div className="mobile-loading">Loading…</div>}>
          <MobileGameMode {...gameModeProps} />
        </Suspense>
      ) : (
        <>
          <GameQuickActions isDevBuild={isDevBuild} {...quickActionsProps} />
          <GameMode {...gameModeProps} />
        </>
      )}
    </div>
  );
}
