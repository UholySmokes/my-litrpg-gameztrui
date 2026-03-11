// GameUI.jsx - Technical Cleanup & Dashboard Refactor
import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { useGameEngine } from "../../hook/usegamestate";
import { useNarrative } from "../../hook/useNarrative";
import AdminTools from "../AdminTools";
import CharacterCreationShell from "./CharacterCreationShell.jsx";
import AutosaveResumeOverlay from "./AutosaveResumeOverlay.jsx";
import GameModeShell from "./GameModeShell.jsx";
import ModeTransitionOverlay from "./ModeTransitionOverlay.jsx";
import SaveResetGate from "./SaveResetGate.jsx";
import SystemFailureOverlay from "./SystemFailureOverlay.jsx";
import { useGameUiCharacterCreationFlow } from "./useGameUiCharacterCreationFlow.js";
import { useGameUiInteractionHandlers } from "./useGameUiInteractionHandlers.js";
import {
  buildModeShellState,
  buildNarrativePanelView,
} from "./gameUiSelectors.js";
import {
  hasCreatedCharacterSnapshot,
  isRecord,
} from "./autosaveResume.js";
import { SAVE_RESET_EPOCH } from "./saveResetController.js";
import { useGameUiSaveController } from "./useGameUiSaveController.js";
import { useGameUiWindowController } from "./useGameUiWindowController.js";

const IS_DEV_BUILD = Boolean(import.meta?.env?.DEV);
const TYPEWRITER_CHAR_DELAY_MS = 28;

