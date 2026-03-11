// =================================================================
// SPELL STUDY SYSTEM
// Creates and improves spells through study actions.
// =================================================================

import { randomChoice } from "../../utils/DeterministicRandom.js";
import { SimBridge } from "../../simulation/bridge/SimulationContext.js";
import { evolveSkill } from "./SkillEvolutionSystem.js";
import { attachLatticeMetadata } from "./LivingLatticeSystem.js";

const ESSENCE_ELEMENTS = [
  {
    id: "fire",
    name: "Fire",
    effectId: "burn",
    effectMagnitude: 6,
    multiplier: 1.2,
    aliases: ["fire"],
  },
  {
    id: "water",
    name: "Water",
    effectId: "wet",
    effectMagnitude: 1,
    multiplier: 1.12,
    aliases: ["water", "ice"],
  },
  {
    id: "earth",
    name: "Earth",
    effectId: "sunder",
    effectMagnitude: 0.15,
    multiplier: 1.15,
    aliases: ["earth", "stone"],
  },
  {
    id: "air",
    name: "Air",
    effectId: "confuse",
    effectMagnitude: 0.2,
    multiplier: 1.11,
    aliases: ["air", "wind"],
  },
  {
    id: "lightning",
    name: "Lightning",
    effectId: "shock",
    effectMagnitude: 0.1,
    multiplier: 1.25,
    aliases: ["lightning"],
  },
  {
    id: "shadow",
    name: "Shadow",
    effectId: "curse",
    effectMagnitude: 0.12,
    multiplier: 1.2,
    aliases: ["shadow", "dark"],
  },
  {
    id: "light",
    name: "Light",
    effectId: "radiant_mark",
    effectMagnitude: 0.12,
    multiplier: 1.18,
    aliases: ["light", "holy"],
  },
  {
    id: "life",
    name: "Life",
    effectId: "poison",
    effectMagnitude: 5,
    multiplier: 1.14,
    aliases: ["life", "nature"],
  },
  {
    id: "creation",
    name: "Creation",
    effectId: "haste",
    effectMagnitude: 0.25,
    multiplier: 1.2,
    aliases: ["creation"],
  },
  {
    id: "destruction",
    name: "Destruction",
    effectId: "bleed",
    effectMagnitude: 8,
    multiplier: 1.23,
    aliases: ["destruction"],
  },
  {
    id: "space",
    name: "Space",
    effectId: "root",
    effectMagnitude: 1,
    multiplier: 1.17,
    aliases: ["space", "void", "arcane"],
  },
  {
    id: "time",
    name: "Time",
    effectId: "stun",
    effectMagnitude: 1,
    multiplier: 1.22,
    aliases: ["time", "temporal"],
  },
];

const FORMS = [
  {
    id: "bolt",
    name: "Bolt",
    baseMana: 12,
    cooldown: 2,
    multiplier: 1.1,
    tags: ["projectile"],
  },
  {
    id: "lance",
    name: "Lance",
    baseMana: 16,
    cooldown: 3,
    multiplier: 1.2,
    tags: ["piercing"],
  },
  {
    id: "burst",
    name: "Burst",
    baseMana: 18,
    cooldown: 4,
    multiplier: 1.25,
    tags: ["impact"],
  },
  {
    id: "nova",
    name: "Nova",
    baseMana: 22,
    cooldown: 5,
    multiplier: 1.15,
    tags: ["aoe"],
    aoe: { maxTargets: 3, damageMultiplier: 0.85 },
  },
];

const normalizeTags = (tags) =>
  Array.isArray(tags) ? tags.filter((tag) => typeof tag === "string") : [];

const normalizeId = (baseId, existingIds = new Set()) => {
  if (!existingIds.has(baseId)) return baseId;
  let index = 2;
  while (existingIds.has(`${baseId}_${index}`)) {
    index += 1;
  }
  return `${baseId}_${index}`;
};

const LEGACY_ESSENCE_MAP = ESSENCE_ELEMENTS.reduce((acc, entry) => {
  acc[entry.id] = entry.id;
  for (const alias of entry.aliases || []) {
    const key = String(alias || "").trim().toLowerCase();
    if (!key) continue;
    acc[key] = entry.id;
  }
  return acc;
}, {});

const ESSENCE_ID_SET = new Set(ESSENCE_ELEMENTS.map((entry) => entry.id));

function normalizeEssenceId(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  return LEGACY_ESSENCE_MAP[raw] || raw;
}

