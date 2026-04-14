// GameUI.jsx - Unified web shell orchestration
import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { useGameEngine } from "../../hook/usegamestate";
import { useNarrative } from "../../hook/useNarrative";
import AdventureShell from "../shell/AdventureShell.jsx";
import CharacterHub from "../shell/CharacterHub.jsx";
import { clearLegacyShellState } from "../shell/shellState.js";
import CharacterCreationShell from "./CharacterCreationShell.jsx";
import DevConsoleDock from "./DevConsoleDock.jsx";
import AutosaveResumeOverlay from "./AutosaveResumeOverlay.jsx";
import PwaInstallPrompt from "../PwaInstallPrompt.jsx";
import SaveResetGate from "./SaveResetGate.jsx";
import SystemFailureOverlay from "./SystemFailureOverlay.jsx";
import { resolveGameUiSurfaceState } from "./gameUiSurfaceState.js";
import { useGameUiCharacterCreationFlow } from "./useGameUiCharacterCreationFlow.js";
import { useGameUiInteractionHandlers } from "./useGameUiInteractionHandlers.js";
import { buildNarrativePanelView } from "./gameUiSelectors.js";
import { hasCharacterCreationDraft } from "./characterCreationDraft.js";
import { deriveAdventureOnboardingTier } from "../../core/creationOnboarding.js";
import { hasCompletedOnboardingMilestone } from "../../world/OpeningTutorialBundleRegistry.js";
import {
  hasCreatedCharacterSnapshot,
  isRecord,
} from "./autosaveResume.js";
import { SAVE_RESET_EPOCH } from "./saveResetController.js";
import { useGameUiSaveController } from "./useGameUiSaveController.js";
import { useGameUiWindowController } from "./useGameUiWindowController.js";
import { syncChronicleProgress } from "../../core/chronicleTracker.js";

const getBuildEnv = () =>
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

const getRuntimeEnv = () => {
  if (typeof globalThis === "undefined") return {};
  const runtimeConfig = globalThis.__RUNTIME_CONFIG__;
  return runtimeConfig && typeof runtimeConfig === "object" ? runtimeConfig : {};
};

const pickEnvValue = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
};

const parseBooleanFlag = (value, fallback = false) => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const resolveIsDevBuild = () => {
  const buildEnv = getBuildEnv();
  const runtimeEnv = getRuntimeEnv();
  const explicit = pickEnvValue(
    runtimeEnv.VITE_DEV_CONSOLE_ENABLED,
    buildEnv.VITE_DEV_CONSOLE_ENABLED,
    runtimeEnv.VITE_ENABLE_DEV_CONSOLE,
    buildEnv.VITE_ENABLE_DEV_CONSOLE,
  );

  if (explicit !== undefined) {
    return parseBooleanFlag(explicit, false);
  }

  return Boolean(
    buildEnv.DEV ||
      buildEnv.MODE === "development" ||
      (typeof window !== "undefined" &&
        (window.location.hostname === "127.0.0.1" ||
          window.location.hostname === "localhost")),
  );
};

