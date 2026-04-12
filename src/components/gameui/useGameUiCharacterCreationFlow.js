import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { seedWorldAfterCharacterCreation } from "../../world/WorldInitializer.js";
import { getLocationById, getZoneById } from "../../world/WorldDataRegistry.js";
import { clearCharacterCreationDraft } from "./characterCreationDraft.js";
import { QuestManager } from "../../systems/quest/QuestManager.js";
import {
  incrementCharactersCreated,
  isAdvancedCreationUnlocked,
} from "../../core/playerProfile.js";
import { evaluateCharacterReadiness } from "./characterReadiness.js";

const TRANSITION_DURATION_MS = 2500;

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

export function buildCharacterCreationState(state, characterData) {
  const seededQuests = QuestManager.generateInitialQuests(characterData);
  const nextQuests = {
    active: seededQuests,
    completed: [],
  };
  const seededWorld = seedWorldAfterCharacterCreation(state?.world, {
    player: characterData,
    quests: nextQuests,
  });
  const onboardingVars = {
    stage: "arrival",
    hudTier: 1,
    milestones: {
      creationComplete: true,
      firstStrideSeen: false,
      systemBasicsSeen: false,
      firstConflictSeen: false,
      level2Celebrated: false,
    },
  };

  return {
    ...state,
    player_profile: incrementCharactersCreated(state?.player_profile),
    player: characterData,
    quests: nextQuests,
    world: {
      ...seededWorld,
      vars: {
        ...(seededWorld.vars || {}),
        onboarding: onboardingVars,
      },
    },
  };
}

export function useGameUiCharacterCreationFlow({
  addSystemMessage,
  persistLocalAutosave,
  setState,
  state,
  submitInput,
}) {
  const [characterCreated, setCharacterCreated] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionSummary, setTransitionSummary] = useState(null);
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

      const nextState = buildCharacterCreationState(state, characterData);
      const readiness = evaluateCharacterReadiness(nextState);

      if (!readiness.valid) {
        throw new Error(
          readiness.errors[0] ||
            "Character creation is incomplete. Finish the required selections before starting the adventure.",
        );
      }

      setState(nextState);
      persistLocalAutosave(nextState, "Character Creation Checkpoint");
      clearCharacterCreationDraft();
      setCharacterCreated(true);

      const playerObj = nextState?.player || characterData;
      const startingLocationId = characterData?.startingLocationId || null;
      const startingLocation = startingLocationId
        ? getLocationById(startingLocationId)
        : null;
      const zoneId = startingLocation?.zoneId || characterData?.startingZoneId || null;
      const zone = zoneId ? getZoneById(zoneId) : null;
      setTransitionSummary({
        name: playerObj?.name || "Adventurer",
        className:
          (typeof playerObj?.class === "string"
            ? playerObj.class
            : playerObj?.class?.name) || "Unknown",
        startingPoint:
          startingLocation?.name || zone?.name || zoneId || null,
        starterKitLabel: characterData?.starterKitLabel || null,
      });
      setIsTransitioning(true);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, TRANSITION_DURATION_MS);

      addSystemMessage(
        "Level 1 \u2014 Your chronicle has begun. Earn 100 XP to reach Level 2.",
        "system",
      );
      if (characterData?.starterKitLabel) {
        addSystemMessage(
          `Starter kit bound: ${characterData.starterKitLabel}.`,
          "system",
        );
      }
      if (startingLocation?.name || zone?.name) {
        addSystemMessage(
          `Origin sealed: ${startingLocation?.name || zone?.name}. Your first directive is ready in the World Atrium.`,
          "system",
        );
      }
      const startingPrompt =
        typeof characterData?.startingPrompt === "string"
          ? characterData.startingPrompt.trim()
          : "";
      if (!startingPrompt) {
        addSystemMessage(
          "Welcome to your adventure! Type commands to begin.",
          "system",
        );
        return;
      }

      addSystemMessage(`> ${startingPrompt}`, "user");
      void submitInput(startingPrompt, nextState).catch((error) => {
        console.error("Failed to process custom start command:", error);
        addSystemMessage(
          "Welcome to your adventure! Type commands to begin.",
          "system",
        );
      });
    },
    [
      addSystemMessage,
      persistLocalAutosave,
      setState,
      state,
      submitInput,
    ],
  );

  return {
    advancedCreationUnlocked,
    characterCreated,
    isTransitioning,
    transitionSummary,
    setCharacterCreated,
    handleCharacterCreationComplete,
  };
}
