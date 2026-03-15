import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CLASS_TALENT_TAGS,
  STANDARD_TALENTS,
  TALENT_COUNT_TABLE,
  exRankTalents,
  getClassTalentPool,
} from "../packages/game-core/src/systems/skills/TalentDefinitions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(
  __dirname,
  "../packages/game-core/src/data/generated/talents",
);

function clonePlain(value) {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function sortRecordKeys(record) {
  return Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function projectTalent(entry, bucket) {
  return {
    ...clonePlain(entry),
    id: entry?.id || "",
    name: entry?.name || "",
    description: entry?.description || "",
    bucket,
  };
}

async function writeJsonFile(filename, data) {
  const targetPath = path.join(outputDir, filename);
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(targetPath, payload, "utf8");
  return targetPath;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const standardTalentEntries = (Array.isArray(STANDARD_TALENTS) ? STANDARD_TALENTS : [])
    .filter((entry) => entry?.id)
    .map((entry) => projectTalent(entry, "standard"));
  const exRankTalentEntries = (Array.isArray(exRankTalents) ? exRankTalents : [])
    .filter((entry) => entry?.id)
    .map((entry) => projectTalent(entry, "ex_rank"));
  const classTalentPools = sortRecordKeys(
    Object.fromEntries(
      [
        ["__default__", getClassTalentPool("") || []],
        ...Object.keys(CLASS_TALENT_TAGS || {}).map((classId) => [
          classId,
          getClassTalentPool(classId) || [],
        ]),
      ].map(([classId, pool]) => [
        classId,
        pool.map((entry) => entry?.id).filter(Boolean),
      ]),
    ),
  );

  const outputs = await Promise.all([
    writeJsonFile("standard-talents.json", standardTalentEntries),
    writeJsonFile("ex-rank-talents.json", exRankTalentEntries),
    writeJsonFile("class-talent-pools.json", classTalentPools),
    writeJsonFile("talent-count-table.json", clonePlain(TALENT_COUNT_TABLE || [])),
  ]);

  outputs.forEach((targetPath) => {
    console.log(`generated ${path.relative(path.resolve(__dirname, ".."), targetPath)}`);
  });
}

await main();
