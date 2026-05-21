import {
  EFFECT_TAGS as RACE_EFFECT_TAGS,
  getRaceEntityTags,
  hasRaceTag,
} from "../../data/registries/RaceDataRegistry.js";
import {getSetBonuses} from "../items/SetBonusSystem.js";
import {
  applyCritMultiplier,
  applyCritOverride,
  applyMagnitudeDamageCap,
  getMagnitudeCaps,
  resolveBypasses,
} from "../skills/TalentManager.js";
import {getEffectTagMagnitude, hasEffectTag} from "../effects/EffectSystem.js";
import {ensureAttributeShape, getAttributeValue,} from "../../utils/AttributeMath.js";
import {getEffectiveAttributes, getTitleBonuses} from "../titles/TitleSystem.js";
import {random} from "../../utils/DeterministicRandom.js";
import {emit} from "../../core/EventBus.js";
import {getRageMultipliers} from "../class/RageSystem.js";
import {getComboMultiplier} from "../class/ChiSystem.js";
import {allowsZeroDamage, toNumberSafe} from "./combatPreparation.js";
import {hasCreationPerk} from "../../core/creationPerks.js";

const buildCombatSnapshot = (attacker, defender, skill = null, config = {}) => {
  const isPlayer = Boolean(attacker?.race);
  const isMagic = Boolean(skill?.isMagic);
  const minDamage = allowsZeroDamage(skill) ? 0 : 1;
  const setBonuses = isPlayer ? getSetBonuses(attacker?.equipment || {}) : {};
  const titleBonuses = getTitleBonuses(attacker);
  const defenseReductionFactor = config?.defenseReductionFactor ?? 0.5;
  const strToDamageMultiplier = config?.strToDamageMultiplier ?? 2;
  const attackerStatsSource = attacker.attributes ||
    attacker.stats || {
      str: 10,
      int: 10,
      luck: 10,
    };
  const attackerStats =
    attacker && attacker.attributes
      ? getEffectiveAttributes(attacker, config)
      : attackerStatsSource;
  const defenderStatsSource = defender.attributes || defender.stats || { str: 10 };
  const defenderStats =
    defender && defender.attributes
      ? getEffectiveAttributes(defender, config)
      : defenderStatsSource;

  return {
    isPlayer,
    isMagic,
    minDamage,
    setBonuses,
    titleBonuses,
    defenseReductionFactor,
    strToDamageMultiplier,
    attackerStats: ensureAttributeShape(attackerStats, 10),
    defenderStats,
    attackerTags: [
      ...(Array.isArray(skill?.tags) ? skill.tags : []),
      ...(attacker.race?.id ? getRaceEntityTags(attacker.race.id) : []),
    ],
    defenderTags: defender.race?.id ? getRaceEntityTags(defender.race.id) : [],
  };
};

