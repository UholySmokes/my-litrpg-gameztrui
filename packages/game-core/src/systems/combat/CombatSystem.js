import {
  createEnemy,
  getEnemySkillById,
} from "../../entities/Enemy.js";
import { getSkillById } from "../skills/SkillRegistry.js";
import {
  hasRaceTag,
  EFFECT_TAGS as RACE_EFFECT_TAGS,
  getRaceRebirth,
  canRaceRebirth,
  getRandomStartBuff,
  getRandomDebuff,
  rollGambleCast,
  getRandomElementAbsorption,
} from "../../data/registries/RaceDataRegistry.js";
import {
  hasEffectTag,
  getEffectTagMagnitude,
} from "../effects/EffectSystem.js";
import {
  resolveBypasses,
  applyCostOverride,
  applyCooldownOverride,
  applyDropOverrides,
  getMagnitudeCaps,
} from "../skills/TalentManager.js";
import { getModifiedSkill } from "../skills/SkillRegistry.js";
import { effectApplicationSystem } from "../effects/EffectApplicationSystem.js";
import {
  consumeAbilityCostForActor,
  resolveCombatAbilityMagic,
  syncPlayerAbilityState,
} from "../abilities/UnifiedAbilityEngine.js";
import { emit } from "../../core/EventBus.js";
import {
  allowsZeroDamage,
  applyHealToPlayer,
  applyResourceGain,
  applyShieldAbsorptionToEnemy,
  applySummonToPlayer,
  consumeAbilityCost,
  getDodgeChance,
  getMissChance,
  getReflectPercent,
  processEnemyTurnEffects,
  processEntityTurnEffects,
  removeEffectsByIds,
  removeEffectsByTypes,
  resolveAbilityTargets,
} from "./combatPreparation.js";
import {
  calculateDamage,
  calculateDamagePipeline,
} from "./combatResolution.js";
import {
  endCombatPhase,
  handleEnemyDefeatPhase,
} from "./combatAftermath.js";
const handleEnemyDefeat = handleEnemyDefeatPhase;
const endCombat = endCombatPhase;
export function applyCastingInterruptionFromDamage(state, damageApplied) {
  const casting = state?.player?.magic?.casting;
  const prepared = state?.player?.magic?.prepared;
  if (!casting || typeof casting !== "object" || !prepared) return state;
  const hpMax = state.player?.hp?.max || 0;
  const dmg = Math.max(0, Number(damageApplied) || 0);
  if (dmg <= 0) return state;
  const resonance = Math.max(0, Math.min(100, Number(state.player?.magic?.resonance?.current) || 0));
  const mindPct = hpMax > 0
    ? Math.max(0, Math.min(1, (Number(state.player?.magic?.stability?.mind?.current) || 0) / (Number(state.player?.magic?.stability?.mind?.max) || 100)))
    : 0;
  const cogPct = hpMax > 0
    ? Math.max(0, Math.min(1, (Number(state.player?.magic?.stability?.cognitive?.current) || 0) / (Number(state.player?.magic?.stability?.cognitive?.max) || 100)))
    : 0;
  const control = 0.55 * mindPct + 0.45 * cogPct;
  const damageRatio = hpMax > 0 ? Math.max(0, Math.min(1, dmg / hpMax)) : 1;
  const anchored = Boolean(
    state.player?.magic?.anchors?.self ||
      state.player?.magic?.anchors?.area ||
      state.player?.magic?.anchors?.itemId,
  );
  const guaranteed = damageRatio >= 0.2;
  const chance = guaranteed
    ? 1
    : Math.max(
        0,
        Math.min(
          1,
          0.12 + 0.9 * damageRatio + 0.25 * (resonance / 100) - 0.35 * control - (anchored ? 0.1 : 0),
        ),
      );
  if (!(random() < chance)) return state;
  const outcomeRoll = random();
  const outcome =
    outcomeRoll < 0.55 ? "fizzle" : outcomeRoll < 0.85 ? "partial" : "backlash";
  const log = state.combat?.log ? [...state.combat.log] : [];
  if (outcome === "fizzle") {
    log.push("Cast interrupted: the working fizzles.");
  } else if (outcome === "partial") {
    log.push("Cast interrupted: the working spills out prematurely.");
  } else {
    log.push("Cast interrupted: backlash tears through you.");
  }
  const mindMax = Number(state.player?.magic?.stability?.mind?.max) || 100;
  const cogMax = Number(state.player?.magic?.stability?.cognitive?.max) || 100;
  const bodyMax = Number(state.player?.magic?.stability?.body?.max) || 100;
  const mindLoss = outcome === "backlash" ? Math.max(2, Math.floor(dmg * 0.6)) : Math.max(1, Math.floor(dmg * 0.2));
  const cogLoss = outcome === "partial" ? Math.max(1, Math.floor(dmg * 0.25)) : outcome === "backlash" ? Math.max(2, Math.floor(dmg * 0.5)) : Math.max(0, Math.floor(dmg * 0.1));
  const bodyLoss = outcome === "backlash" ? Math.max(2, Math.floor(dmg * 0.4)) : outcome === "partial" ? Math.max(1, Math.floor(dmg * 0.15)) : 0;
  const nextResonance = Math.max(0, Math.min(100, resonance + (outcome === "backlash" ? 12 : outcome === "partial" ? 8 : 5)));
  const resonanceState = nextResonance >= 75 ? "shrieking" : nextResonance >= 50 ? "ringing" : nextResonance >= 25 ? "humming" : "quiet";
  const nextMagic = {
    ...state.player.magic,
    casting: null,
    prepared: null,
    resonance: {
      ...(state.player.magic.resonance || {}),
      current: nextResonance,
      state: resonanceState,
    },
    stability: {
      ...state.player.magic.stability,
      mind: {
        ...state.player.magic.stability.mind,
        current: Math.max(0, Math.min(mindMax, (state.player.magic.stability.mind.current || 0) - mindLoss)),
      },
      cognitive: {
        ...state.player.magic.stability.cognitive,
        current: Math.max(0, Math.min(cogMax, (state.player.magic.stability.cognitive.current || 0) - cogLoss)),
      },
      body: {
        ...state.player.magic.stability.body,
        current: Math.max(0, Math.min(bodyMax, (state.player.magic.stability.body.current || 0) - bodyLoss)),
      },
    },
  };
  return {
    ...state,
    player: syncPlayerAbilityState(
      {
        ...state.player,
        magic: nextMagic,
      },
      {
        ...(state.player?.abilityState || {}),
        families: {
          ...(state.player?.abilityState?.families || {}),
          magic: nextMagic,
        },
      },
    ),
    combat: state.combat
      ? {
          ...state.combat,
          log,
        }
      : state.combat,
  };
}
import {
  gainRage,
  processRageDecay,
} from "../class/RageSystem.js";
import {
  handleStealthAttack,
  processStealthDetection,
  processVanishDuration,
  useVanish as applyVanish,
} from "./StealthSystem.js";
import {
  processChiOnHit,
  resetCombo,
  getComboMultiplier,
} from "../class/ChiSystem.js";
import {
  getClassAbilityById,
  isClassAbilityAllowed,
} from "../class/ClassAbilityRegistry.js";
import {
  getRaceAbilityById,
  isRaceAbilityAllowed,
} from "../race/RaceAbilityRegistry.js";
import {
  processCharmDuration,
  processCharmedEnemyAction,
  checkIllusionTarget,
  damageIllusion,
} from "../effects/CharmSystem.js";
import { processTimeEffects } from "../world/TimeSystem.js";
import { checkItemProc, applyChainLightning } from "../items/ItemProcSystem.js";
import { getAttributeValue } from "../../utils/AttributeMath.js";
import {
  getEffectiveAttributes,
  getTitleBonuses,
} from "../titles/TitleSystem.js";
import { random, randomChoice } from "../../utils/DeterministicRandom.js";
import { SimBridge } from "../../simulation/bridge/SimulationContext.js";
import {
  DEFAULT_COMBAT_LANE_CONFIG,
  DEFAULT_ELEMENTAL_REACTIONS,
  getBalanceConfig,
} from "../../data/balance/balanceConfig.js";
const DEBUG_LOGGING_ENABLED = false;
const getLaneDistance = (combatState, enemyIndex) => {
  const playerLane = combatState?.lanes?.player;
  const enemyLane = combatState?.lanes?.enemies?.[enemyIndex];
  if (!Number.isFinite(playerLane) || !Number.isFinite(enemyLane)) {
    return 0;
  }
  return Math.abs(playerLane - enemyLane);
};
const applyLaneModifier = (
  damageResult,
  laneDistance,
  config,
  { allowZeroDamage = false } = {},
) => {
  if (!damageResult || laneDistance <= 0) return damageResult;
  const laneConfig = getBalanceConfig(config).combatLane || DEFAULT_COMBAT_LANE_CONFIG;
  const multiplier =
    laneDistance === 1
      ? laneConfig.oneGapMultiplier
      : laneConfig.multiGapMultiplier;
  const minDamage = allowZeroDamage ? 0 : 1;
  const nextDamage = Math.max(
    minDamage,
    Math.floor(damageResult.damage * multiplier),
  );
  const messages = Array.isArray(damageResult.messages)
    ? [...damageResult.messages, `Lane gap ${laneDistance}: x${multiplier}`]
    : [`Lane gap ${laneDistance}: x${multiplier}`];
  return { ...damageResult, damage: nextDamage, messages };
};