const renderTypewriterText = (text = "") => {
  const segments = text.split("\n");
  let globalCharIndex = 0;

  return segments.map((segment, segmentIdx) => {
    const chars = segment.split("").map((char, charIdx) => {
      const delayMs = (globalCharIndex + charIdx) * TYPEWRITER_CHAR_DELAY_MS;
      return (
        <span
          key={`char-${segmentIdx}-${charIdx}`}
          className="narrative-typewriter-char"
          style={{ animationDelay: `${delayMs}ms` }}
        >
          {char === " " ? " " : char}
        </span>
      );
    });

    globalCharIndex += segment.length + 1;

    return (
      <React.Fragment key={`segment-${segmentIdx}`}>
        {chars}
        {segmentIdx < segments.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

export default function GameUI({ user }) {
  const {
    state,
    chatLog,
    addSystemMessage,
    setState,
    evaluateQuestProgress,
    dispatchSystemEvent,
    dispatch,
    submitAction,
  } = useGameEngine();

  const narrativeViewModel = useMemo(
    () => buildNarrativePanelView(state),
    [state],
  );
  const {
    narrativeSummary,
    narrativeCurrentMood,
    narrativeEntries,
    recentNarrativeEntries,
    latestNarrativeEntry,
    latestNarrativeRawText,
    shouldShowNarrativeSummary,
  } = narrativeViewModel;
  const latestEntryTypewriterContent = useMemo(
    () => (latestNarrativeRawText ? renderTypewriterText(latestNarrativeRawText) : null),
    [latestNarrativeRawText],
  );
  const narrativeMemoryRef = useRef(null);
  const previousStateRef = useRef(null);

  const {
    persistLocalAutosave,
    retrySaveReset,
    saveResetAttempt,
    saveResetState,
  } = useGameUiSaveController({
    state,
    user,
  });

  useEffect(() => {
    const container = narrativeMemoryRef.current;
    if (container) {
      container.scrollTop = 0;
    }
  }, [narrativeEntries.length]);

  const {
    submitInput,
    isLoading,
    error: narrativeError,
    userInput,
    setUserInput,
    inputRef,
    actionSuggestions,
    generateInitialNarrativeText,
  } = useNarrative(
    setState,
    addSystemMessage,
    evaluateQuestProgress,
    submitAction,
  );
  const {
    advancedCreationUnlocked,
    characterCreated,
    isTransitioning,
    setCharacterCreated,
    handleCharacterCreationComplete,
  } = useGameUiCharacterCreationFlow({
    addSystemMessage,
    generateInitialNarrativeText,
    persistLocalAutosave,
    setState,
    state,
  });

  const {
    equipmentSelectSlot,
    focusWindowRequest,
    quickActionsProps,
    showGacha,
    showProfessions,
    showQuests,
    showReplayInspector,
    showSaveLoad,
    showShop,
    showStatusOverlay,
    showTitleSystem,
    handleCloseEquipmentSelect,
    handleCloseGacha,
    handleCloseProfessions,
    handleCloseQuests,
    handleCloseReplayInspector,
    handleCloseSaveLoad,
    handleCloseShop,
    handleCloseStatusOverlay,
    handleCloseTitleSystem,
    handleOpenEquipmentSlot,
    setShowSaveLoad,
  } = useGameUiWindowController();

  const {
    handleAllocateAttributePoint,
    handleClassAbilityUse,
    handleCombatAttack,
    handleCombatEscape,
    handleCraft,
    handleDeallocateAttributePoint,
    handleEquipItem,
    handleEvolveClass,
    handleEvolveRace,
    handleEvolveSkill,
    handleFuseSkills,
    handleGachaPull,
    handleRaceAbilityUse,
    handleShopPurchase,
    handleSkillUse,
    handleStudySpell,
    handleTitleEquip,
    handleTitlePurchase,
    handleTitleUnequip,
    handleUnequipItem,
  } = useGameUiInteractionHandlers({
    addSystemMessage,
    dispatch,
    dispatchSystemEvent,
    state,
  });

  const handleLoadState = useCallback(
    (loadedState, options = {}) => {
      if (!isRecord(loadedState)) return;
      setState(loadedState);
      setCharacterCreated(hasCreatedCharacterSnapshot(loadedState));

      if (options.closeSaveLoad !== false) {
        setShowSaveLoad(false);
      }
      if (options.addMessage !== false) {
        addSystemMessage(options.message || "Loaded save game.", "system");
      }
    },
    [addSystemMessage, setCharacterCreated, setState, setShowSaveLoad],
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!userInput || !userInput.trim() || isLoading) return;

      const input = userInput.trim();
      setUserInput("");
      previousStateRef.current = state;
      addSystemMessage(`> ${input}`, "user");

      try {
        await submitInput(input, state);
      } catch (err) {
        console.error("Submit failed:", err);
        addSystemMessage(
          "Something went wrong processing your action.",
          "system",
        );
      }

      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    [addSystemMessage, inputRef, isLoading, setUserInput, state, submitInput, userInput],
  );

  const handleSuggestionClick = useCallback(
    async (actionText) => {
      if (isLoading) return;
      try {
        await submitInput(actionText, state, { fromSuggestion: true });
      } catch (err) {
        console.error("Suggestion action failed:", err);
        addSystemMessage(
          "Something went wrong processing your action.",
          "system",
        );
      }
    },
    [addSystemMessage, isLoading, state, submitInput],
  );

  const {
    showCreationMode,
    showGameMode,
    shouldRenderCreationShell,
    shouldRenderGameShell,
  } = useMemo(
    () => buildModeShellState({ characterCreated, isTransitioning }),
    [characterCreated, isTransitioning],
  );
  const gameModeProps = useMemo(
    () => ({
      player: state?.player,
      config: state?.config,
      gameState: state,
      chatLog,
      userInput,
      onInputChange: setUserInput,
      onSubmit: handleSubmit,
      isLoading,
      error: narrativeError,
      inputRef,
      suggestions: actionSuggestions,
      onSuggestionSelect: handleSuggestionClick,
      narrativeSummary: shouldShowNarrativeSummary ? narrativeSummary : "",
      narrativeCurrentMood,
      narrativeEntries: recentNarrativeEntries,
      latestEntry: latestNarrativeEntry,
      latestEntryText: latestEntryTypewriterContent,
      narrativeMemoryRef,
      equipmentSelectSlot,
      onSelectEquipmentSlot: handleOpenEquipmentSlot,
      onCloseEquipmentSelect: handleCloseEquipmentSelect,
      onEquipItem: handleEquipItem,
      onUnequipItem: handleUnequipItem,
      onEquipTitle: handleTitleEquip,
      onUnequipTitle: handleTitleUnequip,
      quests: state?.quests,
      combatState: state?.combat,
      onAttack: handleCombatAttack,
      onUseSkill: handleSkillUse,
      onUseClassAbility: handleClassAbilityUse,
      onUseRaceAbility: handleRaceAbilityUse,
      onEscape: handleCombatEscape,
      showShop,
      showGacha,
      showTitleSystem,
      showProfessions,
      showStatusOverlay,
      showSaveLoad,
      showQuests,
      showReplayInspector: IS_DEV_BUILD && showReplayInspector,
      onCloseShop: handleCloseShop,
      onCloseGacha: handleCloseGacha,
      onCloseTitleSystem: handleCloseTitleSystem,
      onCloseProfessions: handleCloseProfessions,
      onCloseStatusOverlay: handleCloseStatusOverlay,
      onCloseSaveLoad: handleCloseSaveLoad,
      onCloseQuests: handleCloseQuests,
      onCloseReplayInspector: handleCloseReplayInspector,
      onShopPurchase: handleShopPurchase,
      onGachaPull: handleGachaPull,
      onTitleEquip: handleTitleEquip,
      onTitleUnequip: handleTitleUnequip,
      onTitlePurchase: handleTitlePurchase,
      onCraft: handleCraft,
      onAllocateAttribute: handleAllocateAttributePoint,
      onDeallocateAttribute: handleDeallocateAttributePoint,
      onEvolveSkill: handleEvolveSkill,
      onFuseSkills: handleFuseSkills,
      onEvolveClass: handleEvolveClass,
      onEvolveRace: handleEvolveRace,
      onStudySpell: handleStudySpell,
      onLoadState: handleLoadState,
      addSystemMessage,
      user,
      focusWindowRequest,
    }),
    [
      addSystemMessage,
      actionSuggestions,
      chatLog,
      equipmentSelectSlot,
      focusWindowRequest,
      handleAllocateAttributePoint,
      handleClassAbilityUse,
      handleCloseEquipmentSelect,
      handleCloseGacha,
      handleCloseProfessions,
      handleCloseQuests,
      handleCloseReplayInspector,
      handleCloseSaveLoad,
      handleCloseShop,
      handleCloseStatusOverlay,
      handleCloseTitleSystem,
      handleCombatAttack,
      handleCombatEscape,
      handleCraft,
      handleDeallocateAttributePoint,
      handleEquipItem,
      handleEvolveClass,
      handleEvolveRace,
      handleEvolveSkill,
      handleFuseSkills,
      handleGachaPull,
      handleLoadState,
      handleOpenEquipmentSlot,
      handleRaceAbilityUse,
      handleShopPurchase,
      handleSkillUse,
      handleStudySpell,
      handleSuggestionClick,
      handleSubmit,
      handleTitleEquip,
      handleTitlePurchase,
      handleTitleUnequip,
      handleUnequipItem,
      inputRef,
      isLoading,
      latestEntryTypewriterContent,
      latestNarrativeEntry,
      narrativeCurrentMood,
      narrativeError,
      narrativeMemoryRef,
      narrativeSummary,
      recentNarrativeEntries,
      setUserInput,
      shouldShowNarrativeSummary,
      showGacha,
      showProfessions,
      showQuests,
      showReplayInspector,
      showSaveLoad,
      showShop,
      showStatusOverlay,
      showTitleSystem,
      state,
      user,
      userInput,
    ],
  );

  if (!saveResetState.ready) {
    const isRetryable = !saveResetState.busy && Boolean(saveResetState.error);
    return (
      <SaveResetGate
        isRetryable={isRetryable}
        onRetryReset={retrySaveReset}
        saveResetEpoch={SAVE_RESET_EPOCH}
        saveResetState={saveResetState}
      />
    );
  }

  return (
    <div className="app-frame">
      <div className="app-container">
        <div className="mode-stage">
          {isTransitioning && <ModeTransitionOverlay />}
          {shouldRenderCreationShell && (
            <CharacterCreationShell
              advancedUnlocked={advancedCreationUnlocked}
              isActive={showCreationMode}
              isTransitioning={isTransitioning}
              onComplete={handleCharacterCreationComplete}
              telemetryUser={user}
            />
          )}
          {shouldRenderGameShell && (
            <GameModeShell
              gameModeProps={gameModeProps}
              isActive={showGameMode}
              isDevBuild={IS_DEV_BUILD}
              isTransitioning={isTransitioning}
              quickActionsProps={quickActionsProps}
            />
          )}
        </div>
      </div>

      {saveResetState.ready && (
        <AutosaveResumeOverlay
          key={`autosave-prompt-${saveResetAttempt}-${user?.id || "local"}`}
          isTransitioning={isTransitioning}
          onLoadState={handleLoadState}
        />
      )}

      {state?.player?.isDead && (
        <SystemFailureOverlay onRestart={() => window.location.reload()} />
      )}

      <AdminTools dispatch={dispatchSystemEvent} getState={() => state} />
    </div>
  );
}
