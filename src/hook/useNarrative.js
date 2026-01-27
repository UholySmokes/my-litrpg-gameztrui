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

function resolveArchetypeSystemLabel(player = {}) {
  const raw = player.archetypeSystem;
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw.name || raw.id || null;
  }
  return null;
}

function pickVariant(options, seed) {
  if (!Array.isArray(options) || options.length === 0) return "";
  const safeSeed = Number.isFinite(seed) ? seed : Date.now();
  const index = Math.abs(Math.floor(safeSeed)) % options.length;
  return options[index];
}

function buildFallbackNarrative({
  userInput,
  actionResult,
  state,
  isInitial = false,
  variantSeed,
}) {
  const player = state?.player || {};
  const systemLabel = resolveArchetypeSystemLabel(player);
  const location =
    state?.world?.location?.current ||
    state?.world?.location ||
    "the current zone";
  const name = player.name || "The wanderer";
  const classLabel =
    typeof player.class === "string"
      ? player.class
      : player.class?.name || "adventurer";

  if (isInitial) {
    const quests = Array.isArray(state?.quests?.active)
      ? state.quests.active
      : [];
    const questHint = quests.length
      ? `A new directive forms around "${quests[0].name}".`
      : "No directives surface yet, only the weight of possibility.";
    const systemLine = systemLabel
      ? pickVariant(
          [
            `The ${systemLabel} hums softly, ready to shape your path.`,
            `The ${systemLabel} awakens, its protocols aligning to your steps.`,
            `The ${systemLabel} steadies, searching for its first leverage point.`,
          ],
          variantSeed,
        )
      : pickVariant(
          [
            "The world hums with latent system energy.",
            "A low-grade system pulse flickers through the air.",
            "Something unseen calibrates the world around you.",
          ],
          variantSeed,
        );
    return `${name}, a ${classLabel}, arrives at ${location}. ${systemLine} ${questHint}`;
  }

  const trimmedInput = typeof userInput === "string" ? userInput.trim() : "";
  const fallbackAction =
    actionResult?.description ||
    (trimmedInput ? `You attempt to ${trimmedInput}` : "You take action");
  const lowerInput = trimmedInput.toLowerCase();
  const verbHints = [
    "explore",
    "look",
    "scan",
    "speak",
    "talk",
    "open",
    "review",
    "train",
    "rest",
    "attack",
    "use",
    "cast",
    "travel",
    "move",
    "search",
    "inspect",
    "read",
    "listen",
    "follow",
    "enter",
    "leave",
    "check",
  ];
  const startsWithVerb = verbHints.some(
    (verb) =>
      lowerInput === verb || lowerInput.startsWith(`${verb} `),
  );
  let actionText = fallbackAction.replace(/^Player said:\s*/i, "You say: ");
  if (trimmedInput) {
    if (!startsWithVerb && !lowerInput.includes(" ")) {
      actionText = `You check ${trimmedInput}`;
    } else if (startsWithVerb) {
      actionText =
        variantSeed && variantSeed % 2 === 0
          ? `You attempt to ${trimmedInput}`
          : `You ${trimmedInput}`;
    } else {
      actionText = `You attempt to ${trimmedInput}`;
    }
  }
  const reasonText =
    actionResult?.reason || "something blocks the way";
  const successLine = actionResult?.success
    ? pickVariant(
        [
          `${actionText}. The world shifts around you, then settles.`,
          `${actionText}. A faint current passes through the air.`,
          `${actionText}. The moment answers with a subtle change of tone.`,
          `${actionText}. Your intent echoes, then quiets.`,
        ],
        variantSeed,
      )
    : pickVariant(
        [
          `${actionText}, but ${reasonText}.`,
          `${actionText}. ${reasonText} blocks the attempt.`,
          `${actionText}, yet ${reasonText} keeps it out of reach.`,
        ],
        variantSeed,
      );
  const systemLine = systemLabel
    ? pickVariant(
        [
          `Your ${systemLabel} stirs, watching for leverage.`,
          `The ${systemLabel} records the moment, seeking an opening.`,
          `A muted pulse from the ${systemLabel} lingers at the edge of thought.`,
          `${systemLabel} remains attentive, mapping possible outcomes.`,
        ],
        variantSeed,
      )
    : pickVariant(
        [
          "The system remains watchful.",
          "A soft system ping fades into silence.",
          "No system directive follows—only the ambient hum.",
        ],
        variantSeed,
      );
  return `${successLine} ${systemLine}`;
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
  const fallbackCounterRef = useRef(0);

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
            setState((prevState) => ({
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
                ].slice(-50),
              },
            }));
          } catch (aiError) {
            console.error("AI narrative generation failed:", aiError);
            fallbackCounterRef.current += 1;
            const fallbackNarrative = buildFallbackNarrative({
              userInput,
              actionResult: { success: false, reason: validation.reason },
              state: currentState,
              variantSeed: fallbackCounterRef.current,
            });
            addSystemMessage(fallbackNarrative, "narrative");
            setState((prevState) => ({
              ...prevState,
              narrative: {
                ...prevState.narrative,
                chatLog: [
                  ...(prevState.narrative?.chatLog || []),
                  {
                    type: "narrative",
                    text: fallbackNarrative,
                    timestamp: SimBridge.now(),
                  },
                ].slice(-50),
              },
            }));
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
          fallbackCounterRef.current += 1;
          const fallbackNarrative = buildFallbackNarrative({
            userInput,
            actionResult,
            state: actionResult.readOnly ? currentState : newState,
            variantSeed: fallbackCounterRef.current,
          });
          addSystemMessage(fallbackNarrative, "narrative");
          setState((prevState) => ({
            ...prevState,
            narrative: {
              ...prevState.narrative,
              chatLog: [
                ...(prevState.narrative?.chatLog || []),
                {
                  type: "narrative",
                  text: fallbackNarrative,
                  timestamp: SimBridge.now(),
                },
              ].slice(-50),
            },
          }));
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
        fallbackCounterRef.current += 1;
        const fallbackNarrative = buildFallbackNarrative({
          state: currentState,
          isInitial: true,
          variantSeed: fallbackCounterRef.current,
        });
        addSystemMessage(fallbackNarrative, "narrative");
        setState((prevState) => ({
          ...prevState,
          narrative: {
            ...prevState.narrative,
            summary: fallbackNarrative,
            chatLog: [
              {
                type: "narrative",
                text: fallbackNarrative,
                timestamp: SimBridge.now(),
              },
            ],
          },
        }));
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
