/**
 * WorldDataRegistry
 * Canonical world definition + helpers for resolving locations.
 *
 * Note: `starting_zone` is a location id, not a zone id. Zone ids are biome keys
 * (city, ruins, wilds, etc).
 */

// =============================================================================
// WORLD META (BIBLE)
// =============================================================================

export const WORLD_META = {
  id: "shardfall_meridian",
  name: "Shardfall Meridian",
  era: "After the Spirefall",
  tagline: "A neon arcology stitched to broken leylines and living myth.",
  pillars: [
    "Neon sanctuaries over ancient bones",
    "Leylines as infrastructure and addiction",
    "Factions barter in contracts, not virtue",
    "The System records, tempts, and mislabels",
    "Hope survives as a practice, not a prophecy",
  ],
  cosmology: {
    void:
      "The Void is not evil; it is absence that erodes meaning. Thin places form where reality has been scraped down to raw silence, and memory becomes unreliable the longer you stare into the gap.",
    leylines:
      "Leylines are mana-transport rails: power made route, schedule, and tariff. Storms are overload events, and stabilizers are political leverage disguised as public safety.",
    spirefall:
      "The Fallen Spire was a regulator that kept districts synchronized. When it fractured, zones desynced, factions hardened into infrastructure, and system echoes became common enough to feel like weather.",
  },
  timeline: [
    {
      year: "Year -40",
      event:
        "The Spire is raised as a regulator, marketed as a \"civilization patch.\"",
    },
    {
      year: "Year -18",
      event: "First leyline black markets form beneath the bazaar underwalks.",
    },
    {
      year: "Year -12",
      event:
        "Skyforge platforms are completed; skydocks become a second capital.",
    },
    {
      year: "Year -8",
      event: "The Veil Archive seals its first ledger with living ink.",
    },
    {
      year: "Year -3",
      event:
        "A coastal ward fails briefly; the Tideward Order forms as a permanent watch.",
    },
    {
      year: "Year 0",
      event: "The Spirefall. Stormglass rains across the ruins; zones fracture.",
    },
    {
      year: "Year 2",
      event:
        "Arcane Wardens establish quarantine boundaries and salvage rights.",
    },
    {
      year: "Year 5",
      event:
        "The Aurum Exchange standardizes soulcoin contracts across the city.",
    },
    {
      year: "Year 7",
      event: "The Ember Bloom ignites for the first time in recorded memory.",
    },
    {
      year: "Year 9",
      event: "Mirage Guides publish route-glyphs that only read true at dusk.",
    },
    {
      year: "Year 11",
      event:
        "Smoke Wardens begin vent-sealing campaigns; volcanic ridges stabilize temporarily.",
    },
    {
      year: "Year 13",
      event: "Dream-wisps surge; mnemonic dust becomes a civic commodity.",
    },
  ],
  regionStubs: [
    {
      id: "auric_crown",
      name: "Auric Crown",
      summary: "Cathedral-states that export blessings like tariffs.",
      hooks: ["Reliquary embargo", "Choir-war diplomacy"],
    },
    {
      id: "glassstep_expanse",
      name: "Glassstep Expanse",
      summary: "Stormglass deserts where reflections lie.",
      hooks: ["Mirror caravans", "False oases"],
    },
    {
      id: "emberline_archipelago",
      name: "Emberline Archipelago",
      summary: "Volcanic island chain with living vents.",
      hooks: ["Vent treaties", "Ash-sail pirates"],
    },
    {
      id: "veilward_depths",
      name: "Veilward Depths",
      summary: "Underworld cities that trade secrets as fuel.",
      hooks: ["Ledger assassins", "Memory auctions"],
    },
    {
      id: "skybound_marches",
      name: "Skybound Marches",
      summary: "High-altitude frontier controlled by engine law.",
      hooks: ["Dock-feud courts", "Airship conscription"],
    },
    {
      id: "wildroot_basin",
      name: "Wildroot Basin",
      summary: "Grove networks where diplomacy is grown, not spoken.",
      hooks: ["Seed oaths", "Bloom sabotage"],
    },
  ],
};

// =============================================================================
// FACTIONS / ZONES / LOCATIONS
// =============================================================================

export let factions = [];
export let zones = [];
export let locations = [];

export const MAJOR_FACTION_IDS = [
  "arcane_wardens",
  "aurum_exchange",
  "verdant_envoys",
  "skyforge_sentinels",
  "veil_wardens",
  "tideward_order",
  "mirage_guides",
  "smoke_wardens",
];

// =============================================================================
// MUTATORS / LOOKUPS
// =============================================================================

export function setWorldRegistry({
  factions: nextFactions,
  zones: nextZones,
  locations: nextLocations,
} = {}) {
  if (Array.isArray(nextFactions)) {
    factions = nextFactions;
  }
  if (Array.isArray(nextZones)) {
    zones = nextZones;
  }
  if (Array.isArray(nextLocations)) {
    locations = nextLocations;
  }
}

