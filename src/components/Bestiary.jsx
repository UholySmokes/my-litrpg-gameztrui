import React, { useMemo, useState } from "react";
import { DataRegistry } from "../data/DataRegistry.js";
import { resolveDevourerFamilies, isDevourerCorePlayer } from "@voidverse/game-core/systems/archetype/devourerCore.js";

function getKnownItemIds(player = {}) {
  const inventoryIds = Array.isArray(player.inventory)
    ? player.inventory.map((item) => item?.id).filter(Boolean)
    : [];
  const equipmentIds = Object.values(player.equipment || {})
    .map((item) => item?.id)
    .filter(Boolean);
  return new Set([...inventoryIds, ...equipmentIds]);
}

export default function Bestiary({ player, gameState }) {
  const [activeTab, setActiveTab] = useState("enemies");

  const viewModel = useMemo(() => {
    const resolvedPlayer = player || gameState?.player || {};
    const killMap = resolvedPlayer.progress?.killsByEnemyId || {};
    const knownItemIds = getKnownItemIds(resolvedPlayer);
    const unlockedTitles = new Set(resolvedPlayer.unlockedTitles || []);
    const enemies = DataRegistry.getEnemies();
    const items = DataRegistry.getItemSummaries();
    const titles = DataRegistry.getTitles();

    const devourerRuntime = resolvedPlayer?.archetypeSystem?.runtime || {};
    const devourerKnownPrey = devourerRuntime?.knownPrey || {};
    const devourerAdaptations = devourerRuntime?.adaptations || {};
    const devourerActive = isDevourerCorePlayer(resolvedPlayer);

    return {
      enemies: enemies.map((enemy) => {
        const families = resolveDevourerFamilies(enemy);
        const knownFamilies = families.filter((family) => Number(devourerKnownPrey?.[family]?.digested || 0) > 0);
        const refinedFamilies = families.filter((family) => Number(devourerAdaptations?.[family]?.rank || 0) > 0);

        return {
          id: enemy.id,
          name: enemy.name,
          subtitle: `Lvl ${enemy.level} ${enemy.type || "enemy"}`,
          description: enemy.description,
          discovered: Number(killMap[enemy.id] || 0) > 0,
          progress: Number(killMap[enemy.id] || 0),
          devourerFamilies: families,
          devourerKnown: knownFamilies,
          devourerRefined: refinedFamilies,
        };
      }),
      items: items.map((item) => ({
        id: item.id,
        name: item.name || item.id,
        subtitle: item.rarity || item.type || "item",
        description: item.description || "No current discovery notes.",
        discovered: knownItemIds.has(item.id),
      })),
      titles: titles.map((title) => ({
        id: title.id,
        name: title.name,
        subtitle: title.unlockConditions?.killCount
          ? `Kill ${title.unlockConditions.killCount}`
          : title.unlockConditions?.level
            ? `Level ${title.unlockConditions.level}`
            : "Milestone",
        description: title.description,
        discovered: unlockedTitles.has(title.id),
      })),
      devourerActive,
    };
  }, [gameState?.player, player]);

  const tabs = [
    { id: "enemies", label: "Enemies", entries: viewModel.enemies },
    { id: "items", label: "Items", entries: viewModel.items },
    { id: "titles", label: "Titles", entries: viewModel.titles },
  ];
  const activeEntries = tabs.find((tab) => tab.id === activeTab)?.entries || [];
  const discoveredCount = activeEntries.filter((entry) => entry.discovered).length;

  return (
    <div className="holo-panel" style={{ padding: "1rem", height: "100%" }}>
      <div style={{ color: "var(--holo-cyan)", fontWeight: "bold", marginBottom: "0.75rem" }}>
        Collection Tracker
      </div>
      <div style={{ color: "var(--text-main)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
        Discovered {discoveredCount}/{activeEntries.length} in this category.
      </div>
      {viewModel.devourerActive ? (
        <div style={{ color: "var(--holo-gold)", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
          Devourer overlay active: harvest families and refinement status are shown for discovered enemies.
        </div>
      ) : null}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className="holo-button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              backgroundColor:
                activeTab === tab.id ? "rgba(0, 243, 255, 0.2)" : "transparent",
            }}
          >
            {tab.label} ({tab.entries.filter((entry) => entry.discovered).length}/{tab.entries.length})
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gap: "0.75rem", maxHeight: "420px", overflowY: "auto" }}>
        {activeEntries.map((entry) => (
          <div key={entry.id} className="holo-panel" style={{ padding: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
              <div>
                <div style={{ color: entry.discovered ? "var(--holo-cyan)" : "var(--text-dim)", fontWeight: "bold" }}>
                  {entry.discovered ? entry.name : "Unknown Entry"}
                </div>
                <div style={{ color: "var(--text-dim)", fontSize: "0.75rem", marginTop: "0.2rem" }}>
                  {entry.discovered ? entry.subtitle : "Undiscovered"}
                </div>
              </div>
              <div style={{ color: entry.discovered ? "var(--holo-gold)" : "var(--text-dim)", fontSize: "0.8rem" }}>
                {activeTab === "enemies"
                  ? `${entry.progress} defeat${entry.progress === 1 ? "" : "s"}`
                  : entry.discovered
                    ? "Logged"
                    : "Hidden"}
              </div>
            </div>
            <div style={{ color: "var(--text-main)", fontSize: "0.85rem", marginTop: "0.6rem" }}>
              {entry.discovered ? entry.description : "Discover this entry in play to reveal its details."}
            </div>
            {activeTab === "enemies" && entry.discovered ? (
              <div style={{ color: "var(--text-dim)", fontSize: "0.78rem", marginTop: "0.45rem" }}>
                Prey families: {entry.devourerFamilies?.join(", ") || "unknown"}
                {entry.devourerKnown?.length ? ` · known: ${entry.devourerKnown.join(", ")}` : ""}
                {entry.devourerRefined?.length ? ` · refined: ${entry.devourerRefined.join(", ")}` : ""}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}