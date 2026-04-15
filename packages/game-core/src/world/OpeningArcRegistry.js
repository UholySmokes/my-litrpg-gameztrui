import { getZoneEntryLocationId, getZoneById, resolveZoneId } from "./WorldDataRegistry.js";

function createOpeningArc({
  zoneId,
  arcId,
  title,
  signatureNpc,
  firstPressure,
  landmarks,
  actionVocabulary,
  unlockReward,
  questId,
  questName,
  questDescription,
  questObjective,
  actionTypes,
  inputIncludes,
  factionId,
}) {
  return Object.freeze({
    id: arcId,
    oathOriginId: zoneId,
    title,
    tutorialBundleId: `pilot_${zoneId}`,
    entrySceneId: `entry_${zoneId}`,
    signatureNpc: Object.freeze(signatureNpc),
    firstPressure,
    landmarks: Object.freeze(landmarks),
    actionVocabulary: Object.freeze(actionVocabulary),
    unlockReward: Object.freeze(unlockReward),
    firstQuest: Object.freeze({
      id: questId,
      name: questName,
      description: questDescription,
      objectives: Object.freeze([
        Object.freeze({
          id: `${questId}_obj_1`,
          description: questObjective,
          criteria: Object.freeze({
            actionTypes: Object.freeze(actionTypes),
            inputIncludes: Object.freeze(inputIncludes),
          }),
          completed: false,
        }),
      ]),
      rewards: Object.freeze({
        xp: 40,
        items: Object.freeze([]),
      }),
      tags: Object.freeze({
        starter: true,
        openingArc: true,
        openingArcId: arcId,
        favoredBiomes: Object.freeze([zoneId]),
        favoredOrigins: Object.freeze([zoneId]),
        factionId,
        biome: zoneId,
      }),
    }),
  });
}

