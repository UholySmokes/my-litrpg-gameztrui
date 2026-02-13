import { random, randomChoice } from "../../utils/DeterministicRandom.js";
import {
  findLocationsByZone,
  getBiomeEssenceProfile,
  getEssenceAnomalyById,
  getEssenceAnomalyIdsForBiome,
} from "../../world/WorldDataRegistry.js";

export const ESSENCE_PRIMES = [
  "fire",
  "water",
  "earth",
  "air",
  "lightning",
  "shadow",
  "light",
  "life",
  "creation",
  "destruction",
  "space",
  "time",
];

const OPPOSITION_PAIRS = [
  ["fire", "water"],
  ["earth", "air"],
  ["light", "shadow"],
  ["life", "destruction"],
  ["creation", "destruction"],
  ["space", "time"],
];

const DENSITY_BY_TIER = {
  0: 1.0,
  1: 1.5,
  2: 2.2,
  3: 3.3,
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toNumberSafe = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

function computeStoredEssenceTotals(magic) {
  const totals = ESSENCE_PRIMES.reduce((acc, e) => {
    acc[e] = 0;
    return acc;
  }, {});

  const reserves = magic?.reserves && typeof magic.reserves === "object" ? magic.reserves : {};
  ESSENCE_PRIMES.forEach((e) => {
    totals[e] += Math.max(0, toNumberSafe(reserves[e], 0));
  });

  const charges = Array.isArray(magic?.charges) ? magic.charges : [];
  charges.forEach((charge) => {
    const essence = normalizeEssenceId(charge?.essence);
    if (!essence) return;
    totals[essence] += Math.max(0, toNumberSafe(charge?.amount, 0));
  });

  return totals;
}

function computeInterferenceScore(totals) {
  const total = ESSENCE_PRIMES.reduce((sum, e) => sum + toNumberSafe(totals?.[e], 0), 0);
  if (total <= 0) return 0;

  const opposed = OPPOSITION_PAIRS.reduce((sum, [a, b]) => {
    const overlap = Math.min(toNumberSafe(totals?.[a], 0), toNumberSafe(totals?.[b], 0));
    return sum + overlap;
  }, 0);

  return clamp(opposed / total, 0, 1);
}

function getPerkRank(magic, perkId) {
  const key = typeof perkId === "string" ? perkId.trim().toLowerCase() : "";
  if (!key) return 0;
  const perks = Array.isArray(magic?.perks) ? magic.perks : [];
  let rank = 0;
  perks.forEach((perk) => {
    if (typeof perk === "string") {
      if (perk.trim().toLowerCase() === key) rank = Math.max(rank, 1);
      return;
    }
    if (perk && typeof perk === "object" && !Array.isArray(perk)) {
      const id = typeof perk.id === "string" ? perk.id.trim().toLowerCase() : "";
      if (id !== key) return;
      rank = Math.max(rank, Math.max(1, Math.floor(toNumberSafe(perk.rank, 1))));
    }
  });
  return clamp(rank, 0, 10);
}

function resonanceStateFromValue(value) {
  const v = clamp(toNumberSafe(value, 0), 0, 100);
  if (v >= 75) return "shrieking";
  if (v >= 50) return "ringing";
  if (v >= 25) return "humming";
  return "quiet";
}

function applyResonanceDelta(magic, delta) {
  const node = magic?.resonance && typeof magic.resonance === "object" ? magic.resonance : {};
  const max = clamp(toNumberSafe(node.max, 100), 1, 1000);
  const current = clamp(toNumberSafe(node.current, 0) + toNumberSafe(delta, 0), 0, max);
  return {
    ...magic,
    resonance: {
      ...node,
      max,
      current,
      state: resonanceStateFromValue(current),
    },
  };
}

function computeEnvironmentalPressure(ambient) {
  const weatherType = typeof ambient?.provenance?.weatherType === "string" ? ambient.provenance.weatherType : null;
  const intensity = clamp(toNumberSafe(ambient?.provenance?.weatherIntensity, 0), 0, 1);
  const anomalies = Array.isArray(ambient?.provenance?.anomalyIds) ? ambient.provenance.anomalyIds.length : 0;
  const base =
    weatherType === "storm"
      ? 0.9
      : weatherType === "fog"
        ? 0.7
        : weatherType === "drought"
          ? 0.6
          : weatherType === "rain"
            ? 0.4
            : 0.2;
  return clamp(base * intensity + anomalies * 0.25, 0, 2);
}

const normalizeEssenceId = (value) => {
  if (!value) return null;
  const id = String(value).trim().toLowerCase();
  return ESSENCE_PRIMES.includes(id) ? id : null;
};

const deriveAmbientFromLocationId = (locationId) => {
  const id = String(locationId || "").toLowerCase();
  const base = {
    fire: 0.12,
    water: 0.12,
    earth: 0.12,
    air: 0.12,
    lightning: 0.08,
    shadow: 0.06,
    light: 0.06,
    life: 0.08,
    creation: 0.03,
    destruction: 0.03,
    space: 0.03,
    time: 0.03,
  };

  if (id.includes("river") || id.includes("lake") || id.includes("coast")) {
    return { ...base, water: 0.35, air: 0.18, life: 0.14, fire: 0.06 };
  }
  if (id.includes("forest") || id.includes("grove")) {
    return { ...base, life: 0.28, earth: 0.16, water: 0.16, shadow: 0.08 };
  }
  if (id.includes("mountain") || id.includes("peak") || id.includes("cave")) {
    return { ...base, earth: 0.30, air: 0.16, water: 0.06, life: 0.04 };
  }
  if (id.includes("ruins") || id.includes("crypt") || id.includes("grave")) {
    return { ...base, shadow: 0.22, earth: 0.18, light: 0.03, life: 0.03 };
  }
  if (id.includes("city") || id.includes("market")) {
    return { ...base, air: 0.16, light: 0.10, shadow: 0.08, earth: 0.10 };
  }

  if (id.includes("dream") || id.includes("mnemonic") || id.includes("mirrorpool")) {
    return { ...base, shadow: 0.12, light: 0.12, space: 0.08, time: 0.08 };
  }
  if (id.includes("volcanic") || id.includes("caldera") || id.includes("ash")) {
    return { ...base, fire: 0.30, earth: 0.18, destruction: 0.06, water: 0.05 };
  }
  if (id.includes("desert") || id.includes("sands") || id.includes("mirage")) {
    return { ...base, air: 0.18, fire: 0.16, light: 0.10, water: 0.06, time: 0.05 };
  }

  return base;
};

const isAmbientSnapshot = (ambient) =>
  ambient && typeof ambient === "object" && !Array.isArray(ambient)
    ? ambient.compositionByEssence && typeof ambient.compositionByEssence === "object"
    : false;

function toAmbientSnapshot(densities, { locationId, biome, time, weather, anomalies } = {}) {
  const profile = getBiomeEssenceProfile(biome);
  const dominant = new Set(Array.isArray(profile?.dominantTriad) ? profile.dominantTriad : []);
  const drawDominant = clamp(toNumberSafe(profile?.draw?.dominant, 1.2), 0.9, 1.2);
  const drawOff = clamp(toNumberSafe(profile?.draw?.off, 0.95), 0.9, 1.2);
  const refineDominant = clamp(toNumberSafe(profile?.refine?.dominant, 1.1), 0.9, 1.2);
  const refineOff = clamp(toNumberSafe(profile?.refine?.off, 0.98), 0.9, 1.2);
  const stabilityCapDelta = clamp(toNumberSafe(profile?.stabilityCapDelta, 0), -20, 20);
  const taintBaseline = clamp(toNumberSafe(profile?.taintBaseline, 0), 0, 1);

  const timeMinutes = toNumberSafe(time?.currentTime, NaN);
  const resolvedTimeOfDay = typeof time?.timeOfDay === "string" ? time.timeOfDay : null;
  const isMidnightWindow = Number.isFinite(timeMinutes) ? timeMinutes >= 0 && timeMinutes < 120 : false;

  const weatherNode =
    weather && typeof weather === "object" && weather.byBiome && biome
      ? weather.byBiome[biome]
      : null;
  const weatherType = typeof weatherNode?.type === "string" ? weatherNode.type : null;
  const weatherIntensity = clamp(toNumberSafe(weatherNode?.intensity, 0), 0, 1);

  const densityDeltaByEssence = ESSENCE_PRIMES.reduce((acc, e) => {
    acc[e] = 0;
    return acc;
  }, {});

  if (weatherType === "rain") {
    densityDeltaByEssence.water += 0.06 * weatherIntensity;
    densityDeltaByEssence.air += 0.02 * weatherIntensity;
    densityDeltaByEssence.fire -= 0.03 * weatherIntensity;
  } else if (weatherType === "storm") {
    densityDeltaByEssence.lightning += 0.08 * weatherIntensity;
    densityDeltaByEssence.air += 0.05 * weatherIntensity;
    densityDeltaByEssence.water += 0.02 * weatherIntensity;
  } else if (weatherType === "drought") {
    densityDeltaByEssence.fire += 0.05 * weatherIntensity;
    densityDeltaByEssence.water -= 0.06 * weatherIntensity;
    densityDeltaByEssence.earth += 0.02 * weatherIntensity;
  } else if (weatherType === "fog") {
    densityDeltaByEssence.water += 0.03 * weatherIntensity;
    densityDeltaByEssence.shadow += 0.04 * weatherIntensity;
    densityDeltaByEssence.light -= 0.02 * weatherIntensity;
  }

  const anomalyInstances = Array.isArray(anomalies?.instances) ? anomalies.instances : [];
  const resolvedAnomalyIds = anomalyInstances
    .filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry))
    .filter((entry) => entry.locationId && String(entry.locationId) === String(locationId))
    .map((entry) => String(entry.id || "").trim().toLowerCase())
    .filter(Boolean);
  const anomalyDefs = resolvedAnomalyIds
    .map((id) => getEssenceAnomalyById(id))
    .filter(Boolean);

  anomalyDefs.forEach((def) => {
    const deltas = def?.densityDeltaByEssence;
    if (deltas && typeof deltas === "object") {
      Object.entries(deltas).forEach(([id, delta]) => {
        if (!ESSENCE_PRIMES.includes(id)) return;
        densityDeltaByEssence[id] += toNumberSafe(delta, 0);
      });
    }
  });

  const basePurity = clamp(1 - taintBaseline * 0.5, 0, 1);
  const weatherTaintNudge =
    weatherType === "fog"
      ? 0.06 * weatherIntensity
      : weatherType === "storm"
        ? 0.03 * weatherIntensity
        : weatherType === "drought"
          ? 0.02 * weatherIntensity
          : 0;

  const anomalyTaintNudge = anomalyDefs.reduce(
    (sum, def) => sum + clamp(toNumberSafe(def?.taintNudge, 0), -0.2, 0.2),
    0,
  );
  const totalTaintNudge = clamp(weatherTaintNudge + anomalyTaintNudge, -0.2, 0.2);

  const compositionByEssence = ESSENCE_PRIMES.reduce((acc, e) => {
    const density = clamp(toNumberSafe(densities?.[e], 0) + toNumberSafe(densityDeltaByEssence[e], 0), 0, 1);
    const taint = clamp(taintBaseline + totalTaintNudge, 0, 1);
    acc[e] = {
      density,
      purity: clamp(basePurity - totalTaintNudge * 0.5, 0, 1),
      taint,
    };
    return acc;
  }, {});

  const ones = ESSENCE_PRIMES.reduce((acc, e) => {
    acc[e] = 1;
    return acc;
  }, {});

  const drawMultByEssence = ESSENCE_PRIMES.reduce((acc, e) => {
    acc[e] = dominant.has(e) ? drawDominant : drawOff;
    return acc;
  }, {});
  const refineYieldMultByEssence = ESSENCE_PRIMES.reduce((acc, e) => {
    acc[e] = dominant.has(e) ? refineDominant : refineOff;
    return acc;
  }, {});

  const applyEssenceMult = (map, updates) => {
    Object.entries(updates || {}).forEach(([essenceId, mult]) => {
      if (!ESSENCE_PRIMES.includes(essenceId)) return;
      map[essenceId] = clamp(toNumberSafe(map[essenceId], 1) * toNumberSafe(mult, 1), 0.9, 1.2);
    });
  };

  let stabilityCapDeltaTimed = stabilityCapDelta;
  if (resolvedTimeOfDay === "dawn") stabilityCapDeltaTimed += 5;
  if (resolvedTimeOfDay === "night") stabilityCapDeltaTimed -= 2;
  stabilityCapDeltaTimed = clamp(stabilityCapDeltaTimed, -20, 20);

  if (resolvedTimeOfDay === "dawn") {
    applyEssenceMult(drawMultByEssence, { light: 1.05, life: 1.05, shadow: 0.98 });
    applyEssenceMult(refineYieldMultByEssence, { light: 1.03, life: 1.03 });
  } else if (resolvedTimeOfDay === "dusk") {
    applyEssenceMult(drawMultByEssence, { shadow: 1.06, air: 1.04 });
    applyEssenceMult(refineYieldMultByEssence, { shadow: 1.02 });
  } else if (resolvedTimeOfDay === "night") {
    applyEssenceMult(drawMultByEssence, { shadow: 1.03, time: 1.03, space: 1.02 });
  }

  const compressRiskMultByEssence = { ...ones };
  const potencyMultByEssence = { ...ones };
  const contaminationRiskMultByEssence = { ...ones };

  anomalyDefs.forEach((def) => {
    applyEssenceMult(drawMultByEssence, def?.drawMultByEssence);
    applyEssenceMult(refineYieldMultByEssence, def?.refineYieldMultByEssence);
    applyEssenceMult(compressRiskMultByEssence, def?.compressRiskMultByEssence);
    applyEssenceMult(potencyMultByEssence, def?.potencyMultByEssence);
  });

  if (weatherType === "rain") {
    applyEssenceMult(drawMultByEssence, { water: 1.03, fire: 0.98 });
    applyEssenceMult(refineYieldMultByEssence, { water: 1.04, fire: 0.98 });
    applyEssenceMult(compressRiskMultByEssence, { fire: 1.05 });
    applyEssenceMult(contaminationRiskMultByEssence, { water: 1.03, earth: 1.02 });
  } else if (weatherType === "storm") {
    applyEssenceMult(drawMultByEssence, { lightning: 1.06, air: 1.04 });
    applyEssenceMult(refineYieldMultByEssence, { lightning: 1.03, air: 1.01 });
    applyEssenceMult(compressRiskMultByEssence, { lightning: 1.08, air: 1.04 });
    applyEssenceMult(contaminationRiskMultByEssence, { lightning: 1.06, water: 1.03 });
  } else if (weatherType === "drought") {
    applyEssenceMult(drawMultByEssence, { fire: 1.04, water: 0.97 });
    applyEssenceMult(refineYieldMultByEssence, { fire: 1.02, water: 0.96 });
    applyEssenceMult(compressRiskMultByEssence, { fire: 1.03, earth: 1.02 });
    applyEssenceMult(contaminationRiskMultByEssence, { earth: 1.06, air: 1.03 });
  } else if (weatherType === "fog") {
    applyEssenceMult(drawMultByEssence, { shadow: 1.04, light: 0.97 });
    applyEssenceMult(refineYieldMultByEssence, { shadow: 1.02, light: 0.98 });
    applyEssenceMult(compressRiskMultByEssence, { light: 1.04, shadow: 1.02 });
    ESSENCE_PRIMES.forEach((e) => {
      contaminationRiskMultByEssence[e] = clamp(contaminationRiskMultByEssence[e] * (1 + 0.12 * weatherIntensity), 0.9, 1.2);
    });
  }

  if (isMidnightWindow) {
    ESSENCE_PRIMES.forEach((e) => {
      compressRiskMultByEssence[e] = clamp(compressRiskMultByEssence[e] * 1.12, 0.9, 1.2);
      potencyMultByEssence[e] = clamp(potencyMultByEssence[e] * 1.08, 0.9, 1.2);
    });
    applyEssenceMult(potencyMultByEssence, { time: 1.04, space: 1.03, shadow: 1.02 });
  }

  return {
    compositionByEssence,
    global: {
      drawMultByEssence,
      refineYieldMultByEssence,
      stabilityCapDelta: stabilityCapDeltaTimed,
      compressRiskMultByEssence,
      potencyMultByEssence,
      contaminationRiskMultByEssence,
    },
    provenance: {
      biome: biome || null,
      timeOfDay: resolvedTimeOfDay || null,
      weatherType: typeof weatherNode?.type === "string" ? weatherNode.type : null,
      weatherIntensity: Number.isFinite(weatherNode?.intensity) ? weatherNode.intensity : null,
      anomalyIds: resolvedAnomalyIds,
      locationId: locationId || null,
    },
    tags: [],
  };
}

