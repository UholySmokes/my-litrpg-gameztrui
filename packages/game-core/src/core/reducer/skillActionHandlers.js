import {
  canFuseSkills,
  fuseSkills,
} from "../../systems/skills/SkillFusionSystem.js";
import {
  canEvolveSkill,
  evolveSkill,
} from "../../systems/skills/SkillEvolutionSystem.js";
import {
  createStudiedSpell,
  improveStudiedSpell,
  isSpellSkill,
} from "../../systems/skills/SpellStudySystem.js";
import { appendSystemMessages } from "../narrativeLog.js";

export function handleSkillAction(state, action) {
  switch (action.type) {
    case "FUSE_SKILLS": {
      const skillAId = action.payload?.skillAId;
      const skillBId = action.payload?.skillBId;
      if (!skillAId || !skillBId || skillAId === skillBId) return state;
      const player = state.player || {};
      const abilities = Array.isArray(player.abilities) ? [...player.abilities] : [];
      const activeSkills = Array.isArray(player.activeSkills) ? [...player.activeSkills] : [];
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
      const abilities = Array.isArray(player.abilities) ? [...player.abilities] : [];
      const activeSkills = Array.isArray(player.activeSkills) ? [...player.activeSkills] : [];
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
      const abilities = Array.isArray(player.abilities) ? [...player.abilities] : [];
      const activeSkills = Array.isArray(player.activeSkills) ? [...player.activeSkills] : [];
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

    default:
      return null;
  }
}