const formatDamageBreakdown = (summary, damageResult) => {
  if (!damageResult) {
    return summary;
  }

  const details = Array.isArray(damageResult.messages)
    ? damageResult.messages.filter(Boolean)
    : [];

  if (details.length === 0) {
    return `${summary} for ${damageResult.damage} damage.`;
  }

  return `${summary} for ${damageResult.damage} damage. ${details.join(" | ")}`;
};
const resolveSkillDefinition = (state, skillInput) => {
  if (!skillInput) return null;
  if (typeof skillInput === "object") return skillInput;
  const skillId = skillInput;
  const registrySkill = getSkillById(skillId);
  if (registrySkill) return registrySkill;
  const player = state?.player;
  const pools = [];
  if (Array.isArray(player?.activeSkills)) {
    pools.push(...player.activeSkills);
  }
  if (Array.isArray(player?.skills?.active)) {
    pools.push(...player.skills.active);
  }
  if (Array.isArray(player?.abilities)) {
    pools.push(...player.abilities);
  }
  return pools.find((skill) => skill?.id === skillId) || null;
};
const ELEMENTAL_REACTIONS = DEFAULT_ELEMENTAL_REACTIONS;
const applyElementalReactions = ({ attacker, defender, element, damage }) => {
  if (!element || !defender) {
    return { damage, defender, messages: [] };
  }
  const elementKey = String(element).toLowerCase();
  const activeIds = new Set((defender.effects || []).map((effect) => effect.id));
  let updatedDamage = damage;
  let updatedDefender = defender;
  const messages = [];
  for (const reaction of ELEMENTAL_REACTIONS) {
    if (reaction.element !== elementKey) continue;
    const hasRequired = reaction.requires.some((id) => activeIds.has(id));
    if (!hasRequired) continue;
    updatedDamage = Math.floor(updatedDamage * reaction.multiplier);
    messages.push(reaction.message);
    if (reaction.remove?.length) {
      updatedDefender = removeEffectsByIds(updatedDefender, reaction.remove);
      reaction.remove.forEach((id) => activeIds.delete(id));
    }
    if (reaction.addEffects?.length) {
      updatedDefender = effectApplicationSystem.applyEffects(
        updatedDefender,
        reaction.addEffects,
        attacker,
      );
    }
    break;
  }
  return { damage: updatedDamage, defender: updatedDefender, messages };
};
/**
 * Applies damage to the player. If HP drops to 0 or below, checks for death prevention mechanics.
 * Handles: Death Save (Undead), Phoenix Rebirth, and sets isDead flag.
 * @param {object} state - The current game state object.
 * @param {number} amount - The amount of damage to take.
 * @returns {object} A new game state object with the updated HP.
 */
function takeDamage(state, amount) {
  const initialHp = state.player.hp.current;
  // === CHECK FOR SHIELD EFFECT ===
  let damageToApply = amount;
  const shieldEffects =
    state.player.effects?.filter((effect) => effect.id === "shield") || [];
  if (shieldEffects.length > 0) {
    let totalShieldAbsorb = 0;
    const remainingEffects = [];
    for (const shield of shieldEffects) {
      const absorbAmount = Math.min(
        shield.magnitude,
        damageToApply - totalShieldAbsorb,
      );
      totalShieldAbsorb += absorbAmount;
      // Reduce shield magnitude or remove if depleted
      if (shield.magnitude > absorbAmount) {
        remainingEffects.push({
          ...shield,
          magnitude: shield.magnitude - absorbAmount,
        });
      }
      // If shield is fully absorbed, don't add it back
      if (totalShieldAbsorb >= damageToApply) break;
    }
    damageToApply = Math.max(0, damageToApply - totalShieldAbsorb);
    // Update player effects
    state = {
      ...state,
      player: {
        ...state.player,
        effects: [
          ...(state.player.effects?.filter(
            (effect) => effect.id !== "shield",
          ) || []),
          ...remainingEffects,
        ],
      },
    };
    // Log shield absorption
    if (totalShieldAbsorb > 0) {
      const combatLog = state.combat?.log ? [...state.combat.log] : [];
      combatLog.push(`ðŸ›¡ï¸ Shield absorbs ${totalShieldAbsorb} damage!`);
      state = {
        ...state,
        combat: state.combat
          ? { ...state.combat, log: combatLog }
          : { log: combatLog },
      };
    }
  }
  // Calculate new HP, ensuring it doesn't go below 0
  let newHp = Math.max(0, state.player.hp.current - damageToApply);
  let isDead = newHp <= 0;
  let combatLog = state.combat?.log ? [...state.combat.log] : [];
  let playerUpdates = {};
  const raceId = state.player.race?.id || state.player.race;
  // === RAGE GAIN ON DAMAGE (Berserker) ===
  const classId = state.player.class?.id || state.player.class;
  if ((classId === "berserker" || classId === "bloodline_vanguard") && amount > 0) {
    const rageAmount = Math.floor(amount / 10) * 15; // Scale with damage taken
    playerUpdates.rageGained = rageAmount;
  }
  // === DEATH PREVENTION MECHANICS ===
  if (isDead) {
    // 1. Check for Death Save (Undead Awakened) - Survive with 1 HP once per battle
    if (hasRaceTag(raceId, "DEATH_SAVE") && !state.player.deathSaveUsed) {
      newHp = 1;
      isDead = false;
      playerUpdates.deathSaveUsed = true;
      combatLog.push(
        `ðŸ’€ UNDYING WILL! ${state.player.name} refuses to die and clings to life with 1 HP!`,
      );
      emit("combat:deathSave", { player: state.player.name });
    }
    // 2. Check for Phoenix Rebirth
    if (isDead && raceId === "phoenix_reborn") {
      const lastRebirth = state.player.lastRebirthTime || 0;
      const rebirthCheck = canRaceRebirth(raceId, lastRebirth);
      if (rebirthCheck.canRebirth) {
        const rebirth = getRaceRebirth(raceId);
        const reviveHp = Math.floor(
          state.player.hp.max * (rebirth?.reviveHpPercent || 0.25),
        );
        newHp = reviveHp;
        isDead = false;
        playerUpdates.lastRebirthTime = SimBridge.now();
        combatLog.push(
          `ðŸ”¥ RISE FROM ASHES! ${state.player.name} is reborn in flames with ${reviveHp} HP!`,
        );
        emit("combat:rebirth", { player: state.player.name, hp: reviveHp });
      }
    }
  }
  // Create a new state with the updated HP
  let newState = {
    ...state,
    player: {
      ...state.player,
      ...playerUpdates,
      hp: {
        ...state.player.hp,
        current: newHp,
      },
      isDead: isDead,
    },
    combat: state.combat
      ? {
          ...state.combat,
          log: combatLog,
        }
      : state.combat,
  };
  // Apply rage gain if berserker
  if (playerUpdates.rageGained) {
    newState.player = gainRage(
      newState.player,
      playerUpdates.rageGained,
      "damage_taken",
    );
    const { rageGained: _rageGained, ...playerWithoutRageGained } = newState.player;
    newState = {
      ...newState,
      player: playerWithoutRageGained,
    };
  }
  if (newState.player.isDead) {
    console.log(`${newState.player.name} has been defeated!`);
  }
  const damageApplied = Math.max(0, initialHp - newHp);
  newState = applyCastingInterruptionFromDamage(newState, damageApplied);
  return {
    success: true,
    state: newState,
    damage: damageApplied,
  };
}
/**
 * Start combat with enemies
 * Handles race-specific combat start effects (Mutant buffs, Elemental absorption)
 */
export function startCombat(state, enemyIds) {
  if (!enemyIds || enemyIds.length === 0) {
    return state;
  }
  const enemies = enemyIds
    .map((id) => createEnemy(id))
    .filter((e) => e !== null)
    .map((enemy, index) => ({
      ...enemy,
      lane: (index % 3) + 1,
    }));
  if (enemies.length === 0) {
    return state;
  }
  const raceId = state.player.race?.id || state.player.race;
  let combatLog = [
    `Combat started! You face ${enemies.map((e) => e.name).join(", ")}.`,
  ];
  let playerUpdates = {};
  let combatEffects = [];
  // === COMBAT START RACE EFFECTS ===
  // Mutant: Random buff at combat start
  if (hasRaceTag(raceId, "START_BUFF_RANDOM") || raceId === "mutant") {
    const buff = getRandomStartBuff();
    combatEffects.push({
      id: buff.id,
      name: buff.name,
      type: "BUFF",
      stat: buff.stat,
      magnitude: buff.value,
      remainingDuration: buff.duration,
      tags: ["MUTATION_BUFF"],
    });
    combatLog.push(
      `ðŸ§¬ ADAPTIVE MUTATION: ${buff.name} activated! (${buff.stat} +${Math.round(buff.value * 100)}% for ${buff.duration} turns)`,
    );
    emit("combat:mutationBuff", { buff: buff.name });
  }
  // Elemental Attuned: Random element absorption
  if (hasRaceTag(raceId, "ABSORB_RANDOM") || raceId === "elemental_attuned") {
    const absorption = getRandomElementAbsorption();
    playerUpdates.currentAbsorption = absorption;
    combatLog.push(`Elemental Flux: ${absorption.message}`);
    emit("combat:elementalFlux", {
      absorbed: absorption.absorbed,
      weakTo: absorption.weakTo,
    });
  }
  // Reset death save for new combat (Undead)
  if (hasRaceTag(raceId, "DEATH_SAVE")) {
    playerUpdates.deathSaveUsed = false;
  }
  return {
    ...state,
    player: {
      ...state.player,
      ...playerUpdates,
      effects: [...(state.player.effects || []), ...combatEffects],
    },
    combat: {
      status: "active",
      turn: "player",
      enemies: enemies,
      skillCooldowns: {},
      classAbilityCooldowns: {},
      raceAbilityCooldowns: {},
      playerTurnEffectsProcessed: false,
      log: combatLog,
      lanes: {
        player: 1,
        enemies: enemies.map((enemy) => enemy.lane ?? 1),
      },
    },
  };
}
/**
 * Player attacks an enemy
 * Uses config values for damage calculation
 */
