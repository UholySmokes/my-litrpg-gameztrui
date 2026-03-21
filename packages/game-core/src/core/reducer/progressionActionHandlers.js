import { DataRegistry } from "../../data/DataRegistry.js";
import { performLevelUp } from "../../systems/leveling/LevelingManager.js";
import { toCanonicalAttributeKey } from "../../constants/attributes.js";
import {
  applyRaceEvolution,
  getRaceEvolutionOptions,
} from "../../data/registries/RaceDataRegistry.js";
import {
  buyPrestigeUpgrade,
  defaultPrestigeStats,
  performPrestigeReset,
  PRESTIGE_MIN_LEVEL,
} from "../../systems/PrestigeSystem";
import { updatePlayerVitals } from "../PlayerVitals.js";
import { applyAutoTitleUnlocks } from "../../systems/titles/TitleApplication.js";
import {
  getProgressionModifiers,
  isPlainObject,
  resolveClassEvolutionRequirement,
  toNumber,
} from "../../utils/shared.js";

export function handleProgressionAction(state, action, helpers) {
  const { meetsRequirements } = helpers;

  switch (action.type) {
    case "EVOLVE_CLASS": {
      const player = state.player || {};
      const classId = player.class?.id || player.class;
      if (!classId) return state;
      const evolutionOptions = DataRegistry.getClassEvolutionOptions(classId);
      if (!Array.isArray(evolutionOptions) || evolutionOptions.length === 0) {
        return state;
      }

      const requestedOptionId =
        action.payload?.evolutionId || action.payload?.targetClassId || null;
      const selectedOption = requestedOptionId
        ? DataRegistry.getClassEvolutionOption(classId, requestedOptionId)
        : evolutionOptions[0];
      if (!selectedOption?.targetId) return state;

      const nextClass = DataRegistry.getClassById(selectedOption.targetId);
      if (!nextClass) return state;

      const progress = isPlainObject(player.progress) ? player.progress : {};
      const evolutionCount = toNumber(progress.classEvolutions, 0);
      const progressionModifiers = getProgressionModifiers(player);
      const progressionLevelRequirement = resolveClassEvolutionRequirement(
        state.config,
        evolutionCount,
        progressionModifiers,
      );
      const mergedRequirements = {
        ...(selectedOption.requirements || {}),
        minLevel: Math.max(
          progressionLevelRequirement,
          toNumber(selectedOption.requirements?.minLevel, 1),
        ),
      };
      if (!meetsRequirements(mergedRequirements, state, player)) return state;

      const history = Array.isArray(progress.classEvolutionHistory)
        ? [...progress.classEvolutionHistory]
        : [];
      history.push({
        atLevel: player.level || 1,
        from: classId,
        to: nextClass.id,
        optionId: selectedOption.id,
      });

      return {
        ...state,
        player: {
          ...player,
          class: nextClass,
          progress: {
            ...progress,
            classEvolutions: evolutionCount + 1,
            lastClassEvolutionFrom: classId,
            lastClassEvolutionTo: nextClass.id,
            lastClassEvolutionAtLevel: player.level || 1,
            lastClassEvolutionOption: selectedOption.id,
            classEvolutionHistory: history.slice(-10),
          },
        },
      };
    }

    case "EVOLVE_RACE": {
      const player = state.player || {};
      if (!player.race) return state;

      const progress = isPlainObject(player.progress) ? player.progress : {};
      const stageFromProgress = toNumber(progress.raceEvolutionStage, NaN);
      const stageOverride = Number.isFinite(stageFromProgress) ? stageFromProgress : null;
      const evolutionOptions = getRaceEvolutionOptions(player.race, stageOverride);
      if (!Array.isArray(evolutionOptions) || evolutionOptions.length === 0) {
        return state;
      }

      const requestedOptionId = action.payload?.evolutionId || null;
      const selectedOption = requestedOptionId
        ? evolutionOptions.find(
            (option) =>
              option.id === requestedOptionId ||
              option.name.toLowerCase() ===
                String(requestedOptionId).trim().toLowerCase(),
          )
        : evolutionOptions[0];
      if (!selectedOption) return state;
      if (!meetsRequirements(selectedOption.requirements, state, player)) return state;

      const evolvedRace = applyRaceEvolution(player.race, selectedOption, stageOverride);
      if (!evolvedRace) return state;

      const attributes = {
        ...(player.attributes || {}),
      };
      Object.entries(selectedOption.statBonusesDelta || {}).forEach(
        ([rawKey, rawValue]) => {
          const canonical = toCanonicalAttributeKey(rawKey);
          if (!canonical) return;
          attributes[canonical] = toNumber(attributes[canonical], 0) + toNumber(rawValue, 0);
        },
      );

      const raceEvolutionHistory = Array.isArray(progress.raceEvolutionHistory)
        ? [...progress.raceEvolutionHistory]
        : [];
      raceEvolutionHistory.push({
        atLevel: player.level || 1,
        toStage: selectedOption.stage,
        toName: selectedOption.name,
        optionId: selectedOption.id,
      });

      return {
        ...state,
        player: updatePlayerVitals(
          {
            ...player,
            race: evolvedRace,
            attributes,
            progress: {
              ...progress,
              raceEvolutions: toNumber(progress.raceEvolutions, 0) + 1,
              raceEvolutionStage: selectedOption.stage,
              lastRaceEvolutionAtLevel: player.level || 1,
              lastRaceEvolutionName: selectedOption.name,
              raceEvolutionHistory: raceEvolutionHistory.slice(-10),
            },
          },
          state.config,
          attributes,
        ),
      };
    }

    case "PERFORM_PRESTIGE": {
      const player = state.player || {};
      if ((player.level || 1) < PRESTIGE_MIN_LEVEL) return state;
      const result = performPrestigeReset(player);
      if (!result) return state;

      const progress = isPlainObject(player.progress) ? player.progress : {};
      const prestigeHistory = Array.isArray(progress.prestigeHistory)
        ? [...progress.prestigeHistory]
        : [];
      prestigeHistory.push({
        atLevel: player.level || 1,
        prestigeLevel: result.prestige.prestigeLevel,
        shardsEarned: result.prestige.soulShards - (player.prestige?.soulShards ?? 0),
      });

      return {
        ...state,
        player: {
          ...player,
          level: result.level,
          xp: result.xp,
          prestige: result.prestige,
          progress: {
            ...progress,
            prestigeHistory: prestigeHistory.slice(-10),
          },
        },
      };
    }

    case "BUY_PRESTIGE_UPGRADE": {
      const player = state.player || {};
      const upgradeType = action.payload?.upgradeType;
      if (!upgradeType) return state;
      const prestige = player.prestige ?? defaultPrestigeStats();
      const nextPrestige = buyPrestigeUpgrade(prestige, upgradeType);
      if (!nextPrestige) return state;

      return {
        ...state,
        player: {
          ...player,
          prestige: nextPrestige,
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

    case "LEVEL_UP": {
      if (!state?.player?.xp) return state;

      let nextState = state;
      let leveledUp = false;

      while (
        nextState.player?.xp?.current >= nextState.player?.xp?.max &&
        nextState.player?.level < (nextState.config?.maxLevel ?? Infinity)
      ) {
        const previousLevel = nextState.player.level;
        nextState = performLevelUp(nextState);
        if (nextState.player.level === previousLevel) break;
        leveledUp = true;
      }

      return leveledUp ? applyAutoTitleUnlocks(nextState, { announce: true }) : state;
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
      return null;
  }
}
