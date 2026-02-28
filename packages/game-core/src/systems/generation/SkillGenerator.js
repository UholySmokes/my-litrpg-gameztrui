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

// Flavor templates keyed by [form.name][element.name] — gives each combination
// a distinct atmospheric line grounded in the Shardfall Meridian setting.
const SKILL_FLAVOR = {
  Strike: {
    Fire:      "A focused ignition burst channeled through the fist. Leaves scorch-marks on anything it touches.",
    Ice:       "A precise impact flash-freezes the target on contact. The crack of ice is louder than the hit.",
    Void:      "A condensed void-point driven into the target. What it erases, it does not return.",
    Light:     "A searing lance of focused luminance. Blinds before it burns.",
    Nature:    "A driving strike wrapped in thorned growth. The vines stay after the fist withdraws.",
    Lightning: "A conductive strike that discharges on impact. Nerves disagree with the voltage.",
    Time:      "A blow delivered slightly before the opponent's body finishes processing its own position.",
    Blood:     "A precise strike aimed at the veins. The damage continues after the hand pulls back.",
  },
  Blast: {
    Fire:      "A wide-arc ignition that doesn't care how many enemies are in range.",
    Ice:       "A spreading frost-burst that coats the area in brittle crystal. Movement becomes unreliable.",
    Void:      "An expanding void-pulse that erodes coherence within the blast radius.",
    Light:     "A solar flare release. Everyone in range gets the same warning: none.",
    Nature:    "An eruption of accelerated growth — roots, thorns, and spores in all directions.",
    Lightning: "A branching arc discharge. The path of least resistance is not always a straight line.",
    Time:      "A temporal distortion field. Everything inside moves at the wrong speed.",
    Blood:     "A pressurized sanguine burst that finds every gap in armor.",
  },
  Shield: {
    Fire:      "A combustion skin that converts incoming blows into heat and redirects it outward.",
    Ice:       "A lattice of reactive ice that shatters when struck, absorbing kinetic force.",
    Void:      "A void-film overlay that causes attacks to pass through altered probability.",
    Light:     "A luminous barrier. Difficult to look at. Difficult to hit past.",
    Nature:    "A living bark shell that regrows between hits as long as the channel holds.",
    Lightning: "A static field that deflects conductive forces and shocks anything that penetrates.",
    Time:      "A temporal buffer that slightly delays impact, redistributing force across a longer window.",
    Blood:     "A coagulation shell that thickens each time it absorbs a hit.",
  },
  Aura: {
    Fire:      "Ambient heat bleeds off the caster at all times. Comfortable for them; less so for everyone nearby.",
    Ice:       "A persistent cold emanation that saps warmth and slows reactions around the caster.",
    Void:      "A faint void-resonance surrounds the caster. Predictive abilities struggle near them.",
    Light:     "A soft luminance field. Good for visibility. Bad for stealth.",
    Nature:    "Spores and pollen cycle constantly around the caster. Minor irritant to the unresistant.",
    Lightning: "A low-level static field. Small sparks. Constant mild surprise.",
    Time:      "A local time-dilation that makes the caster's reactions marginally faster than physics allows.",
    Blood:     "A faint iron-smell emanation. Wounds the caster sustains heal slightly faster.",
  },
  Wave: {
    Fire:      "A rolling flame front along a line. Step aside or step into it.",
    Ice:       "A spreading frost sheet that locks the ground into a shear-hazard corridor.",
    Void:      "A linear void-trough that unravels anything standing in the channel.",
    Light:     "A cutting beam of focused light extending through everything in a straight line.",
    Nature:    "A fast-moving root-wave that erupts from the ground along a set trajectory.",
    Lightning: "A chain arc that bounces between targets in a line until the charge dissipates.",
    Time:      "A temporal rift wave that ages or reverses everything it passes through.",
    Blood:     "A pressurized wave of sanguine energy that causes lacerations on contact.",
  },
  Infusion: {
    Fire:      "Ignites the body's kinetic output. Actions burn hotter and faster for the duration.",
    Ice:       "Cores the body in cold stillness. Pain response is dampened; precision increases.",
    Void:      "Voids the self briefly. Attacks land with extra weight of nothingness behind them.",
    Light:     "Channels luminance through the caster's strikes. Damage carries a blinding afterimage.",
    Nature:    "Growth-accelerant saturates the body. Minor wounds seal. Reflexes go feral.",
    Lightning: "Charges the nervous system beyond normal capacity. Speed and reaction time spike dangerously.",
    Time:      "Briefly de-synchronizes the caster from linear time. Strikes appear before their wind-up.",
    Blood:     "Activates a blood-fever state. Damage scales with how injured the caster already is.",
  },
};

function buildSkillDescription(element, form) {
  const byForm = SKILL_FLAVOR[form.name];
  if (byForm) {
    const desc = byForm[element.name];
    if (desc) return desc;
  }
  // Fallback (should not be reached with the full matrix above)
  return `A ${form.name.toLowerCase()} of ${element.name.toLowerCase()} energy. Applies ${element.effect}.`;
}

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
    description: buildSkillDescription(element, form),
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
