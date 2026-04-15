import { describe, expect, it } from "@jest/globals";
import {
  DEFAULT_START_LOCATION_ID,
  MAJOR_FACTION_IDS,
  STARTING_LANDMASS_IDS,
  WORLD_ATLAS_LANDMASSES,
  factions,
  zones,
  locations,
  getLocationById,
} from "../../src/world/WorldDataRegistry.js";

describe("WorldDataRegistry integrity", () => {
  it("defines eighteen landmasses with two major supercontinents", () => {
    expect(WORLD_ATLAS_LANDMASSES).toHaveLength(18);
    expect(WORLD_ATLAS_LANDMASSES.filter((entry) => entry.scale === "major")).toHaveLength(2);
    expect(zones).toHaveLength(18);
  });

  it("tracks twelve starting-eligible landmasses with valid country counts and climate data", () => {
    expect(STARTING_LANDMASS_IDS).toHaveLength(12);

    WORLD_ATLAS_LANDMASSES.forEach((landmass) => {
      expect(landmass.countryCount).toBeGreaterThanOrEqual(1);
      expect(landmass.countryCount).toBeLessThanOrEqual(500);
      expect(landmass.climateBands).toHaveLength(3);
      expect(landmass.exemplarCountries).toHaveLength(3);
      expect(landmass.deathZone?.name).toBeTruthy();
      expect(landmass.mysticalPlace?.name).toBeTruthy();
    });
  });

  it("zone ids are unique and connections reference existing zones", () => {
    const zoneIds = zones.map((zone) => zone.id);
    const zoneIdSet = new Set(zoneIds);

    expect(zoneIdSet.size).toBe(zoneIds.length);

    zones.forEach((zone) => {
      const connections = Array.isArray(zone.connections) ? zone.connections : [];
      connections.forEach((targetId) => {
        expect(zoneIdSet.has(targetId)).toBe(true);
      });
    });
  });

  it("location ids are unique and reference existing zones", () => {
    const zoneIdSet = new Set(zones.map((zone) => zone.id));
    const locationIds = locations.map((location) => location.id);

    expect(new Set(locationIds).size).toBe(locationIds.length);

    locations.forEach((location) => {
      expect(zoneIdSet.has(location.zoneId)).toBe(true);
    });
  });

  it("the default start location exists and anchors Auric Crown", () => {
    const location = getLocationById(DEFAULT_START_LOCATION_ID);
    expect(location).toBeTruthy();
    expect(location.zoneId).toBe("auric_crown");
  });

  it("major faction HQ locations exist", () => {
    const factionById = new Map(factions.map((faction) => [faction.id, faction]));

    MAJOR_FACTION_IDS.forEach((id) => {
      const faction = factionById.get(id);
      expect(faction).toBeTruthy();
      expect(getLocationById(faction.hqLocationId)).toBeTruthy();
    });
  });
});
