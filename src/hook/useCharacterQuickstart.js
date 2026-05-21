import {useCallback, useState} from "react";
import {useCharacterCreationReworked} from "./useCharacterCreationReworked.js";
import {CANONICAL_ATTRIBUTES, ensureAttributeShape, toCanonicalAttributeKey} from "../constants/attributes.js";

const QUICK_STEPS = Object.freeze({
  NAME: 1,
  RACE: 2,
  CLASS: 3,
  OATH: 4,
  REVIEW: 5,
});

function distributeAttributesEvenly(attributePoints, _selectedRace, _selectedClass) {
  const base = ensureAttributeShape(attributePoints, 5);
  const totalPoints = CANONICAL_ATTRIBUTES.reduce((sum, key) => sum + (base[key] ?? 5), 0);
  const targetTotal = CANONICAL_ATTRIBUTES.length * 5 + 15;
  const remaining = targetTotal - totalPoints;
  if (remaining <= 0) return base;
  const perAttribute = Math.floor(remaining / CANONICAL_ATTRIBUTES.length);
  let extra = remaining - perAttribute * CANONICAL_ATTRIBUTES.length;
  const result = {...base};
  for (const key of CANONICAL_ATTRIBUTES) {
    result[key] = (result[key] ?? 5) + perAttribute;
  }
  for (const key of CANONICAL_ATTRIBUTES) {
    if (extra <= 0) break;
    result[key] = (result[key] ?? 5) + 1;
    extra--;
  }
  return result;
}

export function useCharacterQuickstart({advancedUnlocked = false} = {}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const full = useCharacterCreationReworked({advancedUnlocked: showAdvanced || advancedUnlocked});
  const [quickStep, setQuickStep] = useState(QUICK_STEPS.NAME);

  const autoAssignDefaults = useCallback(() => {
    const archetype = full.availableArchetypeSystems?.[0];
    if (archetype && !full.selectedArchetypeSystem) {
      full.handleArchetypeSystemSelect(archetype);
    }
    const prof = full.availableProfessions?.[0];
    if (prof && !full.selectedProfession) {
      full.handleProfessionSelect(prof);
    }
    const loadout = full.availableCreationSkillLoadouts?.[0];
    if (loadout && !full.selectedSkillLoadoutId) {
      full.handleSkillLoadoutSelect(loadout.id);
    }
    if (!full.selectedAlignmentId) {
      full.handleAlignmentSelect("true_neutral");
    }
    const balanced = distributeAttributesEvenly(
      full.attributePoints,
      full.selectedRace,
      full.selectedClass,
    );
    if (JSON.stringify(balanced) !== JSON.stringify(full.attributePoints)) {
      for (const key of CANONICAL_ATTRIBUTES) {
        const canonicalKey = toCanonicalAttributeKey(key);
        if (!canonicalKey) continue;
        const diff = (balanced[canonicalKey] ?? 5) - (full.attributePoints[canonicalKey] ?? 5);
        if (diff > 0) {
          for (let i = 0; i < diff; i++) full.allocateAttributePoint(canonicalKey);
        }
      }
    }
  }, [full]);

  const toggleAdvanced = useCallback(() => {
    setShowAdvanced((prev) => !prev);
  }, []);

  const quickNext = useCallback(() => {
    switch (quickStep) {
      case QUICK_STEPS.NAME:
        if (!full.name.trim()) return {valid: false, error: "Name is required"};
        break;
      case QUICK_STEPS.RACE:
        if (!full.selectedRace) return {valid: false, error: "Race is required"};
        break;
      case QUICK_STEPS.CLASS:
        if (!full.selectedClass) return {valid: false, error: "Class is required"};
        autoAssignDefaults();
        break;
      case QUICK_STEPS.OATH:
        if (!full.startingPrompt.trim()) return {valid: false, error: "Oath is required"};
        break;
    }
    setQuickStep((prev) => Math.min(QUICK_STEPS.REVIEW, prev + 1));
    return {valid: true};
  }, [quickStep, full, autoAssignDefaults]);

  const quickPrev = useCallback(() => {
    setQuickStep((prev) => Math.max(QUICK_STEPS.NAME, prev - 1));
  }, []);

  const quickFinalize = useCallback(() => {
    autoAssignDefaults();
    return full.finalizeCharacter();
  }, [full, autoAssignDefaults]);

  return {
    quickStep,
    QUICK_STEPS,
    showAdvanced,
    toggleAdvanced,
    quickNext,
    quickPrev,
    quickFinalize,
    full,
    canProceed: full.name.trim().length > 0 && (quickStep !== QUICK_STEPS.RACE || full.selectedRace) && (quickStep !== QUICK_STEPS.CLASS || full.selectedClass),
  };
}
