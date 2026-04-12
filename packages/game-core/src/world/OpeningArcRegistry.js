import { getZoneEntryLocationId } from "./WorldDataRegistry.js";

const PILOT_OPENING_ARCS = Object.freeze({
  city: {
    id: "oa_meridian_arcology_contract_pressure",
    oathOriginId: "city",
    title: "Meridian Contract Pressure",
    tutorialBundleId: "pilot_meridian_arcology",
    entrySceneId: "entry_meridian_arcology",
    signatureNpc: {
      name: "Factor Ilyra Venn",
      role: "Aurum Exchange contract factor",
      factionId: "aurum_exchange",
    },
    firstPressure:
      "A contract board has already marked you as useful, indebted, or both.",
    landmarks: ["Ledger Stair", "Neon alcove", "Exchange kiosk"],
    actionVocabulary: ["audit", "talk", "observe", "confront", "buy"],
    unlockReward: {
      type: "contact",
      label: "Exchange Contact Mark",
    },
    firstQuest: {
      id: "oq_meridian_ledgers_on_the_ledge",
      name: "Ledgers on the Ledge",
      description:
        "Aurum clerks are already whispering about a missing shipment and a witness who vanished with it.",
      objectives: [
        {
          id: "oq_meridian_ledgers_on_the_ledge_obj_1",
          description: "Inspect the board, the kiosk, or the nearest witness trail.",
          criteria: {
            actionTypes: ["look", "dialogue", "move", "inventory"],
          },
          completed: false,
        },
      ],
      rewards: {
        xp: 35,
        items: [],
      },
      tags: {
        starter: true,
        openingArc: true,
        openingArcId: "oa_meridian_arcology_contract_pressure",
        favoredBiomes: ["city"],
        favoredOrigins: ["city"],
        factionId: "aurum_exchange",
        biome: "city",
      },
    },
  },
  coast: {
    id: "oa_tideward_coast_omen_pressure",
    oathOriginId: "coast",
    title: "Tideward Omen Pressure",
    tutorialBundleId: "pilot_tideward_coast",
    entrySceneId: "entry_tideward_coast",
    signatureNpc: {
      name: "Votary Sen Mareth",
      role: "Tideward shrine keeper",
      factionId: "tideward_order",
    },
    firstPressure:
      "A shrine omen has named you before anyone can decide whether that is blessing or threat.",
    landmarks: ["Stormglass shrine", "Ward-carved pylons", "Tideward pier"],
    actionVocabulary: ["listen", "meditate", "study", "talk", "investigate"],
    unlockReward: {
      type: "blessing",
      label: "Tideward Omen Thread",
    },
    firstQuest: {
      id: "oq_tideward_omens_in_the_spray",
      name: "Omens in the Spray",
      description:
        "The shrine bells answered your arrival, and now the Order wants to know why the tide spoke your name.",
      objectives: [
        {
          id: "oq_tideward_omens_in_the_spray_obj_1",
          description: "Inspect the shrine signs or speak with the Tideward Order.",
          criteria: {
            actionTypes: ["look", "dialogue", "study", "magic_sense"],
          },
          completed: false,
        },
      ],
      rewards: {
        xp: 35,
        items: [],
      },
      tags: {
        starter: true,
        openingArc: true,
        openingArcId: "oa_tideward_coast_omen_pressure",
        favoredBiomes: ["coast"],
        favoredOrigins: ["coast"],
        factionId: "tideward_order",
        biome: "coast",
      },
    },
  },
  skydocks: {
    id: "oa_skyforge_skydocks_redline_pressure",
    oathOriginId: "skydocks",
    title: "Skyforge Redline Pressure",
    tutorialBundleId: "pilot_skyforge_skydocks",
    entrySceneId: "entry_skyforge_skydocks",
    signatureNpc: {
      name: "Dockmarshal Renn Vale",
      role: "Skyforge emergency marshal",
      factionId: "skyforge_sentinels",
    },
    firstPressure:
      "A live skydock incident is still unfolding, and every second of hesitation costs altitude or blood.",
    landmarks: ["Open gantry", "Engine dais", "Emergency tether rack"],
    actionVocabulary: ["guard", "run", "fight", "kick", "fast"],
    unlockReward: {
      type: "technique",
      label: "Emergency Tether Drill",
    },
    firstQuest: {
      id: "oq_skyforge_hold_the_gantry",
      name: "Hold the Gantry",
      description:
        "A saboteur strike has left the dock unstable. Survive the first exchange and keep the line from collapsing.",
      objectives: [
        {
          id: "oq_skyforge_hold_the_gantry_obj_1",
          description: "Fight, reposition, or stabilize the gantry under pressure.",
          criteria: {
            actionTypes: ["attack", "move", "dialogue"],
          },
          completed: false,
        },
      ],
      rewards: {
        xp: 40,
        items: [],
      },
      tags: {
        starter: true,
        openingArc: true,
        openingArcId: "oa_skyforge_skydocks_redline_pressure",
        favoredBiomes: ["skydocks"],
        favoredOrigins: ["skydocks"],
        factionId: "skyforge_sentinels",
        biome: "skydocks",
      },
    },
  },
});

function buildOathOrigin(startingPoint = null) {
  if (!startingPoint?.id) return null;
  const zoneId = String(startingPoint.id || "").trim();
  if (!zoneId) return null;
  return {
    id: zoneId,
    name: startingPoint.name || zoneId,
    zoneId,
    locationId: getZoneEntryLocationId(zoneId) || null,
    type: startingPoint.type || "exploration",
    summary: startingPoint.summary || "",
  };
}

export function getPilotOpeningArcs() {
  return Object.values(PILOT_OPENING_ARCS);
}

export function getOpeningArcByOathOriginId(oathOriginId) {
  const key = String(oathOriginId || "").trim().toLowerCase();
  if (!key) return null;
  return PILOT_OPENING_ARCS[key] || null;
}

export function getOpeningArcForPlayer(player = {}) {
  const oathOriginId =
    typeof player?.oathOrigin === "string"
      ? player.oathOrigin
      : player?.oathOrigin?.id || player?.startingZoneId || null;
  return getOpeningArcByOathOriginId(oathOriginId);
}

export function buildOpeningArcPayload(startingPoint = null) {
  const oathOrigin = buildOathOrigin(startingPoint);
  const openingArc = oathOrigin?.id
    ? getOpeningArcByOathOriginId(oathOrigin.id)
    : null;

  return {
    oathOrigin,
    openingArcId: openingArc?.id || null,
    entrySceneId: openingArc?.entrySceneId || null,
    tutorialBundleId: openingArc?.tutorialBundleId || null,
  };
}
