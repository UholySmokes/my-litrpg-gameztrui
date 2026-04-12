const FACTION_MILESTONE_THRESHOLDS = [10, 25, 50];

function normalizeChronicle(chronicle = {}) {
  return {
    entries: Array.isArray(chronicle?.entries) ? [...chronicle.entries] : [],
    firsts: chronicle?.firsts && typeof chronicle.firsts === "object" ? { ...chronicle.firsts } : {},
    majorChoices: Array.isArray(chronicle?.majorChoices) ? [...chronicle.majorChoices] : [],
    discoveries: Array.isArray(chronicle?.discoveries) ? [...chronicle.discoveries] : [],
    factionMilestones: Array.isArray(chronicle?.factionMilestones)
      ? [...chronicle.factionMilestones]
      : [],
  };
}

function hasChronicleEntry(entries = [], entryId) {
  return entries.some((entry) => entry?.id === entryId);
}

function appendEntry(chronicle, entry) {
  if (!entry?.id || hasChronicleEntry(chronicle.entries, entry.id)) {
    return false;
  }
  chronicle.entries.push({
    timestamp: Date.now(),
    ...entry,
  });
  return true;
}

function resolveQuestMeta(quest = {}) {
  if (quest?.meta && typeof quest.meta === "object") {
    return quest.meta;
  }
  return quest;
}

function resolveFactionContacts(state = {}, chronicle = {}) {
  const seeded = Array.isArray(chronicle.factionMilestones) ? chronicle.factionMilestones : [];
  if (seeded.length > 0) {
    return seeded
      .filter((entry) => entry?.factionId)
      .map((entry) => ({
        factionId: entry.factionId,
        label: entry.label || entry.factionId,
      }));
  }

  const factionReputation =
    state?.world?.factionReputation && typeof state.world.factionReputation === "object"
      ? state.world.factionReputation
      : {};

  return Object.entries(factionReputation)
    .filter(([, value]) => Number.isFinite(Number(value)) && Number(value) !== 0)
    .map(([factionId]) => ({
      factionId,
      label: factionId,
    }));
}

function ensureDiscovery(chronicle, discovery) {
  if (!discovery?.id) return false;
  if (chronicle.discoveries.some((entry) => entry?.id === discovery.id)) {
    return false;
  }
  chronicle.discoveries.push(discovery);
  return true;
}

function ensureMajorChoice(chronicle, choice) {
  if (!choice?.id) return false;
  if (chronicle.majorChoices.some((entry) => entry?.id === choice.id)) {
    return false;
  }
  chronicle.majorChoices.push(choice);
  return true;
}

function ensureFactionMilestone(chronicle, milestone) {
  if (!milestone?.id) return false;
  if (chronicle.factionMilestones.some((entry) => entry?.id === milestone.id)) {
    return false;
  }
  chronicle.factionMilestones.push(milestone);
  return true;
}

