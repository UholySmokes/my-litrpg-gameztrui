const STEP_DEFINITIONS = [
  { id: "name", label: "Name", key: "NAME" },
  { id: "system", label: "System", key: "ARCHETYPE" },
  { id: "race", label: "Race", key: "RACE" },
  { id: "class", label: "Class", key: "CLASS" },
  { id: "multiclass", label: "Multiclass", key: "MULTICLASS" },
  { id: "profession", label: "Profession", key: "PROFESSION" },
  { id: "attributes", label: "Attributes", key: "ATTRIBUTES" },
  { id: "skills", label: "Skills", key: "SKILLS" },
  { id: "perks", label: "Perks", key: "PERKS" },
  { id: "starter-tree", label: "Starter Tree", key: "STARTER_TREE" },
  { id: "alignment", label: "Alignment", key: "ALIGNMENT" },
  { id: "starting-point", label: "Starting Point", key: "STARTING_POINT" },
  { id: "review", label: "Review", key: "REVIEW" },
];

const ADVANCED_ONLY_STEP_IDS = new Set(["multiclass", "starter-tree"]);

export function buildCreationStepSequence(steps, advancedUnlocked = false) {
  return STEP_DEFINITIONS.filter(
    (definition) => advancedUnlocked || !ADVANCED_ONLY_STEP_IDS.has(definition.id),
  ).map((definition) => ({
    ...definition,
    step: steps?.[definition.key],
  }));
}

export function findCreationStepIndex(sequence, currentStep) {
  const index = sequence.findIndex((entry) => entry.step === currentStep);
  return index >= 0 ? index : 0;
}

export function getCreationActiveStepId(sequence, currentStep) {
  if (!Array.isArray(sequence) || sequence.length === 0) return "name";
  return sequence[findCreationStepIndex(sequence, currentStep)]?.id || sequence[0].id;
}

export function buildCreationWizardSteps(sequence, currentStep, completionById = {}) {
  const currentIndex = findCreationStepIndex(sequence, currentStep);
  return sequence.map((entry, index) => ({
    id: entry.id,
    label: entry.label,
    step: entry.step,
    status:
      index < currentIndex
        ? "done"
        : completionById?.[entry.id]
          ? "done"
          : index > currentIndex
            ? "locked"
            : "open",
  }));
}

export function calculateCreationSyncProgress(sequence, completionById = {}) {
  const playableSteps = sequence.filter((entry) => entry.id !== "review");
  if (playableSteps.length === 0) return 0;
  const completed = playableSteps.reduce(
    (total, entry) => total + (completionById?.[entry.id] ? 1 : 0),
    0,
  );
  return Math.round((completed / playableSteps.length) * 100);
}
