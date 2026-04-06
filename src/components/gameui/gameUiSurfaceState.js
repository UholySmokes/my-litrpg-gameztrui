export function resolveGameUiSurfaceState({
  activeSurface,
  characterCreated,
  hasCharacterSnapshot,
  isTransitioning,
}) {
  const canShowAdventure = Boolean(characterCreated || hasCharacterSnapshot);
  const shouldShowCreation =
    activeSurface === "creation" || (isTransitioning && hasCharacterSnapshot);
  const shouldShowAdventure =
    !isTransitioning && activeSurface === "adventure" && canShowAdventure;

  return {
    shouldShowAdventure,
    shouldShowCreation,
    shouldShowHub: !shouldShowAdventure && !shouldShowCreation,
  };
}