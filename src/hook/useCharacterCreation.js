// =================================================================
// USE CHARACTER CREATION HOOK
// Manages character creation state and logic
// =================================================================

import { useState, useCallback } from 'react';
import { getRandomTalents, getRaceById, getClassById, getSkillsByClass } from '../lib/characterData';

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
  const [remainingPoints, setRemainingPoints] = useState(INITIAL_FREE_POINTS);

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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCharacterCreation.js:58',message:'handleClassSelect entry',data:{classId,currentPassiveCount:selectedPassiveSkills.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    const classData = getClassById(classId);
    setSelectedClass(classData);
    
    // Load skills for this class
    const skills = getSkillsByClass(classId);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCharacterCreation.js:63',message:'skills loaded',data:{activeCount:skills.active.length,passiveCount:skills.passive.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    if (skills.active.length > 0) {
      setSelectedActiveSkill(skills.active[0]);
    }
    // Clear passive skills selection when changing class - user must manually select
    setSelectedPassiveSkills([]);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCharacterCreation.js:68',message:'passive skills cleared',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
  }, []);

  // Handle talent selection
  const handleTalentSelect = useCallback((talentId) => {
    const talent = currentTalents.find(t => t.id === talentId);
    setSelectedTalent(talent);
  }, [currentTalents]);

  // Handle active skill selection
  const handleActiveSkillSelect = useCallback((skillId) => {
    if (!selectedClass) return;
    const skills = getSkillsByClass(selectedClass.id);
    const skill = skills.active.find(s => s.id === skillId);
    setSelectedActiveSkill(skill);
  }, [selectedClass]);

  // Handle passive skill selection (toggle)
  const handlePassiveSkillToggle = useCallback((skillId) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCharacterCreation.js:87',message:'handlePassiveSkillToggle entry',data:{skillId,hasSelectedClass:!!selectedClass,currentPassiveCount:selectedPassiveSkills.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion
    if (!selectedClass) return;
    const skills = getSkillsByClass(selectedClass.id);
    const skill = skills.passive.find(s => s.id === skillId);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCharacterCreation.js:90',message:'skill found',data:{skillFound:!!skill,skillId:skill?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion
    if (!skill) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCharacterCreation.js:92',message:'skill not found, returning',data:{skillId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion
      return;
    }
    
    setSelectedPassiveSkills(prev => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCharacterCreation.js:95',message:'toggle logic before',data:{prevCount:prev.length,skillExists:!!prev.find(s => s.id === skillId)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion
      const exists = prev.find(s => s.id === skillId);
      if (exists) {
        // Remove if already selected
        const newState = prev.filter(s => s.id !== skillId);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCharacterCreation.js:99',message:'removing skill',data:{newCount:newState.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
        return newState;
      } else {
        // Add if not selected (max 3)
        if (prev.length >= 3) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCharacterCreation.js:103',message:'max skills reached',data:{prevCount:prev.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
          // #endregion
          return prev; // Can't add more
        }
        const newState = [...prev, skill];
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCharacterCreation.js:107',message:'adding skill',data:{newCount:newState.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
        return newState;
      }
    });
  }, [selectedClass]);

  // Handle attribute point allocation
  const allocateAttributePoint = useCallback((attribute) => {
    // Use the derived remainingPoints from the outer scope or recalculate to be safe.
    // Since we are inside the hook, we can use the 'remainingPoints' variable defined above.
    // However, for the callback to work correctly with the closure, we should check the current state.
    // But since 'remainingPoints' is now derived during render, we can't use 'setRemainingPoints'.
    
    // We need to calculate if we can add based on current state
    setAttributePoints(prev => {
      const currentTotal = Object.values(prev).reduce((a, b) => a + b, 0);
      const currentRemaining = INITIAL_FREE_POINTS - (currentTotal - (8 * 5));
      
      if (currentRemaining <= 0) return prev;
      
      return {
        ...prev,
        [attribute]: prev[attribute] + 1
      };
    });
  }, []);

  const deallocateAttributePoint = useCallback((attribute) => {
    setAttributePoints(prev => {
      if (prev[attribute] <= 5) return prev;
      
      return {
        ...prev,
        [attribute]: prev[attribute] - 1
      };
    });
  }, []);

  // Validation
  const validateStep1 = useCallback(() => {
    if (!name.trim()) return { valid: false, error: 'Name is required' };
    if (!gender) return { valid: false, error: 'Gender is required' };
    if (!selectedRace) return { valid: false, error: 'Race is required' };
    if (!selectedClass) return { valid: false, error: 'Class is required' };
    if (!selectedTalent) return { valid: false, error: 'Talent is required' };
    if (!selectedActiveSkill) return { valid: false, error: 'Active skill is required' };
    if (selectedPassiveSkills.length !== 3) return { valid: false, error: 'Must select exactly 3 passive skills' };
    
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCharacterCreation.js:149',message:'finalizeCharacter entry',data:{hasActiveSkill:!!selectedActiveSkill,passiveSkillsCount:selectedPassiveSkills.length,hasSelectedClass:!!selectedClass,hasSelectedRace:!!selectedRace,hasSelectedTalent:!!selectedTalent},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
    const validation = validateStep2();
    if (!validation.valid) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCharacterCreation.js:152',message:'validation failed',data:{error:validation.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCharacterCreation.js:179',message:'processing passive skills',data:{passiveSkillsCount:selectedPassiveSkills.length,passiveSkillIds:selectedPassiveSkills.map(s => s?.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
    selectedPassiveSkills.forEach((skill, index) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCharacterCreation.js:180',message:'processing passive skill',data:{index,skillId:skill?.id,skillName:skill?.name,hasId:!!skill?.id,hasName:!!skill?.name,hasClass:!!selectedClass,classId:selectedClass?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
      if (!skill || !skill.id) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCharacterCreation.js:182',message:'invalid skill, skipping',data:{index,skill},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
        // #endregion
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3f03f283-383d-430a-bf4d-6c4ae328671d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCharacterCreation.js:196',message:'finalizeCharacter success',data:{abilitiesCount:abilities.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
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
