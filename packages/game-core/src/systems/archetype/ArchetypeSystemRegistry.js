// =================================================================
// ARCHETYPE SYSTEM REGISTRY
// LitRPG framework selection (Systems / Authorities / Privileges /
// Paths / Overlays / Frameworks)
// =================================================================

import systemsData from "../../data/archetypes/systems.json" with { type: "json" };
import authoritiesData from "../../data/archetypes/authorities.json" with { type: "json" };
import pathsData from "../../data/archetypes/paths.json" with { type: "json" };
import frameworksData from "../../data/archetypes/frameworks.json" with { type: "json" };
import privilegesData from "../../data/archetypes/privileges.json" with { type: "json" };
import overlaysData from "../../data/archetypes/overlays.json" with { type: "json" };
import { validateArchetype } from "./archetypeSchema.js";

// -----------------------------------------------------------------
// Category configuration: integrity baselines, stat affinities,
// flavor text, and visual theming for each archetype category.
// -----------------------------------------------------------------
export const CATEGORY_CONFIG = {
  System: {
    integrity: 100,
    label: "System",
    color: "#00F3FF",
    icon: "\u2699",
    description:
      "Structured progression frameworks with reliable, quantifiable growth mechanics.",
    statAffinities: { intelligence: 3, wisdom: 2 },
    narrativeTone: "analytical",
  },
  Authority: {
    integrity: 95,
    label: "Authority",
    color: "#FFD700",
    icon: "\u2655",
    description:
      "Sovereign mandates granting rule-level dominance over specific domains.",
    statAffinities: { strength: 2, vitality: 2, charisma: 1 },
    narrativeTone: "commanding",
  },
  Path: {
    integrity: 92,
    label: "Path",
    color: "#96F2D7",
    icon: "\u2726",
    description: "Ritualized ascension routes that evolve your fundamental nature.",
    statAffinities: { wisdom: 3, vitality: 1, luck: 1 },
    narrativeTone: "mystical",
  },
  Framework: {
    integrity: 90,
    label: "Framework",
    color: "#E599F7",
    icon: "\u25A6",
    description: "Meta-structural overlays that rewrite how game rules apply to you.",
    statAffinities: { intelligence: 2, agility: 2, luck: 1 },
    narrativeTone: "cerebral",
  },
  Privilege: {
    integrity: 88,
    label: "Privilege",
    color: "#8CE99A",
    icon: "\u2756",
    description: "Covert advantages that grant hidden knowledge and stealth benefits.",
    statAffinities: { agility: 3, luck: 2 },
    narrativeTone: "conspiratorial",
  },
  Overlay: {
    integrity: 85,
    label: "Overlay",
    color: "#FF8787",
    icon: "\u26A0",
    description: "Volatile system exploits with high reward and escalating instability.",
    statAffinities: { strength: 3, agility: 2 },
    narrativeTone: "chaotic",
  },
};

const DEFAULT_CATEGORY_CONFIG = {
  integrity: 85,
  label: "Unknown",
  color: "#AAAAAA",
  icon: "\u2731",
  description: "An unclassified archetype system.",
  statAffinities: {},
  narrativeTone: "neutral",
};

const CATEGORY_ORDER = [
  "System",
  "Authority",
  "Path",
  "Framework",
  "Privilege",
  "Overlay",
];

const FIELD_MINIMUMS = {
  coreLoop: 3,
  progression: 3,
  narrativeHooks: 2,
  questHooks: 2,
};

const FIELD_TARGETS = {
  coreLoop: 4,
  progression: 4,
  narrativeHooks: 3,
  questHooks: 3,
};

const FIELD_TEXT_LIMITS = {
  summary: 120,
  description: 600,
  listItem: 200,
  name: 100,
};

const PLACEHOLDER_PATTERNS = [
  /placeholder/i,
  /\bunlock further potential\b/i,
  /\btodo\b/i,
  /\btbd\b/i,
];

const BOILERPLATE_PATTERNS = [
  /secure a key resource that stabilizes/i,
  /defeat a rival who wields a competing version/i,
  /resolve a crisis ordinary powers cannot solve/i,
];

const DEFAULT_RESOURCES = {
  System: { name: "System Energy", color: "#00F3FF" },
  Authority: { name: "Mandate", color: "#FFD700" },
  Path: { name: "Insight", color: "#96F2D7" },
  Framework: { name: "Structure", color: "#E599F7" },
  Privilege: { name: "Leverage", color: "#8CE99A" },
  Overlay: { name: "Instability", color: "#FF8787" },
};

