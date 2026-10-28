export const FEATURED_ARCHETYPES = Object.freeze([
  {
    id: "astra",
    name: "Astra Veil",
    role: "Arcane Duelist",
    lineage: "Moon Elf",
    classLabel: "Spellblade",
    summary:
      "Blink through tempo gaps, chain spell-etched strikes, and cash out on precision burst windows.",
    traits: ["Burst", "Mobility", "Arcane"],
    accent: "amethyst",
  },
  {
    id: "brakka",
    name: "Brakka Ironroot",
    role: "Frontline Guardian",
    lineage: "Stoneborn",
    classLabel: "Bastion",
    summary:
      "Convert pressure into barriers, threat spikes, and safe ground while the System tracks every exchange.",
    traits: ["Tank", "Control", "Bulwark"],
    accent: "ember",
  },
  {
    id: "lyra",
    name: "Lyra Ashwind",
    role: "Range Predator",
    lineage: "Wildborn",
    classLabel: "Marksman",
    summary:
      "Play the edges of the battlefield with marked shots, traps, and relentless scouting momentum.",
    traits: ["Range", "Crit", "Scout"],
    accent: "verdant",
  },
  {
    id: "veyn",
    name: "Veyn Hollow",
    role: "Shadow Assassin",
    lineage: "Nightkin",
    classLabel: "Executioner",
    summary:
      "Disappear into narrative openings and detonate isolated targets the moment a kill window forms.",
    traits: ["Stealth", "Execution", "Burst"],
    accent: "void",
  },
]);

const LEGACY_LAYOUT_KEYS = [
  "layout_gameMode",
  "layout_characterCreation",
  "layout_sharedPins",
];

const LEGACY_PREFIXES = ["window_fullscreen_once_"];

export function clearLegacyShellState(storage = null) {
  const target =
    storage ||
    (typeof window !== "undefined" ? window.localStorage : null);

  if (!target) return [];

  const removed = [];

  LEGACY_LAYOUT_KEYS.forEach((key) => {
    try {
      if (target.getItem(key) !== null) {
        target.removeItem(key);
        removed.push(key);
      }
    } catch {
      // Ignore restricted storage contexts.
    }
  });

  try {
    const keys = [];
    for (let index = 0; index < target.length; index += 1) {
      const key = target.key(index);
      if (key) keys.push(key);
    }

    keys.forEach((key) => {
      if (!LEGACY_PREFIXES.some((prefix) => key.startsWith(prefix))) return;
      target.removeItem(key);
      removed.push(key);
    });
  } catch {
    return removed;
  }

  return removed;
}

export function formatIdentityLabel(value, fallback = "Unknown") {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (typeof value?.name === "string" && value.name.trim()) return value.name;
  if (typeof value?.id === "string" && value.id.trim()) return value.id;
  return fallback;
}

export function buildPlayerIdentity(player = null) {
  if (!player) {
    return {
      name: "Unbound Traveler",
      race: "Unchosen Lineage",
      classLabel: "Unwritten Class",
      level: 1,
    };
  }

  return {
    name: player?.name || "Unbound Traveler",
    race: formatIdentityLabel(player?.race, "Unknown Lineage"),
    classLabel: formatIdentityLabel(player?.class, "Unknown Class"),
    level: Number(player?.level || 1) || 1,
  };
}

export function getPlayerGold(player) {
  return player?.currency?.goldCoins ?? player?.gold ?? 0;
}
