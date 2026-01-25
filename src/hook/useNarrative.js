// =================================================================
// USE NARRATIVE HOOK
// Manages AI narrative flow: parse -> validate -> execute -> generate narrative
// =================================================================

import { useState, useCallback, useRef } from "react";
import { parseAction } from "../core/InputParser.js";
import { validateActionComprehensive } from "../core/InputValidator.js";
import { executeAction } from "../core/ActionDispatcher.js";
import { assemblePrompt, buildInitialPrompt } from "../core/PromptAssembler.js";
import {
  generateNarrative,
  generateInitialNarrative,
} from "../core/AIService.js";
import { renderStatusBlock } from "../util/statusrenderer.js";
import {
  SimBridge,
  wrapActionExecution,
} from "../simulation/bridge/SimulationBridge.js";

const initialNarrativeCache = new Map();

const DEFAULT_ACTION_SUGGESTIONS = [
  { t: "scan surroundings", w: 1 },
  { t: "check status", w: 1 },
  { t: "open inventory", w: 1 },
  { t: "talk to nearby NPC", w: 1 },
];

const READ_ONLY_ACTIONS = new Set(["look", "inventory", "status"]);

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function buildActionSuggestions(state) {
  if (!state) {
    return DEFAULT_ACTION_SUGGESTIONS;
  }

  const suggestions = [];
  const player = state.player || {};
  const inCombat = Boolean(
    state.combat?.inCombat ?? state.combat?.status === "active",
  );

  if (inCombat) {
    suggestions.push(
      { t: "attack enemy", w: 1 },
      { t: "use skill", w: 1 },
      { t: "drink potion", w: player.inventory?.length ? 0.9 : 0.6 },
      { t: "attempt escape", w: 0.7 },
    );
  } else {
    suggestions.push(
      { t: "explore area", w: 1 },
      { t: "speak with locals", w: 0.9 },
      { t: "review quests", w: (state.quests?.active?.length ?? 0) ? 1 : 0.6 },
      { t: "train skills", w: 0.8 },
    );
  }

  const hpCurrent = toNumber(
    typeof player.hp === "object" ? player.hp?.current : player.hp,
    toNumber(player.health, 0),
  );
  const hpMax = toNumber(
    typeof player.hp === "object"
      ? player.hp?.max
      : (player.maxHp ?? player.maxHealth),
    1,
  );

  if (hpCurrent < 0.3 * Math.max(1, hpMax)) {
    suggestions.push({ t: "rest to recover", w: 0.9 });
  }

  if (!player.profession) {
    suggestions.push({ t: "choose profession", w: 0.8 });
  }

  const uniqueSuggestions = suggestions.filter(
    (suggestion, index, arr) =>
      arr.findIndex((s) => s.t === suggestion.t) === index,
  );

  return uniqueSuggestions.length
    ? uniqueSuggestions
    : DEFAULT_ACTION_SUGGESTIONS;
}

/**
 * Custom hook for managing AI narrative and user actions
 * @param {function} setState - Function to update game state
 * @param {function} addSystemMessage - Function to add messages to chat log
 * @param {function} evaluateQuestProgress - Function to evaluate quest progress
 * @returns {object} Hook interface with submitInput function and loading state
 */
