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
import {
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  DEFAULT_CATEGORY_CONFIG,
  getCategoryConfig,
} from "./ArchetypeCategoryConfig.js";
export {
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  DEFAULT_CATEGORY_CONFIG,
  getCategoryConfig,
} from "./ArchetypeCategoryConfig.js";

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

const SUPPORT_FIELD_TARGETS = {
  possibleUses: 2,
  limits: 2,
  costs: 2,
  worldCompatibility: 2,
  factionReactions: 2,
};

const FIELD_TEXT_LIMITS = {
  summary: 220,
  description: 4000,
  listItem: 2400,
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

const VALID_RARITIES = new Set([
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "unique",
]);

const VALID_STABILITIES = new Set([
  "stable",
  "volatile",
  "unstable",
  "corrupted",
  "forbidden",
]);


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

function buildSupportTemplates(category, name) {
  const templates = {
    System: {
      possibleUses: [
        `${name} supports a run-defining growth plan with category-spanning payoff.`,
        `${name} can anchor combat, quest routing, and long-horizon progression decisions.`,
      ],
      limits: [
        `${name} remains bounded by explicit costs, counterplay, and the Void hierarchy.`,
        `${name} rewards focused use more than careless omnidirectional play.`,
      ],
      costs: [
        `${name} creates pressure through commitment, exposure, or resource burden.`,
        `${name} pushes the bearer toward a specific worldview that can become a liability.`,
      ],
      worldCompatibility: [
        `${name} is treated as a legendary System beneath Void and Grandmother Void.`,
        `${name} is powerful enough to alter institutions without replacing cosmic law.`,
      ],
      factionReactions: [
        `Ambitious factions will seek to recruit, regulate, or weaponize ${name}.`,
        `Orthodox powers will monitor ${name} for signs of uncontrolled escalation.`,
      ],
      rarity: "legendary",
      stability: "stable",
      selectionWeight: 18,
    },
    Authority: {
      possibleUses: [
        `${name} dominates a bounded domain, force, lineage, or command relationship.`,
        `${name} excels in conflicts where legitimacy and local law matter more than raw output.`,
      ],
      limits: [
        `${name} must stay within scope and can be contested by stronger or cleaner law.`,
        `${name} loses leverage when forced outside its rightful domain or target class.`,
      ],
      costs: [
        `${name} creates visibility, political consequence, and resistance from rival claimants.`,
        `${name} burdens the bearer with responsibility for what they command.`,
      ],
      worldCompatibility: [
        `${name} is recognized as a high-order Authority rather than a full System.`,
        `${name} remains subordinate to broader cosmic law and Void-level order.`,
      ],
      factionReactions: [
        `Rulers and institutions will treat ${name} as a political event, not just a combat trait.`,
        `Rival elites will test whether ${name} deserves recognition or suppression.`,
      ],
      rarity: "legendary",
      stability: "stable",
      selectionWeight: 14,
    },
    Path: {
      possibleUses: [
        `${name} rewards long-form transformation through staged thresholds and breakthroughs.`,
        `${name} excels in runs built around identity change, discipline, and earned evolution.`,
      ],
      limits: [
        `${name} depends on thresholds, bottlenecks, and compatibility with the next stage.`,
        `${name} can stall or distort the bearer if a transformation is forced too early.`,
      ],
      costs: [
        `${name} demands time, risk, and irreversible change in body, soul, or social standing.`,
        `${name} often narrows future choices as each stage defines the bearer more strongly.`,
      ],
      worldCompatibility: [
        `${name} is a transformational Path rather than a sovereign Authority or full System.`,
        `${name} remains governed by staged ascension beneath the higher cosmic order.`,
      ],
      factionReactions: [
        `Observers will track ${name} by its visible stages, mutations, and breakthrough signs.`,
        `Mentors, sects, and hunters will react strongly once ${name} reveals its trajectory.`,
      ],
      rarity: "epic",
      stability: "volatile",
      selectionWeight: 12,
    },
    Framework: {
      possibleUses: [
        `${name} organizes growth through structure, routing, storage, or recursive optimization.`,
        `${name} shines in long-run planning, management play, and cross-system efficiency.`,
      ],
      limits: [
        `${name} depends on maintained structure and can underperform in pure improvisational bursts.`,
        `${name} is strongest when its processes are given time, space, or infrastructure to work.`,
      ],
      costs: [
        `${name} taxes the bearer through upkeep, planning burden, and structural dependency.`,
        `${name} can become a liability if its loops are disrupted or overextended.`,
      ],
      worldCompatibility: [
        `${name} is a Framework that shapes progression flow without replacing cosmic law.`,
        `${name} is respected as infrastructure-grade power rather than direct sovereignty.`,
      ],
      factionReactions: [
        `Strategic factions will value ${name} for its compounding and organizational leverage.`,
        `Saboteurs will target the structures that let ${name} produce outsized value.`,
      ],
      rarity: "epic",
      stability: "stable",
      selectionWeight: 11,
    },
    Privilege: {
      possibleUses: [
        `${name} grants narrow but unfair access to routes, insights, or exceptions others cannot claim.`,
        `${name} is strongest when used subtly and timed around key narrative or tactical pivots.`,
      ],
      limits: [
        `${name} loses safety once exposure rises or enemies begin accounting for the exception.`,
        `${name} remains an asymmetric edge, not a whole-system replacement for normal growth.`,
      ],
      costs: [
        `${name} invites suspicion, envy, and retaliation when its unfair edge becomes visible.`,
        `${name} can distort decision-making by tempting the bearer to rely on hidden shortcuts.`,
      ],
      worldCompatibility: [
        `${name} is classified as a Privilege: rare, deniable, and narrower than a true System.`,
        `${name} exploits exceptions within the world rather than rewriting the world itself.`,
      ],
      factionReactions: [
        `Clever rivals will try to expose or bait ${name} into becoming visible.`,
        `Secretive powers may prize ${name} more than public institutions ever would.`,
      ],
      rarity: "rare",
      stability: "volatile",
      selectionWeight: 9,
    },
    Overlay: {
      possibleUses: [
        `${name} creates short windows of impossible leverage by exploiting unstable rule seams.`,
        `${name} works best for desperate reversals, technical abuse, and hunted anomaly play.`,
      ],
      limits: [
        `${name} escalates instability and can collapse if pushed too often or too publicly.`,
        `${name} never outranks deeper law and is vulnerable to patching, audits, or backlash.`,
      ],
      costs: [
        `${name} burdens the bearer with strain, detection risk, and growing system hostility.`,
        `${name} trades clean reliability for stolen moments of illegal advantage.`,
      ],
      worldCompatibility: [
        `${name} is classified as an Overlay: parasitic, unstable, and beneath lawful structures.`,
        `${name} distorts local mechanics without superseding Void-level order.`,
      ],
      factionReactions: [
        `Enforcers and anomaly hunters will treat ${name} as something to contain or erase.`,
        `Desperate opportunists may covet ${name} even while fearing the fallout around it.`,
      ],
      rarity: "mythic",
      stability: "unstable",
      selectionWeight: 6,
    },
  };

  return templates[category] || templates.System;
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

function ensureSupportList(field, values, context) {
  const cleaned = sanitizeList(values, { field });
  const templates = buildSupportTemplates(context.category, context.name)[field] || [];
  const target = SUPPORT_FIELD_TARGETS[field] || 1;
  let index = 0;

  while (cleaned.length < target && templates.length > 0) {
    const next = templates[index % templates.length];
    if (!cleaned.includes(next)) cleaned.push(next);
    index += 1;
  }

  return cleaned.slice(0, Math.max(target, cleaned.length));
}

function ensureSupportScalar(rawValue, fallbackValue, validSet) {
  const normalized = normalizeWhitespace(rawValue).toLowerCase();
  if (normalized && validSet.has(normalized)) return normalized;
  return fallbackValue;
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
  const supportTemplates = buildSupportTemplates(category, name);

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
    possibleUses: ensureSupportList("possibleUses", rawDefinition?.possibleUses, {
      category,
      name,
    }),
    limits: ensureSupportList("limits", rawDefinition?.limits, { category, name }),
    costs: ensureSupportList("costs", rawDefinition?.costs, { category, name }),
    worldCompatibility: ensureSupportList(
      "worldCompatibility",
      rawDefinition?.worldCompatibility,
      { category, name },
    ),
    factionReactions: ensureSupportList(
      "factionReactions",
      rawDefinition?.factionReactions,
      { category, name },
    ),
    rarity: ensureSupportScalar(
      rawDefinition?.rarity,
      supportTemplates.rarity,
      VALID_RARITIES,
    ),
    stability: ensureSupportScalar(
      rawDefinition?.stability,
      supportTemplates.stability,
      VALID_STABILITIES,
    ),
    selectionWeight: clamp(
      toNumber(rawDefinition?.selectionWeight, supportTemplates.selectionWeight),
      0,
      100,
    ),
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
  // If the richer source entry is already runtime-valid, prefer keeping it
  // available over silently dropping it due to normalization heuristics.
  const validation = validateArchetype(normalized);
  if (!validation.valid) {
    const sourceValidation = validateArchetype(rawDefinition);
    if (!sourceValidation.valid) return null;
  }
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
    rarity: system.rarity || null,
    stability: system.stability || null,
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
    possibleUsesPreview: Array.isArray(system.possibleUses)
      ? system.possibleUses.slice(0, 2)
      : [],
    limitsPreview: Array.isArray(system.limits) ? system.limits.slice(0, 2) : [],
    costsPreview: Array.isArray(system.costs) ? system.costs.slice(0, 2) : [],
    worldCompatibilityPreview: Array.isArray(system.worldCompatibility)
      ? system.worldCompatibility.slice(0, 2)
      : [],
    factionReactionsPreview: Array.isArray(system.factionReactions)
      ? system.factionReactions.slice(0, 2)
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
    possibleUsesPreview: [...summary.possibleUsesPreview],
    limitsPreview: [...summary.limitsPreview],
    costsPreview: [...summary.costsPreview],
    worldCompatibilityPreview: [...summary.worldCompatibilityPreview],
    factionReactionsPreview: [...summary.factionReactionsPreview],
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