export function syncChronicleProgress(previousState = null, currentState = {}) {
  void previousState;

  const chronicle = normalizeChronicle(currentState?.chronicle);
  let changed = false;
  const locationId = currentState?.world?.location?.current || null;
  const zoneId =
    currentState?.world?.location?.biome ||
    currentState?.player?.oathOrigin?.zoneId ||
    currentState?.player?.startingZoneId ||
    null;
  const playerName = currentState?.player?.name || "The adventurer";

  const activeQuests = Array.isArray(currentState?.quests?.active) ? currentState.quests.active : [];
  if (!chronicle.firsts.questAccepted && activeQuests.length > 0) {
    const firstQuest = activeQuests[0];
    chronicle.firsts.questAccepted = Date.now();
    changed =
      appendEntry(chronicle, {
        id: `chronicle_first_quest_accepted_${firstQuest.id || "quest"}`,
        kind: "quest",
        title: "First Quest Accepted",
        body: firstQuest?.name || "A first directive has been accepted.",
        zoneId,
        locationId,
      }) || changed;
  }

  const completedQuests = Array.isArray(currentState?.quests?.completed)
    ? currentState.quests.completed
    : [];
  if (!chronicle.firsts.questCompleted && completedQuests.length > 0) {
    const firstCompleted = resolveQuestMeta(completedQuests[0]);
    chronicle.firsts.questCompleted = Date.now();
    changed =
      appendEntry(chronicle, {
        id: `chronicle_first_quest_completed_${firstCompleted.id || "quest"}`,
        kind: "quest",
        title: "First Quest Completed",
        body: firstCompleted?.name || firstCompleted?.id || "A first directive was completed.",
        zoneId,
        locationId,
      }) || changed;
  }

  if (!chronicle.firsts.combatWon && currentState?.combat?.status === "victory") {
    chronicle.firsts.combatWon = Date.now();
    changed =
      appendEntry(chronicle, {
        id: "chronicle_first_combat_won",
        kind: "combat",
        title: "First Combat Won",
        body: "The first live encounter ended in victory.",
        zoneId,
        locationId,
      }) || changed;
  }

  const factionContacts = resolveFactionContacts(currentState, chronicle);
  if (!chronicle.firsts.factionContact && factionContacts.length > 0) {
    const firstContact = factionContacts[0];
    chronicle.firsts.factionContact = Date.now();
    changed =
      appendEntry(chronicle, {
        id: `chronicle_first_faction_contact_${firstContact.factionId}`,
        kind: "social",
        title: "First Faction Contact",
        body: `First contact established with ${firstContact.label}.`,
        zoneId,
        locationId,
      }) || changed;
  }

  const openingChoiceId = currentState?.world?.vars?.openingSceneChoiceId || null;
  if (openingChoiceId && !chronicle.firsts.majorBranchChoice) {
    const label =
      currentState?.world?.vars?.openingSceneChoiceLabel ||
      currentState?.world?.vars?.openingSceneChoiceOutcome ||
      openingChoiceId;
    chronicle.firsts.majorBranchChoice = Date.now();
    changed =
      ensureMajorChoice(chronicle, {
        id: `chronicle_branch_${openingChoiceId}`,
        kind: "openingSceneChoice",
        label,
        zoneId,
        locationId,
      }) || changed;
    changed =
      appendEntry(chronicle, {
        id: `chronicle_major_choice_${openingChoiceId}`,
        kind: "choice",
        title: "Major Branch Choice",
        body: label,
        zoneId,
        locationId,
      }) || changed;
  }

  if (!chronicle.firsts.level2Reached && Number(currentState?.player?.level || 1) >= 2) {
    chronicle.firsts.level2Reached = Date.now();
    changed =
      appendEntry(chronicle, {
        id: "chronicle_level_2_reached",
        kind: "milestone",
        title: "Level 2 Reached",
        body: `${playerName} crossed the first earned milestone at Level 2.`,
        zoneId,
        locationId,
      }) || changed;
  }

  if (currentState?.player?.oathOrigin?.id && currentState?.player?.oathOrigin?.name) {
    changed =
      ensureDiscovery(chronicle, {
        id: `discovery_zone_${currentState.player.oathOrigin.id}`,
        label: currentState.player.oathOrigin.name,
        type: "zone",
        zoneId,
        locationId,
      }) || changed;
  }

  const factionReputation =
    currentState?.world?.factionReputation && typeof currentState.world.factionReputation === "object"
      ? currentState.world.factionReputation
      : {};

  Object.entries(factionReputation).forEach(([factionId, rawValue]) => {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return;
    FACTION_MILESTONE_THRESHOLDS.forEach((threshold) => {
      if (value < threshold) return;
      const milestoneId = `faction_milestone_${factionId}_${threshold}`;
      const wasPresent = chronicle.factionMilestones.some((entry) => entry?.id === milestoneId);
      changed =
        ensureFactionMilestone(chronicle, {
          id: milestoneId,
          factionId,
          label: factionId,
          status: `rep-${threshold}`,
          value,
        }) || changed;
      if (!wasPresent) {
        changed =
          appendEntry(chronicle, {
            id: `chronicle_${milestoneId}`,
            kind: "faction",
            title: "Faction Milestone",
            body: `${factionId} reputation reached ${threshold}.`,
            zoneId,
            locationId,
          }) || changed;
      }
    });
  });

  if (!changed) {
    return null;
  }

  return chronicle;
}
