import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { classes } from "../packages/game-core/src/data/registries/ClassDataRegistry.js";
import {
  races,
  getPassiveAbility,
  getHiddenTraits,
} from "../packages/game-core/src/data/registries/RaceDataRegistry.js";
import { PROFESSIONS } from "../packages/game-core/src/systems/profession/ProfessionRegistry.js";
import raceAbilitySeeds from "../packages/game-core/src/data/skills/race_abilities.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(
  __dirname,
  "../packages/game-core/src/data/skills/living_lattice_v2.catalog.json",
);

const SKILL_CATALOG_VERSION = "lattice_v2";
const TEMPLATE_SOURCE = "living_lattice_v2_authored";
const ACTIVE_ROLE_RUNTIME_ROLE = Object.freeze({
  strike: "standard",
  guard: "stance",
  mobility: "standard",
  control: "standard",
  field: "channel",
  summon: "standard",
  heal: "standard",
  reaction: "reaction",
  ritual: "ritual",
});
const ACTIVE_ROLE_FUNCTION = Object.freeze({
  strike: "attack",
  guard: "utility",
  mobility: "utility",
  control: "utility",
  field: "channel",
  summon: "utility",
  heal: "heal",
  reaction: "reaction",
  ritual: "ritual",
});
const ACTIVE_COSTS = Object.freeze([
  { cost: 10, cooldown: 3 },
  { cost: 12, cooldown: 3 },
  { cost: 14, cooldown: 4 },
  { cost: 18, cooldown: 5 },
  { cost: 22, cooldown: 6 },
  { cost: 24, cooldown: 6 },
  { cost: 32, cooldown: 8 },
  { cost: 45, cooldown: 12 },
]);
const PASSIVE_HOOKS = new Set([
  "resource_engine",
  "defense_hook",
  "condition_hook",
  "combo_amplifier",
  "stance_channel_modifier",
  "profession_throughput_rule",
]);

const DEFAULT_SCALING = Object.freeze({
  martial: {
    primary: ["strength", "dexterity", "agility"],
    secondary: ["vitality"],
    coefficient: 1,
  },
  magic: {
    primary: ["intelligence", "wisdom", "soul"],
    secondary: ["willpower"],
    coefficient: 1,
  },
  cultivation: {
    primary: ["willpower", "soul", "agility"],
    secondary: ["vitality"],
    coefficient: 1,
  },
  bloodline: {
    primary: ["soul", "willpower", "dexterity"],
    secondary: ["vitality"],
    coefficient: 1,
  },
  profession: {
    primary: ["intelligence", "wisdom", "dexterity"],
    secondary: ["willpower"],
    coefficient: 1,
  },
  universal: {
    primary: ["willpower", "dexterity", "wisdom"],
    secondary: ["vitality"],
    coefficient: 1,
  },
});

const humanizeId = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const uniqueStrings = (values) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean),
    ),
  );

const raceAbilitySeedMap = new Map(
  (Array.isArray(raceAbilitySeeds) ? raceAbilitySeeds : [])
    .filter((entry) => typeof entry?.id === "string")
    .map((entry) => [entry.id, entry]),
);

function buildEffectProfile(kind, { element = null, effects = [], heal = null, summon = null } = {}) {
  return {
    kind,
    effects,
    damage:
      kind === "damage" || kind === "break" || kind === "counter"
        ? {
            multiplier: kind === "break" ? 1.18 : kind === "counter" ? 1.14 : 1.1,
            isMagic: Boolean(element && !["physical", "none"].includes(element)),
            element: element || "physical",
          }
        : null,
    heal,
    summon,
  };
}

