import React from "react";
import InventoryPanel from "../../panels/InventoryPanel.jsx";

export default function InventoryTab({
  player,
  onSelectEquipmentSlot,
  onEquipItem,
  onUnequipItem,
}) {
  return (
    <div className="mobile-inventory-tab">
      <InventoryPanel
        player={player}
        onSelectSlot={onSelectEquipmentSlot}
        onEquipItem={onEquipItem}
        onUnequipItem={onUnequipItem}
      />
    </div>
  );
}
