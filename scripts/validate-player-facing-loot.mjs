import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  itemDatabase,
  isGeneratedPlaceholderItem,
} from "../packages/game-core/src/data/registries/ItemDataRegistry.js";
import { shopDatabase } from "../packages/game-core/src/data/shopData.js";
import {
  collectEnemyDropItemRefs,
  collectQuestRewardItemRefs,
  collectShopStockItemRefs,
} from "../packages/game-core/src/util/placeholderItemCuration.js";

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
  const questRefs = collectQuestRewardItemRefs();
  const enemyRefs = collectEnemyDropItemRefs();
  const shopRefs = collectShopStockItemRefs(shopDatabase);
  const lootRefs = dedupeRefs([
    ...questRefs,
    ...enemyRefs,
    ...shopRefs,
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

  const sourceCounts = lootRefs.reduce((acc, ref) => {
    const key = normalizeItemId(ref.sourceType) || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  console.log(
    `[player-loot-contract] PASS refs=${lootRefs.length} allowlist=${allowedItemIds.size} placeholderViolations=0 sources=${JSON.stringify(sourceCounts)}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