export function calculateDamage(attacker, defender, skill = null, config = {}) {
  const snapshot = buildCombatSnapshot(attacker, defender, skill, config);
  const { attackerStats: stats, isPlayer, isMagic, minDamage, setBonuses } =
    snapshot;

  let damage = 0;
  let isCritical = false;
  const messages = [];

  const strength = getAttributeValue(stats, "strength") || 10;
  const intelligence = getAttributeValue(stats, "intelligence") || 10;
  console.log("[DEBUG_LOG] calculateDamage stats:", { strength, intelligence, attack: attacker?.attack });
  const luck = getAttributeValue(stats, "luck") || 10;
  const scalingStat = isMagic ? intelligence : strength;
  const baseAttack = Math.floor(scalingStat * 2);
  const attackValue = Number(attacker?.attack);
  damage = !skill && Number.isFinite(attackValue) ? attackValue : baseAttack;

  if (skill && skill.damage !== undefined && skill.damage !== null) {
    if (typeof skill.damage === "number") {
      damage += skill.damage;
    } else if (typeof skill.damage === "object") {
      const baseOverride = Number(skill.damage.base);
      if (Number.isFinite(baseOverride)) {
        damage = baseOverride;
      }
      const multiplier = Number(skill.damage.multiplier);
      if (Number.isFinite(multiplier)) {
        damage = Math.floor(damage * multiplier);
      }
    }
  }

  if (skill && Number.isFinite(skill.damageMultiplier)) {
    damage = Math.floor(damage * skill.damageMultiplier);
  }

  const physicalBonus = toNumberSafe(setBonuses.physicalDamage, 0);
  const spellBonus = toNumberSafe(setBonuses.spellDamage, 0);
  const elementalBonus = toNumberSafe(setBonuses.elementalDamage, 0);

  if (!isMagic && physicalBonus) {
    damage = Math.floor(damage * (1 + physicalBonus));
    messages.push(`Set Bonus: +${Math.round(physicalBonus * 100)}% Physical`);
  }
  if (isMagic && spellBonus) {
    damage = Math.floor(damage * (1 + spellBonus));
    messages.push(`Set Bonus: +${Math.round(spellBonus * 100)}% Spell`);
  }
  if (skill?.element && elementalBonus) {
    damage = Math.floor(damage * (1 + elementalBonus));
    messages.push(`Set Bonus: +${Math.round(elementalBonus * 100)}% Elemental`);
  }

  messages.push(skill ? `${attacker.name} uses ${skill.name}!` : `${attacker.name} attacks!`);

  if (!isMagic && hasEffectTag(attacker, "DMG_BOOST_PHYSICAL")) {
    const boost = getEffectTagMagnitude(attacker, "DMG_BOOST_PHYSICAL");
    damage = Math.floor(damage * (1 + boost));
    messages.push(`Might: +${Math.round(boost * 100)}% Damage`);
  }

  if (isPlayer && attacker.race) {
    const raceId = attacker.race.id;
    if (
      skill?.element === "fire" &&
      hasRaceTag(raceId, RACE_EFFECT_TAGS.DMG_BOOST_FIRE)
    ) {
      damage *= 1.2;
      messages.push("Racial Bonus: Fire Damage +20%");
    }
    if (
      skill?.element === "ice" &&
      hasRaceTag(raceId, RACE_EFFECT_TAGS.DMG_BOOST_ICE)
    ) {
      damage *= 1.2;
      messages.push("Racial Bonus: Ice Damage +20%");
    }
    if (hasRaceTag(raceId, "LOW_HP_DMG_BOOST")) {
      const hpPercent = attacker.hp.current / attacker.hp.max;
      if (hpPercent < 0.5) {
        damage *= 1.2;
        messages.push("Racial Bonus: Blood Frenzy! Damage +20%");
      }
    }
  }

  const classId = attacker.class?.id || attacker.class;
  if (classId === "berserker" && attacker.isEnraged) {
    const rageMultipliers = getRageMultipliers(attacker);
    damage = Math.floor(damage * rageMultipliers.damage);
    messages.push(`ENRAGED! Damage x${rageMultipliers.damage}`);
  }
  if (classId === "monk" || classId === "grandmaster") {
    const comboMult = getComboMultiplier(attacker);
    if (comboMult > 1.0) {
      damage = Math.floor(damage * comboMult);
      messages.push(`Combo x${attacker.comboCount || 1}! Damage x${comboMult}`);
    }
  }
  if (attacker.isStealthed) {
    damage = Math.floor(damage * 2.0);
    messages.push("AMBUSH! Damage x2.0");
    const backstabBonus = toNumberSafe(setBonuses.backstabDamage, 0);
    if (backstabBonus) {
      damage = Math.floor(damage * (1 + backstabBonus));
      messages.push(`Set Bonus: Backstab +${Math.round(backstabBonus * 100)}%`);
    }
  }

  if (hasCreationPerk(attacker, "battle_focus")) {
    const hpNode = attacker?.hp ?? attacker?.stats?.hp;
    const hpCurrent = Number(hpNode?.current ?? hpNode ?? 0);
    const hpMax = Number(hpNode?.max ?? attacker?.maxHp ?? attacker?.maxHealth ?? 0);
    const hpPct = hpMax > 0 ? hpCurrent / hpMax : 0;
    if (hpPct > 0.8) {
      damage = Math.floor(damage * 1.05 + 1e-9);
      messages.push("Battle Focus: +5% Damage");
    }
  }

  let critChance = luck * 0.01;
  const talentBypasses = resolveBypasses(attacker.talents || []);
  critChance = applyCritOverride(critChance, talentBypasses);
  critChance += toNumberSafe(setBonuses.critChance, 0);
  if (
    isPlayer &&
    attacker.race &&
    hasRaceTag(attacker.race.id, RACE_EFFECT_TAGS.DMG_BOOST_CRIT)
  ) {
    critChance += 0.05;
  }
  if (hasEffectTag(attacker, "DMG_BOOST_CRIT")) {
    critChance += getEffectTagMagnitude(attacker, "DMG_BOOST_CRIT");
  }
  critChance = Math.min(critChance, 0.5);

  if (random() < critChance) {
    isCritical = true;
    let critMultiplier = applyCritMultiplier(1.5, talentBypasses);
    critMultiplier += toNumberSafe(setBonuses.critDamage, 0);
    if (
      isPlayer &&
      attacker.race &&
      hasRaceTag(attacker.race.id, "CRIT_DMG_BOOST")
    ) {
      critMultiplier += 0.2;
    }
    critMultiplier += luck * 0.005;
    damage = Math.floor(damage * critMultiplier);
    messages.push("Critical Hit!");
  }

  const defenseInput = Number(defender?.defense ?? defender?.stats?.defense);
  const defenseValue = Number.isFinite(defenseInput)
    ? defenseInput
    : Number(getAttributeValue(snapshot.defenderStats, "strength") || 0);
  let effectiveDefense = defenseValue;
  const defenseDown = getEffectTagMagnitude(defender, "DEFENSE_DOWN");
  if (defenseDown) {
    effectiveDefense = Math.max(0, Math.floor(effectiveDefense * (1 - defenseDown)));
    messages.push(`Defense Down: -${Math.round(defenseDown * 100)}%`);
  }

  const reductionRatio = effectiveDefense / (effectiveDefense + 50);
  let finalDamage = Math.max(minDamage, Math.floor(damage * (1 - reductionRatio)));
  messages.push(`DR: ${Math.round(reductionRatio * 100)}% mitigated`);
  const element = skill ? skill.element : "physical";
  if (defender.race) {
    const raceId = defender.race.id;
    if (element === "fire" && hasRaceTag(raceId, RACE_EFFECT_TAGS.WEAK_FIRE)) {
      finalDamage *= 1.5;
      messages.push("Weakness: Fire! (+50% Dmg)");
    }
    if (
      element === "lightning" &&
      hasRaceTag(raceId, RACE_EFFECT_TAGS.WEAK_LIGHTNING)
    ) {
      finalDamage *= 1.5;
      messages.push("Weakness: Lightning! (+50% Dmg)");
    }
    if (
      element === "fire" &&
      hasRaceTag(raceId, RACE_EFFECT_TAGS.RESIST_FIRE)
    ) {
      finalDamage *= 0.8;
      messages.push("Resisted: Fire (-20% Dmg)");
    }
    if (
      skill &&
      skill.effect === "bleed" &&
      hasRaceTag(raceId, RACE_EFFECT_TAGS.IMMUNE_BLEED)
    ) {
      messages.push("Immune to Bleed!");
    }
    if (hasRaceTag(raceId, "DMG_NEGATE_CHANCE") && random() < 0.2) {
      finalDamage = 0;
      messages.push("Void Step: Damage Negated!");
    }
    if (hasRaceTag(raceId, "ABSORB_RANDOM") && defender.currentAbsorption) {
      const absorption = defender.currentAbsorption;
      if (element === absorption.absorbed) {
        finalDamage = -Math.floor(finalDamage * 0.5);
        messages.push(`Elemental Flux: Absorbed ${element}! Healed instead!`);
      } else if (element === absorption.weakTo) {
        finalDamage *= 2;
        messages.push(`Elemental Flux: Weak to ${element}! (+100% Dmg)`);
      }
    }
  }

  const vulnerable = getEffectTagMagnitude(defender, "VULNERABLE");
  if (vulnerable && finalDamage > 0) {
    finalDamage = Math.floor(finalDamage * (1 + vulnerable));
    messages.push(`Vulnerable: +${Math.round(vulnerable * 100)}%`);
  }
  if (element === "physical" && hasEffectTag(defender, "WEAK_PHYSICAL")) {
    finalDamage = Math.floor(finalDamage * 1.25);
    messages.push("Weakness: Physical (+25% Dmg)");
  }

  finalDamage = Math.floor(finalDamage);
  const result = { damage: finalDamage, isCritical, messages };
  emit("combat:log", {
    type: "damage",
    attacker: attacker.name,
    defender: defender.name,
    result,
  });
  return result;
}

