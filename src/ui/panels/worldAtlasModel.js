import {
  DEFAULT_START_LOCATION_ID,
  WORLD_META,
  WORLD_ATLAS_REGIONS,
  MERIDIAN_ATLAS_LAYOUT,
  findLocationsByZone,
  getBiomeEssenceProfile,
  getLocationById,
  getZoneById,
} from "../../world/WorldDataRegistry.js";

function dedupe(values = []) {
  return Array.from(new Set(values.filter((value) => typeof value === "string" && value.trim())));
}

function capitalizeLabel(value) {
  return String(value || "")
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function toHotspotId(kind, id) {
  return `${kind}:${id}`;
}

function resolveZoneIdFromReference(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const location = getLocationById(value);
  if (location?.zoneId) return location.zoneId;
  const zone = getZoneById(value);
  return zone?.id || null;
}

function collectChronicleZoneIds(chronicle = {}) {
  const found = [];
  const collections = [chronicle?.entries, chronicle?.discoveries, chronicle?.majorChoices];

  for (const entries of collections) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (typeof entry?.zoneId === "string" && entry.zoneId.trim()) {
        found.push(entry.zoneId.trim());
        continue;
      }
      if (typeof entry?.locationId === "string" && entry.locationId.trim()) {
        const zoneId = resolveZoneIdFromReference(entry.locationId);
        if (zoneId) {
          found.push(zoneId);
          continue;
        }
      }
      if (entry?.type === "zone" && typeof entry?.id === "string") {
        const zoneId = entry.id.replace(/^discovery_zone_/, "").trim();
        if (getZoneById(zoneId)) {
          found.push(zoneId);
        }
      }
    }
  }

  return dedupe(found);
}

function resolveNotableLocations(zoneId, detailLocationIds = []) {
  const fallbackIds = (findLocationsByZone(zoneId) || []).map((location) => location.id);
  return dedupe([...detailLocationIds, ...fallbackIds])
    .slice(0, 2)
    .map((locationId) => getLocationById(locationId))
    .filter(Boolean)
    .map((location) => ({
      id: location.id,
      name: location.name,
      summary: location.summary || "No cartographic note recorded.",
    }));
}

function getMacroRegionAccent(regionId) {
  if (regionId === WORLD_META.id) return "var(--holo-cyan)";
  if (["auric_crown", "glassstep_expanse", "emberline_archipelago"].includes(regionId)) {
    return "var(--holo-gold)";
  }
  return "var(--holo-cyan)";
}

function getZoneAccent(status) {
  if (status === "current") return "var(--holo-gold)";
  if (status === "known") return "var(--holo-cyan)";
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
    getLocationById(DEFAULT_START_LOCATION_ID)?.zoneId ||
    "city";

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

  const meridianZoneIdSet = new Set(MERIDIAN_ATLAS_LAYOUT.map((entry) => entry.zoneId));
  const macroRegions = WORLD_ATLAS_REGIONS.map((region) => ({
    kind: "region",
    hotspotId: toHotspotId("region", region.id),
    id: region.id,
    name: region.name,
    summary: region.summary,
    hooks: Array.isArray(region.hooks) ? region.hooks.slice(0, 2) : [],
    atlasPlacement: region.atlasPlacement,
    accent: getMacroRegionAccent(region.id),
    isCurrentTheater: region.id === WORLD_META.id,
  }));

  const meridianZones = MERIDIAN_ATLAS_LAYOUT.map((layout) => {
    const zone = getZoneById(layout.zoneId);
    const profile = getBiomeEssenceProfile(layout.zoneId);
    const notableLocations = resolveNotableLocations(layout.zoneId, layout.detailLocationIds);
    const isCurrent = layout.zoneId === currentZoneId;
    const isKnown = isCurrent || knownZoneIds.has(layout.zoneId);
    return {
      kind: "zone",
      hotspotId: toHotspotId("zone", layout.zoneId),
      id: zone?.id || layout.zoneId,
      name: zone?.name || capitalizeLabel(layout.zoneId),
      summary: zone?.summary || zone?.description || "No zone summary recorded.",
      accent: getZoneAccent(isCurrent ? "current" : isKnown ? "known" : "unseen"),
      atlasPlacement: layout.atlasPlacement,
      detached: layout.detached === true,
      connectorFromZoneId: layout.connectorFromZoneId || null,
      radius: Number(layout.radius || 14),
      status: isCurrent ? "current" : isKnown ? "known" : "unseen",
      isCurrent,
      isKnown,
      essenceTriad: Array.isArray(profile?.dominantTriad)
        ? profile.dominantTriad.slice(0, 3)
        : [],
      notableLocations,
      notableLocationNames: notableLocations.map((location) => location.name),
    };
  });

  const zoneById = new Map(meridianZones.map((zone) => [zone.id, zone]));
  const detachedZoneIds = new Set(
    meridianZones.filter((zone) => zone.detached).map((zone) => zone.id),
  );
  const meridianConnections = [];
  const connectionIds = new Set();

  for (const zone of meridianZones) {
    if (zone.detached) {
      if (zone.connectorFromZoneId && zoneById.has(zone.connectorFromZoneId)) {
        const connectionId = `detached:${zone.connectorFromZoneId}:${zone.id}`;
        connectionIds.add(connectionId);
        meridianConnections.push({
          id: connectionId,
          from: zone.connectorFromZoneId,
          to: zone.id,
          detached: true,
        });
      }
      continue;
    }

    const sourceZone = getZoneById(zone.id);
    const targetIds = Array.isArray(sourceZone?.connections) ? sourceZone.connections : [];
    for (const targetId of targetIds) {
      if (!zoneById.has(targetId) || detachedZoneIds.has(targetId)) continue;
      const connectionId = [zone.id, targetId].sort().join(":");
      if (connectionIds.has(connectionId)) continue;
      connectionIds.add(connectionId);
      meridianConnections.push({
        id: connectionId,
        from: zone.id,
        to: targetId,
        detached: false,
      });
    }
  }

  const hotspots = [...macroRegions, ...meridianZones];
  const hotspotsById = Object.fromEntries(
    hotspots.map((hotspot) => [hotspot.hotspotId, hotspot]),
  );

  const defaultHotspotId = meridianZoneIdSet.has(currentZoneId)
    ? toHotspotId("zone", currentZoneId)
    : toHotspotId("region", WORLD_META.id);

  return {
    currentLocationId: currentLocation?.id || DEFAULT_START_LOCATION_ID,
    currentLocationName: currentLocation?.name || "Unknown location",
    currentZoneId,
    currentZoneName: getZoneById(currentZoneId)?.name || "Unknown zone",
    macroRegions,
    meridianZones,
    meridianConnections,
    hotspotsById,
    defaultHotspotId,
    knownZoneIds: Array.from(knownZoneIds),
  };
}