const PILOT_OPENING_ARCS = Object.freeze({
  auric_crown: createOpeningArc({
    zoneId: "auric_crown",
    arcId: "oa_auric_crown_choir_debt",
    title: "Choir Debt Pressure",
    signatureNpc: {
      name: "Cantor Elienne Voss",
      role: "Crown Exchange liturgy auditor",
      factionId: "aurum_exchange",
    },
    firstPressure:
      "A public blessing ledger already names you in a debt spiral you never signed.",
    landmarks: ["Crownwake Basilica", "Gilt Causeway", "Choir Archive Steps"],
    actionVocabulary: ["audit", "witness", "appeal", "observe", "confront"],
    unlockReward: {
      type: "writ",
      label: "Choir Writ of Passage",
    },
    questId: "oq_auric_crown_choir_debt",
    questName: "Audit the Choir Debt",
    questDescription:
      "A blessing ledger has tied your awakening to a public claim. Learn who entered your name and why the choir moved first.",
    questObjective: "Inspect the debt record, question the cantor, or trace the basilica witness line.",
    actionTypes: ["look", "dialogue", "study"],
    inputIncludes: ["ledger", "cantor", "debt", "basilica", "choir", "witness"],
    factionId: "aurum_exchange",
  }),
  glassstep_expanse: createOpeningArc({
    zoneId: "glassstep_expanse",
    arcId: "oa_glassstep_expanse_honest_storm",
    title: "Honest Storm Pressure",
    signatureNpc: {
      name: "Guide Sahri Namar",
      role: "Mirage route adjudicator",
      factionId: "mirage_guides",
    },
    firstPressure:
      "A stormglass front is erasing routes faster than the caravan court can certify them.",
    landmarks: ["Honest Oasis", "Oath Mirror Caravanserai", "Shatter Sea escarpment"],
    actionVocabulary: ["brace", "read", "negotiate", "endure", "track"],
    unlockReward: {
      type: "route",
      label: "Stormglass Bearing",
    },
    questId: "oq_glassstep_honest_storm",
    questName: "Read the Stormglass Front",
    questDescription:
      "The Expanse is deciding which truths survive the storm. Secure a usable route before the horizon lies outright.",
    questObjective: "Read the stormglass, question the route guide, or secure the first honest bearing.",
    actionTypes: ["look", "dialogue", "move"],
    inputIncludes: ["storm", "glass", "route", "oasis", "guide", "bearing"],
    factionId: "mirage_guides",
  }),
  skybound_marches: createOpeningArc({
    zoneId: "skybound_marches",
    arcId: "oa_skybound_marches_redline",
    title: "Redline Pressure",
    signatureNpc: {
      name: "Marshal Renn Vale",
      role: "Marchward rescue marshal",
      factionId: "skyforge_sentinels",
    },
    firstPressure:
      "A live altitude incident is still unfolding, and delay costs bodies, cables, or both.",
    landmarks: ["Redline Aerie", "Seven Dock Suns", "Cable March catwalk"],
    actionVocabulary: ["stabilize", "run", "guard", "signal", "cut"],
    unlockReward: {
      type: "drill",
      label: "Emergency Tether Drill",
    },
    questId: "oq_skybound_redline_response",
    questName: "Hold the Redline",
    questDescription:
      "The Marches are already mid-fall. Decide whether to rescue, secure, or expose what failed first.",
    questObjective: "Survey the line, take orders from the marshal, or move on the failing cable.",
    actionTypes: ["look", "move", "dialogue", "attack"],
    inputIncludes: ["marshal", "line", "cable", "gantry", "rescue", "tether"],
    factionId: "skyforge_sentinels",
  }),
  wildroot_basin: createOpeningArc({
    zoneId: "wildroot_basin",
    arcId: "oa_wildroot_basin_root_vote",
    title: "Root Vote Pressure",
    signatureNpc: {
      name: "Envoy Talar Myce",
      role: "Verdant parliament speaker",
      factionId: "verdant_envoys",
    },
    firstPressure:
      "A living assembly is about to vote on whether your arrival is guest-right, omen, or contagion.",
    landmarks: ["Seed Parliament", "Parliament Orchard", "Root-Drown levee"],
    actionVocabulary: ["listen", "appeal", "study", "cross", "mediate"],
    unlockReward: {
      type: "accord",
      label: "Parliament Mark",
    },
    questId: "oq_wildroot_root_vote",
    questName: "Survive the Root Vote",
    questDescription:
      "The Basin wants a decision on you before it offers shelter. Learn what the parliament fears and shift the vote.",
    questObjective: "Address the envoys, study the voting grove, or read the rootway omen.",
    actionTypes: ["dialogue", "look", "study"],
    inputIncludes: ["envoy", "vote", "orchard", "root", "parliament", "omen"],
    factionId: "verdant_envoys",
  }),
  frostveil_reach: createOpeningArc({
    zoneId: "frostveil_reach",
    arcId: "oa_frostveil_reach_white_silence",
    title: "White Silence Pressure",
    signatureNpc: {
      name: "Keeper Sol Hadrik",
      role: "Aurora Spine monastery keeper",
      factionId: "arcane_wardens",
    },
    firstPressure:
      "The cold is not the only thing testing you; the Reach wants proof you can hear what survives the silence.",
    landmarks: ["Hushdock", "Aurora Spine", "White Silence Shelf"],
    actionVocabulary: ["endure", "listen", "inspect", "advance", "answer"],
    unlockReward: {
      type: "insight",
      label: "Aurora Hearing",
    },
    questId: "oq_frostveil_white_silence",
    questName: "Cross the White Silence",
    questDescription:
      "Something moved across the shelf before your awakening. Reach the keeper and learn what survived the storm hush.",
    questObjective: "Inspect the shelf, listen for the monastery signal, or reach the keeper alive.",
    actionTypes: ["look", "move", "listen"],
    inputIncludes: ["aurora", "keeper", "shelf", "silence", "monastery", "signal"],
    factionId: "arcane_wardens",
  }),
  dawnreef_tangle: createOpeningArc({
    zoneId: "dawnreef_tangle",
    arcId: "oa_dawnreef_tangle_storm_omen",
    title: "Storm Omen Pressure",
    signatureNpc: {
      name: "Votary Sen Mareth",
      role: "Reef omen keeper",
      factionId: "tideward_order",
    },
    firstPressure:
      "The reef choir answered your arrival before the harbor wardens could decide whether to arrest it.",
    landmarks: ["Salt Sanctuary", "Choir Reef", "Maelstrom Steps"],
    actionVocabulary: ["listen", "ward", "question", "brace", "navigate"],
    unlockReward: {
      type: "blessing",
      label: "Tideward Omen Thread",
    },
    questId: "oq_dawnreef_storm_omen",
    questName: "Read the Reef Omen",
    questDescription:
      "The storm already knows your name. Decide whether the omen is warning, claim, or bait.",
    questObjective: "Inspect the shrine signs, question the votary, or sound the warded pier.",
    actionTypes: ["look", "dialogue", "magic_sense"],
    inputIncludes: ["omen", "reef", "ward", "tide", "mareth", "shrine"],
    factionId: "tideward_order",
  }),
  thunderplate_steppe: createOpeningArc({
    zoneId: "thunderplate_steppe",
    arcId: "oa_thunderplate_steppe_herd_turn",
    title: "Herd-Turn Pressure",
    signatureNpc: {
      name: "Caller Oden Khur",
      role: "Thunder herd pathcaster",
      factionId: "skyfisher_guild",
    },
    firstPressure:
      "The charged herd changed direction at your arrival, and the camp assumes that means you owe an explanation.",
    landmarks: ["Strikemere Relay", "Listening Herd corridor", "Boltglass Scar"],
    actionVocabulary: ["ride", "brace", "signal", "track", "challenge"],
    unlockReward: {
      type: "rite",
      label: "Stormcall Spur",
    },
    questId: "oq_thunderplate_herd_turn",
    questName: "Read the Herd Turn",
    questDescription:
      "The weather archive has shifted with the herd. Catch the meaning before the front tramples the relay line.",
    questObjective: "Question the caller, inspect the herd track, or move toward the relay breach.",
    actionTypes: ["dialogue", "look", "move", "attack"],
    inputIncludes: ["herd", "relay", "storm", "caller", "track", "spur"],
    factionId: "skyfisher_guild",
  }),
  emberline_archipelago: createOpeningArc({
    zoneId: "emberline_archipelago",
    arcId: "oa_emberline_archipelago_vent_alarm",
    title: "Vent Alarm Pressure",
    signatureNpc: {
      name: "Warden Ash Veyra",
      role: "Vent treaty sealkeeper",
      factionId: "smoke_wardens",
    },
    firstPressure:
      "The vent line is singing wrong, and harbor law says anyone still awake nearby becomes part of the response.",
    landmarks: ["Ashmouth Harbor", "Heartkiln Isles", "Vent Choir"],
    actionVocabulary: ["seal", "descend", "question", "contain", "evacuate"],
    unlockReward: {
      type: "seal",
      label: "Ventwarden Seal",
    },
    questId: "oq_emberline_vent_alarm",
    questName: "Seal the Singing Vent",
    questDescription:
      "An eruption ethic has failed. Reach the wardens and decide whether to stabilize the harbor or expose the bad treaty.",
    questObjective: "Inspect the vent alarm, question the warden, or move toward the unstable line.",
    actionTypes: ["look", "dialogue", "move", "attack"],
    inputIncludes: ["vent", "warden", "harbor", "seal", "alarm", "caldera"],
    factionId: "smoke_wardens",
  }),
  veilward_depths: createOpeningArc({
    zoneId: "veilward_depths",
    arcId: "oa_veilward_depths_memory_auction",
    title: "Memory Auction Pressure",
    signatureNpc: {
      name: "Broker Nacre Pell",
      role: "Ledger Veil recall broker",
      factionId: "veil_wardens",
    },
    firstPressure:
      "Your first coherent words have already been appraised as saleable memory.",
    landmarks: ["Recall Wharf", "Recall Wells", "Ledger Crypts"],
    actionVocabulary: ["bargain", "inspect", "remember", "hide", "pursue"],
    unlockReward: {
      type: "token",
      label: "Mnemonic Ledger Slip",
    },
    questId: "oq_veilward_memory_auction",
    questName: "Break the First Auction",
    questDescription:
      "Someone entered your awakening as a tradable asset. Find the broker who filed the sale before the market closes over it.",
    questObjective: "Inspect the auction boards, question the broker, or trace the stolen memory lot.",
    actionTypes: ["look", "dialogue", "study"],
    inputIncludes: ["memory", "broker", "ledger", "auction", "recall", "well"],
    factionId: "veil_wardens",
  }),
  hollowroot_deep: createOpeningArc({
    zoneId: "hollowroot_deep",
    arcId: "oa_hollowroot_deep_sink_alarm",
    title: "Sink Alarm Pressure",
    signatureNpc: {
      name: "Guide Myrr Hal",
      role: "Loam Spiral descent warden",
      factionId: "verdant_envoys",
    },
    firstPressure:
      "The descent bells are ringing because something answered from below before you did.",
    landmarks: ["Loam Spiral", "Underbloom Canopy", "Gullet of Saints"],
    actionVocabulary: ["descend", "listen", "stabilize", "survey", "survive"],
    unlockReward: {
      type: "line",
      label: "Spiral Descent Mark",
    },
    questId: "oq_hollowroot_sink_alarm",
    questName: "Answer the Sink Alarm",
    questDescription:
      "An expedition line is about to disappear into the Deep. Determine whether the call came from survivors, predators, or the roots themselves.",
    questObjective: "Inspect the descent line, question the guide, or move onto the spiral path.",
    actionTypes: ["look", "dialogue", "move"],
    inputIncludes: ["sink", "spiral", "guide", "descent", "bell", "deep"],
    factionId: "verdant_envoys",
  }),
  moonfen_coil: createOpeningArc({
    zoneId: "moonfen_coil",
    arcId: "oa_moonfen_coil_silver_sleep",
    title: "Silver Sleep Pressure",
    signatureNpc: {
      name: "Somnarch Velis",
      role: "Moonfen sleep magistrate",
      factionId: "mnemonic_alchemists",
    },
    firstPressure:
      "A whole marsh district is about to go under the same dream, and your arrival has become part of the diagnosis.",
    landmarks: ["Silver Sleep Fen", "Blackwater Choir", "Fen Alune watchposts"],
    actionVocabulary: ["wake", "distill", "question", "ward", "follow"],
    unlockReward: {
      type: "draft",
      label: "Somnarch Distillate",
    },
    questId: "oq_moonfen_silver_sleep",
    questName: "Interrupt the Silver Sleep",
    questDescription:
      "The fen is spreading one dream through too many throats. Learn who seeded it before the marsh turns communal.",
    questObjective: "Inspect the dreamwater, question the magistrate, or trace the sleep bloom.",
    actionTypes: ["look", "dialogue", "magic_sense"],
    inputIncludes: ["sleep", "dream", "fen", "somnarch", "choir", "bloom"],
    factionId: "mnemonic_alchemists",
  }),
  lucent_verge: createOpeningArc({
    zoneId: "lucent_verge",
    arcId: "oa_lucent_verge_open_eye",
    title: "Open-Eye Pressure",
    signatureNpc: {
      name: "Prioress Aev Lumen",
      role: "Open Eye pilgrimage adjudicator",
      factionId: "aurum_exchange",
    },
    firstPressure:
      "Clarity has struck too hard and turned a pilgrimage into a public emergency.",
    landmarks: ["Open Eye Steps", "Open Eye Range", "Dazzle Burn"],
    actionVocabulary: ["ascend", "witness", "judge", "stabilize", "refuse"],
    unlockReward: {
      type: "revelation",
      label: "Open-Eye Cipher",
    },
    questId: "oq_lucent_open_eye",
    questName: "Stabilize the Open Eye",
    questDescription:
      "Pilgrims are breaking under revelation and the Verge wants a ruling before enlightenment becomes a mass casualty event.",
    questObjective: "Inspect the lightstorm, question the prioress, or enter the first clarity line.",
    actionTypes: ["look", "dialogue", "study"],
    inputIncludes: ["open eye", "lightstorm", "prioress", "clarity", "pilgrim", "range"],
    factionId: "aurum_exchange",
  }),
});

