const ATTRIBUTE_METADATA = [
  {
    key: "strength",
    label: "Strength",
    description: "Physical power",
  },
  {
    key: "agility",
    label: "Agility",
    description: "Speed / Evasion",
  },
  {
    key: "dexterity",
    label: "Dexterity",
    description: "Precision / Crafting",
  },
  {
    key: "vitality",
    label: "Vitality",
    description: "Endurance / Health",
  },
  {
    key: "intelligence",
    label: "Intelligence",
    description: "Magic / Learning",
  },
  {
    key: "wisdom",
    label: "Wisdom",
    description: "Insight / Perception",
  },
  {
    key: "charisma",
    label: "Charisma",
    description: "Influence / Presence",
  },
  {
    key: "willpower",
    label: "Willpower",
    description: "Mental fortitude",
  },
  {
    key: "luck",
    label: "Luck",
    description: "Fortune / Crit",
  },
  {
    key: "soul",
    label: "Soul",
    description: "Spiritual force",
  },
];

const CANONICAL_ATTRIBUTES = ATTRIBUTE_METADATA.map((entry) => entry.key);

const ATTRIBUTE_ALIAS_ENTRIES = {
  strength: ["strength", "str", "power", "might"],
  agility: ["agility", "agi", "speed", "quickness"],
  dexterity: ["dexterity", "dex", "precision"],
  vitality: ["vitality", "vit", "endurance", "constitution", "const"],
  intelligence: ["intelligence", "int", "mind"],
  wisdom: ["wisdom", "wis", "insight"],
  charisma: ["charisma", "cha", "presence"],
  willpower: ["willpower", "will", "resolve"],
  luck: ["luck", "fortune"],
  soul: ["soul", "spirit"],
};

const ALIAS_TO_CANONICAL = Object.entries(ATTRIBUTE_ALIAS_ENTRIES).reduce(
  (acc, [canonical, aliases]) => {
    aliases.forEach((alias) => {
      acc[alias.toLowerCase()] = canonical;
    });
    return acc;
  },
  {},
);

CANONICAL_ATTRIBUTES.forEach((key) => {
  if (!ALIAS_TO_CANONICAL[key]) {
    ALIAS_TO_CANONICAL[key] = key;
  }
});

function toCanonicalAttributeKey(key) {
  if (!key) return null;
  return ALIAS_TO_CANONICAL[key.toString().toLowerCase()] || null;
}

function createAttributeBaseline(value = 0) {
  return CANONICAL_ATTRIBUTES.reduce((acc, attr) => {
    acc[attr] = value;
    return acc;
  }, {});
}

function ensureAttributeShape(source = {}, defaultValue = 0) {
  const baseline = createAttributeBaseline(defaultValue);
  Object.entries(source || {}).forEach(([rawKey, rawValue]) => {
    const canonical = toCanonicalAttributeKey(rawKey);
    if (!canonical) return;
    baseline[canonical] = rawValue;
  });
  return baseline;
}

export {
  ATTRIBUTE_METADATA,
  CANONICAL_ATTRIBUTES,
  createAttributeBaseline,
  ensureAttributeShape,
  toCanonicalAttributeKey,
};
