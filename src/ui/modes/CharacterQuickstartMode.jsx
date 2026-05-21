import {useCallback, useMemo} from "react";
import {useCharacterQuickstart} from "../../hook/useCharacterQuickstart.js";
import CreationNamePanel from "../panels/creation/CreationNamePanel.jsx";
import CreationRacePanel from "../panels/creation/CreationRacePanel.jsx";
import CreationClassPanel from "../panels/creation/CreationClassPanel.jsx";
import CreationStartingPointPanel from "../panels/creation/CreationStartingPointPanel.jsx";
import CreationSummaryPanel from "../panels/creation/CreationSummaryPanel.jsx";
import {
  getCharacterCreationRaceAbilitySummaries
} from "@voidverse/game-core/characterCreation/CharacterCreationContentPack.js";

const STEP_LABELS = {
  1: "Name",
  2: "Race",
  3: "Class",
  4: "Oath",
  5: "Begin",
};

const STEP_ICONS = {
  1: "[N]",
  2: "[R]",
  3: "[C]",
  4: "[O]",
  5: "[!]",
};

export default function CharacterQuickstartMode({onComplete}) {
  const {
    quickStep,
    QUICK_STEPS,
    showAdvanced,
    toggleAdvanced,
    quickNext,
    quickPrev,
    quickFinalize,
    full,
  } = useCharacterQuickstart({advancedUnlocked: showAdvanced});

  const handleFinalize = useCallback(async () => {
    const result = quickFinalize();
    if (result.valid && result.characterData) {
      onComplete(result.characterData, result.creationOutcome);
    }
  }, [quickFinalize, onComplete]);

  const raceAbilitySummaries = useMemo(() => {
    if (!full.selectedRace?.id) return [];
    return getCharacterCreationRaceAbilitySummaries(full.selectedRace.id);
  }, [full.selectedRace]);

  const renderStep = () => {
    switch (quickStep) {
      case QUICK_STEPS.NAME:
        return (
          <div className="quickstart-panel">
            <div className="quickstart-header">
              <h2>Who shall you be?</h2>
              <p className="quickstart-subtitle">A name echoes through the void — speak yours.</p>
            </div>
            <CreationNamePanel
              name={full.name}
              onNameChange={full.setName}
            />
          </div>
        );
      case QUICK_STEPS.RACE:
        return (
          <div className="quickstart-panel">
            <div className="quickstart-header">
              <h2>Choose your lineage</h2>
              <p className="quickstart-subtitle">Bloodline shapes your gifts — pick a race that resonates.</p>
            </div>
            <CreationRacePanel
              races={full.availableRaces}
              selectedRace={full.selectedRace}
              onRaceSelect={full.handleRaceSelect}
              recommendedRaceIds={["pure_human", "dragon_blood", "nature_spirit"]}
              abilitySummaries={raceAbilitySummaries}
            />
          </div>
        );
      case QUICK_STEPS.CLASS:
        return (
          <div className="quickstart-panel">
            <div className="quickstart-header">
              <h2>Forge your path</h2>
              <p className="quickstart-subtitle">Class defines your combat style and role in the world.</p>
            </div>
            <CreationClassPanel
              classes={full.availableClasses}
              selectedClass={full.selectedClass}
              onClassSelect={full.handleClassSelect}
            />
          </div>
        );
      case QUICK_STEPS.OATH:
        return (
          <div className="quickstart-panel">
            <div className="quickstart-header">
              <h2>Speak your Oath</h2>
              <p className="quickstart-subtitle">Your starting invocation sets the chronicle in motion.</p>
            </div>
            <CreationStartingPointPanel
              startingPoints={full.availableStartingPoints}
              selectedStartingPoint={full.selectedStartingPoint}
              startingPrompt={full.startingPrompt}
              onStartingPromptChange={full.handleStartingPromptChange}
              onOptimizeStartingPrompt={full.handleOptimizeStartingPrompt}
            />
          </div>
        );
      case QUICK_STEPS.REVIEW:
        return (
          <div className="quickstart-panel">
            <div className="quickstart-header">
              <h2>Ready to descend?</h2>
              <p className="quickstart-subtitle">Review your choices and begin the adventure.</p>
            </div>
            <CreationSummaryPanel
              name={full.name}
              selectedRace={full.selectedRace}
              selectedClass={full.selectedClass}
              selectedAlignmentId={full.selectedAlignmentId}
              selectedPerkIds={full.selectedPerkIds}
              attributePoints={full.attributePoints}
              selectedActiveSkills={full.selectedActiveSkills}
              selectedPassiveSkills={full.selectedPassiveSkills}
              selectedArchetypeSystem={full.selectedArchetypeSystem}
              selectedProfession={full.selectedProfession}
              startingPrompt={full.startingPrompt}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="quickstart-container">
      <div className="quickstart-sidebar">
        <div className="quickstart-progress">
          {Object.entries(STEP_LABELS).map(([step, label]) => {
            const stepNum = Number(step);
            const isActive = quickStep === stepNum;
            const isDone = quickStep > stepNum;
            return (
              <div key={step} className={`quickstart-step ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
                <div className="quickstart-step-marker">
                  {isDone ? "[X]" : STEP_ICONS[stepNum]}
                </div>
                <div className="quickstart-step-label">{label}</div>
              </div>
            );
          })}
        </div>
        <button
          className="quickstart-advanced-toggle"
          onClick={toggleAdvanced}
        >
          {showAdvanced ? "[-] Simplify" : "[+] Customize"}
        </button>
      </div>

      <div className="quickstart-body">
        {renderStep()}

        <div className="quickstart-nav">
          {quickStep > QUICK_STEPS.NAME && (
            <button className="quickstart-btn quickstart-btn-back" onClick={quickPrev}>
              Back
            </button>
          )}
          <div className="quickstart-nav-spacer"/>
          {quickStep < QUICK_STEPS.REVIEW ? (
            <button className="quickstart-btn quickstart-btn-next" onClick={quickNext}
                    disabled={quickStep === QUICK_STEPS.NAME && !full.name.trim()}>
              Continue
            </button>
          ) : (
            <button className="quickstart-btn quickstart-btn-final" onClick={handleFinalize}>
              Begin Adventure
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
