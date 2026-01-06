// =================================================================
// USE CHARACTER CREATION HOOK
// Manages character creation state and logic
// =================================================================

import { useState, useCallback } from 'react';
import { getRandomTalents, getRaceById, getClassById, getSkillsByClass, getSkillById } from '../entities/Player.js';

export const INITIAL_FREE_POINTS = 15;

export function useCharacterCreation() {
  const [currentStep, setCurrentStep] = useState(1); // 1 = Identity, 2 = Attributes
  const [showBootSequence, setShowBootSequence] = useState(true);
  
  // Step 1: Identity & Origin
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [currentTalents, setCurrentTalents] = useState([]);
  const [selectedActiveSkill, setSelectedActiveSkill] = useState(null);
  const [selectedPassiveSkills, setSelectedPassiveSkills] = useState([]);
  
  // Step 2: Attribute Allocation
  const [attributePoints, setAttributePoints] = useState({
    str: 5,
    agi: 5,
    dex: 5,
    int: 5,
    cha: 5,
    will: 5,
    luck: 5,
    soul: 5
  });

  // Calculate remaining points dynamically to prevent state desync
  const totalAllocated = Object.values(attributePoints).reduce((sum, val) => sum + val, 0);
  const basePoints = 8 * 5; // 8 attributes * 5 base value
  const remainingPoints = INITIAL_FREE_POINTS - (totalAllocated - basePoints);

  // Initialize talents on mount
  const initializeTalents = useCallback(() => {
    if (currentTalents.length === 0) {
      setCurrentTalents(getRandomTalents(3));
    }
  }, [currentTalents.length]);

  // Reroll talents
  const rerollTalents = useCallback(() => {
    setCurrentTalents(getRandomTalents(3));
    setSelectedTalent(null); // Clear selection when rerolling
  }, []);

  // Handle race selection
  const handleRaceSelect = useCallback((raceId) => {
    const race = getRaceById(raceId);
    setSelectedRace(race);
  }, []);

  // Handle class selection
  const handleClassSelect = useCallback((classId) => {
    const classData = getClassById(classId);
    setSelectedClass(classData);
    
    // Load skills for this class
    const skills = getSkillsByClass(classId);
    if (skills.active.length > 0) {
      setSelectedActiveSkill(skills.active[0]);
    }
    // Clear passive skills selection when changing class - user must manually select
    setSelectedPassiveSkills([]);
  }, []);

  // Handle talent selection
  const handleTalentSelect = useCallback((talentId) => {
    const talent = currentTalents.find(t => t.id === talentId);
    setSelectedTalent(talent);
  }, [currentTalents]);

  // Handle active skill selection
  const handleActiveSkillSelect = useCallback((skillId) => {
    if (!selectedClass) return;
    const skill = getSkillById(skillId);
    setSelectedActiveSkill(skill);
  }, [selectedClass]);

  // Handle passive skill selection (toggle)
  const handlePassiveSkillToggle = useCallback((skillId) => {
    if (!selectedClass) return;
    const skill = getSkillById(skillId);
    if (!skill) {
      return;
    }
    
    setSelectedPassiveSkills(prev => {
      const exists = prev.find(s => s.id === skillId);
      if (exists) {
        // Remove if already selected
        const newState = prev.filter(s => s.id !== skillId);
        return newState;
      } else {
        // Add if not selected (max 3)
        if (prev.length >= 3) {
          return prev; // Can't add more
        }
        const newState = [...prev, skill];
        return newState;
      }
    });
  }, [selectedClass]);

  // Handle attribute point allocation
  const allocateAttributePoint = useCallback((attribute) => {
    // We need to calculate if we can add based on current state
    setAttributePoints(prev => {
      const currentTotal = Object.values(prev).reduce((a, b) => a + b, 0);
      const currentRemaining = INITIAL_FREE_POINTS - (currentTotal - (8 * 5));
      
      // Safety check: Don't allocate if no points left
      if (currentRemaining <= 0) return prev;
      
      return {
        ...prev,
        [attribute]: prev[attribute] + 1
      };
    });
  }, []);

  const deallocateAttributePoint = useCallback((attribute) => {
    setAttributePoints(prev => {
      // Safety check: Don't go below base 5
      if (prev[attribute] <= 5) return prev;
      
      return {
        ...prev,
        [attribute]: prev[attribute] - 1
      };
    });
  }, []);

  // Validation
  const validateStep1 = useCallback(() => {
    console.log("Validating Step 1...");
    if (!name.trim()) { console.log("Validation Failed: Name"); return { valid: false, error: 'Name is required' }; }
    if (!gender) { console.log("Validation Failed: Gender"); return { valid: false, error: 'Gender is required' }; }
    if (!selectedRace) { console.log("Validation Failed: Race"); return { valid: false, error: 'Race is required' }; }
    if (!selectedClass) { console.log("Validation Failed: Class"); return { valid: false, error: 'Class is required' }; }
    if (!selectedTalent) { console.log("Validation Failed: Talent"); return { valid: false, error: 'Talent is required' }; }
    if (!selectedActiveSkill) { console.log("Validation Failed: Active Skill"); return { valid: false, error: 'Active skill is required' }; }
    if (selectedPassiveSkills.length !== 3) { 
      console.log(`Validation Failed: Passive Skills (Count: ${selectedPassiveSkills.length})`); 
      return { valid: false, error: `Must select exactly 3 passive skills (Selected: ${selectedPassiveSkills.length})` }; 
    }
    
    console.log("Validation Passed");
    return { valid: true };
  }, [name, gender, selectedRace, selectedClass, selectedTalent, selectedActiveSkill, selectedPassiveSkills]);

  const validateStep2 = useCallback(() => {
    if (remainingPoints !== 0) {
      return { valid: false, error: `Must allocate all ${INITIAL_FREE_POINTS} attribute points` };
    }
    return { valid: true };
  }, [remainingPoints]);

  // Finalize character creation
  const finalizeCharacter = useCallback(() => {
    const validation = validateStep2();
    if (!validation.valid) {
      return validation;
    }

    // Apply race stat bonuses
    const finalAttributes = { ...attributePoints };
    if (selectedRace?.statBonuses) {
      Object.keys(selectedRace.statBonuses).forEach(attr => {
        finalAttributes[attr] += selectedRace.statBonuses[attr];
      });
    }

    // Build abilities array with new skill structure
    const abilities = [];
    if (selectedActiveSkill) {
      abilities.push({
        id: selectedActiveSkill.id,
        name: selectedActiveSkill.name,
        type: 'active',
        level: 1,
        class: selectedClass.id,
        source: 'class',
        description: selectedActiveSkill.description,
        canUpgrade: true,
        canEvolve: false,
        canFuse: false
      });
    }
    selectedPassiveSkills.forEach((skill, index) => {
      if (!skill || !skill.id) {
        return;
      }
      abilities.push({
        id: skill.id,
        name: skill.name,
        type: 'passive',
        level: 1,
        class: selectedClass.id,
        source: 'class',
        description: skill.description,
        canUpgrade: true,
        canEvolve: false,
        canFuse: false
      });
    });

    return {
      valid: true,
      characterData: {
        name: name.trim(),
        gender,
        race: selectedRace.id,
        evolutionStage: selectedRace.evolutionStage,
        class: selectedClass.id,
        talent: selectedTalent.id,
        attributes: finalAttributes,
        abilities
      }
    };
  }, [name, gender, selectedRace, selectedClass, selectedTalent, attributePoints, selectedActiveSkill, selectedPassiveSkills, validateStep2]);

  // Navigation
  const nextStep = useCallback(() => {
    if (currentStep === 1) {
      const validation = validateStep1();
      if (!validation.valid) {
        return validation;
      }
      setCurrentStep(2);
      return { valid: true };
    }
    return { valid: false, error: 'Already on final step' };
  }, [currentStep, validateStep1]);

  const previousStep = useCallback(() => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  }, [currentStep]);

  const skipBootSequence = useCallback(() => {
    setShowBootSequence(false);
    initializeTalents();
  }, [initializeTalents]);

  return {
    // State
    currentStep,
    showBootSequence,
    name,
    gender,
    selectedRace,
    selectedClass,
    selectedTalent,
    currentTalents,
    selectedActiveSkill,
    selectedPassiveSkills,
    attributePoints,
    remainingPoints,
    
    // Actions
    setName,
    setGender,
    handleRaceSelect,
    handleClassSelect,
    handleTalentSelect,
    rerollTalents,
    handleActiveSkillSelect,
    handlePassiveSkillToggle,
    allocateAttributePoint,
    deallocateAttributePoint,
    nextStep,
    previousStep,
    finalizeCharacter,
    skipBootSequence,
    initializeTalents,
    
    // Validation
    validateStep1,
    validateStep2
  };
}
