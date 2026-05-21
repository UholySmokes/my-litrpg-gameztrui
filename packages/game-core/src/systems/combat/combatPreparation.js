import {SimBridge} from "../../simulation/bridge/SimulationContext.js";
import {getEffectTagMagnitude, hasEffectTag} from "../effects/EffectSystem.js";
import {hasCreationPerk} from "../../core/creationPerks.js";
import {hasRaceTag} from "../../data/registries/RaceDataRegistry.js";

export const toNumberSafe = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

const getResourceValue = (player, type) => {
  if (!player) return 0;
  const resources = player.resources || {};
  switch (type) {
    case "mana":
      return toNumberSafe(player.mana?.current, 0);
    case "energy":
      return toNumberSafe(resources.energy ?? player.energy, 0);
    case "focus":
      return toNumberSafe(
        resources.focus ?? player.focus?.current ?? player.focus,
        0,
      );
    case "rage":
      return toNumberSafe(resources.rage ?? player.rage, 0);
    case "chi":
      return toNumberSafe(resources.chi ?? player.chi, 0);
    case "shards":
      return toNumberSafe(player.soulShards, 0);
    case "hp":
      return toNumberSafe(player.hp?.current, 0);
    default:
      return 0;
  }
};

const setResourceValue = (player, type, value) => {
  const resources = { ...(player.resources || {}) };
  const next = { ...player };

  switch (type) {
    case "mana":
      return {
        ...next,
        mana: {
          ...(player.mana || { current: value, max: value }),
          current: value,
        },
      };
    case "energy":
      resources.energy = value;
      return { ...next, resources, energy: value };
    case "focus": {
      resources.focus = value;
      const focus =
        player.focus && typeof player.focus === "object"
          ? { ...player.focus, current: value }
          : value;
      return { ...next, resources, focus };
    }
    case "rage":
      resources.rage = value;
      return { ...next, resources, rage: value };
    case "chi":
      resources.chi = value;
      return { ...next, resources, chi: value };
    case "shards":
      return { ...next, soulShards: value };
    case "hp":
      return {
        ...next,
        hp: {
          ...(player.hp || { current: value, max: value }),
          current: value,
        },
      };
    default:
      return next;
  }
};

export const applyResourceGain = (player, gain) => {
  if (!gain?.type || !Number.isFinite(gain.amount)) return player;
  const current = getResourceValue(player, gain.type);
  let nextValue = current + gain.amount;
  if (gain.type === "mana" && player.mana?.max) {
    nextValue = Math.min(player.mana.max, nextValue);
  }
  if (gain.type === "hp" && player.hp?.max) {
    nextValue = Math.min(player.hp.max, nextValue);
  }
  return setResourceValue(player, gain.type, nextValue);
};

export const applyHealToPlayer = (player, heal) => {
  if (!heal || !player?.hp) return player;
  const maxHp = player.hp.max || 0;
  const flat = Number.isFinite(heal.flat) ? heal.flat : 0;
  const percent = Number.isFinite(heal.percent) ? heal.percent : 0;
  let amount = Math.max(0, Math.floor(flat + maxHp * percent));
  if (amount <= 0) return player;
  if (player.race && hasRaceTag(player.race.id, "HEAL_MALUS")) {
    amount = Math.floor(amount * 0.5);
  }
  if (player.race && hasRaceTag(player.race.id, "HEAL_BOOST")) {
    amount = Math.floor(amount * 1.2);
  }
  const nextHp = Math.min(maxHp, player.hp.current + amount);
  return {
    ...player,
    hp: {
      ...player.hp,
      current: nextHp,
    },
  };
};

const clampChance = (value, max = 0.95) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(max, parsed));
};

export const getMissChance = (entity) =>
  clampChance(getEffectTagMagnitude(entity, "MISS_CHANCE"), 0.95);

export const getDodgeChance = (entity) => {
  let dodge = clampChance(getEffectTagMagnitude(entity, "DODGE_BOOST"), 0.75);

  if (hasCreationPerk(entity, "cautious")) {
    const hpNode = entity?.hp ?? entity?.stats?.hp;
    const hpCurrent = Number(hpNode?.current ?? hpNode ?? 0);
    const hpMax = Number(hpNode?.max ?? 0);
    const hpPct = hpMax > 0 ? hpCurrent / hpMax : 1;
    if (hpPct < 0.3) {
      dodge = clampChance(dodge + 0.05, 0.75);
    }
  }

  return dodge;
};

