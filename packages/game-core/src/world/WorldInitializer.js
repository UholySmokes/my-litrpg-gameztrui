import { SimBridge } from "../simulation/bridge/SimulationContext.js";
import {
  DEFAULT_START_LOCATION_ID,
  WORLD_META,
  MAJOR_FACTION_IDS,
  getZoneById,
  getLocationById,
  getZoneEntryLocationId,
  resolveStartingLocationId,
} from "./WorldDataRegistry.js";

export const STARTING_LOCATION_ID = DEFAULT_START_LOCATION_ID;

function createDefaultWorldFlags() {
  return {
    leyline_storms_active: false,
    market_unrest_active: false,
    bloom_ignition_active: false,
    skydock_lockdown_active: false,
    veil_alert_active: false,
    tideward_breach_active: false,
    mirage_storm_active: false,
    caldera_vents_unstable: false,
    dream_wisps_active: false,
  };
}

function createDefaultFactionReputation() {
  const rep = {};
  MAJOR_FACTION_IDS.forEach((id) => {
    rep[id] = 0;
  });
  return rep;
}

function resolvePlayerArchetypeIds(player) {
  const classId =
    typeof player?.class === "string" ? player.class : player?.class?.id;
  const raceId =
    typeof player?.race === "string" ? player.race : player?.race?.id;
  const originId =
    typeof player?.origin === "string" ? player.origin : player?.origin?.id;
  const professionId =
    typeof player?.profession === "string"
      ? player.profession
      : player?.profession?.id;
  return {
    classId: classId || null,
    raceId: raceId || null,
    originId: originId || null,
    professionId: professionId || null,
  };
}

function pickStartLocationId({ locationId, zoneId } = {}) {
  if (typeof locationId === "string" && locationId.trim()) {
    return resolveStartingLocationId(locationId, {
      fallbackLocationId: STARTING_LOCATION_ID,
    });
  }

  if (typeof zoneId === "string" && zoneId.trim() && getZoneById(zoneId)) {
    return getZoneEntryLocationId(zoneId) || STARTING_LOCATION_ID;
  }

  return STARTING_LOCATION_ID;
}

export function createInitialWorldState({ seed } = {}) {
  const worldSeed = seed ?? SimBridge.now();

  return {
    id: WORLD_META.id,
    location: {
      current: STARTING_LOCATION_ID,
      visited: [STARTING_LOCATION_ID],
      unlockedAreas: [STARTING_LOCATION_ID],
      biome: getLocationById(STARTING_LOCATION_ID)?.zoneId || "city",
    },
    flags: createDefaultWorldFlags(),
    vars: {
      worldSeed,
      startingSceneId: null,
      current_quest_id: null,
      openingSceneChoicePending: false,
      openingSceneChoiceId: null,
      openingSceneChoiceLabel: null,
      openingSceneChoiceNext: null,
      openingSceneChoiceOutcome: null,
    },
    counters: {
      day: 1,
      chapter: 0,
      notoriety: 0,
    },
    factionReputation: createDefaultFactionReputation(),
    time: {
      currentTime: 480,
      timeOfDay: "day",
      isOutdoors: true,
      lastUpdate: SimBridge.now(),
    },
    turnCount: 0,
    weather: {
      byBiome: {
        [(getLocationById(STARTING_LOCATION_ID)?.zoneId || "city")]: {
          type: "clear",
          intensity: 0.3,
          updatedTurn: 0,
        },
      },
    },
  };
}

export function seedWorldAfterCharacterCreation(
  world,
  { player, quests, seed } = {},
) {
  const baseWorld =
    world && typeof world === "object" && !Array.isArray(world) ? world : {};

  const activeQuests = Array.isArray(quests?.active) ? quests.active : [];
  const mainQuest = activeQuests[0] || null;

  const resolvedSeed = seed ?? baseWorld?.vars?.worldSeed ?? SimBridge.now();

  resolvePlayerArchetypeIds(player);
  const playerLocationId = player?.startingLocationId || null;
  const playerZoneId = player?.startingZoneId || null;
  const questBiome = mainQuest?.tags?.biome;
  const zoneId = playerLocationId
    ? getLocationById(playerLocationId)?.zoneId || playerZoneId || null
    : (playerZoneId && getZoneById(playerZoneId))
      ? playerZoneId
      : getZoneById(questBiome)
        ? questBiome
        : "city";

  const startLocationId = pickStartLocationId({
    locationId: playerLocationId,
    zoneId,
  });

  const resolvedStartLoc = getLocationById(startLocationId);
  const startZoneId = resolvedStartLoc?.zoneId || zoneId;

  const nextFlags = createDefaultWorldFlags();
  // Toggle 1 relevant boolean based on starting biome.
  switch (startZoneId) {
    case "ruins":
      nextFlags.leyline_storms_active = true;
      break;
    case "city":
      if (mainQuest?.id === "mq_whisper_market") {
        nextFlags.market_unrest_active = true;
      }
      break;
    case "wilds":
      nextFlags.bloom_ignition_active = true;
      break;
    case "skydocks":
      nextFlags.skydock_lockdown_active = true;
      break;
    case "undercity":
      nextFlags.veil_alert_active = true;
      break;
    case "coast":
      nextFlags.tideward_breach_active = true;
      break;
    case "desert":
      nextFlags.mirage_storm_active = true;
      break;
    case "volcanic":
      nextFlags.caldera_vents_unstable = true;
      break;
    case "dreamscape":
      nextFlags.dream_wisps_active = true;
      break;
    default:
      break;
  }

  return {
    ...baseWorld,
    id: WORLD_META.id,
    location: {
      current: startLocationId,
      visited: [startLocationId],
      unlockedAreas: [startLocationId],
      biome: startZoneId,
    },
    flags: nextFlags,
    vars: {
      ...(baseWorld.vars || {}),
      worldSeed: resolvedSeed,
      startingSceneId: null,
      current_quest_id: mainQuest?.id || null,
      openingSceneChoicePending: false,
      openingSceneChoiceId: null,
      openingSceneChoiceLabel: null,
      openingSceneChoiceNext: null,
      openingSceneChoiceOutcome: null,
    },
    time: {
      currentTime: 480,
      timeOfDay: "day",
      isOutdoors: true,
      lastUpdate: SimBridge.now(),
    },
    weather: {
      byBiome: {
        [startZoneId]: {
          type: nextFlags.mirage_storm_active ? "storm" : "clear",
          intensity: nextFlags.mirage_storm_active ? 0.75 : 0.3,
          updatedTurn: 0,
        },
      },
    },
  };
}
