// =================================================================
// CLASS ABILITY REGISTRY — Tiered Archetype System
// Tier 2 inherits all Tier 1 parent abilities + unique advanced skills.
// Abilities use their archetype's resource (rage/chi/mana/energy/focus).
// =================================================================

import { getClassById, getClassLineage } from "../../data/registries/ClassDataRegistry.js";

// ── Ability Definitions ─────────────────────────────────────────────

const ABILITIES = {

  // ═══════════════════════════════════════════════════════════════════
  // WARRIOR (Rage) — Tier 1 Core Skills
  // ═══════════════════════════════════════════════════════════════════
  war_cry: {
    id: "war_cry",
    name: "War Cry",
    description: "A rallying shout that generates rage and boosts damage.",
    cost: 0,
    costType: "rage",
    cooldown: 6,
    target: "self",
    resourceGain: { type: "rage", amount: 25 },
    effects: [{ id: "might", target: "self", duration: 3, magnitude: 0.15 }],
  },
  shield_block: {
    id: "shield_block",
    name: "Shield Block",
    description: "Raise your shield to absorb incoming damage.",
    cost: 15,
    costType: "rage",
    cooldown: 3,
    target: "self",
    effects: [{ id: "shield", target: "self", duration: 2, magnitude: 30 }],
  },
  stance_offensive: {
    id: "stance_offensive",
    name: "Offensive Stance",
    description: "Adopt an aggressive stance, trading defense for damage.",
    cost: 0,
    costType: "none",
    cooldown: 2,
    target: "self",
    setStance: "offensive",
    effects: [{ id: "might", target: "self", duration: 3, magnitude: 0.2 }],
  },
  stance_defensive: {
    id: "stance_defensive",
    name: "Defensive Stance",
    description: "Adopt a defensive stance for added protection.",
    cost: 0,
    costType: "none",
    cooldown: 2,
    target: "self",
    setStance: "defensive",
    effects: [{ id: "shield", target: "self", duration: 3, magnitude: 35 }],
  },

  // ─── Berserker (Warrior T2 — Offense) ─────────────────────────────
  enrage: {
    id: "enrage",
    name: "Enrage",
    description: "Enter a frenzy for 2 turns, boosting damage but lowering defense.",
    cost: 50,
    costType: "rage",
    cooldown: 5,
    target: "self",
    setEnrage: { turns: 2, damageMultiplier: 1.4, defenseMultiplier: 0.85 },
    effects: [{ id: "might", target: "self", duration: 2, magnitude: 0.2 }],
  },
  reckless_blow: {
    id: "reckless_blow",
    name: "Reckless Blow",
    description: "A crushing strike that hits hard but recoils damage.",
    cost: 30,
    costType: "rage",
    cooldown: 3,
    damage: { multiplier: 1.6, isMagic: false },
    selfDamagePercentOfDamage: 0.2,
  },
  bloodlust: {
    id: "bloodlust",
    name: "Bloodlust",
    description: "Accelerate into a killing frenzy, gaining haste.",
    cost: 40,
    costType: "rage",
    cooldown: 10,
    target: "self",
    effects: [{ id: "haste", target: "self", duration: 3, magnitude: 0.3 }],
  },
  rampage: {
    id: "rampage",
    name: "Rampage",
    description: "A multi-hit onslaught that heals with each strike.",
    cost: 60,
    costType: "rage",
    cooldown: 8,
    damage: { multiplier: 1.4, isMagic: false },
    lifesteal: 0.25,
  },

  // ─── Guardian (Warrior T2 — Defense) ──────────────────────────────
  taunt: {
    id: "taunt",
    name: "Taunt",
    description: "Force the enemy's attention onto you.",
    cost: 15,
    costType: "rage",
    cooldown: 6,
    effects: [{ id: "taunt", target: "enemy", duration: 2 }],
  },
  fortify: {
    id: "fortify",
    name: "Fortify",
    description: "Harden your armor with pure willpower.",
    cost: 25,
    costType: "rage",
    cooldown: 8,
    target: "self",
    effects: [{ id: "shield", target: "self", duration: 3, magnitude: 55 }],
  },
  shield_bash: {
    id: "shield_bash",
    name: "Shield Bash",
    description: "Bash the enemy and stun them.",
    cost: 20,
    costType: "rage",
    cooldown: 4,
    damage: { multiplier: 1.1, isMagic: false },
    effects: [{ id: "stun", target: "enemy", duration: 1 }],
  },
  phalanx_wall: {
    id: "phalanx_wall",
    name: "Phalanx Wall",
    description: "Erect an impenetrable barrier and reflect attacks.",
    cost: 40,
    costType: "rage",
    cooldown: 12,
    target: "self",
    effects: [
      { id: "shield", target: "self", duration: 3, magnitude: 60 },
      { id: "reflect", target: "self", duration: 2, magnitude: 0.2 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // ROGUE (Energy) — Tier 1 Core Skills
  // ═══════════════════════════════════════════════════════════════════
  quick_strike: {
    id: "quick_strike",
    name: "Quick Strike",
    description: "A fast, low-cost attack that builds combo.",
    cost: 15,
    costType: "energy",
    cooldown: 1,
    damage: { multiplier: 1.1, isMagic: false },
  },
  evade: {
    id: "evade",
    name: "Evade",
    description: "Slip away and increase evasion briefly.",
    cost: 30,
    costType: "energy",
    cooldown: 4,
    target: "self",
    effects: [{ id: "blur", target: "self", duration: 2, magnitude: 0.2 }],
  },
  vanish: {
    id: "vanish",
    name: "Vanish",
    description: "Enter stealth during combat for a short duration.",
    cost: 40,
    costType: "energy",
    cooldown: 10,
    target: "self",
    stealth: { duration: 2 },
  },
  cheap_shot: {
    id: "cheap_shot",
    name: "Cheap Shot",
    description: "A dirty strike that weakens the target's defenses.",
    cost: 20,
    costType: "energy",
    cooldown: 3,
    damage: { multiplier: 1.0, isMagic: false },
    effects: [{ id: "sunder", target: "enemy", duration: 2, magnitude: 0.1 }],
  },

  // ─── Shadow Assassin (Rogue T2 — Burst) ──────────────────────────
  shadow_step: {
    id: "shadow_step",
    name: "Shadow Step",
    description: "Teleport behind the target for a devastating ambush.",
    cost: 35,
    costType: "energy",
    cooldown: 5,
    damage: { multiplier: 1.5, isMagic: false },
    effects: [{ id: "slow", target: "enemy", duration: 1, magnitude: -0.2 }],
  },
  poison_blade: {
    id: "poison_blade",
    name: "Poison Blade",
    description: "Coat your weapon with lethal toxin.",
    cost: 25,
    costType: "energy",
    cooldown: 8,
    damage: { multiplier: 1.0, isMagic: false },
    effects: [{ id: "poison", target: "enemy", duration: 4, magnitude: 5 }],
  },
  death_mark: {
    id: "death_mark",
    name: "Death Mark",
    description: "Mark the target for death — bonus damage to marked targets.",
    cost: 30,
    costType: "energy",
    cooldown: 6,
    damage: { multiplier: 1.3, isMagic: false },
    effects: [{ id: "sunder", target: "enemy", duration: 3, magnitude: 0.15 }],
  },
  execute: {
    id: "execute",
    name: "Execute",
    description: "A lethal finisher that destroys weakened targets.",
    cost: 50,
    costType: "energy",
    cooldown: 8,
    damage: { multiplier: 1.8, isMagic: false },
    executeThreshold: 0.3,
  },

  // ─── Trickster (Rogue T2 — Control) ───────────────────────────────
  smoke_bomb: {
    id: "smoke_bomb",
    name: "Smoke Bomb",
    description: "Deploy a smoke cloud that confuses the enemy and grants evasion.",
    cost: 30,
    costType: "energy",
    cooldown: 8,
    target: "self",
    effects: [
      { id: "blur", target: "self", duration: 2, magnitude: 0.25 },
      { id: "confuse", target: "enemy", duration: 2 },
    ],
  },
  caltrops: {
    id: "caltrops",
    name: "Caltrops",
    description: "Scatter caltrops that slow and damage over time.",
    cost: 25,
    costType: "energy",
    cooldown: 6,
    damage: { multiplier: 0.8, isMagic: false },
    effects: [{ id: "slow", target: "enemy", duration: 3, magnitude: -0.3 }],
  },
  misdirect: {
    id: "misdirect",
    name: "Misdirect",
    description: "Trick the enemy into attacking thin air.",
    cost: 35,
    costType: "energy",
    cooldown: 10,
    effects: [{ id: "confuse", target: "enemy", duration: 2 }],
  },
  rigged_trap: {
    id: "rigged_trap",
    name: "Rigged Trap",
    description: "Set a concealed trap that stuns and damages.",
    cost: 40,
    costType: "energy",
    cooldown: 12,
    damage: { multiplier: 1.3, isMagic: false },
    effects: [{ id: "stun", target: "enemy", duration: 1 }],
  },

  // ═══════════════════════════════════════════════════════════════════
  // MAGE (Mana) — Tier 1 Core Skills
  // ═══════════════════════════════════════════════════════════════════
  fireball: {
    id: "fireball",
    name: "Fireball",
    description: "Hurl a burning sphere that scorches the enemy.",
    cost: 25,
    costType: "mana",
    cooldown: 3,
    damage: { multiplier: 1.25, isMagic: true, element: "fire" },
    effects: [{ id: "burn", target: "enemy", duration: 3, magnitude: 8 }],
  },
  ice_lance: {
    id: "ice_lance",
    name: "Ice Lance",
    description: "A piercing lance of frost that slows the target.",
    cost: 20,
    costType: "mana",
    cooldown: 3,
    damage: { multiplier: 1.15, isMagic: true, element: "ice" },
    effects: [{ id: "slow", target: "enemy", duration: 2, magnitude: -0.3 }],
  },
  lightning_bolt: {
    id: "lightning_bolt",
    name: "Lightning Bolt",
    description: "Chain lightning that disrupts focus.",
    cost: 30,
    costType: "mana",
    cooldown: 4,
    damage: { multiplier: 1.3, isMagic: true, element: "lightning" },
    effects: [{ id: "shock", target: "enemy", duration: 2, magnitude: 0.1 }],
  },
  mana_shield: {
    id: "mana_shield",
    name: "Mana Shield",
    description: "Convert mana into a protective ward.",
    cost: 20,
    costType: "mana",
    cooldown: 10,
    target: "self",
    effects: [{ id: "shield", target: "self", duration: 3, magnitude: 45 }],
  },

  // ─── Archmage (Mage T2 — Mastery) ────────────────────────────────
  meteor_storm: {
    id: "meteor_storm",
    name: "Meteor Storm",
    description: "Rain destruction from above, hitting all foes.",
    cost: 50,
    costType: "mana",
    cooldown: 10,
    damage: { multiplier: 1.5, isMagic: true, element: "fire" },
    aoe: { maxTargets: 3, damageMultiplier: 1.0 },
    effects: [{ id: "burn", target: "enemy", duration: 3, magnitude: 10 }],
  },
  arcane_singularity: {
    id: "arcane_singularity",
    name: "Arcane Singularity",
    description: "Collapse space to root and damage the target.",
    cost: 40,
    costType: "mana",
    cooldown: 8,
    damage: { multiplier: 1.35, isMagic: true },
    effects: [{ id: "root", target: "enemy", duration: 2 }],
  },
  mana_surge: {
    id: "mana_surge",
    name: "Mana Surge",
    description: "Overload your reserves for a burst of speed.",
    cost: 0,
    costType: "mana",
    cooldown: 15,
    target: "self",
    resourceGain: { type: "mana", amount: 40 },
    effects: [{ id: "haste", target: "self", duration: 2, magnitude: 0.3 }],
  },
  spell_echo: {
    id: "spell_echo",
    name: "Spell Echo",
    description: "Your next spell fires twice.",
    cost: 35,
    costType: "mana",
    cooldown: 12,
    target: "self",
    effects: [{ id: "might", target: "self", duration: 2, magnitude: 0.25 }],
  },

  // ─── Battlemage (Mage T2 — Hybrid) ───────────────────────────────
  flame_blade: {
    id: "flame_blade",
    name: "Flame Blade",
    description: "Imbue your strike with fire.",
    cost: 25,
    costType: "mana",
    cooldown: 3,
    damage: { multiplier: 1.2, isMagic: true, element: "fire" },
    effects: [{ id: "burn", target: "enemy", duration: 2, magnitude: 6 }],
  },
  frost_blade: {
    id: "frost_blade",
    name: "Frost Blade",
    description: "Imbue your strike with frost.",
    cost: 25,
    costType: "mana",
    cooldown: 3,
    damage: { multiplier: 1.15, isMagic: true, element: "ice" },
    effects: [{ id: "slow", target: "enemy", duration: 2, magnitude: -0.3 }],
  },
  arcane_strike: {
    id: "arcane_strike",
    name: "Arcane Strike",
    description: "A precise arcane-infused melee attack.",
    cost: 15,
    costType: "mana",
    cooldown: 2,
    damage: { multiplier: 1.2, isMagic: true },
  },
  arcane_burst: {
    id: "arcane_burst",
    name: "Arcane Burst",
    description: "Unleash a volatile blast at close range.",
    cost: 30,
    costType: "mana",
    cooldown: 8,
    damage: { multiplier: 1.45, isMagic: true },
  },

  // ═══════════════════════════════════════════════════════════════════
  // CLERIC (Mana) — Tier 1 Core Skills
  // ═══════════════════════════════════════════════════════════════════
  heal: {
    id: "heal",
    name: "Heal",
    description: "Restore a portion of your health with divine light.",
    cost: 20,
    costType: "mana",
    cooldown: 2,
    target: "self",
    heal: { percent: 0.2 },
  },
  holy_smite: {
    id: "holy_smite",
    name: "Holy Smite",
    description: "Smite the enemy with radiant power.",
    cost: 25,
    costType: "mana",
    cooldown: 3,
    damage: { multiplier: 1.25, isMagic: true, element: "holy" },
    bonusVsTags: { tags: ["Undead"], multiplier: 1.5 },
  },
  divine_shield: {
    id: "divine_shield",
    name: "Divine Shield",
    description: "Imbue yourself with protective holy light.",
    cost: 40,
    costType: "mana",
    cooldown: 12,
    target: "self",
    effects: [{ id: "shield", target: "self", duration: 3, magnitude: 55 }],
  },
  prayer: {
    id: "prayer",
    name: "Prayer",
    description: "Whisper a prayer that cleanses debuffs.",
    cost: 15,
    costType: "mana",
    cooldown: 6,
    target: "self",
    cleanse: { types: ["DEBUFF", "DOT"] },
  },

  // ─── Paladin (Cleric T2 — Warrior-Healer) ────────────────────────
  holy_strike: {
    id: "holy_strike",
    name: "Holy Strike",
    description: "Strike with holy power that sears the unholy.",
    cost: 20,
    costType: "mana",
    cooldown: 2,
    damage: { multiplier: 1.2, isMagic: false, element: "holy" },
  },
  lay_on_hands: {
    id: "lay_on_hands",
    name: "Lay on Hands",
    description: "Massive heal with a long recovery time.",
    cost: 0,
    costType: "mana",
    cooldown: 30,
    target: "self",
    heal: { percent: 0.5 },
  },
  hammer_of_justice: {
    id: "hammer_of_justice",
    name: "Hammer of Justice",
    description: "Stun the enemy with a holy strike.",
    cost: 25,
    costType: "mana",
    cooldown: 15,
    damage: { multiplier: 1.1, isMagic: false },
    effects: [{ id: "stun", target: "enemy", duration: 1 }],
  },
  aura_of_protection: {
    id: "aura_of_protection",
    name: "Aura of Protection",
    description: "Radiate a protective aura that shields and heals over time.",
    cost: 35,
    costType: "mana",
    cooldown: 10,
    target: "self",
    heal: { percent: 0.15 },
    effects: [{ id: "shield", target: "self", duration: 3, magnitude: 30 }],
  },

  // ─── High Priest (Cleric T2 — Full Healer) ───────────────────────
  greater_heal: {
    id: "greater_heal",
    name: "Greater Heal",
    description: "A powerful restorative surge.",
    cost: 40,
    costType: "mana",
    cooldown: 3,
    target: "self",
    heal: { percent: 0.4 },
  },
  mass_cleanse: {
    id: "mass_cleanse",
    name: "Mass Cleanse",
    description: "Purify all ailments with a holy word.",
    cost: 30,
    costType: "mana",
    cooldown: 8,
    target: "self",
    cleanse: { types: ["DEBUFF", "DOT", "CONTROL"] },
    heal: { percent: 0.1 },
  },
  divine_intervention: {
    id: "divine_intervention",
    name: "Divine Intervention",
    description: "Call upon the divine to prevent death once.",
    cost: 60,
    costType: "mana",
    cooldown: 30,
    target: "self",
    effects: [{ id: "shield", target: "self", duration: 1, magnitude: 100 }],
  },
  holy_nova: {
    id: "holy_nova",
    name: "Holy Nova",
    description: "Radiant burst that damages foes and heals you.",
    cost: 35,
    costType: "mana",
    cooldown: 6,
    damage: { multiplier: 1.1, isMagic: true, element: "holy" },
    heal: { percent: 0.15 },
  },

  // ═══════════════════════════════════════════════════════════════════
  // MONK (Chi) — Tier 1 Core Skills
  // ═══════════════════════════════════════════════════════════════════
  flurry: {
    id: "flurry",
    name: "Flurry",
    description: "Rapid strikes that scale with combo flow.",
    cost: 20,
    costType: "chi",
    cooldown: 2,
    damage: { multiplier: 1.3, isMagic: false },
  },
  palm_strike: {
    id: "palm_strike",
    name: "Palm Strike",
    description: "A focused blow that stuns the target.",
    cost: 25,
    costType: "chi",
    cooldown: 4,
    damage: { multiplier: 1.1, isMagic: false },
    effects: [{ id: "stun", target: "enemy", duration: 1 }],
  },
  meditation: {
    id: "meditation",
    name: "Meditate",
    description: "Center yourself to restore chi in combat.",
    cost: 0,
    costType: "chi",
    cooldown: 5,
    target: "self",
    resourceGain: { type: "chi", amount: 30 },
  },
  sweeping_kick: {
    id: "sweeping_kick",
    name: "Sweeping Kick",
    description: "A wide sweep that trips the enemy, slowing them.",
    cost: 15,
    costType: "chi",
    cooldown: 3,
    damage: { multiplier: 1.05, isMagic: false },
    effects: [{ id: "slow", target: "enemy", duration: 2, magnitude: -0.2 }],
  },

  // ─── Drunken Master (Monk T2 — Evasion) ──────────────────────────
  stumble_strike: {
    id: "stumble_strike",
    name: "Stumble Strike",
    description: "An erratic lunge that confuses the target.",
    cost: 20,
    costType: "chi",
    cooldown: 3,
    damage: { multiplier: 1.2, isMagic: false },
    effects: [{ id: "confuse", target: "enemy", duration: 2 }],
  },
  drunken_sway: {
    id: "drunken_sway",
    name: "Drunken Sway",
    description: "Sway unpredictably, gaining evasion and counter-attack potential.",
    cost: 25,
    costType: "chi",
    cooldown: 6,
    target: "self",
    effects: [{ id: "blur", target: "self", duration: 3, magnitude: 0.25 }],
  },
  counter_flow: {
    id: "counter_flow",
    name: "Counter Flow",
    description: "Redirect enemy momentum into a devastating counter.",
    cost: 30,
    costType: "chi",
    cooldown: 8,
    damage: { multiplier: 1.5, isMagic: false },
    effects: [{ id: "reflect", target: "self", duration: 1, magnitude: 0.3 }],
  },
  barrel_roll: {
    id: "barrel_roll",
    name: "Barrel Roll",
    description: "Tumble through the enemy, damaging and repositioning.",
    cost: 35,
    costType: "chi",
    cooldown: 10,
    damage: { multiplier: 1.15, isMagic: false },
    effects: [{ id: "haste", target: "self", duration: 2, magnitude: 0.2 }],
  },

  // ─── Iron Fist (Monk T2 — Impact) ────────────────────────────────
  iron_palm: {
    id: "iron_palm",
    name: "Iron Palm",
    description: "A crushing palm strike that shatters armor.",
    cost: 25,
    costType: "chi",
    cooldown: 4,
    damage: { multiplier: 1.4, isMagic: false },
    effects: [{ id: "sunder", target: "enemy", duration: 3, magnitude: 0.15 }],
  },
  chi_burst: {
    id: "chi_burst",
    name: "Chi Burst",
    description: "Release stored chi in a devastating burst.",
    cost: 50,
    costType: "chi",
    cooldown: 10,
    damage: { multiplier: 1.8, isMagic: false },
  },
  iron_body: {
    id: "iron_body",
    name: "Iron Body",
    description: "Reinforce your body with chi, gaining a shield.",
    cost: 30,
    costType: "chi",
    cooldown: 8,
    target: "self",
    effects: [{ id: "shield", target: "self", duration: 3, magnitude: 50 }],
  },
  pressure_point: {
    id: "pressure_point",
    name: "Pressure Point",
    description: "Target vital points to stun and weaken.",
    cost: 35,
    costType: "chi",
    cooldown: 6,
    damage: { multiplier: 1.2, isMagic: false },
    effects: [
      { id: "stun", target: "enemy", duration: 1 },
      { id: "slow", target: "enemy", duration: 2, magnitude: -0.2 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // RANGER (Focus) — Tier 1 Core Skills
  // ═══════════════════════════════════════════════════════════════════
  aimed_shot: {
    id: "aimed_shot",
    name: "Aimed Shot",
    description: "A precise shot that hits hard with high accuracy.",
    cost: 30,
    costType: "focus",
    cooldown: 3,
    damage: { multiplier: 1.5, isMagic: false },
  },
  multi_shot: {
    id: "multi_shot",
    name: "Multi-Shot",
    description: "Loose a spread to strike multiple foes.",
    cost: 25,
    costType: "focus",
    cooldown: 4,
    damage: { multiplier: 0.85, isMagic: false },
    aoe: { maxTargets: 3, damageMultiplier: 0.85 },
  },
  hunters_mark: {
    id: "hunters_mark",
    name: "Hunter's Mark",
    description: "Mark your prey, increasing damage against them.",
    cost: 15,
    costType: "focus",
    cooldown: 6,
    effects: [{ id: "sunder", target: "enemy", duration: 4, magnitude: 0.15 }],
  },
  natures_grasp: {
    id: "natures_grasp",
    name: "Nature's Grasp",
    description: "Entangle the target with vines, rooting them.",
    cost: 25,
    costType: "focus",
    cooldown: 8,
    damage: { multiplier: 0.9, isMagic: true, element: "nature" },
    effects: [{ id: "root", target: "enemy", duration: 2 }],
  },

  // ─── Beastmaster (Ranger T2 — Pet) ────────────────────────────────
  command_roar: {
    id: "command_roar",
    name: "Command Roar",
    description: "A domineering roar that draws enemy focus.",
    cost: 25,
    costType: "focus",
    cooldown: 6,
    effects: [{ id: "taunt", target: "enemy", duration: 2 }],
  },
  pack_assault: {
    id: "pack_assault",
    name: "Pack Assault",
    description: "Command your pack to strike together.",
    cost: 35,
    costType: "focus",
    cooldown: 5,
    damage: { multiplier: 1.35, isMagic: false },
  },
  beast_bond: {
    id: "beast_bond",
    name: "Beast Bond",
    description: "Share focus with your companion, healing and strengthening.",
    cost: 30,
    costType: "focus",
    cooldown: 10,
    target: "self",
    heal: { percent: 0.2 },
    effects: [{ id: "might", target: "self", duration: 3, magnitude: 0.15 }],
  },
  alpha_guard: {
    id: "alpha_guard",
    name: "Alpha Guard",
    description: "A protective stance that hardens your defenses.",
    cost: 25,
    costType: "focus",
    cooldown: 8,
    target: "self",
    effects: [{ id: "shield", target: "self", duration: 3, magnitude: 40 }],
  },

  // ─── Sharpshooter (Ranger T2 — Precision) ────────────────────────
  rapid_fire: {
    id: "rapid_fire",
    name: "Rapid Fire",
    description: "A burst of quick shots.",
    cost: 40,
    costType: "focus",
    cooldown: 5,
    damage: { multiplier: 1.4, isMagic: false },
  },
  trick_shot: {
    id: "trick_shot",
    name: "Trick Shot",
    description: "A ricocheting shot that hits around defenses.",
    cost: 30,
    costType: "focus",
    cooldown: 4,
    damage: { multiplier: 1.25, isMagic: false },
    effects: [{ id: "sunder", target: "enemy", duration: 2, magnitude: 0.1 }],
  },
  overwatch: {
    id: "overwatch",
    name: "Overwatch",
    description: "Set up a killzone — gain haste and damage.",
    cost: 35,
    costType: "focus",
    cooldown: 10,
    target: "self",
    effects: [
      { id: "might", target: "self", duration: 3, magnitude: 0.2 },
      { id: "haste", target: "self", duration: 2, magnitude: 0.2 },
    ],
  },
  kill_shot: {
    id: "kill_shot",
    name: "Kill Shot",
    description: "A precise finisher that executes weakened targets.",
    cost: 50,
    costType: "focus",
    cooldown: 12,
    damage: { multiplier: 2.0, isMagic: false },
    executeThreshold: 0.25,
  },
};

// ── Ability-Set Mapping (Tier 1 only — Tier 2 resolved via inheritance) ──

/**
 * Tier 1 base ability ids (4 per archetype).
 * @type {Record<string, string[]>}
 */
const TIER1_ABILITY_SETS = {
  warrior: ["war_cry", "shield_block", "stance_offensive", "stance_defensive"],
  rogue:   ["quick_strike", "evade", "vanish", "cheap_shot"],
  mage:    ["fireball", "ice_lance", "lightning_bolt", "mana_shield"],
  cleric:  ["heal", "holy_smite", "divine_shield", "prayer"],
  monk:    ["flurry", "palm_strike", "meditation", "sweeping_kick"],
  ranger:  ["aimed_shot", "multi_shot", "hunters_mark", "natures_grasp"],
};

/**
 * Tier 2 unique ability ids (4 per specialization).
 * @type {Record<string, string[]>}
 */
const TIER2_ABILITY_SETS = {
  berserker:       ["enrage", "reckless_blow", "bloodlust", "rampage"],
  guardian:        ["taunt", "fortify", "shield_bash", "phalanx_wall"],
  shadow_assassin: ["shadow_step", "poison_blade", "death_mark", "execute"],
  trickster:       ["smoke_bomb", "caltrops", "misdirect", "rigged_trap"],
  archmage:        ["meteor_storm", "arcane_singularity", "mana_surge", "spell_echo"],
  battlemage:      ["flame_blade", "frost_blade", "arcane_strike", "arcane_burst"],
  paladin:         ["holy_strike", "lay_on_hands", "hammer_of_justice", "aura_of_protection"],
  high_priest:     ["greater_heal", "mass_cleanse", "divine_intervention", "holy_nova"],
  drunken_master:  ["stumble_strike", "drunken_sway", "counter_flow", "barrel_roll"],
  iron_fist:       ["iron_palm", "chi_burst", "iron_body", "pressure_point"],
  beastmaster:     ["command_roar", "pack_assault", "beast_bond", "alpha_guard"],
  sharpshooter:    ["rapid_fire", "trick_shot", "overwatch", "kill_shot"],
};

// ── Helpers ─────────────────────────────────────────────────────────

const normalizeAbilityTemplate = (ability, { category, source, ownerId } = {}) => {
  if (!ability || typeof ability !== "object") return ability;

  const next = { ...ability };
  const template =
    next.template && typeof next.template === "object" ? next.template : {};
  const effects = Array.isArray(next.effects)
    ? next.effects.map((effect) =>
        effect && typeof effect === "object" && !Array.isArray(effect)
          ? { target: effect.target ?? (next.target === "self" ? "self" : "enemy"), ...effect }
          : effect,
      )
    : [];

  const element = next.damage?.element || next.element || null;
  const defaultFunction = next.damage
    ? next.damage.isMagic
      ? "spell"
      : "attack"
    : next.heal
      ? "heal"
      : next.resourceGain
        ? "resource"
        : "utility";

  return {
    ...next,
    effects,
    template: {
      category: template.category || category || "Class Ability",
      function: template.function || defaultFunction,
      elements: Array.isArray(template.elements)
        ? template.elements
        : element
          ? [element]
          : [],
      synergies: Array.isArray(template.synergies) ? template.synergies : [],
      source: template.source || source || "ClassAbilityRegistry",
      ...(template.meta && typeof template.meta === "object"
        ? { meta: template.meta }
        : ownerId
          ? { meta: { ownerId } }
          : {}),
    },
  };
};

/**
 * Resolve the full ability-id list for a class, respecting inheritance.
 * Tier 1 → own 4 skills.
 * Tier 2 → parent's 4 + own 4 = 8 skills.
 * @param {string} classId
 * @returns {string[]|null}
 */
function resolveAbilityIds(classId) {
  if (!classId) return null;

  // Direct Tier 1 match
  if (TIER1_ABILITY_SETS[classId]) {
    return [...TIER1_ABILITY_SETS[classId]];
  }

  // Tier 2 — inherit parent + own
  if (TIER2_ABILITY_SETS[classId]) {
    const classData = getClassById(classId);
    const parentId = classData?.parentId;
    const parentAbilities = parentId && TIER1_ABILITY_SETS[parentId]
      ? TIER1_ABILITY_SETS[parentId]
      : [];
    return [...parentAbilities, ...TIER2_ABILITY_SETS[classId]];
  }

  return null;
}

// ── Public API ──────────────────────────────────────────────────────

export function getClassAbilitiesFor(classId) {
  const ids = resolveAbilityIds(classId);
  if (!ids) return null;
  return ids
    .map((id) =>
      normalizeAbilityTemplate(ABILITIES[id], {
        category: "Class Ability",
        ownerId: classId,
      }),
    )
    .filter(Boolean);
}

export function getClassAbilityById(abilityId) {
  if (!abilityId) return null;
  return normalizeAbilityTemplate(ABILITIES[abilityId], {
    category: "Class Ability",
    ownerId: "unbound",
  });
}

export function isClassAbilityAllowed(classId, abilityId) {
  const ids = resolveAbilityIds(classId) || [];
  return ids.includes(abilityId);
}

export function getAllClassAbilityIds() {
  return Object.keys(ABILITIES);
}
