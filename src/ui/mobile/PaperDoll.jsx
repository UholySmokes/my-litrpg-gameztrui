import React from "react";

const EQUIPMENT_SLOTS = [
  { id: "head", label: "Helm", row: 1, col: "left" },
  { id: "mainHand", label: "Weapon", row: 1, col: "right" },
  { id: "offHand", label: "Shield", row: 2, col: "left" },
  { id: "ring", label: "Ring", row: 2, col: "right" },
  { id: "body", label: "Armor", row: 3, col: "left" },
  { id: "hands", label: "Gloves", row: 3, col: "right" },
  // Bottom row items
  { id: "feet", label: "Boots", row: 4, col: "bottom" },
  { id: "neck", label: "Amulet", row: 4, col: "bottom" },
  { id: "back", label: "Cloak", row: 4, col: "bottom" },
];

export default function PaperDoll({ player, onSelectSlot }) {
  const equipped = player?.equipment || {};

  const leftSlots = EQUIPMENT_SLOTS.filter((s) => s.col === "left");
  const rightSlots = EQUIPMENT_SLOTS.filter((s) => s.col === "right");
  const bottomSlots = EQUIPMENT_SLOTS.filter((s) => s.col === "bottom");

  const renderSlot = (slot) => {
    const item = equipped[slot.id];
    const filled = !!item;
    return (
      <button
        key={slot.id}
        className={`paper-doll__slot${filled ? " paper-doll__slot--filled" : ""}`}
        onClick={() => onSelectSlot?.(slot.id)}
        title={item?.name || slot.label}
      >
        {item?.name ? truncate(item.name, 6) : slot.label}
      </button>
    );
  };

  return (
    <div className="paper-doll">
      {/* Left column */}
      {leftSlots.map((s) => (
        <div key={s.id} style={{ gridColumn: 1, gridRow: s.row }}>
          {renderSlot(s)}
        </div>
      ))}

      {/* Center silhouette */}
      <div className="paper-doll__silhouette">⚔</div>

      {/* Right column */}
      {rightSlots.map((s) => (
        <div key={s.id} style={{ gridColumn: 3, gridRow: s.row }}>
          {renderSlot(s)}
        </div>
      ))}

      {/* Bottom row */}
      <div className="paper-doll__bottom-row">
        {bottomSlots.map((s) => renderSlot(s))}
      </div>
    </div>
  );
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}
