const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const { query, sql } = require("../api/lib/sql");
const { resolveGameDbBackend, fileDb } = require("../api/lib/game-db");

const DEFAULT_BUNDLE_KEY = "core";

function loadLocalSettings() {
  const settingsPath = path.resolve(
    __dirname,
    "..",
    "api",
    "local.settings.json",
  );
  if (!fs.existsSync(settingsPath)) return;
  const raw = fs.readFileSync(settingsPath, "utf8");
  try {
    const parsed = JSON.parse(raw);
    const values = parsed?.Values || {};
    for (const [key, value] of Object.entries(values)) {
      if (process.env[key] == null && value != null) {
        process.env[key] = String(value);
      }
    }
  } catch {
    // ignore invalid local.settings.json
  }
}

async function importModule(relativeParts) {
  const absolutePath = path.resolve(__dirname, "..", ...relativeParts);
  const url = pathToFileURL(absolutePath).href;
  return import(url);
}

async function buildStaticBundle() {
  const [
    raceModule,
    classModule,
    itemModule,
    enemyModule,
    gachaModule,
    shopModule,
    titleModule,
    questModule,
    archetypeModule,
    professionModule,
  ] = await Promise.all([
    importModule(["src", "data", "registries", "RaceDataRegistry.js"]),
    importModule(["src", "data", "registries", "ClassDataRegistry.js"]),
    importModule(["src", "data", "registries", "ItemDataRegistry.js"]),
    importModule(["src", "data", "registries", "EnemyDataRegistry.js"]),
    importModule(["src", "data", "gachaData.js"]),
    importModule(["src", "data", "shopData.js"]),
    importModule(["src", "data", "titleData.js"]),
    importModule(["src", "data", "QuestCatalog.js"]),
    importModule(["src", "systems", "archetype", "ArchetypeSystemRegistry.js"]),
    importModule(["src", "systems", "profession", "ProfessionRegistry.js"]),
  ]);

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    races: raceModule.races || [],
    raceTraits: raceModule.RACE_TRAITS || {},
    classes: classModule.classes || [],
    items: itemModule.itemDatabase || {},
    enemies: enemyModule.enemies || [],
    gachaPools: gachaModule.gachaPools || {},
    shopDatabase: shopModule.shopDatabase || {},
    titleDatabase: titleModule.titleDatabase || [],
    quests: {
      main: questModule.MAIN_QUESTS || [],
      side: questModule.SIDE_QUESTS || [],
    },
    archetypeDefinitions: archetypeModule.ARCHETYPE_DEFINITIONS || [],
    professions: professionModule.PROFESSIONS || {},
    professionTiers: professionModule.PROFESSION_TIERS || [],
    professionCategories: professionModule.PROFESSION_CATEGORIES || {},
  };
}

async function upsertBundle(bundleKey, bundle) {
  const payload = JSON.stringify(bundle);
  const backend = resolveGameDbBackend();
  if (backend === "file") {
    fileDb.upsertStaticBundle({ bundleKey, payload });
    return;
  }
  await query(
    `
      MERGE dbo.game_static_bundles AS target
      USING (SELECT @bundleKey AS bundle_key) AS source
      ON target.bundle_key = source.bundle_key
      WHEN MATCHED THEN
        UPDATE SET payload = @payload, updated_at = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (bundle_key, payload, created_at, updated_at)
        VALUES (@bundleKey, @payload, SYSUTCDATETIME(), SYSUTCDATETIME());
    `,
    [
      { name: "bundleKey", type: sql.NVarChar, value: bundleKey },
      { name: "payload", type: sql.NVarChar(sql.MAX), value: payload },
    ],
  );
}

async function main() {
  loadLocalSettings();
  const bundleKey = process.argv[2] || DEFAULT_BUNDLE_KEY;
  const bundle = await buildStaticBundle();
  await upsertBundle(bundleKey, bundle);
  // eslint-disable-next-line no-console
  console.log(
    `[seed-static-data] Upserted bundle '${bundleKey}' with keys: ${Object.keys(bundle).join(", ")}`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