const IMPACT_BASE = {
  System: {
    xpGainMultiplier: 0.08,
    questRewardMultiplier: 0.06,
    skillGrowthMultiplier: 0.12,
    goldGainMultiplier: 0.03,
    resourceGainMultiplier: 0.06,
    lootQualityBonus: 0.04,
    resourceCapMultiplier: 0.12,
    classEvolutionStepReduction: 0,
    riskScale: 0.02,
  },
  Authority: {
    xpGainMultiplier: 0.05,
    questRewardMultiplier: 0.1,
    skillGrowthMultiplier: 0.05,
    goldGainMultiplier: 0.08,
    resourceGainMultiplier: 0.05,
    lootQualityBonus: 0.08,
    resourceCapMultiplier: 0.08,
    classEvolutionStepReduction: 0,
    riskScale: 0.05,
  },
  Path: {
    xpGainMultiplier: 0.07,
    questRewardMultiplier: 0.07,
    skillGrowthMultiplier: 0.08,
    goldGainMultiplier: 0.04,
    resourceGainMultiplier: 0.07,
    lootQualityBonus: 0.05,
    resourceCapMultiplier: 0.1,
    classEvolutionStepReduction: 1,
    riskScale: 0.03,
  },
  Framework: {
    xpGainMultiplier: 0.06,
    questRewardMultiplier: 0.08,
    skillGrowthMultiplier: 0.09,
    goldGainMultiplier: 0.04,
    resourceGainMultiplier: 0.06,
    lootQualityBonus: 0.05,
    resourceCapMultiplier: 0.15,
    classEvolutionStepReduction: 0,
    riskScale: 0.04,
  },
  Privilege: {
    xpGainMultiplier: 0.04,
    questRewardMultiplier: 0.08,
    skillGrowthMultiplier: 0.06,
    goldGainMultiplier: 0.12,
    resourceGainMultiplier: 0.08,
    lootQualityBonus: 0.1,
    resourceCapMultiplier: 0.08,
    classEvolutionStepReduction: 0,
    riskScale: 0.04,
  },
  Overlay: {
    xpGainMultiplier: 0.1,
    questRewardMultiplier: 0.09,
    skillGrowthMultiplier: 0.08,
    goldGainMultiplier: 0.06,
    resourceGainMultiplier: 0.1,
    lootQualityBonus: 0.12,
    resourceCapMultiplier: 0.06,
    classEvolutionStepReduction: 1,
    riskScale: 0.14,
  },
};

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeTag(tag) {
  const normalized = normalizeWhitespace(tag)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized;
}

function truncateText(value, limit) {
  const normalized = normalizeWhitespace(value).replace(/[“”â€œâ€]/g, "\"");
  if (!normalized) return "";
  if (normalized.length <= limit) return normalized;
  const clipped = normalized.slice(0, Math.max(0, limit - 1)).trimEnd();
  return clipped.endsWith(".") ? clipped : `${clipped}.`;
}

function sanitizeId(rawId, fallbackName, fallbackIndex) {
  const source = normalizeWhitespace(rawId || fallbackName || `archetype_${fallbackIndex}`);
  const id = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return id || `archetype_${fallbackIndex}`;
}

function canonicalNameKey(name, category) {
  return `${category}|${normalizeWhitespace(name)
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()}`;
}

function sanitizeList(values, { field } = {}) {
  const source = Array.isArray(values) ? values : [];
  const seen = new Set();
  const out = [];

  for (const raw of source) {
    let line = truncateText(raw, FIELD_TEXT_LIMITS.listItem);
    if (!line) continue;

    if (line.includes("...") || line.includes("â€¦")) {
      if (line.length < 140 || line.endsWith("...") || line.endsWith("â€¦")) {
        continue;
      }
      line = line.replace(/\.{3,}|â€¦+/g, ".").replace(/\s+\./g, ".").trim();
    }

    if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(line))) continue;
    if (BOILERPLATE_PATTERNS.some((pattern) => pattern.test(line))) continue;

    // Keep lines implementable/actionable; avoid vague filler.
    if (
      field === "progression" &&
      /\b(further potential|ordinary powers)\b/i.test(line)
    ) {
      continue;
    }

    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }

  return out;
}

