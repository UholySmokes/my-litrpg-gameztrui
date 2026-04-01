import { useState, useCallback, useRef } from "react";
import {
  assemblePrompt,
  buildSceneMemorySeed,
  buildInitialPrompt,
  resolvePromptMode,
} from "../../core/PromptAssembler.js";
import {
  generateNarrative,
  generateNarrativeStream,
  generateInitialNarrative,
  shouldUseNarrativeLocalFallback,
} from "../../core/AIService.js";
import { renderStatusBlock } from "../../util/statusrenderer.js";
import { SimBridge } from "../../simulation/bridge/SimulationBridge.js";
import { toNumber } from "../../utils/shared.js";
import { QuestManager } from "../../systems/quest/QuestManager.js";
import {
  createInitialNarrativeCacheKey,
  getInitialNarrativeCache,
  hasInitialNarrativeCache,
  setInitialNarrativeCache,
} from "./initialNarrativeCache.js";
import {
  applyOpeningSceneChoice as applyOpeningSceneChoiceFlow,
  resolveOpeningChoiceFromInput as resolveOpeningChoiceFromInputFlow,
} from "./openingScenePipeline.js";
import {
  buildActionSuggestions as buildActionSuggestionsFlow,
  buildSummaryPrompt as buildSummaryPromptFlow,
  inferMood as inferMoodFlow,
  resolveActionSuggestions as resolveActionSuggestionsFlow,
  shouldRefreshSummary as shouldRefreshSummaryFlow,
} from "./narrativeSuggestions.js";
import {
  DEFAULT_ACTION_SUGGESTIONS,
  STREAM_PLACEHOLDER_TEXT,
} from "./narrativeSuggestions.js";
import {
  applyNarrativeStateIntents,
  collectNarrativeOutcomeNotes,
  mergeSuggestedQuestIntoState,
} from "./narrativeOutcomePipeline.js";
import { resolveNarrativeRuntimeOutcome } from "./narrativeRuntimeOutcome.js";
import {
  applyNarrativeEntryToState,
  createInitialNarrativeState,
  replaceNarrativeEntryInState,
} from "./narrativeStateUpdater.js";

function shouldLogNarrativeError(error) {
  return !shouldUseNarrativeLocalFallback(error);
}

/**
 * Custom hook for managing AI narrative and user actions.
 * Keeps the public `useNarrative()` contract stable while delegating content,
 * cache, and state policies to focused adapters.
 */
