import { describe, expect, it } from "@jest/globals";
import { SimBridge } from "../../packages/game-core/src/simulation/bridge/SimulationContext.js";
import {
  STANDARD_TALENTS,
  TALENT_COUNT_TABLE,
  assignTalentsForClass as assignLiveTalentsForClass,
  exRankTalents,
  getClassTalentPool as getLiveClassTalentPool,
  getRandomTalents as getLiveRandomTalents,
  getTalentById as getLiveTalentById,
  rollTalentCount as rollLiveTalentCount,
} from "@voidverse/game-core/systems/skills/TalentDefinitions.js";
import {
  assignTalentsForClass,
  getClassTalentPoolSummaries,
  getExRankTalentSummaries,
  getRandomTalents,
  getStandardTalentSummaries,
  getTalentCountTable,
  getTalentSummaryById,
  rollTalentCount,
} from "@voidverse/game-core/systems/skills/TalentContentPack.js";

describe("talent content pack", () => {
  it("keeps generated standard and ex-rank talent summaries aligned with the live registry", () => {
    expect(getStandardTalentSummaries().map((entry) => entry.id)).toEqual(
      STANDARD_TALENTS.map((entry) => entry.id),
    );
    expect(getExRankTalentSummaries().map((entry) => entry.id)).toEqual(
      exRankTalents.map((entry) => entry.id),
    );
    expect(getTalentCountTable()).toEqual(TALENT_COUNT_TABLE);

    const sampleStandard = STANDARD_TALENTS[0];
    const sampleExRank = exRankTalents[0];

    expect(getTalentSummaryById(sampleStandard.id)).toEqual(
      expect.objectContaining({
        id: sampleStandard.id,
        name: sampleStandard.name,
        description: sampleStandard.description,
        bucket: "standard",
      }),
    );
    expect(getTalentSummaryById(sampleExRank.id)).toEqual(
      expect.objectContaining({
        id: sampleExRank.id,
        name: sampleExRank.name,
        description: sampleExRank.description,
        bucket: "ex_rank",
      }),
    );
    expect(getTalentSummaryById(sampleExRank.id)?.priority).toBe(
      getLiveTalentById(sampleExRank.id)?.priority,
    );
  });

  it("keeps generated class talent pools aligned with the live registry", () => {
    ["warrior", "mage", "rogue", "unknown_class"].forEach((classId) => {
      expect(getClassTalentPoolSummaries(classId).map((entry) => entry.id)).toEqual(
        getLiveClassTalentPool(classId).map((entry) => entry.id),
      );
    });
  });

  it("matches deterministic random talent selection behavior", () => {
    SimBridge.initialize(17);
    const liveRandomIds = getLiveRandomTalents(5).map((entry) => entry.id);
    SimBridge.initialize(17);
    const packRandomIds = getRandomTalents(5).map((entry) => entry.id);
    expect(packRandomIds).toEqual(liveRandomIds);

    SimBridge.initialize(29);
    const liveCounts = Array.from({ length: 8 }, () => rollLiveTalentCount());
    SimBridge.initialize(29);
    const packCounts = Array.from({ length: 8 }, () => rollTalentCount());
    expect(packCounts).toEqual(liveCounts);

    SimBridge.initialize(41);
    const liveAssigned = assignLiveTalentsForClass("warrior");
    SimBridge.initialize(41);
    const packAssigned = assignTalentsForClass("warrior");
    expect(packAssigned).toEqual(liveAssigned);
  });
});
