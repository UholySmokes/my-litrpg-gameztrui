import EquipmentSlots from "../../components/EquipmentSlots.jsx";
import StatusEffects from "../../components/StatusEffects.jsx";

export default function EquipmentPanel({ player, onSelectSlot }) {
  return (
    <div>
      <EquipmentSlots player={player} onSelectSlot={onSelectSlot} />
      <StatusEffects player={player} />
    </div>
  );
}
