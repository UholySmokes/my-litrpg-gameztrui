import HudVitals from "../../components/HudVitals.jsx";
import ExperienceBar from "../../components/ExperienceBar.jsx";
import ClassResourceBar from "../../components/ClassResourceBar.jsx";

export default function VitalsPanel({ player, config }) {
  return (
    <div>
      <HudVitals player={player} config={config} />
      <ExperienceBar player={player} />
      <ClassResourceBar player={player} />
    </div>
  );
}
