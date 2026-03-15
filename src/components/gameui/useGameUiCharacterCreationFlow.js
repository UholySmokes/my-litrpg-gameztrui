import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QuestManager } from "../../systems/quest/QuestManager.js";
import { seedWorldAfterCharacterCreation } from "../../world/WorldInitializer.js";
import {
  incrementCharactersCreated,
  isAdvancedCreationUnlocked,
} from "../../core/playerProfile.js";

const TRANSITION_DURATION_MS = 1200;

function buildTransitionAudioProfile(classId) {
  switch (classId) {
    case "warrior":
      return { type: "square", start: 180, end: 420, gain: 0.07, duration: 0.45 };
    case "mage":
      return { type: "sine", start: 300, end: 980, gain: 0.08, duration: 0.5 };
    case "rogue":
      return { type: "triangle", start: 260, end: 720, gain: 0.06, duration: 0.35 };
    case "monk":
      return { type: "sine", start: 200, end: 600, gain: 0.055, duration: 0.4 };
    case "paladin":
      return { type: "sawtooth", start: 220, end: 520, gain: 0.07, duration: 0.5 };
    case "necromancer":
      return { type: "sawtooth", start: 140, end: 420, gain: 0.06, duration: 0.55 };
    case "ranger":
      return { type: "triangle", start: 240, end: 680, gain: 0.06, duration: 0.4 };
    case "berserker":
      return { type: "square", start: 160, end: 520, gain: 0.08, duration: 0.45 };
    default:
      return { type: "sine", start: 220, end: 880, gain: 0.08, duration: 0.5 };
  }
}

function buildCharacterCreationState(state, characterData, initialQuests) {
  const nextQuests = {
    active: initialQuests,
    completed: [],
  };
  const seededWorld = seedWorldAfterCharacterCreation(state?.world, {
    player: characterData,
    quests: nextQuests,
  });

  return {
    ...state,
    player_profile: incrementCharactersCreated(state?.player_profile),
    player: characterData,
    quests: nextQuests,
    world: seededWorld,
  };
}

export function useGameUiCharacterCreationFlow({
  addSystemMessage,
  generateInitialNarrativeText,
  persistLocalAutosave,
  setState,
  state,
}) {
  const [characterCreated, setCharacterCreated] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef(null);
  const transitionAudioRef = useRef(null);

  const advancedCreationUnlocked = useMemo(
    () => isAdvancedCreationUnlocked(state),
    [state],
  );

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      transitionAudioRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!isTransitioning || typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    try {
      if (!transitionAudioRef.current) {
        transitionAudioRef.current = new AudioCtx();
      }
      const ctx = transitionAudioRef.current;
      const now = ctx.currentTime;
      const audioProfile = buildTransitionAudioProfile(
        state?.player?.class?.id || state?.player?.class,
      );
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = audioProfile.type;
      osc.frequency.setValueAtTime(audioProfile.start, now);
      osc.frequency.exponentialRampToValueAtTime(
        audioProfile.end,
        now + audioProfile.duration * 0.5,
      );
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(audioProfile.gain, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + audioProfile.duration,
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + audioProfile.duration + 0.05);
    } catch {
      return;
    }
  }, [isTransitioning, state?.player?.class]);

  const handleCharacterCreationComplete = useCallback(
    async (characterData) => {
      console.log("=== CHARACTER CREATION COMPLETE ===");
      console.log("Character data received:", characterData);

      let initialQuests = [];
      try {
        initialQuests = QuestManager.generateInitialQuests(characterData);
        console.log("Generated initial quests:", initialQuests);
      } catch (error) {
        console.error("Failed to generate initial quests:", error);
        addSystemMessage(
          "Quest generation failed, but you can continue your adventure.",
          "system",
        );
      }

      const nextState = buildCharacterCreationState(
        state,
        characterData,
        initialQuests,
      );

      setState(nextState);
      persistLocalAutosave(nextState, "Character Creation Checkpoint");

      setIsTransitioning(true);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      transitionTimeoutRef.current = setTimeout(() => {
        setCharacterCreated(true);
        setIsTransitioning(false);
      }, TRANSITION_DURATION_MS);

      try {
        await generateInitialNarrativeText(nextState);
      } catch (error) {
        console.error("Failed to generate initial narrative:", error);
        addSystemMessage(
          "Welcome to your adventure! Type commands to begin.",
          "system",
        );
      }
    },
    [
      addSystemMessage,
      generateInitialNarrativeText,
      persistLocalAutosave,
      setState,
      state,
    ],
  );

  return {
    advancedCreationUnlocked,
    characterCreated,
    isTransitioning,
    setCharacterCreated,
    handleCharacterCreationComplete,
  };
}
