export function buildNarrativePanelView(state) {
  const narrativeSummary = state?.narrative?.summary;
  const narrativeEntries = Array.isArray(state?.narrative?.entries)
    ? state.narrative.entries
    : [];
  const latestNarrativeEntry = narrativeEntries[narrativeEntries.length - 1] || null;
  const latestNarrativeRawText = latestNarrativeEntry?.text || "";
  const latestNarrativeText = latestNarrativeRawText.trim();
  const sanitizedNarrativeSummary = narrativeSummary?.trim() || "";

  return {
    narrativeSummary,
    narrativeCurrentMood: state?.narrative?.currentMood || "neutral",
    narrativeEntries,
    recentNarrativeEntries: narrativeEntries.slice(-10).reverse(),
    latestNarrativeEntry,
    latestNarrativeRawText,
    latestNarrativeText,
    sanitizedNarrativeSummary,
    shouldShowNarrativeSummary:
      sanitizedNarrativeSummary.length > 0 &&
      sanitizedNarrativeSummary !== latestNarrativeText,
  };
}

export function buildModeShellState({ characterCreated, isTransitioning }) {
  const showCreationMode = !characterCreated;
  const showGameMode = characterCreated || isTransitioning;

  return {
    showCreationMode,
    showGameMode,
    shouldRenderCreationShell: showCreationMode || isTransitioning,
    shouldRenderGameShell: showGameMode || isTransitioning,
  };
}