function buildCategoryTemplates(category, name) {
  const categoryLabel = category || "System";
  return {
    coreLoop: [
      `Trigger ${name}'s ${categoryLabel.toLowerCase()} protocol by completing a focused objective tied to your current build.`,
      `Convert objective outcomes into a bounded resource and route it into offensive, defensive, and utility tracks.`,
      `Spend accumulated resource on branch unlocks that alter combat rotations and quest resolution paths.`,
      `Reinvest overflow into long-horizon nodes that permanently change growth priorities.`,
    ],
    progression: [
      `Tier I grants a baseline passive that accelerates one progression channel while introducing a clear tradeoff.`,
      `Tier II unlocks a branch choice with mutually exclusive upgrades that force build identity.`,
      `Tier III grants a permanent systemic bonus that scales with completed directives and high-risk encounters.`,
      `Tier IV unlocks a capstone interaction that rewires endgame progression and quest rewards.`,
    ],
    narrativeHooks: [
      `Factions notice ${name} and shift diplomacy based on your growth curve and threat profile.`,
      `Every major upgrade introduces a visible consequence that can be exploited by rivals.`,
      `Your choices under ${name} create a distinct reputation track that affects future opportunities.`,
    ],
    questHooks: [
      `Complete a category-specific trial to unlock the next ${name} milestone.`,
      `Resolve a subsystem anomaly that blocks your active branch before the next progression window closes.`,
      `Trade a short-term gain for a permanent ${name} upgrade in a timed scenario.`,
    ],
    tags: [
      normalizeTag(categoryLabel),
      "progression",
      "systemic-impact",
    ],
  };
}

function ensureExtensiveList(field, values, context) {
  const cleaned = sanitizeList(values, { field });
  const templates = buildCategoryTemplates(context.category, context.name)[field];
  const target = FIELD_TARGETS[field] || FIELD_MINIMUMS[field] || 1;
  const required = FIELD_MINIMUMS[field] || 1;
  let index = 0;

  while (cleaned.length < target) {
    const next = templates[index % templates.length];
    if (!cleaned.includes(next)) cleaned.push(next);
    index += 1;
  }

  if (cleaned.length < required) {
    return templates.slice(0, required);
  }

  return cleaned;
}

function ensureTags(tags, category, name) {
  const source = Array.isArray(tags) ? tags : [];
  const cleaned = [];
  const seen = new Set();
  for (const rawTag of source) {
    const tag = normalizeTag(rawTag);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    cleaned.push(tag);
  }

  const fallback = buildCategoryTemplates(category, name).tags;
  for (const tag of fallback) {
    if (!seen.has(tag)) {
      seen.add(tag);
      cleaned.push(tag);
    }
  }

  return cleaned.slice(0, 8);
}

function ensureNarrativeTone(rawTone, category, name, summary, tags) {
  const catConfig = getCategoryConfig(category);
  const vocabularySeed = [
    ...String(name || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3),
    ...String(summary || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 4),
    ...(Array.isArray(tags) ? tags : []),
  ];
  const vocabulary = [];
  const seen = new Set();
  for (const entry of vocabularySeed) {
    const word = normalizeTag(entry).replace(/-/g, "");
    if (!word || seen.has(word)) continue;
    seen.add(word);
    vocabulary.push(word);
    if (vocabulary.length >= 6) break;
  }

  const tone = rawTone && typeof rawTone === "object" ? rawTone : {};
  return {
    voice:
      typeof tone.voice === "string" && tone.voice.trim()
        ? tone.voice.trim()
        : `${catConfig.narrativeTone || "neutral"} and grounded`,
    vocabulary:
      Array.isArray(tone.vocabulary) && tone.vocabulary.length > 0
        ? tone.vocabulary
            .map((word) => normalizeWhitespace(word).toLowerCase())
            .filter(Boolean)
            .slice(0, 8)
        : vocabulary,
    sentenceStyle:
      typeof tone.sentenceStyle === "string" && tone.sentenceStyle.trim()
        ? tone.sentenceStyle.trim()
        : "structured, consequence-aware",
    ...(Array.isArray(tone.forbiddenWords) && tone.forbiddenWords.length
      ? { forbiddenWords: tone.forbiddenWords.slice(0, 8) }
      : {}),
  };
}

