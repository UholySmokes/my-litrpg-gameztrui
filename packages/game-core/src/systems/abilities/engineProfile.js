const MAGIC_OWNER_IDS = new Set([
  "mage",
  "archmage",
  "battlemage",
  "cleric",
  "priest",
  "high_priest",
  "paladin",
  "templar",
  "dawn_vindicator",
  "warlock",
  "spellbreaker",
  "druid",
  "beastmaster",
  "shaman",
  "tempest_reveler",
  "summoner",
  "astral_archon",
  "necromancer",
  "oracle_hierophant",
]);

const MAGIC_RESOURCE_MODELS = new Set(["mana", "essence"]);
const MAGIC_TAGS = new Set([
  "magic",
  "spell",
  "arcane",
  "mana",
  "rune",
  "ritual",
  "void",
  "voidspark",
  "temporal",
  "holy",
  "shadow",
  "elemental",
]);
const CULTIVATION_TAGS = new Set([
  "cultivation",
  "breathing",
  "manual",
  "core",
  "meridian",
  "tribulation",
  "refinement",
  "qi",
  "chi",
]);
const PROFESSION_TAGS = new Set([
  "craft",
  "crafting",
  "harvest",
  "harvesting",
  "repair",
  "smithing",
  "alchemy",
  "inscription",
  "engineering",
  "cooking",
  "production",
]);

const ESSENCE_ALIASES = {
  ice: "water",
  frost: "water",
  water: "water",
  fire: "fire",
  earth: "earth",
  stone: "earth",
  air: "air",
  wind: "air",
  lightning: "lightning",
  storm: "lightning",
  thunder: "lightning",
  shadow: "shadow",
  dark: "shadow",
  void: "space",
  holy: "light",
  radiant: "light",
  light: "light",
  nature: "life",
  life: "life",
  healing: "life",
  arcane: "creation",
  creation: "creation",
  destruction: "destruction",
  death: "destruction",
  space: "space",
  time: "time",
  temporal: "time",
};

const OWNER_DEFAULT_ESSENCES = {
  mage: ["fire", "water", "air", "lightning", "light", "shadow"],
  archmage: ["fire", "water", "air", "lightning", "light", "shadow"],
  battlemage: ["fire", "earth", "air", "lightning", "creation"],
  priest: ["light", "life", "water", "air"],
  cleric: ["light", "life", "water", "air"],
  high_priest: ["light", "life", "water", "air"],
  paladin: ["light", "fire", "life", "earth"],
  templar: ["light", "fire", "life", "earth"],
  dawn_vindicator: ["light", "fire", "life", "earth"],
  warlock: ["shadow", "fire", "destruction", "time"],
  spellbreaker: ["shadow", "fire", "destruction", "time"],
  druid: ["life", "earth", "water", "air"],
  beastmaster: ["life", "earth", "water", "air"],
  shaman: ["fire", "water", "earth", "air", "lightning"],
  tempest_reveler: ["fire", "water", "earth", "air", "lightning"],
  summoner: ["life", "air", "space", "light"],
  astral_archon: ["life", "air", "space", "light"],
  necromancer: ["shadow", "destruction", "life", "time"],
  oracle_hierophant: ["shadow", "destruction", "life", "time"],
};

const FORM_HINTS = [
  { tokens: ["shield", "ward", "barrier", "armor", "aegis", "guard"], form: "shield", delivery: "sustained" },
  { tokens: ["wall"], form: "wall", delivery: "sustained" },
  { tokens: ["summon", "raise", "totem", "ritual", "resurrection", "guardian spirit"], form: "lattice", delivery: "sustained", pattern: "lattice" },
  { tokens: ["teleport", "blink", "phase", "step", "veil", "cloak"], form: "veil", delivery: "instant", pattern: "veil" },
  { tokens: ["storm", "blizzard", "hurricane", "vortex", "chain", "rain"], form: "vortex", delivery: "sustained", pattern: "vortex" },
  { tokens: ["cone", "breath", "sweep", "wave", "nova"], form: "cone", delivery: "instant" },
  { tokens: ["lance", "spear", "impale"], form: "lance", delivery: "instant" },
  { tokens: ["bolt", "shot", "smite", "wrath", "fireball", "lightning", "blast"], form: "bolt", delivery: "instant" },
  { tokens: ["heal", "renew", "growth", "touch", "hands", "blessing"], form: "pulse", delivery: "instant" },
  { tokens: ["curse", "corruption", "drain", "tap", "agony"], form: "veil", delivery: "sustained", pattern: "veil" },
];