function ambientDensity(ambient, essence) {
  if (isAmbientSnapshot(ambient)) {
    return clamp(toNumberSafe(ambient.compositionByEssence?.[essence]?.density, 0), 0, 1);
  }
  return clamp(toNumberSafe(ambient?.[essence], 0), 0, 1);
}

export function ensureEssenceWeavingState(state) {
  const player = state?.player;
  const world = state?.world;
  if (!player || !world) return state;

  const locationId = world.location?.current || world.location || "starting_zone";

  const biome = world.location?.biome || null;
  const time = world.time || null;
  const weather = world.weather || null;

  const existingEssence =
    world.essence && typeof world.essence === "object" && !Array.isArray(world.essence)
      ? world.essence
      : {};
  const existingAmbient = existingEssence.ambient;
  const densities =
    existingAmbient && typeof existingAmbient === "object" && !Array.isArray(existingAmbient) && !isAmbientSnapshot(existingAmbient)
      ? existingAmbient
      : null;

  const existingAnomalies =
    existingEssence.anomalies && typeof existingEssence.anomalies === "object" && !Array.isArray(existingEssence.anomalies)
      ? existingEssence.anomalies
      : {};
  const instances = Array.isArray(existingAnomalies.instances) ? existingAnomalies.instances : [];
  const normalizedAnomalies = { instances };

  const ambient = toAmbientSnapshot(densities || deriveAmbientFromLocationId(locationId), {
    locationId,
    biome,
    time,
    weather,
    anomalies: normalizedAnomalies,
  });

  const nextWorld = {
    ...world,
    essence: {
      ...existingEssence,
      ambient,
      sources: Array.isArray(world.essence?.sources) ? world.essence.sources : [],
      anomalies: normalizedAnomalies,
    },
  };

  const nextPlayer = ensurePlayerMagic(player);
  const hydrated = {
    ...state,
    player: nextPlayer,
    world: nextWorld,
  };

  return recomputeManaFree(hydrated);
}