export function playerAttack(state, enemyIndex, skillId = null) {
  if (state.combat.status !== "active") {
    return { success: false, reason: "Not in combat", state };
  }
  if (enemyIndex < 0 || enemyIndex >= state.combat.enemies.length) {
    return { success: false, reason: "Invalid enemy", state };
  }
  const enemy = state.combat.enemies[enemyIndex];
  if (enemy.stats.hp.current <= 0) {
    return { success: false, reason: "Enemy already defeated", state };
  }
  // Start-of-turn effect ticks (process once per player turn, regardless of action retries)
  if (
    state.combat.turn === "player" &&
    !state.combat.playerTurnEffectsProcessed
  ) {
    const tick = processEntityTurnEffects(state.player);
    const tickMessages = Array.isArray(tick.messages) ? tick.messages : [];
    const nextLog =
      tickMessages.length > 0
        ? [...state.combat.log, ...tickMessages]
        : state.combat.log;
    state = {
      ...state,
      player: tick.entity,
      combat: {
        ...state.combat,
        log: nextLog,
        playerTurnEffectsProcessed: true,
      },
    };
  }
  // Hard CC: player cannot act this turn
  if (hasEffectTag(state.player, "SKIP_TURN")) {
    const newLog = [
      ...state.combat.log,
      `${state.player.name} is unable to act!`,
    ];
    return {
      success: true,
      damage: 0,
      state: {
        ...state,
        combat: {
          ...state.combat,
          log: newLog,
          turn: "enemy",
        },
      },
    };
  }
  let updatedPlayer = state.player;
  let updatedEnemy = enemy;
  let damageResult = null;
  let skillCooldownUpdate = null;
  let laneAllowZero = false;
  let activeSkill = null;
  if (skillId) {
    const skillKey = typeof skillId === "string" ? skillId : skillId?.id;
    const existingCooldown = skillKey
      ? state.combat?.skillCooldowns?.[skillKey] || 0
      : 0;
    if (existingCooldown > 0) {
      return {
        success: false,
        reason: `Skill on cooldown (${existingCooldown} turns remaining)`,
        state,
      };
    }
    const skill = resolveSkillDefinition(state, skillId);
    if (!skill) {
      return { success: false, reason: "Skill not found", state };
    }
    activeSkill = skill;
    // Silence/disarm checks (player side)
    if (skill.isMagic && hasEffectTag(state.player, "BLOCK_MAGIC")) {
      return { success: false, reason: "Silenced", state };
    }
    if (
      !skill.isMagic &&
      hasEffectTag(state.player, "BLOCK_PHYSICAL") &&
      (skill.damage != null || Number.isFinite(skill.damageMultiplier))
    ) {
      return { success: false, reason: "Disarmed", state };
    }
    laneAllowZero = allowsZeroDamage(skill);
    const skillResult = executeSkill(
      updatedPlayer,
      updatedEnemy,
      skill,
      state.config,
      { state },
    );
    if (skillResult.insufficientMana) {
      return {
        success: false,
        reason: skillResult.messages?.[0] || "Insufficient mana",
        state,
      };
    }
    updatedPlayer = skillResult.updatedAttacker || updatedPlayer;
    updatedEnemy = skillResult.updatedDefender || updatedEnemy;
    const reactionMessages = Array.isArray(skillResult.reactionMessages)
      ? skillResult.reactionMessages
      : [];
    damageResult = {
      damage: skillResult.damage,
      isCritical: false,
      messages: [
        `${updatedPlayer.name} uses ${skill.name || "a skill"}!`,
        ...reactionMessages,
      ],
    };
    const cd = skillResult.cooldown || 0;
    const resolvedSkillId = skill?.id || skillKey;
    if (cd > 0 && resolvedSkillId) {
      skillCooldownUpdate = { skillId: resolvedSkillId, cooldown: cd };
    }
    if (skillResult.backfireDamage && skillResult.backfireDamage > 0) {
      const backfireLog = [
        ...state.combat.log,
        ...damageResult.messages,
        `${updatedPlayer.name}'s magic backfires for ${skillResult.backfireDamage} damage!`,
      ];
      const backfireResult = takeDamage(
        {
          ...state,
          player: updatedPlayer,
          combat: { ...state.combat, log: backfireLog },
        },
        skillResult.backfireDamage,
      );
      return {
        success: true,
        damage: 0,
        state: {
          ...backfireResult.state,
          combat: {
            ...backfireResult.state.combat,
            turn: "enemy",
          },
        },
      };
    }
  } else {
    if (hasEffectTag(state.player, "BLOCK_PHYSICAL")) {
      return { success: false, reason: "Disarmed", state };
    }
    // Get config values (with fallbacks)
    const strToDamageMultiplier = state.config?.strToDamageMultiplier || 2;
    const baseAttributeValue = state.config?.baseAttributeValue || 5;
    // Get player stats using config multipliers
    const titleBonuses = getTitleBonuses(state.player);
    const attackBonus = Number.isFinite(titleBonuses.attack)
      ? titleBonuses.attack
      : 0;
    const effectivePlayerAttributes = getEffectiveAttributes(
      state.player,
      state.config,
    );
    const playerStrength = getAttributeValue(
      effectivePlayerAttributes,
      "strength",
    );
    const playerStats = {
      ...state.player,
      attack:
        (playerStrength || baseAttributeValue) * strToDamageMultiplier +
        (state.player.equipment?.weapon?.stats?.attack || 0) +
        attackBonus,
      attributes: effectivePlayerAttributes,
    };
    // Calculate damage, passing config for all calculations
    damageResult = calculateDamage(
      playerStats,
      enemy.stats,
      null,
      state.config,
    );
  }
  const laneDistance = getLaneDistance(state.combat, enemyIndex);
  damageResult = applyLaneModifier(damageResult, laneDistance, state?.config, {
    allowZeroDamage: laneAllowZero,
  });
  // === CHECK FOR CONFUSE EFFECT ===
  const resolvedState =
    updatedPlayer === state.player
      ? state
      : {
          ...state,
          player: updatedPlayer,
        };
  // Generic miss chance from effects like Blind/Obscured/Fear
  {
    const missChance = getMissChance(resolvedState.player);
    if (missChance > 0 && random() < missChance) {
      const combatLog = [
        ...resolvedState.combat.log,
        ...damageResult.messages,
        "Attack misses!",
      ];
      let nextState = {
        ...resolvedState,
        combat: { ...resolvedState.combat, log: combatLog, turn: "enemy" },
      };
      if (skillCooldownUpdate) {
        nextState = {
          ...nextState,
          combat: {
            ...nextState.combat,
            skillCooldowns: {
              ...(nextState.combat.skillCooldowns || {}),
              [skillCooldownUpdate.skillId]: skillCooldownUpdate.cooldown,
            },
          },
        };
      }
      return {
        success: true,
        damage: 0,
        state: nextState,
      };
    }
  }
  const confuseEffect = resolvedState.player.effects?.find(
    (effect) => effect.id === "confuse",
  );
  if (confuseEffect && random() < confuseEffect.magnitude) {
    // 50% chance to attack self or miss
    if (random() < 0.5) {
      // Attack self
      const selfDamage = Math.floor(damageResult.damage * 0.5);
      const combatLog = [
        ...resolvedState.combat.log,
        ...damageResult.messages,
        `Confused! You attack yourself for ${selfDamage} damage!`,
      ];
      const selfDamageResult = takeDamage(
        {
          ...resolvedState,
          combat: { ...resolvedState.combat, log: combatLog },
        },
        selfDamage,
      );
      let nextState = selfDamageResult.state;
      if (skillCooldownUpdate) {
        nextState = {
          ...nextState,
          combat: {
            ...nextState.combat,
            skillCooldowns: {
              ...(nextState.combat.skillCooldowns || {}),
              [skillCooldownUpdate.skillId]: skillCooldownUpdate.cooldown,
            },
          },
        };
      }
      return {
        success: true,
        damage: selfDamageResult.damage,
        state: {
          ...nextState,
          combat: {
            ...nextState.combat,
            turn: "enemy",
          },
        },
      };
    } else {
      // Miss completely
      const combatLog = [
        ...resolvedState.combat.log,
        ...damageResult.messages,
        "Confused! You attack wildly and miss!",
      ];
      let nextState = {
        ...resolvedState,
        combat: { ...resolvedState.combat, log: combatLog, turn: "enemy" },
      };
      if (skillCooldownUpdate) {
        nextState = {
          ...nextState,
          combat: {
            ...nextState.combat,
            skillCooldowns: {
              ...(nextState.combat.skillCooldowns || {}),
              [skillCooldownUpdate.skillId]: skillCooldownUpdate.cooldown,
            },
          },
        };
      }
      return {
        success: true,
        damage: 0,
        state: nextState,
      };
    }
  }
  // Defender dodge chance from effects like Blur
  {
    const dodgeChance = getDodgeChance(resolvedState.combat.enemies[enemyIndex]);
    if (dodgeChance > 0 && random() < dodgeChance) {
      const combatLog = [
        ...resolvedState.combat.log,
        ...damageResult.messages,
        `${resolvedState.combat.enemies[enemyIndex].name} dodges the attack!`,
      ];
      let nextState = {
        ...resolvedState,
        combat: { ...resolvedState.combat, log: combatLog, turn: "enemy" },
      };
      if (skillCooldownUpdate) {
        nextState = {
          ...nextState,
          combat: {
            ...nextState.combat,
            skillCooldowns: {
              ...(nextState.combat.skillCooldowns || {}),
              [skillCooldownUpdate.skillId]: skillCooldownUpdate.cooldown,
            },
          },
        };
      }
      return { success: true, damage: 0, state: nextState };
    }
  }
  // Enemy shield absorption (enemy shields use the same effect template as player shields)
  let absorbedByShield = 0;
  let effectiveDamage = damageResult.damage;
  let shieldedEnemy = updatedEnemy;
  if (effectiveDamage > 0) {
    const shieldResult = applyShieldAbsorptionToEnemy(shieldedEnemy, effectiveDamage);
    absorbedByShield = shieldResult.absorbed;
    effectiveDamage = shieldResult.damage;
    shieldedEnemy = shieldResult.enemy;
  }
  damageResult.damage = effectiveDamage;
  // Apply damage
  const newEnemyHp = Math.max(
    0,
    shieldedEnemy.stats.hp.current - effectiveDamage,
  );
  const newEnemies = resolvedState.combat.enemies.map((e, idx) =>
    idx === enemyIndex
      ? {
          ...shieldedEnemy,
          stats: {
            ...shieldedEnemy.stats,
            hp: { ...shieldedEnemy.stats.hp, current: newEnemyHp },
          },
        }
      : e,
  );
  const newLog = [
    ...resolvedState.combat.log,
    ...(absorbedByShield > 0
      ? [`ðŸ›¡ï¸ ${shieldedEnemy.name}'s shield absorbs ${absorbedByShield} damage!`]
      : []),
    formatDamageBreakdown(
      activeSkill
        ? `${resolvedState.player.name} uses ${activeSkill.name} on ${shieldedEnemy.name}`
        : `${resolvedState.player.name} attacks ${shieldedEnemy.name}`,
      damageResult,
    ),
  ];
  // === RAGE GAIN ON HIT (Berserker) ===
  let rageGainAmount = 0;
  const classId = resolvedState.player.class?.id || resolvedState.player.class;
  if (
    (classId === "berserker" || classId === "bloodline_vanguard") &&
    damageResult.damage > 0
  ) {
    rageGainAmount = 10; // Base rage per hit
  }
  let newState = {
    ...resolvedState,
    combat: {
      ...resolvedState.combat,
      enemies: newEnemies,
      log: newLog,
      turn: "enemy",
    },
  };
  if (skillCooldownUpdate) {
    newState = {
      ...newState,
      combat: {
        ...newState.combat,
        skillCooldowns: {
          ...(newState.combat.skillCooldowns || {}),
          [skillCooldownUpdate.skillId]: skillCooldownUpdate.cooldown,
        },
      },
    };
  }
  // Reflect damage back to the attacker (based on damage actually dealt after shields)
  {
    const reflectPercent = getReflectPercent(shieldedEnemy);
    const reflectDamage =
      reflectPercent > 0 ? Math.floor(damageResult.damage * reflectPercent) : 0;
    if (reflectDamage > 0) {
      const reflectLog = [
        ...newState.combat.log,
        `${shieldedEnemy.name} reflects ${reflectDamage} damage back!`,
      ];
      const reflectResult = takeDamage(
        { ...newState, combat: { ...newState.combat, log: reflectLog } },
        reflectDamage,
      );
      newState = reflectResult.state;
    }
  }
  // Apply rage gain if berserker
  if (rageGainAmount > 0) {
    newState.player = gainRage(newState.player, rageGainAmount, "hit_enemy");
  }
  // Apply chi gain and combo for monk
  const monkClassId = newState.player.class?.id || newState.player.class;
  if (
    (monkClassId === "monk" || monkClassId === "grandmaster") &&
    damageResult.damage > 0
  ) {
    newState.player = processChiOnHit(newState.player);
    const comboMult = getComboMultiplier(newState.player);
    if (comboMult > 1.0) {
      newState = {
        ...newState,
        combat: {
          ...newState.combat,
          log: [
            ...newState.combat.log,
        `Combo x${newState.player.comboCount}! (${comboMult}x damage)`,
          ],
        },
      };
    }
  }
  // Handle stealth attack (ambush bonus, break stealth)
  if (newState.player.isStealthed) {
    const stealthResult = handleStealthAttack(newState, damageResult.damage);
    newState = stealthResult.state;
    if (stealthResult.wasAmbush) {
      // Ambush damage already applied in damageResult
    }
  }
  // Check for item procs
  const weapon = newState.player.equipment?.weapon;
  if (weapon?.uniquePassive?.proc) {
    const procResult = checkItemProc(
      newState.player,
      newState.combat.enemies[enemyIndex],
      damageResult.damage,
      weapon,
    );
    if (procResult.procTriggered) {
      newState = {
        ...newState,
        combat: {
          ...newState.combat,
          log: [...newState.combat.log, ...procResult.messages],
        },
      };
      // Apply chain lightning if triggered
      if (procResult.chainTargets > 0) {
        const chainDamage = Math.floor(damageResult.damage * 0.5);
        newState = applyChainLightning(
          newState,
          enemyIndex,
          chainDamage,
          procResult.chainTargets,
        );
      }
      // Apply lifesteal if triggered
      if (procResult.healed > 0) {
        newState = {
          ...newState,
          player: {
            ...newState.player,
            hp: {
              ...newState.player.hp,
              current: Math.min(
                newState.player.hp.max,
                newState.player.hp.current + procResult.healed,
              ),
            },
          },
        };
      }
    }
  }
  // Check if enemy is defeated
  if (newEnemyHp <= 0) {
    newState = handleEnemyDefeat(newState, enemyIndex);
  }
  return { success: true, damage: damageResult.damage, state: newState };
}
const performAbilityUse = (state, enemyIndex, ability, cooldownKey) => {
  const costResult = consumeAbilityCost(state.player, ability);
  if (!costResult.success) {
    return {
      success: false,
      reason: costResult.reason || "Insufficient resources",
      state,
    };
  }
  let updatedPlayer = costResult.player;
  let updatedEnemies = [...state.combat.enemies];
  let combatLog = [
    ...state.combat.log,
    `${updatedPlayer.name} uses ${ability.name}!`,
  ];
  // Stance updates
  if (ability.setStance) {
    updatedPlayer = { ...updatedPlayer, currentStance: ability.setStance };
  }
  // Enrage updates
  if (ability.setEnrage) {
    updatedPlayer = {
      ...updatedPlayer,
      isEnraged: true,
      enrageTurnsRemaining: ability.setEnrage.turns || 2,
      rageMultipliers: {
        damage: ability.setEnrage.damageMultiplier || 1.4,
        defense: ability.setEnrage.defenseMultiplier || 0.85,
      },
    };
  }
  if (ability.setAbsorption) {
    const absorption = getRandomElementAbsorption();
    updatedPlayer = { ...updatedPlayer, currentAbsorption: absorption };
    combatLog.push(`Elemental Flux: ${absorption.message}`);
    emit("combat:elementalFlux", {
      absorbed: absorption.absorbed,
      weakTo: absorption.weakTo,
    });
  }
  if (ability.randomBuff) {
    const buff = getRandomStartBuff();
    const currentEffects = updatedPlayer.effects || [];
    updatedPlayer = {
      ...updatedPlayer,
      effects: [
        ...currentEffects,
        {
          id: buff.id,
          name: buff.name,
          type: "BUFF",
          stat: buff.stat,
          magnitude: buff.value,
          remainingDuration: buff.duration,
          tags: ["MUTATION_BUFF"],
        },
      ],
    };
    combatLog.push(
      `Adaptive mutation: ${buff.name} (${buff.stat} +${Math.round(
        buff.value * 100,
      )}% for ${buff.duration} turns)`,
    );
  }
  let newState = {
    ...state,
    player: updatedPlayer,
    combat: {
      ...state.combat,
      enemies: updatedEnemies,
      log: combatLog,
    },
  };
  // Stealth handling
  if (ability.stealth?.duration) {
    const stealthResult = applyVanish(newState, ability.stealth.duration);
    if (stealthResult.success) {
      newState = stealthResult.state;
      updatedPlayer = newState.player;
      updatedEnemies = newState.combat.enemies;
      combatLog = newState.combat.log;
    }
  }
  // Cleanse self
  if (ability.cleanse?.types?.length) {
    updatedPlayer = removeEffectsByTypes(updatedPlayer, ability.cleanse.types);
  }
  // Heal, resource gain, summons
  if (ability.heal) {
    updatedPlayer = applyHealToPlayer(updatedPlayer, ability.heal);
  }
  if (ability.resourceGain) {
    updatedPlayer = applyResourceGain(updatedPlayer, ability.resourceGain);
  }
  if (ability.summon) {
    updatedPlayer = applySummonToPlayer(updatedPlayer, ability.summon);
  }
  // Apply self effects
  const selfEffects = Array.isArray(ability.effects)
    ? ability.effects.filter((effect) => effect.target === "self")
    : [];
  if (selfEffects.length > 0) {
    updatedPlayer = effectApplicationSystem.applyEffects(
      updatedPlayer,
      selfEffects,
      updatedPlayer,
    );
  }
  // Resolve targets
  const targetIndices = resolveAbilityTargets(
    newState.combat,
    enemyIndex,
    ability,
  );
  let totalDamage = 0;
  let randomDebuffApplied = false;
  for (const targetIndex of targetIndices) {
    const enemy = updatedEnemies[targetIndex];
    if (!enemy || enemy.stats?.hp?.current <= 0) continue;
    // Purge enemy buffs
    if (ability.purge?.target === "enemy" && ability.purge.types?.length) {
      updatedEnemies[targetIndex] = removeEffectsByTypes(
        enemy,
        ability.purge.types,
      );
    }
    if (ability.randomDebuff && !randomDebuffApplied) {
      const debuff = getRandomDebuff();
      const currentEffects = updatedEnemies[targetIndex].effects || [];
      updatedEnemies[targetIndex] = {
        ...updatedEnemies[targetIndex],
        effects: [
          ...currentEffects,
          {
            id: debuff.id,
            name: debuff.name,
            type: "DEBUFF",
            stat: debuff.stat,
            magnitude: debuff.value,
            remainingDuration: debuff.duration,
            tags: ["MUTATION_DEBUFF"],
          },
        ],
      };
      combatLog.push(
        `Cellular instability: ${debuff.name} afflicts ${enemy.name}!`,
      );
      randomDebuffApplied = true;
    }
    let damage = 0;
    if (ability.damage) {
      const skillProxy = {
        name: ability.name,
        isMagic: ability.damage.isMagic ?? false,
        element: ability.damage.element,
        damage: {
          base: ability.damage.base,
          multiplier: ability.damage.multiplier,
        },
      };
      const result = calculateDamagePipeline(
        updatedPlayer,
        updatedEnemies[targetIndex],
        skillProxy,
        state.config,
      );
      damage = result.damage;
      if (ability.executeThreshold) {
        const hpPercent =
          updatedEnemies[targetIndex].stats.hp.current /
          updatedEnemies[targetIndex].stats.hp.max;
        if (hpPercent <= ability.executeThreshold) {
          damage = Math.floor(damage * 1.5);
        }
      }
      if (ability.bonusVsTags?.tags?.length) {
        const tagSet = new Set(ability.bonusVsTags.tags);
        const enemyTags = [
          ...(updatedEnemies[targetIndex].tags || []),
          ...(updatedEnemies[targetIndex].entityTags || []),
        ];
        if (enemyTags.some((tag) => tagSet.has(tag))) {
          damage = Math.floor(
            damage * (ability.bonusVsTags.multiplier || 1.5),
          );
        }
      }
      if (ability.aoe?.damageMultiplier) {
        damage = Math.floor(damage * ability.aoe.damageMultiplier);
      }
      const laneDistance = getLaneDistance(newState.combat, targetIndex);
      damage = applyLaneModifier(
        { damage, messages: [] },
        laneDistance,
        newState?.config,
      ).damage;
      // Defender dodge chance from effects like Blur
      {
        const dodgeChance = getDodgeChance(updatedEnemies[targetIndex]);
        if (dodgeChance > 0 && random() < dodgeChance) {
          combatLog.push(`${enemy.name} dodges ${ability.name}!`);
          continue;
        }
      }
      const reactionResult = applyElementalReactions({
        attacker: updatedPlayer,
        defender: updatedEnemies[targetIndex],
        element: ability.damage.element,
        damage,
      });
      damage = reactionResult.damage;
      updatedEnemies[targetIndex] = reactionResult.defender;
      if (reactionResult.messages.length > 0) {
        combatLog.push(...reactionResult.messages);
      }
      if (updatedPlayer.isStealthed) {
        const stealthResult = handleStealthAttack(
          {
            ...newState,
            player: updatedPlayer,
            combat: { ...newState.combat, enemies: updatedEnemies, log: combatLog },
          },
          damage,
        );
        newState = stealthResult.state;
        updatedPlayer = newState.player;
        updatedEnemies = newState.combat.enemies;
        combatLog = newState.combat.log;
        damage = stealthResult.damage;
      }
      // Enemy shield absorption
      if (damage > 0) {
        const before = updatedEnemies[targetIndex];
        const shieldResult = applyShieldAbsorptionToEnemy(before, damage);
        if (shieldResult.absorbed > 0) {
          combatLog.push(
            `ðŸ›¡ï¸ ${before.name}'s shield absorbs ${shieldResult.absorbed} damage!`,
          );
        }
        updatedEnemies[targetIndex] = shieldResult.enemy;
        damage = shieldResult.damage;
      }
      totalDamage += damage;
      const nextHp = Math.max(
        0,
        updatedEnemies[targetIndex].stats.hp.current - damage,
      );
      updatedEnemies[targetIndex] = {
        ...updatedEnemies[targetIndex],
        stats: {
          ...updatedEnemies[targetIndex].stats,
          hp: { ...updatedEnemies[targetIndex].stats.hp, current: nextHp },
        },
      };
      const laneConfig =
        getBalanceConfig(newState?.config).combatLane || DEFAULT_COMBAT_LANE_CONFIG;
      combatLog.push(
        formatDamageBreakdown(
          `${updatedPlayer.name} uses ${ability.name} on ${enemy.name}`,
          {
            damage,
            messages:
              laneDistance > 0
                ? [
                    `Lane gap ${laneDistance}: x${
                      laneDistance === 1
                        ? laneConfig.oneGapMultiplier
                        : laneConfig.multiGapMultiplier
                    }`,
                  ]
                : [],
          },
        ),
      );
    }
    const targetEffects = Array.isArray(ability.effects)
      ? ability.effects.filter((effect) => effect.target !== "self")
      : [];
    if (targetEffects.length > 0) {
      updatedEnemies[targetIndex] = effectApplicationSystem.applyEffects(
        updatedEnemies[targetIndex],
        targetEffects,
        updatedPlayer,
      );
    }
  }
  if (ability.lifesteal && totalDamage > 0) {
    updatedPlayer = applyHealToPlayer(updatedPlayer, {
      flat: Math.floor(totalDamage * ability.lifesteal),
    });
  }
  newState = {
    ...newState,
    player: updatedPlayer,
    combat: {
      ...newState.combat,
      enemies: updatedEnemies,
      log: combatLog,
      turn: "enemy",
      [cooldownKey]:
        ability.cooldown && ability.cooldown > 0
          ? {
              ...(newState.combat[cooldownKey] || {}),
              [ability.id]: ability.cooldown,
            }
          : newState.combat[cooldownKey] || {},
    },
  };
  if (ability.selfDamagePercentOfDamage && totalDamage > 0) {
    const recoil = Math.floor(totalDamage * ability.selfDamagePercentOfDamage);
    if (recoil > 0) {
      newState = takeDamage(newState, recoil);
    }
  }
  // Handle enemy defeats
  targetIndices.forEach((idx) => {
    if (newState.combat.enemies[idx]?.stats?.hp?.current <= 0) {
      newState = handleEnemyDefeat(newState, idx);
    }
  });
  return { success: true, damage: totalDamage, state: newState };
};
/**
 * Player uses a class ability
 */