export function useNarrative(
  setState,
  addSystemMessage,
  evaluateQuestProgress,
  submitAction,
) {
  const [isLoading, setIsLoading] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [error, setError] = useState(null);
  const [userInput, setUserInput] = useState("");
  const inputRef = useRef(null);
  const initialNarrativeKeyRef = useRef(null);
  const busyRef = useRef(false);
  const [actionSuggestions, setActionSuggestions] = useState(
    DEFAULT_ACTION_SUGGESTIONS,
  );
  const fallbackCounterRef = useRef(0);
  const streamAbortRef = useRef(null);
  const summaryInFlightRef = useRef(false);

  const maybeRefreshSummary = useCallback(
    async ({ stateSnapshot, appendedLine }) => {
      if (summaryInFlightRef.current) return;
      const narrative = stateSnapshot?.narrative || {};
      const existingEntries = Array.isArray(narrative.entries)
        ? narrative.entries
        : [];

      const filtered = existingEntries.filter((entry) =>
        ["narrative", "system", "status-update"].includes(entry.type),
      );
      const augmented = appendedLine
        ? filtered.concat([
            {
              type: "narrative",
              text: String(appendedLine || ""),
              mood: inferMoodFlow(appendedLine),
            },
          ])
        : filtered;

      const total = augmented.length;
      const lastAtCount = toNumber(narrative.summaryMeta?.atCount, 0);
      const shouldRun =
        shouldRefreshSummaryFlow({ entries: augmented }) && total > lastAtCount;

      if (!shouldRun) return;

      const recentLines = augmented
        .slice(-10)
        .map((entry) => {
          const prefix =
            entry.type === "system"
              ? "System"
              : entry.type === "status-update"
                ? "Status"
                : "Narrator";
          return `${prefix}: ${String(entry.text || "").trim()}`;
        })
        .filter(Boolean);

      const prompt = buildSummaryPromptFlow({
        previousSummary: narrative.summary,
        recentLines,
      });

      summaryInFlightRef.current = true;
      try {
        const result = await generateNarrative(prompt);
        const nextSummary = result?.narrative || "";
        if (!nextSummary) return;
        setState((prevState) => ({
          ...prevState,
          narrative: {
            ...prevState.narrative,
            summary: nextSummary,
            summaryMeta: { atCount: total, updatedAt: SimBridge.now() },
          },
        }));
      } catch (err) {
        console.warn("Summary refresh failed:", err);
      } finally {
        summaryInFlightRef.current = false;
      }
    },
    [setState],
  );

  const streamNarrative = useCallback(
    async (
      prompt,
      prevStateForFallback,
      { mode, userInput: turnUserInput, actionResult } = {},
    ) => {
      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
      }
      const controller = new AbortController();
      streamAbortRef.current = controller;

      const streamEntryId = `stream_${Date.now()}`;
      setState((prevState) =>
        applyNarrativeEntryToState(prevState, {
          id: streamEntryId,
          type: "narrative",
          text: STREAM_PLACEHOLDER_TEXT,
          timestamp: SimBridge.now(),
          source: "ai-streaming",
        }),
      );

      try {
        const result = await generateNarrativeStream(prompt, {
          signal: controller.signal,
          mode,
          onChunk: (_delta, fullText) => {
            setState((prevState) =>
              replaceNarrativeEntryInState(prevState, streamEntryId, {
                text: fullText,
              }),
            );
          },
        });
        const resolvedResult = resolveNarrativeRuntimeOutcome({
          aiResult: result,
          state: prevStateForFallback,
          userInput: turnUserInput,
          actionResult,
        });
        setActionSuggestions(resolvedResult.suggestions);

        setState((prevState) =>
          {
            const nextState = replaceNarrativeEntryInState(prevState, streamEntryId, {
              text: resolvedResult.narrative,
              source: resolvedResult.source,
              mood: resolvedResult.mood,
            });
            if (!resolvedResult.sceneMemory) {
              return nextState;
            }
            return {
              ...nextState,
              narrative: {
                ...nextState.narrative,
                sceneMemory: resolvedResult.sceneMemory,
              },
            };
          },
        );

        await maybeRefreshSummary({
          stateSnapshot: prevStateForFallback,
          appendedLine: resolvedResult.narrative,
        });

        return resolvedResult;
      } catch (err) {
        if (err?.name === "AbortError") throw err;
        if (shouldLogNarrativeError(err)) {
          console.error("Stream narrative failed:", err);
        }
        fallbackCounterRef.current += 1;
        const fallbackResult = resolveNarrativeRuntimeOutcome({
          state: prevStateForFallback,
          userInput: turnUserInput,
          actionResult,
          variantSeed: fallbackCounterRef.current,
        });
        setActionSuggestions(fallbackResult.suggestions);
        setState((prevState) =>
          replaceNarrativeEntryInState(prevState, streamEntryId, {
            text: fallbackResult.narrative,
            source: fallbackResult.source,
            mood: fallbackResult.mood,
          }),
        );
        return fallbackResult;
      } finally {
        if (streamAbortRef.current === controller) {
          streamAbortRef.current = null;
        }
      }
    },
    [maybeRefreshSummary, setState],
  );

  const submitInput = useCallback(
    async (nextUserInput, currentState, options = {}) => {
      if (!nextUserInput || !nextUserInput.trim() || busyRef.current) {
        return;
      }
      busyRef.current = true;

      setIsLoading(true);
      setError(null);

      try {
        const openingSceneId = currentState?.world?.vars?.startingSceneId || null;
        const openingChoicePending = Boolean(
          currentState?.world?.vars?.openingSceneChoicePending,
        );

        if (openingChoicePending && openingSceneId) {
          const selectedOpeningChoice = resolveOpeningChoiceFromInputFlow(
            nextUserInput,
            openingSceneId,
          );
          if (selectedOpeningChoice) {
            const openingResolution = applyOpeningSceneChoiceFlow(currentState, {
              sceneId: openingSceneId,
              choice: selectedOpeningChoice,
            });
            const resolvedState = openingResolution.state || currentState;

            setState(resolvedState);
            setActionSuggestions(
              resolveActionSuggestionsFlow({
                fallbackSuggestions: buildActionSuggestionsFlow(resolvedState),
                state: resolvedState,
              }),
            );
            collectNarrativeOutcomeNotes(openingResolution.notes).forEach((note) =>
              addSystemMessage(note, "system"),
            );

            if (typeof evaluateQuestProgress === "function") {
              evaluateQuestProgress(resolvedState);
            }

            setIsNarrating(true);
            try {
              const openingActionResult = {
                success: true,
                actionType: "opening_choice",
                description:
                  openingResolution.outcomeText ||
                  `You choose: ${selectedOpeningChoice.label}`,
                state: resolvedState,
                readOnly: false,
                openingNarrativeSeed: openingResolution.openingNarrativeSeed,
              };
              const mode = resolvePromptMode(resolvedState, openingActionResult);
              const prompt = assemblePrompt(
                resolvedState,
                nextUserInput,
                openingActionResult,
              );
              const narrativeResult = await streamNarrative(prompt, resolvedState, {
                mode,
                userInput: nextUserInput,
                actionResult: openingActionResult,
              });
              const intentResolution = applyNarrativeStateIntents(
                resolvedState,
                narrativeResult?.stateIntents,
              );
              if (intentResolution.state !== resolvedState) {
                setState(intentResolution.state);
                if (typeof evaluateQuestProgress === "function") {
                  evaluateQuestProgress(intentResolution.state);
                }
              }
              collectNarrativeOutcomeNotes(intentResolution.notes).forEach((note) =>
                addSystemMessage(note, "system"),
              );
            } catch (err) {
              if (err?.name === "AbortError") return;
              if (shouldLogNarrativeError(err)) {
                console.error("Opening choice narrative generation failed:", err);
              }
            } finally {
              setIsNarrating(false);
            }

            return;
          }
        }

        const stepResult = submitAction?.({ kind: "text", text: nextUserInput });
        const action = stepResult?.action;

        if (!stepResult?.ok) {
          const reason =
            stepResult?.reason || "Could not process input into a valid action.";
          addSystemMessage(`Action failed: ${reason}`, "system");

          try {
            const failedActionResult = {
              success: false,
              actionType: action?.type,
              reason,
              description: `Attempted: ${nextUserInput}`,
            };
            const failurePrompt = assemblePrompt(currentState, nextUserInput, {
              ...failedActionResult,
            });
            const mode = resolvePromptMode(currentState, {
              success: false,
              actionType: action?.type,
            });
            await streamNarrative(failurePrompt, currentState, {
              mode,
              userInput: nextUserInput,
              actionResult: failedActionResult,
            });
          } catch (err) {
            if (err?.name === "AbortError") return;
            if (shouldLogNarrativeError(err)) {
              console.error("AI narrative generation failed:", err);
            }
          }

          setIsLoading(false);
          return;
        }

        let newState = stepResult.nextState ?? currentState;
        const readOnly = newState === currentState;

        if (options.fromSuggestion) {
          const suggestedQuest = QuestManager.generateQuestFromSuggestion(
            nextUserInput,
            newState,
          );
          const suggestionMerge = mergeSuggestedQuestIntoState(
            newState,
            suggestedQuest,
          );

          if (suggestionMerge.added) {
            newState = suggestionMerge.state;
            setState((prevState) =>
              mergeSuggestedQuestIntoState(prevState, suggestedQuest).state,
            );
          }
        }

        const actionResult = {
          success: true,
          actionType: action?.type,
          description: stepResult.summary || `Player said: "${nextUserInput}"`,
          state: newState,
          readOnly,
        };

        const suggestionSource = actionResult.readOnly ? currentState : newState;
        setActionSuggestions(
          resolveActionSuggestionsFlow({
            fallbackSuggestions: buildActionSuggestionsFlow(suggestionSource),
            state: suggestionSource,
          }),
        );

        if (action?.type === "status") {
          const statusString = renderStatusBlock(
            newState.player,
            newState.config,
          );
          addSystemMessage(statusString, "status-update");
          setIsLoading(false);
          return;
        }

        setIsNarrating(true);
        try {
          const promptState = actionResult.readOnly ? currentState : newState;
          const mode = resolvePromptMode(promptState, actionResult);
          const prompt = assemblePrompt(promptState, nextUserInput, actionResult);
          const narrativeResult = await streamNarrative(prompt, promptState, {
            mode,
            userInput: nextUserInput,
            actionResult,
          });
          const intentResolution = applyNarrativeStateIntents(
            promptState,
            narrativeResult?.stateIntents,
          );
          if (intentResolution.state !== promptState) {
            setState(intentResolution.state);
          }
          collectNarrativeOutcomeNotes(intentResolution.notes).forEach((note) =>
            addSystemMessage(note, "system"),
          );

          setState((prevState) => {
            if (typeof evaluateQuestProgress === "function") {
              evaluateQuestProgress(prevState);
            }
            return prevState;
          });
        } catch (err) {
          if (err?.name === "AbortError") return;
          if (shouldLogNarrativeError(err)) {
            console.error("AI narrative generation failed:", err);
          }
        } finally {
          setIsNarrating(false);
        }
      } catch (err) {
        console.error("Error processing input:", err);
        setError(err.message || "An error occurred processing your input.");
        addSystemMessage(
          `Error: ${err.message || "Something went wrong."}`,
          "system",
        );
      } finally {
        busyRef.current = false;
        setIsLoading(false);
      }
    },
    [
      addSystemMessage,
      evaluateQuestProgress,
      setState,
      streamNarrative,
      submitAction,
    ],
  );

  const generateInitialNarrativeText = useCallback(
    async (currentState) => {
      if (busyRef.current) {
        return;
      }
      busyRef.current = true;
      setIsLoading(true);
      setIsNarrating(true);
      setError(null);

      try {
        const cacheKey = createInitialNarrativeCacheKey(currentState);

        if (initialNarrativeKeyRef.current === cacheKey) {
          return;
        }
        initialNarrativeKeyRef.current = cacheKey;

        let aiResponse;
        if (hasInitialNarrativeCache(cacheKey)) {
          aiResponse = getInitialNarrativeCache(cacheKey);
        } else {
          const prompt = buildInitialPrompt(currentState);
          aiResponse = await generateInitialNarrative(prompt);
          setInitialNarrativeCache(cacheKey, aiResponse);
        }
        const initialResult = resolveNarrativeRuntimeOutcome({
          aiResult: aiResponse,
          state: currentState,
          isInitial: true,
        });

        const seededAt = SimBridge.now();
        const seededState = createInitialNarrativeState(
          currentState,
          initialResult.narrative,
          {
            source: initialResult.source,
            timestamp: seededAt,
            mood: initialResult.mood,
            sceneMemory: initialResult.sceneMemory || buildSceneMemorySeed(currentState),
          },
        );

        setState((prevState) => {
          const resolved = { ...prevState, ...seededState };
          if (typeof evaluateQuestProgress === "function") {
            evaluateQuestProgress(resolved);
          }
          return resolved;
        });
        setActionSuggestions(
          resolveActionSuggestionsFlow({
            preferredSuggestions: initialResult.suggestions,
            preferredChoiceMeta: initialResult.choiceMeta,
            fallbackSuggestions: buildActionSuggestionsFlow(seededState),
            state: seededState,
          }),
        );
      } catch (err) {
        if (shouldLogNarrativeError(err)) {
          console.error("Error generating initial narrative:", err);
          setError(err.message || "Failed to generate initial narrative.");
        }
        fallbackCounterRef.current += 1;
        const fallbackResult = resolveNarrativeRuntimeOutcome({
          state: currentState,
          isInitial: true,
          variantSeed: fallbackCounterRef.current,
        });
        setState((prevState) => {
          const nextState = applyNarrativeEntryToState(prevState, {
            type: "narrative",
            text: fallbackResult.narrative,
            timestamp: SimBridge.now(),
            source: fallbackResult.source,
            mood: fallbackResult.mood,
          });
          return {
            ...nextState,
            narrative: {
              ...nextState.narrative,
              summary: fallbackResult.narrative,
              sceneMemory:
                nextState.narrative?.sceneMemory || buildSceneMemorySeed(currentState),
            },
          };
        });
        setActionSuggestions(fallbackResult.suggestions);
      } finally {
        busyRef.current = false;
        setIsLoading(false);
        setIsNarrating(false);
      }
    },
    [evaluateQuestProgress, setState],
  );

  return {
    submitInput,
    generateInitialNarrativeText,
    isLoading,
    isNarrating,
    error,
    userInput,
    setUserInput,
    inputRef,
    actionSuggestions,
  };
}
