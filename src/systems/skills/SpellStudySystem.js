// =================================================================
// SPELL STUDY SYSTEM
// Creates and improves spells through study actions.
// =================================================================

import { randomChoice } from "../../utils/DeterministicRandom.js";
import { SimBridge } from "../../simulation/bridge/SimulationContext.js";
import { evolveSkill } from "./SkillEvolutionSystem.js";

const ELEMENTS = [
  {
    id: "fire",
    name: "Fire",
    effectId: "burn",
    effectMagnitude: 6,
    multiplier: 1.2,
  },
  {
    id: "ice",
    name: "Ice",
    effectId: "frostbite",
    effectMagnitude: 6,
    multiplier: 1.15,
  },
  {
    id: "lightning",
    name: "Lightning",
    effectId: "shock",
    effectMagnitude: 0.1,
    multiplier: 1.25,
  },
  {
    id: "nature",
    name: "Nature",
    effectId: "poison",
    effectMagnitude: 5,
    multiplier: 1.1,
  },
  {
    id: "holy",
    name: "Holy",
    effectId: "radiant_mark",
    effectMagnitude: 0.12,
    multiplier: 1.18,
  },
  {
    id: "dark",
    name: "Dark",
    effectId: "curse",
    effectMagnitude: 0.12,
    multiplier: 1.2,
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

export const isSpellSkill = (skill) => {
  if (!skill || typeof skill !== "object") return false;
  if (skill.isMagic) return true;
  const element = String(skill.element || "").toLowerCase();
  const isElemental = ELEMENTS.some((entry) => entry.id === element);
  if (isElemental) return true;
  const tags = normalizeTags(skill.tags);
  if (tags.includes("spell") || tags.includes("magic")) return true;
  const description = String(skill.description || "").toLowerCase();
  return description.includes("spell");
};

export const createStudiedSpell = ({ level = 1, existingIds } = {}) => {
  const chosenElement = randomChoice(ELEMENTS);
  const chosenForm = randomChoice(FORMS);
  if (!chosenElement || !chosenForm) return null;

  const scaledMultiplier =
    chosenElement.multiplier + chosenForm.multiplier - 1 + level * 0.02;
  const manaCost = Math.max(
    6,
    Math.floor(chosenForm.baseMana * (1 + level * 0.1)),
  );
  const duration = Math.min(5, 2 + Math.floor(level / 6));
  const baseId = `study_${chosenElement.id}_${chosenForm.id}_${SimBridge.now()}`;
  const id = normalizeId(baseId, existingIds);

  return {
    id,
    name: `${chosenElement.name} ${chosenForm.name}`,
    type: "active",
    class: "study",
    level: Math.max(1, level),
    isMagic: true,
    element: chosenElement.id,
    manaCost,
    cooldown: chosenForm.cooldown,
    description: `A studied ${chosenForm.name.toLowerCase()} of ${chosenElement.name.toLowerCase()} energy.`,
    damage: {
      multiplier: Math.round(scaledMultiplier * 100) / 100,
      isMagic: true,
      element: chosenElement.id,
    },
    effects: [
      {
        id: chosenElement.effectId,
        target: "enemy",
        duration,
        magnitude: chosenElement.effectMagnitude,
      },
    ],
    tags: Array.from(
      new Set(["spell", "study", chosenElement.id, ...chosenForm.tags]),
    ),
    ...(chosenForm.aoe ? { aoe: chosenForm.aoe } : {}),
    canEvolve: true,
    canFuse: true,
  };
};

export const improveStudiedSpell = (skill, { existingIds } = {}) => {
  const evolved = evolveSkill(skill, { existingIds });
  if (!evolved) return null;
  const nextTags = new Set([...(evolved.tags || []), "spell", "study"]);
  return {
    ...evolved,
    isMagic: skill.isMagic ?? true,
    element: evolved.element ?? skill.element,
    tags: Array.from(nextTags),
  };
};
