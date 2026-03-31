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
    subtitle: "Anchor origin, bloodline, and personal identity.",
    includedSteps: ["identity", "race"],
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
    subtitle: "Review the whole build and seal the chronicle.",
    includedSteps: ["review"],
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
        return { valid: false, error: "Choose a designation before leaving the Binding Hall." };
      }
      if (!checks.hasSystem) {
        return { valid: false, error: "Bind a system before leaving the Binding Hall." };
      }
      return { valid: true };
    case "lineage-vault":
      if (!checks.hasOrigin) {
        return { valid: false, error: "Select an origin before leaving the Lineage Vault." };
      }
      if (!checks.hasRace) {
        return { valid: false, error: "Choose a race before leaving the Lineage Vault." };
      }
      return { valid: true };
    case "doctrine-forge":
      if (!checks.hasClass) {
        return { valid: false, error: "Choose a class before leaving the Doctrine Forge." };
      }
      if (!checks.hasProfession) {
        return { valid: false, error: "Choose a profession before leaving the Doctrine Forge." };
      }
      return { valid: true };
    case "soul-crucible":
      if (!checks.attributesLocked) {
        return {
          valid: false,
          error: "Allocate all attribute points before leaving the Soul Crucible.",
        };
      }
      if (!checks.skillsLocked) {
        return {
          valid: false,
          error: "Complete the required active and passive skill selections first.",
        };
      }
      if (!checks.perksLocked) {
        return {
          valid: false,
          error: "Choose the required perk package before leaving the Soul Crucible.",
        };
      }
      if (!checks.starterTreeLocked) {
        return {
          valid: false,
          error: "Choose a starter tree before leaving the Soul Crucible.",
        };
      }
      if (!checks.alignmentLocked) {
        return {
          valid: false,
          error: "Choose an alignment before leaving the Soul Crucible.",
        };
      }
      return { valid: true };
    case "oath-mirror":
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
