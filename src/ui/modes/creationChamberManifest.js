const CHAMBER_DEFINITIONS = [
  {
    id: "binding-hall",
    title: "Sigil Vestibule",
    subtitle: "Name the chronicle and bind the ruling system that will govern the descent.",
    includedSteps: ["name", "system"],
  },
  {
    id: "lineage-vault",
    title: "Bloodline Gallery",
    subtitle: "Choose the lineage that will carry the first memory and inherited edge.",
    includedSteps: ["race"],
  },
  {
    id: "doctrine-forge",
    title: "Doctrine Loom",
    subtitle: "Temper combat doctrine, branching path, and worldly trade into one opening role.",
    includedSteps: ["class", "multiclass", "profession"],
  },
  {
    id: "soul-crucible",
    title: "Aether Crucible",
    subtitle: "Temper raw power, loadout, blessings, and alignment into a stable first form.",
    includedSteps: ["attributes", "skills", "perks", "starter-tree", "alignment"],
  },
  {
    id: "oath-mirror",
    title: "First Dawn Seal",
    subtitle: "Choose the landing, script the first invocation, and seal the opening page.",
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
        return { valid: false, error: "The Sigil Vestibule will not open until the chronicle bears a namesake." };
      }
      if (!checks.hasSystem) {
        return { valid: false, error: "A ruling system must be bound before the descent can continue." };
      }
      return { valid: true };
    case "lineage-vault":
      if (!checks.hasRace) {
        return { valid: false, error: "The Bloodline Gallery requires a lineage before it will release you." };
      }
      return { valid: true };
    case "doctrine-forge":
      if (!checks.hasClass && !checks.hasProfession) {
        return { valid: false, error: "The Doctrine Loom requires both a doctrine and a worldly trade." };
      }
      if (!checks.hasClass) {
        return { valid: false, error: "The loom remains slack. Bind a class before you proceed." };
      }
      if (!checks.hasProfession) {
        return { valid: false, error: "Doctrine alone is not enough. Choose the trade that grounds the first page." };
      }
      return { valid: true };
    case "soul-crucible":
      if (!checks.attributesLocked) {
        return {
          valid: false,
          error: "The Aether Crucible demands every unspent ember be assigned before the seal can advance.",
        };
      }
      if (!checks.skillsLocked) {
        return {
          valid: false,
          error: "The loadout is still unresolved. Complete the first discipline pattern.",
        };
      }
      if (!checks.perksLocked) {
        return {
          valid: false,
          error: "The blessing pattern remains unfinished.",
        };
      }
      if (checks.requiresStarterTree && !checks.starterTreeLocked) {
        return {
          valid: false,
          error: "A starter tree must be grafted before the crucible will stabilize.",
        };
      }
      if (!checks.alignmentLocked) {
        return {
          valid: false,
          error: "Choose the moral current that will color the chronicle's opening pressure.",
        };
      }
      return { valid: true };
    case "oath-mirror":
      if (!checks.hasOrigin) {
        return {
          valid: false,
          error: "The First Dawn Seal needs a landing before it can bind a real first destination.",
        };
      }
      if (!checks.hasStartingPrompt) {
        return {
          valid: false,
          error: "Write the first invocation before the archive turns the opening page.",
        };
      }
      if (!checks.canFinalize) {
        return {
          valid: false,
          error: "The dossier is still unstable. Resolve the remaining fractures before sealing.",
        };
      }
      return { valid: true };
    default:
      return { valid: true };
  }
}