export function playerUseClassAbility(state, enemyIndex, abilityId) {
  if (state.combat.status !== "active") {
    return { success: false, reason: "Not in combat", state };
  }
  // Start-of-turn effect ticks (process once per player turn)
  if (
    state.combat.turn === "player" &&
    !state.combat.playerTurnEffectsProcessed
  ) {
    const tick = processEntityTurnEffects(state.player);
    const tickMessages = Array.isArray(tick.messages) ? tick.messages : [];
    const nextLog =
      tickMessages.length > 0
        ? [...state.combat.log, ...tickMessages]
        : state.combat.log;
    state = {
      ...state,
      player: tick.entity,
      combat: {
        ...state.combat,
        log: nextLog,
        playerTurnEffectsProcessed: true,
      },
    };
  }
  // Hard CC: player cannot act this turn
  if (hasEffectTag(state.player, "SKIP_TURN")) {
    const newLog = [...state.combat.log, `${state.player.name} is unable to act!`];
    return {
      success: true,
      damage: 0,
      state: {
        ...state,
        combat: { ...state.combat, log: newLog, turn: "enemy" },
      },
    };
  }
  const player = state.player;
  const classId = player.class?.id || player.class;
  if (!isClassAbilityAllowed(classId, abilityId)) {
    return { success: false, reason: "Ability not available", state };
  }
  const ability = getClassAbilityById(abilityId);
  if (!ability) {
    return { success: false, reason: "Ability not found", state };
  }
  // Silence/disarm checks (player side)
  if (ability.damage?.isMagic && hasEffectTag(player, "BLOCK_MAGIC")) {
    return { success: false, reason: "Silenced", state };
  }
  if (ability.damage && !ability.damage.isMagic && hasEffectTag(player, "BLOCK_PHYSICAL")) {
    return { success: false, reason: "Disarmed", state };
  }
  const currentCooldown = state.combat?.classAbilityCooldowns?.[abilityId] || 0;
  if (currentCooldown > 0) {
    return {
      success: false,
      reason: `Ability on cooldown (${currentCooldown} turns remaining)`,
      state,
    };
  }
  return performAbilityUse(state, enemyIndex, ability, "classAbilityCooldowns");
}
/**
 * Player uses a race ability
 */
