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

function compareIds(left, right) {
  return String(left).localeCompare(String(right));
}

function pickLexicographicallySmallestId(matches) {
  if (!Array.isArray(matches) || matches.length === 0) return null;
  const ids = matches.filter(Boolean).slice().sort(compareIds);
  return ids[0] || null;
}

function pushIndexEntry(index, key, value) {
  if (!key || !value) return;
  const existing = index.get(key);
  if (existing) {
    existing.push(value);
    return;
  }
  index.set(key, [value]);
}

function finalizeIndex(index) {
  for (const values of index.values()) {
    values.sort(compareIds);
  }
}

function buildFactionSummary(faction) {
  return {
    id: faction.id,
    name: faction.name,
    alignment: faction.alignment || null,
    hqLocationId: faction.hqLocationId || null,
    summary: faction.summary || faction.description || "",
  };
}

function buildZoneSummary(zone) {
  return {
    id: zone.id,
    name: zone.name,
    biome: zone.biome || null,
    summary: zone.summary || zone.description || "",
    startingLocationId: zone.startingLocationId || null,
    connections: Array.isArray(zone.connections) ? zone.connections.slice() : [],
  };
}

function buildLocationSummary(location) {
  return {
    id: location.id,
    zoneId: location.zoneId,
    name: location.name,
    summary: location.summary || "",
    travelPolicy: location.travelPolicy || null,
    aliases: Array.isArray(location.aliases) ? location.aliases.slice() : [],
  };
}

export function createWorldRegistryRuntime({
  factions = [],
  zones = [],
  locations = [],
} = {}) {
  const factionById = new Map();
  const zoneById = new Map();
  const locationById = new Map();
  const locationsByZoneId = new Map();
  const locationAliasIndex = new Map();
  const locationNameIndex = new Map();
  const locationSearchEntries = [];

  const factionSummaries = factions
    .filter((entry) => entry && typeof entry === "object")
    .map((faction) => {
      if (typeof faction.id === "string" && faction.id) {
        factionById.set(faction.id, faction);
      }
      return buildFactionSummary(faction);
    });

  const zoneSummaries = zones
    .filter((entry) => entry && typeof entry === "object")
    .map((zone) => {
      if (typeof zone.id === "string" && zone.id) {
        zoneById.set(zone.id, zone);
      }
      return buildZoneSummary(zone);
    });

  const locationSummaries = locations
    .filter((entry) => entry && typeof entry === "object")
    .map((location) => {
      if (typeof location.id === "string" && location.id) {
        locationById.set(location.id, location);
      }

      const zoneLocations = locationsByZoneId.get(location.zoneId) || [];
      zoneLocations.push(location);
      locationsByZoneId.set(location.zoneId, zoneLocations);

      const normalizedName = normalizeSearchText(location.name);
      if (normalizedName) {
        pushIndexEntry(locationNameIndex, normalizedName, location.id);
      }

      const aliases = Array.isArray(location.aliases) ? location.aliases : [];
      for (const alias of aliases) {
        const normalizedAlias = normalizeSearchText(alias);
        if (normalizedAlias) {
          pushIndexEntry(locationAliasIndex, normalizedAlias, location.id);
        }
      }

      locationSearchEntries.push({
        id: location.id,
        name: normalizedName,
        aliases: aliases.map(normalizeSearchText).filter(Boolean),
      });

      return buildLocationSummary(location);
    });

  finalizeIndex(locationAliasIndex);
  finalizeIndex(locationNameIndex);

  const getAllowedLocationIdPool = (allowedLocationIds) => {
    const allowedSet = normalizeAllowedIds(allowedLocationIds);
    if (!allowedSet) return { allowedSet, poolEntries: locationSearchEntries };
    return {
      allowedSet,
      poolEntries: locationSearchEntries.filter((entry) => allowedSet.has(entry.id)),
    };
  };

  return {
    getFactionById(id) {
      if (!id) return null;
      return factionById.get(id) || null;
    },
    getZoneById(id) {
      if (!id) return null;
      return zoneById.get(id) || null;
    },
    getLocationById(id) {
      if (!id) return null;
      return locationById.get(id) || null;
    },
    findLocationsByZone(zoneId) {
      if (!zoneId) return [];
      return (locationsByZoneId.get(zoneId) || []).slice();
    },
    getFactionSummaries() {
      return factionSummaries.slice();
    },
    getZoneSummaries() {
      return zoneSummaries.slice();
    },
    getLocationSummaries() {
      return locationSummaries.slice();
    },
    resolveLocationId(raw, { allowedLocationIds } = {}) {
      const trimmed = typeof raw === "string" ? raw.trim() : "";
      const rawLower = trimmed.toLowerCase();
      const normalized = normalizeSearchText(trimmed);
      if (!normalized) return null;

      const { allowedSet, poolEntries } = getAllowedLocationIdPool(allowedLocationIds);
      const filterIds = (ids) =>
        Array.isArray(ids)
          ? ids.filter((id) => !allowedSet || allowedSet.has(id))
          : [];

      if ((!allowedSet || allowedSet.has(rawLower)) && locationById.has(rawLower)) {
        return rawLower;
      }

      const aliasMatches = filterIds(locationAliasIndex.get(normalized));
      if (aliasMatches.length === 1) return aliasMatches[0];
      if (aliasMatches.length > 1) {
        return pickLexicographicallySmallestId(aliasMatches);
      }

      const nameMatches = filterIds(locationNameIndex.get(normalized));
      if (nameMatches.length === 1) return nameMatches[0];
      if (nameMatches.length > 1) {
        return pickLexicographicallySmallestId(nameMatches);
      }

      const containsMatches = poolEntries
        .filter((entry) => {
          if (entry.name.includes(normalized)) return true;
          return entry.aliases.some((alias) => alias.includes(normalized));
        })
        .map((entry) => entry.id);

      if (containsMatches.length === 1) return containsMatches[0];
      return pickLexicographicallySmallestId(containsMatches);
    },
    getAccessibleLocationIds(gameState) {
      const world = gameState?.world || {};
      const rawLocation = world.location;
      const currentRaw =
        typeof rawLocation === "string" ? rawLocation : rawLocation?.current;
      const currentId =
        this.resolveLocationId(currentRaw) || currentRaw || null;

      const visited = Array.isArray(rawLocation?.visited)
        ? rawLocation.visited
        : [];
      const unlocked = Array.isArray(rawLocation?.unlockedAreas)
        ? rawLocation.unlockedAreas
        : [];

      const result = new Set(
        [currentId, ...visited, ...unlocked].filter(
          (id) => typeof id === "string" && id.trim(),
        ),
      );

      const resolvedCurrent =
        typeof currentId === "string" ? this.getLocationById(currentId) : null;
      const zoneId = resolvedCurrent?.zoneId || null;
      if (zoneId) {
        this.findLocationsByZone(zoneId)
          .filter((location) => location.travelPolicy === "public")
          .forEach((location) => result.add(location.id));
      }

      return result;
    },
  };
}
