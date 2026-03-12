import standardTalentsData from "../../data/generated/talents/standard-talents.json" with { type: "json" };
import exRankTalentsData from "../../data/generated/talents/ex-rank-talents.json" with { type: "json" };
import classTalentPoolsData from "../../data/generated/talents/class-talent-pools.json" with { type: "json" };
import talentCountTableData from "../../data/generated/talents/talent-count-table.json" with { type: "json" };

import { random, shuffle } from "../../utils/DeterministicRandom.js";

function cloneValue(value) {
  if (value == null) return value;
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function cloneList(values) {
  return Array.isArray(values) ? values.map((entry) => cloneValue(entry)) : [];
}

const STANDARD_TALENT_INDEX = new Map(
  (Array.isArray(standardTalentsData) ? standardTalentsData : [])
    .filter((entry) => typeof entry?.id === "string")
    .map((entry) => [entry.id, entry]),
);

const EX_RANK_TALENT_INDEX = new Map(
  (Array.isArray(exRankTalentsData) ? exRankTalentsData : [])
    .filter((entry) => typeof entry?.id === "string")
    .map((entry) => [entry.id, entry]),
);

const TALENT_SUMMARY_INDEX = new Map([
  ...STANDARD_TALENT_INDEX.entries(),
  ...EX_RANK_TALENT_INDEX.entries(),
]);

function normalizeCount(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function getStandardTalentSummaries() {
  return cloneList(standardTalentsData);
}

export function getExRankTalentSummaries() {
  return cloneList(exRankTalentsData);
}

export function getTalentSummaries() {
  return [...getStandardTalentSummaries(), ...getExRankTalentSummaries()];
}

export function getTalentSummaryById(talentId) {
  if (!talentId) return null;
  return cloneValue(TALENT_SUMMARY_INDEX.get(talentId) || null);
}

export function getTalentById(talentId) {
  return getTalentSummaryById(talentId);
}

export function getClassTalentPoolSummaries(classId) {
  const talentIds =
    typeof classTalentPoolsData === "object" && !Array.isArray(classTalentPoolsData)
      ? classTalentPoolsData[classId] || classTalentPoolsData.__default__ || []
      : [];
  const pool = talentIds
    .map((talentId) => TALENT_SUMMARY_INDEX.get(talentId))
    .filter(Boolean);
  return pool.length > 0 ? cloneList(pool) : getStandardTalentSummaries();
}

export function getClassTalentPool(classId) {
  return getClassTalentPoolSummaries(classId);
}

export function getTalentCountTable() {
  return cloneList(talentCountTableData);
}

export function getRandomTalents(count = 8) {
  const safeCount = Math.max(0, Math.floor(normalizeCount(count, 8)));
  return shuffle(getStandardTalentSummaries()).slice(0, safeCount);
}

export function rollTalentCount() {
  const roll = random();
  let cumulative = 0;
  for (const entry of Array.isArray(talentCountTableData) ? talentCountTableData : []) {
    cumulative += Number(entry?.chance || 0);
    if (roll < cumulative) {
      return Math.max(1, Math.floor(normalizeCount(entry?.count, 1)));
    }
  }
  return 1;
}

export function assignTalentsForClass(classId) {
  const pool = getClassTalentPoolSummaries(classId);
  const count = rollTalentCount();
  return shuffle(pool)
    .slice(0, Math.min(count, pool.length))
    .map((entry) => entry.id);
}
