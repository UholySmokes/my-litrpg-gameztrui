import {
  DEFAULT_START_LOCATION_ID,
  DEFAULT_START_ZONE_ID,
  WORLD_ATLAS_LANDMASSES,
  findLocationsByZone,
  getLocationById,
  getZoneById,
  resolveZoneId,
} from "../../world/WorldDataRegistry.js";

function dedupe(values = []) {
  return Array.from(new Set(values.filter((value) => typeof value === "string" && value.trim())));
}

function toHotspotId(id) {
  return `landmass:${id}`;
}

function resolveZoneIdFromReference(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const location = getLocationById(value);
  if (location?.zoneId) return location.zoneId;
  return resolveZoneId(value);
}

function collectChronicleZoneIds(chronicle = {}) {
  const found = [];
  const collections = [chronicle?.entries, chronicle?.discoveries, chronicle?.majorChoices];

  for (const entries of collections) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (typeof entry?.zoneId === "string" && entry.zoneId.trim()) {
        const resolvedZoneId = resolveZoneId(entry.zoneId);
        if (resolvedZoneId) {
          found.push(resolvedZoneId);
          continue;
        }
      }
      if (typeof entry?.locationId === "string" && entry.locationId.trim()) {
        const zoneId = resolveZoneIdFromReference(entry.locationId);
        if (zoneId) {
          found.push(zoneId);
          continue;
        }
      }
      if (entry?.type === "zone" && typeof entry?.id === "string") {
        const zoneId = resolveZoneId(entry.id.replace(/^discovery_zone_/, "").trim());
        if (zoneId) {
          found.push(zoneId);
        }
      }
    }
  }

  return dedupe(found);
}

function resolveNotableLocations(zoneId) {
  return (findLocationsByZone(zoneId) || [])
    .slice(0, 3)
    .map((location) => ({
      id: location.id,
      name: location.name,
      summary: location.summary || "No cartographic note recorded.",
      travelPolicy: location.travelPolicy || "restricted",
    }));
}

function getLandmassAccent(landmass) {
  if (landmass.isCurrent) return "var(--holo-gold)";
  if (landmass.isMajor) return "var(--holo-gold)";
  if (landmass.status === "known") return "var(--holo-cyan)";
  return "var(--text-dim)";
}

export function buildWorldAtlasModel(state = {}) {
  const rawLocation = state?.world?.location;
  const resolvedCurrentLocationId =
    typeof rawLocation === "string"
      ? rawLocation
      : rawLocation?.current || DEFAULT_START_LOCATION_ID;
  const currentLocation =
    getLocationById(resolvedCurrentLocationId) || getLocationById(DEFAULT_START_LOCATION_ID);
  const currentZoneId =
    currentLocation?.zoneId ||
    resolveZoneIdFromReference(rawLocation?.biome) ||
    DEFAULT_START_ZONE_ID;

  const knownZoneIds = new Set(
    dedupe([
      currentZoneId,
      resolveZoneIdFromReference(rawLocation?.biome),
      ...(Array.isArray(rawLocation?.visited)
        ? rawLocation.visited.map((entry) => resolveZoneIdFromReference(entry))
        : []),
      ...(Array.isArray(rawLocation?.unlockedAreas)
        ? rawLocation.unlockedAreas.map((entry) => resolveZoneIdFromReference(entry))
        : []),
      ...collectChronicleZoneIds(state?.chronicle),
    ]),
  );

  const landmasses = WORLD_ATLAS_LANDMASSES.map((landmass) => {
    const zone = getZoneById(landmass.id);
    const notableLocations = resolveNotableLocations(landmass.id);
    const isCurrent = landmass.id === currentZoneId;
    const isKnown = isCurrent || knownZoneIds.has(landmass.id);
    const status = isCurrent ? "current" : isKnown ? "known" : "unseen";
    const isLocked = !landmass.startingEligible && status === "unseen";

    return {
      kind: "landmass",
      hotspotId: toHotspotId(landmass.id),
      id: landmass.id,
      name: landmass.name,
      summary: zone?.summary || landmass.summary,
      uniquenessThesis: landmass.uniquenessThesis,
      scale: landmass.scale,
      isMajor: landmass.scale === "major",
      countryCount: landmass.countryCount,
      countries: Array.isArray(landmass.countries) ? landmass.countries.slice(0, 3) : [],
      exemplarCountries: Array.isArray(landmass.exemplarCountries)
        ? landmass.exemplarCountries.slice(0, 3)
        : [],
      climateBands: Array.isArray(landmass.climateBands) ? landmass.climateBands.slice(0, 3) : [],
      deathZone: landmass.deathZone,
      mysticalPlace: landmass.mysticalPlace,
      essenceTriad: Array.isArray(landmass.essenceTriad) ? landmass.essenceTriad.slice(0, 3) : [],
      gameplayType: landmass.gameplayType,
      startingEligible: landmass.startingEligible === true,
      atlasPlacement: landmass.atlasPlacement,
      notableLocations,
      currentLocationName: isCurrent ? currentLocation?.name || null : null,
      status,
      isCurrent,
      isKnown,
      isLocked,
      accent: getLandmassAccent({
        ...landmass,
        isCurrent,
        status,
        isMajor: landmass.scale === "major",
      }),
    };
  });

  const hotspotsById = Object.fromEntries(
    landmasses.map((landmass) => [landmass.hotspotId, landmass]),
  );

  return {
    currentLocationId: currentLocation?.id || DEFAULT_START_LOCATION_ID,
    currentLocationName: currentLocation?.name || "Unknown location",
    currentZoneId,
    currentZoneName: getZoneById(currentZoneId)?.name || "Unknown landmass",
    landmasses,
    hotspotsById,
    defaultHotspotId: toHotspotId(currentZoneId),
    knownZoneIds: Array.from(knownZoneIds),
  };
}