function ensurePassives(rawPassives, id) {
  const source = Array.isArray(rawPassives) ? rawPassives : [];
  const passives = source
    .filter((entry) => entry && typeof entry === "object")
    .map((entry, index) => ({
      id:
        typeof entry.id === "string" && entry.id.trim()
          ? entry.id.trim()
          : `${id}_passive_${index + 1}`,
      trigger:
        typeof entry.trigger === "string" && entry.trigger.trim()
          ? entry.trigger.trim()
          : "passive",
      effect:
        typeof entry.effect === "string" && entry.effect.trim()
          ? entry.effect.trim()
          : "stat_boost",
      ...(Number.isFinite(entry.amount) ? { amount: entry.amount } : { amount: 1 }),
    }));

  if (passives.length > 0) return passives;
  return [
    {
      id: `${id}_passive_1`,
      trigger: "passive",
      effect: "stat_boost",
      amount: 1,
    },
  ];
}

function ensureResource(rawResource, category) {
  const defaults = DEFAULT_RESOURCES[category] || DEFAULT_RESOURCES.System;
  const source = rawResource && typeof rawResource === "object" ? rawResource : {};
  return {
    name:
      typeof source.name === "string" && source.name.trim()
        ? source.name.trim()
        : defaults.name,
    startValue: clamp(toNumber(source.startValue, 0), 0, 9999),
    maxValue: clamp(toNumber(source.maxValue, 100), 1, 9999),
    regenRate: clamp(toNumber(source.regenRate, 1), 0, 100),
    color:
      typeof source.color === "string" && /^#[0-9A-Fa-f]{6}$/.test(source.color)
        ? source.color
        : defaults.color,
  };
}

function ensureStatModifiers(rawModifiers, category) {
  const affinity = getCategoryConfig(category).statAffinities || {};
  const source = rawModifiers && typeof rawModifiers === "object" ? rawModifiers : {};
  const keys = [
    "strength",
    "agility",
    "intelligence",
    "vitality",
    "wisdom",
    "luck",
    "charisma",
  ];
  const next = {};
  keys.forEach((key) => {
    const value = toNumber(source[key], toNumber(affinity[key], 0));
    if (value !== 0) next[key] = value;
  });
  return next;
}

function countWords(value) {
  return normalizeWhitespace(value).split(/\s+/).filter(Boolean).length;
}

function computeDepthScore(def) {
  const listWordCount = [
    ...(def.coreLoop || []),
    ...(def.progression || []),
    ...(def.narrativeHooks || []),
    ...(def.questHooks || []),
  ].reduce((sum, line) => sum + countWords(line), 0);
  const narrativeWordCount = countWords(def.summary) + countWords(def.description);
  const structuralScore =
    def.coreLoop.length * 8 +
    def.progression.length * 10 +
    def.narrativeHooks.length * 6 +
    def.questHooks.length * 6 +
    def.tags.length * 3;
  const contentScore = Math.min(28, Math.floor((listWordCount + narrativeWordCount) / 35));
  const milestoneSignal = def.progression.some((line) =>
    /\b(tier|milestone|unlock|branch|permanent|capstone|evolve)\b/i.test(line),
  )
    ? 8
    : 0;
  return clamp(structuralScore + contentScore + milestoneSignal, 0, 100);
}

function computeProgressionImpact(def, depthScore) {
  const category = def.category;
  const base = { ...(IMPACT_BASE[category] || IMPACT_BASE.System) };
  const tags = new Set((def.tags || []).map((tag) => normalizeTag(tag)));

  if (tags.has("crafting") || tags.has("industry")) {
    base.goldGainMultiplier += 0.06;
    base.resourceGainMultiplier += 0.05;
    base.lootQualityBonus += 0.04;
  }
  if (tags.has("knowledge") || tags.has("learning")) {
    base.skillGrowthMultiplier += 0.06;
    base.xpGainMultiplier += 0.03;
  }
  if (tags.has("evolution") || tags.has("ascension")) {
    base.classEvolutionStepReduction += 1;
    base.xpGainMultiplier += 0.03;
  }
  if (tags.has("economy") || tags.has("trade")) {
    base.goldGainMultiplier += 0.08;
    base.questRewardMultiplier += 0.03;
  }
  if (tags.has("survival") || tags.has("retry")) {
    base.questRewardMultiplier += 0.04;
    base.resourceGainMultiplier += 0.04;
  }
  if (tags.has("luck") || tags.has("rng")) {
    base.lootQualityBonus += 0.06;
  }
  if (tags.has("risk") || tags.has("chaos")) {
    base.riskScale += 0.08;
    base.questRewardMultiplier += 0.02;
  }

  if (depthScore >= 85) {
    base.questRewardMultiplier += 0.02;
    base.xpGainMultiplier += 0.02;
    base.resourceCapMultiplier += 0.03;
  }

  base.xpGainMultiplier = clamp(base.xpGainMultiplier, 0, 0.25);
  base.questRewardMultiplier = clamp(base.questRewardMultiplier, 0, 0.25);
  base.skillGrowthMultiplier = clamp(base.skillGrowthMultiplier, 0, 0.3);
  base.goldGainMultiplier = clamp(base.goldGainMultiplier, 0, 0.3);
  base.resourceGainMultiplier = clamp(base.resourceGainMultiplier, 0, 0.3);
  base.lootQualityBonus = clamp(base.lootQualityBonus, 0, 0.3);
  base.resourceCapMultiplier = clamp(base.resourceCapMultiplier, 0, 0.4);
  base.classEvolutionStepReduction = clamp(base.classEvolutionStepReduction, 0, 3);
  base.riskScale = clamp(base.riskScale, 0, 0.4);
  return base;
}