export function calculateDamagePipeline(
  attacker,
  defender,
  skill = null,
  config = {},
) {
  console.log("[DEBUG_LOG] calculateDamagePipeline", {
    attackerName: attacker.name,
    skillId: skill?.id || skill,
    config
  });
  const snapshot = buildCombatSnapshot(attacker, defender, skill, config);
  console.log("[DEBUG_LOG] snapshot", {
    isMagic: snapshot.isMagic,
    strToDamageMultiplier: snapshot.strToDamageMultiplier,
    attackerStats: snapshot.attackerStats
  });
  const log = [];
  const {
    isMagic,
    minDamage,
    titleBonuses,
    strToDamageMultiplier,
    attackerStats: stats,
  } = snapshot;

  const attackBonus = Number.isFinite(titleBonuses.attack)
    ? titleBonuses.attack
    : 0;
  const magicBonus = Number.isFinite(titleBonuses.magic)
    ? titleBonuses.magic
    : 0;
  const skillPower = Number.isFinite(titleBonuses.skillPower)
    ? titleBonuses.skillPower
    : 0;
  const strength = Number(getAttributeValue(stats, "strength") || 0);
  const intelligence = Number(getAttributeValue(stats, "intelligence") || 0);
  const weaponAttack = Number(attacker?.equipment?.weapon?.stats?.attack ?? 0);

  let base = Math.floor(
    isMagic
      ? intelligence * 2 + magicBonus
      : strength * strToDamageMultiplier + weaponAttack + attackBonus,
  );

  if (skill && skill.damage !== undefined && skill.damage !== null) {
    if (typeof skill.damage === "number") {
      base += skill.damage;
    } else if (typeof skill.damage === "object") {
      const baseOverride = Number(skill.damage.base);
      if (Number.isFinite(baseOverride)) {
        base = baseOverride;
      }
      const multiplier = Number(skill.damage.multiplier);
      if (Number.isFinite(multiplier)) {
        base = Math.floor(base * multiplier);
      }
    }
  }
  if (skill && Number.isFinite(skill.damageMultiplier)) {
    base = Math.floor(base * skill.damageMultiplier);
  }
  log.push({ stage: "RAW", value: base, reason: "Base stat scaling + skill damage" });

  const attackerLevel = attacker.level || 1;
  const activeTalents = attacker.talents || [];
  let magnitudeCaps = null;
  for (const talentId of activeTalents) {
    const caps = getMagnitudeCaps(talentId, attackerLevel);
    if (caps && caps.damageCap > 0) {
      magnitudeCaps = caps;
      break;
    }
  }

  let afterAttackers = base;
  const attackerReasons = [];
  if (!isMagic && hasEffectTag(attacker, "DMG_BOOST_PHYSICAL")) {
    const boost = getEffectTagMagnitude(attacker, "DMG_BOOST_PHYSICAL");
    afterAttackers = Math.floor(afterAttackers * (1 + boost));
    attackerReasons.push(`Might (+${Math.round(boost * 100)}%)`);
  }
  if (
    skill?.element === "fire" &&
    hasRaceTag(attacker.race?.id, RACE_EFFECT_TAGS.DMG_BOOST_FIRE)
  ) {
    afterAttackers = Math.floor(afterAttackers * 1.2);
    attackerReasons.push("Racial: Fire +20%");
  }
  if (skill && skillPower) {
    afterAttackers = Math.floor(afterAttackers * (1 + skillPower));
    attackerReasons.push(`Title: Skill Power +${Math.round(skillPower * 100)}%`);
  }
  if (
    snapshot.attackerTags.includes("Holy_Damage") &&
    snapshot.defenderTags.includes("Undead")
  ) {
    afterAttackers = Math.floor(afterAttackers * 2);
    attackerReasons.push("Bonus due to [Holy vs Undead]");
  }
  if (hasCreationPerk(attacker, "battle_focus")) {
    const hpNode = attacker?.hp ?? attacker?.stats?.hp;
    const hpCurrent = Number(hpNode?.current ?? hpNode ?? 0);
    const hpMax = Number(hpNode?.max ?? attacker?.maxHp ?? attacker?.maxHealth ?? 0);
    const hpPct = hpMax > 0 ? hpCurrent / hpMax : 0;
    if (hpPct > 0.8) {
      afterAttackers = Math.floor(afterAttackers * 1.05 + 1e-9);
      attackerReasons.push("Perk: Battle Focus +5%");
    }
  }
  log.push({
    stage: "ATTACKER_MULTIPLIERS",
    value: afterAttackers,
    reason: attackerReasons.join("; ") || "None",
  });

  const defenseInput = Number(defender?.defense ?? defender?.stats?.defense);
  const defenseValue = Number.isFinite(defenseInput)
    ? defenseInput
    : Number(getAttributeValue(snapshot.defenderStats, "strength") || 0);
  let effectiveDefense = defenseValue;
  const defReasons = [`Defense ${defenseValue}`];
  const defenseDown = getEffectTagMagnitude(defender, "DEFENSE_DOWN");
  if (defenseDown) {
    effectiveDefense = Math.max(0, Math.floor(effectiveDefense * (1 - defenseDown)));
    defReasons.push(`Defense Down -${Math.round(defenseDown * 100)}%`);
  }

  const reductionRatio = effectiveDefense / (effectiveDefense + 50);
  let afterMitigation = Math.max(minDamage, Math.floor(afterAttackers * (1 - reductionRatio)));
  defReasons.push(`DR ${Math.round(reductionRatio * 100)}%`);
  const element = skill ? skill.element : "physical";
  if (
    element === "fire" &&
    hasRaceTag(defender.race?.id, RACE_EFFECT_TAGS.RESIST_FIRE)
  ) {
    afterMitigation = Math.floor(afterMitigation * 0.8);
    defReasons.push("Resist: Fire -20%");
  }
  if (
    element === "lightning" &&
    hasRaceTag(defender.race?.id, RACE_EFFECT_TAGS.WEAK_LIGHTNING)
  ) {
    afterMitigation = Math.floor(afterMitigation * 1.5);
    defReasons.push("Weak: Lightning +50%");
  }
  const vulnerable = getEffectTagMagnitude(defender, "VULNERABLE");
  if (vulnerable && afterMitigation > 0) {
    afterMitigation = Math.floor(afterMitigation * (1 + vulnerable));
    defReasons.push(`Vulnerable +${Math.round(vulnerable * 100)}%`);
  }
  if (element === "physical" && hasEffectTag(defender, "WEAK_PHYSICAL")) {
    afterMitigation = Math.floor(afterMitigation * 1.25);
    defReasons.push("Weak: Physical +25%");
  }
  log.push({
    stage: "DEFENDER_MITIGATION",
    value: afterMitigation,
    reason: defReasons.join("; "),
  });

  let final = Math.floor(afterMitigation);
  if (magnitudeCaps) {
    const capped = applyMagnitudeDamageCap(final, magnitudeCaps);
    if (capped !== final) {
      log.push({
        stage: "MAGNITUDE_CAP",
        value: capped,
        reason: `${magnitudeCaps.label} damage cap (${magnitudeCaps.damageCap})`,
      });
    }
    final = capped;
    emit("combat:log", {
      type: "magnitude",
      attacker: attacker.name,
      label: magnitudeCaps.label,
      cap: magnitudeCaps.damageCap,
    });
  }

  log.push({ stage: "FINAL", value: final, reason: "Final clamped integer" });
  emit("combat:log", {
    type: "pipeline",
    attacker: attacker.name,
    defender: defender.name,
    log,
  });
  return { damage: final, log };
}
