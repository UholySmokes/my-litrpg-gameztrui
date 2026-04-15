import { describe, expect, it } from "@jest/globals";
import { buildWorldAtlasModel } from "../../src/ui/panels/worldAtlasModel.js";

function createState(overrides = {}) {
  return {
    world: {
      location: {
        current: "auric_crown_gateway",
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
  it("returns the stable eighteen-landmass atlas with two major supercontinents", () => {
    const model = buildWorldAtlasModel(createState());

    expect(model.landmasses).toHaveLength(18);
    expect(model.landmasses.filter((landmass) => landmass.isMajor)).toHaveLength(2);
    expect(model.landmasses.map((landmass) => landmass.id)).toEqual([
      "sunvault_crown",
      "gravewell_mantle",
      "auric_crown",
      "skybound_marches",
      "glassstep_expanse",
      "emberline_archipelago",
      "veilward_depths",
      "wildroot_basin",
      "frostveil_reach",
      "dawnreef_tangle",
      "bloodwake_dominion",
      "thunderplate_steppe",
      "ossuary_vale",
      "hollowroot_deep",
      "riftscar_barrens",
      "moonfen_coil",
      "ironquake_shelf",
      "lucent_verge",
    ]);
  });

  it("marks the current landmass from world.location.current", () => {
    const model = buildWorldAtlasModel(
      createState({
        world: {
          location: {
            current: "dawnreef_tangle_gateway",
            visited: [],
            unlockedAreas: [],
          },
        },
      }),
    );

    const currentLandmass = model.landmasses.find((landmass) => landmass.id === "dawnreef_tangle");
    expect(model.defaultHotspotId).toBe("landmass:dawnreef_tangle");
    expect(currentLandmass).toEqual(
      expect.objectContaining({
        isCurrent: true,
        status: "current",
        currentLocationName: "Salt Sanctuary",
      }),
    );
  });

  it("derives known and unseen landmasses from visited areas, unlocked areas, and chronicle discoveries", () => {
    const model = buildWorldAtlasModel(
      createState({
        world: {
          location: {
            current: "auric_crown_gateway",
            visited: ["wildroot_basin_gateway"],
            unlockedAreas: ["glassstep_expanse_gateway"],
          },
        },
        chronicle: {
          discoveries: [{ id: "discovery_zone_moonfen_coil", type: "zone", zoneId: "moonfen_coil" }],
          entries: [],
          majorChoices: [],
        },
      }),
    );

    expect(model.landmasses.find((landmass) => landmass.id === "wildroot_basin")?.status).toBe("known");
    expect(model.landmasses.find((landmass) => landmass.id === "glassstep_expanse")?.status).toBe("known");
    expect(model.landmasses.find((landmass) => landmass.id === "moonfen_coil")?.status).toBe("known");
    expect(model.landmasses.find((landmass) => landmass.id === "ossuary_vale")?.status).toBe(
      "unseen",
    );
  });

  it("emphasizes the two major supercontinents", () => {
    const model = buildWorldAtlasModel(createState());

    const sunvault = model.landmasses.find((landmass) => landmass.id === "sunvault_crown");
    const gravewell = model.landmasses.find((landmass) => landmass.id === "gravewell_mantle");

    expect(sunvault).toEqual(expect.objectContaining({ isMajor: true, scale: "major" }));
    expect(gravewell).toEqual(expect.objectContaining({ isMajor: true, scale: "major" }));
  });

  it("resolves detail cards with climate bands, death zones, mystical places, and exemplar countries", () => {
    const model = buildWorldAtlasModel(createState());
    const auric = model.landmasses.find((landmass) => landmass.id === "auric_crown");

    expect(auric?.countryCount).toBe(94);
    expect(auric?.climateBands).toEqual([
      "temperate highland",
      "incense coast",
      "cold spire",
    ]);
    expect(auric?.deathZone).toEqual(
      expect.objectContaining({
        name: "Tithefall Chasm",
        kind: "ancient grave",
      }),
    );
    expect(auric?.mysticalPlace).toEqual(
      expect.objectContaining({
        name: "Crownwake Basilica",
        kind: "bloodline awakening site",
      }),
    );
    expect(auric?.exemplarCountries).toEqual([
      "Veyr Solenne",
      "Cantor Vale",
      "Oth Aureate",
    ]);
  });
});