const VALID_MAGIC_ESSENCES = new Set([
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
]);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLower(value) {
  return normalizeString(value).toLowerCase();
}

function uniqueStrings(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function tokenize(value) {
  return normalizeLower(value)
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);
}

function normalizeEssenceId(value) {
  const normalized = normalizeLower(value);
  if (!normalized) return null;
  const mapped = ESSENCE_ALIASES[normalized] || normalized;
  return VALID_MAGIC_ESSENCES.has(mapped) ? mapped : null;
}

function inferFamily(skill) {
  const explicitFamily = normalizeLower(skill?.engineProfile?.family);
  if (explicitFamily) return explicitFamily;

  const ownerType = normalizeLower(skill?.ownerType);
  const ownerId = normalizeLower(skill?.ownerId || skill?.class);
  const resourceType = normalizeLower(skill?.resourceType || skill?.costType);
  const tags = uniqueStrings((skill?.tags || []).map(normalizeLower));
  const templateFunction = normalizeLower(skill?.template?.function);
  const elements = uniqueStrings([
    ...(Array.isArray(skill?.template?.elements) ? skill.template.elements : []),
    skill?.element,
    skill?.damage?.element,
  ].map(normalizeEssenceId));

  if (ownerType === "profession" || tags.some((tag) => PROFESSION_TAGS.has(tag))) {
    return "profession";
  }
  if (ownerType === "race") {
    return "bloodline";
  }
  if (tags.some((tag) => CULTIVATION_TAGS.has(tag))) {
    return "cultivation";
  }
  if (
    skill?.isMagic ||
    skill?.damage?.isMagic ||
    MAGIC_RESOURCE_MODELS.has(resourceType) ||
    templateFunction === "spell" ||
    elements.length > 0 ||
    (ownerId && MAGIC_OWNER_IDS.has(ownerId)) ||
    tags.some((tag) => MAGIC_TAGS.has(tag))
  ) {
    return "magic";
  }
  if (ownerType === "universal") {
    return "universal";
  }
  return "martial";
}

function inferRuntimeRole(skill) {
  const explicitRole = normalizeLower(skill?.runtimeRole || skill?.engineProfile?.runtimeRole);
  if (explicitRole) return explicitRole;

  const tags = uniqueStrings((skill?.tags || []).map(normalizeLower));
  const nameTokens = tokenize(skill?.name);
  if (tags.includes("reaction") || tags.includes("counter") || tags.includes("parry")) {
    return "reaction";
  }
  if (tags.includes("stance") || nameTokens.includes("stance")) {
    return "stance";
  }
  if (tags.includes("channel") || tags.includes("sustain") || nameTokens.includes("channel")) {
    return "channel";
  }
  if (tags.includes("ritual") || nameTokens.includes("ritual")) {
    return "ritual";
  }
  return "standard";
}

function inferResourceModel(skill, family) {
  const explicit =
    normalizeLower(skill?.engineProfile?.resourceModel) ||
    normalizeLower(skill?.resourceType) ||
    normalizeLower(skill?.costType);
  if (explicit) return explicit;
  if (Number.isFinite(skill?.manaCost) && skill.manaCost > 0) return "mana";
  if (family === "magic") return "mana";
  if (family === "cultivation") return "chi";
  return "none";
}

