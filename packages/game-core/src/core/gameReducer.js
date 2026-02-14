import { DataRegistry } from "../data/DataRegistry.js";
import { performLevelUp } from "../systems/leveling/LevelingManager.js";
import { toCanonicalAttributeKey } from "../constants/attributes.js";
import { calculateMaxHp, calculateMaxMana } from "../utils/AttributeMath.js";
import { normalizeGameState } from "./StateNormalizer.js";
import {
  getEffectiveAttributes,
  getAutoUnlockableTitles,
  canPurchaseTitle,
  getTitleById,
} from "./titleLogic.js";
import {
  playerAttack,
  playerUseClassAbility,
  playerUseRaceAbility,
  startCombat,
  escapeCombat,
  processEnemyTurns,
} from "../systems/combat/CombatSystem.js";
import { SimBridge } from "../simulation/bridge/SimulationContext.js";
import {
  canFuseSkills,
  fuseSkills,
} from "../systems/skills/SkillFusionSystem.js";
import {
  canEvolveSkill,
  evolveSkill,
} from "../systems/skills/SkillEvolutionSystem.js";
import {
  createStudiedSpell,
  improveStudiedSpell,
  isSpellSkill,
} from "../systems/skills/SpellStudySystem.js";
import { appendNarrativeEntry } from "./narrativeLog.js";
import { applyQuestRewards } from "./reducers/rewardSystem.js";
import { withTraceSpan } from "../observability/traceShim.js";
import { isPlainObject, toNumber, clamp, mergeInventoryItems } from "../utils/shared.js";

const ensureCombatStructure = (state) =>
  state.combat || {
    status: "inactive",
    turn: "player",
    enemies: [],
    log: [],
  };

const updatePlayerVitals = (player, config, attributesOverride) => {
  const effectiveAttributes = getEffectiveAttributes(
    player,
    config,
    attributesOverride,
  );
  const nextHpMax = calculateMaxHp(effectiveAttributes);
  const nextManaMax = calculateMaxMana(effectiveAttributes);

  const rawHp = player?.hp;
  const hp = isPlainObject(rawHp)
      ? rawHp
      : { current: toNumber(rawHp, nextHpMax), max: nextHpMax };
  const rawMana = player?.mana;
  const mana = isPlainObject(rawMana)
      ? rawMana
      : { current: toNumber(rawMana, nextManaMax), max: nextManaMax };

  return {
    ...player,
    hp: {
      ...hp,
      max: nextHpMax,
      current: clamp(toNumber(hp.current, nextHpMax), 0, nextHpMax),
    },
    mana: {
      ...mana,
      max: nextManaMax,
      current: clamp(toNumber(mana.current, nextManaMax), 0, nextManaMax),
    },
  };
};

const appendSystemMessages = (state, messages = []) => {
  if (!Array.isArray(messages) || messages.length === 0) return state;
  const timestamp = SimBridge.now();
  const filtered = messages.filter(
    (message) => typeof message === "string" && message.trim(),
  );
  if (filtered.length === 0) return state;

  let narrative = state.narrative || { entries: [], sequence: 0 };
  for (let i = 0; i < filtered.length; i++) {
    narrative = appendNarrativeEntry(narrative, {
      type: "system",
      text: filtered[i],
      timestamp: timestamp + i,
      source: "system",
    });
  }

  return {
    ...state,
    narrative,
  };
};

const applyAutoTitleUnlocks = (state, { announce = false } = {}) => {
  if (!state?.player) return state;
  const unlockable = getAutoUnlockableTitles(state);
  if (!Array.isArray(unlockable) || unlockable.length === 0) return state;

  const unlocked = new Set(
    (state.player.unlockedTitles || state.player.titles || []).filter(
      (id) => typeof id === "string" && id,
    ),
  );

  const newlyUnlocked = [];
  unlockable.forEach((title) => {
    if (!title?.id) return;
    if (unlocked.has(title.id)) return;
    unlocked.add(title.id);
    newlyUnlocked.push(title);
  });

  if (newlyUnlocked.length === 0) return state;

  const unlockedTitles = Array.from(unlocked);
  const player = updatePlayerVitals(
    {
      ...state.player,
      unlockedTitles,
      titles: unlockedTitles,
    },
    state.config,
  );

  const nextState = {
    ...state,
    player,
  };

  if (!announce) return nextState;
  return appendSystemMessages(
    nextState,
    newlyUnlocked.map((title) => `Unlocked title: ${title.name}`),
  );
};

