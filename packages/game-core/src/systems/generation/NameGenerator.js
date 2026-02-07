import { random, randomChoice } from "../../utils/DeterministicRandom.js";

const SYLLABLES = {
  prefixes: [
    "Ae",
    "Vor",
    "Xyl",
    "Thal",
    "Myr",
    "Cael",
    "Syl",
    "Dra",
    "Fen",
    "Kor",
    "Zyn",
    "Pyr",
    "Gloom",
    "Star",
    "Void",
  ],
  middles: [
    "an",
    "or",
    "in",
    "ar",
    "en",
    "ir",
    "un",
    "on",
    "es",
    "is",
    "us",
    "ax",
    "ix",
    "ox",
  ],
  suffixes: [
    "ius",
    "or",
    "ax",
    "ion",
    "ar",
    "en",
    "ir",
    "is",
    "us",
    "um",
    "a",
    "ia",
    "ea",
    "ae",
  ],
};

const NAME_STYLES = {
  celestial: {
    prefixes: ["Sol", "Helio", "Astra", "Lux", "Nova"],
    suffixes: ["iel", "ion", "ara", "os", "ara"],
  },
  infernal: {
    prefixes: ["Az", "Bal", "Nec", "Vor", "Zar"],
    middles: ["za", "kor", "rax", "zul"],
    suffixes: ["gor", "reth", "thul", "rax"],
  },
  primal: {
    prefixes: ["Oak", "Fenn", "Bri", "Gav", "Ren"],
    middles: ["el", "or", "un"],
    suffixes: ["wood", "hart", "root", "stone"],
  },
};

function getNamePools(type) {
  const overrides = NAME_STYLES[type];
  if (!overrides) return SYLLABLES;
  return {
    prefixes: overrides.prefixes || SYLLABLES.prefixes,
    middles: overrides.middles || SYLLABLES.middles,
    suffixes: overrides.suffixes || SYLLABLES.suffixes,
  };
}

const TITLES = {
  prefixes: [
    "Grand",
    "High",
    "Arch",
    "Prime",
    "Dark",
    "Light",
    "Elder",
    "Master",
    "Supreme",
    "Eternal",
  ],
  suffixes: [
    "Mage",
    "Warrior",
    "Sage",
    "Guardian",
    "Seeker",
    "Walker",
    "Blade",
    "Shield",
    "Weaver",
    "Caller",
  ],
};

export function generateName(type = "fantasy") {
  const pools = getNamePools(type);
  const p = randomChoice(pools.prefixes);
  const m = randomChoice(pools.middles);
  const s = randomChoice(pools.suffixes);

  // 30% chance for 2 syllables, 70% for 3
  return random() > 0.3 ? `${p}${m}${s}` : `${p}${s}`;
}

export function generateTitle() {
  const p = randomChoice(TITLES.prefixes);
  const s = randomChoice(TITLES.suffixes);
  return `${p} ${s}`;
}
