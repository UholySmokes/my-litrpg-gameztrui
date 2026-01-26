import EquipmentSlots from "../../components/EquipmentSlots.jsx";
import StatusEffects from "../../components/StatusEffects.jsx";

export default function EquipmentPanel({ player }) {
  return (
    <div>
      <EquipmentSlots player={player} />
      <StatusEffects player={player} />
    </div>
  );
}
