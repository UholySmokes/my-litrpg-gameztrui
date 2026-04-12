function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function createInitialChronicleState() {
  return {
    entries: [],
    firsts: {},
    majorChoices: [],
    discoveries: [],
    factionMilestones: [],
  };
}

export function normalizeChronicleState(rawChronicle = null) {
  const chronicle = normalizeObject(rawChronicle);
  return {
    entries: normalizeArray(chronicle.entries),
    firsts: normalizeObject(chronicle.firsts),
    majorChoices: normalizeArray(chronicle.majorChoices),
    discoveries: normalizeArray(chronicle.discoveries),
    factionMilestones: normalizeArray(chronicle.factionMilestones),
  };
}