export function processEssenceEcologyTurn(state) {
  const hydrated = ensureEssenceWeavingState(state);
  const world = hydrated?.world;
  const player = hydrated?.player;
  if (!world || !player) return hydrated;

  const locationId = world.location?.current || world.location || "starting_zone";
  const biome = world.location?.biome || null;
  const turn = toNumberSafe(world.turnCount, 0);

  const essence = world.essence && typeof world.essence === "object" && !Array.isArray(world.essence)
    ? world.essence
    : {};
  const anomalyState = essence.anomalies && typeof essence.anomalies === "object" && !Array.isArray(essence.anomalies)
    ? essence.anomalies
    : {};
  const instances = Array.isArray(anomalyState.instances)
    ? anomalyState.instances.filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry))
    : [];

  let nextInstances = instances.map((entry) => ({ ...entry }));

  if (nextInstances.length === 0 && biome) {
    const candidates = getEssenceAnomalyIdsForBiome(biome);
    if (candidates.length) {
      const pickedId = randomChoice(candidates);
      const def = getEssenceAnomalyById(pickedId);
      const interval = Math.max(1, Math.floor(toNumberSafe(def?.driftIntervalTurns, 12)));
      nextInstances.push({
        id: pickedId,
        biomeId: biome,
        locationId,
        nextDriftTurn: turn + interval,
      });
    }
  }

  nextInstances = nextInstances.map((inst) => {
    const id = typeof inst.id === "string" ? inst.id.trim().toLowerCase() : null;
    const def = id ? getEssenceAnomalyById(id) : null;
    if (!def) return inst;

    const nextDriftTurn = toNumberSafe(inst.nextDriftTurn, turn + 1);
    if (nextDriftTurn > turn) return { ...inst, id };

    const resolvedBiome = typeof inst.biomeId === "string" && inst.biomeId ? inst.biomeId : biome;
    const locs = resolvedBiome ? findLocationsByZone(resolvedBiome) : [];
    const candidates = locs.map((loc) => loc?.id).filter((locId) => locId && locId !== inst.locationId);
    const nextLoc = candidates.length ? randomChoice(candidates) : inst.locationId;
    const interval = Math.max(1, Math.floor(toNumberSafe(def?.driftIntervalTurns, 12)));
    return {
      ...inst,
      id,
      biomeId: resolvedBiome,
      locationId: nextLoc,
      nextDriftTurn: turn + interval,
    };
  });

  const ambient = world?.essence?.ambient || {};
  const avgTaint = ESSENCE_PRIMES.reduce(
    (sum, e) => sum + clamp(toNumberSafe(ambient?.compositionByEssence?.[e]?.taint, 0), 0, 1),
    0,
  ) / ESSENCE_PRIMES.length;

  const totals = computeStoredEssenceTotals(player.magic);
  const interferenceScore = computeInterferenceScore(totals);

  const resonanceDampingRank = getPerkRank(player.magic, "resonance_damping");
  const resonanceDecay = 2 + 0.8 * resonanceDampingRank;
  const nextMagicAfterResonance = applyResonanceDelta(
    player.magic,
    -resonanceDecay,
  );

  const nextCharges = (Array.isArray(nextMagicAfterResonance?.charges) ? nextMagicAfterResonance.charges : [])
    .filter((charge) => {
      const expires = toNumberSafe(charge?.expiresTurn, Infinity);
      return !(Number.isFinite(expires) && expires <= turn);
    })
    .map((charge) => {
      const lastTouchedTurn = toNumberSafe(charge?.lastTouchedTurn, toNumberSafe(charge?.createdTurn, turn));
      const turnsElapsed = Math.max(0, turn - lastTouchedTurn);
      if (turnsElapsed <= 0) return { ...charge, lastTouchedTurn: turn };

      const baseDecay = 0.004;
      const decayRate = clamp(baseDecay + 0.018 * interferenceScore + 0.012 * avgTaint, 0, 0.08);
      const decayFactor = clamp(1 - decayRate * turnsElapsed, 0, 1);

      const amount = Math.max(0, toNumberSafe(charge?.amount, 0) * decayFactor);
      const purity = clamp(toNumberSafe(charge?.purity, 1) * (0.98 + 0.02 * decayFactor), 0, 1);
      const potency = clamp(toNumberSafe(charge?.potency, 1) * (0.97 + 0.03 * decayFactor), 0, 10);

      return {
        ...charge,
        amount,
        purity,
        potency,
        lastTouchedTurn: turn,
      };
    })
    .filter((charge) => toNumberSafe(charge?.amount, 0) > 0.01);

  const nextReservesTaint = { ...(nextMagicAfterResonance?.reservesTaint || {}) };
  ESSENCE_PRIMES.forEach((e) => {
    nextReservesTaint[e] = clamp(toNumberSafe(nextReservesTaint[e], 0) * 0.995, 0, 1);
  });

  const nextActiveWorkings = (Array.isArray(nextMagicAfterResonance?.activeWorkings)
    ? nextMagicAfterResonance.activeWorkings
    : [])
    .filter((w) => w && typeof w === "object" && !Array.isArray(w))
    .filter((w) => {
      const expires = toNumberSafe(w.expiresTurn, Infinity);
      return !(Number.isFinite(expires) && expires <= turn);
    });

  const nextPlayer = {
    ...player,
    magic: {
      ...nextMagicAfterResonance,
      charges: nextCharges,
      reservesTaint: nextReservesTaint,
      interference: { score: interferenceScore },
      activeWorkings: nextActiveWorkings,
    },
  };

  const nextWorld = {
    ...world,
    essence: {
      ...essence,
      anomalies: { instances: nextInstances },
    },
  };

  return ensureEssenceWeavingState({
    ...hydrated,
    player: nextPlayer,
    world: nextWorld,
  });
}

