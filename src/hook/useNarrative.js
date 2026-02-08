// =================================================================
// USE NARRATIVE HOOK
// Manages AI narrative flow: parse -> validate -> execute -> generate narrative
// =================================================================

import { useState, useCallback, useRef } from "react";
import {
  assemblePrompt,
  buildInitialPrompt,
  resolvePromptMode,
} from "../core/PromptAssembler.js";
import {
  generateNarrative,
  generateNarrativeStream,
  generateInitialNarrative,
} from "../core/AIService.js";
import { renderStatusBlock } from "../util/statusrenderer.js";
import {
  SimBridge,
  wrapActionExecution,
} from "../simulation/bridge/SimulationBridge.js";
import { appendNarrativeEntry } from "../core/narrativeLog.js";
import { toNumber } from "../utils/shared.js";

const initialNarrativeCache = new Map();

const DEFAULT_ACTION_SUGGESTIONS = [
  { t: "scan surroundings", w: 1 },
  { t: "check status", w: 1 },
  { t: "open inventory", w: 1 },
  { t: "talk to nearby NPC", w: 1 },
];

// Mood inference from narrative text - used to tag entries
const MOOD_PATTERNS = [
  { mood: "tense", patterns: [/danger/i, /threat/i, /ambush/i, /attack/i, /dark/i, /enemy/i, /looming/i] },
  { mood: "triumphant", patterns: [/victory/i, /triumph/i, /succeed/i, /conquer/i, /glory/i, /reward/i] },
  { mood: "mysterious", patterns: [/strange/i, /mystery/i, /whisper/i, /shadow/i, /ancient/i, /secret/i, /hidden/i] },
  { mood: "serene", patterns: [/calm/i, /peace/i, /gentle/i, /rest/i, /quiet/i, /warm/i, /soft/i] },
  { mood: "desperate", patterns: [/flee/i, /escape/i, /wound/i, /bleed/i, /dying/i, /last/i, /barely/i] },
];

function inferMood(text) {
  if (!text || typeof text !== "string") return "neutral";
  for (const { mood, patterns } of MOOD_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return mood;
  }
  return "neutral";
}

const READ_ONLY_ACTIONS = new Set(["look", "inventory", "status"]);
const SUMMARY_REFRESH_INTERVAL = 10;
const shouldRefreshSummary = (narrativeState = {}) => {
  const count = Array.isArray(narrativeState.entries)
    ? narrativeState.entries.length
    : 0;
  return count > 0 && count % SUMMARY_REFRESH_INTERVAL === 0;
};

function computeDominantMood(entries = []) {
  const recentEntries = entries.slice(-5);
  const moodCounts = {};
  for (const e of recentEntries) {
    const m = e.mood || inferMood(e.text) || "neutral";
    moodCounts[m] = (moodCounts[m] || 0) + 1;
  }
  return (
    Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral"
  );
}

