import React from "react";
import PaperDoll from "../PaperDoll.jsx";

const CORE_STATS = ["STR", "AGI", "DEX", "INT", "CHA", "WILL", "LUCK", "SOUL"];

export default function CharacterTab({
  player,
  onSelectEquipmentSlot,
  onOpenArchetypeSystem,
  onToggleTitleSystem,
  onToggleStatusOverlay,
}) {
  const attrs = player?.attributes || {};
  const className = player?.class?.name || player?.className || "—";
  const raceName = player?.race?.name || player?.raceName || "—";

  return (
    <div className="character-tab">
      {/* Paper Doll Equipment */}
      <PaperDoll player={player} onSelectSlot={onSelectEquipmentSlot} />

      {/* Core Stats */}
      <div className="character-tab__stats">
        {CORE_STATS.map((stat) => {
          const key = stat.toLowerCase();
          const val = attrs[key] ?? attrs[stat] ?? "—";
          return (
            <div key={stat} className="character-tab__stat">
              <span className="character-tab__stat-name">{stat}</span>
              <span className="character-tab__stat-value">{val}</span>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="character-tab__links">
        <button
          className="character-tab__link-btn"
          onClick={onToggleStatusOverlay}
        >
          <span>Full Status: {className} / {raceName}</span>
          <span className="character-tab__link-arrow">▶</span>
        </button>

        <button
          className="character-tab__link-btn"
          onClick={onOpenArchetypeSystem}
        >
          <span>Archetype System</span>
          <span className="character-tab__link-arrow">▶</span>
        </button>

        <button
          className="character-tab__link-btn"
          onClick={onToggleTitleSystem}
        >
          <span>Titles & Achievements</span>
          <span className="character-tab__link-arrow">▶</span>
        </button>
      </div>
    </div>
  );
}
