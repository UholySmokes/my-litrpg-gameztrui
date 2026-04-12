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
        return { valid: false, error: "The Binding Hall demands a designation before granting passage." };
      }
      if (!checks.hasSystem) {
        return { valid: false, error: "A governing system must be bound to proceed." };
      }
      return { valid: true };
    case "lineage-vault":
      if (!checks.hasRace) {
        return { valid: false, error: "The Lineage Vault requires a sealed bloodline to permit exit." };
      }
      return { valid: true };
    case "doctrine-forge":
      if (!checks.hasClass && !checks.hasProfession) {
        return { valid: false, error: "The Doctrine Forge requires a chosen Class and Path to proceed." };
      }
      if (!checks.hasClass) {
        return { valid: false, error: "Your soul demands a Doctrine. Bind a class." };
      }
      if (!checks.hasProfession) {
        return { valid: false, error: "Your doctrine is bound, but your path requires a profession." };
      }
      return { valid: true };
    case "soul-crucible":
      if (!checks.attributesLocked) {
        return {
          valid: false,
          error: "The crucible demands all potential be allocated before advancing.",
        };
      }
      if (!checks.skillsLocked) {
        return {
          valid: false,
          error: "Skill synthesis incomplete. Finalize loadout constraints.",
        };
      }
      if (!checks.perksLocked) {
        return {
          valid: false,
          error: "Perk manifestation incomplete.",
        };
      }
      if (checks.requiresStarterTree && !checks.starterTreeLocked) {
        return {
          valid: false,
          error: "A starter talent tree must be grafted.",
        };
      }
      if (!checks.alignmentLocked) {
        return {
          valid: false,
          error: "The Soul Crucible requires a cosmic alignment.",
        };
      }
      return { valid: true };
    case "oath-mirror":
      if (!checks.hasOrigin) {
        return {
          valid: false,
          error: "The Oath needs an origin before it can bind a real first destination.",
        };
      }
      if (!checks.hasStartingPrompt) {
        return {
          valid: false,
          error: "The chronicle requires an opening command before the first turn can begin.",
        };
      }
      if (!checks.canFinalize) {
        return {
          valid: false,
          error: "Your genesis profile is unstable. Resolve anomalies before sealing.",
        };
      }
      return { valid: true };
    default:
      return { valid: true };
  }
}
