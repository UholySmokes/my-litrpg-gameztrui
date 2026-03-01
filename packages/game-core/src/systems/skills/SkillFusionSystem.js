import { toNumber } from "../../utils/shared.js";

const getSkillType = (skill) => {
  if (!skill || typeof skill !== "object") return "active";
  if (skill.type) return skill.type;
  if (skill.category) return skill.category;
  return skill.isPassive ? "passive" : "active";
};

const normalizeTags = (tags) =>
  Array.isArray(tags) ? tags.filter((tag) => typeof tag === "string") : [];

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "of",
  "and",
  "or",
  "to",
  "with",
  "for",
  "from",
  "your",
  "into",
  "on",
  "in",
  "by",
  "at",
  "is",
  "are",
  "be",
  "this",
  "that",
  "deal",
  "deals",
  "damage",
  "damaging",
  "enemy",
  "enemies",
  "target",
  "targets",
  "self",
]);

const ESSENCE_BY_KEYWORD = {
  fire: "Ember",
  flame: "Ember",
  burn: "Ember",
  inferno: "Ember",
  ice: "Frost",
  frost: "Frost",
  freeze: "Frost",
  snow: "Frost",
  lightning: "Storm",
  shock: "Storm",
  thunder: "Storm",
  storm: "Storm",
  poison: "Venom",
  venom: "Venom",
  toxic: "Venom",
  plague: "Venom",
  bleed: "Crimson",
  blood: "Crimson",
  crimson: "Crimson",
  holy: "Radiant",
  light: "Radiant",
  radiant: "Radiant",
  divine: "Radiant",
  shadow: "Umbral",
  dark: "Umbral",
  void: "Umbral",
  necro: "Umbral",
  necrotic: "Umbral",
  curse: "Umbral",
  arcane: "Arcane",
  magic: "Arcane",
  mana: "Arcane",
  spell: "Arcane",
  rune: "Arcane",
  wind: "Gale",
  air: "Gale",
  cyclone: "Gale",
  earth: "Stone",
  stone: "Stone",
  rock: "Stone",
  iron: "Iron",
  steel: "Iron",
  water: "Tide",
  tide: "Tide",
  ocean: "Tide",
  wave: "Tide",
  nature: "Verdant",
  vine: "Verdant",
  root: "Verdant",
  thorn: "Verdant",
  beast: "Feral",
  claw: "Feral",
  fang: "Feral",
  hunt: "Feral",
  time: "Temporal",
  chrono: "Temporal",
  slow: "Temporal",
  spirit: "Spirit",
  soul: "Spirit",
  astral: "Astral",
  ethereal: "Astral",
  fear: "Dread",
};

const CLASS_ESSENCE = {
  paladin: "Radiant",
  priest: "Radiant",
  necromancer: "Umbral",
  warlock: "Umbral",
  rogue: "Umbral",
  monk: "Spirit",
  berserker: "Feral",
  ranger: "Feral",
  druid: "Verdant",
  knight: "Valor",
  warrior: "Valor",
  mage: "Arcane",
  sorcerer: "Arcane",
};

const DEFAULT_ESSENCES = [
  "Ember",
  "Frost",
  "Storm",
  "Venom",
  "Crimson",
  "Radiant",
  "Umbral",
  "Arcane",
  "Gale",
  "Stone",
  "Tide",
  "Verdant",
  "Feral",
  "Temporal",
  "Astral",
  "Valor",
];

const ACTIVE_FORMS = [
  "Strike",
  "Burst",
  "Wave",
  "Lance",
  "Rift",
  "Barrage",
  "Spiral",
  "Surge",
  "Crescent",
  "Torrent",
];

const BUFF_FORMS = [
  "Infusion",
  "Mantle",
  "Stance",
  "Ward",
  "Protocol",
  "Sigil",
  "Overdrive",
  "Vigor",
];

const PASSIVE_FORMS = [
  "Resonance",
  "Oath",
  "Weave",
  "Echo",
  "Aegis",
  "Convergence",
  "Pulse",
  "Symphony",
  "Vow",
  "Tide",
];

const NAME_PREFIXES = [
  "Nexus",
  "Eclipse",
  "Conflux",
  "Harmonic",
  "Paradox",
  "Twin",
  "Cipher",
  "Prism",
  "Apex",
  "Synthesis",
];

const EFFECT_PHRASES = {
  stun: "stuns the target",
  bleed: "inflicts a bleeding wound",
  burn: "ignites foes",
  shock: "electrifies enemies",
  freeze: "freezes the target",
  slow: "slows enemies",
  poison: "poisons the target",
  fear: "terrifies enemies",
  might: "bolsters your might",
  blur: "shrouds you in blur",
  heal: "restores vitality",
  shield: "raises a protective barrier",
  taunt: "draws hostile focus",
};

