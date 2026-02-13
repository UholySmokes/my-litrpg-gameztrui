import { SimBridge } from "../simulation/bridge/SimulationContext.js";
import { pickOpeningScene } from "../data/OpeningScenes.js";
import { hashSeed, mulberry32 } from "../data/QuestCatalog.js";
import {
  WORLD_META,
  MAJOR_FACTION_IDS,
  getZoneById,
  getLocationById,
} from "./WorldDataRegistry.js";

export const STARTING_LOCATION_ID = "starting_zone";

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
  const professionId =
    typeof player?.profession === "string"
      ? player.profession
      : player?.profession?.id;
  return {
    classId: classId || null,
    raceId: raceId || null,
    professionId: professionId || null,
  };
}

function pickStartLocationId({ zoneId, seed, mainQuest } = {}) {
  const zone = getZoneById(zoneId);
  const candidates = Array.isArray(zone?.startLocationIds)
    ? zone.startLocationIds.filter((id) => typeof id === "string" && id.trim())
    : [];

  if (candidates.length === 0) {
    return STARTING_LOCATION_ID;
  }

  const baseSeed = hashSeed(seed ?? mainQuest?.id ?? zoneId ?? WORLD_META.id);
  const rng = mulberry32(baseSeed + 7);
  const index = Math.min(
    candidates.length - 1,
    Math.max(0, Math.floor(rng() * candidates.length)),
  );
  return candidates[index];
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

  const requestedBiome = mainQuest?.tags?.biome;
  const zoneId = getZoneById(requestedBiome) ? requestedBiome : "city";

  const resolvedSeed = seed ?? baseWorld?.vars?.worldSeed ?? SimBridge.now();

  const character = resolvePlayerArchetypeIds(player);
  const opening = pickOpeningScene({
    seed: resolvedSeed,
    mainQuest,
    character,
  });
  const startingSceneId = opening?.scene?.id || null;

  const startLocationId = pickStartLocationId({
    zoneId,
    seed: resolvedSeed,
    mainQuest,
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
      startingSceneId,
      current_quest_id: mainQuest?.id || null,
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
