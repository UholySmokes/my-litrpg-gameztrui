const MAX_ACTIVE_QUESTS = 6;

export function collectNarrativeOutcomeNotes(notes = []) {
  return Array.from(
    new Set(
      notes.filter((note) => typeof note === "string" && note.trim()),
    ),
  );
}

export function mergeSuggestedQuestIntoState(state, suggestedQuest) {
  if (!suggestedQuest?.id) {
    return { added: false, state };
  }

  const existingActive = Array.isArray(state?.quests?.active)
    ? state.quests.active
    : [];
  const existingCompleted = Array.isArray(state?.quests?.completed)
    ? state.quests.completed
    : [];
  const alreadyTracked =
    existingActive.some((quest) => quest.id === suggestedQuest.id) ||
    existingCompleted.some((quest) => quest.id === suggestedQuest.id);

  if (alreadyTracked) {
    return { added: false, state };
  }

  return {
    added: true,
    state: {
      ...state,
      quests: {
        ...(state?.quests || {}),
        active: [...existingActive, suggestedQuest].slice(0, MAX_ACTIVE_QUESTS),
        completed: existingCompleted,
      },
    },
  };
}