export function playerUseRaceAbility(state, enemyIndex, abilityId) {
  if (state.combat.status !== "active") {
    return { success: false, reason: "Not in combat", state };
  }
  // Start-of-turn effect ticks (process once per player turn)
  if (
    state.combat.turn === "player" &&
    !state.combat.playerTurnEffectsProcessed
  ) {
    const tick = processEntityTurnEffects(state.player);
    const tickMessages = Array.isArray(tick.messages) ? tick.messages : [];
    const nextLog =
      tickMessages.length > 0
        ? [...state.combat.log, ...tickMessages]
        : state.combat.log;
    state = {
      ...state,
      player: tick.entity,
      combat: {
        ...state.combat,
        log: nextLog,
        playerTurnEffectsProcessed: true,
      },
    };
  }
  // Hard CC: player cannot act this turn
  if (hasEffectTag(state.player, "SKIP_TURN")) {
    const newLog = [...state.combat.log, `${state.player.name} is unable to act!`];
    return {
      success: true,
      damage: 0,
      state: {
        ...state,
        combat: { ...state.combat, log: newLog, turn: "enemy" },
      },
    };
  }
  const player = state.player;
  const raceId = player.race?.id || player.race;
  if (!isRaceAbilityAllowed(raceId, abilityId)) {
    return { success: false, reason: "Ability not available", state };
  }
  const ability = getRaceAbilityById(abilityId);
  if (!ability) {
    return { success: false, reason: "Ability not found", state };
  }
  // Silence/disarm checks (player side)
  if (ability.damage?.isMagic && hasEffectTag(player, "BLOCK_MAGIC")) {
    return { success: false, reason: "Silenced", state };
  }
  if (ability.damage && !ability.damage.isMagic && hasEffectTag(player, "BLOCK_PHYSICAL")) {
    return { success: false, reason: "Disarmed", state };
  }
  const currentCooldown = state.combat?.raceAbilityCooldowns?.[abilityId] || 0;
  if (currentCooldown > 0) {
    return {
      success: false,
      reason: `Ability on cooldown (${currentCooldown} turns remaining)`,
      state,
    };
  }
  return performAbilityUse(state, enemyIndex, ability, "raceAbilityCooldowns");
}
/**
 * Enemy attacks player
 */