export const isSpellSkill = (skill) => {
  if (!skill || typeof skill !== "object") return false;
  if (skill.isMagic) return true;

  const element = normalizeEssenceId(skill.element);
  if (ESSENCE_ID_SET.has(element)) return true;

  const templateElements = Array.isArray(skill.template?.elements)
    ? skill.template.elements.map(normalizeEssenceId).filter(Boolean)
    : [];
  if (templateElements.some((id) => ESSENCE_ID_SET.has(id))) return true;

  const tags = normalizeTags(skill.tags).map((tag) => String(tag).toLowerCase());
  if (tags.includes("spell") || tags.includes("magic")) return true;
  if (tags.some((tag) => tag.startsWith("essence_"))) return true;

  const description = String(skill.description || "").toLowerCase();
  return description.includes("spell");
};

export const createStudiedSpell = ({ level = 1, existingIds } = {}) => {
  const chosenEssence = randomChoice(ESSENCE_ELEMENTS);
  const chosenForm = randomChoice(FORMS);
  if (!chosenEssence || !chosenForm) return null;

  const scaledMultiplier =
    chosenEssence.multiplier + chosenForm.multiplier - 1 + level * 0.02;
  const manaCost = Math.max(
    6,
    Math.floor(chosenForm.baseMana * (1 + level * 0.1)),
  );
  const duration = Math.min(5, 2 + Math.floor(level / 6));
  const baseId = `study_${chosenEssence.id}_${chosenForm.id}_${SimBridge.now()}`;
  const id = normalizeId(baseId, existingIds);

  return attachLatticeMetadata({
    id,
    name: `${chosenEssence.name} ${chosenForm.name}`,
    type: "active",
    class: "study",
    level: Math.max(1, level),
    isMagic: true,
    element: chosenEssence.id,
    essence: chosenEssence.id,
    manaCost,
    cooldown: chosenForm.cooldown,
    description: `A studied ${chosenForm.name.toLowerCase()} of ${chosenEssence.name.toLowerCase()} essence.`,
    template: {
      category: "Spell Study",
      function: "spell",
      elements: [chosenEssence.id],
      synergies: [],
      source: "SpellStudySystem",
      meta: {
        form: chosenForm.id,
        essenceModel: "twelve-prime",
      },
    },
    damage: {
      multiplier: Math.round(scaledMultiplier * 100) / 100,
      isMagic: true,
      element: chosenEssence.id,
    },
    effects: [
      {
        id: chosenEssence.effectId,
        target: "enemy",
        duration,
        magnitude: chosenEssence.effectMagnitude,
      },
    ],
    tags: Array.from(
      new Set([
        "spell",
        "study",
        chosenEssence.id,
        `essence_${chosenEssence.id}`,
        ...chosenForm.tags,
      ]),
    ),
    ...(chosenForm.aoe ? { aoe: chosenForm.aoe } : {}),
    canEvolve: true,
    canFuse: true,
  }, {
    family: "magic",
    sourceType: "study",
  });
};

export const improveStudiedSpell = (skill, { existingIds } = {}) => {
  const evolved = evolveSkill(skill, { existingIds });
  if (!evolved) return null;

  const resolvedEssence = normalizeEssenceId(
    evolved.element ?? evolved.essence ?? skill.element ?? skill.essence,
  );

  const existingTemplateElements = Array.isArray(evolved.template?.elements)
    ? evolved.template.elements
    : Array.isArray(skill.template?.elements)
      ? skill.template.elements
      : [];
  const normalizedTemplateElements = existingTemplateElements
    .map(normalizeEssenceId)
    .filter(Boolean);
  if (resolvedEssence && normalizedTemplateElements.length === 0) {
    normalizedTemplateElements.push(resolvedEssence);
  }

  const nextTags = new Set([...(evolved.tags || []), "spell", "study"]);
  if (resolvedEssence) {
    nextTags.add(resolvedEssence);
    nextTags.add(`essence_${resolvedEssence}`);
  }

  return attachLatticeMetadata({
    ...evolved,
    isMagic: skill.isMagic ?? true,
    element: resolvedEssence || evolved.element || skill.element,
    essence: resolvedEssence || evolved.essence || skill.essence,
    tags: Array.from(nextTags),
    template: {
      ...(evolved.template || skill.template || {}),
      category: "Spell Study",
      function: "spell",
      elements: normalizedTemplateElements,
      synergies:
        evolved.template?.synergies ||
        skill.template?.synergies ||
        [],
      source: "SpellStudySystem",
      meta: {
        ...(evolved.template?.meta || skill.template?.meta || {}),
        essenceModel: "twelve-prime",
      },
    },
  }, {
    family: "magic",
    sourceType: "study",
  });
};