function buildImplementationProfile(def, depthScore, progressionImpact) {
  const surfaces = ["quest_generation"];
  if (progressionImpact.xpGainMultiplier > 0) surfaces.push("xp_progression");
  if (progressionImpact.goldGainMultiplier > 0) surfaces.push("economy");
  if (progressionImpact.resourceGainMultiplier > 0) surfaces.push("resource_growth");
  if (progressionImpact.lootQualityBonus > 0) surfaces.push("loot_progression");
  if (progressionImpact.skillGrowthMultiplier > 0) surfaces.push("skill_progression");
  if (progressionImpact.classEvolutionStepReduction > 0) {
    surfaces.push("class_evolution");
  }

  return {
    implementable: true,
    progressionDepth: depthScore >= 85 ? "very_high" : depthScore >= 70 ? "high" : "moderate",
    surfaces,
    requiresResourceModel: Boolean(def.archetypeResource),
    requiresBranchChoice: def.progression.some((line) => /\bbranch|choice\b/i.test(line)),
  };
}

function normalizeSingleDefinition(rawDefinition, index) {
  const category = CATEGORY_ORDER.includes(rawDefinition?.category)
    ? rawDefinition.category
    : "System";
  const provisionalName = truncateText(rawDefinition?.name || `Archetype ${index + 1}`, FIELD_TEXT_LIMITS.name);
  const id = sanitizeId(rawDefinition?.id, provisionalName, index + 1);
  const name = provisionalName || `Archetype ${index + 1}`;
  const summary = truncateText(
    rawDefinition?.summary || `${name} drives high-impact ${category.toLowerCase()} progression.`,
    FIELD_TEXT_LIMITS.summary,
  );
  const description = truncateText(
    rawDefinition?.description ||
      `${name} provides a category-specific progression framework with branching upgrades and systemic consequences.`,
    FIELD_TEXT_LIMITS.description,
  );

  const normalized = {
    id,
    name,
    category,
    summary,
    description,
    coreLoop: ensureExtensiveList("coreLoop", rawDefinition?.coreLoop, { category, name }),
    progression: ensureExtensiveList("progression", rawDefinition?.progression, { category, name }),
    narrativeHooks: ensureExtensiveList("narrativeHooks", rawDefinition?.narrativeHooks, { category, name }),
    questHooks: ensureExtensiveList("questHooks", rawDefinition?.questHooks, { category, name }),
    tags: ensureTags(rawDefinition?.tags, category, name),
    statModifiers: ensureStatModifiers(rawDefinition?.statModifiers, category),
    archetypeResource: ensureResource(rawDefinition?.archetypeResource, category),
    archetypePassives: ensurePassives(rawDefinition?.archetypePassives, id),
  };

  normalized.narrativeTone = ensureNarrativeTone(
    rawDefinition?.narrativeTone,
    category,
    name,
    summary,
    normalized.tags,
  );

  const depthScore = computeDepthScore(normalized);
  const progressionImpact = computeProgressionImpact(normalized, depthScore);
  normalized.progressionImpact = progressionImpact;
  normalized.quality = {
    depthScore,
    hasPlaceholderText: false,
    categoryWeight: getCategoryConfig(category).integrity,
  };
  normalized.implementationProfile = buildImplementationProfile(
    normalized,
    depthScore,
    progressionImpact,
  );

  // Final structural validation against schema (after normalization).
  const validation = validateArchetype(normalized);
  if (!validation.valid) return null;
  return normalized;
}

