import { getItemData } from "../data/registries/ItemDataRegistry.js";
import {
  getLocationById,
  getZoneById,
  getZoneEntryLocationId,
} from "../world/WorldDataRegistry.js";
import {
  buildOpeningArcPayload,
  getOpeningArcById,
} from "../world/OpeningArcRegistry.js";
import {
  deriveOnboardingTierFromState,
  getOpeningTutorialContext,
  isOnboardingSurfaceUnlocked,
} from "../world/OpeningTutorialBundleRegistry.js";

const CASTER_CLASS_PATTERN = /mage|archmage|wizard|sorcer|warlock|necromancer|spell/i;
const SKIRMISH_CLASS_PATTERN = /rogue|ranger|assassin|shadow|hunter|scout/i;
const HEAVY_CLASS_PATTERN = /warrior|paladin|knight|guardian|berserker|monk|bastion/i;
const ARCANE_PROFESSION_PATTERN = /scribe|scholar|alchem|ritual|occult|mystic|channel|cartograph/i;
const MEDIC_PROFESSION_PATTERN = /medic|healer|chir|apothe|nurse|salve/i;
const FORGE_PROFESSION_PATTERN = /smith|miner|forge|armorer|metal/i;
const WAYFARER_PROFESSION_PATTERN = /guide|navigator|sail|deck|pilot|rider|path|survey/i;

function cloneItem(itemId, overrides = {}) {
  const base = getItemData(itemId) || { id: itemId, name: itemId, quantity: 1 };
  return {
    ...base,
    quantity: Number.isFinite(overrides.quantity) ? overrides.quantity : (base.quantity || 1),
    ...overrides,
  };
}

function resolveClassId(characterData = {}) {
  return typeof characterData?.class === "string"
    ? characterData.class
    : characterData?.class?.id || "";
}

function resolveClassName(characterData = {}) {
  return typeof characterData?.class === "string"
    ? characterData.class
    : characterData?.class?.name || "Initiate";
}

function resolveProfessionId(characterData = {}) {
  return typeof characterData?.profession === "string"
    ? characterData.profession
    : characterData?.profession?.id || "";
}

function resolveProfessionName(characterData = {}) {
  return typeof characterData?.profession === "string"
    ? characterData.profession
    : characterData?.profession?.name || "Wayfarer";
}

function resolveStarterWeapon(characterData = {}) {
  const classId = resolveClassId(characterData);
  const className = resolveClassName(characterData);

  if (CASTER_CLASS_PATTERN.test(classId)) {
    return cloneItem("wooden_sword", {
      name: `${className} Focus-Rod`,
      description: "A runed focus pressed into service as a starter weapon.",
    });
  }
  if (SKIRMISH_CLASS_PATTERN.test(classId)) {
    return cloneItem("wooden_sword", {
      name: `${className} Trail Knife`,
      description: "A light blade for fast openings and opportunistic strikes.",
    });
  }
  return cloneItem("rusty_sword", {
    name: `${className} Vanguard Blade`,
    description: "A dependable steel-poor blade issued for the first proving fights.",
  });
}

function resolveStarterArmor(characterData = {}) {
  const classId = resolveClassId(characterData);
  const className = resolveClassName(characterData);

  if (CASTER_CLASS_PATTERN.test(classId)) {
    return cloneItem("cloth_armor", {
      name: `${className} Channelweave`,
      description: "Light robes cut to keep movement and spellcasting fluid.",
    });
  }
  if (SKIRMISH_CLASS_PATTERN.test(classId)) {
    return cloneItem("leather_armor", {
      name: `${className} Scout Leathers`,
      description: "Quiet, flexible protection meant for fast repositioning.",
    });
  }
  if (HEAVY_CLASS_PATTERN.test(classId)) {
    return cloneItem("leather_armor", {
      name: `${className} Guard Harness`,
      description: "A reinforced harness built for the first hard exchange.",
    });
  }
  return cloneItem("cloth_armor", {
    name: `${className} Initiate Wrap`,
  });
}

function resolveSupportItem(characterData = {}) {
  const professionId = resolveProfessionId(characterData);
  const professionName = resolveProfessionName(characterData);

  if (MEDIC_PROFESSION_PATTERN.test(professionId)) {
    return cloneItem("bandage_roll", {
      quantity: 2,
      name: `${professionName} Field Wraps`,
    });
  }
  if (FORGE_PROFESSION_PATTERN.test(professionId)) {
    return cloneItem("iron_ore", {
      quantity: 2,
      name: `${professionName} Forge Stock`,
    });
  }
  if (ARCANE_PROFESSION_PATTERN.test(professionId)) {
    return cloneItem("magic_essence", {
      name: `${professionName} Catalyst Vial`,
    });
  }
  if (WAYFARER_PROFESSION_PATTERN.test(professionId)) {
    return cloneItem("waypoint_fragment", {
      name: `${professionName} Route Fragment`,
    });
  }
  return cloneItem("ration_pack", {
    name: `${professionName} Trail Rations`,
  });
}

