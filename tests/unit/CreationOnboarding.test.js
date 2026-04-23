import { describe, expect, it } from "@jest/globals";
import {
  describeStartingPointSelection,
  mergeCreationOnboardingData,
  resolveStartingPointPayload,
} from "../../src/core/creationOnboarding.js";

describe("creation onboarding", () => {
  it("normalizes legacy landing aliases into canonical zone and location ids", () => {
    const payload = resolveStartingPointPayload({
      id: "coast",
      name: "Tideward Coast",
      type: "social",
      summary: "Legacy landing label.",
    });

    expect(payload.oathOrigin).toMatchObject({
      id: "dawnreef_tangle",
      zoneId: "dawnreef_tangle",
      locationId: "dawnreef_tangle_gateway",
    });
    expect(payload.startingZoneId).toBe("dawnreef_tangle");
    expect(payload.startingLocationId).toBe("dawnreef_tangle_gateway");
    expect(payload.openingArcId).toBe("oa_dawnreef_tangle_storm_omen");
  });

  it("describes the canonical first-scene destination for the selected landing", () => {
    const selection = describeStartingPointSelection({
      id: "auric_crown",
      name: "Meridian Arcology",
      type: "social",
      summary: "Contract pressure under a city of liturgy and debt.",
    });

    expect(selection.zoneName).toBe("Meridian Arcology");
    expect(selection.locationName).toBeTruthy();
    expect(selection.openingArc?.id).toBe("oa_auric_crown_choir_debt");
    expect(selection.openingArc?.firstQuest?.name).toBe("Audit the Choir Debt");
  });

  it("writes canonical landing ids into the finalized character payload", () => {
    const characterData = mergeCreationOnboardingData(
      {
        name: "Ari",
        class: { id: "paladin", name: "Paladin" },
        profession: { id: "blacksmith", name: "Blacksmith" },
        characterCreationBlueprint: {},
      },
      {
        id: "coast",
        name: "Tideward Coast",
        type: "social",
        summary: "Legacy landing label.",
      },
    );

    expect(characterData.startingZoneId).toBe("dawnreef_tangle");
    expect(characterData.startingLocationId).toBe("dawnreef_tangle_gateway");
    expect(characterData.oathOrigin).toMatchObject({
      id: "dawnreef_tangle",
      zoneId: "dawnreef_tangle",
    });
    expect(characterData.characterCreationBlueprint).toMatchObject({
      startingZoneId: "dawnreef_tangle",
      startingLocationId: "dawnreef_tangle_gateway",
      oathOriginId: "dawnreef_tangle",
    });
  });
});
