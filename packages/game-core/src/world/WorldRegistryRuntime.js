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

function pickBestMatch(entries = []) {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  return entries
    .slice()
    .sort(
      (left, right) =>
        (right.score || 0) - (left.score || 0) ||
        compareIds(left.id, right.id),
    )[0];
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
  defaultStartLocationId = null,
} = {}) {
  const factionById = new Map();
  const zoneById = new Map();
  const locationById = new Map();
  const locationsByZoneId = new Map();
  const zoneNameIndex = new Map();
  const locationAliasIndex = new Map();
  const locationNameIndex = new Map();
  const zoneSearchEntries = [];
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
      const normalizedName = normalizeSearchText(zone.name);
      if (normalizedName) {
        pushIndexEntry(zoneNameIndex, normalizedName, zone.id);
      }
      zoneSearchEntries.push({
        id: zone.id,
        name: normalizedName,
      });
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
  finalizeIndex(zoneNameIndex);

  const starterLocationIds = new Set(
    zoneSummaries.flatMap((zone) =>
      Array.isArray(zone?.startingLocationId)
        ? zone.startingLocationId
        : Array.isArray(zoneById.get(zone.id)?.startLocationIds)
          ? zoneById.get(zone.id).startLocationIds
          : [],
    ),
  );

  const getAllowedLocationIdPool = (allowedLocationIds) => {
    const allowedSet = normalizeAllowedIds(allowedLocationIds);
    if (!allowedSet) return { allowedSet, poolEntries: locationSearchEntries };
    return {
      allowedSet,
      poolEntries: locationSearchEntries.filter((entry) => allowedSet.has(entry.id)),
    };
  };

  const getStarterLocationEntries = () =>
    locationSearchEntries.filter((entry) => starterLocationIds.has(entry.id));

  const getZoneEntryLocationId = (zoneId, { allowedLocationIds } = {}) => {
    const zone = zoneById.get(zoneId);
    if (!zone) return null;

    const allowedSet = normalizeAllowedIds(allowedLocationIds);
    const startLocationIds = Array.isArray(zone.startLocationIds)
      ? zone.startLocationIds.filter((id) => typeof id === "string" && id.trim())
      : [];
    const allowedStartLocationIds = allowedSet
      ? startLocationIds.filter((id) => allowedSet.has(id))
      : startLocationIds;

    const publicStartId = allowedStartLocationIds.find(
      (id) => locationById.get(id)?.travelPolicy === "public",
    );
    if (publicStartId) return publicStartId;

    if (allowedStartLocationIds.length > 0) {
      return allowedStartLocationIds[0];
    }

    const publicLocationId = (locationsByZoneId.get(zoneId) || [])
      .filter((location) => location?.travelPolicy === "public")
      .map((location) => location.id)
      .find((id) => !allowedSet || allowedSet.has(id));

    return publicLocationId || null;
  };

  const resolvedDefaultStartLocationId =
    (typeof defaultStartLocationId === "string" &&
    locationById.has(defaultStartLocationId)
      ? defaultStartLocationId
      : null) ||
    getZoneEntryLocationId("city") ||
    getStarterLocationEntries()[0]?.id ||
    locationSearchEntries[0]?.id ||
    null;

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
    resolveZoneId(raw) {
      const trimmed = typeof raw === "string" ? raw.trim() : "";
      const rawLower = trimmed.toLowerCase();
      const normalized = normalizeSearchText(trimmed);
      if (!normalized) return null;

      if (zoneById.has(rawLower)) {
        return rawLower;
      }

      const nameMatches = zoneNameIndex.get(normalized);
      if (Array.isArray(nameMatches) && nameMatches.length === 1) {
        return nameMatches[0];
      }
      if (Array.isArray(nameMatches) && nameMatches.length > 1) {
        return pickLexicographicallySmallestId(nameMatches);
      }

      const containsMatches = zoneSearchEntries
        .filter((entry) => entry.name.includes(normalized) || normalized.includes(entry.name))
        .map((entry) => entry.id);

      if (containsMatches.length === 1) return containsMatches[0];
      return pickLexicographicallySmallestId(containsMatches);
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
    getZoneEntryLocationId(zoneId, options = {}) {
      return getZoneEntryLocationId(zoneId, options);
    },
    resolveTravelLocationId(raw, { allowedLocationIds } = {}) {
      const locationId = this.resolveLocationId(raw, { allowedLocationIds });
      if (locationId) return locationId;
      const zoneId = this.resolveZoneId(raw);
      if (!zoneId) return null;
      return getZoneEntryLocationId(zoneId, { allowedLocationIds });
    },
    resolveStartingLocationId(
      raw,
      { fallbackLocationId = resolvedDefaultStartLocationId } = {},
    ) {
      const fallback = locationById.has(fallbackLocationId)
        ? fallbackLocationId
        : resolvedDefaultStartLocationId;
      const trimmed = typeof raw === "string" ? raw.trim() : "";
      const normalized = normalizeSearchText(trimmed);
      if (!normalized) return fallback;

      const starterEntries = getStarterLocationEntries();
      const exactLocationMatches = starterEntries
        .filter(
          (entry) =>
            entry.id === normalized ||
            entry.name === normalized ||
            entry.aliases.includes(normalized),
        )
        .map((entry) => entry.id);
      if (exactLocationMatches.length > 0) {
        return pickLexicographicallySmallestId(exactLocationMatches) || fallback;
      }

      const exactZoneId = this.resolveZoneId(trimmed);
      if (exactZoneId) {
        return getZoneEntryLocationId(exactZoneId) || fallback;
      }

      const locationMatch = pickBestMatch(
        starterEntries
          .map((entry) => {
            const exactContained = [entry.name, ...entry.aliases].find(
              (candidate) => candidate && normalized.includes(candidate),
            );
            if (exactContained) {
              return { id: entry.id, score: exactContained.length + 100 };
            }
            const partial = [entry.name, ...entry.aliases].find(
              (candidate) => candidate && candidate.includes(normalized),
            );
            if (partial) {
              return { id: entry.id, score: partial.length };
            }
            return null;
          })
          .filter(Boolean),
      );
      if (locationMatch?.id) {
        return locationMatch.id;
      }

      const zoneMatch = pickBestMatch(
        zoneSearchEntries
          .map((entry) => {
            if (!entry?.id || !entry?.name) return null;
            if (normalized.includes(entry.name) || normalized.includes(entry.id)) {
              return { id: entry.id, score: entry.name.length + 80 };
            }
            if (entry.name.includes(normalized)) {
              return { id: entry.id, score: entry.name.length };
            }
            return null;
          })
          .filter(Boolean),
      );
      if (zoneMatch?.id) {
        return getZoneEntryLocationId(zoneMatch.id) || fallback;
      }

      return fallback;
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

      const resolvedCurrent =
        typeof currentId === "string" ? this.getLocationById(currentId) : null;
      const zoneId = resolvedCurrent?.zoneId || null;

      const result = new Set();
      const addLocationId = (locationId) => {
        if (typeof locationId !== "string" || !locationId.trim()) return;
        const location = this.getLocationById(locationId);
        if (!location?.zoneId) return;
        if (!zoneId || location.zoneId === zoneId) {
          result.add(location.id);
        }
      };

      [currentId, ...visited, ...unlocked].forEach(addLocationId);

      if (zoneId) {
        this.findLocationsByZone(zoneId)
          .filter((location) => location.travelPolicy === "public")
          .forEach((location) => result.add(location.id));

        const connectedZoneIds = Array.isArray(this.getZoneById(zoneId)?.connections)
          ? this.getZoneById(zoneId).connections
          : [];

        connectedZoneIds.forEach((connectedZoneId) => {
          const zone = this.getZoneById(connectedZoneId);
          if (!zone) return;

          const startLocationIds = Array.isArray(zone.startLocationIds)
            ? zone.startLocationIds
            : [];
          startLocationIds.forEach((locationId) => {
            if (typeof locationId === "string" && locationId.trim()) {
              result.add(locationId);
            }
          });
        });
      }

      return result;
    },
  };
}