function enemyAttack(state, enemyIndex) {
  if (state.combat.status !== "active") {
    return state;
  }
  if (enemyIndex < 0 || enemyIndex >= state.combat.enemies.length) {
    return state;
  }
  let enemy = state.combat.enemies[enemyIndex];
  if (enemy.stats.hp.current <= 0) {
    return state;
  }
  // Start-of-turn effect ticks for this enemy (DoT/HoT, duration decay)
  {
    const tick = processEnemyTurnEffects(enemy);
    const tickMessages = Array.isArray(tick.messages) ? tick.messages : [];
    if (tickMessages.length > 0 || tick.enemy !== enemy) {
      const newEnemies = [...state.combat.enemies];
      newEnemies[enemyIndex] = tick.enemy;
      state = {
        ...state,
        combat: {
          ...state.combat,
          enemies: newEnemies,
          log: tickMessages.length > 0 ? [...state.combat.log, ...tickMessages] : state.combat.log,
        },
      };
      enemy = tick.enemy;
    }
  }
  // Enemy died from effects before acting
  if (enemy.stats.hp.current <= 0) {
    return {
      ...state,
      combat: {
        ...state.combat,
        log: [...state.combat.log, `${enemy.name} collapses from lingering effects!`],
      },
    };
  }
  // === CHARMED ENEMY: Attacks other enemies instead ===
  const hasCharmEffect = Array.isArray(enemy.effects)
    ? enemy.effects.some((effect) => effect.id === "charm")
    : false;
  if (enemy.isCharmed || hasCharmEffect) {
    const acting = enemy.isCharmed ? enemy : { ...enemy, isCharmed: true };
    return processCharmedEnemyAction(state, acting);
  }
  // If player is currently untargetable, enemies waste the action.
  if (hasEffectTag(state.player, "UNTARGETABLE")) {
    return {
      ...state,
      combat: {
        ...state.combat,
        log: [...state.combat.log, `${enemy.name} cannot find a target!`],
      },
    };
  }
  // Hard CC: enemy cannot act
  if (hasEffectTag(enemy, "SKIP_TURN")) {
    return {
      ...state,
      combat: {
        ...state.combat,
        log: [...state.combat.log, `${enemy.name} is unable to act!`],
      },
    };
  }
  // Generic miss chance from effects like Blind/Obscured/Fear
  {
    const missChanceRaw = getEffectTagMagnitude(enemy, "MISS_CHANCE");
    const missChance = Math.max(0, Math.min(0.95, missChanceRaw || 0));
    if (missChance > 0 && random() < missChance) {
      return {
        ...state,
        combat: {
          ...state.combat,
          log: [...state.combat.log, `${enemy.name} misses their attack!`],
        },
      };
    }
  }
  // === CHECK ILLUSION TARGET ===
  const illusionTarget = checkIllusionTarget(state.player);
  if (illusionTarget) {
    // Enemy attacks illusion instead of player
    const combatLog = [
      ...state.combat.log,
      `${enemy.name} attacks ${illusionTarget.name}!`,
    ];
    return damageIllusion(
      {
        ...state,
        combat: { ...state.combat, log: combatLog },
      },
      illusionTarget.id,
    );
  }
  // Simple AI: use random skill or basic attack
  const magicBlocked = hasEffectTag(enemy, "BLOCK_MAGIC");
  const physicalBlocked = hasEffectTag(enemy, "BLOCK_PHYSICAL");
  const availableSkills = (
    magicBlocked ? [] : Array.isArray(enemy.skills) ? enemy.skills : []
  ).filter((skillId) => {
    const skill = getEnemySkillById(skillId);
    if (!skill) return false;
    if (physicalBlocked && skill.damage) return false;
    const cooldown = enemy.skillCooldowns?.[skillId] || 0;
    return (
      cooldown <= 0 &&
      (!skill.manaCost || enemy.stats.mana.current >= skill.manaCost)
    );
  });
  let skill = null;
  if (availableSkills.length > 0 && random() < 0.5) {
    const skillId = randomChoice(availableSkills);
    if (skillId) {
      skill = getEnemySkillById(skillId);
    }
    // Update cooldowns and mana
    const newEnemies = [...state.combat.enemies];
    newEnemies[enemyIndex] = {
      ...enemy,
      stats: {
        ...enemy.stats,
        mana: {
          ...enemy.stats.mana,
          current: enemy.stats.mana.current - (skill.manaCost || 0),
        },
      },
      skillCooldowns: {
        ...enemy.skillCooldowns,
        [skillId]: skill.cooldown || 0,
      },
    };
    // Update state with new enemy
    state = {
      ...state,
      combat: {
        ...state.combat,
        enemies: newEnemies,
      },
    };
  }
  // If disarmed, cannot perform a basic weapon attack
  if (!skill && hasEffectTag(enemy, "BLOCK_PHYSICAL")) {
    return {
      ...state,
      combat: {
        ...state.combat,
        log: [...state.combat.log, `${enemy.name} fumbles, disarmed!`],
      },
    };
  }
  // Defender dodge chance from effects like Blur
  {
    const dodgeChance = getDodgeChance(state.player);
    if (dodgeChance > 0 && random() < dodgeChance) {
      return {
        ...state,
        combat: {
          ...state.combat,
          log: [...state.combat.log, `${state.player.name} dodges the attack!`],
        },
      };
    }
  }
  // Calculate damage using config values
  const baseAttributeValue = state.config?.baseAttributeValue || 5;
  const effectiveAttributes = getEffectiveAttributes(
    state.player,
    state.config,
  );
  const defenseStat = getAttributeValue(effectiveAttributes, "strength");
  const playerDefense =
    (defenseStat || baseAttributeValue) +
    (state.player.equipment?.armor?.stats?.defense || 0);
  const playerStats = { defense: playerDefense };
  let damageResult = calculateDamage(
    enemy.stats,
    playerStats,
    skill,
    state.config,
  );
  const laneDistance = getLaneDistance(state.combat, enemyIndex);
  damageResult = applyLaneModifier(damageResult, laneDistance, state?.config);
  const skillText = skill ? ` using ${skill.name}` : "";
  const newLog = [
    ...state.combat.log,
    formatDamageBreakdown(`${enemy.name} attacks you${skillText}`, damageResult),
  ];
  const attackResult = takeDamage(
    {
      ...state,
      combat: {
        ...state.combat,
        log: newLog,
      },
    },
    damageResult.damage,
  );
  let nextState = attackResult.state;
  // Reflect damage back to the enemy (based on damage taken after shields)
  {
    const reflectPercent = getReflectPercent(nextState.player);
    const reflectDamage =
      reflectPercent > 0 ? Math.floor(attackResult.damage * reflectPercent) : 0;
    if (reflectDamage > 0) {
      const enemyBefore = nextState.combat?.enemies?.[enemyIndex];
      if (enemyBefore?.stats?.hp) {
        let absorbedByShield = 0;
        let dealt = reflectDamage;
        let reflectedEnemy = enemyBefore;
        if (dealt > 0) {
          const shieldResult = applyShieldAbsorptionToEnemy(reflectedEnemy, dealt);
          absorbedByShield = shieldResult.absorbed;
          dealt = shieldResult.damage;
          reflectedEnemy = shieldResult.enemy;
        }
        const nextHp = Math.max(0, reflectedEnemy.stats.hp.current - dealt);
        const nextEnemies = [...nextState.combat.enemies];
        nextEnemies[enemyIndex] = {
          ...reflectedEnemy,
          stats: {
            ...reflectedEnemy.stats,
            hp: { ...reflectedEnemy.stats.hp, current: nextHp },
          },
        };
        const reflectLog = [
          ...nextState.combat.log,
          `${nextState.player.name} reflects ${reflectDamage} damage back!`,
          ...(absorbedByShield > 0
            ? [
                `ðŸ›¡ï¸ ${reflectedEnemy.name}'s shield absorbs ${absorbedByShield} reflected damage!`,
              ]
            : []),
          `${reflectedEnemy.name} takes ${dealt} reflected damage!`,
        ];
        nextState = {
          ...nextState,
          combat: {
            ...nextState.combat,
            enemies: nextEnemies,
            log: reflectLog,
          },
        };
      } else {
        nextState = {
          ...nextState,
          combat: {
            ...nextState.combat,
            log: [
              ...nextState.combat.log,
              `${nextState.player.name} reflects ${reflectDamage} damage back!`,
            ],
          },
        };
      }
    }
  }
  return { ...attackResult, state: nextState };
}
/**
 * Process all enemy turns
 */