function choosePreferredDefinition(existing, candidate) {
  const existingScore = toNumber(existing?.quality?.depthScore, 0);
  const candidateScore = toNumber(candidate?.quality?.depthScore, 0);
  return candidateScore > existingScore ? candidate : existing;
}

function normalizeDefinitions(rawDefinitions) {
  const source = Array.isArray(rawDefinitions) ? rawDefinitions : [];
  const byId = new Map();
  const byConcept = new Map();

  source.forEach((rawDefinition, index) => {
    const normalized = normalizeSingleDefinition(rawDefinition, index);
    if (!normalized) return;

    const idCollision = byId.get(normalized.id);
    if (idCollision) {
      byId.set(normalized.id, choosePreferredDefinition(idCollision, normalized));
      return;
    }

    const conceptKey = canonicalNameKey(normalized.name, normalized.category);
    const conceptCollision = byConcept.get(conceptKey);
    if (conceptCollision) {
      const winner = choosePreferredDefinition(conceptCollision, normalized);
      byConcept.set(conceptKey, winner);
      byId.delete(conceptCollision.id);
      byId.set(winner.id, winner);
      return;
    }

    byConcept.set(conceptKey, normalized);
    byId.set(normalized.id, normalized);
  });

  return Array.from(byId.values());
}

/**
 * Returns the category configuration for a given category string.
 * @param {string} category
 * @returns {object}
 */
export function getCategoryConfig(category) {
  return CATEGORY_CONFIG[category] || DEFAULT_CATEGORY_CONFIG;
}

class ArchetypeSystem {
  constructor(data) {
    Object.assign(this, data);
  }

  /**
   * Builds an active system instance for a character.
   * @param {Object} context
   * @returns {Object}
   */
  build(context = {}) {
    const catConfig = getCategoryConfig(this.category);
    const integrity = catConfig.integrity;

    let tone = this.narrativeTone;
    if (!tone || typeof tone !== "object") {
      tone = {
        voice: catConfig.narrativeTone || "neutral",
        vocabulary: [],
        sentenceStyle: "standard",
      };
    }

    const instance = {
      archetypeId: this.id,
      name: this.name,
      category: this.category,
      active: true,
      systemIntegrity: integrity,
      narrativeTone: tone,
      categoryIcon: catConfig.icon,
      categoryColor: catConfig.color,
      tags: Array.isArray(this.tags) ? [...this.tags] : [],
      progressionImpact:
        this.progressionImpact && typeof this.progressionImpact === "object"
          ? { ...this.progressionImpact }
          : {},
      quality:
        this.quality && typeof this.quality === "object"
          ? { ...this.quality }
          : {},
      state: { ...context },
      definition: this,
    };

    if (this.archetypeResource) {
      instance.resource = {
        name: this.archetypeResource.name,
        current: this.archetypeResource.startValue,
        max: this.archetypeResource.maxValue,
        regenRate: this.archetypeResource.regenRate || 0,
        color: this.archetypeResource.color,
      };
    }

    return instance;
  }