const IS_DEV_BUILD = resolveIsDevBuild();
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
  const chronicleSyncStateRef = useRef(state);
  const [activeSurface, setActiveSurface] = useState(() =>
    hasCreatedCharacterSnapshot(state)
      ? "adventure"
      : hasCharacterCreationDraft()
        ? "creation"
        : "hub",
  );
  const [hasHubInteracted, setHasHubInteracted] = useState(false);

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

  const hasCharacterSnapshot = hasCreatedCharacterSnapshot(state);
  const hasCharacterCreationDraftSnapshot =
    !hasCharacterSnapshot && hasCharacterCreationDraft();

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
  const hasAdventureSession = hasCharacterSnapshot || (characterCreated && Boolean(state?.player));
  const resolvedActiveSurface = useMemo(() => {
    if (activeSurface === "adventure" && !hasAdventureSession && !isTransitioning) {
      return hasCharacterCreationDraftSnapshot ? "creation" : "hub";
    }

    if (
      activeSurface === "hub" &&
      hasCharacterCreationDraftSnapshot &&
      !hasCharacterSnapshot &&
      !isTransitioning
    ) {
      return "creation";
    }

    return activeSurface;
  }, [
    activeSurface,
    hasAdventureSession,
    hasCharacterCreationDraftSnapshot,
    hasCharacterSnapshot,
    isTransitioning,
  ]);

  const {
    equipmentSelectSlot,
    quickActionsProps,
    showBestiary,
    showArchetypeSystem,
    showDevourerCore,
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
    handleCloseDevourerCore,
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
    handleToggleDevourerCore,
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
    handleMoveSkirmishUnit,
    handleRaceAbilityUse,
    handleShopPurchase,
    handleRest,
    handleSelectSkirmishTarget,
    handleSelectSkirmishUnit,
    handleSetCombatLane,
    handleSetCombatStance,
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
      onSetCombatStance: handleSetCombatStance,
      onUseItem: handleUseItem,
      onUseSkill: handleSkillUse,
    }),
    [
      handleCombatAttack,
      handleCombatEscape,
      handleRest,
      handleSetCombatLane,
      handleSetCombatStance,
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
      setHasHubInteracted(true);
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

  const handleDevConsoleStoryCommand = useCallback(
    async (commandText) => {
      await submitInput(commandText, state);
    },
    [state, submitInput],
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
      chronicle: state?.chronicle,
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
        showDevourerCore,
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
        handleCloseDevourerCore,
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
        handleToggleDevourerCore,
      },
      actions: {
        onAllocateAttribute: handleAllocateAttributePoint,
        onAttack: handleCombatAttack,
        onUseSkill: handleSkillUse,
        onUseClassAbility: handleClassAbilityUse,
        onUseRaceAbility: handleRaceAbilityUse,
        onEscape: handleCombatEscape,
        onMoveSkirmishUnit: handleMoveSkirmishUnit,
        onSelectSkirmishTarget: handleSelectSkirmishTarget,
        onSelectSkirmishUnit: handleSelectSkirmishUnit,
        onSetCombatLane: handleSetCombatLane,
        onSetCombatStance: handleSetCombatStance,
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
        onUseItem: handleUseItem,
        onWait: handleRest,
      },
      system: {
        onLoadState: handleLoadState,
        addSystemMessage,
        trackUiAction: (actionType) =>
          dispatch({
            type: "TRACK_UI_ACTION",
            payload: { actionType },
          }),
      },
    }),
    [
      actionSuggestions,
      addSystemMessage,
      dispatch,
      equipmentSelectLabel,
      equipmentSelectSlot,
      handleAllocateAttributePoint,
      handleClassAbilityUse,
      handleCloseEquipmentSelect,
      handleCloseBestiary,
      handleCloseArchetypeSystem,
      handleCloseDevourerCore,
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
      handleMoveSkirmishUnit,
      handleLoadState,
      handleOpenEquipmentSlot,
      handleRaceAbilityUse,
      handleRest,
      handleSelectSkirmishTarget,
      handleSelectSkirmishUnit,
      handleShopPurchase,
      handleSetCombatLane,
      handleSetCombatStance,
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
      handleToggleDevourerCore,
      handleUseItem,
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
      showDevourerCore,
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

  useEffect(() => {
    const previousState = chronicleSyncStateRef.current;
    chronicleSyncStateRef.current = state;

    if (!hasAdventureSession) {
      return;
    }

    const nextChronicle = syncChronicleProgress(previousState, state);
    if (!nextChronicle) {
      return;
    }

    dispatch({
      type: "UPDATE_STATE",
      payload: {
        chronicle: nextChronicle,
      },
    });
  }, [dispatch, hasAdventureSession, state]);

  const onboardingTier = useMemo(
    () =>
      deriveAdventureOnboardingTier({
        state,
        player: state?.player,
        quests: state?.quests,
      }),
    [state],
  );

  useEffect(() => {
    if (!hasAdventureSession) {
      return;
    }

    const onboarding = state?.world?.vars?.onboarding || {};
    const currentMilestones =
      onboarding && typeof onboarding.milestones === "object"
        ? onboarding.milestones
        : {};
    const nextStage =
      (state?.player?.level || 1) >= 2
        ? "milestone"
        : onboardingTier >= 2
          ? "orientation"
          : "arrival";

    const patch = {};
    const milestonePatch = {};

    if (onboarding.hudTier !== onboardingTier) {
      patch.hudTier = onboardingTier;
    }
    if (onboarding.stage !== nextStage) {
      patch.stage = nextStage;
    }
    if (hasCompletedOnboardingMilestone(state, "anchor") && !currentMilestones.firstStrideSeen) {
      milestonePatch.firstStrideSeen = true;
    }
    if (hasCompletedOnboardingMilestone(state, "readout") && !currentMilestones.systemBasicsSeen) {
      milestonePatch.systemBasicsSeen = true;
    }
    if (hasCompletedOnboardingMilestone(state, "pressure") && !currentMilestones.firstConflictSeen) {
      milestonePatch.firstConflictSeen = true;
    }

    if (Object.keys(milestonePatch).length > 0) {
      patch.milestones = milestonePatch;
    }

    if (Object.keys(patch).length === 0) {
      return;
    }

    dispatch({
      type: "MERGE_ONBOARDING_STATE",
      payload: patch,
    });
  }, [dispatch, hasAdventureSession, onboardingTier, state]);

  useEffect(() => {
    if (!hasAdventureSession) {
      return;
    }

    const playerLevel = Number(state?.player?.level || 1);
    const onboarding = state?.world?.vars?.onboarding || {};
    const milestoneFlags =
      onboarding && typeof onboarding.milestones === "object"
        ? onboarding.milestones
        : {};

    if (playerLevel < 2 || milestoneFlags.level2Celebrated) {
      return;
    }

    addSystemMessage(
      "Level 2 reached. The World Atrium recognizes your first earned milestone.",
      "system",
    );
    addSystemMessage(
      "Status reads, loadout tools, and deeper system rooms are now open. Review the build, then push into the next directive.",
      "status-update",
    );
    dispatch({
      type: "MERGE_ONBOARDING_STATE",
      payload: {
        stage: "milestone",
        hudTier: 3,
        milestones: {
          level2Celebrated: true,
        },
      },
    });
  }, [addSystemMessage, dispatch, hasAdventureSession, state]);

  const {
    shouldShowAdventure,
    shouldShowCreation,
    shouldShowHub,
  } = resolveGameUiSurfaceState({
    activeSurface: resolvedActiveSurface,
    characterCreated: hasAdventureSession,
    hasCharacterSnapshot,
    isTransitioning,
  });

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
        {IS_DEV_BUILD || user?.id === "local" ? (
          <DevConsoleDock
            state={state}
            dispatch={dispatchSystemEvent}
            setState={setState}
            addSystemMessage={addSystemMessage}
            runStoryCommand={handleDevConsoleStoryCommand}
          />
        ) : null}

        <PwaInstallPrompt enabled={shouldShowHub && hasHubInteracted} />

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
            {transitionSummary.startingPoint ? (
              <p className="creation-handoff-overlay__class anime-slide-up">
                Chronicle begins in {transitionSummary.startingPoint}
              </p>
            ) : null}
            {transitionSummary.starterKitLabel ? (
              <p className="creation-handoff-overlay__class anime-slide-up">
                {transitionSummary.starterKitLabel}
              </p>
            ) : null}
            {transitionSummary.firstDirective ? (
              <p className="creation-handoff-overlay__class anime-slide-up">
                First directive: {transitionSummary.firstDirective}
              </p>
            ) : null}
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
            background: hasAdventureSession ? "rgba(255,200,50,0.15)" : "rgba(50,255,100,0.15)",
            color: hasAdventureSession ? "#ffc832" : "#32ff64",
            border: `1px solid ${hasAdventureSession ? "rgba(255,200,50,0.3)" : "rgba(50,255,100,0.3)"}`,
            borderRadius: 3,
            zIndex: 9999,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {hasAdventureSession ? "RESUMED SESSION" : "CLEAN SESSION"}
        </div>
      ) : null}
    </div>
  );
}
