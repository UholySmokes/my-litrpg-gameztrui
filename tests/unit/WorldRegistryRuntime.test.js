import { afterEach, describe, expect, it } from "@jest/globals";
import {
  factions,
  zones,
  locations,
  setWorldRegistry,
  getLocationById,
  getLocationSummaries,
  getZoneSummaries,
  getFactionSummaries,
  findLocationsByZone,
  resolveLocationId,
} from "../../src/world/WorldDataRegistry.js";

let worldSnapshot = null;

afterEach(() => {
  if (worldSnapshot) {
    setWorldRegistry(worldSnapshot);
    worldSnapshot = null;
  }
});

describe("world registry runtime", () => {
  it("rebuilds lookup indexes when the registry changes", () => {
    worldSnapshot = structuredClone({ factions, zones, locations });

    const customLocation = {
      id: "city_hidden_pier",
      zoneId: "city",
      name: "Hidden Pier",
      summary: "A quiet dock hidden under the city lights.",
      aliases: ["pier", "quiet docks"],
      travelPolicy: "restricted",
    };

    setWorldRegistry({
      factions: worldSnapshot.factions,
      zones: worldSnapshot.zones,
      locations: [...worldSnapshot.locations, customLocation],
    });

    expect(getLocationById("city_hidden_pier")).toEqual(customLocation);
    expect(findLocationsByZone("city").map((location) => location.id)).toContain(
      "city_hidden_pier",
    );
    expect(
      resolveLocationId("pier", {
        allowedLocationIds: new Set(["city_hidden_pier"]),
      }),
    ).toBe("city_hidden_pier");
  });

  it("exposes lightweight faction, zone, and location summaries", () => {
    const locationSummary = getLocationSummaries().find(
      (entry) => entry.id === "starting_zone",
    );
    const zoneSummary = getZoneSummaries().find((entry) => entry.id === "city");
    const factionSummary = getFactionSummaries()[0];

    expect(locationSummary).toEqual(
      expect.objectContaining({
        id: "starting_zone",
        name: "Gateway Plaza",
        zoneId: "city",
        travelPolicy: "public",
      }),
    );
    expect(locationSummary.description).toBeUndefined();

    expect(zoneSummary).toEqual(
      expect.objectContaining({
        id: "city",
        name: expect.any(String),
        connections: expect.any(Array),
      }),
    );

    expect(factionSummary).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        summary: expect.any(String),
      }),
    );
  });

  it("keeps the location registry at or above the phase-2 target", () => {
    expect(locations.length).toBeGreaterThanOrEqual(40);
    expect(getLocationById("skydocks_drydock_seven")).toEqual(
      expect.objectContaining({
        zoneId: "skydocks",
        name: "Drydock Seven",
      }),
    );
  });
});
