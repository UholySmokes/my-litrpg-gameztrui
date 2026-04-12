import { classes } from "../packages/game-core/src/data/registries/ClassDataRegistry.js";
import { races } from "../packages/game-core/src/data/registries/RaceDataRegistry.js";
import { PROFESSIONS } from "../packages/game-core/src/systems/profession/ProfessionRegistry.js";
import catalog from "../packages/game-core/src/data/skills/living_lattice_v2.catalog.json" with { type: "json" };
import { validateEngineProfileShape } from "../packages/game-core/src/systems/abilities/engineProfile.js";

const ACTIVE_ROLES = new Set([
  "strike",
  "guard",
  "mobility",
  "control",
  "field",
  "summon",
  "heal",
  "reaction",
  "ritual",
]);
const PASSIVE_HOOKS = new Set([
  "resource_engine",
  "defense_hook",
  "condition_hook",
  "combo_amplifier",
  "stance_channel_modifier",
  "profession_throughput_rule",
]);
const ALLOWED_FAMILIES = new Set([
  "martial",
  "magic",
  "cultivation",
  "bloodline",
  "profession",
  "universal",
]);
const DISALLOWED_SOURCES = new Set([
  "docx_non_combat_abilities_spells",
  "none",
]);
const PLACEHOLDER_PATTERNS = [
  "fundamental techniques for",
  "complex techniques for",
  "mastery of",
];

function ensure(condition, message, violations) {
  if (!condition) violations.push(message);
}

function main() {
  const violations = [];
  const classIds = new Set(classes.map((entry) => entry.id));
  const raceIds = new Set(races.map((entry) => entry.id));
  const professionIds = new Set(Object.values(PROFESSIONS).map((entry) => entry.id));
  const seen = new Set();
  const classCounts = new Map();
  const raceCounts = new Map();
  const professionCounts = new Map();
  let universalActive = 0;
  let universalPassive = 0;

  (Array.isArray(catalog) ? catalog : []).forEach((skill) => {
    ensure(typeof skill?.id === "string" && skill.id.length > 0, "Missing skill id.", violations);
    if (typeof skill?.id === "string") {
      ensure(!seen.has(skill.id), `Duplicate skill id: ${skill.id}`, violations);
      seen.add(skill.id);
    }
    ensure(typeof skill?.name === "string" && skill.name.trim().length > 0, `Missing name for ${skill?.id}`, violations);
    ensure(typeof skill?.description === "string" && skill.description.trim().length > 0, `Missing description for ${skill?.id}`, violations);
    ensure(typeof skill?.slotType === "string", `Missing slotType for ${skill?.id}`, violations);
    ensure(typeof skill?.ownerType === "string", `Missing ownerType for ${skill?.id}`, violations);
    ensure(typeof skill?.ownerId === "string", `Missing ownerId for ${skill?.id}`, violations);
    ensure(typeof skill?.family === "string" && ALLOWED_FAMILIES.has(skill.family), `Invalid family for ${skill?.id}`, violations);
    ensure(typeof skill?.selectionBand === "string", `Missing selectionBand for ${skill?.id}`, violations);
    ensure(Number.isFinite(skill?.unlockLevel), `Missing unlockLevel for ${skill?.id}`, violations);
    ensure(Array.isArray(skill?.tags), `Missing tags for ${skill?.id}`, violations);
    ensure(skill?.template && typeof skill.template === "object", `Missing template for ${skill?.id}`, violations);
    ensure(
      typeof skill?.template?.source === "string" &&
        skill.template.source.length > 0 &&
        !DISALLOWED_SOURCES.has(skill.template.source),
      `Disallowed template.source for ${skill?.id}`,
      violations,
    );
    ensure(skill?.engineProfile && typeof skill.engineProfile === "object", `Missing engineProfile for ${skill?.id}`, violations);
    const engineValidation = validateEngineProfileShape(skill?.engineProfile);
    ensure(engineValidation.valid, `Invalid engineProfile for ${skill?.id}: ${engineValidation.errors.join(", ")}`, violations);

    const descriptionLower = String(skill?.description || "").toLowerCase();
    PLACEHOLDER_PATTERNS.forEach((pattern) => {
      ensure(!descriptionLower.includes(pattern), `Placeholder prose in ${skill?.id}`, violations);
    });

    if (skill?.slotType === "active") {
      ensure(ACTIVE_ROLES.has(skill?.combatRole), `Invalid combatRole for ${skill?.id}`, violations);
    }
    if (skill?.slotType === "passive") {
      ensure(PASSIVE_HOOKS.has(skill?.passiveHookType), `Invalid passiveHookType for ${skill?.id}`, violations);
    }

    if (skill?.ownerType === "class") {
      ensure(classIds.has(skill.ownerId), `Unknown class owner ${skill.ownerId} for ${skill?.id}`, violations);
      if (!classCounts.has(skill.ownerId)) classCounts.set(skill.ownerId, { active: 0, passive: 0 });
      classCounts.get(skill.ownerId)[skill.slotType] += 1;
    } else if (skill?.ownerType === "race") {
      ensure(raceIds.has(skill.ownerId), `Unknown race owner ${skill.ownerId} for ${skill?.id}`, violations);
      if (!raceCounts.has(skill.ownerId)) raceCounts.set(skill.ownerId, { active: 0, passive: 0 });
      raceCounts.get(skill.ownerId)[skill.slotType] += 1;
    } else if (skill?.ownerType === "profession") {
      ensure(professionIds.has(skill.ownerId), `Unknown profession owner ${skill.ownerId} for ${skill?.id}`, violations);
      if (!professionCounts.has(skill.ownerId)) professionCounts.set(skill.ownerId, { active: 0, passive: 0 });
      professionCounts.get(skill.ownerId)[skill.slotType] += 1;
    } else if (skill?.ownerType === "universal") {
      if (skill.slotType === "active") universalActive += 1;
      if (skill.slotType === "passive") universalPassive += 1;
    } else {
      violations.push(`Unsupported ownerType ${skill?.ownerType} for ${skill?.id}`);
    }
  });

  classes.forEach((entry) => {
    const count = classCounts.get(entry.id);
    ensure(Boolean(count), `Missing class pack for ${entry.id}`, violations);
    ensure(count?.active === 8, `Class ${entry.id} active count must be 8`, violations);
    ensure(count?.passive === 12, `Class ${entry.id} passive count must be 12`, violations);
  });
  races.forEach((entry) => {
    const count = raceCounts.get(entry.id);
    ensure(Boolean(count), `Missing race pack for ${entry.id}`, violations);
    ensure(count?.active === 1, `Race ${entry.id} active count must be 1`, violations);
    ensure(count?.passive === 1, `Race ${entry.id} passive count must be 1`, violations);
  });
  Object.values(PROFESSIONS).forEach((entry) => {
    const count = professionCounts.get(entry.id);
    ensure(Boolean(count), `Missing profession pack for ${entry.id}`, violations);
    ensure(count?.active === 0, `Profession ${entry.id} must not ship active skills`, violations);
    ensure(count?.passive === 5, `Profession ${entry.id} passive count must be 5`, violations);
  });
  ensure(universalActive === 24, `Universal active count must be 24, received ${universalActive}`, violations);
  ensure(universalPassive === 24, `Universal passive count must be 24, received ${universalPassive}`, violations);

  if (violations.length > 0) {
    console.error(`[living-lattice-v2] FAIL violations=${violations.length}`);
    violations.slice(0, 100).forEach((violation) => console.error(`- ${violation}`));
    process.exitCode = 1;
    return;
  }

  console.log(`[living-lattice-v2] PASS skills=${catalog.length}`);
}

main();
