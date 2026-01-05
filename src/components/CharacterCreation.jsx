import React, { useEffect, useState } from 'react';
import { useCharacterCreation, INITIAL_FREE_POINTS } from '../hook/useCharacterCreation';
import { races, classes, getSkillsByClass } from '../lib/characterData';

// --- Styles & Components ---
const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-deep, #050a10)',
    color: 'var(--holo-cyan, #00f3ff)',
    fontFamily: 'var(--font-text, sans-serif)',
    overflow: 'hidden'
  },
  scrollContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  contentWidth: {
    maxWidth: '1200px',
    width: '100%'
  },
  header: {
    fontFamily: 'var(--font-hud, monospace)',
    textAlign: 'center',
    marginBottom: '2rem',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: 'var(--holo-cyan, #00f3ff)',
    textShadow: '0 0 10px rgba(0, 243, 255, 0.5)'
  },
  section: {
    background: 'rgba(5, 16, 26, 0.8)',
    border: '1px solid var(--holo-cyan, #00f3ff)',
    borderRadius: '4px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 0 15px rgba(0, 0, 0, 0.5)'
  },
  sectionTitle: {
    color: 'var(--holo-cyan, #00f3ff)',
    fontSize: '1.1rem',
    marginBottom: '1rem',
    borderBottom: '1px solid rgba(0, 243, 255, 0.3)',
    paddingBottom: '0.5rem',
    fontWeight: 'bold'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1rem'
  },
  button: {
    background: 'rgba(0, 243, 255, 0.05)',
    border: '1px solid var(--holo-cyan, #00f3ff)',
    color: 'var(--holo-cyan, #00f3ff)',
    padding: '0.75rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    outline: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%'
  },
  buttonSelected: {
    background: 'rgba(255, 215, 0, 0.15)',
    borderColor: 'var(--holo-gold, #ffd700)',
    color: 'var(--holo-gold, #ffd700)',
    boxShadow: '0 0 10px rgba(255, 215, 0, 0.2)'
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    filter: 'grayscale(100%)'
  },
  input: {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid var(--holo-cyan, #00f3ff)',
    color: 'var(--text-main, #e0e0e0)',
    padding: '0.75rem',
    fontSize: '1rem',
    outline: 'none',
    fontFamily: 'inherit'
  },
  description: {
    fontSize: '0.85rem',
    color: 'var(--text-main, #b0b0b0)',
    marginTop: '0.5rem',
    lineHeight: '1.4'
  },
  errorPanel: {
    background: 'rgba(255, 50, 50, 0.1)',
    border: '1px solid var(--holo-alert, #ff3333)',
    color: 'var(--holo-alert, #ff3333)',
    padding: '1rem',
    marginBottom: '1rem',
    borderRadius: '4px',
    textAlign: 'center'
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    background: 'rgba(0, 243, 255, 0.05)',
    marginBottom: '0.5rem',
    borderRadius: '4px'
  },
  statControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  statBtn: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: '1px solid var(--holo-cyan, #00f3ff)',
    color: 'var(--holo-cyan, #00f3ff)',
    cursor: 'pointer'
  }
};

const SelectionCard = ({ label, description, isSelected, onClick, style = {} }) => (
  <button
    onClick={onClick}
    style={{
      ...styles.button,
      ...(isSelected ? styles.buttonSelected : {}),
      ...style
    }}
  >
    <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.25rem' }}>{label}</div>
    {description && <div style={styles.description}>{description}</div>}
  </button>
);

