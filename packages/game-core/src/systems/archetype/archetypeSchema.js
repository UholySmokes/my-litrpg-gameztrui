import { z } from "zod";

/**
 * Zod schema for validating archetype definitions.
 * Runtime mode stays compatibility-friendly for existing normalized content.
 * Authoring mode adds semantic canon checks for richer rewritten entries.
 */

const CATEGORY_VALUES = [
  "System",
  "Authority",
  "Path",
  "Framework",
  "Privilege",
  "Overlay",
];

const RARITY_VALUES = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "unique",
];

const STABILITY_VALUES = [
  "stable",
  "volatile",
  "unstable",
  "corrupted",
  "forbidden",
];

const PLACEHOLDER_PATTERNS = [
  /placeholder/i,
  /\bunlock further potential\b/i,
  /\bordinary powers cannot solve\b/i,
  /\btodo\b/i,
  /\btbd\b/i,
];

const COSMIC_OVERRIDE_PATTERNS = [
  /\babove (the )?void\b/i,
  /\bsurpass(es|ing)? (the )?grandmother void\b/i,
  /\boverrule(s|ing)? (the )?void\b/i,
  /\babsolute control over reality\b/i,
  /\bomnipotent\b/i,
];

const CATEGORY_REQUIREMENTS = {
  System: {
    includeAny: ["system", "engine", "progression", "growth", "core"],
    limitAny: ["cost", "limit", "burden", "tradeoff", "risk"],
  },
  Authority: {
    includeAny: ["authority", "domain", "command", "rule", "dominion", "sovereign"],
    limitAny: ["bounded", "scope", "contest", "limit", "specific", "domain"],
  },
  Path: {
    includeAny: ["path", "stage", "threshold", "transform", "evolve", "ascend"],
    limitAny: ["bottleneck", "trial", "limit", "threshold", "price", "strain"],
  },
  Framework: {
    includeAny: ["framework", "protocol", "structure", "loop", "manage", "organize"],
    limitAny: ["bounded", "maintenance", "cost", "limit", "dependency", "locality"],
  },
  Privilege: {
    includeAny: ["privilege", "exception", "access", "hidden", "exclusive", "advantage"],
    limitAny: ["exposure", "narrow", "cost", "limit", "risk", "retaliation"],
  },
  Overlay: {
    includeAny: ["overlay", "exploit", "glitch", "instability", "desync", "corrupt"],
    limitAny: ["backlash", "instability", "risk", "strain", "punish", "detection"],
  },
};

const ShortTextArray = z.array(z.string().min(1).max(240)).min(1).max(6);

const NarrativeToneSchema = z.object({
  voice: z.string(),
  vocabulary: z.array(z.string()),
  forbiddenWords: z.array(z.string()).optional(),
  sentenceStyle: z.string(),
});

const ResourceModelSchema = z.union([
  z.string().min(1).max(160),
  z
    .object({
      name: z.string().max(80).optional(),
      flow: z.string().max(160).optional(),
      cap: z.number().optional(),
    })
    .passthrough(),
]);

