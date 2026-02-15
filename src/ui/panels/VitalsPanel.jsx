import HudVitals from "../../components/HudVitals.jsx";
import ExperienceBar from "../../components/ExperienceBar.jsx";
import ClassResourceBar from "../../components/ClassResourceBar.jsx";

export default function VitalsPanel({ player, config, storyHint = "" }) {
  return (
    <div>
      <HudVitals player={player} config={config} />
      <ExperienceBar player={player} />
      <ClassResourceBar player={player} />
      {storyHint ? (
        <div style={{ marginTop: "0.6rem", color: "var(--text-dim)", fontSize: "0.78rem" }}>
          {storyHint}
        </div>
      ) : null}
    </div>
  );
}
