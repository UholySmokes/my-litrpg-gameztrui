import { appendNarrativeEntry } from "../../core/narrativeLog.js";
import {
  computeDominantMood,
  inferMood,
} from "./narrativeSuggestions.js";

function withNarrativeMetadata(prevNarrative, nextNarrative) {
  return {
    ...nextNarrative,
    summary: prevNarrative?.summary ?? nextNarrative.summary ?? "",
    summaryMeta: prevNarrative?.summaryMeta,
  };
}

export function applyNarrativeEntryToState(
  prevState,
  entry,
  { maxEntries = 80 } = {},
) {
  const taggedEntry = entry.mood
    ? entry
    : { ...entry, mood: inferMood(entry.text) };
  const nextNarrative = appendNarrativeEntry(
    prevState.narrative,
    {
      ...taggedEntry,
      meta: {
        ...(taggedEntry.meta || {}),
        mood: taggedEntry.mood,
      },
    },
    { maxEntries },
  );
  const baseEntries = Array.isArray(nextNarrative.entries) ? nextNarrative.entries : [];
  const nextEntries = baseEntries.map((candidate, index) =>
    index === baseEntries.length - 1
      ? { ...candidate, mood: taggedEntry.mood }
      : candidate,
  );

  return {
    ...prevState,
    narrative: {
      ...withNarrativeMetadata(prevState.narrative, nextNarrative),
      entries: nextEntries,
      currentMood: computeDominantMood(nextEntries),
    },
  };
}

export function replaceNarrativeEntryInState(prevState, entryId, updater) {
  const narrative = prevState?.narrative || {};
  const entries = Array.isArray(narrative.entries) ? narrative.entries : [];
  const targetIndex = entries.findIndex((entry) => entry.id === entryId);

  if (targetIndex === -1) {
    return prevState;
  }

  const updatedEntries = [...entries];
  const previousEntry = updatedEntries[targetIndex];
  const nextEntry =
    typeof updater === "function"
      ? updater(previousEntry)
      : { ...previousEntry, ...(updater || {}) };
  const explicitMood =
    typeof updater === "function"
      ? Object.prototype.hasOwnProperty.call(nextEntry || {}, "mood") &&
        nextEntry?.mood !== previousEntry?.mood
      : Object.prototype.hasOwnProperty.call(updater || {}, "mood");

  updatedEntries[targetIndex] = {
    ...nextEntry,
    mood: explicitMood ? nextEntry.mood : inferMood(nextEntry.text),
  };

  return {
    ...prevState,
    narrative: {
      ...withNarrativeMetadata(narrative, narrative),
      ...narrative,
      entries: updatedEntries,
      currentMood: computeDominantMood(updatedEntries),
    },
  };
}

export function createInitialNarrativeState(
  currentState,
  narrativeText,
  {
    source = "ai",
    timestamp,
    maxEntries = 80,
  } = {},
) {
  const seededState = applyNarrativeEntryToState(
    currentState,
    {
      type: "narrative",
      text: narrativeText,
      timestamp,
      source,
      mood: inferMood(narrativeText),
    },
    { maxEntries },
  );

  return {
    ...seededState,
    narrative: {
      ...seededState.narrative,
      summary: narrativeText,
      summaryMeta: {
        atCount: 1,
        updatedAt: timestamp,
      },
      currentMood: inferMood(narrativeText),
    },
  };
}