export const ArchetypeSchema = z.object({
  id: z
    .string()
    .min(1, "ID is required")
    .regex(/^[a-z0-9_]+$/, "ID must be lowercase snake_case with numbers"),

  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),

  category: z.enum(CATEGORY_VALUES, {
    errorMap: () => ({
      message: "Category must be one of: System, Authority, Path, Framework, Privilege, Overlay",
    }),
  }),

  summary: z.string().min(1, "Summary is required").max(120, "Summary must be 120 characters or less"),

  description: z
    .string()
    .min(1, "Description is required")
    .max(600, "Description must be 600 characters or less"),

  coreLoop: z
    .array(z.string().min(1, "Core loop item cannot be empty").max(200, "Core loop item must be 200 characters or less"))
    .min(3, "Core loop must have at least 3 items")
    .max(5, "Core loop must have at most 5 items"),

  progression: z
    .array(z.string().min(1, "Progression item cannot be empty").max(200, "Progression item must be 200 characters or less"))
    .min(3, "Progression must have at least 3 items")
    .max(5, "Progression must have at most 5 items"),

  narrativeHooks: z
    .array(z.string().min(1, "Narrative hook cannot be empty").max(200, "Narrative hook must be 200 characters or less"))
    .min(2, "Narrative hooks must have at least 2 items")
    .max(4, "Narrative hooks must have at most 4 items"),

  questHooks: z
    .array(z.string().min(1, "Quest hook cannot be empty").max(200, "Quest hook must be 200 characters or less"))
    .min(2, "Quest hooks must have at least 2 items")
    .max(4, "Quest hooks must have at most 4 items"),

  tags: z
    .array(z.string().min(1, "Tag cannot be empty").regex(/^[a-z-]+$/, "Tag must be lowercase with hyphens"))
    .min(2, "Tags must have at least 2 items")
    .max(6, "Tags must have at most 6 items"),

  possibleUses: ShortTextArray.optional(),
  limits: ShortTextArray.optional(),
  costs: ShortTextArray.optional(),
  worldCompatibility: ShortTextArray.optional(),
  counterplay: ShortTextArray.optional(),
  progressionStages: ShortTextArray.optional(),
  factionReactions: ShortTextArray.optional(),
  activationModel: z.string().min(1).max(160).optional(),
  resourceModel: ResourceModelSchema.optional(),
  rarity: z.enum(RARITY_VALUES).optional(),
  stability: z.enum(STABILITY_VALUES).optional(),
  selectionWeight: z.number().finite().min(0).max(100).optional(),

  statModifiers: z
    .object({
      strength: z.number().optional(),
      agility: z.number().optional(),
      intelligence: z.number().optional(),
      vitality: z.number().optional(),
      wisdom: z.number().optional(),
      luck: z.number().optional(),
      charisma: z.number().optional(),
    })
    .optional(),

  archetypeResource: z
    .object({
      name: z.string(),
      startValue: z.number(),
      maxValue: z.number(),
      regenRate: z.number().optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex color code"),
    })
    .optional(),

  archetypePassives: z
    .array(
      z.object({
        id: z.string(),
        trigger: z.string(),
        effect: z.string(),
        amount: z.number().optional(),
      }),
    )
    .optional(),

  narrativeTone: NarrativeToneSchema.optional(),
});

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function countSentences(value) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return 0;
  return normalized
    .split(/[.!?]+/g)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function collectTextFragments(archetype) {
  const fragments = [
    archetype.summary,
    archetype.description,
    archetype.activationModel,
    typeof archetype.resourceModel === "string" ? archetype.resourceModel : "",
    ...(Array.isArray(archetype.coreLoop) ? archetype.coreLoop : []),
    ...(Array.isArray(archetype.progression) ? archetype.progression : []),
    ...(Array.isArray(archetype.narrativeHooks) ? archetype.narrativeHooks : []),
    ...(Array.isArray(archetype.questHooks) ? archetype.questHooks : []),
    ...(Array.isArray(archetype.possibleUses) ? archetype.possibleUses : []),
    ...(Array.isArray(archetype.limits) ? archetype.limits : []),
    ...(Array.isArray(archetype.costs) ? archetype.costs : []),
    ...(Array.isArray(archetype.worldCompatibility) ? archetype.worldCompatibility : []),
    ...(Array.isArray(archetype.counterplay) ? archetype.counterplay : []),
    ...(Array.isArray(archetype.progressionStages) ? archetype.progressionStages : []),
    ...(Array.isArray(archetype.factionReactions) ? archetype.factionReactions : []),
    ...(Array.isArray(archetype.tags) ? archetype.tags : []),
  ];
  return fragments.filter((entry) => typeof entry === "string" && normalizeWhitespace(entry).length > 0);
}

function includesAny(text, values) {
  return values.some((value) => text.includes(value));
}

