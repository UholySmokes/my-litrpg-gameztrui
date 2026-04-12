import {
  getDevourerAutoAbsorbBlockReason,
  getDevourerAutoAbsorbBlockReasonText,
  isDevourerCorePlayer,
  normalizeDevourerArchetypeState,
  resolveDevourerRefineBiomassCost,
  resolveDevourerSampleMetrics,
} from "../../systems/archetype/devourerCore.js";
import { resolvePlayerArchetypeSystem } from "../../systems/archetype/resolvePlayerArchetypeSystem.js";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toLabel(value) {
  return String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toInt(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : fallback;
}

export function buildDevourerCorePanelViewModel(player = {}) {
  const archetypeSystem = resolvePlayerArchetypeSystem(player);
  if (!isDevourerCorePlayer({ archetypeSystem })) {
    return null;
  }

  const normalized = normalizeDevourerArchetypeState(archetypeSystem);
  const runtime = isPlainObject(normalized.runtime) ? normalized.runtime : {};
  const resource = normalized.resource;
  const storedSamplesSource = isPlainObject(runtime.storedSamples) ? runtime.storedSamples : {};
  const knownPreySource = isPlainObject(runtime.knownPrey) ? runtime.knownPrey : {};
  const adaptationsSource = isPlainObject(runtime.adaptations) ? runtime.adaptations : {};

  const digestCandidates = Object.entries(storedSamplesSource)
    .map(([family, sample]) => {
      const metrics = resolveDevourerSampleMetrics(sample);
      if (!metrics) return null;

      const blockReason = getDevourerAutoAbsorbBlockReason({ resource, runtime, sample });
      return {
        family,
        label: toLabel(family),
        count: metrics.count,
        biomassPerSample: metrics.biomassPerSample,
        taintPerSample: metrics.taintPerSample,
        sentientPerSample: metrics.sentientPerSample,
        command: `digest ${family}`,
        blockReason,
        blockReasonText: blockReason
          ? getDevourerAutoAbsorbBlockReasonText(blockReason, { family })
          : "",
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (Boolean(left.blockReason) !== Boolean(right.blockReason)) {
        return left.blockReason ? 1 : -1;
      }
      return right.count - left.count || left.family.localeCompare(right.family);
    });

  const refinementReady = Object.entries(knownPreySource)
    .map(([family, entry]) => {
      const adaptation = isPlainObject(adaptationsSource[family]) ? adaptationsSource[family] : {};
      const currentRank = toInt(adaptation.rank, 0);
      const maxRank = Math.max(1, toInt(adaptation.maxRank, 5));
      const digested = toInt(entry?.digested, 0);
      const requiredKnowledge = currentRank + 1;
      const biomassCost = resolveDevourerRefineBiomassCost(currentRank);
      const ready =
        currentRank < maxRank && digested >= requiredKnowledge && resource.current >= biomassCost;

      return ready
        ? {
            family,
            label: toLabel(family),
            digested,
            requiredKnowledge,
            currentRank,
            maxRank,
            biomassCost,
            command: `refine ${family}`,
          }
        : null;
    })
    .filter(Boolean)
    .sort((left, right) => {
      return left.biomassCost - right.biomassCost || left.family.localeCompare(right.family);
    });

  const adaptationRanks = Object.entries(adaptationsSource)
    .map(([family, entry]) => ({
      family,
      label: toLabel(family),
      rank: toInt(entry?.rank, 0),
      maxRank: Math.max(1, toInt(entry?.maxRank, 5)),
      refinedCount: toInt(entry?.refinedCount, 0),
    }))
    .filter((entry) => entry.rank > 0)
    .sort((left, right) => right.rank - left.rank || left.family.localeCompare(right.family));

  const purgeAction =
    toInt(runtime.taint, 0) > 0
      ? {
          label: "Purge Taint",
          command: "purge taint",
          reason:
            toInt(runtime.taint, 0) > 10
              ? "Taint is above the safe auto-absorb ceiling. Clean the core before further intake."
              : "Consume Biomass to flush accumulated corruption before it compounds.",
        }
      : null;

  return {
    name: normalized.name || "Devourer Core",
    resource,
    taint: toInt(runtime.taint, 0),
    sentientDevours: toInt(runtime.sentientDevours, 0),
    knownPreyCount: Object.keys(knownPreySource).length,
    lastNotice: typeof runtime.lastNotice === "string" ? runtime.lastNotice.trim() : "",
    recentPrey: Array.isArray(runtime.recentPrey)
      ? runtime.recentPrey.map((entry) => String(entry || "").trim()).filter(Boolean).slice(-6)
      : [],
    digestReady: digestCandidates.filter((entry) => !entry.blockReason),
    digestBlocked: digestCandidates.filter((entry) => entry.blockReason),
    refinementReady,
    adaptationRanks,
    purgeAction,
  };
}
