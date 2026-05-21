// =================================================================
// VoidGenerator Content Adapter
// Merges VoidGenerator-exported JSON content into game registries.
//
// Usage: call `bridgeVoidGeneratorContent()` at startup (e.g. in DataRegistry.js)
// =================================================================

import {races as _races} from "./registries/RaceDataRegistry.js";
import {classes as _classes} from "./registries/ClassDataRegistry.js";
import {itemDatabase, setItemDatabase} from "./registries/ItemDataRegistry.js";

// Lazily loaded — callers must invoke loadVoidGeneratorData() first.
let _vg = null;

export async function loadVoidGeneratorData() {
  if (_vg) return _vg;
  try {
    _vg = {
      races: await import("./generated/void_races.json", { with: { type: "json" } }).then(m => m.default),
      classes: await import("./generated/void_classes.json", { with: { type: "json" } }).then(m => m.default),
      skills: await import("./generated/void_skills.json", { with: { type: "json" } }).then(m => m.default),
      items: await import("./generated/void_items.json", { with: { type: "json" } }).then(m => m.default),
      factions: await import("./generated/void_factions.json", { with: { type: "json" } }).then(m => m.default),
      quests: await import("./generated/void_quests.json", { with: { type: "json" } }).then(m => m.default),
      countries: await import("./generated/void_countries.json", { with: { type: "json" } }).then(m => m.default),
    };
  } catch (err) {
    console.warn("[VoidGeneratorAdapter] Could not load exported data:", err.message);
    _vg = { races: [], classes: [], skills: [], items: [], factions: [], quests: [], countries: [] };
  }
  return _vg;
}

// ── Race ─────────────────────────────────────────────────────────────────────

const ATTR_MAP = { str: "strength", agi: "agility", dex: "dexterity", int: "intelligence", wis: "wisdom", cha: "charisma", will: "willpower", vit: "vitality", soul: "soul", luck: "luck" };

function mapAttrs(abilityBonuses) {
  const out = {};
  for (const [k, v] of Object.entries(abilityBonuses)) {
    out[ATTR_MAP[k] ?? k] = v;
  }
  return out;
}

function _mapRaceType(type) {
  const map = { HUMANOID: "mortal", BEASTKIN: "beastkin", MONSTROUS: "monstrous", ELEMENTAL: "elemental", UNDEAD: "undead", PLANT: "plant", CONSTRUCT: "construct", HYBRID: "hybrid", CUSTOM: "mortal" };
  return map[type] ?? "mortal";
}

function toGameRace(vr) {
  const id = `vg_${vr.id}`;
  return {
    id,
    name: vr.name,
    description: vr.description,
    evolutionStage: _mapRaceType(vr.type),
    statBonuses: mapAttrs(vr.abilityBonuses ?? {}),
    passiveAbility: {
      id: `${id}_passive`,
      name: vr.traits?.[0] ?? "Special Trait",
      description: vr.traits?.join(" / ") ?? "A unique racial trait.",
      tags: [],
    },
    hiddenTrait: {
      id: `${id}_hidden`,
      name: vr.weaknesses?.[0] ?? "Hidden Trait",
      description: vr.weaknesses?.join(" / ") ?? "A hidden quality.",
    },
    // origin extras
    favoredClasses: vr.favoredClasses ?? [],
    region: vr.region ?? "Unknown",
    rarity: vr.rarity ?? "Common",
  };
}

export function getVoidGeneratorRaces() {
  if (!_vg) return [];
  return _vg.races.map(toGameRace);
}

export function injectVoidGeneratorRaces(existingRaces) {
  const vgRaces = getVoidGeneratorRaces();
  return [...existingRaces, ...vgRaces];
}

// ── Class ─────────────────────────────────────────────────────────────────────

const RESOURCE_MAP = { WARRIOR: "rage", MAGE: "mana", ROGUE: "energy", HEALER: "mana", SUPPORT: "mana", HYBRID: "focus", LEADER: "focus", CRAFTER: "mana", NONE: "mana" };
const TIER_MAP = { EASY: 1, MODERATE: 1, HARD: 2, VERY_HARD: 2, EXPERT: 3 };
const STAT_MAP = { Strength: "str", Dexterity: "dex", Constitution: "vit", Intelligence: "int", Wisdom: "wis", Charisma: "cha" };

