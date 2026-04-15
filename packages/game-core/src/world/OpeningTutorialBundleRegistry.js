import { DataRegistry } from "../data/DataRegistry.js";
import { appendSystemMessages } from "../core/narrativeLog.js";
import { SimBridge } from "../simulation/bridge/SimulationContext.js";
import { getZoneById } from "./WorldDataRegistry.js";
import { getOpeningArcForPlayer, getPilotOpeningArcs } from "./OpeningArcRegistry.js";

export const OPENING_TUTORIAL_STEP_ORDER = Object.freeze([
  "anchor",
  "readout",
  "pressure",
]);

export const LEGACY_ONBOARDING_QUEST_ALIASES = Object.freeze({
  bq_first_stride: "anchor",
  bq_system_basics: "readout",
  bq_first_conflict: "pressure",
});

export const LEGACY_TUTORIAL_BUNDLE_ID_MAP = Object.freeze({
  pilot_meridian_arcology: "pilot_auric_crown",
  pilot_tideward_coast: "pilot_dawnreef_tangle",
  pilot_skyforge_skydocks: "pilot_skybound_marches",
});

const ONBOARDING_SURFACE_BASE = Object.freeze([
  "chronicle",
  "command",
  "quests",
]);

const ONBOARDING_STAGE_BY_STEP = Object.freeze({
  anchor: "arrival",
  readout: "orientation",
  pressure: "orientation",
});

function createSuggestion({
  label,
  command,
  category,
  weight = 0.96,
  reason,
}) {
  return {
    label,
    command,
    category,
    weight,
    w: weight,
    groundedInState: true,
    reason,
  };
}

function createStep({
  bundleId,
  questId,
  stepId,
  openingArcId,
  zoneId,
  questName,
  questDescription,
  objectives,
  allowedActionTypes,
  suggestionSet,
  surfaceUnlocks = [],
  completionMessage,
}) {
  return {
    stepId,
    allowedActionTypes: Array.isArray(allowedActionTypes)
      ? [...allowedActionTypes]
      : [],
    suggestionSet: Array.isArray(suggestionSet) ? suggestionSet : [],
    surfaceUnlocks: Array.isArray(surfaceUnlocks) ? [...surfaceUnlocks] : [],
    completionMessage,
    questTemplate: {
      id: questId,
      name: questName,
      description: questDescription,
      objectives: Array.isArray(objectives) ? objectives : [],
      rewards: {
        xp: stepId === "pressure" ? 20 : 15,
        items: [],
      },
      tags: {
        starter: true,
        onboarding: true,
        openingBundle: true,
        tutorialBundleId: bundleId,
        onboardingStepId: stepId,
        openingArcId,
        biome: zoneId,
      },
      onboardingStepId: stepId,
      tutorialBundleId: bundleId,
    },
  };
}

