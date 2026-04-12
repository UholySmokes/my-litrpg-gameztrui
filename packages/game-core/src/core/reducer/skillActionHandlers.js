import { applySkillProgressionAction } from "../../systems/abilities/UnifiedAbilityEngine.js";

export function handleSkillAction(state, action) {
  return applySkillProgressionAction(state, action);
}
