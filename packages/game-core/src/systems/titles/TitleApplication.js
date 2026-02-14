import { getAutoUnlockableTitles } from "../../core/titleLogic.js";
import { updatePlayerVitals } from "../../core/PlayerVitals.js";
import { appendSystemMessages } from "../../core/narrativeLog.js";

export const applyAutoTitleUnlocks = (state, { announce = false } = {}) => {
  if (!state?.player) return state;
  const unlockable = getAutoUnlockableTitles(state);
  if (!Array.isArray(unlockable) || unlockable.length === 0) return state;

  const unlocked = new Set(
    (state.player.unlockedTitles || state.player.titles || []).filter(
      (id) => typeof id === "string" && id,
    ),
  );

  const newlyUnlocked = [];
  unlockable.forEach((title) => {
    if (!title?.id) return;
    if (unlocked.has(title.id)) return;
    unlocked.add(title.id);
    newlyUnlocked.push(title);
  });

  if (newlyUnlocked.length === 0) return state;

  const unlockedTitles = Array.from(unlocked);
  const player = updatePlayerVitals(
    {
      ...state.player,
      unlockedTitles,
      titles: unlockedTitles,
    },
    state.config,
  );

  const nextState = {
    ...state,
    player,
  };

  if (!announce) return nextState;
  return appendSystemMessages(
    nextState,
    newlyUnlocked.map((title) => `Unlocked title: ${title.name}`),
  );
};