function ensurePlayerMagic(player) {
  const magic = player.magic && typeof player.magic === "object" ? player.magic : null;
  const stability = magic?.stability || {};
  const baseMax = 100;
  const nextMagic = {
    stability: {
      body: {
        current: toNumberSafe(stability.body?.current, baseMax),
        max: toNumberSafe(stability.body?.max, baseMax),
      },
      mind: {
        current: toNumberSafe(stability.mind?.current, baseMax),
        max: toNumberSafe(stability.mind?.max, baseMax),
      },
      cognitive: {
        current: toNumberSafe(stability.cognitive?.current, baseMax),
        max: toNumberSafe(stability.cognitive?.max, baseMax),
      },
    },
    affinity: ensureEssenceMap(magic?.affinity, 0),
    attunement: ensureEssenceMap(magic?.attunement, 1),
    reserves: ensureEssenceMap(magic?.reserves, 0),
    reservesTaint: ensureEssenceMap(magic?.reservesTaint, 0),
    charges: Array.isArray(magic?.charges) ? magic.charges : [],
    anchors: {
      self: magic?.anchors?.self ?? null,
      area: magic?.anchors?.area ?? null,
      itemId: magic?.anchors?.itemId ?? null,
    },
    stance: magic?.stance || { kind: "open", essence: null },
    interference:
      magic?.interference && typeof magic.interference === "object"
        ? magic.interference
        : { score: 0 },
    resonance:
      magic?.resonance && typeof magic.resonance === "object"
        ? magic.resonance
        : { current: 0, max: 100, state: "quiet" },
    perks: Array.isArray(magic?.perks) ? magic.perks : [],
    activeWorkings: Array.isArray(magic?.activeWorkings) ? magic.activeWorkings : [],
    paradigm: magic?.paradigm || {
      id: "conservationist",
      tenets: ["no_creation", "transform_allowed", "move_allowed"],
      contradictions: ["void_creation", "true_ex_nihilo"],
    },
    memoryShards: Array.isArray(magic?.memoryShards) ? magic.memoryShards : [],
    prepared: magic?.prepared ?? null,
    casting: magic?.casting && typeof magic.casting === "object" ? magic.casting : null,
    mana: {
      max: toNumberSafe(magic?.mana?.max, toNumberSafe(player.mana?.max, 50)),
      current: toNumberSafe(
        magic?.mana?.current,
        toNumberSafe(magic?.mana?.max, toNumberSafe(player.mana?.max, 50)),
      ),
    },
  };

  return {
    ...player,
    magic: nextMagic,
  };
}

function ensureEssenceMap(input, fallbackValue) {
  const obj = input && typeof input === "object" ? input : {};
  return ESSENCE_PRIMES.reduce((acc, key) => {
    acc[key] = toNumberSafe(obj[key], fallbackValue);
    return acc;
  }, {});
}

export function recomputeManaFree(state) {
  const player = state?.player;
  const magic = player?.magic;
  if (!player || !magic) return state;

  const reserves = magic.reserves || {};
  const charges = Array.isArray(magic.charges) ? magic.charges : [];

  const reserveUsed = ESSENCE_PRIMES.reduce(
    (sum, e) => sum + toNumberSafe(reserves[e], 0),
    0,
  );
  const chargeUsed = charges.reduce((sum, charge) => {
    const amount = toNumberSafe(charge?.amount, 0);
    const density = clamp(toNumberSafe(charge?.density, 1), 0.1, 100);
    return sum + amount / density;
  }, 0);

  const used = reserveUsed + chargeUsed;
  const max = toNumberSafe(magic.mana?.max, 50);
  const free = clamp(max - used, 0, max);

  return {
    ...state,
    player: {
      ...player,
      magic: {
        ...magic,
        mana: {
          ...magic.mana,
          max,
          current: free,
        },
      },
    },
  };
}

const stabilityPct = (stabilityNode) => {
  const current = toNumberSafe(stabilityNode?.current, 0);
  const max = toNumberSafe(stabilityNode?.max, 100);
  if (max <= 0) return 0;
  return clamp(current / max, 0, 1);
};

function applyStabilityDelta(magic, delta) {
  const next = { ...magic.stability };
  for (const key of Object.keys(delta || {})) {
    if (!next[key]) continue;
    const max = toNumberSafe(next[key].max, 100);
    const current = toNumberSafe(next[key].current, max);
    next[key] = {
      ...next[key],
      current: clamp(current + toNumberSafe(delta[key], 0), 0, max),
    };
  }
  return { ...magic, stability: next };
}