function collectSemanticErrors(archetype) {
  const errors = [];
  const descriptionSentences = countSentences(archetype.description);
  const possibleUsesSentences = countSentences(
    Array.isArray(archetype.possibleUses) ? archetype.possibleUses.join(" ") : "",
  );
  const fragments = collectTextFragments(archetype);
  const combinedText = fragments.join(" ").toLowerCase();

  if (descriptionSentences < 7) {
    errors.push("description: Authoring mode requires at least 7 sentences.");
  }

  if (!Array.isArray(archetype.possibleUses) || archetype.possibleUses.length === 0) {
    errors.push("possibleUses: Authoring mode requires at least 1 possibleUses entry.");
  } else if (possibleUsesSentences < 4) {
    errors.push("possibleUses: Authoring mode requires at least 4 sentences total.");
  }

  for (const field of ["limits", "costs", "worldCompatibility"]) {
    const value = archetype[field];
    if (!Array.isArray(value) || value.length === 0) {
      errors.push(`${field}: Authoring mode requires at least 1 entry.`);
    }
  }

  if (fragments.some((fragment) => PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(fragment)))) {
    errors.push("content: Placeholder or boilerplate text is not allowed in authoring mode.");
  }

  if (COSMIC_OVERRIDE_PATTERNS.some((pattern) => pattern.test(combinedText))) {
    errors.push("worldCompatibility: Entries cannot overrule Void or Grandmother Void.");
  }

  const requirements = CATEGORY_REQUIREMENTS[archetype.category];
  if (requirements) {
    if (!includesAny(combinedText, requirements.includeAny)) {
      errors.push(
        `category: ${archetype.category} entries must express ${requirements.includeAny.slice(0, 3).join(", ")} semantics.`,
      );
    }
    if (!includesAny(combinedText, requirements.limitAny)) {
      errors.push(
        `category: ${archetype.category} entries must declare a bounded limit, cost, or risk.`,
      );
    }
  }

  if (
    archetype.category === "Privilege" &&
    includesAny(combinedText, ["full progression engine", "complete system", "dominates all growth"])
  ) {
    errors.push("category: Privilege entries must remain narrow advantages, not full system engines.");
  }

  if (
    archetype.category === "Overlay" &&
    !includesAny(combinedText, ["backlash", "instability", "detection", "punish", "strain"])
  ) {
    errors.push("category: Overlay entries must describe instability or backlash explicitly.");
  }

  return errors;
}

function getZodIssues(result) {
  if (!result || result.success || !result.error) return [];
  if (Array.isArray(result.error.issues)) return result.error.issues;
  if (Array.isArray(result.error.errors)) return result.error.errors;
  if (typeof result.error.message === "string") {
    try {
      const parsed = JSON.parse(result.error.message);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [{ path: [], message: result.error.message }];
    }
  }
  return [{ path: [], message: "Unknown validation error" }];
}

/**
 * Validates a single archetype definition.
 * @param {Object} archetype
 * @param {{ mode?: "runtime" | "authoring" }} options
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateArchetype(archetype, options = {}) {
  const mode = options.mode === "authoring" ? "authoring" : "runtime";
  const result = ArchetypeSchema.safeParse(archetype);

  const structuralErrors = getZodIssues(result).map((err) => {
    const path = Array.isArray(err.path) ? err.path.join(".") : "";
    return path ? `${path}: ${err.message}` : err.message;
  });

  const semanticErrors =
    result.success && mode === "authoring" ? collectSemanticErrors(result.data) : [];

  const errors = [...structuralErrors, ...semanticErrors];
  return { valid: errors.length === 0, errors };
}

/**
 * Validates an array of archetype definitions.
 * @param {Array} archetypes
 * @param {{ mode?: "runtime" | "authoring" }} options
 * @returns {{ valid: boolean, errors: Object, total: number, validCount: number }}
 */
export function validateArchetypes(archetypes, options = {}) {
  const errors = {};
  let validCount = 0;

  if (!Array.isArray(archetypes)) {
    return {
      valid: false,
      errors: { root: ["Input is not an array"] },
      total: 0,
      validCount: 0,
    };
  }

  archetypes.forEach((archetype, index) => {
    const result = validateArchetype(archetype, options);
    if (result.valid) {
      validCount += 1;
    } else {
      errors[archetype?.id || `index_${index}`] = result.errors;
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    total: archetypes.length,
    validCount,
  };
}
