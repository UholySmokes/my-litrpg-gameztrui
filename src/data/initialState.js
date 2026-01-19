const initialGameState = {
  config: {
    maxLevel: 100,
    attributePointsPerLevel: 3,
  },
  player: {
    name: "Wanderer",
    level: 1,
    xp: {
      current: 0,
      max: 100,
    },
    hp: {
      current: 100,
      max: 100,
    },
    mana: {
      current: 50,
      max: 50,
    },
    attributes: {
      strength: 5,
      agility: 5,
      dexterity: 5,
      vitality: 5,
      intelligence: 5,
      wisdom: 5,
      charisma: 5,
      willpower: 5,
      luck: 5,
      soul: 5,
      freePoints: 0,
    },
    attributeInvestments: {},
    resources: {
      rage: 0,
      chi: 0,
      focus: 0,
      stealth: 0,
    },
    inventory: [],
    equipment: {},
    abilities: [],
    titles: [],
    activeSkills: [],
    passiveSkills: [],
    gold: 0,
    soulpoints: 0,
    currency: {
      goldCoins: 0,
      soulpoints: 0,
    },
    talent: "None",
    talents: [],
    profession: null,
    professions: {},
  },
  quests: {
    active: [],
    completed: [],
  },
  world: {
    location: "Starting Zone",
    flags: {},
    time: 0,
  },
  chatLog: [],
  narrative: {
    summary: "",
    chatLog: [],
  },
};

export { initialGameState };