export const getReflectPercent = (entity) =>
  clampChance(getEffectTagMagnitude(entity, "DAMAGE_REFLECT"), 0.75);

const absorbDamageWithShields = (effects, incoming) => {
  const list = Array.isArray(effects) ? effects : [];
  let remaining = Math.max(0, Math.floor(Number(incoming) || 0));
  if (remaining <= 0) return { effects: list, remaining, absorbed: 0 };

  const nextEffects = [];
  let absorbed = 0;

  for (const effect of list) {
    const isShield =
      effect?.id === "shield" || effect?.tags?.includes("DAMAGE_ABSORB");
    if (!isShield) {
      nextEffects.push(effect);
      continue;
    }

    const magnitude = Math.max(0, Math.floor(Number(effect.magnitude) || 0));
    if (magnitude <= 0 || remaining <= 0) {
      nextEffects.push(effect);
      continue;
    }

    const absorb = Math.min(magnitude, remaining);
    remaining -= absorb;
    absorbed += absorb;

    const leftover = magnitude - absorb;
    if (leftover > 0) {
      nextEffects.push({ ...effect, magnitude: leftover });
    }
  }

  return { effects: nextEffects, remaining, absorbed };
};

export const applyShieldAbsorptionToEnemy = (enemy, incomingDamage) => {
  if (!enemy || incomingDamage <= 0) {
    return { enemy, damage: incomingDamage, absorbed: 0 };
  }
  const effects = Array.isArray(enemy.effects) ? enemy.effects : [];
  const { effects: nextEffects, remaining, absorbed } = absorbDamageWithShields(
    effects,
    incomingDamage,
  );
  if (absorbed <= 0) {
    return { enemy, damage: incomingDamage, absorbed: 0 };
  }
  return {
    enemy: { ...enemy, effects: nextEffects },
    damage: remaining,
    absorbed,
  };
};

export const processEntityTurnEffects = (entity) => {
  const effects = Array.isArray(entity?.effects) ? entity.effects : [];
  if (!entity?.hp || effects.length === 0) {
    return { entity, messages: [], damageTaken: 0, healed: 0 };
  }

  const messages = [];
  let totalDotDamage = 0;
  let totalHealAmount = 0;

  for (const effect of effects) {
    if (effect.type === "DOT") {
      const damage = Math.max(0, Math.floor(Number(effect.magnitude) || 0));
      if (damage > 0) {
        totalDotDamage += damage;
        messages.push(
          `${entity.name} takes ${damage} ${effect.element || "damage"} from ${effect.name}!`,
        );
      }
    }

    if (effect.type === "HOT") {
      let healAmount = Math.max(0, Math.floor(Number(effect.magnitude) || 0));
      if (healAmount <= 0) continue;

      if (
        hasEffectTag(entity, "HEAL_IS_DMG") ||
        entity.race?.id === "undead_awakened"
      ) {
        totalDotDamage += healAmount;
        messages.push(
          `${entity.name} is UNDEAD! Healing deals ${healAmount} damage instead!`,
        );
        continue;
      }

      if (hasEffectTag(entity, "HEAL_MALUS")) {
        healAmount = Math.floor(healAmount * 0.5);
        messages.push(`${entity.name} is resistant to healing!`);
      }

      if (healAmount > 0) {
        totalHealAmount += healAmount;
        messages.push(
          `${entity.name} recovers ${healAmount} HP from ${effect.name}!`,
        );
      }
    }
  }

  const nextEffects = effects
    .map((effect) => ({
      ...effect,
      remainingDuration: (effect.remainingDuration ?? effect.duration ?? 0) - 1,
    }))
    .filter((effect) => {
      if ((effect.remainingDuration ?? 0) <= 0) {
        messages.push(`${effect.name} fades from ${entity.name}.`);
        return false;
      }
      return true;
    });

  const nextHp = Math.min(
    entity.hp.max,
    Math.max(0, entity.hp.current - totalDotDamage + totalHealAmount),
  );

  return {
    entity: {
      ...entity,
      hp: { ...entity.hp, current: nextHp },
      effects: nextEffects,
    },
    messages,
    damageTaken: totalDotDamage,
    healed: totalHealAmount,
  };
};

