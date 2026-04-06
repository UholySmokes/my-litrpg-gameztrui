// GameUI.jsx - Unified web shell orchestration
import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { useGameEngine } from "../../hook/usegamestate";
import { useNarrative } from "../../hook/useNarrative";
import AdminTools from "../AdminTools";
import AdventureShell from "../shell/AdventureShell.jsx";
import CharacterHub from "../shell/CharacterHub.jsx";
import { clearLegacyShellState } from "../shell/shellState.js";
import CharacterCreationShell from "./CharacterCreationShell.jsx";
import AutosaveResumeOverlay from "./AutosaveResumeOverlay.jsx";
import PwaInstallPrompt from "../PwaInstallPrompt.jsx";
import SaveResetGate from "./SaveResetGate.jsx";
import SystemFailureOverlay from "./SystemFailureOverlay.jsx";
import { useGameUiCharacterCreationFlow } from "./useGameUiCharacterCreationFlow.js";
import { useGameUiInteractionHandlers } from "./useGameUiInteractionHandlers.js";
import { buildNarrativePanelView } from "./gameUiSelectors.js";
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
    addSystemMessage,
    setState,
    loadState,
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
  const [activeSurface, setActiveSurface] = useState(() =>
    hasCreatedCharacterSnapshot(state) ? "adventure" : "hub",
  );

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

  useEffect(() => {
    clearLegacyShellState();
  }, []);

  const {
    submitInput,
    isLoading,
    error: narrativeError,
    userInput,
    setUserInput,
    inputRef,
    actionSuggestions,
    refreshActionSuggestions,
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
    transitionSummary,
    setCharacterCreated,
    handleCharacterCreationComplete,
  } = useGameUiCharacterCreationFlow({
    addSystemMessage,
    persistLocalAutosave,
    setState,
    state,
    submitInput,
  });

  const {
    equipmentSelectSlot,
    quickActionsProps,
    showBestiary,
    showArchetypeSystem,
    showGacha,
    showProfessions,
    showQuests,
    showReplayInspector,
    showSaveLoad,
    showShop,
    showStatusOverlay,
    showTitleSystem,
    handleCloseEquipmentSelect,
    handleCloseBestiary,
    handleCloseArchetypeSystem,
    handleCloseGacha,
    handleCloseProfessions,
    handleCloseQuests,
    handleCloseReplayInspector,
    handleCloseSaveLoad,
    handleCloseShop,
    handleCloseStatusOverlay,
    handleCloseTitleSystem,
    handleOpenEquipmentSlot,
    handleToggleArchetypeSystem,
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
    handleRest,
    handleSetCombatLane,
    handleSkillUse,
    handleBuyPrestigeUpgrade,
    handlePerformPrestige,
    handleStudySpell,
    handleTitleEquip,
    handleTitlePurchase,
    handleTitleUnequip,
    handleUseItem,
    handleUnequipItem,
  } = useGameUiInteractionHandlers({
    addSystemMessage,
    dispatch,
    dispatchSystemEvent,
    submitAction,
    state,
  });

  const gameQuickActionsProps = useMemo(
    () => ({
      ...quickActionsProps,
      combatState: state?.combat,
      gameState: state,
      player: state?.player,
      submitAction,
      onAttack: handleCombatAttack,
      onEscape: handleCombatEscape,
      onRest: handleRest,
      onSetCombatLane: handleSetCombatLane,
      onUseItem: handleUseItem,
      onUseSkill: handleSkillUse,
    }),
    [
      handleCombatAttack,
      handleCombatEscape,
      handleRest,
      handleSetCombatLane,
      handleSkillUse,
      handleUseItem,
      quickActionsProps,
      state,
      submitAction,
    ],
  );

  const handleLoadState = useCallback(
    (loadedState, options = {}) => {
      if (!isRecord(loadedState)) return;
      loadState(loadedState);
      refreshActionSuggestions(loadedState);
      const hasCharacter = hasCreatedCharacterSnapshot(loadedState);
      setCharacterCreated(hasCharacter);
      setActiveSurface(hasCharacter ? "adventure" : "hub");

      if (options.closeSaveLoad !== false) {
        setShowSaveLoad(false);
      }
      if (options.addMessage !== false) {
        addSystemMessage(options.message || "Loaded save game.", "system");
      }
    },
    [
      addSystemMessage,
      loadState,
      refreshActionSuggestions,
      setCharacterCreated,
      setShowSaveLoad,
    ],
  );

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault?.();
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
      const resolvedActionText =
        typeof actionText === "string"
          ? actionText
          : actionText?.command || actionText?.t || actionText?.label || "";
      if (!resolvedActionText) return;
      try {
        await submitInput(resolvedActionText, state, { fromSuggestion: true });
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

  const handleStartCreation = useCallback(
    (selectedHero) => {
      setActiveSurface("creation");
      if (selectedHero?.name) {
        addSystemMessage(
          `Selected featured path: ${selectedHero.name}. Final choices remain reversible during creation.`,
          "system",
        );
      }
    },
    [addSystemMessage],
  );

  const handleCreationComplete = useCallback(
    async (characterData) => {
      await handleCharacterCreationComplete(characterData);
      setActiveSurface("adventure");
    },
    [handleCharacterCreationComplete],
  );

  const equipmentSelectLabel = equipmentSelectSlot
    ? equipmentSelectSlot.charAt(0).toUpperCase() + equipmentSelectSlot.slice(1)
    : "Item";

  const adventureView = useMemo(
    () => ({
      user,
      state,
      player: state?.player,
      config: state?.config,
      quests: state?.quests,
      combatState: state?.combat,
      narrative: {
        summary: shouldShowNarrativeSummary ? narrativeSummary : "",
        currentMood: narrativeCurrentMood,
        entries: recentNarrativeEntries,
        latestEntry: latestNarrativeEntry,
        latestEntryText: latestEntryTypewriterContent,
        memoryRef: narrativeMemoryRef,
      },
      command: {
        userInput,
        onInputChange: setUserInput,
        onSubmit: handleSubmit,
        isLoading,
        error: narrativeError,
        inputRef,
        suggestions: actionSuggestions,
        onSuggestionSelect: handleSuggestionClick,
      },
      surfaces: {
        equipmentSelectSlot,
        equipmentSelectLabel,
        showBestiary,
        showArchetypeSystem,
        showGacha,
        showProfessions,
        showQuests,
        showReplayInspector: IS_DEV_BUILD && showReplayInspector,
        showSaveLoad,
        showShop,
        showStatusOverlay,
        showTitleSystem,
        handleCloseEquipmentSelect,
        handleCloseBestiary,
        handleCloseArchetypeSystem,
        handleCloseGacha,
        handleCloseProfessions,
        handleCloseQuests,
        handleCloseReplayInspector,
        handleCloseSaveLoad,
        handleCloseShop,
        handleCloseStatusOverlay,
        handleCloseTitleSystem,
        handleOpenEquipmentSlot,
        handleToggleArchetypeSystem,
      },
      actions: {
        onAllocateAttribute: handleAllocateAttributePoint,
        onAttack: handleCombatAttack,
        onUseSkill: handleSkillUse,
        onUseClassAbility: handleClassAbilityUse,
        onUseRaceAbility: handleRaceAbilityUse,
        onEscape: handleCombatEscape,
        onSetCombatLane: handleSetCombatLane,
        onEquipItem: handleEquipItem,
        onUnequipItem: handleUnequipItem,
        onEquipTitle: handleTitleEquip,
        onUnequipTitle: handleTitleUnequip,
        onTitleEquip: handleTitleEquip,
        onTitleUnequip: handleTitleUnequip,
        onTitlePurchase: handleTitlePurchase,
        onPerformPrestige: handlePerformPrestige,
        onBuyPrestigeUpgrade: handleBuyPrestigeUpgrade,
        onShopPurchase: handleShopPurchase,
        onGachaPull: handleGachaPull,
        onCraft: handleCraft,
        onDeallocateAttribute: handleDeallocateAttributePoint,
        onEvolveSkill: handleEvolveSkill,
        onFuseSkills: handleFuseSkills,
        onEvolveClass: handleEvolveClass,
        onEvolveRace: handleEvolveRace,
        onStudySpell: handleStudySpell,
      },
      system: {
        onLoadState: handleLoadState,
        addSystemMessage,
      },
    }),
    [
      actionSuggestions,
      addSystemMessage,
      equipmentSelectLabel,
      equipmentSelectSlot,
      handleAllocateAttributePoint,
      handleClassAbilityUse,
      handleCloseEquipmentSelect,
      handleCloseBestiary,
      handleCloseArchetypeSystem,
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
      handleSetCombatLane,
      handleSkillUse,
      handleBuyPrestigeUpgrade,
      handlePerformPrestige,
      handleStudySpell,
      handleSuggestionClick,
      handleSubmit,
      handleTitleEquip,
      handleTitlePurchase,
      handleTitleUnequip,
      handleToggleArchetypeSystem,
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
      showBestiary,
      showArchetypeSystem,
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

  const hasCharacterSnapshot = hasCreatedCharacterSnapshot(state);
  const shouldShowAdventure =
    !isTransitioning &&
    (activeSurface === "adventure" || characterCreated || hasCharacterSnapshot);
  const shouldShowCreation =
    activeSurface === "creation" || (isTransitioning && hasCharacterSnapshot);
  const shouldShowHub = !shouldShowAdventure && !shouldShowCreation;

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
    <div className="runic-app">
      <div className="runic-app__stack">
        <PwaInstallPrompt enabled={shouldShowHub} />

        {shouldShowHub ? (
          <CharacterHub user={user} onStartCreation={handleStartCreation} />
        ) : null}

        {shouldShowCreation ? (
            <CharacterCreationShell
              advancedUnlocked={advancedCreationUnlocked}
              isActive={true}
              isTransitioning={isTransitioning}
              onComplete={handleCreationComplete}
              telemetryUser={user}
            />
        ) : null}

        {isTransitioning && transitionSummary ? (
          <div className="creation-handoff-overlay anime-dramatic" role="status" aria-live="polite">
            <p className="creation-handoff-overlay__name anime-slide-up">{transitionSummary.name}</p>
            <p className="creation-handoff-overlay__class anime-slide-up">{transitionSummary.className}</p>
          </div>
        ) : null}

        {shouldShowAdventure ? (
          <AdventureShell
            view={adventureView}
            quickActionsProps={gameQuickActionsProps}
            isDevBuild={IS_DEV_BUILD}
          />
        ) : null}
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

      {IS_DEV_BUILD ? (
        <div
          style={{
            position: "fixed",
            bottom: 4,
            left: 4,
            padding: "2px 6px",
            fontSize: "0.6rem",
            fontFamily: "monospace",
            background: characterCreated ? "rgba(255,200,50,0.15)" : "rgba(50,255,100,0.15)",
            color: characterCreated ? "#ffc832" : "#32ff64",
            border: `1px solid ${characterCreated ? "rgba(255,200,50,0.3)" : "rgba(50,255,100,0.3)"}`,
            borderRadius: 3,
            zIndex: 9999,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {characterCreated ? "RESUMED SESSION" : "CLEAN SESSION"}
        </div>
      ) : null}

      {IS_DEV_BUILD ? (
        <AdminTools dispatch={dispatchSystemEvent} getState={() => state} />
      ) : null}
    </div>
  );
}
