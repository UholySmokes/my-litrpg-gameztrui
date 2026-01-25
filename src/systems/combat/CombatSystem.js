import { addItem } from "../inventory/InventorySystem.js";
import { addXp } from "../leveling/LevelingManager.js";
import {
  createEnemy,
  getEnemySkillById,
  calculateEnemyDrops,
} from "../../entities/Enemy.js";
import { getSkillById } from "../skills/SkillRegistry.js";
import { calculateGainedXP } from "../../core/xpCurve.js";
import {
  hasRaceTag,
  EFFECT_TAGS as RACE_EFFECT_TAGS,
  getRaceEntityTags,
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
  applyCritOverride,
  applyCritMultiplier,
  applyDropOverrides,
  getMagnitudeCaps,
  applyMagnitudeDamageCap,
} from "../skills/TalentManager.js";
import { getModifiedSkill } from "../skills/SkillRegistry.js";
import { effectApplicationSystem } from "../effects/EffectApplicationSystem.js";
import { consumeMana } from "../magic/ManaSystem.js";
import { calculateManaCost } from "../magic/ManaBalance.js";
import { emit } from "../../core/EventBus.js";
import { getSetBonuses } from "../items/SetBonusSystem.js";
import {
  gainRage,
  processRageDecay,
  getRageMultipliers,
} from "../class/RageSystem.js";
import {
  handleStealthAttack,
  processStealthDetection,
} from "./StealthSystem.js";
import {
  processChiOnHit,
  resetCombo,
  getComboMultiplier,
} from "../class/ChiSystem.js";
import {
  processCharmDuration,
  processCharmedEnemyAction,
  checkIllusionTarget,
  damageIllusion,
} from "../effects/CharmSystem.js";
import { processTimeEffects } from "../world/TimeSystem.js";
import { checkItemProc, applyChainLightning } from "../items/ItemProcSystem.js";
import {
  ensureAttributeShape,
  getAttributeValue,
} from "../../utils/AttributeMath.js";
import {
  getEffectiveAttributes,
  getTitleBonuses,
} from "../titles/TitleSystem.js";
import { random, randomChoice } from "./DeterministicRandom.js";
import { SimBridge } from "../../simulation/bridge/SimulationContext.js";

const DEBUG_LOGGING_ENABLED = false;

const getLaneDistance = (combatState, enemyIndex) => {
  const playerLane = combatState?.lanes?.player;
  const enemyLane = combatState?.lanes?.enemies?.[enemyIndex];
  if (!Number.isFinite(playerLane) || !Number.isFinite(enemyLane)) {
    return 0;
  }
  return Math.abs(playerLane - enemyLane);
};

const applyLaneModifier = (damageResult, laneDistance) => {
  if (!damageResult || laneDistance <= 0) return damageResult;
  const multiplier = laneDistance === 1 ? 0.85 : 0.7;
  const nextDamage = Math.max(1, Math.floor(damageResult.damage * multiplier));
  const messages = Array.isArray(damageResult.messages)
    ? [...damageResult.messages, `Lane gap ${laneDistance}: x${multiplier}`]
    : [`Lane gap ${laneDistance}: x${multiplier}`];
  return { ...damageResult, damage: nextDamage, messages };
};

