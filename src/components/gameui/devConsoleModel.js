import { DEFAULT_START_ZONE_ID } from "../../world/WorldDataRegistry.js";

const MAX_LOG_ENTRIES = 380;

export const QUICK_COMMANDS = Object.freeze([
  { label: "Look Around", command: "look around", tone: "story" },
  { label: "Check Status", command: "check status", tone: "story" },
  { label: "Rest", command: "rest", tone: "story" },
  { label: "Where Am I", command: "/where", tone: "meta" },
  { label: "+100 XP", command: "/xp 100", tone: "state" },
  { label: "+250 Gold", command: "/gold 250", tone: "state" },
  { label: "Heal + Mana", command: "/refill", tone: "state" },
  { label: "Level Up", command: "/levelup", tone: "state" },
  { label: "Clear Logs", command: "/clearlog", tone: "meta" },
  { label: "System Ping", command: "/system Developer console pulse injected.", tone: "meta" },
]);

export const COMMAND_HINTS = Object.freeze([
  "/help",
  "/story <text>",
  "/xp <amount>",
  "/gold <amount>",
  "/soulpoints <amount>",
  "/hp <delta>",
  "/mana <delta>",
  "/attr <amount>",
  "/levelup",
  "/teleport <locationId>",
  "/where",
  "/refill",
  "/heal",
  "/clearlog",
  "/setgold <amount>",
  "/setsp <amount>",
  "/system <message>",
]);

export const DEV_CONSOLE_COMMANDS = Object.freeze([
  {
    usage: "/help",
    description: "Show available slash commands.",
    example: "/help",
  },
  {
    usage: "/story <text>",
    description: "Send a story command through the normal parser pipeline.",
    example: "/story look around",
  },
  {
    usage: "<text>",
    description: "Same as /story, but without the slash prefix.",
    example: "look around",
  },
  {
    usage: "/xp <amount>",
    description: "Add XP (can be negative).",
    example: "/xp 100",
  },
  {
    usage: "/gold <amount>",
    description: "Adjust gold by delta (can be negative).",
    example: "/gold 250",
  },
  {
    usage: "/setgold <amount>",
    description: "Set gold to an absolute amount.",
    example: "/setgold 500",
  },
  {
    usage: "/soulpoints <amount>",
    description: "Adjust soulpoints by delta (can be negative). Alias: /sp.",
    example: "/soulpoints 5",
  },
  {
    usage: "/setsp <amount>",
    description: "Set soulpoints to an absolute amount.",
    example: "/setsp 10",
  },
  {
    usage: "/hp <delta>",
    description: "Adjust HP current by delta, clamped to [0, max].",
    example: "/hp 50",
  },
  {
    usage: "/mana <delta>",
    description: "Adjust mana current by delta, clamped to [0, max].",
    example: "/mana 50",
  },
  {
    usage: "/heal",
    description: "Set HP current to HP max.",
    example: "/heal",
  },
  {
    usage: "/refill",
    description: "Set HP and mana current to their max values.",
    example: "/refill",
  },
  {
    usage: "/attr <amount>",
    description: "Adjust free attribute points by delta.",
    example: "/attr 3",
  },
  {
    usage: "/levelup",
    description: "Request a single level-up via the engine reducer.",
    example: "/levelup",
  },
  {
    usage: "/teleport <locationId>",
    description: "Move the run to a known location id.",
    example: "/teleport coast_tideward_pier",
  },
  {
    usage: "/where",
    description: "Print the current location id and resolved name.",
    example: "/where",
  },
  {
    usage: "/clearlog",
    description: "Clear narrative, chat, and combat logs in memory.",
    example: "/clearlog",
  },
  {
    usage: "/system <message>",
    description: "Post a system message into the timeline.",
    example: "/system Developer console pulse injected.",
  },
]);

export function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function parseAmount(rawValue) {
  const trimmed = String(rawValue || "").trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
}

