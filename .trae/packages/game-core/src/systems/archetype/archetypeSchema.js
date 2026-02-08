import { z } from 'zod';

/**
 * Zod schema for validating archetype definitions
 * Ensures data quality and consistency across all archetype entries
 */

export const ArchetypeSchema = z.object({
  id: z.string()
    .min(1, "ID is required")
    .regex(/^[a-z0-9_]+$/, "ID must be lowercase snake_case with numbers"),

  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),

  category: z.enum(["System", "Authority", "Path", "Framework", "Privilege", "Overlay"], {
    errorMap: () => ({ message: "Category must be one of: System, Authority, Path, Framework, Privilege, Overlay" })
  }),

  summary: z.string()
    .min(1, "Summary is required")
    .max(120, "Summary must be 120 characters or less"),

  description: z.string()
    .min(1, "Description is required")
    .max(600, "Description must be 600 characters or less"),

  coreLoop: z.array(z.string()
    .min(1, "Core loop item cannot be empty")
    .max(200, "Core loop item must be 200 characters or less")
  )
    .min(3, "Core loop must have at least 3 items")
    .max(5, "Core loop must have at most 5 items"),

  progression: z.array(z.string()
    .min(1, "Progression item cannot be empty")
    .max(200, "Progression item must be 200 characters or less")
  )
    .min(3, "Progression must have at least 3 items")
    .max(5, "Progression must have at most 5 items"),

  narrativeHooks: z.array(z.string()
    .min(1, "Narrative hook cannot be empty")
    .max(200, "Narrative hook must be 200 characters or less")
  )
    .min(2, "Narrative hooks must have at least 2 items")
    .max(4, "Narrative hooks must have at most 4 items"),

  questHooks: z.array(z.string()
    .min(1, "Quest hook cannot be empty")
    .max(200, "Quest hook must be 200 characters or less")
  )
    .min(2, "Quest hooks must have at least 2 items")
    .max(4, "Quest hooks must have at most 4 items"),

  tags: z.array(z.string()
    .min(1, "Tag cannot be empty")
    .regex(/^[a-z-]+$/, "Tag must be lowercase with hyphens")
  )
    .min(2, "Tags must have at least 2 items")
    .max(6, "Tags must have at most 6 items"),

  statModifiers: z.object({
    strength: z.number().optional(),
    agility: z.number().optional(),
    intelligence: z.number().optional(),
    vitality: z.number().optional(),
    wisdom: z.number().optional(),
    luck: z.number().optional(),
    charisma: z.number().optional(),
  }).optional(),

  archetypeResource: z.object({
    name: z.string(),
    startValue: z.number(),
    maxValue: z.number(),
    regenRate: z.number().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex color code"),
  }).optional(),

  archetypePassives: z.array(z.object({
    id: z.string(),
    trigger: z.string(),
    effect: z.string(),
    amount: z.number().optional(),
  })).optional(),

  narrativeTone: z.object({
    voice: z.string(),
    vocabulary: z.array(z.string()),
    forbiddenWords: z.array(z.string()).optional(),
    sentenceStyle: z.string(),
  }).optional()
});

/**
 * Validates a single archetype definition
 * @param {Object} archetype - The archetype to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateArchetype(archetype) {
  const result = ArchetypeSchema.safeParse(archetype);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  let errorsArray = [];
  
  if (result.error && Array.isArray(result.error.errors)) {
      errorsArray = result.error.errors;
  } else if (result.error && typeof result.error.message === 'string') {
      try {
          // Attempt to parse the message as JSON (Zod v4 fallback?)
          const parsed = JSON.parse(result.error.message);
          if (Array.isArray(parsed)) {
              errorsArray = parsed;
          } else {
              errorsArray = [{ path: [], message: result.error.message }];
          }
      } catch (e) {
          // If message is not JSON, use it as single error
          errorsArray = [{ path: [], message: result.error.message }];
      }
  } else {
       console.error("Unknown validation error structure:", result);
       return { valid: false, errors: ["Unknown validation error"] };
  }

  const errors = errorsArray.map(err => {
    const path = (err.path && Array.isArray(err.path)) ? err.path.join('.') : '';
    return path ? `${path}: ${err.message}` : err.message;
  });

  return { valid: false, errors };
}

/**
 * Validates an array of archetype definitions
 * @param {Array} archetypes - Array of archetypes to validate
 * @returns {Object} { valid: boolean, errors: Object, total: number, validCount: number }
 */
export function validateArchetypes(archetypes) {
  const errors = {};
  let validCount = 0;

  if (!Array.isArray(archetypes)) {
      console.error("validateArchetypes expected an array, got:", typeof archetypes);
      return { valid: false, errors: { "root": ["Input is not an array"] }, total: 0, validCount: 0 };
  }

  archetypes.forEach((archetype, index) => {
    const result = validateArchetype(archetype);
    if (result.valid) {
      validCount++;
    } else {
      errors[archetype.id || `index_${index}`] = result.errors;
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    total: archetypes.length,
    validCount
  };
}