export function processEnemyTurns(state) {
  if (state.combat.status !== "active" || state.combat.turn !== "enemy") {
    return state;
  }
  let newState = state;
  // Process each alive enemy
  state.combat.enemies.forEach((enemy, index) => {
    if (enemy.stats.hp.current > 0) {
      const result = enemyAttack(newState, index);
      newState = result?.state ?? result;
      // Update cooldowns
      const updatedEnemy = newState.combat.enemies[index];
      if (updatedEnemy && updatedEnemy.skillCooldowns) {
        const newCooldowns = {};
        Object.keys(updatedEnemy.skillCooldowns).forEach((skillId) => {
          if (updatedEnemy.skillCooldowns[skillId] > 0) {
            newCooldowns[skillId] = updatedEnemy.skillCooldowns[skillId] - 1;
          }
        });
        const newEnemies = [...newState.combat.enemies];
        newEnemies[index] = {
          ...updatedEnemy,
          skillCooldowns: newCooldowns,
        };
        newState = {
          ...newState,
          combat: {
            ...newState.combat,
            enemies: newEnemies,
          },
        };
      }
    }
  });
  // Check if player is dead
  if (newState.player.isDead) {
    return endCombat(newState, "defeat");
  }
  // === BERSERK MODE CHECK (Beast Kin) ===
  const raceId = newState.player.race?.id || newState.player.race;
  const hpPercent = newState.player.hp.current / newState.player.hp.max;
  if (
    (hasRaceTag(raceId, "BERSERK_MODE") || raceId === "beast_kin") &&
    hpPercent < 0.5
  ) {
    // Player is in berserk mode - auto-attack random enemy
    const aliveEnemies = newState.combat.enemies
      .map((e, idx) => ({ enemy: e, index: idx }))
      .filter((e) => e.enemy.stats.hp.current > 0);
    if (aliveEnemies.length > 0 && !newState.player.berserkAttackedThisTurn) {
      const target = randomChoice(aliveEnemies);
      const berserkLog = [
        ...newState.combat.log,
        `ðŸ”´ BLOOD FRENZY! ${newState.player.name} loses control and attacks wildly!`,
      ];
      newState = {
        ...newState,
        player: { ...newState.player, berserkAttackedThisTurn: true },
        combat: { ...newState.combat, log: berserkLog },
      };
      // Execute auto-attack
      const attackResult = playerAttack(newState, target.index, null);
      if (attackResult.success) {
        newState = attackResult.state;
      }
    }
  } else {
    // Reset berserk flag when HP is above threshold
    if (newState.player.berserkAttackedThisTurn) {
      newState = {
        ...newState,
        player: { ...newState.player, berserkAttackedThisTurn: false },
      };
    }
  }
  // === MUTANT RANDOM DEBUFF CHECK ===
  if (
    (hasRaceTag(raceId, "RANDOM_DEBUFF") || raceId === "mutant") &&
    random() < 0.15
  ) {
    const debuff = getRandomDebuff();
    const currentEffects = newState.player.effects || [];
    const debuffLog = [
      ...newState.combat.log,
      `ðŸ§¬ CELLULAR INSTABILITY: ${debuff.name} triggered! (${debuff.stat} ${Math.round(debuff.value * 100)}% for ${debuff.duration} turns)`,
    ];
    newState = {
      ...newState,
      player: {
        ...newState.player,
        effects: [
          ...currentEffects,
          {
            id: debuff.id,
            name: debuff.name,
            type: "DEBUFF",
            stat: debuff.stat,
            magnitude: debuff.value,
            remainingDuration: debuff.duration,
            tags: ["MUTATION_DEBUFF"],
          },
        ],
      },
      combat: { ...newState.combat, log: debuffLog },
    };
    emit("combat:mutationDebuff", { debuff: debuff.name });
  }
  // === RAGE DECAY (Berserker) ===
  const classId = newState.player.class?.id || newState.player.class;
  if (classId === "berserker" || classId === "bloodline_vanguard") {
    newState.player = processRageDecay(newState.player);
  }
  // === MONK COMBO RESET ON DAMAGE ===
  if (
    (classId === "monk" || classId === "grandmaster") &&
    newState.player.comboCount > 0
  ) {
    // Check if player took damage this turn (combo breaks)
    if (newState.player.hp.current < state.player.hp.current) {
      newState.player = resetCombo(newState.player, "took damage");
    }
  }
  // === STEALTH DETECTION CHECK ===
  if (newState.player.isStealthed) {
    newState = processStealthDetection(newState);
  }
  // === CHARM DURATION DECAY ===
  newState = processCharmDuration(newState);
  // === TIME-BASED EFFECTS (Sun regen, etc.) ===
  newState = processTimeEffects(newState);
  // === VANISH DURATION DECAY ===
  newState = processVanishDuration(newState);
  // === ENRAGE DURATION DECAY ===
  if (newState.player.enrageTurnsRemaining) {
    const remaining = newState.player.enrageTurnsRemaining - 1;
    if (remaining <= 0) {
      newState.player = {
        ...newState.player,
        enrageTurnsRemaining: 0,
        isEnraged: false,
        rageMultipliers: { damage: 1.0, defense: 1.0 },
      };
    } else {
      newState.player = {
        ...newState.player,
        enrageTurnsRemaining: remaining,
      };
    }
  }
  // Decrement player skill cooldowns (combat skills)
  if (newState.combat?.skillCooldowns) {
    const nextCooldowns = {};
    Object.entries(newState.combat.skillCooldowns).forEach(([id, value]) => {
      const remaining = (value || 0) - 1;
      if (remaining > 0) nextCooldowns[id] = remaining;
    });
    newState = {
      ...newState,
      combat: {
        ...newState.combat,
        skillCooldowns: nextCooldowns,
      },
    };
  }
  // Decrement class ability cooldowns
  if (newState.combat?.classAbilityCooldowns) {
    const nextCooldowns = {};
    Object.entries(newState.combat.classAbilityCooldowns).forEach(
      ([id, value]) => {
        const remaining = (value || 0) - 1;
        if (remaining > 0) nextCooldowns[id] = remaining;
      },
    );
    newState = {
      ...newState,
      combat: {
        ...newState.combat,
        classAbilityCooldowns: nextCooldowns,
      },
    };
  }
  // Decrement race ability cooldowns
  if (newState.combat?.raceAbilityCooldowns) {
    const nextCooldowns = {};
    Object.entries(newState.combat.raceAbilityCooldowns).forEach(
      ([id, value]) => {
        const remaining = (value || 0) - 1;
        if (remaining > 0) nextCooldowns[id] = remaining;
      },
    );
    newState = {
      ...newState,
      combat: {
        ...newState.combat,
        raceAbilityCooldowns: nextCooldowns,
      },
    };
  }
  // Award defeats for enemies that died during the enemy turn (DoT ticks, charm, etc.)
  if (Array.isArray(newState.combat?.enemies)) {
    for (let idx = newState.combat.enemies.length - 1; idx >= 0; idx -= 1) {
      const enemy = newState.combat.enemies[idx];
      if (enemy?.stats?.hp?.current <= 0) {
        newState = handleEnemyDefeat(newState, idx);
      }
    }
  }
  // Switch back to player turn
  return {
    ...newState,
    combat: {
      ...newState.combat,
      turn: "player",
      playerTurnEffectsProcessed: false,
    },
  };
}
/**
 * Escape from combat
 * Uses config values for escape chance calculation
 */