function inferEssences(skill, family) {
  if (family !== "magic") return [];

  const explicitProfileEssences = Array.isArray(skill?.magicProfile?.essences)
    ? skill.magicProfile.essences.map(normalizeEssenceId).filter(Boolean)
    : [];
  const templateEssences = Array.isArray(skill?.template?.elements)
    ? skill.template.elements.map(normalizeEssenceId).filter(Boolean)
    : [];
  const directEssence = [
    normalizeEssenceId(skill?.element),
    normalizeEssenceId(skill?.damage?.element),
    normalizeEssenceId(skill?.essence),
  ].filter(Boolean);
  const tokenEssences = uniqueStrings([
    ...tokenize(skill?.name),
    ...tokenize(skill?.description),
    ...tokenize(skill?.id),
    ...uniqueStrings((skill?.tags || []).map(normalizeLower)),
  ].map(normalizeEssenceId));
  const ownerId = normalizeLower(skill?.ownerId || skill?.class);
  const ownerDefaults = OWNER_DEFAULT_ESSENCES[ownerId] || [];

  return uniqueStrings([
    ...explicitProfileEssences,
    ...templateEssences,
    ...directEssence,
    ...tokenEssences,
    ...ownerDefaults,
  ]).slice(0, 3);
}

function inferFormDetails(skill, family) {
  const explicitProfile = skill?.magicProfile || skill?.engineProfile || {};
  if (family === "magic") {
    const explicitForm = normalizeLower(explicitProfile.form);
    const explicitDelivery = normalizeLower(explicitProfile.delivery);
    const explicitPattern = normalizeLower(explicitProfile.pattern);
    if (explicitForm) {
      return {
        form: explicitForm,
        delivery: explicitDelivery || "instant",
        pattern: explicitPattern || explicitForm,
      };
    }
  }

  const text = uniqueStrings([
    normalizeLower(skill?.id),
    normalizeLower(skill?.name),
    normalizeLower(skill?.description),
    ...uniqueStrings((skill?.tags || []).map(normalizeLower)),
  ]).join(" ");

  for (const hint of FORM_HINTS) {
    if (hint.tokens.some((token) => text.includes(token))) {
      return {
        form: hint.form,
        delivery: hint.delivery || "instant",
        pattern: hint.pattern || hint.form,
      };
    }
  }

  if (family === "magic") {
    return { form: "pulse", delivery: "instant", pattern: "pulse" };
  }
  return { form: "strike", delivery: "instant", pattern: "strike" };
}

function inferTargeting(skill, runtimeRole, form) {
  const target = normalizeLower(skill?.target);
  if (target) return target;
  const text = `${normalizeLower(skill?.name)} ${normalizeLower(skill?.description)}`;
  if (text.includes("self") || text.includes("yourself")) return "self";
  if (text.includes("all enemies") || text.includes("area") || form === "cone" || form === "vortex") {
    return "zone";
  }
  if (runtimeRole === "stance" || runtimeRole === "channel") return "self";
  return "enemy";
}

function inferScale(skill) {
  const manaCost = Number.isFinite(skill?.manaCost) ? skill.manaCost : 0;
  const cooldown = Number.isFinite(skill?.cooldown) ? skill.cooldown : 0;
  const budget = manaCost + cooldown * 2;
  if (budget >= 40) return 5;
  if (budget >= 28) return 4;
  if (budget >= 18) return 3;
  if (budget >= 10) return 2;
  return 1;
}

function inferScaling(skill, family) {
  const explicitScaling = skill?.engineProfile?.scaling;
  if (explicitScaling && typeof explicitScaling === "object" && !Array.isArray(explicitScaling)) {
    return explicitScaling;
  }

  if (family === "magic") {
    return {
      primary: ["intelligence", "wisdom", "soul"],
      secondary: ["willpower"],
      coefficient: 1,
    };
  }
  if (family === "cultivation") {
    return {
      primary: ["willpower", "soul"],
      secondary: ["vitality"],
      coefficient: 1,
    };
  }
  return {
    primary: ["strength", "dexterity", "agility"],
    secondary: ["vitality"],
    coefficient: 1,
  };
}

function inferEffectProfile(skill) {
  const effects = Array.isArray(skill?.effects)
    ? skill.effects.filter((effect) => effect && typeof effect === "object" && !Array.isArray(effect))
    : [];
  return {
    kind: effects.length > 0 ? "effects" : "none",
    effects,
    damage: skill?.damage || null,
    heal: skill?.heal || null,
    summon: skill?.summon || null,
  };
}

