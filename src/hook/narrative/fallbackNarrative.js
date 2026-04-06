import { getPlayerArchetypeSystemLabel } from "../../systems/archetype/resolvePlayerArchetypeSystem.js";

export function resolveArchetypeSystemLabel(player = {}) {
  return getPlayerArchetypeSystemLabel(player);
}

function resolveRaceLabel(player = {}) {
  return typeof player?.race === "string"
    ? player.race
    : player?.race?.name || "";
}

function pickVariant(options, seed) {
  if (!Array.isArray(options) || options.length === 0) return "";
  const safeSeed = Number.isFinite(seed) ? seed : Date.now();
  const index = Math.abs(Math.floor(safeSeed)) % options.length;
  return options[index];
}

function buildSystemNotice(systemLabel, seed) {
  if (systemLabel) {
    return pickVariant(
      [
        `[${systemLabel}: observation window active.]`,
        `[${systemLabel}: leverage point pending.]`,
        `[${systemLabel}: anomaly log updated.]`,
      ],
      seed,
    );
  }

  return pickVariant(
    [
      "[System Notice: ambient calibration incomplete.]",
      "[System Notice: no clean directive available.]",
      "[System Notice: passive scan continues.]",
    ],
    seed,
  );
}

function buildBodyAwarenessLine(raceLabel, seed) {
  if (!raceLabel || /^human$/i.test(raceLabel)) return "";
  const lowered = raceLabel.toLowerCase();
  return pickVariant(
    [
      `Your ${lowered} body answers a half-step before thought does.`,
      `Every small motion reminds you this ${lowered} body is not a habit yet.`,
      `Instinct keeps trying to take the lead inside your ${lowered} frame.`,
    ],
    seed,
  );
}

export function buildFallbackNarrative({
  userInput,
  actionResult,
  state,
  isInitial = false,
  variantSeed,
}) {
  const player = state?.player || {};
  const systemLabel = resolveArchetypeSystemLabel(player);
  const raceLabel = resolveRaceLabel(player);
  const location =
    state?.world?.location?.current ||
    state?.world?.location ||
    "the current zone";
  const name = player.name || "The wanderer";
  const classLabel =
    typeof player.class === "string"
      ? player.class
      : player.class?.name || "adventurer";

  if (isInitial) {
    const quests = Array.isArray(state?.quests?.active)
      ? state.quests.active
      : [];
    const questHint = quests.length
      ? `A new directive forms around "${quests[0].name}".`
      : "No directives surface yet, only the weight of possibility.";
    const bodyLine = buildBodyAwarenessLine(raceLabel, variantSeed);
    const reactionLine = pickVariant(
      [
        "The opening feels too sharp to ignore, as if even a small mistake would matter immediately.",
        "The moment lands with the bright, dangerous clarity of a first trial.",
        "Even the quiet here feels loaded, waiting to see what you do next.",
      ],
      variantSeed,
    );
    return [
      `${name}, a ${classLabel}, arrives at ${location}.`,
      bodyLine,
      buildSystemNotice(systemLabel, variantSeed),
      questHint,
      reactionLine,
    ]
      .filter(Boolean)
      .join(" ");
  }

  const trimmedInput = typeof userInput === "string" ? userInput.trim() : "";
  const fallbackAction =
    actionResult?.description ||
    (trimmedInput ? `You attempt to ${trimmedInput}` : "You take action");
  const lowerInput = trimmedInput.toLowerCase();
  const verbHints = [
    "explore",
    "look",
    "scan",
    "speak",
    "talk",
    "open",
    "review",
    "train",
    "rest",
    "attack",
    "use",
    "cast",
    "travel",
    "move",
    "search",
    "inspect",
    "read",
    "listen",
    "follow",
    "enter",
    "leave",
    "check",
  ];
  const startsWithVerb = verbHints.some(
    (verb) => lowerInput === verb || lowerInput.startsWith(`${verb} `),
  );
  let actionText = fallbackAction.replace(/^Player said:\s*/i, "You say: ");
  if (trimmedInput) {
    if (!startsWithVerb && !lowerInput.includes(" ")) {
      actionText = `You check ${trimmedInput}`;
    } else if (startsWithVerb) {
      actionText =
        variantSeed && variantSeed % 2 === 0
          ? `You attempt to ${trimmedInput}`
          : `You ${trimmedInput}`;
    } else {
      actionText = `You attempt to ${trimmedInput}`;
    }
  }

  const reasonText = actionResult?.reason || "something blocks the way";
  const successLine = actionResult?.success
    ? pickVariant(
        [
          `${actionText}. The moment answers at once, sharper and stranger than it has any right to be.`,
          `${actionText}. The scene tightens around the choice, as if even this small move matters more than it should.`,
          `${actionText}. For one taut breath, the world feels close enough to bite back.`,
          `${actionText}. The air changes first, and your nerves catch up a heartbeat later.`,
        ],
        variantSeed,
      )
    : pickVariant(
        [
          `${actionText}, but ${reasonText}. The failure lands harder than pride would prefer.`,
          `${actionText}. ${reasonText} blocks the attempt, leaving the moment raw and unfinished.`,
          `${actionText}, yet ${reasonText} keeps it out of reach and makes the next move feel urgent.`,
        ],
        variantSeed,
      );
  const reactionLine = pickVariant(
    [
      "Instinct, caution, and stubbornness all try to speak first.",
      "It is a small beat, but it feels like the kind that can tilt a whole run.",
      "The scene does not relax; it simply waits for your next mistake or breakthrough.",
    ],
    variantSeed,
  );

  return `${successLine} ${reactionLine} ${buildSystemNotice(systemLabel, variantSeed)}`;
}
