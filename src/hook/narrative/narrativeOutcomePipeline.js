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

export function applyNarrativeStateIntents(state, intents = []) {
  if (!Array.isArray(intents) || intents.length === 0) {
    return { state, notes: [] };
  }

  let nextState = state;
  const notes = [];

  intents.forEach((intent) => {
    switch (intent?.type) {
      case "world.flag.set": {
        const flag = String(intent.flag || "").trim();
        if (!flag) return;
        const world = nextState?.world || {};
        nextState = {
          ...nextState,
          world: {
            ...world,
            flags: {
              ...(world.flags || {}),
              [flag]: Boolean(intent.value),
            },
          },
        };
        break;
      }
      case "clue.add": {
        const clueId = String(intent.clueId || "").trim();
        if (!clueId) return;
        const world = nextState?.world || {};
        const vars = world?.vars && typeof world.vars === "object" ? world.vars : {};
        const clues = Array.isArray(vars.clues) ? vars.clues : [];
        if (clues.includes(clueId)) return;
        nextState = {
          ...nextState,
          world: {
            ...world,
            vars: {
              ...vars,
              clues: [...clues, clueId],
            },
          },
        };
        notes.push(`Clue discovered: ${clueId.replace(/_/g, " ")}.`);
        break;
      }
      case "player.reputation.delta": {
        const delta = Number(intent.value);
        if (!Number.isFinite(delta) || delta === 0) return;
        const player = nextState?.player || {};
        const nextReputation = (Number(player.reputation) || 0) + delta;
        nextState = {
          ...nextState,
          player: {
            ...player,
            reputation: nextReputation,
          },
        };
        notes.push(
          delta > 0
            ? `Reputation increased by ${Math.abs(delta)}.`
            : `Reputation decreased by ${Math.abs(delta)}.`,
        );
        break;
      }
      case "magic.journal.add": {
        const note = String(intent.note || "").trim();
        if (!note) return;
        const player = nextState?.player || {};
        const magic = player.magic && typeof player.magic === "object" ? player.magic : {};
        const journal = Array.isArray(magic.journal) ? magic.journal : [];
        const turn = nextState?.world?.turnCount || 0;
        const entry = {
          turn,
          topic: "narrative_insight",
          target: null,
          method: "narrative",
          result: "recorded",
          notes: note,
        };
        nextState = {
          ...nextState,
          player: {
            ...player,
            magic: {
              ...magic,
              journal: [...journal, entry].slice(-50),
            },
          },
        };
        notes.push(`Magic insight recorded: ${note}`);
        break;
      }
      default:
        break;
    }
  });

  return { state: nextState, notes };
}
