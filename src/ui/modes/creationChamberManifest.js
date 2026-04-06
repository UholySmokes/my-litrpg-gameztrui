const CHAMBER_DEFINITIONS = [
  {
    id: "binding-hall",
    title: "Binding Hall",
    subtitle: "Set the designation and bind the governing system.",
    includedSteps: ["name", "system"],
  },
  {
    id: "lineage-vault",
    title: "Lineage Vault",
    subtitle: "Anchor bloodline and personal identity.",
    includedSteps: ["race"],
  },
  {
    id: "doctrine-forge",
    title: "Doctrine Forge",
    subtitle: "Shape class doctrine, branching role, and profession.",
    includedSteps: ["class", "multiclass", "profession"],
  },
  {
    id: "soul-crucible",
    title: "Soul Crucible",
    subtitle: "Allocate power, skill loadout, perks, and narrative alignment.",
    includedSteps: ["attributes", "skills", "perks", "starter-tree", "alignment"],
  },
  {
    id: "oath-mirror",
    title: "Oath Mirror",
    subtitle: "Write the opening command, review the build, and seal the chronicle.",
    includedSteps: ["starting-point", "review"],
  },
];

const ADVANCED_ONLY_STEPS = new Set(["multiclass", "starter-tree"]);

export function buildCreationChamberManifest(advancedUnlocked = false) {
  return CHAMBER_DEFINITIONS.map((chamber) => ({
    ...chamber,
    includedSteps: chamber.includedSteps.filter(
      (stepId) => advancedUnlocked || !ADVANCED_ONLY_STEPS.has(stepId),
    ),
  }));
}

export function getCreationChamberCompletion(chamberId, completionById = {}) {
  const chamber = CHAMBER_DEFINITIONS.find((entry) => entry.id === chamberId);
  if (!chamber) return false;
  return chamber.includedSteps.every((stepId) => completionById[stepId] !== false);
}

export function validateCreationChamber(chamberId, checks = {}) {
  switch (chamberId) {
    case "binding-hall":
      if (!checks.hasName) {
        return { valid: false, error: "A designation is required to proceed from the Binding Hall." };
      }
      if (!checks.hasSystem) {
        return { valid: false, error: "Bind a governing system to proceed. Your designation is set." };
      }
      return { valid: true };
    case "lineage-vault":
      if (!checks.hasRace) {
        return { valid: false, error: "Select a race to proceed from the Lineage Vault." };
      }
      return { valid: true };
    case "doctrine-forge":
      if (!checks.hasClass && !checks.hasProfession) {
        return { valid: false, error: "Select a class and profession to proceed from the Doctrine Forge." };
      }
      if (!checks.hasClass) {
        return { valid: false, error: "Select a class to proceed. Your profession is set." };
      }
      if (!checks.hasProfession) {
        return { valid: false, error: "Select a profession to proceed. Your class is set." };
      }
      return { valid: true };
    case "soul-crucible":
      if (!checks.attributesLocked) {
        return {
          valid: false,
          error: "Allocate all attribute points before proceeding.",
        };
      }
      if (!checks.skillsLocked) {
        return {
          valid: false,
          error: "Complete the required active and passive skill selections. Attributes are locked.",
        };
      }
      if (!checks.perksLocked) {
        return {
          valid: false,
          error: "Choose the required perk package. Attributes and skills are locked.",
        };
      }
      if (checks.requiresStarterTree && !checks.starterTreeLocked) {
        return {
          valid: false,
          error: "Choose a starter tree. Attributes, skills, and perks are locked.",
        };
      }
      if (!checks.alignmentLocked) {
        return {
          valid: false,
          error: "Choose an alignment to complete the Soul Crucible.",
        };
      }
      return { valid: true };
    case "oath-mirror":
      if (!checks.hasStartingPrompt) {
        return {
          valid: false,
          error: "Write a start command before sealing the chronicle.",
        };
      }
      if (!checks.canFinalize) {
        return {
          valid: false,
          error: "The full genesis profile is not valid yet. Review the unresolved selections.",
        };
      }
      return { valid: true };
    default:
      return { valid: true };
  }
}