export const processEnemyTurnEffects = (enemy) => {
  if (!enemy?.stats?.hp) {
    return { enemy, messages: [], damageTaken: 0, healed: 0 };
  }
  const proxy = {
    ...enemy,
    hp: enemy.stats.hp,
    effects: enemy.effects,
    name: enemy.name,
  };
  const result = processEntityTurnEffects(proxy);
  return {
    enemy: {
      ...enemy,
      stats: {
        ...enemy.stats,
        hp: result.entity.hp,
      },
      effects: result.entity.effects,
    },
    messages: result.messages,
    damageTaken: result.damageTaken,
    healed: result.healed,
  };
};

export const removeEffectsByTypes = (target, types = []) => {
  if (!target?.effects || types.length === 0) return target;
  return {
    ...target,
    effects: target.effects.filter((effect) => !types.includes(effect.type)),
  };
};

export const removeEffectsByIds = (target, ids = []) => {
  if (!target?.effects || ids.length === 0) return target;
  const removeSet = new Set(ids);
  return {
    ...target,
    effects: target.effects.filter((effect) => !removeSet.has(effect.id)),
  };
};

export const applySummonToPlayer = (player, summon) => {
  if (!summon?.type) return player;
  const stamp = SimBridge.now();
  const base = {
    id: `${summon.type}_${stamp}`,
    name: summon.name || "Summon",
    duration: summon.duration || 3,
    ...(summon.stats ? { stats: summon.stats } : {}),
    ...(summon.abilities ? { abilities: summon.abilities } : {}),
    ...(summon.element ? { element: summon.element } : {}),
    armed: summon.type === "trap",
  };

  switch (summon.type) {
    case "demon":
      return { ...player, activeDemon: base };
    case "undead":
      return { ...player, undead: [...(player.undead || []), base] };
    case "totem":
      return { ...player, totems: [...(player.totems || []), base] };
    case "trap":
      return { ...player, traps: [...(player.traps || []), base] };
    default:
      return player;
  }
};

export const consumeAbilityCost = (player, ability) => {
  const costType = ability.costType || "none";
  if (costType === "none") return { success: true, player };

  if (costType === "hp") {
    const maxHp = player.hp?.max || 0;
    const percent = Number.isFinite(ability.hpCostPercent)
      ? ability.hpCostPercent
      : 0;
    const flat = Number.isFinite(ability.cost) ? ability.cost : 0;
    const amount = Math.max(0, Math.floor(maxHp * percent + flat));
    if (player.hp.current - amount <= maxHp * 0.1) {
      return { success: false, player, reason: "HP too low" };
    }
    return {
      success: true,
      player: setResourceValue(player, "hp", player.hp.current - amount),
    };
  }

  const current = getResourceValue(player, costType);
  const cost = Number.isFinite(ability.cost) ? ability.cost : 0;
  if (current < cost) {
    return { success: false, player, reason: "Insufficient resources" };
  }
  return {
    success: true,
    player: setResourceValue(player, costType, current - cost),
  };
};

const collectLivingEnemyIndices = (combatState) =>
  (combatState?.enemies || [])
    .map((enemy, index) => ({ enemy, index }))
    .filter(({ enemy }) => enemy?.stats?.hp?.current > 0)
    .map(({ index }) => index);

export const resolveAbilityTargets = (combatState, enemyIndex, ability) => {
  if (ability.target === "self") return [];
  const living = collectLivingEnemyIndices(combatState);
  if (living.length === 0) return [];
  const primary = living.includes(enemyIndex) ? enemyIndex : living[0];
  if (!ability.aoe) return [primary];

  const maxTargets = ability.aoe.maxTargets || living.length;
  const ordered = [primary, ...living.filter((idx) => idx !== primary)];
  return ordered.slice(0, maxTargets);
};

export const allowsZeroDamage = (skill) => {
  if (!skill || typeof skill !== "object") return false;
  if (skill.allowZeroDamage || skill.nonDamaging) return true;
  if (skill.damage && typeof skill.damage === "object") {
    if (skill.damage.allowZeroDamage) return true;
    const multiplier = Number(skill.damage.multiplier);
    if (Number.isFinite(multiplier) && multiplier <= 0) return true;
    const base = Number(skill.damage.base);
    if (Number.isFinite(base) && base <= 0 && multiplier === 0) return true;
  }
  const tags = Array.isArray(skill.tags) ? skill.tags : [];
  return tags.includes("non_damaging") || tags.includes("no_damage");
};
