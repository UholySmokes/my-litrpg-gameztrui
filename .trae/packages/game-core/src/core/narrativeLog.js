import { SimBridge } from "../simulation/bridge/SimulationContext.js";
import { toNumber } from "../utils/shared.js";

const DEFAULT_MAX_ENTRIES = 120;

export function appendNarrativeEntry(
  narrativeState,
  { type, text, timestamp, source, meta },
  { maxEntries = DEFAULT_MAX_ENTRIES } = {},
) {
  if (!text || typeof text !== "string") {
    return narrativeState;
  }

  const resolvedTimestamp = Number.isFinite(timestamp)
    ? timestamp
    : SimBridge.now();
  const nextSequence = toNumber(narrativeState?.sequence, 0) + 1;
  const entry = {
    id: `${resolvedTimestamp}_${nextSequence}`,
    type,
    text: text.trim(),
    timestamp: resolvedTimestamp,
    source: source || "system",
    meta,
    sequence: nextSequence,
  };
  const entries = [...(narrativeState?.entries || []), entry].slice(
    -maxEntries,
  );

  return {
    ...narrativeState,
    entries,
    sequence: nextSequence,
    lastUpdatedAt: resolvedTimestamp,
  };
}

export function normalizeNarrativeEntries(entries = []) {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter(
      (entry) =>
        entry && typeof entry.text === "string" && entry.text.trim(),
    )
    .map((entry, index) => {
      const timestamp = Number.isFinite(entry.timestamp)
        ? entry.timestamp
        : SimBridge.now() + index;
      const sequence = toNumber(entry.sequence, index + 1);
      return {
        id: entry.id || `${timestamp}_${sequence}`,
        type: entry.type || "narrative",
        text: entry.text.trim(),
        timestamp,
        source: entry.source || "legacy",
        meta: entry.meta,
        sequence,
      };
    });
}