function buildSummaryPrompt({ previousSummary, recentLines }) {
  const summarySeed =
    typeof previousSummary === "string" && previousSummary.trim()
      ? previousSummary.trim()
      : "";

  return [
    "You are a summarization engine for an interactive LitRPG game.",
    "Write a concise memory summary of the adventure so far.",
    "Constraints:",
    "- Output plain text only (no JSON, no bullet lists).",
    "- 3 to 6 sentences.",
    "- Include: current location/zone, the main immediate goal, key threats or NPCs, and any notable system effects.",
    "- Keep it under 650 characters.",
    summarySeed ? `\nPrevious summary:\n${summarySeed}` : "",
    "\nRecent events:",
    ...recentLines.map((line) => `- ${line}`),
  ]
    .filter(Boolean)
    .join("\n");
}

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
    // Add skill-specific combat suggestions
    const activeSkills = Array.isArray(player.activeSkills) ? player.activeSkills : [];
    if (activeSkills.length > 0) {
      const skill = activeSkills[Math.floor(Date.now() / 10000) % activeSkills.length];
      if (skill?.name) {
        suggestions.push({ t: `use ${skill.name}`, w: 0.95 });
      }
    }
  } else {
    suggestions.push(
      { t: "explore area", w: 1 },
      { t: "speak with locals", w: 0.9 },
      { t: "review quests", w: (state.quests?.active?.length ?? 0) ? 1 : 0.6 },
      { t: "train skills", w: 0.8 },
    );

    // Archetype-specific exploration suggestions
    const systemLabel = resolveArchetypeSystemLabel(player);
    if (systemLabel) {
      const archetypeRaw = player.archetypeSystem;
      const category = typeof archetypeRaw === "object" ? archetypeRaw?.category : null;
      const systemSuggestions = {
        System: { t: "check system status", w: 0.85 },
        Authority: { t: "exert authority", w: 0.85 },
        Path: { t: "meditate on path", w: 0.85 },
        Framework: { t: "analyze framework", w: 0.85 },
        Privilege: { t: "scan for hidden paths", w: 0.85 },
        Overlay: { t: "probe for exploits", w: 0.85 },
      };
      if (category && systemSuggestions[category]) {
        suggestions.push(systemSuggestions[category]);
      }
    }

    // Location-aware suggestions
    const location = state.world?.location?.current || state.world?.location || "";
    const locationStr = typeof location === "string" ? location : "";
    if (locationStr.includes("town") || locationStr.includes("village") || locationStr.includes("city")) {
      suggestions.push({ t: "visit shop", w: 0.8 });
    }
    if (locationStr.includes("dungeon") || locationStr.includes("cave") || locationStr.includes("ruin")) {
      suggestions.push({ t: "search for treasure", w: 0.85 });
    }
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

  // Quest-specific suggestions
  const activeQuests = Array.isArray(state.quests?.active) ? state.quests.active : [];
  if (activeQuests.length > 0 && !inCombat) {
    const quest = activeQuests[0];
    if (quest?.name) {
      suggestions.push({ t: `pursue ${quest.name}`, w: 0.9 });
    }
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
 * @param {function} dispatchSystemEvent - Function to dispatch system events
 * @param {object} [engine] - SystemEngine instance (from useGameEngine). Falls back to direct imports if not provided.
 * @returns {object} Hook interface with submitInput function and loading state
 */
export function useNarrative(
  setState,
  addSystemMessage,
  evaluateQuestProgress,
  dispatchSystemEvent,
  engine,
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
              mood: inferMood(appendedLine),
            },
          ])
        : filtered;

      const total = augmented.length;
      const lastAtCount = toNumber(narrative.summaryMeta?.atCount, 0);

      const shouldRun = shouldRefreshSummary({ entries: augmented }) && total > lastAtCount;
      if (!shouldRun) return;

      const recentLines = augmented
        .slice(-10)
        .map((e) => {
          const prefix = e.type === "system" ? "System" : e.type === "status-update" ? "Status" : "Narrator";
          return `${prefix}: ${String(e.text || "").trim()}`;
        })
        .filter(Boolean);

      const prompt = buildSummaryPrompt({
        previousSummary: narrative.summary,
        recentLines,
      });

      summaryInFlightRef.current = true;
      try {
        const result = await generateNarrative(prompt);
        const nextSummary = result?.narrative || "";
        if (!nextSummary) return;
        setState((prev) => ({
          ...prev,
          narrative: {
            ...prev.narrative,
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
    [setState, maybeRefreshSummary],
  );

  /**
   * Helper: run streaming narrative, updating a placeholder entry live.
   * Falls back to sync generateNarrative internally.
   */
  const streamNarrative = useCallback(
    async (prompt, prevStateForFallback, { mode } = {}) => {
      // Abort any in-flight stream
      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
      }
      const controller = new AbortController();
      streamAbortRef.current = controller;

      // Insert a placeholder entry that will be updated in-place
      const streamEntryId = `stream_${Date.now()}`;
      setState((prev) =>
        updateNarrativeState(prev, {
          id: streamEntryId,
          type: "narrative",
          text: "",
          timestamp: SimBridge.now(),
          source: "ai-streaming",
        }),
      );

      try {
        const result = await generateNarrativeStream(prompt, {
          signal: controller.signal,
          mode,
          onChunk: (_delta, fullText) => {
            // Live-update the streaming entry in-place
            setState((prev) => {
              const entries = Array.isArray(prev.narrative?.entries)
                ? prev.narrative.entries
                : [];
              const idx = entries.findIndex((e) => e.id === streamEntryId);
              if (idx === -1) return prev;
              const updated = [...entries];
              updated[idx] = { ...updated[idx], text: fullText };
              return {
                ...prev,
                narrative: { ...prev.narrative, entries: updated },
              };
            });
          },
        });

        // Finalize: replace the streaming entry with the guarded result + mood
        setState((prev) => {
          const entries = Array.isArray(prev.narrative?.entries)
            ? prev.narrative.entries
            : [];
          const idx = entries.findIndex((e) => e.id === streamEntryId);
          if (idx === -1) return prev;
          const updated = [...entries];
          updated[idx] = {
            ...updated[idx],
            text: result.narrative,
            source: "ai",
            mood: inferMood(result.narrative),
          };
          const dominantMood = computeDominantMood(updated);
          return {
            ...prev,
            narrative: { ...prev.narrative, entries: updated, currentMood: dominantMood },
          };
        });

        await maybeRefreshSummary({
          stateSnapshot: prevStateForFallback,
          appendedLine: result.narrative,
        });

        return result;
      } catch (error) {
        if (error?.name === "AbortError") throw error;
        // On stream failure, fill the placeholder with fallback
        console.error("Stream narrative failed:", error);
        fallbackCounterRef.current += 1;
        const fallbackText = buildFallbackNarrative({
          state: prevStateForFallback,
          variantSeed: fallbackCounterRef.current,
        });
        setState((prev) => {
          const entries = Array.isArray(prev.narrative?.entries)
            ? prev.narrative.entries
            : [];
          const idx = entries.findIndex((e) => e.id === streamEntryId);
          if (idx === -1) return prev;
          const updated = [...entries];
          updated[idx] = {
            ...updated[idx],
            text: fallbackText,
            source: "fallback",
          };
          return {
            ...prev,
            narrative: { ...prev.narrative, entries: updated },
          };
        });
        return {
          narrative: fallbackText,
          mood: "neutral",
          suggestions: ["Look around", "Check inventory", "Continue"],
        };
      } finally {
        if (streamAbortRef.current === controller) {
          streamAbortRef.current = null;
        }
      }
    },
    [setState],
  );

  const updateNarrativeState = (prevState, entry) => {
    // Auto-tag entries with mood if not already set
    const taggedEntry = entry.mood
      ? entry
      : { ...entry, mood: inferMood(entry.text) };
    const nextNarrative = appendNarrativeEntry(prevState.narrative, taggedEntry, {
      maxEntries: 80,
    });
    const dominantMood = computeDominantMood(nextNarrative.entries || []);
    return {
      ...prevState,
      narrative: {
        ...nextNarrative,
        summary: prevState.narrative?.summary ?? "",
        summaryMeta: prevState.narrative?.summaryMeta,
        currentMood: dominantMood,
      },
    };
  };

  /**
   * Processes user input through the full narrative pipeline
   */
  const submitInput = useCallback(
    async (userInput, currentState) => {
      if (!userInput || !userInput.trim()) {
        return;
      }
      if (busyRef.current) {
        return;
      }
      busyRef.current = true;

      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Parse the user input into an action
        const action = engine
          ? engine.parseAction(userInput, currentState)
          : (await import("../core/InputParser.js")).parseAction(
              userInput,
              currentState,
            );

        // Step 2: Validate the action
        const validation = engine
          ? engine.validateAction(action, currentState)
          : (
              await import("../core/InputValidator.js")
            ).validateActionComprehensive(action, currentState);

        if (!validation.valid) {
          // Action failed validation - add error message and generate narrative about failure
          addSystemMessage(`Action failed: ${validation.reason}`, "system");

          // Generate AI narrative about the failure
          try {
            const failurePrompt = assemblePrompt(currentState, userInput, {
              success: false,
              actionType: action?.type,
              reason: validation.reason,
              description: `Attempted: ${userInput}`,
            });

            const mode = resolvePromptMode(currentState, {
              success: false,
              actionType: action?.type,
            });

            const aiResponse = await streamNarrative(
              failurePrompt,
              currentState,
              { mode },
            );
            // streamNarrative already updated state via onChunk + finalize
          } catch (aiError) {
            if (aiError?.name === "AbortError") return;
            console.error("AI narrative generation failed:", aiError);
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
            actionType: action.type,
            description: `Player said: "${userInput}"`,
            state: currentState,
            readOnly: true,
          };
        } else {
          // Execute state-changing action via engine or direct
          const executeFn = engine
            ? () => engine.executeAction(action, currentState)
            : async () => {
                const { executeAction } = await import(
                  "../core/ActionDispatcher.js"
                );
                return executeAction(currentState, action, {
                  dispatchSystemEvent,
                });
              };

          const execute = () =>
            executeFn();

          actionResult = READ_ONLY_ACTIONS.has(action.type)
            ? await execute()
            : wrapActionExecution(action.type, action, () => execute());
          actionResult = { ...actionResult, actionType: action.type };
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

        // Step 6: Generate AI narrative response (streaming)
        setIsNarrating(true);
        try {
          const promptState = actionResult.readOnly ? currentState : newState;
          const mode = resolvePromptMode(promptState, actionResult);
          const prompt = assemblePrompt(promptState, userInput, actionResult);
          const aiResponse = await streamNarrative(prompt, promptState, { mode });

          // streamNarrative already manages the entry; just evaluate quests
          setState((prevState) => {
            if (typeof evaluateQuestProgress === "function") {
              evaluateQuestProgress(prevState);
            }
            return prevState;
          });
        } catch (aiError) {
          if (aiError?.name === "AbortError") return;
          console.error("AI narrative generation failed:", aiError);
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
    [setState, addSystemMessage, evaluateQuestProgress, dispatchSystemEvent, engine],
  );

  /**
   * Generates initial narrative when game starts
   */
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
        const cacheKeyParts = [
          currentState.world?.vars?.startingSceneId ??
            currentState.world?.flags?.startingSceneId,
          currentState.world?.vars?.current_quest_id ??
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

        // Update narrative history
        const seededState = {
          ...currentState,
          narrative: {
            ...appendNarrativeEntry(
              currentState.narrative,
              {
                type: "narrative",
                text: aiResponse.narrative,
                timestamp: SimBridge.now(),
                source: "ai",
                mood: inferMood(aiResponse.narrative),
              },
              { maxEntries: 80 },
            ),
            summary: aiResponse.narrative,
            summaryMeta: {
              atCount: 1,
              updatedAt: SimBridge.now(),
            },
            currentMood: inferMood(aiResponse.narrative),
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
        setState((prevState) => ({
          ...prevState,
          narrative: {
            ...appendNarrativeEntry(
              prevState.narrative,
              {
                type: "narrative",
                text: fallbackNarrative,
                timestamp: SimBridge.now(),
                source: "fallback",
              },
              { maxEntries: 80 },
            ),
            summary: fallbackNarrative,
          },
        }));
      } finally {
        busyRef.current = false;
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
