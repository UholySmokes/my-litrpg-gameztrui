import { generateName } from "./NameGenerator.js";
import { randomChoice } from "../../utils/DeterministicRandom.js";

const ELEMENTS = [
  { name: "Fire", type: "physical", effect: "burn" },
  { name: "Ice", type: "magical", effect: "freeze" },
  { name: "Void", type: "magical", effect: "corruption" },
  { name: "Light", type: "magical", effect: "blind" },
  { name: "Nature", type: "physical", effect: "poison" },
  { name: "Lightning", type: "magical", effect: "shock" },
  { name: "Time", type: "magical", effect: "slow" },
  { name: "Blood", type: "physical", effect: "bleed" },
];

const FORMS = [
  {
    name: "Strike",
    type: "active",
    target: "single",
    multiplier: 1.5,
    cost: 10,
  },
  { name: "Blast", type: "active", target: "aoe", multiplier: 0.8, cost: 25 },
  { name: "Shield", type: "buff", target: "self", multiplier: 0, cost: 15 },
  { name: "Aura", type: "passive", target: "self", multiplier: 0.1, cost: 0 },
  { name: "Wave", type: "active", target: "line", multiplier: 1.2, cost: 20 },
  { name: "Infusion", type: "buff", target: "self", multiplier: 0.5, cost: 30 },
];

export function generateSkill(level = 1) {
  const element = randomChoice(ELEMENTS);
  const form = randomChoice(FORMS);

  const theme = element.type === "magical" ? "celestial" : "primal";
  const epithet = generateName(theme).toLowerCase().replace(/\s+/g, "_");
  const name = `${element.name} ${form.name} of ${epithet.replace(/_/g, " ")}`;
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "_");

  // Scaling based on level
  const damage =
    form.multiplier > 0 ? Math.floor(10 * form.multiplier * level) : 0;
  const manaCost = Math.floor(form.cost * (1 + level * 0.1));
  const cooldown = form.type === "active" ? 3 : 0;

  return {
    id,
    name,
    type: form.type,
    element: element.name,
    description: `A ${form.name.toLowerCase()} of ${element.name.toLowerCase()}. Applies ${element.effect}.`,
    stats: {
      damage,
      manaCost,
      cooldown,
      target: form.target,
      effect: element.effect,
    },
    requirements: {
      level,
    },
  };
}

export function generateSkillSet(count = 4, level = 1) {
  const skills = [];
  for (let i = 0; i < count; i++) {
    skills.push(generateSkill(level));
  }
  return skills;
}