export function escapeCombat(state) {
  if (state.combat.status !== "active") {
    return { success: false, reason: "Not in combat", state };
  }
  // Check if any enemy prevents fleeing
  const cannotFlee = state.combat.enemies.some((enemy) =>
    hasEffectTag(enemy, "NO_FLEE"),
  );
  if (cannotFlee) {
    const newLog = [...state.combat.log, "You cannot escape!"];
    return {
      success: false,
      reason: "Escape prevented",
      state: {
        ...state,
        combat: {
          ...state.combat,
          log: newLog,
          turn: "enemy",
        },
      },
    };
  }
  // Get config values (with fallbacks for safety)
  const baseEscapeChance = state.config?.baseEscapeChance || 0.3;
  const agilityEscapeBonus = state.config?.agilityEscapeBonus || 0.01;
  const baseAttributeValue = state.config?.baseAttributeValue || 5;
  // Escape chance based on agility using config values
  const effectiveAttributes = getEffectiveAttributes(
    state.player,
    state.config,
  );
  const agility =
    getAttributeValue(effectiveAttributes, "agility") || baseAttributeValue;
  const escapeChance = baseEscapeChance + agility * agilityEscapeBonus;
  const escaped = random() < escapeChance;
  if (escaped) {
    return {
      success: true,
      state: endCombat(state, "escape"),
    };
  } else {
    const newLog = [...state.combat.log, "Escape attempt failed!"];
    return {
      success: false,
      reason: "Escape failed",
      state: {
        ...state,
        combat: {
          ...state.combat,
          log: newLog,
          turn: "enemy",
        },
      },
    };
  }
}
export function executeSkill(attacker, defender, skillInput, config = {}, options = {}) {
  let skill =
    typeof skillInput === "string" ? getSkillById(skillInput) : skillInput;
  if (!skill) return { damage: 0, messages: ["Skill not found"] };
  // If this is a registry skill, apply talent modifiers so skills and abilities
  // follow the same template expectations (cost/cd/damage multipliers, etc.).
  if (skill?.id && getSkillById(skill.id)) {
    const modified = getModifiedSkill(
      skill.id,
      attacker.talents || [],
      attacker.level || 1,
    );
    if (modified) skill = modified;
  }
  const bypasses = resolveBypasses(attacker.talents || []);
  const stateForUnifiedMagic =
    options?.state && typeof options.state === "object" && !Array.isArray(options.state)
      ? {
          ...options.state,
          player: {
            ...(options.state.player || {}),
            ...attacker,
            mana: attacker?.mana || options.state.player?.mana,
            magic: attacker?.magic || options.state.player?.magic,
          },
        }
      : null;
  const resolvedSkillMagic =
    !options?.unifiedMagic && stateForUnifiedMagic
      ? resolveCombatAbilityMagic(stateForUnifiedMagic, skill)
      : null;
  if (resolvedSkillMagic?.ok === false) {
    return {
      damage: 0,
      messages: [resolvedSkillMagic.reason || "Magic profile unavailable"],
      cooldown: 0,
      cost: 0,
      insufficientMana: true,
    };
  }
  const unifiedMagic =
    skill?.unifiedMagic ||
    options?.unifiedMagic ||
    (resolvedSkillMagic?.ok ? resolvedSkillMagic : null) ||
    null;
  const cd = Number.isFinite(unifiedMagic?.cooldown)
    ? unifiedMagic.cooldown
    : applyCooldownOverride(skill.cooldown || 0, bypasses);
  const cost = Number.isFinite(unifiedMagic?.manaCost)
    ? unifiedMagic.manaCost
    : applyCostOverride(skill.manaCost || 0, bypasses);
  const consumption = consumeAbilityCostForActor(
    { ...skill, manaCost: cost, unifiedMagic },
    attacker,
    stateForUnifiedMagic,
  );
  if (!consumption.success) {
    return {
      damage: 0,
      messages: [consumption.error || "Insufficient mana"],
      cooldown: 0,
      cost: 0,
      insufficientMana: true,
    };
  }
  let updatedAttacker = consumption.updatedActor || { ...attacker };
  // Skill-side utility hooks (keep parity with class/race ability templates)
  if (skill.cleanse?.types?.length) {
    updatedAttacker = removeEffectsByTypes(updatedAttacker, skill.cleanse.types);
  }
  if (skill.heal) {
    updatedAttacker = applyHealToPlayer(updatedAttacker, skill.heal);
  }
  if (skill.resourceGain) {
    updatedAttacker = applyResourceGain(updatedAttacker, skill.resourceGain);
  }
  if (skill.summon) {
    updatedAttacker = applySummonToPlayer(updatedAttacker, skill.summon);
  }
  let updatedDefender = defender;
  let gambleResult = null;
  // === CHAOS BORN GAMBLE CAST ===
  const raceId = updatedAttacker.race?.id || updatedAttacker.race;
  if (
    (hasRaceTag(raceId, "GAMBLE_CAST") || raceId === "chaos_born") &&
    skill.isMagic
  ) {
    gambleResult = rollGambleCast();
    emit("combat:gambleCast", { result: gambleResult });
  }
  const result = calculateDamagePipeline(
    updatedAttacker,
    updatedDefender,
    skill,
    config,
  );
  const reactionResult = applyElementalReactions({
    attacker: updatedAttacker,
    defender: updatedDefender,
    element: skill.element,
    damage: result.damage,
  });
  result.damage = reactionResult.damage;
  updatedDefender = reactionResult.defender;
  // Apply Chaos Born gamble modifier
  if (gambleResult) {
    if (gambleResult.success) {
      result.damage = Math.floor(result.damage * gambleResult.multiplier);
      result.log.push({
        stage: "CHAOS_AMPLIFY",
        value: result.damage,
        reason: gambleResult.message,
      });
    } else {
      // Backfire - damage self instead
      result.backfireDamage = Math.floor(
        result.damage * Math.abs(gambleResult.multiplier),
      );
      result.damage = 0;
      result.log.push({
        stage: "CHAOS_BACKFIRE",
        value: result.backfireDamage,
        reason: gambleResult.message,
      });
    }
  }
  if (Number.isFinite(unifiedMagic?.backfireDamage) && unifiedMagic.backfireDamage > 0) {
    result.backfireDamage =
      Math.max(
        0,
        Number.isFinite(result.backfireDamage) ? result.backfireDamage : 0,
      ) +
      Math.floor(unifiedMagic.backfireDamage);
    result.log.push({
      stage: "MAGIC_STRAIN_BACKFIRE",
      value: result.backfireDamage,
      reason: "Strain overload destabilized the cast.",
    });
  }
  // Apply magnitude-based AoE caps if skill has AoE effects
  if (Array.isArray(skill.effects) && skill.effects.some((e) => e.aoe)) {
    const attackerLevel = updatedAttacker.level || 1;
    const activeTalents = updatedAttacker.talents || [];
    let magnitudeCaps = null;
    // Check for magnitude-based talents
    for (const talentId of activeTalents) {
      const caps = getMagnitudeCaps(talentId, attackerLevel);
      if (caps && caps.aoeRadius > 0) {
        magnitudeCaps = caps;
        break; // Use the first magnitude talent found
      }
    }
    if (magnitudeCaps) {
      emit("combat:log", {
        type: "aoe_magnitude",
        attacker: updatedAttacker.name,
        label: magnitudeCaps.label,
        radius: magnitudeCaps.aoeRadius,
      });
    }
  }
  // Apply Effects
  if (Array.isArray(skill.effects)) {
    const selfEffects = skill.effects.filter((e) => e.target === "self");
    const targetEffects = skill.effects.filter((e) => e.target !== "self");
    if (selfEffects.length > 0) {
      updatedAttacker = effectApplicationSystem.applyEffects(
        updatedAttacker,
        selfEffects,
        updatedAttacker,
      );
    }
    if (targetEffects.length > 0) {
      updatedDefender = effectApplicationSystem.applyEffects(
        updatedDefender,
        targetEffects,
        updatedAttacker,
      );
    }
  }
  return {
    damage: result.damage,
    cooldown: cd,
    cost,
    log: result.log,
    remainingMana: consumption.remainingResource,
    updatedAttacker,
    updatedDefender,
    reactionMessages: reactionResult.messages,
  };
}
export function applyTalentDropOverrides(attacker, drops) {
  const bypasses = resolveBypasses(attacker.talents || []);
  return (drops || []).map((d) => applyDropOverrides(d, bypasses));
}
// =================================================================
// TALENT BYPASS UTILITIES
// =================================================================
/**
 * Check if attacker has a specific bypass flag from talents
 * @param {Object} attacker - The attacker (player or enemy)
 * @param {string} bypassKey - The bypass key to check
 * @returns {boolean} Whether the bypass is active
 */
export function hasTalentBypass(attacker, bypassKey) {
  const bypasses = resolveBypasses(attacker.talents || []);
  return !!bypasses[bypassKey];
}
/**
 * Get all active bypass flags for an attacker
 * @param {Object} attacker - The attacker (player or enemy)
 * @returns {Object} All active bypass flags
 */
export function getActiveBypasses(attacker) {
  return resolveBypasses(attacker.talents || []);
}
/**
 * Apply talent-modified damage with bypass checks
 * @param {number} baseDamage - The base damage amount
 * @param {Object} attacker - The attacker
 * @param {Object} defender - The defender
 * @returns {number} Modified damage after bypass checks
 */
export function applyTalentDamageModifiers(baseDamage, attacker, defender) {
  const attackerBypasses = resolveBypasses(attacker.talents || []);
  const defenderBypasses = resolveBypasses(defender.talents || []);
  let modifiedDamage = baseDamage;
  // Attacker bypasses
  if (attackerBypasses.damageResistance) {
    // Ignore defender's damage resistance
    modifiedDamage = baseDamage; // No reduction applied
  }
  // Defender bypasses
  if (defenderBypasses.damageImmunity) {
    return 0; // Complete damage immunity
  }
  return modifiedDamage;
}
/**
 * Check if a status effect can be applied (considering talent immunities)
 * @param {string} effectId - The effect to apply
 * @param {Object} target - The target of the effect
 * @returns {boolean} Whether the effect can be applied
 */
export function canApplyStatusEffect(effectId, target) {
  const bypasses = resolveBypasses(target.talents || []);
  // Status immunity blocks all negative status effects
  if (bypasses.statusImmune) {
    const negativeEffects = [
      "stun",
      "freeze",
      "slow",
      "poison",
      "bleed",
      "burn",
      "frostbite",
      "shock",
      "sunder",
      "fear",
      "charm",
      "silence",
    ];
    if (negativeEffects.includes(effectId)) {
      return false;
    }
  }
  // Purify on cast removes existing debuffs
  if (bypasses.purifyOnCast) {
    // This would be handled in effect application
  }
  return true;
}
/**
 * Get talent-modified skill for combat use
 * @param {string} skillId - The skill ID
 * @param {Object} attacker - The attacker using the skill
 * @returns {Object} Modified skill with all talent effects applied
 */
export function getCombatModifiedSkill(skillId, attacker) {
  const activeTalents = attacker.talents || [];
  const playerLevel = attacker.level || 1;
  return getModifiedSkill(skillId, activeTalents, playerLevel);
}