  /**
   * Applies stat and progression adjustments to the player profile.
   * @param {Object} profile
   * @param {number} integrity
   */
  applyBonuses(profile, integrity) {
    const catConfig = getCategoryConfig(this.category);
    const affinities = this.statModifiers || catConfig.statAffinities || {};
    const integrityScale = Math.max(0, integrity) / 100;

    for (const [stat, bonus] of Object.entries(affinities)) {
      if (profile.attributes && typeof profile.attributes[stat] === "number") {
        profile.attributes[stat] += Math.round(toNumber(bonus, 0) * integrityScale);
      }
    }

    if (profile.derivedStats) {
      if (integrity >= 95) {
        profile.derivedStats.mp = (profile.derivedStats.mp || 0) + 15;
      }
      if (integrity >= 100) {
        profile.derivedStats.hp = (profile.derivedStats.hp || 0) + 10;
      }
    }

    const impact =
      this.progressionImpact && typeof this.progressionImpact === "object"
        ? this.progressionImpact
        : {};
    const existing =
      profile.progressionModifiers &&
      typeof profile.progressionModifiers === "object"
        ? profile.progressionModifiers
        : {};

    const mergeMultiplier = (key, delta) => {
      const current = toNumber(existing[key], 1);
      return Number((current * (1 + toNumber(delta, 0))).toFixed(4));
    };

    profile.progressionModifiers = {
      ...existing,
      xpGainMultiplier: mergeMultiplier("xpGainMultiplier", impact.xpGainMultiplier),
      questRewardMultiplier: mergeMultiplier(
        "questRewardMultiplier",
        impact.questRewardMultiplier,
      ),
      goldGainMultiplier: mergeMultiplier("goldGainMultiplier", impact.goldGainMultiplier),
      resourceGainMultiplier: mergeMultiplier(
        "resourceGainMultiplier",
        impact.resourceGainMultiplier,
      ),
      skillGrowthMultiplier: mergeMultiplier(
        "skillGrowthMultiplier",
        impact.skillGrowthMultiplier,
      ),
      resourceCapMultiplier: mergeMultiplier(
        "resourceCapMultiplier",
        impact.resourceCapMultiplier,
      ),
      lootQualityBonus:
        toNumber(existing.lootQualityBonus, 0) + toNumber(impact.lootQualityBonus, 0),
      classEvolutionStepReduction: Math.max(
        toNumber(existing.classEvolutionStepReduction, 0),
        toNumber(impact.classEvolutionStepReduction, 0),
      ),
      riskScale: toNumber(existing.riskScale, 0) + toNumber(impact.riskScale, 0),
    };
  }
}

function createRegistryDefinitions(rawDefinitions) {
  return normalizeDefinitions(rawDefinitions);
}

const RAW_ARCHETYPE_DEFINITIONS = [
  ...systemsData,
  ...authoritiesData,
  ...pathsData,
  ...frameworksData,
  ...privilegesData,
  ...overlaysData,
];

export let ARCHETYPE_DEFINITIONS = createRegistryDefinitions(RAW_ARCHETYPE_DEFINITIONS);
export let ARCHETYPE_SYSTEMS = ARCHETYPE_DEFINITIONS.map(
  (definition) => new ArchetypeSystem(definition),
);

const buildArchetypeSystemSummary = (system) => {
  if (!system || typeof system !== "object" || typeof system.id !== "string") {
    return null;
  }

  return {
    id: system.id,
    name: system.name || system.id,
    category: system.category || "Unknown",
    summary: system.summary || "",
    description: system.description || "",
    narrativeTone: system.narrativeTone || "neutral",
    color: system.color || null,
    icon: system.icon || null,
    resource:
      system.resource && typeof system.resource === "object"
        ? {
            name: system.resource.name || null,
            color: system.resource.color || null,
          }
        : null,
    tags: Array.isArray(system.tags)
      ? system.tags.filter((tag) => typeof tag === "string")
      : [],
    coreLoopPreview: Array.isArray(system.coreLoop)
      ? system.coreLoop.slice(0, 3)
      : [],
    narrativeHooksPreview: Array.isArray(system.narrativeHooks)
      ? system.narrativeHooks.slice(0, 2)
      : [],
    questHooksPreview: Array.isArray(system.questHooks)
      ? system.questHooks.slice(0, 2)
      : [],
    quality:
      system.quality && typeof system.quality === "object"
        ? {
            depthScore: toNumber(system.quality.depthScore, 0),
            detailScore: toNumber(system.quality.detailScore, 0),
            totalHooks: toNumber(system.quality.totalHooks, 0),
          }
        : null,
  };
};

const cloneArchetypeSystemSummary = (summary) => {
  if (!summary) return null;
  return {
    ...summary,
    resource: summary.resource ? { ...summary.resource } : null,
    tags: [...summary.tags],
    coreLoopPreview: [...summary.coreLoopPreview],
    narrativeHooksPreview: [...summary.narrativeHooksPreview],
    questHooksPreview: [...summary.questHooksPreview],
    quality: summary.quality ? { ...summary.quality } : null,
  };
};

let ARCHETYPE_SYSTEM_INDEX = new Map();
let ARCHETYPE_CATEGORY_INDEX = new Map();
let ARCHETYPE_SYSTEM_SUMMARIES = [];
let ARCHETYPE_SUMMARY_INDEX = new Map();
let ARCHETYPE_SUMMARY_CATEGORY_INDEX = new Map();

