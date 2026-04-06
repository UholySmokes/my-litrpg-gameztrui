const MAGIC_ESSENCES = [
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

const ESSENCE_ALIASES = {
  ice: "water",
  frost: "water",
  holy: "light",
  radiant: "light",
  dark: "shadow",
  nature: "life",
  arcane: "creation",
};

const FORM_DEFINITIONS = {
  bolt: { baseMana: 8, baseStrain: 6, damage: 1.05, delivery: "instant", tags: [] },
  pulse: { baseMana: 10, baseStrain: 7, damage: 1.0, delivery: "instant", tags: [] },
  lance: { baseMana: 14, baseStrain: 9, damage: 1.25, delivery: "instant", tags: [] },
  cone: { baseMana: 13, baseStrain: 10, damage: 1.12, delivery: "instant", tags: ["AoE"] },
  wall: { baseMana: 12, baseStrain: 8, damage: 0.7, delivery: "sustained", tags: [] },
  shield: { baseMana: 9, baseStrain: 6, damage: 0.55, delivery: "sustained", tags: [] },
  vortex: { baseMana: 16, baseStrain: 12, damage: 1.18, delivery: "sustained", tags: ["AoE"] },
  veil: { baseMana: 11, baseStrain: 7, damage: 0.62, delivery: "sustained", tags: [] },
  lattice: { baseMana: 15, baseStrain: 11, damage: 1.08, delivery: "sustained", tags: [] },
};

const DEFAULT_DELIVERIES = ["instant", "sustained", "channeled"];

const BASE_PROFILE = Object.freeze({
  essences: ["fire", "water", "earth", "air"],
  forms: ["bolt", "pulse", "shield"],
  patterns: {
    shape: ["pulse", "wall", "shield"],
    weave: ["lattice"],
  },
  deliveries: DEFAULT_DELIVERIES,
  affinities: {},
  manaMultiplier: 1,
  strainMultiplier: 1,
  potencyByEssence: {},
});

const CLASS_MAGIC_PROFILES = {
  wanderer: BASE_PROFILE,
  mage: {
    ...BASE_PROFILE,
    essences: ["fire", "water", "air", "lightning", "light", "shadow"],
    forms: ["bolt", "pulse", "lance", "cone", "shield", "veil"],
    patterns: { shape: ["pulse", "wall", "shield"], weave: ["lattice", "vortex"] },
    manaMultiplier: 0.92,
    strainMultiplier: 0.95,
    potencyByEssence: { fire: 0.12, lightning: 0.14, shadow: 0.08 },
  },
  battlemage: {
    ...BASE_PROFILE,
    essences: ["fire", "earth", "air", "lightning"],
    forms: ["bolt", "pulse", "lance", "shield"],
    patterns: { shape: ["pulse", "wall", "shield"], weave: ["lattice"] },
    manaMultiplier: 0.96,
    strainMultiplier: 0.9,
    potencyByEssence: { fire: 0.1, earth: 0.08, lightning: 0.1 },
  },
  priest: {
    ...BASE_PROFILE,
    essences: ["light", "life", "water", "air"],
    forms: ["pulse", "shield", "veil", "lattice"],
    patterns: { shape: ["pulse", "shield"], weave: ["lattice", "veil"] },
    manaMultiplier: 0.94,
    strainMultiplier: 0.92,
    potencyByEssence: { light: 0.14, life: 0.14, water: 0.06 },
  },
  druid: {
    ...BASE_PROFILE,
    essences: ["water", "earth", "air", "life"],
    forms: ["pulse", "cone", "wall", "shield", "vortex"],
    patterns: { shape: ["pulse", "wall", "shield"], weave: ["lattice", "vortex"] },
    manaMultiplier: 0.95,
    strainMultiplier: 0.94,
    potencyByEssence: { life: 0.1, earth: 0.08, water: 0.08 },
  },
  warlock: {
    ...BASE_PROFILE,
    essences: ["shadow", "fire", "destruction", "time"],
    forms: ["bolt", "lance", "veil", "vortex"],
    patterns: { shape: ["pulse", "veil"], weave: ["lattice", "vortex"] },
    manaMultiplier: 1.02,
    strainMultiplier: 0.96,
    potencyByEssence: { shadow: 0.16, destruction: 0.14, fire: 0.08 },
  },
  summoner: {
    ...BASE_PROFILE,
    essences: ["life", "air", "space", "light"],
    forms: ["pulse", "shield", "lattice", "veil"],
    patterns: { shape: ["shield", "wall"], weave: ["lattice", "vortex"] },
    manaMultiplier: 0.98,
    strainMultiplier: 0.93,
    potencyByEssence: { life: 0.1, space: 0.12 },
  },
  templar: {
    ...BASE_PROFILE,
    essences: ["light", "fire", "earth", "life"],
    forms: ["bolt", "shield", "lance", "wall"],
    patterns: { shape: ["shield", "wall"], weave: ["lattice"] },
    manaMultiplier: 0.95,
    strainMultiplier: 0.9,
    potencyByEssence: { light: 0.12, fire: 0.08, earth: 0.08 },
  },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const toNumberSafe = (value, fallback = 0) =>
  Number.isFinite(value) ? Number(value) : fallback;

function normalizeEssenceId(value) {
  if (typeof value !== "string") return null;
  const raw = value.trim().toLowerCase();
  const id = ESSENCE_ALIASES[raw] || raw;
  return MAGIC_ESSENCES.includes(id) ? id : null;
}

function normalizeEssenceList(value) {
  const input = Array.isArray(value) ? value : value != null ? [value] : [];
  const seen = new Set();
  const next = [];
  input.forEach((entry) => {
    const essence = normalizeEssenceId(entry);
    if (!essence || seen.has(essence)) return;
    seen.add(essence);
    next.push(essence);
  });
  return next;
}

function normalizeGauge(rawGauge, fallbackMax, fallbackCurrent = fallbackMax) {
  const max = clamp(
    toNumberSafe(rawGauge?.max, fallbackMax),
    1,
    Math.max(1, fallbackMax),
  );
  const current = clamp(toNumberSafe(rawGauge?.current, fallbackCurrent), 0, max);
  return { current, max };
}

function makeStabilityNode(rawNode) {
  return normalizeGauge(rawNode, 100, 100);
}

function getPlayerClassId(player) {
  const rawClass = player?.class;
  if (rawClass && typeof rawClass === "object" && typeof rawClass.id === "string") {
    return rawClass.id.trim().toLowerCase();
  }
  if (typeof rawClass === "string") {
    return rawClass.trim().toLowerCase();
  }
  return "wanderer";
}

function getClassProfile(player) {
  const classId = getPlayerClassId(player);
  return CLASS_MAGIC_PROFILES[classId] || BASE_PROFILE;
}

function buildAffinityMap(rawAffinities, profile) {
  const source =
    rawAffinities && typeof rawAffinities === "object" && !Array.isArray(rawAffinities)
      ? rawAffinities
      : {};
  const next = {};
  MAGIC_ESSENCES.forEach((essence) => {
    next[essence] = toNumberSafe(source[essence], 0);
  });
  Object.entries(profile.affinities || {}).forEach(([essence, bonus]) => {
    if (!MAGIC_ESSENCES.includes(essence)) return;
    next[essence] = toNumberSafe(next[essence], 0) + toNumberSafe(bonus, 0);
  });
  return next;
}

function describeStrain(current, max) {
  const pct = max > 0 ? current / max : 0;
  if (pct >= 0.9) return "overloaded";
  if (pct >= 0.7) return "critical";
  if (pct >= 0.45) return "tense";
  if (pct >= 0.2) return "warming";
  return "steady";
}

function describeResonance(current, max) {
  const pct = max > 0 ? current / max : 0;
  if (pct >= 0.75) return "shrieking";
  if (pct >= 0.5) return "ringing";
  if (pct >= 0.25) return "humming";
  return "quiet";
}

export function normalizeUnifiedMagicState(rawMagic, { player } = {}) {
  const magic =
    rawMagic && typeof rawMagic === "object" && !Array.isArray(rawMagic)
      ? rawMagic
      : {};
  const profile = getClassProfile(player);
  const manaMax =
    toNumberSafe(magic?.mana?.max, null) ??
    toNumberSafe(player?.mana?.max, 50);
  const manaCurrent =
    toNumberSafe(magic?.mana?.current, null) ??
    toNumberSafe(player?.mana?.current, manaMax);
  const unlockedPatterns =
    magic?.unlockedPatterns &&
    typeof magic.unlockedPatterns === "object" &&
    !Array.isArray(magic.unlockedPatterns)
      ? magic.unlockedPatterns
      : {};
  const shapePatterns = Array.isArray(unlockedPatterns.shape)
    ? [...new Set(unlockedPatterns.shape)]
    : [...profile.patterns.shape];
  const weavePatterns = Array.isArray(unlockedPatterns.weave)
    ? [...new Set(unlockedPatterns.weave)]
    : [...profile.patterns.weave];
  const grammar =
    magic?.grammar && typeof magic.grammar === "object" && !Array.isArray(magic.grammar)
      ? magic.grammar
      : {};
  const grammarEssences = normalizeEssenceList(grammar.essences);
  const grammarForms =
    Array.isArray(grammar.forms) && grammar.forms.length
      ? [...new Set(grammar.forms)]
      : [];
  const grammarDeliveries =
    Array.isArray(grammar.deliveries) && grammar.deliveries.length
      ? [...new Set(grammar.deliveries)]
      : [];
  const strainGauge = normalizeGauge(magic?.strain, 100, 0);
  const classBiasNode =
    magic?.classBias && typeof magic.classBias === "object" && !Array.isArray(magic.classBias)
      ? magic.classBias
      : {};
  const storedManaMultiplier = Number.isFinite(classBiasNode.manaMultiplier)
    ? Number(classBiasNode.manaMultiplier)
    : null;
  const storedStrainMultiplier = Number.isFinite(classBiasNode.strainMultiplier)
    ? Number(classBiasNode.strainMultiplier)
    : null;

  return {
    ...magic,
    mana: normalizeGauge({ ...magic.mana, current: manaCurrent, max: manaMax }, manaMax, manaCurrent),
    strain: {
      ...strainGauge,
      state:
        typeof magic?.strain?.state === "string"
          ? magic.strain.state
          : describeStrain(strainGauge.current, strainGauge.max),
    },
    stability: {
      body: makeStabilityNode(magic?.stability?.body),
      mind: makeStabilityNode(magic?.stability?.mind),
      cognitive: makeStabilityNode(magic?.stability?.cognitive),
    },
    attunement: {
      stance:
        typeof magic?.attunement?.stance === "string"
          ? magic.attunement.stance
          : magic?.stance?.kind || "open",
      focusedEssence:
        normalizeEssenceId(magic?.attunement?.focusedEssence) ||
        normalizeEssenceId(magic?.stance?.essence),
      environment:
        typeof magic?.attunement?.environment === "string"
          ? magic.attunement.environment
          : null,
    },
    affinities: buildAffinityMap(magic?.affinities, profile),
    classBias: {
      manaMultiplier: storedManaMultiplier ?? profile.manaMultiplier,
      strainMultiplier: storedStrainMultiplier ?? profile.strainMultiplier,
      potencyByEssence: {
        ...(profile.potencyByEssence || {}),
        ...(classBiasNode.potencyByEssence || {}),
      },
    },
    grammar: {
      essences: [...new Set([...profile.essences, ...grammarEssences])],
      forms: [...new Set([...profile.forms, ...grammarForms])],
      patterns: {
        shape: shapePatterns,
        weave: weavePatterns,
      },
      deliveries: [...new Set([...profile.deliveries, ...grammarDeliveries])],
      recipes: Array.isArray(grammar.recipes) ? [...grammar.recipes] : [],
    },
    unlockedPatterns: {
      shape: shapePatterns,
      weave: weavePatterns,
    },
    prepared: magic?.prepared && typeof magic.prepared === "object" ? magic.prepared : null,
    activeWorkings: Array.isArray(magic?.activeWorkings) ? [...magic.activeWorkings] : [],
    casting: magic?.casting && typeof magic.casting === "object" ? magic.casting : null,
    resonance: {
      current: clamp(toNumberSafe(magic?.resonance?.current, 0), 0, 100),
      max: clamp(toNumberSafe(magic?.resonance?.max, 100), 1, 100),
      state:
        typeof magic?.resonance?.state === "string"
          ? magic.resonance.state
          : "quiet",
    },
    interference: {
      score: clamp(toNumberSafe(magic?.interference?.score, 0), 0, 1),
    },
    anchors:
      magic?.anchors && typeof magic.anchors === "object" && !Array.isArray(magic.anchors)
        ? {
            self: magic.anchors.self || null,
            area: magic.anchors.area || null,
            itemId: magic.anchors.itemId || null,
          }
        : { self: null, area: null, itemId: null },
    reserves:
      magic?.reserves && typeof magic.reserves === "object" && !Array.isArray(magic.reserves)
        ? { ...magic.reserves }
        : {},
    charges: Array.isArray(magic?.charges) ? [...magic.charges] : [],
  };
}

export function syncPlayerMagicState(player, nextMagic) {
  const currentPlayer = player || {};
  const normalizedMagic = normalizeUnifiedMagicState(nextMagic, { player: currentPlayer });
  return {
    ...currentPlayer,
    mana: {
      ...(currentPlayer.mana || {}),
      current: normalizedMagic.mana.current,
      max: normalizedMagic.mana.max,
    },
    magic: normalizedMagic,
  };
}

function normalizeDelivery(action, formDef) {
  const requested =
    typeof action?.delivery === "string" ? action.delivery.trim().toLowerCase() : null;
  if (requested && DEFAULT_DELIVERIES.includes(requested)) return requested;
  return formDef?.delivery || "instant";
}

function normalizeScale(action) {
  const raw = action?.scale ?? action?.amount ?? 1;
  return clamp(Math.round(toNumberSafe(raw, 1)), 1, 5);
}

function chooseTargeting(action, delivery) {
  if (typeof action?.targeting === "string" && action.targeting.trim()) {
    return action.targeting.trim().toLowerCase();
  }
  return delivery === "sustained" ? "zone" : "enemy";
}

function inferPattern(action) {
  if (typeof action?.pattern === "string" && action.pattern.trim()) {
    return action.pattern.trim().toLowerCase();
  }
  if (typeof action?.form === "string" && action.form.trim()) {
    return action.form.trim().toLowerCase();
  }
  return "pulse";
}

function buildCanonicalRequest(action, state) {
  const player = state?.player || {};
  const magic = normalizeUnifiedMagicState(player.magic, { player });
  const usingPrepared =
    action?.usePrepared === true ||
    action?.type === "magic_release" ||
    ((action?.type === "magic_cast" || action?.type === "magic_sustain") &&
      !action?.essence &&
      !action?.essences &&
      !action?.form &&
      !action?.pattern);
  if (usingPrepared && magic.prepared?.request) {
    return { ...magic.prepared.request, source: "prepared" };
  }

  const essences = normalizeEssenceList(action?.essences?.length ? action.essences : action?.essence);
  const primaryEssence = essences[0] || normalizeEssenceId(action?.essence);
  const formName =
    typeof action?.form === "string" && action.form.trim()
      ? action.form.trim().toLowerCase()
      : "bolt";
  const form = FORM_DEFINITIONS[formName] ? formName : "bolt";
  const delivery = normalizeDelivery(action, FORM_DEFINITIONS[form]);
  const scale = normalizeScale(action);
  const pattern = inferPattern(action);

  return {
    essences: essences.length > 0 ? essences : primaryEssence ? [primaryEssence] : [],
    primaryEssence: primaryEssence || null,
    form,
    pattern,
    delivery,
    scale,
    targeting: chooseTargeting(action, delivery),
    intent: action?.intent || (action?.type === "magic_prepare" ? "prepare" : "cast"),
    source: action?.type || "magic_cast",
  };
}

function validateRequestAgainstGrammar(magic, request) {
  if (!request.primaryEssence || request.essences.length === 0) {
    return "Missing essence.";
  }
  if (!magic.grammar.essences.includes(request.primaryEssence)) {
    return `You are not attuned to ${request.primaryEssence} magic.`;
  }
  if (!magic.grammar.forms.includes(request.form)) {
    return `You have not learned the ${request.form} form.`;
  }
  if (!magic.grammar.deliveries.includes(request.delivery)) {
    return `You cannot shape ${request.form} through ${request.delivery} delivery.`;
  }
  return null;
}

function getAmbientPotency(state, essence) {
  return clamp(
    toNumberSafe(state?.world?.essence?.ambient?.global?.potencyMultByEssence?.[essence], 1),
    0.8,
    1.35,
  );
}

function getAttunementMultipliers(magic, request) {
  const stance = magic?.attunement?.stance || "open";
  const focused = magic?.attunement?.focusedEssence || null;
  if (stance === "focused" && focused && focused === request.primaryEssence) {
    return { mana: 0.88, strain: 0.82, potency: 1.14 };
  }
  if (stance === "guarded") {
    return { mana: 1.06, strain: 0.85, potency: 0.95 };
  }
  return { mana: 1, strain: 1, potency: 1 };
}

function buildStatusEffects(primaryEssence, request) {
  const duration = request.delivery === "sustained" ? 3 : 2;
  switch (primaryEssence) {
    case "fire":
      return [{ id: "burn", duration, magnitude: 1, target: "enemy" }];
    case "water":
    case "air":
    case "earth":
      return [{ id: "slow", duration, magnitude: 0.15, target: "enemy" }];
    case "lightning":
      return [{ id: "shock", duration: 1, magnitude: 1, target: "enemy" }];
    case "light":
      return [{ id: "might", duration: 2, magnitude: 0.1, target: "self" }];
    default:
      return [];
  }
}

function buildSyntheticSkill(request, resolution) {
  const formDef = FORM_DEFINITIONS[request.form] || FORM_DEFINITIONS.bolt;
  const tags = [...(formDef.tags || [])];
  return {
    id: `unified_magic_${request.essences.join("_")}_${request.form}_${request.delivery}`,
    name: resolution.displayName,
    type: "active",
    isMagic: true,
    element: request.primaryEssence,
    cooldown: resolution.cooldown,
    manaCost: resolution.manaCost,
    damage: { multiplier: resolution.damageMultiplier },
    effects: buildStatusEffects(request.primaryEssence, request),
    tags,
    template: {
      category: "Unified Magic",
      function: "combat",
      source: "UnifiedMagicSystem",
      elements: [...request.essences],
      synergies: [request.pattern],
      meta: {
        delivery: request.delivery,
        scale: request.scale,
        grammar: true,
      },
    },
    unifiedMagic: {
      request,
      attackerMagic: resolution.attackerMagic,
      manaCost: resolution.manaCost,
      cooldown: resolution.cooldown,
      backfireDamage: resolution.backfireDamage,
    },
  };
}

function buildDisplayName(request) {
  const primary = request.primaryEssence || "raw";
  const label = `${primary} ${request.form}`.replace(/\b\w/g, (char) => char.toUpperCase());
  return request.delivery === "sustained" ? `${label} Weaving` : label;
}

function normalizeMagicProfile(rawProfile) {
  const profile =
    rawProfile && typeof rawProfile === "object" && !Array.isArray(rawProfile)
      ? rawProfile
      : null;
  if (!profile) return null;

  const essences = normalizeEssenceList(profile.essences);
  const formCandidate =
    typeof profile.form === "string" ? profile.form.trim().toLowerCase() : "bolt";
  const form = FORM_DEFINITIONS[formCandidate] ? formCandidate : "bolt";
  const delivery = normalizeDelivery(profile, FORM_DEFINITIONS[form]);

  return {
    essences,
    form,
    delivery,
    scale: clamp(Math.round(toNumberSafe(profile.scale, 1)), 1, 5),
    pattern: inferPattern(profile),
    targeting:
      typeof profile.targeting === "string" && profile.targeting.trim()
        ? profile.targeting.trim().toLowerCase()
        : null,
    displayName:
      typeof profile.displayName === "string" && profile.displayName.trim()
        ? profile.displayName.trim()
        : null,
  };
}

function buildRequestFromMagicProfile(skill, state) {
  void state;
  const profile = normalizeMagicProfile(
    skill?.magicProfile || skill?.template?.meta?.magicProfile,
  );
  if (!profile || profile.essences.length === 0) return null;

  const primaryEssence = profile.essences[0];
  const targeting =
    profile.targeting ||
    (skill?.target === "self"
      ? "self"
      : chooseTargeting({ targeting: skill?.target }, profile.delivery));

  return {
    essences: profile.essences,
    primaryEssence,
    form: profile.form,
    pattern: profile.pattern,
    delivery: profile.delivery,
    scale: profile.scale,
    targeting,
    intent: "cast",
    source: skill?.id || "skill_magic_profile",
    displayName: profile.displayName || skill?.name || null,
  };
}

function computeResonanceGain(request) {
  const extraEssenceCount = Math.max(0, request.essences.length - 1);
  const base =
    1.5 +
    request.scale * 1.6 +
    extraEssenceCount * 1.4 +
    (request.delivery === "sustained" ? 2.2 : request.delivery === "channeled" ? 1.4 : 0);
  return Number(base.toFixed(1));
}

function buildPreparedDescription(request) {
  return `You prepare ${buildDisplayName(request)}.`;
}

function makeWorkingEntry(request, resolution, state) {
  const turn = Math.max(0, Math.floor(toNumberSafe(state?.world?.turnCount, 0)));
  return {
    id: `wrk_${turn}_${request.essences.join("_")}_${request.form}_${request.delivery}`,
    name: resolution.displayName,
    essences: [...request.essences],
    form: request.form,
    pattern: request.pattern,
    delivery: request.delivery,
    scale: request.scale,
    strainUpkeep: Math.max(1, Math.floor(resolution.strainGain * 0.25)),
    manaUpkeep: Math.max(1, Math.floor(resolution.manaCost * 0.2)),
    createdTurn: turn,
  };
}

function computeResolution(state, request) {
  const player = state?.player || {};
  const magic = normalizeUnifiedMagicState(player.magic, { player });
  const validationError = validateRequestAgainstGrammar(magic, request);
  if (validationError) {
    return { ok: false, reason: validationError, magic };
  }

  const formDef = FORM_DEFINITIONS[request.form] || FORM_DEFINITIONS.bolt;
  const ambientPotency = getAmbientPotency(state, request.primaryEssence);
  const attunement = getAttunementMultipliers(magic, request);
  const classBias = magic.classBias || {};
  const potencyBias = toNumberSafe(classBias?.potencyByEssence?.[request.primaryEssence], 0);
  const extraEssenceCount = Math.max(0, request.essences.length - 1);
  const baseMana =
    formDef.baseMana +
    request.scale * 3 +
    extraEssenceCount * 4 +
    (request.delivery === "sustained" ? 4 : request.delivery === "channeled" ? 2 : 0);
  const baseStrain =
    formDef.baseStrain +
    request.scale * 4 +
    extraEssenceCount * 5 +
    (request.delivery === "sustained" ? 6 : request.delivery === "channeled" ? 3 : 0);

  const manaCost = Math.max(
    1,
    Math.round(
      baseMana *
        toNumberSafe(classBias.manaMultiplier, 1) *
        attunement.mana,
    ),
  );
  const strainGain = Math.max(
    1,
    Math.round(
      baseStrain *
        toNumberSafe(classBias.strainMultiplier, 1) *
        attunement.strain,
    ),
  );
  const damageMultiplier = Number(
    (
      formDef.damage +
      request.scale * 0.14 +
      extraEssenceCount * 0.12 +
      potencyBias +
      (ambientPotency - 1) * 0.5 +
      (attunement.potency - 1) * 0.65
    ).toFixed(2)
  );

  if (magic.mana.current < manaCost) {
    return { ok: false, reason: "Insufficient mana.", magic };
  }

  const nextStrain = clamp(magic.strain.current + strainGain, 0, magic.strain.max);
  const overload = Math.max(0, magic.strain.current + strainGain - magic.strain.max);
  const backfireDamage = overload > 0 ? Math.max(1, Math.floor(overload / 4)) : 0;
  const resonanceGain = computeResonanceGain(request);
  const resonanceMax = clamp(toNumberSafe(magic?.resonance?.max, 100), 1, 100);
  const resonanceCurrent = clamp(
    toNumberSafe(magic?.resonance?.current, 0) + resonanceGain,
    0,
    resonanceMax,
  );
  const attackerMagic = {
    ...magic,
    strain: {
      current: nextStrain,
      max: magic.strain.max,
      state: describeStrain(nextStrain, magic.strain.max),
    },
    resonance: {
      ...(magic.resonance || {}),
      current: resonanceCurrent,
      max: resonanceMax,
      state: describeResonance(resonanceCurrent, resonanceMax),
    },
    prepared: null,
  };

  return {
    ok: true,
    request,
    magic,
    attackerMagic,
    manaCost,
    strainGain,
    damageMultiplier,
    cooldown: 0,
    backfireDamage,
    resonanceGain,
    displayName: request.displayName || buildDisplayName(request),
  };
}

export function validateUnifiedMagicAction(action, state) {
  const type = action?.type;
  if (!["magic_prepare", "magic_cast", "magic_sustain", "magic_stabilize"].includes(type)) {
    return { valid: false, reason: "Unknown unified magic action." };
  }
  if (type === "magic_sustain" || type === "magic_stabilize") {
    return { valid: true };
  }
  const player = state?.player || {};
  const magic = normalizeUnifiedMagicState(player.magic, { player });
  const request = buildCanonicalRequest(action, state);
  const validationError = validateRequestAgainstGrammar(magic, request);
  if (validationError) return { valid: false, reason: validationError };
  return { valid: true };
}

export function prepareMagic(state, action) {
  const player = state?.player || {};
  const magic = normalizeUnifiedMagicState(player.magic, { player });
  const request = buildCanonicalRequest(action, state);
  const validationError = validateRequestAgainstGrammar(magic, request);
  if (validationError) {
    return { ok: false, reason: validationError, state };
  }
  const preview = computeResolution(state, request);
  const nextPlayer = syncPlayerMagicState(player, {
    ...magic,
    prepared: {
      request,
      preview: {
        manaCost: preview.manaCost || 0,
        displayName: preview.displayName || buildDisplayName(request),
      },
    },
  });
  return {
    ok: true,
    state: { ...state, player: nextPlayer },
    description: buildPreparedDescription(request),
  };
}

function buildWorldCastDescription(request, resolution, workingCreated) {
  const core = `You cast ${resolution.displayName}, channeling ${request.primaryEssence}.`;
  if (workingCreated) {
    return `${core} A sustained working settles into place.`;
  }
  if (resolution.backfireDamage > 0) {
    return `${core} The cast bites back under overload.`;
  }
  return core;
}

export function castMagic(state, action) {
  const resolution = computeResolution(state, buildCanonicalRequest(action, state));
  if (!resolution.ok) {
    return { ok: false, reason: resolution.reason, state };
  }
  const player = state?.player || {};
  const nextMagic = {
    ...resolution.attackerMagic,
    mana: {
      current: Math.max(0, resolution.attackerMagic.mana.current - resolution.manaCost),
      max: resolution.attackerMagic.mana.max,
    },
  };
  if (resolution.request.delivery === "sustained") {
    nextMagic.activeWorkings = [
      ...(Array.isArray(nextMagic.activeWorkings) ? nextMagic.activeWorkings : []),
      makeWorkingEntry(resolution.request, resolution, state),
    ];
  }
  const nextPlayer = syncPlayerMagicState(player, nextMagic);
  return {
    ok: true,
    state: { ...state, player: nextPlayer },
    description: buildWorldCastDescription(
      resolution.request,
      resolution,
      resolution.request.delivery === "sustained",
    ),
    resolution,
  };
}

export function castPreparedMagic(state, action) {
  return castMagic(state, { ...action, usePrepared: true });
}

export function sustainMagic(state, action) {
  const player = state?.player || {};
  const magic = normalizeUnifiedMagicState(player.magic, { player });
  const workings = Array.isArray(magic.activeWorkings) ? [...magic.activeWorkings] : [];
  if (workings.length === 0) {
    return { ok: false, reason: "No active working to sustain.", state };
  }
  const working = workings[0];
  const upkeepMana = Math.max(1, toNumberSafe(working.manaUpkeep, 2));
  if (magic.mana.current < upkeepMana) {
    return { ok: false, reason: "Insufficient mana to sustain the working.", state };
  }
  const nextMagic = {
    ...magic,
    mana: {
      current: magic.mana.current - upkeepMana,
      max: magic.mana.max,
    },
    strain: {
      current: clamp(magic.strain.current + toNumberSafe(working.strainUpkeep, 2), 0, magic.strain.max),
      max: magic.strain.max,
      state: describeStrain(
        clamp(magic.strain.current + toNumberSafe(working.strainUpkeep, 2), 0, magic.strain.max),
        magic.strain.max,
      ),
    },
  };
  const nextPlayer = syncPlayerMagicState(player, nextMagic);
  return {
    ok: true,
    state: { ...state, player: nextPlayer },
    description: `You sustain ${working.name}.`,
  };
}

export function stabilizeMagic(state, action = {}) {
  const player = state?.player || {};
  const magic = normalizeUnifiedMagicState(player.magic, { player });
  const strainRecovery = 16 + Math.max(0, Math.floor(toNumberSafe(player?.attributes?.willpower, 0) * 0.5));
  const nextStrain = clamp(magic.strain.current - strainRecovery, 0, magic.strain.max);
  const focusedEssence =
    normalizeEssenceId(action?.essence) || magic.attunement?.focusedEssence || null;
  const nextMagic = {
    ...magic,
    strain: {
      current: nextStrain,
      max: magic.strain.max,
      state: describeStrain(nextStrain, magic.strain.max),
    },
    attunement: {
      ...magic.attunement,
      stance:
        typeof action?.stance === "string" && action.stance.trim()
          ? action.stance.trim().toLowerCase()
          : magic.attunement?.stance || "open",
      focusedEssence,
    },
  };
  const nextPlayer = syncPlayerMagicState(player, nextMagic);
  return {
    ok: true,
    state: { ...state, player: nextPlayer },
    description:
      nextStrain < magic.strain.current
        ? `You stabilize your casting flow and lower your strain.`
        : `You settle into a ${nextMagic.attunement.stance} magical stance.`,
  };
}

export function senseMagic(state) {
  const ambient = state?.world?.essence?.ambient?.global || {};
  const player = state?.player || {};
  const magic = normalizeUnifiedMagicState(player.magic, { player });
  const focused = magic.attunement?.focusedEssence
    ? ` Focus: ${magic.attunement.focusedEssence}.`
    : "";
  return {
    ok: true,
    state,
    description:
      `Mana ${magic.mana.current}/${magic.mana.max}. Strain ${magic.strain.current}/${magic.strain.max}.${focused}` +
      ` Ambient pressure ${toNumberSafe(ambient.pressure, 0).toFixed(2)}.`,
  };
}

export function buildCombatMagicSkill(state, action) {
  const resolution = computeResolution(state, buildCanonicalRequest(action, state));
  if (!resolution.ok) {
    return { ok: false, reason: resolution.reason };
  }
  const attackerMagic = {
    ...resolution.attackerMagic,
    activeWorkings:
      resolution.request.delivery === "sustained"
        ? [
            ...(Array.isArray(resolution.attackerMagic.activeWorkings)
              ? resolution.attackerMagic.activeWorkings
              : []),
            makeWorkingEntry(resolution.request, resolution, state),
          ]
        : resolution.attackerMagic.activeWorkings,
  };
  return {
    ok: true,
    syntheticSkill: buildSyntheticSkill(resolution.request, {
      ...resolution,
      attackerMagic,
    }),
  };
}

export function resolveCombatSkillMagic(state, skill) {
  const request = buildRequestFromMagicProfile(skill, state);
  if (!request) return null;

  const resolution = computeResolution(state, request);
  if (!resolution.ok) {
    return {
      ok: false,
      reason: resolution.reason,
    };
  }

  return {
    ok: true,
    request,
    manaCost: resolution.manaCost,
    cooldown: resolution.cooldown,
    backfireDamage: resolution.backfireDamage,
    attackerMagic: resolution.attackerMagic,
    displayName: resolution.displayName,
    resonanceGain: resolution.resonanceGain,
  };
}

export function translateLegacyMagicAction(action) {
  switch (action?.type) {
    case "magic_shape":
      return {
        type: "magic_prepare",
        essence: action.essence,
        form: action.form,
        scale: action.amount,
        intent: "prepare",
      };
    case "magic_weave":
      return {
        type: "magic_prepare",
        essences: action.essences,
        form: action.pattern || "lattice",
        pattern: action.pattern || "lattice",
        delivery: "sustained",
        scale: action.amount,
        intent: "prepare",
      };
    case "magic_release":
      return {
        type: "magic_cast",
        usePrepared: true,
        intent: "cast",
      };
    case "magic_attune":
      return {
        type: "magic_stabilize",
        stance: action.stance,
        essence: action.essence,
      };
    default:
      return action;
  }
}

export { MAGIC_ESSENCES, FORM_DEFINITIONS };