function resolveConsumable(characterData = {}) {
  const classId = resolveClassId(characterData);
  if (CASTER_CLASS_PATTERN.test(classId)) {
    return cloneItem("mana_potion");
  }
  return cloneItem("minor_health_potion");
}

export function buildStarterKitPreview(characterData = {}) {
  const weapon = resolveStarterWeapon(characterData);
  const armor = resolveStarterArmor(characterData);
  const supportItem = resolveSupportItem(characterData);
  const consumable = resolveConsumable(characterData);
  const className = resolveClassName(characterData);
  const professionName = resolveProfessionName(characterData);

  return {
    starterKitId: `${String(resolveClassId(characterData) || "initiate").trim() || "initiate"}:${String(resolveProfessionId(characterData) || "wayfarer").trim() || "wayfarer"}`,
    starterKitLabel: `${className} / ${professionName} field kit`,
    weapon,
    armor,
    supportItem,
    consumable,
  };
}

export function resolveStartingPointPayload(startingPoint = null) {
  if (!startingPoint?.id) {
    return {
      oathOrigin: null,
      startingZoneId: null,
      startingLocationId: null,
      openingArcId: null,
      entrySceneId: null,
      tutorialBundleId: null,
    };
  }

  const openingArcPayload = buildOpeningArcPayload(startingPoint);

  return {
    oathOrigin: openingArcPayload.oathOrigin,
    startingZoneId: openingArcPayload.oathOrigin?.zoneId || startingPoint.id,
    startingLocationId:
      openingArcPayload.oathOrigin?.locationId ||
      getZoneEntryLocationId(startingPoint.id) ||
      null,
    openingArcId: openingArcPayload.openingArcId,
    entrySceneId: openingArcPayload.entrySceneId,
    tutorialBundleId: openingArcPayload.tutorialBundleId,
  };
}

export function describeStartingPointSelection(startingPoint = null) {
  const originPayload = resolveStartingPointPayload(startingPoint);
  const zone = originPayload.startingZoneId
    ? getZoneById(originPayload.startingZoneId)
    : null;
  const location = originPayload.startingLocationId
    ? getLocationById(originPayload.startingLocationId)
    : null;
  const openingArc = originPayload.openingArcId
    ? getOpeningArcById(originPayload.openingArcId)
    : null;

  return {
    ...originPayload,
    zoneName:
      startingPoint?.name || zone?.name || originPayload.oathOrigin?.name || null,
    locationName: location?.name || null,
    openingArc,
  };
}

export function mergeCreationOnboardingData(characterData = {}, startingPoint = null) {
  const starterKit = buildStarterKitPreview(characterData);
  const originPayload = resolveStartingPointPayload(startingPoint);

  return {
    ...characterData,
    ...originPayload,
    starterKitId: starterKit.starterKitId,
    starterKitLabel: starterKit.starterKitLabel,
    inventory: [starterKit.supportItem, starterKit.consumable],
    equipment: {
      weapon: starterKit.weapon,
      armor: starterKit.armor,
    },
    characterCreationBlueprint: {
      ...(characterData.characterCreationBlueprint || {}),
      startingLocationId: originPayload.startingLocationId,
      startingZoneId: originPayload.startingZoneId,
      oathOriginId: originPayload.oathOrigin?.id || null,
      openingArcId: originPayload.openingArcId,
      entrySceneId: originPayload.entrySceneId,
      tutorialBundleId: originPayload.tutorialBundleId,
    },
  };
}

export function deriveAdventureOnboardingTier({ state, player, quests } = {}) {
  const fallbackState = {
    ...(state || {}),
    player: player || state?.player,
    quests: quests || state?.quests,
  };
  const onboardingContext = getOpeningTutorialContext(fallbackState);
  const derivedTier = deriveOnboardingTierFromState(fallbackState);
  if (derivedTier > 1 || onboardingContext?.bundleId) {
    return derivedTier;
  }
  if ((state?.world?.turnCount || 0) > 0 || (player?.xp?.current || 0) > 0) {
    return 2;
  }
  return 1;
}

export function getAdventureOnboardingContext({ state, player, quests } = {}) {
  return getOpeningTutorialContext({
    ...(state || {}),
    player: player || state?.player,
    quests: quests || state?.quests,
  });
}

export function isAdventureSurfaceUnlocked(surfaceId, { state, player, quests } = {}) {
  return isOnboardingSurfaceUnlocked(
    {
      ...(state || {}),
      player: player || state?.player,
      quests: quests || state?.quests,
    },
    surfaceId,
  );
}
