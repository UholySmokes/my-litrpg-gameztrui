import { DataRegistry } from "../data/DataRegistry.js";
import { appendSystemMessages } from "../core/narrativeLog.js";
import { SimBridge } from "../simulation/bridge/SimulationContext.js";

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
      },
      onboardingStepId: stepId,
      tutorialBundleId: bundleId,
    },
  };
}

const OPENING_TUTORIAL_BUNDLES = Object.freeze({
  pilot_meridian_arcology: {
    id: "pilot_meridian_arcology",
    openingArcId: "oa_meridian_arcology_contract_pressure",
    steps: [
      createStep({
        bundleId: "pilot_meridian_arcology",
        questId: "otb_meridian_anchor",
        stepId: "anchor",
        questName: "Read the Contract Pressure",
        questDescription:
          "Meridian only looks orderly from a distance. Read the board, survey the kiosk, or lean on the nearest witness trail until the city reveals its first hook.",
        objectives: [
          {
            id: "otb_meridian_anchor_obj_1",
            description: "Inspect the contract board, kiosk, or witness trail.",
            criteria: {
              actionTypes: ["look", "dialogue", "move"],
              inputIncludes: [
                "board",
                "contract",
                "kiosk",
                "witness",
                "trail",
                "ledger",
                "ilyra",
              ],
            },
            completed: false,
          },
        ],
        allowedActionTypes: ["look", "dialogue", "move"],
        suggestionSet: [
          createSuggestion({
            label: "Inspect the Contract Board",
            command: "look at the contract board",
            category: "observe",
            reason: "The first clean lead is posted in plain sight.",
          }),
          createSuggestion({
            label: "Question Factor Ilyra Venn",
            command: "ask Factor Ilyra Venn about the missing shipment",
            category: "social",
            reason: "Ilyra is already tied to the opening contract pressure.",
          }),
          createSuggestion({
            label: "Survey the Witness Trail",
            command: "look for the witness trail",
            category: "progress",
            weight: 0.9,
            reason: "The trail reveals who moved first and who wants it forgotten.",
          }),
        ],
        completionMessage:
          "Meridian stops feeling abstract. The pressure now has names, routes, and leverage.",
      }),
      createStep({
        bundleId: "pilot_meridian_arcology",
        questId: "otb_meridian_readout",
        stepId: "readout",
        questName: "Stabilize the Field Readout",
        questDescription:
          "Before the city closes its jaws, confirm what this body can actually do and what supplies it brought into the contract spiral.",
        objectives: [
          {
            id: "otb_meridian_readout_obj_1",
            description: "Check your status once.",
            criteria: {
              actionType: "status",
            },
            completed: false,
          },
          {
            id: "otb_meridian_readout_obj_2",
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
            reason: "Lock the build readout before the contract turns hostile.",
          }),
          createSuggestion({
            label: "Open Inventory",
            command: "open inventory",
            category: "power",
            weight: 0.93,
            reason: "Know what tools you can spend before Meridian spends you.",
          }),
        ],
        surfaceUnlocks: ["status", "inventory", "save"],
        completionMessage:
          "The shell stops guessing. Your capabilities and field stock are now readable on demand.",
      }),
      createStep({
        bundleId: "pilot_meridian_arcology",
        questId: "otb_meridian_pressure",
        stepId: "pressure",
        questName: "Choose the Ledger Lead",
        questDescription:
          "The opening contract is live. Press a witness, read the ledger space, or follow the nearest route until the city commits you to the real lead.",
        objectives: [
          {
            id: "otb_meridian_pressure_obj_1",
            description: "Commit to the first Meridian lead.",
            criteria: {
              actionTypes: ["dialogue", "look", "move"],
              inputIncludes: [
                "shipment",
                "witness",
                "ledger",
                "ilyra",
                "board",
                "kiosk",
                "trail",
              ],
            },
            completed: false,
          },
        ],
        allowedActionTypes: ["dialogue", "look", "move"],
        suggestionSet: [
          createSuggestion({
            label: "Press Ilyra for the Witness Name",
            command: "ask Factor Ilyra Venn about the witness",
            category: "social",
            reason: "Social pressure is the fastest way to lock the city’s first direction.",
          }),
          createSuggestion({
            label: "Read the Kiosk for Hidden Clauses",
            command: "look at the exchange kiosk",
            category: "observe",
            weight: 0.93,
            reason: "Meridian hides leverage in plain administrative text.",
          }),
        ],
        surfaceUnlocks: ["map"],
        completionMessage:
          "The contract is no longer ambient noise. Meridian now expects you to move on a real directive.",
      }),
    ],
  },
  pilot_tideward_coast: {
    id: "pilot_tideward_coast",
    openingArcId: "oa_tideward_coast_omen_pressure",
    steps: [
      createStep({
        bundleId: "pilot_tideward_coast",
        questId: "otb_tideward_anchor",
        stepId: "anchor",
        questName: "Read the Tideward Omen",
        questDescription:
          "The coast already answered your arrival. Inspect the shrine signs, listen to the warded pier, or test the air until the omen resolves into a real pressure.",
        objectives: [
          {
            id: "otb_tideward_anchor_obj_1",
            description: "Inspect the shrine or read the omen.",
            criteria: {
              actionTypes: ["look", "magic_sense", "dialogue"],
              inputIncludes: [
                "shrine",
                "omen",
                "sign",
                "sen mareth",
                "ward",
                "pier",
              ],
            },
            completed: false,
          },
        ],
        allowedActionTypes: ["look", "magic_sense", "dialogue"],
        suggestionSet: [
          createSuggestion({
            label: "Inspect the Shrine Signs",
            command: "look at the shrine signs",
            category: "observe",
            reason: "The coast telegraphs its pressure through the shrine first.",
          }),
          createSuggestion({
            label: "Sense the Omen",
            command: "sense ambient essence",
            category: "power",
            weight: 0.95,
            reason: "Tideward responds well to a direct reading of the field.",
          }),
          createSuggestion({
            label: "Question Votary Sen Mareth",
            command: "ask Votary Sen Mareth why the tide spoke your name",
            category: "social",
            weight: 0.9,
            reason: "Mareth is the first stable witness to the omen.",
          }),
        ],
        completionMessage:
          "The omen is no longer just atmosphere. Tideward has started answering back.",
      }),
      createStep({
        bundleId: "pilot_tideward_coast",
        questId: "otb_tideward_readout",
        stepId: "readout",
        questName: "Set Your Coastal Readout",
        questDescription:
          "Before the tide decides what you are worth, confirm your condition and field stock so the shrine pressure does not catch you blind.",
        objectives: [
          {
            id: "otb_tideward_readout_obj_1",
            description: "Check your status once.",
            criteria: {
              actionType: "status",
            },
            completed: false,
          },
          {
            id: "otb_tideward_readout_obj_2",
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
            reason: "Know how seaworn this body is before the pressure spikes.",
          }),
          createSuggestion({
            label: "Open Inventory",
            command: "open inventory",
            category: "power",
            weight: 0.93,
            reason: "The coast punishes players who ignore their first supplies.",
          }),
        ],
        surfaceUnlocks: ["status", "inventory", "save"],
        completionMessage:
          "Your body, resources, and omen pressure are finally readable in the same frame.",
      }),
      createStep({
        bundleId: "pilot_tideward_coast",
        questId: "otb_tideward_pressure",
        stepId: "pressure",
        questName: "Commit to the Omen Trail",
        questDescription:
          "The shrine already named you. Accept that pressure by reading the ward, questioning the Order, or sounding the field until the first real directive locks in.",
        objectives: [
          {
            id: "otb_tideward_pressure_obj_1",
            description: "Commit to the first Tideward lead.",
            criteria: {
              actionTypes: ["look", "magic_sense", "dialogue"],
              inputIncludes: [
                "omen",
                "shrine",
                "ward",
                "order",
                "sen mareth",
                "tide",
              ],
            },
            completed: false,
          },
        ],
        allowedActionTypes: ["look", "magic_sense", "dialogue"],
        suggestionSet: [
          createSuggestion({
            label: "Question the Tideward Order",
            command: "ask Votary Sen Mareth what the Order wants from you",
            category: "social",
            reason: "The Order frames the first playable commitment.",
          }),
          createSuggestion({
            label: "Read the Ward-Carved Pylons",
            command: "look at the ward-carved pylons",
            category: "observe",
            weight: 0.93,
            reason: "The ward tells you what is about to fail.",
          }),
        ],
        surfaceUnlocks: ["map"],
        completionMessage:
          "The coast has stopped testing whether you matter. Tideward is ready to treat you as part of the crisis.",
      }),
    ],
  },
  pilot_skyforge_skydocks: {
    id: "pilot_skyforge_skydocks",
    openingArcId: "oa_skyforge_skydocks_redline_pressure",
    steps: [
      createStep({
        bundleId: "pilot_skyforge_skydocks",
        questId: "otb_skyforge_anchor",
        stepId: "anchor",
        questName: "Read the Redline Incident",
        questDescription:
          "Skyforge is already mid-crisis. Survey the gantry, question the marshal, or read the failing line until the emergency stops feeling like background noise.",
        objectives: [
          {
            id: "otb_skyforge_anchor_obj_1",
            description: "Survey the unstable skydock line.",
            criteria: {
              actionTypes: ["look", "move", "dialogue"],
              inputIncludes: [
                "gantry",
                "marshal",
                "dockmarshal",
                "line",
                "engine",
                "tether",
              ],
            },
            completed: false,
          },
        ],
        allowedActionTypes: ["look", "move", "dialogue"],
        suggestionSet: [
          createSuggestion({
            label: "Survey the Gantry",
            command: "look at the gantry",
            category: "observe",
            reason: "The first threat is spatial and immediate.",
          }),
          createSuggestion({
            label: "Question Dockmarshal Renn Vale",
            command: "ask Dockmarshal Renn Vale what failed first",
            category: "social",
            weight: 0.94,
            reason: "Renn frames the fastest safe read on the emergency.",
          }),
          createSuggestion({
            label: "Inspect the Emergency Tether Rack",
            command: "look at the emergency tether rack",
            category: "progress",
            weight: 0.9,
            reason: "The tether rack points toward your first practical response.",
          }),
        ],
        completionMessage:
          "Skyforge is no longer just loud. You now understand where the line is breaking.",
      }),
      createStep({
        bundleId: "pilot_skyforge_skydocks",
        questId: "otb_skyforge_readout",
        stepId: "readout",
        questName: "Ready the Emergency Readout",
        questDescription:
          "Before the dock asks for speed, confirm your build and supplies so you know what kind of emergency response you can actually survive.",
        objectives: [
          {
            id: "otb_skyforge_readout_obj_1",
            description: "Check your status once.",
            criteria: {
              actionType: "status",
            },
            completed: false,
          },
          {
            id: "otb_skyforge_readout_obj_2",
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
            reason: "Skyforge rewards fast decisions made on real numbers.",
          }),
          createSuggestion({
            label: "Open Inventory",
            command: "open inventory",
            category: "power",
            weight: 0.93,
            reason: "A bad emergency response usually starts with ignored supplies.",
          }),
        ],
        surfaceUnlocks: ["status", "inventory", "save"],
        completionMessage:
          "The emergency stops being guesswork. Your build and kit are now ready for a live line break.",
      }),
      createStep({
        bundleId: "pilot_skyforge_skydocks",
        questId: "otb_skyforge_pressure",
        stepId: "pressure",
        questName: "Commit to the Gantry Response",
        questDescription:
          "The dock is out of time. Reposition, strike, or question the line under pressure until the real first directive locks in.",
        objectives: [
          {
            id: "otb_skyforge_pressure_obj_1",
            description: "Commit to the first Skyforge response.",
            criteria: {
              actionTypes: ["attack", "move", "dialogue"],
              inputIncludes: [
                "gantry",
                "saboteur",
                "renn",
                "line",
                "engine",
                "tether",
                "dock",
              ],
            },
            completed: false,
          },
        ],
        allowedActionTypes: ["attack", "move", "dialogue"],
        suggestionSet: [
          createSuggestion({
            label: "Stabilize the Line",
            command: "look at the engine dais",
            category: "progress",
            reason: "The dais is the cleanest route into the emergency objective.",
          }),
          createSuggestion({
            label: "Press the Marshal for Orders",
            command: "ask Dockmarshal Renn Vale where the line is weakest",
            category: "social",
            weight: 0.92,
            reason: "Renn gives the most direct path into the first real confrontation.",
          }),
          createSuggestion({
            label: "Take the First Aggressive Step",
            command: "attack the saboteur",
            category: "risk",
            weight: 0.88,
            reason: "Skyforge supports a fast combat read if the scene is already hot.",
          }),
        ],
        surfaceUnlocks: ["battle", "map"],
        completionMessage:
          "The redline incident is now yours to answer. Skyforge has shifted from warning to commitment.",
      }),
    ],
  },
});

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

function normalizeBundleId(value) {
  const raw = String(value || "").trim();
  return raw && BUNDLE_BY_ID.has(raw) ? raw : null;
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
      const deferredQuest = DataRegistry.getQuestById(deferredMainQuestId);
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