export function getFactionById(id) {
  if (!id) return null;
  return factions.find((f) => f.id === id) || null;
}

export function getZoneById(id) {
  if (!id) return null;
  return zones.find((z) => z.id === id) || null;
}

export function getLocationById(id) {
  if (!id) return null;
  return locations.find((loc) => loc.id === id) || null;
}

export function findLocationsByZone(zoneId) {
  if (!zoneId) return [];
  return locations.filter((loc) => loc.zoneId === zoneId);
}

function normalizeSearchText(value) {
  if (typeof value !== "string") return "";
  const lowered = value.toLowerCase().trim();
  if (!lowered) return "";
  const asSpaces = lowered.replace(/[_-]+/g, " ");
  const alnumSpace = asSpaces.replace(/[^a-z0-9 ]+/g, " ");
  return alnumSpace.replace(/\s{2,}/g, " ").trim();
}

function normalizeAllowedIds(allowedLocationIds) {
  if (!allowedLocationIds) return null;
  if (allowedLocationIds instanceof Set) {
    return new Set(
      Array.from(allowedLocationIds).filter((id) => typeof id === "string"),
    );
  }
  if (Array.isArray(allowedLocationIds)) {
    return new Set(allowedLocationIds.filter((id) => typeof id === "string"));
  }
  return null;
}

function pickLexicographicallySmallestId(matches) {
  if (!Array.isArray(matches) || matches.length === 0) return null;
  const ids = matches.map((loc) => loc.id).filter(Boolean);
  ids.sort((a, b) => String(a).localeCompare(String(b)));
  return ids[0] || null;
}

/**
 * Resolve a raw user/location string to a canonical location id.
 * Deterministic tie-break: prefer exact id, then exact alias, then exact name,
 * then unique contains-match; otherwise pick lexicographically smallest id.
 */
export function resolveLocationId(raw, { allowedLocationIds } = {}) {
  const allowedSet = normalizeAllowedIds(allowedLocationIds);
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  const rawLower = trimmed.toLowerCase();
  const normalized = normalizeSearchText(trimmed);
  if (!normalized) return null;

  const pool = allowedSet
    ? locations.filter((loc) => allowedSet.has(loc.id))
    : locations;

  // 1) Exact id match
  const idMatch = pool.find((loc) => loc.id === rawLower);
  if (idMatch) return idMatch.id;

  // 2) Exact alias match
  const aliasMatches = pool.filter((loc) =>
    Array.isArray(loc.aliases)
      ? loc.aliases.some((alias) => normalizeSearchText(alias) === normalized)
      : false,
  );
  if (aliasMatches.length === 1) return aliasMatches[0].id;
  if (aliasMatches.length > 1)
    return pickLexicographicallySmallestId(aliasMatches);

  // 3) Exact name match
  const nameMatches = pool.filter(
    (loc) => normalizeSearchText(loc.name) === normalized,
  );
  if (nameMatches.length === 1) return nameMatches[0].id;
  if (nameMatches.length > 1) return pickLexicographicallySmallestId(nameMatches);

  // 4) Contains-match if unique
  const containsMatches = pool.filter((loc) => {
    const name = normalizeSearchText(loc.name);
    if (name.includes(normalized)) return true;
    const aliases = Array.isArray(loc.aliases) ? loc.aliases : [];
    return aliases.some((alias) =>
      normalizeSearchText(alias).includes(normalized),
    );
  });
  if (containsMatches.length === 1) return containsMatches[0].id;

  // 5) Deterministic fallback (rare/ambiguous)
  return pickLexicographicallySmallestId(containsMatches);
}

/**
 * Runtime helper: compute location ids a player can travel to right now.
 * Includes visited/unlocked/current, plus "public" hubs in the current zone.
 */
export function getAccessibleLocationIds(gameState) {
  const world = gameState?.world || {};
  const rawLocation = world.location;
  const currentRaw =
    typeof rawLocation === "string" ? rawLocation : rawLocation?.current;
  const currentId = resolveLocationId(currentRaw) || currentRaw || null;

  const visited = Array.isArray(rawLocation?.visited) ? rawLocation.visited : [];
  const unlocked = Array.isArray(rawLocation?.unlockedAreas)
    ? rawLocation.unlockedAreas
    : [];

  const result = new Set(
    [currentId, ...visited, ...unlocked].filter(
      (id) => typeof id === "string" && id.trim(),
    ),
  );

  const resolvedCurrent =
    typeof currentId === "string" ? getLocationById(currentId) : null;
  const zoneId = resolvedCurrent?.zoneId || null;
  if (zoneId) {
    findLocationsByZone(zoneId)
      .filter((loc) => loc.travelPolicy === "public")
      .forEach((loc) => result.add(loc.id));
  }

  return result;
}