export default function CharacterCreation({ onComplete }) {
  const {
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
    validateStep1
  } = useCharacterCreation();

  const [error, setError] = useState(null);
  const [selectedClassSkills, setSelectedClassSkills] = useState({ active: [], passive: [] });

  useEffect(() => {
    if (!showBootSequence) {
      initializeTalents();
    }
  }, [showBootSequence, initializeTalents]);

  useEffect(() => {
    if (selectedClass) {
      try {
        const skills = getSkillsByClass(selectedClass.id);
        setSelectedClassSkills(skills);
      } catch (error) {
        console.error('Error loading skills:', error);
        setSelectedClassSkills({ active: [], passive: [] });
      }
    } else {
      setSelectedClassSkills({ active: [], passive: [] });
    }
  }, [selectedClass]);

  const handleNext = () => {
    setError(null);
    const result = nextStep();
    if (!result.valid) {
      setError(result.error);
      // Scroll to error if possible
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinish = () => {
    setError(null);
    const result = finalizeCharacter();
    if (result.valid) {
      onComplete(result.characterData);
    } else {
      setError(result.error);
    }
  };

  // Boot Sequence
  if (showBootSequence) {
    return (
      <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ ...styles.section, maxWidth: '600px', textAlign: 'center', border: '2px solid var(--holo-cyan)' }}>
          <h1 style={{ ...styles.header, fontSize: '2.5rem', marginBottom: '1rem' }}>SYSTEM ONLINE</h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-main)' }}>
            Soul Signature Detected. Initiating Avatar Synchronization...
          </p>
          <button
            onClick={skipBootSequence}
            style={{
              ...styles.button,
              textAlign: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              padding: '1rem 2rem',
              background: 'rgba(0, 243, 255, 0.1)'
            }}
          >
            INITIALIZE
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Identity & Origin
  if (currentStep === 1) {
    return (
      <div style={styles.container}>
        <div style={styles.scrollContainer}>
          <div style={styles.contentWidth}>
            <h1 style={styles.header}>Step 1: Identity & Origin</h1>

            {error && (
              <div style={styles.errorPanel}>
                ⚠️ {error}
              </div>
            )}

            {/* IDENTITY SECTION */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Identity</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--holo-cyan)' }}>Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter Character Name"
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--holo-cyan)' }}>Gender</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['Male', 'Female', 'Other'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => setGender(opt)}
                        style={{
                          ...styles.button,
                          ...(gender === opt ? styles.buttonSelected : {}),
                          textAlign: 'center',
                          alignItems: 'center'
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RACE SECTION */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Race</h2>
              <div style={styles.grid}>
                {races.map(race => (
                  <SelectionCard
                    key={race.id}
                    label={race.name}
                    isSelected={selectedRace?.id === race.id}
                    onClick={() => handleRaceSelect(race.id)}
                    description={race.description}
                  />
                ))}
              </div>
              {selectedRace && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '4px' }}>
                  <strong>Bonuses:</strong>{' '}
                  {Object.entries(selectedRace.statBonuses)
                    .filter(([_, val]) => val !== 0)
                    .map(([key, val]) => `${key.toUpperCase()} ${val > 0 ? '+' : ''}${val}`)
                    .join(', ')}
                </div>
              )}
            </div>

            {/* CLASS SECTION */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Class</h2>
              <div style={styles.grid}>
                {classes.map(cls => (
                  <SelectionCard
                    key={cls.id}
                    label={cls.name}
                    isSelected={selectedClass?.id === cls.id}
                    onClick={() => handleClassSelect(cls.id)}
                    description={cls.description}
                  />
                ))}
              </div>
            </div>

            {/* SKILLS SECTION (Only if Class Selected) */}
            {selectedClass && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={styles.section}>
                  <h2 style={styles.sectionTitle}>Active Skill (Select 1)</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedClassSkills.active.map(skill => (
                      <SelectionCard
                        key={skill.id}
                        label={skill.name}
                        isSelected={selectedActiveSkill?.id === skill.id}
                        onClick={() => handleActiveSkillSelect(skill.id)}
                        description={skill.description}
                      />
                    ))}
                  </div>
                </div>

                <div style={styles.section}>
                  <h2 style={styles.sectionTitle}>Passive Skills (Select 3)</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedClassSkills.passive.length > 0 ? selectedClassSkills.passive.map(skill => {
                      const isSelected = selectedPassiveSkills.find(s => s.id === skill.id);
                      const isMaxed = !isSelected && selectedPassiveSkills.length >= 3;
                      return (
                        <SelectionCard
                          key={skill.id}
                          label={skill.name}
                          isSelected={!!isSelected}
                          onClick={() => handlePassiveSkillToggle(skill.id)}
                          description={skill.description}
                          style={isMaxed ? styles.buttonDisabled : {}}
                        />
                      );
                    }) : (
                      <div style={{ color: 'var(--text-main)' }}>No passive skills available.</div>
                    )}
                  </div>
                  <div style={{ marginTop: '0.5rem', textAlign: 'right', color: selectedPassiveSkills.length === 3 ? 'var(--holo-gold)' : 'var(--holo-cyan)' }}>
                    Selected: {selectedPassiveSkills.length}/3
                  </div>
                </div>
              </div>
            )}

            {/* TALENTS SECTION */}
            <div style={styles.section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ ...styles.sectionTitle, marginBottom: 0 }}>Unique Talent</h2>
                <button onClick={rerollTalents} style={{ ...styles.button, width: 'auto', padding: '0.5rem 1rem' }}>
                  Reroll
                </button>
              </div>
              <div style={styles.grid}>
                {currentTalents.map(talent => (
                  <SelectionCard
                    key={talent.id}
                    label={talent.name}
                    isSelected={selectedTalent?.id === talent.id}
                    onClick={() => handleTalentSelect(talent.id)}
                    description={talent.description}
                    style={{ borderColor: 'var(--holo-gold)' }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                onClick={handleNext}
                style={{
                  ...styles.button,
                  width: 'auto',
                  padding: '1rem 3rem',
                  background: 'var(--holo-cyan)',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}
              >
                NEXT STEP
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Attributes
  return (
    <div style={styles.container}>
      <div style={styles.scrollContainer}>
        <div style={styles.contentWidth}>
          <h1 style={styles.header}>Step 2: Attribute Allocation</h1>

          {error && <div style={styles.errorPanel}>⚠️ {error}</div>}

          <div style={{ ...styles.section, textAlign: 'center', borderColor: 'var(--holo-gold)' }}>
            <div style={{ fontSize: '2rem', color: remainingPoints === 0 ? 'var(--holo-gold)' : 'var(--holo-cyan)', fontFamily: 'var(--font-hud)' }}>
              Points Remaining: {remainingPoints}
            </div>
            <div style={{ color: 'var(--text-main)', marginTop: '0.5rem' }}>
              Allocate your points wisely. These stats define your potential.
            </div>
          </div>

          <div style={styles.section}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {[
                { key: 'str', label: 'Strength', desc: 'Physical power & Damage' },
                { key: 'agi', label: 'Agility', desc: 'Speed, Evasion & Crit' },
                { key: 'dex', label: 'Dexterity', desc: 'Precision & Crafting' },
                { key: 'int', label: 'Intelligence', desc: 'Magic Power & Mana' },
                { key: 'cha', label: 'Charisma', desc: 'Influence & Prices' },
                { key: 'will', label: 'Willpower', desc: 'Mental Defense & Stamina' },
                { key: 'luck', label: 'Luck', desc: 'Drop Rates & Events' },
                { key: 'soul', label: 'Soul Strength', desc: 'Spiritual Power' }
              ].map(attr => (
                <div key={attr.key} style={styles.statRow}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: 'var(--holo-cyan)' }}>{attr.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', opacity: 0.7 }}>{attr.desc}</div>
                  </div>
                  <div style={styles.statControl}>
                    <button
                      onClick={() => deallocateAttributePoint(attr.key)}
                      disabled={attributePoints[attr.key] <= 5}
                      style={{ ...styles.statBtn, ...(attributePoints[attr.key] <= 5 ? styles.buttonDisabled : {}) }}
                    >
                      -
                    </button>
                    <span style={{ width: '30px', textAlign: 'center', fontWeight: 'bold' }}>
                      {attributePoints[attr.key]}
                    </span>
                    <button
                      onClick={() => allocateAttributePoint(attr.key)}
                      disabled={remainingPoints <= 0}
                      style={{ ...styles.statBtn, ...(remainingPoints <= 0 ? styles.buttonDisabled : {}) }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button
              onClick={previousStep}
              style={{ ...styles.button, width: 'auto', padding: '1rem 2rem' }}
            >
              BACK
            </button>
            <button
              onClick={handleFinish}
              disabled={remainingPoints !== 0}
              style={{
                ...styles.button,
                width: 'auto',
                padding: '1rem 3rem',
                background: remainingPoints === 0 ? 'var(--holo-gold)' : 'transparent',
                color: remainingPoints === 0 ? '#000' : 'var(--holo-cyan)',
                borderColor: remainingPoints === 0 ? 'var(--holo-gold)' : 'var(--holo-cyan)',
                opacity: remainingPoints !== 0 ? 0.5 : 1,
                cursor: remainingPoints !== 0 ? 'not-allowed' : 'pointer'
              }}
            >
              COMPLETE CREATION
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
