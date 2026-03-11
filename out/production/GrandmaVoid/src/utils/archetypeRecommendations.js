import {
  ensureAttributeShape,
  toCanonicalAttributeKey,
} from "../constants/attributes.js";
import { getCategoryConfig } from "../systems/archetype/ArchetypeSystemRegistry.js";

function addWeight(weights, key, value) {
  const canonical = toCanonicalAttributeKey(key);
  if (!canonical) return;
  weights[canonical] = (weights[canonical] || 0) + (Number(value) || 0);
}

function buildWeights({ race, cls, profession }) {
  const weights = ensureAttributeShape({}, 0);
  const raceBonuses =
    race?.statBonuses || race?.modifiers || race?.baseStats || {};
  const classBonuses =
    cls?.baseStats || cls?.statBonuses || cls?.modifiers || {};

  Object.entries(raceBonuses).forEach(([k, v]) => addWeight(weights, k, v));
  Object.entries(classBonuses).forEach(([k, v]) => addWeight(weights, k, v));

  if (profession?.primaryStat) {
    addWeight(weights, profession.primaryStat, 2);
  }
  if (profession?.secondaryStat) {
    addWeight(weights, profession.secondaryStat, 1);
  }

  return weights;
}

function resourceBoost(category, resourceSystem) {
  const res = typeof resourceSystem === "string" ? resourceSystem : "";
  const cat = typeof category === "string" ? category : "";
  if (!res || !cat) return 0;

  const mapping = {
    mana: { System: 1.25, Framework: 1.0, Path: 0.8 },
    rage: { Authority: 1.1, Overlay: 1.0 },
    chi: { Path: 1.1, Privilege: 0.5 },
    focus: { Privilege: 1.0, Framework: 0.8 },
    stealth: { Privilege: 1.25, Framework: 0.4 },
    energy: { Privilege: 0.8, Overlay: 0.7 },
  };

  return mapping[res]?.[cat] || 0;
}

function topStatReasons(weights, affinities) {
  const contributions = Object.entries(affinities || {})
    .map(([stat, affinity]) => {
      const w = Number(weights?.[stat] || 0);
      const a = Number(affinity || 0);
      return { stat, value: w * a, w, a };
    })
    .filter((c) => c.value !== 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);

  return contributions.map((c) => {
    const statLabel = c.stat.toUpperCase();
    if (c.w === 0) return null;
    return `${statLabel} synergy`;
  }).filter(Boolean);
}

export function recommendArchetypeSystems({ systems, race, cls, profession }) {
  const list = Array.isArray(systems) ? systems.filter(Boolean) : [];
  const weights = buildWeights({ race, cls, profession });
  const resourceSystem = cls?.resourceSystem || cls?.resource || "";

  const scored = list.map((system) => {
    const category = system.category || "Unknown";
    const catConfig = getCategoryConfig(category);
    const affinities = catConfig?.statAffinities || {};
    const dot = Object.entries(affinities).reduce((sum, [stat, affinity]) => {
      const w = Number(weights?.[stat] || 0);
      const a = Number(affinity || 0);
      return sum + w * a;
    }, 0);

    const boost = resourceBoost(category, resourceSystem);
    const score = dot + boost;

    const reasons = [];
    reasons.push(...topStatReasons(weights, affinities));
    if (boost > 0) {
      reasons.push(`Fits ${resourceSystem} play`);
    }
    if (profession?.category) {
      reasons.push(`Pairs with ${profession.category}`);
    }

    return { system, score, reasons: reasons.slice(0, 3) };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
}

