import {
  itemDatabase,
  isGeneratedPlaceholderItem,
} from "../data/registries/ItemDataRegistry.js";
import { BEGINNER_QUESTS, MAIN_QUESTS, SIDE_QUESTS } from "../data/QuestCatalog.js";
import { enemies } from "../data/registries/EnemyDataRegistry.js";

const DEFAULT_QUESTS = [...BEGINNER_QUESTS, ...MAIN_QUESTS, ...SIDE_QUESTS];
const PRIORITY_ORDER = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

function normalizeItemId(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

function dedupeRefs(refs) {
  const out = [];
  const seen = new Set();
  for (const ref of Array.isArray(refs) ? refs : []) {
    const sourceType = String(ref?.sourceType || "").trim();
    const sourceId = String(ref?.sourceId || "").trim();
    const itemId = normalizeItemId(ref?.itemId);
    if (!sourceType || !sourceId || !itemId) continue;
    const key = `${sourceType}:${sourceId}:${itemId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ sourceType, sourceId, itemId });
  }
  return out;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function toPlaceholderRefs(item) {
  const refs = Array.isArray(item?.placeholderMeta?.references)
    ? item.placeholderMeta.references
    : [];
  return refs
    .map((ref) => ({
      professionId: String(ref?.professionId || "").trim(),
      recipeId: String(ref?.recipeId || "").trim(),
      role: String(ref?.role || "reference").trim().toLowerCase(),
    }))
    .filter((ref) => ref.professionId || ref.recipeId);
}

export function collectQuestRewardItemRefs(quests = DEFAULT_QUESTS) {
  const refs = [];
  for (const quest of Array.isArray(quests) ? quests : []) {
    const rewardItems = Array.isArray(quest?.rewards?.items) ? quest.rewards.items : [];
    for (const rewardItem of rewardItems) {
      const itemId = normalizeItemId(rewardItem?.id || rewardItem?.itemId);
      if (!itemId) continue;
      refs.push({
        sourceType: "quest_reward",
        sourceId: String(quest?.id || ""),
        itemId,
      });
    }
  }
  return dedupeRefs(refs);
}

export function collectEnemyDropItemRefs(enemyEntries = enemies) {
  const refs = [];
  for (const enemy of Array.isArray(enemyEntries) ? enemyEntries : []) {
    const drops = Array.isArray(enemy?.drops) ? enemy.drops : [];
    for (const drop of drops) {
      const itemId = normalizeItemId(
        typeof drop === "string" ? drop : drop?.item || drop?.itemId || drop?.id,
      );
      if (!itemId) continue;
      refs.push({
        sourceType: "enemy_drop",
        sourceId: String(enemy?.id || ""),
        itemId,
      });
    }
  }
  return dedupeRefs(refs);
}

export function collectShopStockItemRefs(shop) {
  const refs = [];
  if (!shop || typeof shop !== "object") {
    return refs;
  }

  const categories = [
    ["items", "shop_item"],
    ["materials", "shop_material"],
  ];

  for (const [key, sourceType] of categories) {
    const entries = Array.isArray(shop[key]) ? shop[key] : [];
    for (const entry of entries) {
      const itemId = normalizeItemId(entry?.itemId || entry?.id);
      if (!itemId) continue;
      refs.push({
        sourceType,
        sourceId: String(entry?.id || itemId),
        itemId,
      });
    }
  }
  return dedupeRefs(refs);
}

function classifyPriority({ playerFacingReferenceCount, resultReferenceCount, score }) {
  if (playerFacingReferenceCount > 0) return "critical";
  if (resultReferenceCount >= 4 || score >= 24) return "high";
  if (resultReferenceCount > 0 || score >= 8) return "medium";
  return "low";
}

function buildRecommendation(entry) {
  if (entry.priority === "critical") {
    return "Replace before release; this placeholder is surfaced to players.";
  }
  if (entry.priority === "high") {
    return "Author canonical item next sprint and remove placeholder_generated tag.";
  }
  if (entry.priority === "medium") {
    return "Queue for authored replacement after high-priority closures.";
  }
  return "Backlog candidate; keep tracked but lower urgency.";
}

function summarizePriorities(entries) {
  return entries.reduce(
    (acc, entry) => {
      const key = entry.priority || "low";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 },
  );
}

export function buildPlaceholderItemCurationReport({
  items = itemDatabase,
  quests = DEFAULT_QUESTS,
  enemyEntries = enemies,
  shop = null,
} = {}) {
  const questRefs = collectQuestRewardItemRefs(quests);
  const enemyRefs = collectEnemyDropItemRefs(enemyEntries);
  const shopRefs = collectShopStockItemRefs(shop);
  const playerFacingRefs = dedupeRefs([...questRefs, ...enemyRefs, ...shopRefs]);

  const refsByItemId = new Map();
  for (const ref of playerFacingRefs) {
    if (!refsByItemId.has(ref.itemId)) {
      refsByItemId.set(ref.itemId, []);
    }
    refsByItemId.get(ref.itemId).push(ref);
  }

  const placeholders = Object.values(items || {}).filter((item) =>
    isGeneratedPlaceholderItem(item),
  );

  const entries = placeholders.map((item) => {
    const references = toPlaceholderRefs(item);
    const ingredientReferenceCount = references.filter((ref) => ref.role === "ingredient").length;
    const resultReferenceCount = references.filter((ref) => ref.role === "result").length;
    const totalRecipeReferenceCount = references.length;
    const recipeIds = uniqueSorted(references.map((ref) => ref.recipeId));
    const professionIds = uniqueSorted(references.map((ref) => ref.professionId));
    const playerFacingItemRefs = refsByItemId.get(item.id) || [];
    const playerFacingReferenceCount = playerFacingItemRefs.length;

    const score =
      resultReferenceCount * 4 +
      ingredientReferenceCount +
      playerFacingReferenceCount * 10 +
      recipeIds.length * 0.25;
    const priority = classifyPriority({
      playerFacingReferenceCount,
      resultReferenceCount,
      score,
    });

    const entry = {
      itemId: item.id,
      name: item.name || item.id,
      type: item.type || "material",
      rarity: item.rarity || "common",
      contentStatus: item.contentStatus || "unknown",
      placeholderSource: item?.placeholderMeta?.source || "unknown",
      ingredientReferenceCount,
      resultReferenceCount,
      totalRecipeReferenceCount,
      recipeIds,
      professionIds,
      playerFacingReferenceCount,
      playerFacingSources: playerFacingItemRefs.map(
        (ref) => `${ref.sourceType}:${ref.sourceId}`,
      ),
      score: Number(score.toFixed(2)),
      priority,
    };

    return {
      ...entry,
      recommendation: buildRecommendation(entry),
    };
  });

  entries.sort((a, b) => {
    const byPriority = (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
    if (byPriority !== 0) return byPriority;
    if (b.score !== a.score) return b.score - a.score;
    if (b.playerFacingReferenceCount !== a.playerFacingReferenceCount) {
      return b.playerFacingReferenceCount - a.playerFacingReferenceCount;
    }
    if (b.resultReferenceCount !== a.resultReferenceCount) {
      return b.resultReferenceCount - a.resultReferenceCount;
    }
    return a.itemId.localeCompare(b.itemId);
  });

  const priorityCounts = summarizePriorities(entries);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      placeholderCount: entries.length,
      totalRecipeReferenceCount: entries.reduce(
        (sum, entry) => sum + entry.totalRecipeReferenceCount,
        0,
      ),
      totalIngredientReferenceCount: entries.reduce(
        (sum, entry) => sum + entry.ingredientReferenceCount,
        0,
      ),
      totalResultReferenceCount: entries.reduce(
        (sum, entry) => sum + entry.resultReferenceCount,
        0,
      ),
      playerFacingReferenceCount: playerFacingRefs.length,
      playerFacingPlaceholderCount: entries.filter(
        (entry) => entry.playerFacingReferenceCount > 0,
      ).length,
      priorityCounts,
    },
    entries,
  };
}

function toSafeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function evaluatePlaceholderCurationThresholds(
  report,
  {
    maxCritical = 0,
    maxPlayerFacingPlaceholders = 0,
    maxHigh = Infinity,
  } = {},
) {
  const summary = report?.summary || {};
  const priorityCounts = summary.priorityCounts || {};

  const actualCritical = toSafeNumber(priorityCounts.critical, 0);
  const actualPlayerFacing = toSafeNumber(summary.playerFacingPlaceholderCount, 0);
  const actualHigh = toSafeNumber(priorityCounts.high, 0);

  const checks = [
    {
      key: "critical",
      actual: actualCritical,
      expectedMax: toSafeNumber(maxCritical, 0),
    },
    {
      key: "playerFacingPlaceholders",
      actual: actualPlayerFacing,
      expectedMax: toSafeNumber(maxPlayerFacingPlaceholders, 0),
    },
    {
      key: "high",
      actual: actualHigh,
      expectedMax: toSafeNumber(maxHigh, Number.POSITIVE_INFINITY),
    },
  ];

  const issues = checks.filter((row) => row.actual > row.expectedMax);
  return {
    pass: issues.length === 0,
    checks,
    issues,
  };
}
