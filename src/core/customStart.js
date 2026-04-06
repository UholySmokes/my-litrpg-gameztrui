import {
  getLocationById,
  getZoneById,
  resolveStartingLocationId,
} from "../world/WorldDataRegistry.js";

const MAX_START_COMMAND_LENGTH = 220;
const GENERIC_PREFIX_PATTERN =
  /^(?:i\s+)?(?:start|begin|open|arrive|wake|spawn)(?:\s+up)?\b[\s,:-]*/i;
const GROUP_REFERENCE_PATTERN =
  /\b((?:the\s+)?(?:rootbound\s+scouts?|caravan\s+hands?|rally\s+volunteers?|scouts?|caravan|guards?|pilgrims?|travelers?|workers?|hunters?|campers?|group|party))\b/i;

function collapseWhitespace(value) {
  return String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function trimToSentence(value, maxLength = MAX_START_COMMAND_LENGTH) {
  if (value.length <= maxLength) return value;
  const clipped = value.slice(0, maxLength).trim();
  const cutPoint = Math.max(
    clipped.lastIndexOf(". "),
    clipped.lastIndexOf(", "),
    clipped.lastIndexOf("; "),
  );
  if (cutPoint > 48) {
    return clipped.slice(0, cutPoint).trim();
  }
  return clipped;
}

function ensureSentence(value) {
  const trimmed = String(value || "").trim().replace(/[.?!]+$/g, "");
  return trimmed ? `${trimmed}.` : "";
}

function removeGenericPrefix(value) {
  return collapseWhitespace(String(value || "").replace(GENERIC_PREFIX_PATTERN, ""));
}

function extractGroupReference(value) {
  const match = collapseWhitespace(value).match(GROUP_REFERENCE_PATTERN);
  if (!match?.[1]) return "";
  const trimmed = match[1].trim().replace(/^the\s+/i, "");
  return trimmed ? `the ${trimmed.toLowerCase()}` : "";
}

function buildPromptVariant(value, fallback) {
  const trimmed = collapseWhitespace(value);
  if (!trimmed) return fallback;
  const noPrefix = removeGenericPrefix(trimmed);
  return ensureSentence(noPrefix || fallback);
}

function buildLocationAwareVariant(trimmedInput, locationName) {
  if (!locationName) {
    return buildPromptVariant(trimmedInput, "I steady myself and take in the scene");
  }
  const bare = removeGenericPrefix(trimmedInput);
  if (bare) {
    return ensureSentence(`At ${locationName}, ${bare.charAt(0).toLowerCase()}${bare.slice(1)}`);
  }
  return ensureSentence(`I arrive at ${locationName}, stay alert, and take in the scene`);
}

function buildObservationVariant(locationName, groupLabel) {
  if (groupLabel && locationName) {
    return ensureSentence(`At ${locationName}, I fall in with ${groupLabel} and study how they move`);
  }
  if (groupLabel) {
    return ensureSentence(`I fall in with ${groupLabel} and study how they move`);
  }
  if (locationName) {
    return ensureSentence(`At ${locationName}, I look around before I commit to a direction`);
  }
  return ensureSentence("I look around before I commit to a direction");
}

function buildInquiryVariant(locationName, groupLabel, zoneName) {
  const destination = zoneName || locationName || "the road ahead";
  if (groupLabel) {
    return ensureSentence(
      `I join ${groupLabel} and ask who can guide me safely toward ${destination}`,
    );
  }
  if (locationName) {
    return ensureSentence(`At ${locationName}, I ask the nearest locals what route is safest toward ${destination}`);
  }
  return ensureSentence(`I ask the nearest locals what route is safest toward ${destination}`);
}

function buildCautiousVariant(locationName, groupLabel) {
  if (groupLabel) {
    return ensureSentence(`I keep close to ${groupLabel}, stay quiet, and wait for the first useful opening`);
  }
  if (locationName) {
    return ensureSentence(`I stay low at ${locationName} and wait for the first useful opening`);
  }
  return ensureSentence("I stay quiet and wait for the first useful opening");
}

function dedupeVariants(values) {
  const seen = new Set();
  return values.filter((entry) => {
    const key = String(entry || "").trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function sanitizeStartCommand(value) {
  const collapsed = collapseWhitespace(value);
  return trimToSentence(collapsed);
}

export function inferStartingLocation(value, fallbackLocationId = "starting_zone") {
  const locationId = resolveStartingLocationId(value, { fallbackLocationId });
  const location = locationId ? getLocationById(locationId) : null;
  const zone = location?.zoneId ? getZoneById(location.zoneId) : null;
  return {
    locationId: locationId || fallbackLocationId,
    location,
    zone,
  };
}

export function optimizeStartCommand(input, { fallbackLocationId = "starting_zone" } = {}) {
  const trimmedInput = sanitizeStartCommand(input);
  if (!trimmedInput) {
    return {
      optimized: "",
      alternatives: [],
      inference: inferStartingLocation("", fallbackLocationId),
    };
  }

  const inference = inferStartingLocation(trimmedInput, fallbackLocationId);
  const locationName = inference.location?.name || "";
  const zoneName = inference.zone?.name || "";
  const groupLabel = extractGroupReference(trimmedInput);

  const optimized = ensureSentence(
    trimToSentence(buildLocationAwareVariant(trimmedInput, locationName)),
  );
  const alternatives = dedupeVariants([
    buildObservationVariant(locationName, groupLabel),
    buildInquiryVariant(locationName, groupLabel, zoneName),
    buildCautiousVariant(locationName, groupLabel),
    buildPromptVariant(trimmedInput, "I take in the scene and choose my first move"),
  ])
    .filter((entry) => entry.toLowerCase() !== optimized.toLowerCase())
    .slice(0, 3)
    .map((entry) => trimToSentence(entry));

  return {
    optimized,
    alternatives,
    inference,
  };
}