function toGameClass(vc) {
  const id = `vg_${vc.id}`;
  const baseStats = {str: 0, agi: 0, dex: 0, int: 0, cha: 0, will: 0, soul: 0, vit: 0, luck: 0};
  if (vc.abilityBonuses) {
    for (const [k, v] of Object.entries(vc.abilityBonuses)) {
      baseStats[STAT_MAP[k] ?? k] = v;
    }
  }
  return {
    id,
    name: vc.name,
    description: vc.description,
    tier: TIER_MAP[vc.difficulty] ?? 1,
    parentId: null,
    upgradePath: null,
    resourceSystem: RESOURCE_MAP[vc.role] ?? "mana",
    coreMechanics: [],
    baseStats,
    evolutionOptions: [],
    // extras
    role: vc.role,
    magicType: vc.magicType,
    hitDie: vc.hitDie ?? 8,
    armorProficiencies: vc.armorProficiencies ?? [],
    weaponProficiencies: vc.weaponProficiencies ?? [],
    savingThrows: vc.savingThrows ?? [],
    skillChoices: vc.skillChoices ?? [],
    startingEquipment: vc.startingEquipment ?? [],
    level1Features: vc.level1Features ?? [],
    versatility: vc.versatility ?? 1,
    powerLevel: vc.powerLevel ?? 1,
    lore: vc.lore ?? "",
  };
}

export function getVoidGeneratorClasses() {
  if (!_vg) return [];
  return _vg.classes.map(toGameClass);
}

export function injectVoidGeneratorClasses(existingClasses) {
  const vgClasses = getVoidGeneratorClasses();
  return [...existingClasses, ...vgClasses];
}

// ── Item ─────────────────────────────────────────────────────────────────────

const RARITY_MAP = { COMMON: "common", UNCOMMON: "uncommon", RARE: "rare", VERY_RARE: "rare", LEGENDARY: "legendary", ARTIFACT: "legendary" };
const TYPE_MAP = { WEAPON: "weapon", ARMOR: "armor", WAND: "weapon", RING: "accessory", AMULET: "accessory", BELT: "armor", BOOTS: "armor", HEADGEAR: "armor", GLOVES: "armor", SHIELD: "armor", ROD: "weapon", STAFF: "weapon", WONDROUS: "accessory", POTION: "consumable", SCROLL: "consumable" };

function toGameItem(vi) {
  const id = `vg_${vi.id}`;
  const rarity = RARITY_MAP[vi.rarity] ?? "common";
  const itemType = TYPE_MAP[vi.type] ?? "equipment";
  const stats = {};
  for (const ab of (vi.abilities ?? [])) {
    const match = ab.match(/\+(\d+) to (\w+)/);
    if (match) {
      const stat = match[2].toLowerCase().startsWith("att") ? "attack"
        : match[2].toLowerCase().startsWith("def") ? "defense"
        : match[2].toLowerCase().startsWith("mag") ? "magic"
        : match[2].toLowerCase().startsWith("spe") ? "speed"
        : "attack";
      stats[stat] = (stats[stat] ?? 0) + parseInt(match[1]);
    }
  }
  return {
    id,
    name: vi.name,
    type: itemType,
    quantity: 1,
    description: vi.description ?? "",
    equipSlot: itemType === "consumable" ? undefined : itemType,
    stats: Object.keys(stats).length ? stats : { attack: 1 },
    rarity,
    value: parseInt(vi.value) || 100,
    // extras
    magicalEffect: vi.magicalEffect ?? "",
    charges: vi.charges ?? 0,
    rechargeCondition: vi.rechargeCondition ?? "",
    materials: vi.materials ?? [],
    lore: vi.lore ?? "",
    curse: vi.curse !== "None" ? vi.curse : "",
  };
}

export function getVoidGeneratorItems() {
  if (!_vg) return {};
  const entries = {};
  for (const vi of _vg.items) {
    const item = toGameItem(vi);
    entries[item.id] = item;
  }
  return entries;
}