const toNumberSafe = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

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
      combatLog.push(`🛡️ Shield absorbs ${totalShieldAbsorb} damage!`);
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
  if (classId === "berserker" && amount > 0) {
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
        `💀 UNDYING WILL! ${state.player.name} refuses to die and clings to life with 1 HP!`,
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
          `🔥 RISE FROM ASHES! ${state.player.name} is reborn in flames with ${reviveHp} HP!`,
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
    delete newState.player.rageGained;
  }

  if (newState.player.isDead) {
    console.log(`${newState.player.name} has been defeated!`);
  }

  const damageApplied = Math.max(0, initialHp - newHp);

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
      lane: index % 3,
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
      `🧬 ADAPTIVE MUTATION: ${buff.name} activated! (${buff.stat} +${Math.round(buff.value * 100)}% for ${buff.duration} turns)`,
    );
    emit("combat:mutationBuff", { buff: buff.name });
  }

  // Elemental Attuned: Random element absorption
  if (hasRaceTag(raceId, "ABSORB_RANDOM") || raceId === "elemental_attuned") {
    const absorption = getRandomElementAbsorption();
    playerUpdates.currentAbsorption = absorption;
    combatLog.push(`⚡ ELEMENTAL FLUX: ${absorption.message}`);
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

  if (enemyIndex < 0 || enemyIndex >= state.combat.enemies.length) {
    return { success: false, reason: "Invalid enemy", state };
  }

  const enemy = state.combat.enemies[enemyIndex];
  if (enemy.stats.hp.current <= 0) {
    return { success: false, reason: "Enemy already defeated", state };
  }

  let updatedPlayer = state.player;
  let updatedEnemy = enemy;
  let damageResult = null;
  let skillCooldownUpdate = null;

  if (skillId) {
    const existingCooldown = state.combat?.skillCooldowns?.[skillId] || 0;
    if (existingCooldown > 0) {
      return {
        success: false,
        reason: `Skill on cooldown (${existingCooldown} turns remaining)`,
        state,
      };
    }

    const skill = getSkillById(skillId);
    if (!skill) {
      return { success: false, reason: "Skill not found", state };
    }

    const skillResult = executeSkill(
      updatedPlayer,
      updatedEnemy,
      skillId,
      state.config,
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
    damageResult = {
      damage: skillResult.damage,
      isCritical: false,
      messages: [`${updatedPlayer.name} uses ${skill.name}!`],
    };

    const cd = skillResult.cooldown || 0;
    if (cd > 0) {
      skillCooldownUpdate = { skillId, cooldown: cd };
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
  damageResult = applyLaneModifier(damageResult, laneDistance);

  // === CHECK FOR CONFUSE EFFECT ===
  const resolvedState =
    updatedPlayer === state.player
      ? state
      : {
          ...state,
          player: updatedPlayer,
        };
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
        `ƒ?O Confused! You attack yourself for ${selfDamage} damage!`,
      ];
      const selfDamageResult = takeDamage(
        {
          ...resolvedState,
          combat: { ...resolvedState.combat, log: combatLog },
        },
        selfDamage,
      );
      return {
        success: true,
        damage: selfDamageResult.damage,
        state: {
          ...selfDamageResult.state,
          combat: {
            ...selfDamageResult.state.combat,
            turn: "enemy",
          },
        },
      };
    } else {
      // Miss completely
      const combatLog = [
        ...resolvedState.combat.log,
        ...damageResult.messages,
        `ƒ?O Confused! You attack wildly and miss!`,
      ];
      return {
        success: true,
        damage: 0,
        state: {
          ...resolvedState,
          combat: { ...resolvedState.combat, log: combatLog, turn: "enemy" },
        },
      };
    }
  }

  // Apply damage
  const newEnemyHp = Math.max(
    0,
    updatedEnemy.stats.hp.current - damageResult.damage,
  );
  const newEnemies = resolvedState.combat.enemies.map((e, idx) =>
    idx === enemyIndex
      ? {
          ...updatedEnemy,
          stats: {
            ...updatedEnemy.stats,
            hp: { ...updatedEnemy.stats.hp, current: newEnemyHp },
          },
        }
      : e,
  );

  const newLog = [
    ...resolvedState.combat.log,
    damageResult.messages.join(" ") ||
      `You dealt ${damageResult.damage} damage to ${updatedEnemy.name}.`,
  ];

  // === RAGE GAIN ON HIT (Berserker) ===
  let rageGainAmount = 0;
  const classId = resolvedState.player.class?.id || resolvedState.player.class;
  if (classId === "berserker" && damageResult.damage > 0) {
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
      newState.combat.log.push(
        `☯️ Combo x${newState.player.comboCount}! (${comboMult}x damage)`,
      );
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
      procResult.messages.forEach((msg) => newState.combat.log.push(msg));

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
        newState.player.hp.current = Math.min(
          newState.player.hp.max,
          newState.player.hp.current + procResult.healed,
        );
      }
    }
  }

  // Check if enemy is defeated
  if (newEnemyHp <= 0) {
    newState = handleEnemyDefeat(newState, enemyIndex);
  }

  return { success: true, damage: damageResult.damage, state: newState };
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

  const enemy = state.combat.enemies[enemyIndex];
  if (enemy.stats.hp.current <= 0) {
    return state;
  }

  // === CHARMED ENEMY: Attacks other enemies instead ===
  if (enemy.isCharmed) {
    return processCharmedEnemyAction(state, enemy);
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
  const availableSkills = (
    Array.isArray(enemy.skills) ? enemy.skills : []
  ).filter((skillId) => {
    const skill = getEnemySkillById(skillId);
    if (!skill) return false;
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
  damageResult = applyLaneModifier(damageResult, laneDistance);

  const critText = damageResult.isCritical ? " (CRITICAL!)" : "";
  const skillText = skill ? ` using ${skill.name}` : "";

  const newLog = [
    ...state.combat.log,
    `${enemy.name} attacks you${skillText} for ${damageResult.damage} damage${critText}!`,
  ];

  return takeDamage(
    {
      ...state,
      combat: {
        ...state.combat,
        log: newLog,
      },
    },
    damageResult.damage,
  );
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
        `🔴 BLOOD FRENZY! ${newState.player.name} loses control and attacks wildly!`,
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
      `🧬 CELLULAR INSTABILITY: ${debuff.name} triggered! (${debuff.stat} ${Math.round(debuff.value * 100)}% for ${debuff.duration} turns)`,
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
  if (classId === "berserker") {
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

  // Switch back to player turn
  return {
    ...newState,
    combat: {
      ...newState.combat,
      turn: "player",
    },
  };
}

/**
 * Handle enemy defeat
 */
function handleEnemyDefeat(state, enemyIndex) {
  const enemy = state.combat.enemies[enemyIndex];
  const drops = calculateEnemyDrops(enemy);
  const titleBonuses = getTitleBonuses(state.player);
  const goldGain = Number.isFinite(titleBonuses.goldGain)
    ? titleBonuses.goldGain
    : 0;
  const goldEarned =
    drops.gold > 0 ? Math.max(0, Math.ceil(drops.gold * (1 + goldGain))) : 0;

  // Add drops to player
  let newState = state;

  // Update progress (kills, gold earned)
  {
    const progressSource =
      newState.player.progress &&
      typeof newState.player.progress === "object" &&
      newState.player.progress !== null
        ? newState.player.progress
        : {};
    const killsByEnemyIdSource =
      progressSource.killsByEnemyId &&
      typeof progressSource.killsByEnemyId === "object" &&
      progressSource.killsByEnemyId !== null
        ? progressSource.killsByEnemyId
        : {};
    const killsByEnemyId = { ...killsByEnemyIdSource };
    if (enemy?.id) {
      killsByEnemyId[enemy.id] = (killsByEnemyId[enemy.id] || 0) + 1;
    }

    newState = {
      ...newState,
      player: {
        ...newState.player,
        progress: {
          ...progressSource,
          totalKills: (progressSource.totalKills || 0) + 1,
          killsByEnemyId,
          totalGoldEarned: (progressSource.totalGoldEarned || 0) + goldEarned,
        },
      },
    };
  }

  // Add gold
  if (goldEarned > 0) {
    newState = {
      ...newState,
      player: {
        ...newState.player,
        gold: (newState.player.gold || 0) + goldEarned,
        currency: {
          ...newState.player.currency,
          goldCoins: (newState.player.currency?.goldCoins || 0) + goldEarned,
        },
      },
    };
  }

  // Add items
  drops.items.forEach((item) => {
    newState = addItem(newState, item);
  });

  // Add XP
  // Use Level-Delta logic to calculate actual XP gained
  const xpGained = calculateGainedXP(
    state.player.level,
    enemy.level,
    drops.xp,
    state.config,
  );
  newState = addXp(newState, xpGained);

  // Remove enemy from combat
  const newEnemies = newState.combat.enemies.filter(
    (_, idx) => idx !== enemyIndex,
  );

  const newLog = [
    ...newState.combat.log,
    `${enemy.name} defeated! Gained ${xpGained} XP (Base: ${drops.xp}), ${goldEarned} gold, and ${drops.items.length} item(s).`,
  ];

  newState = {
    ...newState,
    combat: {
      ...newState.combat,
      enemies: newEnemies,
      log: newLog,
    },
  };

  // Check if all enemies defeated
  if (
    newEnemies.length === 0 ||
    newEnemies.every((e) => e.stats.hp.current <= 0)
  ) {
    return endCombat(newState, "victory");
  }

  return newState;
}

/**
 * End combat
 */
function endCombat(state, result) {
  const newLog = [...state.combat.log];

  if (result === "victory") {
    newLog.push("Victory! All enemies defeated!");
  } else if (result === "defeat") {
    newLog.push("Defeat! You have been knocked unconscious.");
  } else if (result === "escape") {
    newLog.push("You successfully escaped from combat!");
  }

  return {
    ...state,
    combat: {
      status:
        result === "victory"
          ? "victory"
          : result === "defeat"
            ? "defeat"
            : "inactive",
      turn: "player",
      enemies: [],
      log: newLog,
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

function calculateDamage(attacker, defender, skill = null, config = {}) {
  let damage = 0;
  let isCritical = false;
  let messages = [];

  // Determine attacker stats
  const isPlayer = !!attacker.race; // Simple check if attacker is player
  const statsSource = attacker.attributes || attacker.stats;
  const normalizedStats = ensureAttributeShape(statsSource, 10);
  const stats = {
    strength: getAttributeValue(normalizedStats, "strength") || 10,
    dexterity: getAttributeValue(normalizedStats, "dexterity") || 10,
    intelligence: getAttributeValue(normalizedStats, "intelligence") || 10,
    luck: getAttributeValue(normalizedStats, "luck") || 10,
  };

  // --- 1. Base Damage Calculation ---
  // Physical damage scales with STR, Magical with INT
  const isMagic = skill ? skill.isMagic : false; // Assume skills define if they are magic
  const scalingStat = isMagic ? stats.intelligence : stats.strength;

  // Base damage from stat (fallback when no explicit attack value is provided)
  const baseAttack = Math.floor(scalingStat * 2);
  const attackValue = Number(attacker?.attack);
  damage = !skill && Number.isFinite(attackValue) ? attackValue : baseAttack;

  // Apply skill damage (supports numeric or { base, multiplier } shapes)
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

  const setBonuses = isPlayer ? getSetBonuses(attacker.equipment || {}) : {};
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

  if (skill) {
    messages.push(`${attacker.name} uses ${skill.name}!`);
  } else {
    messages.push(`${attacker.name} attacks!`);
  }

  // --- Status Effect Damage Modifiers ---
  // Might Buff (+20% Phys Dmg per stack)
  if (!isMagic && hasEffectTag(attacker, "DMG_BOOST_PHYSICAL")) {
    const boost = getEffectTagMagnitude(attacker, "DMG_BOOST_PHYSICAL");
    damage = Math.floor(damage * (1 + boost));
    messages.push(`Might: +${Math.round(boost * 100)}% Damage`);
  }

  // --- 2. Racial Modifiers (Attacker) ---
  if (isPlayer && attacker.race) {
    const raceId = attacker.race.id;

    // Damage Boosts
    if (skill) {
      if (
        skill.element === "fire" &&
        hasRaceTag(raceId, RACE_EFFECT_TAGS.DMG_BOOST_FIRE)
      ) {
        damage *= 1.2;
        messages.push("Racial Bonus: Fire Damage +20%");
      }
      if (
        skill.element === "ice" &&
        hasRaceTag(raceId, RACE_EFFECT_TAGS.DMG_BOOST_ICE)
      ) {
        damage *= 1.2;
        messages.push("Racial Bonus: Ice Damage +20%");
      }
      // ... add other element boosts similarly
    }

    // Special Traits
    if (hasRaceTag(raceId, "LOW_HP_DMG_BOOST")) {
      const hpPercent = attacker.hp.current / attacker.hp.max;
      if (hpPercent < 0.5) {
        damage *= 1.2;
        messages.push("Racial Bonus: Blood Frenzy! Damage +20%");
      }
    }
  }

  // --- 3. Apply Rage Multipliers (Berserker) ---
  const classId = attacker.class?.id || attacker.class;
  if (classId === "berserker" && attacker.isEnraged) {
    const rageMultipliers = getRageMultipliers(attacker);
    damage = Math.floor(damage * rageMultipliers.damage);
    messages.push(`⚡ ENRAGED! Damage x${rageMultipliers.damage}`);
  }

  // --- 3b. Apply Combo Multiplier (Monk) ---
  if (classId === "monk" || classId === "grandmaster") {
    const comboMult = getComboMultiplier(attacker);
    if (comboMult > 1.0) {
      damage = Math.floor(damage * comboMult);
      messages.push(
        `☯️ Combo x${attacker.comboCount || 1}! Damage x${comboMult}`,
      );
    }
  }

  // --- 3c. Apply Stealth Ambush Multiplier ---
  if (attacker.isStealthed) {
    damage = Math.floor(damage * 2.0);
    messages.push(`🗡️ AMBUSH! Damage x2.0`);
    const backstabBonus = toNumberSafe(setBonuses.backstabDamage, 0);
    if (backstabBonus) {
      damage = Math.floor(damage * (1 + backstabBonus));
      messages.push(`Set Bonus: Backstab +${Math.round(backstabBonus * 100)}%`);
    }
  }

  // --- 4. Critical Hit Calculation ---
  const luck = stats.luck || 5;
  let critChance = luck * 0.01;
  const talentBypasses = resolveBypasses(attacker.talents || []);
  critChance = applyCritOverride(critChance, talentBypasses);
  critChance += toNumberSafe(setBonuses.critChance, 0);

  // Racial Crit Bonus
  if (
    isPlayer &&
    attacker.race &&
    hasRaceTag(attacker.race.id, RACE_EFFECT_TAGS.DMG_BOOST_CRIT)
  ) {
    critChance += 0.05;
  }

  // Status Effect Crit Bonus
  if (hasEffectTag(attacker, "DMG_BOOST_CRIT")) {
    critChance += getEffectTagMagnitude(attacker, "DMG_BOOST_CRIT");
  }

  // Cap crit chance at 50% (soft cap)
  critChance = Math.min(critChance, 0.5);

  if (random() < critChance) {
    isCritical = true;
    let critMultiplier = applyCritMultiplier(1.5, talentBypasses);
    critMultiplier += toNumberSafe(setBonuses.critDamage, 0);

    // Racial Crit Damage Bonus
    if (
      isPlayer &&
      attacker.race &&
      hasRaceTag(attacker.race.id, "CRIT_DMG_BOOST")
    ) {
      critMultiplier = 1.7; // 20% boost to multiplier
    }

    damage = Math.floor(damage * critMultiplier);
    messages.push("Critical Hit!");
  }

  // --- 4. Defense & Resistance (Defender) ---
  const defenseReductionFactor = config?.defenseReductionFactor ?? 0.5;
  const defenseInput = Number(defender?.defense ?? defender?.stats?.defense);
  const defenseValue = Number.isFinite(defenseInput)
    ? defenseInput
    : Number(
        getAttributeValue(
          defender?.attributes || defender?.stats || { str: 10 },
          "strength",
        ) || 0,
      );
  const defense = Math.floor(defenseValue * defenseReductionFactor);

  // Apply Racial Defenses (if Defender is Player)
  let finalDefense = defense;
  if (!isPlayer && defender.race) {
    // If defender is player (in enemy turn) or PvP
    // Note: Currently simple logic assumes 'attacker.race' means player.
    // In a full system, we'd check defender too.
    // For now, assuming PvE where defender is enemy (no race traits usually)
    // OR Defender is player (Enemy Turn)
  }

  // Calculate final damage
  let finalDamage = Math.max(1, damage - finalDefense);

  // --- 5. Racial Resistances/Weaknesses (Defender) ---
  // We need to know if defender has racial traits.
  // Assuming 'defender' object has 'race' property if it's a player.
  if (defender.race) {
    const defRaceId = defender.race.id;
    const element = skill ? skill.element : "physical";

    // Weaknesses (+50% Damage Taken)
    if (
      element === "fire" &&
      hasRaceTag(defRaceId, RACE_EFFECT_TAGS.WEAK_FIRE)
    ) {
      finalDamage *= 1.5;
      messages.push("Weakness: Fire! (+50% Dmg)");
    }
    if (
      element === "lightning" &&
      hasRaceTag(defRaceId, RACE_EFFECT_TAGS.WEAK_LIGHTNING)
    ) {
      finalDamage *= 1.5;
      messages.push("Weakness: Lightning! (+50% Dmg)");
    }

    // Resistances (-20% Damage Taken)
    if (
      element === "fire" &&
      hasRaceTag(defRaceId, RACE_EFFECT_TAGS.RESIST_FIRE)
    ) {
      finalDamage *= 0.8;
      messages.push("Resisted: Fire (-20% Dmg)");
    }

    // Immunities (0 Damage)
    if (
      skill &&
      skill.effect === "bleed" &&
      hasRaceTag(defRaceId, RACE_EFFECT_TAGS.IMMUNE_BLEED)
    ) {
      messages.push("Immune to Bleed!");
      // Logic to prevent bleed application would go here
    }

    // Chance to Negate (Void Walker)
    if (hasRaceTag(defRaceId, "DMG_NEGATE_CHANCE")) {
      if (random() < 0.2) {
        finalDamage = 0;
        messages.push("Void Step: Damage Negated!");
      }
    }

    // Elemental Attuned: Dynamic absorption/weakness based on current combat state
    if (defRaceId === "elemental_attuned" && defender.currentAbsorption) {
      const absorption = defender.currentAbsorption;
      if (element === absorption.absorbed) {
        // Absorb damage as healing
        finalDamage = -Math.floor(finalDamage * 0.5); // Negative = heal
        messages.push(`Elemental Flux: Absorbed ${element}! Healed instead!`);
      } else if (element === absorption.weakTo) {
        // Double damage from opposite element
        finalDamage *= 2;
        messages.push(`Elemental Flux: Weak to ${element}! (+100% Dmg)`);
      }
    }
  }

  finalDamage = Math.floor(finalDamage);

  const result = {
    damage: finalDamage,
    isCritical,
    messages,
  };
  emit("combat:log", {
    type: "damage",
    attacker: attacker.name,
    defender: defender.name,
    result,
  });
  return result;
}

function calculateDamagePipeline(
  attacker,
  defender,
  skill = null,
  config = {},
) {
  const log = [];
  const isMagic = skill ? skill.isMagic : false;
  const defenseReductionFactor = config?.defenseReductionFactor ?? 0.5;
  const strToDamageMultiplier = config?.strToDamageMultiplier ?? 2;
  const titleBonuses = getTitleBonuses(attacker);
  const attackBonus = Number.isFinite(titleBonuses.attack)
    ? titleBonuses.attack
    : 0;
  const magicBonus = Number.isFinite(titleBonuses.magic)
    ? titleBonuses.magic
    : 0;
  const skillPower = Number.isFinite(titleBonuses.skillPower)
    ? titleBonuses.skillPower
    : 0;

  const statsSource = attacker.attributes ||
    attacker.stats || {
      str: 10,
      int: 10,
      luck: 10,
    };
  const stats =
    attacker && attacker.attributes
      ? getEffectiveAttributes(attacker, config)
      : statsSource;

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
  log.push({
    stage: "RAW",
    value: base,
    reason: "Base stat scaling + skill damage",
  });

  // Apply magnitude-based damage caps early in pipeline
  const attackerLevel = attacker.level || 1;
  const activeTalents = attacker.talents || [];
  let magnitudeCaps = null;

  // Check for magnitude-based talents
  for (const talentId of activeTalents) {
    const caps = getMagnitudeCaps(talentId, attackerLevel);
    if (caps && caps.damageCap > 0) {
      magnitudeCaps = caps;
      break; // Use the first magnitude talent found
    }
  }

  // Attacker multipliers
  let afterAttackers = base;
  const attackerReasons = [];
  const attackerTags = [];
  const defenderTags = [];

  // Aggregate tags
  if (skill?.tags) attackerTags.push(...skill.tags);
  if (attacker.race?.id)
    attackerTags.push(...getRaceEntityTags(attacker.race.id));
  if (defender.race?.id)
    defenderTags.push(...getRaceEntityTags(defender.race.id));
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
    attackerReasons.push(
      `Title: Skill Power +${Math.round(skillPower * 100)}%`,
    );
  }

  // Tag-based matchup bonuses (e.g., Holy vs Undead)
  if (attackerTags.includes("Holy_Damage") && defenderTags.includes("Undead")) {
    afterAttackers = Math.floor(afterAttackers * 2);
    attackerReasons.push("Bonus due to [Holy vs Undead]");
  }
  log.push({
    stage: "ATTACKER_MULTIPLIERS",
    value: afterAttackers,
    reason: attackerReasons.join("; ") || "None",
  });

  // Defender mitigation
  const defStatsSource = defender.attributes || defender.stats || { str: 10 };
  const defStats =
    defender && defender.attributes
      ? getEffectiveAttributes(defender, config)
      : defStatsSource;
  const defenseInput = Number(defender?.defense ?? defender?.stats?.defense);
  const defenseValue = Number.isFinite(defenseInput)
    ? defenseInput
    : Number(getAttributeValue(defStats, "strength") || 0);
  const defense = Math.floor(defenseValue * defenseReductionFactor);
  let afterMitigation = Math.max(1, afterAttackers - defense);
  const defReasons = [`Defense ${defense}`];
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
  log.push({
    stage: "DEFENDER_MITIGATION",
    value: afterMitigation,
    reason: defReasons.join("; "),
  });

  let final = Math.floor(afterMitigation);

  // Apply magnitude-based damage caps
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

export function executeSkill(attacker, defender, skillId, config = {}) {
  const skill = getSkillById(skillId);
  if (!skill) return { damage: 0, messages: ["Skill not found"] };

  const bypasses = resolveBypasses(attacker.talents || []);
  const cd = applyCooldownOverride(skill.cooldown || 0, bypasses);

  // Calculate mana cost using the new balance system
  const calculatedCost = calculateManaCost(skill, attacker.level || 1);
  const cost = applyCostOverride(calculatedCost, bypasses);

  // Validate and consume mana using the new system
  const consumption = consumeMana(skill, attacker, {
    showFeedback: false, // Feedback handled by UI
    scaleWithLevel: false, // Already scaled above
  });

  if (!consumption.success) {
    return {
      damage: 0,
      messages: [consumption.error || "Insufficient mana"],
      cooldown: 0,
      cost: 0,
      insufficientMana: true,
    };
  }

  // Update attacker's mana
  let updatedAttacker = { ...attacker };
  if (
    updatedAttacker.mana &&
    typeof updatedAttacker.mana.current === "number"
  ) {
    updatedAttacker.mana.current = consumption.remainingMana;
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
    remainingMana: consumption.remainingMana,
    updatedAttacker,
    updatedDefender,
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
