import { SimBridge } from "../simulation/bridge/SimulationContext.js";
import {
  DEFAULT_START_LOCATION_ID,
  DEFAULT_START_ZONE_ID,
  WORLD_FLAG_DEFAULTS,
  WORLD_META,
  MAJOR_FACTION_IDS,
  getZoneById,
  getLocationById,
  getZoneEntryLocationId,
  resolveZoneId,
  resolveStartingLocationId,
} from "./WorldDataRegistry.js";

export const STARTING_LOCATION_ID = DEFAULT_START_LOCATION_ID;

function createDefaultWorldFlags() {
  return { ...WORLD_FLAG_DEFAULTS };
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

  const resolvedZoneId = resolveZoneId(zoneId);
  if (resolvedZoneId && getZoneById(resolvedZoneId)) {
    return getZoneEntryLocationId(resolvedZoneId) || STARTING_LOCATION_ID;
  }

  return STARTING_LOCATION_ID;
}

function getZoneSeedWeather(zoneId) {
  const zone = getZoneById(zoneId);
  const weather = zone?.seedWeather;
  const type =
    typeof weather?.type === "string" && weather.type.trim()
      ? weather.type.trim()
      : "clear";
  const intensity = Number.isFinite(weather?.intensity)
    ? Math.max(0, Math.min(1, weather.intensity))
    : 0.3;
  return { type, intensity };
}

export function createInitialWorldState({ seed } = {}) {
  const worldSeed = seed ?? SimBridge.now();
  const startZoneId = getLocationById(STARTING_LOCATION_ID)?.zoneId || DEFAULT_START_ZONE_ID;
  const startWeather = getZoneSeedWeather(startZoneId);

  return {
    id: WORLD_META.id,
    location: {
      current: STARTING_LOCATION_ID,
      visited: [STARTING_LOCATION_ID],
      unlockedAreas: [STARTING_LOCATION_ID],
      biome: startZoneId,
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
        [startZoneId]: {
          type: startWeather.type,
          intensity: startWeather.intensity,
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
  const playerZoneId = resolveZoneId(player?.startingZoneId) || null;
  const questBiome = resolveZoneId(mainQuest?.tags?.biome) || null;
  const zoneId = playerLocationId
    ? getLocationById(playerLocationId)?.zoneId || playerZoneId || null
    : (playerZoneId && getZoneById(playerZoneId))
      ? playerZoneId
      : getZoneById(questBiome)
        ? questBiome
        : DEFAULT_START_ZONE_ID;

  const startLocationId = pickStartLocationId({
    locationId: playerLocationId,
    zoneId,
  });

  const resolvedStartLoc = getLocationById(startLocationId);
  const startZoneId = resolvedStartLoc?.zoneId || zoneId || DEFAULT_START_ZONE_ID;

  const nextFlags = createDefaultWorldFlags();
  const startZone = getZoneById(startZoneId);
  if (startZone?.flagId) {
    nextFlags[startZone.flagId] = true;
  }
  const startWeather = getZoneSeedWeather(startZoneId);

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
          type: startWeather.type,
          intensity: startWeather.intensity,
          updatedTurn: 0,
        },
      },
    },
  };
}
