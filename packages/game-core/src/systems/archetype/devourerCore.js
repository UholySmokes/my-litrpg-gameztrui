import { toNumber } from "../../utils/shared.js";

const DEVOURER_IDS = new Set(["devourer_core", "devourer_system"]);

const FAMILY_BY_TYPE = {
  beast: "beast",
  humanoid: "humanoid",
  undead: "undead",
  construct: "construct",
  dragon: "dragon",
  demon: "demon",
  aberration: "aberration",
};

const FAMILY_BY_TAG = {
  beast: "beast",
  humanoid: "humanoid",
  human: "humanoid",
  sentient: "humanoid",
  undead: "undead",
  construct: "construct",
  dragon: "dragon",
  demon: "demon",
  aberration: "aberration",
  poison: "poison",
  fire: "fire",
  shadow: "shadow",
  arcane: "arcane",
  holy: "holy",
  void: "void",
  flying: "flying",
};

const TAINT_TAGS = new Set(["shadow", "void", "demon", "aberration", "undead"]);
const ADAPTATION_RANK_CAP = 5;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeTag(tag) {
  return String(tag || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toRuntimeLabel(token) {
  return String(token || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function clonePlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
}

function resolveArchetypeId(player = {}) {
  const archetype = player?.archetypeSystem;
  if (!archetype) return "";
  if (typeof archetype === "string") return archetype.trim().toLowerCase();
  if (typeof archetype === "object") return String(archetype.id || "").trim().toLowerCase();
  return "";
}

export function isDevourerCorePlayer(player = {}) {
  return DEVOURER_IDS.has(resolveArchetypeId(player));
}

export function normalizeDevourerRuntime(runtime) {
  const source = runtime && typeof runtime === "object" && !Array.isArray(runtime) ? runtime : {};
  const storedSamplesSource = clonePlainObject(source.storedSamples);
  const knownPreySource = clonePlainObject(source.knownPrey);
  const adaptationsSource = clonePlainObject(source.adaptations);

  const storedSamples = {};
  Object.entries(storedSamplesSource).forEach(([key, value]) => {
    const family = normalizeTag(key);
    if (!family || !value || typeof value !== "object") return;
    storedSamples[family] = {
      count: Math.max(0, Math.floor(toNumber(value.count, 0))),
      biomass: Math.max(0, Math.floor(toNumber(value.biomass, 0))),
      taint: Math.max(0, Math.floor(toNumber(value.taint, 0))),
      sentientCount: Math.max(0, Math.floor(toNumber(value.sentientCount, 0))),
      lastEnemyId: typeof value.lastEnemyId === "string" ? value.lastEnemyId : null,
      lastEnemyName: typeof value.lastEnemyName === "string" ? value.lastEnemyName : null,
    };
  });

  const knownPrey = {};
  Object.entries(knownPreySource).forEach(([key, value]) => {
    const family = normalizeTag(key);
    if (!family || !value || typeof value !== "object") return;
    knownPrey[family] = {
      digested: Math.max(0, Math.floor(toNumber(value.digested, 0))),
      sentientDigests: Math.max(0, Math.floor(toNumber(value.sentientDigests, 0))),
      lastEnemyId: typeof value.lastEnemyId === "string" ? value.lastEnemyId : null,
      lastEnemyName: typeof value.lastEnemyName === "string" ? value.lastEnemyName : null,
    };
  });

  const adaptations = {};
  Object.entries(adaptationsSource).forEach(([key, value]) => {
    const family = normalizeTag(key);
    if (!family || !value || typeof value !== "object") return;
    adaptations[family] = {
      rank: Math.max(0, Math.floor(toNumber(value.rank, 0))),
      maxRank: Math.max(1, Math.floor(toNumber(value.maxRank, ADAPTATION_RANK_CAP))),
      refinedCount: Math.max(0, Math.floor(toNumber(value.refinedCount, 0))),
      lastRefinedTurn: Math.max(0, Math.floor(toNumber(value.lastRefinedTurn, 0))),
    };
  });

  const recentPrey = Array.isArray(source.recentPrey)
    ? source.recentPrey
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean)
        .slice(-6)
    : [];

  return {
    taint: Math.max(0, Math.floor(toNumber(source.taint, 0))),
    storedSamples,
    knownPrey,
    adaptations,
    sentientDevours: Math.max(0, Math.floor(toNumber(source.sentientDevours, 0))),
    lastNotice: typeof source.lastNotice === "string" ? source.lastNotice : "",
    recentPrey,
  };
}

export function normalizeDevourerArchetypeState(archetypeSystem) {
  const source = archetypeSystem && typeof archetypeSystem === "object" ? archetypeSystem : {};
  const runtime = normalizeDevourerRuntime(source.runtime);
  const resource = source.resource && typeof source.resource === "object" ? source.resource : {};
  return {
    ...source,
    resource: {
      name: typeof resource.name === "string" && resource.name.trim() ? resource.name : "Biomass",
      current: Math.max(0, Math.floor(toNumber(resource.current, 0))),
      max: Math.max(100, Math.floor(toNumber(resource.max, 100))),
      regenRate: 0,
      color: typeof resource.color === "string" && resource.color.trim() ? resource.color : "#7DFFB3",
    },
    runtime,
  };
}

export function resolveDevourerFamilies(enemy = {}) {
  const families = new Set();
  const enemyType = normalizeTag(enemy.type);
  if (FAMILY_BY_TYPE[enemyType]) {
    families.add(FAMILY_BY_TYPE[enemyType]);
  }
  const tags = Array.isArray(enemy.tags) ? enemy.tags : [];
  tags.forEach((tag) => {
    const mapped = FAMILY_BY_TAG[normalizeTag(tag)];
    if (mapped) families.add(mapped);
  });

  if (families.size === 0 && enemyType) {
    families.add(enemyType);
  }
  if (families.size === 0) {
    families.add("beast");
  }
  return Array.from(families);
}

export function isSentientPrey(enemy = {}) {
  if (enemy.sentient === true) return true;
  const type = normalizeTag(enemy.type);
  if (type === "humanoid") return true;
  const tags = Array.isArray(enemy.tags) ? enemy.tags.map(normalizeTag) : [];
  return tags.includes("sentient") || tags.includes("humanoid") || tags.includes("human");
}

export function resolveDevourerHarvest(enemy = {}) {
  const level = Math.max(1, Math.floor(toNumber(enemy.level, 1)));
  const families = resolveDevourerFamilies(enemy);
  const sentient = isSentientPrey(enemy);
  const tags = Array.isArray(enemy.tags) ? enemy.tags.map(normalizeTag) : [];

  const taintRiskFromTags = tags.reduce((sum, tag) => sum + (TAINT_TAGS.has(tag) ? 1 : 0), 0);
  const biomass = Math.max(
    3,
    Math.floor(level * 2 + families.length + tags.length * 0.5 + (sentient ? 8 : 0)),
  );
  const taint = Math.max(1, Math.floor(level * 0.5 + taintRiskFromTags + (sentient ? 5 : 1)));

  return {
    families,
    biomass,
    taint,
    sentient,
    enemyId: typeof enemy.id === "string" && enemy.id.trim() ? enemy.id : null,
    enemyName: typeof enemy.name === "string" && enemy.name.trim() ? enemy.name : "Unknown prey",
  };
}

function getResource(archetypeSystem = {}) {
  const normalized = normalizeDevourerArchetypeState(archetypeSystem);
  return normalized.resource;
}

function appendRecentPrey(recentPrey = [], preyName) {
  const entries = Array.isArray(recentPrey) ? recentPrey : [];
  const next = [...entries, preyName].slice(-6);
  return next;
}

export function applyDevourerHarvestToState(state, enemy) {
  if (!isDevourerCorePlayer(state?.player)) return { state, notices: [] };

  const player = state.player || {};
  const archetype = normalizeDevourerArchetypeState(player.archetypeSystem);
  const runtime = normalizeDevourerRuntime(archetype.runtime);
  const harvest = resolveDevourerHarvest(enemy);

  const storedSamples = clonePlainObject(runtime.storedSamples);
  harvest.families.forEach((family) => {
    const prev = clonePlainObject(storedSamples[family]);
    storedSamples[family] = {
      count: Math.max(0, Math.floor(toNumber(prev.count, 0))) + 1,
      biomass: Math.max(0, Math.floor(toNumber(prev.biomass, 0))) + harvest.biomass,
      taint: Math.max(0, Math.floor(toNumber(prev.taint, 0))) + harvest.taint,
      sentientCount:
        Math.max(0, Math.floor(toNumber(prev.sentientCount, 0))) + (harvest.sentient ? 1 : 0),
      lastEnemyId: harvest.enemyId,
      lastEnemyName: harvest.enemyName,
    };
  });

  const notice = harvest.sentient
    ? `[Devourer Core] Sentient prey logged (${harvest.enemyName}). Biomass efficiency high. Taint surge expected.`
    : `[Devourer Core] Sample harvested from ${harvest.enemyName}. Digest when you need immediate conversion.`;

  const nextRuntime = {
    ...runtime,
    storedSamples,
    lastNotice: notice,
  };

  const nextArchetype = {
    ...archetype,
    runtime: nextRuntime,
    resource: getResource(archetype),
  };

  const nextState = {
    ...state,
    player: {
      ...player,
      archetypeSystem: nextArchetype,
    },
  };

  return { state: nextState, notices: [notice] };
}

function resolveSampleTarget(runtime, requestedTarget = null) {
  const familyKeys = Object.keys(runtime.storedSamples || {});
  if (familyKeys.length === 0) return null;
  if (!requestedTarget) {
    return familyKeys.find((key) => toNumber(runtime.storedSamples?.[key]?.count, 0) > 0) || null;
  }
  const normalized = normalizeTag(requestedTarget);
  if (runtime.storedSamples[normalized]) return normalized;
  return familyKeys.find((key) => key.includes(normalized) || normalized.includes(key)) || null;
}

export function executeDevourerDigest(state, action = {}) {
  if (!isDevourerCorePlayer(state?.player)) {
    return { ok: false, reason: "Devourer Core is not bound to this character.", state };
  }

  const player = state.player || {};
  const archetype = normalizeDevourerArchetypeState(player.archetypeSystem);
  const runtime = normalizeDevourerRuntime(archetype.runtime);
  const target = resolveSampleTarget(runtime, action.target || action.sample || null);
  if (!target) {
    return { ok: false, reason: "No matching prey sample to digest.", state };
  }

  const sample = runtime.storedSamples[target] || {};
  const count = Math.max(0, Math.floor(toNumber(sample.count, 0)));
  if (count <= 0) {
    return { ok: false, reason: "No stored sample remains for that prey line.", state };
  }

  const biomassPerSample = Math.max(1, Math.floor(toNumber(sample.biomass, 0) / count));
  const taintPerSample = Math.max(0, Math.floor(toNumber(sample.taint, 0) / count));
  const sentientPerSample = Math.max(0, Math.floor(toNumber(sample.sentientCount, 0) / count));

  const nextCount = count - 1;
  const nextSample = {
    ...sample,
    count: nextCount,
    biomass: Math.max(0, toNumber(sample.biomass, 0) - biomassPerSample),
    taint: Math.max(0, toNumber(sample.taint, 0) - taintPerSample),
    sentientCount: Math.max(0, toNumber(sample.sentientCount, 0) - sentientPerSample),
  };

  const knownPrey = clonePlainObject(runtime.knownPrey);
  const priorKnowledge = clonePlainObject(knownPrey[target]);
  knownPrey[target] = {
    digested: Math.max(0, Math.floor(toNumber(priorKnowledge.digested, 0))) + 1,
    sentientDigests:
      Math.max(0, Math.floor(toNumber(priorKnowledge.sentientDigests, 0))) +
      (sentientPerSample > 0 ? 1 : 0),
    lastEnemyId: sample.lastEnemyId || null,
    lastEnemyName: sample.lastEnemyName || toRuntimeLabel(target),
  };

  const resource = getResource(archetype);
  const nextResource = {
    ...resource,
    current: clamp(Math.floor(resource.current + biomassPerSample), 0, resource.max),
  };

  const nextRuntime = {
    ...runtime,
    taint: runtime.taint + taintPerSample,
    sentientDevours: runtime.sentientDevours + (sentientPerSample > 0 ? 1 : 0),
    storedSamples: {
      ...runtime.storedSamples,
      [target]: nextSample,
    },
    knownPrey,
    lastNotice:
      sentientPerSample > 0
        ? `[Devourer Core] Sentient line digested (${toRuntimeLabel(target)}). Output improved. Corruption drift accelerated.`
        : `[Devourer Core] ${toRuntimeLabel(target)} metabolized. Biomass reserves increased by ${biomassPerSample}.`,
    recentPrey: appendRecentPrey(runtime.recentPrey, sample.lastEnemyName || toRuntimeLabel(target)),
  };

  const nextState = {
    ...state,
    player: {
      ...player,
      archetypeSystem: {
        ...archetype,
        resource: nextResource,
        runtime: nextRuntime,
      },
    },
  };

  return {
    ok: true,
    state: nextState,
    description: nextRuntime.lastNotice,
  };
}

function resolveRefineTarget(runtime, requestedTarget = null) {
  const knownKeys = Object.keys(runtime.knownPrey || {});
  if (knownKeys.length === 0) return null;
  if (!requestedTarget) return knownKeys[0];
  const normalized = normalizeTag(requestedTarget);
  if (runtime.knownPrey[normalized]) return normalized;
  return knownKeys.find((key) => key.includes(normalized) || normalized.includes(key)) || null;
}

export function executeDevourerRefine(state, action = {}) {
  if (!isDevourerCorePlayer(state?.player)) {
    return { ok: false, reason: "Devourer Core is not bound to this character.", state };
  }

  const player = state.player || {};
  const archetype = normalizeDevourerArchetypeState(player.archetypeSystem);
  const runtime = normalizeDevourerRuntime(archetype.runtime);
  const target = resolveRefineTarget(runtime, action.target || action.sample || null);

  if (!target) {
    return { ok: false, reason: "No known prey line is available for refinement.", state };
  }

  const knowledge = runtime.knownPrey[target] || {};
  const adaptations = clonePlainObject(runtime.adaptations);
  const priorAdaptation = clonePlainObject(adaptations[target]);
  const currentRank = Math.max(0, Math.floor(toNumber(priorAdaptation.rank, 0)));
  const maxRank = Math.max(1, Math.floor(toNumber(priorAdaptation.maxRank, ADAPTATION_RANK_CAP)));

  if (currentRank >= maxRank) {
    return { ok: false, reason: "That adaptation family is already at maximum stable rank.", state };
  }

  const digested = Math.max(0, Math.floor(toNumber(knowledge.digested, 0)));
  const requiredKnowledge = currentRank + 1;
  if (digested < requiredKnowledge) {
    return {
      ok: false,
      reason: `Insufficient prey knowledge for ${toRuntimeLabel(target)} refinement (${digested}/${requiredKnowledge}).`,
      state,
    };
  }

  const resource = getResource(archetype);
  const biomassCost = 12 + currentRank * 8;
  if (resource.current < biomassCost) {
    return {
      ok: false,
      reason: `Insufficient Biomass (${resource.current}/${biomassCost}) for refinement.`,
      state,
    };
  }

  const nextResource = {
    ...resource,
    current: Math.max(0, resource.current - biomassCost),
  };

  const nextRank = currentRank + 1;
  adaptations[target] = {
    rank: nextRank,
    maxRank,
    refinedCount: Math.max(0, Math.floor(toNumber(priorAdaptation.refinedCount, 0))) + 1,
    lastRefinedTurn: Math.max(0, Math.floor(toNumber(state?.world?.turnCount, 0))),
  };

  const progressionModifiers = player?.progressionModifiers || {};
  const nextProgressionModifiers = {
    ...progressionModifiers,
    skillGrowthMultiplier: toNumber(progressionModifiers.skillGrowthMultiplier, 0) + 0.01,
    resourceGainMultiplier: toNumber(progressionModifiers.resourceGainMultiplier, 0) + 0.02,
  };

  const notice = `[Devourer Core] ${toRuntimeLabel(target)} adaptation refined to rank ${nextRank}. Permanent growth integrated.`;
  const nextRuntime = {
    ...runtime,
    adaptations,
    lastNotice: notice,
  };

  return {
    ok: true,
    state: {
      ...state,
      player: {
        ...player,
        progressionModifiers: nextProgressionModifiers,
        archetypeSystem: {
          ...archetype,
          resource: nextResource,
          runtime: nextRuntime,
        },
      },
    },
    description: notice,
  };
}

export function executeDevourerPurge(state) {
  if (!isDevourerCorePlayer(state?.player)) {
    return { ok: false, reason: "Devourer Core is not bound to this character.", state };
  }

  const player = state.player || {};
  const archetype = normalizeDevourerArchetypeState(player.archetypeSystem);
  const runtime = normalizeDevourerRuntime(archetype.runtime);
  const resource = getResource(archetype);

  if (runtime.taint <= 0) {
    return { ok: false, reason: "Taint levels are already clean.", state };
  }

  const maxReducibleByResource = Math.floor(resource.current / 2);
  if (maxReducibleByResource <= 0) {
    return { ok: false, reason: "Insufficient Biomass to purge taint.", state };
  }

  const purgeAmount = Math.min(runtime.taint, 12, maxReducibleByResource);
  const biomassCost = purgeAmount * 2;
  const nextResource = {
    ...resource,
    current: Math.max(0, resource.current - biomassCost),
  };
  const nextTaint = Math.max(0, runtime.taint - purgeAmount);

  const notice = `[Devourer Core] Taint purge complete (-${purgeAmount}). Biomass consumed: ${biomassCost}. Maintain discipline.`;

  return {
    ok: true,
    state: {
      ...state,
      player: {
        ...player,
        archetypeSystem: {
          ...archetype,
          resource: nextResource,
          runtime: {
            ...runtime,
            taint: nextTaint,
            lastNotice: notice,
          },
        },
      },
    },
    description: notice,
  };
}