const rebuildArchetypeIndexes = () => {
  ARCHETYPE_SYSTEM_INDEX = new Map();
  ARCHETYPE_CATEGORY_INDEX = new Map();
  ARCHETYPE_SYSTEM_SUMMARIES = [];
  ARCHETYPE_SUMMARY_INDEX = new Map();
  ARCHETYPE_SUMMARY_CATEGORY_INDEX = new Map();

  ARCHETYPE_SYSTEMS.forEach((system) => {
    if (!system?.id) return;
    ARCHETYPE_SYSTEM_INDEX.set(system.id, system);

    const category = system.category || "Unknown";
    if (!ARCHETYPE_CATEGORY_INDEX.has(category)) {
      ARCHETYPE_CATEGORY_INDEX.set(category, []);
    }
    ARCHETYPE_CATEGORY_INDEX.get(category).push(system);

    const summary = buildArchetypeSystemSummary(system);
    if (!summary) return;

    ARCHETYPE_SYSTEM_SUMMARIES.push(summary);
    ARCHETYPE_SUMMARY_INDEX.set(summary.id, summary);
    if (!ARCHETYPE_SUMMARY_CATEGORY_INDEX.has(category)) {
      ARCHETYPE_SUMMARY_CATEGORY_INDEX.set(category, []);
    }
    ARCHETYPE_SUMMARY_CATEGORY_INDEX.get(category).push(summary);
  });
};

rebuildArchetypeIndexes();

export function setArchetypeDefinitions(nextDefinitions) {
  if (!Array.isArray(nextDefinitions)) return;
  ARCHETYPE_DEFINITIONS = createRegistryDefinitions(nextDefinitions);
  ARCHETYPE_SYSTEMS = ARCHETYPE_DEFINITIONS.map(
    (definition) => new ArchetypeSystem(definition),
  );
  rebuildArchetypeIndexes();
}

export function getArchetypeSystemById(id) {
  return ARCHETYPE_SYSTEM_INDEX.get(id) || null;
}

/**
 * Returns all archetype systems belonging to a given category.
 * @param {string} category
 * @returns {ArchetypeSystem[]}
 */
export function getArchetypesByCategory(category) {
  if (!category) return [];
  return [...(ARCHETYPE_CATEGORY_INDEX.get(category) || [])];
}

/**
 * Returns a deduplicated, sorted list of all archetype categories present.
 * @returns {string[]}
 */
export function getArchetypeCategories() {
  return [...ARCHETYPE_CATEGORY_INDEX.keys()].sort((left, right) => {
    const leftIndex = CATEGORY_ORDER.indexOf(left);
    const rightIndex = CATEGORY_ORDER.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });
}

export function getAllArchetypeSystems() {
  return ARCHETYPE_SYSTEMS;
}

export function getAllArchetypeSystemSummaries() {
  return ARCHETYPE_SYSTEM_SUMMARIES.map((summary) =>
    cloneArchetypeSystemSummary(summary),
  );
}

export function getArchetypeSystemSummaryById(id) {
  return cloneArchetypeSystemSummary(ARCHETYPE_SUMMARY_INDEX.get(id) || null);
}

export function getArchetypeSystemSummariesByCategory(category) {
  if (!category) return [];
  return (ARCHETYPE_SUMMARY_CATEGORY_INDEX.get(category) || []).map((summary) =>
    cloneArchetypeSystemSummary(summary),
  );
}

export function getArchetypeQualityReport() {
  const byCategory = {};
  ARCHETYPE_DEFINITIONS.forEach((definition) => {
    const category = definition.category || "Unknown";
    if (!byCategory[category]) {
      byCategory[category] = {
        count: 0,
        depthTotal: 0,
        minDepth: 999,
        maxDepth: 0,
      };
    }
    const depth = toNumber(definition?.quality?.depthScore, 0);
    const bucket = byCategory[category];
    bucket.count += 1;
    bucket.depthTotal += depth;
    bucket.minDepth = Math.min(bucket.minDepth, depth);
    bucket.maxDepth = Math.max(bucket.maxDepth, depth);
  });

  const categories = Object.fromEntries(
    Object.entries(byCategory).map(([category, bucket]) => [
      category,
      {
        ...bucket,
        avgDepth: bucket.count ? Number((bucket.depthTotal / bucket.count).toFixed(2)) : 0,
      },
    ]),
  );

  return {
    total: ARCHETYPE_DEFINITIONS.length,
    categories,
    ids: ARCHETYPE_DEFINITIONS.map((definition) => definition.id),
  };
}

