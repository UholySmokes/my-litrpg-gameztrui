import React from "react";
import { xpForNextLevel } from "../utils/CombatMath.js";

const styles = {
  container: {
    width: "100%",
    height: "8px",
    background: "rgba(0, 0, 0, 0.6)",
    border: "1px solid rgba(255, 215, 0, 0.3)",
    borderRadius: "4px",
    overflow: "hidden",
    margin: "0.5rem 0",
    position: "relative",
  },
  bar: {
    height: "100%",
    background: "linear-gradient(90deg, #FFD700, #FFA500)",
    transition: "width 0.3s ease-out",
    boxShadow: "0 0 10px rgba(255, 215, 0, 0.5)",
  },
  text: {
    position: "absolute",
    top: "-20px",
    left: "0",
    right: "0",
    textAlign: "center",
    fontSize: "0.7rem",
    color: "#FFD700",
    fontFamily: "monospace",
    textShadow: "0 0 3px rgba(255, 215, 0, 0.5)",
  },
};

export default function ExperienceBar({ player }) {
  if (!player) {
    return (
      <div style={styles.container}>
        <div style={styles.text}>LV.1 - 0%</div>
        <div style={{ ...styles.bar, width: "0%" }} />
      </div>
    );
  }

  const currentXp = player.xp?.current || player.xp || 0;
  const level = player.level || 1;
  const xpForNext = xpForNextLevel(level);
  const percentage =
    xpForNext > 0 && Number.isFinite(currentXp)
      ? Math.min(100, (currentXp / xpForNext) * 100)
      : 0;

  return (
    <div style={styles.container}>
      <div style={styles.text}>
        LV.{level} - {Math.floor(percentage)}%
      </div>
      <div
        style={{
          ...styles.bar,
          width: `${percentage}%`,
        }}
      />
    </div>
  );
}
