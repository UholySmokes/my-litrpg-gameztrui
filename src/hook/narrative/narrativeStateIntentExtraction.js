const POSITIVE_REPUTATION_PATTERN =
  /\b(?:reputation|standing)\b[^.]{0,80}\b(?:increase(?:d|s)?|improve(?:d|s)?|rise(?:s|n)?|grew)\b(?:[^\d]{0,16}(\d+))?/i;
const NEGATIVE_REPUTATION_PATTERN =
  /\b(?:reputation|standing)\b[^.]{0,80}\b(?:decrease(?:d|s)?|drop(?:ped|s)?|fall(?:s|en)?|worsen(?:ed|s)?)\b(?:[^\d]{0,16}(\d+))?/i;
const CLUE_QUOTED_PATTERN =
  /\b(?:discover(?:ed)?|uncover(?:ed)?|find|found|learn(?:ed)?)\b[^.]{0,90}\b(?:clue|lead|evidence)\b[^"\n]{0,24}"([^"]{3,64})"/i;
const CLUE_INLINE_PATTERN =
  /\b(?:clue|lead|evidence)\b\s*[:-]\s*([a-z0-9 _-]{3,64})/i;
const FLAG_PATTERN =
  /\bflag\b\s*[:-]?\s*([a-z0-9 _-]{2,64})\s*(?:is\s*)?(?:set|marked)?\s*(?:to\s*)?(true|false|on|off|active|inactive)/gi;

function toSlug(value, { prefix = "" } = {}) {
  const base = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  if (!base) return "";
  return prefix && !base.startsWith(prefix) ? `${prefix}${base}` : base;
}

function parseReputationDelta(text) {
  const positive = text.match(POSITIVE_REPUTATION_PATTERN);
  if (positive) {
    const amount = Math.max(1, Math.min(5, Number(positive[1]) || 1));
    return amount;
  }

  const negative = text.match(NEGATIVE_REPUTATION_PATTERN);
  if (negative) {
    const amount = Math.max(1, Math.min(5, Number(negative[1]) || 1));
    return -amount;
  }

  return 0;
}

function parseClueId(text) {
  const quoted = text.match(CLUE_QUOTED_PATTERN);
  if (quoted?.[1]) {
    return toSlug(quoted[1], { prefix: "clue_" });
  }

  const inline = text.match(CLUE_INLINE_PATTERN);
  if (inline?.[1]) {
    return toSlug(inline[1], { prefix: "clue_" });
  }

  return "";
}

function parseFlagIntents(text) {
  const intents = [];
  FLAG_PATTERN.lastIndex = 0;
  let match = FLAG_PATTERN.exec(text);
  while (match) {
    const flag = toSlug(match[1]);
    const rawValue = String(match[2] || "").toLowerCase();
    if (flag) {
      intents.push({
        type: "world.flag.set",
        flag,
        value: ["true", "on", "active"].includes(rawValue),
      });
    }
    match = FLAG_PATTERN.exec(text);
  }
  return intents;
}

export function deriveStateIntentsFromNarrative(narrative) {
  const text = typeof narrative === "string" ? narrative.trim() : "";
  if (!text) return [];

  const intents = [];
  const reputationDelta = parseReputationDelta(text);
  if (reputationDelta !== 0) {
    intents.push({ type: "player.reputation.delta", value: reputationDelta });
  }

  const clueId = parseClueId(text);
  if (clueId) {
    intents.push({ type: "clue.add", clueId });
  }

  intents.push(...parseFlagIntents(text));
  return intents;
}

