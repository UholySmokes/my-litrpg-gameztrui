import {
  titleDatabase,
  getTitleById,
  getAvailableTitles,
  getPurchasableTitles,
} from "@voidverse/game-core/data/titleData.js";

const richState = {
  player: {
    level: 60,
    unlockedTitles: [],
    titles: [],
    abilities: [
      { level: 10 },
      { level: 10 },
      { level: 10 },
      { level: 10 },
      { level: 10 },
    ],
    progress: {
      totalKills: 320,
      killsByEnemyId: {
        goblin: 1,
        skeleton: 1,
        wolf: 1,
        dragon_whelp: 1,
        shadow_knight: 1,
        void_titan: 1,
      },
      totalGoldEarned: 30000,
      gachaPulls: 250,
    },
  },
  quests: {
    completed: [
      { id: "bq_first_stride" },
      { id: "bq_system_basics" },
      { id: "bq_first_conflict" },
      { id: "bq_arcane_awareness" },
      { id: "mq_fallen_spire" },
      { id: "mq_whisper_market" },
      { id: "mq_ember_bloom" },
      { id: "mq_starforge_siege" },
      { id: "mq_ashen_caldera" },
      { id: "mq_veil_archive" },
    ],
  },
};

describe("TitleData", () => {
  test("contains at least 52 titles", () => {
    expect(titleDatabase.length).toBeGreaterThanOrEqual(52);
  });

  test("all titles have unique IDs", () => {
    const ids = titleDatabase.map((title) => title.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("all titles expose the expected fields", () => {
    for (const title of titleDatabase) {
      expect(title).toHaveProperty("id");
      expect(title).toHaveProperty("name");
      expect(title).toHaveProperty("description");
      expect(title).toHaveProperty("secondaryBonus");
      expect(title).toHaveProperty("mainBonus");
      expect(title).toHaveProperty("unlockConditions");
    }
  });

  test("getTitleById resolves both legacy and expanded titles", () => {
    expect(getTitleById("novice_adventurer")?.name).toBe("Novice Adventurer");
    expect(getTitleById("mythic_stride")?.name).toBe("Mythic Stride");
  });

  test("available titles respond to level, quest, kill, gold, gacha, and mastery milestones", () => {
    const availableIds = new Set(
      getAvailableTitles(richState).map((title) => title.id),
    );

    expect(availableIds.has("mythic_stride")).toBe(true);
    expect(availableIds.has("veil_archivist")).toBe(true);
    expect(availableIds.has("eternal_warsmith")).toBe(true);
    expect(availableIds.has("void_hunter")).toBe(true);
    expect(availableIds.has("golden_emperor")).toBe(true);
    expect(availableIds.has("fortune_vessel")).toBe(true);
    expect(availableIds.has("master_of_forms")).toBe(true);
  });

  test("purchasable titles remain visible when their non-purchase conditions are met", () => {
    const purchasableIds = getPurchasableTitles(richState).map((title) => title.id);

    expect(purchasableIds).toEqual(
      expect.arrayContaining(["shop_owner", "gacha_master"]),
    );
  });
});
