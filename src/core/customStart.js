import {
  DEFAULT_START_LOCATION_ID,
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

function buildObservationVariant(groupLabel) {
  if (groupLabel) {
    return ensureSentence(`I fall in with ${groupLabel} and study how they move`);
  }
  return ensureSentence("I look around before I commit to a direction");
}

function buildInquiryVariant(groupLabel) {
  if (groupLabel) {
    return ensureSentence(`I join ${groupLabel} and ask who needs help first`);
  }
  return ensureSentence("I ask the nearest locals where the first real trouble is");
}

function buildCautiousVariant(groupLabel) {
  if (groupLabel) {
    return ensureSentence(`I keep close to ${groupLabel}, stay quiet, and wait for the first useful opening`);
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

export function inferStartingLocation(
  value,
  fallbackLocationId = DEFAULT_START_LOCATION_ID,
) {
  const locationId = resolveStartingLocationId(value, { fallbackLocationId });
  const location = locationId ? getLocationById(locationId) : null;
  const zone = location?.zoneId ? getZoneById(location.zoneId) : null;
  return {
    locationId: locationId || fallbackLocationId,
    location,
    zone,
  };
}

export function optimizeStartCommand(
  input,
  // eslint-disable-next-line no-unused-vars
  { fallbackLocationId = DEFAULT_START_LOCATION_ID } = {},
) {
  const trimmedInput = sanitizeStartCommand(input);
  if (!trimmedInput) {
    return {
      optimized: "",
      alternatives: [],
      inference: {
        locationId: null,
        location: null,
        zone: null,
      },
    };
  }

  const groupLabel = extractGroupReference(trimmedInput);
  const inference = {
    locationId: null,
    location: null,
    zone: null,
  };

  const optimized = ensureSentence(
    trimToSentence(buildPromptVariant(trimmedInput, "I take in the scene and choose my first move")),
  );
  const alternatives = dedupeVariants([
    buildObservationVariant(groupLabel),
    buildInquiryVariant(groupLabel),
    buildCautiousVariant(groupLabel),
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