function inferRecipeKey(skill, family, essences, form, pattern, delivery) {
  const explicit = normalizeString(skill?.engineProfile?.recipeKey);
  if (explicit) return explicit;
  if (family === "magic") {
    const essenceLabel = essences.length > 0 ? essences.join("+") : "raw";
    return `magic:${essenceLabel}:${pattern}:${form}:${delivery}`;
  }
  return `${family}:${normalizeString(skill?.id) || normalizeLower(skill?.name) || "unnamed"}`;
}

function inferCostProfile(skill, family, resourceModel) {
  const explicitCostProfile = skill?.engineProfile?.costProfile;
  if (explicitCostProfile && typeof explicitCostProfile === "object" && !Array.isArray(explicitCostProfile)) {
    return explicitCostProfile;
  }

  return {
    resourceModel,
    manaCost: Number.isFinite(skill?.manaCost) ? skill.manaCost : 0,
    cooldown: Number.isFinite(skill?.cooldown) ? skill.cooldown : 0,
    family,
  };
}

function inferMagicProfile(skill, runtimeRole, essences, form, pattern, delivery) {
  if (essences.length === 0) return null;
  return {
    essences,
    form,
    delivery,
    scale: inferScale(skill),
    pattern,
    targeting: inferTargeting(skill, runtimeRole, form),
    displayName: normalizeString(skill?.name) || null,
  };
}

export function deriveEngineProfile(skill) {
  const family = inferFamily(skill);
  const runtimeRole = inferRuntimeRole(skill);
  const resourceModel = inferResourceModel(skill, family);
  const essences = inferEssences(skill, family);
  const { form, delivery, pattern } = inferFormDetails(skill, family);
  const effectProfile = inferEffectProfile(skill);

  return {
    family,
    resourceModel,
    form,
    delivery,
    scaling: inferScaling(skill, family),
    effectProfile,
    recipeKey: inferRecipeKey(skill, family, essences, form, pattern, delivery),
    runtimeRole,
    costProfile: inferCostProfile(skill, family, resourceModel),
    ...(family === "magic"
      ? {
          essences,
          pattern,
          attunementRules: {
            required: essences,
            stanceAware: true,
          },
          resonanceRules: {
            enabled: true,
            gainModel: "cast",
          },
          overloadRules: {
            enabled: true,
            source: "unified_magic",
          },
          magicProfile: inferMagicProfile(
            skill,
            runtimeRole,
            essences,
            form,
            pattern,
            delivery,
          ),
        }
      : {}),
  };
}

export function attachEngineProfile(skill) {
  if (!skill || typeof skill !== "object") return skill;
  const engineProfile = deriveEngineProfile(skill);
  const magicProfile = engineProfile.magicProfile || skill.magicProfile || null;
  const template = skill.template && typeof skill.template === "object" ? skill.template : {};
  const templateMeta =
    template.meta && typeof template.meta === "object" && !Array.isArray(template.meta)
      ? template.meta
      : {};

  return {
    ...skill,
    engineProfile,
    ...(magicProfile ? { magicProfile } : {}),
    template: {
      ...template,
      elements:
        engineProfile.family === "magic" && engineProfile.essences?.length
          ? engineProfile.essences
          : Array.isArray(template.elements)
            ? template.elements
            : [],
      meta: {
        ...templateMeta,
        engineProfile,
        ...(magicProfile ? { magicProfile } : {}),
      },
    },
  };
}

export function validateEngineProfileShape(engineProfile) {
  const profile =
    engineProfile && typeof engineProfile === "object" && !Array.isArray(engineProfile)
      ? engineProfile
      : null;
  if (!profile) {
    return { valid: false, errors: ["engineProfile must be an object."] };
  }

  const required = [
    "family",
    "resourceModel",
    "form",
    "delivery",
    "scaling",
    "effectProfile",
    "recipeKey",
    "runtimeRole",
    "costProfile",
  ];
  const errors = required
    .filter((key) => profile[key] == null || profile[key] === "")
    .map((key) => `Missing engineProfile.${key}`);

  if (normalizeLower(profile.family) === "magic") {
    [
      "essences",
      "pattern",
      "attunementRules",
      "resonanceRules",
      "overloadRules",
    ].forEach((key) => {
      if (profile[key] == null || profile[key] === "") {
        errors.push(`Missing engineProfile.${key}`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}