export const LEGACY_OPENING_ARC_ID_MAP = Object.freeze({
  oa_meridian_arcology_contract_pressure: "oa_auric_crown_choir_debt",
  oa_tideward_coast_omen_pressure: "oa_dawnreef_tangle_storm_omen",
  oa_skyforge_skydocks_redline_pressure: "oa_skybound_marches_redline",
});

const OPENING_ARC_BY_ID = new Map(
  Object.values(PILOT_OPENING_ARCS).map((openingArc) => [openingArc.id, openingArc]),
);

function buildOathOrigin(startingPoint = null) {
  if (!startingPoint?.id) return null;
  const zoneId = resolveZoneId(startingPoint.id);
  if (!zoneId) return null;
  const zone = getZoneById(zoneId);
  return {
    id: zoneId,
    name: startingPoint.name || zone?.name || zoneId,
    zoneId,
    locationId: getZoneEntryLocationId(zoneId) || null,
    type: startingPoint.type || zone?.gameplayType || "exploration",
    summary: startingPoint.summary || zone?.summary || "",
  };
}

export function resolveOpeningArcId(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (OPENING_ARC_BY_ID.has(raw)) return raw;
  return LEGACY_OPENING_ARC_ID_MAP[raw] || null;
}

export function getPilotOpeningArcs() {
  return Object.values(PILOT_OPENING_ARCS);
}

export function getOpeningArcById(openingArcId) {
  const resolvedId = resolveOpeningArcId(openingArcId);
  return resolvedId ? OPENING_ARC_BY_ID.get(resolvedId) || null : null;
}

export function getOpeningArcByOathOriginId(oathOriginId) {
  const zoneId = resolveZoneId(oathOriginId);
  if (!zoneId) return null;
  return PILOT_OPENING_ARCS[zoneId] || null;
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
