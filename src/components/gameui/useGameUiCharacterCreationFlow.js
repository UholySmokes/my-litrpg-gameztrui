import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { seedWorldAfterCharacterCreation } from "../../world/WorldInitializer.js";
import { getLocationById, getZoneById } from "../../world/WorldDataRegistry.js";
import { createInitialChronicleState } from "../../core/ChronicleRuntime.js";
import { clearCharacterCreationDraft } from "./characterCreationDraft.js";
import { QuestManager } from "../../systems/quest/QuestManager.js";
import {
  incrementCharactersCreated,
  isAdvancedCreationUnlocked,
} from "../../core/playerProfile.js";
import { evaluateCharacterReadiness } from "./characterReadiness.js";
import { getOpeningArcByOathOriginId } from "../../world/OpeningArcRegistry.js";

const TRANSITION_DURATION_MS = 2500;

function buildChronicleEntry({
  id,
  kind,
  title,
  body,
  zoneId = null,
  locationId = null,
  meta = {},
}) {
  return {
    id,
    kind,
    title,
    body,
    zoneId,
    locationId,
    timestamp: Date.now(),
    meta,
  };
}

function buildOpeningArcSceneMemory(characterData = {}) {
  const oathOrigin = characterData?.oathOrigin;
  const openingArc = getOpeningArcByOathOriginId(
    oathOrigin?.id || characterData?.startingZoneId,
  );
  if (!openingArc || !oathOrigin?.id) return null;

  const zone = getZoneById(oathOrigin.zoneId || oathOrigin.id);
  const signatureNpcName = openingArc.signatureNpc?.name || null;
  return {
    locationLabel: oathOrigin.name || zone?.name || oathOrigin.id,
    zoneLabel: zone?.name || oathOrigin.name || oathOrigin.id,
    immediateObjective:
      openingArc.firstQuest?.name || openingArc.firstPressure || "Stabilize your footing.",
    presentEntities: signatureNpcName ? [signatureNpcName] : [],
    activeThreats: openingArc.firstPressure ? [openingArc.firstPressure] : [],
    unresolvedHooks: openingArc.firstQuest?.name ? [openingArc.firstQuest.name] : [],
    lastConsequence: `The chronicle sealed in ${oathOrigin.name || oathOrigin.id}.`,
    familiarEntities: signatureNpcName ? [signatureNpcName] : [],
    partyEntities: [],
    socialSummary: signatureNpcName
      ? `${signatureNpcName} is the first reliable contact pulling the opening arc into motion.`
      : "",
  };
}

function buildInitialChronicleState(characterData = {}, seededWorld = {}, nextQuests = {}) {
  const chronicle = createInitialChronicleState();
  const oathOrigin = characterData?.oathOrigin || null;
  const openingArc = getOpeningArcByOathOriginId(
    oathOrigin?.id || characterData?.startingZoneId,
  );
  const locationId = seededWorld?.location?.current || oathOrigin?.locationId || null;
  const zoneId =
    seededWorld?.location?.biome || oathOrigin?.zoneId || characterData?.startingZoneId || null;
  const initialQuest = Array.isArray(nextQuests?.active) ? nextQuests.active[0] || null : null;

  chronicle.entries = [
    buildChronicleEntry({
      id: "chronicle_character_sealed",
      kind: "milestone",
      title: "Character Sealed",
      body: oathOrigin?.name
        ? `${characterData?.name || "The adventurer"} sealed the oath in ${oathOrigin.name}.`
        : `${characterData?.name || "The adventurer"} sealed the chronicle.`,
      zoneId,
      locationId,
      meta: {
        oathOriginId: oathOrigin?.id || null,
        openingArcId: openingArc?.id || characterData?.openingArcId || null,
      },
    }),
    buildChronicleEntry({
      id: "chronicle_first_zone_entered",
      kind: "first",
      title: "First Zone Entered",
      body: oathOrigin?.name
        ? `The first waking zone is ${oathOrigin.name}.`
        : "A first zone has been entered.",
      zoneId,
      locationId,
    }),
  ];
  chronicle.firsts = {
    characterSealed: chronicle.entries[0].timestamp,
    zoneEntered: chronicle.entries[1].timestamp,
  };
  chronicle.discoveries = oathOrigin?.name
    ? [
        {
          id: `discovery_zone_${oathOrigin.id}`,
          label: oathOrigin.name,
          type: "zone",
          zoneId,
          locationId,
        },
      ]
    : [];
  chronicle.majorChoices = oathOrigin?.id
    ? [
        {
          id: `choice_oath_origin_${oathOrigin.id}`,
          kind: "oathOrigin",
          label: oathOrigin.name,
          zoneId,
          locationId,
        },
      ]
    : [];
  chronicle.factionMilestones =
    openingArc?.signatureNpc?.factionId && openingArc?.signatureNpc?.name
      ? [
          {
            id: `faction_contact_${openingArc.signatureNpc.factionId}`,
            factionId: openingArc.signatureNpc.factionId,
            label: openingArc.signatureNpc.name,
            status: "contact-seeded",
          },
        ]
      : [];

  if (initialQuest?.name) {
    chronicle.entries.push(
      buildChronicleEntry({
        id: `chronicle_initial_directive_${initialQuest.id || "opening"}`,
        kind: "quest",
        title: "First Directive",
        body: initialQuest.name,
        zoneId,
        locationId,
      }),
    );
  }

  return chronicle;
}

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
  const openingArc = getOpeningArcByOathOriginId(
    characterData?.oathOrigin?.id || characterData?.startingZoneId,
  );
  const openingSceneMemory = buildOpeningArcSceneMemory(characterData);
  const chronicle = buildInitialChronicleState(characterData, seededWorld, nextQuests);
  const onboardingVars = {
    stage: "arrival",
    hudTier: 1,
    openingArcId: characterData?.openingArcId || openingArc?.id || null,
    entrySceneId: characterData?.entrySceneId || openingArc?.entrySceneId || null,
    tutorialBundleId:
      characterData?.tutorialBundleId || openingArc?.tutorialBundleId || null,
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
        openingArcId: characterData?.openingArcId || openingArc?.id || null,
        entrySceneId: characterData?.entrySceneId || openingArc?.entrySceneId || null,
        tutorialBundleId:
          characterData?.tutorialBundleId || openingArc?.tutorialBundleId || null,
        openingArc: openingArc
          ? {
              id: openingArc.id,
              title: openingArc.title,
              signatureNpc: openingArc.signatureNpc,
              firstPressure: openingArc.firstPressure,
              actionVocabulary: openingArc.actionVocabulary,
              landmarks: openingArc.landmarks,
              unlockReward: openingArc.unlockReward,
            }
          : null,
      },
    },
    narrative: openingSceneMemory
      ? {
          ...(state?.narrative || {}),
          sceneMemory: openingSceneMemory,
        }
      : state?.narrative,
    chronicle,
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
      const oathOrigin = playerObj?.oathOrigin || characterData?.oathOrigin || null;
      const openingArc = getOpeningArcByOathOriginId(
        oathOrigin?.id || characterData?.startingZoneId,
      );
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
          oathOrigin?.name || startingLocation?.name || zone?.name || zoneId || null,
        starterKitLabel: characterData?.starterKitLabel || null,
        firstDirective: openingArc?.firstQuest?.name || null,
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
          `Origin sealed: ${oathOrigin?.name || startingLocation?.name || zone?.name}. Your first directive is ready in the World Atrium.`,
          "system",
        );
      }
      if (openingArc?.firstQuest?.name) {
        addSystemMessage(
          `First directive: ${openingArc.firstQuest.name}.`,
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