function buildEngineProfile({
  id,
  family,
  resourceModel,
  runtimeRole,
  manaCost,
  cooldown,
  effectProfile,
  element = null,
  form = "strike",
  delivery = "instant",
  pattern = null,
}) {
  const base = {
    family,
    resourceModel,
    form,
    delivery,
    scaling: DEFAULT_SCALING[family] || DEFAULT_SCALING.martial,
    effectProfile,
    recipeKey: `${family}:${id}`,
    runtimeRole,
    costProfile: {
      resourceModel,
      manaCost,
      cooldown,
      family,
    },
  };

  if (family !== "magic") {
    return base;
  }

  const essence = element && element !== "physical" ? element : "creation";
  return {
    ...base,
    essences: [essence],
    pattern: pattern || form,
    attunementRules: {
      required: [essence],
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
    magicProfile: {
      essences: [essence],
      form,
      delivery,
      scale: manaCost >= 40 ? 5 : manaCost >= 30 ? 4 : manaCost >= 20 ? 3 : 2,
      pattern: pattern || form,
      targeting:
        runtimeRole === "stance" || runtimeRole === "channel"
          ? "self"
          : runtimeRole === "ritual"
            ? "zone"
            : "enemy",
      displayName: humanizeId(id),
    },
  };
}

const LINE_BEHAVIOR = Object.freeze({
  warrior: {
    family: "martial",
    element: null,
    active: [
      ["Cleave", "strike", "damage"],
      ["Guard", "guard", "shield"],
      ["Rush", "mobility", "dash"],
      ["Roar", "control", "debuff"],
      ["Line", "field", "field"],
      ["Reversal", "reaction", "counter"],
      ["Break", "control", "break"],
      ["Bastion", "field", "field"],
    ],
    passive: [
      ["Engine", "resource_engine"],
      ["Brace", "defense_hook"],
      ["Scar", "condition_hook"],
      ["Sequence", "combo_amplifier"],
      ["Bearing", "stance_channel_modifier"],
      ["Reserve", "resource_engine"],
      ["Riposte", "combo_amplifier"],
      ["Anvil", "defense_hook"],
      ["Geometry", "stance_channel_modifier"],
      ["Appetite", "resource_engine"],
      ["Command", "condition_hook"],
      ["Doctrine", "combo_amplifier"],
    ],
  },
  rogue: {
    family: "martial",
    element: null,
    active: [
      ["Lunge", "strike", "damage"],
      ["Slip", "mobility", "dash"],
      ["Hex", "control", "debuff"],
      ["Veil", "field", "field"],
      ["Hook", "control", "pull"],
      ["Turn", "reaction", "counter"],
      ["Cutweb", "field", "field"],
      ["Execution", "strike", "damage"],
    ],
    passive: [
      ["Theft", "resource_engine"],
      ["Film", "defense_hook"],
      ["Venom", "condition_hook"],
      ["Ledger", "combo_amplifier"],
      ["Silk", "stance_channel_modifier"],
      ["Pace", "resource_engine"],
      ["Ruin", "condition_hook"],
      ["Debt", "combo_amplifier"],
      ["Curtain", "defense_hook"],
      ["Quickening", "resource_engine"],
      ["Spoor", "condition_hook"],
      ["Heist", "combo_amplifier"],
    ],
  },
  mage: {
    family: "magic",
    element: "arcane",
    active: [
      ["Bolt", "strike", "damage"],
      ["Aegis", "guard", "shield"],
      ["Step", "mobility", "dash"],
      ["Bind", "control", "debuff"],
      ["Field", "field", "field"],
      ["Reflect", "reaction", "counter"],
      ["Convergence", "field", "field"],
      ["Rite", "ritual", "field"],
    ],
    passive: [
      ["Circuit", "resource_engine"],
      ["Wardline", "defense_hook"],
      ["Brand", "condition_hook"],
      ["Thesis", "combo_amplifier"],
      ["Cadence", "stance_channel_modifier"],
      ["Reservoir", "resource_engine"],
      ["Diffraction", "condition_hook"],
      ["Reply", "combo_amplifier"],
      ["Focus", "defense_hook"],
      ["Notation", "resource_engine"],
      ["Interlock", "stance_channel_modifier"],
      ["Crown", "combo_amplifier"],
    ],
  },
  cleric: {
    family: "magic",
    element: "light",
    active: [
      ["Judgment", "strike", "damage"],
      ["Sanctuary", "guard", "shield"],
      ["Crossstep", "mobility", "dash"],
      ["Seal", "control", "debuff"],
      ["Choir", "field", "field"],
      ["Mercy", "heal", "heal"],
      ["Intercession", "reaction", "counter"],
      ["Rite", "ritual", "field"],
    ],
    passive: [
      ["Grace", "resource_engine"],
      ["Bulwark", "defense_hook"],
      ["Mark", "condition_hook"],
      ["Litany", "combo_amplifier"],
      ["Cadence", "stance_channel_modifier"],
      ["Reserve", "resource_engine"],
      ["Tribunal", "condition_hook"],
      ["Shelter", "defense_hook"],
      ["Procession", "stance_channel_modifier"],
      ["Credo", "combo_amplifier"],
      ["Threshold", "defense_hook"],
      ["Authority", "resource_engine"],
    ],
  },
  monk: {
    family: "cultivation",
    element: null,
    active: [
      ["Palm", "strike", "damage"],
      ["Root", "guard", "shield"],
      ["Flashstep", "mobility", "dash"],
      ["Lock", "control", "debuff"],
      ["Ring", "field", "field"],
      ["Answer", "reaction", "counter"],
      ["Breakform", "control", "break"],
      ["Rite", "ritual", "field"],
    ],
    passive: [
      ["Breath", "resource_engine"],
      ["Hide", "defense_hook"],
      ["Meridian", "condition_hook"],
      ["Flow", "combo_amplifier"],
      ["Stillness", "stance_channel_modifier"],
      ["Reserve", "resource_engine"],
      ["Fracture", "condition_hook"],
      ["Cadence", "combo_amplifier"],
      ["Coil", "stance_channel_modifier"],
      ["Center", "defense_hook"],
      ["Pulse", "resource_engine"],
      ["Mandate", "combo_amplifier"],
    ],
  },
  ranger: {
    family: "martial",
    element: null,
    active: [
      ["Shot", "strike", "damage"],
      ["Cover", "guard", "shield"],
      ["Trailstep", "mobility", "dash"],
      ["Mark", "control", "debuff"],
      ["Killzone", "field", "field"],
      ["Companion Call", "summon", "summon"],
      ["Snapfire", "reaction", "counter"],
      ["Dominion", "field", "field"],
    ],
    passive: [
      ["Track", "resource_engine"],
      ["Blind", "defense_hook"],
      ["Scent", "condition_hook"],
      ["Sequence", "combo_amplifier"],
      ["Perch", "stance_channel_modifier"],
      ["Reserve", "resource_engine"],
      ["Maw", "condition_hook"],
      ["Windage", "combo_amplifier"],
      ["Mesh", "stance_channel_modifier"],
      ["Bark", "defense_hook"],
      ["Pulse", "resource_engine"],
      ["Crown", "combo_amplifier"],
    ],
  },
});

const CLASS_SPECS = Object.freeze({
  warrior: ["warrior", "Warpath", "vanguard"],
  berserker: ["warrior", "Bloodwake", "rending"],
  guardian: ["warrior", "Aegis", "warding"],
  war_reaver: ["warrior", "Reaver", "ravaging"],
  bulwark_sentinel: ["warrior", "Bulwark", "anchoring"],
  rogue: ["rogue", "Nightglass", "quickhand"],
  shadow_assassin: ["rogue", "Shadefang", "murk"],
  trickster: ["rogue", "Rusewire", "gambit"],
  night_reaper: ["rogue", "Reaper", "gravecut"],
  chaos_saboteur: ["rogue", "Saboteur", "hexspike"],
  mage: ["mage", "Spellthread", "arc"],
  archmage: ["mage", "Starfire", "conflux"],
  battlemage: ["mage", "Runeblade", "arcsteel"],
  astral_archon: ["mage", "Astral", "nova"],
  spellbreaker: ["mage", "Breaker", "nulledge"],
  cleric: ["cleric", "Dawnseal", "votive"],
  paladin: ["cleric", "Sunshield", "vow"],
  high_priest: ["cleric", "Sanctum", "prayer"],
  dawn_vindicator: ["cleric", "Vindicator", "halo"],
  oracle_hierophant: ["cleric", "Oracle", "scripture"],
  monk: ["monk", "Stillwater", "pulse"],
  drunken_master: ["monk", "Merrystorm", "sway"],
  iron_fist: ["monk", "Ironvein", "hammer"],
  tempest_reveler: ["monk", "Tempest", "spiral"],
  adamant_champion: ["monk", "Adamant", "breaker"],
  ranger: ["ranger", "Longtrail", "hunt"],
  beastmaster: ["ranger", "Packlord", "bond"],
  sharpshooter: ["ranger", "Deadline", "sight"],
  primal_overlord: ["ranger", "Primal", "howl"],
  deadeye_commander: ["ranger", "Deadeye", "command"],
});

const UNIVERSAL_ACTIVE_SPECS = Object.freeze([
  ["survey_pulse", "Survey Pulse", "control", "starter", "scan", null, ["scout", "awareness"]],
  ["camp_ward", "Camp Ward", "field", "starter", "field", null, ["survival", "ward"]],
  ["thread_cut", "Thread Cut", "control", "progression", "debuff", null, ["utility", "disrupt"]],
  ["dryfoot_dash", "Dryfoot Dash", "mobility", "progression", "dash", null, ["movement", "survival"]],
  ["torchthrow", "Torchthrow", "strike", "progression", "damage", "fire", ["survival", "fire"]],
  ["field_stitch", "Field Stitch", "heal", "progression", "heal", null, ["first_aid", "survival"]],
  ["hookline", "Hookline", "control", "progression", "pull", null, ["tool", "control"]],
  ["stonehook_guard", "Stonehook Guard", "guard", "progression", "shield", null, ["guard", "terrain"]],
  ["echo_flare", "Echo Flare", "control", "progression", "scan", "light", ["scout", "light"]],
  ["ration_burn", "Ration Burn", "field", "progression", "field", null, ["survival", "field"]],
  ["needle_cast", "Needle Cast", "strike", "progression", "damage", null, ["precision", "utility"]],
  ["wardbreak_kit", "Wardbreak Kit", "control", "progression", "break", null, ["tool", "anti_ward"]],
  ["scrap_decoy", "Scrap Decoy", "summon", "progression", "summon", null, ["trick", "survival"]],
  ["brine_douse", "Brine Douse", "guard", "progression", "shield", "water", ["water", "field"]],
  ["ridgebound_step", "Ridgebound Step", "mobility", "progression", "dash", null, ["movement", "terrain"]],
  ["pressure_lantern", "Pressure Lantern", "field", "progression", "field", null, ["utility", "field"]],
  ["dustveil", "Dustveil", "field", "progression", "field", null, ["stealth", "terrain"]],
  ["wayfinder_chant", "Wayfinder Chant", "ritual", "progression", "field", null, ["ritual", "navigation"]],
  ["ember_reserve", "Ember Reserve", "heal", "progression", "heal", "fire", ["fire", "first_aid"]],
  ["snareburst", "Snareburst", "control", "progression", "debuff", null, ["trap", "control"]],
  ["weatherfork", "Weatherfork", "strike", "progression", "damage", "lightning", ["storm", "utility"]],
  ["grave_salt_circle", "Grave Salt Circle", "field", "progression", "field", null, ["ritual", "survival"]],
  ["mirror_whistle", "Mirror Whistle", "reaction", "progression", "counter", null, ["reaction", "utility"]],
  ["last_fire_bivouac", "Last Fire Bivouac", "ritual", "progression", "field", null, ["ritual", "survival"]],
]);

const UNIVERSAL_PASSIVE_SPECS = Object.freeze([
  ["pack_discipline", "Pack Discipline", "resource_engine", "starter", ["survival", "utility"]],
  ["quiet_steps", "Quiet Steps", "defense_hook", "starter", ["stealth", "movement"]],
  ["stonegut", "Stonegut", "defense_hook", "starter", ["survival", "endurance"]],
  ["thread_sense", "Thread Sense", "condition_hook", "starter", ["awareness", "control"]],
  ["half_knot", "Half Knot", "combo_amplifier", "progression", ["utility", "setup"]],
  ["weather_eye", "Weather Eye", "defense_hook", "progression", ["awareness", "survival"]],
  ["slow_match", "Slow Match", "resource_engine", "progression", ["survival", "economy"]],
  ["pale_ledger", "Pale Ledger", "condition_hook", "progression", ["tracking", "control"]],
  ["overland_breath", "Overland Breath", "stance_channel_modifier", "progression", ["ritual", "survival"]],
  ["camp_fingers", "Camp Fingers", "profession_throughput_rule", "progression", ["craft", "utility"]],
  ["blind_corner_theory", "Blind Corner Theory", "combo_amplifier", "progression", ["terrain", "setup"]],
  ["salt_memory", "Salt Memory", "condition_hook", "progression", ["ritual", "awareness"]],
  ["cold_clock", "Cold Clock", "resource_engine", "progression", ["travel", "economy"]],
  ["gravel_frame", "Gravel Frame", "defense_hook", "progression", ["terrain", "defense"]],
  ["turning_note", "Turning Note", "combo_amplifier", "progression", ["tempo", "awareness"]],
  ["smoke_lore", "Smoke Lore", "stance_channel_modifier", "progression", ["field", "ritual"]],
  ["split_ration", "Split Ration", "profession_throughput_rule", "progression", ["survival", "craft"]],
  ["shock_margin", "Shock Margin", "defense_hook", "progression", ["defense", "endurance"]],
  ["dust_record", "Dust Record", "condition_hook", "progression", ["tracking", "terrain"]],
  ["hinge_principle", "Hinge Principle", "combo_amplifier", "progression", ["control", "tempo"]],
  ["vigil_share", "Vigil Share", "resource_engine", "progression", ["support", "survival"]],
  ["field_patience", "Field Patience", "stance_channel_modifier", "progression", ["ritual", "support"]],
  ["ruin_taxonomy", "Ruin Taxonomy", "condition_hook", "progression", ["awareness", "dungeon"]],
  ["last_margin", "Last Margin", "combo_amplifier", "progression", ["survival", "tempo"]],
]);

function classActiveDescription(classDef, stem, flavor, role) {
  return `${classDef.name} channels ${flavor} discipline through ${stem.toLowerCase()} form to deliver a reliable ${role} answer inside the current class line.`;
}

function classPassiveDescription(classDef, stem, flavor, hook) {
  return `${classDef.name} keeps ${flavor} discipline live between actions, turning ${stem.toLowerCase()} training into a steady ${hook.replace(/_/g, " ")} rule.`;
}

function universalActiveDescription(name, role, tags) {
  return `${name} gives any fresh run a practical ${role} option built for scouting, survival, and low-level control. ${tags[0] ? `It leans on ${tags[0].replace(/_/g, " ")} craft rather than class identity.` : ""}`.trim();
}

function universalPassiveDescription(name, hook, tags) {
  return `${name} adds a persistent ${hook.replace(/_/g, " ")} edge to overland play, camp discipline, and scrappy encounter solving. ${tags[0] ? `It reflects ${tags[0].replace(/_/g, " ")} experience instead of bloodline privilege.` : ""}`.trim();
}

function inferActiveExtras(effectKind, unlockLevel) {
  const effects = [];
  let heal = null;
  let summon = null;
  if (effectKind === "shield") {
    effects.push({ target: "self", id: "shield", duration: 2 + Math.min(unlockLevel, 3), magnitude: 24 + unlockLevel * 3 });
  } else if (effectKind === "debuff") {
    effects.push({ target: "enemy", id: "sunder", duration: 2, magnitude: 0.12 + unlockLevel * 0.01 });
  } else if (effectKind === "field") {
    effects.push({ target: "zone", id: "field_control", duration: 2 + Math.min(unlockLevel, 3), magnitude: 0.1 + unlockLevel * 0.015 });
  } else if (effectKind === "dash") {
    effects.push({ target: "self", id: "haste", duration: 1, magnitude: 0.16 + unlockLevel * 0.01 });
  } else if (effectKind === "counter") {
    effects.push({ target: "self", id: "counter_window", duration: 1, magnitude: 0.14 + unlockLevel * 0.01 });
  } else if (effectKind === "heal") {
    heal = { amount: 22 + unlockLevel * 8, scaling: "standard" };
  } else if (effectKind === "summon") {
    summon = { unit: "field_echo", duration: 2 + Math.min(unlockLevel, 3) };
  } else if (effectKind === "break") {
    effects.push({ target: "enemy", id: "guard_break", duration: 2, magnitude: 0.16 + unlockLevel * 0.01 });
  } else if (effectKind === "scan") {
    effects.push({ target: "zone", id: "reveal", duration: 2, magnitude: 1 });
  } else if (effectKind === "pull") {
    effects.push({ target: "enemy", id: "pull", duration: 1, magnitude: 1 });
  }
  return { effects, heal, summon };
}

function buildActiveSkill({
  id,
  name,
  description,
  ownerType,
  ownerId,
  family,
  resourceModel,
  selectionBand,
  unlockLevel,
  combatRole,
  effectKind,
  element = null,
  tags = [],
  templateCategory,
}) {
  const index = unlockLevel <= 1 ? 0 : unlockLevel <= 4 ? 2 : unlockLevel <= 8 ? 4 : 7;
  const { cost, cooldown } = ACTIVE_COSTS[Math.min(index, ACTIVE_COSTS.length - 1)];
  const runtimeRole = ACTIVE_ROLE_RUNTIME_ROLE[combatRole] || "standard";
  const { effects, heal, summon } = inferActiveExtras(effectKind, unlockLevel);
  const form =
    combatRole === "guard"
      ? "shield"
      : combatRole === "field" || combatRole === "ritual" || combatRole === "summon"
        ? "lattice"
        : combatRole === "mobility"
          ? "veil"
          : combatRole === "heal"
            ? "pulse"
            : "strike";
  const engineProfile = buildEngineProfile({
    id,
    family,
    resourceModel,
    runtimeRole,
    manaCost: cost,
    cooldown,
    effectProfile: buildEffectProfile(effectKind, { element, effects, heal, summon }),
    element,
    form,
    delivery: runtimeRole === "channel" || runtimeRole === "ritual" ? "sustained" : "instant",
    pattern: runtimeRole === "ritual" ? "ritual" : combatRole === "field" ? "zone" : "single",
  });
  return {
    id,
    name,
    description,
    version: SKILL_CATALOG_VERSION,
    type: "active",
    slotType: "active",
    ownerType,
    ownerId,
    class: ownerType === "race" ? null : ownerId,
    family,
    combatRole,
    runtimeRole,
    selectionBand,
    unlockLevel,
    level: unlockLevel,
    tags: uniqueStrings([family, combatRole, ...tags]),
    affinityTags: uniqueStrings([family, combatRole, element, ...tags]),
    template: {
      category: templateCategory,
      function: ACTIVE_ROLE_FUNCTION[combatRole] || "combat",
      elements: element ? [element] : [],
      synergies: [],
      source: TEMPLATE_SOURCE,
      meta: { skillCatalogVersion: SKILL_CATALOG_VERSION },
    },
    costType: resourceModel,
    cost,
    manaCost: cost,
    cooldown,
    effects,
    engineProfile,
    ...(heal ? { heal } : {}),
    ...(summon ? { summon } : {}),
    unlockConditions: { level: unlockLevel, skillPrerequisites: [], profession: ownerType === "profession" ? ownerId : null },
  };
}

function buildPassiveSkill({
  id,
  name,
  description,
  ownerType,
  ownerId,
  family,
  resourceModel,
  selectionBand,
  unlockLevel,
  passiveHookType,
  tags = [],
  templateCategory,
}) {
  if (!PASSIVE_HOOKS.has(passiveHookType)) throw new Error(`Unknown passive hook ${passiveHookType}`);
  const runtimeRole = passiveHookType === "stance_channel_modifier" ? "channel" : "standard";
  return {
    id,
    name,
    description,
    version: SKILL_CATALOG_VERSION,
    type: "passive",
    slotType: "passive",
    ownerType,
    ownerId,
    class: ownerType === "race" ? null : ownerId,
    family,
    passiveHookType,
    runtimeRole,
    selectionBand,
    unlockLevel,
    level: unlockLevel,
    tags: uniqueStrings([family, passiveHookType, ...tags]),
    affinityTags: uniqueStrings([family, passiveHookType, ...tags]),
    template: {
      category: templateCategory,
      function: "passive",
      elements: [],
      synergies: [],
      source: TEMPLATE_SOURCE,
      meta: { skillCatalogVersion: SKILL_CATALOG_VERSION },
    },
    costType: "none",
    cost: 0,
    manaCost: 0,
    cooldown: 0,
    effects: [],
    engineProfile: buildEngineProfile({
      id,
      family,
      resourceModel: resourceModel || "none",
      runtimeRole,
      manaCost: 0,
      cooldown: 0,
      effectProfile: { kind: "passive", effects: [], damage: null, heal: null, summon: null },
      form: runtimeRole === "channel" ? "lattice" : "strike",
      delivery: runtimeRole === "channel" ? "sustained" : "instant",
      pattern: "passive",
    }),
    unlockConditions: { level: unlockLevel, skillPrerequisites: [], profession: ownerType === "profession" ? ownerId : null },
  };
}

function buildClassSkills(classDef) {
  const [line, stem, flavor] = CLASS_SPECS[classDef.id];
  const behavior = LINE_BEHAVIOR[line];
  const activeLevels = [1, 1, 1, 1, 6, 8, 12, 18];
  const passiveLevels = [1, 1, 1, 1, 1, 1, 6, 8, 10, 12, 15, 18];
  const activeSkills = behavior.active.map(([suffix, role, effectKind], index) =>
    buildActiveSkill({
      id: `${classDef.id}_${slugify(`${stem} ${suffix}`)}`,
      name: `${stem} ${suffix}`,
      description: classActiveDescription(classDef, stem, flavor, role),
      ownerType: "class",
      ownerId: classDef.id,
      family: behavior.family,
      resourceModel: classDef.resourceSystem,
      selectionBand: index < 4 ? "starter" : "progression",
      unlockLevel: activeLevels[index],
      combatRole: role,
      effectKind,
      element: behavior.element,
      tags: [line, flavor, classDef.id],
      templateCategory: "Class Skill",
    }),
  );
  const passiveSkills = behavior.passive.map(([suffix, hook], index) =>
    buildPassiveSkill({
      id: `${classDef.id}_${slugify(`${stem} ${suffix}`)}`,
      name: `${stem} ${suffix}`,
      description: classPassiveDescription(classDef, stem, flavor, hook),
      ownerType: "class",
      ownerId: classDef.id,
      family: behavior.family,
      resourceModel: classDef.resourceSystem,
      selectionBand: index < 6 ? "starter" : "progression",
      unlockLevel: passiveLevels[index],
      passiveHookType: hook,
      tags: [line, flavor, classDef.id],
      templateCategory: "Class Skill",
    }),
  );
  return [...activeSkills, ...passiveSkills];
}

function inferBloodlineCombatRole(seed = {}) {
  if (seed.heal) return "heal";
  if (seed.resourceGain) return "guard";
  if (Array.isArray(seed.effects) && seed.effects.some((effect) => effect?.id === "stun")) return "control";
  if (Array.isArray(seed.effects) && seed.effects.some((effect) => effect?.id === "haste")) return "mobility";
  if (Array.isArray(seed.effects) && seed.effects.some((effect) => effect?.id === "shield")) return "guard";
  return seed.damage ? "strike" : "field";
}

function inferBloodlinePassiveHook(passive = {}, hidden = {}) {
  const tags = [
    ...(Array.isArray(passive.tags) ? passive.tags : []),
    ...(Array.isArray(hidden.tags) ? hidden.tags : []),
  ].map((tag) => String(tag).toLowerCase());
  if (tags.some((tag) => tag.includes("regen") || tag.includes("boost") || tag.includes("lifesteal"))) return "resource_engine";
  if (tags.some((tag) => tag.includes("immune") || tag.includes("resist") || tag.includes("def"))) return "defense_hook";
  if (tags.some((tag) => tag.includes("fear") || tag.includes("poison") || tag.includes("mark"))) return "condition_hook";
  return "combo_amplifier";
}

function buildRaceSkills() {
  return races.flatMap((race) => {
    const passive = getPassiveAbility(race.id) || {};
    const hidden = getHiddenTraits(race.id) || {};
    const activeSeed = raceAbilitySeedMap.get(`${race.id}_special`) || {};
    const combatRole = inferBloodlineCombatRole(activeSeed);
    return [
      buildActiveSkill({
        id: `${race.id}_bloodline_active`,
        name: activeSeed.name?.trim() || `${race.name} Surge`,
        description: `${activeSeed.description?.trim() || `${race.name} bloodline awakens in a decisive burst.`} ${race.name} begins with this technique already woven into the lattice.`,
        ownerType: "race",
        ownerId: race.id,
        family: "bloodline",
        resourceModel: "mana",
        selectionBand: "starter",
        unlockLevel: 1,
        combatRole,
        effectKind: combatRole === "heal" ? "heal" : combatRole === "guard" ? "shield" : combatRole === "control" ? "debuff" : combatRole === "mobility" ? "dash" : combatRole === "field" ? "field" : "damage",
        element: activeSeed?.template?.elements?.[0] || null,
        tags: [race.id, "bloodline"],
        templateCategory: "Race Skill",
      }),
      buildPassiveSkill({
        id: `${race.id}_bloodline_passive`,
        name: passive.name?.trim() || `${race.name} Legacy`,
        description: `${passive.description?.trim() || `${race.name} carries a durable inherited edge.`} ${hidden.description?.trim() || ""} ${race.name} enters creation with this bloodline rule already active.`.trim(),
        ownerType: "race",
        ownerId: race.id,
        family: "bloodline",
        resourceModel: "none",
        selectionBand: "starter",
        unlockLevel: 1,
        passiveHookType: inferBloodlinePassiveHook(passive, hidden),
        tags: [race.id, "bloodline"],
        templateCategory: "Race Skill",
      }),
    ];
  });
}

function buildUniversalSkills() {
  const activeSkills = UNIVERSAL_ACTIVE_SPECS.map(([id, name, role, band, effectKind, element, tags], index) =>
    buildActiveSkill({
      id: `universal_${id}`,
      name,
      description: universalActiveDescription(name, role, tags),
      ownerType: "universal",
      ownerId: "universal",
      family: "universal",
      resourceModel: element ? "mana" : "none",
      selectionBand: band,
      unlockLevel: index < 2 ? 1 : 4 + index,
      combatRole: role,
      effectKind,
      element,
      tags: [...tags, "universal"],
      templateCategory: "Universal Technique",
    }),
  );
  const passiveSkills = UNIVERSAL_PASSIVE_SPECS.map(([id, name, hook, band, tags], index) =>
    buildPassiveSkill({
      id: `universal_${id}`,
      name,
      description: universalPassiveDescription(name, hook, tags),
      ownerType: "universal",
      ownerId: "universal",
      family: "universal",
      resourceModel: "none",
      selectionBand: band,
      unlockLevel: index < 4 ? 1 : 4 + index,
      passiveHookType: hook,
      tags: [...tags, "universal"],
      templateCategory: "Universal Technique",
    }),
  );
  return [...activeSkills, ...passiveSkills];
}

function buildProfessionSkills() {
  const tiers = [1, 3, 5, 7, 9];
  const tierLabel = { 1: "Novice", 3: "Journeyman", 5: "Expert", 7: "Grandmaster", 9: "Mythic" };
  return Object.values(PROFESSIONS).flatMap((profession) =>
    tiers.map((tier, index) => {
      const skillId = profession?.tierUnlocks?.[tier]?.skills?.[0] || `${profession.id}_tier_${tier}`;
      const action = profession.actions?.[Math.min(index, profession.actions.length - 1)] || "work";
      const specialization = profession.specializations?.[Math.min(index, profession.specializations.length - 1)] || profession.id;
      return buildPassiveSkill({
        id: skillId,
        name: humanizeId(skillId),
        description: `${tierLabel[tier]} ${profession.name} discipline turns ${action.replace(/_/g, " ")} work into cleaner ${specialization.replace(/_/g, " ")} output without pretending time or material costs disappear.`,
        ownerType: "profession",
        ownerId: profession.id,
        family: "profession",
        resourceModel: "none",
        selectionBand: tier === 1 ? "starter" : "progression",
        unlockLevel: tier,
        passiveHookType: "profession_throughput_rule",
        tags: [profession.id, profession.category, action, specialization],
        templateCategory: "Profession Discipline",
      });
    }),
  );
}

function validateCounts(catalog) {
  const classCounts = new Map();
  const raceCounts = new Map();
  const professionCounts = new Map();
  let universalActive = 0;
  let universalPassive = 0;
  catalog.forEach((skill) => {
    const targetMap =
      skill.ownerType === "class"
        ? classCounts
        : skill.ownerType === "race"
          ? raceCounts
          : skill.ownerType === "profession"
            ? professionCounts
            : null;
    if (targetMap) {
      if (!targetMap.has(skill.ownerId)) targetMap.set(skill.ownerId, { active: 0, passive: 0 });
      targetMap.get(skill.ownerId)[skill.slotType] += 1;
    }
    if (skill.ownerType === "universal") {
      if (skill.slotType === "active") universalActive += 1;
      if (skill.slotType === "passive") universalPassive += 1;
    }
  });
  classes.forEach((classDef) => {
    const count = classCounts.get(classDef.id);
    if (!count || count.active !== 8 || count.passive !== 12) throw new Error(`Invalid class pack for ${classDef.id}`);
  });
  races.forEach((race) => {
    const count = raceCounts.get(race.id);
    if (!count || count.active !== 1 || count.passive !== 1) throw new Error(`Invalid race pack for ${race.id}`);
  });
  Object.values(PROFESSIONS).forEach((profession) => {
    const count = professionCounts.get(profession.id);
    if (!count || count.active !== 0 || count.passive !== 5) throw new Error(`Invalid profession pack for ${profession.id}`);
  });
  if (universalActive !== 24 || universalPassive !== 24) throw new Error(`Invalid universal pack active=${universalActive} passive=${universalPassive}`);
}

async function main() {
  const catalog = [
    ...classes.flatMap((classDef) => buildClassSkills(classDef)),
    ...buildRaceSkills(),
    ...buildUniversalSkills(),
    ...buildProfessionSkills(),
  ].sort((left, right) => left.id.localeCompare(right.id));
  validateCounts(catalog);
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`generated ${path.relative(path.resolve(__dirname, ".."), OUTPUT_PATH)}`);
  console.log(`skills=${catalog.length} version=${SKILL_CATALOG_VERSION}`);
}

await main();