const gameReducer = (state, action) =>
  withTraceSpan(
    "core.gameReducer",
    {
      "game.action.type": action?.type ? String(action.type) : "unknown",
    },
    () => {
      switch (action.type) {
    case "UPDATE_STATE":
      return normalizeGameState({
        ...state,
        ...(action.payload || {}),
      });

    case "SYNC_STATE":
      return normalizeGameState(action.payload || state);

    case "SET_STATE":
      if (typeof action.payload === "function") {
        return normalizeGameState(action.payload(state));
      }
      return normalizeGameState(action.payload);

    case "APPLY_ENGINE_RESULT": {
      // Two-tier dispatch: applies a StepResult from SystemEngine.step()
      const result = action.payload;
      if (!result || !result.ok || !result.nextState) return state;
      const engineState = normalizeGameState(result.nextState);
      // Optionally append a narrative entry for the step summary
      if (result.summary) {
        const narrativeWithSummary = appendNarrativeEntry(
          engineState.narrative,
          {
            type: "action",
            text: result.summary,
            timestamp: SimBridge.now(),
            source: "engine",
          },
        );
        return { ...engineState, narrative: narrativeWithSummary };
      }
      return engineState;
    }

    case "ADD_SYSTEM_MESSAGE": {
      const { message, type = "system" } = action.payload;
      const nextNarrative = appendNarrativeEntry(state.narrative, {
        type,
        text: message,
        timestamp: SimBridge.now(),
        source: "system",
      });
      return {
        ...state,
        narrative: nextNarrative,
        chatLog: [
          ...(state.chatLog || []),
          {
            type,
            text: message,
            timestamp: SimBridge.now(),
          },
        ].slice(-100), // Keep last 100 messages
      };
    }

    case "APPEND_SIMULATION_LOG": {
      const incoming = Array.isArray(action.payload?.entries)
        ? action.payload.entries
        : [];

      if (incoming.length === 0) {
        return state;
      }

      const now = SimBridge.now();
      const normalizedEntries = incoming
        .filter(
          (entry) =>
            entry && typeof entry.text === "string" && entry.text.trim(),
        )
        .map((entry, index) => ({
          id: entry.id || `sim_evt_${now}_${index}`,
          tick: entry.tick,
          timestamp: entry.timestamp ?? now + index,
          type: entry.type || "Event",
          text: entry.text.trim(),
          details: entry.details,
        }));

      if (normalizedEntries.length === 0) {
        return state;
      }

      const combatState = ensureCombatStructure(state);
      const updatedCombat = {
        ...combatState,
        log: [...(combatState.log || []), ...normalizedEntries].slice(-200),
      };

      const combatChatEntries = normalizedEntries.map((entry) => ({
        type: "combat",
        text: entry.text,
        timestamp: entry.timestamp,
      }));

      return {
        ...state,
        combat: {
          ...state.combat,
          ...updatedCombat,
        },
        chatLog: [...(state.chatLog || []), ...combatChatEntries].slice(-100),
      };
    }

    case "ADD_XP": {
      const currentXp = toNumber(
        state.player.xp?.current ?? state.player.xp,
        0,
      );
      const nextXp = currentXp + action.payload;

      return {
        ...state,
        player: {
          ...state.player,
          xp: isPlainObject(state.player.xp)
              ? { ...state.player.xp, current: nextXp }
              : nextXp,
        },
      };
    }

    case "COMPLETE_QUEST":
      if (!action.payload?.questId) {
        return state;
      }
      const { questId, reward, questMeta } = action.payload;
      const nextState = {
        ...state,
        quests: {
          ...state.quests,
          active: state.quests.active.filter((q) => q.id !== questId),
          completed: [
            ...state.quests.completed,
            {
              id: questId,
              date: SimBridge.now(),
              ...(questMeta ? { meta: questMeta } : {}),
            },
          ],
        },
      };
      return applyAutoTitleUnlocks(
        applyQuestRewards(nextState, reward, { updatePlayerVitals }),
        {
          announce: true,
        },
      );

    case "UPDATE_RESOURCES": {
      const current = state.player.resources || {};
      const updated = { ...current };

      Object.entries(action.payload).forEach(([key, delta]) => {
        if (!Number.isFinite(delta)) return;
        const currentValue = toNumber(current[key], 0);
        const maxValue = 100; // Default max; could be per-resource config later
        updated[key] = clamp(currentValue + delta, 0, maxValue);
      });

      return {
        ...state,
        player: {
          ...state.player,
          resources: updated,
        },
      };
    }

    case "EQUIP_ITEM": {
      const { slot, item } = action.payload;
      const equipment = { ...(state.player.equipment || {}) };
      const inventory = [...(state.player.inventory || [])];

      // Remove equipped item and return to inventory
      if (equipment[slot]) {
        const prevItem = equipment[slot];
        const existingIndex = inventory.findIndex((i) => i.id === prevItem.id);
        if (existingIndex >= 0) {
          inventory[existingIndex] = {
            ...inventory[existingIndex],
            quantity: (inventory[existingIndex].quantity || 1) + 1,
          };
        } else {
          inventory.push({ ...prevItem, quantity: 1 });
        }
      }

      // Remove new item from inventory
      const itemIndex = inventory.findIndex((i) => i.id === item.id);
      if (itemIndex >= 0) {
        if (inventory[itemIndex].quantity > 1) {
          inventory[itemIndex] = {
            ...inventory[itemIndex],
            quantity: inventory[itemIndex].quantity - 1,
          };
        } else {
          inventory.splice(itemIndex, 1);
        }
      }

      equipment[slot] = item;

      return {
        ...state,
        player: {
          ...state.player,
          equipment,
          inventory,
        },
      };
    }

    case "UNEQUIP_ITEM": {
      const slot = action.payload?.slot;
      if (!slot || !state.player) return state;
      const equipment = { ...(state.player.equipment || {}) };
      const inventory = [...(state.player.inventory || [])];
      const unequipped = equipment[slot];
      if (!unequipped) return state;

      delete equipment[slot];
      const quantity = toNumber(unequipped.quantity, 1);
      const nextInventory = mergeInventoryItems(inventory, [
        { ...unequipped, quantity },
      ]);

      return {
        ...state,
        player: {
          ...state.player,
          equipment,
          inventory: nextInventory,
        },
      };
    }

    case "PLAYER_ATTACK": {
      const enemyIndex = action.payload?.enemyIndex ?? 0;
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") {
        return state;
      }
      const result = playerAttack(
        { ...state, combat: combatState },
        enemyIndex,
      );
      if (!result.success) {
        return state;
      }
      return applyAutoTitleUnlocks(processEnemyTurns(result.state), {
        announce: true,
      });
    }

    case "PLAYER_USE_SKILL": {
      const { skillId, enemyIndex = 0 } = action.payload || {};
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") {
        return state;
      }
      const result = playerAttack(
        { ...state, combat: combatState },
        enemyIndex,
        skillId,
      );
      if (!result.success) {
        return state;
      }
      return applyAutoTitleUnlocks(processEnemyTurns(result.state), {
        announce: true,
      });
    }

    case "PLAYER_USE_CLASS_ABILITY": {
      const { abilityId, enemyIndex = 0 } = action.payload || {};
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") {
        return state;
      }
      const result = playerUseClassAbility(
        { ...state, combat: combatState },
        enemyIndex,
        abilityId,
      );
      if (!result.success) {
        return state;
      }
      return applyAutoTitleUnlocks(processEnemyTurns(result.state), {
        announce: true,
      });
    }

    case "PLAYER_USE_RACE_ABILITY": {
      const { abilityId, enemyIndex = 0 } = action.payload || {};
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") {
        return state;
      }
      const result = playerUseRaceAbility(
        { ...state, combat: combatState },
        enemyIndex,
        abilityId,
      );
      if (!result.success) {
        return state;
      }
      return applyAutoTitleUnlocks(processEnemyTurns(result.state), {
        announce: true,
      });
    }

    case "PLAYER_ESCAPE": {
      const combatState = ensureCombatStructure(state);
      if (combatState.status !== "active") {
        return state;
      }
      const result = escapeCombat({ ...state, combat: combatState });
      return result.state || state;
    }

    case "PLAYER_START_COMBAT": {
      const enemyIds = action.payload?.enemyIds || [];
      return startCombat(state, enemyIds);
    }

    case "CRAFT_ITEM": {
      const recipe = action.payload?.recipe;
      if (!recipe || !state.player) return state;
      const inventory = [...(state.player.inventory || [])];
      const hasIngredients = recipe.ingredients.every((ingredient) => {
        const existing = inventory.find((item) => item.id === ingredient.id);
        return existing && existing.quantity >= ingredient.count;
      });
      if (!hasIngredients) return state;

      recipe.ingredients.forEach((ingredient) => {
        const index = inventory.findIndex((item) => item.id === ingredient.id);
        if (index === -1) return;
        const item = inventory[index];
        if (item.quantity > ingredient.count) {
          inventory[index] = {
            ...item,
            quantity: item.quantity - ingredient.count,
          };
        } else {
          inventory.splice(index, 1);
        }
      });

      const craftedItem = {
        ...recipe.result,
        quantity: toNumber(recipe.result?.count ?? recipe.result?.quantity, 1),
      };
      const nextInventory = mergeInventoryItems(inventory, [craftedItem]);

      return {
        ...state,
        player: {
          ...state.player,
          inventory: nextInventory,
        },
      };
    }

    case "FUSE_SKILLS": {
      const skillAId = action.payload?.skillAId;
      const skillBId = action.payload?.skillBId;
      if (!skillAId || !skillBId || skillAId === skillBId) return state;
      const player = state.player || {};
      const abilities = Array.isArray(player.abilities)
        ? [...player.abilities]
        : [];
      const activeSkills = Array.isArray(player.activeSkills)
        ? [...player.activeSkills]
        : [];
      const passiveSkills = Array.isArray(player.passiveSkills)
        ? [...player.passiveSkills]
        : [];
      const allSkills = [...abilities, ...activeSkills, ...passiveSkills];
      const skillA = allSkills.find((skill) => skill?.id === skillAId);
      const skillB = allSkills.find((skill) => skill?.id === skillBId);
      if (!canFuseSkills(skillA, skillB)) return state;
      const existingIds = new Set(allSkills.map((skill) => skill?.id));
      const fused = fuseSkills(skillA, skillB, { existingIds });
      if (!fused) return state;

      const removeIds = new Set([skillAId, skillBId]);
      const nextAbilities = abilities.filter((skill) => !removeIds.has(skill.id));
      const nextActive = activeSkills.filter((skill) => !removeIds.has(skill.id));
      const nextPassive = passiveSkills.filter((skill) => !removeIds.has(skill.id));

      if (fused.type === "passive") {
        nextPassive.push(fused);
      } else {
        nextActive.push(fused);
      }
      nextAbilities.push(fused);

      return {
        ...state,
        player: {
          ...player,
          abilities: nextAbilities,
          activeSkills: nextActive,
          passiveSkills: nextPassive,
        },
      };
    }

    case "EVOLVE_SKILL": {
      const skillId = action.payload?.skillId;
      if (!skillId) return state;
      const player = state.player || {};
      const abilities = Array.isArray(player.abilities)
        ? [...player.abilities]
        : [];
      const activeSkills = Array.isArray(player.activeSkills)
        ? [...player.activeSkills]
        : [];
      const passiveSkills = Array.isArray(player.passiveSkills)
        ? [...player.passiveSkills]
        : [];
      const allSkills = [...abilities, ...activeSkills, ...passiveSkills];
      const skill = allSkills.find((entry) => entry?.id === skillId);
      if (!canEvolveSkill(skill)) return state;
      const existingIds = new Set(allSkills.map((entry) => entry?.id));
      const evolved = evolveSkill(skill, { existingIds });
      if (!evolved) return state;

      const nextAbilities = abilities.filter((entry) => entry.id !== skillId);
      const nextActive = activeSkills.filter((entry) => entry.id !== skillId);
      const nextPassive = passiveSkills.filter((entry) => entry.id !== skillId);

      if (evolved.type === "passive") {
        nextPassive.push(evolved);
      } else {
        nextActive.push(evolved);
      }
      nextAbilities.push(evolved);

      return {
        ...state,
        player: {
          ...player,
          abilities: nextAbilities,
          activeSkills: nextActive,
          passiveSkills: nextPassive,
        },
      };
    }

    case "STUDY_SPELL": {
      const player = state.player || {};
      const abilities = Array.isArray(player.abilities)
        ? [...player.abilities]
        : [];
      const activeSkills = Array.isArray(player.activeSkills)
        ? [...player.activeSkills]
        : [];
      const passiveSkills = Array.isArray(player.passiveSkills)
        ? [...player.passiveSkills]
        : [];
      const allSkills = [...abilities, ...activeSkills, ...passiveSkills];
      const existingIds = new Set(allSkills.map((entry) => entry?.id));

      const mode = action.payload?.mode || "create";
      if (mode === "improve") {
        const skillId = action.payload?.skillId;
        if (!skillId) return state;
        const skill = allSkills.find((entry) => entry?.id === skillId);
        if (!skill || !isSpellSkill(skill)) return state;
        const evolved = improveStudiedSpell(skill, { existingIds });
        if (!evolved) return state;

        const nextAbilities = abilities.filter((entry) => entry.id !== skillId);
        const nextActive = activeSkills.filter((entry) => entry.id !== skillId);
        const nextPassive = passiveSkills.filter((entry) => entry.id !== skillId);

        if (evolved.type === "passive") {
          nextPassive.push(evolved);
        } else {
          nextActive.push(evolved);
        }
        nextAbilities.push(evolved);

        const nextState = {
          ...state,
          player: {
            ...player,
            abilities: nextAbilities,
            activeSkills: nextActive,
            passiveSkills: nextPassive,
          },
        };
        return appendSystemMessages(nextState, [
          `Study complete: ${evolved.name} improved.`,
        ]);
      }

      const created = createStudiedSpell({
        level: player.level || 1,
        existingIds,
      });
      if (!created) return state;

      const nextAbilities = [...abilities, created];
      const nextActive = [...activeSkills];
      const nextPassive = [...passiveSkills];
      if (created.type === "passive") {
        nextPassive.push(created);
      } else {
        nextActive.push(created);
      }

      const nextState = {
        ...state,
        player: {
          ...player,
          abilities: nextAbilities,
          activeSkills: nextActive,
          passiveSkills: nextPassive,
        },
      };
      return appendSystemMessages(nextState, [
        `Study complete: learned ${created.name}.`,
      ]);
    }

    case "EVOLVE_CLASS": {
      const player = state.player || {};
      const classId = player.class?.id || player.class;
      if (!classId) return state;
      const classData = DataRegistry.getClassById(classId);
      if (!classData?.upgradePath) return state;
      const requiredLevel = state.config?.classEvolutionLevel ?? 10;
      if ((player.level || 1) < requiredLevel) return state;
      const nextClass = DataRegistry.getClassById(classData.upgradePath);
      if (!nextClass) return state;
      return {
        ...state,
        player: {
          ...player,
          class: nextClass,
        },
      };
    }

    case "AWARD_PROFESSION_XP": {
      const { professionId, xp = 0 } = action.payload || {};
      if (!state.player || !professionId || xp <= 0) return state;
      const professions = { ...(state.player.professions || {}) };
      const currentXp = professions[professionId]?.xp || 0;
      professions[professionId] = {
        xp: currentXp + xp,
      };
      return {
        ...state,
        player: {
          ...state.player,
          professions,
        },
      };
    }

    case "GACHA_PULL": {
      const { cost = {}, results = [] } = action.payload || {};
      const goldCost = toNumber(cost.goldCoins, 0);
      const soulCost = toNumber(cost.soulpoints, 0);

      const currentGold = toNumber(state.player.gold, 0);
      const currentSoul = toNumber(
        state.player.currency?.soulpoints ?? state.player.soulpoints,
        0,
      );

      if (currentGold < goldCost || currentSoul < soulCost) {
        return state;
      }

      const rewardItems = results
        .filter((reward) => reward && (reward.itemData || reward.id))
        .map((reward) => {
          const base = reward.itemData || {};
          const id = base.id || reward.id;
          return {
            ...base,
            id,
            name: reward.name || base.name || id,
            quantity: 1,
            rarity: reward.rarity || base.rarity,
          };
        });

      const equipmentState = { ...(state.player.equipment || {}) };
      const inventoryRewards = [];

      rewardItems.forEach((item) => {
        if (
          item.type === "equipment" &&
          item.equipSlot &&
          !equipmentState[item.equipSlot]
        ) {
          equipmentState[item.equipSlot] = item;
        } else {
          inventoryRewards.push(item);
        }
      });

      const nextInventory = mergeInventoryItems(
        state.player.inventory,
        inventoryRewards,
      );

      const nextSoul = currentSoul - soulCost;
      const progress = isPlainObject(state.player.progress)
          ? state.player.progress
          : {};
      const pullCount = Array.isArray(results) ? results.length : 0;

      const nextState = {
        ...state,
        player: {
          ...state.player,
          gold: currentGold - goldCost,
          soulpoints:
            state.player.soulpoints !== undefined
              ? toNumber(state.player.soulpoints, 0) - soulCost
              : state.player.soulpoints,
          currency: {
            ...(state.player.currency || {}),
            goldCoins: currentGold - goldCost,
            soulpoints: nextSoul,
          },
          inventory: nextInventory,
          equipment: equipmentState,
          progress: {
            ...progress,
            gachaPulls: toNumber(progress.gachaPulls, 0) + pullCount,
          },
        },
      };

      return applyAutoTitleUnlocks(nextState, { announce: true });
    }

    case "PURCHASE_TITLE": {
      const titleId = action.payload?.titleId;
      if (!titleId || !state.player) return state;

      const title = getTitleById(titleId);
      if (!title) return state;
      if (!canPurchaseTitle(title, state)) return state;

      const unlocked = new Set(
        (state.player.unlockedTitles || state.player.titles || []).filter(
          (id) => typeof id === "string" && id,
        ),
      );

      const cost = title.unlockConditions.purchase || {};
      const goldCost = toNumber(cost.goldCoins, 0);
      const soulCost = toNumber(cost.soulpoints, 0);

      const currentGold = toNumber(
        state.player.currency?.goldCoins ?? state.player.gold,
        0,
      );
      const currentSoul = toNumber(
        state.player.currency?.soulpoints ?? state.player.soulpoints,
        0,
      );

      if (currentGold < goldCost || currentSoul < soulCost) {
        return state;
      }

      const nextGold = currentGold - goldCost;
      const nextSoul = currentSoul - soulCost;
      unlocked.add(titleId);
      const unlockedTitles = Array.from(unlocked);

      const updatedPlayer = updatePlayerVitals(
        {
          ...state.player,
          gold: nextGold,
          soulpoints: nextSoul,
          currency: {
            ...(state.player.currency || {}),
            goldCoins: nextGold,
            soulpoints: nextSoul,
          },
          titles: unlockedTitles,
          unlockedTitles,
        },
        state.config,
      );

      return {
        ...state,
        player: updatedPlayer,
      };
    }

    case "EQUIP_TITLE": {
      const titleId = action.payload?.titleId;
      if (!titleId || !state.player) return state;

      const unlockedIds =
        state.player.unlockedTitles || state.player.titles || [];
      if (!Array.isArray(unlockedIds) || !unlockedIds.includes(titleId)) {
        return state;
      }

      return {
        ...state,
        player: updatePlayerVitals(
          {
            ...state.player,
            equippedTitle: titleId,
          },
          state.config,
        ),
      };
    }

    case "UNEQUIP_TITLE": {
      if (!state.player?.equippedTitle) return state;
      return {
        ...state,
        player: updatePlayerVitals(
          {
            ...state.player,
            equippedTitle: null,
          },
          state.config,
        ),
      };
    }

    case "LEVEL_UP": {
      if (!state?.player?.xp) {
        return state;
      }

      let nextState = state;
      let leveledUp = false;

      while (
        nextState.player?.xp?.current >= nextState.player?.xp?.max &&
        nextState.player?.level < (nextState.config?.maxLevel ?? Infinity)
      ) {
        const previousLevel = nextState.player.level;
        nextState = performLevelUp(nextState);
        if (nextState.player.level === previousLevel) {
          break; // Prevent infinite loop if performLevelUp no-ops (e.g., already at cap)
        }
        leveledUp = true;
      }

      return leveledUp
        ? applyAutoTitleUnlocks(nextState, { announce: true })
        : state;
    }

    case "ALLOCATE_ATTRIBUTE_POINT": {
      const attributeKey = toCanonicalAttributeKey(action.payload?.attribute);
      if (!attributeKey) return state;

      const player = state.player || {};
      const attributes = { ...(player.attributes || {}) };
      const freePoints = toNumber(attributes.freePoints, 0);
      if (freePoints <= 0) return state;

      const attributeInvestments = { ...(player.attributeInvestments || {}) };
      attributes[attributeKey] = toNumber(attributes[attributeKey], 0) + 1;
      attributes.freePoints = freePoints - 1;
      attributeInvestments[attributeKey] =
        toNumber(attributeInvestments[attributeKey], 0) + 1;
      return {
        ...state,
        player: updatePlayerVitals(
          {
            ...player,
            attributes,
            attributeInvestments,
          },
          state.config,
          attributes,
        ),
      };
    }

    case "DEALLOCATE_ATTRIBUTE_POINT": {
      const attributeKey = toCanonicalAttributeKey(action.payload?.attribute);
      if (!attributeKey) return state;

      const player = state.player || {};
      const attributes = { ...(player.attributes || {}) };
      const attributeInvestments = { ...(player.attributeInvestments || {}) };
      const invested = toNumber(attributeInvestments[attributeKey], 0);
      if (invested <= 0) return state;

      const currentValue = toNumber(attributes[attributeKey], 0);
      const freePoints = toNumber(attributes.freePoints, 0);

      attributes[attributeKey] = Math.max(0, currentValue - 1);
      attributes.freePoints = freePoints + 1;
      const nextInvested = invested - 1;
      if (nextInvested > 0) {
        attributeInvestments[attributeKey] = nextInvested;
      } else {
        delete attributeInvestments[attributeKey];
      }
      return {
        ...state,
        player: updatePlayerVitals(
          {
            ...player,
            attributes,
            attributeInvestments,
          },
          state.config,
          attributes,
        ),
      };
    }

        default:
          return state;
      }
    },
  );

export { gameReducer };
