const BASE_CATALOG = [
  {
    id: "chronicle",
    title: "Chronicle Archive",
    subtitle: "Review the latest narration, summary, and emotional telemetry.",
    tone: "azure",
    entryAction: "Open archive",
    size: "xl",
    group: "primary",
  },
  {
    id: "command",
    title: "Command Dais",
    subtitle: "Issue parser-safe intent and route the next move through the lattice.",
    tone: "gold",
    entryAction: "Open dais",
    size: "xl",
    group: "primary",
  },
  {
    id: "battle",
    title: "Battle Theater",
    subtitle: "Project live combat lanes, enemy pressure, and tactical actions.",
    tone: "ember",
    entryAction: "Enter theater",
    size: "xl",
    group: "primary",
  },
  {
    id: "magic-study",
    title: "Magic Study",
    subtitle: "Study natural phenomena, runes, inscriptions, and spell build-up combinations.",
    tone: "violet",
    entryAction: "Enter study",
    size: "xl",
    group: "primary",
  },
  {
    id: "inventory",
    title: "Inventory Vault",
    subtitle: "Inspect carried inventory, rarities, and expedition stock.",
    tone: "verdigris",
    entryAction: "Open vault",
    size: "lg",
    group: "primary",
  },
  {
    id: "quests",
    title: "Quest Codex",
    subtitle: "Track active directives, objectives, and lead chains.",
    tone: "violet",
    entryAction: "Open codex",
    size: "lg",
    group: "primary",
  },
  {
    id: "loadout",
    title: "Loadout Forge",
    subtitle: "Bind equipment slots and refine the active build.",
    tone: "ember",
    entryAction: "Open forge",
    size: "lg",
    group: "primary",
  },
  {
    id: "status",
    title: "Status Scryglass",
    subtitle: "Read full attributes, systems, evolution lanes, and magical strain.",
    tone: "azure",
    entryAction: "Inspect status",
    size: "xl",
    group: "system",
  },
  {
    id: "bestiary",
    title: "Bestiary Conservatory",
    subtitle: "Catalog witnessed enemies, relic drops, and recorded discoveries.",
    tone: "verdigris",
    entryAction: "Open conservatory",
    size: "xl",
    group: "system",
  },
  {
    id: "system",
    title: "System Observatory",
    subtitle: "Inspect the active archetype system and its progression doctrine.",
    tone: "violet",
    entryAction: "Open observatory",
    size: "xl",
    group: "system",
  },
  {
    id: "titles",
    title: "Title Reliquary",
    subtitle: "Manage earned titles, ceremonial bonuses, and prestige loadouts.",
    tone: "gold",
    entryAction: "Open reliquary",
    size: "xl",
    group: "system",
  },
  {
    id: "craft",
    title: "Profession Workshop",
    subtitle: "Advance crafted output, recipes, and profession progression lanes.",
    tone: "ember",
    entryAction: "Open workshop",
    size: "xl",
    group: "system",
  },
  {
    id: "shop",
    title: "Shop Caravan",
    subtitle: "Trade for consumables, upgrades, and expedition support.",
    tone: "gold",
    entryAction: "Enter caravan",
    size: "xl",
    group: "system",
  },
  {
    id: "gacha",
    title: "Gacha Constellarium",
    subtitle: "Invoke the lattice for randomized pulls and relic acquisition.",
    tone: "violet",
    entryAction: "Open constellarium",
    size: "xl",
    group: "system",
  },
  {
    id: "save",
    title: "Save Vault",
    subtitle: "Preserve or restore the current chronicle thread.",
    tone: "azure",
    entryAction: "Open vault",
    size: "xl",
    group: "system",
  },
];

export function getAdventureRoomCatalog({
  isDevBuild = false,
  hasEquipmentSelect = false,
} = {}) {
  const catalog = [...BASE_CATALOG];

  if (isDevBuild) {
    catalog.push({
      id: "replay",
      title: "Replay Observatory",
      subtitle: "Developer diagnostics for replay and sync inspection.",
      tone: "void",
      entryAction: "Inspect replay",
      size: "xl",
      group: "system",
    });
  }

  if (hasEquipmentSelect) {
    catalog.push({
      id: "equipmentSelect",
      title: "Loadout Detail",
      subtitle: "Compare compatible items and commit a new slot binding.",
      tone: "ember",
      entryAction: "Inspect slot",
      size: "lg",
      group: "system",
    });
  }

  return catalog;
}
