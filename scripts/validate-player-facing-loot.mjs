import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  itemDatabase,
  isGeneratedPlaceholderItem,
} from "../packages/game-core/src/data/registries/ItemDataRegistry.js";
import {
  BEGINNER_QUESTS,
  MAIN_QUESTS,
  SIDE_QUESTS,
} from "../packages/game-core/src/data/QuestCatalog.js";
import { enemies } from "../packages/game-core/src/data/registries/EnemyDataRegistry.js";

const ALLOWLIST_PATH = path.resolve(
  process.cwd(),
  "docs",
  "contracts",
  "player_loot_placeholder_allowlist_v1.json",
);

const readAllowlist = async () => {
  try {
    const raw = await fs.readFile(ALLOWLIST_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const allowedItemIds = Array.isArray(parsed?.allowedItemIds)
      ? parsed.allowedItemIds.filter((id) => typeof id === "string" && id.trim().length > 0)
      : [];
    return {
      payload: parsed,
      allowedItemIds: new Set(allowedItemIds),
    };
  } catch {
    return {
      payload: null,
      allowedItemIds: new Set(),
    };
  }
};

const normalizeItemId = (value) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : "";

const collectQuestRewardRefs = () => {
  const refs = [];
  const allQuests = [...BEGINNER_QUESTS, ...MAIN_QUESTS, ...SIDE_QUESTS];
  for (const quest of allQuests) {
    const rewardItems = Array.isArray(quest?.rewards?.items) ? quest.rewards.items : [];
    for (const rewardItem of rewardItems) {
      const itemId = normalizeItemId(rewardItem?.id || rewardItem?.itemId);
      if (!itemId) continue;
      refs.push({
        sourceType: "quest_reward",
        sourceId: String(quest.id || ""),
        itemId,
      });
    }
  }
  return refs;
};

const collectEnemyDropRefs = () => {
  const refs = [];
  for (const enemy of Array.isArray(enemies) ? enemies : []) {
    const drops = Array.isArray(enemy?.drops) ? enemy.drops : [];
    for (const drop of drops) {
      const itemId = normalizeItemId(
        typeof drop === "string" ? drop : drop?.item || drop?.itemId || drop?.id,
      );
      if (!itemId) continue;
      refs.push({
        sourceType: "enemy_drop",
        sourceId: String(enemy.id || ""),
        itemId,
      });
    }
  }
  return refs;
};

const dedupeRefs = (refs) => {
  const seen = new Set();
  const output = [];
  for (const ref of refs) {
    const key = `${ref.sourceType}:${ref.sourceId}:${ref.itemId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(ref);
  }
  return output;
};

const printIssueSample = (label, issues) => {
  if (issues.length === 0) return;
  console.error(`- ${label}: ${issues.length}`);
  for (const issue of issues.slice(0, 25)) {
    console.error(
      `  - ${issue.sourceType}:${issue.sourceId} -> ${issue.itemId}`,
    );
  }
};

async function main() {
  const { allowedItemIds } = await readAllowlist();
  const lootRefs = dedupeRefs([
    ...collectQuestRewardRefs(),
    ...collectEnemyDropRefs(),
  ]);

  const missingItems = [];
  const placeholderViolations = [];

  for (const ref of lootRefs) {
    const item = itemDatabase[ref.itemId];
    if (!item) {
      missingItems.push(ref);
      continue;
    }
    if (isGeneratedPlaceholderItem(item) && !allowedItemIds.has(ref.itemId)) {
      placeholderViolations.push(ref);
    }
  }

  if (missingItems.length > 0 || placeholderViolations.length > 0) {
    console.error(
      `[player-loot-contract] FAIL refs=${lootRefs.length} missing=${missingItems.length} placeholderViolations=${placeholderViolations.length}`,
    );
    printIssueSample("missing item references", missingItems);
    printIssueSample("placeholder violations", placeholderViolations);
    process.exitCode = 1;
    return;
  }

  console.log(
    `[player-loot-contract] PASS refs=${lootRefs.length} allowlist=${allowedItemIds.size} placeholderViolations=0`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