function uniqueStrings(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function clampGauge(current, max, delta) {
  const safeMax = Math.max(0, toNumber(max, 0));
  const safeCurrent = Math.max(0, toNumber(current, 0));
  return Math.max(0, Math.min(safeCurrent + delta, safeMax));
}

function buildTimelineEntry(entry, fallbackId, source) {
  if (!entry || typeof entry.text !== "string" || !entry.text.trim()) return null;
  return {
    id: entry.id || fallbackId,
    timestamp: toNumber(entry.timestamp, 0),
    channel: entry.type || source,
    source,
    text: entry.text.trim(),
  };
}

export function buildDevConsoleSessionLog(state) {
  const narrativeEntries = Array.isArray(state?.narrative?.entries)
    ? state.narrative.entries
    : [];
  const chatEntries = Array.isArray(state?.chatLog) ? state.chatLog : [];
  const combatEntries = Array.isArray(state?.combat?.log) ? state.combat.log : [];

  const combined = [
    ...narrativeEntries.map((entry, index) =>
      buildTimelineEntry(entry, `narrative-${index}`, "narrative"),
    ),
    ...chatEntries.map((entry, index) =>
      buildTimelineEntry(entry, `chat-${index}`, "chat"),
    ),
    ...combatEntries.map((entry, index) =>
      buildTimelineEntry(entry, `combat-${index}`, "combat"),
    ),
  ].filter(Boolean);

  const seen = new Set();
  const deduped = combined.filter((entry) => {
    const key = `${entry.timestamp}|${entry.channel}|${entry.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((left, right) => {
    if (left.timestamp !== right.timestamp) return left.timestamp - right.timestamp;
    return left.id.localeCompare(right.id);
  });

  return deduped.slice(-MAX_LOG_ENTRIES);
}

export async function executeDevConsoleCommand(rawCommand, tools) {
  const commandText = String(rawCommand || "").trim();
  if (!commandText) {
    return { ok: false, message: "Enter a story command or slash command." };
  }

  const {
    dispatch,
    setState,
    addSystemMessage,
    runStoryCommand,
    resolveLocationById,
    state,
  } = tools || {};

  const postUserCommand = async (text) => {
    addSystemMessage?.(`> ${text}`, "user");
    await runStoryCommand?.(text);
    return { ok: true, message: `Story command dispatched: ${text}` };
  };

  if (!commandText.startsWith("/")) {
    return postUserCommand(commandText);
  }

  const [rawAction, ...restParts] = commandText.slice(1).trim().split(/\s+/);
  const action = String(rawAction || "").toLowerCase();
  const argument = restParts.join(" ").trim();

  switch (action) {
    case "story":
      if (!argument) {
        return { ok: false, message: "Usage: /story <text>" };
      }
      return postUserCommand(argument);

    case "help":
      return { ok: true, message: `Commands: ${COMMAND_HINTS.join(" | ")}` };

    case "xp": {
      const amount = parseAmount(argument);
      if (amount === null) return { ok: false, message: "Usage: /xp <amount>" };
      dispatch?.({ type: "ADD_XP", payload: amount });
      return { ok: true, message: `Added ${amount} XP.` };
    }

    case "gold": {
      const amount = parseAmount(argument);
      if (amount === null) return { ok: false, message: "Usage: /gold <amount>" };
      setState?.((prevState) => {
        const player = prevState?.player || {};
        const currency = player.currency || {};
        const nextGold = Math.max(0, toNumber(currency.goldCoins ?? player.gold, 0) + amount);
        return {
          ...prevState,
          player: {
            ...player,
            gold: nextGold,
            currency: {
              ...currency,
              goldCoins: nextGold,
            },
          },
        };
      });
      return { ok: true, message: `Adjusted gold by ${amount}.` };
    }

    case "setgold": {
      const amount = parseAmount(argument);
      if (amount === null) return { ok: false, message: "Usage: /setgold <amount>" };
      setState?.((prevState) => {
        const player = prevState?.player || {};
        const currency = player.currency || {};
        const nextGold = Math.max(0, toNumber(amount, 0));
        return {
          ...prevState,
          player: {
            ...player,
            gold: nextGold,
            currency: {
              ...currency,
              goldCoins: nextGold,
            },
          },
        };
      });
      return { ok: true, message: `Set gold to ${amount}.` };
    }

    case "soulpoints":
    case "sp": {
      const amount = parseAmount(argument);
      if (amount === null) return { ok: false, message: "Usage: /soulpoints <amount>" };
      setState?.((prevState) => {
        const player = prevState?.player || {};
        const currency = player.currency || {};
        const nextSoulpoints = Math.max(
          0,
          toNumber(currency.soulpoints ?? player.soulpoints, 0) + amount,
        );
        return {
          ...prevState,
          player: {
            ...player,
            soulpoints: nextSoulpoints,
            currency: {
              ...currency,
              soulpoints: nextSoulpoints,
            },
          },
        };
      });
      return { ok: true, message: `Adjusted soulpoints by ${amount}.` };
    }

    case "setsp": {
      const amount = parseAmount(argument);
      if (amount === null) return { ok: false, message: "Usage: /setsp <amount>" };
      setState?.((prevState) => {
        const player = prevState?.player || {};
        const currency = player.currency || {};
        const nextSoulpoints = Math.max(0, toNumber(amount, 0));
        return {
          ...prevState,
          player: {
            ...player,
            soulpoints: nextSoulpoints,
            currency: {
              ...currency,
              soulpoints: nextSoulpoints,
            },
          },
        };
      });
      return { ok: true, message: `Set soulpoints to ${amount}.` };
    }

    case "hp":
    case "mana": {
      const amount = parseAmount(argument);
      if (amount === null) return { ok: false, message: `Usage: /${action} <delta>` };
      const gaugeKey = action === "hp" ? "hp" : "mana";
      setState?.((prevState) => {
        const player = prevState?.player || {};
        const gauge = player[gaugeKey] || { current: 0, max: 0 };
        return {
          ...prevState,
          player: {
            ...player,
            [gaugeKey]: {
              ...gauge,
              current: clampGauge(gauge.current, gauge.max, amount),
            },
          },
        };
      });
      return { ok: true, message: `Adjusted ${gaugeKey.toUpperCase()} by ${amount}.` };
    }

    case "heal": {
      setState?.((prevState) => {
        const player = prevState?.player || {};
        const hp = player.hp || { current: 0, max: 0 };
        return {
          ...prevState,
          player: {
            ...player,
            hp: {
              ...hp,
              current: toNumber(hp.max, 0),
            },
          },
        };
      });
      return { ok: true, message: "Healed to max HP." };
    }

    case "refill": {
      setState?.((prevState) => {
        const player = prevState?.player || {};
        const hp = player.hp || { current: 0, max: 0 };
        const mana = player.mana || { current: 0, max: 0 };
        return {
          ...prevState,
          player: {
            ...player,
            hp: {
              ...hp,
              current: toNumber(hp.max, 0),
            },
            mana: {
              ...mana,
              current: toNumber(mana.max, 0),
            },
          },
        };
      });
      return { ok: true, message: "Refilled HP and mana." };
    }

    case "attr":
    case "attributes": {
      const amount = parseAmount(argument);
      if (amount === null) return { ok: false, message: "Usage: /attr <amount>" };
      setState?.((prevState) => {
        const player = prevState?.player || {};
        const attributes = player.attributes || {};
        return {
          ...prevState,
          player: {
            ...player,
            attributes: {
              ...attributes,
              freePoints: Math.max(0, toNumber(attributes.freePoints, 0) + amount),
            },
          },
        };
      });
      return { ok: true, message: `Adjusted free attribute points by ${amount}.` };
    }

    case "level":
    case "levelup": {
      dispatch?.({ type: "LEVEL_UP", payload: { source: "dev-console" } });
      return { ok: true, message: "Requested one level-up." };
    }

    case "teleport": {
      if (!argument) return { ok: false, message: "Usage: /teleport <locationId>" };
      const location = resolveLocationById?.(argument) || null;
      if (!location) {
        return { ok: false, message: `Unknown location id: ${argument}` };
      }
      setState?.((prevState) => {
        const world = prevState?.world || {};
        const locationState = world.location || {};
        return {
          ...prevState,
          world: {
            ...world,
            location: {
              ...locationState,
              current: location.id,
              visited: uniqueStrings([...(locationState.visited || []), location.id]),
              unlockedAreas: uniqueStrings([
                ...(locationState.unlockedAreas || []),
                location.id,
              ]),
              biome: location.zoneId || locationState.biome || DEFAULT_START_ZONE_ID,
            },
          },
        };
      });
      addSystemMessage?.(`Dev console moved the run to ${location.name}.`, "system");
      return { ok: true, message: `Teleported to ${location.name}.` };
    }

    case "where": {
      const locationId =
        typeof state?.world?.location === "string"
          ? state.world.location
          : state?.world?.location?.current || state?.world?.location || null;
      const resolved = locationId ? resolveLocationById?.(locationId) : null;
      if (!locationId) {
        return { ok: true, message: "Location: unknown." };
      }
      return {
        ok: true,
        message: resolved
          ? `Location: ${resolved.id} (${resolved.name}).`
          : `Location: ${String(locationId)}.`,
      };
    }

    case "clearlog":
    case "clearlogs": {
      setState?.((prevState) => {
        const narrative = prevState?.narrative || {};
        const combat = prevState?.combat || {};
        return {
          ...prevState,
          narrative: {
            ...narrative,
            entries: [],
          },
          chatLog: [],
          combat: {
            ...combat,
            log: [],
          },
        };
      });
      addSystemMessage?.("Dev console cleared retained logs.", "system");
      return { ok: true, message: "Cleared narrative/chat/combat logs." };
    }

    case "system": {
      if (!argument) return { ok: false, message: "Usage: /system <message>" };
      addSystemMessage?.(argument, "system");
      return { ok: true, message: `System message posted: ${argument}` };
    }

    default:
      return {
        ok: false,
        message: `Unknown command: /${action}. Try /help for the available command set.`,
      };
  }
}