export function injectVoidGeneratorItems(existingDb) {
  const vgItems = getVoidGeneratorItems();
  return { ...existingDb, ...vgItems };
}

// ── Skill (as talents) ─────────────────────────────────────────────────────────

export function getVoidGeneratorSkills() {
  if (!_vg) return [];
  return _vg.skills.map(vs => ({
    id: `vg_${vs.id}`,
    name: vs.name,
    description: vs.description,
    category: vs.category,
    rarity: vs.rarity?.toLowerCase() ?? "common",
    cost: vs.manaCost ? `${vs.manaCost} mana` : vs.staminaCost ? `${vs.staminaCost} stamina` : "passive",
    cooldown: vs.cooldown ?? null,
    castTime: vs.castTime ?? null,
    range: vs.range ?? "self",
    scaling: vs.scaling ?? "per level",
    relatedClasses: vs.relatedClasses ?? [],
    discoveryMethod: vs.discoveryMethod ?? "Training",
    trainingRequirement: vs.trainingRequirement ?? "Mentor",
  }));
}

// ── Faction ────────────────────────────────────────────────────────────────────

export function getVoidGeneratorFactions() {
  if (!_vg) return [];
  return _vg.factions.map(vf => ({
    id: `vg_${vf.id}`,
    name: vf.name,
    type: vf.type,
    scope: vf.scope,
    description: vf.description,
    headquarters: vf.headquarters,
    territory: vf.territory,
    leader: vf.leader,
    motto: vf.motto,
    goals: vf.goals ?? [],
    influence: vf.influence ?? 50,
    strength: vf.strength ?? 50,
    wealth: vf.wealth ?? 50,
    reputation: vf.reputation ?? "Neutral",
    currentConflict: vf.currentConflict ?? "None",
    weaknesses: vf.weaknesses ?? [],
  }));
}

// ── Quest ─────────────────────────────────────────────────────────────────────

export function getVoidGeneratorQuests() {
  if (!_vg) return [];
  return _vg.quests.map(vq => ({
    id: `vg_${vq.id}`,
    title: vq.title,
    type: vq.type,
    difficulty: vq.difficulty,
    setting: vq.setting,
    description: vq.description,
    premise: vq.premise,
    objectives: vq.objectives ?? [],
    rewards: vq.rewards ?? [],
    client: vq.client,
    location: vq.location,
    dangers: vq.dangers ?? [],
    npcs: vq.npcs ?? [],
    moralChoice: vq.moralChoice ?? "",
    timePressure: vq.timePressure ?? "",
    failureConsequences: vq.failureConsequences ?? "",
    successBonus: vq.successBonus ?? "",
  }));
}

// ── Country ────────────────────────────────────────────────────────────────────

export function getVoidGeneratorCountries() {
  if (!_vg) return [];
  return _vg.countries.map(vc => ({
    id: `vg_${vc.id}`,
    name: vc.name,
    fullName: vc.fullName,
    capital: vc.capital,
    governmentType: vc.governmentType,
    economyType: vc.economyType,
    technologyLevel: vc.technologyLevel,
    societyType: vc.societyType,
    population: vc.population ?? 100000,
    majorCities: vc.majorCities ?? [],
    resources: vc.resources ?? [],
    majorReligions: vc.majorReligions ?? [],
    history: vc.history ?? "",
    allies: vc.allies ?? [],
    enemies: vc.enemies ?? [],
  }));
}

// ── Bridge all ────────────────────────────────────────────────────────────────

export function applyVoidGeneratorPatches() {
  // Races — patch the exported array in-place
  if (_vg && _races) {
    const vgRaces = getVoidGeneratorRaces();
    for (const r of vgRaces) _races.push(r);
  }

  // Classes
  if (_vg && _classes) {
    const vgClasses = getVoidGeneratorClasses();
    for (const c of vgClasses) _classes.push(c);
  }

  // Items — use the setter
  if (_vg && itemDatabase) {
    const merged = injectVoidGeneratorItems(itemDatabase);
    setItemDatabase(merged);
  }

  console.log("[VoidGeneratorAdapter] Content injected successfully.");
}