export function useNarrative(
  setState,
  addSystemMessage,
  evaluateQuestProgress,
  dispatchSystemEvent,
) {
  const [isLoading, setIsLoading] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [error, setError] = useState(null);
  const [userInput, setUserInput] = useState("");
  const inputRef = useRef(null);
  const initialNarrativeKeyRef = useRef(null);
  const [actionSuggestions, setActionSuggestions] = useState(
    DEFAULT_ACTION_SUGGESTIONS,
  );

  /**
   * Processes user input through the full narrative pipeline
   */
  const submitInput = useCallback(
    async (userInput, currentState) => {
      if (!userInput || !userInput.trim()) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Parse the user input into an action
        const action = parseAction(userInput, currentState);

        // Step 2: Validate the action
        const validation = validateActionComprehensive(action, currentState);

        if (!validation.valid) {
          // Action failed validation - add error message and generate narrative about failure
          addSystemMessage(`Action failed: ${validation.reason}`, "system");

          // Generate AI narrative about the failure
          try {
            const failurePrompt = assemblePrompt(currentState, userInput, {
              success: false,
              reason: validation.reason,
              description: `Attempted: ${userInput}`,
            });

            const aiResponse = await generateNarrative(failurePrompt);
            addSystemMessage(aiResponse.narrative, "narrative");
          } catch (aiError) {
            console.error("AI narrative generation failed:", aiError);
            addSystemMessage(
              `You cannot do that. ${validation.reason}`,
              "system",
            );
          }

          setIsLoading(false);
          return;
        }

        // Step 3: Execute the action (if it changes state)
        let actionResult;
        let newState = currentState;

        if (action.type === "narrative" || action.readOnly) {
          // Read-only actions don't change state
          actionResult = {
            success: true,
            description: `Player said: "${userInput}"`,
            state: currentState,
            readOnly: true,
          };
        } else {
          // Execute state-changing action
          const execute = () =>
            executeAction(currentState, action, {
              dispatchSystemEvent,
            });

          actionResult = READ_ONLY_ACTIONS.has(action.type)
            ? execute()
            : wrapActionExecution(action.type, action, execute);
          newState = actionResult.state;
        }

        // Step 4: Update game state if action succeeded
        if (actionResult.success && !actionResult.readOnly) {
          setState(newState);
          if (typeof evaluateQuestProgress === "function") {
            evaluateQuestProgress(newState);
          }
          SimBridge.advanceTick();
        }

        const suggestionSource = actionResult.readOnly
          ? currentState
          : newState;
        setActionSuggestions(buildActionSuggestions(suggestionSource));

        // Step 5: Handle special actions (like status display)
        if (actionResult.showStatus) {
          const statusString = renderStatusBlock(
            newState.player,
            newState.config,
          );
          addSystemMessage(statusString, "status-update");
          setIsLoading(false);
          return;
        }

        // Step 6: Generate AI narrative response
        setIsNarrating(true);
        try {
          const prompt = assemblePrompt(currentState, userInput, actionResult);
          const aiResponse = await generateNarrative(prompt);

          // Add AI narrative to chat log
          addSystemMessage(aiResponse.narrative, "narrative");

          // Update narrative history in state
          const updatedState = (prevState) => ({
            ...prevState,
            narrative: {
              ...prevState.narrative,
              chatLog: [
                ...(prevState.narrative?.chatLog || []),
                {
                  type: "narrative",
                  text: aiResponse.narrative,
                  timestamp: SimBridge.now(),
                },
              ].slice(-50), // Keep last 50 messages for history
            },
          });

          setState((prevState) => {
            const resolved = updatedState(prevState);
            if (typeof evaluateQuestProgress === "function") {
              evaluateQuestProgress(resolved);
            }
            return resolved;
          });
        } catch (aiError) {
          console.error("AI narrative generation failed:", aiError);
          // Fallback message if AI fails
          if (actionResult.success) {
            addSystemMessage(
              actionResult.description || "Action completed successfully.",
              "system",
            );
          } else {
            addSystemMessage(
              actionResult.reason || "Action could not be completed.",
              "system",
            );
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
        setIsLoading(false);
      }
    },
    [setState, addSystemMessage, evaluateQuestProgress, dispatchSystemEvent],
  );

  /**
   * Generates initial narrative when game starts
   */
  const generateInitialNarrativeText = useCallback(
    async (currentState) => {
      setIsLoading(true);
      setIsNarrating(true);
      setError(null);

      try {
        const cacheKeyParts = [
          currentState.world?.flags?.startingSceneId,
          currentState.world?.flags?.current_quest_id,
          ...(currentState.quests?.active || []).map((q) => q?.id).sort(),
          typeof currentState.player?.race === "string"
            ? currentState.player?.race
            : currentState.player?.race?.id,
          typeof currentState.player?.class === "string"
            ? currentState.player?.class
            : currentState.player?.class?.id,
          typeof currentState.player?.profession === "string"
            ? currentState.player?.profession
            : currentState.player?.profession?.id,
        ];
        const cacheKey = cacheKeyParts.filter(Boolean).join("|");

        if (initialNarrativeKeyRef.current === cacheKey) {
          return;
        }
        initialNarrativeKeyRef.current = cacheKey;

        let aiResponse;
        if (initialNarrativeCache.has(cacheKey)) {
          aiResponse = initialNarrativeCache.get(cacheKey);
        } else {
          const prompt = buildInitialPrompt(currentState);
          aiResponse = await generateInitialNarrative(prompt);
          initialNarrativeCache.set(cacheKey, aiResponse);
        }

        addSystemMessage(aiResponse.narrative, "narrative");

        // Update narrative history
        const seededState = {
          ...currentState,
          narrative: {
            ...currentState.narrative,
            summary: aiResponse.narrative,
            chatLog: [
              {
                type: "narrative",
                text: aiResponse.narrative,
                timestamp: SimBridge.now(),
              },
            ],
          },
        };

        setState((prevState) => {
          const resolved = { ...prevState, ...seededState };
          if (typeof evaluateQuestProgress === "function") {
            evaluateQuestProgress(resolved);
          }
          return resolved;
        });
        setActionSuggestions(buildActionSuggestions(seededState));
      } catch (err) {
        console.error("Error generating initial narrative:", err);
        setError(err.message || "Failed to generate initial narrative.");
        addSystemMessage(
          "Welcome to your LitRPG adventure! Type your actions to begin.",
          "system",
        );
      } finally {
        setIsLoading(false);
        setIsNarrating(false);
      }
    },
    [setState, addSystemMessage, evaluateQuestProgress],
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
