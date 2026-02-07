import { describe, it, expect } from "@jest/globals";
import {
  MAJOR_FACTION_IDS,
  factions,
  zones,
  locations,
  getLocationById,
} from "../../src/data/registries/WorldDataRegistry.js";

describe("WorldDataRegistry integrity", () => {
  it("zone ids are unique", () => {
    const ids = zones.map((z) => z.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("zone connections reference existing zones", () => {
    const zoneIdSet = new Set(zones.map((z) => z.id));
    zones.forEach((zone) => {
      const connections = Array.isArray(zone.connections) ? zone.connections : [];
      connections.forEach((targetId) => {
        expect(zoneIdSet.has(targetId)).toBe(true);
      });
    });
  });

  it("location ids are unique and reference existing zones", () => {
    const zoneIdSet = new Set(zones.map((z) => z.id));
    const ids = locations.map((loc) => loc.id);
    expect(new Set(ids).size).toBe(ids.length);

    locations.forEach((loc) => {
      expect(zoneIdSet.has(loc.zoneId)).toBe(true);
    });
  });

  it("starting_zone exists and is a location id", () => {
    const loc = getLocationById("starting_zone");
    expect(loc).toBeTruthy();
    expect(loc.zoneId).toBe("city");
  });

  it("major faction HQ locations exist", () => {
    const factionById = new Map(factions.map((f) => [f.id, f]));
    MAJOR_FACTION_IDS.forEach((id) => {
      const faction = factionById.get(id);
      expect(faction).toBeTruthy();
      expect(getLocationById(faction.hqLocationId)).toBeTruthy();
    });
  });
});