function normalizeLabel(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function createObjective(id, description, actionTypes, inputIncludes = []) {
  return {
    id,
    description,
    criteria: {
      actionTypes,
      inputIncludes,
    },
    completed: false,
  };
}

function buildArcBundle(openingArc) {
  const zone = getZoneById(openingArc.oathOriginId);
  const zoneName = zone?.name || normalizeLabel(openingArc.oathOriginId);
  const bundleId = openingArc.tutorialBundleId;
  const npcName = openingArc.signatureNpc?.name || "the first contact";
  const primaryLandmark = openingArc.landmarks?.[0] || zoneName;
  const secondaryLandmark = openingArc.landmarks?.[1] || zoneName;
  const actionVerb = openingArc.actionVocabulary?.[0] || "move";
  const battleUnlock =
    zone?.gameplayType === "combat" ? ["battle", "map"] : ["map"];

  return {
    id: bundleId,
    openingArcId: openingArc.id,
    steps: [
      createStep({
        bundleId,
        questId: `otb_${openingArc.oathOriginId}_anchor`,
        stepId: "anchor",
        openingArcId: openingArc.id,
        zoneId: openingArc.oathOriginId,
        questName: `Read the ${openingArc.title}`,
        questDescription:
          `${zoneName} is already under pressure. Read the field around ${primaryLandmark}, locate ${npcName}, or test the first visible lead until the opening tension stops feeling abstract.`,
        objectives: [
          createObjective(
            `otb_${openingArc.oathOriginId}_anchor_obj_1`,
            `Read the first pressure around ${primaryLandmark}.`,
            ["look", "dialogue", "move", "study", "magic_sense"],
            [
              openingArc.firstPressure,
              primaryLandmark,
              secondaryLandmark,
              npcName,
              ...(openingArc.actionVocabulary || []),
            ].map(normalizeLabel),
          ),
        ],
        allowedActionTypes: ["look", "dialogue", "move", "study", "magic_sense"],
        suggestionSet: [
          createSuggestion({
            label: `Inspect ${primaryLandmark}`,
            command: `look at ${primaryLandmark}`,
            category: "observe",
            reason: "The clearest first clue is embedded in the opening landmark.",
          }),
          createSuggestion({
            label: `Question ${npcName}`,
            command: `ask ${npcName} what changed first`,
            category: "social",
            weight: 0.94,
            reason: "The opening contact knows how the local pressure started moving.",
          }),
          createSuggestion({
            label: `Follow the ${actionVerb} lead`,
            command: `${actionVerb} toward ${secondaryLandmark}`,
            category: "progress",
            weight: 0.9,
            reason: "The second landmark usually points toward the first committed direction.",
          }),
        ],
        completionMessage:
          `${zoneName} has stopped feeling distant. The first pressure now has shape, witnesses, and a direction.`,
      }),
      createStep({
        bundleId,
        questId: `otb_${openingArc.oathOriginId}_readout`,
        stepId: "readout",
        openingArcId: openingArc.id,
        zoneId: openingArc.oathOriginId,
        questName: `Stabilize the ${zoneName} Readout`,
        questDescription:
          `Before ${zoneName} makes further demands, confirm your build and field stock so the next decision is informed instead of improvised.`,
        objectives: [
          {
            id: `otb_${openingArc.oathOriginId}_readout_obj_1`,
            description: "Check your status once.",
            criteria: {
              actionType: "status",
            },
            completed: false,
          },
          {
            id: `otb_${openingArc.oathOriginId}_readout_obj_2`,
            description: "Open your inventory once.",
            criteria: {
              actionType: "inventory",
            },
            completed: false,
          },
        ],
        allowedActionTypes: ["status", "inventory"],
        suggestionSet: [
          createSuggestion({
            label: "Check Status",
            command: "check status",
            category: "power",
            reason: "Confirm exactly what this body can survive before the pressure spikes.",
          }),
          createSuggestion({
            label: "Open Inventory",
            command: "open inventory",
            category: "power",
            weight: 0.93,
            reason: "Crowngrave punishes players who ignore their first supplies.",
          }),
        ],
        surfaceUnlocks: ["status", "inventory", "save"],
        completionMessage:
          "Your shell stops guessing. Build, resources, and immediate risk are now readable on demand.",
      }),
      createStep({
        bundleId,
        questId: `otb_${openingArc.oathOriginId}_pressure`,
        stepId: "pressure",
        openingArcId: openingArc.id,
        zoneId: openingArc.oathOriginId,
        questName: `Commit to the ${openingArc.title}`,
        questDescription:
          `${openingArc.firstPressure} Accept that pressure by taking one clear action that commits you to the local thread.`,
        objectives: [
          createObjective(
            `otb_${openingArc.oathOriginId}_pressure_obj_1`,
            `Commit to ${openingArc.firstQuest?.name || openingArc.title}.`,
            ["look", "dialogue", "move", "study", "magic_sense", "attack"],
            [
              openingArc.firstQuest?.name,
              openingArc.firstPressure,
              npcName,
              primaryLandmark,
              secondaryLandmark,
            ]
              .concat(openingArc.actionVocabulary || [])
              .filter(Boolean)
              .map(normalizeLabel),
          ),
        ],
        allowedActionTypes: ["look", "dialogue", "move", "study", "magic_sense", "attack"],
        suggestionSet: [
          createSuggestion({
            label: `Press ${npcName}`,
            command: `ask ${npcName} what the real directive is`,
            category: "social",
            reason: "The fastest path into the opening directive is usually social pressure.",
          }),
          createSuggestion({
            label: `Read ${secondaryLandmark}`,
            command: `look at ${secondaryLandmark}`,
            category: "observe",
            weight: 0.93,
            reason: "The second landmark usually holds the first hard confirmation.",
          }),
          createSuggestion({
            label: `Advance on ${openingArc.firstQuest?.name || openingArc.title}`,
            command: `${actionVerb} toward ${primaryLandmark}`,
            category: "progress",
            weight: 0.91,
            reason: "You need one decisive action to stop orbiting the pressure and enter it.",
          }),
        ],
        surfaceUnlocks: battleUnlock,
        completionMessage:
          `${zoneName} is no longer testing whether you matter. The opening directive is now live.`,
      }),
    ],
  };
}

const OPENING_TUTORIAL_BUNDLES = Object.freeze(
  Object.fromEntries(
    getPilotOpeningArcs().map((openingArc) => {
      const bundle = buildArcBundle(openingArc);
      return [bundle.id, bundle];
    }),
  ),
);

const BUNDLE_BY_ID = new Map(
  Object.values(OPENING_TUTORIAL_BUNDLES).map((bundle) => [bundle.id, bundle]),
);

const QUEST_ID_TO_BUNDLE_STEP = new Map();
Object.values(OPENING_TUTORIAL_BUNDLES).forEach((bundle) => {
  bundle.steps.forEach((step) => {
    QUEST_ID_TO_BUNDLE_STEP.set(step.questTemplate.id, {
      bundleId: bundle.id,
      stepId: step.stepId,
    });
  });
});

function normalizeStepId(value) {
  const raw = String(value || "").trim().toLowerCase();
  return OPENING_TUTORIAL_STEP_ORDER.includes(raw) ? raw : null;
}

export function resolveOpeningTutorialBundleId(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (BUNDLE_BY_ID.has(raw)) return raw;
  return LEGACY_TUTORIAL_BUNDLE_ID_MAP[raw] || null;
}

function normalizeBundleId(value) {
  return resolveOpeningTutorialBundleId(value);
}

function getOnboardingVars(state = {}) {
  const vars = state?.world?.vars;
  return vars && typeof vars === "object" && !Array.isArray(vars)
    ? vars.onboarding && typeof vars.onboarding === "object" && !Array.isArray(vars.onboarding)
      ? vars.onboarding
      : {}
    : {};
}

function initializeQuest(template = {}) {
  return {
    ...template,
    status: "active",
    acceptedAt: SimBridge.now(),
    progress: {},
    objectives: Array.isArray(template.objectives)
      ? template.objectives.map((objective) => ({
          ...objective,
          completed: false,
        }))
      : [],
  };
}

function getDeferredOpeningQuestTemplate(state = {}, deferredMainQuestId = null) {
  const openingArcQuest =
    state?.player ? getOpeningArcForPlayer(state.player)?.firstQuest : null;
  if (openingArcQuest?.id && openingArcQuest.id === deferredMainQuestId) {
    return openingArcQuest;
  }

  const worldOpeningArcQuest =
    state?.world?.vars?.openingArc &&
    typeof state.world.vars.openingArc === "object" &&
    state.world.vars.openingArc.firstQuest &&
    typeof state.world.vars.openingArc.firstQuest === "object"
      ? state.world.vars.openingArc.firstQuest
      : null;
  if (worldOpeningArcQuest?.id && worldOpeningArcQuest.id === deferredMainQuestId) {
    return worldOpeningArcQuest;
  }

  return null;
}

export function getOpeningTutorialBundle(bundleId) {
  const id = normalizeBundleId(bundleId);
  return id ? BUNDLE_BY_ID.get(id) || null : null;
}

export function getOpeningTutorialStep(bundleId, stepId) {
  const bundle = getOpeningTutorialBundle(bundleId);
  const normalizedStepId = normalizeStepId(stepId);
  if (!bundle || !normalizedStepId) return null;
  return bundle.steps.find((step) => step.stepId === normalizedStepId) || null;
}

export function getOpeningTutorialStepByQuestId(questId) {
  const normalizedQuestId = String(questId || "").trim();
  if (!normalizedQuestId) return null;
  const ref = QUEST_ID_TO_BUNDLE_STEP.get(normalizedQuestId);
  if (!ref) return null;
  return getOpeningTutorialStep(ref.bundleId, ref.stepId);
}

export function createOpeningTutorialQuest(bundleId, stepId) {
  const step = getOpeningTutorialStep(bundleId, stepId);
  return step ? initializeQuest(step.questTemplate) : null;
}

export function getNextOpeningTutorialStep(bundleId, currentStepId) {
  const normalizedCurrentStepId = normalizeStepId(currentStepId);
  if (!normalizedCurrentStepId) return null;
  const currentIndex = OPENING_TUTORIAL_STEP_ORDER.indexOf(normalizedCurrentStepId);
  if (currentIndex < 0) return null;
  return getOpeningTutorialStep(bundleId, OPENING_TUTORIAL_STEP_ORDER[currentIndex + 1] || null);
}

export function getOnboardingBundleId(state = {}) {
  const onboarding = getOnboardingVars(state);
  return (
    normalizeBundleId(onboarding.bundleId) ||
    normalizeBundleId(state?.player?.tutorialBundleId) ||
    normalizeBundleId(getOpeningArcForPlayer(state?.player)?.tutorialBundleId) ||
    null
  );
}

export function getOnboardingCurrentStepId(state = {}) {
  const onboarding = getOnboardingVars(state);
  return normalizeStepId(onboarding.currentStepId);
}

export function getCompletedOnboardingStepIds(state = {}) {
  const onboarding = getOnboardingVars(state);
  const completed = new Set(
    (Array.isArray(onboarding.completedStepIds) ? onboarding.completedStepIds : [])
      .map(normalizeStepId)
      .filter(Boolean),
  );
  const completedQuestIds = Array.isArray(state?.quests?.completed)
    ? state.quests.completed.map((quest) => quest?.id).filter(Boolean)
    : [];
  completedQuestIds.forEach((questId) => {
    const mapped = resolveOnboardingMilestoneId(questId);
    if (mapped) {
      completed.add(mapped);
    }
  });
  const milestones =
    onboarding.milestones && typeof onboarding.milestones === "object"
      ? onboarding.milestones
      : {};
  if (milestones.firstStrideSeen) completed.add("anchor");
  if (milestones.systemBasicsSeen) completed.add("readout");
  if (milestones.firstConflictSeen) completed.add("pressure");
  return OPENING_TUTORIAL_STEP_ORDER.filter((stepId) => completed.has(stepId));
}

export function resolveOnboardingMilestoneId(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return null;
  if (OPENING_TUTORIAL_STEP_ORDER.includes(raw)) {
    return raw;
  }
  if (LEGACY_ONBOARDING_QUEST_ALIASES[raw]) {
    return LEGACY_ONBOARDING_QUEST_ALIASES[raw];
  }
  const bundleRef = QUEST_ID_TO_BUNDLE_STEP.get(raw) || QUEST_ID_TO_BUNDLE_STEP.get(String(value || "").trim());
  return bundleRef?.stepId || null;
}

export function hasCompletedOnboardingMilestone(state = {}, milestoneId) {
  const resolvedMilestoneId = resolveOnboardingMilestoneId(milestoneId);
  if (!resolvedMilestoneId) return false;
  return getCompletedOnboardingStepIds(state).includes(resolvedMilestoneId);
}

export function hasQuestOrOnboardingMilestoneCompleted(state = {}, questId) {
  const normalizedQuestId = String(questId || "").trim();
  if (!normalizedQuestId) return false;
  const completedIds = new Set(
    (Array.isArray(state?.quests?.completed) ? state.quests.completed : [])
      .map((quest) => quest?.id)
      .filter(Boolean),
  );
  if (completedIds.has(normalizedQuestId)) {
    return true;
  }
  return hasCompletedOnboardingMilestone(state, normalizedQuestId);
}

export function deriveOnboardingTierFromState(state = {}) {
  const playerLevel = Number(state?.player?.level || 1);
  if (playerLevel >= 2 || hasCompletedOnboardingMilestone(state, "pressure")) {
    return 3;
  }
  if (
    hasCompletedOnboardingMilestone(state, "anchor") ||
    hasCompletedOnboardingMilestone(state, "readout")
  ) {
    return 2;
  }
  return 1;
}

export function getOpeningTutorialContext(state = {}) {
  const bundleId = getOnboardingBundleId(state);
  const currentStepId = getOnboardingCurrentStepId(state);
  const bundle = getOpeningTutorialBundle(bundleId);
  const currentStep = getOpeningTutorialStep(bundleId, currentStepId);
  const completedStepIds = getCompletedOnboardingStepIds(state);
  const onboarding = getOnboardingVars(state);
  const surfaceUnlockIds = new Set(ONBOARDING_SURFACE_BASE);

  completedStepIds.forEach((stepId) => {
    const step = getOpeningTutorialStep(bundleId, stepId);
    (Array.isArray(step?.surfaceUnlocks) ? step.surfaceUnlocks : []).forEach((surfaceId) => {
      surfaceUnlockIds.add(surfaceId);
    });
  });
  (Array.isArray(currentStep?.surfaceUnlocks) ? currentStep.surfaceUnlocks : []).forEach((surfaceId) => {
    surfaceUnlockIds.add(surfaceId);
  });

  return {
    bundleId,
    bundle,
    currentStepId,
    currentStep,
    completedStepIds,
    deferredMainQuestId:
      typeof onboarding.deferredMainQuestId === "string" && onboarding.deferredMainQuestId.trim()
        ? onboarding.deferredMainQuestId.trim()
        : null,
    deferredMainQuestReady: onboarding.deferredMainQuestReady === true,
    surfaceUnlockIds: Array.from(surfaceUnlockIds),
    active: Boolean(bundle && currentStep),
    tier: deriveOnboardingTierFromState(state),
  };
}

export function isOnboardingSurfaceUnlocked(state = {}, surfaceId) {
  if (!surfaceId) return false;
  return getOpeningTutorialContext(state).surfaceUnlockIds.includes(String(surfaceId).trim());
}

export function promoteOnboardingAfterQuestCompletion(state = {}, completedQuestId) {
  const bundleId = getOnboardingBundleId(state);
  const currentStepId = getOnboardingCurrentStepId(state);
  const currentStep = getOpeningTutorialStep(bundleId, currentStepId);
  const completedStepId = resolveOnboardingMilestoneId(completedQuestId);

  if (!bundleId || !currentStep || !completedStepId || completedStepId !== currentStep.stepId) {
    return state;
  }

  const currentWorld = state?.world && typeof state.world === "object" ? state.world : {};
  const currentVars = currentWorld?.vars && typeof currentWorld.vars === "object" ? currentWorld.vars : {};
  const onboarding = getOnboardingVars(state);
  const completedStepIds = new Set(getCompletedOnboardingStepIds(state));
  completedStepIds.add(completedStepId);

  const nextStep = getNextOpeningTutorialStep(bundleId, currentStep.stepId);
  const nextActiveQuests = Array.isArray(state?.quests?.active) ? [...state.quests.active] : [];
  const completedQuestIds = new Set(
    (Array.isArray(state?.quests?.completed) ? state.quests.completed : [])
      .map((quest) => quest?.id)
      .filter(Boolean),
  );
  const messages = [currentStep.completionMessage].filter(Boolean);

  const deferredMainQuestId =
    typeof onboarding.deferredMainQuestId === "string" && onboarding.deferredMainQuestId.trim()
      ? onboarding.deferredMainQuestId.trim()
      : null;
  let nextCurrentStepId = null;
  let deferredMainQuestReady = onboarding.deferredMainQuestReady === true;
  let nextCurrentQuestId = null;

  if (nextStep) {
    const nextQuestId = nextStep.questTemplate.id;
    const alreadyActive = nextActiveQuests.some((quest) => quest?.id === nextQuestId);
    const alreadyCompleted = completedQuestIds.has(nextQuestId);
    if (!alreadyActive && !alreadyCompleted) {
      nextActiveQuests.push(createOpeningTutorialQuest(bundleId, nextStep.stepId));
    }
    nextCurrentStepId = nextStep.stepId;
    nextCurrentQuestId = nextQuestId;
    deferredMainQuestReady = false;
    messages.push(`Current pressure updated: ${nextStep.questTemplate.name}.`);
  } else {
    deferredMainQuestReady = Boolean(deferredMainQuestId);
    if (
      deferredMainQuestId &&
      !nextActiveQuests.some((quest) => quest?.id === deferredMainQuestId) &&
      !completedQuestIds.has(deferredMainQuestId)
    ) {
      const deferredQuest =
        DataRegistry.getQuestById(deferredMainQuestId) ||
        getDeferredOpeningQuestTemplate(state, deferredMainQuestId);
      if (deferredQuest) {
        nextActiveQuests.push(initializeQuest(deferredQuest));
        nextCurrentQuestId = deferredMainQuestId;
        messages.push(`Directive promoted: ${deferredQuest.name}.`);
      }
    }
    if (!nextCurrentQuestId) {
      nextCurrentQuestId = nextActiveQuests[0]?.id || null;
    }
  }

  const milestones = {
    ...(onboarding.milestones && typeof onboarding.milestones === "object"
      ? onboarding.milestones
      : {}),
  };
  if (completedStepId === "anchor") milestones.firstStrideSeen = true;
  if (completedStepId === "readout") milestones.systemBasicsSeen = true;
  if (completedStepId === "pressure") milestones.firstConflictSeen = true;

  let nextState = {
    ...state,
    quests: {
      ...(state?.quests || {}),
      active: nextActiveQuests,
    },
    world: {
      ...currentWorld,
      vars: {
        ...currentVars,
        current_quest_id: nextCurrentQuestId,
        onboarding: {
          ...onboarding,
          bundleId,
          currentStepId: nextCurrentStepId,
          completedStepIds: OPENING_TUTORIAL_STEP_ORDER.filter((stepId) => completedStepIds.has(stepId)),
          deferredMainQuestId,
          deferredMainQuestReady,
          stage: ONBOARDING_STAGE_BY_STEP[nextCurrentStepId] || (nextCurrentStepId ? "orientation" : "milestone"),
          milestones,
        },
      },
    },
  };

  if (messages.length > 0) {
    nextState = appendSystemMessages(nextState, messages);
  }

  return nextState;
}
