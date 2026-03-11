export function resolveArchetypeSystemLabel(player = {}) {
  const raw = player.archetypeSystem;
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw.name || raw.id || null;
  }
  return null;
}

function pickVariant(options, seed) {
  if (!Array.isArray(options) || options.length === 0) return "";
  const safeSeed = Number.isFinite(seed) ? seed : Date.now();
  const index = Math.abs(Math.floor(safeSeed)) % options.length;
  return options[index];
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
    const systemLine = systemLabel
      ? pickVariant(
          [
            `The ${systemLabel} hums softly, ready to shape your path.`,
            `The ${systemLabel} awakens, its protocols aligning to your steps.`,
            `The ${systemLabel} steadies, searching for its first leverage point.`,
          ],
          variantSeed,
        )
      : pickVariant(
          [
            "The world hums with latent system energy.",
            "A low-grade system pulse flickers through the air.",
            "Something unseen calibrates the world around you.",
          ],
          variantSeed,
        );
    return `${name}, a ${classLabel}, arrives at ${location}. ${systemLine} ${questHint}`;
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
          `${actionText}. The world shifts around you, then settles.`,
          `${actionText}. A faint current passes through the air.`,
          `${actionText}. The moment answers with a subtle change of tone.`,
          `${actionText}. Your intent echoes, then quiets.`,
        ],
        variantSeed,
      )
    : pickVariant(
        [
          `${actionText}, but ${reasonText}.`,
          `${actionText}. ${reasonText} blocks the attempt.`,
          `${actionText}, yet ${reasonText} keeps it out of reach.`,
        ],
        variantSeed,
      );
  const systemLine = systemLabel
    ? pickVariant(
        [
          `Your ${systemLabel} stirs, watching for leverage.`,
          `The ${systemLabel} records the moment, seeking an opening.`,
          `A muted pulse from the ${systemLabel} lingers at the edge of thought.`,
          `${systemLabel} remains attentive, mapping possible outcomes.`,
        ],
        variantSeed,
      )
    : pickVariant(
        [
          "The system remains watchful.",
          "A soft system ping fades into silence.",
          "No system directive follows-only the ambient hum.",
        ],
        variantSeed,
      );

  return `${successLine} ${systemLine}`;
}
