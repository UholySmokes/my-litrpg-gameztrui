import React from "react";
import { getTitleById } from "../core/titleLogic.js";

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.5rem",
    margin: "1rem 0",
  },
  slot: {
    aspectRatio: "1",
    border: "2px solid rgba(0, 243, 255, 0.3)",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 0, 0, 0.4)",
    position: "relative",
    cursor: "pointer",
    transition: "all 0.2s ease",
    minHeight: "60px",
  },
  slotFilled: {
    borderColor: "rgba(255, 215, 0, 0.6)",
    background: "rgba(255, 215, 0, 0.1)",
    boxShadow: "0 0 10px rgba(255, 215, 0, 0.3)",
  },
  slotLabel: {
    position: "absolute",
    top: "2px",
    left: "4px",
    fontSize: "0.6rem",
    color: "rgba(0, 243, 255, 0.7)",
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  itemName: {
    fontSize: "0.8rem",
    color: "#FFD700",
    textAlign: "center",
    fontFamily: "monospace",
    textShadow: "0 0 3px rgba(255, 215, 0, 0.5)",
  },
  emptyText: {
    fontSize: "0.6rem",
    color: "rgba(0, 243, 255, 0.5)",
    fontFamily: "monospace",
    textAlign: "center",
    fontStyle: "italic",
  },
};

export default function EquipmentSlots({
  player,
  equipment: equipmentProp,
  onSelectSlot,
}) {
  const equipment = player?.equipment ?? equipmentProp ?? {};
  const equippedTitleId =
    typeof player?.equippedTitle === "string" ? player.equippedTitle : null;
  const equippedTitle = equippedTitleId ? getTitleById(equippedTitleId) : null;

  const slots = [
    { key: "weapon", label: "Weapon", item: equipment?.weapon },
    { key: "armor", label: "Armor", item: equipment?.armor },
    { key: "accessory", label: "Accessory", item: equipment?.accessory },
    {
      key: "title",
      label: "Title",
      item: equippedTitle
        ? {
            id: equippedTitle.id,
            name: equippedTitle.name,
            description: equippedTitle.description,
          }
        : player?.title
          ? {
              name: player.title,
              description:
                player.titleDescription || "Equipped honorific title",
            }
          : null,
    },
  ];

  return (
    <div style={styles.container}>
      {slots.map((slot) => (
        <div
          key={slot.key}
          style={{
            ...styles.slot,
            ...(slot.item ? styles.slotFilled : {}),
          }}
          onClick={() => onSelectSlot?.(slot.key)}
          role={onSelectSlot ? "button" : undefined}
          tabIndex={onSelectSlot ? 0 : undefined}
          onKeyDown={(event) => {
            if (!onSelectSlot) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelectSlot(slot.key);
            }
          }}
        >
          <div style={styles.slotLabel}>{slot.label}</div>
          {slot.item ? (
            <div style={{ textAlign: "center" }}>
              <div style={styles.itemName}>
                {slot.item.name || slot.item.id}
              </div>
              {slot.item.stats && (
                <div style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>
                  {Object.entries(slot.item.stats)
                    .slice(0, 2)
                    .map(([stat, value]) => `${stat}+${value}`)
                    .join(" · ")}
                </div>
              )}
            </div>
          ) : (
            <div style={styles.emptyText}>
              [EMPTY {slot.label.toUpperCase()}]
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
