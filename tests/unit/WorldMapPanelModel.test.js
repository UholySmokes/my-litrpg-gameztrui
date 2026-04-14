import { describe, expect, it } from "@jest/globals";
import { buildWorldAtlasModel } from "../../src/ui/panels/worldAtlasModel.js";

function createState(overrides = {}) {
  return {
    world: {
      location: {
        current: "city_neon_bazaar",
        visited: [],
        unlockedAreas: [],
      },
    },
    chronicle: {
      discoveries: [],
      entries: [],
      majorChoices: [],
    },
    ...overrides,
  };
}

describe("buildWorldAtlasModel", () => {
  it("returns the stable seven macro-regions and ten Meridian zones", () => {
    const model = buildWorldAtlasModel(createState());

    expect(model.macroRegions.map((region) => region.id)).toEqual([
      "auric_crown",
      "skybound_marches",
      "glassstep_expanse",
      "emberline_archipelago",
      "veilward_depths",
      "wildroot_basin",
      "shardfall_meridian",
    ]);

    expect(model.meridianZones.map((zone) => zone.id)).toEqual([
      "mountain",
      "ruins",
      "city",
      "skydocks",
      "wilds",
      "undercity",
      "coast",
      "desert",
      "volcanic",
      "dreamscape",
    ]);
  });

  it("marks the current zone from world.location.current", () => {
    const model = buildWorldAtlasModel(
      createState({
        world: {
          location: {
            current: "coast_tideward_pier",
            visited: [],
            unlockedAreas: [],
          },
        },
      }),
    );

    const currentZone = model.meridianZones.find((zone) => zone.id === "coast");
    expect(model.defaultHotspotId).toBe("zone:coast");
    expect(currentZone).toEqual(
      expect.objectContaining({
        isCurrent: true,
        status: "current",
      }),
    );
  });

  it("derives known and unseen zones from visited areas, unlocked areas, and chronicle discoveries", () => {
    const model = buildWorldAtlasModel(
      createState({
        world: {
          location: {
            current: "city_neon_bazaar",
            visited: ["wilds_rootbound_camp"],
            unlockedAreas: ["coast_tideward_pier"],
          },
        },
        chronicle: {
          discoveries: [{ id: "discovery_zone_desert", type: "zone", zoneId: "desert" }],
          entries: [],
          majorChoices: [],
        },
      }),
    );

    expect(model.meridianZones.find((zone) => zone.id === "wilds")?.status).toBe("known");
    expect(model.meridianZones.find((zone) => zone.id === "coast")?.status).toBe("known");
    expect(model.meridianZones.find((zone) => zone.id === "desert")?.status).toBe("known");
    expect(model.meridianZones.find((zone) => zone.id === "dreamscape")?.status).toBe(
      "unseen",
    );
  });

  it("marks Mnemonic Dreamscape as a detached Meridian hotspot", () => {
    const model = buildWorldAtlasModel(createState());
    const dreamscape = model.meridianZones.find((zone) => zone.id === "dreamscape");

    expect(dreamscape).toEqual(
      expect.objectContaining({
        detached: true,
        connectorFromZoneId: "desert",
      }),
    );
  });

  it("resolves zone detail cards with essence triads and notable locations", () => {
    const model = buildWorldAtlasModel(createState());
    const city = model.meridianZones.find((zone) => zone.id === "city");

    expect(city?.essenceTriad).toEqual(["air", "light", "creation"]);
    expect(city?.notableLocationNames).toEqual(["Neon Bazaar", "Sunspire Temple"]);
  });
});