const ACTION_VERBS = [
  "Unleash",
  "Invoke",
  "Release",
  "Channel",
  "Forge",
  "Converge",
  "Ignite",
  "Shape",
  "Bind",
  "Pulse",
];

const ORIGIN_LINES = [
  "Forged from two disciplines, it reshapes their essence.",
  "Born of a dual technique, it manifests a new combat cadence.",
  "A fused technique that bends both origins into a single surge.",
  "Created by blending two arts into a singular doctrine.",
];

const hashString = (input) => {
  const text = String(input || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const hashNumber = (input) => {
  const text = String(input || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const createFusionId = (skillA, skillB, existingIds = new Set()) => {
  const base = `fusion_${hashString(`${skillA?.id || ""}_${skillB?.id || ""}`)}`;
  if (!existingIds.has(base)) return base;
  let index = 2;
  while (existingIds.has(`${base}_${index}`)) {
    index += 1;
  }
  return `${base}_${index}`;
};

const tokenize = (text) =>
  String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));

const extractEffectIds = (skill) => {
  const effectIds = [];
  if (Array.isArray(skill?.effects)) {
    skill.effects.forEach((effect) => {
      if (effect?.id) effectIds.push(effect.id);
    });
  }
  if (typeof skill?.effect === "string") {
    effectIds.push(skill.effect);
  }
  if (typeof skill?.stats?.effect === "string") {
    effectIds.push(skill.stats.effect);
  }
  return effectIds.filter((id) => typeof id === "string" && id.trim());
};

const extractTokensFromSkill = (skill) => {
  if (!skill) return [];
  const tokens = [];
  tokens.push(...tokenize(skill.name));
  tokens.push(...tokenize(skill.description));
  tokens.push(...tokenize(skill.ownerId));
  tokens.push(...tokenize(skill.ownerType));
  tokens.push(...normalizeTags(skill.tags).flatMap((tag) => tokenize(tag)));
  tokens.push(...extractEffectIds(skill).flatMap((id) => tokenize(id)));
  if (typeof skill.element === "string") tokens.push(...tokenize(skill.element));
  if (typeof skill.target === "string") tokens.push(...tokenize(skill.target));
  return tokens;
};

const collectEssences = (skill) => {
  const tokens = extractTokensFromSkill(skill);
  const essences = [];
  tokens.forEach((token) => {
    const mapped = ESSENCE_BY_KEYWORD[token];
    if (mapped) essences.push(mapped);
    const classMapped = CLASS_ESSENCE[token];
    if (classMapped) essences.push(classMapped);
  });
  return essences;
};

const pickFrom = (list, seed, offset = 0) => {
  if (!list.length) return "";
  const index = (seed + offset) % list.length;
  return list[index];
};

const selectEssence = (skillA, skillB, seed) => {
  const essences = [
    ...collectEssences(skillA),
    ...collectEssences(skillB),
  ];
  const unique = Array.from(new Set(essences.filter(Boolean)));
  if (unique.length === 0) {
    return {
      essence: pickFrom(DEFAULT_ESSENCES, seed),
      dual: false,
    };
  }
  return {
    essence: pickFrom(unique, seed),
    dual: unique.length > 1,
  };
};

const selectForm = (tokens, type, seed) => {
  const formMap = {
    strike: "Strike",
    slash: "Strike",
    stab: "Lance",
    pierce: "Lance",
    shot: "Barrage",
    arrow: "Barrage",
    bolt: "Burst",
    blast: "Burst",
    wave: "Wave",
    beam: "Rift",
    aura: "Resonance",
    stance: "Stance",
    shield: "Ward",
    guard: "Ward",
    barrier: "Ward",
    summon: "Rift",
    curse: "Sigil",
    chant: "Symphony",
    song: "Symphony",
    step: "Surge",
    blink: "Surge",
    leap: "Surge",
    charge: "Surge",
  };
  for (const token of tokens) {
    if (formMap[token]) {
      const mapped = formMap[token];
      if (type === "passive") {
        return mapped === "Resonance" ? mapped : "Resonance";
      }
      if (type === "buff") {
        return mapped === "Stance" || mapped === "Ward" ? mapped : "Infusion";
      }
      return mapped;
    }
  }
  if (type === "passive") return pickFrom(PASSIVE_FORMS, seed);
  if (type === "buff") return pickFrom(BUFF_FORMS, seed);
  return pickFrom(ACTIVE_FORMS, seed);
};

const buildEffectPhrase = (effectIds, type, seed) => {
  const unique = Array.from(new Set(effectIds));
  if (!unique.length) {
    if (type === "passive") return "steadily amplifies your combat rhythm";
    if (type === "buff") return "overcharging your abilities for a short time";
    return "deals heavy damage and disrupts foes";
  }
  const phrases = unique.map((id) => EFFECT_PHRASES[id] || `applies ${id}`);
  if (phrases.length === 1) return phrases[0];
  if (phrases.length === 2) return `${phrases[0]} and ${phrases[1]}`;
  const tail = pickFrom(phrases.slice(2), seed);
  return `${phrases[0]}, ${phrases[1]}, and ${tail}`;
};

const mergeEffects = (effects) => {
  const map = new Map();
  effects.forEach((effect) => {
    if (!effect?.id) return;
    const key = effect.id;
    if (!map.has(key)) {
      map.set(key, { ...effect });
      return;
    }
    const current = map.get(key);
    map.set(key, {
      ...current,
      duration: Math.max(
        toNumber(current.duration, 0),
        toNumber(effect.duration, 0),
      ),
      chance: Math.max(
        toNumber(current.chance, 0),
        toNumber(effect.chance, 0),
      ),
      magnitude: Math.max(
        toNumber(current.magnitude, 0),
        toNumber(effect.magnitude, 0),
      ),
      target: current.target || effect.target,
      aoe: Boolean(current.aoe || effect.aoe),
    });
  });
  return Array.from(map.values());
};

export const canFuseSkills = (skillA, skillB) => {
  if (!skillA || !skillB) return false;
  if (skillA.id === skillB.id) return false;
  if (skillA.canFuse === false || skillB.canFuse === false) return false;
  const typeA = getSkillType(skillA);
  const typeB = getSkillType(skillB);
  return typeA === typeB;
};

export const fuseSkills = (skillA, skillB, { existingIds } = {}) => {
  if (!canFuseSkills(skillA, skillB)) return null;
  const type = getSkillType(skillA);
  const tags = Array.from(
    new Set([
      ...normalizeTags(skillA.tags),
      ...normalizeTags(skillB.tags),
      "fusion",
    ]),
  );
  const id = createFusionId(skillA, skillB, existingIds);
  const baseMana = toNumber(skillA.manaCost, 0) + toNumber(skillB.manaCost, 0);
  const baseCooldown = Math.max(
    toNumber(skillA.cooldown, 0),
    toNumber(skillB.cooldown, 0),
  );
  const level =
    Math.max(toNumber(skillA.level, 1), toNumber(skillB.level, 1)) + 1;
  const seed = hashNumber(`${skillA?.id || ""}:${skillB?.id || ""}`);
  const tokens = [
    ...extractTokensFromSkill(skillA),
    ...extractTokensFromSkill(skillB),
  ];
  const { essence, dual } = selectEssence(skillA, skillB, seed);
  const normalizedType = type === "buff" ? "buff" : type;
  const form = selectForm(tokens, normalizedType, seed);
  const prefix = pickFrom(NAME_PREFIXES, seed, 3);
  const name =
    dual && essence
      ? `${prefix} ${essence} ${form}`.trim()
      : essence
        ? `${essence} ${form}`.trim()
        : `${prefix} ${form}`.trim();
  const effects = mergeEffects([
    ...(Array.isArray(skillA.effects) ? skillA.effects : []),
    ...(Array.isArray(skillB.effects) ? skillB.effects : []),
  ]);
  const effectPhrase = buildEffectPhrase(
    [...extractEffectIds(skillA), ...extractEffectIds(skillB)],
    normalizedType,
    seed,
  );
  const verb = pickFrom(ACTION_VERBS, seed, 2);
  const essenceLower = essence ? essence.toLowerCase() : "fused";
  const originLine = pickFrom(ORIGIN_LINES, seed, 1);
  const description =
    normalizedType === "passive"
      ? `A ${essenceLower} ${form.toLowerCase()} that ${effectPhrase}. ${originLine}`
      : normalizedType === "buff"
        ? `Enter a ${essenceLower} ${form.toLowerCase()} that ${effectPhrase}. ${originLine}`
        : `${verb} a ${essenceLower} ${form.toLowerCase()} that ${effectPhrase}. ${originLine}`;

  return {
    id,
    name,
    type,
    class: "fusion",
    ownerType: "system",
    ownerId: "fusion",
    description,
    level,
    manaCost:
      normalizedType === "passive"
        ? 0
        : Math.max(1, Math.round(baseMana * 0.65 + 2)),
    cooldown:
      normalizedType === "passive"
        ? 0
        : Math.max(0, Math.round(baseCooldown * 0.85 + 1)),
    canFuse: false,
    canEvolve: true,
    canUpgrade: true,
    fusionSources: [skillA.id, skillB.id],
    tags,
    ...(effects.length ? { effects } : {}),
    fusionProfile: {
      essence,
      form,
      originSkills: [skillA.id, skillB.id],
    },
  };
};
