function normalizePerkId(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

export function getCreationPerkIds(player) {
  const perks = Array.isArray(player?.perks) ? player.perks : [];
  const ids = new Set();

  for (const entry of perks) {
    if (typeof entry === "string") {
      const id = normalizePerkId(entry);
      if (id) ids.add(id);
      continue;
    }
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      const id = normalizePerkId(entry.id);
      if (id) ids.add(id);
    }
  }

  return ids;
}

export function hasCreationPerk(player, perkId) {
  const id = normalizePerkId(perkId);
  if (!id) return false;
  return getCreationPerkIds(player).has(id);
}

