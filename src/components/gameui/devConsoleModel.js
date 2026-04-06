const MAX_LOG_ENTRIES = 380;

export const QUICK_COMMANDS = Object.freeze([
  { label: "Look Around", command: "look around", tone: "story" },
  { label: "Check Status", command: "check status", tone: "story" },
  { label: "Rest", command: "rest", tone: "story" },
  { label: "+100 XP", command: "/xp 100", tone: "state" },
  { label: "+250 Gold", command: "/gold 250", tone: "state" },
  { label: "Refill HP", command: "/hp 9999", tone: "state" },
  { label: "Refill Mana", command: "/mana 9999", tone: "state" },
  { label: "Level Up", command: "/levelup", tone: "state" },
  { label: "System Ping", command: "/system Developer console pulse injected.", tone: "meta" },
]);

export const COMMAND_HINTS = Object.freeze([
  "/story <text>",
  "/xp <amount>",
  "/gold <amount>",
  "/soulpoints <amount>",
  "/hp <delta>",
  "/mana <delta>",
  "/attr <amount>",
  "/levelup",
  "/teleport <locationId>",
  "/system <message>",
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
              biome: location.zoneId || locationState.biome || "city",
            },
          },
        };
      });
      addSystemMessage?.(`Dev console moved the run to ${location.name}.`, "system");
      return { ok: true, message: `Teleported to ${location.name}.` };
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