export function magicSense(state, action) {
  const hydrated = ensureEssenceWeavingState(state);
  const world = hydrated.world;
  const ambient = world?.essence?.ambient || {};
  const requested = normalizeEssenceId(action?.essence);

  const provenance = isAmbientSnapshot(ambient) ? ambient.provenance : null;
  const anomalyNames = Array.isArray(provenance?.anomalyIds)
    ? provenance.anomalyIds
        .map((id) => getEssenceAnomalyById(id)?.name || null)
        .filter(Boolean)
    : [];

  const entries = ESSENCE_PRIMES.map((e) => ({
    essence: e,
    strength: ambientDensity(ambient, e),
  }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 4);

  if (requested) {
    const strength = ambientDensity(ambient, requested);
    const mult = clamp(toNumberSafe(ambient?.global?.drawMultByEssence?.[requested], 1), 0.9, 1.2);
    return {
      state: hydrated,
      description:
        strength <= 0.01
          ? `You sense almost no ${requested} essence here.`
          : `You sense ${requested} essence (strength ${(strength * 100).toFixed(0)}%, draw x${mult.toFixed(2)}).`,
      readOnly: true,
    };
  }

  const topLine = entries
    .map((e) => `${capitalize(e.essence)} ${(e.strength * 100).toFixed(0)}%`)
    .join(" | ");

  const contextParts = [];
  if (provenance?.biome) contextParts.push(`Biome: ${provenance.biome}`);
  if (provenance?.timeOfDay) contextParts.push(`Time: ${provenance.timeOfDay}`);
  if (provenance?.weatherType) {
    const intensity = Number.isFinite(provenance.weatherIntensity)
      ? ` ${(provenance.weatherIntensity * 100).toFixed(0)}%`
      : "";
    contextParts.push(`Weather: ${provenance.weatherType}${intensity}`);
  }
  if (anomalyNames.length) contextParts.push(`Anomalies: ${anomalyNames.join(", ")}`);
  const contextLine = contextParts.length ? ` (${contextParts.join(" | ")})` : "";

  return {
    state: hydrated,
    description: entries[0]?.strength
      ? `Ambient essences: ${topLine}${contextLine}`
      : "You sense no notable ambient essence.",
    readOnly: true,
  };
}

export function magicAttune(state, action) {
  const hydrated = ensureEssenceWeavingState(state);
  const player = hydrated.player;
  const magic = player.magic;
  const stance = String(action?.stance || "open").toLowerCase();
  const essence = normalizeEssenceId(action?.essence);

  const kind = stance === "focused" ? "focused" : stance === "guarded" ? "guarded" : "open";
  const nextMagic = {
    ...magic,
    stance: { kind, essence: kind === "focused" ? essence : null },
  };

  const nextState = recomputeManaFree({
    ...hydrated,
    player: {
      ...player,
      magic: nextMagic,
    },
  });

  return {
    state: nextState,
    description:
      kind === "focused" && essence
        ? `You attune: focused on ${essence}.`
        : `You attune: ${kind}.`,
  };
}

export function magicDraw(state, action) {
  const hydrated = ensureEssenceWeavingState(state);
  const player = hydrated.player;
  const magic = player.magic;
  const world = hydrated.world;

  const essence = normalizeEssenceId(action?.essence);
  if (!essence) {
    return { ok: false, reason: "Unknown essence.", state: hydrated };
  }

  const ambient = world?.essence?.ambient || {};
  const env = ambientDensity(ambient, essence);
  if (env <= 0.01) {
    return {
      ok: false,
      reason: `There is no usable ${essence} essence here to draw.`,
      state: hydrated,
    };
  }

  const stance = magic.stance?.kind || "open";
  const stanceMult =
    stance === "focused" && magic.stance?.essence === essence
      ? 1.25
      : stance === "guarded"
        ? 0.75
        : 1.0;
  const att = clamp(0.25 + 0.075 * toNumberSafe(magic.attunement?.[essence], 1), 0, 2);
  const aff = 1 + clamp(toNumberSafe(magic.affinity?.[essence], 0), -0.5, 2);

  const drawMult = clamp(toNumberSafe(ambient?.global?.drawMultByEssence?.[essence], 1), 0.9, 1.2);

  const baseDrawRate = 4;
  const drawRate = baseDrawRate * env * drawMult * att * aff * stanceMult;
  const requested = toNumberSafe(action?.amount, drawRate);
  const manaFree = toNumberSafe(magic.mana?.current, 0);
  const drawAmount = clamp(Math.min(requested, drawRate, manaFree), 0, manaFree);

  if (drawAmount <= 0.01) {
    return { ok: false, reason: "Your mana pool is full.", state: hydrated };
  }

  const bodyCostPerQuantum = 0.15;
  const bodyCost = drawAmount * bodyCostPerQuantum;

  const prevReserve = toNumberSafe(magic.reserves?.[essence], 0);
  const prevTaint = clamp(toNumberSafe(magic.reservesTaint?.[essence], 0), 0, 1);
  const sampleTaint = clamp(
    clamp(toNumberSafe(ambient?.compositionByEssence?.[essence]?.taint, 0), 0, 1) *
      clamp(toNumberSafe(ambient?.global?.contaminationRiskMultByEssence?.[essence], 1), 0.9, 1.2),
    0,
    1,
  );
  const combinedTaint =
    prevReserve + drawAmount > 0
      ? clamp((prevTaint * prevReserve + sampleTaint * drawAmount) / (prevReserve + drawAmount), 0, 1)
      : prevTaint;
  const interferenceScore = clamp(toNumberSafe(magic?.interference?.score, 0), 0, 1);
  const avgTaint = ESSENCE_PRIMES.reduce(
    (sum, e) => sum + clamp(toNumberSafe(ambient?.compositionByEssence?.[e]?.taint, 0), 0, 1),
    0,
  ) / ESSENCE_PRIMES.length;
  const pressure = computeEnvironmentalPressure(ambient);
  const resonanceGain = 0.6 + 0.03 * drawAmount + 4 * interferenceScore + 2.5 * avgTaint + 1.5 * pressure;

  const nextMagic = applyResonanceDelta(
    applyStabilityDelta(
      {
        ...magic,
        reserves: {
          ...magic.reserves,
          [essence]: prevReserve + drawAmount,
        },
        reservesTaint: {
          ...magic.reservesTaint,
          [essence]: combinedTaint,
        },
      },
      { body: -bodyCost },
    ),
    resonanceGain,
  );


  const nextState = recomputeManaFree({
    ...hydrated,
    player: {
      ...player,
      magic: nextMagic,
    },
  });

  return {
    state: nextState,
    description: `You draw ${drawAmount.toFixed(1)} ${essence} essence into your body.`,
  };
}

export function magicRefine(state, action) {
  const hydrated = ensureEssenceWeavingState(state);
  const player = hydrated.player;
  const magic = player.magic;
  const essence = normalizeEssenceId(action?.essence);
  const amount = toNumberSafe(action?.amount, 0);
  const method = action?.method ? String(action.method).toLowerCase() : null;

  if (!essence || amount <= 0) {
    return { ok: false, reason: "Invalid refine command.", state: hydrated };
  }

  const reserves = toNumberSafe(magic.reserves?.[essence], 0);
  if (reserves < amount) {
    return {
      ok: false,
      reason: `Not enough ${essence} essence in reserve.`,
      state: hydrated,
    };
  }

  const ambient = hydrated.world?.essence?.ambient || {};
  const refineMult = clamp(toNumberSafe(ambient?.global?.refineYieldMultByEssence?.[essence], 1), 0.9, 1.2);
  const contaminationMult = clamp(toNumberSafe(ambient?.global?.contaminationRiskMultByEssence?.[essence], 1), 0.9, 1.2);
  const ambientTaint = clamp(toNumberSafe(ambient?.compositionByEssence?.[essence]?.taint, 0), 0, 1);
  const reserveTaint = clamp(toNumberSafe(magic.reservesTaint?.[essence], 0), 0, 1);
  const potencyMult = clamp(toNumberSafe(ambient?.global?.potencyMultByEssence?.[essence], 1), 0.9, 1.2);

  const cleanRefiningRank = getPerkRank(magic, "clean_refining");
  const yieldRank = getPerkRank(magic, "refine_yield");
  const refineYieldMult = clamp(1 + 0.03 * yieldRank, 0.9, 1.2);

  const mindPct = stabilityPct(magic.stability?.mind);
  const refineSkillFactor = clamp(0.15 * toNumberSafe(magic.attunement?.[essence], 1) + 0.5 * mindPct, 0, 1);
  const blendedTaint = clamp((ambientTaint * 0.55 + reserveTaint * 0.45) * contaminationMult, 0, 1);
  const taintPenalty = clamp(blendedTaint * (0.32 - 0.04 * cleanRefiningRank), 0, 0.35);
  const purity = clamp(0.55 + 0.35 * refineSkillFactor - taintPenalty, 0, 1);
  const mindCost = amount * 0.1;

  const turn = toNumberSafe(hydrated.world?.turnCount, 0);
  const lifetime = 50 * (0.6 + 0.4 * purity);
  const id = `chg_${turn}_${Math.floor(random() * 1e9)}`;
  const refinedAmount = amount * refineMult * refineYieldMult;
  const potency = clamp(potencyMult * (0.85 + 0.15 * purity), 0, 10);
  const charge = {
    id,
    essence,
    amount: refinedAmount,
    density: 1.0,
    purity,
    potency,
    binding: method
      ? { type: "rhythm", pattern: method }
      : { type: "rhythm", pattern: "steady" },
    createdTurn: turn,
    lastTouchedTurn: turn,
    expiresTurn: turn + Math.max(1, Math.round(lifetime)),
  };

  const nextMagic = applyStabilityDelta(
    {
      ...magic,
      reserves: {
        ...magic.reserves,
        [essence]: reserves - amount,
      },
      charges: [...(magic.charges || []), charge],
    },
    { mind: -mindCost },
  );

  const interferenceScore = clamp(toNumberSafe(nextMagic?.interference?.score, 0), 0, 1);
  const avgTaint = ESSENCE_PRIMES.reduce(
    (sum, e) => sum + clamp(toNumberSafe(ambient?.compositionByEssence?.[e]?.taint, 0), 0, 1),
    0,
  ) / ESSENCE_PRIMES.length;
  const pressure = computeEnvironmentalPressure(ambient);
  const resonanceGain = 2 + 0.06 * amount + 6 * interferenceScore + 3.5 * avgTaint + 2 * pressure;
  const damp = clamp(1 - 0.1 * getPerkRank(magic, "resonance_damping"), 0.5, 1);
  const nextMagicWithResonance = applyResonanceDelta(nextMagic, resonanceGain * damp);

  const nextState = recomputeManaFree({
    ...hydrated,
    player: { ...player, magic: nextMagicWithResonance },
  });

  return {
    state: nextState,
    description: `You refine ${amount} ${essence} essence into a stable charge (${refinedAmount.toFixed(1)} yield, purity ${(purity * 100).toFixed(0)}%).`,
  };
}

export function magicCompress(state, action) {
  const hydrated = ensureEssenceWeavingState(state);
  const player = hydrated.player;
  const magic = player.magic;
  const essence = normalizeEssenceId(action?.essence);
  const tier = clamp(toNumberSafe(action?.tier, 0), 0, 3);
  const method = action?.method ? String(action.method).toLowerCase() : null;

  if (!essence) {
    return { ok: false, reason: "Unknown essence.", state: hydrated };
  }

  const charges = Array.isArray(magic.charges) ? magic.charges : [];
  const idx = charges
    .map((c, i) => ({ c, i }))
    .reverse()
    .find(({ c }) =>
      c?.essence === essence && (method ? c?.binding?.pattern === method : true),
    )?.i;

  if (!Number.isFinite(idx)) {
    return {
      ok: false,
      reason: `No ${essence} charge found to compress.`,
      state: hydrated,
    };
  }

  const charge = charges[idx];
  const targetDensity = DENSITY_BY_TIER[tier] ?? 1.0;
  const amount = toNumberSafe(charge.amount, 0);
  const currentDensity = clamp(toNumberSafe(charge.density, 1), 0.1, 100);
  if (targetDensity <= currentDensity + 1e-6) {
    return {
      ok: false,
      reason: `That charge is already compressed at density ${currentDensity.toFixed(1)}.`,
      state: hydrated,
    };
  }

  const bodyPct = stabilityPct(magic.stability?.body);
  const mindPct = stabilityPct(magic.stability?.mind);
  const risk = (targetDensity - 1) * 0.06 + (amount / 50) * 0.04;
  const stabilityPenalty = 0.15 * (1 - bodyPct) + 0.1 * (1 - mindPct);

  const ambient = hydrated.world?.essence?.ambient || {};
  const compressRiskMult = clamp(
    toNumberSafe(ambient?.global?.compressRiskMultByEssence?.[essence], 1),
    0.9,
    1.2,
  );

  const saferCompressionRank = getPerkRank(magic, "safer_compression");
  const perkMisfireMult = clamp(1 - 0.07 * saferCompressionRank, 0.55, 1);
  const anchored = Boolean(magic.anchors?.self || magic.anchors?.area || magic.anchors?.itemId);
  const anchorMisfireMult = anchored ? 0.9 : 1;
  const resonance = clamp(toNumberSafe(magic?.resonance?.current, 0), 0, 100);
  const resonanceMisfireMult = clamp(1 + 0.35 * (resonance / 100), 1, 1.35);
  const misfireChance = clamp(
    (0.03 + risk + stabilityPenalty) * compressRiskMult * perkMisfireMult * anchorMisfireMult * resonanceMisfireMult,
    0,
    1,
  );
  const misfire = random() < misfireChance;

  const perkCostMult = clamp(1 - 0.05 * saferCompressionRank, 0.6, 1);
  const bodyCost = ((2 * amount * targetDensity ** 1.2) / 10) * perkCostMult;
  const mindCost = ((1 * amount * targetDensity ** 1.1) / 10) * perkCostMult;

  let nextCharge = { ...charge, density: targetDensity };
  let extraDelta = {};
  let resultLine = `You compress the charge to density ${targetDensity.toFixed(1)}.`;
  let outcomeTag = "clean_success";

  if (method) {
    nextCharge = {
      ...nextCharge,
      binding: { ...(nextCharge.binding || {}), pattern: method },
    };
  }

  if (misfire) {
    const outcome = randomChoice([
      { id: "partial", weight: 3 },
      { id: "strain", weight: 3 },
      { id: "leak", weight: 2 },
      { id: "flare", weight: 1 },
    ])?.id;

    if (outcome === "partial") {
      const reduced = clamp(1 + (targetDensity - 1) * 0.5, 1, targetDensity);
      nextCharge = { ...nextCharge, density: reduced };
      resultLine = `Compression misfires; density only reaches ${reduced.toFixed(1)}.`;
      outcomeTag = "partial_misfire";
    } else if (outcome === "leak") {
      const lost = clamp(amount * 0.15, 0, amount);
      nextCharge = { ...nextCharge, amount: Math.max(0, amount - lost) };
      extraDelta = { body: -Math.max(1, lost * 0.2) };
      resultLine = `Compression leaks; the charge loses ${lost.toFixed(1)} essence.`;
      outcomeTag = "partial_misfire";
    } else if (outcome === "flare") {
      extraDelta = { mind: -Math.max(1, amount * 0.15), body: -Math.max(1, amount * 0.1) };
      resultLine = "Compression flares out of control; your nerves burn.";
      outcomeTag = "backlash";
    } else {
      extraDelta = { body: -Math.max(2, amount * 0.25) };
      resultLine = "Compression strains your body; your meridians ache.";
      outcomeTag = "strained_success";
    }
  } else if (stabilityPenalty > 0.18 || resonance >= 60) {
    outcomeTag = "strained_success";
  }

  const nextCharges = [...charges];
  nextCharges[idx] = nextCharge;

  const nextMagicBase = applyStabilityDelta(
    { ...magic, charges: nextCharges },
    { body: -bodyCost, mind: -mindCost, ...extraDelta },
  );

  const interferenceScore = clamp(toNumberSafe(nextMagicBase?.interference?.score, 0), 0, 1);
  const avgTaint = ESSENCE_PRIMES.reduce(
    (sum, e) => sum + clamp(toNumberSafe(ambient?.compositionByEssence?.[e]?.taint, 0), 0, 1),
    0,
  ) / ESSENCE_PRIMES.length;
  const pressure = computeEnvironmentalPressure(ambient);
  const resonanceGain = 4 + 0.08 * amount * targetDensity + 8 * interferenceScore + 4 * avgTaint + 3 * pressure;
  const damp = clamp(1 - 0.1 * getPerkRank(magic, "resonance_damping"), 0.5, 1);
  const nextMagic = applyResonanceDelta(nextMagicBase, resonanceGain * damp);

  const nextState = recomputeManaFree({
    ...hydrated,
    player: { ...player, magic: nextMagic },
  });

  return {
    state: nextState,
    description: `${resultLine} (${outcomeTag.replace(/_/g, " ")})`,
  };
}

export function magicAnchor(state, action) {
  const hydrated = ensureEssenceWeavingState(state);
  const player = hydrated.player;
  const magic = player.magic;
  const kind = String(action?.kind || "self").toLowerCase();
  const itemId = action?.itemId ? String(action.itemId) : null;

  const nextAnchors = {
    self: kind === "self" ? { kind: "self" } : magic.anchors?.self ?? null,
    area: kind === "area" ? { kind: "area", locationId: hydrated.world?.location?.current || null } : magic.anchors?.area ?? null,
    itemId: kind === "item" ? itemId : magic.anchors?.itemId ?? null,
  };

  const nextState = {
    ...hydrated,
    player: {
      ...player,
      magic: {
        ...magic,
        anchors: nextAnchors,
      },
    },
  };

  return {
    state: nextState,
    description:
      kind === "item" && itemId
        ? `You anchor your working to ${itemId}.`
        : kind === "area"
          ? "You anchor your working to the area."
          : "You anchor your working to yourself.",
  };
}

export function magicShape(state, action) {
  const hydrated = ensureEssenceWeavingState(state);
  const player = hydrated.player;
  const magic = player.magic;
  const essence = normalizeEssenceId(action?.essence);
  if (!essence) return { ok: false, reason: "Unknown essence.", state: hydrated };

  const form = action?.form ? String(action.form).toLowerCase() : "pulse";
  const amount = action?.amount != null ? clamp(toNumberSafe(action.amount, 0), 1, 200) : null;
  const turn = toNumberSafe(hydrated.world?.turnCount, 0);

  const prepared = {
    kind: "shape",
    essence,
    form,
    amount,
    createdTurn: turn,
  };

  const ambient = hydrated.world?.essence?.ambient || {};
  const pressure = computeEnvironmentalPressure(ambient);
  const resonanceGain = 0.8 + 0.4 * pressure;
  const damp = clamp(1 - 0.1 * getPerkRank(magic, "resonance_damping"), 0.5, 1);

  const nextState = {
    ...hydrated,
    player: {
      ...player,
      magic: { ...applyResonanceDelta(magic, resonanceGain * damp), prepared },
    },
  };

  return {
    state: nextState,
    description: `You shape ${essence} into a ${form}${amount ? ` (${amount})` : ""}.`,
  };
}

export function magicWeave(state, action) {
  const hydrated = ensureEssenceWeavingState(state);
  const player = hydrated.player;
  const magic = player.magic;
  const essences = Array.isArray(action?.essences)
    ? action.essences.map(normalizeEssenceId).filter(Boolean)
    : [];
  if (essences.length < 2) {
    return { ok: false, reason: "Weaving requires 2+ essences.", state: hydrated };
  }

  const pattern = action?.pattern ? String(action.pattern).toLowerCase() : "lattice";
  const turn = toNumberSafe(hydrated.world?.turnCount, 0);
  const prepared = {
    kind: "weave",
    essences,
    pattern,
    createdTurn: turn,
  };

  const ambient = hydrated.world?.essence?.ambient || {};
  const pressure = computeEnvironmentalPressure(ambient);
  const resonanceGain = 1.2 + 0.6 * pressure;
  const damp = clamp(1 - 0.1 * getPerkRank(magic, "resonance_damping"), 0.5, 1);

  const nextState = {
    ...hydrated,
    player: {
      ...player,
      magic: { ...applyResonanceDelta(magic, resonanceGain * damp), prepared },
    },
  };

  return {
    state: nextState,
    description: `You weave ${essences.join("+")} into a ${pattern}.`,
  };
}

function consumeFromCharges(magic, essence, requestedAmount) {
  let remaining = requestedAmount;
  const charges = Array.isArray(magic.charges) ? magic.charges : [];
  const updated = [];
  const used = [];

  for (const charge of charges) {
    if (remaining <= 0) {
      updated.push(charge);
      continue;
    }
    if (charge?.essence !== essence) {
      updated.push(charge);
      continue;
    }

    const available = toNumberSafe(charge.amount, 0);
    const take = Math.min(available, remaining);
    if (take > 0) {
      remaining -= take;
      used.push({ amount: take, density: toNumberSafe(charge.density, 1), purity: toNumberSafe(charge.purity, 0.5) });
    }
    const nextAmount = available - take;
    if (nextAmount > 0.001) {
      updated.push({ ...charge, amount: nextAmount });
    }
  }

  return {
    remaining,
    nextCharges: updated,
    used,
  };
}

function geometryFactor(formOrPattern) {
  const key = String(formOrPattern || "").toLowerCase();
  if (key === "jet") return 1.15;
  if (key === "cone") return 1.1;
  if (key === "wall") return 0.95;
  if (key === "vortex") return 1.25;
  if (key === "pulse") return 1.0;
  if (key === "lattice") return 1.05;
  if (key === "veil") return 0.9;
  if (key === "shield") return 0.95;
  return 1.0;
}

function capitalize(value) {
  const s = String(value || "");
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function magicRelease(state) {
  const hydrated = ensureEssenceWeavingState(state);
  const player = hydrated.player;
  const magic = player.magic;
  const prepared = magic.prepared;
  if (!prepared) {
    return { ok: false, reason: "Nothing is prepared to release.", state: hydrated };
  }

  const turn = toNumberSafe(hydrated.world?.turnCount, 0);

  if (prepared.kind === "shape") {
    const essence = normalizeEssenceId(prepared.essence);
    const desired = prepared.amount != null ? prepared.amount : 6;
    const { remaining, nextCharges, used } = consumeFromCharges(magic, essence, desired);
    let reservesUsed = 0;
    const reserveHave = toNumberSafe(magic.reserves?.[essence], 0);
    if (remaining > 0 && reserveHave > 0) {
      reservesUsed = Math.min(reserveHave, remaining);
    }
    if (remaining - reservesUsed > 0.001) {
      return {
        ok: false,
        reason: `Insufficient ${essence} to release (need ${desired}).`,
        state: hydrated,
      };
    }

    const totalUsed = desired;
    const densityAvg =
      used.length > 0
        ? used.reduce((s, u) => s + u.amount * clamp(toNumberSafe(u.density, 1), 0.1, 100), 0) /
          used.reduce((s, u) => s + u.amount, 0)
        : 1.0;
    const potency = 1 + 0.35 * (densityAvg - 1);
    const control = clamp(
      0.4 + 0.06 * toNumberSafe(magic.attunement?.[essence], 1) + 0.3 * stabilityPct(magic.stability?.mind),
      0,
      1.2,
    );
    const magnitude = totalUsed * potency * geometryFactor(prepared.form) * control;
    const mindCost = 1 + 0.06 * magnitude;
    const bodyCost = reservesUsed > 0 ? 0.5 + reservesUsed * 0.12 : 0;

    const ambient = hydrated.world?.essence?.ambient || {};
    const pressure = computeEnvironmentalPressure(ambient);
    const interferenceScore = clamp(toNumberSafe(magic?.interference?.score, 0), 0, 1);
    const avgTaint = ESSENCE_PRIMES.reduce(
      (sum, e) => sum + clamp(toNumberSafe(ambient?.compositionByEssence?.[e]?.taint, 0), 0, 1),
      0,
    ) / ESSENCE_PRIMES.length;
    const anchored = Boolean(magic.anchors?.self || magic.anchors?.area || magic.anchors?.itemId);
    const anchorMult = anchored ? 0.9 : 1;
    const resonanceGain =
      (2 + 0.05 * magnitude + 4 * interferenceScore + 2.5 * avgTaint + 2 * pressure) * anchorMult;
    const damp = clamp(1 - 0.1 * getPerkRank(magic, "resonance_damping"), 0.5, 1);

    const resonance = clamp(toNumberSafe(magic?.resonance?.current, 0), 0, 100);
    const outcomeTag = resonance >= 60 || stabilityPct(magic.stability?.mind) < 0.4 ? "strained_success" : "clean_success";

    const working = {
      id: `wrk_${turn}_${Math.floor(random() * 1e9)}`,
      kind: "shape",
      essence,
      form: prepared.form,
      magnitude,
      createdTurn: turn,
      expiresTurn: turn + 20,
    };

    const nextMagic = applyResonanceDelta(
      applyStabilityDelta(
        {
          ...magic,
          charges: nextCharges,
          reserves: {
            ...magic.reserves,
            [essence]: reserveHave - reservesUsed,
          },
          prepared: null,
          activeWorkings: [
            ...(Array.isArray(magic.activeWorkings) ? magic.activeWorkings : []),
            working,
          ],
        },
        { mind: -mindCost, body: -bodyCost },
      ),
      resonanceGain * damp,
    );

    const nextState = recomputeManaFree({
      ...hydrated,
      player: { ...player, magic: nextMagic },
    });

    return {
      state: nextState,
      description: `You release ${capitalize(essence)} ${prepared.form} (magnitude ${magnitude.toFixed(1)}). (${outcomeTag.replace(/_/g, " ")})`,
    };
  }

  if (prepared.kind === "weave") {
    const essences = prepared.essences.map(normalizeEssenceId).filter(Boolean);
    const perEssence = 5;
    let nextCharges = Array.isArray(magic.charges) ? magic.charges : [];
    let nextReserves = { ...magic.reserves };
    const usedMeta = [];

    for (const e of essences) {
      const result = consumeFromCharges({ ...magic, charges: nextCharges }, e, perEssence);
      nextCharges = result.nextCharges;
      let remaining = result.remaining;
      const reserveHave = toNumberSafe(nextReserves?.[e], 0);
      const reservesUsed = remaining > 0 ? Math.min(reserveHave, remaining) : 0;
      remaining -= reservesUsed;
      if (remaining > 0.001) {
        return {
          ok: false,
          reason: `Insufficient ${e} to weave (need ${perEssence}).`,
          state: hydrated,
        };
      }
      nextReserves[e] = reserveHave - reservesUsed;
      usedMeta.push({ essence: e, used: perEssence, usedFromReserve: reservesUsed, charges: result.used });
    }

    const purityAvg =
      usedMeta.length > 0
        ? usedMeta.reduce(
            (s, m) =>
              s +
                (m.charges.length
                  ? m.charges.reduce((ps, u) => ps + u.amount * u.purity, 0) /
                    m.charges.reduce((ps, u) => ps + u.amount, 0)
                  : 0.5),
            0,
          ) / usedMeta.length
        : 0.5;

    const oppositionPenalty =
      essences.includes("fire") && essences.includes("water")
        ? 0.25
        : essences.includes("light") && essences.includes("shadow")
          ? 0.35
          : essences.includes("air") && essences.includes("earth")
            ? 0.1
            : 0;

    const stabilityFactor =
      0.4 +
      0.3 * stabilityPct(magic.stability?.mind) +
      0.3 * stabilityPct(magic.stability?.cognitive);
    const baseCoherence = purityAvg * (1 - oppositionPenalty);
    const stableWeavesRank = getPerkRank(magic, "stable_weaves");
    const anchored = Boolean(magic.anchors?.self || magic.anchors?.area || magic.anchors?.itemId);
    const anchorCoherenceMult = anchored ? 1.05 : 1;
    const resonance = clamp(toNumberSafe(magic?.resonance?.current, 0), 0, 100);
    const resonanceCoherenceMult = clamp(1 - 0.25 * (resonance / 100), 0.6, 1);
    const coherence = clamp(
      baseCoherence * stabilityFactor * (1 + 0.03 * stableWeavesRank) * anchorCoherenceMult * resonanceCoherenceMult,
      0,
      1,
    );
    const amountTotal = essences.length * perEssence;
    const successChance = clamp(coherence - amountTotal / 200, 0, 1);

    const ambient = hydrated.world?.essence?.ambient || {};
    const pressure = computeEnvironmentalPressure(ambient);
    const interferenceScore = clamp(toNumberSafe(magic?.interference?.score, 0), 0, 1);
    const avgTaint = ESSENCE_PRIMES.reduce(
      (sum, e) => sum + clamp(toNumberSafe(ambient?.compositionByEssence?.[e]?.taint, 0), 0, 1),
      0,
    ) / ESSENCE_PRIMES.length;
    const backlashChance = clamp(
      0.02 + (1 - coherence) * 0.2 + 0.0025 * resonance + 0.08 * interferenceScore + 0.06 * avgTaint + 0.06 * pressure,
      0,
      1,
    );

    const success = random() < successChance;
    const backlash = random() < backlashChance;

    const cognitiveCost = 2 + 0.08 * amountTotal;
    const mindCost = 1 + 0.05 * amountTotal;
    const extra = backlash ? { body: -Math.max(2, amountTotal * 0.25) } : {};

    const nextMagic = applyStabilityDelta(
      {
        ...magic,
        charges: nextCharges,
        reserves: nextReserves,
        prepared: null,
      },
      { cognitive: -cognitiveCost, mind: -mindCost, ...extra },
    );

    const resonanceGain =
      (6 + 0.12 * amountTotal + 10 * interferenceScore + 4 * avgTaint + 3 * pressure) *
      (anchored ? 0.9 : 1);
    const damp = clamp(1 - 0.1 * getPerkRank(magic, "resonance_damping"), 0.5, 1);
    const nextMagicWithResonance = applyResonanceDelta(nextMagic, resonanceGain * damp);

    const outcomeTag = backlash
      ? "backlash"
      : success
        ? coherence >= 0.75
          ? "clean_success"
          : "strained_success"
        : "partial_misfire";

    const working = {
      id: `wrk_${turn}_${Math.floor(random() * 1e9)}`,
      kind: "weave",
      essences,
      pattern: prepared.pattern,
      coherence,
      createdTurn: turn,
      expiresTurn: turn + 15,
    };

    const nextState = recomputeManaFree({
      ...hydrated,
      player: {
        ...player,
        magic: {
          ...nextMagicWithResonance,
          activeWorkings: [
            ...(Array.isArray(nextMagicWithResonance.activeWorkings)
              ? nextMagicWithResonance.activeWorkings
              : []),
            working,
          ],
        },
      },
    });

    const outcome = success ? "holds" : "fails";
    const backlashLine = backlash ? " Backlash bites into your body." : "";
    return {
      state: nextState,
      description: `Your weave ${outcome} (coherence ${(coherence * 100).toFixed(0)}%).${backlashLine} (${outcomeTag.replace(/_/g, " ")})`,
    };
  }

  return { ok: false, reason: "Unknown prepared working.", state: hydrated };
}

